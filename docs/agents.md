# Agent Personas

Specialist personas that play a single role with a single perspective. Each persona is a Markdown file consumed as a system prompt by your harness (Claude Code, Cursor, Copilot, etc.).

| Persona | Role | Best for |
|---------|------|----------|
| [code-reviewer](../agents/code-reviewer.md) | Senior Staff Engineer | Five-axis review before merge |
| [security-auditor](../agents/security-auditor.md) | Security Engineer | Vulnerability detection, OWASP-style audit |
| [test-engineer](../agents/test-engineer.md) | QA Engineer | Test strategy, coverage analysis, Prove-It pattern |
| [web-performance-auditor](../agents/web-performance-auditor.md) | Web Performance Engineer | Core Web Vitals audit, loading/rendering/network analysis |

## How personas relate to skills and commands

Three layers, each with a distinct job:

| Layer | What it is | Example | Composition role |
|-------|-----------|---------|------------------|
| **Skill** | A workflow with steps and exit criteria | `e6-code-review-and-quality` | The *how* — invoked from inside a persona or command |
| **Persona** | A role with a perspective and an output format | `code-reviewer` | The *who* — adopts a viewpoint, produces a report |
| **Command** | A user-facing entry point | `/review`, `/ship` | The *when* — composes personas and skills |

The main agent coordinates through `using-e6-agent-skills` or the requested command. **Personas do not call other personas.** Each persona opens by naming the skill it applies for procedure and adds only a viewpoint and an output format. Packets, returns, and ownership follow the [workflow contract](../references/workflow-contract.md#delegation); persona severity labels map to the contract's [finding severity](../references/workflow-contract.md#finding-severity) scale.

## When to use each

### Direct persona invocation
Pick this when you want one perspective on the current change and the user is in the loop.

- "Review this PR" → invoke `code-reviewer` directly
- "Are there security issues in `auth.ts`?" → invoke `security-auditor` directly
- "What tests are missing for the checkout flow?" → invoke `test-engineer` directly
- "Audit Core Web Vitals on the product page" → invoke `web-performance-auditor` directly

### Slash command (single skill or persona)
Pick this when there's a repeatable workflow you'd otherwise re-explain every time.

- `/review` → applies `e6-code-review-and-quality` in the main session; it does not spawn a persona
- `/test` → applies `e6-test-driven-development` in the main session; it does not spawn a persona
- `/webperf` → runs the `web-performance-auditor` persona for performance audits on web apps and returns a bounded summary plus a link to the full report

### Slash command (orchestrator — fan-out)
Pick this only when **independent** investigations can run in parallel and produce reports that a single agent then merges.

- `/ship` → uses the specialist perspectives justified by release risk (`code-reviewer`, `security-auditor`, `test-engineer`, plus `web-performance-auditor` for web-facing changes when performance risk applies), delegates independent checks when useful, and synthesizes candidate-bound readiness evidence

Sequential phases run in the coordinator; independent substantial work may use scoped parallel workers. See [references/orchestration-patterns.md](../references/orchestration-patterns.md) for the full pattern catalog and anti-patterns.

## Decision matrix

```
Is the work a single perspective on a single artifact?
├── Yes → Direct persona invocation
└── No  → Are the sub-tasks independent (no shared mutable state, no ordering)?
         ├── Yes → Slash command with parallel fan-out (e.g. /ship)
         └── No  → Coordinator follows sequential phases within authorized scope
```

## Worked example: valid orchestration

`/ship` is the canonical fan-out orchestrator in this repo. It runs three personas, or four for a web-facing change with performance risk:

```
/ship
  ├── (parallel) code-reviewer           → review report
  ├── (parallel) security-auditor        → audit report
  ├── (parallel) test-engineer           → coverage report
  └── (conditional) web-performance-auditor → web performance audit
                  ↓
        merge phase (main agent): dedupe, map severities, re-verify Critical/Required
                  ↓
        GO / NO-GO / HOLD verdict + rollback plan
```

The Review phase uses the same three-persona fan-out for high-risk diffs; see [high-risk review fan-out](../references/orchestration-patterns.md#high-risk-review-fan-out).

Why this works:
- Each sub-agent operates on the same diff but produces a **different perspective**
- They have no dependencies on each other → genuine parallelism, real wall-clock savings
- Each runs in a fresh context window → main session stays uncluttered
- The merge step is small and benefits from full context, so it stays in the main agent

## Worked example: invalid orchestration (do not build this)

A `meta-orchestrator` persona whose job is "decide which other persona to call":

```
/work-on-pr → meta-orchestrator
                  ↓ (decides "this needs a review")
              code-reviewer
                  ↓ (returns)
              meta-orchestrator (paraphrases result)
                  ↓
              user
```

Why this fails:
- Pure routing layer with no domain value
- Adds two paraphrasing hops → information loss + 2× token cost
- The user already knows they want a review; let them call `/review` directly
- Replicates work that slash commands and `AGENTS.md` intent-mapping already do

## Rules for personas

1. A persona is a single role with a single output format. If you find yourself adding a second role, create a second persona.
2. **Personas do not invoke other personas.** Composition is the job of the coordinator, a slash command, or the user; a persona only recommends a deeper pass in its report. On Claude Code this is also a hard platform constraint — *"subagents cannot spawn other subagents"* — so the rule is enforced for you.
3. A persona may invoke skills (the *how*).
4. Every persona file ends with a "Composition" block stating where it fits.

## Claude Code interop

The personas in this repo are designed to work as Claude Code subagents and as Agent Teams teammates without modification:

- **As subagents:** auto-discovered when this plugin is enabled (no path config needed). Use the Agent tool with `subagent_type: code-reviewer` (or `security-auditor`, `test-engineer`, `web-performance-auditor`). `/ship` is the canonical example.
- **As Agent Teams teammates** (experimental, requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`): reference the same persona name when spawning a teammate. The persona's body is **appended to** the teammate's system prompt as additional instructions (not a replacement), so your persona text sits on top of the team-coordination instructions the lead installs (SendMessage, task-list tools, etc.).

Subagents only report results back to the main agent. Agent Teams let teammates message each other directly. Use subagents when reports are enough; use Agent Teams when sub-agents need to challenge each other's findings (e.g. competing-hypothesis debugging). See [references/orchestration-patterns.md](../references/orchestration-patterns.md) for the full mapping.

Plugin agents do not support `hooks`, `mcpServers`, or `permissionMode` frontmatter — those fields are silently ignored. Avoid relying on them when authoring new personas here.

## Adding a new persona

1. Create `agents/<role>.md` with the same frontmatter format used by existing personas.
2. Open with "Apply `<skill>` for procedure; this file adds viewpoint and output format only." Then define the viewpoint, output format, and severity mapping without copying the skill's checklists.
3. Add a **Composition** block at the bottom (Invoke directly when / Invoke via / Do not invoke from another persona).
4. Add the persona to the table at the top of this file.
5. If the persona enables a new orchestration pattern, document it in `references/orchestration-patterns.md` rather than inventing the pattern in the persona file itself.
