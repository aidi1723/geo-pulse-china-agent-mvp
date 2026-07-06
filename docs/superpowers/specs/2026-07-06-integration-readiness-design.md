# Integration Readiness v0.4 Design

## Goal

Make GEO Pulse v0.4 integration-ready for a single operator by turning the existing connector registry into configurable, testable, and auditable local integration slots.

This phase keeps Scheme A: single-user local-first execution. It prepares the product for real LLM/search/CMS/social/email integrations without adding multi-tenant SaaS infrastructure.

## Product Boundary

Supported in v0.4:

- One user can edit connector endpoint, key, enabled state, timeout, retry count, and notes.
- Connector keys stay masked in every read response and UI surface.
- Connector connection tests work for local `mock://` endpoints.
- Unreachable `https://` endpoints return structured failures instead of breaking the app.
- Loopback, private, and metadata endpoints are rejected before save or test.
- Runtime status exposes connector readiness and latest health checks.
- Audit events record connector update and connector test actions.
- The settings UI exposes connector detail, save, and test actions in the existing dense admin style.

Deferred after v0.4:

- Real OAuth authorization flows.
- Real CMS, social, email, SERP, or analytics publishing/collection.
- Background queues and production databases.
- Multi-tenant credential vaults.
- External crawler or AI-search scraping APIs.

## Connector Contract

Every connector exposes:

- Identity: `id`, `label`, `connector_type`, `connector_type_label`.
- Readiness: `status`, `status_label`, `is_enabled`, `credential_status`.
- Security: `permission_boundary`, `allowed_actions`, `dangerous_actions`, `last_permission_audit`.
- Config: `endpoint`, `masked_api_key`, `timeout_ms`, `retry_count`, `notes`; never raw `api_key`.
- Health: `last_health_check`, with result, duration, endpoint, schema status, and error message.

Allowed endpoint forms:

- Empty endpoint for disabled/planned connectors.
- `mock://...` local simulation endpoints.
- `https://...` public endpoints.

Rejected endpoint forms:

- `http://` except no public use is needed in this phase.
- `localhost`, loopback, private RFC1918 ranges, link-local, multicast, and metadata IPs.

## API Design

Add:

- `PUT /api/v1/automation-connectors/:id`
- `POST /api/v1/automation-connectors/:id/test`
- `GET /api/v1/connector-health-checks`

All mutation routes use the existing mutation guard.

## UI Design

Keep the current settings page information architecture.

- The connector table remains compact and scan-friendly.
- Selecting a connector opens a right-side drawer.
- The drawer includes editable endpoint/key/enabled/timeout/retry/notes fields.
- The drawer shows recent health check details and permission boundaries.
- Save and test actions use existing button and notice patterns.

## Completion Definition

v0.4 is complete when:

1. A connector can be selected, edited, saved, and reloaded without exposing raw secrets.
2. `mock://` connector tests return successful health checks.
3. Unreachable `https://example.invalid/...` connector tests return failed health checks.
4. Unsafe endpoints are rejected consistently.
5. Runtime status includes connector readiness and latest health summaries.
6. Settings UI exposes connector save/test controls.
7. `npm run check` passes.
