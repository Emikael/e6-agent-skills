---
description: Conduct a five-axis code review — correctness, readability, architecture, security, performance
---

Use e6-code-review-and-quality with e6-caveman. A review-only request produces findings; do not edit without authorization. In an active implementation workflow return evidence to its coordinator.

Read the requested diff (including task-owned untracked files), acceptance criteria, source/callers/tests, and actual check evidence. Review correctness, readability, architecture, security, and performance. Use domain skills only when their triggers apply.

Label findings Critical, Required, Optional, Nit, or FYI. Critical/Required block completion until resolved; re-read the cited code before reporting one. Map persona severities with the workflow contract's Finding Severity table; evidence determines whether lower findings require action. Give precise file:line, the failure scenario, and a concrete fix. State the verdict (APPROVE, REQUEST CHANGES, or COMMENT) and label each check as ran, author-provided, or not run. Do not substitute plausible prose for evidence.
