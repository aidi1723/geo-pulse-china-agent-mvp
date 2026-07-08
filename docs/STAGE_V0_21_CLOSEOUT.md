# v0.21 Stage Closeout

## Stage Result

v0.21 adds configurable OpenAI-compatible LLM generation for International GEO content production.

Operators can now:

- configure the `openai_compatible` content-generation provider with endpoint, model, API key, temperature, max tokens, timeout, retry count, and notes,
- test the provider from the International GEO UI or API,
- generate reviewable long-form article drafts from approved GEO evidence assets,
- generate reviewable multi-platform rewrites from approved generated articles,
- see generation provenance on articles, rewrites, and run records,
- fall back to `local_rules` automatically when the configured provider fails,
- export a sanitized delivery bundle that includes only safe content-generation provider summary metadata.

## API And UI Surface

- `GET /api/v1/international-geo/content-generation`
- `PUT /api/v1/international-geo/content-generation/providers/:id`
- `POST /api/v1/international-geo/content-generation/providers/:id/test`
- `POST /api/v1/international-geo/content-generation/articles/generate`
- `POST /api/v1/international-geo/content-generation/rewrites/generate`

The International GEO page now includes an OpenAI-compatible content-generation panel with provider status, credential status, endpoint/model controls, provider test, provider save, and generation-source display.

## Operating Boundary

v0.21 may call only the operator-configured OpenAI-compatible content-generation endpoint.

`Claude` and `Gemini` content-generation rows remain future reserved placeholders in this stage. They are visible as roadmap seams only and cannot be saved as executable providers in v0.21.

It still does not:

- automatically publish to external platforms,
- register external accounts,
- query ChatGPT Search, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or AI visibility APIs,
- verify indexing, citation, mention, recommendation, or engine inclusion,
- expose raw API keys through read models, HTTP responses, UI state, logs, tests, or delivery bundles,
- include prompts, article bodies, rewrite bodies, raw connector configs, or raw state snapshots in the delivery bundle.

## Verification

```bash
npm run check
```

Expected result:

```text
verify-mvp: OK
```

## Closing Copy

GEO Pulse v0.21 is a controlled one-organization GEO workspace with configurable OpenAI-compatible LLM content generation for International GEO article drafts and platform rewrites. It can produce useful reviewable content when an operator supplies a compatible endpoint and API key.

It should not be described as an automatic publishing system, live AI visibility monitoring system, indexing verification tool, recommendation-rank tracker, or multi-tenant SaaS.
