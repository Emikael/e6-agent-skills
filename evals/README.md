# Skill Evals

How this repo measures whether its skills actually work: that they **trigger** when they should, **stay distinct** from each other, and **change agent behavior** the way each skill promises.

## Prior art (and what we adopted)

There is no single settled community standard for evaluating `SKILL.md` skills, but two approaches lead:

- **Anthropic's skill-creator v2** defines a per-skill `evals.json` (prompt + `expectations[]`, graded from the transcript) plus trigger-accuracy testing of descriptions against sample prompts. We adopt its [`evals.json` schema](https://github.com/anthropics/skills/tree/main/skills/skill-creator) for our behavioral tier and add one optional `kind` field to select the artifact being graded.
- **Superpowers** (obra) tests skills with bash + `claude -p` + prompt fixtures and grader scripts. Our behavioral runner follows the same headless-`claude` pattern, with the grading rubric drawn from `expectations[]`.

What neither provides is a **deterministic, CI-safe** check for a multi-skill *catalog* — does each skill's description carry the vocabulary users actually say, and do two skills' descriptions collide? That's Tier 2 below, and it's this repo's addition.

## The three tiers

| Tier | What it checks | Runs | Cost |
|---|---|---|---|
| 1. Structural | Frontmatter, naming, required sections, command parity | CI (`validate-skills.js`, `validate-commands.js`) | Free |
| 2. Trigger & routing | Positive prompts rank their skill top-k; negative prompts don't; no two descriptions near-collide | CI (`run-evals.js`) | Free |
| 3. Behavioral | An agent following the skill satisfies its `expectations[]` | On demand (`run-evals.js --behavioral`, Claude or Codex) | Tokens |

Tier 2 is a **lexical approximation** of routing (stemmed TF-IDF over descriptions). It cannot judge semantics or installed competing plugins. It checks lexical symptoms: a description missing the vocabulary users say (false negative), and an over-broad description that outranks the right skill (false positive). A Tier-2 failure usually means *fix the description*, not the eval.

## Running

```bash
# Tier 2 — deterministic, runs in CI
node scripts/run-evals.js
node scripts/run-evals.js --min-rank1 95  # enforce the current routing floor

# Tier 3 — selected-skill compliance; opt-in, spends model tokens
node scripts/run-evals.js --behavioral e6-test-driven-development --engine claude
node scripts/run-evals.js --behavioral using-e6-agent-skills --engine codex --eval-id 2
node scripts/run-evals.js --behavioral using-e6-agent-skills --engine codex --eval-id 2 --dry-run

# Paired old/new bodies with the same current prompt/fixtures/rubric
node scripts/run-evals.js --behavioral using-e6-agent-skills --engine codex \
  --eval-id 2 --pack-root /path/to/immutable-old-pack
node scripts/run-evals.js --behavioral using-e6-agent-skills --engine codex \
  --eval-id 2 --pack-root /path/to/immutable-new-pack
```

Tier 3 supports `execution` and `dialogue`. Execution runs real `files[]` fixtures in a throwaway Git repository and judges tool actions plus final artifacts. Dialogue is for conversational deliverables such as interviewing or concise communication; it does not pretend to verify application edits. New dialogue exemptions need review.

Claude uses its headless stream-json mode and pre-approved fixture tools. Codex uses `exec --json --ephemeral --ignore-user-config` in the throwaway workspace. The selected skill and its sibling/reference paths are available on demand; the whole catalog is not injected. `--engine` defaults to Claude for compatibility. `--eval-id` selects one case; `--pack-root` chooses the evaluated pack; `--model` is optional. Record the requested and observed model. A CLI that omits model identity is recorded as unknown, not guessed. Ambient host instruction differences remain a limitation.

The runner copies the evaluated skills and references into a temporary read-only reference snapshot, excludes dependency/Git directories, and records source-pack hashes before and after execution. File permissions and instructions are reproducibility aids, not a security sandbox. Execution artifacts include the fixture baseline SHA, baseline-to-final tracked diff (including committed work), commits, and bounded untracked text: at most 50 files, 32 KiB per file, and 256 KiB total. Binary/symlink skips, truncation, and omissions are explicit. Runner-captured artifacts show final state; only executor evidence proves the agent ran checks.

Every invocation gets a distinct ignored results directory with case, CLI/model/pack metadata, executor trace, grader trace, artifact evidence, and validated grading JSON. Failed model calls retain partial trace/error evidence and receive no successful score. Timeouts bound execution; a network or tool denial is an environment failure, not evidence that the skill passed or failed its behavioral rubric. Graders receive traces as untrusted data, separately from their rubric; they judge actual actions rather than claims. Grader tools are disabled for Claude, and Codex grading uses read-only mode.

These runs deliberately select a skill. They measure compliance after selection, not natural installed-plugin discovery. Plugin evals below test native routing. Lexical checks, dry-runs, and passing fixture tests do not substitute for either. Use paired identical prompts/fixtures, repeated runs, manual evidence review, and an explicit model/CLI when making comparative claims. Equal results show no measured behavioral improvement; one pair does not establish market superiority or token savings.

The catalog includes full-workflow continuation, exact acceptance-to-test/runtime evidence, unavailable browser/computer capabilities, preserved user authorization, test-only RED delivery, bounded delegation, semantic contract preservation, and irreversible recovery cases. The Caveman dialogue case verifies concise output while retaining negation, units, errors, ownership, and uncertainty.

## Benchmark

To compare whole skill packs (e6, Superpowers, a no-skills baseline) on the same tasks with hidden acceptance tests, mutation scoring, and a simulated user, use the [SDLC benchmark](benchmark/README.md). Results: [docs/benchmark-results.md](../docs/benchmark-results.md).

## Plugin evals (Claude Code)

`claude plugin eval` (Claude Code 2.1.269 or later) loads the whole plugin, every skill at once, runs the cases under `evals/plugin/`, and scores each case with and without the plugin. It complements Tier 2 rather than replacing it: Tier 2 checks that a description carries the vocabulary users say; this checks that Claude Code's own router picks the skill on a natural prompt, and what the skill adds to the reply (the `Δ` column).

```bash
claude plugin eval . --no-publish                                          # every case, both arms, 3 runs each
claude plugin eval . --case code-review-fires --runs 1 --ablation none     # one cheap iteration on one case
```

A case is a directory holding `prompt.md` (frontmatter: turn and tool limits; body: the prompt, sent verbatim) and one grader per file under `graders/`. Reports land in `evals/plugin/results/<timestamp>/`, already gitignored. Every run and every `llm` grader is a real model call on your account, so this runs on demand and never in CI, like Tier 3.

Two rules keep it honest. The manifest's `experimental.evals` key scopes the scan to `evals/plugin/`, so a fixture elsewhere under `evals/` is never read as a case. And a `tool_used: Skill` grader only says whether the skill fired; in a two-arm run it is excluded from the score, so pair it with a grader on the reply itself. `code-review-fires` shows the pattern: the fired indicator, a free `regex` grader that looks for the skill's severity taxonomy (Critical, Required, Nit, Optional, Consider, FYI) used as a heading or as a label, and one `llm` judge on the planted off-by-one. `code-review-stays-quiet` is the precision check: the review skill must not fire on a test-first request, and its `Δ` is expected to be 0; a second, unscored indicator records whether e6-test-driven-development fires instead.

What the first runs taught (Claude Code 2.1.278, claude-opus-5). Skill invocation is stochastic: the review skill fired in 5 of 7 runs on the phrasing the case uses, and e6-test-driven-development fired in 2 of 7 runs on the test-first prompt, so read `Δ` and the report rather than the exit code, or pass `--threshold 0.8` as the CI example in the docs does. In one run the review skill did not fire and the reply still used its severity taxonomy as headings, which no baseline run did in nine; the loaded skill descriptions may shape the reply even without an invocation. Phrasing matters, and the description is the lever. With the original description, "Review this diff before I merge it", "Can you do a proper code review of this change before I merge it?" and "Review this pull request for me before it goes into main" rarely fired the skill; the model reviewed the diff on its own, competently but without the verdict, the severity tiers or the five-axis pass. Describing what the skill adds did not help, and neither did naming diffs and pull requests on their own; what made the difference was saying that the skill applies even when the diff is pasted inline, which is the case the model was treating as "I can just do this myself". On claude-opus-5-5 with the model pinned, that one clause took the four review phrasings from 7 of 27 fires to 21 of 27, left the nine adjacent must-not-fire prompts at 0 of 27 both ways, and moved the plainest phrasing from 0 of 9 to 3 of 9, so it is better, not solved. `code-review-stays-quiet-on-commit-message` guards that clause: a pasted diff with a commit-message request must not fire the review skill. Two practical rules from the same day: pin `--model` and record the Claude Code version whenever you report numbers, because the CLI updates itself and the default model changed twice between morning and evening; and give a case a turn budget of 10 or more, since the model may reach a skill through its slash command (`e6-agent-skills:review`, then `e6-code-review-and-quality`), which costs two turns.

## Eval case format

One file per skill: `evals/cases/<skill-name>.json`.

```json
{
  "skill_name": "e6-test-driven-development",
  "trigger": {
    "positive": [
      { "prompt": "Write a failing test for this bug before fixing it", "top_k": 3 }
    ],
    "negative": [
      { "prompt": "Update the architecture diagram in the docs", "owner": "e6-documentation-and-adrs" }
    ]
  },
  "evals": [
    {
      "id": 1,
      "kind": "execution",
      "prompt": "Finance filed the reconciliation bug written up in BUG.md. Fix it.",
      "expected_output": "A failing reproduction test for the lost-cent case, a fix preserving both README invariants (exact sum, earliest-shares fairness), the fairness invariant covered by its own test, full suite passing",
      "files": [
        "e6-test-driven-development"
      ],
      "expectations": [
        "A test reproducing the lost-cent case from BUG.md is added and shown failing before src/split.js is modified",
        "The final implementation satisfies the full README fairness invariant (leftover cents go to the earliest shares): splitCents(10000, 3) returns [3334, 3333, 3333] as BUG.md expects and splitCents(100, 7) returns [15, 15, 14, 14, 14, 14, 14] as the README example shows; dumping the whole remainder on a single share would violate both",
        "The fairness invariant from the README has its own test case in the suite on an input with remainder of at least 2 (such as splitCents(100, 7)), where dumping the whole remainder on one share would fail it, beyond the reported lost-cent case",
        "The full suite is run with the repository's own command after the fix"
      ]
    }
  ]
}
```

- `evals[]` uses skill-creator's core schema (`id`, `prompt`, `expected_output`, optional `files[]`, `expectations[]`) plus this repository's optional `kind`. `kind` must be `execution` or `dialogue` and defaults to `execution` for compatibility. Execution evals require non-empty `files[]`; paths are relative to `evals/fixtures/` and may name a file or project directory. Dialogue evals may omit `files[]` because the transcript is the artifact. Expectations are verifiable statements a grader checks against the relevant artifact — behaviors, not phrasings.
- `trigger` is this repo's extension. `positive` prompts are realistic user asks that should route here (`top_k` defaults to 3; tighten to 1 for a skill's signature ask). `negative` prompts belong to a *different* skill; this skill must not rank first for them. Declare that skill in `owner` where you can: the runner then asserts the owner **outranks** this skill, turning the negative into a real pairwise routing test instead of one that can pass vacuously when the prompt matches nothing.

**Writing good trigger prompts:** paraphrase how users actually talk; don't copy the description (that's gaming the eval). If a realistic prompt can't rank because the description lacks its vocabulary, that is a real finding — improve the description.

## Adding a skill

Every skill ships with an eval file. When you add `skills/<name>/`, add `evals/cases/<name>.json` with at least 3 positive triggers, 2 negative triggers, and 1 behavioral eval. Execution evals must be backed by `evals/fixtures/<name>/`; use `kind: "dialogue"` only when the skill's deliverable is genuinely the conversation itself. Missing case files, incomplete case counts, unknown kinds, invalid fixture paths, and absent required fixtures are CI errors.

## Metrics to watch

The Tier-2 run prints a **trigger rank-1 rate** (share of positive prompts that rank their skill first, not merely top-k). CI runs with `--min-rank1 95`, leaving useful headroom below the checked-in 100% baseline so an unrelated description edit does not immediately turn CI red. Raise the floor as routing improves; never lower it to make a regression pass. Falling numbers mean descriptions are drifting toward each other. The collision check errors at ≥75% pairwise description similarity and warns at ≥50%. When these evals surface a description-vocabulary gap, fix the description, not the prompt.
