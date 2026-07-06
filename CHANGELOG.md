# Changelog

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
