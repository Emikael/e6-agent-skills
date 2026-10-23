---
name: e6-test-driven-development
description: Use when writing or running tests for new logic, fixing a bug, changing behavior, proving code works, or refactoring existing functionality with regression risk. Use when a failing reproduction, red-green-refactor cycle, test-only deliverable, or preserved contract needs evidence.
---

# Test-Driven Development

## Overview

Prove the required behavior before changing code: RED → GREEN → REFACTOR. Passing tests must establish accepted outcomes, not mirror the implementation.

## When to Use

- New logic, changed behavior, bug fixes, refactoring with regression risk.
- Browser behavior that needs runtime checks as well as automated tests.

**Not for:** documentation, static content, or configuration with no behavior impact (use the relevant validator); localizing an unknown failure → `e6-debugging-and-error-recovery`, which returns here for the regression test.

## Process

### 1. Load behavior and tooling

Read project instructions, the task, bug, or spec with its requirement IDs, nearby code and tests, public contracts, and README invariants. Preserve existing behavior unless the accepted task changes it.

Discover the test framework, test placement, focused and full-suite commands, and CI gates. Prefer checked-in wrappers and scripts (`./gradlew`, `make test`, `python3 -m unittest`, or the real equivalent); never assume `npm test`. A project's own test procedure replaces this generic one ([project rules](../../references/workflow-contract.md#project-rules-override-pack-defaults)). Record the baseline, separating existing failures from ones this task causes.

### 2. Translate acceptance into tests

Map each changed requirement ID or criterion to a test with preconditions, action, and an observable expected outcome. Include failure paths, boundaries, and preserved invariants. Derive expected values from the accepted contract, not from the code.

Choose the smallest level that proves it: unit for pure logic, integration for API/database/filesystem boundaries, end-to-end for critical user flows. Mock only uncontrollable boundaries; a mock's return value or an internal call sequence does not prove the feature.

### 3. RED — run before implementation

For behavior-preserving refactors, run characterization or baseline tests before and after editing; do not manufacture a RED for already-correct behavior.

For changed behavior, write the focused test and run it first. The failure must show the missing or incorrect behavior, not a syntax, import, environment, or discovery error; repair a broken harness, then obtain a valid RED.

**Prove-It pattern for bugs:** reproduce the bug with a failing test before touching the fix. A new test that passes has not reproduced the bug; use the reported conditions or find the missing case.

**Flaky RED:** rerun a new failing test to confirm it fails every time. If it fails only sometimes, remove the nondeterminism (time, randomness, ordering, shared state, unawaited async, network) until it fails on every run for the intended reason. Never accept an intermittent RED or mask it with retries or longer timeouts.

Record the command, requirement ID, and decisive assertion or output.

**Test-only exit:** if the request is a failing test without a fix, stop after valid RED. Return test paths, commands, and expected failures; report suite runs as containing the expected failure, not passing. Do not advance to GREEN, commit, or deploy without authorization.

### 4. GREEN — only when implementation is authorized

Change only what satisfies the accepted behavior, then rerun the focused test. If it still fails, use `e6-debugging-and-error-recovery`. Never disable the test, weaken assertions, or rewrite the expected result to get green.

### 5. REFACTOR — preserve behavior

Simplify relevant code after GREEN; rerun affected tests. See [testing patterns](../../references/testing-patterns.md) for test levels and sizes, state-based assertions, DAMP tests, test-double discipline, and framework examples.

### 6. Verify the accepted result

- **Per slice:** focused tests plus the regressions the change could affect.
- **Before handoff, or whenever the repository requires it:** the full required suite and build/type/lint gates, within the project's [check scope](../../references/workflow-contract.md#project-rules-override-pack-defaults). If the project limits local suites, state what CI must still prove.

Then exercise changed behavior through its real entry point: `e6-browser-testing-with-devtools` for browser changes (unit tests do not prove layout or interaction), the real CLI, API, or app otherwise.

Reuse passing evidence until code, dependencies, configuration, or environment change. Report blockers and checks not run; never claim passes from static reasoning.

### Delegating a reproduction

For a substantial independent reproduction, a worker may own only named test paths. Give it requirement IDs, known inputs and outcomes, and exact commands, but not the proposed fix; packets follow the contract's [Delegation](../../references/workflow-contract.md#delegation) rules. The coordinator observes RED itself before editing implementation. Write tiny tests directly.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A test-only request stops at valid RED; an authorized fix continues through GREEN, regressions, and runtime verification.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Tests next sprint" | Reproduce first; deadlines do not validate a guessed fix. |
| "The reported case passes now" | Also prove the surrounding accepted invariants. |
| "Any failure counts as RED" | Harness failures and intermittent failures do not prove behavior. |
| "Mocks pass, so the app works" | Verify the real boundary and runtime. |
| "Run the whole suite after every edit" | Focused tests per slice; the full required suite before handoff. |
| "Test-only work must leave CI green" | Expected RED is the deliverable; do not fix behavior outside scope. |

## Red Flags

- Behavior code changed before valid RED evidence.
- Tests derived from the implementation instead of acceptance.
- Wrong ecosystem command, zero discovered tests, skipped tests, or false passes.
- A flaky RED accepted, or masked with retries and timeouts.
- Browser verification claimed without using a browser.
- A worker writes both test and fix; the coordinator never observes RED.

## Verification

Apply common checks plus the branch matching the deliverable.

- [ ] Requested scope (test-only or implementation) is explicit; criteria map to behavioral tests.
- [ ] RED was valid and deterministic for the intended reason.
- [ ] Test-only: implementation unchanged; failures reported accurately; no unauthorized fix or commit.
- [ ] Implementation: RED preceded GREEN; invariants hold; refactoring has characterization evidence.
- [ ] Implementation: focused tests per slice and the full required suite before handoff pass; the runtime scenario was exercised.
- [ ] No tests weakened, skipped, or disabled to hide failures.
