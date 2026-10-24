'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('./server');

async function login(base, body) {
  const response = await fetch(`${base}/login`, { method: 'POST', body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

test('valid and invalid credentials', async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await login(base, { username: 'alice', password: 'correct horse' })).status, 200);
    assert.equal((await login(base, { username: 'alice', password: 'nope' })).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
