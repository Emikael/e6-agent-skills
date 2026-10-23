---
name: e6-observability-and-instrumentation
description: Use when adding structured logging, metrics, distributed tracing, or actionable alerting; instrumenting a production endpoint, service, job, retry, queue, or external integration; or improving telemetry after production behavior was hard to diagnose.
---

# Observability and Instrumentation

## Overview

Instrument operator questions alongside the feature. Verify emitted signals, context, and failure paths before completion.

## When to Use

- A production feature adds I/O, retries, workers, queues, or external calls.
- Operators cannot explain a failure from current telemetry.
- Logging, metrics, traces, alerts, or runbooks need implementation/review.

**Not for:** diagnosing an active incident → `e6-debugging-and-error-recovery`; measured slowness → `e6-performance-optimization`; the release go/no-go, launch monitoring window, and rollback triggers → `e6-shipping-and-launch`.

## Process

### 1. Load context and define working signals

Read instructions, acceptance criteria, the feature and its callers, existing telemetry and exporters, dashboards, SLOs, and operator requirements. Reuse the supported stack.

Write 2–4 on-call questions before editing (recovery, failure class, latency, duplicate actions, affected operations), and map each to a signal and an observable acceptance case.

### 2. Pick signals deliberately

| Signal | Question | Cost |
|---|---|---|
| Structured event log | What happened in this case and why? | Per event; volume grows with traffic. |
| Metric | How often/how fast in aggregate? | Per series; label combinations determine cost. |
| Trace | Where did time go across work/services? | Per request; sampling/export matters. |

Emit only useful signals. Account for exporter failure, buffering, retention, and overhead; telemetry must not break business operations.

### 3. Implement logs and context

Use stable events and allowlisted structured fields. Levels: error for actionable failure/invariant violation, warn for handled degradation, info for significant business events, debug off by default in production. Never log secrets, tokens, full PII, auth headers, or whole bodies/raw gateway responses. Sanitize external error metadata.

Generate correlation IDs, or accept bounded, validated ones under the project's trust policy; never copy arbitrary request headers into logs. Propagate context through HTTP/queue/async boundaries. For shared sinks, stamp an allowlisted `entryPoint` where the run starts and propagate it with the run ID; do not infer origin downstream.

Example: `{ event: 'payment_retry_failed', requestId, entryPoint, provider, errorCode, attempt }`. Name it `entryPoint` because `source.*` collides with ECS (Elastic Common Schema) fields.

### 4. Implement metrics and traces

For new request/dependency paths use RED: rate, errors, duration. For relevant resources use USE: utilization, saturation, errors. Latency uses histograms with useful buckets and queryable percentiles, not averages alone. Define retry attempts vs final operations so counts mean what operators expect.

Labels come from fixed sets: route template, method, status class, provider, bounded failure class. Never use user/tenant/request IDs, raw URLs, email, or error text as labels.

Use existing tracing or OpenTelemetry when choosing a new vendor-neutral stack. Initialize before instrumented modules, configure/export to the actual sink, and flush on bounded shutdown where needed. Propagate W3C trace context or the supported equivalent across services and queues; add manual spans only for meaningful internal work. Span attributes also need redaction and cardinality discipline.

Choose a sampling topology explicitly: low head sampling drops traces before a tail sampler sees errors, so it cannot guarantee error retention. Tail sampling needs candidate traces sent to its collector, with documented cost and buffering.

**LLM calls:** emit one span per model call with the model, input and output token counts, latency, and finish reason, following the OpenTelemetry `gen_ai.*` semantic conventions. Never log raw prompts or outputs that contain user data; record sizes, hashes, or redacted excerpts under the data policy.

### 5. Make alerts actionable

Page on symptoms users feel: error rate, latency, queue age, missing completion. Where an SLO exists, prefer multi-window error-budget burn-rate alerts (a fast window to page, a slow window to ticket) over static thresholds. Use cause and saturation signals for investigation, or alert on them only when they predict an actionable failure. Reuse severity conventions. Do not page on isolated retries or restarts.

Every alert needs an owner and a runbook: meaning, first check, action, escalation. Dashboards answer defined questions.

Test the rule and receiver against an authorized test destination. Never lower a live threshold or notify people without authorization; restore temporary configuration. A local receiver proves only local wiring.

### 6. Execute signal acceptance and inspect output

Use `e6-test-driven-development` for meaningful telemetry contracts. Drive deterministic success, retry, exhaustion, timeout, or queue paths through the local entry point. Capture log/metric/span output or inspect the local collector; confirm event fields/counts, durations, bounded labels, correlation, and no sensitive data.

For a browser feature, use `e6-browser-testing-with-devtools` to inspect client/server correlation and errors. With staging or collector access, diagnose a safe induced failure from telemetry alone; otherwise state the missing remote proof.

Use `e6-code-review-and-quality`; fix findings and re-check signals. Load applicable sections of `../../references/observability-checklist.md` for deeper checks.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Include the captured signal output and any remote delivery that remains unverified.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "More logs means more visibility" | Queryable signals answering defined questions beat noise. |
| "SDK started, tracing works" | Export and context continuity need observed output. |
| "ID labels make debugging easier" | Unbounded series can exhaust the metrics backend. |
| "We'll test the pager later" | Verify safe rule/receiver wiring now and state remote limits. |
| "Log the prompt for debugging" | Record model, tokens, and finish reason; keep user data out. |

## Red Flags

- Prose-only logs, raw secrets/errors, unbounded labels, or unvalidated IDs.
- Retries/external calls with no operation outcome signal.
- Broken queue context, incompatible sampling claims, or unobserved exporter output.
- Claimed staging or notification verification without execution.

## Verification

- [ ] Defined questions map to emitted signals and exercised acceptance paths.
- [ ] Actual structured output, including any LLM spans, is correlated, bounded, and redacted.
- [ ] Metrics/spans export with correct counts, duration, and continuous context.
- [ ] Alert rule/authorized test receiver/runbook were checked; temporary config restored.
- [ ] Relevant local/browser behavior and review ran; evidence and limits returned.
