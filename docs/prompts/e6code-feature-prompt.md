# Prompting a Feature with e6-agent-skills: E6 Code Example

This document is a draft prompt plus a walkthrough. It shows how to drive a real feature through the e6 workflow in a large, multi-surface repository: [Emikael/e6code](https://github.com/Emikael/e6code), a GUI that runs Claude Code, Codex, Cursor, Grok Build, OpenCode, and Antigravity side by side.

It has four parts:
1. A reusable template.
2. A worked prompt for one feature.
3. What the agent should do in each phase.
4. Variants for other hosts and modes.

Repository facts below were read from e6code at commit `8c5c41c` (2026-10-23); re-check them against your checkout.

## 1. Before you prompt

- **Install e6 without editing the target repository's rules.** E6 Code's `AGENTS.md` belongs to its maintainer. Use the Claude Code plugin, the Cursor plugin, a user-level instruction file, or simply name the coordinator in the prompt (the template does).
- **Let the project's rules win.** E6 Code's `AGENTS.md` changes several e6 defaults, and the workflow contract tells the agent to follow and record them:

  | e6 default | E6 Code rule | What the agent does |
  |---|---|---|
  | Spec and plan in `SPEC.md`, `tasks/plan.md`, `tasks/todo.md` | "Do not commit implementation plans… Keep temporary working material outside the worktree" | Keeps spec, plan, and state outside the worktree, or in the GitHub issue |
  | Run the project-required suite before handoff | "Do not run repo-wide checks" | Runs `vp test run <files>` plus scoped lint/typecheck; states what CI must prove |
  | Browser check for UI changes | "Don't verify with browsers or computer use unless the user explicitly agrees" | Asks once, early; uses the project's `test-e6-app` skill only if you approve |
  | Generic dev-server procedure | Dev servers, ports, and `.e6` state rules; "Stop only a PID captured when you started" | Follows `AGENTS.md`'s dev-server section |
  | Commit when authorized | Conventional commit titles; "Never make a PR unless the developer explicitly asks" | Commits on a branch only if you allow it; no PR |

## 2. Reusable template

Copy, fill in, and delete what does not apply. Each section maps to a rule in the [workflow contract](../../references/workflow-contract.md), and comments say why it is there.

```markdown
Use the e6 workflow (using-e6-agent-skills) for this task.

## Outcome
<Observable behavior, who gets it, and why. Not the implementation.>

## Context to read first
<Project rules file(s)>, <architecture/internals docs>, <entry files>,
<an existing feature to mirror>, <issue link>.

## Scope
In: <...>
Out: <...>
Surfaces to cover: <clients, entry points, platforms, docs>

## Authorization
May: <edit code/tests/docs, run focused checks, commit on a branch, ...>
Must not: <push, open a PR, deploy, touch live data, use the browser without asking, ...>

## Constraints
<Performance, compatibility, dependencies, style, patterns to reuse.>

## Done when
- <AC-1: Given ... When ... Then ...>
- <AC-n>
- Checks: <commands, or "focused tests for touched files only">
- Runtime: <how to exercise the change for real>
- Docs: <which pages change>
- Handoff: evidence per criterion, risks, and what CI must still prove.

## Decisions
You decide: <choices delegated to the agent>.
Ask me about: <choices you want to make>.
```

Why each part matters:
- **Outcome and Done when** become the acceptance criteria; vague outcomes force the interview phase.
- **Context** saves the agent from rediscovering what you already know.
- **Scope** prevents feature creep.
- **Authorization** is the most common reason a run stops or overreaches. Say what it may do beyond local edits.
- **Decisions** tells the coordinator which Open decisions it may settle itself and which need you.

## 3. Worked prompt: separate Grok Build accounts per provider instance

**Why this feature.** E6 Code already supports several Claude accounts: each Claude provider instance can point `CLAUDE_CONFIG_DIR` at its own directory (`docs/user/providers-claude.md`, `packages/contracts/src/settings.ts`). Grok Build has no equivalent setting; `GrokSettings` holds only `binaryPath` and `customModels`. Yet the server already reads `GROK_HOME` from the environment in `grokUsageLimits.ts`, `acp/XAiAcpExtension.ts`, and `usage/UsageService.ts`. The feature therefore crosses contracts, server, settings UI, and docs, and touches credential isolation. That is a good test of the full workflow.

Paste this into your agent:

```markdown
Use the e6 workflow (using-e6-agent-skills) for this task.

## Outcome
Let a user run two or more Grok Build accounts side by side in E6 Code, the way
Claude instances already can with CLAUDE_CONFIG_DIR. Each Grok provider instance
gets its own Grok home, so one instance's `grok login` credentials, sessions,
usage limits, and skills never leak into another.

## Context to read first
- AGENTS.md: project rules; they override e6 defaults. Record the overrides.
- docs/internals/providers.md: driver vs instance, and "Setup must not happen as
  a health-check side effect".
- docs/user/providers-claude.md ("Separate accounts or configurations") and
  docs/user/install.md#providers.
- packages/contracts/src/settings.ts: GrokSettings, and the Claude
  "CLAUDE_CONFIG_DIR path" setting to mirror.
- apps/server/src/provider/Layers/GrokProvider.ts,
  apps/server/src/provider/ProviderInstanceEnvironment.ts, and every place that
  already reads GROK_HOME (search the server).
- Before writing Effect code, read .repos/effect-smol/LLMS.md.

## Scope
In: a per-instance Grok home for Grok provider instances; server launch, probes,
usage limits, skill discovery, and session/plan paths honoring it; the setting
in the existing provider settings form; user docs.
Out: other providers' behavior, Grok API-key auth, new mobile-only screens.
Surfaces: apply AGENTS.md "Hit every surface" and say which entries applied
(entry points, web/desktop/mobile, contracts, reverse states such as sign-out
and removing an instance, local/remote/tunnel connections, docs).

## Authorization
May: edit code, tests, and docs; run focused checks; commit on a new branch with
conventional commit titles.
Must not: push, open a PR, touch ~/.e6, or stop processes you did not start.
Browser or computer use: ask me once, early. If I agree, use the project's
test-e6-app skill for one integrated web pass after integration.

## Constraints
- Probes must not log in, create sessions, or start MCP servers.
- An empty setting keeps today's behavior exactly.
- Keep provider-specific logic at the adapter boundary; orchestration stays
  provider-agnostic.
- Plans, specs, and notes stay outside the worktree (AGENTS.md).

## Done when
- AC-level criteria with IDs cover:
  - isolation between two instances;
  - an unchanged default;
  - probe safety;
  - usage and session paths resolving inside the instance home;
  - thread switching rules between instances.
- Each server behavior has a focused test that failed before the change
  (`vp test run <files>`). Lint and typecheck are scoped to touched packages; no
  repo-wide runs.
- Runtime: two Grok instances with different homes report different accounts
  in provider settings. If no second Grok login is available, say exactly what
  was and was not exercised.
- User docs explain multi-account Grok the way providers-claude.md does for
  Claude, and install.md links to them.
- Handoff: evidence per criterion, risks, and what CI must still prove.

## Decisions
You decide: naming and placement of the setting, test structure, and slice order.
Ask me about:
- whether to add a first-class setting or document the existing per-instance
  environment variables, if the latter already delivers full isolation;
- whether threads may switch between Grok instances with different homes.
```

## 4. What the agent should do, phase by phase

Use this as a checklist while the run progresses. If a step is missing, name it ("show the failing test first").

| Phase | Skills | What you should see in E6 Code |
|---|---|---|
| Start | `using-e6-agent-skills` | `Using using-e6-agent-skills for …`; route = feature; recorded overrides: artifacts outside the worktree, focused tests only, browser consent pending, no PR |
| Understand | `e6-context-engineering`, `e6-spec-driven-development`, plus `e6-source-driven-development` for Grok CLI behavior | A trace from `GrokSettings` → instance environment → `GrokProvider` probes → usage and ACP session paths. The agent finds that `GROK_HOME` is already read in three places and checks the installed `grok` CLI's own help or docs for what `GROK_HOME` covers. Requirement IDs such as `GROK-1…GROK-6`, stored outside the worktree. One batched message with the two Open decisions and the browser-consent question |
| Plan | `e6-planning-and-task-breakdown` | Vertical slices. For example: (1) contract setting with decode tests; (2) instance environment sets or clears `GROK_HOME`; (3) probes, usage, skills, and session paths honor it; (4) settings form; (5) docs. Each slice has a test, a code path, and a runtime check |
| Build | `e6-incremental-implementation`, `e6-test-driven-development`; `e6-api-and-interface-design` for the contract change; `e6-frontend-ui-engineering` for the form | For each slice: a failing focused test (for example, "instance environment includes `GROK_HOME` when set; omits it when empty"), then the implementation and a passing test. Effect code follows `.repos/effect-smol` patterns |
| Verify | `e6-browser-testing-with-devtools` only through `test-e6-app` and only with consent; `e6-debugging-and-error-recovery` on failures | `vp test run` for touched files; scoped typecheck. `vp run dev` in the worktree, using worktree `.e6` state and the real ports from the dev-runner line. Two instances configured. Without a second Grok login, an exact blocker, and a fake `grok` binary in tests for the probe paths |
| Review | `e6-code-review-and-quality`, plus a fan-out to `security-auditor` and `qa-engineer` (credential isolation is high-risk), and `e6-security-and-hardening` | Findings with severities. Security covers credential paths, keychain behavior, env inheritance across instances, and remote connections. Critical/Required items fixed and checks rerun. The "Hit every surface" list answered |
| Handoff | `e6-documentation-and-adrs`, `e6-git-workflow-and-versioning` | `docs/user` updated and no internal doc unless a cross-component constraint changed. A commit such as `feat(server): separate Grok Build accounts per provider instance` on a branch, not pushed. An evidence table per `GROK-n` and what CI must prove |

Signs the run went wrong:
- A `SPEC.md` or plan file committed into e6code.
- A repo-wide `vp check`.
- A browser opened without consent.
- A probe that runs `grok login`.
- A `pkill`.
- "Tests pass" with no runtime observation.

## 5. Variants

**Approve the plan first.** Replace Authorization's first line with: "Stop after the spec and plan and wait for my approval." Or use your host's plan mode. The coordinator presents both artifacts and stops; your "approved" authorizes the build.

**Staged commands (Claude Code).** For a long feature you want to steer:

```
/e6-agent-skills:spec   <paste the Outcome, Scope, and Done when sections>
/e6-agent-skills:plan
/e6-agent-skills:build auto
/e6-agent-skills:review
```

Review the spec and the plan between commands. `/build auto` then runs every task with tests, runtime checks, and review.

**Per host.**

| Host | How to start |
|---|---|
| Claude Code (CLI or Desktop Code tab) | Plugin installed; paste the prompt. The session bootstrap selects the coordinator |
| Codex CLI or app | Plugin installed; paste the prompt, or start with `$e6-agent-skills:using-e6-agent-skills` |
| Cursor | Plugin or skills folder; paste the prompt in Agent chat |
| Grok Build | Skills in `~/.grok/skills` (keeps e6code's tree clean); paste the prompt; `grok inspect` confirms the skills loaded |
| E6 Code itself | Open the e6code project, start a thread on any provider above in a new worktree (the `e6.json` setup script runs `vp i`), pick e6 skills from the `$` picker, and paste the prompt |

**Smaller tasks.** For a one-file fix, the whole prompt can be two lines: the outcome and "Done when". The coordinator's fast path keeps criteria inline and still writes the failing test first.

**Review only.** "Review the diff on this branch against GROK-1…GROK-6 using e6-code-review-and-quality; do not edit." You get findings and a verdict.

## See also

- [Usage guide](../usage-guide.md)
- [Workflow contract](../../references/workflow-contract.md)
- [Grok Build setup](../grok-build-setup.md), [Claude Desktop setup](../claude-desktop-setup.md), [Cursor setup](../cursor-setup.md), [Codex setup](../codex-setup.md)
