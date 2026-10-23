---
name: e6-ci-cd-and-automation
description: Use when setting up or modifying CI/CD build and deployment pipelines, configuring test runners in CI, automating quality gates that block merge on failure, adding a deploy stage with manual approval, debugging CI failures, or establishing preview deployments, staged rollouts, and rollback automation.
---

# CI/CD and Automation

## Overview

Automate repeatable checks and prove that failures block the right action. Fast feedback matters, but critical acceptance checks stay on the path to merge and release.

## When to Use

- Creating or modifying automated build, test, audit, or deployment workflows.
- Diagnosing failed or slow CI, required checks, fork behavior, or rollout automation.

**Not for:** the release go/no-go decision → `e6-shipping-and-launch`; a product bug that a CI test exposed → `e6-debugging-and-error-recovery`; choosing the project's quality floor → `e6-constraint-driven-development`.

## Process

### 1. Discover the pipeline contract

Read project instructions, existing workflows and reusable actions, provider configuration, branch rules, and acceptance criteria. Identify the workspace boundary, package manager and lockfile, pinned runtimes, scripts, runners, services, and artifacts. Check PR, fork, merge-queue, default-branch, tag, and manual triggers.

Find which named checks block merge and which environments protect deployments. Record credential availability without exposing values. For dependency changes, follow the install policy in the [security checklist](../../references/security-checklist.md#dependency-security); never run unreviewed install scripts to discover them.

### 2. Map acceptance to gates

Select applicable lint, type, unit, integration, build, critical end-to-end, security audit, and performance checks. Record why a gate is N/A; do not add tooling merely to match a template.

Map critical acceptance criteria, including error paths and flag states, to required stages. UI journeys need browser tests where earlier stages cannot prove the behavior. Use the actual scripts and a frozen install for the pinned manager.

Run cheap feedback early and independent jobs in parallel. Deployment depends on every applicable required gate. Do not hide failures with `continue-on-error`, skipped tests, or broad fallbacks; missing evidence is not success.

### 3. Configure trust and deployment

- **Permissions:** set top-level `permissions: contents: read` and elevate per job only where needed.
- **Actions:** pin third-party actions to a full commit SHA, not a tag.
- **Credentials:** use OIDC workload identity for cloud deploys and package publishing instead of long-lived secrets. Publish artifact attestations or provenance where the platform supports it.
- **Untrusted triggers:** PR and fork checks run without deployment secrets; disposable test services use non-sensitive credentials. Never run PR-controlled code with secrets via `pull_request_target`. Do not let untrusted runs write caches that trusted runs restore (cache poisoning).
- **LLM or agent steps** that read issue, PR, or comment text get no secrets or write tokens unless the trigger is trusted.
- **Injection:** pass workflow inputs through environment variables before shell use, validate them against known formats, and quote arguments. Never put secret values in command text or logs.

Keep privileged deploy jobs on protected refs and environments with the project's required approvals. Serialize production deploys. Build once and promote the same immutable artifact, recording revision, artifact ID, version, and target. Rollback redeploys a known compatible artifact; schema and data recovery follows `e6-deprecation-and-migration`.

### 4. Verify actual pipeline behavior

Validate workflow syntax with project tools. Run the equivalent install, check, and build commands locally in a matching environment. When packaging, deploy configuration, or runtime setup changes, start the app and exercise affected flows; compilation does not prove deployment.

Prove each new gate fails when it should: locally, or on a throwaway branch only when pushing is authorized. Observe a fresh CI run when available, confirm failed builds cannot deploy, and check that branch rules require the actual status names. Without provider access, list the exact settings and mark the gate `UNVERIFIED`.

Fetch failing job logs directly as scoped, redacted excerpts; do not ask the user to paste logs the tools can retrieve. Reproduce failures with `e6-debugging-and-error-recovery`, review autofix diffs, and observe the fresh result.

### 5. Optimize

Measure the slow stage first. Key dependency caches on the authoritative lockfile; cache downloads, not `node_modules`. Shard tests and parallelize independent jobs. Path filters need dependency-aware coverage and an always-reported required aggregate check.

Keep critical acceptance tests required even when slow; scheduled suites only supplement them. Fix flakiness instead of rerunning until green. Use Dependabot or Renovate within project policy, and assign an owner for restoring a broken main build.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Hand run and artifact IDs, gate outcomes, and recovery readiness to `e6-shipping-and-launch`, which owns launch thresholds and windows.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Copy the Node template" | Discover manager, scripts, and services first. |
| "Fork checks need secrets" | Disposable test services can use non-sensitive credentials. |
| "The workflow exists, so merge is blocked" | Verify branch rules require the actual check names. |
| "A version tag is pinned enough" | Tags move; pin a full commit SHA. |
| "Just rerun the flaky job" | Investigate and prove the fix with a fresh run. |

## Red Flags

- Gates absent, silently skipped, or unrelated to acceptance criteria.
- PR-controlled code or LLM steps holding deployment credentials or write tokens.
- Write-all default permissions, tag-pinned third-party actions, long-lived cloud keys.
- Shell interpolation of inputs or printed secrets.
- Green YAML without local execution, a current run, or a proven failing gate.

## Verification

- [ ] Triggers and the acceptance-to-gate mapping recorded.
- [ ] Workflow validated and equivalent local commands ran; each new gate shown to fail.
- [ ] Required check names match verified branch rules, or the exact unverified setup is reported.
- [ ] Read-only default permissions, SHA-pinned actions, and OIDC where supported.
- [ ] Untrusted triggers are secretless; artifact identity and rollback verified before deployment.
