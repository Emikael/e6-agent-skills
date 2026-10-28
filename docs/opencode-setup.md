# OpenCode Setup

This guide explains how to use Agent Skills with OpenCode. The reusable assets are the markdown skills in the `skills/` directory; the root `AGENTS.md` file in this repository is repo-scoped and should not be copied into other projects.

## Overview

OpenCode discovers skills from several locations. Agent Skills provides two optional usage styles:

- **Agent-driven workflow:** skills are selected automatically via the built-in `skill` tool and a project-local `AGENTS.md` that you write for your own repository.
- **Command-driven workflow:** manually invoke lifecycle commands you author yourself in `.opencode/commands/` (optional). This repository does not ship OpenCode command files.

## Installation

There are three ways to get the skills into your project:

1. Install with the `skills` CLI (fastest).
2. Clone this repository and copy the skill directories manually.
3. On OpenCode 2, clone this repository and point the `skills` setting at it (no copying; recommended for the complete workflow).

After either step, create your own project-local `AGENTS.md` and, if you want slash commands, write your own `.opencode/commands/*.md` wrappers (see [Optional slash commands](#optional-slash-commands)).

### Option 1: Install with `npx skills`

The fastest path is the open [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add Emikael/e6-agent-skills            # install selected skills
npx skills add Emikael/e6-agent-skills --list     # browse before installing
```

Install a single skill:

```bash
npx skills add Emikael/e6-agent-skills --skill e6-spec-driven-development
```

By default `npx skills` installs into a tool-specific directory (often `.claude/skills/` or a shared location). OpenCode will discover skills placed there because it reads `.claude/skills/<name>/SKILL.md` and the generic `.agents/skills/<name>/SKILL.md` paths.

If the skills land somewhere OpenCode does not scan, copy or symlink them into one of the discovery paths listed below, for example:

```bash
mkdir -p .opencode/skills
cp -r .claude/skills/<skill-name> .opencode/skills/
```

> **Note:** Per-skill installs copy only the skill directory itself. If a skill references shared files under `references/`, copy those into the installed skill directory or install the whole pack. To build self-contained copies with those files vendored, run `node scripts/build-portable-skills.js --out <dir>`.

### Option 2: Clone this repository

1. Clone the repository:

```bash
git clone https://github.com/Emikael/e6-agent-skills.git
```

2. Copy the desired skills into one of the OpenCode skill discovery paths.

#### Project-local installation

```bash
mkdir -p .opencode/skills
cp -r /path/to/e6-agent-skills/skills/<skill-name> .opencode/skills/
```

For example, to install `e6-spec-driven-development` and `e6-incremental-implementation`:

```bash
mkdir -p .opencode/skills
cp -r /path/to/e6-agent-skills/skills/e6-spec-driven-development .opencode/skills/
cp -r /path/to/e6-agent-skills/skills/e6-incremental-implementation .opencode/skills/
```

#### Global installation

```bash
mkdir -p ~/.config/opencode/skills
cp -r /path/to/e6-agent-skills/skills/<skill-name> ~/.config/opencode/skills/
```

#### Cross-compatible paths

OpenCode also discovers skills placed in Claude-compatible or generic agent paths:

- `.claude/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

If you already share skills across Claude Code and OpenCode, any of these locations work.

### Option 3: Reference a clone from `opencode.json` (OpenCode 2)

OpenCode 2 reads extra skill sources from a `skills` array in any `opencode.json` or `opencode.jsonc`. Point it at the `skills/` directory of a complete clone:

```jsonc
{
  "skills": ["~/src/e6-agent-skills/skills"]
}
```

Each entry is a directory that holds skills, not a single skill. Relative paths resolve from the directory OpenCode runs in, not from the config file, so prefer `~/` or absolute paths. Because the skills stay inside the complete pack, their links to the shared `references/` checklists keep working, and `git -C ~/src/e6-agent-skills pull` updates them in place. OpenCode 1 has no equivalent setting; use Option 1 or 2 there. See the [OpenCode 2 skills docs](https://opencode.ai/v2/docs/skills/).

### What to copy

Copy the directories under `skills/` (for example `skills/e6-spec-driven-development/`). Each directory must contain a `SKILL.md` file. Do not copy the repository's root `AGENTS.md` or `CLAUDE.md`; those files configure development of this repository itself.

## Project `AGENTS.md`

Create an `AGENTS.md` in **your own project** root. This is the system prompt that tells OpenCode when and how to invoke the installed skills. Unlike the repo-scoped `AGENTS.md` in `Emikael/e6-agent-skills`, this file belongs to your project and should be adapted to your stack.

Below is a template you can paste into your project's `AGENTS.md`:

```markdown
# e6 Workflow

For engineering tasks, load using-e6-agent-skills through the skill tool from the installed complete pack. Use e6-caveman for concise output. The coordinator loads specialists on demand and continues applicable phases through test/runtime/review evidence and handoff. Respect narrower requests, existing authorization, project rules, and the host's instruction priority. Assigned workers return scoped evidence instead of starting another lifecycle. Keep one coordinator; do not load the whole catalog.
```

Add this short rule to the project's existing `AGENTS.md`, with the installed pack path. Prefer the [idempotent bootstrap installer](workflow-activation.md#codex-opencode-and-gemini) to preserve existing content. It writes the canonical [workflow bootstrap](../references/workflow-bootstrap.md) and pack paths as one marked block; `--pack` is the complete clone, not an individual skill:

```bash
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js --project . --pack /path/to/e6-agent-skills --host opencode --write
```

> **Note:** The root `AGENTS.md` inside the `Emikael/e6-agent-skills` repository is intended for contributors working on this repository and should not be copied into other projects. See [CONTRIBUTING.md](../CONTRIBUTING.md#repo-scoped-files).

> **OpenCode 2:** only `AGENTS.md` is read; `CLAUDE.md` is not used as a fallback. The global file (`~/.config/opencode/AGENTS.md`) and every `AGENTS.md` from the workspace up to the project root are combined, not overridden, so keep the bootstrap block in one of them only.

## How It Works

### 1. Skill Discovery

OpenCode walks the following paths (project-local first, then global):

- `.opencode/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`
- On OpenCode 2, any directory listed in the `skills` array of `opencode.json` (see [Option 3](#option-3-reference-a-clone-from-opencodejson-opencode-2))

Each skill must contain a `SKILL.md` file with a valid `name` and `description` in its frontmatter. OpenCode 2 only advertises skills that have a `description`; every e6 skill does.

To load a skill yourself on OpenCode 2, mention it in your prompt as `@<skill-id>`, for example `@using-e6-agent-skills`.

### 2. Automatic Skill Invocation

When your project's `AGENTS.md` instructs the agent to use skills, the agent evaluates every request and maps it to the appropriate skill.

Examples:

- "build a feature" → `e6-incremental-implementation` + `e6-test-driven-development`
- "design a system" → `e6-spec-driven-development`
- "fix a bug" → `e6-debugging-and-error-recovery`
- "review this code" → `e6-code-review-and-quality`

### 3. Lifecycle Mapping (Implicit Commands)

OpenCode does not require slash commands, but if you prefer them see the next section. In agent-driven mode the lifecycle is mapped implicitly:

- DEFINE → `e6-spec-driven-development`
- PLAN → `e6-planning-and-task-breakdown`
- BUILD → `e6-incremental-implementation` + `e6-test-driven-development`
- VERIFY → `e6-debugging-and-error-recovery`
- REVIEW → `e6-code-review-and-quality`
- SHIP → `e6-shipping-and-launch`

### Optional slash commands

This repository does not ship OpenCode command files; its `.opencode/` directory holds only a `skills` link used when working on this repository. If you prefer explicit commands, author thin wrappers in your project's `.opencode/commands/` directory. Use `.opencode/commands/` (or `~/.config/opencode/commands/` globally); OpenCode 2 still reads the legacy singular `.opencode/command/`, but new files belong in `commands/`. Only `.md` files are discovered, and `$ARGUMENTS` expands to the text after the command. The filename becomes the command name.

Use the Claude Code commands in this repository's `.claude/commands/*.md` as a reference for each command's intent, but write the body for OpenCode rather than copying it verbatim. Those files are written for Claude Code, and a plugin-namespaced skill name such as `e6-agent-skills:<name>` does not resolve in OpenCode. A one-file wrapper also does not reproduce coordination such as `/build auto` or the specialist review passes in `/ship`.

```bash
mkdir -p .opencode/commands
```

A typical command file looks like:

```markdown
---
description: Break work into small verifiable tasks
---

Invoke the e6-planning-and-task-breakdown skill. Read the spec and create tasks with acceptance criteria.
```

Save it as `.opencode/commands/plan.md` to enable `/plan` in OpenCode.

## Usage Examples

### Example 1: Feature Development

User:
```
Add authentication to this app
```

Agent behavior:
- Detects feature work
- Invokes `e6-spec-driven-development`
- Produces a spec before writing code
- Moves to planning and implementation skills

### Example 2: Bug Fix

User:
```
This endpoint is returning 500 errors
```

Agent behavior:
- Invokes `e6-debugging-and-error-recovery`
- Reproduces → localizes → fixes → adds guards

### Example 3: Code Review

User:
```
Review this PR
```

Agent behavior:
- Invokes `e6-code-review-and-quality`
- Applies structured review (correctness, design, readability, etc.)

## Agent Expectations

For OpenCode to work correctly, the agent should:

- Always check if a skill applies before acting
- Use the `skill` tool to load the skill when it applies
- Never skip required workflows (spec, plan, test, etc.)
- Not jump directly to implementation

These rules are enforced by your project's `AGENTS.md`, not by the copy of the skill itself.

## Limitations

- Skill invocation depends on model compliance.
- OpenCode does not install skills automatically; copy or install the directories you need.
- If a skill references files under `references/`, you may need to copy those as well when installing manually.

## Summary

1. Install the skills you need, either with `npx skills add Emikael/e6-agent-skills` or by copying them from a clone of this repository into `.opencode/skills/` (project), `~/.config/opencode/skills/` (global), or a cross-compatible path such as `.claude/skills/` / `.agents/skills/`. On OpenCode 2, you can instead list the clone's `skills/` directory in the `skills` array of `opencode.json`.
2. Create your own project-local `AGENTS.md` with the rules and intent mapping above.
3. OpenCode discovers the skills and your `AGENTS.md` guides the agent to invoke them.
4. Optionally write your own `.opencode/commands/*.md` wrappers for explicit slash commands.

This keeps the reusable assets (skills) separate from the repository-specific configuration (the `Emikael/e6-agent-skills` root `AGENTS.md`).
