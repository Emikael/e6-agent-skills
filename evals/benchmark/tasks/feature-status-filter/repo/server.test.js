'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('./server');

async function withServer(run) {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('reports keep their original order when no filter is supplied', () => withServer(async base => {
  const response = await fetch(`${base}/reports`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).reports.map(report => report.id), [3, 1, 2]);
}));

test('health and unknown paths retain their contracts', () => withServer(async base => {
  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { ok: true });
  const missing = await fetch(`${base}/missing`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');
}));
