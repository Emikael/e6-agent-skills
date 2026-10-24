---
name: e6-caveman
description: Use when communicating progress, findings, or handoffs in the e6 workflow, or when a user requests caveman style, terse answers, concise output, or token-saving delegation.
---

# Caveman

## Overview

Few words. Full meaning. Three levels cover every message in the e6 workflow; pick by reader, not by mood.

| Level | Reader | Shape |
|---|---|---|
| `lite` | The user: questions, options, the final explanation | Full sentences, no filler. One idea per sentence |
| `full` | The user, mid-task: progress lines, phase announcements | `[thing] [result]. [next].` Articles optional |
| `ultra` | Another agent: packets, returns, review findings, tool-run narration | Fragments. Payload only. Each fact once |

## When to Use

Every e6 message. Default levels: worker traffic `ultra`, progress `full`, anything the user must decide on or read as a report `lite`.

**Not for:** a request for a tutorial or explanation in normal prose. Write it at `lite`.

## Process

1. **Lead with the result or next action.** Cut greetings, praise, recaps, restated context, and summaries after lists.
2. **Pick the level by reader.** If a human reads it directly, never use `ultra`.
3. **Keep the floor verbatim at every level:**
   - code, commands, paths, identifiers, and error text;
   - numbers and units;
   - requirement IDs;
   - negations (not, never, no, only, except);
   - uncertainty and blockers.
4. **Break compression** for:
   - security warnings;
   - irreversible or destructive actions;
   - step order a fragment could scramble;
   - questions or options for the user;
   - a confused reader.

   Write those in full sentences.
5. **Never compress anything persisted:** code, comments, tests, commits, PRs, docs, specs, plans, tickets, memory. They keep normal grammar and stay concise.
6. **`ultra` returns use this grammar:**
   - Status first, as one of `done.`, `blocked: <reason>.`, `too-big.`, `needs-decision: <question>.`, `no-issues.`
   - Then one line per item: `path:line — fact ≤12 words`.
   - Then `checks: <command> → <result>` and `artifact: <path>` when there is one.
7. **Use no words when there are none to add.** Use no text between routine tool calls. If the compressed form is not shorter than plain prose, use plain prose. Two possible readings means rewrite as a sentence.

Examples:
- `full`: "Tests pass: 12/12. Browser check blocked: no browser tool. Next: run the flow on the local app."
- `ultra`: "done. src/limiter.js:14 — 5 fails/15 min per ip+user. checks: node --test → 18/18 pass."

## Common Rationalizations

| Excuse | Required response |
|---|---|
| "Short means omit blockers." | Blockers and uncertainty are the floor. Cut filler, not facts. |
| "Ultra everywhere saves the most." | Humans get `lite` or `full`; a misread decision costs more than tokens saved. |
| "Compress the docs too." | Persisted artifacts keep normal grammar. |

## Red Flags

- Lost negation, units, authorization, or failure evidence.
- `ultra` fragments in a question, report, or decision shown to the user.
- Abbreviated commands, invented abbreviations, or unreadable stored documents.
- Narration between routine tool calls.

## Verification

- [ ] Level matches the reader for every message.
- [ ] Floor items verbatim; blockers retained.
- [ ] Persisted artifacts in normal grammar.
