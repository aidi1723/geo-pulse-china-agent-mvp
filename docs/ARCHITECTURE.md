# Architecture Guide

## Overview

GEO Pulse China Agent v0.21.0 is a zero-dependency Node.js application with a browser admin workspace. It remains local-first for third-party integrations, but it now includes built-in one-organization multi-user access, role-based permissions, connector configuration, connector testing, connector diagnostics, local backup import/restore, launch preflight, production readiness checks, delivery readiness checks, sanitized delivery bundle export, International GEO site audit records, guarded live crawl evidence, evidence-backed scoring, generated GEO asset previews, AI visibility measurement foundation state, manual measured visibility evidence operations, evidence-driven local asset opportunities and review state, local-rule article generation, configurable OpenAI-compatible LLM article generation, multi-platform rewrite generation, a local high-authority publishing platform list, review-only publishing package queue, manual tracking records, visibility provider dry-run foundation, publishing connector dry-run foundation, production startup guardrails, health checks, GEO/SEO static files, and minimal GitHub CI for controlled server use.

## Runtime Components

| Area | File or Directory | Responsibility |
| --- | --- | --- |
| HTTP server | `server.mjs` | Serves the prototype, exposes `/api/v1/*`, applies security headers, session authentication, role authorization, API-key automation access, CORS, rate limiting, body limits, SSRF checks, scheduler controls, health checks, and static GEO/SEO routes. |
| Mock domain data | `mock-data.mjs` | Stores seed data, local state mutation actions, API read models, delivery readiness and sanitized bundle summaries, persistence hydration, runtime backups, audit events, provider invocation logs, connector permissions, connector diagnostics, source adapter contracts, and workflow actions. |
| Safe site crawler | `site-crawl.mjs` | Normalizes crawl targets, blocks unsafe protocols/hosts/IP ranges, validates DNS at connection time, limits redirects/time/body size, extracts homepage/robots/sitemap/llms evidence, and returns connector-shaped crawl snapshots. |
| Provider registry | `automation-providers.mjs` | Defines keyword discovery, topic planning, and article generation provider contracts, local fallback behavior, remote execution validation, masking, and provider config persistence helpers. |
| Prototype shell | `prototype/` | Browser admin prototype with hash routing, state store, API client, static preview mode, UI pages, and shared utilities. |
| Regression gate | `verify-mvp.mjs` | Full local verification suite for syntax, data actions, UI rendering, HTTP behavior, security checks, persistence, scheduler, audit, publishing, connectors, and source adapters. |
| GitHub CI | `.github/workflows/check.yml` | Runs the local `npm run check` gate on pushes and pull requests targeting `main`. |
| Documentation | `README.md`, `docs/`, `reports/` | Public usage docs, maintainer guides, release checklist, benchmark notes, and security hardening record. |

## Data Flow

1. The browser prototype loads data through `prototype/src/api.js`.
2. In server mode, requests go to `server.mjs` under `/api/v1/*`.
3. `server.mjs` delegates reads and mutations to `mock-data.mjs` and `automation-providers.mjs`.
4. Mutations update in-memory arrays and, when persistence is enabled, write to `data/geo-pulse-state.json`.
5. Runtime backups capture a non-recursive snapshot of the serializable state; backup metadata is persisted with the local runtime, while downloaded artifacts include the full captured snapshot. Downloaded artifacts can be imported into a fresh runtime after checksum and schema validation.
6. Static preview mode uses `prototype/src/static-routes.js` and `prototype/preview-static-global.js` so the prototype can be opened without a server.

## Domain Boundaries

| Domain | Current Shape | Primary Files |
| --- | --- | --- |
| Keywords and source ingestion | Keywords, media sources, crawl jobs, source strategies, source adapter contracts, source evidence, dedupe and quality summaries. | `mock-data.mjs`, `prototype/src/pages/keywords.js` |
| Content production | Topic ideas, articles, reviews, prompt templates, content quality traces. | `mock-data.mjs`, `prototype/src/pages/content.js`, `prototype/src/pages/settings.js` |
| Publishing | Channels, publish tasks, task items, calendar metadata, variants, readiness checks, approval guard, records. | `mock-data.mjs`, `prototype/src/pages/distribution.js` |
| Automation operations | Provider registry, connector registry, permission matrix, connector health checks, connector diagnostics, automation run steps, scheduler tick, retries. | `automation-providers.mjs`, `mock-data.mjs`, `prototype/src/pages/settings.js` |
| Analytics | Visibility tracking, SERP snapshots, competitor domains, audience segments, campaign runs. | `mock-data.mjs`, `prototype/src/pages/analytics.js` |
| International GEO | Overseas AI search readiness, rule-first and crawl-evidenced site audit records, deterministic scoring breakdowns, generated GEO assets, evidence-driven opportunities, local asset queue and review states, local-rule article generation, configurable OpenAI-compatible LLM article generation, multi-platform rewrite generation, provider provenance/fallback records, high-authority publishing platform list with AI recommendation-probability notes, review-only publishing packages, manual tracking records, article and distribution planning, visibility prompt sets, provider readiness, runs, snapshots, manual measured evidence imports, import ledgers, evidence reviews, approved-only trends, visibility provider configs and dry-run diagnostics, publishing connector configs and dry-run diagnostics, and community citation surfaces. | `mock-data.mjs`, `site-crawl.mjs`, `server.mjs`, `prototype/src/pages/international.js` |
| Single-user completion | Workspace input, manual topics, outlines, manual articles, templates, exports, local billing plan switch, and logout action. | `mock-data.mjs`, `server.mjs`, `prototype/src/main.js` |
| Security and governance | Login sessions, local users, role permissions, API key automation guard, audit events, CSV export safety, connector-scoped permissions, endpoint restrictions, local backup/restore audit trail. | `server.mjs`, `mock-data.mjs`, `reports/security-hardening-log.md` |

## Persistence Model

Persistence is local JSON, not a production database.

- Default file: `data/geo-pulse-state.json`
- Controlled by: `GEO_ENABLE_PERSISTENCE`, `GEO_DATA_FILE`
- Write behavior: temp file plus fsync plus atomic rename
- Publication rule: `data/` is ignored and must not be committed

## Security Model

v0.21.0 uses built-in team access plus local-first production and delivery guardrails:

- Remote access is disabled unless `GEO_ALLOW_REMOTE_ACCESS=1`.
- Remote access requires a fixed `GEO_INTERNAL_API_KEY`.
- `NODE_ENV=production` fails startup when `GEO_INTERNAL_API_KEY` is missing or shorter than 24 characters.
- `NODE_ENV=production` requires `GEO_BOOTSTRAP_OWNER_PASSWORD` for first owner bootstrap.
- Browser access uses username/password login and an HTTP-only `geo_session` cookie.
- Roles are `owner`, `admin`, `editor`, and `viewer`.
- System scripts may still use `X-GEO-API-Key`.
- Sensitive reads such as audit events and delivery bundle export require admin/owner session or system API key.
- Provider endpoints are restricted to `mock://` and `https://`, with loopback/private/link-local targets blocked.
- International GEO live crawl targets are restricted to `http://` and `https://`, block localhost/private/link-local/multicast/unspecified ranges, validate redirect targets, apply connection-time DNS/IP checks, enforce short timeouts, body limits, and redirect limits.
- CSV audit export neutralizes spreadsheet formula prefixes.
- Connector actions are evaluated against scoped permission metadata before visibility collection or campaign execution.
- Connector diagnostics summarize endpoint safety, credential status, health checks, permission decisions, audit context, and recent run steps without exposing raw secrets.
- Launch preflight summarizes readiness checks, including user auth and session security, without exposing raw API keys, secrets, full env vars, or local file contents.
- Production readiness summarizes persistence, backup, auth, remote access, integration foundation, GEO static routes, masked secret inventory, and handoff checklist rows without exposing raw secrets.
- Delivery readiness summarizes launch/production handoff state, International GEO summaries, provider/connector dry-run boundaries, content-generation provider summary, and handoff steps. Delivery bundle export is sanitized and does not include raw secrets, password hashes, sessions, backup snapshots, full local state, raw audit logs, raw connector configs, `api_key` fields, prompts, article bodies, or rewrite bodies.

These safeguards are not a replacement for database controls, multi-tenant isolation, MFA, monitoring, incident response, or an external access layer.

## International GEO Audit Boundary

The v0.19 International GEO workflow stores `site_audits`, `crawl_evidence`, `score_breakdown`, `geo_assets`, evidence-driven opportunity rows, local asset queue items, generated asset previews, `content_generation` provider/article/rewrite/run records, high-authority publishing platform list rows, review-only publishing packages, manual tracking records, `visibility_prompt_sets`, `visibility_provider_readiness`, `visibility_snapshots`, `visibility_runs`, `visibility_import_batches`, `visibility_provider_configs`, and `publishing_connectors` inside the local mock state. Platform list rows include authority signals and AI recommendation-probability notes, but they are planning guidance only and do not represent measured engine inclusion or recommendation. It accepts a website URL, product or brand name, target market, target language, primary buyer query, and competitors, then builds deterministic rule-first checks and copyable assets. Editors can run a guarded live crawl that fetches only the submitted homepage plus origin `robots.txt`, `sitemap.xml`, and `/llms.txt`, stores the evidence snapshot, and rebuilds checks with `rule_first`, `crawl_evidenced`, or `unavailable` evidence states.

Each audit check is scored against a deterministic 100-point rubric through `score_weight`, `score_awarded`, `score_deduction`, `confidence`, `priority`, `deduction_reasons`, and `next_actions`. Audit-level `score_breakdown` groups awarded and deducted points by category and keeps legacy audit records renderable by hydrating missing scoring fields.

Visibility prompt sets group a required prompt with optional market, language, buyer intent, product name, target URL, target brand, competitors, and engine ids. Provider readiness rows describe whether ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, or Copilot / Bing can produce measured evidence. v0.19 visibility provider config rows add local status, approval status, endpoint, masked credentials, dry-run tests, and diagnose-all results for those engines. Visibility snapshots must label data as `measured`, `simulated`, or `unavailable`; measured snapshots can come from manually imported human-verified evidence in v0.17/v0.18 or future approved provider evidence. Default local runs create `unavailable` snapshots only. Manual imports use `provider_id: "manual_import"`, run `data_source_type: "measured_import"`, and readiness `permission_status: "manual_review"`. v0.18 trend rows are derived from approved manual evidence only.

v0.14 adds evidence-driven International GEO asset opportunities, queue items, generated local previews, and approve/reject review state. The workflow creates reviewable local assets only; it does not publish externally, generate full long-form articles, or call live AI search engines for inclusion/ranking measurement.

v0.15 adds the International GEO publishing platform workflow: a local destination matrix, deterministic packages generated from approved evidence assets, a review-only publishing package queue, and manual/local tracking records for publication URL, canonical URL, indexing status, AI mention status, citation status, and recommendation status.

v0.16 adds local-rule article and platform rewrite generation. Generated articles are created from approved evidence assets, must be reviewed, and then can produce platform rewrites. Rewrites preserve platform mapping, canonical URL, moderation notes, and review state.

v0.17 adds manual measured visibility evidence import through `POST /api/v1/international-geo/visibility/evidence/import` and the `导入测量证据` UI panel. Imported snapshots are user-supplied evidence and are only as accurate as the operator-entered observation.

v0.18 adds measured evidence operations through `POST /api/v1/international-geo/visibility/evidence/imports`, `POST /api/v1/international-geo/visibility/evidence/:id/review`, local import ledger rows, pending/approved/rejected review state, and approved-only visibility trends. It is still a manual evidence workflow, not automated provider monitoring.

v0.19 adds production integration foundation rows for visibility providers and publishing connectors, plus production readiness checks. The new tests and diagnostics are dry-run only, do not perform live external calls, and keep raw credentials masked.

v0.20 adds delivery readiness and sanitized delivery bundle export for controlled one-organization handoff. The delivery bundle is a handoff report, not a runtime backup, and keeps the v0.19 no-live-provider and no-auto-publish boundary intact.

v0.21 adds an executable OpenAI-compatible content-generation provider for International GEO article drafts and platform rewrites. It can call an operator-configured safe `https://` Chat Completions-compatible endpoint, masks credentials in all read models, records provider provenance, and falls back to `local_rules` on provider failure.

The audit, visibility, evidence-asset, content-generation, and publishing workflow foundation is an operational preparation layer, not live AI monitoring or publishing automation. It does not recursively crawl sites, render JavaScript-heavy pages, query ChatGPT Search, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP APIs, call indexing or external platform APIs, verify indexing, return raw provider or platform credentials, or publish to external platforms. v0.21 LLM execution is limited to the configured OpenAI-compatible content-generation endpoint. Future AI visibility and publishing integrations should enter through explicit connectors/providers and preserve the same audit/evidence/content/package/tracking/snapshot records as the UI contract.

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
