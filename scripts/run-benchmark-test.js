#!/usr/bin/env node
'use strict';

// Benchmark harness tests. No model calls: traces are synthetic and runs use fixtures.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { loadTasks, materializeTask, installReference, applyMutant, parseTap } = require('./lib/benchmark/tasks');
const { checkInit, isolatedEnv } = require('./lib/benchmark/isolation');
const { parseStream, summarizeInvocation, processMetrics } = require('./lib/benchmark/trace');
const { agentArgs, parseSimulatorReply, parseJudge, simulatorPrompt } = require('./lib/benchmark/agents');
const { scoreRun, compositeScore, decisionPoints } = require('./lib/benchmark/score');
const { bootstrapCI, diffCI, winTieLoss, shuffle, mean } = require('./lib/benchmark/stats');
const { buildSummary, renderMarkdown } = require('./lib/benchmark/report');
const { parseOptions } = require('./run-benchmark');

const WEIGHTS = { outcome: 0.45, testQuality: 0.2, process: 0.2, scope: 0.15 };

function stream(events) {
  return events.map(event => JSON.stringify(event)).join('\n');
}

function toolUse(id, name, input, parent = null) {
  return { type: 'assistant', parent_tool_use_id: parent, message: { content: [{ type: 'tool_use', id, name, input }] } };
}

function toolResult(id, content, isError = false) {
  return { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content, is_error: isError }] } };
}

const INIT = { type: 'system', subtype: 'init', session_id: 's1', plugins: [{ name: 'e6-agent-skills', path: '/tmp/arm' }, { name: 'cc-plugin-telemetry', path: 'builtin' }], skills: ['e6-agent-skills:using-e6-agent-skills'] };

test('summarizeInvocation extracts cost, usage, tool calls, results, and session', () => {
  const summary = summarizeInvocation(parseStream(stream([
    INIT,
    toolUse('t1', 'Bash', { command: 'node --test' }),
    toolResult('t1', '# tests 2\n# pass 1\n# fail 1', true),
    { type: 'assistant', message: { content: [{ type: 'text', text: 'Done.' }] } },
    { type: 'result', subtype: 'success', session_id: 's1', total_cost_usd: 0.42, num_turns: 3, duration_ms: 1200, result: 'Done.', usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 30 } },
  ]) + '\nnot json'));
  assert.equal(summary.sessionId, 's1');
  assert.equal(summary.costUsd, 0.42);
  assert.deepEqual(summary.usage, { input: 10, output: 20, cacheRead: 30, cacheCreate: 0 });
  assert.equal(summary.calls.length, 1);
  assert.equal(summary.calls[0].isError, true);
  assert.equal(summary.finalText, 'Done.');
  assert.equal(summary.isError, false);
});

test('processMetrics recognizes test-first, runtime check, review, skills, and subagents', () => {
  const summary = summarizeInvocation(parseStream(stream([
    toolUse('a', 'Skill', { skill: 'e6-agent-skills:e6-test-driven-development' }),
    toolUse('b', 'Write', { file_path: '/ws/server.test.js', content: 'x' }),
    toolUse('c', 'Bash', { command: 'node --test server.test.js' }),
    toolResult('c', 'not ok 1 - filters\n# fail 1', true),
    toolUse('d', 'Edit', { file_path: '/ws/server.js', old_string: 'a', new_string: 'b' }),
    toolUse('e', 'Bash', { command: 'node --test' }),
    toolResult('e', '# pass 3\n# fail 0'),
    toolUse('f', 'Bash', { command: 'PORT=0 node server.js & sleep 1; curl -s localhost:1/reports' }),
    toolUse('g', 'Agent', { description: 'Code review of the diff', prompt: 'review' }),
  ])));
  const metrics = processMetrics(summary.calls, { kind: 'feature', runtime: 'http' });
  assert.equal(metrics.redBeforeGreen, true);
  assert.equal(metrics.runtimeCheck, true);
  assert.equal(metrics.testedAfterLastEdit, true);
  assert.equal(metrics.reviewEvidence, true);
  assert.equal(metrics.subagents, 1);
  assert.deepEqual(metrics.skills, ['e6-agent-skills:e6-test-driven-development']);
});

test('processMetrics does not credit RED when code changes before any failing test', () => {
  const summary = summarizeInvocation(parseStream(stream([
    toolUse('a', 'Edit', { file_path: '/ws/money.js' }),
    toolUse('b', 'Write', { file_path: '/ws/money.test.js' }),
    toolUse('c', 'Bash', { command: 'node --test' }),
    toolResult('c', '# fail 0'),
  ])));
  const metrics = processMetrics(summary.calls, { kind: 'bugfix', runtime: 'library' });
  assert.equal(metrics.redBeforeGreen, false);
  assert.equal(metrics.runtimeCheck, null, 'runtime check is not applicable to library tasks');
  assert.equal(metrics.pushAttempted, false);
});

test('checkInit allows built-ins and rejects contamination or a missing arm plugin', () => {
  assert.equal(checkInit(INIT, ['e6-agent-skills']).ok, true);
  const contaminated = checkInit({ ...INIT, plugins: [...INIT.plugins, { name: 'engineering', path: '/root/.claude/plugins/synced/x' }] }, ['e6-agent-skills']);
  assert.equal(contaminated.ok, false);
  assert.deepEqual(contaminated.unexpected, ['engineering']);
  assert.equal(checkInit(INIT, ['superpowers']).ok, false);
  assert.equal(checkInit(null, []).ok, false);
});

test('isolatedEnv drops parent session variables and pins the config dir', () => {
  const env = isolatedEnv({ home: '/iso/home', configDir: '/iso/config' }, {
    PATH: '/bin', HTTPS_PROXY: 'http://proxy', CLAUDE_CODE_SESSION_ID: 'parent', CLAUDECODE: '1', ANTHROPIC_API_KEY: 'secret',
  });
  assert.equal(env.PATH, '/bin');
  assert.equal(env.HTTPS_PROXY, 'http://proxy');
  assert.equal(env.CLAUDE_CONFIG_DIR, '/iso/config');
  assert.equal(env.HOME, '/iso/home');
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'CLAUDECODE', 'ANTHROPIC_API_KEY']) assert.equal(env[key], undefined);
});

test('agentArgs pins model and effort, loads arm plugins, and resumes sessions', () => {
  const args = agentArgs({ model: 'm', effort: 'medium', pluginDirs: ['/arm'], resume: 's1', maxBudgetUsd: '2.00' });
  const after = flag => args[args.indexOf(flag) + 1];
  assert.equal(after('--model'), 'm');
  assert.equal(after('--effort'), 'medium');
  assert.equal(after('--plugin-dir'), '/arm');
  assert.equal(after('--resume'), 's1');
  assert.equal(after('--setting-sources'), 'project');
  assert.ok(args.includes('--strict-mcp-config'));
  assert.throws(() => agentArgs({}), /model is required/);
});

test('simulator replies parse strictly and fall back to a nudge', () => {
  assert.deepEqual(parseSimulatorReply('Sure. {"action":"reply","kind":"answer","message":"Use 5 attempts."}'), { action: 'reply', kind: 'answer', message: 'Use 5 attempts.', parsed: true });
  assert.equal(parseSimulatorReply('{"action":"done","kind":"done","message":""}').action, 'done');
  assert.deepEqual(parseSimulatorReply('no json'), { action: 'reply', kind: 'nudge', message: 'Please continue until the task is complete.', parsed: false });
  const prompt = simulatorPrompt({ request: 'R', answers: 'KEY', exchanges: [{ agent: 'q?', user: 'a' }], agentMessage: 'done', followupsUsed: 1, maxFollowups: 4 });
  assert.match(prompt, /KEY/);
  assert.match(prompt, /1 of 4/);
});

test('judge output must rate and rank every candidate', () => {
  const good = '{"ratings":{"A":{"correctness":5,"tests":4,"readability":4,"scope":5},"B":{"correctness":2,"tests":1,"readability":3,"scope":4}},"ranking":["A","B"],"notes":"x"}';
  assert.ok(parseJudge(good, ['A', 'B']));
  assert.equal(parseJudge(good, ['A', 'B', 'C']), null);
  assert.equal(parseJudge(good.replace('"correctness":5', '"correctness":9'), ['A', 'B']), null);
});

test('stats are seeded and reproducible', () => {
  const values = [0.2, 0.4, 0.6, 0.8, 1];
  assert.deepEqual(bootstrapCI(values, { seed: 7 }), bootstrapCI(values, { seed: 7 }));
  const ci = bootstrapCI(values, { seed: 7 });
  assert.equal(ci.mean, 0.6);
  assert.ok(ci.low < 0.6 && ci.high > 0.6);
  assert.ok(diffCI([1, 1, 1], [0, 0, 0]).low > 0.9);
  assert.deepEqual(winTieLoss([[1, 0], [0.5, 0.5], [0, 1], [0.7, 0.2]]), { win: 2, tie: 1, loss: 1 });
  assert.deepEqual(shuffle([1, 2, 3, 4], 3), shuffle([1, 2, 3, 4], 3));
  assert.ok(Number.isNaN(mean([])));
});

test('parseTap reads node:test totals', () => {
  assert.deepEqual(parseTap('# tests 9\n# pass 7\n# fail 2\n'), { tests: 9, pass: 7, fail: 2 });
});

test('compositeScore and decisionPoints', () => {
  assert.equal(compositeScore({ outcome: 1, testQuality: 0, process: 0.5, scope: 1 }, WEIGHTS), 0.45 + 0.1 + 0.15);
  assert.equal(decisionPoints('if (a && b) { x ? 1 : 2 } // if ignored'), 3);
});

test('scoreRun scores a reference solution with good tests as near-perfect', t => {
  const [task] = loadTasks(['bugfix-split-cents']);
  const { workspace, baselineSha } = materializeTask(task);
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  installReference(task, workspace);
  fs.writeFileSync(path.join(workspace, 'regression.test.js'), `'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { splitCents } = require('./money');
test('100/3', () => assert.deepEqual(splitCents(100, 3), [34, 33, 33]));
test('101/3', () => assert.deepEqual(splitCents(101, 3), [34, 34, 33]));
test('7/4', () => assert.deepEqual(splitCents(7, 4), [2, 2, 2, 1]));
for (const parts of [0, -1, 1.5]) test('invalid ' + parts, () => assert.throws(() => splitCents(5, parts), RangeError));
test('extra behavior beyond the reference', () => assert.equal(require('./money').extra, 1));
`);
  fs.appendFileSync(path.join(workspace, 'money.js'), 'module.exports.extra = 1;\n');
  const processInfo = { redBeforeGreen: true, runtimeCheck: null, testedAfterLastEdit: true, reviewEvidence: false, pushAttempted: false, subagents: 0 };
  const score = scoreRun({ task, workspace, baselineSha, processInfo, weights: WEIGHTS });
  assert.equal(score.delivery, 'working-tree');
  assert.equal(score.hidden.ok, true);
  assert.equal(score.regression.ok, true);
  assert.deepEqual(score.agentTests, ['regression.test.js']);
  assert.equal(score.mutation.valid, true);
  assert.equal(score.mutation.score, 1, `survivors: ${score.mutation.survived}`);
  assert.equal(score.mutation.validCases, 6, 'the extra-behavior test is ignored, not fatal');
  assert.match(score.mutation.reason, /1 agent test\(s\) fail on the reference/);
  assert.equal(score.dimensions.process, 2 / 3);
  assert.equal(score.scope.score, 1);
  assert.match(score.diff, /regression\.test\.js/);
});

test('scoreRun finds work committed on another branch and penalizes deleted tests', t => {
  const [task] = loadTasks(['bugfix-split-cents']);
  const { workspace, baselineSha } = materializeTask(task);
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const git = args => require('node:child_process').execFileSync('git', args, { cwd: workspace });
  git(['checkout', '--quiet', '-b', 'feature']);
  installReference(task, workspace);
  fs.rmSync(path.join(workspace, 'money.test.js'));
  git(['add', '--all']);
  git(['commit', '--quiet', '-m', 'fix']);
  git(['checkout', '--quiet', 'main']);
  const processInfo = { redBeforeGreen: false, runtimeCheck: null, testedAfterLastEdit: false, reviewEvidence: false, pushAttempted: false, subagents: 0 };
  const score = scoreRun({ task, workspace, baselineSha, processInfo, weights: WEIGHTS });
  assert.equal(score.delivery, 'branch');
  assert.equal(score.hidden.ok, true);
  assert.equal(score.regression.ok, false);
  assert.equal(score.scope.visibleWeakened, true);
  assert.equal(score.mutation.valid, false);
  assert.ok(score.dimensions.outcome <= 0.5);
});

test('mutants apply exactly once and reject ambiguous patches', t => {
  const [task] = loadTasks(['feature-status-filter']);
  const { workspace } = materializeTask(task);
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  installReference(task, workspace);
  applyMutant(workspace, task.mutants[0]);
  assert.match(fs.readFileSync(path.join(workspace, 'server.js'), 'utf8'), /report\.status !== status/);
  assert.throws(() => applyMutant(workspace, { name: 'x', file: 'server.js', find: 'res', replace: 'r' }), /exactly one match/);
});

test('summary and report render every arm without the model id by default', () => {
  const metadata = {
    runId: 'r1', startedAt: '2026-10-24T00:00:00Z', cliVersion: '2.1.310', model: 'secret-model-id', effort: 'medium', reps: 1, seed: 1,
    weights: WEIGHTS, arms: [{ id: 'baseline', label: 'Baseline', source: 'none', hash: 'none' }, { id: 'e6', label: 'e6', source: 'repo', hash: 'abc' }],
    tasks: [{ id: 't1' }],
  };
  const run = (arm, composite) => ({
    task: 't1', arm, rep: 1, status: 'scored', followups: [{ kind: 'answer' }], cost: { agentUsd: 1, simulatorUsd: 0.1 }, durationMs: 60000, numTurns: 5,
    usage: { output: 100 },
    score: { composite, hidden: { ok: composite > 0.5 }, dimensions: { outcome: composite, testQuality: 0.5, process: 0.5, scope: 1 }, process: { redBeforeGreen: true, runtimeCheck: null, testedAfterLastEdit: true, reviewEvidence: false, subagents: 0 } },
  });
  const summary = buildSummary({ metadata, runs: [run('baseline', 0.4), run('e6', 0.9), { task: 't1', arm: 'e6', rep: 2, status: 'contaminated', reason: 'engineering' }] });
  assert.equal(summary.counts.scored, 2);
  assert.equal(summary.excluded.length, 1);
  assert.equal(summary.pairs[0].winTieLoss.loss, 1);
  const markdown = renderMarkdown(summary, metadata);
  assert.ok(!markdown.includes('secret-model-id'));
  assert.match(markdown, /Overall scores/);
  assert.match(markdown, /Excluded runs/);
  assert.match(renderMarkdown(summary, metadata, { includeModel: true }), /secret-model-id/);
});

test('parseOptions handles flags, values, and positionals', () => {
  assert.deepEqual(parseOptions(['run', '--model', 'm', '--judge', '--reps', '3']), { _: ['run'], model: 'm', judge: true, reps: '3' });
  assert.throws(() => parseOptions(['run', '--model']), /Missing value/);
});
