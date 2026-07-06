# Production v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GEO Pulse deployable as a controlled single-tenant v0.2 service with production guardrails, health checks, SEO/GEO baseline files, Docker artifacts, and deployment documentation.

**Architecture:** Keep the existing zero-dependency Node server and static admin shell. Add small server-level production validation and static operational routes, then document deployment and verify with the existing `verify-mvp.mjs` suite plus HTTP smoke checks.

**Tech Stack:** Node.js ES modules, built-in `http`, built-in `fs/promises`, existing mock data persistence, Docker for deployment packaging.

---

## File Structure

- Modify `server.mjs`: production startup validation, `/healthz`, static `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/favicon.ico`, content types, site URL helper.
- Modify `verify-mvp.mjs`: failing tests for production validation, health route, SEO/GEO static files, and favicon.
- Create `.env.example`: documented single-tenant deployment variables.
- Create `Dockerfile`: container build for the Node service.
- Create `docker-compose.yml`: single-service deployment with persistent `data/` volume.
- Create `docs/PRODUCTION_DEPLOYMENT.md`: production runbook, security boundary, reverse proxy requirement, backup notes, and verification checklist.
- Modify `docs/README.md` and `README.md`: link production deployment guide.

## Task 1: Production Verification Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [x] **Step 1: Add failing production checks**

Add tests that verify:

```js
function runProductionStartupChecks() {
  const missingSecret = spawnSync(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(4300 + Math.floor(Math.random() * 300)),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_INTERNAL_API_KEY: ""
    },
    encoding: "utf8"
  });
  assert.notEqual(missingSecret.status, 0, "Production startup should fail without a fixed API key");
  assert.match(
    `${missingSecret.stdout}\n${missingSecret.stderr}`,
    /GEO_INTERNAL_API_KEY/,
    "Production startup failure should mention GEO_INTERNAL_API_KEY"
  );
}
```

Extend HTTP checks to assert:

```js
const health = await httpRequest(port, "/healthz");
assert.equal(health.status, 200, "Health route should return 200");
assert.equal(health.body?.ok, true, "Health route should report ok");
assert.equal(Boolean(health.body?.internal_api_key), false, "Health route must not expose secrets");

const robots = await httpRequest(port, "/robots.txt");
assert.equal(robots.status, 200, "robots.txt should be served");
assert.match(robots.text, /Sitemap:/, "robots.txt should point to sitemap");

const sitemap = await httpRequest(port, "/sitemap.xml");
assert.equal(sitemap.status, 200, "sitemap.xml should be served");
assert.match(sitemap.text, /<urlset/, "sitemap should be XML urlset");

const llms = await httpRequest(port, "/llms.txt");
assert.equal(llms.status, 200, "llms.txt should be served");
assert.match(llms.text, /GEO Pulse/, "llms.txt should describe the product");

const favicon = await httpRequest(port, "/favicon.ico");
assert.equal(favicon.status, 200, "favicon should be served");
```

- [x] **Step 2: Run verification and confirm red**

Run:

```bash
npm run check
```

Expected: FAIL before implementation, because `/healthz`, production validation, and static SEO/GEO files do not exist yet.

## Task 2: Server Production Guardrails And Static GEO Files

**Files:**
- Modify: `server.mjs`

- [x] **Step 1: Add production config helpers**

Add constants:

```js
const isProduction = process.env.NODE_ENV === "production";
const publicSiteUrl = (process.env.GEO_PUBLIC_SITE_URL || `http://${host || "localhost"}:${port}`).replace(/\/+$/, "");
const minProductionApiKeyLength = 24;
```

Add startup validation:

```js
if (isProduction && explicitInternalApiKey.length < minProductionApiKeyLength) {
  console.error("NODE_ENV=production requires GEO_INTERNAL_API_KEY with at least 24 characters.");
  process.exit(1);
}
```

- [x] **Step 2: Add content types**

Extend `contentTypes`:

```js
".ico": "image/x-icon",
".txt": "text/plain; charset=utf-8",
".xml": "application/xml; charset=utf-8"
```

- [x] **Step 3: Add safe text response helper**

Add:

```js
function sendText(res, status, content, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  res.end(content);
}
```

- [x] **Step 4: Add health and static route generators**

Add route helpers for:

- `GET /healthz`
- `GET /robots.txt`
- `GET /sitemap.xml`
- `GET /llms.txt`
- `GET /favicon.ico`

The favicon can be a tiny generated ICO buffer or a minimal SVG served only if using a route. Prefer ICO response for `/favicon.ico`.

- [x] **Step 5: Run verification**

Run:

```bash
npm run check
```

Expected: PASS through new server checks, except Docker/docs checks are not yet added.

## Task 3: Deployment Artifacts And Documentation

**Files:**
- Create: `.env.example`
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/README.md`
- Modify: `README.md`

- [x] **Step 1: Add `.env.example`**

Include documented variables with safe placeholder values and comments.

- [x] **Step 2: Add Docker artifacts**

Create a Dockerfile that:

- uses a current Node image
- sets `NODE_ENV=production`
- copies project files
- exposes port 3000
- runs `node server.mjs`

Create compose file with:

- `GEO_INTERNAL_API_KEY` required through environment
- persistent `./data:/app/data`
- healthcheck hitting `/healthz`

- [x] **Step 3: Add deployment docs**

Document:

- production scope and explicit gaps
- reverse proxy auth / VPN / IP allowlist requirement
- environment variables
- Docker compose deployment
- data backup and restore
- verification checklist
- rollback notes

- [x] **Step 4: Link docs**

Add production guide links to `README.md` and `docs/README.md`.

## Task 4: Verification And Commit

**Files:**
- Verify all changed files.

- [x] **Step 1: Run full verification**

Run:

```bash
npm run check
```

Expected: PASS.

- [x] **Step 2: Run SEO static check**

Run:

```bash
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

Expected: no robots or sitemap warnings.

- [x] **Step 3: Run HTTP smoke against live server**

Run curl checks for:

- `/`
- `/healthz`
- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- `/favicon.ico`

Expected: all return 200.

- [x] **Step 4: Docker check**

Run Docker build if Docker is available:

```bash
docker build -t geo-pulse:v0.2 .
```

If Docker is unavailable, record that as an environment limitation, not a code pass.

- [x] **Step 5: Commit**

Commit production v0.2 slice:

```bash
git add server.mjs verify-mvp.mjs .env.example Dockerfile docker-compose.yml docs/PRODUCTION_DEPLOYMENT.md docs/README.md README.md docs/superpowers/plans/2026-07-06-production-v0-2.md
git commit -m "feat: add production v0.2 readiness"
```

## Self-Review

- Spec coverage: environment config, production validation, health, robots, sitemap, llms, favicon, Docker artifacts, deployment docs, security baseline, and verification are covered.
- Placeholder scan: no placeholders are required in the plan.
- Type consistency: health and static routes use plain Node server response helpers and existing process env config.

## Completion Evidence

- Commit: `57fb87b feat: add production v0.2 readiness`
- `npm run check`: `verify-mvp: OK`
- Google SEO static scan: `Errors: 0`, `Warnings: 0`
- Docker image: `geo-pulse:v0.2` built successfully
- Production container smoke: `GET /healthz` returned `ok: true`
