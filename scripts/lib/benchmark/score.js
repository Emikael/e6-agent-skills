'use strict';

// Deterministic scoring of one finished run.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { runHidden, runNodeTests, installReference, applyMutant, copyTree, tempDir } = require('./tasks');
const { isTestFile } = require('./trace');

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
}

function hasChanges(dir, baselineSha) {
  try {
    if (git(dir, ['status', '--porcelain'])) return true;
    return git(dir, ['rev-parse', 'HEAD']) !== baselineSha;
  } catch {
    return false;
  }
}

/**
 * Find what the agent delivered: the working tree (with any commits), else a worktree with
 * changes, else the newest branch with commits beyond the baseline. Returns a scoring copy.
 */
function resolveDelivery(workspace, baselineSha) {
  const copy = tempDir('e6-bench-deliver-');
  const finish = (source, delivery, ref) => {
    copyTree(source, copy, { exclude: new Set(['node_modules']) });
    return { dir: copy, delivery, ref };
  };
  if (hasChanges(workspace, baselineSha)) return finish(workspace, 'working-tree');
  const worktrees = git(workspace, ['worktree', 'list', '--porcelain'])
    .split('\n').filter(line => line.startsWith('worktree ')).map(line => line.slice(9))
    .filter(dir => path.resolve(dir) !== path.resolve(workspace) && fs.existsSync(dir));
  for (const dir of worktrees) {
    if (hasChanges(dir, baselineSha)) {
      copyTree(dir, copy, { exclude: new Set(['node_modules', '.git']) });
      fs.cpSync(path.join(workspace, '.git'), path.join(copy, '.git'), { recursive: true });
      const head = git(dir, ['rev-parse', 'HEAD']);
      git(copy, ['reset', '--quiet', '--soft', head]);
      return { dir: copy, delivery: 'worktree', ref: dir };
    }
  }
  const branches = git(workspace, ['for-each-ref', '--sort=-committerdate', '--format=%(refname:short)', 'refs/heads'])
    .split('\n').filter(Boolean);
  for (const branch of branches) {
    if (Number(git(workspace, ['rev-list', '--count', `${baselineSha}..${branch}`])) > 0) {
      copyTree(workspace, copy, { exclude: new Set(['node_modules']) });
      git(copy, ['checkout', '--quiet', '--force', branch]);
      return { dir: copy, delivery: 'branch', ref: branch };
    }
  }
  return finish(workspace, 'none');
}

/** Diff and changed files of a delivered copy against the baseline (untracked included). */
function deliveredChanges(dir, baselineSha) {
  git(dir, ['add', '--all']);
  const nameStatus = git(dir, ['diff', '--cached', '--name-status', '--no-renames', baselineSha]);
  const files = nameStatus ? nameStatus.split('\n').map(line => {
    const [status, ...rest] = line.split('\t');
    return { status, file: rest.join('\t') };
  }) : [];
  const diff = git(dir, ['diff', '--cached', '--no-ext-diff', baselineSha]);
  const commits = Number(git(dir, ['rev-list', '--count', `${baselineSha}..HEAD`]));
  return { files, diff, commits };
}

function decisionPoints(source) {
  const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  return (code.match(/\bif\b|\bcase\b|\bfor\b|\bwhile\b|\?(?![.?])|&&|\|\|/g) || []).length;
}

function maxIndent(source) {
  return source.split('\n').filter(line => line.trim()).reduce((max, line) => Math.max(max, line.match(/^ */)[0].length), 0);
}

/**
 * Mutation score of the agent's own tests. Only test cases that pass against the reference
 * implementation count, so tests of reasonable extra behavior (beyond the reference) do not
 * void the whole suite. A mutant is killed when any of those valid cases fails.
 */
function mutationScore(task, deliveredDir, agentTests) {
  const allSurvived = reason => ({ score: 0, valid: false, reason, validCases: 0, totalCases: 0, killed: [], survived: task.mutants.map(m => m.name) });
  if (!agentTests.length) return allSurvived('no agent tests');
  const run = prepare => {
    const dir = tempDir('e6-bench-mut-');
    try {
      copyTree(deliveredDir, dir);
      prepare(dir);
      return runNodeTests(dir, agentTests.filter(file => fs.existsSync(path.join(dir, file))), { timeoutMs: 60000 });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
  const reference = run(dir => installReference(task, dir));
  const validNames = new Set(reference.cases.filter(c => c.ok).map(c => c.name));
  if (!validNames.size) return { ...allSurvived('no agent test passes against the reference implementation'), totalCases: reference.cases.length };
  const killed = [];
  const survived = [];
  for (const mutant of task.mutants) {
    const result = run(dir => { installReference(task, dir); applyMutant(dir, mutant); });
    const passed = new Set(result.cases.filter(c => c.ok).map(c => c.name));
    const caught = result.error === 'timeout' || [...validNames].some(name => !passed.has(name));
    (caught ? killed : survived).push(mutant.name);
  }
  return {
    score: killed.length / task.mutants.length,
    valid: true,
    reason: validNames.size < reference.cases.length ? `${reference.cases.length - validNames.size} agent test(s) fail on the reference and were ignored` : undefined,
    validCases: validNames.size,
    totalCases: reference.cases.length,
    killed,
    survived,
  };
}

function scopeMetrics(task, changes, deliveredDir, processInfo) {
  const visible = new Set(task.config.visible_tests);
  const visibleWeakened = changes.files.some(({ status, file }) => visible.has(file) && status === 'D')
    || /^\+.*\b(test|it|describe)\.(skip|todo)\(|^\+.*\{\s*skip:\s*true/m.test(changes.diff);
  let depsAdded = false;
  const pkg = path.join(deliveredDir, 'package.json');
  if (fs.existsSync(pkg)) {
    try {
      const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
      depsAdded = Object.keys({ ...json.dependencies, ...json.devDependencies }).length > 0;
    } catch { depsAdded = false; }
  }
  const docsAdded = changes.files.filter(({ status, file }) => status === 'A' && /\.md$/i.test(file)).map(({ file }) => file);
  const penalties = (depsAdded ? 0.5 : 0) + (visibleWeakened ? 0.5 : 0) + (processInfo.pushAttempted ? 0.5 : 0);
  return { score: Math.max(0, 1 - penalties), depsAdded, visibleWeakened, pushAttempted: processInfo.pushAttempted, docsAdded, filesChanged: changes.files.length };
}

function processScore(processInfo) {
  const checks = [processInfo.redBeforeGreen, processInfo.runtimeCheck, processInfo.testedAfterLastEdit, processInfo.reviewEvidence]
    .filter(value => value !== null && value !== undefined);
  return checks.length ? checks.filter(Boolean).length / checks.length : 0;
}

function compositeScore(dimensions, weights) {
  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (typeof dimensions[key] === 'number') {
      total += dimensions[key] * weight;
      weightSum += weight;
    }
  }
  return weightSum ? total / weightSum : 0;
}

/** Full deterministic score for a run. */
function scoreRun({ task, workspace, baselineSha, processInfo, weights }) {
  const delivered = resolveDelivery(workspace, baselineSha);
  try {
    const changes = deliveredChanges(delivered.dir, baselineSha);
    const hidden = runHidden(task, delivered.dir);
    const visibleExisting = task.config.visible_tests.filter(file => fs.existsSync(path.join(delivered.dir, file)));
    const regression = visibleExisting.length === task.config.visible_tests.length
      ? runNodeTests(delivered.dir, visibleExisting)
      : { ok: false, error: 'visible test file removed' };
    const agentTests = changes.files
      .filter(({ status, file }) => status !== 'D' && isTestFile(file) && !file.startsWith('hidden/'))
      .map(({ file }) => file);
    const mutation = mutationScore(task, delivered.dir, agentTests);
    const scope = scopeMetrics(task, changes, delivered.dir, processInfo);
    const outcome = hidden.tests ? (hidden.pass / hidden.tests) * (regression.ok ? 1 : 0.5) : 0;
    const dimensions = {
      outcome,
      testQuality: mutation.score,
      process: processScore(processInfo),
      scope: scope.score,
    };
    let complexity = null;
    if (task.config.kind === 'refactor') {
      complexity = {};
      for (const file of task.config.interface) {
        const before = fs.readFileSync(path.join(task.dir, 'repo', file), 'utf8');
        const afterFile = path.join(delivered.dir, file);
        const after = fs.existsSync(afterFile) ? fs.readFileSync(afterFile, 'utf8') : '';
        complexity[file] = {
          decisionsBefore: decisionPoints(before), decisionsAfter: decisionPoints(after),
          indentBefore: maxIndent(before), indentAfter: maxIndent(after),
          linesBefore: before.split('\n').length, linesAfter: after.split('\n').length,
        };
      }
    }
    return {
      delivery: delivered.delivery,
      deliveryRef: delivered.ref || null,
      hidden: { tests: hidden.tests, pass: hidden.pass, fail: hidden.fail, ok: hidden.ok, error: hidden.error },
      regression: { ok: regression.ok, error: regression.error },
      agentTests,
      mutation,
      scope,
      process: processInfo,
      complexity,
      commits: changes.commits,
      changedFiles: changes.files,
      dimensions,
      composite: compositeScore(dimensions, weights),
      diff: changes.diff,
    };
  } finally {
    fs.rmSync(delivered.dir, { recursive: true, force: true });
  }
}

module.exports = { scoreRun, resolveDelivery, deliveredChanges, mutationScore, processScore, compositeScore, decisionPoints, maxIndent };
