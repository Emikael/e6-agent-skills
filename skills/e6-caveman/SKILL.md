---
name: e6-caveman
description: Use when communicating progress, findings, or handoffs in the e6 workflow, or when a user requests caveman style, terse answers, concise output, or token-saving delegation.
---

# Caveman

## Overview

Few words. Full meaning. Use this communication skill throughout the e6 workflow, including subagent packets and returns.

## When to Use

Progress, questions, plans, findings, and handoffs. Compress prose; keep executable and contractual content intact.

**Not for:** a user's request for a full explanation, tutorial, or report. Then write normally, still concise.

## Process

1. Lead with result or next action. Remove filler, repeated context, praise, and recap.
2. Use short, readable sentences. Keep one point per sentence. Omit empty sections.
3. Preserve exact identifiers, paths, commands, errors, numbers, units, requirement IDs, negation, and uncertainty. Never shorten a safety condition into a different meaning.
4. Worker packets and returns follow the [workflow contract](../../references/workflow-contract.md#delegation).
5. Code, schemas, tests, quoted text, documentation, commits, and durable memory retain correct syntax and readable language. Keep them concise without removing meaning.

Example: “Tests pass: 12/12. Checkout browser check blocked: no browser capability. Next: run the documented flow on the local app.”

## Common Rationalizations

| Excuse | Required response |
|---|---|
| “Short means omit blockers.” | Keep evidence and uncertainty. Cut filler. |
| “Caveman means break grammar everywhere.” | Keep output easy to understand; preserve artifacts. |

## Red Flags

- Lost negation, units, authorization, or failure evidence.
- Invented certainty or token-saving claims.
- Abbreviated commands or unreadable stored documents.

## Verification

- [ ] Result/action clear; no repeated context.
- [ ] Exact details and blockers retained.
- [ ] Syntax intact in code, docs, and commits.
