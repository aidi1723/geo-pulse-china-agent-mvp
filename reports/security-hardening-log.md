# GEO Pulse MVP Security Hardening Log

- Date: 2026-07-05
- Scope: local GEO Pulse MVP workspace
- Repository state: current directory is not a Git repository
- Verification command: `npm run check`

## Completed Fixes

1. Mutating API authorization
   - All mutating API requests require `X-GEO-API-Key`.
   - Local-only mode generates a startup token for same-origin frontend use.
   - Remote access mode requires a fixed `GEO_INTERNAL_API_KEY`.

2. Remote access boundary
   - Remote requests are denied by default.
   - `GEO_ALLOW_REMOTE_ACCESS=1` refuses to start without a fixed API key.
   - Remote mode does not expose the fixed API key through client config.

3. CORS boundary
   - API responses no longer use wildcard CORS.
   - Allowed origins are local same-origin values plus `GEO_ALLOWED_ORIGINS`.

4. Secret handling
   - Provider and model `api_key` values are no longer returned through API responses.
   - API responses expose only `masked_api_key` hints.
   - Frontend settings inputs use empty password fields with masked placeholders.

5. Provider endpoint SSRF guard
   - Provider endpoints are limited to `mock://` and `https://`.
   - Loopback, private, carrier-grade NAT, and link-local IPv4 endpoints are blocked.

6. Request body limit
   - Mutating API requests enforce `GEO_MAX_BODY_BYTES`.
   - Default request body limit is 1 MB.

7. Scheduler default
   - Automation scheduler is disabled by default.
   - It only starts with `GEO_ENABLE_AUTOMATION_SCHEDULER=1`.

8. Response security headers
   - API JSON responses include `X-Content-Type-Options: nosniff`.
   - API JSON responses include `Cache-Control: no-store`.
   - Static responses include `X-Content-Type-Options: nosniff`.
   - Static HTML responses include `Cache-Control: no-store`.

9. Atomic persistence writes
   - Runtime state is written to a same-directory temporary file first.
   - The temporary file is fsynced and then atomically renamed over the target state file.
   - Failed writes clean up temporary files and preserve the previous complete state file.

10. Audit events
   - Runtime reset actions are recorded as `runtime.reset`.
   - Provider config updates are recorded as `automation_provider.update`.
   - Model config updates are recorded as `model_config.update`.
   - Publish task starts are recorded as `publish_task.start`.
   - Scheduler ticks are recorded as `scheduler.tick`.
   - Failed mutating authorization attempts are recorded as `auth.failure`.
   - Audit event details redact secret-shaped fields and avoid raw API key values.
   - Audit events are persisted with runtime state and exposed through `/api/v1/audit-events`.

11. Mutating API rate limiting
   - Mutating API requests are rate limited in memory by API key or remote address.
   - Default limit is 120 mutating requests per minute.
   - `GEO_MUTATION_RATE_LIMIT_PER_MINUTE` can adjust the threshold.
   - Over-limit requests return `429` with `Retry-After`.

12. Audit event UI visibility
   - Settings runtime area shows a compact audit log panel.
   - The panel renders action, resource type, resource id, summary, and timestamp.
   - Static preview data includes sample audit events.

13. Audit event export
   - Audit events can be exported as CSV from `/api/v1/audit-events/export.csv`.
   - The settings audit log panel includes a compact export action.
   - CSV export uses `text/csv`, `Content-Disposition: attachment`, `nosniff`, and `no-store`.

14. Remote audit read authorization
   - Remote access mode requires `X-GEO-API-Key` for `/api/v1/audit-events`.
   - Remote access mode requires `X-GEO-API-Key` for `/api/v1/audit-events/export.csv`.
   - Local-only mode keeps audit reads available to the same-origin prototype.

15. Static preview audit export
   - Static preview mode now renders the audit export action as an inline `data:text/csv` download.
   - Local service mode continues to use `/api/v1/audit-events/export.csv`.

16. Static HTML Content Security Policy
   - Served HTML now includes a `Content-Security-Policy` header.
   - The static preview inline bootstrap script is authorized with a per-response nonce.
   - The script policy avoids `unsafe-inline`; object/plugin content is blocked with `object-src 'none'`.

17. Audit CSV spreadsheet formula hardening
   - Server-side audit CSV export prefixes formula-like cell values with `'`.
   - Static preview inline CSV export uses the same cell hardening.
   - Nested string values inside audit event `details` are neutralized before JSON serialization into CSV.

## Verification Added

- `verify-mvp.mjs` now covers:
  - default mutation auth requirement
  - same-origin startup token flow
  - remote access startup failure without fixed key
  - remote access mode not exposing fixed key
  - CORS no-wildcard behavior
  - request body limit
  - provider endpoint SSRF rejection
  - provider/model key masking
  - scheduler disabled by default
  - API response security headers
  - static HTML security headers and no-store cache policy
  - persistence rename failure preserving the previous state file
  - audit events for runtime reset, provider update, model update, and publish task start
  - audit events for scheduler tick and failed authorization
  - audit event secret redaction
  - audit event API query
  - mutating API rate limiting and `Retry-After`
  - settings page audit log rendering
  - audit event CSV export response headers and filtered content
  - remote access mode requiring the fixed key for audit event reads and CSV export
  - static preview audit export using an inline CSV download link
  - static HTML CSP header, dynamic script nonce, and no script `unsafe-inline`
  - audit CSV formula neutralization for server export and static preview export

## Remaining Hardening Candidates

- No open hardening candidates are recorded in this pass.
