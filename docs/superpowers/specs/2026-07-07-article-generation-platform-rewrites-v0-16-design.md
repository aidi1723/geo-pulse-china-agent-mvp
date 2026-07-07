# Article Generation And Platform Rewrites v0.16 Design

## Goal

Add the main International GEO content capability: generate complete, reviewable articles from approved evidence assets, then create platform-specific rewrites for high-authority publishing destinations.

v0.16 should turn the current v0.15 handoff workflow into a stronger content production workflow. Operators should be able to approve evidence, generate a full GEO-ready article, generate platform rewrites, review each output, and carry approved outputs into the existing publishing package and tracking workflow.

## Current State

v0.15 can:

- run International GEO site audits from website, product, market, language, buyer query, and competitor input,
- attach guarded crawl evidence for homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`,
- produce deterministic scoring and evidence-driven asset opportunities,
- generate local evidence assets such as `llms.txt` updates, JSON-LD patches, FAQ blocks, comparison briefs, alternatives briefs, definition briefs, product spec briefs, and buyer guide briefs,
- approve or reject evidence assets,
- list high-authority publishing platforms and explain their authority signal and AI recommendation-probability value,
- generate review-only publishing packages from approved evidence assets,
- manually track publication URL, indexing status, AI mention status, citation status, and recommendation status.

The missing core capability is complete content generation. Current International GEO assets and publishing packages are briefs, outlines, checklists, or short handoff packages. They are useful for planning but do not yet produce complete article drafts or platform-ready rewrites.

## Product Boundary

v0.16 adds:

- local-rule complete article generation from approved International GEO evidence assets,
- local-rule multi-platform rewrites from approved complete articles,
- a generation provider field with `local_rules` as the only active provider,
- a reserved provider seam for future `openai`, `claude`, or `gemini` providers,
- article and rewrite review states,
- provenance fields linking each output to approved evidence assets,
- International GEO UI panels for article generation, platform rewrites, and generation runs,
- API contracts for reading generation state, generating articles, generating rewrites, and reviewing generated outputs,
- documentation and tests that keep the workflow clearly local, evidence-backed, and review-first.

v0.16 does not add:

- external AI model calls,
- OpenAI, Claude, Gemini, or other LLM credentials,
- automatic third-party publishing,
- real external platform API calls,
- real AI engine inclusion, citation, recommendation, or indexing measurement,
- automatic approval of generated claims,
- database migrations,
- multi-tenant SaaS isolation.

## Recommended Approach

Use the existing International GEO state and add a deterministic local generation layer.

The implementation should not create a parallel content product. It should extend the current International GEO chain:

1. Operator runs audit and generates evidence assets.
2. Operator approves evidence assets.
3. System generates complete articles from approved evidence assets.
4. Operator approves or rejects complete articles.
5. System generates platform rewrites from approved complete articles.
6. Operator approves or rejects platform rewrites.
7. Approved rewrites can be used as stronger publishing package content or copied for manual publishing.

The local generator should be deterministic and testable. Future provider integration should replace only the generation engine, not the API shape or review workflow.

## Data Model

### Generation Provider

```js
{
  id: "local_rules",
  label: "Local Rules",
  status: "active",
  provider_type: "local",
  external_credentials_required: false,
  supported_outputs: ["article", "platform_rewrite"],
  notes: "Deterministic local generator. No external AI calls."
}
```

Future provider ids are reserved but inactive:

- `openai`
- `claude`
- `gemini`

### Generated Article

```js
{
  id: "geoart_...",
  source_asset_ids: ["geoasset_..."],
  source_asset_types: ["comparison_brief", "definition_brief"],
  generator_provider: "local_rules",
  generation_run_id: "geogen_...",
  title: "Best GEO platform for B2B teams",
  target_prompt: "best GEO platform for B2B teams",
  target_market: "Global",
  target_language: "en",
  target_url: "https://example.com",
  canonical_url: "https://example.com",
  article_type: "geo_article",
  content_type: "text/markdown",
  word_count_estimate: 1200,
  review_status: "pending_review",
  article_status: "draft",
  content: "# Best GEO platform...\n\n...",
  outline: [
    "Direct Answer Upfront",
    "Problem definition",
    "Evidence table",
    "Buyer decision criteria",
    "FAQ"
  ],
  evidence_summary: "Uses approved comparison and definition evidence assets.",
  risk_notes: [
    "Verify unsupported claims before publishing.",
    "Keep canonical URL aligned with the public page."
  ],
  created_at: "2026-07-07T00:00:00.000Z",
  reviewed_at: null,
  human_notes: ""
}
```

Allowed `article_status` values:

- `draft`
- `approved_article`
- `rejected_article`
- `rewrites_generated`

Allowed `review_status` values:

- `pending_review`
- `approved`
- `rejected`

### Platform Rewrite

```js
{
  id: "georw_...",
  source_article_id: "geoart_...",
  platform_key: "linkedin_company",
  platform_name: "LinkedIn Company Page",
  rewrite_type: "linkedin_post",
  generator_provider: "local_rules",
  generation_run_id: "geogen_...",
  title: "LinkedIn rewrite for best GEO platform",
  content_type: "text/markdown",
  content: "B2B teams evaluating GEO...",
  format_notes: [
    "Short professional post.",
    "Include canonical link only after human review."
  ],
  ai_visibility_goal: "Strengthen professional entity signal and canonical reference path.",
  moderation_notes: [
    "Avoid unsupported superlatives.",
    "Disclose product relationship if posted by a founder or employee."
  ],
  review_status: "pending_review",
  rewrite_status: "draft",
  created_at: "2026-07-07T00:00:00.000Z",
  reviewed_at: null,
  human_notes: ""
}
```

Allowed `rewrite_type` values:

- `official_blog_article`
- `medium_article`
- `devto_article`
- `hashnode_article`
- `linkedin_post`
- `reddit_answer`
- `quora_answer`
- `youtube_description`
- `github_readme_section`
- `docs_section`
- `product_hunt_listing`
- `g2_profile_copy`
- `capterra_profile_copy`
- `directory_listing`

Allowed `rewrite_status` values:

- `draft`
- `approved_rewrite`
- `rejected_rewrite`
- `packaged`

### Generation Run

```js
{
  id: "geogen_...",
  run_type: "article_generation",
  generator_provider: "local_rules",
  status: "completed",
  input_asset_count: 3,
  output_article_count: 1,
  output_rewrite_count: 0,
  diagnostics: [
    "Generated from approved evidence assets only."
  ],
  started_at: "2026-07-07T00:00:00.000Z",
  finished_at: "2026-07-07T00:00:01.000Z"
}
```

Allowed `run_type` values:

- `article_generation`
- `platform_rewrite_generation`

Allowed `status` values:

- `completed`
- `blocked`
- `failed`

## Generation Rules

### Complete Article Structure

The local article generator should create a GEO-ready article with these sections:

- Direct Answer Upfront
- Category or problem definition
- Product positioning
- Evidence table
- Buyer decision criteria
- Comparison, alternatives, or specification section when supported by evidence
- FAQ
- Schema, `/llms.txt`, and canonical URL recommendations
- Human review checklist

Each article must include:

- source asset ids,
- evidence summary,
- target prompt,
- canonical URL,
- review warning that claims must be checked before external publishing.

### Platform Rewrite Rules

Official Blog:

- full article format,
- strongest canonical source,
- supports JSON-LD, FAQ, direct-answer content, and internal links.

Medium, Dev.to, Hashnode:

- third-party long-form article,
- neutral explanatory tone,
- canonical reference back to owned URL,
- no unsupported competitive claims.

LinkedIn:

- short professional post,
- expert or company context,
- source-backed claim language,
- canonical link after review.

Reddit and Quora:

- helpful answer format,
- non-promotional tone,
- affiliation disclosure required,
- link only when directly useful.

YouTube:

- title, description, chapters, and transcript outline,
- demo and proof checklist,
- canonical links after review.

GitHub and Docs:

- technical README or docs section,
- capability boundaries,
- installation or workflow context only when verified.

Product Hunt:

- launch listing copy,
- tagline, maker note, category, screenshots checklist.

G2, Capterra, AlternativeTo, SaaSWorthy:

- profile and directory listing copy,
- category, positioning, feature proof, screenshot and review-policy checklist.

## API Design

All routes live under `/api/v1/international-geo/content-generation`.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/international-geo/content-generation` | viewer | Read providers, summary, generated articles, rewrites, and runs. |
| `POST` | `/international-geo/content-generation/articles/generate` | editor | Generate complete articles from approved evidence assets. |
| `POST` | `/international-geo/content-generation/rewrites/generate` | editor | Generate platform rewrites from approved generated articles. |
| `POST` | `/international-geo/content-generation/articles/:id/review` | editor | Approve or reject generated articles. |
| `POST` | `/international-geo/content-generation/rewrites/:id/review` | editor | Approve or reject platform rewrites. |

Review payload:

```json
{
  "action": "approve",
  "human_notes": "Checked product claims and canonical URL."
}
```

Allowed review actions:

- `approve`
- `reject`

## UI Design

Use the current dense admin style from `DESIGN.md`.

Add three panels inside International GEO after the evidence asset panels and before the publishing package panels:

- `文章生成队列`
  - shows generated articles, source evidence count, target prompt, provider, word estimate, review status, and actions.
- `多平台改写稿`
  - shows platform rewrites, source article, platform, rewrite type, AI visibility goal, review status, and actions.
- `生成记录`
  - shows generation runs, provider, input count, output counts, status, diagnostics, and timestamps.

Actions:

- `生成完整文章`
- `生成平台改写稿`
- `文章审核通过`
- `文章驳回`
- `改写稿审核通过`
- `改写稿驳回`

Empty states should explain the dependency chain:

- approve evidence assets before generating articles,
- approve articles before generating rewrites,
- approve rewrites before using them in publishing handoff.

## Publishing Workflow Integration

v0.16 should not remove v0.15 publishing packages.

Approved platform rewrites should be available as stronger handoff content for later publishing package generation. The first v0.16 implementation will keep publishing package generation deterministic from evidence assets, while storing enough ids and statuses so a follow-up patch can prefer approved rewrites as package content.

Minimum integration requirement:

- generated articles and rewrites keep source evidence ids,
- rewrites store platform keys that match the high-authority platform list,
- approved rewrites can be manually copied and tracked through the existing manual tracking workflow.

## Testing Requirements

Extend `verify-mvp.mjs` to cover:

- content generation API client methods exist,
- browser action imports and event wiring exist,
- generated articles require approved evidence assets,
- generated articles include source asset ids, provider id, evidence summary, target prompt, content, outline, and review status,
- platform rewrites require approved generated articles,
- rewrites include platform key, rewrite type, AI visibility goal, moderation notes, and review status,
- invalid review actions fail,
- viewer can read generation state,
- viewer cannot generate or review,
- editor/owner can generate and review,
- International GEO UI renders the three new panels and boundary copy,
- `npm run check` passes.

## Documentation Updates

Update:

- `README.md`
- `CHANGELOG.md`
- `docs/API_REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/ROADMAP.md`
- `docs/PHASE_2_ROADMAP.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/OPEN_SOURCE_RELEASE.md`
- `docs/README.md`
- `docs/MAINTENANCE.md`
- a new `docs/STAGE_V0_16_CLOSEOUT.md`

The docs must state:

- v0.16 generates local-rule complete articles and platform rewrites,
- outputs are reviewable drafts, not externally published pages,
- no external LLM or platform provider is called,
- no measured AI inclusion, citation, recommendation, or indexing result is inferred.

## Acceptance Criteria

- Operators can generate complete articles from approved evidence assets.
- Operators can approve or reject generated articles.
- Operators can generate platform rewrites from approved generated articles.
- Operators can approve or reject platform rewrites.
- UI exposes article, rewrite, and run state inside International GEO.
- API routes are role-protected and documented.
- All generated outputs preserve provenance.
- The external-provider seam exists but only `local_rules` is active.
- `npm run check` passes locally and in GitHub Actions after implementation.

## Non-Goals

- Automatic posting to external platforms.
- External LLM provider execution.
- Prompt billing, token usage, or model selection UI.
- Live AI search visibility measurement.
- Real indexing or citation verification.
- External platform OAuth or credential storage.
- Replacing the existing Content Center article workflow.
