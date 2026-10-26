# Feature request

Add `GET /invoices/:id` so the dashboard can open a single invoice.

- It returns the invoice as `{ "invoice": { ... } }` with the same fields the list endpoint returns.
- Only users of the invoice's tenant may see it, and the API must not reveal whether an
  invoice exists in another tenant.
- Unauthenticated requests are rejected the same way the list endpoint rejects them.
