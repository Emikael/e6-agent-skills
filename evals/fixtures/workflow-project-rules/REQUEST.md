# Requested Feature

Implement optional `status` filtering on `GET /reports`.

| ID | Observable acceptance criterion |
|---|---|
| REPORT-1 | Without `status`, return all records in original order, preserving the existing response shape. |
| REPORT-2 | `status=open` or `status=closed` returns only matching records in original order. |
| REPORT-3 | Any other explicit value, including empty `status=`, returns HTTP 400 with error code `INVALID_STATUS` and a useful message. |
| REPORT-4 | `/health` and unknown-path behavior remain unchanged. |

Scope: local implementation, meaningful automated tests, actual local HTTP
verification, and reviewable handoff. This request authorizes those actions.
No commits, deployment, new dependencies, or product decisions are needed.
