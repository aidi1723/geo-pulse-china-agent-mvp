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

Write APIs require:

```text
X-GEO-API-Key: <runtime-key>
```

In local same-origin mode, the browser prototype reads the development key from `/api/v1/system/client-config`. When `GEO_ALLOW_REMOTE_ACCESS=1`, the server requires a fixed `GEO_INTERNAL_API_KEY` and does not expose it to the client config endpoint.

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
- `GET /connector-permissions`

Connector outputs include masked config and permission metadata. Permission rows include credential status, allowed actions, dangerous actions, permission boundary, and latest audit result.

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
- `GET /articles`
- `GET /articles/:id`
- `PUT /articles/:id`
- `POST /articles/from-topic`
- `POST /articles/:id/review`
- `POST /articles/:id/submit-review`
- `GET /prompt-templates`
- `GET /prompt-templates/:id`
- `GET /content-quality-traces`

These routes power topic planning, article drafting, review flow, prompt lineage, and content quality traces.

### Publishing

- `GET /publish-tasks`
- `POST /publish-tasks`
- `GET /publish-tasks/:id`
- `POST /publish-tasks/:id/start`
- `POST /publish-tasks/:id/cancel`
- `POST /publish-tasks/:id/retry-failed`
- `POST /publish-tasks/:id/takeover`
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
- `POST /system/runtime/reset`
- `GET /system/runtime/scheduler`
- `POST /system/runtime/scheduler/tick`
- `GET /system/client-config`

Audit CSV export neutralizes spreadsheet formula prefixes. Runtime reset restores seed state and records an audit event.

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
