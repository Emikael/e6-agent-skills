#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const INSTALLER = path.join(__dirname, 'install-workflow-bootstrap.js');
const START = '<!-- e6-workflow-bootstrap:start -->';
const END = '<!-- e6-workflow-bootstrap:end -->';

function fixture(t) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-bootstrap-install-test-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const project = path.join(tmp, 'user project');
  const pack = path.join(tmp, 'installed pack');
  fs.mkdirSync(project);
  fs.mkdirSync(path.join(pack, 'references'), { recursive: true });
  fs.mkdirSync(path.join(pack, 'skills', 'using-e6-agent-skills'), { recursive: true });
  fs.writeFileSync(path.join(pack, 'references', 'workflow-bootstrap.md'), '# e6 workflow\nUse e6 for engineering work. Host/user > repo > e6.\n');
  fs.writeFileSync(path.join(pack, 'skills', 'using-e6-agent-skills', 'SKILL.md'), 'router fixture');
  return { tmp, project, pack, file: path.join(project, 'AGENTS.md') };
}

function run(f, args = [], host = 'codex') {
  return spawnSync(process.execPath, [INSTALLER, '--project', f.project, '--pack', f.pack, '--host', host, ...args], {
    cwd: f.tmp,
    encoding: 'utf8',
  });
}

test('defaults to dry run and requires explicit write', t => {
  const f = fixture(t);
  const result = run(f);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /dry.run/i);
  assert.ok(!fs.existsSync(f.file), 'default must not mutate project');
  assert.ok(result.stdout.includes(f.pack));
  assert.ok(result.stdout.includes(START));
});

test('preserves existing content and installs exactly one idempotent block', t => {
  const f = fixture(t);
  const original = '# My project\r\nKeep these exact bytes.\r\n';
  fs.writeFileSync(f.file, original);
  const first = run(f, ['--write']);
  assert.equal(first.status, 0, first.stdout + first.stderr);
  const installed = fs.readFileSync(f.file, 'utf8');
  assert.ok(installed.startsWith(original));
  assert.equal(installed.split(START).length, 2);
  assert.ok(installed.includes(f.pack));
  assert.ok(installed.includes(path.join(f.pack, 'skills', 'using-e6-agent-skills', 'SKILL.md')));
  assert.equal(run(f, ['--write']).status, 0);
  assert.equal(fs.readFileSync(f.file, 'utf8'), installed);
  assert.equal(run(f, ['--check']).status, 0);
});

test('check reports absent or stale bootstrap without writing', t => {
  const f = fixture(t);
  assert.equal(run(f, ['--check']).status, 1);
  assert.ok(!fs.existsSync(f.file));
  assert.equal(run(f, ['--write']).status, 0);
  const installed = fs.readFileSync(f.file, 'utf8');
  fs.appendFileSync(path.join(f.pack, 'references', 'workflow-bootstrap.md'), 'Updated workflow.\n');
  assert.equal(run(f, ['--check']).status, 1);
  assert.equal(fs.readFileSync(f.file, 'utf8'), installed);
});

test('updates marked block while preserving content before and after it', t => {
  const f = fixture(t);
  fs.writeFileSync(f.file, `before\n${START}\nold instructions\n${END}\nafter\n`);
  const result = run(f, ['--write']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const installed = fs.readFileSync(f.file, 'utf8');
  assert.ok(installed.startsWith(`before\n${START}`));
  assert.ok(installed.endsWith(`${END}\nafter\n`));
  assert.ok(!installed.includes('old instructions'));
});

for (const [host, filename] of [['claude', 'CLAUDE.md'], ['opencode', 'AGENTS.md'], ['gemini', 'GEMINI.md'], ['grok', 'AGENTS.md']]) {
  test(`writes ${filename} for ${host}`, t => {
    const f = fixture(t);
    const result = run(f, ['--write'], host);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const content = fs.readFileSync(path.join(f.project, filename), 'utf8');
    assert.ok(content.includes('Use e6 for engineering work'));
    assert.ok(!content.includes('Repository Overview'), 'do not copy contributor AGENTS.md');
  });
}

test('writes an always-applied Cursor rule and keeps an existing rule header', t => {
  const f = fixture(t);
  const rule = path.join(f.project, '.cursor', 'rules', 'e6-workflow.mdc');
  const result = run(f, ['--write'], 'cursor');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const content = fs.readFileSync(rule, 'utf8');
  assert.match(content, /^---\ndescription: .+\nalwaysApply: true\n---\n/);
  assert.ok(content.includes('Use e6 for engineering work'));
  assert.equal(run(f, ['--check'], 'cursor').status, 0);

  const customized = content.replace('alwaysApply: true', 'alwaysApply: false');
  fs.writeFileSync(rule, customized);
  fs.appendFileSync(path.join(f.pack, 'references', 'workflow-bootstrap.md'), 'Updated workflow.\n');
  assert.equal(run(f, ['--write'], 'cursor').status, 0);
  const updated = fs.readFileSync(rule, 'utf8');
  assert.ok(updated.includes('alwaysApply: false'), 'user-edited frontmatter is preserved');
  assert.ok(updated.includes('Updated workflow.'));
  assert.equal(updated.split(START).length, 2);
});

test('rejects malformed or duplicate managed markers without changing content', t => {
  const f = fixture(t);
  for (const content of [`original\n${START}\nunclosed`, `${END}\n${START}`, `${START}\nx\n${END}\n${START}\ny\n${END}`]) {
    fs.writeFileSync(f.file, content);
    const result = run(f, ['--write']);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /marker/i);
    assert.equal(fs.readFileSync(f.file, 'utf8'), content);
  }
});

test('requires explicit project and pack and rejects conflicting modes', t => {
  const f = fixture(t);
  for (const args of [[], ['--project', f.project], ['--project', f.project, '--pack', f.pack, '--host', 'codex', '--check', '--write']]) {
    const result = spawnSync(process.execPath, [INSTALLER, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.ok(!fs.existsSync(f.file));
  }
});
