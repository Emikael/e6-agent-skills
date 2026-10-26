#!/bin/bash
# Session bootstrap registration, portable output, and installed-layout tests.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_ROOT="$(dirname "$SCRIPT_DIR")" node <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = process.env.HOOK_ROOT;

function fixture(t, withJq = false) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-hook-test-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const pack = path.join(tmp, 'installed pack with spaces');
  const hook = path.join(pack, 'hooks', 'session-start.sh');
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.copyFileSync(path.join(root, 'hooks', 'session-start.sh'), hook);
  const bootstrap = path.join(pack, 'references', 'workflow-bootstrap.md');
  fs.mkdirSync(path.dirname(bootstrap), { recursive: true });
  const content = '# e6 workflow\nHonor host/user > repo > e6.\nQuotes: "x"; slash: \\; tab:\t; CR:\r; control:\u0001\nUnicode: é →\n';
  fs.writeFileSync(bootstrap, content);
  const router = path.join(pack, 'skills', 'using-e6-agent-skills', 'SKILL.md');
  fs.mkdirSync(path.dirname(router), { recursive: true });
  fs.writeFileSync(router, 'FULL_ROUTER_SENTINEL_DO_NOT_INJECT');
  const bin = path.join(tmp, 'bin');
  fs.mkdirSync(bin);
  for (const tool of ['cat', 'dirname']) {
    const located = spawnSync('/bin/bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' });
    assert.equal(located.status, 0);
    fs.symlinkSync(located.stdout.trim(), path.join(bin, tool));
  }
  if (withJq) fs.writeFileSync(path.join(bin, 'jq'), '#!/bin/bash\nexit 99\n', { mode: 0o755 });
  return { tmp, pack, hook, bootstrap, content, bin };
}

function runRaw(f, env = {}) {
  const base = { ...process.env, PATH: f.bin };
  delete base.CURSOR_PLUGIN_ROOT;
  const result = spawnSync('/bin/bash', [f.hook], {
    cwd: f.tmp,
    env: { ...base, ...env },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

function run(f) {
  const payload = runRaw(f);
  assert.equal(payload.hookSpecificOutput.hookEventName, 'SessionStart');
  return payload.hookSpecificOutput.additionalContext;
}

test('Claude plugin registers bootstrap for startup, resume, clear, compact, and fork', () => {
  const file = path.join(root, 'hooks', 'hooks.json');
  assert.ok(fs.existsSync(file), 'hooks/hooks.json must register the bootstrap');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const registrations = config.hooks.SessionStart;
  assert.equal(registrations.length, 1, 'register one compact injection');
  const registration = registrations[0];
  for (const event of ['startup', 'resume', 'clear', 'compact', 'fork']) {
    assert.match(event, new RegExp(`^(?:${registration.matcher})$`));
  }
  assert.equal(registration.hooks.length, 1);
  assert.equal(registration.hooks[0].type, 'command');
  assert.match(registration.hooks[0].command, /bash "\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/session-start\.sh"/);
  assert.notEqual(registration.hooks[0].async, true);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.hooks, undefined, 'do not register the default hooks file twice');
});

for (const withJq of [false, true]) {
  test(`injects compact bootstrap from installed path with spaces, jq ${withJq ? 'present' : 'absent'}`, t => {
    const f = fixture(t, withJq);
    const context = run(f);
    assert.ok(context.includes(f.content.trimEnd()), 'canonical bootstrap must reach the model');
    assert.ok(context.includes(f.pack), 'identify installed pack path');
    assert.ok(context.includes(f.bootstrap), 'identify canonical bootstrap path');
    assert.ok(!context.includes('FULL_ROUTER_SENTINEL_DO_NOT_INJECT'));
    assert.ok(!context.includes('Install jq'));
    assert.ok(context.length < 1500, 'bootstrap must remain compact');
  });
}

test('Cursor plugin registers the same bootstrap through its own hooks file', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.cursor-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.skills, './skills/');
  const hooksFile = path.join(root, manifest.hooks);
  assert.ok(fs.existsSync(hooksFile), `${manifest.hooks} must exist`);
  const config = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
  assert.equal(config.hooks.sessionStart.length, 1, 'register one compact injection');
  assert.match(config.hooks.sessionStart[0].command, /hooks\/session-start\.sh/);
});

test('emits Cursor additional_context when CURSOR_PLUGIN_ROOT is set', t => {
  const f = fixture(t);
  const payload = runRaw(f, { CURSOR_PLUGIN_ROOT: f.pack, CLAUDE_PLUGIN_ROOT: f.pack });
  assert.equal(payload.hookSpecificOutput, undefined, 'emit only the field Cursor consumes');
  assert.ok(payload.additional_context.includes(f.content.trimEnd()));
  assert.ok(payload.additional_context.includes(f.pack));
  assert.ok(payload.additional_context.length < 1500, 'bootstrap must remain compact');
});

test('missing bootstrap gives usable routing guidance without jq', t => {
  const f = fixture(t);
  fs.rmSync(f.bootstrap);
  const context = run(f);
  assert.match(context, /workflow bootstrap.*not found/i);
  assert.ok(context.includes('using-e6-agent-skills'));
  assert.ok(context.includes(f.pack));
});
NODE
