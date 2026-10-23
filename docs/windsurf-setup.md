# Using e6-agent-skills with Windsurf

Keep a complete clone accessible so the coordinator can read skills, shared
references, and helpers:

```bash
git clone https://github.com/Emikael/e6-agent-skills.git /path/to/e6-agent-skills
```

Reference the full pack by its path rather than copying individual skills into
rules. The router, specialist skills, and the shared `references/` directory
must stay together. If Cascade cannot read files outside the open workspace,
clone the pack inside the project (and ignore it in git) or add the clone to the
workspace (verify on your version). Native skill discovery and rule locations
depend on your Windsurf version; use its supported project or global instruction
surface.

## Project Rule

Workspace rules are Markdown files in `.windsurf/rules/`, for example
`.windsurf/rules/e6-workflow.md`. A single `.windsurfrules` file at the project
root is the legacy format. Each rule file sets its activation mode in
frontmatter; make this one always on so it applies to every request (verify the
frontmatter keys and the per-file character limit on your version).

Add the [workflow bootstrap](../references/workflow-bootstrap.md) with the
installed pack paths, adjusting `/path/to/e6-agent-skills`:

```markdown
---
trigger: always_on
---

For engineering tasks, load `using-e6-agent-skills` through the host's skill mechanism or read its installed `SKILL.md`. Use `e6-caveman` for concise prose and delegation. The router coordinates applicable phases through verified handoff; load specialists only when needed. Existing task authorization persists. Honor narrower requests and an explicitly selected alternative workflow. Host instructions, user instructions, and applicable project rules take priority. Keep one coordinator. An assigned subagent follows its scoped task and returns evidence instead of starting another lifecycle. Never load the whole catalog, copy full history to workers, or claim checks you did not run. Ordinary conversation needs no workflow.

Installed e6 pack: /path/to/e6-agent-skills
Workflow bootstrap: /path/to/e6-agent-skills/references/workflow-bootstrap.md
Router file: /path/to/e6-agent-skills/skills/using-e6-agent-skills/SKILL.md
Load skills through the host skill loader; if unavailable, read the named skill under this pack’s skills/ directory.
```

This is the same content the
[bootstrap installer](workflow-activation.md#codex-opencode-and-gemini) writes
for other hosts; the installer has no Windsurf target, so add it by hand. After
a pack upgrade, refresh the first paragraph from
`references/workflow-bootstrap.md`. Preserve existing rules. Do not copy this
repository's root `AGENTS.md` or `CLAUDE.md` into your project; they configure
contributors to e6-agent-skills itself.

## Skill Bodies Load on Demand

The rule carries only the bootstrap and paths. The coordinator reads
`skills/using-e6-agent-skills/SKILL.md` when an engineering task starts, then
loads each specialist `SKILL.md` and `references/` file only when a phase needs
it. Keep full skill bodies out of always-on rules: they are sent with every
request and count against the rule size limit. If your Windsurf version supports
native skills, you can also install the pack's skills there for discovery; keep
the rule pointing at the complete clone (verify the skill location on your
version).

## Verify

Use an ordinary implementation request. Confirm the agent reads the coordinator,
discovers project commands, maps acceptance to tests, exercises changed local
behavior, and reviews before handoff. Browser/computer checks require available
host tools or existing automation. Report unavailable required checks as
blocked. Skill discovery alone does not prove lifecycle execution.
