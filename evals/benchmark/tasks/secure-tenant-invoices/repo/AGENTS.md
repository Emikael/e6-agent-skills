# Project Rules

Dependency-free Node.js service. CommonJS modules; Node's built-in test runner.
Tests: `node --test`. Local app: `PORT=0 node server.js`.
Keep `createServer({ invoices, tokens })` exported from `server.js`.
Error shape: `{ "error": { "code": "...", "message": "..." } }`.
Tenants must never see each other's data. Do not add dependencies. Local commits are fine; never push.
