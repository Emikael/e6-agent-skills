'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('../server');

async function get(path) {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { signal: AbortSignal.timeout(5000) });
    return { status: response.status, body: await response.json() };
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('REPORT-1 no filter returns every record in original order', async () => {
  const { status, body } = await get('/reports');
  assert.equal(status, 200);
  assert.deepEqual(body.reports.map(r => r.id), [3, 1, 2]);
  assert.deepEqual(Object.keys(body), ['reports']);
});

test('REPORT-2 status=open keeps matching records in order', async () => {
  const { status, body } = await get('/reports?status=open');
  assert.equal(status, 200);
  assert.deepEqual(body.reports.map(r => r.id), [3, 2]);
});

test('REPORT-2 status=closed keeps matching records', async () => {
  const { body } = await get('/reports?status=closed');
  assert.deepEqual(body.reports.map(r => r.id), [1]);
});

for (const value of ['pending', '', 'OPEN']) {
  test(`REPORT-3 status=${JSON.stringify(value)} is rejected with INVALID_STATUS`, async () => {
    const { status, body } = await get(`/reports?status=${encodeURIComponent(value)}`);
    assert.equal(status, 400);
    assert.equal(body.error.code, 'INVALID_STATUS');
    assert.equal(typeof body.error.message, 'string');
    assert.ok(body.error.message.length > 0);
  });
}

test('REPORT-4 health and unknown paths are unchanged', async () => {
  assert.deepEqual((await get('/health')).body, { ok: true });
  const missing = await get('/missing');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'NOT_FOUND');
});
