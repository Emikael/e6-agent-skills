# Using e6-agent-skills with Claude Desktop and claude.ai

Claude offers two different surfaces, with different install paths:

| Surface | What it can do with e6 | Install |
|---|---|---|
| **Claude Code** (CLI, the Code tab in the Claude Desktop app, Claude Code on the web) | Full workflow: plugin skills, slash commands, personas, SessionStart bootstrap, real repository and local runtime | Plugin marketplace |
| **Claude apps** (claude.ai chat, Claude Desktop chat, Cowork) | Individual skills that Claude loads by description; no hooks or slash commands | Upload one ZIP per skill |

> Menu names in the Claude apps change between releases. The steps below follow Anthropic's help article "Use skills in Claude" as of October 2026; they were not exercised in this repository's CI. Verify on your version.

## Claude Code, including the Desktop app's Code tab

Use the plugin. It carries every skill, the nine lifecycle commands, the four personas, and the compact SessionStart bootstrap:

```
/plugin marketplace add Emikael/e6-agent-skills
/plugin install e6-agent-skills@e6-agent-skills
```

Start a new session after installing. Commands are namespaced, for example `/e6-agent-skills:build`. See the [README](../README.md#quick-start) for SSH and local-clone alternatives.

## Claude apps: upload skills as ZIPs

### 1. Enable code execution

Skills run in Claude's code execution environment.

- **Free, Pro, Max:** Settings > Capabilities > turn on **Code execution and file creation**.
- **Team, Enterprise:** an owner enables code execution, and on Enterprise also Skills, under Organization settings > Plugins & skills.

### 2. Build one ZIP per skill

Each upload must contain a single top-level folder named after the skill, with its `SKILL.md`. The pack's skills link to shared checklists at the repository root, so build self-contained copies:

```bash
git clone https://github.com/Emikael/e6-agent-skills.git
cd e6-agent-skills
node scripts/build-portable-skills.js --out dist/claude-skills --zip
```

This writes `dist/claude-skills/<skill>.zip` for all 26 skills. Each ZIP vendors the shared references its skill links to, such as the workflow contract and the Definition of Done. Links to other skills become repository URLs, because each uploaded skill stands alone. Use `--skills a,b` for a subset and `--force` to rebuild.

### 3. Upload

1. Open **Customize > Skills**.
2. Click **+**, then **Create skill**, then **Upload a skill**, and choose a ZIP.
3. Toggle the skill on. Repeat for each skill you want.

To update a skill, upload the rebuilt ZIP for it. On Team and Enterprise plans, owners can upload skills once to provision them for everyone; users can then toggle them. In Cowork, organization skills can also be installed from the directory under Customize.

Common upload errors: a ZIP over the size limit, a folder name that does not match the skill's `name`, or a missing `SKILL.md`.

### 4. Choose a set

Start small; every enabled skill adds its description to Claude's context.

| Goal | Upload |
|---|---|
| Specs, plans, and reviews in chat | `using-e6-agent-skills`, `e6-caveman`, `e6-interview-me`, `e6-spec-driven-development`, `e6-planning-and-task-breakdown`, `e6-code-review-and-quality` |
| Add on: debugging pasted errors | `e6-debugging-and-error-recovery`, `e6-test-driven-development` |
| Add on: design questions | `e6-api-and-interface-design`, `e6-frontend-ui-engineering`, `e6-security-and-hardening`, `e6-documentation-and-adrs` |

### 5. Activate the workflow

The Claude apps run no hooks, so nothing injects the bootstrap automatically. Either ask for it ("Use the e6 workflow: …"), or paste the short [workflow bootstrap](../references/workflow-bootstrap.md) into a Project's custom instructions.

### Limits

- No slash commands and no personas. Ask by name instead, for example "Use e6-code-review-and-quality on this diff."
- Chat cannot run your application. The Build, Verify, and runtime checks need a repository and local runtime, so in chat they stay blocked unless the files are uploaded and can run in the sandbox. Use chat for Define, Plan, and Review, and Claude Code for implementation.
- Each skill is isolated. The coordinator routes to specialists by name, so enable every skill you expect it to use.

## See also

- [Usage guide](usage-guide.md): request patterns that get the best results.
- [Workflow activation](workflow-activation.md)
- Anthropic: [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude)
