# Site GEO Audit And Asset Generation v0.10 Design

## Goal

Turn the existing International GEO workspace into a practical first-step GEO operating tool: an operator can enter a website, product, target market, target language, and competitors, then receive a structured site GEO audit plus copyable GEO assets such as `llms.txt`, JSON-LD, FAQ Schema, and content/distribution recommendations.

## Current Gap

v0.9.1 already has an International GEO page and API actions for readiness audit and artifact generation. Those flows are useful for planning, but they do not yet behave like a site audit workflow with durable audit records, check-level evidence, asset versions, or a clear input-to-output loop.

Operators need a concrete workflow that answers:

- Is this site ready for AI search retrieval and citation?
- What technical and content checks are missing?
- What `llms.txt` and Schema assets should be installed first?
- What content formats and distribution surfaces should be prioritized?

## Product Boundary

This stage is a controlled, mock-first / rule-first site audit. It should be useful for operators and demos, but it must not claim to perform live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, or Copilot inclusion checks.

Live AI search monitoring, external web crawling at scale, real publishing, OAuth, production queues, and database persistence remain out of scope for v0.10.

## In Scope

### Site Audit Input

Add a compact site audit form inside the existing International GEO page.

Fields:

- Website URL.
- Product or brand name.
- Target market.
- Target language.
- Primary buyer/query prompt.
- Competitors, one per line.

The form should default from existing `workspaceInput` and `internationalGeo.input` values when available.

### Site Audit Records

Create durable in-memory / local-persisted audit records in `mock-data.mjs`.

Each audit record includes:

- `id`
- `website_url`
- `product_name`
- `target_market`
- `target_language`
- `primary_query`
- `competitors`
- `score`
- `status`: `ready`, `review`, or `blocked`
- `summary`: passed, warnings, failed, blockers, generated asset count
- `checks`
- `created_at`

Audit checks use stable ids and categories:

- `url_quality`: valid URL and HTTPS signal.
- `robots_ai_access`: AI crawler access recommendations for GPT, Gemini/Google, Claude, Perplexity, and Bing/Copilot.
- `sitemap`: sitemap presence recommendation.
- `llms_txt`: `llms.txt` presence and quality recommendation.
- `json_ld`: Organization/Product/FAQ schema recommendation.
- `direct_answer`: direct-answer content pattern.
- `fact_density`: product specs, tables, and measurable claims.
- `eeat`: author, company, credential, and trust signals.
- `third_party_validation`: Reddit, Quora, LinkedIn, directories, industry forums, and partner proof surfaces.

Because v0.10 does not do live crawling, checks should be deterministic from the input and existing workspace data. Messages must clearly distinguish "detected from local input" from "recommended to verify on live site."

### Asset Generation

Generate assets from an audit record:

- `llms_txt`: concise Markdown site summary.
- `organization_json_ld`: JSON string for Organization schema.
- `product_json_ld`: JSON string for Product or SoftwareApplication schema.
- `faq_json_ld`: JSON string for FAQPage schema.
- `article_brief`: Direct Answer + facts + FAQ + comparison outline.
- `distribution_brief`: prioritized platform list and article types.

Assets are stored with:

- `id`
- `audit_id`
- `asset_type`
- `title`
- `content`
- `content_type`
- `created_at`

The UI can show asset previews in read-only text areas or code blocks. Download can be added later; v0.10 only needs copyable previews.

### API

Add routes under the existing International GEO API group:

- `GET /api/v1/international-geo/site-audits`
- `GET /api/v1/international-geo/site-audits/:id`
- `POST /api/v1/international-geo/site-audits`
- `POST /api/v1/international-geo/site-audits/:id/assets`

Keep existing routes:

- `POST /api/v1/international-geo/audit`
- `POST /api/v1/international-geo/artifacts`

Existing routes should continue to work. They may delegate to the new site audit and asset generation helpers so the page has one coherent data model.

### UI

Use the existing dense dark admin style from `DESIGN.md`.

Inside the International GEO page:

- Add a compact "站点 GEO 审计" panel near the top.
- Show input fields and a primary action to run the audit.
- Show the latest audit summary as info rows and a checks table.
- Show recent audit records as a compact table.
- Show generated assets in a "GEO 资产" panel with tabs or stacked previews:
  - `llms.txt`
  - Organization JSON-LD
  - Product JSON-LD
  - FAQ JSON-LD
  - Article brief
  - Distribution brief

Do not add hero sections, marketing cards, decorative gradients, or a new navigation model.

### Audit Events

Record audit events for:

- `international_geo.site_audit.create`
- `international_geo.assets.generate`

Audit event details must not include secrets. Website URL, product name, market, score, status, and generated asset count are acceptable.

### Persistence

Site audit records and generated assets should be included in the existing local runtime snapshot and backup/import flow, following existing `internationalGeoState` persistence patterns.

## Out Of Scope

- Live crawling of the target website.
- Fetching or parsing remote robots, sitemap, HTML, or schema.
- Real ChatGPT/Gemini/Claude/Perplexity/Copilot querying.
- Real SERP APIs.
- Automatic publishing to CMS, Reddit, Quora, Medium, LinkedIn, or directories.
- Download files for generated assets.
- Multi-tenant storage or database migrations.
- External credential management.

## Data Flow

1. Operator opens International GEO.
2. Existing bootstrap loads `internationalGeo`.
3. Operator edits site audit input.
4. Frontend calls `POST /api/v1/international-geo/site-audits`.
5. Server delegates to `createInternationalGeoSiteAuditAction()`.
6. `mock-data.mjs` creates deterministic checks, score, status, summary, and audit event.
7. UI updates latest audit, recent audits, summary metrics, and check table.
8. Operator clicks generate assets.
9. Frontend calls `POST /api/v1/international-geo/site-audits/:id/assets`.
10. Server delegates to `generateInternationalGeoSiteAuditAssetsAction()`.
11. `mock-data.mjs` creates asset records and audit event.
12. UI displays copyable asset previews.

## Error Handling

- Invalid or missing URL returns a validation error and does not create an audit record.
- Missing product name falls back to workspace product name when available; otherwise validation fails.
- Asset generation for an unknown audit id returns 404.
- Viewer role cannot create audits or assets; editor/admin/owner can.
- Existing API-key automation path remains supported.

## Testing

Extend `verify-mvp.mjs` before implementation:

- Unauthenticated site audit creation is denied.
- Owner/editor can create a site audit.
- Invalid URL is rejected.
- Audit response includes stable check ids and score/status summary.
- Viewer cannot create site audit assets.
- Owner/editor can generate assets for an audit.
- Assets include `llms_txt`, Organization JSON-LD, Product JSON-LD, FAQ JSON-LD, article brief, and distribution brief.
- Bootstrap International GEO data includes recent site audits and generated assets.
- International GEO UI renders the site audit form, latest audit checks table, recent audits, and asset previews.

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

Add:

- `docs/STAGE_V0_10_CLOSEOUT.md`

## Success Criteria

- `npm run check` passes locally.
- Static SEO scan reports 0 errors and 0 warnings.
- GitHub Actions `check` passes after push.
- The International GEO page supports the end-to-end operator loop:
  input site context -> create audit -> inspect checks -> generate assets -> inspect copyable output.
- Documentation clearly states that v0.10 is a rule-first site audit and asset generator, not a live AI search monitoring system.
