# Specialist Team

How the Tech Lead (the coordinator, `using-e6-agent-skills`) staffs a change, briefs specialists, and merges what they return. Personas live in [`agents/`](../agents/); each applies one skill for procedure and adds a viewpoint and an output format.

## Roster

| Specialist | Persona | Joins when the change… | Mode |
|---|---|---|---|
| Product Owner | `product-owner` | adds or changes user-visible behavior, or the request leaves material values open | Before planning: flows, gaps, acceptance criteria |
| Backend engineer | `backend-engineer` | touches services, APIs, data, jobs, or integrations | Build a slice, or review a backend diff |
| Frontend engineer | `frontend-engineer` | touches client code, state, or rendering | Build a slice, or review a frontend diff |
| UI/UX designer | `ui-ux-designer` | adds or changes screens, flows, copy, or interaction | Before build: a design contract. After build: an experience review |
| QA engineer | `qa-engineer` | changes behavior beyond the fast path | Before build: the test plan. Before handoff: traceability and sign-off |
| Security engineer | `security-auditor` | handles untrusted input, auth, secrets, money, tenant data, or LLM tools | Review |
| SRE | `sre-engineer` | changes deploy, config, infrastructure, migrations, CI, telemetry, or a critical path | Review and the ship-readiness checklist |
| Code reviewer | `code-reviewer` | changes code beyond the fast path (always, before handoff) | Five-axis review against [code quality](code-quality.md) |
| Web performance | `web-performance-auditor` | web-facing changes with a performance budget or risk | Audit |

Rules:

- **Fast-path changes get no team.** The coordinator does the work itself, including the test-first check and the self-review that QA and the code reviewer would otherwise cover.
- **Staff by evidence.** A specialist joins only when the change touches its surface. Absence means skip, not "run just in case". Announce the team once: one line per specialist with its reason.
- **Respect host limits.** Specialists are workers: they never load the coordinator or spawn workers. Without a delegation tool, the coordinator applies each persona's checklist itself, in sequence, and says so.
- **One writer per path.** Builders (backend, frontend) own disjoint paths or run serially. Reviewers are read-only.

## Packet (in) and return (out)

Use `e6-caveman` `ultra` both ways. Pass paths, not content. Write a large diff or spec once to a file, and send its path.

```
goal: <one line>
ids: <requirement IDs>
own: <writable paths, or "read-only">
read: <paths: spec, plan, diff file, code>
rules: <project rules that apply>
checks: <real commands>
return: <deliverable>
```

A return starts with a status token (`done.`, `blocked: …`, `too-big.`, `needs-decision: …`, `no-issues.`), then one line per finding or change, then the checks that ran.

## Findings

Reviewers return findings in one shape, so the Tech Lead can merge them mechanically:

```
[severity] path:line — problem → consequence → fix (confidence)
```

- **Severity:** the contract's scale (Critical, Required, Optional, Nit, FYI). Personas with a domain scale (security, web performance) write both labels, for example `[High → Required]`; merge and gate on the contract label.
- **Confidence:** only `50`, `75`, or `100`.
  - `100`: the failure is shown with evidence (a test, a command, or a quoted line).
  - `75`: the cited line is quoted and the failure path is concrete.
  - `50`: plausible but unproven. Report a `50` only when it is Critical. Never report anything below `50`.
- **Quote the line.** A finding at `75` or higher quotes the cited code; without the quote it drops to `50`.
- **Merging.**
  - Merge findings with the same location and the same fix.
  - Agreement between reviewers on the same model never raises confidence.
  - Re-read the code for every Critical or Required finding before acting on it.
- **What isn't a finding:** generic "consider adding" advice, a style preference with no rule behind it, or a pre-existing issue outside the change. Pre-existing issues are FYI.

## Model tiers

When the host lets a worker choose its model:

| Tier | Roles |
|---|---|
| Strongest | Security and correctness reviews |
| Mid-tier | Other reviewers and builders |
| Fastest capable | Read-only searches |

If model names are unknown, inherit the session model rather than guessing.

## Sign-off

Before handoff, the QA engineer confirms the traceability matrix (see the [workflow contract](workflow-contract.md#acceptance-and-tests)): every requirement ID maps to a test, that test's result, and a runtime observation, or an explicit blocker. A gap in the matrix blocks handoff, just as an open Critical or Required finding does.
