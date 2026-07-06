# Changelog

## 0.10.0 - 2026-07-06

Site GEO audit and asset generation.

### Added

- Rule-first International GEO site audit records with stable check ids, score, status, summary, and audit events.
- API routes for creating, listing, reading, and generating assets from site GEO audits.
- Copyable GEO asset previews for `llms.txt`, Organization JSON-LD, Product JSON-LD, FAQ JSON-LD, article briefs, and distribution briefs.
- International GEO UI workflow for site input -> audit -> checks -> generated assets.

### Boundaries

- v0.10 does not perform live crawling, real AI search engine querying, real SERP collection, or automatic third-party publishing.

### Verification

- `npm run check`
- Static SEO scan
- GitHub Actions `check`

## 0.9.1 - 2026-07-06

Minimal CI gate for GitHub-hosted development.

### Added

- GitHub Actions workflow that runs `npm run check` on pushes and pull requests targeting `main`.
- Development, maintenance, deployment, architecture, roadmap, and closeout documentation for the CI quality gate.
- Public-release hygiene cleanup for a phone-shaped demo contact placeholder in `reports/agentcoreos-geo-report.md`.

### Verification

- `npm run check`

## 0.9.0 - 2026-07-06

Built-in multi-user access for one-organization team deployment.

### Added

- Username/password login with HTTP-only browser sessions.
- Role-based permissions for owner, admin, editor, and viewer.
- Settings user management for creating, disabling, and resetting users.
- Access audit events for login, logout, permission denial, and user changes.
- Launch preflight checks for user authentication and session security.

### Changed

- Admin workspace API reads now require a valid session or system API key.
- Browser client config no longer exposes the startup mutation API key.

### Boundaries

- v0.9 does not add multi-tenant SaaS isolation, OAuth/SSO, MFA, database persistence, email invitations, or per-seat billing.

### Verification

- `npm run check`

## 0.8.0 - 2026-07-06

Single-user launch preflight snapshot.

### Added

- Read-only launch preflight route at `/api/v1/system/preflight`.
- Preflight summary embedded in `/api/v1/system/runtime`.
- Settings runtime UI section for overall launch status, score, blockers, warnings, and check rows.
- Preflight checks for persistence, mutation auth, remote access boundary, backup recovery, connectors, GEO static routes, and scheduler state.
- Browser action to refresh launch preflight from the settings page.

### Changed

- Project status is now documented as v0.8 single-user launch-readiness with launch preflight.

### Boundaries

- v0.8 does not add external network probing, TLS validation, reverse proxy detection, automated remediation, or multi-tenant readiness checks.

### Verification

- `npm run check`

## 0.7.0 - 2026-07-06

Single-user backup import and recovery snapshot.

### Added

- Import validation for downloaded `geo-pulse-runtime-backup` JSON artifacts.
- Runtime backup import action that stores imported artifacts under a new local backup id while preserving the source backup id.
- API routes for `/api/v1/system/backups/import/validate` and `/api/v1/system/backups/import`.
- Settings UI textarea and actions for validating and importing downloaded backup JSON.
- Audit events for backup import validation and import.

### Changed

- Restore now preserves backup-related audit events from the current runtime before hydrating a backup snapshot, so import evidence remains visible after restore.
- Project status is now documented as v0.7 single-user launch-readiness with backup import/restore.

### Boundaries

- v0.7 does not add cloud backup, encrypted archives, streaming file uploads, multi-user restore approval, or production database backups.

### Verification

- `npm run check`

## 0.6.0 - 2026-07-06

Single-user maintenance backup and restore snapshot.

### Added

- Local runtime backup creation, listing, download, validation, and restore actions.
- API routes under `/api/v1/system/backups` for backup operations.
- Settings runtime UI section for local backup metadata and operator actions.
- Runtime backup summary in `/api/v1/system/runtime`.
- Audit events for backup create, validate, and restore operations.

### Changed

- Project status is now documented as v0.6 single-user launch-readiness with local backup/restore.
- Deployment docs now prefer the built-in backup flow before manual JSON file copy fallback.

### Boundaries

- v0.6 still uses local JSON state, not a production database, encrypted vault, cloud backup service, or multi-user restore approval workflow.

### Verification

- `npm run check`

## 0.5.0 - 2026-07-06

Single-user connector diagnostics snapshot.

### Added

- Connector diagnostics that combine endpoint safety, credential status, latest health check, permission decisions, recent audit events, and related run steps.
- Diagnostic readiness scores, status labels, recommended operator actions, and latest diagnostic output on connector details.
- API routes for running and listing connector diagnostics.
- Settings UI diagnostic action and compact diagnostic panel for connector run visibility.
- Audit events for connector diagnostic runs.

### Changed

- Project status is now documented as v0.5 single-user launch-readiness with connector diagnostics.
- Seed automation run steps now reference the real `firecrawl_source` connector instead of an older mock connector placeholder.

### Boundaries

- v0.5 still does not add real OAuth, real external publishing, production credential vaults, background queues, or multi-tenant SaaS isolation.

### Verification

- `npm run check`

## 0.4.0 - 2026-07-06

Single-user integration-readiness snapshot.

### Added

- Editable automation connector configs for endpoint, enabled state, API key, timeout, retry count, status, and notes.
- Connector connection tests for `mock://` simulations and guarded `https://` endpoints.
- Connector health-check history, latest health state on connector details, and runtime health summaries.
- API routes for connector save, connector test, and connector health-check listing.
- Settings UI connector drawer with masked secrets, permission boundaries, save action, and test action.
- Audit events for connector updates and connector tests.

### Changed

- Project status is now documented as v0.4 integration-ready for one local/single-tenant operator.
- Connector state is included in local persistence so saved configs and health checks survive restarts.

### Boundaries

- v0.4 does not add real OAuth, real external publishing, production credential vaults, background queues, or multi-tenant SaaS isolation.

### Verification

- `npm run check`

## 0.3.0 - 2026-07-06

Single-user complete v0.3 snapshot.

### Added

- Local-first workspace input for website, product, market, audience, competitors, and differentiators.
- Manual topic creation, topic editing, outline generation, manual article creation, and content template creation.
- Export jobs and downloadable CSV/JSON artifacts for single-user workflows.
- International GEO state, local readiness audit, `llms.txt` generation, JSON-LD recommendation, and distribution brief generation.
- Local billing plan switch and safe single-user logout action.
- Browser wiring for content creation, exports, International GEO audit/artifacts, billing upgrade, and logout.
- Regression tests for v0.3 data actions, HTTP routes, source dead-end checks, and UI workflow labels.

### Changed

- Project status is now documented as v0.3 single-user complete, while still single-tenant and local-first.
- Disabled "coming soon" and read-only primary workflow buttons were replaced with working local actions.

### Verification

- `npm run check`

## 0.2.0 - 2026-07-06

Single-tenant deployable v0.2 snapshot.

### Added

- International GEO workspace for overseas AI search readiness, content distribution planning, and engine visibility tracking.
- Coverage for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, Microsoft Copilot, and related AI search surfaces in the international GEO view.
- Production startup guardrails for `NODE_ENV=production`, including required `GEO_INTERNAL_API_KEY` validation.
- Operational routes for `/healthz`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/favicon.ico`.
- Dockerfile, Docker Compose profile, `.env.example`, and production deployment guide.
- v0.2 stage closeout documentation with launch boundary, verification evidence, and remaining post-v0.2 gaps.

### Changed

- Project status is now documented as v0.2 single-tenant deployable instead of local-only MVP.
- Roadmap and maintenance docs separate completed deployability work from future SaaS hardening.

### Verification

- `npm run check`
- Google SEO static scan with zero errors and zero warnings.
- Docker image build for `geo-pulse:v0.2`.
- Production container smoke test through `/healthz`.

## 0.1.0 - 2026-07-05

Initial open-source-ready MVP snapshot.

### Added

- Zero-dependency Node server and browser admin prototype.
- Mock API surface for dashboard, keywords, source strategies, articles, publishing, analytics, billing, settings, providers, connectors, prompt traces, and audit logs.
- Local JSON persistence with atomic file replacement.
- Automation provider registry, connector registry, connector permission matrix, and source adapter contracts.
- Structured automation run steps, visibility collection runs, campaign runs, publishing approval guard, and audit CSV export.
- Security hardening for mutation API keys, remote access guard, CORS/CSP basics, request size limits, rate limits, SSRF checks, and CSV formula neutralization.
- GPLv3 license, contribution guide, security policy, development guide, maintenance guide, and open-source release checklist.
- Maintainer documentation for architecture, API reference, extension workflow, documentation index, and roadmap.
- Privacy release review process for public-branch scans, cleanup rules, and history-rewrite handling.

### Verification

- `npm run check` is the release gate for the MVP.
