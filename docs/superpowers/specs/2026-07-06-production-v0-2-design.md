# Production v0.2 Design

## Goal

Move GEO Pulse from a local mock-first MVP to a single-tenant deployable v0.2 that can run safely on a server for controlled use.

This phase is not a full SaaS product. It should provide production startup guardrails, basic deployability, health checks, SEO/GEO baseline files, and operational documentation while preserving the current zero-dependency architecture as much as practical.

## Launch Scope

Target: single-tenant production deployment for one organization.

Supported in v0.2:

- One running instance.
- One organization/workspace.
- Fixed server-side secret configuration through environment variables.
- Local file persistence for development and demo mode.
- Production-ready startup validation and deployment documentation.
- Public static access to the admin shell only when deployment owner has intentionally exposed it.

Not supported in v0.2:

- Multi-tenant SaaS hosting.
- Full RBAC.
- Paid billing integration.
- Real LinkedIn, Reddit, Quora, Medium, YouTube, G2, Capterra, or CMS publishing.
- Real GPT, Gemini, Claude, Perplexity, or Copilot monitoring APIs.
- Production-grade analytics warehouse.
- Browser extension or distributed crawler deployment.

## Production Requirements

### 1. Environment Configuration

Add a committed `.env.example` documenting required and optional environment variables:

- `NODE_ENV`
- `PORT`
- `GEO_HOST`
- `GEO_ALLOW_REMOTE_ACCESS`
- `GEO_INTERNAL_API_KEY`
- `GEO_DATA_FILE`
- `GEO_ENABLE_PERSISTENCE`
- `GEO_ENABLE_AUTOMATION_SCHEDULER`
- `GEO_AUTOMATION_TICK_MS`
- `GEO_AUTOMATION_MAX_RUNS_PER_TICK`
- `GEO_DEFAULT_INDUSTRY_TOPIC`
- `GEO_MAX_BODY_BYTES`
- `GEO_MUTATION_RATE_LIMIT_PER_MINUTE`

Production startup must fail clearly when:

- `NODE_ENV=production` and `GEO_INTERNAL_API_KEY` is missing or too short.
- Remote access is enabled without a fixed internal API key.

### 2. Health And Runtime Checks

Add a read-only health route:

- `GET /healthz`

The response should include:

- `ok: true`
- version
- persistence mode
- scheduler enabled state
- timestamp

It must not expose secrets.

### 3. SEO/GEO Baseline Files

Add static baseline files:

- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- `/favicon.ico`

The first version may use a configurable site URL defaulting to `http://localhost:3000`.

The files should remove current static SEO warnings:

- no missing robots file
- no missing sitemap file
- no missing favicon browser error

### 4. Deployment Artifacts

Add deployment support:

- `Dockerfile`
- `docker-compose.yml`
- production deployment guide under `docs/`

The deployment should support:

- app port binding
- persistent `data/` volume
- fixed `GEO_INTERNAL_API_KEY`
- health check command

### 5. Security Baseline

Keep current safeguards and document them:

- mutation API key required for writes
- remote access disabled by default
- remote access requires fixed API key
- private and loopback remote provider endpoints blocked
- body size limit
- mutation rate limit
- audit CSV formula neutralization

Do not add real user login in v0.2 unless the implementation remains small and testable. If login is deferred, document that deployment must be protected by reverse proxy authentication, VPN, IP allowlist, or another external access layer.

### 6. Verification

Required checks:

- `npm run check`
- HTTP smoke test for `/`, `/healthz`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/favicon.ico`
- static SEO check has no robots or sitemap warnings
- browser check for the admin shell and `国际 GEO`
- Docker build or documented reason if Docker is unavailable in the environment

## Acceptance Criteria

- Production environment variables are documented in `.env.example`.
- Production startup fails with a clear message when required secrets are missing.
- `/healthz` returns safe runtime status.
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/favicon.ico` are served.
- Deployment artifacts exist and document persistent data.
- The project verification suite passes.
- Known production gaps are explicitly documented rather than implied complete.
