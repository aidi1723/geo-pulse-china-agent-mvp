# Extension Guide

Use this guide when adding features without breaking the mock-first architecture.

## General Change Workflow

1. Identify the domain boundary: provider, connector, source adapter, UI page, API route, or workflow action.
2. Add or update regression assertions in `verify-mvp.mjs`.
3. Implement the smallest data/API/UI change that satisfies the behavior.
4. Update static preview data if the UI needs the new shape without a server.
5. Update README and docs if public commands, APIs, or extension behavior changed.
6. Run `npm run check`.

## Add A Provider Capability

Primary file: `automation-providers.mjs`

Use this for model or AI capability execution, such as keyword discovery, topic planning, or article generation.

Steps:

1. Define the provider capability and protocol shape.
2. Add a local implementation or safe fallback.
3. Ensure config masking uses existing helper patterns.
4. Record provider invocations through `mock-data.mjs`.
5. Add settings UI coverage if maintainers need to configure it.
6. Add tests for success, fallback, masking, and runtime summary.

Rules:

- Do not expose raw API keys.
- Keep remote endpoint validation and fallback behavior intact.
- Prefer `mock://` examples for public docs and static preview data.

## Add A Connector

Primary file: `mock-data.mjs`

Use this for external systems such as crawler, SERP, CMS, social, email, analytics, CRM, or webhook integrations.

Required fields:

- `id`
- `label`
- `connector_type`
- `connector_type_label`
- `status`
- `status_label`
- `is_enabled`
- `scopes`
- `credential_status`
- `credential_status_label`
- `permission_boundary`
- `permission_boundary_label`
- `allowed_actions`
- `dangerous_actions`
- `last_permission_audit`
- `config`

Steps:

1. Add connector metadata.
2. Add allowed and dangerous actions.
3. Add or update permission checks where runtime actions use the connector.
4. Ensure output uses sanitized connector config.
5. Update settings UI if the new connector type needs operator visibility.
6. Add tests for masking, permission matrix, and denied actions.

## Add A Source Adapter Contract

Primary file: `mock-data.mjs`

Use this for source ingestion behavior before real crawlers are connected.

Required contract fields:

- `id`
- `label`
- `contract_version`
- `source_modes`
- `purpose`
- `stages`
- `quality_signals`
- `privacy_boundary`

Each stage should define:

- `stage_id`
- `stage_label`
- `output_schema`
- `evidence_fields`
- `failure_codes`

Steps:

1. Add the contract to `sourceAdapterContracts`.
2. Update `sourceAdapterErrorLabel` if new failure codes need labels.
3. Ensure `buildSourceAdapterEvidence` can produce useful evidence.
4. Add media source or crawl job examples using the adapter.
5. Update keyword UI only if operators need to see new fields.
6. Add tests for contract registry, evidence, quality summary, and error taxonomy.

## Add An API Route

Primary files: `mock-data.mjs`, `server.mjs`

Steps:

1. Add a read model or action function in `mock-data.mjs`.
2. Import it in `server.mjs`.
3. Add a route branch under `/api/v1`.
4. Validate mutation input before calling actions.
5. Use `ok()` for success and `error()` for failures.
6. Add tests to `verify-mvp.mjs`.
7. Update `docs/API_REFERENCE.md`.

## Add Or Change UI

Primary files: `prototype/src/pages/*`, `prototype/src/utils.js`, `prototype/src/components.js`

Rules:

- Follow `DESIGN.md`.
- Reuse `surface panel`, `tableMarkup`, `statusMarkup`, `info-row`, `cell-title`, and `cell-sub`.
- Preserve routing and data flow.
- Keep dense admin layout; do not introduce marketing-style pages.
- Add UI rendering assertions in `verify-mvp.mjs`.

If static preview depends on new data, update:

- `prototype/src/static-routes.js`
- `prototype/preview-static-global.js`

## Add Runtime State

Primary file: `mock-data.mjs`

If state should persist:

1. Add it to `getSerializableState()`.
2. Add hydration logic in `hydrateRuntimeState()`.
3. Add reset behavior through the default snapshot.
4. Add tests covering mutation and reset.

If state is registry metadata and should not be user-mutated, keep it outside persistence and expose it as a read model.

## Documentation Update Matrix

| Change Type | Docs To Update |
| --- | --- |
| New command or environment variable | `README.md`, `docs/DEVELOPMENT.md` |
| New API route | `README.md`, `docs/API_REFERENCE.md` |
| New extension seam | `docs/EXTENDING.md`, `docs/ARCHITECTURE.md` |
| Security behavior | `SECURITY.md`, `docs/MAINTENANCE.md`, `reports/security-hardening-log.md` |
| Release behavior | `CHANGELOG.md`, `docs/OPEN_SOURCE_RELEASE.md` |
| UI design rule | `DESIGN.md`, relevant page docs |

## Definition Of Done

- `npm run check` passes.
- No raw secrets are exposed.
- Static preview still works if the changed UI needs it.
- Docs and README links are current.
- Changelog is updated for user-visible changes.
