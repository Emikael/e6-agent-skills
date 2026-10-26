---
name: e6-frontend-ui-engineering
description: Use when building or modifying user-facing interfaces, responsive pages, components or layouts; managing UI state; meeting WCAG accessibility requirements; or investigating focus, keyboard, loading, error, or visual behavior.
---

# Frontend UI Engineering

## Overview

Build accessible, responsive UIs from product requirements and the existing design system. Target WCAG 2.2 AA. Verify rendered behavior, interaction, and finish in the running app.

## When to Use

- Components, pages, layout, responsiveness, state, and interaction changes.
- Visual or UX fixes and accessibility work.

**Not for:** backend-only work → `e6-api-and-interface-design` or `e6-incremental-implementation`; driving the browser to collect evidence → `e6-browser-testing-with-devtools` (this skill decides what to check).

## Process

### 1. Discover the design system and code

Read applicable rules and the accepted task with its requirement IDs. Then, before designing anything, find what exists: design tokens (color, spacing, type, radius), shared components and their prop/ref conventions, related screens, state and data contracts, tests, and startup commands. Never add a styling or state library merely to follow an example.

### 2. Write a short design contract

For a new screen or a distinct new direction, inspect two or three trusted or product-supplied references, then record:

```text
Job: <what the user accomplishes here>
Primary action: <the one action the layout serves>
States: loading / empty / error / success / disabled / no permission
Breakpoints: <project breakpoints, or 320/768/1024/1440 px> and what changes at each
Tokens and components: <existing tokens and components reused>
Rejected patterns: <patterns deliberately avoided, and why>
```

Adapt structure to the product's own components and content; never copy another product's branding or assets. Without references, use product context and state material assumptions. [ui-patterns.md](references/ui-patterns.md) covers reference-led design and patterns to avoid.

### 3. Define acceptance and tests

Map each criterion to a visible outcome and interaction, including the contract's states, realistic content, responsive widths, and keyboard/focus behavior.

Use `e6-test-driven-development` for behavioral RED before implementation. Query by accessible role and label. Validate critical data and navigation flows across boundaries, not only mocked callbacks. Static visual changes need rendered comparison and accessibility evidence, not a tautological CSS test.

### 4. Implement within the current slice

`e6-incremental-implementation` owns the slice loop; implement the current slice here without reloading it. Keep components focused and prefer composition, colocation, and the simplest state that works:

- Local state for component UI; lifted state for nearby siblings.
- URL state for shareable filters and pagination; the project's server-state tooling for remote data; context for read-heavy theme, auth, or locale.
- Global state only when shared behavior demands it.

Handle loading and errors deliberately. Optimistic updates need scoped rollback that never erases a later success; follow [ui-patterns.md](references/ui-patterns.md#loading-and-transitions). Preserve public `className`, DOM refs, and consumer behavior; use `e6-api-and-interface-design` for changed props or shared contracts.

### 5. Verify in the running app

Use `e6-browser-testing-with-devtools` or the project's own test procedure. Start the app with repository commands; inspect screenshots and the actual DOM, console, and network state. Exercise accepted actions and states, not only the initial render.

- Tab and Shift+Tab through controls; test arrows, Enter, Space, and Escape as the widget requires. Disabled items neither execute nor take forbidden focus.
- Menus and dialogs: initial focus, containment when modal, and focus return to the trigger. Native `dialog` details are in [ui-patterns.md](references/ui-patterns.md#focus-management).
- Accessible names, roles, headings, and dynamic announcements: inspect the accessibility tree and an automated audit. Claim screen-reader verification only after using a real screen reader.
- WCAG 2.2 additions: focused elements are not hidden by sticky content, pointer targets are at least 24×24 CSS px, dragging has a single-pointer alternative, and login allows paste and password managers. See the [accessibility checklist](../../references/accessibility-checklist.md).
- Responsive content at the contract's breakpoints plus the affected transition width.
- Real submission, persistence, errors and retry, and authorization states, using authorized local test data.

If runtime capability is missing, record the exact blocker and the unverified checks. Compilation, unit tests, or a screenshot alone cannot prove the UI.

### 6. Apply the finish gate

Inspect the rendered result against the design contract: hierarchy, alignment, token use, overflow, focus visibility, contrast, states, and mobile behavior, with realistic text. Avoid generic layouts or arbitrary values that conflict with the product. Fix task regressions and run applicable test/build/type/lint gates.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A design review stays a review; implementation continues through runtime verification and the finish gate before returning for Review.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It renders, so done" | Exercise the accepted states and actions. |
| "Accessibility later" | Semantics, focus, and keyboard behavior are part of correctness. |
| "Tests prove the layout" | Inspect the actual browser at relevant widths. |
| "The dialog has `open`, so focus is trapped" | Use modal behavior and test it. |

## Red Flags

- Existing tokens or component conventions ignored, or a new UI library added for one screen.
- Mouse-only interaction, unnamed icon controls, color-only status, or tiny targets.
- Missing states or untested mobile and content overflow.
- Screen-reader claims based only on an accessibility tree or audit score.
- A "UI complete" claim without runtime checks and the finish gate.

## Verification

- [ ] Existing tokens, components, and contracts were discovered and reused.
- [ ] A design contract exists for new screens or directions.
- [ ] Accepted behaviors map to tests; valid RED/GREEN for changed behavior.
- [ ] Real app interactions, states, and relevant widths were exercised.
- [ ] Keyboard, focus, and WCAG 2.2 AA checks have evidence.
- [ ] Rendered finish inspected; relevant gates pass; omissions explicit.
