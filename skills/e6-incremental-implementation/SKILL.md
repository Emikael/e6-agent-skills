---
name: e6-incremental-implementation
description: Use when implementing the next task from a plan as a small verifiable slice, building a feature across multiple files, integrating a change incrementally, rolling out behind a feature flag, or reducing work that feels too big to land in one step.
---

# Incremental Implementation

## Overview

Build thin, verifiable slices. Read the task, prove behavior with a failing test, implement it, run it, and checkpoint before expanding. Each slice leaves a working system.

## When to Use

- Multi-file changes, features from a plan, scoped refactoring.
- Work too large to land safely in one step, including work behind a feature flag.
- A minimal single-function change can use the same test/verify loop without inventing a multi-slice plan.

**Not for:** unsettled requirements → `e6-spec-driven-development`; breaking work into multiple tasks → `e6-planning-and-task-breakdown`; behavior-preserving cleanup → `e6-code-simplification`.

This skill owns the slice loop. Domain skills such as `e6-frontend-ui-engineering` and `e6-api-and-interface-design` supply checks for a slice; do not reload this skill from them.

## Process

### 1. Load the active task

Read project rules, the spec, the task and its status in `tasks/todo.md` (or inline state), requirement IDs, touched code and tests, relevant contracts, and verification commands. Use `e6-context-engineering` when context is missing or stale. Inspect the actual working tree; preserve existing edits and baseline failures.

If no adequate task or acceptance exists, return to the workflow's Understand or Plan phase. Resolve routine choices from evidence. Ask only for a material decision that existing scope and context cannot settle.

### 2. Choose a working slice

Name one outcome, its acceptance criteria, owned paths, dependencies, and verification. Prefer vertical slices: one user action across the needed layers. Contract-first work may go typed contract → backend with boundary tests → frontend matching the contract → integration. Mark mocks as mocks; they are not end-to-end evidence. Prove uncertain dependencies early.

Size slices by the shared [sizing rule](../e6-planning-and-task-breakdown/SKILL.md#4-size-order-and-checkpoint). Never split tightly coupled changes into broken intermediate states.

### 3. RED → GREEN → verify

1. Follow `e6-test-driven-development`. For changed behavior, derive an acceptance test and observe its intended failure before implementing. For preserved behavior or refactoring, run baseline or characterization checks before editing; do not invent a failure.
2. Implement the smallest complete behavior. Reuse existing patterns. Add no generic abstraction for hypothetical requirements and no adjacent cleanup.
3. Run focused tests and the applicable build/type/lint gates.
4. Execute the slice through its real local entry point, using the domain skill's checks: `e6-frontend-ui-engineering` and `e6-browser-testing-with-devtools` for UI, `e6-api-and-interface-design` and real requests for API boundaries.
5. On an unexpected failure, stop adding slices. Use `e6-debugging-and-error-recovery`, preserve the evidence, fix the cause, and reverify.

Run each check after a change that can affect it; do not rerun an unchanged passing check for reassurance. Changes to code, dependencies, configuration, or environment invalidate earlier evidence.

### 4. Checkpoint and continue

Record in `tasks/todo.md` (or inline state) the requirement IDs satisfied, paths changed, test and runtime evidence, blockers, and the next slice. Before compaction or a long pause, update the workflow state per the contract's [Compaction and Resume](../../references/workflow-contract.md#compaction-and-resume).

Commit a focused slice only when the user authorized it or the repository workflow requires it; follow `e6-git-workflow-and-versioning`. Otherwise leave a reviewable uncommitted diff. Never stage, erase, or tidy unrelated user changes to make the tree clean.

Continue automatically within accepted scope. A working first slice does not complete a multi-slice feature.

### 5. Keep every intermediate state working

- Each intermediate state builds and existing behavior stays usable.
- Hide incomplete user-facing work behind the project's established feature flag, off by default, and verify both states. Flag ownership, cohorts, and cleanup belong to `e6-shipping-and-launch`.
- Replace used code by adding the replacement, migrating callers, then removing old code. Schema, data, and consumer transitions follow `e6-deprecation-and-migration`.
- Record unrelated findings briefly; do not turn them into unrequested work.

### 6. Finish the task

Verify all accepted outcomes together, including the real integrated flow. Apply the [Definition of Done](../../references/definition-of-done.md), then return evidence for review. Deployment or merge needs its own authorization; successful local slices do not grant it.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Continue through all slices of the authorized task before returning for Verify and Review; do not stop at the first passing increment.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Implement everything, test later" | RED and runtime checks happen per slice. |
| "The two-day draft is nearly done" | Sunk effort does not validate an untested batch. |
| "A build proves the feature works" | Execute the accepted behavior through the real entry point. |
| "Every slice must be committed" | Checkpoint always; commit only within authorization or repository workflow. |
| "Delete first, replace next" | Every intermediate state must work. |

## Red Flags

- New behavior written before acceptance tests; big unverified batches.
- Completing only the first slice, then handing the task back.
- Broken intermediate builds or exposed incomplete features.
- Unrelated refactors, broad staging, or user edits erased for a clean tree.
- End-to-end claims based on mock data or compilation.

## Verification

- [ ] Every slice maps to accepted criteria: RED/GREEN for changed behavior, baseline/characterization for preserved behavior.
- [ ] Each intermediate state works; relevant tests and gates pass.
- [ ] The integrated local runtime flow was actually executed.
- [ ] Flags verified in both states when used.
- [ ] Slice status recorded in one place; commits follow authorization and preserve user edits.
- [ ] All task criteria and the Definition of Done checked; evidence returned for review.
