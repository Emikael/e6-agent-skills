---
name: e6-api-and-interface-design
description: Use when designing APIs, module boundaries, or any public interface. Use when creating REST or GraphQL endpoints, defining type contracts between modules, or establishing boundaries between frontend and backend.
---

# API and Interface Design

## Overview

Define interfaces from consumer needs and existing contracts. Make behavior predictable, hard to misuse, and verifiable. Applies to REST and GraphQL APIs, module boundaries, component props, and shared schemas.

## When to Use

- New endpoints, public module or component contracts, frontend/backend boundaries.
- Changing interfaces or schemas that existing consumers use.

**Not for:** debugging an unchanged interface → `e6-debugging-and-error-recovery`; migrating consumers off an old contract → `e6-deprecation-and-migration`; component internals and UI state → `e6-frontend-ui-engineering`.

## Process

### 1. Inspect context and consumers

Read project rules, requirement IDs, existing schemas, routes, types, callers, boundary tests, API docs, and compatibility commitments. Identify schema tooling (OpenAPI, GraphQL SDL, protobuf, JSON Schema), contract-test tooling, and verification commands. Check browser, mobile, and module consumers, not only the provider.

Record constraints and unresolved behavior: authorization, ownership, validation, ordering, pagination, expiration, retries, and consistency. Distinguish accepted requirements from proposed defaults; escalate only material decisions scope cannot settle.

### 2. Write the contract before implementation

Write it into the spec's `## Interfaces` section (`SPEC.md` or `SPEC-<module>.md`), or into the project's OpenAPI, GraphQL, or other schema file when one exists; the schema file is then the source of truth and the spec links to it. For each operation specify:

- Purpose, caller, input schema, required/optional fields, and validation bounds.
- Output schema, nullability, defaults, and observable outcomes.
- One error format with stable machine codes and a status mapping.
- Authorization, ownership, side effects, and limits.
- Pagination, filtering, sorting, partial updates, and consistency, when they apply.
- Retry and idempotency for state changes, with unknown outcomes explicit.
- Compatibility and deprecation implications.

Typed internal contracts do not validate external data: validate at real trust boundaries, including legacy persisted values the schema does not guarantee, and never expose internal errors. Apply `e6-security-and-hardening` for authentication, authorization, untrusted input, and rate limits. Record versioning decisions and publish reference docs with `e6-documentation-and-adrs`.

[interface-patterns.md](references/interface-patterns.md) has details: Hyrum's Law, extension over breaking changes, error status mapping, REST resources, offset and cursor pagination, TypeScript unions, input/output separation, branded IDs, and atomic idempotency.

### GraphQL

- **Schema-first:** agree on the SDL (types, arguments, nullability) before resolvers; the schema is the contract.
- **Nullability:** mark a field non-null only if it can never fail to resolve, because a non-null error nulls its parent.
- **Pagination:** use connections (`edges { node }`, `pageInfo { hasNextPage endCursor }`) with `first`/`after` and a bounded maximum.
- **Evolution:** add fields instead of versioning; retire them with `@deprecated(reason: "…")` and measure usage before removal.
- **Public endpoints:** prefer persisted (allow-listed) queries, plus depth and complexity limits.

### 3. Define acceptance and compatibility checks

Map requirement IDs to example requests and expected public results, including invalid input, unauthenticated and unauthorized cases, missing or conflicting resources, limits, and preserved consumer behavior. Never prescribe authentication that is still undecided.

For idempotent effects, specify tests for same-intent retries, concurrent requests, a changed payload, an in-flight duplicate, a timeout or crash with unknown outcome, and retention covering the longest retry or replay chain. A header or unique constraint alone does not prove recovery or prevent external duplicate effects.

For a design-only request, produce testable examples and state that they are unexecuted. When implementation is included, use `e6-test-driven-development` for observed RED before code; implementation runs inside the current slice of `e6-incremental-implementation`, without reloading it from here.

### 4. Execute verification when behavior exists

Run the real contract and integration tests. Send representative requests to the local service or real module entry point; inspect status, payload, state, and side-effect counts. Test compatibility through real consumer calls when available; a static schema or mock is not runtime proof. If runtime is unavailable, report the blocker and separate reviewed contracts from executed checks.

## Contract Rules

- Prefer additive extension; still inspect consumers, since strict ones reject unknown fields.
- Prefer one supported contract; use `e6-deprecation-and-migration` when a breaking transition is unavoidable.
- For idempotency: claim atomically, scope the key, guard payload equivalence, decide duplicate responses, record intent before effects, and reconcile unknown outcomes. Retention follows the longest retry path.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). A contract-only request stops at the written contract and its review evidence, without implementing or inventing product decisions.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Types are enough" | Verify runtime parsing and consumers. |
| "Nobody uses that quirk" | Inspect callers; observable behavior may be depended on. |
| "An optional field is always compatible" | Strict consumers can still reject it. |
| "Accepting the key prevents duplicates" | Atomic claim, guarded replay, and recovery must work. |
| "The brief didn't say, so choose silently" | Mark proposals; resolve material undecided requirements. |

## Red Flags

- A new contract designed without reading existing consumers and tests.
- Mixed error shapes, or internal data leaked publicly.
- User or product policy invented from a generic example.
- Claimed compatibility or idempotency without observable evidence.
- Check-then-act deduplication, per-attempt keys, or retries of unknown effects.

## Verification

- [ ] Accepted criteria map to explicit input, output, and error behavior.
- [ ] The contract lives in the spec's Interfaces section or the project's schema file.
- [ ] Consumer context, compatibility, and Open decisions documented.
- [ ] Boundary validation, authorization, and limits defined where required.
- [ ] State-change retries and recovery specified, and tested when implemented.
- [ ] Applicable contract tests and real local calls ran; unexecuted checks are explicit.
