# Usage Guide: Getting the Best Results

This guide is for people using the pack day to day. Installation lives in the [README](../README.md#quick-start) and the per-host setup guides; the rules the agent follows live in the [workflow contract](../references/workflow-contract.md). Here: how to set it up, how to ask, and which mode fits which job.

## 1. Set up for the whole workflow

The coordinator (`using-e6-agent-skills`) only runs the full lifecycle when the host selects it. Pick the strongest option your host offers:

| Host | Best setup | Guide |
|---|---|---|
| Claude Code (CLI, Desktop Code tab, web) | Plugin: skills, commands, personas, session bootstrap | [README](../README.md#quick-start) |
| Claude apps (claude.ai, Desktop chat, Cowork) | Upload skill ZIPs; ask for the e6 workflow | [Claude Desktop](claude-desktop-setup.md) |
| Cursor | Plugin, or skills folder + always-applied rule | [Cursor](cursor-setup.md) |
| Codex (CLI and app) | Plugin + `AGENTS.md` bootstrap | [Codex](codex-setup.md) |
| Grok Build | Skills in `.grok/skills` + `AGENTS.md` bootstrap | [Grok Build](grok-build-setup.md) |
| Gemini CLI, OpenCode, Copilot, Windsurf, Antigravity, Command Code | Native skills + bootstrap rule | [docs/](.) |

Keep **one** workflow router active. If another skill pack also routes requests (for example Superpowers), choose one in project rules; borrow individual skills from the other. See [comparison](comparison.md#combining-them).

## 2. Know what a good run looks like

For a feature request you should see, in order:

1. `Using using-e6-agent-skills for …`, then a short scope statement and any Open decisions.
2. Acceptance criteria, as inline `AC-n` lines for small work or a spec for larger work.
3. For multi-slice work, a plan with tasks mapped to criteria and checks.
4. For each slice, a failing test, then the implementation, then a passing test.
5. Project checks plus an exercised runtime path: an endpoint call, a CLI run, or a browser interaction. Otherwise, an exact blocker.
6. A review with severities, fixes for Critical/Required findings, and rerun checks.
7. A handoff: what changed, the commands with their results, the risks, and the next action.

If a step is missing, ask for it by name ("show the failing test first", "run it locally"). Skipped evidence is the most common failure mode for any agent.

## 3. Write requests that carry their own context

A request that states these five things rarely needs follow-up questions:

| Part | What to write | Example |
|---|---|---|
| **Outcome** | The observable behavior, not the implementation | "Users can filter reports by status in the list view" |
| **Scope** | What is in and out | "Web only; mobile later. No schema changes." |
| **Authorization** | What the agent may do beyond local edits | "Commit on a branch; do not push or open a PR" |
| **Constraints** | Rules not in project files | "Keep bundle size flat; reuse the Filter component" |
| **Done** | How you will judge it | "Existing report tests pass; new filter tested; checked in the browser" |

Add pointers rather than pasting: an issue link, relevant files, a failing log. The agent reads them itself.

**Weak:** "Add filtering to reports."
**Strong:** "Add status filtering to the reports list (open/closed/all) on web. Reuse `FilterBar`. No API changes; filter client-side. Commit on a branch, no PR. Done when tests cover each status and you have checked it in the running app."

## 4. Choose the mode

| Situation | Ask like this | What happens |
|---|---|---|
| Rough idea, unclear goal | "Interview me about …" or "help me refine this idea" | `e6-interview-me` / `e6-idea-refine`; stops at an intent statement or one-pager |
| You want to approve before code | "Write the spec and plan, then wait for my approval", or use the host's plan mode | Stops after the plan; your approval authorizes the build |
| Clear, medium feature | One natural request (section 3) | Runs Understand → Handoff without stopping |
| Large feature | `/spec` → review → `/plan` → review → `/build auto` | Each artifact reviewed by you; the build runs the whole plan |
| One task from an existing plan | `/build` | Next pending task, fully verified |
| Small fix | Just ask | Fast path: inline criteria, test first, quick check |
| Bug | Symptom, repro steps, expected vs actual | Reproduce → failing regression test → fix → recheck |
| Refactor | Say "no behavior change" | Baseline first; the baseline must still pass afterward |
| Review only | `/review` or "review this diff" | Findings and a verdict; no edits |
| Release | `/ship`, with explicit release authorization | GO/NO-GO/HOLD report; deploys only if authorized |

Command names are short forms; Claude Code namespaces them (`/e6-agent-skills:build`) and Gemini names planning `/planning`. Hosts without commands accept the same intent in words.

## 5. Put team rules in project files

The pack defers to your repository's rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `CONTRIBUTING.md`). Write the rules you want enforced there, once, instead of repeating them in prompts:

- **Where artifacts go.** For example: "Do not commit plans; keep them outside the worktree." The agent then keeps spec, plan, and state out of the repository.
- **Which checks run locally.** For example: "Run focused tests only; CI runs the full suite."
- **What needs consent.** For example: "Ask before using the browser." The agent asks once, early, and keeps working meanwhile.
- **Your own test procedures.** For example, a `test-app` skill. The agent uses it instead of the generic browser procedure.

## 6. Long tasks, parallel work, and resuming

- Larger work keeps a short `tasks/workflow-state.md` (or wherever your rules say). After a context compaction or a new session, say "resume", and the agent reads the state before editing.
- Parallel workers are used only for independent work. Writers get separate worktrees or run one after another. Ask for parallel review explicitly on risky changes ("run the security and test reviewers too").
- `/build auto` continues through the whole plan; it stops for failures it cannot fix, missing decisions, or actions you did not authorize.

## 7. Avoid these

- Pasting skill bodies into always-on rules. Load the bootstrap; skills load on demand.
- Asking for approval at every phase. It slows the run without adding evidence; use plan-first mode when you want a gate.
- Accepting "tests pass" as done for UI or service changes. Ask what was exercised at runtime.
- Running two routers at once.
- Telling the agent to skip tests "just this once". Ask for the fast path instead; it stays test-first but is short.

## 8. Check that it works

Run one ordinary request and confirm section 2's sequence. For deeper verification, use the behavioral evals ([evals](../evals/README.md)) and [workflow activation](workflow-activation.md#verify-your-setup).

For a complete worked prompt, using a real multi-surface repository, see [the E6 Code feature prompt](prompts/e6code-feature-prompt.md).
