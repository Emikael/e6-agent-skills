'use strict';

// Benchmark tasks: loading, running node:test suites, mutants, and self-validation.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');

const BENCH_DIR = path.resolve(__dirname, '..', '..', '..', 'evals', 'benchmark');
const TASKS_DIR = path.join(BENCH_DIR, 'tasks');
const TASK_KINDS = new Set(['feature', 'bugfix', 'refactor', 'feature-ambiguous', 'feature-security']);

function loadTask(dir) {
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'task.json'), 'utf8'));
  const mutantsFile = path.join(dir, 'mutants.json');
  const mutants = fs.existsSync(mutantsFile) ? JSON.parse(fs.readFileSync(mutantsFile, 'utf8')) : [];
  const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
  return {
    id: config.id,
    dir,
    config,
    mutants,
    request: read(path.join('repo', 'REQUEST.md')),
    answers: fs.existsSync(path.join(dir, 'answers.md')) ? read('answers.md') : '',
  };
}

function loadTasks(ids, tasksDir = TASKS_DIR) {
  const all = fs.readdirSync(tasksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(tasksDir, entry.name, 'task.json')))
    .map(entry => loadTask(path.join(tasksDir, entry.name)))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!ids || ids.length === 0) return all;
  const unknown = ids.filter(id => !all.some(task => task.id === id));
  if (unknown.length) throw new Error(`Unknown task(s): ${unknown.join(', ')}`);
  return all.filter(task => ids.includes(task.id));
}

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function copyTree(src, dest, { exclude = new Set(['.git', 'node_modules']) } = {}) {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: source => !exclude.has(path.basename(source)) || source === src,
  });
}

function applyMutant(dir, mutant) {
  const file = path.join(dir, mutant.file);
  const source = fs.readFileSync(file, 'utf8');
  const count = source.split(mutant.find).length - 1;
  if (count !== 1) throw new Error(`mutant ${mutant.name}: expected exactly one match in ${mutant.file}, found ${count}`);
  fs.writeFileSync(file, source.replace(mutant.find, mutant.replace));
}

/** Copy the task's reference implementation of its interface files into dir. */
function installReference(task, dir) {
  for (const file of task.config.interface) {
    fs.copyFileSync(path.join(task.dir, 'reference', file), path.join(dir, file));
  }
}

/** Top-level test results from TAP output, keyed by name (duplicates numbered). */
function parseTapCases(output) {
  const cases = [];
  const seen = new Map();
  for (const match of output.matchAll(/^(not ok|ok) \d+ - (.+?)(?: # .*)?$/gm)) {
    const name = match[2];
    const count = (seen.get(name) || 0) + 1;
    seen.set(name, count);
    cases.push({ name: count > 1 ? `${name} #${count}` : name, ok: match[1] === 'ok' });
  }
  return cases;
}

function parseTap(output) {
  const count = name => {
    const match = new RegExp(`^# ${name} (\\d+)$`, 'm').exec(output);
    return match ? Number(match[1]) : null;
  };
  return { tests: count('tests'), pass: count('pass'), fail: count('fail') };
}

/** Run node:test on files (relative to cwd); returns counts and a bounded output tail. */
function runNodeTests(cwd, files, { timeoutMs = 120000 } = {}) {
  if (!files.length) return { ok: false, tests: 0, pass: 0, fail: 0, error: 'no test files', output: '' };
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { PATH: process.env.PATH, TZ: 'UTC', NODE_ENV: 'test' },
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const counts = parseTap(output);
  const timedOut = result.error?.code === 'ETIMEDOUT';
  return {
    ok: result.status === 0 && !timedOut,
    tests: counts.tests ?? 0,
    pass: counts.pass ?? 0,
    fail: counts.fail ?? (result.status === 0 ? 0 : 1),
    error: timedOut ? 'timeout' : undefined,
    cases: parseTapCases(output),
    output: output.slice(-4000),
  };
}

/** Copy dir to a fresh scoring dir and run the task's hidden tests there. */
function runHidden(task, dir) {
  const scoring = tempDir('e6-bench-score-');
  try {
    copyTree(dir, scoring);
    fs.rmSync(path.join(scoring, 'hidden'), { recursive: true, force: true });
    fs.cpSync(path.join(task.dir, 'hidden'), path.join(scoring, 'hidden'), { recursive: true });
    const files = fs.readdirSync(path.join(scoring, 'hidden')).filter(name => name.endsWith('.test.js')).map(name => path.join('hidden', name));
    return runNodeTests(scoring, files);
  } finally {
    fs.rmSync(scoring, { recursive: true, force: true });
  }
}

function withCopy(task, prepare, run) {
  const dir = tempDir('e6-bench-validate-');
  try {
    copyTree(path.join(task.dir, 'repo'), dir);
    prepare(dir);
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Deterministic self-check of a task; returns a list of problems (empty when valid). */
function validateTask(task) {
  const problems = [];
  const { config } = task;
  for (const key of ['id', 'kind', 'prompt', 'interface', 'visible_tests']) {
    if (config[key] === undefined) problems.push(`task.json is missing ${key}`);
  }
  if (config.id !== path.basename(task.dir)) problems.push('task.json id must match its directory');
  if (!TASK_KINDS.has(config.kind)) problems.push(`unknown kind ${config.kind}`);
  if (!fs.existsSync(path.join(task.dir, 'repo', 'REQUEST.md'))) problems.push('repo/REQUEST.md is missing');
  if (fs.existsSync(path.join(task.dir, 'repo', 'hidden'))) problems.push('repo/ must not contain hidden tests');
  if (!task.answers.trim()) problems.push('answers.md is missing or empty');
  if (task.mutants.length < 3) problems.push('at least 3 mutants are required');
  if (problems.length) return problems;

  const seed = withCopy(task, () => {}, dir => runHidden(task, dir));
  if (config.kind === 'refactor') {
    if (!seed.ok) problems.push(`refactor seed must pass hidden tests (${seed.fail} failing)`);
  } else if (seed.ok) {
    problems.push('seed passes every hidden test; the task would be trivially solved');
  }
  const visibleSeed = withCopy(task, () => {}, dir => runNodeTests(dir, config.visible_tests));
  if (!visibleSeed.ok) problems.push('visible tests fail on the seed');

  const reference = withCopy(task, dir => installReference(task, dir), dir => ({
    hidden: runHidden(task, dir),
    visible: runNodeTests(dir, config.visible_tests),
  }));
  if (!reference.hidden.ok) problems.push(`reference fails hidden tests:\n${reference.hidden.output.slice(-1500)}`);
  if (!reference.visible.ok) problems.push('reference fails visible tests');

  for (const mutant of task.mutants) {
    try {
      const result = withCopy(task, dir => {
        installReference(task, dir);
        applyMutant(dir, mutant);
      }, dir => runHidden(task, dir));
      if (result.ok) problems.push(`mutant ${mutant.name} survives the hidden tests`);
    } catch (error) {
      problems.push(error.message);
    }
  }
  return problems;
}

/** Fresh git workspace from the task's seed repo. */
function materializeTask(task) {
  const workspace = tempDir('e6-bench-ws-');
  copyTree(path.join(task.dir, 'repo'), workspace);
  const git = args => execFileSync('git', args, { cwd: workspace, encoding: 'utf8' });
  git(['init', '--quiet', '--initial-branch=main']);
  git(['config', 'core.autocrlf', 'false']);
  git(['config', 'user.name', 'Benchmark']);
  git(['config', 'user.email', 'benchmark@example.invalid']);
  git(['add', '--all']);
  git(['commit', '--quiet', '-m', 'task baseline']);
  return { workspace, baselineSha: git(['rev-parse', 'HEAD']).trim() };
}

module.exports = {
  BENCH_DIR, TASKS_DIR, loadTasks, loadTask, validateTask, materializeTask, runNodeTests, runHidden,
  applyMutant, installReference, copyTree, tempDir, parseTap, parseTapCases,
};
