# v0.11 Stage Closeout

## Stage Result

v0.11 adds Live Site Crawl Evidence to International GEO.

The product can now:

- create durable International GEO site audit records,
- run a guarded live crawl for the submitted site audit URL,
- fetch only the homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`,
- store the crawl snapshot under `crawl_evidence`,
- rebuild checks with `rule_first`, `crawl_evidenced`, or `unavailable` evidence states,
- show crawl evidence in the International GEO workspace,
- keep generated GEO assets compatible with existing audit records.

## Safety Boundary

The crawler is intentionally narrow. It uses a built-in safe fetcher, not a browser renderer or recursive crawler.

Guardrails include:

- `http` and `https` targets only,
- malformed URL and non-web protocol rejection,
- localhost, private, loopback, link-local, multicast, unspecified, and mapped private IP blocking,
- DNS/IP validation during the actual connection lookup,
- redirect target validation,
- short per-resource timeout,
- response body size cap,
- redirect limit,
- structured failed resource records instead of server crashes for normal network failures.

## API Surface

New route:

```text
POST /api/v1/international-geo/site-audits/:id/crawl
```

Access:

- owner/admin/editor browser sessions can run crawls,
- viewer sessions are read-only,
- controlled scripts can use `X-GEO-API-Key`.

Error behavior:

- unknown audit id returns `404 NOT_FOUND`,
- unsafe crawl target returns `400 CRAWL_TARGET_BLOCKED`,
- normal network failures return `200` with failed or partial `crawl_evidence`.

## UI Surface

International GEO now includes:

- `抓取站点证据` action,
- `抓取证据` resource table,
- homepage, `robots.txt`, `sitemap.xml`, and `llms.txt` evidence rows,
- check-level evidence status, source, and evidence text.

The UI remains a dense operational admin workspace and does not add a marketing layout.

## Verification

Completed:

```bash
npm run check
```

The check covers:

- crawler URL safety assertions,
- synthetic crawl evidence application,
- evidence-aware checks,
- HTTP auth/RBAC for the crawl route,
- blocked crawl target HTTP error mapping,
- International GEO UI rendering for crawl action and evidence panel.

## Current Launch Statement

GEO Pulse v0.11.0 can be used in a controlled one-organization deployment for International GEO readiness work with guarded public-site evidence. Operators can input a website and product, create a site audit, fetch limited public evidence, inspect check-level findings, and generate GEO assets.

It should not be marketed as a real-time AI search monitoring platform. v0.11 does not query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, or SERP APIs. It does not automatically publish to third-party platforms, render JavaScript-heavy pages, or recursively crawl entire websites.

## Next Stage

v0.12 evidence-backed scoring has now been completed in [v0.12 Stage Closeout](STAGE_V0_12_CLOSEOUT.md).

Recommended v0.13 direction:

- add measured AI visibility connectors only when approved data sources are configured,
- keep measured, crawl-evidenced, simulated, and rule-first states clearly separated.
