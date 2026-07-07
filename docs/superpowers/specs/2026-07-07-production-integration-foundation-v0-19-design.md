# Production Integration Foundation v0.19 Design

## Purpose

v0.19 turns the v0.18 local-first International GEO workflow into a broader integration-ready operating foundation across three areas:

- approved AI visibility provider readiness,
- production operations readiness,
- external publishing connector readiness.

The stage must be deliverable as a controlled one-organization workspace. It must not claim real-time AI search monitoring, real external publishing, real external LLM generation, production database persistence, or multi-tenant SaaS behavior.

## Current Baseline

v0.18 already supports:

- International GEO site audit, guarded crawl evidence, evidence-backed scoring, generated GEO assets, and AI visibility prompt sets.
- Manual measured evidence import, JSON batch import, import ledger, evidence review, and approved-only trends.
- Local-rule article drafts, platform rewrites, high-authority publishing platform list, review-only publishing packages, and manual tracking.
- Built-in login, owner/admin/editor/viewer permissions, launch preflight, backup import/restore, connector registry, connector diagnostics, Docker, deployment docs, and GitHub CI.

The missing piece is not another manual data-entry surface. The missing piece is a reliable foundation for future real integrations: explicit provider/connector configuration, diagnostics, permission boundaries, run ledgers, and operator-facing readiness states.

## Non-Negotiable Boundary

v0.19 remains a zero-dependency local-first foundation.

It does not:

- call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, CMS, social, video, Q&A, or external platform APIs,
- store raw external credentials in returned API responses,
- publish content externally,
- generate measured AI engine evidence from seed or simulated data,
- migrate local JSON state to a production database,
- add OAuth/SSO, MFA, billing, or multi-tenant isolation.

It does:

- make future integrations explicit and auditable,
- let operators configure local provider/connector metadata and masked secrets,
- diagnose whether each provider/connector is blocked, reserved, configured, or ready for future implementation,
- preserve manual evidence and manual publishing handoff boundaries,
- strengthen production handoff documentation and checks.

## Scope A: Approved Visibility Provider Foundation

### Goal

Add a first-class International GEO visibility provider registry and diagnostic workflow for the engines already modeled in v0.13-v0.18:

- ChatGPT Search
- Perplexity
- Google AI Overviews
- Gemini
- Claude
- Copilot / Bing

### Data Model

Add `visibility_provider_configs` under the International GEO local state.

Each config row should include:

- `id`
- `engine_id`
- `engine_label`
- `provider_key`
- `provider_label`
- `provider_type`: `ai_search`, `serp_provider`, or `manual_report`
- `status`: `reserved`, `configured`, `blocked`, or `disabled`
- `approval_status`: `not_requested`, `requested`, `approved`, or `rejected`
- `connector_id`
- `endpoint`
- `credential_status`: `missing`, `masked`, or `not_required`
- `allowed_actions`
- `dangerous_actions`
- `permission_boundary`
- `last_test_status`
- `last_tested_at`
- `last_diagnostic_status`
- `last_diagnosed_at`
- `diagnostics`
- `notes`

Default rows must be `reserved`, with missing credentials and clear diagnostics that no provider is approved or executed.

### Actions

Add local actions for:

- listing provider configs,
- updating a provider config,
- testing a provider config,
- diagnosing all provider configs.

Provider tests are local dry runs. They validate shape, endpoint safety, credential presence, approval status, and allowed actions. They do not call the configured endpoint.

### Visibility Run Behavior

`runInternationalGeoVisibilityMeasurementAction()` should continue to create `unavailable` snapshots unless a future implementation provides approved measured provider evidence.

For v0.19, provider configs can improve readiness diagnostics, but they must not create measured snapshots by themselves.

### UI

Add compact panels inside International GEO:

- `可见度 Provider 配置`
- `Provider 诊断`
- `Provider 运行边界`

Use existing `surface panel`, `panel-head`, `tableMarkup`, `statusMarkup`, compact forms, and action rows. Do not introduce a new visual system.

## Scope B: Production Operations Foundation

### Goal

Strengthen one-organization production handoff without introducing a database or external identity provider.

### Data Model

Add a production operations read model derived from existing runtime state and environment-safe checks:

- persistence status,
- backup readiness,
- restore readiness,
- auth/session readiness,
- API key readiness,
- remote access boundary,
- connector readiness,
- visibility provider readiness,
- publishing connector readiness,
- masked secret inventory,
- audit coverage,
- static GEO route readiness,
- scheduler status,
- documentation status.

Do not expose raw env vars, local file contents, or secrets.

### Actions

Add local read/test actions for:

- production operations summary,
- production operations checks,
- masked secret inventory,
- ops handoff checklist.

Use a new `/system/production-readiness` route so the operator handoff model does not overload the existing launch preflight route.

### UI

Add a dense operations panel under Settings or an existing runtime area:

- `生产运行就绪`
- `密钥与连接边界`
- `交付检查清单`

The UI must include all three panels in this stage.

## Scope C: External Publishing Connector Foundation

### Goal

Turn the v0.15-v0.18 publishing handoff workflow into a connector-ready foundation without external publishing.

### Supported Connector Rows

Seed connector configs for:

- owned website / CMS,
- documentation site,
- Medium,
- LinkedIn Company Page,
- YouTube,
- GitHub,
- Reddit,
- Quora,
- directory / review site.

### Data Model

Add `publishing_connectors` under International GEO publishing state.

Each connector row should include:

- `id`
- `platform_key`
- `platform_name`
- `connector_type`
- `status`: `reserved`, `configured`, `blocked`, or `disabled`
- `approval_required`
- `credential_status`
- `endpoint`
- `allowed_actions`
- `dangerous_actions`
- `permission_boundary`
- `last_test_status`
- `last_tested_at`
- `last_diagnostic_status`
- `last_diagnosed_at`
- `diagnostics`
- `notes`

Publishing packages should remain review-only. v0.19 connector readiness must not publish reviewed packages externally.

### Actions

Add local actions for:

- listing publishing connector configs,
- updating publishing connector metadata,
- testing one publishing connector,
- diagnosing all publishing connectors.

Connector tests are dry runs. They validate endpoint safety, credential status, approval requirements, and whether an approved package exists for handoff. They do not call platform APIs.

### UI

Add compact panels in International GEO publishing area:

- `发布连接器配置`
- `发布连接器诊断`
- `发布运行边界`

The UI should make it clear that connector rows support future external publishing and current manual handoff, not live publishing.

## API Surface

Add routes under `/api/v1`:

Visibility provider foundation:

- `GET /international-geo/visibility/providers`
- `PUT /international-geo/visibility/providers/:id`
- `POST /international-geo/visibility/providers/:id/test`
- `POST /international-geo/visibility/providers/diagnose`

Production operations foundation:

- `GET /system/production-readiness`
- `POST /system/production-readiness/check`

Publishing connector foundation:

- `GET /international-geo/publishing/connectors`
- `PUT /international-geo/publishing/connectors/:id`
- `POST /international-geo/publishing/connectors/:id/test`
- `POST /international-geo/publishing/connectors/diagnose`

Mutation routes require editor/admin/owner sessions or `X-GEO-API-Key`. Viewer sessions may read summaries and connector/provider lists but may not mutate or run tests.

## Error Handling

Use existing API error patterns:

- `400 VALIDATION_ERROR` for invalid config, unsupported status, unsupported action, unsafe endpoint, or invalid JSON.
- `403 FORBIDDEN` for viewer mutation attempts.
- `404 NOT_FOUND` for unknown provider or connector ids.

Dry-run tests should return structured failed checks instead of throwing when a provider is simply not configured. Throw only for invalid request shape or unknown ids.

## Audit Events

Record audit events for:

- visibility provider config update,
- visibility provider dry-run test,
- visibility provider diagnose-all,
- production readiness check,
- publishing connector config update,
- publishing connector dry-run test,
- publishing connector diagnose-all.

Audit event metadata must omit raw secrets.

## Testing Strategy

Extend `verify-mvp.mjs` first.

Model tests should prove:

- default visibility provider configs exist for all supported engines,
- updating a provider stores masked credential status but does not expose raw keys,
- provider dry-run test returns blocked/reserved/configured diagnostics without calling external endpoints,
- visibility measurement still creates unavailable snapshots when no approved measured provider implementation exists,
- production readiness returns checks and masked secret inventory,
- publishing connector configs exist for supported platform rows,
- publishing connector dry-run tests do not publish externally.

HTTP tests should prove:

- viewers can read provider/connector/readiness routes,
- viewers cannot mutate or run tests,
- owners/editors can update and test configs,
- invalid provider/connector ids return 404,
- invalid payloads return 400.

UI tests should prove:

- International GEO renders provider config, provider diagnostics, and provider boundary panels,
- International GEO publishing renders publishing connector config, diagnostics, and boundary panels,
- Settings or runtime area renders production readiness and masked secret inventory,
- action names for provider and connector dry runs are wired.

## Documentation Updates

Update:

- `README.md`
- `CHANGELOG.md`
- `docs/API_REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/ROADMAP.md`
- `docs/PHASE_2_ROADMAP.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/OPEN_SOURCE_RELEASE.md`
- `docs/README.md`
- `docs/MAINTENANCE.md`
- new `docs/STAGE_V0_19_CLOSEOUT.md`

Docs must say v0.19 is an integration foundation, not a live provider or live publishing system.

## Release Boundary Copy

v0.19 is suitable for controlled one-organization delivery as a local-first integration-ready GEO operations workspace. It includes provider and connector configuration, dry-run testing, diagnostics, run boundaries, masked secret inventory, production readiness checks, and documentation for future integrations.

It must not be marketed as a complete SaaS, real-time AI engine monitoring platform, external publishing platform, external LLM generation system, or production database-backed service. Real measured provider evidence, real publication evidence, external credentials, durable secrets, database persistence, monitoring, OAuth/SSO, MFA, billing, and multi-tenant isolation remain future work.

## Acceptance Criteria

- `npm run check` passes.
- `git diff --check` passes.
- GitHub Actions `check` passes after push.
- All new routes are covered by source, model, HTTP, and UI assertions.
- Provider and connector dry-run tests cannot call external services.
- No response exposes raw credential material.
- v0.18 manual evidence workflows continue to work unchanged.
- Documentation and stage closeout clearly describe current capabilities and boundaries.
