# AI Visibility Monitoring v0.13 Design

## Goal

Add a trustworthy AI visibility monitoring baseline for International GEO.

v0.13 should let operators define prompt sets, inspect engine coverage, run a controlled measurement workflow, and store prompt snapshots without claiming real ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, or Copilot inclusion unless a compliant measured data source is configured.

The stage outcome is a measurement data foundation, not a real AI search monitoring product.

## Current State

v0.12 can:

- create International GEO site audits,
- attach guarded live crawl evidence,
- explain weighted GEO readiness through `score_breakdown`,
- render International GEO engine visibility seed tables.

The project also has Analytics visibility data and collection runs, but those are mock-first operational analytics. They are useful patterns for run records and snapshots, but they must not be treated as measured AI engine inclusion for International GEO.

## Product Boundary

v0.13 adds:

- International GEO prompt-set records,
- AI engine provider readiness records,
- measurement runs,
- prompt measurement snapshots,
- explicit data-source labels: `measured`, `simulated`, `unavailable`,
- UI panels that clearly separate measured evidence from simulated seed data,
- API contracts for future provider-backed and manual-import work.

v0.13 does not add:

- live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, or SERP querying,
- paid provider integrations,
- browser automation against AI products,
- recursive crawling or JavaScript rendering,
- automatic external publishing,
- database migrations,
- multi-tenant SaaS isolation.

## Recommended Approach

Use a deterministic local measurement model in `mock-data.mjs` and expose it through existing International GEO routes plus narrow new subroutes.

The core rule:

> A snapshot can only be `measured` when it has a configured provider id, source URL or source record, captured timestamp, and provider permission evidence. Otherwise it must be `simulated` or `unavailable`.

For v0.13, default measurement runs should produce `unavailable` snapshots with diagnostics when no approved provider is configured. Existing seed rows can remain visible only when labeled `simulated`.

## Data Model

### Prompt Set

```js
{
  id: "aiprompt_...",
  prompt: "best GEO platform for B2B teams",
  market: "US",
  language: "en-US",
  buyer_intent: "comparison",
  product_name: "GEO Pulse",
  target_url: "https://example.com",
  target_brand: "GEO Pulse",
  competitors: ["Profound", "AthenaHQ", "Semrush AI"],
  engines: ["chatgpt_search", "perplexity", "google_ai_overviews", "gemini", "claude", "copilot_bing"],
  status: "active",
  created_at: "2026-07-07T00:00:00.000Z"
}
```

### Engine Provider Readiness

```js
{
  engine_id: "perplexity",
  engine_label: "Perplexity",
  data_status: "unavailable",
  provider_id: "",
  connector_id: "",
  permission_status: "not_configured",
  last_measured_at: null,
  diagnostics: [
    "No approved visibility provider configured for Perplexity."
  ]
}
```

### Measurement Run

```js
{
  id: "aivrun_...",
  trigger: "manual",
  status: "completed_with_unavailable",
  data_source_type: "unavailable",
  provider_id: "",
  prompt_count: 3,
  engine_count: 6,
  snapshots_created: 18,
  started_at: "2026-07-07T00:00:00.000Z",
  finished_at: "2026-07-07T00:00:01.000Z",
  steps: [
    {
      step_type: "provider_readiness",
      status: "warning",
      output_preview: {
        unavailable_engines: 6
      }
    }
  ]
}
```

### Prompt Snapshot

```js
{
  id: "aivs_...",
  prompt_set_id: "aiprompt_...",
  run_id: "aivrun_...",
  engine_id: "perplexity",
  engine_label: "Perplexity",
  data_status: "unavailable",
  source_type: "unavailable",
  source_label: "No provider configured",
  captured_at: "2026-07-07T00:00:01.000Z",
  brand_mentioned: null,
  owned_citation_count: null,
  citation_urls: [],
  recommendation_rank: null,
  competitors_mentioned: [],
  confidence: "low",
  diagnostics: [
    "No measured provider is configured. Snapshot records unavailable state only."
  ]
}
```

Allowed `data_status` values:

- `measured`: captured from an approved configured provider with source evidence.
- `simulated`: seed or demo data used for UI/product planning.
- `unavailable`: no compliant measurement source was configured or the provider failed.

## Data Flow

1. Operator creates or uses prompt sets from International GEO input.
2. System maps prompt sets to the supported engine ids.
3. Operator runs AI visibility measurement.
4. System checks provider readiness per engine.
5. If no approved provider exists, system creates `unavailable` snapshots and a run with diagnostics.
6. If a future approved provider exists, the provider adapter may create `measured` snapshots after schema validation.
7. UI renders summary, provider readiness, prompt snapshots, and run history with visible data-source labels.

## UI Design

Keep the existing dense admin style from `DESIGN.md`.

Add compact International GEO panels:

- `AI 可见度测量`
  - total prompt count,
  - engine count,
  - measured/simulated/unavailable counts,
  - latest run status.
- `引擎数据源状态`
  - one row per engine,
  - provider id,
  - data status,
  - permission status,
  - latest measured time,
  - diagnostic text.
- `Prompt 测量快照`
  - prompt,
  - engine,
  - data status,
  - brand mention,
  - owned citations,
  - recommendation rank,
  - competitors,
  - confidence.
- `测量运行记录`
  - trigger,
  - status,
  - provider,
  - snapshot count,
  - started/finished time.

Do not add:

- a new top-level navigation item,
- marketing layout,
- decorative charts,
- hidden real-engine claims,
- large cards where compact tables fit better.

## API Shape

Add narrow routes under International GEO:

```text
GET /api/v1/international-geo/visibility
POST /api/v1/international-geo/visibility/prompt-sets
POST /api/v1/international-geo/visibility/run
GET /api/v1/international-geo/visibility/runs
GET /api/v1/international-geo/visibility/snapshots
```

Authorization:

- viewer can read visibility state,
- editor/admin/owner can create prompt sets and run measurement,
- `X-GEO-API-Key` can run controlled automation,
- raw provider credentials are never returned.

Backward compatibility:

- `GET /api/v1/international-geo` should include the new visibility summary without breaking existing consumers.
- Existing `engineVisibility`, `engineInclusion`, and `promptMonitoring` seed tables remain available, but v0.13 UI must label them as planning/simulated where relevant.

## Validation Rules

Prompt set create:

- `prompt` is required and must be non-empty.
- `engines` defaults to all supported engines when omitted.
- unsupported engine ids are rejected with `VALIDATION_ERROR`.
- competitors are normalized to a string array.

Measurement run:

- run never calls an external provider unless a future connector is explicitly configured and allowed.
- run records provider readiness before creating snapshots.
- unavailable provider state is a successful operational result, not a server crash.
- failed validation returns field-level error messages.

Measured snapshot:

- `measured` requires `provider_id`, `captured_at`, `source_type`, and provider permission evidence.
- missing required measured fields downgrades to `unavailable` or rejects the provider payload.
- raw provider response snippets must be summarized or sanitized before storage.

## Error Handling

- Unknown prompt-set ids return `404 NOT_FOUND`.
- Invalid engine ids return `400 VALIDATION_ERROR`.
- Permission denial returns `403 FORBIDDEN` for browser sessions or `401 UNAUTHORIZED` when no session/API key exists.
- Provider unavailable creates an `unavailable` run and snapshots with diagnostics.
- Provider schema mismatch creates a failed run step and does not overwrite previous measured snapshots.

## Testing

Extend `verify-mvp.mjs` before implementation.

Required assertions:

- International GEO visibility state exposes prompt sets, provider readiness, snapshots, runs, and summary counts.
- Default run without configured providers creates `unavailable` snapshots and does not claim measured data.
- Snapshot `data_status` is always one of `measured`, `simulated`, or `unavailable`.
- A measured snapshot cannot be created without provider/source evidence.
- UI renders `AI 可见度测量`, `引擎数据源状态`, `Prompt 测量快照`, and visible `measured/simulated/unavailable` labels.
- HTTP routes enforce viewer read-only behavior and editor/admin/owner mutation behavior.
- Connector or provider diagnostics do not leak raw API keys.

## Documentation

Update:

- `README.md`,
- `CHANGELOG.md`,
- `docs/API_REFERENCE.md`,
- `docs/ARCHITECTURE.md`,
- `docs/DEVELOPMENT.md`,
- `docs/ROADMAP.md`,
- `docs/PHASE_2_ROADMAP.md`,
- `docs/PRODUCTION_DEPLOYMENT.md`,
- `docs/OPEN_SOURCE_RELEASE.md`,
- add `docs/STAGE_V0_13_CLOSEOUT.md`.

## Launch Statement

v0.13 should be described as the AI visibility measurement foundation for International GEO. It stores prompt sets, provider readiness, run records, and measurement snapshots with explicit data-source labels.

It still does not measure real AI engine inclusion or recommendation rank unless a future approved provider is configured and produces validated `measured` snapshots.

## Safe-Agent Task Pack Notes

Selected scenario: `code-review-hardening`.

Relevant method constraints:

- schema contracts must be explicit,
- regression tests must prove unavailable data is not treated as measured,
- connector/provider supply-chain and permission boundaries must be documented before real providers are adopted,
- CI verification remains `npm run check`,
- model/API call budgets are zero for v0.13 default implementation because no real external AI calls are made.
