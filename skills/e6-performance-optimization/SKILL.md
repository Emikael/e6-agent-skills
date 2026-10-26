---
name: e6-performance-optimization
description: Use when optimizing application performance, profiling slow database queries or an N+1 query, investigating dashboard load times or performance regressions, improving Core Web Vitals or LCP, or meeting frontend/backend response-time requirements.
---

# Performance Optimization

## Overview

Measure a representative workload, locate its bottleneck, change one thing, then measure again. Keep only improvements that beat the agreed threshold and normal variance while preserving acceptance behavior.

## When to Use

- A spec sets performance requirements, users report slowness, or monitoring shows regression.
- Core Web Vitals, API latency, database queries, memory, or resource saturation need investigation.
- A feature handles large datasets or traffic and needs measured budgets.

Do not optimize without evidence. Measure suspected problems before applying caches, indexes, or memoization.

**Not for:** an audit-only web performance review → `/webperf` (the web-performance-auditor persona); production dashboards, SLOs, and alerts → `e6-observability-and-instrumentation`.

## Process

### 1. Define success and load context

Read project instructions, acceptance criteria, affected code and callers, profiling tools, deployment constraints, and the prior attempt log. Identify the user-facing metric, representative data/concurrency/device/network, comparison conditions, and success threshold before changing code.

Use project/SLA budgets. If none exist, establish a justified experimental target from the reported problem; ask only when a missing product decision blocks a correctness/performance tradeoff. Browser CWV targets describe p75 field measurements: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. They are not universal gates for backend or CLI work.

### 2. Establish a repeatable baseline

Run affected correctness tests first. Add acceptance checks where the optimized contract lacks coverage, using `e6-test-driven-development`. Preserve outputs, ordering, errors, authorization, freshness, and side effects; a faster result that omits required work is a regression.

Choose the measurement for the surface:

| Surface | Execute and inspect |
|---|---|
| Browser | Start the app; use `e6-browser-testing-with-devtools` for the affected load/interaction, network waterfall, main-thread work, layout shifts, and console errors. |
| Backend/database | Representative local requests/query workload; traces, query timing/plans, pool waits, CPU or heap profiles. |
| CLI/job/library | The actual entry point with representative input; elapsed time, allocations, memory, or throughput. |
| LLM/AI call | Time to first token and total latency; streaming to the user; prompt caching for stable prefixes; batching independent requests; tokens per request against a budget. |

Repeat samples with a budget; record warmup/cache state, data, concurrency, environment, and variance. Capture the exact command or interaction so the result is reproducible. Use existing synthetic and RUM/CrUX/APM data when available. Local synthetic measurements support conclusions; absent field access does not block a local fix or justify claiming improved real-user experience.

### 3. Identify and change the bottleneck

Use profile evidence to pick the highest-impact bottleneck. Slow page load may be server waiting, critical resources, or bundle cost; sluggish interaction may be long tasks or render/layout work. Backend latency may be queries, pool waits, locks, CPU, GC, or external dependencies.

Load only the matching section of [references/measured-patterns.md](references/measured-patterns.md): query batching/pagination, index plans/write cost, connection pools, image priority, render work, bundle splitting, or cache design. Use applicable sections of the [performance checklist](../../references/performance-checklist.md) for deeper checks.

For indexes, compare representative reads and relevant write cost, not just plan shape. For caches, state complete keys (tenant/viewer/permissions/locale/flags), acceptable staleness, invalidation, capacity, and stampede protection. Do not cache a correctness obligation away. Public shared caching must never expose personalized data.

Change one hypothesis at a time and measure each contribution before combining changes.

### 4. Verify and keep or revert

Run unchanged correctness/acceptance checks and repeat the same workload under baseline conditions. Compare the delta with variance and the predefined target. A cold-baseline/warm-result comparison is not evidence of code improvement.

| Result | Decision |
|---|---|
| Beats threshold and noise; correctness green | Keep. |
| Within noise, below target, or worse | Revert the unsupported change. |
| Faster but required behavior fails | Revert or correct it before claiming a win. |

Log every attempt: idea, baseline → result, variance, verdict, reason. A PR section or `PERF.md` is enough; read it before repeating an old experiment. Reverts must preserve unrelated user work.

Re-run the affected product path and review with `e6-code-review-and-quality`. Record exactly what ran and any missing environment or field evidence.

### 5. Guard the measured metric

Add the smallest appropriate regression guard: a stable synthetic budget/benchmark, query-count check plus semantic assertions, or field monitoring tied to the actual metric. Repeat noisy measurements or use a median/trend so the guard is not flaky. Reuse the existing CI/telemetry stack.

For deployed browsers, field monitoring validates user impact when available; CrUX's rolling window is confirmation, not an immediate alert. On a regression, return to a fresh baseline. Do not introduce universal bundle/API/Lighthouse budgets unrelated to acceptance requirements.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Include the workload, before/after numbers with variance, and the keep-or-revert decision for each attempt.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This optimization is obvious" | Profile first; the apparent bottleneck may not dominate. |
| "It's fast on my machine" | Use representative data/device/network/concurrency. |
| "Just cache it/add an index/increase the pool" | Each adds cost or correctness risk; prove the constraint. |
| "It did not help, but keep it" | Unsupported complexity costs maintenance forever. |
| "Tests can change to fit the faster result" | Acceptance behavior gates the metric. |

## Red Flags

- No baseline, one noisy sample, guessed cause, or incomparable conditions.
- Wrong ranks/order/permissions hidden behind an unchanged byte count.
- Cache key missing viewer, unbounded cache, or pool size raised without diagnosis.
- Local numbers reported as real-user improvements; unrelated universal gates.

## Verification

- [ ] Baseline/workload/target/variance and reproducible commands are recorded.
- [ ] The measured bottleneck is addressed and acceptance behavior still passes.
- [ ] Before/after comparison beats target and noise; unsupported changes were reverted.
- [ ] The affected local runtime/browser path was exercised.
- [ ] A relevant guard exists; attempts and review evidence were recorded.
- [ ] Results, actual limits, and any field follow-up were returned.
