---
description: Start spec-driven development — write a structured specification before writing code
---

Use e6-spec-driven-development with e6-caveman. This command's deliverable is the spec; do not implement code.

Read the request, project rules, relevant code/tests, and existing requirements. Use e6-interview-me only for unresolved intent; use e6-idea-refine only if exploration is requested. Reuse stated requirements and authorization.

For independent capabilities, write CAPABILITY-MAP.md with module IDs/dependencies/build order and SPEC-<module-id>.md in dependency order. Otherwise use SPEC.md (docs/SPEC.md when already conventional).

Record outcome, actors, scope/exclusions, requirement IDs and observable scenarios, data invariants, interfaces/errors, applicable quality constraints, and material blocking questions. Keep project commands and code conventions in project rules/context rather than duplicating them in the spec. Run the skill's adversarial pass. Deliver the reviewable artifact; ask only for the material decisions needed to finalize it.
