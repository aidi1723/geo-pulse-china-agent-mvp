# Roadmap

## Current State

The project is a v0.12.0 one-organization team-access workspace with built-in login, RBAC, connector diagnostics, local backup import/restore, launch preflight, International GEO site audit, guarded live crawl evidence, evidence-backed scoring, generated GEO assets, and minimal GitHub CI.

Completed mock-first product areas:

- Dashboard and admin shell.
- Keyword library, GEO topic map, media source library, crawl jobs, source strategies, and source adapter contracts.
- Topic ideas, articles, reviews, prompt templates, and content quality traces.
- Publishing tasks, publishing calendar, variants, readiness checks, approval guard, channels, and records.
- Automation provider registry, connector registry, connector-scoped permissions, automation runs, scheduler, retry, and runtime status.
- Visibility analytics, mock SERP collection, competitor share-of-voice, audience segments, marketing campaigns, and campaign runs.
- Audit events, audit CSV export, local persistence, reset, security headers, body limits, rate limits, and remote access guard.
- International GEO workspace for overseas AI search readiness, rule-first and crawl-evidenced site audits, generated GEO assets, content generation planning, distribution execution, and AI engine visibility models.
- Production guardrails, `/healthz`, `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico`, Docker, Docker Compose, and deployment documentation.
- Single-user complete workflows: workspace input, manual topics, topic editing, outline generation, manual articles, templates, exports, International GEO audit/artifacts, local billing plan switch, and logout action.
- Integration-readiness workflows: connector config editing, connector connection tests, connector health checks, masked secrets, runtime connector health summaries, and connector audit events.
- Connector diagnostics: readiness scoring, permission decision summaries, audit context, recommended actions, and recent connector run-step visibility.
- Local runtime backup import/restore: create, list, download, validate, import downloaded artifacts, restore, runtime backup summary, and audit events.
- Launch preflight: persistence, mutation auth, remote access, backup recovery, connectors, GEO static routes, and scheduler readiness.
- Multi-user access: owner/admin/editor/viewer roles, HTTP-only sessions, user management, login/logout audit events, and permission enforcement.
- Minimal CI: GitHub Actions runs `npm run check` on pushes and pull requests targeting `main`.
- Site GEO audit and assets: website/product input, deterministic check-level recommendations, durable audit records, and copyable `llms.txt`, JSON-LD, FAQ, article brief, and distribution brief assets.
- Live site crawl evidence: guarded homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt` fetches with evidence snapshots and evidence-aware check rows.
- Evidence-backed GEO scoring: deterministic 100-point rubric, check-level awarded/deducted points, confidence, priority, deduction reasons, next actions, audit-level `score_breakdown`, and International GEO `评分拆解` UI.
- Open-source release docs and GPLv3 licensing.

## Near-Term Maintenance

These items keep v0.12.0 healthy without changing its architecture:

- Keep `npm run check` passing.
- Expand `verify-mvp.mjs` when new behavior is added.
- Keep README, API reference, extension guide, and changelog aligned.
- Review public issues for documentation gaps and reproduction quality.
- Keep `data/` and local environment files out of Git.

## Next Product Slices

These are the immediate product slices. The full second-stage direction is tracked in [Phase 2 Roadmap](PHASE_2_ROADMAP.md).

1. AI visibility monitoring connector.
   - Add explicit connectors for approved SERP or AI visibility providers before claiming real engine inclusion.
   - Track ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, and Copilot prompts as measured snapshots.

2. Source adapter implementation stubs per contract.
   - Add explicit adapter runners behind `sourceAdapterContracts`.
   - Keep evidence and error taxonomy visible in crawl jobs.

3. Connector run detail drawer.
   - Expand from connector-level diagnostics into per-run drilldown when a workflow has multiple connectors.

4. Prompt regression dataset.
   - Store sample inputs, expected criteria, generated outputs, and quality score history.

## Phase 2 Direction

Phase 2 should move the product from v0.12 evidence-scored audit preparation to broader measured GEO operations:

- AI visibility monitoring through approved data sources.
- Content and GEO asset generation from crawl evidence and prompt gaps.
- External distribution connectors with manual approval gates.
- Multi-user production hardening with database persistence, durable secrets, monitoring, and audit retention.
- Multi-tenant SaaS readiness only after the one-organization deployment model is hardened.

Phase 2 must preserve a clear distinction between rule-first recommendations, crawl-evidenced findings, and measured external visibility data.

## Post-v0.12 Production Hardening

These are required before using the project as a real SaaS or broadly exposed hosted service:

- Database-backed persistence and migrations.
- Database-grade backup and restore procedures beyond the current local JSON snapshot flow.
- Production logging, metrics, and alerting.
- Secret management outside source code and local JSON.
- Real source adapters, providers, and connectors.
- Real AI visibility data sources and external publishing connectors before presenting engine inclusion or recommendation tracking as measured facts.
- Tenant/workspace isolation if multiple organizations use the service.
- OAuth/SSO and MFA if the deployment requires external identity integration.
- Incident response owner and security contact.
- Data retention, deletion, and privacy policy.

## Non-Goals For v0.12

- Production multi-tenant hosting.
- Real third-party credential management.
- Real OAuth authorization flows.
- MFA.
- Real external CMS, social, email, SERP, or analytics publishing/collection.
- Real ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, or Copilot querying.
- Automatic third-party community or CMS publishing.
- Full workflow graph editor.
- Paid billing integration.
- Recursive crawler deployment or browser-rendering crawler service.
- Replacing production SEO, email, CMS, or social tools.

## Release Versioning

Current public snapshot: `0.12.0`.

Suggested version policy:

- Patch: documentation, tests, small UI fixes, seed data corrections.
- Minor: new mock-first domain capability, new API group, or new extension seam.
- Major: production storage/auth changes or breaking API changes.
