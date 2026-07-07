# Delivery Hardening v0.20 Design

## Goal

v0.20 should make GEO Pulse easier to hand off as a controlled one-organization deployment. The stage turns the existing v0.19 readiness checks, backups, audits, content workflow, and connector dry-runs into a clearer delivery workflow: operators can run a single handoff assessment, export a sanitized delivery bundle, and see exactly what is ready, what is blocked, and what remains dry-run only.

This is a delivery hardening release, not a live integration release.

## Current Baseline

v0.19 already provides:

- built-in login and role-based permissions,
- local JSON persistence and local backup/import/restore,
- launch preflight and production readiness checks,
- International GEO site audit, crawl evidence, scoring, assets, manual measured evidence operations, article/rewrite generation, publishing packages, tracking, visibility provider dry-run configs, and publishing connector dry-run configs,
- GitHub Actions `npm run check`,
- current docs and v0.19 closeout.

The remaining handoff gap is operational: a deployer can run many separate checks, but there is no single delivery bundle or consolidated operator handoff report.

## Scope

v0.20 adds four tightly scoped delivery surfaces.

### 1. Delivery Readiness Report

Add a new read model that aggregates existing production readiness, launch preflight, backup status, user/security status, International GEO workflow state, provider/connector dry-run state, and documentation/version metadata.

The report should include:

- `status`: `ready`, `review`, or `blocked`,
- `score`: 0-100 deterministic score,
- `summary`: counts for passed, warning, failed, blocked, and manual steps,
- `checks`: compact rows with `id`, `category`, `label`, `status`, `message`, and `recommendation`,
- `handoff_steps`: ordered operator actions before external handoff,
- `boundaries`: explicit no-live-provider, no-auto-publish, no-raw-secret statements,
- `generated_at` timestamp.

This report should reuse existing local state and helper outputs rather than duplicating business logic.

### 2. Sanitized Delivery Bundle

Add an API action to generate a JSON delivery bundle for handoff. The bundle should include only safe metadata:

- package name, app version, generated timestamp,
- delivery readiness report,
- production readiness report,
- launch preflight report,
- runtime counts,
- International GEO summaries,
- provider and publishing connector summaries with masked credential status,
- docs checklist and stage closeout references.

The bundle must not include raw secrets, session tokens, password hashes, raw local state snapshots, imported backup snapshots, article full bodies, raw audit logs, or environment values. This is a handoff report, not a backup.

### 3. Settings UI Delivery Panel

Add a compact `交付中心` panel under Settings -> Brand Knowledge -> Runtime and Data. It should use existing dense admin components and show:

- delivery readiness status and score,
- delivery bundle metadata,
- key boundaries,
- handoff checklist,
- a button to refresh the delivery report,
- a button to download the sanitized delivery bundle.

The panel should follow `DESIGN.md`: dark operational surface, compact info rows, tables, existing buttons, no marketing layout.

### 4. Documentation And Closeout

Update version and docs to `0.20.0`:

- `package.json`,
- `CHANGELOG.md`,
- `README.md`,
- `docs/API_REFERENCE.md`,
- `docs/ARCHITECTURE.md`,
- `docs/DEVELOPMENT.md`,
- `docs/ROADMAP.md`,
- `docs/PHASE_2_ROADMAP.md`,
- `docs/PRODUCTION_DEPLOYMENT.md`,
- `docs/OPEN_SOURCE_RELEASE.md`,
- `docs/README.md`,
- `docs/MAINTENANCE.md`,
- new `docs/STAGE_V0_20_CLOSEOUT.md`.

Docs must describe v0.20 as a delivery hardening release and must keep the v0.19 dry-run external integration boundary.

## API Design

Add:

- `GET /api/v1/system/delivery-readiness`
  - viewer/admin/editor/owner readable.
  - returns the delivery readiness report.
- `POST /api/v1/system/delivery-readiness/check`
  - editor/admin/owner or API key.
  - records an audit event and returns the fresh report.
- `GET /api/v1/system/delivery-bundle`
  - admin/owner or API key.
  - returns the sanitized delivery bundle JSON.

The bundle route is intentionally more restricted than the readiness report because it includes a broad operational snapshot, even though it remains sanitized.

## Data And Model Design

Add functions in `mock-data.mjs`:

- `getDeliveryReadinessState()`
- `runDeliveryReadinessCheckAction()`
- `getDeliveryBundleState()`

`getRuntimeStatus()` should include `delivery_readiness` so the Settings page can render without an extra initial API request.

The scoring model should be deterministic and simple:

- failed or blocked security checks lower status to `blocked`,
- missing backup, missing production key, remote access warning, unconfigured provider/connector rows, or missing docs references keep status at `review`,
- passing preflight, production readiness, backup availability, masked secret inventory, provider/connector dry-run summaries, and docs alignment raise score.

## UI Design

Use `prototype/src/pages/settings.js` only. Add render helpers:

- `renderDeliveryReadinessPanel(deliveryReadiness = {})`
- `renderDeliveryBoundaryTable(deliveryReadiness = {})`
- `renderDeliveryHandoffSteps(deliveryReadiness = {})`

Wire browser APIs and actions:

- `getDeliveryReadiness()`
- `runDeliveryReadinessCheck()`
- `getDeliveryBundle()`
- `refreshDeliveryReadiness()`
- `downloadDeliveryBundle()`

Add event actions:

- `refresh-delivery-readiness`
- `download-delivery-bundle`

No new navigation tab is needed. The panel belongs in Settings because this is an operations/handoff surface.

## Testing

Extend `verify-mvp.mjs` before implementation.

Tests should assert:

- model exports exist,
- delivery readiness returns checks, boundaries, handoff steps, and no raw secrets,
- delivery bundle returns sanitized metadata and no raw state snapshots,
- viewer can read delivery readiness,
- viewer cannot run delivery check or download bundle,
- owner can run delivery check and download bundle,
- Settings UI renders `交付中心`, `交付包`, `交付边界`, `refresh-delivery-readiness`, and `download-delivery-bundle`,
- `npm run check` passes after implementation.

## Operating Boundary

v0.20 does not add:

- live AI/search/SERP/indexing/provider calls,
- live CMS/social/community publishing calls,
- external LLM generation,
- raw secret export,
- database migrations,
- OAuth/SSO,
- MFA,
- multi-tenant isolation.

The sanitized delivery bundle is not a runtime backup. Backups remain handled by existing backup download/import/restore workflows.

## Delivery Closeout Copy

After v0.20, the project should be described as ready for controlled one-organization handoff behind an external access layer. It includes delivery readiness, sanitized handoff bundle export, production readiness, launch preflight, local backup/import/restore, International GEO operations, provider/connector dry-run foundations, and aligned documentation.

It should still not be described as a live AI monitoring system, automatic publishing system, external LLM generation platform, production database-backed SaaS, or multi-tenant service.
