'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('../server');

async function get(path, token) {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { headers, signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    return { status: response.status, body, text };
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('returns the caller tenant invoice with the list fields only', async () => {
  const { status, body, text } = await get('/invoices/2', 'token-acme-ann');
  assert.equal(status, 200);
  assert.deepEqual(body.invoice, { id: 2, number: 'ACME-002', amount: 450, status: 'open' });
  assert.ok(!text.includes('costBasis') && !text.includes('internalNotes') && !text.includes('tenantId'));
});

test('another tenant invoice is indistinguishable from a missing one', async () => {
  const other = await get('/invoices/3', 'token-acme-ann');
  const missing = await get('/invoices/999', 'token-acme-ann');
  assert.equal(other.status, 404);
  assert.equal(missing.status, 404);
  assert.equal(other.body.error.code, missing.body.error.code);
  assert.ok(!other.text.includes('GLX-001') && !other.text.includes('globex'));
});

test('the owning tenant can read its own invoice', async () => {
  const { status, body } = await get('/invoices/3', 'token-globex-gus');
  assert.equal(status, 200);
  assert.equal(body.invoice.number, 'GLX-001');
});

test('missing or invalid tokens are rejected like the list endpoint', async () => {
  for (const token of [undefined, 'bogus']) {
    const single = await get('/invoices/1', token);
    const list = await get('/invoices', token);
    assert.equal(single.status, 401);
    assert.equal(single.body.error.code, list.body.error.code);
    assert.ok(!single.text.includes('ACME-001'));
  }
});

test('non-numeric ids do not leak or crash', async () => {
  const { status, text } = await get('/invoices/abc', 'token-acme-ann');
  assert.equal(status, 404);
  assert.ok(!text.includes('ACME'));
});

test('the list endpoint is unchanged', async () => {
  const { status, body } = await get('/invoices', 'token-acme-ann');
  assert.equal(status, 200);
  assert.deepEqual(body.invoices.map(invoice => invoice.id), [1, 2]);
  assert.deepEqual(Object.keys(body.invoices[0]).sort(), ['amount', 'id', 'number', 'status']);
});
