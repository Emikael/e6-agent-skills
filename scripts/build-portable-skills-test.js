#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { crc32 } = require('./build-portable-skills.js');

const BUILDER = path.join(__dirname, 'build-portable-skills.js');
const REPO_URL = 'https://example.test/pack/blob/main';

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function fixture(t) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-portable-test-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const pack = path.join(tmp, 'pack');
  write(path.join(pack, 'skills', 'alpha', 'SKILL.md'), [
    '---',
    'name: alpha',
    'description: Use when testing.',
    '---',
    'See [shared](../../references/shared.md#rules), [local](references/local.md),',
    '[beta](../beta/SKILL.md), [web](https://example.com/x.md), and [anchor](#top).',
    '```md',
    '[code sample](../../references/unlisted.md)',
    '```',
  ].join('\n'));
  write(path.join(pack, 'skills', 'alpha', 'references', 'local.md'), 'Back to [shared](../../../references/shared.md).\n');
  write(path.join(pack, 'skills', 'alpha', 'scripts', 'helper.sh'), '#!/bin/bash\necho ok\n');
  fs.chmodSync(path.join(pack, 'skills', 'alpha', 'scripts', 'helper.sh'), 0o755);
  write(path.join(pack, 'skills', 'beta', 'SKILL.md'), '---\nname: beta\ndescription: Use when beta.\n---\nNo links.\n');
  write(path.join(pack, 'references', 'shared.md'), '# Shared\nAlso read [other](other.md) and [docs](../docs/guide.md).\n');
  write(path.join(pack, 'references', 'other.md'), '# Other\n');
  write(path.join(pack, 'references', 'unused.md'), '# Unused\n');
  write(path.join(pack, 'docs', 'guide.md'), '# Guide\n');
  return { tmp, pack, out: path.join(tmp, 'out with space') };
}

function run(f, args = []) {
  return spawnSync(process.execPath, [BUILDER, '--pack', f.pack, '--out', f.out, '--repo-url', REPO_URL, ...args], {
    cwd: f.tmp,
    encoding: 'utf8',
  });
}

function readZip(file) {
  const buffer = fs.readFileSync(file);
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end >= 0, 'end of central directory present');
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50);
    const crc = buffer.readUInt32LE(offset + 16);
    const size = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const local = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = buffer.readUInt16LE(local + 26);
    const data = zlib.inflateRawSync(buffer.subarray(local + 30 + localNameLength, local + 30 + localNameLength + size));
    assert.equal(crc32(data), crc, `${name} CRC matches`);
    entries.set(name, data.toString('utf8'));
    offset += 46 + nameLength;
  }
  return entries;
}

test('vendors shared references transitively and rewrites links', t => {
  const f = fixture(t);
  const result = run(f);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const skill = fs.readFileSync(path.join(f.out, 'alpha', 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('[shared](references/shared.md#rules)'));
  assert.ok(skill.includes('[local](references/local.md)'));
  assert.ok(skill.includes(`[beta](${REPO_URL}/skills/beta/SKILL.md)`));
  assert.ok(skill.includes('[web](https://example.com/x.md)'));
  assert.ok(skill.includes('[anchor](#top)'));
  assert.ok(skill.includes('[code sample](../../references/unlisted.md)'), 'fenced code is untouched');
  assert.equal(fs.readFileSync(path.join(f.out, 'alpha', 'references', 'local.md'), 'utf8'), 'Back to [shared](shared.md).\n');
  const shared = fs.readFileSync(path.join(f.out, 'alpha', 'references', 'shared.md'), 'utf8');
  assert.ok(shared.includes('[other](other.md)'));
  assert.ok(shared.includes(`[docs](${REPO_URL}/docs/guide.md)`));
  assert.ok(fs.existsSync(path.join(f.out, 'alpha', 'references', 'other.md')));
  assert.ok(!fs.existsSync(path.join(f.out, 'alpha', 'references', 'unused.md')), 'only linked references are vendored');
  assert.ok(!fs.existsSync(path.join(f.out, 'beta', 'references')));
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(path.join(f.out, 'alpha', 'scripts', 'helper.sh')).mode & 0o111, 0o111, 'scripts stay executable');
  }
  assert.ok(!fs.existsSync(path.join(f.pack, 'skills', 'alpha', 'references', 'shared.md')), 'pack is unchanged');
});

test('writes one ZIP per skill with the skill folder at the top level', t => {
  const f = fixture(t);
  const result = run(f, ['--zip', '--skills', 'alpha']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(!fs.existsSync(path.join(f.out, 'beta')), 'only selected skills are built');
  const entries = readZip(path.join(f.out, 'alpha.zip'));
  assert.deepEqual([...entries.keys()].sort(), [
    'alpha/SKILL.md',
    'alpha/references/local.md',
    'alpha/references/other.md',
    'alpha/references/shared.md',
    'alpha/scripts/helper.sh',
  ]);
  assert.equal(entries.get('alpha/SKILL.md'), fs.readFileSync(path.join(f.out, 'alpha', 'SKILL.md'), 'utf8'));
});

test('refuses to overwrite output without --force and replaces it with --force', t => {
  const f = fixture(t);
  assert.equal(run(f).status, 0);
  write(path.join(f.out, 'alpha', 'stale.md'), 'stale');
  const refused = run(f);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /--force/);
  assert.equal(run(f, ['--force']).status, 0);
  assert.ok(!fs.existsSync(path.join(f.out, 'alpha', 'stale.md')));
});

test('rejects unknown skills and reference name collisions', t => {
  const f = fixture(t);
  const unknown = run(f, ['--skills', 'missing']);
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown skill/);
  write(path.join(f.pack, 'skills', 'alpha', 'references', 'shared.md'), 'local copy');
  const collision = run(f, ['--skills', 'alpha']);
  assert.equal(collision.status, 2);
  assert.match(collision.stderr, /collides/);
});

test('builds the real pack with every link resolving inside each skill', t => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-portable-real-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [BUILDER, '--out', out, '--force'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const contract = path.join(out, 'using-e6-agent-skills', 'references', 'workflow-contract.md');
  assert.ok(fs.existsSync(contract), 'coordinator carries the workflow contract');
});
