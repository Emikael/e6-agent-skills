# Answer key (for the simulated user)

- Another tenant's invoice and a nonexistent id both return 404 with the same error code
  (`NOT_FOUND`), so existence is not revealed.
- Non-numeric ids also return 404.
- Missing or invalid token: 401 `UNAUTHORIZED`, exactly like `GET /invoices`.
- Response fields: `id`, `number`, `amount`, `status` only. Never `costBasis`, `internalNotes`, or `tenantId`.
