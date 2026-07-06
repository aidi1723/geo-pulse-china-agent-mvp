# Connector Diagnostics v0.5 Design

## Goal

Make GEO Pulse v0.5 more launch-ready for a single operator by adding connector diagnostics and run-detail visibility on top of v0.4 connector configuration/testing.

This stage remains local-first and single-user. It does not add real OAuth, real external publishing, background queues, or multi-tenant credential storage.

## Product Boundary

Supported in v0.5:

- Run a diagnostic check for any automation connector.
- Store diagnostic results locally and expose recent diagnostic history.
- Show connector readiness from config, credential status, endpoint safety, latest health check, permission boundary, recent audit events, and recent workflow usage.
- Link connector diagnostics to recent automation run steps where the connector was used.
- Render diagnostic results in the existing settings page connector drawer.

Deferred after v0.5:

- Real account authorization or OAuth.
- Real external publish/collect calls.
- Background diagnostic scheduling.
- Production observability backend.
- Multi-user or tenant-scoped diagnostics.

## Diagnostic Contract

Each diagnostic result includes:

- `id`, `connector_id`, `connector_label`, `connector_type`.
- `readiness_score` from 0 to 100.
- `status`, `status_label`, and `severity`.
- `checks`: endpoint, credential, health, permission, audit, and run usage checks.
- `permission_decisions`: allowed and denied representative actions.
- `recent_audit_events`: latest connector update/test/permission audit events.
- `recent_run_steps`: workflow steps that reference this connector.
- `recommended_actions`: concise operator actions.
- `created_at`.

Readiness scoring:

- Endpoint configured and safe: 20 points.
- Credential status configured, or connector type can run without key: 20 points.
- Latest health check success: 25 points.
- Permission boundary has at least one allowed action and dangerous actions are denied: 20 points.
- Recent audit or run evidence exists: 15 points.

Status mapping:

- `ready`: score >= 80.
- `needs_review`: score 50-79.
- `blocked`: score < 50.

## API Design

Add:

- `POST /api/v1/automation-connectors/:id/diagnose`
- `GET /api/v1/connector-diagnostics`

Existing connector detail should include `last_diagnostic`.

All mutation routes keep the existing mutation API-key guard.

## UI Design

Keep the `DESIGN.md` dense operational admin style.

- Add a compact "运行诊断" action in the connector drawer.
- Show latest diagnostic score, status, checks, recommended actions, and recent run steps.
- Keep the connector table scan-friendly; do not add large decorative cards.
- Sensitive values stay masked or omitted.

## Completion Definition

v0.5 is complete when:

1. Running a diagnostic for `firecrawl_source` returns a stored result with score, checks, recommendations, audit events, and run steps.
2. Diagnostic results do not expose raw secrets.
3. Connector detail includes `last_diagnostic`.
4. HTTP routes support running and listing diagnostics.
5. Settings UI exposes a diagnostic button and latest diagnostic panel.
6. `npm run check`, static SEO scan, and browser smoke pass.
