# Answer key (for the simulated user)

- Allowed values are exactly `open` and `closed`, case-sensitive. `OPEN` is invalid.
- An empty `status=` is an explicit value and must return 400 `INVALID_STATUS`.
- Filtering preserves the original record order; no sorting.
- The error message can be any short human-readable sentence.
- No pagination, no other filters, no UI. Tests plus a real local HTTP check are expected.
