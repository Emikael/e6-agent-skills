# SDLC Benchmark: Same Tasks, Different Skill Packs

This benchmark answers one question with measured numbers: given the same model, the same repository, and the same request, which skill pack delivers better software? Each **arm** is one configuration of Claude Code:

| Arm | What loads |
|---|---|
| `baseline` | Claude Code as shipped: built-in skills only, no skill pack |
| `e6` | This repository as a plugin, snapshotted with `git archive` of its plugin paths at the run's commit |
| `e6-prev` | The same, at the earlier commit `5e5a529` pinned in [`arms.json`](arms.json). The tag `benchmark/e6-prev` keeps it reachable after a squash merge; without a ref on origin, CI cannot build the arm |
| `superpowers` | [obra/superpowers](https://github.com/obra/superpowers), pinned to a commit in [`arms.json`](arms.json) |

The harness lives in [`scripts/run-benchmark.js`](../../scripts/run-benchmark.js) and [`scripts/lib/benchmark/`](../../scripts/lib/benchmark/). Published results: [docs/benchmark-results.md](../../docs/benchmark-results.md).

## Tasks

Each task is a small, dependency-free Node.js project under [`tasks/`](tasks/).

| Task | Kind | What it probes |
|---|---|---|
| `feature-status-filter` | Feature with explicit acceptance criteria | Criteria → tests → code → runtime check |
| `bugfix-split-cents` | Bug report with a reproduction | Failing regression test before the fix |
| `refactor-shipping-cost` | Behavior-preserving refactor | Characterization first; no behavior change |
| `ambiguous-login-rate-limit` | Underspecified feature | Asking about material decisions instead of guessing |
| `secure-tenant-invoices` | Endpoint with authorization | Tenant isolation, response allowlist, no existence leaks |

A task directory holds:

- `repo/`: the seed project the agent works in. It contains `REQUEST.md`, project rules in `AGENTS.md`, code, and visible tests.
- `hidden/`: acceptance tests. They are never copied into the agent's workspace and run only at scoring time.
- `reference/`: a correct implementation of the task's interface files.
- `mutants.json`: planted bugs, as exact find/replace patches on the reference, used to grade the agent's own tests.
- `answers.md`: the user's real decisions, available only to the simulated user.
- `task.json`: the prompt, interface files, visible tests, and runtime kind.

`node scripts/run-benchmark.js validate` proves every task is well-formed, with no model calls. It checks that:
- the seed fails the hidden tests (refactors must pass them);
- the reference passes them;
- every mutant is caught by them.

CI runs it.

## How a run works

1. **Workspace.** A fresh git repository is created from `repo/`.
2. **Isolation.** The agent gets a new Claude config directory that holds only a copy of your credentials. The run uses:
   - an allowlisted environment, with no parent-session variables;
   - `--setting-sources project` and `--strict-mcp-config`;
   - the arm's plugin via `--plugin-dir`, materialized in a temporary directory outside the repository. Local arms archive only the plugin paths (`.claude-plugin`, commands, `skills`, `agents`, `hooks`, `references`, `evals/plugin`), so no plugin carries hidden tests, reference solutions, answer keys, or the docs that describe them.

   The session's `init` event must list exactly the arm's plugins, with Claude Code built-ins allowed. Otherwise the run is marked `contaminated` and excluded.
3. **Same prompt everywhere.** "Implement the change described in REQUEST.md … Follow AGENTS.md. Tell me when you are done."
   - Local commits are allowed; pushing and new dependencies are not.
   - Web tools are disabled for every arm.
4. **Simulated user.** When the agent stops, a separate tool-less call with the same model plays the user. It answers questions only from `answers.md`, approves a design that matches the answer key, nudges an agent that stopped mid-work, or declares the task done.
   - Up to 4 replies, resumed with `--resume`.
   - This lets workflows that ask before building (Superpowers' brainstorming, e6's interview) be measured fairly instead of failing at their first question.
5. **Scoring** of the delivered code: the working tree with commits, or a branch or worktree when the main tree is untouched.

## Metrics

| Dimension | How it is measured | Weight |
|---|---|---|
| Outcome | Fraction of hidden acceptance tests that pass, halved if the original tests break or are deleted | 0.45 |
| Test quality | The agent's added or changed tests must pass against `reference/`; score = share of `mutants.json` they catch (0 if invalid or absent) | 0.20 |
| Process | From the transcript, including subagents:<br>• failing test before the first source edit (refactor: a baseline test run first)<br>• runtime check on HTTP tasks<br>• tests run after the last edit<br>• review evidence (a review skill or subagent) | 0.20 |
| Scope & safety | 1, minus 0.5 each for: added dependencies, deleted or skipped existing tests, a push attempt | 0.15 |

Also reported, not scored:
- cost (USD), output tokens, turns, and wall time;
- simulated-user replies, by kind (answer, approval, nudge);
- subagent dispatches;
- refactor complexity (decision points and nesting before and after).

With `--judge`, a blind reviewer sees each task's final diffs from all arms, with anonymous labels in random order. It rates correctness, tests, readability, and scope (1–5) and ranks them.

Statistics:
- every mean comes with a 95% percentile bootstrap interval;
- head-to-head rows give the difference in means with its interval and paired win/tie/loss counts per task and repetition;
- the RNG is seeded, so `report` is reproducible.

## Running it

Each run is a real model call on your account. Pin the model; the CLI updates itself, and the default model can change between runs.

```bash
node scripts/run-benchmark.js validate
# Smoke: one task, every arm
node scripts/run-benchmark.js run --model <model-id> --effort medium --tasks feature-status-filter --max-cost-usd 8
# Pilot and full runs
node scripts/run-benchmark.js run --model <model-id> --effort medium --reps 1 --judge --max-cost-usd 25
node scripts/run-benchmark.js run --model <model-id> --effort medium --reps 5 --judge --max-cost-usd 120
# Re-render a report, and publish a summary without the model id
node scripts/run-benchmark.js report evals/benchmark/results/<run-id> --publish docs/benchmark-results.md
```

Options:
- `--arms` and `--tasks` select subsets.
- `--concurrency` (default 1) runs runs in parallel. Agents sometimes stop processes by name (`pkill`), which can disturb a parallel run, so keep it at 1 for published numbers.
- `--per-run-usd` caps a single run.
- `--max-cost-usd` stops launching new runs once spent.
- `--judge-model` picks a different judge.

Raw results go to `evals/benchmark/results/<run-id>/`, which is git-ignored:
- `metadata.json`: CLI version, model, effort, arm and task hashes, seed, cost;
- per-run `agent-N.jsonl` and `user-N.jsonl` traces, `run.json`, and `diff.patch`;
- `judge/`;
- `summary.json` and `report.md`.

## Threats to validity

Read results with these in mind:

- **Home advantage.** The tasks were written in this repository, by people who also wrote the e6 skills. The prompts avoid e6 vocabulary, and one task (`ambiguous-login-rate-limit`) rewards asking before building, a Superpowers strength. Even so, outside task suites would strengthen any conclusion.
- **One host, one model.** Results hold for Claude Code with the pinned model and effort. Packs may rank differently on other models or hosts.
- **Simulated user.** The same model plays the user and can be inconsistent; its replies are logged per run. Because it answers only what is asked, packs that never ask lose the hidden decisions in the ambiguous task by design.
- **Heuristic process metrics.** Test-first, runtime, and review are detected from commands and tool calls. Unusual commands can be missed; spot-check traces before drawing conclusions about process.
- **Mutation scoring** swaps in the reference interface file. Tests that only exercise new internal helpers can miss mutants, even when they are reasonable unit tests.
- **Small n.** Agent runs are stochastic. Treat any difference whose interval crosses zero as inconclusive, and prefer 5 or more repetitions.
- **Benchmark leakage.** A tool call that names `evals/benchmark`, a hidden test file, or `answers.md` marks the run `contaminated`. Skill and persona examples must not echo a task's answer key; check new examples against every `answers.md`. Runs published before this check existed did not have it (see [benchmark results](../../docs/benchmark-results.md)).
- **Built-ins.** Claude Code's built-in skills (for example `code-review`, `debug`) are present in every arm, including the baseline.
