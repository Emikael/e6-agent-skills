# Getting Started with e6-agent-skills

e6-agent-skills works with any AI coding agent that accepts Markdown instructions. This guide covers the universal approach. For tool-specific setup, see the dedicated guides.

Want a worked example before setting up your own project? The
[interactive tutorials](https://skills.addy.ie/tutorials/) walk through a
greenfield build, a brownfield feature, and a safe automation loop with
copyable prompts for Claude Code, Codex, or any other agent.

## How Skills Work

Each skill is a Markdown file (`SKILL.md`) that describes a specific engineering workflow. When loaded into an agent's context, the agent follows the workflow — including verification steps, anti-patterns to avoid, and exit criteria.

**Skills are not reference docs.** They're step-by-step processes the agent follows.

## Quick Start (Any Agent)

### 1. Clone the repository

```bash
git clone https://github.com/Emikael/e6-agent-skills.git
```

### 2. Activate the workflow

Use the complete pack for an end-to-end development request. The Claude plugin includes a compact startup bootstrap; other hosts can install a project rule with the [workflow bootstrap installer](workflow-activation.md). It loads `using-e6-agent-skills` and `e6-caveman`, then specialists on demand. Do not paste all skill bodies into rules.

### 3. Describe the outcome

For example: “Implement status filtering for reports and verify it locally.” The coordinator continues through context, acceptance criteria, planning, test-first implementation, local runtime checks, review, and handoff within authorized scope. It asks only for material missing decisions.

### 4. Use a single phase when needed

A request for a spec, plan, review, or specific skill remains bounded to that deliverable. `/build` completes the next task; `/build auto` completes the requested plan. Existing authorization persists. Commit/deploy only when the user's scope or repository workflow authorizes it.

### Existing projects need no migration

Install the pack from the existing project's root using the normal setup path
for your agent, then keep working in that project. Skills activate for matching
tasks; they do not require a new repository layout or a one-time conversion of
existing code.

Do not copy this repository's root `AGENTS.md` or `CLAUDE.md` into the project.
Those files configure contributors to e6-agent-skills itself. Add only the skills
and any project-specific instructions your agent normally reads. For a gradual
rollout in an established codebase, follow the [Adoption Guide](adoption-guide.md).

## Recommended Setup

Rolling out to a real project? The **[Adoption Guide](adoption-guide.md)** covers two end-to-end paths: the full lifecycle from day one for a greenfield project, and an incremental, verification-first rollout for an established codebase. The setup below is the quick version.

### Minimal (Start here)

For a gradual rollout, install these three skills and reference them on demand:

1. **e6-spec-driven-development** — For defining what to build
2. **e6-test-driven-development** — For proving it works
3. **e6-code-review-and-quality** — For verifying quality before merge

These three cover the most critical quality gaps in AI-assisted development.

### Full Lifecycle

For comprehensive coverage, load skills by phase:

```
Starting a project:  e6-spec-driven-development → e6-planning-and-task-breakdown
During development:  e6-incremental-implementation + e6-test-driven-development
Before merge:        e6-code-review-and-quality + e6-security-and-hardening
Before deploy:       e6-shipping-and-launch
```

### Context-Aware Loading

Don't load all skills at once — it wastes context. Load skills relevant to the current task:

- Working on UI? Load `e6-frontend-ui-engineering`
- Debugging? Load `e6-debugging-and-error-recovery`
- Setting up CI? Load `e6-ci-cd-and-automation`

## Skill Anatomy

Every skill follows the same structure:

```
YAML frontmatter (name, description)
├── Overview — What this skill does
├── When to Use — Triggers and conditions
├── Core Process — Step-by-step workflow
├── Examples — Code samples and patterns
├── Common Rationalizations — Excuses and rebuttals
├── Red Flags — Signs the skill is being violated
└── Verification — Exit criteria checklist
```

See [skill-anatomy.md](skill-anatomy.md) for the full specification.

## Using Agents

The `agents/` directory contains pre-configured agent personas:

| Agent | Purpose |
|-------|---------|
| `code-reviewer.md` | Five-axis code review |
| `test-engineer.md` | Test strategy and writing |
| `security-auditor.md` | Vulnerability detection |
| `web-performance-auditor.md` | Core Web Vitals & performance audit (via `/webperf`) |

Load an agent definition when you need specialized review. For example, ask your coding agent to "review this change using the code-reviewer agent persona" and provide the agent definition.

## Using Commands

The `.claude/commands/` directory contains slash commands for Claude Code:

| Command | Skill Invoked |
|---------|---------------|
| `/spec` | e6-spec-driven-development |
| `/constraints` | e6-constraint-driven-development |
| `/plan` | e6-planning-and-task-breakdown |
| `/build` | e6-incremental-implementation + e6-test-driven-development |
| `/build auto` | e6-planning-and-task-breakdown → e6-incremental-implementation + e6-test-driven-development (whole requested plan, existing authorization) |
| `/test` | e6-test-driven-development |
| `/review` | e6-code-review-and-quality |
| `/code-simplify` | e6-code-simplification |
| `/ship` | e6-shipping-and-launch |
| `/webperf` | web-performance-auditor (specialist agent, web apps only) |

> **Note:** The root `commands/` directory holds TOML command definitions for the
> Antigravity CLI and other TOML-based hosts, separate from `.claude/commands/`.
> The Claude Code plugin manifest lists both directories, so current versions
> should not warn that the default `commands/` folder is ignored; Claude Code
> registers only the `.md` commands. If an older pack or Claude Code version shows
> _"Default commands/ folder is ignored because the manifest sets 'commands'"_,
> the warning is cosmetic: all slash commands load from `.claude/commands/`.

## Using References

The `references/` directory contains the shared workflow documents and supplementary checklists:

| Reference | Use With |
|-----------|----------|
| `workflow-bootstrap.md` | Host project rules and the Claude Code SessionStart hook; selects `using-e6-agent-skills` and `e6-caveman` |
| `workflow-contract.md` | using-e6-agent-skills and lifecycle specialists (phase gates, scope, artifacts, handoff) |
| `testing-patterns.md` | e6-test-driven-development |
| `performance-checklist.md` | e6-performance-optimization |
| `security-checklist.md` | e6-security-and-hardening |
| `accessibility-checklist.md` | e6-frontend-ui-engineering |
| `definition-of-done.md` | all skills / every change |
| `observability-checklist.md` | e6-observability-and-instrumentation |
| `orchestration-patterns.md` | using-e6-agent-skills (delegation and parallel workers) |

Load a reference when you need detailed patterns beyond what the skill covers.

If you install one skill with `npx skills add ... --skill <name>`, only the
selected `skills/<name>/` directory is copied. The skill still works, but paths
to supplementary checklists in the repo-level `references/` directory are
unavailable. Use a whole-repo integration, clone the repository, or copy the
needed checklist into a `references/` directory inside the installed skill.
This portability gap is tracked in
[#361](https://github.com/addyosmani/agent-skills/issues/361).

## Spec and task artifacts

The `/spec` and `/plan` commands create working artifacts (`SPEC.md`, `tasks/plan.md`, `tasks/todo.md`). Treat them as **living documents** while the work is in progress:

- Keep them in version control during development so the human and the agent have a shared source of truth.
- Update them when scope or decisions change.
- If your repo doesn’t want these files long‑term, delete them before merge or add the folder to `.gitignore` — the workflow doesn’t require them to be permanent.

Larger work also keeps `tasks/workflow-state.md`: the coordinator's phase pointer, evidence, project-rule overrides, blockers, and next action. The template is in the [workflow contract's Artifacts section](../references/workflow-contract.md#artifacts); fast-path work keeps this state inline. These are default locations. Project rules can relocate the artifacts — for example to an ignored scratch location or the team's tracker when the project forbids committing plans — and the agent records that override in the workflow state.

### Working across sessions

The same artifacts are the handoff between sessions. For a small task, run the whole lifecycle in one session. For anything non-trivial, persist concise state at phase boundaries; a fresh session is optional when context becomes stale. Artifacts carry the accepted scope and evidence:

- the spec — `SPEC.md`, or wherever your spec actually lives
- `tasks/plan.md` and `tasks/todo.md` — or the external tracker the plan identifies, if you use one
- `tasks/workflow-state.md` — for larger work, the phase pointer and verification evidence

**Before switching**, make sure those files reflect the decisions that still apply, the scope you approved, the questions still open, the next task, and the current verification state (which tests ran, against what).

**In the new session**, read the actual files and look at `git status` before doing anything. Don't assume approvals you can't see in the artifacts. Treat a recorded "tests pass" as a claim about a specific baseline: re-run the checks it covers if the code has moved since, if it doesn't say what was run against what, or if you're about to touch the area it covered. If the baseline still holds, take it and get on with the next task — the point is a check proportional to what changed, not a full suite at every handoff.

#### Task-boundary restarts and Ralph loops

`/build auto` runs the whole requested plan in one session. Task status, actual verification results, and `tasks/workflow-state.md` provide restartable boundaries; commits are conditional on authorization and repository rules.

A shell-level "Ralph loop" is harness behavior, not a separate skill workflow. If you use one, restart only after the current task has reached a recorded boundary; on re-entry, read the durable artifacts and repository state before selecting the next pending task. A process exit is not evidence that a task passed, and a restart must not bypass an approval gate. See the `e6-context-engineering` skill's **Budget and Resume** section for the handoff checklist.

This doesn't need the `/spec` and `/plan` wrappers — plain requests work in any agent, including a `npx skills add` install that only has the skills:

> Read SPEC.md, then break it into small verifiable tasks with acceptance criteria and dependency order. Save them to tasks/plan.md and tasks/todo.md. No product code yet — show me the plan first.

> Read SPEC.md, tasks/plan.md and tasks/todo.md, then check where things actually stand — `git status`, plus re-running whatever checks the recorded verification state no longer covers. Tell me the next unchecked task and anything still open, then stop: I'll confirm the scope before you start it. If the plan looks incomplete, say what's missing rather than rewriting it.

## Tips

1. **Start with e6-spec-driven-development** for any non-trivial work
2. **Always load e6-test-driven-development** when writing code
3. **Don't skip verification steps** — they're the whole point
4. **Load skills selectively** — more context isn't always better
5. **Use the agents for review** — different perspectives catch different issues
