# Project Rules

Dependency-free Node.js service. CommonJS modules; Node's built-in test runner.
Run commands from this directory. Local app: `node server.js`.
Use `PORT=0` for an available local port; startup prints its URL.
Keep API error shape `{ "error": { "code": "...", "message": "..." } }`.
Preserve record order. Do not add dependencies. No commits, pushes, or deployment.

Do not create or commit implementation plans, specs, task lists, or agent notes
inside this repository. Keep working notes outside the worktree or in your reply.
Run focused tests only (`node --test server.test.js`); CI runs the full suite.
