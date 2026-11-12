#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { policyViolations } = require('./build-directory-plugin.js');

const BUILDER = path.join(__dirname, 'build-directory-plugin.js');
const REPO_URL = 'https://example.test/pack/blob/main';
const README = `# Pack\n\n${'word '.repeat(45)}\n\nSee [guide](guide.md) and [router](../skills/alpha/SKILL.md).\n`;

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function fixture(t) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-directory-test-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const pack = path.join(tmp, 'pack');
  write(path.join(pack, '.claude-plugin', 'plugin.json'), JSON.stringify({
    name: 'pack', version: '1.2.3', description: 'A pack.', license: 'MIT',
    commands: ['./.claude/commands', './commands'], skills: './skills', experimental: { evals: 'evals' },
  }));
  write(path.join(pack, '.claude-plugin', 'icon.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  write(path.join(pack, 'LICENSE'), 'MIT\n');
  write(path.join(pack, 'docs', 'claude-directory-readme.md'), README);
  write(path.join(pack, 'docs', 'guide.md'), '# Guide\n');
  write(path.join(pack, 'hooks', 'hooks.json'), '{"hooks":{}}');
  write(path.join(pack, 'hooks', 'NOTES.md'), '# Notes\n');
  write(path.join(pack, 'scripts', 'tool.js'), '#!/usr/bin/env node\n');
  write(path.join(pack, 'skills', 'alpha', 'SKILL.md'),
    '---\nname: alpha\ndescription: Use when testing.\n---\nSee [shared](../../references/shared.md#rules), [notes](../../hooks/NOTES.md), and [web](https://example.com).\n');
  write(path.join(pack, 'references', 'shared.md'), '# Shared\n');
  write(path.join(pack, 'agents', 'lead.md'), '---\nname: lead\ndescription: Leads.\n---\nBody.\n');
  write(path.join(pack, '.claude', 'commands', 'build.md'), '---\ndescription: Build.\n---\nUse `alpha`.\n');
  return { pack, out: path.join(tmp, 'out') };
}

function build({ pack, out }, ...extra) {
  return spawnSync(process.execPath, [BUILDER, '--pack', pack, '--out', out, '--repo-url', REPO_URL, ...extra], { encoding: 'utf8' });
}

function tree(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? tree(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  }).sort();
}

test('builds a hook-free edition with only allowed file types', t => {
  const paths = fixture(t);
  const result = build(paths);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(tree(paths.out), [
    '.claude-plugin/icon.png',
    '.claude-plugin/plugin.json',
    'LICENSE',
    'README.md',
    'agents/lead.md',
    'commands/build.md',
    'references/shared.md',
    'skills/alpha/SKILL.md',
  ]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(paths.out, '.claude-plugin', 'plugin.json'), 'utf8')), {
    name: 'pack', version: '1.2.3', description: 'A pack.', license: 'MIT',
  });
});

test('keeps in-edition links relative and points the rest at the repository', t => {
  const paths = fixture(t);
  assert.equal(build(paths).status, 0);
  const skill = fs.readFileSync(path.join(paths.out, 'skills', 'alpha', 'SKILL.md'), 'utf8');
  assert.match(skill, /\[shared\]\(\.\.\/\.\.\/references\/shared\.md#rules\)/);
  assert.match(skill, /\[notes\]\(https:\/\/example\.test\/pack\/blob\/main\/hooks\/NOTES\.md\)/);
  const readme = fs.readFileSync(path.join(paths.out, 'README.md'), 'utf8');
  assert.match(readme, /\[guide\]\(https:\/\/example\.test\/pack\/blob\/main\/docs\/guide\.md\)/);
  assert.match(readme, /\[router\]\(skills\/alpha\/SKILL\.md\)/);
});

test('fails when a skill ships a script', t => {
  const paths = fixture(t);
  write(path.join(paths.pack, 'skills', 'alpha', 'scripts', 'helper.sh'), '#!/bin/bash\n');
  const result = build(paths);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /skills\/alpha\/scripts\/helper\.sh: file type not allowed/);
});

test('refuses a non-empty output directory unless forced, and keeps .git when forced', t => {
  const paths = fixture(t);
  write(path.join(paths.out, '.git'), 'gitdir: elsewhere\n');
  write(path.join(paths.out, 'stale.md'), 'old\n');
  assert.equal(build(paths).status, 2);
  assert.equal(build(paths, '--force').status, 0);
  assert.ok(fs.existsSync(path.join(paths.out, '.git')));
  assert.ok(!fs.existsSync(path.join(paths.out, 'stale.md')));
});

test('policyViolations reports each directory rule', t => {
  const paths = fixture(t);
  assert.equal(build(paths).status, 0);
  assert.deepEqual(policyViolations(paths.out), []);

  write(path.join(paths.out, 'hooks', 'hooks.json'), '{}');
  write(path.join(paths.out, 'skills', 'alpha', 'run.md'), '#!/bin/sh\n');
  write(path.join(paths.out, 'skills', 'alpha', 'tool.py'), 'print(1)\n');
  write(path.join(paths.out, 'skills', 'alpha', 'nul.md'), 'a\0b');
  write(path.join(paths.out, 'commands', 'ship.md'), '---\ndescription: Ship.\nallowed-tools: Read, Bash(git:*)\n---\nStatus: !`git status`\n');
  write(path.join(paths.out, 'commands', 'read.md'), '---\ndescription: Read.\nallowed-tools: [Read, Grep]\n---\nBody.\n');
  write(path.join(paths.out, 'README.md'), 'Too short.\n');
  const manifest = path.join(paths.out, '.claude-plugin', 'plugin.json');
  write(manifest, JSON.stringify({ ...JSON.parse(fs.readFileSync(manifest, 'utf8')), hooks: './hooks/hooks.json' }));

  const violations = policyViolations(paths.out).join('\n');
  for (const expected of [
    /hooks\/hooks\.json: hooks are not allowed/,
    /skills\/alpha\/run\.md: starts with #!/,
    /skills\/alpha\/tool\.py: file type not allowed/,
    /skills\/alpha\/nul\.md: not UTF-8 text/,
    /commands\/ship\.md: allowed-tools beyond Read\/Grep\/Glob\/LS \(Bash\(git:\*\)\)/,
    /commands\/ship\.md: inline shell/,
    /README\.md: fewer than 40 words/,
    /plugin\.json: "hooks" is not allowed/,
  ]) assert.match(violations, expected);
  assert.doesNotMatch(violations, /commands\/read\.md/);
});

test('the real pack builds a compliant edition', t => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-directory-real-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [BUILDER, '--out', out, '--force'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(out, 'skills', 'using-e6-agent-skills', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(out, 'hooks')));
});
