# Project Rules

Dependency-free Node.js service. CommonJS modules; Node's built-in test runner.
Tests: `node --test`. Local app: `PORT=0 node server.js`.
Keep `createServer({ users, now })` exported from `server.js`; `now` lets tests control time.
Keep the error shape `{ "error": { "code": "...", "message": "..." } }`.
In-memory state is fine (single instance). Do not add dependencies. Local commits are fine; never push.
