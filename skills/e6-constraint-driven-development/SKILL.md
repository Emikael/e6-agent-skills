---
name: e6-constraint-driven-development
description: Use when a project has no written quality standards, when setting up constraints or quality gates for coverage, security, accessibility, performance, or architecture, or when choosing enforcement thresholds. Use when agents add @ts-ignore, silence checks, skip tests, weaken assertions, or lower budgets to get green, or when agent-written code exceeds review capacity.
---

# Constraint-Driven Development

## Overview

Record the project's quality bar and prove its checks enforce it. A report is a measurement; a gate also needs a threshold, a failure policy, and an observed failing exit.

## When to Use

- Quality standards or merge-blocking checks are missing or ambiguous.
- Agents weaken checks to finish work.
- Coverage, performance, or accessibility budgets need a durable policy.

If `CONSTRAINTS.md` exists, read and follow it rather than re-running setup. For a throwaway spike, apply the floor proportionately.

**Not for:** building or fixing pipelines → `e6-ci-cd-and-automation`; reviewing a PR or diff → `e6-code-review-and-quality`.

## Process

### 1. Detect before asking

Follow `e6-context-engineering`. Inspect rules, manifests, lockfiles, test/coverage/lint/type configuration, CI, and launch commands. Measure baselines from existing output or one focused run. Do not ask for repository facts.

Then settle what the repository cannot tell you: which dimensions matter, whether each blocks or warns, target values, and how much latency the edit loop can afford. Ask at most four questions, one at a time, each with a default. Non-interactive work keeps existing policy plus the floor and marks the rest pending.

### 2. Write the contract

Use root `CONSTRAINTS.md`, linked from agent rules. [floor-guard.md](references/floor-guard.md) reads this layout:

```markdown
# Constraints
Last reviewed: <date> by <owner>
Baseline: <measurement source and date>

## Floor
- Suppressions: a new suppression needs an exception row.
- Stubs: no unfinished stubs or swallowed failures in completed work.
- Tests: deletions, skips, and assertion edits preserve acceptance coverage.
- Secrets: none in source or check output.
- Checks: checkers and thresholds are never weakened to pass a change.

## Gates
| Dimension | Rule | Reason | Mode | Verdict command | Scope / phase |
|---|---|---|---|---|---|
| Changed coverage | >= 80% of changed executable lines | team policy | block | `<diff-coverage script>` | task, CI |
| Dependency security | no high or critical findings | policy | block | `<scanner script>` | CI |
| Web vitals | LCP <= 2500 ms and CLS <= 0.1 | CWV "good" | block | `<lighthouse gate script>` | verify |
| Accessibility | no critical or serious axe findings | policy | block | `<axe gate script>` | verify |

## Pending
- <dimension>: <why unavailable> → <next action>

## Exceptions
| ID | Rule | Path | Reason | Owner | Authority | Expires |
|---|---|---|---|---|---|---|
| E1 | no-explicit-any | src/legacy/sdk.ts | untyped vendor SDK | @owner | ADR-12 | 2027-01-20 |
| W1 | bundle size | src/charts/ | chart library removal planned | @owner | tech lead | 2026-12-01 |
```

- Floor bullets are `Label: rule`; gate rows are keyed on their first cell.
- Each threshold has one number and a direction word (`>=`, `<=`, `under`) so loosening is detectable. Verdict commands sit in backticks so checker changes are flagged.
- `E<n>` rows waive a blocking rule for one path; `W<n>` rows accept a warn-mode deviation. Each needs owner, authority, and expiry (default 90 days). The guard flags every new row.
- Gate rows show pack defaults; use them only when the project has none, and record why. Tolerances need units. Never invent a baseline.

### 3. Wire real verdicts

Reuse established tools and configuration; verify versions and flags. Add a tool only when none can produce the verdict and authorization covers it; install it through project setup. Save verdicts as project scripts.

| Dimension | Example tool | What makes it a gate |
|---|---|---|
| Types/lint | Existing compiler/linter | Errors exit nonzero; keep the compiler's project graph |
| Changed coverage | lcov + diff-cover | Changed executable lines below threshold exit nonzero; `vitest --coverage` alone does not |
| Secrets | gitleaks, redacted | Any finding exits nonzero; never print values |
| Code/dependency security | Semgrep, osv-scanner | Filter by policy severity; exit defaults may not match it |
| Web performance/accessibility | Lighthouse, axe JSON | Compare LCP `numericValue`/CLS to budget and fail on selected axe impacts; reports alone never fail |
| Bundle/architecture/mutation | size-limit, dependency-cruiser, Stryker | Configure budget/rules/score; verify the failing exit |

Prove each blocking check: clean baseline, deliberate breach failing for the intended reason, restoration, clean result. Record command, exit, value, and policy. Checker errors or missing data are unavailable, not a pass.

### 4. Place checks by measured cost

- **Edit:** cheap checks, scoped to changed files where tools support it. When authorized, run them from the host's post-edit hook or a pre-commit hook.
- **Task/verify:** focused tests, changed coverage, and the real local runtime.
- **Review/CI:** slower security, mutation, architecture, and regression checks.

Measure latency; move slow checks out of the edit loop. Scripts own commands; `CONSTRAINTS.md` references them.

Start the local app before Lighthouse or axe, with representative routes, state, viewport, and input; scores supplement acceptance flows. For native, CLI, or library surfaces, mark web metrics `N/A: <reason>` and choose fitting runtime evidence.

### 5. Guard the bar and ratchet

Compare constraints, checker scripts and configuration, schedules, suppressions, exceptions, and tests against the task baseline. A replaced assertion is not automatically weaker; judge it against acceptance.

Using [floor-guard.md](references/floor-guard.md), a shallow diff guard over staged, unstaged, and untracked changes:

- Adapt its patterns to the stack; test it on a real violation and a justified exception.
- Plant a harmless marker violation and confirm the report shows only rule, path, and line.
- Exit `0` means no pattern matched, not enforced policy; `1` needs review; `2` means it could not run, which is unavailable, never clean.
- A checker-change finding needs policy review. Matching assertion counts do not prove equal strength.

For an unknown target, record today's value and hold it. If a selected target fails today, state the gap, remediation, and ratchet plan. Floor-only bootstrapping is allowed; track external gates as pending.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A constraints-only request stops at a verified `CONSTRAINTS.md` with pending gates listed; inside a build, return gate verdicts to the current phase.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "The report ran, so the budget is enforced" | Prove an exceeded budget fails. |
| "I can lower the threshold" | Fix behavior or record an authorized exception. |
| "Every assertion edit weakens tests" | Check the actual acceptance coverage and replacement. |
| "No URL means no accessibility" | Select runtime evidence appropriate to the platform. |

## Red Flags

- A blocking row without a tested failing exit.
- Invented measurements, guard findings accepted blindly, or source text in reports.
- Slow checks in the edit loop, or unavailable checks labeled passed.
- Quality standards lowered to finish one feature.

## Verification

- [ ] Existing policy and measured baselines were read first.
- [ ] Each gate has rationale, mode, scope, phase, and a working verdict command.
- [ ] Deliberate breaches fail; restored checks pass.
- [ ] Local runtime dimensions use representative real inputs.
- [ ] Floor adaptations, exceptions, redaction, and unavailable states are explicit.
- [ ] Agent rules point to `CONSTRAINTS.md`.
