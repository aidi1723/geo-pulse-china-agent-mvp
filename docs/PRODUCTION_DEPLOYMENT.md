# Production Deployment Guide

This guide covers the v0.3 single-user, single-tenant deployment profile for GEO Pulse.

For stage-level scope and closing language, see [v0.3 Stage Closeout](STAGE_V0_3_CLOSEOUT.md).

## Scope

This deployment profile is suitable for one organization running one controlled instance. It is not a multi-tenant SaaS profile.

Supported:

- Fixed environment configuration.
- Persistent local JSON state under `data/`.
- Health checks.
- Mutation API-key guard.
- Basic SEO/GEO files: `robots.txt`, `sitemap.xml`, `llms.txt`, and `favicon.ico`.
- Docker and Docker Compose deployment.

Not included:

- Built-in user login.
- Full RBAC.
- Payment billing.
- Real third-party publishing credentials.
- Real GPT, Gemini, Claude, Perplexity, or Copilot monitoring APIs.
- Multi-tenant workspace isolation.

## Security Boundary

The app must be protected by an external access layer before internet exposure:

- reverse proxy authentication,
- VPN,
- IP allowlist,
- private network access,
- or another deployment-owner-controlled access system.

Set a long random `GEO_INTERNAL_API_KEY`. All write APIs require `X-GEO-API-Key`.

Do not expose the app publicly without an access layer. `GEO_ALLOW_REMOTE_ACCESS=1` only allows the Node process to accept non-local requests; it is not user authentication.

## Environment

Copy `.env.example` and replace placeholder values:

```bash
cp .env.example .env
```

Required production values:

- `NODE_ENV=production`
- `GEO_HOST=0.0.0.0`
- `GEO_PUBLIC_SITE_URL=https://your-domain.example`
- `GEO_ALLOW_REMOTE_ACCESS=1`
- `GEO_INTERNAL_API_KEY=<long-random-secret>`
- `GEO_ENABLE_PERSISTENCE=1`
- `GEO_DATA_FILE=/app/data/geo-pulse-state.json`

Production startup fails when `GEO_INTERNAL_API_KEY` is missing or shorter than 24 characters.

## Docker Compose

Start:

```bash
docker compose --env-file .env up -d --build
```

Check status:

```bash
docker compose ps
curl -f http://localhost:3000/healthz
```

Stop:

```bash
docker compose down
```

## Local Production Smoke Test

```bash
NODE_ENV=production \
GEO_HOST=127.0.0.1 \
GEO_ALLOW_REMOTE_ACCESS=1 \
GEO_INTERNAL_API_KEY=replace-with-at-least-24-random-characters \
GEO_ENABLE_PERSISTENCE=1 \
node server.mjs
```

Then check:

```bash
curl -f http://localhost:3000/healthz
curl -f http://localhost:3000/robots.txt
curl -f http://localhost:3000/sitemap.xml
curl -f http://localhost:3000/llms.txt
curl -f http://localhost:3000/favicon.ico
```

## Backup And Restore

The v0.3 deployment stores state in a local JSON file.

Backup:

```bash
cp data/geo-pulse-state.json "data/geo-pulse-state.$(date +%Y%m%d-%H%M%S).json"
```

Restore:

```bash
docker compose down
cp data/geo-pulse-state.backup.json data/geo-pulse-state.json
docker compose up -d
```

Keep backups outside the application host if this service becomes operationally important.

## Verification Checklist

Before handoff:

```bash
npm run check
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
curl -f http://localhost:3000/healthz
curl -f http://localhost:3000/robots.txt
curl -f http://localhost:3000/sitemap.xml
curl -f http://localhost:3000/llms.txt
curl -f http://localhost:3000/favicon.ico
```

If Docker is available:

```bash
docker build -t geo-pulse:v0.3 .
```

## Stage Closeout Language

GEO Pulse v0.3 is ready for controlled single-user, single-tenant deployment. It includes complete local workflows, production startup guardrails, health checks, GEO/SEO static files, Docker packaging, and documentation for backup and rollback. It must still be protected by an external access layer and should not be presented as a complete SaaS platform until built-in multi-user login, RBAC, durable database storage, real integrations, monitoring, and multi-tenant controls are implemented.

## Rollback

For application rollback, redeploy the previous Git commit and restart the service.

For data rollback, stop the service, restore the previous JSON state file, and start the service again.
