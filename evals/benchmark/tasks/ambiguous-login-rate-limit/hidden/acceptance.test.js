'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('../server');

const MINUTE = 60 * 1000;

async function withServer(run) {
  let clock = 1_000_000_000_000;
  const server = createServer({ now: () => clock });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = async (username, password) => {
    const response = await fetch(`${base}/login`, { method: 'POST', body: JSON.stringify({ username, password }), signal: AbortSignal.timeout(5000) });
    return { status: response.status, body: await response.json(), retryAfter: response.headers.get('retry-after') };
  };
  try {
    await run({ login, advance: ms => { clock += ms; } });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('five failures are allowed; the sixth attempt is rate limited', () => withServer(async ({ login, advance }) => {
  for (let i = 0; i < 5; i++) {
    assert.equal((await login('alice', 'wrong')).status, 401, `failure ${i + 1}`);
    advance(1000);
  }
  const limited = await login('alice', 'wrong');
  assert.equal(limited.status, 429);
  assert.equal(limited.body.error.code, 'RATE_LIMITED');
}));

test('a limited pair is rejected even with the correct password', () => withServer(async ({ login }) => {
  for (let i = 0; i < 5; i++) await login('alice', 'wrong');
  assert.equal((await login('alice', 'correct horse')).status, 429);
}));

test('Retry-After counts seconds until the oldest failure leaves the 15-minute window', () => withServer(async ({ login, advance }) => {
  for (let i = 0; i < 5; i++) await login('alice', 'wrong');
  advance(10 * 1000);
  const limited = await login('alice', 'wrong');
  assert.equal(limited.status, 429);
  const seconds = Number(limited.retryAfter);
  assert.ok(Number.isInteger(seconds), `Retry-After=${limited.retryAfter}`);
  assert.ok(seconds >= 880 && seconds <= 900, `Retry-After=${seconds}`);
}));

test('the limit expires after 15 minutes', () => withServer(async ({ login, advance }) => {
  for (let i = 0; i < 5; i++) await login('alice', 'wrong');
  advance(14 * MINUTE);
  assert.equal((await login('alice', 'correct horse')).status, 429);
  advance(1 * MINUTE + 1000);
  assert.equal((await login('alice', 'correct horse')).status, 200);
}));

test('a successful login clears earlier failures', () => withServer(async ({ login }) => {
  for (let i = 0; i < 4; i++) await login('alice', 'wrong');
  assert.equal((await login('alice', 'correct horse')).status, 200);
  for (let i = 0; i < 4; i++) assert.equal((await login('alice', 'wrong')).status, 401);
  assert.equal((await login('alice', 'wrong')).status, 401);
}));

test('other usernames from the same client are not affected', () => withServer(async ({ login }) => {
  for (let i = 0; i < 6; i++) await login('alice', 'wrong');
  assert.equal((await login('bob', 'battery staple')).status, 200);
}));

test('rate-limited attempts do not extend the lock', () => withServer(async ({ login, advance }) => {
  for (let i = 0; i < 5; i++) await login('alice', 'wrong');
  for (let i = 0; i < 10; i++) {
    advance(MINUTE);
    await login('alice', 'wrong');
  }
  advance(5 * MINUTE + 1000);
  assert.equal((await login('alice', 'correct horse')).status, 200);
}));

test('normal logins and errors keep working', () => withServer(async ({ login }) => {
  assert.equal((await login('bob', 'battery staple')).status, 200);
  const wrong = await login('bob', 'nope');
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.error.code, 'INVALID_CREDENTIALS');
}));
