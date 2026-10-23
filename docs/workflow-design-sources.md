# Workflow design sources

Source appendix for the workflow update. Selected upstream files were read on
2026-10-01; the revisions below pin that inspection. Upstream observations informed
e6's design. They do not establish that the changes improve agent behavior.

| Source | Inspected revision and commit date | License |
|---|---|---|
| [i-have-adhd](https://github.com/ayghri/i-have-adhd/blob/839872f9d1cd634fed642b4589ce7226199cc15f/skills/i-have-adhd/SKILL.md) | `839872f9d1cd634fed642b4589ce7226199cc15f`, 2026-09-19 | [MIT](https://github.com/ayghri/i-have-adhd/blob/839872f9d1cd634fed642b4589ce7226199cc15f/LICENSE), Ayoub Ghriss |
| [Compound Engineering](https://github.com/everyinc/compound-engineering-plugin/blob/7ee6e7017184ed955d15336e4da88a42e0bb4136/skills/ce-work/SKILL.md) | `7ee6e7017184ed955d15336e4da88a42e0bb4136`, 2026-10-01 | [MIT](https://github.com/everyinc/compound-engineering-plugin/blob/7ee6e7017184ed955d15336e4da88a42e0bb4136/LICENSE), Every |
| [Superpowers](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/writing-skills/SKILL.md) | `8ca22dba9a94f28898bbce59f2537ff4d87c747d`, 2026-09-25 | [MIT](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/LICENSE), Jesse Vincent |
| [Superpowers `using-superpowers`](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/skills/using-superpowers/SKILL.md) | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`, 2026-10-21 | [MIT](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/LICENSE), Jesse Vincent |
| [Caveman](https://github.com/JuliusBrussee/caveman/blob/f5d729488caa8f6a5b6c8086fe2cccd3e8a63f91/skills/caveman/SKILL.md) | `f5d729488caa8f6a5b6c8086fe2cccd3e8a63f91`, 2026-10-01 | [Apache-2.0](https://github.com/JuliusBrussee/caveman/blob/f5d729488caa8f6a5b6c8086fe2cccd3e8a63f91/LICENSE), Julius Brussee |

## Patterns adopted and adapted

- **ADHD:** adopt visible next actions, compact state, bounded steps, concrete
  errors, and substance preserved under brevity. Its visible-list cap explicitly
  does not limit analysis completeness. Adapt these as engineering communication
  defaults without making clinical claims, inventing time estimates, or sending
  agent-owned work back to the user. Its
  [paired quality harness](https://github.com/ayghri/i-have-adhd/blob/839872f9d1cd634fed642b4589ce7226199cc15f/evals/README.md#L33)
  informs evaluation isolation and quality checks beyond response length.
- **Compound:** adopt clear results, completion evidence, next consumers, scoped
  authority, and caller continuation after a specialist returns. Its
  [authoring guidance](https://github.com/everyinc/compound-engineering-plugin/blob/7ee6e7017184ed955d15336e4da88a42e0bb4136/docs/solutions/skill-design/portable-agent-skill-authoring.md#L135)
  supports conditional reference loading and bounded delegation. Its
  [learning gate](https://github.com/everyinc/compound-engineering-plugin/blob/7ee6e7017184ed955d15336e4da88a42e0bb4136/skills/ce-compound/SKILL.md#L16)
  informs saving verified, reusable reasoning instead of routine completion logs.
  Adapt these into a small shared workflow contract; do not import its full
  cross-model controller, receipt schema, automatic shipping tail, or repeated
  confirmation policy.
- **Superpowers:** adopt trigger-focused descriptions, genuine failing behavior
  tests before fixes, evidence before completion claims, and
  [pressure scenarios](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/writing-skills/testing-skills-with-subagents.md#L30).
  Adapt routing to the requested deliverable and active coordinator. Small
  documentation changes need appropriate validation, not invented behavior tests;
  authorized continuation does not require fresh approval at every phase.
- **Superpowers `using-superpowers` (second pass):** adopt a one-line
  announcement when a skill starts, a classification step before the first
  action, an explicit rule that dispatched workers do not load the entry skill
  (its `SUBAGENT-STOP`), and its Cursor `sessionStart` hook output
  (`additional_context` when `CURSOR_PLUGIN_ROOT` is set). Do not adopt the
  "1% chance" hard gate, full-body session injection, or mandatory design
  approval; e6 keeps a compact bootstrap and honors approval only when the host
  or user asks for it. See the [comparison](comparison.md#coordinator-vs-bootstrap-using-e6-agent-skills-and-superpowersusing-superpowers).
- **Caveman:** adopt short readable prose, exact technical details, preserved
  negation, and clarity when compression could change meaning. Adapt blanket
  hedging removal to retain real uncertainty, and retain harness-required progress
  updates. Code, commands, quoted errors, documentation, commits, and memory keep
  correct syntax and readable language. Delegation budgets are e6 guidance, not a
  measured token-saving result.

The new [e6-caveman](../skills/e6-caveman/SKILL.md) was independently written from
these principles. Caveman source text, code, and runtime were not vendored.
Inspiration does not make that skill an upstream distribution. Copying or
adapting Apache-2.0 source text would require the applicable license, notices, and
change markings; copying substantial MIT material requires its copyright and
permission notice. Caveman's
[licensing history](https://github.com/JuliusBrussee/caveman/blob/f5d729488caa8f6a5b6c8086fe2cccd3e8a63f91/LICENSING.md#L3)
places the current repository under Apache-2.0 from 3.0.0. Older skill releases
were MIT; their terms must not be assumed for the current revision.

## Host activation and authority

The official Claude Code [hooks documentation](https://code.claude.com/docs/en/hooks)
was checked through Context7 on 2026-10-01. It documents plugin
`hooks/hooks.json`, `CLAUDE_PLUGIN_ROOT`, and `SessionStart` context injection.
Current session sources include `startup`, `resume`, `clear`, `compact`, and
`fork`. A compact bootstrap points to the installed router; it does not preload
every skill. Hosts without that hook use their supported skill discovery and
project-instruction adapter. See the [bootstrap](../references/workflow-bootstrap.md)
and [workflow contract](../references/workflow-contract.md).

Discovery exposes a skill; it does not guarantee lifecycle execution. Skill
instructions cannot override higher-priority harness or user instructions.
Applicable project rules, explicit task scope, and an explicitly selected
alternative workflow still govern. Browser evidence principles also inform e6's
computer/runtime policy; this is an e6 adaptation, not desktop coverage
demonstrated by these upstreams.

## Verification limits

The existing deterministic routing evaluation uses lexical TF-IDF ranking. It can
detect vocabulary gaps and description collisions within this catalog; it cannot
prove semantic activation, installed-plugin compliance, complete phase chaining,
or priority against another plugin. Forced-loaded skill evaluations likewise do
not establish natural discovery. Behavioral claims require actual model/tool
traces and artifacts, controlled configuration, paired old/new trials, meaningful
negative cases, and recorded models. Equal successful results establish no
regression, not improvement. Upstream evaluations were inspected, not rerun.

This appendix makes no measured token-saving, market leadership, or competitor
superiority claim.
