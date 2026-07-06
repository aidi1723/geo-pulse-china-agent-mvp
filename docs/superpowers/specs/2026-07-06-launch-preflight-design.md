# Launch Preflight v0.8 Design

## Goal

Add a read-only launch preflight checklist so a single operator can see whether the local GEO Pulse deployment is ready for controlled single-tenant use before exposing or handing it off.

## Current Gap

v0.7 can recover local state through backup import/restore, but readiness is still spread across runtime status, docs, health routes, static GEO files, connector diagnostics, and environment assumptions. Operators need a single structured view of launch blockers and warnings.

## In Scope

- Read-only `GET /api/v1/system/preflight` route.
- Include preflight summary in `/api/v1/system/runtime`.
- Settings runtime UI section for launch preflight.
- Checks for:
  - `persistence`: enabled vs local demo mode.
  - `mutation_auth`: fixed API key, production key length, remote exposure boundary.
  - `remote_access`: whether remote access is disabled or explicitly guarded.
  - `backup_recovery`: backup count and latest backup presence.
  - `connectors`: connector readiness and failed health checks.
  - `geo_static`: health, robots, sitemap, llms, favicon route availability as configured capabilities.
  - `scheduler`: scheduler enabled/status and due strategies.
- Preflight status values: `passed`, `warning`, `failed`.
- Overall launch status:
  - `ready` if no failed checks and no warnings.
  - `review` if no failed checks but warnings exist.
  - `blocked` if any failed checks exist.

## Out of Scope

- External network probing.
- Real cloud deployment checks.
- TLS certificate validation.
- Reverse proxy configuration detection.
- Automated remediation.
- Multi-tenant readiness.

## Data Contract

Preflight response:

```json
{
  "status": "review",
  "score": 82,
  "summary": {
    "passed": 5,
    "warnings": 2,
    "failed": 0,
    "blockers": 0
  },
  "checks": [
    {
      "id": "persistence",
      "category": "data",
      "label": "Local persistence",
      "status": "warning",
      "message": "Persistence is disabled.",
      "recommendation": "Enable GEO_ENABLE_PERSISTENCE=1 for controlled deployment."
    }
  ],
  "generated_at": "ISO timestamp"
}
```

## UI Contract

Add a compact "上线预检" section inside Settings -> Brand Knowledge -> Runtime and Data:

- Show overall status, score, blockers, warnings.
- Show a table of checks using existing `statusMarkup`, `tableMarkup`, `info-row`, and compact metadata.
- Add a secondary "刷新预检" action that reloads the preflight route and refreshes the page state.
- Do not add a hero, wizard, marketing copy, or decorative visual treatment.

## Security Boundary

The preflight route is read-only and must not reveal raw API keys, secrets, full env vars, or local file contents. It may reveal boolean/key-length readiness and local persistence path already exposed by runtime status.
