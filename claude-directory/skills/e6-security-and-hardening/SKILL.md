---
name: e6-security-and-hardening
description: Use when auditing or hardening input handlers, authentication/login flows against the OWASP Top Ten, authorization, data storage, uploads, webhooks, external integrations or server-side URL fetches; auditing dependencies or triaging package-manager audit findings and supply-chain risk; handling personal data and privacy compliance; or securing LLM features and agent tools against prompt injection and leaked secrets.
---

# Security and Hardening

## Overview

Map trust boundaries and abuse cases, implement controls, and execute both denied and legitimate paths. Trust follows the writer, not the delivery channel.

## When to Use

- User input, sessions, resource permissions, sensitive storage, payments, or external services.
- Uploads, webhooks, server-side fetches, dependency audits, privacy, and LLM features or agent tools.
- A scoped security review: report evidence and findings without unrequested changes.

**Not for:** general readability or code quality → `e6-code-review-and-quality`; CI workflow permissions and action pinning → `e6-ci-cd-and-automation`.

## Process

### 1. Establish context and authorization

Read acceptance criteria, handlers and callers, auth and data policy, topology, the lockfile, and existing controls. Use `e6-source-driven-development` when a control's semantics are uncertain.

Existing authorization covers requested, reversible local hardening; sensitivity alone does not require reapproval. Ask only for missing decisions, expanded data collection, or destructive or external actions.

### 2. Threat-model the affected surface

Map assets and boundaries: requests, files, APIs, webhooks, queues, LLM output, configuration, derived paths, and values another process wrote. Internal-looking data can be attacker-controlled.

Run STRIDE per boundary. Turn threats into observable abuse cases and allowed acceptance cases. Prioritize reachable consequences; separate evidence from hypotheses.

### 3. Prove and implement the controls

Run a focused baseline. Write abuse and regression tests with `e6-test-driven-development` before fixes; verify legitimate paths too.

| Boundary | Required control |
|---|---|
| Injection/XSS | Parameterize queries; never interpolate input into SQL/NoSQL/shell. Encode output; sanitize unavoidable raw HTML with an allowlist. |
| Access/session | Authenticate protected routes and authorize the specific resource/tenant. Hash passwords with bcrypt/scrypt/argon2; secure/httpOnly/SameSite cookies with expiry; anti-CSRF token or trusted Origin check on state changes; never mutate on GET. |
| Headers/CORS/errors | Framework security headers and restrictive CSP; explicit credentialed origins. Public responses use field allowlists. Generic errors; redacted logs. |
| Input/uploads | Parse allowlisted shape/length/range/format; downstream uses parsed values only. Bound upload size before buffering; verify actual content, not declared MIME or extension. |
| SSRF | Allowlist scheme/host/port; reject private/reserved IPv4/IPv6 destinations, redirects, and URL credentials. Pin the address the transport actually uses, or use a trusted egress filter; bound time and bytes. A separate DNS check does not stop rebinding. |
| Destructive paths | Resolve symlinks first. The target must sit under an allowlisted root, at least one level below it, with ownership evidence from authenticated state. Avoid check/use races. On refusal, stop; never fall back to a broader target. |
| Rate limits | Limit auth and costly paths with counters shared across processes; test proxy/IP identity. |
| Secrets | Secret store or environment; placeholder `.env.example`; real secrets ignored. Inspect staged changes without printing values. Rotate an exposed secret before any authorized history cleanup. |

Load the matching [hardening pattern](references/hardening-patterns.md) and enforce its preconditions.

### 4. Handle supply-chain, privacy, and AI risks

**Supply chain** (details in the [checklist](../../references/security-checklist.md#dependency-security)):
- Confirm the manifest, `packageManager`, lockfile, and CI agree at the installation boundary; stop if they don't. Commit one lockfile and install it frozen in CI.
- Block install scripts before first execution. Triage native audit findings by reachability; never force-fix automatically. A deferral needs a reason, owner, and review date.
- Audits miss new malicious packages. Before adding a package, especially one an agent suggested, confirm it exists with real release history and the expected publisher (slopsquatting, typosquatting). Check provenance and the transitive graph.
- Produce an SBOM where required; enable push-protection secret scanning where available.

**Privacy:** Classify fields and collect only for a stated purpose. Provide testable export and deletion paths across stores, caches, and backups. Confirm consent and legal basis. Keep PII out of telemetry.

**LLM features and agent tools:**
- Treat prompts, retrieved documents, and model output as untrusted. Schema-validate output and tool arguments, encode data, and enforce permissions in code.
- Untrusted content (pages, issues, files, tool output) never selects which tool runs or what it targets.
- Give each tool least privilege, scoped per tenant. Destructive tools need confirmation enforced in code, not in the prompt.
- Log tool calls with redacted arguments. Keep secrets and cross-tenant data out of prompts; assume system prompts leak. Bound tokens, rate, and recursion.

Map findings to the checklist's [OWASP Top 10:2025 and LLM tables](../../references/security-checklist.md#owasp-top-10-quick-reference).

### 5. Verify the actual path and review

Run abuse and allowed cases, project gates, and the affected local flow. Browser-facing controls (login, cookies, headers, CORS) use `e6-browser-testing-with-devtools`. For transport controls, prove the prohibited connection never happens; a rejected string is not enough.

Use `e6-code-review-and-quality`, fix supported findings, and re-check edits. An audit alone cannot prove security.

## Workflow Handoff

Return scope, evidence, blockers, and next action per the [workflow contract](../../references/workflow-contract.md#handoff). Audit-only work stays audit-only; authorized hardening continues through verification and review.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Internal data is trusted" | Writer identity and permissions define trust. |
| "The framework/audit handles it" | Controls need correct use; audits match only known advisories. |
| "The agent suggested this package" | Confirm it exists, has history, and has the expected publisher. |
| "The system prompt forbids that tool use" | Enforce permissions and confirmations in code. |

## Red Flags

- Untested abuse cases, client-only validation, missing resource authorization.
- Sensitive fields returned or logged by spread or full-body capture.
- Untrusted text choosing tools or targets; an unconfirmed destructive tool.
- An unvetted new dependency; a frozen install skipped in CI.

## Verification

- [ ] Boundaries, assets, abuse cases, and legitimate behavior recorded.
- [ ] Denial and allowed tests plus local or browser paths ran.
- [ ] Input, auth, response, secret, transport, and path controls checked where relevant.
- [ ] Supply-chain, privacy, and AI obligations have evidence or explicit limits.
- [ ] Review resolved supported in-scope findings; commands, results, and blockers returned.
