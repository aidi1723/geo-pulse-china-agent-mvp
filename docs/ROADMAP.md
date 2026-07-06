# Roadmap

## Current State

The project is a v0.7 single-user launch-ready workspace with connector diagnostics and local backup import/restore.

Completed mock-first product areas:

- Dashboard and admin shell.
- Keyword library, GEO topic map, media source library, crawl jobs, source strategies, and source adapter contracts.
- Topic ideas, articles, reviews, prompt templates, and content quality traces.
- Publishing tasks, publishing calendar, variants, readiness checks, approval guard, channels, and records.
- Automation provider registry, connector registry, connector-scoped permissions, automation runs, scheduler, retry, and runtime status.
- Visibility analytics, mock SERP collection, competitor share-of-voice, audience segments, marketing campaigns, and campaign runs.
- Audit events, audit CSV export, local persistence, reset, security headers, body limits, rate limits, and remote access guard.
- International GEO workspace for overseas AI search readiness, content generation planning, distribution execution, and AI engine visibility.
- Production guardrails, `/healthz`, `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico`, Docker, Docker Compose, and deployment documentation.
- Single-user complete workflows: workspace input, manual topics, topic editing, outline generation, manual articles, templates, exports, International GEO audit/artifacts, local billing plan switch, and logout action.
- Integration-readiness workflows: connector config editing, connector connection tests, connector health checks, masked secrets, runtime connector health summaries, and connector audit events.
- Connector diagnostics: readiness scoring, permission decision summaries, audit context, recommended actions, and recent connector run-step visibility.
- Local runtime backup import/restore: create, list, download, validate, import downloaded artifacts, restore, runtime backup summary, and audit events.
- Open-source release docs and GPLv3 licensing.

## Near-Term Maintenance

These items keep v0.7 healthy without changing its architecture:

- Keep `npm run check` passing.
- Expand `verify-mvp.mjs` when new behavior is added.
- Keep README, API reference, extension guide, and changelog aligned.
- Review public issues for documentation gaps and reproduction quality.
- Keep `data/` and local environment files out of Git.

## Next Product Slices

These can be built mock-first before real integrations:

1. Source adapter implementation stubs per contract.
   - Add explicit adapter runners behind `sourceAdapterContracts`.
   - Keep evidence and error taxonomy visible in crawl jobs.

2. Connector run detail drawer.
   - Expand from connector-level diagnostics into per-run drilldown when a workflow has multiple connectors.

3. Prompt regression dataset.
   - Store sample inputs, expected criteria, generated outputs, and quality score history.

4. Minimal CI.
   - Run `npm run check` on pull requests.

## Post-v0.7 Production Hardening

These are required before using the project as a real SaaS or broadly exposed hosted service:

- Real authentication and role-based authorization.
- Database-backed persistence and migrations.
- Database-grade backup and restore procedures beyond the current local JSON snapshot flow.
- Production logging, metrics, and alerting.
- Secret management outside source code and local JSON.
- Real source adapters, providers, and connectors.
- Tenant/workspace isolation if multiple organizations use the service.
- Incident response owner and security contact.
- Data retention, deletion, and privacy policy.

## Non-Goals For v0.7

- Production multi-tenant hosting.
- Real third-party credential management.
- Real OAuth authorization flows.
- Real external CMS, social, email, SERP, or analytics publishing/collection.
- Full workflow graph editor.
- Paid billing integration.
- Browser extension or crawler deployment.
- Replacing production SEO, email, CMS, or social tools.

## Release Versioning

Current public snapshot: `0.7.0`.

Suggested version policy:

- Patch: documentation, tests, small UI fixes, seed data corrections.
- Minor: new mock-first domain capability, new API group, or new extension seam.
- Major: production storage/auth changes or breaking API changes.
