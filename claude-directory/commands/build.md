---
description: Implement the next task; add "auto" for the whole plan. Verify tests, runtime, and review.
---

Use `using-e6-agent-skills` as coordinator and `e6-caveman` for concise output.

`/build` scopes work to the next pending task. `/build auto` (or `all`) scopes work to the whole requested plan. Reuse existing authorization; do not request a new approval merely to move between phases.

1. Read project rules, current tree, and the task's requirement IDs/acceptance criteria. Reuse the existing spec at SPEC.md, docs/SPEC.md, SPEC-<module-id>.md, or the project's equivalent. If requirements are missing, use e6-spec-driven-development to define them from the request; ask only about material unresolved decisions.
2. Use e6-planning-and-task-breakdown when needed. Preserve unrelated pending work in tasks/plan.md and tasks/todo.md. Execute ready tasks in dependency order.
3. Use e6-context-engineering for focused code/test/pattern/command context. For each slice use e6-incremental-implementation with e6-test-driven-development: behavior changes need observed RED then GREEN; unchanged behavior uses baseline/characterization; prose/config uses appropriate validators. Run relevant regressions.
4. Run required project checks and exercise the changed path locally. For UI use e6-browser-testing-with-devtools with available browser/computer or existing automation. Report exact unavailable checks as blockers.
5. Use e6-code-review-and-quality, fix Critical/Required findings, and rerun affected checks. Update task status and relevant documentation only after evidence supports it.
6. Commit task-owned paths only if authorized or repository-required. Preserve unrelated edits. A dirty tree alone is not a reason to stop; conflicting ownership is.
7. Complete the scoped task(s) and report delivered behavior, actual checks, blockers, and next action. Use e6-debugging-and-error-recovery for failures and resume after resolving them. Do not require the user to reinvoke the command to continue independent work.
