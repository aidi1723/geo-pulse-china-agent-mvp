# Production Deployment Guide

This guide covers the v0.9 one-organization team-access deployment profile for GEO Pulse.

For stage-level scope and closing language, see [v0.9 Stage Closeout](STAGE_V0_9_CLOSEOUT.md).

## Scope

This deployment profile is suitable for one organization running one controlled instance. It is not a multi-tenant SaaS profile.

Supported:

- Fixed environment configuration.
- Persistent local JSON state under `data/`.
- Built-in local runtime backup, download, import validation, import, and restore.
- Built-in login, HTTP-only browser sessions, and owner/admin/editor/viewer roles.
- Built-in launch preflight for persistence, auth, session security, remote access, backup recovery, connectors, GEO static routes, and scheduler state.
- Health checks.
- Mutation API-key guard.
- Basic SEO/GEO files: `robots.txt`, `sitemap.xml`, `llms.txt`, and `favicon.ico`.
- Docker and Docker Compose deployment.

Not included:

- Multi-tenant workspace isolation.
- OAuth/SSO and MFA.
- Payment billing.
- Real third-party publishing credentials.
- Real GPT, Gemini, Claude, Perplexity, or Copilot monitoring APIs.
- Email invitations or self-service signup.

## Security Boundary

The app includes built-in login, but it must still be protected by an external access layer before internet exposure:

- reverse proxy authentication,
- VPN,
- IP allowlist,
- private network access,
- or another deployment-owner-controlled access system.

Set a long random `GEO_INTERNAL_API_KEY` for scripts and automation. Browser users should use the built-in login flow.

Do not expose the app publicly without an access layer. `GEO_ALLOW_REMOTE_ACCESS=1` only allows the Node process to accept non-local requests; it is not a replacement for HTTPS, reverse proxy controls, VPN, or IP allowlists.

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
- `GEO_BOOTSTRAP_OWNER_PASSWORD=<change-me-before-first-login>`
- `GEO_ENABLE_PERSISTENCE=1`
- `GEO_DATA_FILE=/app/data/geo-pulse-state.json`

Production startup fails when `GEO_INTERNAL_API_KEY` is missing or shorter than 24 characters. Production startup also requires `GEO_BOOTSTRAP_OWNER_PASSWORD` for first owner bootstrap.

First login:

- Username: `owner`
- Password: the value of `GEO_BOOTSTRAP_OWNER_PASSWORD`

After first login, create named admin/editor/viewer accounts in Settings -> Brand Knowledge -> User Management and rotate the bootstrap password through the user reset flow.

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

The v0.9 deployment stores state in a local JSON file and provides built-in local backup controls in Settings -> Brand Knowledge -> Runtime and Data.

Preferred operator flow:

1. Open the settings runtime panel.
2. Create a local backup.
3. Validate the backup.
4. Download the JSON artifact and store it outside the application host.
5. If the local state file is lost, paste the downloaded artifact into the import area and validate it.
6. Import the validated artifact.
7. Restore from the imported backup when local state needs to roll back.

The same flow is available through:

```text
POST /api/v1/system/backups
GET /api/v1/system/backups
POST /api/v1/system/backups/import/validate
POST /api/v1/system/backups/import
GET /api/v1/system/backups/:id/download
POST /api/v1/system/backups/:id/validate
POST /api/v1/system/backups/:id/restore
```

Manual file fallback:

```bash
cp data/geo-pulse-state.json "data/geo-pulse-state.$(date +%Y%m%d-%H%M%S).json"
```

Manual file restore fallback:

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

Also check the launch preflight route:

```bash
curl -f -H "X-GEO-API-Key: $GEO_INTERNAL_API_KEY" http://localhost:3000/api/v1/system/preflight
```

If Docker is available:

```bash
docker build -t geo-pulse:v0.9 .
```

## Stage Closeout Language

GEO Pulse v0.9 is ready for controlled one-organization team deployment. It includes built-in login, role-based access, local workflows, connector configuration, connector testing, connector diagnostics, local backup import/restore, launch preflight, production startup guardrails, health checks, GEO/SEO static files, Docker packaging, and documentation for rollback. It must still be protected by an external access layer and should not be presented as a complete SaaS platform until durable database storage, OAuth/SSO, MFA, real integrations, monitoring, and multi-tenant controls are implemented.

## Rollback

For application rollback, redeploy the previous Git commit and restart the service.

For data rollback, stop the service, restore the previous JSON state file, and start the service again.
