---
name: e6-interview-me
description: Use when an ask is underspecified, requirements are fuzzy, or the underlying intent is unclear before a plan, spec, or code exists. Use when the user says "interview me", "grill me", or "ask me one question at a time", or when conflicting goals would change the requested feature.
---

# Interview Me

## Overview

Find the user's actual outcome before selecting a solution. Ask one focused question at a time while a material unknown remains. Do not re-ask what the user already answered or what they delegated to you.

## When to Use

- The actor, desired outcome, observable success, or binding constraint is unclear.
- Two plausible interpretations would produce different behavior or scope.
- The user explicitly requests an interview or intent check.

Skip pure information requests, mechanical edits, and fields the task or project already answers.

**Not for:** choosing among solution directions → `e6-idea-refine`; writing requirements once intent is clear → `e6-spec-driven-development`; adversarial review of a finished plan → `e6-doubt-driven-development`.

## Process

### 1. Read before asking

Follow `e6-context-engineering`. Read the current request, prior decisions, the active intent or spec, and relevant project rules or code. Search only the area needed to resolve the ask.

State a tentative hypothesis in one sentence and name the material uncertainty. Confidence is not evidence: only the user's answers or project facts settle an unknown.

```text
HYPOTHESIS: You need a personal list of running experiments.
UNCERTAIN: Which source owns experiment status and what makes a result useful?
```

### 2. Ask the next useful question

Ask one question whose answer changes the outcome, acceptance, or a constraint. Wait for the answer before choosing the next one.

- If the host has a structured-question tool, use it: one question, 2–4 concrete options, plus "other". Otherwise ask in plain text with the same options.
- Probe vague goals such as "scalable" or "modern": which observable result matters?

**Budget:** about five questions for a typical feature. If material unknowns remain after that, restate the intent with them listed as Open decisions and let the user pick which to settle. An explicit "grill me" may go deeper, but every question must still change the outcome.

Accept explicit delegation such as "choose the simplest option". Make a reversible choice within that authority and record it. Ask again only if the remaining choice changes material product behavior, money, permissions, or stored data.

### 3. Restate the intent

Use the user's language:

```text
Outcome: <result>
User: <actor or beneficiary>
Why now: <known reason, or not relevant>
Success: <observable evidence>
Constraint: <binding limit>
Out of scope: <specific non-goals>
Open decisions: <material unknowns, or none>
```

Clear confirmation includes "yes", "sounds good", or "sure, build it" when it refers to this statement. Prior authorization and clear delegation also count. Silence does not settle a material unknown. Fold corrections into the statement.

Stop once the intent is sufficient to define acceptance and the remaining Open decisions are explicit. If answers keep changing the frame, name the contradiction and ask the question that resolves it.

### 4. Record the result

- **Interview-only request:** return the statement; save it only if asked.
- **Build request:** larger work saves it to the project's intent location, otherwise `docs/intent/<topic>.md` ([Artifacts](../../references/workflow-contract.md#artifacts)). Small work keeps it inline.

In non-interactive work, use existing facts and authorized defaults. Record unresolved material decisions as blockers and continue independent work. Never simulate the user's confirmation.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). An interview-only request stops at the confirmed statement; a build continues to `e6-idea-refine` when solution options remain, or to `e6-spec-driven-development` when scope is concrete.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "I can infer the missing policy" | A material product decision needs evidence or user direction. |
| "They must literally say yes" | Clear confirmation and delegated authority settle routine choices. |
| "An interview means no tools" | Read project facts before spending a question. |
| "Now I should offer to continue" | A build request already authorizes downstream work. |

## Red Flags

- Asking for facts present in the active spec or project.
- Batching several questions into one turn, or exceeding the budget without listing Open decisions.
- Treating confidence as evidence.
- Starting a spec while a material product decision remains unresolved.
- Stopping an authorized build because the interview finished.

## Verification

- [ ] Relevant existing intent and project facts were read first.
- [ ] Only material questions were asked, one at a time, within the budget.
- [ ] Outcome, user, observable success, constraints, and non-goals are recorded.
- [ ] Confirmation or delegated authority is clear; Open decisions are explicit.
- [ ] Interview-only scope stayed bounded; authorized engineering work advanced.
