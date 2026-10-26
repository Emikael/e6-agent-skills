'use strict';

// Model invocations for the benchmark: the agent under test, the simulated user, and the
// blind judge. Every call runs in an isolated config with an allowlisted environment.

const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { isolatedEnv } = require('./isolation');

const AGENT_TOOLS = 'Read,Glob,Grep,Edit,Write,MultiEdit,Bash,Skill,Agent,Task,TodoWrite';
const DISALLOWED_TOOLS = 'WebFetch,WebSearch';

function baseArgs({ model, effort }) {
  if (!model) throw new Error('A model is required (--model); it is never stored in the repository.');
  const args = ['-p', '--verbose', '--output-format', 'stream-json', '--model', model,
    '--setting-sources', 'project', '--strict-mcp-config'];
  if (effort) args.push('--effort', effort);
  return args;
}

function agentArgs({ model, effort, pluginDirs = [], resume, maxBudgetUsd }) {
  const args = baseArgs({ model, effort });
  args.push('--permission-mode', 'acceptEdits', '--allowedTools', AGENT_TOOLS, '--disallowedTools', DISALLOWED_TOOLS);
  for (const dir of pluginDirs) args.push('--plugin-dir', dir);
  if (resume) args.push('--resume', resume);
  if (maxBudgetUsd) args.push('--max-budget-usd', String(maxBudgetUsd));
  return args;
}

/** A tool-less call (user simulator, judge). */
function textArgs({ model, effort }) {
  return [...baseArgs({ model, effort }), '--tools', '', '--disallowedTools', 'mcp__*'];
}

/** Spawn the CLI, stream stdout to tracePath, resolve with the full output. */
function runCli({ args, input, cwd, isolation, tracePath, timeoutMs, command = 'claude' }) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd, env: isolatedEnv(isolation), stdio: ['pipe', 'pipe', 'pipe'] });
    const out = tracePath ? fs.createWriteStream(tracePath) : null;
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
    }, timeoutMs);
    child.stdout.on('data', chunk => { stdout += chunk; if (out) out.write(chunk); });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => {
      clearTimeout(timer);
      if (out) out.end();
      resolve({ code, stdout, stderr: stderr.slice(-8000), timedOut });
    });
    child.on('error', error => {
      clearTimeout(timer);
      if (out) out.end();
      resolve({ code: -1, stdout, stderr: String(error), timedOut });
    });
    child.stdin.end(input);
  });
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

function simulatorPrompt({ request, answers, exchanges, agentMessage, followupsUsed, maxFollowups }) {
  const history = exchanges.map((exchange, i) => `Agent message ${i + 1}:\n${exchange.agent}\n\nYour reply ${i + 1}:\n${exchange.user}`).join('\n\n---\n\n');
  return `You are role-playing the user who asked a coding agent to do a task. The agent has just stopped and is waiting for you. Decide how the user replies.

The original request (REQUEST.md):
<request>
${request}
</request>

Your private answer key. These are the user's real decisions:
<answer_key>
${answers}
</answer_key>

${history ? `Earlier exchanges:\n<history>\n${history}\n</history>\n` : ''}
The agent's latest message:
<agent_message>
${agentMessage}
</agent_message>

Rules (you are measuring the agent, not helping it):
1. If the agent says the work is finished, reply with action "done", even if you think it skipped steps such as tests or manual checks. Never request extra verification, tests, reviews, or changes.
2. If the agent asks questions, answer only those questions, briefly, using the answer key. If the key does not cover a question, say the agent should use its best judgment. Never mention answer-key details the agent did not ask about.
3. If the agent asks you to approve a design, spec, or plan, approve it when it is consistent with the answer key; otherwise state only the specific corrections to points it raised.
4. If the agent stopped without finishing, without a question, and without asking for approval, reply exactly "Please continue until the task is complete." and nothing else.
5. You have used ${followupsUsed} of ${maxFollowups} replies.

Return only JSON: {"action": "reply" | "done", "kind": "answer" | "approval" | "nudge" | "done", "message": "<your reply to the agent, empty when done>"}`;
}

function parseSimulatorReply(text) {
  const json = extractJson(text || '');
  if (!json || !['reply', 'done'].includes(json.action)) return { action: 'reply', kind: 'nudge', message: 'Please continue until the task is complete.', parsed: false };
  const kind = ['answer', 'approval', 'nudge', 'done'].includes(json.kind) ? json.kind : (json.action === 'done' ? 'done' : 'answer');
  return { action: json.action, kind, message: String(json.message || ''), parsed: true };
}

function judgePrompt({ request, candidates }) {
  const blocks = candidates.map(candidate => `<candidate label="${candidate.label}">\n${candidate.diff || '(no changes)'}\n</candidate>`).join('\n\n');
  return `You are reviewing independent solutions to the same software task. Judge only the code changes shown; the authors are anonymous and their order is random.

Task (REQUEST.md):
<request>
${request}
</request>

${blocks}

Rate each candidate from 1 (poor) to 5 (excellent) on:
- correctness: does the change satisfy the request without breaking existing behavior?
- tests: do the added or changed tests meaningfully check the requested behavior and plausible defects?
- readability: is the code clear, idiomatic, and consistent with the codebase?
- scope: does the change stay within the request (no unrelated edits, no unnecessary files)?

Then rank all candidates from best to worst.

Return only JSON: {"ratings": {"<label>": {"correctness": n, "tests": n, "readability": n, "scope": n}}, "ranking": ["<label>", ...], "notes": "<one short sentence per candidate>"}`;
}

function parseJudge(text, labels) {
  const json = extractJson(text || '');
  if (!json || typeof json.ratings !== 'object' || !Array.isArray(json.ranking)) return null;
  for (const label of labels) {
    const rating = json.ratings[label];
    if (!rating) return null;
    for (const axis of ['correctness', 'tests', 'readability', 'scope']) {
      const value = Number(rating[axis]);
      if (!(value >= 1 && value <= 5)) return null;
    }
  }
  if (json.ranking.length !== labels.length || !labels.every(label => json.ranking.includes(label))) return null;
  return json;
}

module.exports = {
  AGENT_TOOLS, agentArgs, textArgs, runCli, extractJson,
  simulatorPrompt, parseSimulatorReply, judgePrompt, parseJudge,
};
