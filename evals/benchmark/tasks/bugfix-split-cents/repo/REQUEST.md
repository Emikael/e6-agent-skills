# Bug report: installments lose cents

Customers paying $1.00 in 3 installments are charged $0.99 in total.
`splitCents(100, 3)` returns `[33, 33, 33]`, so one cent disappears.

Expected behavior:

- The installments always add up exactly to `totalCents`.
- Leftover cents go to the earliest installments: `splitCents(100, 3)` is `[34, 33, 33]`
  and `splitCents(101, 3)` is `[34, 34, 33]`.
- `parts` must be a positive integer; anything else throws a `RangeError`.

Please fix the bug.
