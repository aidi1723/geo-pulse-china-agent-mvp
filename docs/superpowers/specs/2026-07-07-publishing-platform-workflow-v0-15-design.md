# Publishing Platform Workflow v0.15 Design

## Goal

Add a conservative publishing-platform workflow for International GEO.

v0.15 should help operators decide where approved GEO evidence assets should be distributed, generate platform-specific review packages, and track manual publishing, indexing, AI mention, citation, and recommendation status. The stage outcome is a local operating layer for platform planning and handoff, not automatic external publishing or real AI engine monitoring.

## Current State

v0.14 can:

- create International GEO site audits,
- attach guarded crawl evidence for homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`,
- explain deterministic scoring with `score_breakdown`,
- store AI visibility prompt sets, provider readiness, runs, and snapshots,
- generate evidence-driven local GEO assets from score deductions, crawl evidence, visibility gaps, and rule-first input,
- render evidence opportunities, asset queue rows, generated asset previews, provenance metadata, and approve/reject review state,
- keep AI visibility data explicitly labeled as `measured`, `simulated`, or `unavailable`.

The missing link is distribution planning. Operators can create reviewable local assets, but they do not yet have a structured answer to: which platform should this asset go to, what platform-specific package should be reviewed, what URL was manually published, and whether that URL has been indexed, mentioned, cited, or recommended.

## Product Boundary

v0.15 adds:

- a local International GEO publishing platform matrix,
- AI visibility fit scoring per platform and engine,
- platform-specific package recommendations from approved evidence assets,
- a publishing package queue,
- deterministic platform package previews,
- manual status tracking for package review, manual publication, indexing, AI mention, citation, and recommendation,
- UI panels inside International GEO for platform matrix, package queue, and tracking ledger,
- API contracts for reading the matrix, generating packages, reviewing packages, and updating tracking status.

v0.15 does not add:

- automatic posting to CMS, social, community, directory, review, video, or SaaS-listing platforms,
- external account credentials,
- live platform API integrations,
- full long-form article generation,
- live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, or indexing-provider calls,
- claims that a URL is indexed, cited, mentioned, ranked, or recommended unless a user records that status manually or a future approved connector supplies evidence,
- database migrations,
- multi-tenant SaaS isolation.

## Recommended Approach

Use a deterministic local model in `mock-data.mjs` and keep the workflow inside International GEO.

The product should connect directly to v0.14 evidence assets:

1. Operator approves evidence assets.
2. System recommends suitable platforms for each approved asset type.
3. Operator generates review packages.
4. System creates platform-specific package previews with a clear manual handoff checklist.
5. Operator marks packages approved or rejected.
6. Operator records manual publication URLs and tracking statuses.
7. Future connector work can replace manual tracking fields with measured evidence, but v0.15 must not claim live measurement.

This stage should reuse the existing dense admin style from `DESIGN.md` and existing local mock-state/API/UI patterns.

## Data Model

### Publishing Platform

```js
{
  id: "geopub_official_blog",
  platform_type: "owned",
  platform_key: "official_blog",
  platform_name: "Official Blog",
  category: "owned_site",
  recommended_asset_types: ["definition_brief", "buyer_guide_brief", "comparison_brief"],
  supported_package_types: ["website_article_brief", "comparison_page_brief", "faq_page_brief"],
  ai_visibility_fit: {
    chatgpt_search: "high",
    claude: "high",
    perplexity: "high",
    google_ai_overviews: "high",
    gemini: "high",
    copilot_bing: "medium"
  },
  indexing_value: "high",
  citation_value: "high",
  entity_validation_value: "medium",
  risk_level: "low",
  publishing_mode: "manual",
  connector_status: "not_supported",
  review_policy: "human_required",
  notes: "Use canonical owned pages with JSON-LD, sitemap, and llms.txt references."
}
```

Allowed `platform_type` values:

- `owned`
- `developer`
- `professional_social`
- `community`
- `qa`
- `video`
- `newsletter`
- `directory`
- `review_site`
- `knowledge_base`

Default platform keys:

- `official_blog`
- `docs`
- `github`
- `linkedin_company`
- `linkedin_founder`
- `reddit`
- `quora`
- `youtube`
- `medium`
- `devto`
- `hashnode`
- `product_hunt`
- `g2`
- `capterra`
- `alternative_to`
- `saasworthy`

Allowed `risk_level` values:

- `low`
- `medium`
- `high`

Allowed `publishing_mode` values:

- `manual`
- `export_only`
- `future_connector`

### Publishing Package

```js
{
  id: "geopkg_...",
  source_asset_id: "geoasset_...",
  source_asset_type: "comparison_brief",
  platform_id: "geopub_linkedin_company",
  platform_name: "LinkedIn Company Page",
  package_type: "linkedin_post",
  title: "LinkedIn post package for AI visibility comparison",
  target_prompt: "best GEO platform for B2B exporters",
  target_url: "https://example.com",
  canonical_url: "https://example.com/compare/geo-platforms",
  package_status: "draft_package",
  review_status: "pending_review",
  content_type: "text/markdown",
  content: "## LinkedIn package\n\n...",
  checklist: [
    "Confirm canonical URL.",
    "Remove unsupported claims.",
    "Add approved product proof."
  ],
  evidence_source_type: "visibility_gap",
  evidence_source_id: "aivs_...",
  evidence_summary: "Provider data is unavailable; this package prepares an owned source.",
  confidence: "medium",
  created_at: "2026-07-07T00:00:00.000Z",
  reviewed_at: null,
  human_notes: ""
}
```

Allowed `package_type` values:

- `website_article_brief`
- `docs_update_brief`
- `github_readme_update`
- `linkedin_post`
- `reddit_answer`
- `quora_answer`
- `youtube_outline`
- `medium_article_brief`
- `devto_article_brief`
- `newsletter_brief`
- `product_hunt_listing`
- `g2_profile_checklist`
- `capterra_profile_checklist`
- `directory_listing_checklist`

Allowed `package_status` values:

- `draft_package`
- `approved_package`
- `rejected_package`
- `exported`
- `manually_published`

Allowed `review_status` values:

- `pending_review`
- `approved`
- `rejected`

### Publishing Tracking Record

```js
{
  id: "geotrack_...",
  package_id: "geopkg_...",
  platform_id: "geopub_linkedin_company",
  platform_name: "LinkedIn Company Page",
  source_asset_id: "geoasset_...",
  published_url: "https://www.linkedin.com/company/example/posts/...",
  canonical_url: "https://example.com/compare/geo-platforms",
  target_prompt: "best GEO platform for B2B exporters",
  publication_status: "manually_published",
  indexing_status: "unknown",
  ai_mention_status: "unknown",
  citation_status: "unknown",
  recommendation_status: "unknown",
  evidence_url: "",
  evidence_note: "",
  last_checked_at: null,
  updated_at: "2026-07-07T00:00:00.000Z"
}
```

Allowed tracking values:

- `publication_status`: `planned`, `packaged`, `manually_published`, `not_published`, `blocked`
- `indexing_status`: `unknown`, `not_checked`, `not_indexed`, `indexed`, `blocked`
- `ai_mention_status`: `unknown`, `not_checked`, `not_mentioned`, `mentioned`, `blocked`
- `citation_status`: `unknown`, `not_checked`, `not_cited`, `cited`, `blocked`
- `recommendation_status`: `unknown`, `not_checked`, `not_recommended`, `recommended`, `blocked`

Manual tracking must never be shown as measured provider evidence unless a future connector adds provider metadata and permission evidence.

## Platform Recommendation Rules

Use deterministic local rules. Do not call external platforms.

Default asset-to-platform mappings:

- `llms_txt_update`: `official_blog`, `docs`
- `json_ld_patch`: `official_blog`, `docs`
- `faq_block`: `official_blog`, `docs`, `quora`
- `comparison_brief`: `official_blog`, `linkedin_company`, `reddit`, `quora`, `medium`, `product_hunt`, `alternative_to`
- `alternatives_brief`: `official_blog`, `reddit`, `quora`, `medium`, `alternative_to`, `saasworthy`
- `definition_brief`: `official_blog`, `docs`, `github`, `linkedin_company`, `medium`, `devto`, `hashnode`
- `product_spec_brief`: `docs`, `github`, `official_blog`, `g2`, `capterra`
- `buyer_guide_brief`: `official_blog`, `linkedin_company`, `youtube`, `g2`, `capterra`, `saasworthy`

Engine-fit direction:

- ChatGPT Search and Claude: owned site, docs, GitHub, clear structured content, `llms.txt`, JSON-LD.
- Google AI Overviews and Gemini: owned site, sitemap, structured data, helpful content, third-party validation.
- Perplexity: owned source plus community, Q&A, video, and third-party context.
- Copilot / Bing: owned pages, Bing-discoverable content, docs, LinkedIn, and Microsoft-indexable pages.

Risk rules:

- Owned site/docs/GitHub: low risk.
- LinkedIn/Medium/Dev.to/Hashnode/YouTube/Product Hunt/directories: medium risk.
- Reddit/Quora/community answers: high risk unless the package is framed as a helpful answer and not a promotional post.

## Package Generation Rules

Generated packages should be concise, deterministic, and review-first.

### `website_article_brief`

Include:

- direct answer upfront,
- target prompt,
- canonical URL recommendation,
- outline,
- proof checklist,
- schema recommendation,
- source evidence note.

Do not generate a full article.

### `docs_update_brief`

Include:

- docs page target,
- feature/spec facts to verify,
- changelog or FAQ insertion point,
- JSON-LD or `llms.txt` linkage note.

### `github_readme_update`

Include:

- README section suggestion,
- install/use-case placeholder,
- links to official docs,
- limitations and review checklist.

### `linkedin_post`

Include:

- short professional post,
- no unsupported superlatives,
- canonical link,
- evidence note,
- human review checklist.

### `reddit_answer` and `quora_answer`

Include:

- helpful answer structure,
- disclosure reminder,
- avoid promotional tone,
- canonical source link only if relevant,
- moderation risk note.

### `youtube_outline`

Include:

- video title,
- 5 to 7 section outline,
- proof/demo requirements,
- description link checklist.

### `product_hunt_listing`, `g2_profile_checklist`, `capterra_profile_checklist`, `directory_listing_checklist`

Include:

- profile fields,
- category recommendation,
- positioning statement,
- proof/screenshots needed,
- review checklist.

## Data Flow

1. Operator generates and approves evidence assets in International GEO.
2. Operator opens publishing workflow inside International GEO.
3. System reads approved evidence assets and platform matrix.
4. Operator clicks `生成发布包`.
5. System creates package recommendations and draft packages.
6. Operator reviews and approves or rejects packages.
7. Operator manually publishes outside the product when appropriate.
8. Operator records published URL, canonical URL, and tracking statuses.
9. UI shows local tracking ledger and clear `manual` / `unknown` / `not_checked` states.

## UI Design

Keep the existing dense admin style from `DESIGN.md`.

Add compact panels inside International GEO:

- `发布平台矩阵`
  - platform,
  - platform type,
  - best asset types,
  - engine fit,
  - indexing/citation/entity value,
  - risk level,
  - publishing mode.
- `发布包队列`
  - package title,
  - source evidence asset,
  - platform,
  - package type,
  - review status,
  - package status,
  - actions: `生成发布包`, `审核通过`, `驳回`.
- `收录与推荐追踪`
  - platform,
  - published URL,
  - canonical URL,
  - publication status,
  - indexing status,
  - AI mention status,
  - citation status,
  - recommendation status,
  - updated time.

Do not add:

- new top-level navigation,
- automatic publish buttons,
- credential inputs,
- live provider measurement labels,
- marketing layout or hero sections.

## API Shape

Add narrow routes under International GEO:

```text
GET /api/v1/international-geo/publishing
GET /api/v1/international-geo/publishing/platforms
GET /api/v1/international-geo/publishing/packages
GET /api/v1/international-geo/publishing/tracking
POST /api/v1/international-geo/publishing/packages/generate
POST /api/v1/international-geo/publishing/packages/:id/review
PUT /api/v1/international-geo/publishing/tracking/:id
```

Response shape:

```js
{
  summary: {
    platform_count: 15,
    package_count: 8,
    approved_package_count: 0,
    manually_published_count: 0,
    indexed_count: 0,
    mentioned_count: 0,
    cited_count: 0,
    recommended_count: 0
  },
  platforms: [],
  packages: [],
  tracking: []
}
```

Authorization:

- viewer can read publishing workflow state,
- editor/admin/owner can generate packages, review packages, and update tracking records,
- `X-GEO-API-Key` can run controlled local generation/update,
- raw external platform credentials are not accepted or returned in v0.15.

## Error Handling

- `POST /publishing/packages/generate` succeeds with an empty package queue if no approved evidence assets exist, and returns a summary explaining no approved source assets were available.
- invalid package review action returns `400 VALIDATION_ERROR`.
- unknown package id returns `404 NOT_FOUND`.
- invalid tracking status returns `400 VALIDATION_ERROR`.
- unknown tracking id returns `404 NOT_FOUND`.
- tracking update must reject empty or non-http published URLs when publication status is `manually_published`.
- package generation should not fail because one platform is missing; it should skip invalid platform ids and continue with valid recommendations.

## Static Preview Compatibility

Static preview should continue to render International GEO without server writes.

In static preview:

- `GET /international-geo` may include seeded publishing workflow examples,
- write actions such as package generation, package review, and tracking update should use existing static write error behavior.

## Testing

Extend `verify-mvp.mjs` before implementation.

Required assertions:

- publishing workflow state exposes `summary`, `platforms`, `packages`, and `tracking`,
- platform matrix includes all default platform keys,
- platform rows include AI engine fit, risk level, publishing mode, and supported package types,
- package generation from approved evidence assets creates at least six package types,
- generated packages keep source evidence provenance,
- package review approve/reject works,
- invalid package review is rejected,
- tracking status update works for manual published URLs,
- invalid tracking status is rejected,
- viewer can read publishing state over HTTP,
- viewer cannot generate packages, review packages, or update tracking,
- owner can generate packages, review packages, and update tracking,
- International GEO UI renders `发布平台矩阵`, `发布包队列`, and `收录与推荐追踪`,
- UI labels make manual/local boundary visible.

## Documentation

Update:

- `package.json` to `0.15.0`,
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
- create `docs/STAGE_V0_15_CLOSEOUT.md`.

Docs must state that v0.15 creates local publishing platform plans, review packages, and manual tracking records only. It does not automatically publish externally, manage external credentials, generate full articles, or measure real AI engine inclusion.

## Rollback

Starting checkpoint: `main` at `5015e94 fix: expose all evidence asset reviews`.

Rollback trigger:

- UI or docs imply automatic external publishing,
- UI or docs imply measured indexing, citation, mention, or recommendation without manual or connector evidence,
- package generation creates full articles instead of review packages,
- package generation loses evidence provenance,
- viewer can generate/review/update publishing records,
- `npm run check` cannot pass.

Recovery:

- revert v0.15 implementation commits,
- keep this design spec if implementation needs replanning,
- local JSON state may contain demo package/tracking rows and can be reset through existing runtime reset or backup restore flow.

Non-reversible risks:

- none expected in v0.15 because it uses local mock-state structures and no external publishing or provider calls.

## Self-Review

- Scope is limited to local platform matrix, package queue, deterministic package previews, manual tracking, UI panels, APIs, docs, and tests.
- The design does not add automatic external publishing, account credentials, full article generation, live AI/search provider calls, database migrations, or SaaS isolation.
- Field names are consistent across the data model: `platform_id`, `source_asset_id`, `package_type`, `package_status`, `review_status`, `publication_status`, `indexing_status`, `ai_mention_status`, `citation_status`, `recommendation_status`.
- The UI remains inside the existing International GEO page and follows the dense admin style.
