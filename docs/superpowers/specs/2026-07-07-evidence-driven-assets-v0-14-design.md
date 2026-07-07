# Evidence-Driven Assets v0.14 Design

## Goal

Add an evidence-driven content opportunity and GEO asset generation queue for International GEO.

v0.14 should turn existing site audit evidence, scoring deductions, crawl findings, and AI visibility prompt gaps into reviewable content opportunities and copyable GEO assets. The stage outcome is an operator workflow from evidence to asset briefs, not full article generation, automatic publishing, or real AI search monitoring.

## Current State

v0.13 can:

- create International GEO site audits,
- attach guarded crawl evidence for homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`,
- explain deterministic scoring with `score_breakdown`, check-level deductions, priority, confidence, and next actions,
- generate first-generation GEO assets from site audits,
- store AI visibility prompt sets, provider readiness, measurement runs, and prompt snapshots,
- label AI visibility data as `measured`, `simulated`, or `unavailable`.

The missing link is prioritization. Operators can see many findings, but they do not yet have a queue that answers: which content or GEO asset should be created next, why, from which evidence, and what exact draft should be reviewed.

## Product Boundary

v0.14 adds:

- evidence-driven asset opportunities,
- an asset generation queue,
- generated asset previews tied to evidence or rules,
- review actions for generated assets,
- International GEO panels for opportunities, queue status, and evidence-backed asset previews,
- API contracts for generating and reviewing assets.

v0.14 does not add:

- full article draft generation,
- automatic CMS, social, community, or directory publishing,
- live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, or AI visibility provider calls,
- recursive crawling or JavaScript rendering,
- paid provider integrations,
- database migrations,
- multi-tenant SaaS isolation.

## Recommended Approach

Use a deterministic local asset model in `mock-data.mjs`. Opportunities are derived from existing local records:

- `score_deduction`: high or medium priority site audit checks with deductions or next actions.
- `crawl_evidence`: missing or weak crawl resources such as unavailable `/llms.txt`, thin homepage evidence, or missing JSON-LD types.
- `visibility_gap`: unavailable visibility snapshots or prompt sets that have no measured provider evidence.
- `rule_first`: local rules from International GEO input when live evidence is unavailable.

Each generated asset must carry provenance. It should never appear as a free-floating AI draft. The user should be able to see what evidence or rule produced it and whether it needs human review.

## Data Model

### Asset Opportunity

```js
{
  id: "geoopp_...",
  source_type: "score_deduction",
  source_id: "sga_...:json_ld",
  source_label: "JSON-LD Schema",
  severity: "high",
  priority: "high",
  confidence: "medium",
  market: "US",
  language: "en-US",
  target_url: "https://example.com",
  target_prompt: "best GEO platform for B2B exporters",
  asset_type: "json_ld_patch",
  title: "Add SoftwareApplication JSON-LD for GEO Pulse",
  reason: "Product entity markup is missing from the audited homepage.",
  evidence_summary: "Audit check json_ld awarded 4/14 points and recommends Product or SoftwareApplication schema.",
  recommended_action: "Generate a JSON-LD patch and review it before adding it to the website.",
  status: "open",
  created_at: "2026-07-07T00:00:00.000Z"
}
```

Allowed `source_type` values:

- `score_deduction`
- `crawl_evidence`
- `visibility_gap`
- `rule_first`

Allowed `asset_type` values:

- `llms_txt_update`
- `json_ld_patch`
- `faq_block`
- `comparison_brief`
- `alternatives_brief`
- `definition_brief`
- `product_spec_brief`
- `buyer_guide_brief`

### Asset Queue Item

```js
{
  id: "geoqueue_...",
  opportunity_id: "geoopp_...",
  asset_type: "faq_block",
  title: "Private deployment FAQ block",
  status: "queued",
  review_status: "pending_review",
  source_type: "visibility_gap",
  source_id: "aivs_...",
  assigned_to: "",
  queued_at: "2026-07-07T00:00:00.000Z",
  generated_at: null,
  reviewed_at: null
}
```

Allowed `status` values:

- `queued`
- `generated`
- `approved`
- `rejected`

Allowed `review_status` values:

- `pending_review`
- `approved`
- `rejected`

### Generated Evidence Asset

```js
{
  id: "geoasset_...",
  queue_item_id: "geoqueue_...",
  opportunity_id: "geoopp_...",
  asset_type: "faq_block",
  title: "FAQ: Private AI agent deployment for export sales teams",
  content_type: "text/markdown",
  content: "## FAQ\n\n### ...",
  evidence_source_type: "visibility_gap",
  evidence_source_id: "aivs_...",
  evidence_summary: "Prompt snapshot is unavailable because no approved provider is configured.",
  confidence: "medium",
  review_status: "pending_review",
  human_notes: "",
  created_at: "2026-07-07T00:00:00.000Z",
  reviewed_at: null
}
```

## Opportunity Generation Rules

### From Site Audit Scoring

For the latest International GEO site audit:

- create one opportunity for every check with `priority` `high` or `medium`,
- prefer checks with `score_deduction > 0`,
- use the first `next_actions` item as `recommended_action`,
- use the first `deduction_reasons` item as `reason` when available.

Default mapping:

- `llms_txt` -> `llms_txt_update`
- `json_ld` -> `json_ld_patch`
- `direct_answer` -> `definition_brief`
- `fact_density` -> `product_spec_brief`
- `eeat` -> `buyer_guide_brief`
- `third_party_validation` -> `comparison_brief`
- `robots_ai_access` -> `buyer_guide_brief`
- `sitemap` -> `definition_brief`
- `url_quality` -> `definition_brief`

### From Crawl Evidence

Create crawl evidence opportunities when:

- `/llms.txt` is unavailable or empty,
- homepage evidence has no JSON-LD types,
- sitemap evidence has zero URLs,
- homepage text excerpt is unavailable,
- robots evidence has no relevant search or AI crawler mentions.

These opportunities use `source_type: "crawl_evidence"` and reference the resource key in `source_id`.

### From Visibility Gaps

Create visibility gap opportunities when:

- a visibility snapshot has `data_status: "unavailable"`,
- a prompt set exists but no snapshots exist yet,
- a prompt set targets an engine with provider readiness `unavailable`.

Default mapping:

- comparison or alternatives intent -> `comparison_brief` or `alternatives_brief`,
- definition or education intent -> `definition_brief`,
- deployment, security, pricing, or support intent -> `faq_block`,
- product specs or buyer criteria intent -> `product_spec_brief` or `buyer_guide_brief`.

Visibility gap assets must not imply the brand was mentioned, cited, ranked, or recommended. They should say the asset is intended to prepare a citation-ready source for future measurement.

### Rule-First Fallback

If no site audit or visibility snapshots exist, create a small rule-first queue from International GEO input:

- `llms_txt_update`
- `json_ld_patch`
- `faq_block`
- `definition_brief`

Each fallback opportunity must show `confidence: "low"` and `source_type: "rule_first"`.

## Asset Generation Rules

Generated assets should be deterministic and concise.

### `llms_txt_update`

Markdown summary with:

- product or brand name,
- target audience,
- target URL,
- core topics,
- important pages or suggested page entries,
- competitor comparison context when available.

### `json_ld_patch`

JSON-LD snippet for `Organization`, `Product`, `SoftwareApplication`, or `FAQPage` when evidence supports the type. If product facts are incomplete, the snippet should use conservative review markers such as `"description": "Review and replace with approved product description"` instead of inventing claims.

### `faq_block`

Markdown FAQ with 4 to 6 questions. Each answer should begin with a direct answer and include an evidence note.

### `comparison_brief`

Markdown brief with:

- direct answer upfront,
- comparison criteria,
- competitor context,
- proof needed,
- table outline,
- review checklist.

### `alternatives_brief`

Markdown brief for "alternatives to X" or category alternatives. It should avoid naming a competitor as inferior unless evidence supports the claim.

### `definition_brief`

Markdown brief for category/entity definition pages. It should define the product category, audience, use cases, facts needed, FAQ candidates, and schema recommendation.

### `product_spec_brief`

Markdown brief focused on facts, specs, integrations, deployment requirements, security, support, pricing caveats, and source requirements.

### `buyer_guide_brief`

Markdown brief for decision-stage buyers. It should include evaluation criteria, risk questions, proof checklist, and next-step CTA.

## Data Flow

1. Operator runs or uses an existing International GEO site audit.
2. Operator runs or uses existing AI visibility measurement snapshots.
3. Operator clicks "生成证据资产" in International GEO.
4. System derives asset opportunities from scoring, crawl evidence, visibility gaps, or rule-first input.
5. System creates queue items for selected opportunities.
6. System generates deterministic asset previews.
7. Operator reviews each generated asset and marks it approved or rejected.
8. Approved assets remain copyable in International GEO; they are not published automatically.

## UI Design

Keep the existing dense admin style from `DESIGN.md`.

Add compact panels inside International GEO:

- `证据驱动内容机会`
  - source type,
  - severity,
  - asset type,
  - title,
  - evidence summary,
  - recommended action,
  - status.
- `资产生成队列`
  - queue id,
  - asset type,
  - source type,
  - status,
  - review status,
  - generated time.
- `GEO 资产`
  - continue rendering copyable previews,
  - add source type, confidence, review status, and evidence summary.

Actions:

- `生成证据资产`: derive opportunities and generate queue previews.
- `审核通过`: mark generated asset approved.
- `驳回`: mark generated asset rejected.

Do not add:

- a new top-level navigation item,
- a marketing layout,
- large hero sections,
- automatic publish buttons,
- hidden claims that unavailable visibility data is measured.

## API Shape

Add narrow routes under International GEO:

```text
GET /api/v1/international-geo/evidence-assets
GET /api/v1/international-geo/evidence-assets/opportunities
GET /api/v1/international-geo/evidence-assets/queue
POST /api/v1/international-geo/evidence-assets/generate
POST /api/v1/international-geo/evidence-assets/:id/review
```

Response shape:

```js
{
  summary: {
    opportunity_count: 8,
    queued_count: 8,
    generated_count: 8,
    approved_count: 0,
    rejected_count: 0
  },
  opportunities: [],
  queue: [],
  assets: []
}
```

Authorization:

- viewer can read evidence asset state,
- editor/admin/owner can generate and review evidence assets,
- `X-GEO-API-Key` can run controlled local generation,
- raw provider credentials are never returned.

## Error Handling

- `POST /evidence-assets/generate` succeeds with rule-first fallback when no audit or visibility snapshots exist.
- invalid review action returns `400 VALIDATION_ERROR`.
- unknown generated asset id returns `404 NOT_FOUND`.
- generation should not fail because one evidence source is missing; it should record an opportunity with low confidence or skip that source.
- rejected assets remain visible with `review_status: "rejected"` and are not deleted.

## Static Preview Compatibility

Static preview should continue to render International GEO without server writes.

In static preview:

- `GET /international-geo` may include seeded evidence asset examples,
- write actions such as generate and review should use the existing static write error behavior.

## Testing

Extend `verify-mvp.mjs` before implementation.

Required assertions:

- evidence asset state exposes `summary`, `opportunities`, `queue`, and `assets`,
- opportunities include at least one `score_deduction` source when the latest audit has scoring deductions,
- opportunities include at least one `visibility_gap` source when snapshots are unavailable,
- generated assets include at least six asset types,
- every generated asset has `evidence_source_type`, `evidence_source_id`, `evidence_summary`, and `confidence`,
- review action can approve and reject assets,
- invalid review action is rejected,
- viewer can read evidence assets over HTTP,
- viewer cannot generate or review assets,
- owner can generate and review assets,
- International GEO UI renders `证据驱动内容机会`, `资产生成队列`, and evidence-backed asset metadata.

## Documentation

Update:

- `package.json` to `0.14.0`,
- `CHANGELOG.md`,
- `README.md`,
- `docs/API_REFERENCE.md`,
- `docs/ARCHITECTURE.md`,
- `docs/DEVELOPMENT.md`,
- `docs/ROADMAP.md`,
- `docs/PHASE_2_ROADMAP.md`,
- `docs/PRODUCTION_DEPLOYMENT.md`,
- `docs/OPEN_SOURCE_RELEASE.md`,
- `docs/README.md`,
- `docs/MAINTENANCE.md`,
- create `docs/STAGE_V0_14_CLOSEOUT.md`.

Docs must state that v0.14 generates reviewable local assets only. It does not publish externally, generate full articles, or measure real AI engine inclusion.

## Rollback

Starting checkpoint: `main` at `00c3c0a merge: international geo visibility foundation v0.13`.

Rollback trigger:

- generated assets appear without evidence provenance,
- UI implies assets were published or externally measured,
- `npm run check` cannot pass,
- API leaks raw credentials or provider internals.

Recovery:

- revert the v0.14 implementation commits,
- keep this design spec if the implementation needs to be replanned,
- local JSON state may contain generated demo assets and can be reset through the existing runtime reset or backup restore flow.

Non-reversible risks:

- none expected in v0.14 because it uses local mock-state structures and no external publishing or provider calls.

## Self-Review

- Scope is limited to evidence opportunities, queue records, generated local assets, review state, UI panels, APIs, docs, and tests.
- The design does not add full article generation, automatic publishing, real AI/search provider calls, database migrations, or SaaS isolation.
- Field names are consistent across the data model: `source_type`, `asset_type`, `evidence_source_type`, `evidence_source_id`, `evidence_summary`, `confidence`, `review_status`.
- The UI remains inside the existing International GEO page and follows the dense admin style.
