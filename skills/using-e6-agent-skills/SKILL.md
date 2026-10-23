---
name: using-e6-agent-skills
description: Use when starting an engineering task or session, deciding which skill or workflow applies, routing a request through this pack, or implementing a feature from request to verified handoff without naming each skill.
---

# Using E6 Agent Skills

## Overview

Own the workflow until the user's goal is satisfied. Selecting one skill starts a phase; it does not complete the task. Load specialists when needed. One coordinator runs the lifecycle; workers and specialists return evidence to it.

## When to Use

Engineering requests: build, fix, refactor, test, review, plan, migrate, release, or explain code. Respect narrower requests: a review produces findings; a plan produces a plan; `/spec` produces a spec.

**Not for:** ordinary conversation, or questions answerable without the repository. **Not for workers:** if you were dispatched with a task packet, do not load this coordinator; follow the packet and return evidence.

## Skill Check

Before the first tool action on an engineering request:

1. Classify the request with the route table below.
2. Load the matching skill and announce it in one line: `Using <skill> for <purpose>.`
3. Read [the workflow contract](../../references/workflow-contract.md) once per workflow. It defines authorization, plan mode, project overrides, the fast path, scales, artifacts, delegation, and handoff.

| Request | Start with | Ends at |
|---|---|---|
| Question / explain code | `e6-context-engineering` | Answer with `path:line` evidence |
| Trivial change (contract fast path) | Fast path: inline `AC-n` → RED → fix → check → self-review | Reported diff and evidence |
| Bug report or regression | `e6-debugging-and-error-recovery`: reproduce, localize, failing regression test | Verified fix through Review |
| Feature or behavior change | Full Process below | Handoff |
| Refactor, no behavior change | `e6-code-simplification`: baseline first | Reviewed diff, baseline still passing |
| Review only | `e6-code-review-and-quality` | Findings and verdict |
| Test only | `e6-test-driven-development` | Valid RED or added coverage |
| Spec or plan only | `e6-spec-driven-development` / `e6-planning-and-task-breakdown` | The artifact |
| CI red or production incident | `e6-ci-cd-and-automation` or debugging, with logs/telemetry first | Root cause, fix, or blocker |
| Release | `e6-shipping-and-launch`, within authorization | GO/NO-GO/HOLD |

## Process

Advance automatically through applicable phases. Never ask the user to invoke the next skill. Continue independent work while a material question is pending.

0. **Start.** Read project rules and `git status`. Identify outcome, scope, authorization, and any active workflow; resume from its state. Apply and record the contract's project overrides. Plan mode or a requested approval follows the contract's plan-mode rule.
1. **Understand.** Use `e6-context-engineering` to trace code, tests, callers, commands, decisions, and available tools. Use `e6-spec-driven-development` to record observable criteria before a behavior change: inline `AC-n` on the fast path, a spec for larger work. Ask only about material Open decisions; batch them with consent requests.
2. **Plan.** Use `e6-planning-and-task-breakdown` for multiple slices. Map each requirement ID to a test, an implementation path, and a runtime check. State assumptions and proceed within authorization.
3. **Build.** Use `e6-incremental-implementation` with `e6-test-driven-development`: failing behavior test → minimal implementation → passing test → regressions. Unchanged behavior uses characterization checks; prose and configuration use validators. Failures go to `e6-debugging-and-error-recovery`, then resume the slice.
4. **Verify.** Run project checks within the project's check scope. Exercise the changed behavior locally per the contract; web UI uses `e6-browser-testing-with-devtools` or the project's own test procedure. Compilation is not runtime evidence. Update docs the change made inaccurate with `e6-documentation-and-adrs`.
5. **Review.** Use `e6-code-review-and-quality` on the actual diff, docs included, against criteria and evidence. High-risk diffs (auth, persisted data, payments, public API, migrations) use the persona fan-out in [orchestration patterns](../../references/orchestration-patterns.md). Resolve Critical/Required findings, simplify where complexity warrants, rerun affected checks, and confirm the [Definition of Done](../../references/definition-of-done.md).
6. **Handoff.** Report delivered behavior, actual checks, blockers, and next action. Use `e6-git-workflow-and-versioning` and `e6-shipping-and-launch` only when committing or releasing is in scope. A reviewable local result completes an implementation request that does not authorize release.

A blocked required check stays blocked; record its consequence instead of claiming completion.

## Conditional Skills

Load a specialist only when its trigger applies. When skipping a relevant phase, record `skipped: <reason>` in the workflow state.

| Trigger | Required specialist |
|---|---|
| Goal/actors/success unclear | `e6-interview-me` |
| User wants alternatives for a rough idea | `e6-idea-refine` |
| Quality floor missing or disputed | `e6-constraint-driven-development` |
| Unfamiliar dependency/version/API | `e6-source-driven-development` |
| Material uncertainty or high consequence | `e6-doubt-driven-development` |
| UI change | `e6-frontend-ui-engineering` |
| Public interface/API change | `e6-api-and-interface-design` |
| Untrusted input, authorization, sensitive data, LLM/agent tools | `e6-security-and-hardening` |
| Measured performance problem/budget | `e6-performance-optimization` |
| New critical path or telemetry change | `e6-observability-and-instrumentation` |
| Pipeline/build automation change | `e6-ci-cd-and-automation` |
| Compatibility transition/data migration | `e6-deprecation-and-migration` |

## State and Delegation

Larger work persists the contract's workflow-state template; small work keeps state inline. Update it before compaction or a phase switch; resume from it and the current tree.

Delegate only independent work, using the contract's packet format; parallel writers use isolated worktrees or run serially. Other plugins can supply specialists. If the user explicitly selects another workflow, follow it; otherwise this coordinator stays in charge and adopts another plugin's gate only where it adds a missing check.

## Common Rationalizations

| Excuse | Required response |
|---|---|
| "I invoked a skill, so workflow done." | Follow its handoff; satisfy the remaining phases. |
| "Tests pass; app must work." | Exercise the changed runtime path. |
| "The user must approve each phase." | Reuse existing authorization. Pause only for plan mode, a requested approval, or a missing decision/action. |
| "Small task; skip the skill check." | Classify first. The fast path is a route, not a skipped workflow. |
| "Project rules are just suggestions." | Project rules override pack defaults; record the override. |
| "Load all 26 skills for certainty." | Read only the current phase and triggered specialists. |

## Red Flags

- Stopping at a spec when implementation was requested.
- Implementing while the host is in plan mode or after the user asked to approve first.
- Changing behavior before acceptance criteria or a failing behavior test.
- Committing plans or state that project rules keep out of the repository.
- Declaring browser verification from code inspection, or without consent the project requires.
- A worker loading this coordinator; full conversation copied to workers; overlapping file ownership.
- Repeated routers, approval loops, or unsupported tool requirements.

## Verification

- [ ] Request classified; each phase or specialist announced once.
- [ ] Requested scope satisfied; every applicable phase has evidence, `skipped: <reason>`, or an explicit blocker.
- [ ] Acceptance criteria map to observed tests and runtime checks.
- [ ] Project overrides honored and recorded.
- [ ] Docs updated before review; Critical/Required findings resolved and affected checks rerun.
- [ ] Output concise; exact commands, uncertainty, and limitations preserved.
