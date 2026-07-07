# Measured Visibility Evidence Import v0.17 Design

## Goal

Add a reviewable measured-evidence import workflow for International GEO visibility snapshots.

v0.17 should let operators record real, manually verified results from ChatGPT Search, Gemini, Claude, Perplexity, Google AI Overviews, or Copilot/Bing without connecting external APIs yet. Imported evidence should create `measured` visibility snapshots, update provider readiness for the relevant engine, and preserve enough provenance that the UI can distinguish measured evidence from unavailable local placeholders.

## Current State

v0.16 can:

- track International GEO prompt sets by prompt, market, language, buyer intent, product, target URL, target brand, competitors, and engine ids,
- store provider readiness rows for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot/Bing,
- run a local visibility measurement action that writes `unavailable` snapshots when no measured provider exists,
- render summary counts for `measured`, `simulated`, and `unavailable`,
- render prompt snapshots, provider readiness, and visibility run records,
- keep generated content, platform rewrites, publishing packages, and tracking records clearly local and review-first.

The missing capability is a safe way to enter real measured evidence. Today the model supports `measured` as a data status, but there is no operator-facing import route, UI action, or run record for a manually verified result.

## Product Boundary

v0.17 adds:

- a manual measured-evidence import action,
- an API route for importing one measured visibility snapshot,
- field validation for prompt set, engine, evidence source, capture time, brand mention, citations, recommendation rank, competitors, and notes,
- creation of a `measured` visibility snapshot with provenance metadata,
- creation of a `visibility_run` with `data_source_type: "measured_import"`,
- provider readiness updates for the imported engine,
- International GEO UI for importing one measured evidence row,
- UI visibility for import/source metadata in the snapshot table,
- tests and docs that keep measured imports distinct from automated provider calls.

v0.17 does not add:

- live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, or indexing API calls,
- external provider credentials,
- automated crawling beyond the existing guarded site crawl,
- automatic recommendation/ranking claims without imported evidence,
- automatic external publishing,
- batch JSON import implementation,
- database migrations,
- multi-tenant SaaS isolation.

## Recommended Approach

Extend the existing International GEO visibility model rather than creating a second monitoring subsystem.

The v0.17 flow should be:

1. Operator runs or reviews configured prompt sets.
2. Operator manually checks a prompt in an external AI/search product.
3. Operator imports the observed result into GEO Pulse.
4. System validates the import and writes a `measured` snapshot.
5. System writes a measured-import run and updates provider readiness.
6. UI summary and snapshot table show the measured result separately from `unavailable` placeholders.

The import should be intentionally single-row in v0.17. A future batch import can reuse the same validation and snapshot creation helper once the single-row contract is stable.

## Data Model

### Measured Evidence Import Payload

```js
{
  prompt_set_id: "aiprompt_...",
  engine_id: "chatgpt_search",
  provider_id: "manual_import",
  source_type: "manual_observation",
  source_label: "Manual ChatGPT Search check",
  source_url: "https://chatgpt.com/",
  captured_at: "2026-07-07T10:30:00.000Z",
  brand_mentioned: true,
  owned_citation_count: 2,
  citation_urls: [
    "https://example.com/product",
    "https://example.com/compare"
  ],
  recommendation_rank: 3,
  competitors_mentioned: ["Competitor A", "Competitor B"],
  confidence: "medium",
  raw_observation: "The answer recommended the brand at #3 and cited two owned URLs.",
  evidence_note: "Manual reviewer copied the result from ChatGPT Search."
}
```

Required fields:

- `prompt_set_id`
- `engine_id`
- `source_type`
- `captured_at`
- `brand_mentioned`

Conditionally required fields:

- If `brand_mentioned` is `true`, either `citation_urls`, `recommendation_rank`, or `raw_observation` must be present.
- If `source_type` is `manual_observation`, `evidence_note` or `raw_observation` must be present.

Defaulted fields:

- `provider_id`: `manual_import`
- `source_label`: `Manual measured evidence`
- `owned_citation_count`: citation URL count when omitted
- `competitors_mentioned`: empty array
- `confidence`: `medium`

Allowed `source_type` values:

- `manual_observation`
- `manual_export`
- `provider_report`

Allowed `confidence` values:

- `low`
- `medium`
- `high`

### Imported Measured Snapshot

The imported snapshot should preserve the existing visibility snapshot shape and add provenance fields:

```js
{
  id: "aivs_...",
  prompt_set_id: "aiprompt_...",
  run_id: "aivrun_...",
  engine_id: "chatgpt_search",
  engine_label: "ChatGPT Search",
  data_status: "measured",
  provider_id: "manual_import",
  source_type: "manual_observation",
  source_label: "Manual ChatGPT Search check",
  source_url: "https://chatgpt.com/",
  captured_at: "2026-07-07T10:30:00.000Z",
  brand_mentioned: true,
  owned_citation_count: 2,
  citation_urls: ["https://example.com/product"],
  recommendation_rank: 3,
  competitors_mentioned: ["Competitor A"],
  confidence: "medium",
  diagnostics: [
    "Measured evidence imported manually. No live provider API was called."
  ],
  raw_observation: "The answer recommended the brand at #3.",
  evidence_note: "Manual reviewer copied the result from ChatGPT Search.",
  imported_at: "2026-07-07T10:35:00.000Z",
  import_mode: "manual_single"
}
```

`validateInternationalGeoVisibilitySnapshot()` should still reject `measured` snapshots without `provider_id`, `source_type`, or `captured_at`.

### Measured Import Run

```js
{
  id: "aivrun_...",
  trigger: "manual_import",
  status: "completed",
  data_source_type: "measured_import",
  provider_id: "manual_import",
  prompt_count: 1,
  engine_count: 1,
  snapshots_created: 1,
  started_at: "2026-07-07T10:35:00.000Z",
  finished_at: "2026-07-07T10:35:00.000Z",
  steps: [
    {
      id: "aivstep_...",
      run_id: "aivrun_...",
      sequence: 1,
      step_type: "validate_import",
      status: "succeeded",
      status_label: "Measured evidence validated",
      output_preview: {
        prompt_set_id: "aiprompt_...",
        engine_id: "chatgpt_search"
      }
    },
    {
      id: "aivstep_...",
      run_id: "aivrun_...",
      sequence: 2,
      step_type: "write_measured_snapshot",
      status: "succeeded",
      status_label: "Measured snapshot recorded",
      output_preview: {
        snapshots_created: 1
      }
    }
  ]
}
```

### Provider Readiness Update

After import, the readiness row matching `engine_id` should update:

```js
{
  data_status: "measured",
  provider_id: "manual_import",
  connector_id: "manual_import",
  permission_status: "manual_review",
  last_measured_at: "2026-07-07T10:30:00.000Z",
  diagnostic: "Latest measured evidence was imported manually. No provider API was called."
}
```

## API Design

Add one route:

| Method | Route | Role | Behavior |
| --- | --- | --- | --- |
| `POST` | `/api/v1/international-geo/visibility/evidence/import` | editor/admin/owner | Validate and import one measured visibility snapshot. |

Request body should use the measured evidence import payload.

Success response:

```js
{
  snapshot: { "id": "aivs_...", "data_status": "measured" },
  run: { "id": "aivrun_...", "data_source_type": "measured_import" },
  summary: {
    measured_snapshots: 1,
    simulated_snapshots: 0,
    unavailable_snapshots: 12
  }
}
```

Validation errors should return `400 VALIDATION_ERROR` with a clear message. Viewer sessions should receive `403`.

## UI Design

Use the existing dense admin style from `DESIGN.md`: `surface panel`, `panel-head`, compact form controls, `info-row`, `tableMarkup`, `statusMarkup`, and short operational copy.

Add a panel after `AI 可见度测量` and before `引擎数据源状态`:

- title: `导入测量证据`
- note: `人工录入来自 ChatGPT Search、Gemini、Claude、Perplexity、Google AIO 或 Copilot/Bing 的核验证据；不会调用外部 provider。`
- fields:
  - prompt set select
  - engine select
  - brand mentioned select
  - citation URLs textarea
  - recommendation rank input
  - competitors mentioned textarea
  - source type select
  - source URL input
  - captured at input
  - confidence select
  - raw observation textarea
  - evidence note textarea
- action: `data-action="international-visibility-evidence-import"`

The snapshot table should show source/provenance in the last column. For measured imports, users should see `manual_import`, source type, source URL when present, and evidence note or raw observation summary.

## Validation Rules

The import action should reject:

- missing `prompt_set_id`,
- unknown prompt set id,
- missing or unsupported `engine_id`,
- engine id not included in the selected prompt set,
- missing `captured_at`,
- invalid `captured_at`,
- missing `source_type`,
- unsupported `source_type`,
- missing `brand_mentioned`,
- `brand_mentioned: true` with no citation URLs, no recommendation rank, and no raw observation,
- `source_type: manual_observation` with no evidence note and no raw observation,
- invalid citation URLs when a URL is provided,
- negative or non-integer recommendation rank.

The import action should normalize:

- newline-separated citation URLs into an array,
- newline-separated competitors into an array,
- `brand_mentioned` from string `"true"` / `"false"` to boolean,
- `recommendation_rank` from blank to `null`,
- `owned_citation_count` from citation URL count when omitted.

## Testing Requirements

Model tests should cover:

- valid measured import creates one `measured` snapshot,
- summary measured count increases,
- measured import creates a `measured_import` run,
- provider readiness for the imported engine becomes `measured`,
- invalid prompt set fails,
- unsupported engine fails,
- missing source or capture time fails,
- brand-mentioned import without citation/rank/observation fails.

HTTP tests should cover:

- viewer can read visibility state,
- viewer cannot import measured evidence,
- owner/editor can import measured evidence,
- invalid import returns `400`,
- imported visibility state includes measured snapshot and measured run.

UI/source tests should cover:

- client API wrapper exists,
- browser action import exists,
- event dispatcher action exists,
- International GEO renders `导入测量证据`,
- UI includes `data-action="international-visibility-evidence-import"`,
- UI exposes `manual_import`,
- snapshot table can show measured import provenance.

## Documentation Requirements

Update:

- `CHANGELOG.md`
- `README.md`
- `docs/API_REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/ROADMAP.md`
- `docs/PHASE_2_ROADMAP.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/OPEN_SOURCE_RELEASE.md`
- `docs/README.md`
- `docs/MAINTENANCE.md`
- add `docs/STAGE_V0_17_CLOSEOUT.md`

Docs must say:

- v0.17 supports manual measured evidence import,
- imported `measured` snapshots are user-supplied evidence, not automated provider calls,
- no live ChatGPT/Gemini/Claude/Perplexity/Google AIO/Copilot/Bing/SERP/indexing APIs are called,
- no external provider credentials are stored,
- measured imports can support visibility analysis only to the extent that the human-entered evidence is accurate.

## Rollout And Compatibility

Existing `unavailable` snapshots should remain valid and visible.

Existing prompt sets and provider readiness rows should hydrate safely if new fields are missing.

Static preview should remain read-only. It may show the import panel but POST actions should keep using the existing static write error.

The implementation should not change v0.16 content generation, publishing packages, or manual tracking behavior.

## Open Questions Resolved

- **Batch import?** Not in v0.17. The model should support a future batch helper, but the UI/API should import one measured evidence row.
- **External provider credentials?** Not in v0.17.
- **Can imported measured evidence prove ranking permanently?** No. It is a timestamped manual observation that should be rechecked over time.
- **Should measured imports overwrite unavailable snapshots?** No. They should create new snapshots. Summary and tables can show both historical unavailable rows and new measured rows.
