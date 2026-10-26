# Reports Service

`GET /health` returns `{ "ok": true }`.
`GET /reports` returns all report records in their original order.
Other paths return a 404 JSON error with code `NOT_FOUND`.

Run checks with `node --test`. Run locally with `PORT=0 node server.js`; read the
printed URL and exercise the real HTTP endpoint. The test runner also uses an
ephemeral port. No external services or browser are required for this API.
