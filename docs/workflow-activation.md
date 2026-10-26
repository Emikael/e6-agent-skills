# Activate the Whole Workflow

Install the complete pack when you want automatic context → criteria → plan →
test/implementation → local runtime → review → handoff. Individual skills can be
used independently; the complete workflow needs the router, specialists, and
shared references. Skills cannot override host instructions or guarantee model
compliance. Explicit host wiring makes the coordinator easier to discover.

## Claude Code Plugin

The plugin's `hooks/hooks.json` registers a compact SessionStart bootstrap for
startup, resume, clear, compact, and fork. It points to `using-e6-agent-skills`
and `e6-caveman`; it does not inject every skill body. Enable the installed plugin
and start a new session. Hook trust or administrative host restrictions can
prevent activation; inspect the host's hook diagnostics in that case.

## Codex, OpenCode, and Gemini

These integrations expose skills, but this pack does not assume they execute
Claude hook schemas. Add a compact project rule to select the e6 coordinator.
The installer uses `AGENTS.md` for Codex, OpenCode, and Grok Build (`--host grok`),
`GEMINI.md` for Gemini, `.cursor/rules/e6-workflow.mdc` for Cursor
(`--host cursor`, always applied), and `CLAUDE.md` for a Claude rules-based setup.
It preserves existing rules and updates only its marked block.

```bash
# Preview first. --pack is the full clone/install root, not an individual skill.
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
  --project /path/to/project --pack /path/to/e6-agent-skills --host codex

# Install the reviewed block. Repeat safely to update it after a pack upgrade.
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
  --project /path/to/project --pack /path/to/e6-agent-skills --host codex --write

# Check whether the installed block matches the current pack.
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
  --project /path/to/project --pack /path/to/e6-agent-skills --host codex --check
```

Node.js is needed for the installer and repository checks. The Claude hook uses
Bash and does not need jq. For other hosts, add the short
[bootstrap](../references/workflow-bootstrap.md) to their project instruction
surface, with the installed pack path. Do not copy this repository's contributor
`AGENTS.md` or `CLAUDE.md` into your project.

## Cursor Plugin and Claude Apps

The Cursor plugin (`.cursor-plugin/plugin.json`) registers `hooks/hooks-cursor.json`,
which runs the same SessionStart script; it emits Cursor's `additional_context`
when `CURSOR_PLUGIN_ROOT` is set. See [Cursor setup](cursor-setup.md).

The Claude apps (claude.ai, Claude Desktop chat, Cowork) run no hooks. Upload
self-contained skill ZIPs from `scripts/build-portable-skills.js --zip` and ask
for the e6 workflow, or put the bootstrap in a Project's instructions. See
[Claude Desktop setup](claude-desktop-setup.md).

## Natural Requests and Scope

“Implement status filtering for reports” starts the applicable lifecycle. The
coordinator loads specialists as phases need them and continues through verified
handoff. No need to name each skill. Small fixes use inline criteria; larger
features use existing spec/plan artifacts. The user can still request a single
phase with `/spec`, `/plan`, `/review`, or an equivalent natural request.

`/build` completes the next task. `/build auto` completes the whole requested
plan. Both retain verification and existing authorization. Commits and releases
follow the user's authorization and project rules.

## Other Plugins and Subagents

Choose one SDLC coordinator in project rules. Other plugins may supply domain
capabilities. An explicit user request for another workflow takes priority.
Repeated routers add conflicting gates; the coordinator reconciles relevant
specialist procedures once. Subagents follow their bounded task and return
evidence; they do not start a second lifecycle. Use `e6-caveman` for concise
communication while preserving commands, errors, numbers, and uncertainty.

## Verify Your Setup

Use an ordinary engineering request. Confirm that the router is loaded, criteria
are recorded, a real failing test precedes the fix, actual project checks and
runtime interaction run, and review happens before handoff. Skill invocation
alone is insufficient evidence. Run the repository's lexical checks and opt-in
behavioral evals as described in [evals](../evals/README.md). Browser/computer
checks require actual host capabilities; an unavailable check stays a blocker.
