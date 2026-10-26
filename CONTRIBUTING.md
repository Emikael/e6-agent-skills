# Contributing to e6-agent-skills

Thanks for your interest in contributing! This project is a collection of production-grade engineering skills for AI coding agents.

New here? [docs/developer-onboarding.md](docs/developer-onboarding.md) is a guided tour of how the repo fits together (the five layers, the verification loop, and the contribution paths) and tells you when to read this document, [skill-anatomy.md](docs/skill-anatomy.md), and [evals/README.md](evals/README.md). This file is the authoritative rulebook; the onboarding guide is the map.

## Adding a New Skill

### Before proposing a new skill

This pack already covers most of the development lifecycle, and many proposals overlap with an existing skill or another open PR. Before opening one, do these checks so reviewers aren't triaging duplicates:

1. **Search the catalog.** Browse [the skill list in the README](README.md) and skim `skills/` for an existing skill that covers your idea, whole or in part.
2. **Check open PRs.** Run `gh pr list --state open` (or browse the PRs tab) and look for proposals on the same topic. Clusters of near-duplicate skills already exist; don't add to them.
3. **Check rejected proposals.** Search the [skill-change rejection ledger](evals/skill-impact.md) for earlier proposals that overlap with your idea and review their eval evidence before repeating the work.
4. **Read the anatomy.** Confirm your idea fits the format in [docs/skill-anatomy.md](docs/skill-anatomy.md), an actionable workflow with verification, not vague advice.
5. **Justify the gap in your PR description.** State explicitly why this isn't covered by an existing skill, open PR, or previously rejected proposal. If it overlaps, propose extending the existing skill instead of adding a new one.
6. **Strip model-specific workarounds.** If a step can't be justified without naming a model, a model version, or one agent's private tool name, it doesn't belong in a skill — describe the capability instead (see [Write the Procedure, Not the Workaround](docs/skill-anatomy.md#write-the-procedure-not-the-workaround)).

If your idea is a refinement of an existing skill, prefer a focused edit to that skill over a new directory.

### Creating the skill

1. Create a directory under `skills/` with a kebab-case name
2. Add a `SKILL.md` following the format in [docs/skill-anatomy.md](docs/skill-anatomy.md)
3. Include YAML frontmatter with `name` and `description` fields
4. Start the `description` with `Use when` and concrete trigger conditions; keep workflow steps in the skill body

### Skill Quality Bar

Skills should be:

- **Specific** — Actionable steps, not vague advice
- **Verifiable** — Clear exit criteria with evidence requirements
- **Battle-tested** — Based on real engineering workflows, not theoretical ideals
- **Minimal** — Only the content needed to guide the agent correctly

### Structure

Every new skill must have:

- `SKILL.md` in the skill directory
- YAML frontmatter with valid `name` and `description`
- An eval case file at `evals/cases/<skill-name>.json` — at least 3 positive triggers, 2 negative triggers (with `owner` where possible), and 1 behavioral eval. Execution evals must be backed by real files under `evals/fixtures/`; conversation-shaped skills may use a reviewer-gated `kind: "dialogue"` eval instead (see [evals/README.md](evals/README.md)). CI enforces these requirements.

New skills should generally follow the standard anatomy:

- **Overview** — What this skill does and why it matters
- **When to Use** — Triggering conditions
- **Process** — Step-by-step workflow
- **Common Rationalizations** — Excuses agents use to skip steps, with rebuttals
- **Red Flags** — Warning signs that the skill is being applied incorrectly
- **Verification** — How to confirm the skill was applied correctly

The frontmatter fields above are required. The section anatomy is a recommended pattern: equivalent headings such as `How It Works`, `Workflow`, or `Core Process` are fine when they preserve the same intent and keep the skill easy to follow.

### What Not to Do

- Don't duplicate content between skills — reference other skills instead
- Don't add skills that are vague advice instead of actionable processes
- Don't create supporting files unless content exceeds 100 lines
- Don't create an empty `scripts/` directory just to match another skill — add `scripts/` only when the skill includes runnable helpers
- Don't copy shared reference material into skill directories. Material used by several skills lives in the root `references/`; material used by exactly one skill may live in that skill's own `references/` (see [skill-anatomy.md](docs/skill-anatomy.md#shared-references))

## Modifying Existing Skills

Before proposing a change, search the [skill-change rejection ledger](evals/skill-impact.md) for previous attempts affecting the same skill and review their eval evidence.

- Keep changes focused and minimal
- Preserve the existing structure and tone
- Test that YAML frontmatter remains valid after edits

If a skill or description change is rejected based on eval results, add one row to the ledger with the date, affected skill, concise attempted change, before-to-after rank-1 score, and rejected PR link and outcome. Land that ledger-only update separately on the default branch; do not leave it only on the rejected proposal branch, where closing or force-pushing the proposal could discard the record.

## Repo-scoped files

`AGENTS.md` and `CLAUDE.md` at the repo root configure agents working on the [`Emikael/e6-agent-skills`](https://github.com/Emikael/e6-agent-skills) repository itself. When writing setup guides or docs, do not instruct users to copy these files into their own projects or into a global agent configuration; the reusable assets are the skills in `skills/`.

## Translations

We don't accept translations of the documentation (README, `docs/`) or of skills and their content. Translated copies drift out of sync as skills and docs evolve, and we have no way to maintain them long-term without leaning on agent translations plus community corrections, which adds maintenance cost for limited value. Keep all skills, docs, and contributions in English.

## Testing Activation and Workflow

The Claude plugin registers `hooks/hooks.json`. Its SessionStart script injects the compact `references/workflow-bootstrap.md` and installed paths on startup/resume/clear/compact/fork. It does not inject the whole catalog and needs no jq. Other hosts can use `scripts/install-workflow-bootstrap.js` to preview/check/write a marked project-rule block. See [workflow activation](docs/workflow-activation.md).

Run before changing activation, the router, or bootstrap:

```bash
bash hooks/session-start-test.sh
node --test scripts/install-workflow-bootstrap-test.js
node scripts/validate-skills.js
node scripts/run-evals.js --min-rank1 95
```

Run meaningful script regressions with `node --test scripts/*test.js scripts/lib/*test.js`, plus reference/command/artifact validators. Skill edits require observable pressure scenarios: acceptance-based tests, authorized continuation, unavailable-runtime evidence, bounded delegation, and correct handoff. Lexical routing and dry-runs do not prove model behavior. Use the opt-in behavioral runner with available supported engines; record model/CLI, pack revision, actual traces and limitations. See [evals](evals/README.md).

## Reporting Issues

Open an issue if you find:

- A skill that gives incorrect or outdated guidance
- Missing coverage for a common engineering workflow
- Inconsistencies between skills

If a skill's guidance was wrong, outdated, or did not apply in your project
(for example, it assumed `npm test` in a Maven or Gradle repo), use the
[Skill gap](https://github.com/Emikael/e6-agent-skills/issues/new?template=skill-gap.yml)
issue form. It asks for the affected skill, the relevant excerpt, your project
context, and what you did instead — enough for maintainers to triage without a
freeform write-up.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
