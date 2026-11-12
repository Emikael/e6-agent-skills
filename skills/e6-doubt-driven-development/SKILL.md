---
name: e6-doubt-driven-development
description: Use when a non-trivial claim or uncertain approach needs cross-examining before proceeding, when adversarial review in a fresh context could expose hidden failure modes, or when correctness matters under production auth, security, billing, payments, migration, or deletion risk. Use when stress-testing a high-stakes plan or reviewing an irreversible operation.
---

# Doubt-Driven Development

## Overview

Try to disprove a consequential claim while correcting it is cheap. Use the smallest useful evidence or independent review, and reconcile findings against the actual acceptance contract.

## When to Use

A consequential decision changes branching logic, crosses a boundary, asserts an invariant the compiler cannot prove, relies on hidden context, or has an irreversible blast radius.

Typical cases: uncertain architecture, auth/billing/payment behavior, migrations or deletion, non-obvious safety claims. Clear instructions and time pressure do not establish correctness. Skip mechanical changes, factual summaries, and artifacts already reviewed unchanged.

**Not for:** routine review of a finished diff → `e6-code-review-and-quality`; a full threat review → `e6-security-and-hardening`; clarifying fuzzy intent → `e6-interview-me`.

## Process

### 1. Name the claim and load its contract

Follow `e6-context-engineering`. Read requirement IDs, constraints, invariants, interfaces, and evidence. State the claim and the cost of it being wrong.

```text
CLAIM: Retrying an invoice event cannot charge twice.
WHY: Duplicate delivery must preserve billing totals under BILL-3.
```

Separate the hypothesis from verified facts. Confidence is not evidence.

### 2. Choose a disproof method

For behavior, write an acceptance-based failing test with `e6-test-driven-development` and record RED, fix, GREEN, and local runtime. Label it test evidence, not review.

For architecture, coupling, security invariants, or irreversible changes, which tests do not settle, use an independent reviewer when the host supports it and authorization permits. Review a bounded diff, function, proposal, migration, or assertion.

If you are a worker, or no reviewer exists, return the review need to the coordinator rather than the user. Label your own checks as self-review.

### 3. Review with minimal fresh context

Prefer a fresh context and follow the contract's [Delegation](../../references/workflow-contract.md#delegation) rules. Send the artifact, contract, readable paths, and commands, never the author's conclusion; a claim under review goes in ARTIFACT, not as a verdict. Keep the review read-only unless a fix task was authorized.

```text
Adversarial review: find concrete violations of this contract.
Check assumptions, edge cases, coupling, failure inputs, and project conventions.
ARTIFACT: <diff/path or bounded proposal>
CONTRACT: <requirement IDs, invariants, constraints>
CONTEXT: <minimal surrounding interfaces and evidence pointers>
Return issues only, most severe first, about 200 words:
<Critical|Required|Optional|Nit|FYI> path:line — violated requirement —
evidence or reproduction — proposed fix.
Or: "No findings", with the scope examined.
```

Severity uses the contract's [Finding Severity](../../references/workflow-contract.md#finding-severity) scale. For missing evidence the reviewer recommends a focused test; it never manufactures issues. If the reviewer is a predefined agent persona or plugin with its own report format (such as a balanced summary), still request issues only, in this format.

### 4. Reconcile and fix

Reviewer output is evidence to assess, not authority. Re-read each finding against the artifact and context, then classify it in this order:

1. **Contract misread:** clarify the missing or ambiguous contract, then reassess.
2. **Valid and actionable:** fix within scope, add the acceptance test, and rerun local proof. Resolve Critical and Required before handoff.
3. **Valid trade-off:** record the cost, consequence, and who has authority to accept it.
4. **Noise:** explain why it does not violate the contract; add missing context if helpful.

Return only unresolved material product decisions to the user; task authority covers routine fixes and rechecks. Never weaken the contract to silence a finding.

### 5. Stop on evidence

Stop when findings are resolved or already considered, or after three changed-artifact cycles. Never re-review an unchanged artifact. If substantive issues remain after three cycles, decompose the artifact or return the blocker to the coordinator; do not claim readiness.

An instruction to proceed can accept an explicitly described trade-off within authority; it cannot make an unverified claim verified. Record remaining uncertainty and the evidence still required.

## Optional Cross-Model Review

Use a second model when high stakes justify the cost and authorization covers it; do not offer it every cycle. A request for a particular external reviewer authorizes its scoped use, including equivalent rechecks. Ask when the tool, data sharing, or scope would exceed that.

For an authorized external CLI: verify availability, working version, and supported syntax, and use its read-only mode. Write the bounded review packet to a file and pass it on stdin so code quotes, backticks, and shell substitutions stay inert. Never expose secrets or pass session or sibling context.

If the tool is unavailable or fails, report it and continue internal review. Never claim cross-model evidence you did not obtain.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A review-only request stops at reconciled findings with severities; inside a build, return fixes, rechecks, and remaining uncertainty to the current phase.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "I'm confident" | An acceptance test or focused review supplies evidence. |
| "The instruction is clear, so safety follows" | Clear scope does not prove irreversible behavior safe. |
| "The reviewer said it, so it is true" | Reconcile against code, contract, and actual reproduction. |
| "Every cycle needs fresh permission" | Persistent scoped authorization covers equivalent rechecks. |

## Red Flags

- Full-history packets, nested reviewers, or findings without a contract severity.
- Behavioral test evidence labeled independent review.
- Reviewer conclusions accepted without inspecting the artifact.
- Repeated unchanged reviews, or unresolved Critical/Required issues labeled ready.
- Routine cross-model prompts interrupting authorized work.

## Verification

- [ ] Claims trace to requirement IDs, invariants, and relevant project context.
- [ ] The disproof method matches the risk; the evidence type is labeled honestly.
- [ ] Any review used bounded context and returned severity-ranked, actionable findings.
- [ ] Findings were reconciled, fixed and rechecked, or explicitly resolved.
- [ ] The three-cycle bound and unchanged-artifact rule were respected.
- [ ] Remaining uncertainty and external-tool limitations were returned.
