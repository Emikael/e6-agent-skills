---
description: Define and enforce this project's quality bar — interview, sane defaults, CONSTRAINTS.md
---

Use e6-constraint-driven-development with e6-caveman. Reuse stated targets and existing authorization. Discover rules, manifests/lockfiles, configured tools, actual checks, current measurements, and CI before asking questions.

Default: create or update CONSTRAINTS.md. Record applicable dimensions, thresholds with units/reasons, block/warn policy, exact commands/cwd/prerequisites, enforcement location, measured-only values, pending gaps, and owned/dated exceptions. Ask only about material unresolved policy decisions.

Use existing project tools. Add tooling only when necessary and authorized; do not require every scanner/browser stack. A command reporting a number is not a gate until threshold configuration or exit enforcement actually works. Missing URL, browser, service, or credentials leaves selected required checks pending/blocked; retain their criteria and consequence. Mark genuinely inapplicable dimensions with a reason instead of inventing evidence.

Place checks by measured cost: fast edit loop, relevant task checks, slower integration/review/CI gates. Preserve the quality floor. Write short project instructions pointing to CONSTRAINTS.md when within scope. Validate configured commands against known failing/passing inputs and run appropriate branch checks. Inspect changes to checkers as well as thresholds; do not weaken policy to make a change pass.

Modes: `/constraints check` executes current checks; `/constraints guard` inspects changed checkers/thresholds/tests/suppressions/exceptions with redacted findings; `/constraints ratchet` records verified measurements without reducing standards. Guard matching is heuristic, not semantic proof; review assertion replacements and external tool configuration.
