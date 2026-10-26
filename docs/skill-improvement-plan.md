# Improvement Plan: Third Pass

Date: 2026-10-25. Inputs:
- the [benchmark](../evals/benchmark/README.md) natural-mode run: 75 runs, 3 arms, 5 tasks;
- an analysis of [Compound Engineering](https://github.com/everyinc/compound-engineering-plugin) at `f58f47e7` (MIT) and [Caveman](https://github.com/JuliusBrussee/caveman) (Apache-2.0).

Only patterns are adapted. No upstream text is copied.

## What the benchmark showed

| Finding | Evidence | Consequence |
|---|---|---|
| The e6 bootstrap reached the model and was ignored | 0 of 25 e6 runs loaded the coordinator; the model quoted the bootstrap verbatim when asked | A pointer ("load skill X") is not enough. The behaviors that matter must be in the always-on text itself |
| The pack cost more without changing behavior | e6 cost $0.081 per run vs $0.059 for the baseline (+37%); same process score (0.35) | Every always-on word must change behavior, or it is waste |
| e6 guessed on the underspecified task | `ambiguous-login-rate-limit`: outcome 93%, and the lowest test quality (34%); 0 questions asked | Material values (limits, windows, error semantics, roles) must be asked about, with recommended defaults, not invented |
| No review, no runtime check, and rare failing-test-first in any arm | Review 0%, runtime check 0%, RED-before-GREEN 20% | These steps need explicit, cheap triggers, not just phase descriptions |
| A blind judge preferred pack output | First-place rate: e6 44%, Superpowers 44%, baseline 12%; test rating 3.8 vs 3.0 | Even partially loaded guidance helps quality. Making it reliable is the lever |

## Goals and the change that serves each

| Goal | Change |
|---|---|
| Best requirement coverage | A Product Owner role with flow analysis (happy and unhappy paths, permissions, states, integrations); every gap gets a question and a recommended default. A material-value rule in the bootstrap |
| Few tokens | Caveman levels (`lite` for the user, `full` for progress, `ultra` for agent-to-agent traffic). Pass paths, not content. Specialists only when the change touches their surface. Model tiers by role |
| No unnecessary comments | A comment policy in the shared [code-quality reference](../references/code-quality.md): delete by default, a short keep list, encode the rule as a test or type instead. Enforced in build and review |
| Best test coverage | A QA engineer owns a requirement → test → evidence traceability matrix. The mutation mindset ("which bug would this test catch?") becomes a review check |
| Easy to use | One request still runs everything. The Tech Lead announces the team in one line per specialist |
| Clear, focused work | Bounded packets with owned paths; specialists return findings in one schema; no specialist runs "just in case" |
| Nothing forgotten | The traceability matrix must be complete before handoff. Final validation re-reads the spec and plan after any compaction |
| Production-ready shipping | An SRE readiness pass (deploy, config, migrations, observability, rollback) plus QA sign-off; open items go to "Needs your decision" |
| Well-written code | A code-quality reference covering SOLID, clean architecture boundaries, pattern use only when it removes duplication or coupling, naming, and small functions. Backend and frontend engineers apply it; review checks it |
| Specialist agents | New personas:<br>• `tech-lead`<br>• `product-owner`<br>• `backend-engineer`<br>• `frontend-engineer`<br>• `ui-ux-designer`<br>• `qa-engineer` (replaces `test-engineer`)<br>• `sre-engineer`<br>Kept:<br>• `security-auditor`<br>• `code-reviewer`<br>• `web-performance-auditor` |
| Subagents speak caveman ultra | Packets and returns use `ultra`, with a fixed return grammar and terminal tokens. Persisted artifacts and anything a human reads stay normal prose |
| Detailed final explanation | A handoff template in the contract: what was built, a requirement coverage table, how it was validated, review results, risks and needs-your-decision, how to try it. Written in full sentences |

## Work items

1. **`e6-caveman`:** three levels with a shared floor of never-compressed content; `ultra` return grammar for workers.
2. **`references/team.md`** (new):
   - roster and selection rules;
   - packet and return format;
   - the findings schema with discrete confidence (50/75/100) and a quote-the-line gate;
   - dedupe rules;
   - model tiers by role, inheriting when names are unknown.
3. **`references/code-quality.md`** (new): clean-code, SOLID, and architecture checklist plus the comment policy.
4. **Workflow contract:**
   - communication levels;
   - final explanation template;
   - traceability-matrix gate;
   - material-value questions.
5. **Bootstrap:** inline the six behaviors the benchmark showed missing (classify, ask material values, failing test first, run it, review, explain). The coordinator remains the full procedure.
6. **Coordinator:**
   - the Tech Lead role;
   - team selection per change surface;
   - final validation against the matrix;
   - the handoff template.
7. **Personas:** 7 new or replaced, 3 updated; `docs/agents.md` and README tables.
8. **Skills:**
   - spec (product-owner flow analysis);
   - code review (confidence anchors, comment and quality checks);
   - incremental implementation (comment policy);
   - TDD (traceability);
   - shipping (SRE + QA sign-off, needs-your-decision);
   - frontend (UI/UX review handoff).
9. **Evals:** a spec-skill case that rewards asking about material values; run the benchmark with this revision as a new arm against the previous e6 snapshot and Superpowers.

## Verification

- Repository tests, validators, routing evals ≥95% rank-1, and the hook-size bound.
- Benchmark: compare the new e6 against the previous e6 snapshot on the same tasks and model. Success means:
  - higher outcome on `ambiguous-login-rate-limit` through asking;
  - non-zero review and runtime-check rates;
  - cost per run no higher than the previous e6 arm on small tasks.
