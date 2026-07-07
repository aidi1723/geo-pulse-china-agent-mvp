# Measured Evidence Operations v0.18 Design

## Goal

Turn v0.17 single-row manual measured visibility evidence import into an operator-ready International GEO evidence operations workflow.

v0.18 should let a team import several manually verified AI visibility observations at once, review imported evidence before it is treated as approved reporting input, inspect an import ledger, and read prompt/engine trend summaries without calling external AI/search providers.

## Current State

v0.17 supports:

- International GEO prompt sets and provider readiness rows for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot/Bing.
- Local visibility runs that create `unavailable` snapshots when no provider data is configured.
- A single-row manual measured evidence import action.
- Imported snapshots with `data_status: "measured"`, `provider_id: "manual_import"`, `import_mode: "manual_single"`, and run `data_source_type: "measured_import"`.
- A compact UI panel named `导入测量证据`.

The missing capability is operational scale and governance. A user can import one observation, but cannot batch-import a testing session, review evidence quality, inspect an import history, or summarize prompt/engine movement from approved evidence.

## Product Boundary

v0.18 adds:

- batch manual measured-evidence import,
- an import ledger stored in local state,
- review state on imported measured snapshots,
- approve/reject actions for imported evidence,
- trend summaries derived from approved measured evidence,
- UI panels for batch import, evidence ledger/review, and trend summary,
- API/client/event wiring and documentation.

v0.18 does not add:

- live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or external platform API calls,
- external provider credentials,
- automated provider scheduling,
- CSV file upload parsing in the browser,
- external publishing,
- database migrations,
- multi-tenant SaaS isolation.

## Recommended Approach

Extend the existing International GEO visibility state rather than creating a new monitoring subsystem.

The model should keep `visibility_snapshots` as the source of prompt-level measured records and add a small ledger array for import runs:

- `visibility_import_batches`: batch/manual import ledger rows.
- `visibility_snapshots[].review_status`: `pending_review`, `approved`, or `rejected`.
- `visibility_snapshots[].reviewed_at`, `reviewed_by`, `review_note` for auditability.
- `visibility.trends`: derived read model grouped by prompt set and engine.

Single-row v0.17 imports should remain valid and should be represented as one-row ledger entries going forward. Legacy imported snapshots without `review_status` should hydrate to `pending_review`.

## Batch Import Payload

Add:

```js
{
  "source_label": "Manual weekly AI visibility check",
  "import_note": "Copied from operator review spreadsheet.",
  "rows": [
    {
      "prompt_set_id": "aiprompt_...",
      "engine_id": "chatgpt_search",
      "source_type": "manual_observation",
      "captured_at": "2026-07-07T10:30:00.000Z",
      "brand_mentioned": true,
      "citation_urls": ["https://example.com/product"],
      "recommendation_rank": 2,
      "competitors_mentioned": ["Competitor A"],
      "confidence": "medium",
      "raw_observation": "Brand was recommended second.",
      "evidence_note": "Manual reviewer copied the answer."
    }
  ]
}
```

`rows` must contain at least one row. Each row reuses the v0.17 single-row validation and normalization rules. A valid batch should create one `measured_import` run, one ledger row, and one snapshot per valid row.

Batch import should be all-or-nothing in v0.18. If any row is invalid, the action should reject the whole batch with `VALIDATION_ERROR` and include row-indexed errors. This avoids partial state that is hard to review.

## Import Ledger Row

```js
{
  "id": "aivimp_...",
  "run_id": "aivrun_...",
  "import_mode": "manual_batch",
  "provider_id": "manual_import",
  "data_source_type": "measured_import",
  "status": "completed",
  "source_label": "Manual weekly AI visibility check",
  "import_note": "Copied from operator review spreadsheet.",
  "row_count": 3,
  "snapshots_created": 3,
  "pending_review_count": 3,
  "approved_count": 0,
  "rejected_count": 0,
  "created_at": "2026-07-07T10:35:00.000Z",
  "snapshot_ids": ["aivs_..."]
}
```

The ledger should update review counts when snapshots are approved or rejected.

## Review Action

Add an action for imported measured snapshots:

```js
{
  "action": "approve",
  "review_note": "Evidence matches screenshot."
}
```

Allowed actions:

- `approve`
- `reject`

Rules:

- Only snapshots with `provider_id: "manual_import"` and `data_status: "measured"` can be reviewed.
- Approved evidence remains in trend summaries.
- Rejected evidence remains visible in the ledger and snapshot table but is excluded from trend summaries.
- Unknown snapshot ids return `null` at the model layer and `404` at the HTTP layer.
- Invalid actions return `VALIDATION_ERROR`.

## Trend Summary

Trend summaries should be derived from approved measured snapshots only. Until evidence is approved, a row can remain visible in the ledger but should not increase trend counts.

Each trend row should include:

```js
{
  "prompt_set_id": "aiprompt_...",
  "engine_id": "chatgpt_search",
  "engine_label": "ChatGPT Search",
  "latest_captured_at": "2026-07-07T10:30:00.000Z",
  "approved_snapshot_count": 2,
  "brand_mentioned_count": 2,
  "owned_citation_count": 3,
  "best_recommendation_rank": 2,
  "latest_recommendation_rank": 3,
  "competitors_mentioned": ["Competitor A"],
  "latest_snapshot_id": "aivs_..."
}
```

The read model should also expose a compact summary:

- `import_batch_count`
- `pending_review_count`
- `approved_evidence_count`
- `rejected_evidence_count`
- `trend_row_count`

## API Design

Add:

| Method | Route | Role | Behavior |
| --- | --- | --- | --- |
| `POST` | `/api/v1/international-geo/visibility/evidence/imports` | editor/admin/owner | Import a batch of manual measured evidence rows. |
| `POST` | `/api/v1/international-geo/visibility/evidence/:id/review` | editor/admin/owner | Approve or reject one imported measured snapshot. |

Existing read route `GET /api/v1/international-geo/visibility` should include `imports`, `trends`, and expanded summary fields.

Viewer sessions can read the ledger and trends but cannot import or review evidence.

## UI Design

Use the existing dense admin system from `DESIGN.md`.

Add or extend International GEO visibility panels:

- `批量导入测量证据`
  - textarea for JSON rows,
  - source label,
  - import note,
  - action `international-visibility-evidence-batch-import`,
  - visible local-only boundary copy.
- `测量证据台账`
  - import ledger table,
  - row count, snapshot count, pending/approved/rejected counts,
  - source label and import note.
- `证据复核`
  - table of imported measured snapshots,
  - review status,
  - approve/reject buttons.
- `可见度趋势`
  - prompt/engine trend table from approved evidence only.

Keep the v0.17 single-row import panel. It should remain useful for quick one-off checks.

## Testing Requirements

Add failing tests first in `verify-mvp.mjs`.

Model tests should cover:

- valid batch import creates one ledger row, one run, and multiple pending-review measured snapshots,
- invalid row rejects the entire batch with row-indexed validation errors,
- approving a manual measured snapshot updates snapshot review fields and ledger counts,
- rejecting a snapshot excludes it from trends,
- trends count only approved evidence.

HTTP tests should cover:

- viewer cannot batch import,
- owner/editor can batch import,
- viewer cannot review,
- owner/editor can approve/reject,
- invalid review returns `400`,
- missing snapshot returns `404`.

UI/source tests should cover:

- client API wrappers exist,
- browser actions and event names exist,
- International GEO renders batch import, evidence ledger, review, and trend panels,
- approve/reject buttons are visible,
- local-only/manual boundary copy remains visible.

## Documentation Requirements

Update:

- `package.json` to `0.18.0`
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
- add `docs/STAGE_V0_18_CLOSEOUT.md`

Docs must say v0.18 operationalizes manual measured evidence, but still does not call live AI/search/SERP/indexing/external platform APIs or store external provider credentials.

## Rollout And Compatibility

Existing v0.17 imported snapshots without review fields hydrate to `pending_review`.

Existing single-row imports should continue to work and should create a one-row ledger entry with `import_mode: "manual_single"`.

Existing `unavailable` snapshots remain visible and valid.

Static preview should render new panels from supplied data without requiring server writes.
