# Orchestration Patterns

Use one workflow coordinator. `using-e6-agent-skills` advances applicable phases in the current session; commands specify scope, personas supply viewpoints, and workers return evidence. Existing authorization persists. See [workflow contract](workflow-contract.md).

## Choose a Pattern

| Work | Pattern | Evidence returned |
|---|---|---|
| Small or dependent task | Coordinator performs steps directly | Criterion/check/runtime outcomes |
| Independent read-heavy investigations | Scoped parallel workers | Decisive findings and source pointers |
| Independent edits with settled contracts | Disjoint worker paths; coordinator integrates | Changed paths, criteria, checks, blockers |
| Material uncertain decision | Bounded independent review via doubt skill | Violated contract and counter-evidence |
| Release readiness with distinct risks | Targeted specialist passes; parallel only when independent | Candidate-bound findings and readiness evidence |

A sequential lifecycle is valid inside the coordinator. It does not need a separate agent for every phase or a user command at each handoff. Plan/spec/review-only requests remain bounded. The coordinator continues implementation requests through actual verification and review.

## Worker Contract

Packets, returns, ownership, and worktree isolation follow the [workflow contract](workflow-contract.md#delegation). A worker reports results; the coordinator decides next steps and verifies integrated behavior. Detailed logs belong in artifacts. Shared contracts, fixtures, migrations, and integrated verification need coordination before parallel writes. Bound retries and review loops by concrete unresolved issues; routine tasks need no fan-out.

### High-Risk Review Fan-Out

For diffs touching auth, persisted data, payments, public APIs, or migrations, the Review phase may run `code-reviewer`, `security-auditor`, and `qa-engineer` in parallel on the same scoped diff. Each returns findings on the contract's severity scale. The coordinator deduplicates by location and failure scenario, re-reads the code for each Critical/Required finding, and resolves conflicts by evidence. Run passes sequentially when parallel workers are unavailable, and say so.

## Host Adaptation

Use the harness's actual delegation tools. If workers are unavailable, perform appropriate passes sequentially and say so. Do not narrate fictitious parallel execution. Host restrictions on nested agents, teams, tools, and permissions still apply.

Claude Code can expose plugin personas through its Agent tool. Agent Teams may support peer discussion for competing hypotheses where available. Neither mechanism is a prerequisite for the portable skills. Use teams only when interaction changes the result; independent reports usually need only workers plus one synthesis step.

## Avoid

- A router worker that only paraphrases another worker.
- Full-history forks for small scoped tasks.
- One implementation worker per trivial edit or a forced three-reviewer audit.
- Overlapping writes or unowned integration work.
- Persona chains, nested coordinator trees, or repeated approval gates.
- Declaring success from worker claims without checking the diff/runtime.
- Treating disagreement as resolved by a vote rather than evidence.
- Inventing model choices, cost savings, parallel execution, or unavailable tools.
