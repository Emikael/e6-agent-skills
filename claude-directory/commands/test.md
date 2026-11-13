---
description: Run TDD workflow — write failing tests, implement, verify. For bugs, use the Prove-It pattern.
---

Use e6-test-driven-development and e6-caveman. Read requirements, existing source/tests, and the project's actual test commands.

Map acceptance criteria to meaningful behavior assertions. For a bug, reproduce the reported failure with a test; observe it fail for the expected reason before the fix. For a feature, write the missing-behavior test first. Implement only when the user's scope includes the fix; test-only requests remain test-only.

Run focused checks, relevant regressions, and project-required gates. Refactor with green checks. For affected runtime behavior, exercise the local endpoint/CLI/library; UI verification uses e6-browser-testing-with-devtools with available browser/computer or existing automation. Report precise blockers and unverified criteria. Return evidence to the active coordinator; do not restart the lifecycle.
