'use strict';

const http = require('node:http');

const reports = [
  { id: 3, status: 'open', title: 'Third report' },
  { id: 1, status: 'closed', title: 'First report' },
  { id: 2, status: 'open', title: 'Second report' },
];

const STATUSES = new Set(['open', 'closed']);

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/health') {
      res.end(JSON.stringify({ ok: true }));
    } else if (url.pathname === '/reports') {
      if (!url.searchParams.has('status')) {
        res.end(JSON.stringify({ reports }));
        return;
      }
      const status = url.searchParams.get('status');
      if (!STATUSES.has(status)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: { code: 'INVALID_STATUS', message: 'status must be "open" or "closed"' } }));
        return;
      }
      res.end(JSON.stringify({ reports: reports.filter(report => report.status === status) }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));
    }
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
    process.stdout.write(`Ready: http://127.0.0.1:${server.address().port}\n`);
  });
}

module.exports = { createServer };
