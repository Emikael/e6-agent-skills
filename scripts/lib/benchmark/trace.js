'use strict';

// Parse Claude Code stream-json traces and derive process metrics.

const TEST_COMMAND = /(^|[\s;&|(])(node\s+(?:[^\n;&|]*\s)?--test\b|npm\s+(?:run\s+)?test\b|npx\s+(?:jest|vitest|mocha)\b|node\s+[^\n;&|]*\.test\.js)/;
const RUNTIME_COMMAND = /(node\s+(?:[^\n;&|]*\s)?server\.js|curl\s|wget\s|fetch\(|http\.(?:get|request)\(|node\s+-e\s|node\s+--eval|node\s+-p\s)/;
const FAILING_OUTPUT = /(^# fail [1-9]|^not ok \d|✖|\bfailing\b|AssertionError|ERR_ASSERTION|^\s*ℹ fail [1-9])/m;
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const SUBAGENT_TOOLS = new Set(['Agent', 'Task']);

function parseStream(text) {
  const events = [];
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    try { events.push(JSON.parse(line)); } catch { /* non-JSON noise */ }
  }
  return events;
}

function resultText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(part => (typeof part === 'string' ? part : part.text || '')).join('\n');
  return '';
}

/** One CLI invocation (a first turn or a --resume) reduced to what scoring needs. */
function summarizeInvocation(events) {
  const init = events.find(event => event.type === 'system' && event.subtype === 'init') || null;
  const result = [...events].reverse().find(event => event.type === 'result') || null;
  const calls = [];
  const byId = new Map();
  let lastAssistantText = '';
  for (const event of events) {
    const content = event.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (event.type === 'assistant' && block.type === 'tool_use') {
        const call = { id: block.id, name: block.name, input: block.input || {}, parent: event.parent_tool_use_id || null, index: calls.length };
        calls.push(call);
        byId.set(block.id, call);
      } else if (event.type === 'assistant' && block.type === 'text' && !event.parent_tool_use_id) {
        lastAssistantText = block.text;
      } else if (event.type === 'user' && block.type === 'tool_result') {
        const call = byId.get(block.tool_use_id);
        if (call) {
          call.result = resultText(block.content).slice(0, 4000);
          call.isError = Boolean(block.is_error);
        }
      }
    }
  }
  const usage = result?.usage || {};
  return {
    sessionId: result?.session_id || init?.session_id || null,
    init,
    costUsd: Number(result?.total_cost_usd || 0),
    usage: {
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0,
      cacheRead: usage.cache_read_input_tokens || 0,
      cacheCreate: usage.cache_creation_input_tokens || 0,
    },
    numTurns: result?.num_turns || 0,
    durationMs: result?.duration_ms || 0,
    isError: Boolean(result?.is_error) || !result,
    stopReason: result?.subtype || null,
    finalText: result?.result || lastAssistantText || '',
    calls,
  };
}

function commandOf(call) {
  return call.name === 'Bash' ? String(call.input.command || '') : '';
}

function isTestFile(file) {
  return /(^|[\\/])(test|tests|__tests__)[\\/]|\.test\.[cm]?js$|\.spec\.[cm]?js$/.test(file);
}

function isSourceEdit(call) {
  if (!EDIT_TOOLS.has(call.name)) return false;
  const file = String(call.input.file_path || call.input.notebook_path || '');
  return /\.[cm]?js$/.test(file) && !isTestFile(file);
}

/** Process metrics over all calls of a run, in order (subagent calls included). */
function processMetrics(calls, { kind, runtime }) {
  const testRuns = calls.filter(call => TEST_COMMAND.test(commandOf(call)));
  const failingRun = call => call.isError || FAILING_OUTPUT.test(call.result || '');
  const firstSourceEdit = calls.find(isSourceEdit);
  const firstSourceIndex = firstSourceEdit ? firstSourceEdit.index : Infinity;
  const edits = calls.filter(call => EDIT_TOOLS.has(call.name));
  const lastEditIndex = edits.length ? edits[edits.length - 1].index : -1;
  const testFileWrites = edits.filter(call => isTestFile(String(call.input.file_path || '')));

  const testsBeforeSource = testRuns.filter(call => call.index < firstSourceIndex);
  const redBeforeGreen = kind === 'refactor'
    ? testsBeforeSource.length > 0
    : testsBeforeSource.some(failingRun) && testFileWrites.some(call => call.index < firstSourceIndex);
  const runtimeCheck = calls.some(call => call.index > firstSourceIndex - 1 && RUNTIME_COMMAND.test(commandOf(call)) && !TEST_COMMAND.test(commandOf(call)));
  const testedAfterLastEdit = testRuns.some(call => call.index > lastEditIndex);
  const skills = calls.filter(call => call.name === 'Skill').map(call => String(call.input.skill || call.input.name || ''));
  const skillFilesRead = calls
    .filter(call => call.name === 'Read' && /SKILL\.md$/.test(String(call.input.file_path || '')))
    .map(call => String(call.input.file_path).split(/[\\/]/).slice(-2, -1)[0]);
  const subagents = calls.filter(call => SUBAGENT_TOOLS.has(call.name));
  const reviewEvidence = skills.some(name => /review/i.test(name))
    || subagents.some(call => /review/i.test(`${call.input.description || ''} ${call.input.subagent_type || ''} ${String(call.input.prompt || '').slice(0, 400)}`));
  const pushAttempted = calls.some(call => /\bgit\s+push\b/.test(commandOf(call)));
  return {
    testRuns: testRuns.length,
    redBeforeGreen,
    runtimeCheck: runtime === 'library' ? null : runtimeCheck,
    testedAfterLastEdit,
    reviewEvidence,
    skills: [...new Set(skills)],
    skillFilesRead: [...new Set(skillFilesRead)],
    subagents: subagents.length,
    pushAttempted,
    toolCalls: calls.length,
  };
}

// Hidden tests, reference solutions, and answer keys never reach the workspace. A tool call
// that names one means the agent found the benchmark itself, so the run cannot be scored.
const BENCHMARK_FILES = /evals[\\/]benchmark|[\\/]hidden[\\/][^\s'"]*\.test\.js|\banswers\.md\b/;

/** Calls whose input names benchmark-only files, as short "Tool: snippet" strings. */
function benchmarkAccess(calls) {
  return calls
    .map(call => ({ call, text: JSON.stringify(call.input || {}) }))
    .filter(({ text }) => BENCHMARK_FILES.test(text))
    .map(({ call, text }) => `${call.name}: ${text.match(BENCHMARK_FILES)[0]}`);
}

module.exports = { parseStream, summarizeInvocation, processMetrics, benchmarkAccess, isTestFile, isSourceEdit, TEST_COMMAND, RUNTIME_COMMAND };
