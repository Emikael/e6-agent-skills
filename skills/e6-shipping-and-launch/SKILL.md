---
name: e6-shipping-and-launch
description: Use when preparing a production deployment or launch, running a pre-launch checklist, deciding what must be in place before shipping, producing a go/no-go assessment, setting up monitoring and alert readiness, planning staged rollout, opening a beta, or preparing and verifying a rollback strategy.
---

# Shipping and Launch

## Overview

Bind release decisions to current acceptance and operational evidence. Prepare recovery before deploying, observe actual user outcomes, and advance only when release gates pass.

## When to Use

- Preparing production features, significant releases, betas, or data and infrastructure changes.
- Assessing readiness or rehearsing rollout and recovery without a deployment request. A release-planning request stays within that deliverable and does not authorize production changes.

**Not for:** building or fixing the pipeline → `e6-ci-cd-and-automation`; adding the telemetry itself → `e6-observability-and-instrumentation`; schema and data migration mechanics → `e6-deprecation-and-migration`.

## Process

### 1. Identify the candidate and authority

Read project instructions, accepted criteria, the candidate commit and artifact, CI and runtime evidence, runbooks, migrations, flags, rollout policy, and on-call ownership. Tie every gate to the candidate revision and target environment; stale green checks do not validate a changed candidate.

Existing authorization covers local fixes, rehearsal, and readiness work. It does not cover merge, deploy, external notification, or destructive data changes unless granted.

The [Definition of Done](../../references/definition-of-done.md) is the floor. Mark each gate with the contract's [gate status](../../references/workflow-contract.md#glossary-and-scales): `PASS`, `FAIL`, `UNVERIFIED`, or `N/A: <reason>`. Missing tools or access never become PASS. Fix available failures and rerun affected checks before deciding.

### 2. Verify relevant launch gates

| Area | Required evidence when applicable |
|---|---|
| Correctness | Candidate's acceptance tests, unit/integration/critical E2E, error paths, flag states, build/lint/types, reviewed final diff |
| Security | Auth and boundary review, redacted secrets check, dependency findings triaged, headers/rate limits/CORS, data handling |
| Performance | Measured critical-path budgets, query behavior, bundle and Core Web Vitals for web UI |
| Accessibility | Keyboard/focus, labels/errors, contrast, assistive-tech checks; automated audits supplement them |
| Infrastructure | Target config, DNS/TLS/CDN, healthy dependencies, schema/artifact compatibility, working health checks and logs |
| LLM features | Eval suite passes on the candidate; model and prompt versions pinned; per-request and total cost ceilings set |
| Documentation | Setup/API/user docs, ADRs, changelog, runbook and recovery steps |

Use `e6-code-review-and-quality`, `e6-security-and-hardening`, `e6-performance-optimization`, and `e6-documentation-and-adrs` for substantive gaps, plus the [security](../../references/security-checklist.md), [performance](../../references/performance-checklist.md), and [accessibility](../../references/accessibility-checklist.md) checklists. Specialist passes depend on risk; delegate them per the [contract](../../references/workflow-contract.md#delegation) and deduplicate findings.

Exercise accepted critical flows locally and in staging with representative data and failures; web journeys use `e6-browser-testing-with-devtools`. Build success or an HTTP 200 does not prove checkout, auth, or a job works.

### 3. Prepare controls and recovery

Assign the deploy monitor and rollback owner. Use `e6-observability-and-instrumentation` for critical metrics and alerts, and verify that dashboards, logs, and alert delivery work for the relevant failures, not just that configuration exists. Send notifications only when authorized.

Flags decouple deploy from enablement. Each flag needs an owner, a cleanup date, and tested on/off behavior. Turning a flag off does not reverse writes, messages, or charges.

Before GO, rehearse exact recovery with verified tooling: the compatible prior immutable artifact or deployment ID, flag changes, health and user-flow checks, owner, and recovery time. A Git revert does not redeploy the prior artifact. Schema and data recovery follows `e6-deprecation-and-migration`.

### 4. Set rollout decisions before deploying

Use the project's SLOs and error-budget policy, a baseline or control cohort, minimum traffic, an observation window, and absolute limits. Define advance, hold, and rollback signals. Insufficient traffic means HOLD; a quiet dashboard is not success.

Without established thresholds, propose limits before enablement. Typical starting points: errors within 10% of baseline and p95 within 20%; more than 2× errors or 50% latency regression triggers rollback. Data corruption or an exploitable security failure requires immediate containment.

The error budget constrains risk: a low budget slows rollout, an exhausted one normally freezes risky features, and a high burn rate can require HOLD despite acceptable current errors. Exceptions need documented authority.

### 5. Decide, deploy when authorized, observe

Issue **GO**, **NO-GO**, or **HOLD**. GO needs current gates, proven recovery, required authorization, a closed traceability matrix (QA sign-off), and an SRE readiness pass for deploy, config, data, observability, and rollback (the [SRE persona](../../agents/sre-engineer.md) checklist). Unresolved items go to the final explanation under **Needs your decision**, each with options and a recommendation. A failed required gate means NO-GO; missing decisive evidence means HOLD. Accepted risk is recorded as an exception, never as a passed check.

```
Verdict: GO|NO-GO|HOLD — candidate <sha/artifact>, env
Gates: area | PASS/FAIL/UNVERIFIED/N/A | evidence
Blockers → action/owner
Recovery: artifact/flag/steps/owner/RTO; irreversible boundary
Rollout: stages/thresholds/window/monitor owner
```

For an authorized rollout, promote the verified artifact through staging, deploy to an initial cohort, verify health and the critical flow, and advance only when thresholds pass (internal → 5% → 25% → 100% is illustrative). On red signals, run the rehearsed recovery and verify the outcome. Pending observation stays pending; arrange monitoring instead of claiming completion. After a stable rollout, remove expired flags and update operational docs.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). The ship report above is the deliverable; a readiness request stops there without deploying.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Old green checks are enough" | Evidence must match the candidate. |
| "The date cannot move" | Failed required tests or missing recovery remain blockers. |
| "Add alerts/rollback later" | Prove operational controls before GO. |
| "Canary has no errors" | Check traffic, sample, absolute limits, and burn rate. |
| "The new prompt looks fine" | Run the eval suite and pin the version. |

## Red Flags

- GO from checklist prose, stale results, or unavailable runtime.
- Missing alert delivery, recovery owner, or rehearsal.
- Advancing on zero traffic or ignoring the error budget.
- Actions outside authorization, or repeated approval requests despite it.

## Verification

- [ ] Candidate, environment, criteria, authorization, and current evidence explicit.
- [ ] Critical flows exercised; blocked checks stay `UNVERIFIED`; N/A gates have reasons.
- [ ] Compatible recovery rehearsed before GO, including data effects.
- [ ] Thresholds, windows, error-budget policy, and monitoring owner recorded.
- [ ] Ship report names verdict, blockers, and actions; pending observation stays pending.
