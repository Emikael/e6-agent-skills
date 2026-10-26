#!/usr/bin/env node
/**
 * SDLC benchmark: run the same tasks under different skill packs (arms) with one pinned
 * model, answer pauses with a simulated user, and score the delivered code with hidden
 * acceptance tests, mutation testing of the agent's own tests, transcript-derived process
 * metrics, and an optional blind judge. See evals/benchmark/README.md.
 *
 *   node scripts/run-benchmark.js validate [--tasks a,b]
 *   node scripts/run-benchmark.js run --model <id> [--effort medium] [--arms a,b] [--tasks a,b]
 *        [--reps 1] [--concurrency 2] [--max-cost-usd 25] [--per-run-usd 5] [--judge]
 *        [--judge-model <id>] [--mode natural|invoked] [--out <dir>] [--seed <n>]
 *   node scripts/run-benchmark.js report <results-dir> [--publish <file.md>]
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { BENCH_DIR, loadTasks, validateTask, materializeTask } = require('./lib/benchmark/tasks');
const { createIsolation, checkInit } = require('./lib/benchmark/isolation');
const { agentArgs, textArgs, runCli, simulatorPrompt, parseSimulatorReply, judgePrompt, parseJudge } = require('./lib/benchmark/agents');
const { parseStream, summarizeInvocation, processMetrics, benchmarkAccess } = require('./lib/benchmark/trace');
const { scoreRun } = require('./lib/benchmark/score');
const { buildSummary, renderMarkdown } = require('./lib/benchmark/report');
const { shuffle } = require('./lib/benchmark/stats');

const REPO_ROOT = path.resolve(__dirname, '..');
const USAGE = 'Usage: node scripts/run-benchmark.js validate|run|report [options] (see the file header)';

function parseOptions(args) {
  const options = { _: [] };
  const flags = new Set(['--judge', '--include-model']);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (flags.has(arg)) options[arg.slice(2)] = true;
    else if (arg.startsWith('--')) {
      const value = args[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = value;
    } else options._.push(arg);
  }
  return options;
}

const list = value => (value ? String(value).split(',').map(item => item.trim()).filter(Boolean) : undefined);

function hashTree(root) {
  const hash = createHash('sha256');
  const walk = dir => {
    for (const name of fs.readdirSync(dir).sort()) {
      if (name === '.git' || name === 'node_modules') continue;
      const file = path.join(dir, name);
      const stat = fs.lstatSync(file);
      if (stat.isDirectory()) walk(file);
      else if (stat.isFile()) {
        hash.update(`${path.relative(root, file)}\n`);
        hash.update(fs.readFileSync(file));
      }
    }
  };
  walk(root);
  return hash.digest('hex');
}

function pluginName(dir) {
  for (const manifest of ['.claude-plugin/plugin.json', 'plugin.json']) {
    const file = path.join(dir, manifest);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')).name;
  }
  throw new Error(`No plugin manifest found in ${dir}`);
}

// Only what the plugin loads ships with a local arm. evals/benchmark holds hidden tests,
// reference solutions, and answer keys, and docs/ describes the tasks and their results.
const PLUGIN_PATHS = ['.claude-plugin', '.claude/commands', 'commands', 'skills', 'agents', 'hooks', 'references', 'evals/plugin'];

/** PLUGIN_PATHS present at commit; git archive rejects a pathspec that matches nothing. */
function pluginPaths(commit, cwd = REPO_ROOT) {
  return PLUGIN_PATHS.filter(entry => execFileSync('git', ['ls-tree', commit, '--', entry], { cwd, encoding: 'utf8' }).trim());
}

/** Materialize each arm's plugin into armsDir/<id>; returns arm descriptors. */
function prepareArms(armIds, armsDir) {
  const configs = JSON.parse(fs.readFileSync(path.join(BENCH_DIR, 'arms.json'), 'utf8'));
  const selected = armIds ? configs.filter(arm => armIds.includes(arm.id)) : configs;
  if (armIds && selected.length !== armIds.length) throw new Error(`Unknown arm in ${armIds.join(',')}`);
  return selected.map(arm => {
    const dir = path.join(armsDir, arm.id);
    const { source } = arm;
    if (source.type === 'none') return { ...arm, source: 'none', pluginDirs: [], expectedPlugins: [], hash: 'none' };
    fs.mkdirSync(dir, { recursive: true });
    let description;
    if (source.type === 'local') {
      const commit = execFileSync('git', ['rev-parse', source.ref || 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      const archive = execFileSync('git', ['archive', '--format=tar', commit, '--', ...pluginPaths(commit)], { cwd: REPO_ROOT, maxBuffer: 256 * 1024 * 1024 });
      execFileSync('tar', ['-x', '-C', dir], { input: archive });
      description = `this repository @ \`${commit.slice(0, 10)}\``;
    } else if (source.type === 'git') {
      execFileSync('git', ['clone', '--quiet', source.url, dir], { stdio: 'pipe' });
      execFileSync('git', ['checkout', '--quiet', source.commit], { cwd: dir });
      fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
      description = `${source.url.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')} @ \`${source.commit.slice(0, 10)}\``;
    } else {
      throw new Error(`Unknown arm source type ${source.type}`);
    }
    return { ...arm, source: description, pluginDirs: [dir], expectedPlugins: [pluginName(dir)], hash: hashTree(dir) };
  });
}

function sumUsage(a, b) {
  return { input: a.input + b.input, output: a.output + b.output, cacheRead: a.cacheRead + b.cacheRead, cacheCreate: a.cacheCreate + b.cacheCreate };
}

async function runOne({ task, arm, rep, options, weights, scoring, runDir, budget }) {
  fs.mkdirSync(runDir, { recursive: true });
  const record = {
    task: task.id, arm: arm.id, rep, status: 'running', followups: [], cost: { agentUsd: 0, simulatorUsd: 0 },
    usage: { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 }, numTurns: 0, durationMs: 0, invocations: 0,
  };
  const started = Date.now();
  const calls = [];
  const exchanges = [];
  let workspace = null;
  let isolation = null;
  let simulatorCwd = null;
  try {
    let baselineSha;
    ({ workspace, baselineSha } = materializeTask(task));
    isolation = createIsolation();
    simulatorCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-bench-sim-'));
    let sessionId = null;
    let input = options.mode === 'invoked' && arm.invoke_prefix ? `${arm.invoke_prefix}\n\n${task.config.prompt}` : task.config.prompt;
    const maxFollowups = task.config.max_followups ?? scoring.maxFollowups;
    for (let turn = 0; ; turn++) {
      const remaining = Math.min(
        options.perRunUsd - record.cost.agentUsd - record.cost.simulatorUsd,
        options.maxCostUsd - budget.spent,
      );
      if (remaining <= 0.01) { record.reason = 'cost budget reached'; break; }
      const result = await runCli({
        args: agentArgs({ model: options.model, effort: options.effort, pluginDirs: arm.pluginDirs, resume: sessionId, maxBudgetUsd: remaining.toFixed(2) }),
        input, cwd: workspace, isolation,
        tracePath: path.join(runDir, `agent-${turn}.jsonl`),
        timeoutMs: scoring.invocationTimeoutMinutes * 60000,
      });
      const summary = summarizeInvocation(parseStream(result.stdout));
      record.invocations++;
      record.cost.agentUsd += summary.costUsd;
      budget.spent += summary.costUsd;
      record.usage = sumUsage(record.usage, summary.usage);
      record.numTurns += summary.numTurns;
      record.durationMs += summary.durationMs;
      for (const call of summary.calls) calls.push({ ...call, index: calls.length });
      if (turn === 0) {
        record.isolation = checkInit(summary.init, arm.expectedPlugins);
        if (!record.isolation.ok) {
          record.status = 'contaminated';
          record.reason = record.isolation.reason;
          return record;
        }
      }
      sessionId = summary.sessionId || sessionId;
      if (result.timedOut || result.code !== 0 || summary.isError) {
        record.agentError = result.timedOut ? 'timeout' : `exit ${result.code}${summary.stopReason ? ` (${summary.stopReason})` : ''}`;
        fs.writeFileSync(path.join(runDir, `agent-${turn}.stderr.txt`), result.stderr || '');
        if (!sessionId || result.timedOut) break;
      }
      if (record.followups.length >= maxFollowups) { record.reason = 'follow-up limit reached'; break; }
      if (Date.now() - started > scoring.runTimeoutMinutes * 60000) { record.reason = 'run time limit reached'; break; }
      const simulation = await runCli({
        args: textArgs({ model: options.model, effort: options.effort }),
        input: simulatorPrompt({ request: task.request, answers: task.answers, exchanges, agentMessage: summary.finalText || '(no message)', followupsUsed: record.followups.length, maxFollowups }),
        cwd: simulatorCwd, isolation,
        tracePath: path.join(runDir, `user-${turn}.jsonl`),
        timeoutMs: 5 * 60000,
      });
      const simSummary = summarizeInvocation(parseStream(simulation.stdout));
      record.cost.simulatorUsd += simSummary.costUsd;
      budget.spent += simSummary.costUsd;
      const reply = parseSimulatorReply(simSummary.finalText);
      if (reply.action === 'done') break;
      record.followups.push({ turn, kind: reply.kind, message: reply.message, parsed: reply.parsed });
      exchanges.push({ agent: summary.finalText, user: reply.message });
      input = reply.message;
    }
    const leaks = benchmarkAccess(calls);
    if (leaks.length) {
      record.status = 'contaminated';
      record.reason = `agent touched benchmark files: ${leaks.slice(0, 3).join('; ')}`;
      return record;
    }
    record.processInfo = processMetrics(calls, task.config);
    const score = scoreRun({ task, workspace, baselineSha, processInfo: record.processInfo, weights });
    fs.writeFileSync(path.join(runDir, 'diff.patch'), score.diff);
    delete score.diff;
    record.score = score;
    record.status = record.agentError ? 'agent-error' : 'scored';
    return record;
  } catch (error) {
    record.status = 'harness-error';
    record.reason = error.stack || String(error);
    return record;
  } finally {
    record.wallMs = Date.now() - started;
    fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(record, null, 2)}\n`);
    if (workspace) cleanupWorkspace(workspace);
    if (simulatorCwd) fs.rmSync(simulatorCwd, { recursive: true, force: true });
    if (isolation) isolation.cleanup();
  }
}

function cleanupWorkspace(workspace) {
  try {
    const own = fs.realpathSync(workspace);
    const tmp = fs.realpathSync(os.tmpdir());
    const worktrees = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: workspace, encoding: 'utf8' })
      .split('\n').filter(line => line.startsWith('worktree ')).map(line => line.slice(9)).filter(dir => dir !== own);
    // git prints resolved paths (/private/var/… on macOS), so compare against the resolved tmpdir.
    for (const dir of worktrees) if (dir.startsWith(tmp)) fs.rmSync(dir, { recursive: true, force: true });
  } catch { /* workspace may be gone */ }
  fs.rmSync(workspace, { recursive: true, force: true });
}

async function pool(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

const JUDGE_DIFF_LIMIT = 30000;

function truncateDiff(diff, limit = JUDGE_DIFF_LIMIT) {
  if (diff.length <= limit) return diff;
  return `${diff.slice(0, limit)}\n[diff truncated: ${diff.length - limit} of ${diff.length} characters omitted]`;
}

async function judgeRuns({ tasks, arms, records, outDir, options, seed }) {
  const judgments = [];
  const judgeDir = path.join(outDir, 'judge');
  fs.mkdirSync(judgeDir, { recursive: true });
  const isolation = createIsolation();
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-bench-judge-'));
  try {
    for (const [taskIndex, task] of tasks.entries()) {
      for (let rep = 1; rep <= options.reps; rep++) {
        const runs = records.filter(record => record.task === task.id && record.rep === rep && record.score);
        if (runs.length < 2) continue;
        const labels = ['A', 'B', 'C', 'D', 'E'].slice(0, runs.length);
        const order = shuffle(runs, seed + rep * 101 + taskIndex * 7919);
        const candidates = order.map((run, i) => ({
          label: labels[i], arm: run.arm,
          diff: truncateDiff(fs.readFileSync(path.join(outDir, 'runs', task.id, run.arm, `r${rep}`, 'diff.patch'), 'utf8')),
        }));
        const result = await runCli({
          args: textArgs({ model: options.judgeModel || options.model, effort: options.effort }),
          input: judgePrompt({ request: task.request, candidates }),
          cwd, isolation, tracePath: path.join(judgeDir, `${task.id}-r${rep}.jsonl`), timeoutMs: 10 * 60000,
        });
        const summary = summarizeInvocation(parseStream(result.stdout));
        options.budget.spent += summary.costUsd;
        const parsed = parseJudge(summary.finalText, labels);
        const judgment = { task: task.id, rep, labels: Object.fromEntries(candidates.map(c => [c.label, c.arm])), costUsd: summary.costUsd, parsed: Boolean(parsed) };
        if (parsed) {
          judgment.byArm = {};
          for (const candidate of candidates) {
            judgment.byArm[candidate.arm] = { ...parsed.ratings[candidate.label], rank: parsed.ranking.indexOf(candidate.label) + 1 };
          }
          judgment.notes = parsed.notes;
        }
        fs.writeFileSync(path.join(judgeDir, `${task.id}-r${rep}.json`), `${JSON.stringify(judgment, null, 2)}\n`);
        judgments.push(judgment);
      }
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
    isolation.cleanup();
  }
  return judgments;
}

function loadRecords(outDir) {
  const records = [];
  const runsDir = path.join(outDir, 'runs');
  if (!fs.existsSync(runsDir)) return records;
  for (const task of fs.readdirSync(runsDir)) {
    for (const arm of fs.readdirSync(path.join(runsDir, task))) {
      for (const rep of fs.readdirSync(path.join(runsDir, task, arm))) {
        const file = path.join(runsDir, task, arm, rep, 'run.json');
        if (fs.existsSync(file)) records.push(JSON.parse(fs.readFileSync(file, 'utf8')));
      }
    }
  }
  return records.sort((a, b) => `${a.task}${a.arm}${a.rep}`.localeCompare(`${b.task}${b.arm}${b.rep}`));
}

function writeReport(outDir, { publish, includeModel } = {}) {
  const metadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));
  const records = loadRecords(outDir);
  const judgeDir = path.join(outDir, 'judge');
  const judgments = fs.existsSync(judgeDir)
    ? fs.readdirSync(judgeDir).filter(name => name.endsWith('.json')).sort().map(name => JSON.parse(fs.readFileSync(path.join(judgeDir, name), 'utf8')))
    : [];
  const summary = buildSummary({ metadata, runs: records, judgments, seed: metadata.seed });
  fs.writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'report.md'), renderMarkdown(summary, metadata, { includeModel: true }));
  if (publish) fs.writeFileSync(publish, renderMarkdown(summary, metadata, { includeModel: Boolean(includeModel), title: 'Benchmark Results: e6-agent-skills vs Superpowers' }));
  return summary;
}

async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args);
  const command = options._[0];
  if (command === 'validate') {
    let failed = 0;
    for (const task of loadTasks(list(options.tasks))) {
      const problems = validateTask(task);
      console.log(`${problems.length ? '✗' : '✓'}  ${task.id} (${task.config.kind}, ${task.mutants.length} mutants)`);
      for (const problem of problems) console.log(`     ${problem}`);
      if (problems.length) failed++;
    }
    if (failed) process.exitCode = 1;
    return;
  }
  if (command === 'report') {
    const outDir = path.resolve(options._[1] || '');
    if (!fs.existsSync(path.join(outDir, 'metadata.json'))) throw new Error(`Not a results directory: ${outDir}`);
    writeReport(outDir, { publish: options.publish && path.resolve(options.publish), includeModel: options['include-model'] });
    console.log(`Report: ${path.join(outDir, 'report.md')}${options.publish ? `; published ${options.publish}` : ''}`);
    return;
  }
  if (command !== 'run') throw new Error(USAGE);

  const scoring = JSON.parse(fs.readFileSync(path.join(BENCH_DIR, 'scoring.json'), 'utf8'));
  const runOptions = {
    model: options.model,
    effort: options.effort || 'medium',
    mode: options.mode || 'natural',
    reps: Number(options.reps || 1),
    // Agents may stop processes by name (for example `pkill -f server.js`); one run at a time
    // keeps one arm from disturbing another. Raise only when that risk is acceptable.
    concurrency: Number(options.concurrency || 1),
    maxCostUsd: Number(options['max-cost-usd'] || 25),
    perRunUsd: Number(options['per-run-usd'] || 5),
    judge: Boolean(options.judge),
    judgeModel: options['judge-model'],
    seed: Number(options.seed || scoring.seed),
  };
  if (!runOptions.model) throw new Error('--model is required');
  if (!['natural', 'invoked'].includes(runOptions.mode)) throw new Error('--mode must be natural or invoked');
  const tasks = loadTasks(list(options.tasks));
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(options.out || path.join(BENCH_DIR, 'results', runId));
  fs.mkdirSync(outDir, { recursive: true });
  // Plugins live outside the repository so no arm's --plugin-dir sits near evals/benchmark/tasks.
  const armsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-bench-arms-'));
  try {
    await runBenchmark({ options, scoring, runOptions, tasks, runId, outDir, armsDir });
  } finally {
    fs.rmSync(armsDir, { recursive: true, force: true });
  }
}

async function runBenchmark({ options, scoring, runOptions, tasks, runId, outDir, armsDir }) {
  const arms = prepareArms(list(options.arms), armsDir);
  const cliVersion = execFileSync('claude', ['--version'], { encoding: 'utf8' }).trim().split(' ')[0];
  const metadata = {
    runId, startedAt: new Date().toISOString(), cliVersion, model: runOptions.model, effort: runOptions.effort, mode: runOptions.mode,
    reps: runOptions.reps, seed: runOptions.seed, weights: scoring.weights, judge: runOptions.judge,
    judgeModel: runOptions.judge ? runOptions.judgeModel || runOptions.model : null,
    caps: { maxCostUsd: runOptions.maxCostUsd, perRunUsd: runOptions.perRunUsd },
    arms: arms.map(({ id, label, source, expectedPlugins, hash, invoke_prefix: invokePrefix }) => ({ id, label, source, expectedPlugins, hash, invokePrefix: runOptions.mode === 'invoked' ? invokePrefix || null : null })),
    tasks: tasks.map(task => ({ id: task.id, kind: task.config.kind, hash: hashTree(task.dir) })),
    node: process.version, platform: `${os.platform()} ${os.arch()}`,
  };
  fs.writeFileSync(path.join(outDir, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  const jobs = [];
  for (let rep = 1; rep <= runOptions.reps; rep++) {
    for (const task of tasks) for (const arm of arms) jobs.push({ task, arm, rep });
  }
  const ordered = shuffle(jobs, runOptions.seed);
  const budget = { spent: 0 };
  runOptions.budget = budget;
  console.log(`Benchmark ${runId}: ${ordered.length} runs (${tasks.length} tasks × ${arms.length} arms × ${runOptions.reps} reps), cap $${runOptions.maxCostUsd}`);
  const records = await pool(ordered, runOptions.concurrency, async ({ task, arm, rep }) => {
    const runDir = path.join(outDir, 'runs', task.id, arm.id, `r${rep}`);
    if (budget.spent >= runOptions.maxCostUsd) {
      const skipped = { task: task.id, arm: arm.id, rep, status: 'skipped', reason: 'global cost cap reached' };
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(skipped, null, 2)}\n`);
      return skipped;
    }
    const record = await runOne({ task, arm, rep, options: runOptions, weights: scoring.weights, scoring, runDir, budget });
    const score = record.score ? `composite ${record.score.composite.toFixed(2)}, hidden ${record.score.hidden.pass}/${record.score.hidden.tests}` : record.reason || '';
    console.log(`  ${record.status.padEnd(13)} ${task.id} · ${arm.id} · r${rep} · $${record.cost.agentUsd.toFixed(2)} · ${score} · total $${budget.spent.toFixed(2)}`);
    return record;
  });
  if (runOptions.judge && budget.spent < runOptions.maxCostUsd) {
    await judgeRuns({ tasks, arms, records, outDir, options: runOptions, seed: runOptions.seed });
  }
  metadata.finishedAt = new Date().toISOString();
  metadata.totalCostUsd = Number(budget.spent.toFixed(4));
  fs.writeFileSync(path.join(outDir, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  writeReport(outDir);
  console.log(`Done. Spent $${budget.spent.toFixed(2)}. Report: ${path.join(outDir, 'report.md')}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 2;
  });
}

module.exports = { parseOptions, hashTree, pluginName, prepareArms, runOne, loadRecords, writeReport, truncateDiff, PLUGIN_PATHS, pluginPaths };
