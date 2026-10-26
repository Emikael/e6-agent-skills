---
name: e6-deprecation-and-migration
description: Use when deprecating or sunsetting old systems, APIs, libraries, or features; migrating users and consumers from one implementation to another; deciding whether to maintain or remove legacy code; or changing a production database schema without downtime, including renaming or dropping a column with expand/contract.
---

# Deprecation and Migration

## Overview

Remove maintenance burden while preserving consumer behavior and data. An announcement is not a completed migration; measured usage and tested recovery decide when removal is safe.

## When to Use

- Replacing or consolidating systems, public APIs, libraries, features, or AI models.
- Planning a safe shutdown, or deciding whether legacy code still earns its maintenance.
- Migrating production schemas or data while mixed app versions run.

**Not for:** designing the replacement interface → `e6-api-and-interface-design`; the release go/no-go → `e6-shipping-and-launch`; version bumps and changelog entries → `e6-git-workflow-and-versioning`.

## Process

### 1. Discover consumers and obligations

Read interface and schema history, existing migrations, consumer inventory, telemetry, support ownership, published contracts, notice windows, and retention or export obligations. Include jobs, queue retries, offline clients, integrations, and versions that may return during rollback. A lack of observed traffic alone does not prove nobody depends on a system.

Keep systems that supply required unique value; otherwise weigh maintenance and security cost against migration cost. Consumers can depend on undocumented timing, errors, auth, or side effects (Hyrum's Law). Capture observable behavior as characterization or contract tests before changing it.

### 2. Prepare the replacement and transition

A replacement must cover critical use cases, ship migration docs, and pass a representative canary. For an authorized shutdown without replacement, provide a viable transition such as data export, and state the lost functionality.

Choose advisory deprecation for optional migration, or a compulsory deadline when documented risk requires it, honoring contractual notice. Set the owner, cohorts, channels, support path, compatibility window, measured advancement criteria, and recovery plan. The owner supplies tooling and helps consumers migrate:

- **HTTP APIs:** send `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) response headers plus a `Link` to the migration guide. Log each remaining caller so you can contact it.
- **Codemods:** ship one for mechanical consumer changes; test it on a representative consumer.
- **Model or LLM migrations:** run the feature's eval set on the old and new model or prompt; parity on that set gates each advancement.

Select a pattern: **strangler** (route cohorts to the new path, compare outcomes, keep a working rollback route), **adapter** (preserve old semantics while the backend changes), or **feature flag** (switch stable cohorts, test both paths, assign a cleanup owner).

Move one consumer or cohort at a time: migrate, run acceptance, edge, and error checks, compare behavior, and confirm no regressions before advancing. Local rehearsals do not authorize production mutation.

### 3. Expand/contract database changes

Old and new app and job versions must both work during rolling deploys; never rename or drop a live column in place. For `name` → `full_name`:

1. **Expand:** add nullable `full_name`. Check engine-specific locks; additive does not automatically mean nonblocking.
2. **Dual-write:** every live writer populates both columns. Verify mixed-version behavior and drain writers that update only the old shape.
3. **Backfill:** resumable, throttled batches with checkpoints. Writes are idempotent and use version conditions so stale batches never overwrite newer writes. Test interruption and concurrent updates.
4. **Switch reads:** verify missing-value counts and source/destination parity, then switch while keeping dual-write and a rollback window. Bake against measured criteria.
5. **Contract:** once old readers, writers, retried jobs, and permitted rollback versions are gone, stop old writes. Later, separately, drop the column. This boundary may be irreversible.

Rehearse on a disposable representative database. Use engine-supported nonblocking index creation (for example PostgreSQL `CREATE INDEX CONCURRENTLY`, outside a transaction).

### 4. Prove recovery before cutover

App rollback, schema rollback, data restoration, and roll-forward are different. A `down` that recreates an empty dropped column does not restore data, and stopping dual-write can make an older app read stale values; document when old-version rollback stops being allowed.

For reversible phases, run the rollback locally and prove behavior and data recover. For irreversible phases, record the backup or replay source, a tested restore or roll-forward procedure, recovery objectives, owner, and the authorized production boundary. Verify migration tool commands against current official documentation. A plan alone never authorizes a destructive production step.

### 5. Remove and preserve history

Removal requires fulfilled notice obligations, consumer confirmation, and zero old usage over a representative window with known telemetry coverage, including infrequent jobs and offline clients. A passed deadline or a brief idle period is not enough.

Remove obsolete live code, tests, configuration, and current usage docs within scope. Preserve ADRs, changelogs, and tombstone notices; never erase historical decisions. Recheck dependencies and representative runtime afterward.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Hand cohort progress, compatibility and recovery evidence, and remaining gates to `e6-shipping-and-launch` before any production cutover.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Nobody called it today" | Cover real consumer cadence and telemetry gaps. |
| "The new model is better" | Run the eval set on both; parity gates advancement. |
| "The down migration ran" | Execution does not prove data or old-version behavior was restored. |
| "The deadline passed, delete it" | Removal also needs measured migration and recovery readiness. |

## Red Flags

- Replacement parity assumed from happy-path tests or unevaluated model output.
- Unreachable consumers, unlogged callers, or unfulfilled notice obligations.
- In-place live renames or drops, stale backfills, or unbounded transactions.
- A destructive down path called recovery; app rollback promised beyond schema compatibility.

## Verification

- [ ] Consumers, behavior criteria, contracts, notice obligations, and owners evidenced.
- [ ] Migrated cohorts pass compatibility, acceptance, and runtime checks (or eval parity).
- [ ] Schema phases support mixed versions; backfill resumes safely; parity measured.
- [ ] Recovery or roll-forward rehearsed; irreversible boundaries explicit.
- [ ] Removal evidence covers consumer cadence, telemetry gaps, jobs, and rollback versions.
