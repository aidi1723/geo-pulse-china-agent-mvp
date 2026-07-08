# API Reference

## Base URL

Local server:

```text
http://localhost:3000/api/v1
```

All responses are JSON unless the route explicitly returns CSV.

Operational routes such as `/healthz`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/favicon.ico` are served outside the `/api/v1` namespace.

## Response Shape

Successful JSON responses:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_..."
  }
}
```

Error JSON responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  },
  "meta": {
    "request_id": "req_..."
  }
}
```

## Authorization

Browser access uses the built-in session flow:

- `POST /session/login` verifies username and password.
- The server sets an HTTP-only `geo_session` cookie.
- Normal admin workspace reads and writes require a valid session.
- Mutating routes also enforce role permissions.

System scripts can still use:

```text
X-GEO-API-Key: <runtime-key>
```

The browser client config endpoint does not expose the mutation API key in v0.21.0. Keep `GEO_INTERNAL_API_KEY` for automation, diagnostics, delivery checks, and controlled scripts.

Roles:

- `owner`: all operations, restore, reset, and user management.
- `admin`: configuration, connectors, backups, and editor/viewer user management.
- `editor`: content, keyword, distribution, International GEO, visibility, and campaign operations.
- `viewer`: read-only workspace access.

## Pagination

List endpoints generally return:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

## Route Groups

### Session And Users

- `GET /session/current`
- `POST /session/login`
- `POST /session/logout`
- `GET /workspaces/current`
- `GET /members`
- `GET /users`
- `POST /users`
- `POST /users/:id/disable`
- `POST /users/:id/reset-password`

User responses never include password hashes. Create and reset responses may include a temporary password only in the direct response to the authorized action.

### Dashboard

- `GET /dashboard/*`

Returns dashboard summaries, recent publishing data, and top keyword indicators used by the prototype dashboard.

### Keywords And Source Ingestion

- `GET /keywords`
- `POST /keywords/batch`
- `GET /keywords/:id`
- `POST /keywords/:id/actions`
- `GET /keyword-crawl-jobs`
- `POST /keyword-crawl-jobs`
- `GET /media-sources`
- `POST /media-sources`
- `PUT /media-sources/:id`
- `GET /source-adapter-contracts`
- `GET /source-adapter-contracts/:id`

Key contracts:

- `keyword-crawl-jobs` include `source_adapter_id`, `source_adapter_version`, `adapter_evidence`, `quality_summary`, and `error_taxonomy`.
- `media-sources` include adapter contract labels, stages, quality signals, error codes, and privacy boundary.

### Automation Providers

- `GET /automation-providers`
- `GET /automation-providers/:id`
- `PUT /automation-providers/:id`
- `POST /automation-providers/:id/test`
- `GET /automation-providers/:id/protocol`
- `GET /provider-invocations`

Provider configs mask secrets. Remote providers use guarded endpoint validation and local fallback behavior.

### Automation Connectors And Permissions

- `GET /automation-connectors`
- `GET /automation-connectors/:id`
- `PUT /automation-connectors/:id`
- `POST /automation-connectors/:id/test`
- `POST /automation-connectors/:id/diagnose`
- `GET /connector-health-checks`
- `GET /connector-diagnostics`
- `GET /connector-permissions`

Connector outputs include masked config, latest health check, latest diagnostic, and permission metadata. Permission rows include credential status, allowed actions, dangerous actions, permission boundary, and latest audit result.

Connector mutation accepts local single-user configuration fields: `is_enabled`, `status`, `endpoint`, `api_key`, `timeout_ms`, `retry_count`, and `notes`. Raw API keys are never returned. Endpoint validation allows `mock://` simulation endpoints and public `https://` endpoints, while rejecting loopback/private hosts.

Connector diagnostics produce readiness scores, check rows, permission decisions, recent audit context, recent run steps, and recommended operator actions. Diagnostic output omits raw secrets.

### Source Strategies And Runs

- `GET /source-strategies`
- `GET /source-strategies/:id`
- `PUT /source-strategies/:id`
- `POST /source-strategies/:id/run`
- `GET /automation-runs`
- `GET /automation-runs/:id`
- `POST /automation-runs/:id/retry`

Runs include structured steps, provider/connector metadata, input/output previews, status labels, timing, errors, and event logs.

### Content

- `GET /topic-ideas`
- `POST /topic-ideas`
- `PUT /topic-ideas/:id`
- `POST /topic-ideas/:id/outline`
- `GET /articles`
- `POST /articles`
- `GET /articles/:id`
- `PATCH /articles/:id`
- `POST /articles/from-topic`
- `POST /articles/:id/review`
- `POST /articles/:id/submit-review`
- `GET /prompt-templates`
- `GET /content-quality-traces`
- `POST /content-templates`

These routes power topic planning, article drafting, review flow, prompt lineage, and content quality traces.

### Single-User Workspace And Exports

- `GET /workspaces/current`
- `GET /workspace-input`
- `PUT /workspace-input`
- `POST /exports`
- `GET /exports/:id/download`

Workspace input stores the one-user operating context. Export jobs generate local downloadable artifacts.

### International GEO

- `GET /international-geo`
- `PUT /international-geo/input`
- `POST /international-geo/audit`
- `POST /international-geo/artifacts`
- `GET /international-geo/site-audits`
- `GET /international-geo/site-audits/:id`
- `POST /international-geo/site-audits`
- `POST /international-geo/site-audits/:id/assets`
- `POST /international-geo/site-audits/:id/crawl`
- `GET /international-geo/visibility`
- `GET /international-geo/visibility/runs`
- `GET /international-geo/visibility/snapshots`
- `POST /international-geo/visibility/prompt-sets`
- `POST /international-geo/visibility/run`
- `POST /international-geo/visibility/evidence/import`
- `POST /international-geo/visibility/evidence/imports`
- `POST /international-geo/visibility/evidence/:id/review`
- `GET /international-geo/visibility/providers`
- `PUT /international-geo/visibility/providers/:id`
- `POST /international-geo/visibility/providers/:id/test`
- `POST /international-geo/visibility/providers/diagnose`
- `GET /international-geo/publishing`
- `GET /international-geo/publishing/platforms`
- `GET /international-geo/publishing/packages`
- `GET /international-geo/publishing/tracking`
- `GET /international-geo/publishing/connectors`
- `PUT /international-geo/publishing/connectors/:id`
- `POST /international-geo/publishing/connectors/:id/test`
- `POST /international-geo/publishing/connectors/diagnose`
- `GET /international-geo/content-generation`
- `PUT /international-geo/content-generation/providers/:id`
- `POST /international-geo/content-generation/providers/:id/test`
- `POST /international-geo/content-generation/articles/generate`
- `POST /international-geo/content-generation/articles/:id/review`
- `POST /international-geo/content-generation/rewrites/generate`
- `POST /international-geo/content-generation/rewrites/:id/review`
- `POST /international-geo/publishing/packages/generate`
- `POST /international-geo/publishing/packages/:id/review`
- `PUT /international-geo/publishing/tracking/:id`

These routes power local International GEO readiness audits, guarded crawl evidence, and artifact generation for `llms.txt`, JSON-LD, FAQ, article briefs, and distribution briefs.

Site audit create requests require `website_url` and `product_name`. The generated audit includes stable checks for URL quality, AI crawler access recommendations, sitemap, `llms.txt`, JSON-LD, direct-answer content, fact density, E-E-A-T, and third-party validation. Each check can expose `evidence_status`, `evidence_source`, a compact `evidence` string, `score_weight`, `score_awarded`, `score_deduction`, `confidence`, `priority`, `deduction_reasons`, and `next_actions`. Site audit records also include `score_breakdown` with `total_weight`, `awarded`, `deducted`, `confidence`, `priority_counts`, and category `groups`. Asset generation creates copyable previews for `llms.txt`, Organization JSON-LD, Product JSON-LD, FAQ JSON-LD, article brief, and distribution brief.

The crawl route safely fetches only the submitted homepage plus origin `robots.txt`, `sitemap.xml`, and `/llms.txt`. It stores the connector-shaped snapshot under `crawl_evidence` with `provider_id`, `execution_mode`, `status`, `resources`, and `issues`, then rebuilds evidence-aware checks and recalculates the weighted score breakdown. Unsafe crawl targets return `400 CRAWL_TARGET_BLOCKED`; normal network failures return a stored failed or partial evidence snapshot instead of crashing the server.

Mutation routes require an editor/admin/owner browser session or `X-GEO-API-Key`. Viewer sessions can read audits but cannot create audits, generate assets, or run crawls.

### International GEO Evidence Assets

- `GET /international-geo/evidence-assets`: returns `{ summary, opportunities, queue, assets }`.
- `GET /international-geo/evidence-assets/opportunities`: returns evidence-driven opportunity rows.
- `GET /international-geo/evidence-assets/queue`: returns local generation queue rows.
- `POST /international-geo/evidence-assets/generate`: owner/editor/admin action that derives opportunities and generates local reviewable assets.
- `POST /international-geo/evidence-assets/:id/review`: owner/editor/admin action with `{ "action": "approve" }` or `{ "action": "reject", "human_notes": "..." }`.

Evidence assets are local review artifacts. They are not automatically published and do not represent measured AI engine inclusion.

### International GEO Content Generation

- `GET /international-geo/content-generation`: viewer route for content-generation summary, sanitized provider rows, generated article drafts, platform rewrites, and generation runs.
- `PUT /international-geo/content-generation/providers/:id`: editor route that saves the OpenAI-compatible content-generation provider config. Responses mask credentials and never return raw `api_key` values.
- `POST /international-geo/content-generation/providers/:id/test`: editor route that validates the provider config. `mock://openai-compatible` stays local; real calls require a safe `https://` endpoint, model, and API key.
- `POST /international-geo/content-generation/articles/generate`: editor route that creates article drafts from approved evidence assets. When `openai_compatible` is configured it is tried first; failures fall back to `local_rules` and record provider provenance.
- `POST /international-geo/content-generation/articles/:id/review`: editor route that approves or rejects a generated article with `{ "action": "approve" }` or `{ "action": "reject", "human_notes": "..." }`.
- `POST /international-geo/content-generation/rewrites/generate`: editor route that creates platform rewrites from approved generated articles. When the OpenAI-compatible provider is configured it is tried first; failures fall back to `local_rules`.
- `POST /international-geo/content-generation/rewrites/:id/review`: editor route that approves or rejects a platform rewrite with `{ "action": "approve" }` or `{ "action": "reject", "human_notes": "..." }`.

The active generator is `local_rules`. OpenAI, Claude, and Gemini provider rows are reserved extension seams and are not executed in v0.19. Generated article drafts preserve source asset ids, source asset types, evidence summary, target prompt, canonical URL, review status, and `local_rules` provider provenance. Platform rewrites preserve source article id, platform mapping, rewrite type, AI visibility goal, moderation notes, canonical URL, review status, and provider provenance.

Content generation boundary: v0.21 may call only the operator-configured OpenAI-compatible endpoint for article and rewrite generation. It does not publish externally, store external platform credentials, verify indexing, query ChatGPT Search/Gemini/Claude/Perplexity/Google AIO/Copilot/Bing/SERP providers, or prove AI inclusion, citation, recommendation, or external distribution.

Claude and Gemini content-generation provider rows are reserved placeholders in v0.21. They are readable for roadmap visibility, but save attempts are rejected and they are not executable providers.

### International GEO Publishing Workflow

- `GET /international-geo/publishing`: viewer route for publishing workflow summary.
- `GET /international-geo/publishing/platforms`: viewer route for the local high-authority platform list, including authority signals and AI recommendation-probability notes.
- `GET /international-geo/publishing/packages`: viewer route for review-only package queue rows.
- `GET /international-geo/publishing/tracking`: viewer route for manual/local tracking records.
- `POST /international-geo/publishing/packages/generate`: editor route that generates deterministic publishing packages from approved International GEO evidence assets.
- `POST /international-geo/publishing/packages/:id/review`: editor route that approves or rejects a review-only publishing package.
- `PUT /international-geo/publishing/tracking/:id`: editor route that updates manual/local publication URL, canonical URL, indexing status, AI mention status, citation status, and recommendation status.
- `GET /international-geo/publishing/connectors`: viewer route for connector-ready publishing platform configs.
- `PUT /international-geo/publishing/connectors/:id`: editor route that saves local status, endpoint, masked credential input, and notes.
- `POST /international-geo/publishing/connectors/:id/test`: editor route that runs a local dry-run check and returns `external_call_performed: false`.
- `POST /international-geo/publishing/connectors/diagnose`: editor route that dry-run diagnoses every publishing connector.

Publishing platform notes are planning guidance only. They explain why public, higher-visibility platforms may improve retrieval, citation, and recommendation probability, but they are not measured AI engine evidence.

Publishing workflow boundary: local planning/handoff only. These publishing routes do not publish externally, store external platform credentials, generate article drafts, call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or external platform services, or verify real inclusion/recommendation. Tracking values are manual/local unless future connector evidence exists.

Publishing connector configs are a v0.19 foundation only. They mask credentials, validate endpoint shape, and expose `external_publish_blocked` in dry-run checks. They do not call owned-site CMS, docs, Medium, LinkedIn, YouTube, GitHub, Reddit, Quora, directory, review-site, or community APIs.

Visibility routes add the v0.13 measurement foundation:

- `GET /international-geo/visibility` returns prompt sets, provider readiness, recent runs, snapshot summaries, and status counts.
- `GET /international-geo/visibility/runs` lists visibility measurement runs and their provider/prompt-set metadata.
- `GET /international-geo/visibility/snapshots` lists prompt snapshots by prompt set, run, engine, capture time, and data status.
- `POST /international-geo/visibility/prompt-sets` creates a prompt set for one non-empty prompt, optional market, language, buyer intent, product name, target URL, target brand, competitor list, and supported engine ids.
- `POST /international-geo/visibility/run` creates a local run across active prompt sets and their configured engines.
- `POST /international-geo/visibility/evidence/import` imports one human-verified measured observation into a `measured` prompt snapshot.
- `POST /international-geo/visibility/evidence/imports` imports a JSON batch of human-verified measured observations into `measured` prompt snapshots.
- `POST /international-geo/visibility/evidence/:id/review` approves or rejects one manually imported measured snapshot.
- `GET /international-geo/visibility/providers` reads the v0.19 visibility provider config registry.
- `PUT /international-geo/visibility/providers/:id` saves local provider status, approval status, endpoint, masked credential input, and notes.
- `POST /international-geo/visibility/providers/:id/test` runs a local provider dry-run test and returns `external_call_performed: false`.
- `POST /international-geo/visibility/providers/diagnose` dry-run diagnoses every visibility provider.

Prompt-set creation requires a non-empty `prompt`. `engines` defaults to all supported visibility engines when omitted, and unsupported engine ids return `400 VALIDATION_ERROR`. Market, language, buyer intent, product name, target URL, target brand, and competitors are optional operating context fields; defaults come from the International GEO input when available. Prompt sets do not store raw provider credentials.

Measured evidence import creates snapshots with `data_status: "measured"`, `provider_id: "manual_import"`, and runs with `data_source_type: "measured_import"`. Provider readiness for imported engines is updated with `permission_status: "manual_review"`. v0.18 also records local import ledger rows, review counts, and approved-evidence trend rows. v0.19 adds dry-run visibility provider configs and diagnostics without changing manual evidence semantics. The International GEO UI exposes these workflows through `导入测量证据`, `批量导入测量证据`, `测量证据台账`, `证据复核`, `可见度趋势`, `可见度 Provider 配置`, `Provider 诊断`, and `Provider 运行边界`.

Visibility snapshot `data_status` labels are contract boundaries:

- `measured`: captured from manually imported human-verified evidence in v0.17/v0.18 or from future approved provider evidence.
- `simulated`: demo or seed data that must not be presented as real engine output.
- `unavailable`: no compliant provider data is available for that prompt/provider pair.

Default local visibility runs create `unavailable` snapshots only. Manual single-row and batch imports create user-supplied `measured` snapshots but do not call ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, Copilot, Bing, SERP APIs, indexing APIs, external platform APIs, or other external AI visibility providers. Snapshot responses may include provider labels, readiness state, prompt text, target brand, competitors, unavailable reasons, review status, import ledger provenance, and manual import provenance, but they must not expose raw provider credentials.

Imported `measured` snapshots are user-supplied, human-entered evidence and are only as accurate as the operator-entered observation. v0.18 trends count approved manual evidence only. Only future approved provider evidence supports automated monitoring claims.

Visibility mutations require an editor/admin/owner browser session or `X-GEO-API-Key`. Viewer sessions can read visibility overview, runs, snapshots, imports, and trends but cannot create prompt sets, local runs, evidence imports, or evidence reviews.

Visibility provider configs are a v0.19 foundation only. They do not query ChatGPT Search, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or AI visibility provider APIs. Saved credentials are masked and are never returned.

Visibility foundation boundary: guarded public site crawling, deterministic evidence-backed scoring, the AI visibility measurement foundation, v0.18 measured-evidence operations, and v0.19 provider dry-run diagnostics do not perform recursive crawling, browser rendering, real AI search engine querying, real SERP collection, indexing checks, automatic provider integrations, file uploads, external LLM generation, external publishing/indexing connector calls, or automatic third-party publishing.

### Publishing

- `GET /publish-tasks`
- `POST /publish-tasks`
- `GET /publish-tasks/:id`
- `POST /publish-tasks/:id/start`
- `POST /publish-tasks/:id/cancel`
- `POST /publish-tasks/:id/retry-failed`
- `POST /publish-tasks/:id/items/:itemId/takeover`
- `POST /publish-tasks/:id/approval`
- `GET /publish-records`
- `GET /channels`
- `POST /channels`
- `PUT /channels/:id`
- `POST /channels/:id/reconnect`

Publish task start is guarded by approval status and item readiness.

### Analytics

- `GET /analytics/*`
- `GET /analytics/visibility`
- `POST /analytics/visibility/collect`
- `GET /audience-segments`
- `GET /marketing-campaigns`
- `POST /marketing-campaigns/:id/run`

Visibility collection and campaign send actions check connector permissions before recording completed runs.

### Settings And System

- `GET /brand-profile`
- `PUT /brand-profile`
- `GET /model-configs`
- `POST /model-configs`
- `PUT /model-configs/:id`
- `GET /audit-events`
- `GET /audit-events/export.csv`
- `GET /system/runtime`
- `GET /system/preflight`
- `GET /system/production-readiness`
- `POST /system/production-readiness/check`
- `GET /system/delivery-readiness`
- `POST /system/delivery-readiness/check`
- `GET /system/delivery-bundle`
- `GET /system/backups`
- `POST /system/backups`
- `POST /system/backups/import/validate`
- `POST /system/backups/import`
- `GET /system/backups/:id/download`
- `POST /system/backups/:id/validate`
- `POST /system/backups/:id/restore`
- `POST /system/runtime/reset`
- `GET /system/runtime/scheduler`
- `POST /system/runtime/scheduler/tick`
- `GET /system/client-config`
- `POST /billing/plan`
- `POST /session/logout`

Audit CSV export neutralizes spreadsheet formula prefixes. Runtime reset restores seed state and records an audit event.

Runtime backups are local operator artifacts. Backup list responses expose metadata only. Download responses return a JSON artifact with `kind`, `schema_version`, `backup`, and `snapshot`; the snapshot intentionally excludes `runtimeBackups` so backups do not recursively contain backup history. Import routes accept that downloaded artifact shape, validate checksum and schema, and store the artifact under a new local backup id. Create, import, validate, and restore operations write audit events.

Launch preflight is read-only. It returns overall status, score, summary counts, and check rows for persistence, mutation auth, user auth, session security, remote access, backup recovery, connectors, GEO static routes, and scheduler state. It does not expose raw API keys or environment values.

Production readiness is a v0.19 operational read model. `GET /system/production-readiness` is readable by viewer sessions. `POST /system/production-readiness/check` requires editor/admin/owner permission or the system API key. Responses include readiness checks, a masked secret inventory, and handoff checklist rows; raw secrets are never returned.

Delivery readiness is a v0.21 handoff read model. `GET /system/delivery-readiness` is readable by viewer sessions. `POST /system/delivery-readiness/check` requires editor/admin/owner permission or the system API key and records `system.delivery_readiness.check` in the audit log. `GET /system/delivery-bundle` requires an admin/owner session or the system API key because it returns a broad operational handoff summary.

The delivery bundle response has `kind: "geo-pulse-delivery-bundle"` and includes delivery readiness, production readiness, launch preflight-style checks, safe runtime counts, backup metadata, International GEO provider/connector summaries, a safe content-generation provider summary, operating boundaries, and handoff steps. It is a sanitized handoff report, not a runtime backup: it must not include raw secrets, password hashes, sessions, backup snapshots, full local state, raw audit logs, raw connector configs, `api_key` fields, prompts, article bodies, or rewrite bodies.

## Adding Or Changing APIs

When adding routes:

1. Add data action or read model in `mock-data.mjs`.
2. Add route handling in `server.mjs`.
3. Add UI client usage in `prototype/src/api.js` or page modules.
4. Add static preview route data when the UI depends on it.
5. Add assertions to `verify-mvp.mjs`.
6. Update this reference and README API list.

## Operational Routes

These routes are not part of the JSON API contract:

- `GET /healthz`: returns safe runtime status including `ok`, package version, environment, persistence summary, scheduler status, and timestamp.
- `GET /robots.txt`: returns crawler policy and sitemap location.
- `GET /sitemap.xml`: returns canonical XML sitemap entries.
- `GET /llms.txt`: returns an LLM-readable product summary for GEO/AI search crawlers.
- `GET /favicon.ico`: returns a small icon response so production logs do not fill with favicon 404s.
