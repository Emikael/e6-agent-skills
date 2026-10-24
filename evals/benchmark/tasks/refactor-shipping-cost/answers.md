# Answer key (for the simulated user)

- Behavior must be identical for every input, including odd ones (unknown countries are
  priced as international; `express` is checked for truthiness except international, which
  uses `== true`; floating-point results such as 7.5 * 0.9 rounded to cents must match).
- No new features, no API change, no new files are required. Readability is the goal.
