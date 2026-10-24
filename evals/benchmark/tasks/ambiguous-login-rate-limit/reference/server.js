'use strict';

const http = require('node:http');

const DEFAULT_USERS = { alice: 'correct horse', bob: 'battery staple' };
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(payload));
}

// `now` is injectable so tests can control time.
function createServer({ users = DEFAULT_USERS, now = () => Date.now() } = {}) {
  const failures = new Map();
  const recent = (key, at) => (failures.get(key) || []).filter(time => at - time < WINDOW_MS);
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname === '/login') {
      let credentials;
      try {
        credentials = await readJson(req);
      } catch {
        send(res, 400, { error: { code: 'INVALID_JSON', message: 'Body must be JSON' } });
        return;
      }
      const { username, password } = credentials;
      const key = `${req.socket.remoteAddress}\u0000${username}`;
      const at = now();
      const history = recent(key, at);
      if (history.length >= MAX_FAILURES) {
        const retryAfter = Math.ceil((history[0] + WINDOW_MS - at) / 1000);
        send(res, 429, { error: { code: 'RATE_LIMITED', message: 'Too many failed attempts' } }, { 'Retry-After': String(retryAfter) });
        return;
      }
      if (typeof username === 'string' && users[username] === password) {
        failures.delete(key);
        send(res, 200, { ok: true, username });
      } else {
        failures.set(key, [...history, at]);
        send(res, 401, { error: { code: 'INVALID_CREDENTIALS', message: 'Wrong username or password' } });
      }
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
