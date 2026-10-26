# Invoices API

Multi-tenant invoice service. Authenticate with `Authorization: Bearer <token>`.
`GET /invoices` lists the caller's tenant invoices. Run checks with `node --test`;
run locally with `PORT=0 node server.js` (demo tokens are in `data.js`).
