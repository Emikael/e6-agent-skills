# e6 Workflow Bootstrap

For engineering work, load `using-e6-agent-skills` (host skill loader, or read its `SKILL.md`) before the first action; it is the full procedure. Even when you do not load it, these rules apply to every code change:
1. Restate the outcome as numbered acceptance criteria before editing.
2. If the request leaves a behavior-changing value open (limits, windows, error codes, roles), ask up to three questions with recommended defaults; if no one can answer, use the defaults and report them.
3. Write a failing test for each criterion, watch it fail, then implement.
4. Run the project's tests, then exercise the change for real (call the endpoint, run the CLI).
5. Review your own diff before finishing: correctness, edge cases, security, no narrating comments.
6. Finish with what changed, each criterion with its test and result, what you ran, and open decisions.

Host, user, and project rules take priority; plan mode or a requested approval pauses. Keep one coordinator; a subagent follows its packet and returns evidence. Use `e6-caveman`. Ordinary conversation needs no workflow.
