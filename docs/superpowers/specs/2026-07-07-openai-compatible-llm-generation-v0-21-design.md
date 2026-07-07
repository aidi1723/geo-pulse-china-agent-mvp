# OpenAI-Compatible LLM Generation v0.21 Design

## Goal

v0.21 should make International GEO content generation materially useful by adding a configurable OpenAI-compatible LLM provider for long-form article drafts and multi-platform rewrites.

The stage keeps the current operating boundary: the system may generate reviewable content through a configured LLM endpoint, but it must not automatically register accounts, publish externally, query AI search engines, verify indexing, or claim measured AI recommendations.

## Current Baseline

v0.20 provides:

- International GEO site audit, crawl evidence, scoring, evidence assets, publishing platform planning, manual tracking, and measured-evidence operations.
- Local-rule article generation and platform rewrite generation.
- Visibility provider and publishing connector dry-run foundations.
- Delivery readiness and sanitized delivery bundle export.

The remaining content-production gap is quality: `local_rules` can produce structured drafts, but it cannot produce full, polished long-form articles at the level expected for international GEO publishing.

## Scope

v0.21 adds OpenAI-compatible LLM generation for International GEO content only.

### 1. OpenAI-Compatible Provider Configuration

Add a configurable International GEO content-generation provider with these fields:

- `provider_id`: stable provider row id.
- `provider_type`: `openai_compatible`.
- `status`: `reserved`, `configured`, `disabled`, or `blocked`.
- `endpoint`: Chat Completions compatible endpoint URL.
- `model`: model name, for example `gpt-4.1-mini`, `deepseek-chat`, `kimi-k2`, or another compatible model.
- `api_key`: stored locally, never returned raw.
- `temperature`: bounded numeric value.
- `max_tokens`: bounded numeric value.
- `timeout_ms`: bounded numeric value.
- `retry_count`: bounded numeric value.
- `notes`: operator notes.

Read models must expose only masked credential status and safe metadata.

### 2. Article Draft Generation

When a configured OpenAI-compatible provider is enabled, `generateInternationalGeoArticlesAction()` should use it before falling back to `local_rules`.

The prompt should include:

- website URL,
- product or brand name,
- target market,
- target language,
- primary buyer query,
- approved evidence asset summaries,
- crawl/audit evidence summaries where available,
- canonical URL,
- required GEO article structure,
- review and claims constraints.

The response should produce reviewable article drafts with:

- title,
- article body in Markdown,
- direct answer upfront,
- section structure suitable for GEO/AI search retrieval,
- FAQ section,
- source/evidence notes,
- human review checklist,
- provider provenance.

### 3. Platform Rewrite Generation

When approved article drafts exist and the OpenAI-compatible provider is configured, `generateInternationalGeoPlatformRewritesAction()` should use it before falling back to `local_rules`.

The rewrite prompt should include:

- approved source article summary,
- target platform name,
- platform category,
- moderation/risk note,
- canonical URL,
- desired rewrite type,
- human review boundary.

Each rewrite remains review-only and must not trigger external publication.

### 4. Failure Handling And Fallback

Provider execution must be resilient:

- Invalid or unsafe endpoints should fail validation before execution.
- Missing credentials should keep provider status non-ready.
- Network, timeout, invalid JSON, and schema failures should not break the workflow.
- Failed remote generation should record provider error details in generation run metadata and fall back to `local_rules` when fallback is enabled.
- Generated rows should make provenance clear: `openai_compatible` when remote generation succeeds, `local_rules` when fallback is used.

### 5. UI Surface

Use existing International GEO or Settings admin patterns. No redesign.

The UI should allow operators to:

- view content-generation provider status,
- configure endpoint, model, temperature, max tokens, timeout, retry count, and API key,
- see masked credential status,
- run a provider test/dry-run,
- generate articles and rewrites with visible provider provenance,
- review generated content before any manual publishing.

### 6. Documentation And Versioning

Update version and docs to `0.21.0`:

- `package.json`,
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
- new `docs/STAGE_V0_21_CLOSEOUT.md`.

Docs must state that LLM content generation is available only after operator configuration, generated content remains review-first, and external publishing remains manual.

## API Design

Prefer extending the existing International GEO content-generation route group rather than adding a new top-level module.

Add or extend:

- `GET /api/v1/international-geo/content-generation`
  - returns provider rows with masked credential status, generation summaries, articles, rewrites, and runs.
- `PUT /api/v1/international-geo/content-generation/providers/:id`
  - saves local provider configuration and masks credentials in the response.
- `POST /api/v1/international-geo/content-generation/providers/:id/test`
  - validates endpoint, credentials, request construction, and response parsing through a controlled test.
- existing `POST /api/v1/international-geo/content-generation/articles/generate`
  - uses OpenAI-compatible provider when configured.
- existing `POST /api/v1/international-geo/content-generation/rewrites/generate`
  - uses OpenAI-compatible provider when configured.

Provider mutation and test routes should require editor/admin/owner permission or API key. Viewer sessions can read masked provider status but cannot save or test providers.

## Data And Model Design

Use `mock-data.mjs` as the source of truth for International GEO state.

Add content-generation provider helpers:

- hydrate provider config defaults,
- sanitize provider response,
- validate OpenAI-compatible endpoint,
- build article prompt,
- build rewrite prompt,
- call provider with timeout and retry,
- parse provider response,
- record provider provenance and failures.

Provider state should live under `internationalGeoState.content_generation.providers`.

The provider should not be included in delivery bundles with raw secrets. Delivery bundle summaries may include provider count, configured count, active provider, credential status, and last test status only.

## Execution Boundary

v0.21 may call an operator-configured OpenAI-compatible LLM endpoint for content generation and rewrite generation.

v0.21 must not:

- call ChatGPT Search, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or visibility-monitoring APIs,
- auto-publish to CMS, social, community, directory, docs, video, or review platforms,
- register external accounts,
- bypass human review,
- return raw API keys,
- include raw API keys in delivery bundles,
- claim real indexing, citation, AI mention, recommendation rank, or engine inclusion from generated content alone.

## Testing

Extend `verify-mvp.mjs` before implementation.

Tests should assert:

- provider config read models never expose raw API keys,
- viewer can read provider status but cannot save or test provider config,
- owner/editor can save masked provider config,
- unsafe endpoints are rejected,
- a mock OpenAI-compatible endpoint can generate an article draft,
- generated articles preserve remote provider provenance,
- provider failure falls back to `local_rules` and records error metadata,
- platform rewrites can use the configured provider,
- delivery bundle remains sanitized after provider credentials are configured,
- UI renders provider configuration, masked credential status, test action, article generation provenance, and rewrite generation provenance,
- `npm run check` passes.

## Delivery Closeout Copy

After v0.21, the project should be described as a controlled one-organization GEO workspace with configurable OpenAI-compatible LLM content generation for International GEO article drafts and platform rewrites. It can produce useful reviewable content when an operator supplies a compatible endpoint and API key.

It should still not be described as an automatic publishing system, live AI visibility monitoring system, indexing verification tool, or multi-tenant SaaS.
