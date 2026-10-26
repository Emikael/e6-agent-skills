# Using e6-agent-skills with Grok Build

[Grok Build](https://x.ai/build) is xAI's terminal coding agent (`grok`). It supports Agent Skills (`SKILL.md`), the `AGENTS.md` instruction family, plugins, hooks, and MCP servers.

> The paths below come from xAI's "Skills, Plugins & Marketplaces" documentation and from E6 Code's Grok integration, as of October 2026. They were not exercised in this repository's CI. Confirm what loaded with `grok inspect` on your version.

## Recommended: skills plus the `AGENTS.md` bootstrap

1. Install self-contained skills. Use the project folder for one repository, or your user folder for all of them:

   ```bash
   # Project: discovered from ./.grok/skills/ (walked up to the repository root)
   node /path/to/e6-agent-skills/scripts/build-portable-skills.js --out .grok/skills
   # User: ~/.grok/skills/ (Grok also reads ~/.agents/skills/)
   node /path/to/e6-agent-skills/scripts/build-portable-skills.js --out ~/.grok/skills
   ```

   The builder copies the shared checklists each skill links to into that skill's `references/` folder. Add `--force` after upgrading and `--skills a,b` for a subset.

2. Select the coordinator for ordinary requests. Grok reads `AGENTS.md` files from the working directory up to the repository root:

   ```bash
   node /path/to/e6-agent-skills/scripts/install-workflow-bootstrap.js \
     --project . --pack /path/to/e6-agent-skills --host grok --write
   ```

   The installer adds a managed block and preserves existing instructions. `--check` reports a stale block after a pack upgrade.

3. Verify:

   ```bash
   grok inspect          # config sources, instructions, skills, plugins, hooks
   grok inspect --json   # skills[] with name, description, source.type, source.path
   ```

   Expect 26 e6 skills with `source.path` pointing at the folder you chose, and `AGENTS.md` listed among the instructions.

## Plugin options

- **Local plugin folder.** Grok loads plugins from `./.grok/plugins/` and `~/.grok/plugins/`, and its documentation says it also reads Claude Code plugins. Cloning this repository to `~/.grok/plugins/e6-agent-skills` should expose `skills/` without a copy step. Whether Grok runs the Claude `hooks/hooks.json` SessionStart bootstrap is unverified, so keep the `AGENTS.md` bootstrap either way. Project hooks under `.grok/hooks/` need `/hooks-trust`.
- **Official marketplace.** The [xAI plugin marketplace](https://github.com/xai-org/plugin-marketplace) pins each remote plugin to a full commit SHA, which Grok re-verifies at install. e6-agent-skills is not listed there today; listing it needs a pull request to that repository. A listed plugin installs with `grok plugin install <name> --trust`, or from `/marketplace` inside Grok.

## Usage

- Describe the outcome; Grok auto-invokes skills whose descriptions match, and the bootstrap selects `using-e6-agent-skills` as coordinator.
- Name a skill to force it, for example "use e6-spec-driven-development to write the spec first".
- The lifecycle command wrappers (`/spec`, `/plan`, `/build`, …) are not installed for Grok. Name the phase in your request instead; see the [usage guide](usage-guide.md).

E6 Code drives Grok Build as one of its providers and lists the same skills in its `$` picker from `grok inspect --json`.

## Sources

- xAI: [Skills, Plugins & Marketplaces](https://docs.x.ai/build/features/skills-plugins-marketplaces)
- xAI: [plugin-marketplace repository](https://github.com/xai-org/plugin-marketplace)
