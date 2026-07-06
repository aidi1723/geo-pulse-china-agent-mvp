# Architecture Guide

## Overview

GEO Pulse China Agent v0.5 is a zero-dependency Node.js application with a browser admin workspace. It remains local-first for third-party integrations, but it now includes a single-user complete workflow, connector configuration, connector testing, connector diagnostics, a single-tenant deployment profile, production startup guardrails, health checks, and GEO/SEO static files for controlled server use.

## Runtime Components

| Area | File or Directory | Responsibility |
| --- | --- | --- |
| HTTP server | `server.mjs` | Serves the prototype, exposes `/api/v1/*`, applies security headers, mutation authorization, CORS, rate limiting, body limits, SSRF checks, scheduler controls, health checks, and static GEO/SEO routes. |
| Mock domain data | `mock-data.mjs` | Stores seed data, local state mutation actions, API read models, persistence hydration, audit events, provider invocation logs, connector permissions, connector diagnostics, source adapter contracts, and workflow actions. |
| Provider registry | `automation-providers.mjs` | Defines keyword discovery, topic planning, and article generation provider contracts, local fallback behavior, remote execution validation, masking, and provider config persistence helpers. |
| Prototype shell | `prototype/` | Browser admin prototype with hash routing, state store, API client, static preview mode, UI pages, and shared utilities. |
| Regression gate | `verify-mvp.mjs` | Full local verification suite for syntax, data actions, UI rendering, HTTP behavior, security checks, persistence, scheduler, audit, publishing, connectors, and source adapters. |
| Documentation | `README.md`, `docs/`, `reports/` | Public usage docs, maintainer guides, release checklist, benchmark notes, and security hardening record. |

## Data Flow

1. The browser prototype loads data through `prototype/src/api.js`.
2. In server mode, requests go to `server.mjs` under `/api/v1/*`.
3. `server.mjs` delegates reads and mutations to `mock-data.mjs` and `automation-providers.mjs`.
4. Mutations update in-memory arrays and, when persistence is enabled, write to `data/geo-pulse-state.json`.
5. Static preview mode uses `prototype/src/static-routes.js` and `prototype/preview-static-global.js` so the prototype can be opened without a server.

## Domain Boundaries

| Domain | Current Shape | Primary Files |
| --- | --- | --- |
| Keywords and source ingestion | Keywords, media sources, crawl jobs, source strategies, source adapter contracts, source evidence, dedupe and quality summaries. | `mock-data.mjs`, `prototype/src/pages/keywords.js` |
| Content production | Topic ideas, articles, reviews, prompt templates, content quality traces. | `mock-data.mjs`, `prototype/src/pages/content.js`, `prototype/src/pages/settings.js` |
| Publishing | Channels, publish tasks, task items, calendar metadata, variants, readiness checks, approval guard, records. | `mock-data.mjs`, `prototype/src/pages/distribution.js` |
| Automation operations | Provider registry, connector registry, permission matrix, connector health checks, connector diagnostics, automation run steps, scheduler tick, retries. | `automation-providers.mjs`, `mock-data.mjs`, `prototype/src/pages/settings.js` |
| Analytics | Visibility tracking, SERP snapshots, competitor domains, audience segments, campaign runs. | `mock-data.mjs`, `prototype/src/pages/analytics.js` |
| International GEO | Overseas AI search readiness, article and distribution planning, engine visibility, community citation surfaces. | `prototype/src/pages/international.js` |
| Single-user completion | Workspace input, manual topics, outlines, manual articles, templates, exports, local billing plan switch, and logout action. | `mock-data.mjs`, `server.mjs`, `prototype/src/main.js` |
| Security and governance | API key guard, audit events, CSV export safety, connector-scoped permissions, endpoint restrictions. | `server.mjs`, `mock-data.mjs`, `reports/security-hardening-log.md` |

## Persistence Model

Persistence is local JSON, not a production database.

- Default file: `data/geo-pulse-state.json`
- Controlled by: `GEO_ENABLE_PERSISTENCE`, `GEO_DATA_FILE`
- Write behavior: temp file plus fsync plus atomic rename
- Publication rule: `data/` is ignored and must not be committed

## Security Model

v0.5 uses local-first safeguards plus production startup guardrails:

- Remote access is disabled unless `GEO_ALLOW_REMOTE_ACCESS=1`.
- Remote access requires a fixed `GEO_INTERNAL_API_KEY`.
- `NODE_ENV=production` fails startup when `GEO_INTERNAL_API_KEY` is missing or shorter than 24 characters.
- Mutation APIs require `X-GEO-API-Key`.
- Sensitive reads such as audit events require authorization when remote access is enabled.
- Provider endpoints are restricted to `mock://` and `https://`, with loopback/private/link-local targets blocked.
- CSV audit export neutralizes spreadsheet formula prefixes.
- Connector actions are evaluated against scoped permission metadata before visibility collection or campaign execution.
- Connector diagnostics summarize endpoint safety, credential status, health checks, permission decisions, audit context, and recent run steps without exposing raw secrets.

These safeguards are not a replacement for built-in user login, RBAC, database controls, monitoring, incident response, or an external access layer.

## Operational Routes

Outside `/api/v1`, the server exposes deployment and GEO/SEO routes:

- `GET /healthz`
- `GET /robots.txt`
- `GET /sitemap.xml`
- `GET /llms.txt`
- `GET /favicon.ico`

## UI Architecture

The UI is a dense operational admin prototype. `DESIGN.md` is the visual source of truth.

- Shared helpers live in `prototype/src/utils.js` and `prototype/src/components.js`.
- Page modules live under `prototype/src/pages/`.
- Hash route and selection behavior lives in `prototype/src/route-state.js` and `prototype/src/experience-utils.js`.
- Static preview compatibility must be kept when adding new API data.

## Extension Points

Use [Extension Guide](EXTENDING.md) for implementation details. The main extension seams are:

- Provider capability in `automation-providers.mjs`.
- Connector metadata and permissions in `mock-data.mjs`.
- Source adapter contracts in `mock-data.mjs`.
- API routes in `server.mjs`.
- UI pages in `prototype/src/pages/`.
- Regression assertions in `verify-mvp.mjs`.
- Static preview data in `prototype/src/static-routes.js` and `prototype/preview-static-global.js`.
