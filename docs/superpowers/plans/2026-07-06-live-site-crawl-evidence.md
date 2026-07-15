# Live Site Crawl Evidence v0.11 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guarded live site crawling and evidence snapshots to International GEO site audits.

**Architecture:** Add a focused `site-crawl.mjs` module for safe URL validation, SSRF protection, limited fetching, and HTML/robots/sitemap/llms extraction. Store crawl evidence on existing International GEO site audit records in `mock-data.mjs`, expose one crawl route in `server.mjs`, and render the evidence in the existing dense International GEO workspace.

**Tech Stack:** Node.js ESM, built-in `fetch`, `dns/promises`, zero runtime dependencies, existing HTTP session/RBAC guard, vanilla browser prototype, `verify-mvp.mjs`, GitHub Actions `npm run check`.

---

## File Map

- Create: `site-crawl.mjs` for safe crawl validation, fetch limits, resource extraction, and synthetic crawl application helpers.
- Modify: `mock-data.mjs` for `crawl_evidence`, evidence-aware checks, crawl action, audit events, and exports.
- Modify: `server.mjs` for `POST /api/v1/international-geo/site-audits/:id/crawl`.
- Modify: `verify-mvp.mjs` for red tests covering crawl safety, evidence-aware checks, RBAC, and UI rendering.
- Modify: `prototype/src/api.js` for crawl API wrapper.
- Modify: `prototype/src/main.js` for `crawlInternationalSiteEvidence` action.
- Modify: `prototype/src/events.js` for `international-site-crawl` action mapping.
- Modify: `prototype/src/pages/international.js` for crawl action button, evidence-aware check text, and crawl evidence panel.
- Modify: `prototype/src/static-api.js` for static preview evidence.
- Modify: `README.md`, `CHANGELOG.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/README.md`, `docs/PHASE_2_ROADMAP.md`.
- Create: `docs/STAGE_V0_11_CLOSEOUT.md`.

---

### Task 1: Red Tests For v0.11 Crawl Evidence

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Extend imports**

Add these imports from `mock-data.mjs`:

```js
  applyInternationalGeoSiteAuditCrawlEvidenceAction,
  crawlInternationalGeoSiteAuditAction,
```

Add these imports from new `site-crawl.mjs`:

```js
import {
  crawlInternationalGeoSite,
  normalizeCrawlTarget,
  validateCrawlTarget
} from "./site-crawl.mjs";
```

- [ ] **Step 2: Add unit assertions for URL safety and synthetic evidence**

In `runMockDataChecks()`, after the existing v0.10 site audit assertions, add:

```js
  assert.equal(
    normalizeCrawlTarget("https://example.com/path?x=1")?.href,
    "https://example.com/path?x=1",
    "Safe crawl target should normalize https URLs"
  );
  assert.throws(
    () => validateCrawlTarget("file:///tmp/a"),
    /CRAWL_TARGET_BLOCKED/,
    "file URLs should be blocked for crawling"
  );
  assert.throws(
    () => validateCrawlTarget("http://localhost:3000"),
    /CRAWL_TARGET_BLOCKED/,
    "localhost crawl targets should be blocked"
  );
  assert.throws(
    () => validateCrawlTarget("http://127.0.0.1"),
    /CRAWL_TARGET_BLOCKED/,
    "loopback IP crawl targets should be blocked"
  );

  const evidencedAudit = applyInternationalGeoSiteAuditCrawlEvidenceAction(siteAudit.id, {
    provider_id: "builtin_safe_fetch",
    execution_mode: "live_fetch",
    status: "completed",
    started_at: "2026-07-06T00:00:00.000Z",
    completed_at: "2026-07-06T00:00:01.000Z",
    origin: "https://example.com",
    resources: {
      homepage: {
        url: "https://example.com",
        status_code: 200,
        ok: true,
        content_type: "text/html",
        title: "Example GEO Platform",
        meta_description: "Example GEO Platform for B2B teams.",
        canonical_url: "https://example.com",
        h1: "Example GEO Platform",
        text_excerpt: "Example GEO Platform helps B2B teams compare GEO platforms with facts and FAQ.",
        json_ld_types: ["Organization", "SoftwareApplication"],
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      },
      robots_txt: {
        url: "https://example.com/robots.txt",
        status_code: 200,
        ok: true,
        content_type: "text/plain",
        text_excerpt: "User-agent: Googlebot\\nAllow: /\\nUser-agent: OAI-SearchBot\\nAllow: /",
        mentioned_bots: ["Googlebot", "OAI-SearchBot"],
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      },
      sitemap_xml: {
        url: "https://example.com/sitemap.xml",
        status_code: 200,
        ok: true,
        content_type: "application/xml",
        url_count: 2,
        sample_urls: ["https://example.com/", "https://example.com/pricing"],
        text_excerpt: "<urlset><url><loc>https://example.com/</loc></url></urlset>",
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      },
      llms_txt: {
        url: "https://example.com/llms.txt",
        status_code: 200,
        ok: true,
        content_type: "text/markdown",
        text_excerpt: "# Example GEO Platform",
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      }
    },
    issues: []
  });
  assert.equal(evidencedAudit.crawl_evidence.status, "completed", "Audit should store crawl evidence");
  assert.equal(
    evidencedAudit.checks.find((item) => item.id === "llms_txt")?.evidence_status,
    "crawl_evidenced",
    "llms.txt check should become crawl-evidenced"
  );
  assert.equal(
    evidencedAudit.checks.find((item) => item.id === "json_ld")?.evidence_status,
    "crawl_evidenced",
    "JSON-LD check should become crawl-evidenced"
  );
  assert.match(
    evidencedAudit.checks.find((item) => item.id === "robots_ai_access")?.evidence || "",
    /OAI-SearchBot/,
    "Robots check should include bot evidence"
  );
```

- [ ] **Step 3: Add crawl module no-network failure assertion**

Still in `runMockDataChecks()`, add a deterministic blocked call that does not require network:

```js
  await assert.rejects(
    () => crawlInternationalGeoSite("http://127.0.0.1"),
    /CRAWL_TARGET_BLOCKED/,
    "Unsafe live crawl targets should reject before network fetch"
  );
```

If `runMockDataChecks()` is not async, convert it to `async function runMockDataChecks()` and change its call site from `runMockDataChecks();` to `await runMockDataChecks();`.

- [ ] **Step 4: Add HTTP/RBAC assertions**

In the HTTP auth test block after owner site audit creation, add:

```js
    const unauthCrawl = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${ownerAudit.body?.data?.id}/crawl`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    );
    assert.equal(unauthCrawl.status, 401, "Unauthenticated site crawl should be denied");

    const viewerCrawl = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${ownerAudit.body?.data?.id}/crawl`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: viewerLogin.cookie
        },
        body: "{}"
      }
    );
    assert.equal(viewerCrawl.status, 403, "Viewer should not crawl site audit evidence");

    const missingCrawl = await httpRequest(port, "/api/v1/international-geo/site-audits/missing/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: "{}"
    });
    assert.equal(missingCrawl.status, 404, "Unknown site crawl audit should return 404");

    const blockedAudit = await httpRequest(port, "/api/v1/international-geo/site-audits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        website_url: "http://127.0.0.1",
        product_name: "Blocked Crawl Target"
      })
    });
    assert.equal(blockedAudit.status, 201, "Audit can store a URL that live crawler later blocks");
    const blockedCrawl = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${blockedAudit.body?.data?.id}/crawl`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: ownerLogin.cookie
        },
        body: "{}"
      }
    );
    assert.equal(blockedCrawl.status, 400, "Blocked crawl target should return 400");
    assert.equal(blockedCrawl.body?.error?.code, "CRAWL_TARGET_BLOCKED");
```

- [ ] **Step 5: Add UI render assertions**

In the `renderInternationalGeo` UI assertions, add a `crawl_evidence` object to the latest audit and assert labels:

```js
          crawl_evidence: {
            provider_id: "builtin_safe_fetch",
            execution_mode: "live_fetch",
            status: "completed",
            origin: "https://example.com",
            resources: {
              homepage: { ok: true, status_code: 200, title: "Example GEO Platform", json_ld_types: ["Organization"], text_excerpt: "Example text" },
              robots_txt: { ok: true, status_code: 200, mentioned_bots: ["Googlebot"], text_excerpt: "User-agent: *" },
              sitemap_xml: { ok: true, status_code: 200, url_count: 3, sample_urls: ["https://example.com/"] },
              llms_txt: { ok: true, status_code: 200, text_excerpt: "# Example GEO Platform" }
            },
            issues: []
          }
```

Then assert:

```js
  assert.match(internationalHtml, /data-action="international-site-crawl"/);
  assert.match(internationalHtml, /抓取站点证据/);
  assert.match(internationalHtml, /抓取证据/);
  assert.match(internationalHtml, /robots\.txt/);
  assert.match(internationalHtml, /sitemap\.xml/);
```

- [ ] **Step 6: Run red check**

Run:

```bash
npm run check
```

Expected: fail because `site-crawl.mjs` and new exports/routes/UI do not exist yet.

- [ ] **Step 7: Commit red tests**

```bash
git add verify-mvp.mjs
git commit -m "test: add live site crawl evidence red tests"
```

---

### Task 2: Safe Crawl Module

**Files:**
- Create: `site-crawl.mjs`

- [ ] **Step 1: Implement URL and IP safety helpers**

Create `site-crawl.mjs`:

```js
import dns from "node:dns/promises";
import net from "node:net";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_BODY_BYTES = 512 * 1024;
const DEFAULT_MAX_REDIRECTS = 3;
const USER_AGENT = "GEO-Pulse-SiteAudit/0.11";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);

function crawlBlocked(message) {
  const error = new Error("CRAWL_TARGET_BLOCKED");
  error.code = "CRAWL_TARGET_BLOCKED";
  error.message = message || "CRAWL_TARGET_BLOCKED";
  return error;
}

export function normalizeCrawlTarget(value) {
  const text = String(value || "").trim();
  const url = new URL(text);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw crawlBlocked("Only http and https crawl targets are allowed");
  }
  url.hash = "";
  return url;
}

export function isBlockedHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return !host || BLOCKED_HOSTS.has(host) || host.endsWith(".local");
}

export function isBlockedIpAddress(address) {
  const family = net.isIP(address);
  if (!family) return false;
  if (family === 4) {
    const parts = address.split(".").map((item) => Number(item));
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const value = address.toLowerCase();
  return (
    value === "::1" ||
    value === "::" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe80:") ||
    value.startsWith("ff")
  );
}

export function validateCrawlTarget(value) {
  const url = normalizeCrawlTarget(value);
  if (isBlockedHostname(url.hostname) || isBlockedIpAddress(url.hostname)) {
    throw crawlBlocked("Crawl target host is blocked by safety policy");
  }
  return url;
}
```

- [ ] **Step 2: Implement limited fetch and resource extraction**

Append:

```js
function nowIso() {
  return new Date().toISOString();
}

function excerpt(value, limit = 600) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function resourceUrl(originUrl, pathname) {
  const url = new URL(originUrl.href);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.href;
}

async function assertDnsSafe(url) {
  if (net.isIP(url.hostname)) {
    if (isBlockedIpAddress(url.hostname)) throw crawlBlocked("Crawl target IP is blocked by safety policy");
    return;
  }
  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (records.some((record) => isBlockedIpAddress(record.address))) {
    throw crawlBlocked("Crawl target resolves to a blocked IP range");
  }
}

async function readLimitedBody(response, maxBytes) {
  const reader = response.body?.getReader?.();
  if (!reader) {
    const text = await response.text();
    if (Buffer.byteLength(text) > maxBytes) {
      const error = new Error("BODY_TOO_LARGE");
      error.code = "BODY_TOO_LARGE";
      throw error;
    }
    return text;
  }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      const error = new Error("BODY_TOO_LARGE");
      error.code = "BODY_TOO_LARGE";
      throw error;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

async function fetchLimited(url, options) {
  let current = validateCrawlTarget(url);
  for (let redirect = 0; redirect <= options.maxRedirects; redirect += 1) {
    await assertDnsSafe(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,text/plain,application/xml,text/xml,application/xhtml+xml,*/*;q=0.5"
        }
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) return { response, url: current.href, body: "" };
        current = validateCrawlTarget(new URL(location, current.href).href);
        continue;
      }
      const body = await readLimitedBody(response, options.maxBodyBytes);
      return { response, url: current.href, body };
    } catch (error) {
      if (error?.name === "AbortError") {
        const timeout = new Error("FETCH_TIMEOUT");
        timeout.code = "FETCH_TIMEOUT";
        throw timeout;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  const error = new Error("TOO_MANY_REDIRECTS");
  error.code = "TOO_MANY_REDIRECTS";
  throw error;
}
```

- [ ] **Step 3: Implement HTML, robots, sitemap parsers**

Append:

```js
function matchFirst(text, pattern) {
  return String(text || "").match(pattern)?.[1]?.trim() || "";
}

function stripTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function jsonLdTypes(html) {
  const types = new Set();
  const blocks = String(html || "").match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of blocks) {
    const raw = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [])];
      for (const node of nodes) {
        const type = node?.["@type"];
        if (Array.isArray(type)) type.forEach((item) => types.add(String(item)));
        else if (type) types.add(String(type));
      }
    } catch {
      types.add("Invalid JSON-LD");
    }
  }
  return [...types].slice(0, 12);
}

function parseHomepage(body, finalUrl, response) {
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    title: matchFirst(body, /<title[^>]*>([\s\S]*?)<\/title>/i),
    meta_description: matchFirst(body, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
    canonical_url: matchFirst(body, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i),
    h1: matchFirst(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, " "),
    text_excerpt: excerpt(stripTags(body), 900),
    json_ld_types: jsonLdTypes(body),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function parseRobots(body, finalUrl, response) {
  const bots = ["Googlebot", "Bingbot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "GPTBot"];
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    text_excerpt: String(body || "").slice(0, 900),
    mentioned_bots: bots.filter((bot) => String(body || "").toLowerCase().includes(bot.toLowerCase())),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function parseSitemap(body, finalUrl, response) {
  const urls = [...String(body || "").matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    url_count: urls.length,
    sample_urls: urls.slice(0, 5),
    text_excerpt: String(body || "").slice(0, 900),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function parseTextResource(body, finalUrl, response) {
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    text_excerpt: String(body || "").slice(0, 900),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function failedResource(url, error) {
  return {
    url: String(url || ""),
    status_code: 0,
    ok: false,
    content_type: "",
    text_excerpt: "",
    fetched_at: nowIso(),
    error_code: error?.code || error?.message || "FETCH_FAILED"
  };
}
```

- [ ] **Step 4: Implement public crawl function**

Append:

```js
async function fetchResource(url, parser, options) {
  try {
    const result = await fetchLimited(url, options);
    return parser(result.body, result.url, result.response);
  } catch (error) {
    if (error?.code === "CRAWL_TARGET_BLOCKED") throw error;
    return failedResource(url, error);
  }
}

export async function crawlInternationalGeoSite(target, options = {}) {
  const startedAt = nowIso();
  const homepageUrl = validateCrawlTarget(target);
  const limits = {
    timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS,
    maxBodyBytes: options.maxBodyBytes || DEFAULT_MAX_BODY_BYTES,
    maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  };
  const origin = homepageUrl.origin;
  const resources = {
    homepage: await fetchResource(homepageUrl.href, parseHomepage, limits),
    robots_txt: await fetchResource(resourceUrl(homepageUrl, "/robots.txt"), parseRobots, limits),
    sitemap_xml: await fetchResource(resourceUrl(homepageUrl, "/sitemap.xml"), parseSitemap, limits),
    llms_txt: await fetchResource(resourceUrl(homepageUrl, "/llms.txt"), parseTextResource, limits)
  };
  const values = Object.values(resources);
  const okCount = values.filter((item) => item.ok).length;
  const status = okCount === values.length ? "completed" : okCount > 0 ? "partial" : "failed";
  return {
    provider_id: "builtin_safe_fetch",
    execution_mode: "live_fetch",
    status,
    started_at: startedAt,
    completed_at: nowIso(),
    origin,
    resources,
    issues: values.filter((item) => !item.ok).map((item) => ({
      url: item.url,
      error_code: item.error_code || "FETCH_FAILED"
    }))
  };
}
```

- [ ] **Step 5: Run checks**

Run:

```bash
node --check site-crawl.mjs
npm run check
```

Expected: `node --check` passes; `npm run check` still fails on missing mock-data exports/routes/UI.

- [ ] **Step 6: Commit**

```bash
git add site-crawl.mjs
git commit -m "feat: add safe site crawl module"
```

---

### Task 3: Data Model And Evidence-Aware Checks

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Import crawl module**

At the top of `mock-data.mjs`, add:

```js
import { crawlInternationalGeoSite } from "./site-crawl.mjs";
```

- [ ] **Step 2: Add evidence helper functions near site audit helpers**

Add after `siteAuditScore()`:

```js
function evidenceStatus(resource) {
  if (!resource) return "rule_first";
  return resource.ok ? "crawl_evidenced" : "unavailable";
}

function resourceStatusText(resource) {
  if (!resource) return "No crawl evidence.";
  if (resource.ok) return `HTTP ${resource.status_code || 200}`;
  return resource.error_code || `HTTP ${resource.status_code || 0}`;
}

function mergeCheckEvidence(check, evidencePatch = {}) {
  return {
    ...check,
    evidence_status: evidencePatch.evidence_status || check.evidence_status || "rule_first",
    evidence_source: evidencePatch.evidence_source || check.evidence_source || "",
    evidence: evidencePatch.evidence || check.evidence || check.message || ""
  };
}

function buildEvidenceAwareSiteAuditChecks(input, crawlEvidence = null) {
  const checks = buildSiteAuditChecks(input);
  const resources = crawlEvidence?.resources || {};
  return checks.map((check) => {
    if (check.id === "url_quality") {
      const homepage = resources.homepage;
      if (!homepage) return mergeCheckEvidence(check);
      return mergeCheckEvidence(check, {
        status: homepage.ok ? "passed" : "failed",
        message: homepage.ok ? `Homepage fetched: ${resourceStatusText(homepage)}.` : `Homepage fetch failed: ${resourceStatusText(homepage)}.`,
        recommendation: homepage.ok ? "Use the fetched homepage evidence to validate visible entity signals." : "Fix homepage reachability before live GEO monitoring.",
        evidence_status: evidenceStatus(homepage),
        evidence_source: "homepage",
        evidence: homepage.ok ? `${homepage.url} ${homepage.title || homepage.h1 || ""}`.trim() : resourceStatusText(homepage)
      });
    }
    if (check.id === "robots_ai_access") {
      const robots = resources.robots_txt;
      if (!robots) return mergeCheckEvidence(check);
      const bots = robots.mentioned_bots || [];
      return mergeCheckEvidence(check, {
        status: robots.ok && bots.length > 0 ? "passed" : "warning",
        message: robots.ok ? `robots.txt fetched with ${bots.length} known bot mentions.` : `robots.txt unavailable: ${resourceStatusText(robots)}.`,
        recommendation: bots.length > 0 ? "Review bot-specific allow/disallow lines before production launch." : "Document intended AI/search crawler access in robots.txt.",
        evidence_status: evidenceStatus(robots),
        evidence_source: "robots_txt",
        evidence: bots.length ? bots.join(", ") : robots.text_excerpt || resourceStatusText(robots)
      });
    }
    if (check.id === "sitemap") {
      const sitemap = resources.sitemap_xml;
      if (!sitemap) return mergeCheckEvidence(check);
      return mergeCheckEvidence(check, {
        status: sitemap.ok && sitemap.url_count > 0 ? "passed" : "warning",
        message: sitemap.ok ? `sitemap.xml fetched with ${sitemap.url_count || 0} URLs.` : `sitemap.xml unavailable: ${resourceStatusText(sitemap)}.`,
        recommendation: sitemap.url_count > 0 ? "Keep sitemap submitted to Google Search Console and Bing Webmaster Tools." : "Publish sitemap.xml with canonical public pages.",
        evidence_status: evidenceStatus(sitemap),
        evidence_source: "sitemap_xml",
        evidence: `${sitemap.url_count || 0} URLs${sitemap.sample_urls?.[0] ? `; sample ${sitemap.sample_urls[0]}` : ""}`
      });
    }
    if (check.id === "llms_txt") {
      const llms = resources.llms_txt;
      if (!llms) return mergeCheckEvidence(check);
      return mergeCheckEvidence(check, {
        status: llms.ok ? "passed" : "warning",
        message: llms.ok ? "/llms.txt fetched from live site." : `/llms.txt unavailable: ${resourceStatusText(llms)}.`,
        recommendation: llms.ok ? "Keep llms.txt concise and aligned with canonical product pages." : "Install /llms.txt with product, audience, core pages, and canonical entity summary.",
        evidence_status: evidenceStatus(llms),
        evidence_source: "llms_txt",
        evidence: llms.text_excerpt || resourceStatusText(llms)
      });
    }
    if (check.id === "json_ld") {
      const homepage = resources.homepage;
      if (!homepage) return mergeCheckEvidence(check);
      const types = homepage.json_ld_types || [];
      return mergeCheckEvidence(check, {
        status: homepage.ok && types.length > 0 && !types.includes("Invalid JSON-LD") ? "passed" : "warning",
        message: types.length ? `Detected JSON-LD types: ${types.join(", ")}.` : "No JSON-LD types detected on fetched homepage.",
        recommendation: types.length ? "Validate JSON-LD and fill Organization/Product/FAQ gaps." : "Add Organization, Product/SoftwareApplication, and FAQPage JSON-LD.",
        evidence_status: evidenceStatus(homepage),
        evidence_source: "homepage",
        evidence: types.join(", ") || homepage.text_excerpt || resourceStatusText(homepage)
      });
    }
    if (check.id === "direct_answer") {
      const homepage = resources.homepage;
      if (!homepage) return mergeCheckEvidence(check);
      const excerpt = String(homepage.text_excerpt || "").toLowerCase();
      const product = String(input.product_name || "").toLowerCase();
      const hasProduct = product && excerpt.includes(product);
      return mergeCheckEvidence(check, {
        status: homepage.ok && hasProduct ? "passed" : "warning",
        message: hasProduct ? "Fetched homepage text includes the product/entity name." : "Fetched homepage excerpt does not clearly include the product/entity name.",
        recommendation: "Place a direct answer and entity definition near the start of target pages.",
        evidence_status: evidenceStatus(homepage),
        evidence_source: "homepage",
        evidence: homepage.text_excerpt || resourceStatusText(homepage)
      });
    }
    return mergeCheckEvidence(check);
  });
}
```

- [ ] **Step 3: Use evidence-aware checks when creating audits**

In `createInternationalGeoSiteAuditAction`, change:

```js
  const checks = buildSiteAuditChecks(input);
```

to:

```js
  const checks = buildEvidenceAwareSiteAuditChecks(input);
```

- [ ] **Step 4: Add crawl evidence application action**

Add after `createInternationalGeoSiteAuditAction()`:

```js
export function applyInternationalGeoSiteAuditCrawlEvidenceAction(auditId, crawlEvidence = {}) {
  ensureInternationalGeoStateShape();
  const audit = internationalGeoState.site_audits.items.find((item) => item.id === auditId);
  if (!audit) return null;
  audit.crawl_evidence = deepClone(crawlEvidence);
  audit.checks = buildEvidenceAwareSiteAuditChecks(audit, audit.crawl_evidence);
  audit.score = siteAuditScore(audit.checks);
  audit.status = siteAuditStatusFromChecks(audit.checks);
  audit.summary = siteAuditSummary(audit.checks, audit.summary?.generated_assets || 0);
  audit.updated_at = nowIso();
  internationalGeoState.site_audits.latest = audit;
  internationalGeoState.summary = {
    ...internationalGeoState.summary,
    ai_ready_score: audit.score,
    crawler_access: audit.status === "blocked" ? "需复核" : "建议复核"
  };
  internationalGeoState.updated_at = nowIso();
  persistState();
  return deepClone(audit);
}

export async function crawlInternationalGeoSiteAuditAction(auditId) {
  ensureInternationalGeoStateShape();
  const audit = internationalGeoState.site_audits.items.find((item) => item.id === auditId);
  if (!audit) return null;
  const evidence = await crawlInternationalGeoSite(audit.website_url);
  const updatedAudit = applyInternationalGeoSiteAuditCrawlEvidenceAction(audit.id, evidence);
  recordAuditEvent("international_geo.site_crawl.run", "international_geo_site_audit", audit.id, {
    audit_id: audit.id,
    website_url: audit.website_url,
    status: evidence.status,
    resource_count: Object.keys(evidence.resources || {}).length,
    issue_count: evidence.issues?.length || 0
  });
  persistState();
  return { audit: updatedAudit, crawl_evidence: deepClone(evidence) };
}
```

- [ ] **Step 5: Preserve evidence in returned assets**

No API shape change is required for assets. Ensure `generateInternationalGeoSiteAuditAssetsAction()` keeps using `getInternationalGeoSiteAudit(audit.id)` after evidence application, which it already does.

- [ ] **Step 6: Run check**

Run:

```bash
node --check mock-data.mjs
npm run check
```

Expected: fails only on missing server route/frontend UI until next tasks.

- [ ] **Step 7: Commit**

```bash
git add mock-data.mjs
git commit -m "feat: store site crawl evidence on geo audits"
```

---

### Task 4: Server Route And Error Mapping

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Import crawl action**

Add `crawlInternationalGeoSiteAuditAction` to the dynamic import destructuring from `mock-data.mjs`.

- [ ] **Step 2: Add route after asset generation route**

Add:

```js
  if (req.method === "POST" && pathname.match(/^\/international-geo\/site-audits\/[^/]+\/crawl$/)) {
    const id = pathname.split("/")[3];
    try {
      const result = await crawlInternationalGeoSiteAuditAction(id);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Site GEO audit not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      const code = err?.code || err?.message;
      if (code === "CRAWL_TARGET_BLOCKED") {
        sendJson(res, 400, error("CRAWL_TARGET_BLOCKED", "Crawl target is blocked by safety policy").body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 3: Run checks**

Run:

```bash
node --check server.mjs
npm run check
```

Expected: HTTP route tests for auth and blocked target pass; UI assertions still fail.

- [ ] **Step 4: Commit**

```bash
git add server.mjs
git commit -m "feat: add site crawl evidence route"
```

---

### Task 5: Frontend API, Action, And Event Wiring

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add API wrapper**

In `prototype/src/api.js`, add after `generateInternationalGeoSiteAuditAssets()`:

```js
export function crawlInternationalGeoSiteAudit(auditId) {
  return requestJson(`/api/v1/international-geo/site-audits/${auditId}/crawl`, "POST", {});
}
```

- [ ] **Step 2: Import wrapper in main**

In `prototype/src/main.js`, import as an alias:

```js
  crawlInternationalGeoSiteAudit as crawlInternationalGeoSiteAuditApi,
```

- [ ] **Step 3: Add action**

Add after `generateInternationalSiteAssets()`:

```js
  async crawlInternationalSiteEvidence() {
    const auditId =
      store.data.internationalGeo?.site_audits?.latest?.id ||
      store.data.internationalGeo?.site_audits?.items?.[0]?.id ||
      "";
    if (!auditId) {
      setError("请先运行站点 GEO 审计");
      rerender();
      return;
    }

    try {
      const result = await crawlInternationalGeoSiteAuditApi(auditId);
      await refreshData();
      store.page = "international";
      showNotice(`站点证据抓取完成，状态 ${result.crawl_evidence?.status || "-"}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "抓取站点证据失败");
      rerender();
    }
  },
```

- [ ] **Step 4: Wire event**

In `prototype/src/events.js`, add near other International GEO actions:

```js
    if (action === "international-site-crawl") {
      await actions.crawlInternationalSiteEvidence();
      return;
    }
```

- [ ] **Step 5: Run checks**

Run:

```bash
node --check prototype/src/api.js
node --check prototype/src/main.js
node --check prototype/src/events.js
npm run check
```

Expected: UI render assertions still fail until page rendering is updated.

- [ ] **Step 6: Commit**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire site crawl evidence frontend action"
```

---

### Task 6: International GEO Evidence UI

**Files:**
- Modify: `prototype/src/pages/international.js`
- Modify: `prototype/styles.css` only if needed

- [ ] **Step 1: Add crawl status labels**

Add near `auditStatusLabel()`:

```js
function evidenceStatusLabel(value) {
  const labels = {
    rule_first: "规则判断",
    crawl_evidenced: "抓取证据",
    unavailable: "无可用证据",
    completed: "完成",
    partial: "部分完成",
    failed: "失败",
    blocked: "已阻止"
  };
  return labels[value] || value || "-";
}
```

- [ ] **Step 2: Add crawl button in site audit panel**

In `renderSiteAuditPanel()`, update the action row:

```html
          <button class="ghost-btn" data-action="international-site-crawl">抓取站点证据</button>
          <button class="ghost-btn" data-action="international-site-assets">生成 GEO 资产</button>
          <button class="secondary-btn" data-action="international-site-audit">运行站点审计</button>
```

- [ ] **Step 3: Render evidence in check rows**

In `renderSiteAuditChecks()`, replace the recommendation cell content with:

```js
              <div class="cell-title">${escapeHtml(item.message || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.evidence || item.recommendation || "-")}</div>
              <div class="cell-sub">${escapeHtml(evidenceStatusLabel(item.evidence_status))}${item.evidence_source ? ` · ${escapeHtml(item.evidence_source)}` : ""}</div>
```

- [ ] **Step 4: Add evidence panel renderer**

Add before `renderGeoAssetPreviews()`:

```js
function resourceOkLabel(resource = {}) {
  if (!resource) return "未抓取";
  if (resource.ok) return `HTTP ${resource.status_code || 200}`;
  return resource.error_code || `HTTP ${resource.status_code || 0}`;
}

function renderCrawlEvidencePanel(audit = {}) {
  const evidence = audit?.crawl_evidence || null;
  const resources = evidence?.resources || {};
  const rows = [
    ["Homepage", "homepage", resources.homepage],
    ["robots.txt", "robots_txt", resources.robots_txt],
    ["sitemap.xml", "sitemap_xml", resources.sitemap_xml],
    ["llms.txt", "llms_txt", resources.llms_txt]
  ].map(([label, key, resource]) => {
    const detail =
      key === "homepage"
        ? [resource?.title, resource?.h1, resource?.json_ld_types?.join(", "), resource?.text_excerpt].filter(Boolean).join(" · ")
        : key === "sitemap_xml"
          ? [`${resource?.url_count ?? 0} URLs`, ...(resource?.sample_urls || []).slice(0, 2)].filter(Boolean).join(" · ")
          : key === "robots_txt"
            ? [resource?.mentioned_bots?.join(", "), resource?.text_excerpt].filter(Boolean).join(" · ")
            : resource?.text_excerpt || "";
    return `
      <tr>
        <td>
          <div class="cell-title">${escapeHtml(label)}</div>
          <div class="cell-sub">${escapeHtml(resource?.url || "-")}</div>
        </td>
        <td>${statusMarkup(resourceOkLabel(resource))}</td>
        <td>
          <div class="cell-title">${escapeHtml(resource?.content_type || "-")}</div>
          <div class="cell-sub">${escapeHtml(detail || "-")}</div>
        </td>
      </tr>
    `;
  });

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">抓取证据</h3>
          <div class="panel-note">v0.11 抓取首页、robots.txt、sitemap.xml 和 llms.txt；AI 引擎推荐监控仍属于后续阶段。</div>
        </div>
        <span class="status-pill">${escapeHtml(evidenceStatusLabel(evidence?.status || "rule_first"))}</span>
      </div>
      ${
        evidence
          ? tableMarkup(["资源", "状态", "证据"], rows)
          : `<div class="empty-state">暂无抓取证据，请先运行站点审计并抓取站点证据。</div>`
      }
    </section>
  `;
}
```

- [ ] **Step 5: Insert evidence panel**

In `renderInternationalGeo()`, insert after `renderSiteAuditChecks(latestAudit)`:

```js
    ${renderCrawlEvidencePanel(latestAudit)}
```

- [ ] **Step 6: Run checks**

Run:

```bash
node --check prototype/src/pages/international.js
npm run check
```

Expected: UI assertions pass unless static preview still needs evidence data.

- [ ] **Step 7: Commit**

```bash
git add prototype/src/pages/international.js prototype/styles.css
git commit -m "feat: render site crawl evidence workspace"
```

---

### Task 7: Static Preview Evidence

**Files:**
- Modify: `prototype/src/static-api.js`

- [ ] **Step 1: Add `crawl_evidence` to `siteAudit`**

In the static `/international-geo` fallback `siteAudit` object, add:

```js
        crawl_evidence: {
          provider_id: "builtin_safe_fetch",
          execution_mode: "live_fetch",
          status: "completed",
          started_at: "2026-07-06T00:00:00.000Z",
          completed_at: "2026-07-06T00:00:01.000Z",
          origin: "https://example.com",
          resources: {
            homepage: {
              url: "https://example.com",
              status_code: 200,
              ok: true,
              content_type: "text/html",
              title: "GEO Pulse",
              meta_description: "Static preview GEO platform.",
              canonical_url: "https://example.com",
              h1: "GEO Pulse",
              text_excerpt: "GEO Pulse helps operators prepare AI search visibility evidence.",
              json_ld_types: ["Organization", "SoftwareApplication"],
              fetched_at: "2026-07-06T00:00:00.000Z",
              error_code: ""
            },
            robots_txt: {
              url: "https://example.com/robots.txt",
              status_code: 200,
              ok: true,
              content_type: "text/plain",
              text_excerpt: "User-agent: Googlebot\\nAllow: /",
              mentioned_bots: ["Googlebot"],
              fetched_at: "2026-07-06T00:00:00.000Z",
              error_code: ""
            },
            sitemap_xml: {
              url: "https://example.com/sitemap.xml",
              status_code: 200,
              ok: true,
              content_type: "application/xml",
              url_count: 2,
              sample_urls: ["https://example.com/", "https://example.com/docs"],
              text_excerpt: "<urlset><url><loc>https://example.com/</loc></url></urlset>",
              fetched_at: "2026-07-06T00:00:00.000Z",
              error_code: ""
            },
            llms_txt: {
              url: "https://example.com/llms.txt",
              status_code: 200,
              ok: true,
              content_type: "text/markdown",
              text_excerpt: "# GEO Pulse",
              fetched_at: "2026-07-06T00:00:00.000Z",
              error_code: ""
            }
          },
          issues: []
        }
```

- [ ] **Step 2: Run checks**

Run:

```bash
node --check prototype/src/static-api.js
npm run check
```

Expected: `verify-mvp: OK`.

- [ ] **Step 3: Commit**

```bash
git add prototype/src/static-api.js
git commit -m "feat: add static crawl evidence preview"
```

---

### Task 8: Documentation And v0.11 Closeout

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/API_REFERENCE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/README.md`
- Modify: `docs/PHASE_2_ROADMAP.md`
- Create: `docs/STAGE_V0_11_CLOSEOUT.md`

- [ ] **Step 1: Bump package version**

Set:

```json
"version": "0.11.0"
```

- [ ] **Step 2: Add changelog section**

At top of `CHANGELOG.md`, add:

```markdown
## 0.11.0 - 2026-07-06

Live site crawl evidence for International GEO.

### Added

- Guarded live site crawl evidence snapshots for International GEO site audits.
- Built-in safe fetch crawler with URL validation, SSRF protections, timeout, body-size, and redirect limits.
- Crawl evidence for homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`.
- Evidence-aware audit checks and UI evidence panel.
- API route for `POST /api/v1/international-geo/site-audits/:id/crawl`.

### Boundaries

- v0.11 does not query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, SERP APIs, or external publishing platforms.

### Verification

- `npm run check`
- Static SEO scan
- Browser smoke for International GEO crawl evidence flow
```

- [ ] **Step 3: Update API docs**

In `docs/API_REFERENCE.md`, add:

```text
POST /international-geo/site-audits/:id/crawl
```

State that it requires editor/admin/owner session or `X-GEO-API-Key`, returns updated audit and `crawl_evidence`, blocks unsafe targets with `CRAWL_TARGET_BLOCKED`, and stores network failures as evidence instead of crashing.

- [ ] **Step 4: Update architecture/docs**

Update docs to state:

- v0.11 performs guarded live site crawling.
- The crawler fetches homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`.
- Evidence is stored under site audit records.
- It is still not AI engine recommendation monitoring.

- [ ] **Step 5: Add closeout doc**

Create `docs/STAGE_V0_11_CLOSEOUT.md`:

```markdown
# v0.11 Stage Closeout

## Stage Result

GEO Pulse has reached the v0.11 live site crawl evidence stage.

## What Is Included

- Guarded live crawl action for International GEO site audits.
- Built-in safe fetch crawler with SSRF, timeout, body-size, and redirect protections.
- Evidence snapshots for homepage, robots.txt, sitemap.xml, and llms.txt.
- Evidence-aware audit checks and a crawl evidence UI panel.
- API route, audit event, local persistence, backup compatibility, and static preview support.

## Launch Boundary

Use v0.11 as a controlled site evidence collection tool for one organization.

It is not live AI recommendation monitoring and does not query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, SERP APIs, or external publishing platforms.

## Verification

```bash
npm run check
node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

Expected:

```text
verify-mvp: OK
Errors: 0
Warnings: 0
```

## Closing Copy

GEO Pulse v0.11 adds guarded live site evidence to International GEO. Operators can create a site audit, crawl public website signals, inspect evidence for homepage metadata, robots.txt, sitemap.xml, llms.txt, and JSON-LD, then continue generating GEO assets. The next stage should turn this evidence into deeper scoring and measured AI visibility snapshots before claiming real engine recommendation tracking.
```

- [ ] **Step 6: Run verification**

Run:

```bash
npm run check
node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

Expected: `verify-mvp: OK`, SEO errors 0, warnings 0.

- [ ] **Step 7: Commit**

```bash
git add package.json README.md CHANGELOG.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/README.md docs/PHASE_2_ROADMAP.md docs/STAGE_V0_11_CLOSEOUT.md
git commit -m "docs: close out live site crawl evidence v0.11"
```

---

### Task 9: Browser Smoke, Final Verification, Push

**Files:**
- No source edits unless smoke reveals a release blocker.

- [ ] **Step 1: Start local server**

Run:

```bash
PORT=3106 GEO_ENABLE_PERSISTENCE=0 npm run start
```

- [ ] **Step 2: Browser smoke with Playwright CLI**

Use:

```bash
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh open http://localhost:3106 --headed
```

Flow:

1. Login as `owner` / `geo-owner-change-me`.
2. Open International GEO.
3. Run site audit.
4. Click `抓取站点证据`.
5. Confirm `抓取证据` panel renders.
6. Confirm homepage, `robots.txt`, `sitemap.xml`, and `llms.txt` rows render.
7. Generate GEO assets and confirm previews still render.
8. Check mobile viewport 390x844 for no horizontal overflow in evidence and asset panels.

- [ ] **Step 3: Stop server and cleanup**

Stop the server session. Remove `.playwright-cli/` and `output/` if created.

- [ ] **Step 4: Final verification**

Run:

```bash
npm run check
node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .
git status --short
```

Expected:

- `verify-mvp: OK`
- SEO errors 0, warnings 0
- clean worktree

- [ ] **Step 5: Push and watch Actions**

Run:

```bash
git push origin main
gh run list --limit 1
gh run watch "$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

Expected: GitHub Actions `check` completes with `success`.
