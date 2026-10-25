# Benchmark Results: e6-agent-skills vs Superpowers

Same five tasks, same pinned model and effort, every arm isolated (see the [methodology](../evals/benchmark/README.md)). Three runs:

1. **Natural mode**: the plain request. Measures whether each pack activates on its own and what it adds. e6 at the start of the third pass.
2. **Invoked mode**: each pack's prompt starts with one line asking for its workflow. Measures each pack's process once engaged.
3. **Third pass vs previous e6**: the revised e6 (team, caveman levels, inlined bootstrap rules, material-value questions) against the snapshot used in runs 1 and 2, in natural mode.

## Summary

- **On these small tasks, no pack beats the plain agent on outcome.** Hidden tests pass at or near 100% in every arm. The differences are in test quality and review quality.
- **Neither pack activated on its own** in natural mode. The bootstrap reached the model and was ignored. Asked explicitly (invoked mode), Superpowers scored best on composite and test quality, and was the only arm whose lead over the baseline excludes zero.
- **The third pass helped e6 against its own previous version:**
  - composite 0.83 vs 0.80, an interval that includes zero (win/tie/loss 6/7/2);
  - test quality 0.79 vs 0.69;
  - every hidden test passing in 100% vs 93% of runs;
  - the judge's first choice in 86% of pairs;
  - the underspecified task up from 0.72 to 0.82.

  It costs about 18% more per run.
- **Still missing in every arm:** a review step and a runtime check. Those are the next targets. A one-line bootstrap rule was not enough to trigger them.

## 1. Natural mode (75 runs)

Run `2026-10-24T22-10-57-370Z` · 2026-10-24 · Claude Code 2.1.310 · effort `medium` · mode `natural` · 5 repetition(s) × 5 task(s) × 3 arm(s) · 75/75 runs scored.

Every arm, the simulated user, and the judge used the same pinned model and effort level; the model id is recorded with the raw results, not in this repository.

### Arms

| Arm | Source | Fingerprint |
|---|---|---|
| Baseline (no skills) | none | `none` |
| e6-agent-skills | this repository @ `5e5a5295b2` | `5b751c0b8093` |
| Superpowers | obra/superpowers @ `2ce8aa15d0` | `c17827ffa911` |

### Overall scores (mean, 95% bootstrap CI)

| Dimension | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| Composite | 0.80 [0.77, 0.82] | 0.80 [0.77, 0.83] | 0.80 [0.78, 0.83] |
| Outcome (hidden tests) | 1.00 [1.00, 1.00] | 0.98 [0.97, 1.00] | 0.99 [0.98, 1.00] |
| Test quality (mutants killed) | 0.65 [0.49, 0.81] | 0.67 [0.49, 0.83] | 0.69 [0.51, 0.85] |
| Process | 0.35 [0.29, 0.42] | 0.35 [0.29, 0.42] | 0.35 [0.29, 0.42] |
| Scope & safety | 1.00 [1.00, 1.00] | 1.00 [1.00, 1.00] | 1.00 [1.00, 1.00] |

### Behavior rates

| Behavior | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| All hidden tests pass | 100% | 88% | 96% |
| Failing test before code (RED→GREEN) | 20% | 20% | 20% |
| Runtime check (HTTP tasks) | 0% | 0% | 0% |
| Tests run after last edit | 100% | 100% | 100% |
| Review evidence | 0% | 0% | 0% |
| Asked or sought approval before finishing | 0% | 0% | 0% |

### Cost and effort

| Measure | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| Agent cost per run (USD) | 0.059 | 0.081 | 0.082 |
| Wall time per run (min) | 0.2 | 0.2 | 0.3 |
| Turns per run | 4.2 | 5.6 | 7.7 |
| Output tokens per run | 1738 | 1948 | 2206 |
| Simulated-user replies per run | 0.00 | 0.00 | 0.00 |
| Subagent dispatches per run | 0.00 | 0.00 | 0.00 |

### Head-to-head (composite and outcome difference, 95% CI; paired win/tie/loss)

| Comparison | Composite Δ | Outcome Δ | W/T/L |
|---|---|---|---|
| Baseline (no skills) vs e6-agent-skills | +0.00 [-0.04, 0.04] | +0.02 [0.00, 0.03] | 3/19/3 |
| Baseline (no skills) vs Superpowers | -0.00 [-0.04, 0.03] | +0.01 [0.00, 0.02] | 1/21/3 |
| e6-agent-skills vs Superpowers | -0.01 [-0.05, 0.03] | -0.01 [-0.03, 0.01] | 1/21/3 |

### Blind review of the final diffs (1–5)

| Axis | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| Correctness | 4.76 | 4.84 | 4.76 |
| Tests | 3.00 | 3.80 | 3.64 |
| Readability | 4.16 | 4.20 | 4.44 |
| Scope | 4.76 | 4.60 | 4.56 |
| Mean rank (1 = best) | 2.40 | 1.84 | 1.76 |
| Ranked first | 12% | 44% | 44% |

### Per task (composite mean; outcome / test quality / process; cost)

| Task | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| `ambiguous-login-rate-limit` | **0.74** (100% / 46% / 25%; $0.07) | **0.68** (93% / 34% / 25%; $0.10) | **0.72** (98% / 43% / 25%; $0.10) |
| `bugfix-split-cents` | **0.83** (100% / 80% / 33%; $0.04) | **0.87** (100% / 100% / 33%; $0.07) | **0.87** (100% / 100% / 33%; $0.08) |
| `feature-status-filter` | **0.85** (100% / 100% / 25%; $0.05) | **0.85** (100% / 100% / 25%; $0.07) | **0.85** (100% / 100% / 25%; $0.07) |
| `refactor-shipping-cost` | **0.73** (100% / 0% / 67%; $0.06) | **0.73** (100% / 0% / 67%; $0.08) | **0.73** (100% / 0% / 67%; $0.08) |
| `secure-tenant-invoices` | **0.85** (100% / 100% / 25%; $0.06) | **0.85** (100% / 100% / 25%; $0.08) | **0.85** (100% / 100% / 25%; $0.08) |


## 2. Invoked mode (75 runs)

Run `2026-10-24T22-53-27-916Z` · 2026-10-24 · Claude Code 2.1.310 · effort `medium` · mode `invoked` · 5 repetition(s) × 5 task(s) × 3 arm(s) · 75/75 runs scored.

Every arm, the simulated user, and the judge used the same pinned model and effort level; the model id is recorded with the raw results, not in this repository.

Invoked mode: each pack's prompt began with one line asking for its workflow (e6-agent-skills: "Use the e6-agent-skills workflow for this task."; Superpowers: "Use the Superpowers skills workflow for this task."); the baseline prompt was unchanged.

### Arms

| Arm | Source | Fingerprint |
|---|---|---|
| Baseline (no skills) | none | `none` |
| e6-agent-skills | this repository @ `5e5a5295b2` | `5b751c0b8093` |
| Superpowers | obra/superpowers @ `2ce8aa15d0` | `c17827ffa911` |

### Overall scores (mean, 95% bootstrap CI)

| Dimension | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| Composite | 0.80 [0.77, 0.83] | 0.81 [0.79, 0.84] | 0.84 [0.81, 0.86] |
| Outcome (hidden tests) | 0.99 [0.97, 1.00] | 1.00 [1.00, 1.00] | 1.00 [1.00, 1.00] |
| Test quality (mutants killed) | 0.66 [0.49, 0.83] | 0.72 [0.57, 0.85] | 0.80 [0.67, 0.91] |
| Process | 0.35 [0.29, 0.42] | 0.35 [0.29, 0.42] | 0.37 [0.31, 0.45] |
| Scope & safety | 1.00 [1.00, 1.00] | 1.00 [1.00, 1.00] | 1.00 [1.00, 1.00] |

### Behavior rates

| Behavior | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| All hidden tests pass | 92% | 100% | 100% |
| Failing test before code (RED→GREEN) | 20% | 20% | 28% |
| Runtime check (HTTP tasks) | 0% | 0% | 0% |
| Tests run after last edit | 100% | 100% | 100% |
| Review evidence | 0% | 0% | 0% |
| Asked or sought approval before finishing | 0% | 0% | 0% |

### Cost and effort

| Measure | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| Agent cost per run (USD) | 0.058 | 0.100 | 0.110 |
| Wall time per run (min) | 0.2 | 0.3 | 0.4 |
| Turns per run | 4.1 | 7.3 | 10.8 |
| Output tokens per run | 1668 | 2273 | 2749 |
| Simulated-user replies per run | 0.00 | 0.00 | 0.00 |
| Subagent dispatches per run | 0.00 | 0.00 | 0.00 |

### Head-to-head (composite and outcome difference, 95% CI; paired win/tie/loss)

| Comparison | Composite Δ | Outcome Δ | W/T/L |
|---|---|---|---|
| Baseline (no skills) vs e6-agent-skills | -0.02 [-0.05, 0.02] | -0.01 [-0.03, 0.00] | 4/15/6 |
| Baseline (no skills) vs Superpowers | -0.04 [-0.08, -0.00] | -0.01 [-0.03, 0.00] | 2/13/10 |
| e6-agent-skills vs Superpowers | -0.02 [-0.05, 0.01] | +0.00 [0.00, 0.00] | 3/13/9 |

### Blind review of the final diffs (1–5)

| Axis | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| Correctness | 4.68 | 4.80 | 4.72 |
| Tests | 2.52 | 4.00 | 4.32 |
| Readability | 4.20 | 4.40 | 4.28 |
| Scope | 4.84 | 4.48 | 4.32 |
| Mean rank (1 = best) | 2.76 | 1.64 | 1.60 |
| Ranked first | 4% | 36% | 60% |

### Per task (composite mean; outcome / test quality / process; cost)

| Task | Baseline (no skills) | e6-agent-skills | Superpowers |
|---|---|---|---|
| `ambiguous-login-rate-limit` | **0.69** (95% / 31% / 25%; $0.07) | **0.79** (100% / 71% / 25%; $0.12) | **0.80** (100% / 74% / 25%; $0.15) |
| `bugfix-split-cents` | **0.87** (100% / 100% / 33%; $0.05) | **0.87** (100% / 100% / 33%; $0.08) | **0.88** (100% / 100% / 40%; $0.08) |
| `feature-status-filter` | **0.85** (100% / 100% / 25%; $0.05) | **0.77** (100% / 60% / 25%; $0.10) | **0.81** (100% / 73% / 30%; $0.09) |
| `refactor-shipping-cost` | **0.73** (100% / 0% / 67%; $0.06) | **0.79** (100% / 27% / 67%; $0.10) | **0.84** (100% / 53% / 67%; $0.12) |
| `secure-tenant-invoices` | **0.85** (100% / 100% / 25%; $0.06) | **0.85** (100% / 100% / 25%; $0.10) | **0.85** (100% / 100% / 25%; $0.11) |


## 3. Third pass vs previous e6 (30 runs)

Run `2026-10-25T01-18-37-105Z` · 2026-10-25 · Claude Code 2.1.310 · effort `medium` · mode `natural` · 3 repetition(s) × 5 task(s) × 2 arm(s) · 30/30 runs scored.

Every arm, the simulated user, and the judge used the same pinned model and effort level; the model id is recorded with the raw results, not in this repository.

### Arms

| Arm | Source | Fingerprint |
|---|---|---|
| e6-agent-skills | this repository @ `5195874417` | `fa539f34cc4d` |
| e6-agent-skills (previous) | this repository @ `5e5a5295b2` | `5b751c0b8093` |

### Overall scores (mean, 95% bootstrap CI)

| Dimension | e6-agent-skills | e6-agent-skills (previous) |
|---|---|---|
| Composite | 0.83 [0.80, 0.85] | 0.80 [0.77, 0.84] |
| Outcome (hidden tests) | 1.00 [1.00, 1.00] | 0.99 [0.97, 1.00] |
| Test quality (mutants killed) | 0.79 [0.65, 0.92] | 0.69 [0.47, 0.89] |
| Process | 0.35 [0.27, 0.44] | 0.35 [0.27, 0.44] |
| Scope & safety | 1.00 [1.00, 1.00] | 1.00 [1.00, 1.00] |

### Behavior rates

| Behavior | e6-agent-skills | e6-agent-skills (previous) |
|---|---|---|
| All hidden tests pass | 100% | 93% |
| Failing test before code (RED→GREEN) | 20% | 20% |
| Runtime check (HTTP tasks) | 0% | 0% |
| Tests run after last edit | 100% | 100% |
| Review evidence | 0% | 0% |
| Asked or sought approval before finishing | 7% | 0% |

### Cost and effort

| Measure | e6-agent-skills | e6-agent-skills (previous) |
|---|---|---|
| Agent cost per run (USD) | 0.097 | 0.082 |
| Wall time per run (min) | 0.3 | 0.3 |
| Turns per run | 6.2 | 5.6 |
| Output tokens per run | 2351 | 2028 |
| Simulated-user replies per run | 0.07 | 0.00 |
| Subagent dispatches per run | 0.00 | 0.00 |

### Head-to-head (composite and outcome difference, 95% CI; paired win/tie/loss)

| Comparison | Composite Δ | Outcome Δ | W/T/L |
|---|---|---|---|
| e6-agent-skills vs e6-agent-skills (previous) | +0.03 [-0.01, 0.07] | +0.01 [0.00, 0.03] | 6/7/2 |

### Blind review of the final diffs (1–5)

| Axis | e6-agent-skills | e6-agent-skills (previous) |
|---|---|---|
| Correctness | 4.71 | 4.64 |
| Tests | 4.71 | 3.21 |
| Readability | 4.21 | 4.50 |
| Scope | 4.29 | 4.64 |
| Mean rank (1 = best) | 1.14 | 1.86 |
| Ranked first | 86% | 14% |

### Per task (composite mean; outcome / test quality / process; cost)

| Task | e6-agent-skills | e6-agent-skills (previous) |
|---|---|---|
| `ambiguous-login-rate-limit` | **0.82** (100% / 86% / 25%; $0.15) | **0.72** (96% / 43% / 25%; $0.09) |
| `bugfix-split-cents` | **0.87** (100% / 100% / 33%; $0.07) | **0.87** (100% / 100% / 33%; $0.07) |
| `feature-status-filter` | **0.76** (100% / 56% / 25%; $0.09) | **0.85** (100% / 100% / 25%; $0.07) |
| `refactor-shipping-cost` | **0.84** (100% / 56% / 67%; $0.09) | **0.73** (100% / 0% / 67%; $0.09) |
| `secure-tenant-invoices` | **0.85** (100% / 100% / 25%; $0.09) | **0.85** (100% / 100% / 25%; $0.09) |


## How to read this

- **Outcome** is the fraction of hidden acceptance tests passing on the delivered code (halved if the original tests break). Agents never see these tests.
- **Test quality** runs the agent's own tests against the reference solution and against planted bugs (mutants); it is the share of mutants the tests catch, or 0 when the tests fail on the reference.
- **Process** averages: failing test before code (or a baseline run first for refactors), a runtime check on HTTP tasks, tests run after the last edit, and review evidence. It is detected from the transcript and is heuristic.
- **Scope & safety** starts at 1 and loses 0.5 for added dependencies, weakened or deleted existing tests, or a push attempt.
- **Composite** weights: outcome 0.45, testQuality 0.2, process 0.2, scope 0.15.
- Small samples: treat differences whose interval crosses 0 as inconclusive.

Methodology and threats to validity: [evals/benchmark/README.md](../evals/benchmark/README.md).
