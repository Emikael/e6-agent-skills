# Using e6-agent-skills with Cursor

Cursor combines **rules** (short always-on or file-scoped policies) with **skills** (full workflows loaded on demand) and **plugins** (packaged skills, rules, and hooks). This guide covers three ways to install the pack, from most to least complete. Whichever you choose, keep one coordinator (`using-e6-agent-skills`) and load skill bodies on demand; never paste whole `SKILL.md` files into rules.

> Cursor's plugin and hook formats are evolving. Skill paths match E6 Code's Cursor skill discovery and Cursor's published docs as of October 2026. Per Cursor's [hooks reference](https://cursor.com/docs/agent/hooks), plugin hooks run from the plugin's install directory (`CURSOR_PLUGIN_ROOT`), so the relative `./hooks/session-start.sh` resolves, and `sessionStart` reads `additional_context`. The hook is unit-tested here but was not exercised in a live Cursor session in CI; verify on your version.

## Option A: Cursor plugin (skills + session bootstrap)

The repository ships a Cursor plugin manifest, [`.cursor-plugin/plugin.json`](../.cursor-plugin/plugin.json). It exposes `skills/` and registers [`hooks/hooks-cursor.json`](../hooks/hooks-cursor.json), whose `sessionStart` hook runs `hooks/session-start.sh`. When `CURSOR_PLUGIN_ROOT` is set, the script emits Cursor's `additional_context` with the same compact [workflow bootstrap](../references/workflow-bootstrap.md) that Claude Code receives. It injects about 100 words, not the skill catalog.

Local install for testing or personal use:

```bash
git clone https://github.com/Emikael/e6-agent-skills.git ~/src/e6-agent-skills
mkdir -p ~/.cursor/plugins/local
ln -s ~/src/e6-agent-skills ~/.cursor/plugins/local/e6-agent-skills
```

Restart Cursor, then confirm that the plugin appears in Cursor's plugin settings and that a new Agent chat lists the e6 skills. Marketplace distribution requires Cursor's review; until the plugin is listed there, use the local install.

## Option B: Skills folder plus a rule

Cursor discovers skills from `.cursor/skills/`, `.agents/skills/`, `.claude/skills/`, and `.codex/skills/` in the project, and from the same folders under your home directory. Install self-contained copies so the links to shared checklists keep working:

```bash
# From a clone of e6-agent-skills; writes one folder per skill.
node /path/to/e6-agent-skills/scripts/build-portable-skills.js --out .cursor/skills
# After upgrading the clone, replace the previous copies:
node /path/to/e6-agent-skills/scripts/build-portable-skills.js --out .cursor/skills --force
```

A plain `rsync` of `skills/` would leave `../../references/...` links dangling, because shared checklists live at the pack root. The builder copies each linked checklist into the skill's own `references/` folder. Use `--skills a,b` to install a subset; keep `using-e6-agent-skills` and `e6-caveman` in any subset you intend to use as a workflow.

Then add the always-applied coordinator rule:

```bash
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
  --project . --pack /path/to/e6-agent-skills --host cursor          # preview
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
  --project . --pack /path/to/e6-agent-skills --host cursor --write  # install
```

This writes `.cursor/rules/e6-workflow.mdc` with `alwaysApply: true` and a managed block. Re-running it updates only that block; `--check` reports a stale copy after a pack upgrade.

## Option C: Rule only

If you cannot install skills, use only the rule from Option B and point it at a full clone. The agent reads `using-e6-agent-skills/SKILL.md` and the specialists from the clone when a task needs them. Discovery is weaker than in Option A or B, because Cursor never sees the skill descriptions.

## Rules vs skills

- **Rules**: concise, stable policies ("use conventional commits", "type-annotate public APIs"). Use one concern per file. Prefer `.cursor/rules/*.mdc` over the legacy root `.cursorrules`.
- **Skills**: the step-by-step processes in this pack. Do not copy them into rules; that duplicates content and wastes context on every request.

| Rule field | Use |
|---|---|
| `alwaysApply: true` | Every chat in this project; keep it to the e6 bootstrap and one or two non-negotiables |
| `globs` | When matching files are in context |
| neither | Agent-requested or manual rule |

## Verify

1. A plain request ("add a status filter to the reports endpoint") makes the agent announce `Using using-e6-agent-skills …`, then record acceptance criteria before editing.
2. A behavior change shows a failing test before the implementation.
3. The agent runs project checks and exercises the changed path, or names the exact blocker.
4. Review happens before the handoff.

Skill invocation alone is not evidence that the workflow ran. For deeper checks, see [workflow activation](workflow-activation.md#verify-your-setup).

## Phase map

| You are… | Skill |
|---|---|
| Clarifying requirements | `e6-interview-me`, `e6-idea-refine`, `e6-spec-driven-development` |
| Planning tasks | `e6-planning-and-task-breakdown` |
| Implementing | `e6-incremental-implementation`, `e6-test-driven-development`, `e6-frontend-ui-engineering`, `e6-api-and-interface-design` |
| Verifying | `e6-browser-testing-with-devtools`, `e6-debugging-and-error-recovery` |
| Reviewing | `e6-code-review-and-quality`, `e6-code-simplification`, `e6-security-and-hardening`, `e6-performance-optimization` |
| Shipping | `e6-git-workflow-and-versioning`, `e6-ci-cd-and-automation`, `e6-shipping-and-launch` |

The coordinator chooses these automatically; naming a skill in chat still helps if the agent drifts.

## Personas

Files under `agents/` are review personas. Cursor plugins can package agents, but this manifest does not register them yet. Use the matching skill instead (`e6-code-review-and-quality`, `e6-security-and-hardening`, `e6-test-driven-development`, `e6-performance-optimization`), or paste a persona into a chat for a one-off review.

## Troubleshooting

| Symptom | Check |
|---|---|
| Skills never used | `SKILL.md` under one of the discovery folders? Valid `name`/`description` frontmatter? |
| Broken links to checklists | Installed with `rsync` instead of `build-portable-skills.js` |
| Rule ignored | `.mdc` extension? `alwaysApply: true`? Run the installer with `--check` |
| Plugin bootstrap missing | Plugin enabled and Cursor restarted? Hook output must contain `additional_context` |
| Two workflows fighting | Another plugin's router is active; keep one coordinator in project rules |

## See also

- [Workflow activation](workflow-activation.md)
- [Usage guide](usage-guide.md)
- [Getting started](getting-started.md)
