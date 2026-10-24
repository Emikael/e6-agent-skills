'use strict';

const http = require('node:http');
const { INVOICES, TOKENS } = require('./data');

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function authenticate(req, tokens) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  return match ? tokens[match[1]] || null : null;
}

const toPublic = ({ id, number, amount, status }) => ({ id, number, amount, status });

function createServer({ invoices = INVOICES, tokens = TOKENS } = {}) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const single = /^\/invoices\/([^/]+)$/.exec(url.pathname);
    if (req.method === 'GET' && (url.pathname === '/invoices' || single)) {
      const user = authenticate(req, tokens);
      if (!user) {
        send(res, 401, { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
        return;
      }
      if (single) {
        const invoice = invoices.find(item => String(item.id) === single[1] && item.tenantId === user.tenantId);
        if (!invoice) {
          send(res, 404, { error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
          return;
        }
        send(res, 200, { invoice: toPublic(invoice) });
        return;
      }
      const list = invoices.filter(invoice => invoice.tenantId === user.tenantId).map(toPublic);
      send(res, 200, { invoices: list });
      return;
    }
    send(res, 404, { error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
    process.stdout.write(`Ready: http://127.0.0.1:${server.address().port}\n`);
  });
}

module.exports = { createServer };
