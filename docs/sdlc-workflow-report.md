# SDLC Workflow Change Report

> Historical snapshot: counts and file names describe the pack at the baseline below, not today. See the [README](../README.md) for the current catalog.

Date: 2026-10-01. Baseline: `9c66e42`. Scope: all 25 original skills, host activation, commands, shared references, personas, fixtures, and evaluation tooling. Added `e6-caveman`; the pack now has 26 skills.

## Findings

The existing skills contained useful engineering guidance, but five issues interrupted the proposed lifecycle:

1. **Discovery lacked activation wiring.** Descriptions exposed individual skills; the session hook did not supply a reliable coordinator bootstrap. Setup guides discouraged loading the router.
2. **Specialists stopped the workflow.** Several skills required repeated confirmations, ended after their own artifact, or delegated the next phase back to the user despite an implementation request.
3. **Evidence gates conflicted.** Incremental implementation and debugging sometimes placed regression tests after fixes. Build success substituted for runtime evidence; review severity names differed between skills and commands.
4. **Context was expensive and incomplete.** Long examples occupied skill cores, while worker handoffs lacked precise acceptance, ownership, command, and return contracts.
5. **Evaluation overstated coverage.** Lexical ranking tested vocabulary within this catalog. Selected-skill execution did not establish natural activation, competition with installed plugins, or automatic phase chaining; committed and untracked final artifacts could be lost.

The audit also found concrete unsafe or incorrect examples: hard resets in dirty trees, shell interpolation of CI inputs, response fields exposed by removal-only filtering, misleading CSRF/SSRF guidance, invalid rollback assumptions, and simplification examples that changed return/error contracts.

## Implemented Workflow

`using-e6-agent-skills` now coordinates **Understand → Plan → Build → Verify → Review → Handoff**. An ordinary implementation request advances through applicable phases using existing authorization. Specialists return evidence to the active coordinator. Explicit interview, spec, plan, review, and test-only requests retain their narrower deliverables.

The shared [workflow contract](../references/workflow-contract.md) defines phase inputs, exit evidence, authorization, context, and runtime requirements. Larger tasks persist concise state in `tasks/workflow-state.md`; small tasks keep it inline. Completed phases are reused, and later edits invalidate affected evidence.

### Activation

- Claude gets an automatically discovered `hooks/hooks.json` SessionStart hook covering startup, resume, clear, compact, and fork. Its Bash bootstrap works without jq and points to installed skill paths.
- Codex, OpenCode, Gemini, and Claude project rules can use `scripts/install-workflow-bootstrap.js`. Preview is the default; explicit `--write` updates only a marked block and preserves existing instructions. `--check` detects stale wiring.
- Seven lifecycle command wrappers and their Gemini/root counterparts now agree on continuation, scope, tests, runtime, severity, and release authority.
- One coordinator owns the lifecycle. Other plugins can supply specialists; explicit user workflow selection and higher-priority host instructions still govern.

See [activation instructions](workflow-activation.md). Installing skill files alone cannot guarantee invocation or override the harness.

### Context and Communication

Every skill uses `e6-caveman`: concise readable prose while preserving exact commands, errors, identifiers, units, negation, ownership, and uncertainty. Code and durable documentation retain proper syntax and meaning.

Context discovery traces entry point → implementation → callers/dependencies → tests, then reads real project commands, lockfile versions, accepted requirements, and relevant decisions. Domain examples moved into directly linked references loaded only when needed.

Independent workers receive a goal, acceptance IDs, owned paths, contracts, commands, and source pointers. Targets are 500 words of input and 200 words of evidence return, with necessary correctness detail preserved. Fresh context is preferred when supported. No duplicated full histories, default nested workers, or overlapping writable ownership. The coordinator checks integration.

### Acceptance, Tests, and Runtime

Each acceptance criterion maps to a meaningful test, implementation path, and local runtime check. Tests must catch a plausible real defect. Changed behavior requires an observed behavioral failure before implementation; import/setup errors do not qualify. Refactors use baseline/characterization checks. Prose/configuration uses relevant validation. Test-only work can finish at valid RED without unauthorized implementation.

The agent discovers and starts the real application, observes readiness, and exercises the affected endpoint, CLI, library integration, UI, or native flow. Available browser/computer/simulator tools or existing automation are used when needed. Console/network/side effects supplement visible outcomes. Missing required capabilities remain blocked; compilation and screenshots do not prove an interaction. Only owned temporary processes are stopped.

## Changes by Skill

All original skills gained clearer triggers, scoped context, evidence requirements, concise handoffs, and coordinator continuation. Specific corrections:

| Skill | Change | Reason |
|---|---|---|
| `using-e6-agent-skills` | Explicit lifecycle, conditional specialists, persisted state, automatic continuation | A router must complete the requested workflow, beyond selecting a skill. |
| `e6-context-engineering` | Feature tracing, discovered commands, bounded packets, resume state | Supply necessary evidence without repository/history dumps. |
| `e6-interview-me` | Read settled facts first; ask only material gaps; accept ordinary clear authorization | Avoid duplicate questions, subjective confidence gates, and approval loops. |
| `e6-idea-refine` | Scale alternatives to uncertainty; portable tools; corrected helper path and project cwd | Preserve accepted direction and write artifacts into the target project. |
| `e6-spec-driven-development` | Observable requirement IDs and proof methods; continue authorized implementation | Prevent speculative stacks and specs that terminate a build request. |
| `e6-constraint-driven-development` | Separate measurement from enforcement; prove threshold failure; retain unavailable dimensions | A report-producing command does not establish a blocking gate. |
| `e6-planning-and-task-breakdown` | Vertical acceptance-backed slices, owned paths, runtime checks, preserved active plans | Make tasks executable and integration responsibilities explicit. |
| `e6-source-driven-development` | Resolve pinned versions first; fetch specific authoritative claims; runtime proof | Prevent unnecessary version questions, latest-API mismatches, and citation-only validation. |
| `e6-doubt-driven-development` | Risk-based independent review, bounded context, explicit escalation authority | Concentrate review on material uncertainty without repeated broad fan-out. |
| `e6-incremental-implementation` | Correct test-before-fix order; acceptance checkpoints; conditional commits | Each increment proves behavior and advances within scope. |
| `e6-test-driven-development` | Genuine RED evidence, risk-based levels, refactor characterization, test-only exit | Avoid false RED, implementation-first fixes, and unauthorized GREEN. |
| `e6-api-and-interface-design` | Executable contract checks; corrected error/retry/idempotency semantics | Interface prose must agree with observable behavior. |
| `e6-frontend-ui-engineering` | Runnable fixture; actual states/focus checks; corrected modal and optimistic rollback examples | Prevent unverified accessibility and lost concurrent updates. |
| `e6-browser-testing-with-devtools` | Discover startup/readiness; use available capabilities; scoped interaction and blockers | Remove dependence on one MCP and prove the affected local flow. |
| `e6-debugging-and-error-recovery` | Diagnose → failing regression → fix → original runtime; isolated reduction/bisection | Preserve user work and avoid changing expectations merely to pass. |
| `e6-code-review-and-quality` | Review callers/contracts/revision and actual evidence; located findings; consistent severities | Produce actionable findings and distinguish claims from executed checks. |
| `e6-code-simplification` | Baseline first; preserve shapes, key behavior, and async errors | Existing examples could change public contracts while claiming equivalence. |
| `e6-security-and-hardening` | Allowed/denied tests; CSRF controls, response allowlists, bounded uploads, transport-aware SSRF | Correct concrete security gaps and prove legitimate behavior survives. |
| `e6-performance-optimization` | Project-specific thresholds, repeatable local baseline, semantic oracle, revert unsupported gains | Avoid universal web gates and optimizations that change correct output. |
| `e6-observability-and-instrumentation` | Reuse stack; bounded IDs/labels; valid sampling topology; captured signals/test alerts | Configuration alone cannot prove usable telemetry or error retention. |
| `e6-git-workflow-and-versioning` | Preserve dirty ownership; test atomic commit trees; resolve semantic conflicts | Avoid data loss and commits separating behavior from its coverage. |
| `e6-ci-cd-and-automation` | Validate inputs, secretless forks, real gate/branch-rule evidence, immutable artifacts | Prevent shell injection and pipelines that appear enforced but permit bypass. |
| `e6-deprecation-and-migration` | Mixed-version acceptance, concurrency-safe backfill, rehearsed restore/roll-forward | A down migration or flag cannot recover deleted data or prior side effects. |
| `e6-documentation-and-adrs` | Truthful decision sources/status, existing conventions, executed setup/examples | Avoid fabricated rationale and plausible but broken instructions. |
| `e6-shipping-and-launch` | Candidate-bound gates, GO/NO-GO/HOLD, verified recovery and meaningful rollout samples | Prevent stale green results, invented rollback commands, and zero-traffic success. |
| `e6-caveman` **new** | Shared concise communication and worker format | Reduce repeated prose while preserving technical meaning. |

Shared checklists, four reviewer personas, contributor guidance, host setup docs, and README were aligned with these contracts. The constraint floor-guard now detects checker changes/removal, handles stronger assertion replacements, and reports metadata without source values. It remains a syntax heuristic; semantic weakening and external gate configuration still require review.

## External Patterns Adapted

- **Compound Engineering:** explicit next consumer, completion evidence, coordinator continuation, conditional references, and selective storage of verified reusable lessons.
- **Superpowers:** trigger-focused descriptions, behavioral RED, evidence before completion, and pressure scenarios.
- **ADHD:** visible next actions, compact state, bounded presentation, and full substance under brevity.
- **Caveman:** short readable prose and exact details; real uncertainty and required progress updates remain intact.

`e6-caveman` was independently authored; upstream text/runtime was not vendored. The [source appendix](workflow-design-sources.md) records inspected commits, licenses, adopted patterns, and limits. No competitor superiority claim is supported by this work.

## Evaluation and Verification

The runner now supports Claude and Codex, selected cases, alternate pack roots, and model selection. It records CLI/model identity when available, pack/prompt hashes, separate executor/grader traces, and failed-call evidence in unique directories. Skills/references are copied into a read-only reference snapshot. Baseline-to-final artifacts retain committed changes and bounded untracked text, with omissions explicit. Grading is separate and treats transcripts/artifacts as untrusted evidence.

Behavioral scenarios increased from **33 to 65**. Added cases cover full continuation, meaningful acceptance tests, real runtime, unavailable capabilities, bounded delegation, narrow authorization, preserved contracts, and irreversible recovery. Runnable API, frontend, and workflow fixtures support actual execution.

| Check | Observed result |
|---|---|
| Node tooling regressions | **176/176 pass**, up from 144 baseline tests |
| Structural skill validation | **26 skills**, zero errors/warnings; no legacy section exemptions |
| Lexical routing | **94/94 positive prompts rank first**; all 148 checks pass |
| Command, reference, artifact-path, version validators | Pass; nine command sets match and version remains `0.6.11` |
| Hook regressions | Session bootstrap **4/4**, cache **29**, simplification-ignore **49** pass |
| Behavioral dry-runs | All **65 scenarios** validate; no model calls |
| Workflow/API fixture baselines | Workflow **2/2**, retry service **1/1** pass |
| Frontend fixture | **2/2** tests; TypeScript/Vite build passes; dev server readiness observed; `/` and `/main.tsx` return HTTP 200 |
| Idea helper | Temp project path with spaces succeeds; target artifacts created without changing the pack |
| Whitespace/local links | `git diff --check` and local Markdown target checks pass |

Original skill cores contained **52,711 words**; current 26 cores contain **24,728**, a **53.1% reduction**, measured by whitespace splitting complete `SKILL.md` files against the baseline. The bootstrap contains 102 words. This measures core size, not model tokens, total loaded reference cost, or achieved quality.

### Unverified Behavior

A paired old/new router evaluation was attempted with Codex CLI `0.159.0-alpha.3`. The original-pack executor received **HTTP CONNECT 403** from the proxy to the Codex responses backend. No successful model response or project edits occurred; the stalled owned process was stopped. Partial error traces and run metadata remain in ignored eval results. The current-pack arm and model grading were not run. Claude was unavailable.

Consequently, natural activation, competition with other installed plugins, full lifecycle compliance, comparative quality, and token savings remain unmeasured. Lexical results and dry-runs cannot establish those outcomes. Browser/computer tools were unavailable: frontend tests/build/startup/HTTP checks ran, but rendered interaction and assistive-technology behavior remain unverified. Native plugin installation/model cases were not rerun.

### Reproduce

```bash
node --test scripts/*test.js scripts/lib/*test.js
node scripts/validate-skills.js
node scripts/validate-reference-links.js
node scripts/validate-commands.js
node scripts/validate-artifact-paths.js
node scripts/validate-versions.js
node scripts/run-evals.js --min-rank1 95
bash hooks/session-start-test.sh
bash hooks/sdd-cache-test.sh
bash hooks/simplify-ignore-test.sh
```

Use the [eval guide](../evals/README.md) for paired model runs after backend access is restored, and fixture READMEs for their application commands. To validate automatic activation, also run natural-request plugin cases with the intended host, explicit model/CLI, competing-plugin configuration, and actual tool/artifact inspection.

## README and Banner Follow-up

The README now matches all 26 skill identifiers, nine shared references, four
personas, and 65 behavioral scenarios. Its workflow ends at Handoff, with release
subject to authorization. Removed outdated skill summaries and clarified full-pack
activation, skill-only installation limits, command namespaces, Gemini's
`/planning`, Codex CLI skill mentions, and on-demand Windsurf rules. The adoption
guide's catalog anchor now points to all 26 skills.

Replaced `docs/images/e6-agent-skills.png` with the generated 1672×941 banner:
one coordinator connects the six phases, supported by context on demand and
`e6-caveman`, with domain specialists and an optional authorized release branch.
The saved PNG is an exact copy of the inspected generation; the source is retained.

Verified 74 local documentation links/anchors, inventories, PNG chunk checksums,
all repository validators, and lexical routing. Executed the README's bootstrap
commands in disposable projects for Codex, OpenCode, Gemini, and Claude: preview
preserves files, write preserves existing rules, check passes, and repeat write is
unchanged. Codex plugin command syntax matches installed CLI help. Remote plugin
installation and live model behavior were not rerun for this documentation change.

This report records implementation and local verification. Publication and CI status are tracked separately in the pull request; merging and deployment are outside this change.
