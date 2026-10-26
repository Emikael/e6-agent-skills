# Using e6-agent-skills with Codex

This repository is also a [Codex plugin](https://developers.openai.com/codex/plugins/build). Codex reads the same root-level `skills/` directory as Claude Code, so nothing is copied or duplicated. The plugin works in the Codex CLI and the Codex app, which share plugin and skill configuration.

> Codex menus and commands change between releases. The app steps below come from OpenAI's plugin documentation and were not exercised in this repository's CI; verify on your version with `codex plugin --help` and the app's Plugins screen.

## Codex CLI

```bash
codex plugin marketplace add Emikael/e6-agent-skills
codex plugin add e6-agent-skills@e6-agent-skills
```

The first command registers this repository as the `e6-agent-skills` marketplace. The second installs and enables the plugin. Start a new session so the skills are discovered. A local clone works too:

```bash
codex plugin marketplace add /path/to/your/clone
codex plugin add e6-agent-skills@e6-agent-skills
```

## Codex app (desktop)

1. Register the marketplace once with the CLI command above. The app and CLI share Codex's local configuration, so the marketplace should then appear in the app.
2. Open **Plugins** in the app, find **e6-agent-skills**, and install it (the plus button or **Add to Codex**).
3. Start a new thread in your project. Describe the outcome, or mention a skill explicitly.

If the plugin does not appear, check `codex plugin marketplace list` and restart the app.

## Skills without the plugin

Codex discovers repository skills under `.agents/skills/`. To install self-contained copies, with shared checklists vendored into each skill:

```bash
node /path/to/e6-agent-skills/scripts/build-portable-skills.js --out .agents/skills
```

Use `--force` after upgrading, and `--skills a,b` for a subset. Copying `skills/` directly would leave links to the pack-level `references/` folder dangling.

## Activate the whole workflow

Descriptions select skills; bodies load on demand ([progressive disclosure](https://developers.openai.com/codex/skills)). For automatic routing on ordinary requests, add the compact project rule:

```bash
node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
  --project . --pack /path/to/e6-agent-skills --host codex --write
```

It adds a managed block to `AGENTS.md`, preserving existing content. See [workflow activation](workflow-activation.md#codex-opencode-and-gemini).

## Usage

- Natural request: "Implement status filtering for reports" starts the coordinator through the bootstrap.
- Explicit skill: in the CLI, plugin skills use the `$` mention with the plugin namespace, for example `$e6-agent-skills:using-e6-agent-skills` or `$e6-agent-skills:e6-spec-driven-development`. A standalone skill uses `$<skill-name>`.
- All 26 skills are available. See the [usage guide](usage-guide.md) for request patterns.

## How it works

- `.codex-plugin/plugin.json`: the Codex plugin manifest. It points `skills` at `./skills/` and provides the app's display metadata.
- `.agents/plugins/marketplace.json`: the marketplace entry declaring the repository root as the plugin source.
- `skills/<name>/SKILL.md`: unchanged. Codex and Claude Code share the `name` + `description` frontmatter format.

Slash commands in `.claude/commands/` and personas in `agents/` stay Claude Code-specific. Claude Code loads `hooks/hooks.json`; Codex uses the `AGENTS.md` bootstrap instead of assuming hook compatibility.
