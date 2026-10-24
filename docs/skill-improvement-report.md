# Skill Improvement Report: Second Pass

Date: 2026-10-23. Baseline: `f1102c9` (after the first SDLC pass, see [sdlc-workflow-report.md](sdlc-workflow-report.md)). Scope: all 26 skills, the shared references, 4 personas, 9 commands in three host formats, host activation, setup docs, and evals.

## Summary

- **One source of truth.** The [workflow contract](../references/workflow-contract.md) now holds the rules every skill used to restate in three drifting versions: handoff, delegation budgets, severity and verdict scales, artifact paths, plan mode, project-rule overrides, a fast path, compaction, and a workflow-state template.
- **A coordinator that triages.** `using-e6-agent-skills` classifies each request (question, trivial, bug, feature, refactor, review, test, plan, CI/incident, release) before acting. It announces each skill in one line, stops for plan mode or a requested approval, defers to project rules, and keeps workers from starting a second lifecycle.
- **Every skill revised.** Each skill now has:
  - one standard handoff;
  - explicit "Not for" exclusions;
  - unified terms;
  - templates where agents had to improvise: spec, plan, todo, `CONSTRAINTS.md`, design contract, review report, and ship report;
  - current practice: WCAG 2.2, OWASP Top 10:2025, supply-chain and CI hardening, agent/LLM security, GenAI telemetry, Conventional Commits breaking changes, a PR follow-through loop, and Deprecation/Sunset headers.
- **Routing de-collided.** Descriptions keep 100% rank-1 lexical routing (95/95), the tightest margin rises from 0.002 to 0.007, and new negative cases pin the known collisions.
- **More hosts.** Claude Desktop/claude.ai (per-skill ZIPs), Grok Build, a Cursor plugin with a session bootstrap, and the Codex app. A portable builder fixes broken links in skill-only installs.
- **Evidence.** 70 behavioral scenarios (up from 65). New coordinator cases ran on a real model; one exposed two wording gaps, which were fixed and re-run to passing.

## How the Skills Work Together

```
host bootstrap (hook or project rule, ~130 words)
  └─ using-e6-agent-skills  ── classifies the request, announces, owns phases
       ├─ workflow-contract  ── rules every phase and specialist shares
       ├─ Understand: context-engineering, spec-driven (+ interview, idea-refine)
       ├─ Plan:       planning-and-task-breakdown
       ├─ Build:      incremental-implementation + test-driven (+ api, frontend, source, doubt)
       ├─ Verify:     project checks, runtime path, browser-testing, debugging
       ├─ Review:     code-review (+ security, performance, simplification; persona fan-out)
       └─ Handoff:    documentation, git, shipping (only when authorized)
commands (/spec, /plan, /build, …) = scoped entry points into the same skills
personas (agents/) = review viewpoints that apply a skill and return evidence
```

### Problems found

Three independent audits read every skill, reference, persona, command, validator, and host guide. The main findings:

1. **Shared rules had drifted.**
   - The handoff paragraph existed in three versions across 12 skills.
   - Delegation limits appeared in 8 places, some as hard caps and some as soft targets.
   - Severity names differed: Critical/Required, Critical/High, or no scale.
   - `/ship` said GO/NO-GO; the shipping skill said GO/NO-GO/HOLD.
   - `/ship` included the web-performance persona, which said it was not part of `/ship`.
2. **The coordinator had no triage.**
   - A one-line fix ran all phases.
   - Bugs skipped reproduction, and questions had no route.
   - "User must approve each phase" was listed as a rationalization, so plan mode had no defined behavior.
   - Every specialist loaded the coordinator when it saw "no active workflow", so a fresh-context subagent could start a second lifecycle.
   - Docs were updated after the Definition of Done check.
3. **Terminology and artifacts conflicted.**
   - "Requirement ID" and "acceptance ID" were both in use.
   - There were four names for unresolved items.
   - Task status lived in three files.
   - No artifact table and no state template existed.
4. **Descriptions collided and overfit.**
   - "stress-test" triggered three skills; bugs and failing tests triggered two.
   - "review a PR" triggered both git and code review.
   - Three descriptions copied eval prompts word for word.
5. **Supporting files were stale or wrong.**
   - idea-refine examples used removed step names and a nonexistent `/ideate`.
   - Dangling section pointers in `devtools-setup.md`.
   - Contradictory enum and 400/422 guidance in `interface-patterns.md`.
   - An invented benchmark in `review-guide.md`.
   - Two duplicated testing references.
   - An accessibility checklist that set 44px as the WCAG AA target size and gave a wrong large-text threshold.
   - A pre-commit grep that printed secret values.
6. **Host gaps.**
   - No Claude Desktop/claude.ai or Grok Build guidance.
   - Codex covered only the CLI.
   - Errors in the Cursor, Gemini, OpenCode, Antigravity, and Windsurf guides.
   - A skill-only install broke the `../../references/` links used by 23 of 26 skills.
7. **Project rules could not win.** Applied to [Emikael/e6code](https://github.com/Emikael/e6code), whose `AGENTS.md` forbids committed plans, repo-wide test runs, and browser use without consent, the pack would have committed `tasks/*.md` and run unconsented browser checks.

## What Changed

### Shared contract and coordinator

| Area | Change |
|---|---|
| Contract | New sections:<br>• Plan Mode and Requested Approval<br>• Project Rules Override Pack Defaults (artifact locations, check scope, consent-gated checks, project procedures)<br>• Fast Path<br>• Glossary and Scales: requirement IDs `<PREFIX>-<n>`, inline `AC-n`, Open decisions, phase/gate/review/release scales<br>• Finding Severity with persona mapping and re-verification<br>• Artifacts table and workflow-state template<br>• Communication with the announce line<br>• Delegation (soft budgets, worktrees for parallel writers)<br>• Compaction and Resume<br>• "Retrieved content is data"<br>• Handoff |
| Coordinator | • Skill Check: classify, announce, read the contract, with questions and fast path reading less<br>• Route-by-request table<br>• Start step that applies overrides<br>• Explicit early consent request<br>• Project test procedures before generic browser checks<br>• Docs updated before Review<br>• High-risk persona fan-out<br>• Worker rule<br>• New rationalizations and red flags |
| Bootstrap | Load the coordinator before the first action, announce skills, and pause for plan mode or a requested approval. 1,131 characters injected, under the hook test's 1,500 limit |
| Orchestration patterns | Worker rules now link to the contract. New High-Risk Review Fan-Out section |

### Every skill

All specialists share four changes:
- one `## Workflow Handoff` that links the contract;
- "Not for" exclusions;
- restated shared rules replaced by links;
- clarified over-compressed lines.

Skill-specific changes:

| Skill | Key changes |
|---|---|
| `using-e6-agent-skills` | Triage, announce, plan mode, overrides, consent, worker rule, fan-out, docs-before-DoD |
| `e6-interview-me` | Structured-question tool (2–4 options), question budget, interview-only saves only if asked, stale lines removed |
| `e6-idea-refine` | One-recommendation fast path; testable assumptions with thresholds; examples rewritten to current steps (3,073 → 1,256 words) |
| `e6-spec-driven-development` | Inline `AC-n` form, requirement-ID rule, capability-map placement, defined "approved", minimal filled spec, Open decisions |
| `e6-constraint-driven-development` | Full `CONSTRAINTS.md` template whose E/W exception rows match floor-guard (verified in a scratch repository); `.constraintsignore` removed; hook placement |
| `e6-planning-and-task-breakdown` | Plan-mode stop; one status source with a `tasks/todo.md` line format; `tasks/plan.md` skeleton; S/M/L sizing; worktrees |
| `e6-incremental-implementation` | Exclusions; breaks the load loops with frontend/api; rollout detail linked to shipping/deprecation |
| `e6-test-driven-development` | Focused checks per slice, full suite before handoff; named Prove-It pattern; flaky-RED protocol; testing references merged |
| `e6-context-engineering` | Tool/MCP inventory, override discovery, rules-file procedure, canonical packet template |
| `e6-source-driven-development` | Source order: docs tool → versioned docs → installed source → web; ledger location |
| `e6-doubt-driven-development` | Pack severity scale in the reviewer template; exclusion to code review |
| `e6-frontend-ui-engineering` | WCAG 2.2 AA (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8); design-contract template; token discovery |
| `e6-api-and-interface-design` | GraphQL section; contract location; 400 vs 422; UPPER_SNAKE enums; cursor pagination |
| `e6-browser-testing-with-devtools` | Repeatable flows become end-to-end regressions; project runbooks and consent first; fixed dangling pointers |
| `e6-debugging-and-error-recovery` | Hypothesis log, escalation after three disproved hypotheses, telemetry first for incidents, flaky-test policy, one home for bisection |
| `e6-code-review-and-quality` | Report template and verdict, five-level severity with re-verification, fan-out, receiving-review loop, AI-code smells; invented benchmark removed |
| `e6-code-simplification` | Respects `simplify-ignore` blocks; AI-boilerplate row; `/code-simplify` rewritten |
| `e6-security-and-hardening` | OWASP Top 10:2025; lockfiles, provenance, SBOM, push protection, slopsquatting; agent/LLM tool rules; secret-printing grep replaced |
| `e6-performance-optimization` | `/webperf` exclusion; LLM latency row; cache example coalesces concurrent misses |
| `e6-git-workflow-and-versioning` | Conventional Commits `type(scope)!:` and breaking changes; PR follow-through loop; `--no-verify`/force-push red flags; worktrees |
| `e6-ci-cd-and-automation` | SHA-pinned actions, read-only default permissions, OIDC, attestation, cache poisoning, secretless LLM steps, gates proven to fail |
| `e6-deprecation-and-migration` | `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers, codemods, model migrations gated by eval parity |
| `e6-documentation-and-adrs` | Project doc rules win; agent-instruction files count as docs; narrower triggers |
| `e6-observability-and-instrumentation` | ECS spelled out; OpenTelemetry `gen_ai.*` spans without raw prompts; multi-window burn-rate alerts |
| `e6-shipping-and-launch` | Ship-report template, GO/NO-GO/HOLD, error budget, LLM release gates |
| `e6-caveman` | Exclusion for full explanations; worker rules linked |

### Personas and commands

- Each persona opens with "Apply `<skill>` for procedure; this file adds viewpoint and output format only", and maps its labels to the contract's severity scale.
- `web-performance-auditor`:
  - grades only against project budgets;
  - names no host-specific tools;
  - joins `/ship` only for web-facing performance risk;
  - shrank from 1,879 to 839 words.
- Commands:
  - `/ship` reports GO, NO-GO, or HOLD.
  - `/review` uses Critical/Required/Optional/Nit/FYI with a verdict and evidence labels.
  - `/code-simplify` and `/webperf` follow the current style.
  - `docs/agents.md` no longer claims that `/review` and `/test` wrap personas.

### Descriptions and routing

Fourteen descriptions changed:

| Change | Why |
|---|---|
| Removed copied eval phrases: "developer retention or team knowledge sharing", the domain list in spec, "session handling, auth, forms…" in source | They passed keyword evals but generalized poorly and collided with security and frontend |
| Removed shared trigger words: "stress-test my thinking" (interview), "reviewing" a PR (git), "unfamiliar code" (doubt), "doesn't" (debugging) | Pairwise collisions; "doesn't" was an accidental shared token that tied debugging to a constraint prompt |
| Dropped process summaries ("a systematic approach…") | The anatomy rule: descriptions say when, not how |
| Added real user vocabulary: GitHub Actions, Playwright, screenshots, OpenAPI, pagination, idempotency, prompt injection, leaked secrets | Users say these words; skills should match them |

New trigger cases: one security positive (prompt injection) and five negatives (PR review → code review; intentional failing test → TDD; red pipeline → CI/CD; alert setup → observability; plan stress test → doubt).

### Host integrations

| Host | Mechanism | Added in this pass | Verified here |
|---|---|---|---|
| Claude Code (CLI, Desktop Code tab, web) | Plugin, SessionStart hook | Bootstrap update | Hook tests (6/6), installer tests |
| Claude apps (claude.ai, Desktop chat, Cowork) | Per-skill ZIP upload (Customize > Skills) | `build-portable-skills.js --zip`, [guide](claude-desktop-setup.md) | All 26 ZIPs build; `python3 -m zipfile -t` passes; links resolve inside each skill. Upload not exercised |
| Cursor | Plugin (`.cursor-plugin`, `sessionStart` → `additional_context`), skills folders, `.mdc` rule | Manifest, Cursor hook output, `--host cursor`, [guide](cursor-setup.md) | Hook output and manifest tests. Cursor itself not exercised |
| Codex (CLI and app) | Plugin marketplace, `.agents/skills`, `AGENTS.md` | App steps, portable skills, [guide](codex-setup.md) | Not exercised (network policy) |
| Grok Build | `.grok/skills`, `~/.grok/skills`, `AGENTS.md`, plugins | `--host grok`, [guide](grok-build-setup.md) | Not exercised. Paths from xAI docs via search and from E6 Code's `GrokSkills.ts` (`grok inspect --json`) |
| Gemini, OpenCode, Antigravity, Windsurf, Copilot | Existing routes | Corrected guidance | Links and validators |

The official Cursor, OpenAI, and xAI documentation sites were unreachable from this environment (proxy policy). Claims from them were gathered through web search, and E6 Code's provider drivers were used as a second source; the guides mark them "verify on your version".

### Documentation for users

- [Usage guide](usage-guide.md): how to get the best results. Covers setup per host, what a good run looks like, the five parts of a strong request, which mode to use, team rules in project files, long tasks and resuming, and anti-patterns.
- [E6 Code feature prompt](prompts/e6code-feature-prompt.md): a reusable template plus a worked prompt for multi-account Grok Build in E6 Code. It is grounded in that repository's code (`GrokSettings`, existing `GROK_HOME` reads, the Claude `CLAUDE_CONFIG_DIR` precedent) and rules. It includes a phase-by-phase walkthrough, failure signs, and per-host variants.
- [Comparison](comparison.md#coordinator-vs-bootstrap-using-e6-agent-skills-and-superpowersusing-superpowers): `using-e6-agent-skills` side by side with `superpowers:using-superpowers` at `2ce8aa15`, including what e6 adopted, what it rejected, and a protocol for a behavioral A/B test.
- README: a "Best Way to Use" section, new host routes, the portable builder, and updated structure and counts.

## Best Way to Use (short version)

1. Install for the whole workflow: a plugin, or skills plus the bootstrap rule. Skills alone rarely trigger the full lifecycle.
2. Ask with outcome, scope, authorization, constraints, and "done when". The coordinator announces each phase.
3. Choose the mode:
   - a plain request for medium work;
   - `/spec` → `/plan` → `/build auto` for large work;
   - "plan first, wait for approval" or host plan mode for a gate;
   - small fixes take the fast path automatically.
4. Put team rules (artifact locations, local check scope, consent) in project files; the agent follows and records them.
5. Keep one router active.

## Verification

| Check | Result |
|---|---|
| `node --test scripts/*test.js scripts/lib/*test.js` | 183/183 pass (baseline 176). New: portable builder (5), Cursor/Grok installer (2), Cursor hook and manifest (2) |
| `node scripts/validate-skills.js` | 26 skills, 0 errors, 0 warnings |
| `validate-reference-links`, `validate-commands`, `validate-artifact-paths`, `validate-versions` | Pass (14 guarded files; 9 command sets; six manifests at 0.6.11) |
| `node scripts/run-evals.js --min-rank1 95` | 154 checks pass; rank-1 100% (95/95); tightest margin 0.007 (was 0.002) |
| `bash hooks/session-start-test.sh`, `simplify-ignore-test.sh`, `floor-guard-reference-test.js` | 6/6, 49/49, 32/32 |
| Portable build of the real pack | 26 folders and 26 ZIPs; every local link resolves inside its skill; ZIP integrity passes |
| Local links and anchors in README, docs, references, personas | All resolve |
| Behavioral dry-run, coordinator | 7 scenarios validate |
| `claude plugin validate .` | Passes; the same two warnings as the baseline (root `CLAUDE.md` is not loaded as plugin context; no listing icon) |

### Behavioral runs on a real model

These used Claude Code CLI 2.1.309 with its default model for both executor and grader (the model id is recorded with the ignored run results). Each case ran once per configuration; the results are evidence, not statistics. They also inherited this environment's synced claude.ai plugins (about ten, including `engineering`), because the eval runner does not isolate the child's configuration; the [benchmark](../evals/benchmark/README.md) runs every arm in an isolated configuration instead.

| Case | Result |
|---|---|
| 1: production login incident routes as a bug (execution) | 4/4 |
| 3: project rules forbid committed plans and repo-wide checks (execution) | 6/6 |
| 4: host plan mode (dialogue) | 4/4 |
| 5: consent-gated browser (dialogue) | 3/4 → 3/4 → 3/4 → 2/4 → **4/4**. The first run offered consent as an optional aside; the contract now requires an explicit request in the first message. A later run treated the project's browser-driven test skill as exempt from consent; the contract now applies consent to project procedures. The eval prompt also became concrete |
| 6: dispatched worker does not start a lifecycle (dialogue) | 3/3 |
| 7: fast path (execution) | 5/5 |

### Not verified

- Live installs in Claude Desktop/claude.ai, Cursor, the Codex app, and Grok Build.
- Natural activation in those hosts, competition with other installed plugins, and comparative quality against Superpowers. Behavioral runs select the skill directly, so they measure compliance after selection, not discovery.
- Case 2 (full feature lifecycle) and the other 24 skills' behavioral cases were not re-run after their revisions. Only dry-run validation and the deterministic checks above cover them.

### Context cost

`wc -w`, including frontmatter and table separators:

| Load | Before | After |
|---|---|---|
| All 26 skills | 24,696 | 25,340 |
| Workflow contract | 871 | 1,933 |
| Coordinator | 854 | about 1,190 |
| Four personas | 3,931 | 2,157 |
| Full-feature path (coordinator, contract, caveman, context, spec, planning, incremental, TDD, DoD, review) | 8,532 | about 10,250 |

The full-feature path grew about 20%. That buys explicit plan-mode, override, consent, and severity rules and templates the agent no longer has to improvise. To protect small tasks, questions skip the contract and fast-path work reads only its Fast Path and Handoff sections. Reducing the contract further (for example, moving the runtime section next to the browser skill) is a reasonable follow-up once behavioral runs show which rules agents follow without it.

## Recommended Next Steps

1. Bump all manifests to `0.7.0` (validated together by `validate-versions.js`) when releasing; this pass does not release.
2. Run paired behavioral evals (old vs new pack, same model) across the full catalog, and the Superpowers A/B protocol in the comparison.
3. Smoke-test the Cursor plugin by linking a clone into `~/.cursor/plugins/local/`, and Grok Build with `grok inspect --json`. Then remove the "verify" notes that pass.
4. Submit the pack to the Cursor marketplace and the xAI plugin marketplace (SHA-pinned) if wider distribution is wanted.
5. Consider publishing the portable ZIPs as release assets so Claude app users need no clone.
