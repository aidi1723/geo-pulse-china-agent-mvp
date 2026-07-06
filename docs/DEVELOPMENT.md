# Development Guide

## Project Shape

GEO Pulse China Agent v0.3 is intentionally small:

- Runtime: Node.js ESM.
- Dependencies: none.
- Server entry: `server.mjs`.
- Data and mock actions: `mock-data.mjs`.
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
- `GEO_HOST`: bind host. Leave empty for local demo.
- `NODE_ENV=production`: enables production startup validation.
- `GEO_PUBLIC_SITE_URL`: public canonical site URL for generated `robots.txt`, `sitemap.xml`, and `llms.txt`.
- `GEO_DATA_FILE`: custom persistence file path.
- `GEO_ENABLE_PERSISTENCE`: enable or disable local JSON persistence.
- `GEO_INTERNAL_API_KEY`: fixed write API key.
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
- UI rendering for the prototype pages.
- Persistence, scheduler, audit, connector, source adapter, campaign, publishing, and visibility flows.

For behavior changes, add focused assertions to `verify-mvp.mjs` before changing implementation.

## UI Rules

Follow `DESIGN.md`:

- Dense operational admin interface.
- Dark surfaces, compact panels, status pills, tables, info rows, drawers, and split layouts.
- No marketing hero sections or decorative redesign.
- Preserve routing, data flow, and business behavior.

## Public Release Hygiene

Before committing or publishing:

- Run `npm run check`.
- Confirm `data/`, `.env`, local logs, and credentials are not included.
- Keep `LICENSE`, `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, and `CHANGELOG.md` current.
- Do not commit real third-party API keys or production endpoints.

## Documentation Rule

When behavior changes, update docs in the same change:

- Commands or environment variables: `README.md` and this guide.
- API routes: `README.md` and `API_REFERENCE.md`.
- Operational routes or deployment behavior: `README.md`, `PRODUCTION_DEPLOYMENT.md`, and `STAGE_V0_2_CLOSEOUT.md`.
- Extension seams: `ARCHITECTURE.md` and `EXTENDING.md`.
- Security behavior: `SECURITY.md`, `MAINTENANCE.md`, and `reports/security-hardening-log.md`.
- Release-visible changes: `CHANGELOG.md`.
