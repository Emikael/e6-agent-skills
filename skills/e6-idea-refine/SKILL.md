---
name: e6-idea-refine
description: Use when an idea is vague, when the user asks to brainstorm, ideate, or refine an idea, when several product directions could solve the same problem, or when a product plan, onboarding, or user flow needs stress-testing and alternatives before committing to an MVP.
---

# Idea Refine

## Overview

Turn a raw idea into a focused concept worth testing. Explore meaningful alternatives, expose assumptions, and choose the smallest scope that proves user value.

## When to Use

- A problem is understood but the solution or MVP scope is unsettled.
- The user asks to ideate, refine, or stress-test a product direction.
- Several plausible directions compete for the same time or resources.

**Not for:** unclear intent or success → `e6-interview-me`; adversarial review of a high-risk artifact → `e6-doubt-driven-development`; a settled direction that only needs requirements → `e6-spec-driven-development`.

## Process

### 1. Ground the problem

Follow `e6-context-engineering`. Read the confirmed intent, relevant spec, project rules, constraints, and code paths before asking questions or proposing variations. Cite the files used; separate observed architecture from assumptions.

Restate the idea as: "How might we <outcome> for <specific user> within <constraint>?"

Ask only what remains unknown: target user, observable success, binding constraint, prior attempt, or why now. Ask one question at a time, using the host's structured-question tool when it has one. Accept existing answers and delegated choices. A material product decision needs user direction; a reversible implementation detail does not.

**One-recommendation fast path.** If the user asks for "just one recommendation" or delegates the choice, skip the choice rounds. Weigh alternatives internally, then return one direction with its core bet, riskiest assumption, pass/fail threshold, and MVP, in the one-pager shape below.

### 2. Expand proportionately

Pick useful lenses: inversion, simplification, audience shift, combination, constraint removal, or expert perspective. For a broad ideation request, generate 5–8 considered variations. For a narrow refinement, fewer distinct options are enough. Each variation states its benefit and core bet in a few lines.

Load [frameworks.md](frameworks.md) only for a lens you need and [examples.md](examples.md) only for a similar scenario.

If the user wants to choose, wait for their reaction before converging. If they delegated direction, recommend one within the stated goals and keep the uncertainty visible.

### 3. Evaluate and converge

Cluster useful options into distinct directions. Compare:

| Dimension | Evidence to seek |
|---|---|
| User value | Named beneficiary, current workaround, frequency and cost of the problem |
| Feasibility | Existing architecture, hardest dependency, effort and time to first value |
| Differentiation | A meaningful reason to switch, when that matters to this idea |

Use [refinement-criteria.md](refinement-criteria.md) for deeper evaluation. For each serious direction, state the unvalidated assumption, what could kill it, and what is deliberately deferred. Push back on weak value or unnecessary scope with concrete reasons.

Choose the minimum version that tests the riskiest assumption. Every assumption to validate gets an experiment, an observable pass/fail threshold, and a time limit. Distinguish assumed demand from evidence of demand.

### 4. Save the one-pager

Use the project's existing idea location; otherwise `docs/ideas/<idea>.md`:

```markdown
# <Idea name>
## Problem and target user
<One-sentence problem; named actor or beneficiary>
## Success
<Observable outcome, threshold, and evidence source>
## Recommended direction
<Chosen approach and why; brief>
## Assumptions to validate
- <Assumption> — experiment: <method>; pass if <threshold>, fail if <threshold>; time limit: <duration>
## MVP scope
<Smallest useful path that tests the core bet>
## Not doing, and why
- <Specific cut and reason>
## Open decisions
<Material unknowns, or none>
```

Saving this working artifact is part of an authorized refinement task; preserve existing work. Create `docs/ideas/` if absent (the optional helper is `scripts/idea-refine.sh`, run from the target project root).

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Ideation-only work stops at the one-pager and its experiment; an authorized build hands the chosen direction to `e6-spec-driven-development` without asking whether to continue.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "More ideas mean better ideation" | Distinct alternatives matter; shallow volume wastes attention. |
| "The architecture can wait" | Existing boundaries change which options are feasible. |
| "The user nodded, so demand is proven" | A named experiment and observable result validate the bet. |
| "I need permission to save the idea" | A working artifact belongs to the authorized task. |

## Red Flags

- Variations produced before reading relevant project context.
- Several questions asked in one turn.
- Missing target user or success measure.
- Untested assumptions presented as facts, or assumptions without pass/fail thresholds.
- Expanding a settled implementation request into new ideation.
- A one-pager with no MVP, non-goals, or experiment.

## Verification

- [ ] Relevant intent and project facts grounded the session.
- [ ] Distinct directions were explored when uncertainty warranted them, or the fast path returned one recommendation.
- [ ] The chosen direction names user value, scope, non-goals, and observable success.
- [ ] Each assumption has an experiment, a pass/fail threshold, and a time limit.
- [ ] The one-pager is saved or returned in the requested form.
- [ ] Ideation scope stayed bounded; an authorized build advanced.
