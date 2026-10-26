# Using e6-agent-skills with Gemini CLI

## Whole workflow

Install the complete pack and select `using-e6-agent-skills` as the coordinator for engineering requests. Add the compact [workflow bootstrap](../references/workflow-bootstrap.md) to this host's project instruction surface, with the installed pack path; keep skill bodies on demand. See [activation](workflow-activation.md). Use `e6-caveman` for concise output. The coordinator continues through context, criteria, tests, local runtime, review, and handoff within existing authorization; single-phase requests remain bounded. Native discovery alone does not prove full-workflow execution.


## Setup

### Option 1: Install as Skills (Recommended)

Gemini CLI has a native skills system that auto-discovers `SKILL.md` files in `.gemini/skills/` or `.agents/skills/` directories. Each skill activates on demand when it matches your task.

**Install from the repo:**

```bash
gemini skills install https://github.com/Emikael/e6-agent-skills.git --path skills
```

**Or install from a local clone:**

```bash
git clone https://github.com/Emikael/e6-agent-skills.git
gemini skills install /path/to/e6-agent-skills/skills/
```

**Install for a specific workspace only:**

```bash
gemini skills install /path/to/e6-agent-skills/skills/ --scope workspace
```

Skills installed at workspace scope go into `.gemini/skills/` (or `.agents/skills/`). User-level skills go into `~/.gemini/skills/`.

Once installed, verify with:

```
/skills list
```

Gemini CLI injects skill names and descriptions into the prompt automatically. When it recognizes a matching task, it asks permission to activate the skill before loading its full instructions.

### Option 2: Workflow Bootstrap in GEMINI.md (Persistent Context)

To select the e6 coordinator on every engineering request, add the compact workflow bootstrap to your project's `GEMINI.md` with the installer. Run it from your project root; `--pack` is the complete clone, not an individual skill:

```bash
# Preview the block (default mode), then write it
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js --project . --pack /path/to/e6-agent-skills --host gemini
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js --project . --pack /path/to/e6-agent-skills --host gemini --write
```

The installer writes one marked block containing the text of [`references/workflow-bootstrap.md`](../references/workflow-bootstrap.md) plus the installed pack, bootstrap, and router paths. It preserves the rest of `GEMINI.md`, and re-running it with `--write` after a pack upgrade updates only that block. `--check` exits non-zero when the block is missing or outdated. See [activation](workflow-activation.md#codex-opencode-and-gemini).

Do not paste whole `SKILL.md` bodies into `GEMINI.md`. It is loaded for every prompt; the bootstrap points to the coordinator, which loads skill bodies on demand.

Use `/memory show` to verify loaded context, and `/memory reload` to refresh after changes.

> **Skills vs GEMINI.md:** Skills are on-demand expertise that activate only when relevant, keeping your context window clean. GEMINI.md provides persistent context loaded for every prompt. Use skills for phase-specific workflows and keep GEMINI.md to the bootstrap block and your own project conventions.

## Recommended Configuration

### Always-On (GEMINI.md)

Keep only the workflow bootstrap block from Option 2 (plus your own project conventions) in `GEMINI.md`. It selects `using-e6-agent-skills` and `e6-caveman` without loading any skill body.

### On-Demand (Skills)

Install all of the pack's skills (Option 1) so the coordinator can load specialists when they apply, for example:

- `e6-incremental-implementation` — Activates when building in small verifiable slices
- `e6-code-review-and-quality` — Activates for five-axis review before merge
- `e6-test-driven-development` — Activates when implementing logic or fixing bugs
- `e6-spec-driven-development` — Activates when starting a new project or feature
- `e6-frontend-ui-engineering` — Activates when building UI
- `e6-security-and-hardening` — Activates during security reviews
- `e6-performance-optimization` — Activates during performance work

## Advanced Configuration

### MCP Integration

Many skills in this pack leverage [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) tools to interact with the environment. For example:

- `e6-browser-testing-with-devtools` uses the `chrome-devtools` MCP extension.
- `e6-performance-optimization` can benefit from performance-related MCP tools.

To enable these, ensure the relevant MCP servers or extensions are configured for Gemini CLI. MCP servers are declared under `mcpServers` in Gemini CLI settings: `~/.gemini/settings.json` for your user, or `.gemini/settings.json` in the project.

### Session Hooks

Recent Gemini CLI versions offer session lifecycle hooks, configured in Gemini CLI settings (verify availability and schema on your version). The supported way to activate this pack in Gemini CLI is the `GEMINI.md` bootstrap block from Option 2.

`hooks/session-start.sh` in this repo is the Claude Code plugin's `SessionStart` hook. It injects the compact [`references/workflow-bootstrap.md`](../references/workflow-bootstrap.md) plus the installed pack, bootstrap, and router paths, wrapped in Claude Code's JSON envelope (`hookSpecificOutput.additionalContext`). It does not print the `using-e6-agent-skills` skill body; the coordinator loads that on demand. If you wire the script into a Gemini CLI hook, check that your version accepts that output format.

### Explicit Context Loading

You can explicitly load any skill into your current session by referencing its installed `SKILL.md` with the `@` symbol in your prompt. Adjust the path to where the skill is installed; this example uses a workspace-scope install:

```markdown
Use the @.gemini/skills/e6-test-driven-development/SKILL.md skill to implement this fix.
```

This is useful when you want to ensure a specific workflow is followed without waiting for auto-discovery.

## Slash Commands

The repo ships 9 slash commands under `.gemini/commands/`: 8 lifecycle commands plus the `/webperf` specialist audit. Gemini CLI auto-discovers them when you run from this repository's root. `gemini skills install` installs skills only; to use the commands in your own project, copy `.gemini/commands/*.toml` into that project's `.gemini/commands/` (or `~/.gemini/commands/` for every project).

| Command | What it does |
|---------|--------------|
| `/spec` | Write a structured spec before writing code |
| `/constraints` | Define and enforce the project's quality bar |
| `/planning` | Break work into small, verifiable tasks |
| `/build` | Implement the next task incrementally; `/build auto` completes the whole requested plan |
| `/test` | Run TDD workflow — red, green, refactor |
| `/review` | Five-axis code review |
| `/code-simplify` | Reduce complexity without changing behavior |
| `/ship` | Assess release readiness, resolve blockers, and ship only within existing authorization |
| `/webperf` | Audit browser-facing apps for Core Web Vitals and performance issues |

Each command invokes the corresponding skill automatically — no manual skill loading required.

> **Note:** Use `/planning` instead of `/plan` — `/plan` conflicts with a Gemini CLI internal command name.

## Usage Tips

1. **Prefer skills over GEMINI.md** — Skills activate on demand and keep your context window focused. Keep GEMINI.md to the bootstrap block rather than full skill bodies.
2. **Skill descriptions matter** — Each SKILL.md has a `description` field in its frontmatter that tells agents when to activate it. The descriptions in this repo are optimized for auto-discovery across all supported tools (Claude Code, Gemini CLI, etc.) by clearly stating both *what* the skill does and *when* it should be triggered.
3. **Use agents for review** — Copy `agents/code-reviewer.md` content when requesting structured code reviews.
4. **Combine with references** — Reference checklists from `references/` when working on specific quality areas like testing or performance.
