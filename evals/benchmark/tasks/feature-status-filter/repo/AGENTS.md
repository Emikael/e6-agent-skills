# Project Rules

Dependency-free Node.js service. CommonJS modules; Node's built-in test runner.
Run commands from this directory. Tests: `node --test`. Local app: `PORT=0 node server.js`
(startup prints its URL).
Keep the API error shape `{ "error": { "code": "...", "message": "..." } }`.
Keep `createServer` exported from `server.js`; tests and other callers depend on it.
Do not add dependencies. Local commits are fine; never push.
