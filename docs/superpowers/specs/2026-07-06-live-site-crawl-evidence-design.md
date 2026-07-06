# Live Site Crawl Evidence v0.11 Design

## Goal

Upgrade International GEO site audits from rule-first recommendations to evidence-assisted audits by safely fetching public website signals and attaching crawl evidence to audit checks.

## Current Gap

v0.10 can create durable International GEO site audits and generate GEO assets from local operator input. It intentionally does not fetch the target website, so checks such as `robots_ai_access`, `sitemap`, `llms_txt`, `json_ld`, `direct_answer`, and `fact_density` are recommendations rather than verified findings.

Operators now need a practical next step:

- confirm whether the submitted site is reachable,
- see whether `robots.txt`, `sitemap.xml`, and `/llms.txt` exist,
- detect basic HTML metadata and JSON-LD types,
- attach real evidence to each GEO audit check,
- keep the same v0.10 audit and asset workflow when live crawling is disabled or fails.

## Product Boundary

v0.11 adds guarded live site crawling and evidence snapshots. It does not query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, SERP APIs, or external publishing platforms.

This stage must distinguish three states:

- `rule_first`: generated from operator input and local rules.
- `crawl_evidenced`: verified from the submitted public website.
- `unavailable`: crawl failed, was blocked by safety policy, or returned no usable evidence.

## In Scope

### Safe Crawl Engine

Create a small focused crawl module, `site-crawl.mjs`.

Responsibilities:

- Normalize and validate submitted URLs.
- Allow only `http:` and `https:` URLs.
- Reject loopback, private, link-local, multicast, unspecified, and invalid hosts.
- Reject `localhost`, `.local`, `file:`, `data:`, and other non-web protocols.
- Resolve hostnames before fetch and apply the same IP safety checks.
- Use short timeouts.
- Cap response body size.
- Limit redirects and re-check every redirect target.
- Return structured results instead of throwing for normal network failures.

Default limits:

- timeout: 5000 ms per resource.
- max body bytes: 512 KB per resource.
- max redirects: 3.
- user agent: `GEO-Pulse-SiteAudit/0.11`.

### Connector Boundary

The first implementation uses the built-in safe fetcher, but the API shape should look like a connector result so future Firecrawl, Browserless, SERP, or AI visibility providers can replace it.

Each crawl run should include:

- `provider_id`: `builtin_safe_fetch`.
- `execution_mode`: `live_fetch`.
- `status`: `completed`, `partial`, `failed`, or `blocked`.
- `started_at`
- `completed_at`
- `resources`
- `issues`

### Crawl Resources

For a submitted audit URL, fetch:

- Homepage URL.
- Origin `/robots.txt`.
- Origin `/sitemap.xml`.
- Origin `/llms.txt`.

The crawl should not recursively crawl all sitemap pages in v0.11.

### Evidence Snapshot

Attach evidence to the audit record under `crawl_evidence`.

Shape:

```js
{
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
      title: "Example",
      meta_description: "Example description",
      canonical_url: "https://example.com",
      h1: "Example H1",
      text_excerpt: "Visible text excerpt.",
      json_ld_types: ["Organization", "SoftwareApplication"],
      fetched_at: "2026-07-06T00:00:00.000Z",
      error_code: ""
    },
    robots_txt: {
      url: "https://example.com/robots.txt",
      status_code: 200,
      ok: true,
      content_type: "text/plain",
      text_excerpt: "User-agent: *\nAllow: /",
      mentioned_bots: ["Googlebot"],
      fetched_at: "2026-07-06T00:00:00.000Z",
      error_code: ""
    },
    sitemap_xml: {
      url: "https://example.com/sitemap.xml",
      status_code: 200,
      ok: true,
      content_type: "application/xml",
      url_count: 12,
      sample_urls: ["https://example.com/"],
      text_excerpt: "<urlset>...",
      fetched_at: "2026-07-06T00:00:00.000Z",
      error_code: ""
    },
    llms_txt: {
      url: "https://example.com/llms.txt",
      status_code: 200,
      ok: true,
      content_type: "text/markdown",
      text_excerpt: "# Example",
      fetched_at: "2026-07-06T00:00:00.000Z",
      error_code: ""
    }
  },
  issues: []
}
```

Failed resources should still create resource entries with `ok: false`, `status_code` when available, and `error_code`.

### Evidence-Aware Checks

Update site audit checks when crawl evidence exists:

- `url_quality`: homepage fetch status and final safe URL.
- `robots_ai_access`: robots status, text excerpt, and known bot mentions.
- `sitemap`: sitemap status and URL count.
- `llms_txt`: `/llms.txt` status and excerpt.
- `json_ld`: homepage JSON-LD type list.
- `direct_answer`: homepage text excerpt and whether the primary query or product appears early.
- `fact_density`: homepage text/table/number signals from simple HTML text extraction.
- `eeat`: visible organization/contact/about/trust terms from homepage text.
- `third_party_validation`: remains mostly rule-first in v0.11 unless the homepage links to external proof surfaces.

Each check should include:

- `evidence_status`: `rule_first`, `crawl_evidenced`, or `unavailable`.
- `evidence_source`: resource key such as `homepage`, `robots_txt`, `sitemap_xml`, or `llms_txt`.
- `evidence`: short human-readable evidence string.

### API

Add one mutation route:

- `POST /api/v1/international-geo/site-audits/:id/crawl`

Behavior:

- Requires editor/admin/owner session or `X-GEO-API-Key`.
- Viewer sessions receive 403.
- Unknown audit id returns 404.
- Crawl-safety rejections return 400 with a stable code such as `CRAWL_TARGET_BLOCKED`.
- Normal network failures return 200 with `status: failed` or `partial`; they should not crash the server.

The route returns the updated audit record and crawl evidence.

### UI

Extend `prototype/src/pages/international.js` using existing dense admin primitives.

Add:

- A "抓取站点证据" action in the site audit panel.
- A compact "抓取证据" panel after audit checks or before GEO assets.
- Evidence rows for homepage, robots, sitemap, and llms.txt.
- Resource status, HTTP status, key extracted fields, and short excerpts.
- Check table evidence columns or concise evidence text in the existing recommendation cell.

Do not add a hero section, marketing layout, or a new navigation model.

### Static Preview

Extend static `/international-geo` preview data with a sample `crawl_evidence` object so the UI can render without a server.

### Audit Events

Record:

- `international_geo.site_crawl.run`

Details may include:

- `audit_id`
- `website_url`
- `status`
- `resource_count`
- `issue_count`

Details must not include full fetched page bodies.

### Persistence And Backup Compatibility

`crawl_evidence` should live inside the existing `internationalGeoState.site_audits.items[]` records so current local persistence, backup, import, and restore flows carry it automatically.

Hydration must tolerate older audit records without `crawl_evidence`.

## Out Of Scope

- Recursive crawling.
- Rendering JavaScript-heavy pages with a browser.
- Fetching every sitemap URL.
- Real AI search engine querying.
- SERP APIs.
- ChatGPT/Gemini/Claude/Perplexity/Copilot recommendation monitoring.
- Automatic third-party publishing.
- Production queue workers.
- Database persistence or migrations.
- External credential vaults.

## Data Flow

1. Operator creates a v0.10-style site audit.
2. Operator clicks "抓取站点证据".
3. Frontend calls `POST /api/v1/international-geo/site-audits/:id/crawl`.
4. Server loads the audit and delegates to the safe crawl action.
5. Safe crawl module validates the target and fetches homepage, robots, sitemap, and llms.
6. Data layer stores `crawl_evidence` on the audit.
7. Data layer rebuilds evidence-aware checks, score, status, and summary.
8. Audit event is recorded.
9. UI reloads International GEO state and renders evidence rows.
10. Asset generation continues to work; generated assets may use crawl evidence when present.

## Error Handling

- Invalid audit id: 404 `NOT_FOUND`.
- Unsafe URL: 400 `CRAWL_TARGET_BLOCKED`.
- DNS or fetch failure: evidence status `failed` or `partial`, no server crash.
- Oversized body: resource `ok: false`, `error_code: BODY_TOO_LARGE`.
- Timeout: resource `ok: false`, `error_code: FETCH_TIMEOUT`.
- Unsupported content type: resource is stored with status and excerpt omitted.
- Legacy audit without evidence: UI shows a terse empty state and keeps rule-first checks.

## Testing

Extend `verify-mvp.mjs` before implementation.

Mock-data and crawl tests:

- Unsafe URLs such as `http://localhost:3000`, `http://127.0.0.1`, and `file:///tmp/a` are rejected.
- Safe URL normalization accepts `https://example.com`.
- A synthetic crawl evidence object updates `llms_txt`, `json_ld`, `sitemap`, and `robots_ai_access` checks to `crawl_evidenced`.
- Failed resource evidence is stored and marks related checks as `unavailable` or warning.

HTTP/RBAC tests:

- Unauthenticated crawl request returns 401.
- Viewer crawl request returns 403.
- Owner/editor crawl request returns 200 with updated audit evidence.
- Unknown audit id returns 404.
- Blocked target returns 400 with `CRAWL_TARGET_BLOCKED`.

UI tests:

- International GEO renders "抓取站点证据".
- Evidence panel renders "抓取证据".
- Evidence panel renders homepage, robots.txt, sitemap.xml, and llms.txt labels.
- Evidence-aware check rows include evidence text.

Verification:

- `npm run check`
- Static SEO scan
- Browser smoke for owner flow: create audit, crawl evidence, view evidence panel.

## Documentation

Update:

- `README.md`
- `CHANGELOG.md`
- `docs/API_REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/ROADMAP.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/README.md`
- `docs/PHASE_2_ROADMAP.md`

Add:

- `docs/STAGE_V0_11_CLOSEOUT.md`

## Success Criteria

- `npm run check` passes locally.
- Static SEO scan reports 0 errors and 0 warnings.
- GitHub Actions `check` passes after push.
- International GEO supports:
  input site context -> create audit -> crawl site evidence -> inspect evidence-backed checks -> generate assets.
- Documentation clearly states that v0.11 performs guarded live site crawling, but still does not perform real AI engine recommendation monitoring.
