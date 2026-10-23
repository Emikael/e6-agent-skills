# Observability Checklist

Quick reference for instrumenting production code. Use alongside the `e6-observability-and-instrumentation` skill.

## Table of Contents

- [On-Call Questions (Start Here)](#on-call-questions-start-here)
- [Structured Logging](#structured-logging)
- [Metrics](#metrics)
- [Distributed Tracing](#distributed-tracing)
- [Alerting](#alerting)
- [Dashboards](#dashboards)
- [Verify the Telemetry](#verify-the-telemetry)
- [Pre-Launch Gate](#pre-launch-gate)

## On-Call Questions (Start Here)

Telemetry without a question is noise. Before instrumenting anything:

- [ ] 2–4 questions an on-call engineer will ask about this feature are written down
- [ ] Every signal below maps to one of those questions
- [ ] Each question is matched to the right signal type: metrics say **that** something is wrong, traces say **where**, logs say **why**

## Structured Logging

- [ ] Logs are structured (JSON) with stable event names — not free-form strings
- [ ] Correlation/request IDs generated or accepted at the boundary use a bounded validated format; arbitrary inbound text is not echoed into logs
- [ ] Correlation ID is propagated on every outbound call and async boundary (HTTP headers, queue metadata)
- [ ] Any log stream written by more than one entry point (scheduler, replay endpoint, manual run) carries an entry-point field, set where the run starts and propagated alongside the correlation ID
- [ ] Log levels are consistent: `error` = invariant broken, someone may act; `warn` = degraded but handled; `info` = significant business event; `debug` = off in production
- [ ] No secrets, tokens, passwords, or unredacted PII in any log line (hard rule from `e6-security-and-hardening`)
- [ ] Fields are allowlisted — no whole request/response bodies, no auth headers
- [ ] External service calls logged with metadata only: endpoint, status, latency, attempt count, sanitized identifiers
- [ ] Actual log output spot-checked: structured fields, not `[object Object]`

## Metrics

- [ ] **RED** instrumented for every endpoint and every external dependency: Rate, Errors, Duration
- [ ] **USE** instrumented for every resource (queues, pools, hosts): Utilization, Saturation, Errors
- [ ] Latency is a histogram; p50/p95/p99 queryable — never an average
- [ ] All labels come from small, fixed sets (route template, status class, provider name)
- [ ] No unbounded label values: no user IDs, tenant IDs, emails, raw URLs, request IDs, or error message text
- [ ] Status codes grouped by class (`5xx`, not `503`)
- [ ] Queue depth and processing duration tracked for every worker/queue

## Distributed Tracing

- [ ] OpenTelemetry (or equivalent) initialized at service startup, before other imports
- [ ] Auto-instrumentation enabled for HTTP, gRPC, and DB clients
- [ ] Trace context propagated on every outbound call (W3C `traceparent`/`tracestate`) and extracted from every inbound request
- [ ] Context survives async boundaries — queue messages carry trace metadata
- [ ] Manual spans only around meaningful internal units of work, with the attributes on-call will filter by
- [ ] No secrets or PII as span attributes
- [ ] Sampling strategy explicit: head sampling drops traces before a collector can inspect them; retaining every error with tail sampling requires all relevant spans reach that collector
- [ ] LLM calls: one span per model call with model, input/output token counts, latency, and finish reason (OpenTelemetry `gen_ai.*` semantic conventions); no raw prompts or outputs containing user data

## Alerting

- [ ] Every alert is symptom-based (error rate, p99 latency, queue age) — causes (CPU, disk, restarts) go to dashboards, not pagers
- [ ] Every alert is actionable; "ignore it, it self-heals" alerts are deleted
- [ ] Every alert links to a runbook — minimum three lines: what it means, first query to run, escalation path
- [ ] Thresholds and durations justified by an SLO or historical data, not guesses; where an SLO exists, prefer multi-window error-budget burn-rate alerts
- [ ] Two severities only: **page** (user-facing, act now) and **ticket** (degradation, act this week)
- [ ] Each new alert test-fired to an authorized test receiver; notification and runbook verified; changed thresholds/configuration restored
- [ ] No alerts that fire daily and get acknowledged without action

## Dashboards

- [ ] Service health dashboard exists: error rate, latency p99, traffic, saturation
- [ ] Dependency health panel shows per-service error rates and latency
- [ ] Dashboard answers the on-call questions from the top of this checklist — not "everything except the answer"
- [ ] Default time range is sensible (1h–6h, not 30d)

## Verify the Telemetry

Instrumentation is code; it can be wrong:

- [ ] Induced a controlled error in an authorized local/test/staging environment and located its sanitized telemetry; no production fault injection inferred from local-work authorization
- [ ] Sent test traffic → metric series appear with expected labels and sane values
- [ ] Followed one request end-to-end in the tracing UI → no broken spans
- [ ] An induced failure was diagnosed from telemetry alone, without reading the source

For a local fixture without a collector/UI, assert emitted events, metric values,
and propagated context using its actual runtime or test receiver. Record unavailable
dashboard/collector verification as blocked when required; never invent a trace-UI
check. Stop temporary receivers and restore test configuration afterward.

## Pre-Launch Gate

Before a feature ships to production, all of the following are true:

- [ ] Structured logs flowing to the log aggregator
- [ ] RED metrics visible in dashboards for every new endpoint and dependency
- [ ] At least one symptom-based alert configured, with runbook, test-fired
- [ ] A request can be traced across every service it touches
- [ ] On-call knows where the runbooks are

For launch-day monitoring sequence and rollback triggers, see the `e6-shipping-and-launch` skill.
