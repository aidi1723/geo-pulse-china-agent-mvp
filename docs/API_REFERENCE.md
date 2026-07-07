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

The browser client config endpoint does not expose the mutation API key in v0.16.0. Keep `GEO_INTERNAL_API_KEY` for automation, diagnostics, and controlled scripts.

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
- `GET /international-geo/publishing`
- `GET /international-geo/publishing/platforms`
- `GET /international-geo/publishing/packages`
- `GET /international-geo/publishing/tracking`
- `GET /international-geo/content-generation`
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

- `GET /international-geo/content-generation`: viewer route for content-generation summary, provider rows, generated article drafts, platform rewrites, and generation runs.
- `POST /international-geo/content-generation/articles/generate`: editor route that creates deterministic article drafts from approved evidence assets that have not already been used by non-rejected generated articles.
- `POST /international-geo/content-generation/articles/:id/review`: editor route that approves or rejects a generated article with `{ "action": "approve" }` or `{ "action": "reject", "human_notes": "..." }`.
- `POST /international-geo/content-generation/rewrites/generate`: editor route that creates deterministic platform rewrites from approved generated articles.
- `POST /international-geo/content-generation/rewrites/:id/review`: editor route that approves or rejects a platform rewrite with `{ "action": "approve" }` or `{ "action": "reject", "human_notes": "..." }`.

The active generator is `local_rules`. OpenAI, Claude, and Gemini provider rows are reserved extension seams and are not executed in v0.16. Generated article drafts preserve source asset ids, source asset types, evidence summary, target prompt, canonical URL, review status, and `local_rules` provider provenance. Platform rewrites preserve source article id, platform mapping, rewrite type, AI visibility goal, moderation notes, canonical URL, review status, and provider provenance.

Content generation boundary: local deterministic generation and human review only. These routes do not call external LLMs, publish externally, store external platform credentials, verify indexing, query live AI/search/SERP providers, or prove AI inclusion, citation, recommendation, or external distribution.

### International GEO Publishing Workflow

- `GET /international-geo/publishing`: viewer route for publishing workflow summary.
- `GET /international-geo/publishing/platforms`: viewer route for the local high-authority platform list, including authority signals and AI recommendation-probability notes.
- `GET /international-geo/publishing/packages`: viewer route for review-only package queue rows.
- `GET /international-geo/publishing/tracking`: viewer route for manual/local tracking records.
- `POST /international-geo/publishing/packages/generate`: editor route that generates deterministic publishing packages from approved International GEO evidence assets.
- `POST /international-geo/publishing/packages/:id/review`: editor route that approves or rejects a review-only publishing package.
- `PUT /international-geo/publishing/tracking/:id`: editor route that updates manual/local publication URL, canonical URL, indexing status, AI mention status, citation status, and recommendation status.

Publishing platform notes are planning guidance only. They explain why public, higher-visibility platforms may improve retrieval, citation, and recommendation probability, but they are not measured AI engine evidence.

Publishing workflow boundary: local planning/handoff only. These publishing routes do not publish externally, store external platform credentials, generate article drafts, call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or external platform services, or verify real inclusion/recommendation. Tracking values are manual/local unless future connector evidence exists.

Visibility routes add the v0.13 measurement foundation:

- `GET /international-geo/visibility` returns prompt sets, provider readiness, recent runs, snapshot summaries, and status counts.
- `GET /international-geo/visibility/runs` lists visibility measurement runs and their provider/prompt-set metadata.
- `GET /international-geo/visibility/snapshots` lists prompt snapshots by prompt set, run, engine, capture time, and data status.
- `POST /international-geo/visibility/prompt-sets` creates a prompt set for one non-empty prompt, optional market, language, buyer intent, product name, target URL, target brand, competitor list, and supported engine ids.
- `POST /international-geo/visibility/run` creates a local run across active prompt sets and their configured engines.

Prompt-set creation requires a non-empty `prompt`. `engines` defaults to all supported visibility engines when omitted, and unsupported engine ids return `400 VALIDATION_ERROR`. Market, language, buyer intent, product name, target URL, target brand, and competitors are optional operating context fields; defaults come from the International GEO input when available. Prompt sets do not store raw provider credentials.

Visibility snapshot `data_status` labels are contract boundaries:

- `measured`: captured from a future approved external visibility provider with stored provider evidence.
- `simulated`: demo or seed data that must not be presented as real engine output.
- `unavailable`: no compliant provider data is available for that prompt/provider pair.

Default local visibility runs create `unavailable` snapshots only. They do not call ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, Copilot, Bing, SERP APIs, or other external AI visibility providers. Snapshot responses may include provider labels, readiness state, prompt text, target brand, competitors, and unavailable reasons, but they must not expose raw provider credentials.

Visibility mutations require an editor/admin/owner browser session or `X-GEO-API-Key`. Viewer sessions can read visibility overview, runs, and snapshots but cannot create prompt sets or runs.

Visibility foundation boundary: guarded public site crawling, deterministic evidence-backed scoring, and the AI visibility measurement foundation do not perform recursive crawling, browser rendering, real AI search engine querying, real SERP collection, measured engine inclusion/rank tracking, recommendation-rank tracking, or automatic third-party publishing.

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
