---
name: e6-planning-and-task-breakdown
description: Use when a spec, PRD, or clear requirements need an ordered implementation plan and small verifiable tasks with acceptance criteria and dependencies. Use when work is too large to start, scope needs estimating, implementation order is unclear, or independent work could run in parallel.
---

# Planning and Task Breakdown

## Overview

Turn settled requirements into small vertical slices. Each task names the requirement IDs it proves, the paths it owns, and the tests and local runtime evidence needed to finish.

## When to Use

- A spec needs executable tasks or dependency order.
- Work is too large for one focused implementation session.
- Independent work needs coordination, or the user wants an estimate.

Skip a separate plan for obvious mechanical work, a contract [fast-path](../../references/workflow-contract.md#fast-path) change, or an already executable task list.

**Not for:** unsettled product behavior → `e6-spec-driven-development` (planning never invents it); executing a task → `e6-incremental-implementation`; building a worker packet → `e6-context-engineering`.

## Process

### 1. Inspect before planning

Follow `e6-context-engineering`. Read requirements, rules, constraints, relevant code, test patterns, and the real test/build/launch scripts. Do not edit production code while planning. Record dependencies, risks, and unknowns; never guess commands.

### 2. Map dependencies and slice vertically

Order foundations and contracts before consumers. Slice working behavior through storage, API, and UI rather than finishing whole layers. Each slice leaves the system runnable. Put risky work early; keep migrations, shared state, and dependency chains sequential.

When a capability map exists, it fixes module boundaries: one task cites one module's requirements; split cross-module tasks or record a boundary delta in the spec. Record significant architecture decisions with `e6-documentation-and-adrs`.

### 3. Write acceptance-backed tasks

Use the project's task location and format. Otherwise use the contract's [Artifacts](../../references/workflow-contract.md#artifacts): one status source.

- `tasks/plan.md` holds rationale, decisions, and task bodies. **No status.**
- `tasks/todo.md` holds status, one line per task.
- `tasks/workflow-state.md` holds the phase pointer, evidence, overrides, blockers, and next action; no task list.

`tasks/plan.md` skeleton:

```markdown
# Plan: <feature>
Spec: <path#section or inline> — Constraints: CONSTRAINTS.md
## Decisions
- <decision and reason; ADR link if significant>
## Tasks
### T2: Assigned user receives one email
Requirements: NOTIFY-2, NOTIFY-3
Acceptance: Given an opted-in user and an assignment event, when the event
is retried, then one email is delivered and one status record exists.
Proof: RED/GREEN duplicate-event integration test (<focused command>);
local runtime: <launch command>, assign, retry, inspect; regressions: <commands>
Dependencies: T1
Owned paths: <implementation and test paths>
Context pointers: <spec section, adapter, test pattern, rules>
## Checkpoints
- After T2: <integrated flow to run>
## Risks and Open decisions
```

`tasks/todo.md` line format: `- [ ] T<n> <requirement IDs> <title> — <status>[: evidence or reason]`. Status uses the contract's words (`pending`, `active`, `done`, `blocked`, `skipped: <reason>`); tick the box only for `done` or `skipped`.

```text
- [x] T1 PREF-1 Preference contract — done: `<command>` exit 0
- [ ] T2 NOTIFY-2,NOTIFY-3 Assigned user receives one email — active
- [ ] T3 NOTIFY-4 Daily digest — blocked: <reason> → <next step>
```

When requirements lack IDs, cite their text; never invent behavior to create an ID. Copy scenarios faithfully, including the spec's failure and boundary inputs. Tests must distinguish correct behavior from a plausible broken implementation.

Select local proof: browser for web UI, computer or simulator for native UI, requests for APIs, invocation for CLIs, caller behavior for libraries. A build does not replace runtime proof; record missing runtime capability.

### 4. Size, order, and checkpoint

**Sizing rule** (shared with `e6-incremental-implementation`): a task changes one observable behavior or contract, touches about 1–5 files, and stays near 100 changed lines, so a failure is diagnosable in one session. Split tasks that exceed this or bundle independent outcomes. Never split tightly coupled edits into broken intermediate states.

**Estimating**, when asked: size by slice count and risk. S = 1–2 tasks on known patterns; M = 3–5 tasks or one unfamiliar dependency; L = 6+ tasks, a migration, or an Open decision. Name the risk that would move the estimate.

At dependency boundaries or every 2–3 tasks, checkpoint: acceptance and regression checks pass, the increment runs through its local flow, evidence is recorded, and review findings are resolved. Passing evidence advances authorized work.

### 5. Present or save

**Plan mode or approve-first:** if the host is in read-only planning mode or the user asked to approve the plan, present it inline, write nothing, and stop. Explicit approval authorizes Build ([plan mode](../../references/workflow-contract.md#plan-mode-and-requested-approval)).

Otherwise check existing artifacts first. Update the same work in place; preserve different unfinished work in a distinct task-specific location recorded in the workflow state. Ask only when policy permits a single active plan or a conflict would discard work.

With an authorized external tracker, create one item per task with dependency links; the tracker then holds status and `tasks/plan.md` lists tracker IDs. If tracker writes are not authorized, keep a local draft and name the pending action.

### 6. Delegate only independent work

Delegate when owned paths and acceptance are clear and a separate context saves work; otherwise keep the task local. Packets and returns follow the contract's [Delegation](../../references/workflow-contract.md#delegation) rules. Parallel writers use isolated worktrees (`e6-git-workflow-and-versioning`) or run serially. Resolve shared contracts before fan-out. The coordinator inspects each diff and verifies the integrated flow.

Apply the standing [Definition of Done](../../references/definition-of-done.md) alongside task acceptance.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A plan-only request stops at the saved or presented plan; an authorized build continues with `e6-incremental-implementation` and `e6-test-driven-development`.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "Tests pass is enough for the task" | Name the acceptance scenario and prove its local behavior. |
| "I'll build all layers, then connect them" | Vertical slices expose integration problems earlier. |
| "Parallel agents are always faster" | Shared paths and dependency chains require sequencing or isolated worktrees. |
| "Every checkpoint needs another yes" | Evidence advances authorized work; material choices need input. |

## Red Flags

- Generic tasks without requirement IDs or proof.
- Guessed commands or build-only verification of user behavior.
- Status written in `tasks/plan.md`, or an incomplete plan overwritten.
- Files written in plan mode or before a requested approval.
- Overlapping ownership, or parallel writers sharing one working tree.
- Unresolved product decisions silently turned into implementation tasks.

## Verification

- [ ] Rules, requirements, constraints, and real commands were read.
- [ ] Small vertical tasks cite requirement IDs, owned paths, dependencies, proof, and checkpoints.
- [ ] Status lives only in `tasks/todo.md` (or the tracker); existing work is preserved.
- [ ] Plan mode or a requested approval stopped before any write.
- [ ] Delegation is independent and isolated when used; plan-only scope stayed bounded.
