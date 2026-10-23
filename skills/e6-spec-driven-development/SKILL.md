---
name: e6-spec-driven-development
description: Use when starting a new project, feature, service, or significant change without a specification, even when no spec was requested by name. Use when drafting a PRD or requirements document with objectives and boundaries, when requirements need observable acceptance criteria, or when a large requirement spanning several domains must be decomposed into independently specifiable modules with a capability map and dependency order.
---

# Spec-Driven Development

## Overview

Write observable requirements before production code. Stable requirement IDs connect intent, tasks, acceptance tests, runtime evidence, and review.

## When to Use

- A feature or significant change has no clear written requirements.
- Product behavior or scope is ambiguous.
- One initiative contains independently testable capabilities.

**Not for:** unclear intent or success → `e6-interview-me`; breaking settled requirements into tasks → `e6-planning-and-task-breakdown`; already-specified changes. A change on the contract's [fast path](../../references/workflow-contract.md#fast-path) uses inline criteria (step 3), not a spec file.

## Process

### 1. Load the relevant contract

Follow `e6-context-engineering`. Read the request, active intent and spec sections, project rules, constraints, relevant interfaces, and tests. Commands, layout, and agent rules belong in project rules, not the spec. Reuse existing answers and delegated authority.

Separate facts from assumptions, with evidence. Ask about unresolved material decisions (pricing, permissions, persistence, user-visible policy, competing scope); record them as Open decisions and continue independent work.

### 2. Check capability scope

When the request bundles independently shippable, testable capabilities, propose a capability map before module specs:

```markdown
# Capability Map: Customer portal
| Module | Prefix | Responsibility | Depends on |
|---|---|---|---|
| identity | IDN | Accounts and sessions | — |
| billing | BILL | Plans and invoices | identity |
| notifications | NOTIFY | Email and webhook events | identity, billing |
Build order: identity → billing → notifications
```

Module names are stable kebab-case; each owns one requirement-ID prefix recorded in the map. Require one-way dependencies; merge inseparable modules or repair the boundary. Provider specs own interface contracts (design them with `e6-api-and-interface-design`). Ask only about material scope or ownership changes.

Save `CAPABILITY-MAP.md`, then one `SPEC-<module>.md` per module in dependency order. These files live beside `SPEC.md`: the repository root, or `docs/` when the project uses `docs/SPEC.md`.

### 3. Specify behavior and proof

**Small change.** On the fast path, write inline criteria in the task, state, or PR; no file:

```text
AC-1: Given a signed-in user with no saved filter, When they open Reports, Then the "Last 30 days" filter is applied.
```

**Larger work.** Keep the project's specification system (for example OpenSpec); otherwise use `SPEC.md` at the root (`docs/SPEC.md` is accepted). A minimal filled spec:

```markdown
# Spec: Deduplicate billing webhooks
Status: approved          (draft | approved | implementing | verified)
Prefix: BILL              (or "see CAPABILITY-MAP.md")
## Outcome and actors
Account owners are billed once per usage event when the provider retries.
## Scope
In: usage-event webhooks. Out: refunds (separate spec).
## Requirements
### BILL-3 Deduplicate billing events
Statement: One logical event affects usage once.
Acceptance: Given a recorded event, when its ID is submitted again,
then usage and invoice totals remain unchanged.
Proves: Provider retries cannot charge twice.
Proof method: Duplicate-event integration test; local webhook retry.
## Data and invariants
Provider event ID is unique per account.
## Interfaces
POST /webhooks/billing, unchanged.
## Error and edge behavior
Concurrent duplicates: exactly one applies; the other is a no-op 200.
## Non-functional
None beyond CONSTRAINTS.md.
## Open decisions
None.
## Trace
Approved: user confirmed 2026-10-20. BILL-3 → tests/billing/dedupe.test.ts
```

Invariants: identity, uniqueness, ordering, state transitions. Errors: empty, invalid, duplicate, unauthorized, retry.

One requirement describes one observable behavior. A requirement ID is `<PREFIX>-<n>`; the prefix comes from the capability map or the `Prefix:` line. Never renumber or reuse an approved ID. Given/When/Then names concrete state, action, and outcome; "works correctly" is not acceptance. Include negative and edge scenarios.

A proof method tests user outcomes or invariants; UI, CLI, and API behavior also needs a real local interaction. The plan adds exact commands; each test names the requirement ID it proves.

Shared quality gates belong in `CONSTRAINTS.md` (`e6-constraint-driven-development`); feature-specific budgets belong here. Record significant architecture decisions with `e6-documentation-and-adrs`.

### 4. Challenge the draft

For auth, billing, payments, migrations, deletion, or uncertain architecture, use `e6-doubt-driven-development`. Otherwise check:

- Every requirement has an observable result and proof method.
- Relevant errors, invariants, and state transitions are explicit.
- Each spec stays inside its capability boundary.
- Assumptions remain distinguishable from facts; Open decisions remain visible.

Fix gaps before treating a requirement as settled.

### 5. Approve and advance

**Approved** means the user explicitly confirmed this spec, or existing task authority covers its requirements ("build this as described" with no Open decision affecting them). Record which in Trace. Silence is not approval; a requirement touched by an Open decision stays draft.

If the host is in plan mode or the user asked to review the spec first, present it and stop ([plan mode](../../references/workflow-contract.md#plan-mode-and-requested-approval)). Otherwise add no approval pauses.

When implementation contradicts the spec, record a delta in Trace (IDs, old and new behavior, reason, authority) and update spec and tasks first; ask only about material decisions or scope expansion. Commit the spec with the code when authorized and project rules allow it.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A spec-only request stops at the saved spec and its Open decisions; an authorized build continues to `e6-planning-and-task-breakdown`.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "I'll document it after coding" | The spec prevents wrong behavior before code exists. |
| "I'll choose a sensible price" | Pricing is a material product decision, not an implementation default. |
| "The build passes, so acceptance is covered" | Acceptance requires observable behavior and its proof. |
| "Every phase needs another yes" | Existing authorization persists; only Open decisions or a requested review pause work. |

## Red Flags

- Requirements invented from unresolved prices or policies.
- Acceptance that mirrors functions instead of user outcomes.
- Independently testable capabilities sharing one spec.
- "Approved" without a recorded confirmation or covering authority.
- Stale requirements after a behavior change.
- A spec file for a fast-path change, or approval pauses inside an authorized build.

## Verification

- [ ] Project facts and existing authority were read first.
- [ ] Outcome, actors, scope, non-goals, invariants, and errors are explicit.
- [ ] Requirement IDs follow `<PREFIX>-<n>` with observable scenarios and proof methods.
- [ ] Open decisions are visible and block only affected requirements.
- [ ] Capability boundaries and adversarial findings are resolved or recorded.
- [ ] Approval and its source are recorded in Trace.
- [ ] Spec-only scope stayed bounded; authorized work advanced to planning.
