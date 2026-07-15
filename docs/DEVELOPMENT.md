# Development Guide

## Project Shape

GEO Pulse China Agent v0.21.0 is intentionally small:

- Runtime: Node.js ESM.
- Dependencies: none.
- Server entry: `server.mjs`.
- Data and mock actions: `mock-data.mjs`.
- Safe site crawler: `site-crawl.mjs`.
- Provider adapter registry: `automation-providers.mjs`.
- Browser prototype: `prototype/`.
- Regression gate: `verify-mvp.mjs`.
- Deployment artifacts: `Dockerfile`, `docker-compose.yml`, `.env.example`.

The codebase favors explicit mock contracts over framework abstractions. Keep that style unless a maintainer approves a larger change.

Related docs:

- [Architecture Guide](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Extension Guide](EXTENDING.md)
- [Maintenance Guide](MAINTENANCE.md)

## Local Setup

Use Node.js 20 or newer.

```bash
npm run check
npm start
```

Open:

```text
http://localhost:3000/
```

Runtime state is written to `data/geo-pulse-state.json` by default. The `data/` directory is ignored for open-source publication.

## Useful Environment Variables

- `PORT`: local server port, default `3000`.
- `GEO_HOST`: bind host, default `127.0.0.1`; use `0.0.0.0` only for intentional remote/container binding.
- `NODE_ENV=production`: enables production startup validation.
- `GEO_PUBLIC_SITE_URL`: public canonical site URL for generated `robots.txt`, `sitemap.xml`, and `llms.txt`.
- `GEO_DATA_FILE`: custom persistence file path.
- `GEO_ENABLE_PERSISTENCE`: enable or disable local JSON persistence.
- `GEO_INTERNAL_API_KEY`: fixed write API key.
- `GEO_BOOTSTRAP_OWNER_PASSWORD`: first owner password for production bootstrap.
- `GEO_SESSION_TTL_MS`: browser session lifetime in milliseconds.
- `GEO_ALLOW_REMOTE_ACCESS=1`: enable non-local access. Requires `GEO_INTERNAL_API_KEY`.
- `GEO_ENABLE_AUTOMATION_SCHEDULER=1`: enable scheduler.
- `GEO_AUTOMATION_TICK_MS`: scheduler interval.
- `GEO_AUTOMATION_MAX_RUNS_PER_TICK`: max strategy runs per tick.
- `GEO_MAX_BODY_BYTES`: JSON body limit.
- `GEO_MUTATION_RATE_LIMIT_PER_MINUTE`: write rate limit.

## Testing Rules

Run:

```bash
npm run check
```

This checks:

- Node syntax for key files.
- Mock data behavior.
- API and security behavior through local HTTP tests.
- UI rendering for the prototype pages, including International GEO site audit, crawl evidence, score breakdown, visibility panels, prompt snapshots, `导入测量证据`, `批量导入测量证据`, `测量证据台账`, `证据复核`, `可见度趋势`, `可见度 Provider 配置`, `Provider 诊断`, `Provider 运行边界`, evidence asset opportunities, queue state, review state, asset previews, article generation queue, platform rewrite queue, generation runs, high-authority publishing platform list, `发布连接器配置`, `发布连接器诊断`, `发布运行边界`, package queue, manual tracking panels, Settings `生产运行就绪`, and Settings `交付中心` panels.
- Persistence, scheduler, audit, connector, source adapter, campaign, publishing, visibility, production readiness, delivery readiness, sanitized delivery bundle, and International GEO site audit/crawl evidence/visibility/evidence-import/evidence-operations/evidence-asset/content-generation/publishing/integration-foundation flows.

For behavior changes, add focused assertions to `verify-mvp.mjs` before changing implementation.

Frontend data changes must update the relevant page plan in `prototype/src/api.js` instead of restoring an all-domain bootstrap. A navigation action must await `refreshCurrentPage()`, and a mutation should refresh only the active page plus shared runtime data.

UI changes must preserve `DESIGN.md`, mobile module navigation, zero document-level horizontal overflow, visible `:focus-visible` states, reduced-motion behavior, and an associated label or explicit accessible name for every rendered form control. Shared tokens and primitives should be changed before page-local CSS.

## GitHub CI

The repository includes `.github/workflows/check.yml`.

It runs on pushes and pull requests targeting `main`:

```text
actions/checkout@v7
actions/setup-node@v6 with Node.js 20
npm run check
```

Keep CI aligned with the local gate. If `npm run check` changes, update this guide and the workflow in the same change.

## UI Rules

Follow `DESIGN.md`:

- Dense operational admin interface.
- Dark surfaces, compact panels, status pills, tables, info rows, drawers, and split layouts.
- No marketing hero sections or decorative redesign.
- Preserve routing, data flow, and business behavior.

## Public Release Hygiene

Before committing or publishing:

- Run `npm run check`.
- Confirm the GitHub `check` workflow passes after pushing.
- Confirm `data/`, `.env`, local logs, and credentials are not included.
- Keep `LICENSE`, `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, and `CHANGELOG.md` current.
- Do not commit real third-party API keys or production endpoints.

## Documentation Rule

When behavior changes, update docs in the same change:

- Commands or environment variables: `README.md` and this guide.
- API routes: `README.md` and `API_REFERENCE.md`.
- International GEO workflow changes: `README.md`, `API_REFERENCE.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `PHASE_2_ROADMAP.md`, `PRODUCTION_DEPLOYMENT.md`, and the current stage closeout doc.
- Visibility measurement changes: document `measured`, `simulated`, and `unavailable` semantics, manual human-entered evidence requirements, import ledger/review/trend behavior, future provider evidence requirements, approved-only trend rules, and any no-real-provider boundary in the same change.
- Evidence asset changes: document that generated opportunities, queue items, local previews, and approve/reject state create reviewable local assets only, with no external publishing, no full long-form articles, and no live AI search inclusion/ranking measurement.
- Content generation changes: document that `local_rules` remains the deterministic fallback and that the OpenAI-compatible provider can generate reviewable International GEO article drafts and platform rewrites only after an operator configures endpoint, model, and API key.
- Publishing workflow changes: document that high-authority platform list rows, package queue items, and tracking records are local planning/handoff only; platform notes only describe channels that may increase AI retrieval, citation, and recommendation probability, with no external publishing, no external credentials, no full long-form article generation, no live AI/search/SERP/indexing verification, and manual/local tracking unless future connector evidence exists.
- Production integration foundation changes: document that visibility provider configs, publishing connector configs, dry-run tests, diagnose-all actions, production readiness, masked secret inventory, and handoff checklist rows are local preparation only, with no live AI/search/SERP/indexing/provider/CMS/social/community calls, no automatic publishing, and no raw credential exposure.
- Delivery hardening changes: document delivery readiness, sanitized delivery bundle export, Settings `交付中心`, sensitive bundle read permissions, and the distinction between delivery bundles and runtime backups.
- Operational routes or deployment behavior: `README.md`, `PRODUCTION_DEPLOYMENT.md`, and `STAGE_V0_2_CLOSEOUT.md`.
- Extension seams: `ARCHITECTURE.md` and `EXTENDING.md`.
- Security behavior: `SECURITY.md`, `MAINTENANCE.md`, and `reports/security-hardening-log.md`.
- Release-visible changes: `CHANGELOG.md`.
