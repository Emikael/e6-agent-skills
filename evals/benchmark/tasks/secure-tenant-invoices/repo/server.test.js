'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('./server');

test('lists only the caller tenant invoices', async () => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/invoices`, {
      headers: { authorization: 'Bearer token-acme-ann' },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.invoices.map(invoice => invoice.number), ['ACME-001', 'ACME-002']);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
