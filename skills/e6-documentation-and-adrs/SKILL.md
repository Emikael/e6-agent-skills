---
name: e6-documentation-and-adrs
description: Use when documenting an architecture decision (ADR), recording the reasoning behind a design choice, changing public APIs or setup flows, shipping features that change user-facing behavior, or maintaining README, API documentation, changelog, and agent rules.
---

# Documentation and ADRs

## Overview

Document current behavior and the evidence behind decisions. Useful docs explain how to use the code, why the design exists, and which constraints matter.

## When to Use

- Recording significant architectural decisions and expensive-to-reverse choices.
- Updating setup instructions, public API docs, or docs that a change made inaccurate.
- Updating agent-instruction files (`AGENTS.md`, `CLAUDE.md`, rule directories) when conventions change; they are documentation too.

**Not for:** comments that repeat obvious code, or docs for throwaway prototypes; designing the API contract itself → `e6-api-and-interface-design`; changelog entries and version bumps → `e6-git-workflow-and-versioning`.

## Process

### 1. Establish Sources and Conventions

Identify affected audience/artifacts. Read existing docs/instructions, accepted task/spec, changed code/API types, manifests/scripts, and actual setup/runtime evidence. Distinguish agreed decision facts from assumptions. Do not invent motives, measured benefits, approvals, or rejected alternatives to fill a template.

Honor the project's documentation rules; they override this skill ([project rules](../../references/workflow-contract.md#project-rules-override-pack-defaults)). Some projects forbid committing plans or agent notes, or documenting obvious behavior; follow that rule rather than adding the doc.

Before creating an ADR, inspect existing ADRs, `.adr-dir`, tooling, and instructions. Match location, markup, filename sequence, status values, and headings. Resolve conflicts from repository evidence; ask only if a material choice remains unresolved.

### 2. Record the Decision

Write an ADR for significant framework/dependency, data model, auth, API architecture, tooling, hosting, or other costly-to-reverse choices. With no established convention, use sequential files in `docs/decisions/`:

```markdown
# ADR-001: [Decision]
## Status
Proposed | Accepted | Superseded by ADR-XXX | Deprecated
## Date
[Actual decision or proposal date]
## Context
[Requirements, constraints, scope, source evidence]
## Decision
[Chosen approach, or explicit proposal]
## Alternatives Considered
[Real options, trade-offs, reasons for rejection]
## Consequences
[Benefits, costs, risks, operational work, compatibility effects]
```

Use Accepted only when decision evidence supports it. A request to record an already adopted decision is sufficient; do not request approval again. An undecided recommendation stays Proposed. Preserve historical ADRs. When a decision changes, create a new record and update supersession links/status according to convention.

### 3. Update Usage and Reference Docs

Keep README quick start, actual commands, environment requirements, architecture overview, and contributing information accurate. Reuse project manager/scripts; do not copy npm commands into a pnpm/Python project. Describe current state in timeless language. Link deeper rationale rather than repeating it.

Public REST/GraphQL/library docs need inputs, outputs, errors, auth/permissions, limits, and runnable examples at the relevant boundary. Maintain existing OpenAPI/schema or generated-doc source; do not edit output owned by tooling. Confirm examples match actual response shape and compatibility. Follow `e6-api-and-interface-design` for contract changes, `e6-deprecation-and-migration` for breaking transitions, and `e6-git-workflow-and-versioning` for changelog/version policy.

Inline comments explain non-obvious reasons/gotchas near affected code: ordering, lifetime, security assumptions, or costly edge cases. Prefer readable code for the what. Remove obsolete comments/commented-out code only in task scope. Keep valid TODOs with ownership/context where the project uses them; do not expand a docs task into unrelated implementation.

Agent-instruction files follow the same standard: update them when conventions, commands, or boundaries change; state each stable instruction once and link supporting detail; keep them short, because agents load them on every task. Never copy this skill pack's repository-specific `AGENTS.md` into another project.

### 4. Execute the Documented Path

Run changed quick-start commands and executable snippets in a clean suitable environment. Use representative non-sensitive configuration and discovered dependency policy. Verify installation, required migrations/services, and documented run command. A command in a table is not evidence it exists or works.

Validate changed links, markup/doc build, and generated API docs with project tooling. Compare API examples against real contract and representative runtime response, including relevant errors. For browser setup/user flows, use `e6-browser-testing-with-devtools` or available browser capability; for desktop flows, use available computer/runtime capability. Exercise the documented journey, not just compilation.

If access or prerequisites prevent a check, complete independent work and report the exact unverified instruction. Do not mark docs tested from inspection alone.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Return changed docs before the Review phase, so review covers them and confirms the Definition of Done.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The template needs a reason" | Unknown reasoning stays unknown. Read decision evidence first. |
| "Mark it Accepted for completeness" | Status reflects a real decision. |
| "The command looks right" | Run changed setup/examples; plausible instructions can fail. |
| "Rewrite all docs while here" | Update affected behavior/decisions; report unrelated debt briefly. |
| "The code explains everything" | Code omits usage constraints and rejected design choices. |

## Red Flags

- Invented trade-offs, approvals, dates, or performance claims
- A second ADR sequence/location despite existing conventions
- Untested README/API examples inconsistent with scripts/contracts
- Historical ADR deletion or broad cleanup during a scoped task
- Docs repeating implementation instead of explaining usage/intent
- A doc added that the project's rules forbid, or stale agent-instruction files left behind

## Verification

- [ ] Affected docs match conventions and current code/spec/decision evidence
- [ ] New significant decisions record truthful status/date, alternatives, scope, and consequences
- [ ] Changed commands/examples ran; relevant browser/computer journey was exercised
- [ ] Changed links, doc build, and generated/contract docs pass applicable checks
- [ ] Unknown/blocked checks are explicit; no fabricated execution
- [ ] Relevant public behavior and agent rules are current without unrelated cleanup
- [ ] Project documentation rules honored; changed artifacts, outcomes, and gaps returned
