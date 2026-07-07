# Measured Evidence Operations v0.18 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operationalize International GEO manual measured evidence with batch import, review state, import ledger, and approved-evidence trends.

**Architecture:** Extend the existing International GEO visibility model in `mock-data.mjs`; keep `visibility_snapshots` as the measured evidence source, add a local `visibility_import_batches` ledger, and derive trend rows from approved manual evidence. Expose two HTTP mutations, wire the browser API/action/event layer, and render dense admin panels in `prototype/src/pages/international.js`.

**Tech Stack:** Node.js ESM, zero-dependency HTTP server, local mock state, browser HTML rendering, `verify-mvp.mjs`, GitHub Actions running `npm run check`.

---

## File Structure

- Modify `verify-mvp.mjs`
  - Add source/UI assertions for batch import and review wiring.
  - Add mock-data behavior assertions for batch import, review, ledger counts, and trends.
  - Add HTTP role/validation assertions.

- Modify `mock-data.mjs`
  - Add `visibility_import_batches` hydration.
  - Add `importInternationalGeoVisibilityEvidenceBatchAction`.
  - Update single-row import to create one ledger row.
  - Add `reviewInternationalGeoVisibilityEvidenceAction`.
  - Add derived trend read model and expanded visibility summary.

- Modify `server.mjs`
  - Import new actions.
  - Add `POST /international-geo/visibility/evidence/imports`.
  - Add `POST /international-geo/visibility/evidence/:id/review`.

- Modify `prototype/src/api.js`
  - Add `importInternationalGeoVisibilityEvidenceBatch(payload = {})`.
  - Add `reviewInternationalGeoVisibilityEvidence(snapshotId, payload = {})`.

- Modify `prototype/src/main.js`
  - Add JSON rows payload collection.
  - Add batch import action.
  - Add evidence review action.

- Modify `prototype/src/events.js`
  - Wire `international-visibility-evidence-batch-import`.
  - Wire `international-visibility-evidence-approve`.
  - Wire `international-visibility-evidence-reject`.

- Modify `prototype/src/pages/international.js`
  - Render `批量导入测量证据`.
  - Render `测量证据台账`.
  - Render `证据复核`.
  - Render `可见度趋势`.

- Modify docs
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
  - Add `docs/STAGE_V0_18_CLOSEOUT.md`

---

### Task 1: Add Failing v0.18 Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add imports**

Add these imports from `./mock-data.mjs`:

```js
  importInternationalGeoVisibilityEvidenceBatchAction,
  reviewInternationalGeoVisibilityEvidenceAction,
```

- [ ] **Step 2: Add source wiring assertions**

In `runSingleUserSourceChecks()`, near the existing International GEO visibility source assertions, add:

```js
  assert.match(
    apiSource,
    /export function importInternationalGeoVisibilityEvidenceBatch\(payload = \{\}\)/,
    "International GEO batch measured evidence import should have a client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoVisibilityEvidence\(snapshotId, payload = \{\}\)/,
    "International GEO measured evidence review should have a client API method"
  );
  assert.match(
    mainSource,
    /importInternationalGeoVisibilityEvidenceBatch as importInternationalGeoVisibilityEvidenceBatchApi/,
    "International GEO batch evidence import should be imported into the browser action layer"
  );
  assert.match(
    mainSource,
    /reviewInternationalGeoVisibilityEvidence as reviewInternationalGeoVisibilityEvidenceApi/,
    "International GEO evidence review should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-visibility-evidence-batch-import"/,
    "International GEO batch evidence import should be wired in events"
  );
  assert.match(
    eventsSource,
    /action === "international-visibility-evidence-approve"/,
    "International GEO evidence approval should be wired in events"
  );
  assert.match(
    eventsSource,
    /action === "international-visibility-evidence-reject"/,
    "International GEO evidence rejection should be wired in events"
  );
```

- [ ] **Step 3: Add mock-data behavior assertions**

In `runMockDataChecks()`, after the v0.17 single-row measured import assertions, add:

```js
  const batchPromptSet = createInternationalGeoVisibilityPromptSetAction({
    prompt: "best AI search visibility tool for international B2B",
    market: "US",
    language: "en-US",
    buyer_intent: "decision",
    product_name: "AgentCore GEO",
    target_url: "https://example.com/agentcore-geo",
    target_brand: "AgentCore GEO",
    competitors: ["Profound", "AthenaHQ"],
    engines: ["chatgpt_search", "gemini"]
  });

  const batchImport = importInternationalGeoVisibilityEvidenceBatchAction({
    source_label: "Manual weekly evidence sheet",
    import_note: "Two rows copied from manual AI engine checks.",
    rows: [
      {
        prompt_set_id: batchPromptSet.id,
        engine_id: "chatgpt_search",
        source_type: "manual_observation",
        captured_at: "2026-07-07T11:00:00.000Z",
        brand_mentioned: true,
        citation_urls: ["https://example.com/agentcore-geo"],
        recommendation_rank: 2,
        competitors_mentioned: ["Profound"],
        confidence: "high",
        raw_observation: "AgentCore GEO appeared second with one owned citation.",
        evidence_note: "Manual reviewer checked ChatGPT Search."
      },
      {
        prompt_set_id: batchPromptSet.id,
        engine_id: "gemini",
        source_type: "manual_export",
        captured_at: "2026-07-07T11:10:00.000Z",
        brand_mentioned: false,
        citation_urls: [],
        competitors_mentioned: ["AthenaHQ"],
        confidence: "medium",
        raw_observation: "Gemini mentioned AthenaHQ but did not mention AgentCore GEO."
      }
    ]
  });
  assert.equal(batchImport.import_batch.import_mode, "manual_batch", "Batch import should create a manual_batch ledger row");
  assert.equal(batchImport.import_batch.row_count, 2, "Batch import should record row count");
  assert.equal(batchImport.import_batch.pending_review_count, 2, "Batch import snapshots should start pending review");
  assert.equal(batchImport.run.data_source_type, "measured_import", "Batch import should use measured_import run provenance");
  assert.equal(batchImport.snapshots.length, 2, "Batch import should create two snapshots");
  assert.ok(batchImport.snapshots.every((item) => item.review_status === "pending_review"), "Batch snapshots should start pending_review");

  assert.throws(
    () =>
      importInternationalGeoVisibilityEvidenceBatchAction({
        rows: [
          {
            prompt_set_id: batchPromptSet.id,
            engine_id: "chatgpt_search",
            source_type: "manual_observation",
            captured_at: "2026-07-07T11:00:00.000Z",
            brand_mentioned: true,
            evidence_note: "Missing evidence detail for true brand mention."
          },
          {
            prompt_set_id: batchPromptSet.id,
            engine_id: "gemini",
            source_type: "bad_source",
            captured_at: "2026-07-07T11:10:00.000Z",
            brand_mentioned: false,
            raw_observation: "Invalid source type."
          }
        ]
      }),
    /VALIDATION_ERROR/,
    "Batch import should reject invalid rows without partial writes"
  );

  const approvedEvidence = reviewInternationalGeoVisibilityEvidenceAction(batchImport.snapshots[0].id, {
    action: "approve",
    review_note: "Evidence matches manual observation."
  });
  assert.equal(approvedEvidence.snapshot.review_status, "approved", "Evidence review should approve imported snapshot");
  assert.equal(approvedEvidence.import_batch.approved_count, 1, "Ledger should count approved imported evidence");

  const rejectedEvidence = reviewInternationalGeoVisibilityEvidenceAction(batchImport.snapshots[1].id, {
    action: "reject",
    review_note: "Evidence did not mention target brand."
  });
  assert.equal(rejectedEvidence.snapshot.review_status, "rejected", "Evidence review should reject imported snapshot");
  assert.equal(rejectedEvidence.import_batch.rejected_count, 1, "Ledger should count rejected imported evidence");

  const visibilityAfterReview = getInternationalGeoVisibilityState();
  assert.ok(
    visibilityAfterReview.imports.some((item) => item.id === batchImport.import_batch.id && item.approved_count === 1),
    "Visibility state should expose import ledger rows"
  );
  assert.ok(
    visibilityAfterReview.trends.some(
      (item) =>
        item.prompt_set_id === batchPromptSet.id &&
        item.engine_id === "chatgpt_search" &&
        item.approved_snapshot_count === 1 &&
        item.brand_mentioned_count === 1 &&
        item.best_recommendation_rank === 2
    ),
    "Visibility trends should include approved measured evidence"
  );
  assert.ok(
    !visibilityAfterReview.trends.some((item) => item.prompt_set_id === batchPromptSet.id && item.engine_id === "gemini"),
    "Visibility trends should exclude rejected measured evidence"
  );
  assert.throws(
    () => reviewInternationalGeoVisibilityEvidenceAction(batchImport.snapshots[0].id, { action: "invalid" }),
    /VALIDATION_ERROR/,
    "Evidence review should reject invalid actions"
  );
```

- [ ] **Step 4: Add HTTP assertions**

In `runHttpChecks()`, after existing v0.17 measured import HTTP assertions, add owner/viewer checks for:

```js
    const viewerBatchImport = await httpRequest(port, "/api/v1/international-geo/visibility/evidence/imports", {
      method: "POST",
      headers: viewerHeaders,
      body: JSON.stringify({ rows: [] })
    });
    assert.equal(viewerBatchImport.status, 403, "Viewer should not batch import measured visibility evidence");
```

Also add owner batch import, owner approve, owner reject, viewer review 403, invalid review 400, and missing snapshot 404 using the same prompt set creation pattern as existing visibility HTTP tests.

- [ ] **Step 5: Add UI assertions**

In `runInternationalGeoUiChecks()`, after v0.17 measured evidence import UI assertions, add:

```js
  assert.match(siteAuditHtml, /批量导入测量证据/, "International GEO should render batch measured evidence import panel");
  assert.match(siteAuditHtml, /data-action="international-visibility-evidence-batch-import"/);
  assert.match(siteAuditHtml, /测量证据台账/, "International GEO should render measured evidence ledger");
  assert.match(siteAuditHtml, /证据复核/, "International GEO should render measured evidence review queue");
  assert.match(siteAuditHtml, /可见度趋势/, "International GEO should render approved evidence trends");
  assert.match(siteAuditHtml, /data-action="international-visibility-evidence-approve"/);
  assert.match(siteAuditHtml, /data-action="international-visibility-evidence-reject"/);
  assert.match(siteAuditHtml, /approved evidence only|仅统计已通过证据/, "Trend UI should state approved-evidence boundary");
```

- [ ] **Step 6: Run failing check**

Run:

```bash
npm run check
```

Expected: FAIL with missing `importInternationalGeoVisibilityEvidenceBatchAction` or missing client API wiring. If sandbox blocks server listen with `EPERM`, rerun with non-sandbox permissions.

- [ ] **Step 7: Commit failing tests**

```bash
git add verify-mvp.mjs
git commit -m "test: require measured evidence operations workflow"
```

---

### Task 2: Implement Mock Data Evidence Operations

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add state hydration**

Add `visibility_import_batches: []` to the International GEO seed state and ensure `ensureInternationalGeoStateShape()` initializes it when missing.

- [ ] **Step 2: Add review constants**

Near visibility import constants, add:

```js
const INTERNATIONAL_GEO_VISIBILITY_EVIDENCE_REVIEW_STATUSES = new Set([
  "pending_review",
  "approved",
  "rejected"
]);
```

- [ ] **Step 3: Extract reusable snapshot creation helper**

Create helpers so single and batch imports share normalization:

```js
function buildMeasuredVisibilitySnapshot(normalized, run, importMode, importBatchId) {
  const snapshot = {
    id: uniqueId("aivs"),
    prompt_set_id: normalized.prompt_set_id,
    run_id: run.id,
    import_batch_id: importBatchId,
    engine_id: normalized.engine_id,
    engine_label: internationalGeoEngineLabel(normalized.engine_id),
    data_status: "measured",
    provider_id: normalized.provider_id,
    source_type: normalized.source_type,
    source_label: normalized.source_label,
    source_url: normalized.source_url,
    captured_at: normalized.captured_at,
    brand_mentioned: normalized.brand_mentioned,
    owned_citation_count: normalized.owned_citation_count,
    citation_urls: normalized.citation_urls,
    recommendation_rank: normalized.recommendation_rank,
    competitors_mentioned: normalized.competitors_mentioned,
    confidence: normalized.confidence,
    diagnostics: ["Measured evidence imported manually. No live provider API was called."],
    raw_observation: normalized.raw_observation,
    evidence_note: normalized.evidence_note,
    imported_at: run.finished_at,
    import_mode: importMode,
    review_status: "pending_review",
    reviewed_at: "",
    reviewed_by: "",
    review_note: ""
  };
  validateInternationalGeoVisibilitySnapshot(snapshot);
  return snapshot;
}
```

- [ ] **Step 4: Add ledger helpers**

Add:

```js
function summarizeImportBatchReviewCounts(snapshotIds = []) {
  const snapshots = internationalGeoState.visibility_snapshots.filter((item) => snapshotIds.includes(item.id));
  return {
    pending_review_count: snapshots.filter((item) => (item.review_status || "pending_review") === "pending_review").length,
    approved_count: snapshots.filter((item) => item.review_status === "approved").length,
    rejected_count: snapshots.filter((item) => item.review_status === "rejected").length
  };
}

function refreshVisibilityImportBatchCounts(importBatchId) {
  const batch = internationalGeoState.visibility_import_batches.find((item) => item.id === importBatchId);
  if (!batch) return null;
  Object.assign(batch, summarizeImportBatchReviewCounts(batch.snapshot_ids || []));
  return batch;
}
```

- [ ] **Step 5: Update single-row import**

Change `importInternationalGeoVisibilityEvidenceAction()` so it creates a ledger row:

- `import_mode: "manual_single"`
- `row_count: 1`
- `snapshots_created: 1`
- `pending_review_count: 1`
- `snapshot_ids: [snapshot.id]`

Return shape should include `import_batch` while keeping existing `snapshot`, `run`, and `summary` fields.

- [ ] **Step 6: Add batch action**

Export:

```js
export function importInternationalGeoVisibilityEvidenceBatchAction(payload = {}) {
  ensureInternationalGeoStateShape();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!rows.length) throw visibilityValidationError("rows", "rows must contain at least one evidence row.");
  const normalizedRows = [];
  const rowErrors = [];
  rows.forEach((row, index) => {
    try {
      normalizedRows.push(normalizeVisibilityImportPayload(row));
    } catch (error) {
      rowErrors.push({
        row_index: index,
        field: error.field_errors?.[0]?.field || "row",
        message: error.field_errors?.[0]?.message || error.message || "Invalid row."
      });
    }
  });
  if (rowErrors.length) {
    const error = visibilityValidationError("rows", "One or more evidence rows are invalid.");
    error.row_errors = rowErrors;
    throw error;
  }
  // create one measured_import run, one import batch, one snapshot per row
}
```

Implementation details:

- Create run with `trigger: "manual_import"`, `data_source_type: "measured_import"`, prompt/engine counts from normalized rows, `snapshots_created: normalizedRows.length`.
- Create batch `id: uniqueId("aivimp")`, `import_mode: "manual_batch"`, `provider_id: "manual_import"`, `status: "completed"`, `source_label`, `import_note`, row counts, review counts, `snapshot_ids`.
- Create snapshots with `buildMeasuredVisibilitySnapshot(normalized, run, "manual_batch", batch.id)`.
- Unshift snapshots, run, and batch.
- Update provider readiness for each snapshot.
- Record an audit event.
- Return `{ import_batch, run, snapshots, summary }`.

- [ ] **Step 7: Add review action**

Export:

```js
export function reviewInternationalGeoVisibilityEvidenceAction(snapshotId, payload = {}) {
  ensureInternationalGeoStateShape();
  const snapshot = internationalGeoState.visibility_snapshots.find((item) => item.id === snapshotId);
  if (!snapshot) return null;
  if (snapshot.data_status !== "measured" || snapshot.provider_id !== "manual_import") {
    throw visibilityValidationError("snapshot_id", "Only manually imported measured evidence can be reviewed.");
  }
  const action = String(payload.action || "").trim();
  if (!["approve", "reject"].includes(action)) {
    throw visibilityValidationError("action", "action must be approve or reject.");
  }
  snapshot.review_status = action === "approve" ? "approved" : "rejected";
  snapshot.reviewed_at = nowIso();
  snapshot.reviewed_by = String(payload.reviewed_by || "local_operator").trim();
  snapshot.review_note = String(payload.review_note || payload.human_notes || "").trim();
  const importBatch = refreshVisibilityImportBatchCounts(snapshot.import_batch_id);
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.visibility.evidence.review", "international_geo_visibility_snapshot", snapshot.id, {
    action,
    review_status: snapshot.review_status,
    import_batch_id: snapshot.import_batch_id || ""
  });
  persistState();
  return deepClone({ snapshot, import_batch: importBatch, summary: internationalGeoVisibilitySummary() });
}
```

- [ ] **Step 8: Add trend read model**

Add:

```js
function internationalGeoVisibilityTrends() {
  const approved = (internationalGeoState.visibility_snapshots || []).filter(
    (item) => item.data_status === "measured" && item.provider_id === "manual_import" && item.review_status === "approved"
  );
  const groups = new Map();
  approved.forEach((snapshot) => {
    const key = `${snapshot.prompt_set_id}::${snapshot.engine_id}`;
    const current = groups.get(key) || {
      prompt_set_id: snapshot.prompt_set_id,
      engine_id: snapshot.engine_id,
      engine_label: snapshot.engine_label || internationalGeoEngineLabel(snapshot.engine_id),
      latest_captured_at: "",
      approved_snapshot_count: 0,
      brand_mentioned_count: 0,
      owned_citation_count: 0,
      best_recommendation_rank: null,
      latest_recommendation_rank: null,
      competitors_mentioned: [],
      latest_snapshot_id: ""
    };
    current.approved_snapshot_count += 1;
    if (snapshot.brand_mentioned) current.brand_mentioned_count += 1;
    current.owned_citation_count += Number(snapshot.owned_citation_count || 0);
    if (Number.isInteger(snapshot.recommendation_rank)) {
      current.best_recommendation_rank =
        current.best_recommendation_rank === null
          ? snapshot.recommendation_rank
          : Math.min(current.best_recommendation_rank, snapshot.recommendation_rank);
    }
    const competitors = new Set(current.competitors_mentioned);
    (snapshot.competitors_mentioned || []).forEach((item) => competitors.add(item));
    current.competitors_mentioned = [...competitors];
    if (!current.latest_captured_at || String(snapshot.captured_at) > current.latest_captured_at) {
      current.latest_captured_at = snapshot.captured_at;
      current.latest_recommendation_rank = snapshot.recommendation_rank ?? null;
      current.latest_snapshot_id = snapshot.id;
    }
    groups.set(key, current);
  });
  return [...groups.values()].sort((left, right) => String(right.latest_captured_at).localeCompare(String(left.latest_captured_at)));
}
```

- [ ] **Step 9: Expand summary and state**

Update `internationalGeoVisibilitySummary()` to include:

- `import_batch_count`
- `pending_review_count`
- `approved_evidence_count`
- `rejected_evidence_count`
- `trend_row_count`

Update `getInternationalGeoVisibilityState()` to include:

```js
imports: internationalGeoState.visibility_import_batches,
trends: internationalGeoVisibilityTrends(),
```

- [ ] **Step 10: Run check**

Run:

```bash
npm run check
```

Expected: source/API/UI assertions may still fail until frontend tasks are implemented, but mock-data behavior should pass.

- [ ] **Step 11: Commit model implementation**

```bash
git add mock-data.mjs
git commit -m "feat: add measured evidence operations model"
```

---

### Task 3: Add HTTP API Routes

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Import actions**

Add:

```js
  importInternationalGeoVisibilityEvidenceBatchAction,
  reviewInternationalGeoVisibilityEvidenceAction,
```

- [ ] **Step 2: Add batch route**

Add after the single-row evidence import route:

```js
  if (req.method === "POST" && pathname === "/international-geo/visibility/evidence/imports") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(importInternationalGeoVisibilityEvidenceBatchAction(body)));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid measured visibility evidence batch";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 3: Add review route**

Add:

```js
  if (req.method === "POST" && pathname.match(/^\/international-geo\/visibility\/evidence\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoVisibilityEvidenceAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Measured visibility evidence not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid measured visibility evidence review";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }
```

Check the `pathname.split("/")[4]` index against the path parts before committing.

- [ ] **Step 4: Run check**

Run:

```bash
npm run check
```

Expected: frontend source/UI assertions may still fail until Task 4 and Task 5.

- [ ] **Step 5: Commit routes**

```bash
git add server.mjs
git commit -m "feat: expose measured evidence operations api"
```

---

### Task 4: Wire Browser API, Actions, And Events

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add API wrappers**

In `prototype/src/api.js`, add after the single-row import wrapper:

```js
export function importInternationalGeoVisibilityEvidenceBatch(payload = {}) {
  return requestJson("/api/v1/international-geo/visibility/evidence/imports", "POST", payload);
}

export function reviewInternationalGeoVisibilityEvidence(snapshotId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/visibility/evidence/${encodeURIComponent(snapshotId)}/review`,
    "POST",
    payload
  );
}
```

- [ ] **Step 2: Add imports in main.js**

Import as:

```js
  importInternationalGeoVisibilityEvidenceBatch as importInternationalGeoVisibilityEvidenceBatchApi,
  reviewInternationalGeoVisibilityEvidence as reviewInternationalGeoVisibilityEvidenceApi,
```

- [ ] **Step 3: Add payload helper**

After `getInternationalVisibilityEvidencePayload()`, add:

```js
function getInternationalVisibilityEvidenceBatchPayload() {
  const container = root.querySelector('[data-international-panel="visibility-evidence-batch-import"]');
  if (!container) return null;
  let rows = [];
  const rowsText = container.querySelector('[data-visibility-evidence-batch-field="rows_json"]')?.value?.trim() || "";
  if (rowsText) {
    rows = JSON.parse(rowsText);
  }
  return {
    source_label:
      container.querySelector('[data-visibility-evidence-batch-field="source_label"]')?.value?.trim() || "",
    import_note:
      container.querySelector('[data-visibility-evidence-batch-field="import_note"]')?.value?.trim() || "",
    rows
  };
}
```

- [ ] **Step 4: Add browser actions**

Add near the existing single import action:

```js
  async importInternationalGeoVisibilityEvidenceBatch() {
    let payload = null;
    try {
      payload = getInternationalVisibilityEvidenceBatchPayload();
    } catch (error) {
      setError("批量导入 JSON 格式无效");
      rerender();
      return;
    }
    if (!payload) return;
    try {
      const result = await importInternationalGeoVisibilityEvidenceBatchApi(payload);
      await refreshData();
      store.page = "international";
      showNotice(`批量测量证据已导入：${result.snapshots?.length || 0} 条。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "批量导入测量证据失败");
      rerender();
    }
  },
  async reviewInternationalGeoVisibilityEvidence(snapshotId, action) {
    if (!snapshotId) return;
    try {
      await reviewInternationalGeoVisibilityEvidenceApi(snapshotId, { action });
      await refreshData();
      store.page = "international";
      showNotice(action === "approve" ? "测量证据已通过。" : "测量证据已驳回。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "复核测量证据失败");
      rerender();
    }
  },
```

- [ ] **Step 5: Wire events**

In `prototype/src/events.js`, add:

```js
    if (action === "international-visibility-evidence-batch-import") {
      await actions.importInternationalGeoVisibilityEvidenceBatch();
      return;
    }

    if (action === "international-visibility-evidence-approve") {
      await actions.reviewInternationalGeoVisibilityEvidence(actionButton.dataset.snapshotId, "approve");
      return;
    }

    if (action === "international-visibility-evidence-reject") {
      await actions.reviewInternationalGeoVisibilityEvidence(actionButton.dataset.snapshotId, "reject");
      return;
    }
```

- [ ] **Step 6: Run check**

Run:

```bash
npm run check
```

Expected: UI panel assertions may still fail until Task 5.

- [ ] **Step 7: Commit frontend wiring**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire measured evidence operations actions"
```

---

### Task 5: Render Evidence Operations UI

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add batch import panel**

Add after `renderMeasuredVisibilityEvidenceImportPanel()`:

```js
function renderMeasuredVisibilityEvidenceBatchImportPanel(visibility = {}) {
  const sampleRow = visibility.prompt_sets?.[0]
    ? {
        prompt_set_id: visibility.prompt_sets[0].id,
        engine_id: visibility.prompt_sets[0].engines?.[0] || "chatgpt_search",
        source_type: "manual_observation",
        captured_at: "",
        brand_mentioned: false,
        citation_urls: [],
        recommendation_rank: "",
        competitors_mentioned: [],
        confidence: "medium",
        raw_observation: "",
        evidence_note: ""
      }
    : {};
  return `
    <section class="surface panel" data-international-panel="visibility-evidence-batch-import">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">批量导入测量证据</h3>
          <div class="panel-note">粘贴人工核验后的 JSON rows；本地写入 manual_import / measured_import，不调用外部 provider。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-visibility-evidence-batch-import">批量导入</button>
        </div>
      </div>
      <div class="form-grid compact-form">
        <label>Source label<input data-visibility-evidence-batch-field="source_label" value="Manual measured evidence batch" /></label>
        <label>Import note<input data-visibility-evidence-batch-field="import_note" value="" /></label>
        <label class="span-2">Rows JSON<textarea data-visibility-evidence-batch-field="rows_json" rows="8">${escapeHtml(JSON.stringify([sampleRow], null, 2))}</textarea></label>
      </div>
    </section>
  `;
}
```

- [ ] **Step 2: Add ledger table**

Add:

```js
function renderMeasuredEvidenceImportLedger(imports = []) {
  const rows = imports.length
    ? imports.map((item) => `
      <tr>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.source_label))}</div><div class="cell-sub">${escapeHtml(nullableMetric(item.id))}</div></td>
        <td>${statusMarkup(nullableMetric(item.status))}</td>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.row_count))} rows / ${escapeHtml(nullableMetric(item.snapshots_created))} snapshots</div><div class="cell-sub">${escapeHtml(nullableMetric(item.import_mode))}</div></td>
        <td><div class="cell-title">Pending ${escapeHtml(nullableMetric(item.pending_review_count))} / Approved ${escapeHtml(nullableMetric(item.approved_count))}</div><div class="cell-sub">Rejected ${escapeHtml(nullableMetric(item.rejected_count))}</div></td>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.created_at))}</div><div class="cell-sub">${escapeHtml(nullableMetric(item.import_note))}</div></td>
      </tr>
    `)
    : [`<tr><td colspan="5"><div class="empty-state">暂无测量证据导入台账。</div></td></tr>`];
  return `
    <section class="surface panel" data-international-panel="visibility-evidence-ledger">
      <div class="panel-head"><div><h3 class="panel-title">测量证据台账</h3><div class="panel-note">记录 manual_import / measured_import 批次、来源和复核计数。</div></div></div>
      ${tableMarkup(["来源", "状态", "规模", "复核", "时间 / 备注"], rows)}
    </section>
  `;
}
```

- [ ] **Step 3: Add review table**

Add:

```js
function renderMeasuredEvidenceReviewTable(snapshots = []) {
  const measured = snapshots.filter((item) => item.data_status === "measured" && item.provider_id === "manual_import");
  const rows = measured.length
    ? measured.map((item) => `
      <tr>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.prompt_set_id))}</div><div class="cell-sub">${escapeHtml(nullableMetric(item.engine_label || item.engine_id))}</div></td>
        <td>${statusMarkup(nullableMetric(item.review_status || "pending_review"))}</td>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.captured_at))}</div><div class="cell-sub">${escapeHtml(nullableMetric(item.source_type))}</div></td>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.brand_mentioned ? "品牌提及" : "未提及"))}</div><div class="cell-sub">Rank ${escapeHtml(nullableMetric(item.recommendation_rank))} / Citations ${escapeHtml(nullableMetric(item.owned_citation_count))}</div></td>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.evidence_note || item.raw_observation))}</div><div class="cell-sub">${escapeHtml(nullableMetric(item.review_note))}</div></td>
        <td>
          <div class="actions-row">
            <button class="ghost-btn" data-action="international-visibility-evidence-reject" data-snapshot-id="${escapeHtml(item.id || "")}">驳回</button>
            <button class="secondary-btn" data-action="international-visibility-evidence-approve" data-snapshot-id="${escapeHtml(item.id || "")}">审核通过</button>
          </div>
        </td>
      </tr>
    `)
    : [`<tr><td colspan="6"><div class="empty-state">暂无可复核的测量证据。</div></td></tr>`];
  return `
    <section class="surface panel" data-international-panel="visibility-evidence-review">
      <div class="panel-head"><div><h3 class="panel-title">证据复核</h3><div class="panel-note">人工导入证据默认 pending_review；趋势仅统计已通过证据。</div></div></div>
      ${tableMarkup(["Prompt / Engine", "复核状态", "时间 / Source", "结果", "证据 / 备注", "动作"], rows)}
    </section>
  `;
}
```

- [ ] **Step 4: Add trend table**

Add:

```js
function renderVisibilityTrendTable(trends = []) {
  const rows = trends.length
    ? trends.map((item) => `
      <tr>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.prompt_set_id))}</div><div class="cell-sub">${escapeHtml(nullableMetric(item.engine_label || item.engine_id))}</div></td>
        <td>${escapeHtml(nullableMetric(item.approved_snapshot_count))}</td>
        <td>${escapeHtml(nullableMetric(item.brand_mentioned_count))}</td>
        <td>${escapeHtml(nullableMetric(item.owned_citation_count))}</td>
        <td><div class="cell-title">Best ${escapeHtml(nullableMetric(item.best_recommendation_rank))}</div><div class="cell-sub">Latest ${escapeHtml(nullableMetric(item.latest_recommendation_rank))}</div></td>
        <td><div class="cell-title">${escapeHtml(nullableMetric(item.latest_captured_at))}</div><div class="cell-sub">${escapeHtml((item.competitors_mentioned || []).join(" / ") || "-")}</div></td>
      </tr>
    `)
    : [`<tr><td colspan="6"><div class="empty-state">暂无已通过证据趋势。</div></td></tr>`];
  return `
    <section class="surface panel" data-international-panel="visibility-trends">
      <div class="panel-head"><div><h3 class="panel-title">可见度趋势</h3><div class="panel-note">仅统计已通过证据；approved evidence only，未复核和已驳回证据不进入趋势。</div></div></div>
      ${tableMarkup(["Prompt / Engine", "Approved", "Brand mentions", "Owned citations", "Rank", "Latest / Competitors"], rows)}
    </section>
  `;
}
```

- [ ] **Step 5: Insert panels**

In `renderInternationalGeo()`, after `${renderMeasuredVisibilityEvidenceImportPanel(visibility)}`, add:

```js
    ${renderMeasuredVisibilityEvidenceBatchImportPanel(visibility)}
    ${renderMeasuredEvidenceImportLedger(visibility.imports || [])}
    ${renderMeasuredEvidenceReviewTable(visibility.snapshots || [])}
    ${renderVisibilityTrendTable(visibility.trends || [])}
```

- [ ] **Step 6: Run check**

Run:

```bash
npm run check
```

Expected: `verify-mvp: OK`.

- [ ] **Step 7: Commit UI**

```bash
git add prototype/src/pages/international.js
git commit -m "feat: render measured evidence operations panels"
```

---

### Task 6: Documentation And v0.18 Closeout

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/API_REFERENCE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/PHASE_2_ROADMAP.md`
- Modify: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/OPEN_SOURCE_RELEASE.md`
- Modify: `docs/README.md`
- Modify: `docs/MAINTENANCE.md`
- Create: `docs/STAGE_V0_18_CLOSEOUT.md`

- [ ] **Step 1: Bump version**

Change `package.json`:

```json
"version": "0.18.0"
```

- [ ] **Step 2: Add changelog entry**

Add `0.18.0 - 2026-07-07` with:

- batch manual measured evidence import,
- local import ledger,
- evidence approve/reject review state,
- approved-evidence trend summaries,
- dense International GEO UI panels,
- no live AI/search/SERP/indexing/external platform API calls.

- [ ] **Step 3: Update API and architecture docs**

Document:

- `POST /api/v1/international-geo/visibility/evidence/imports`
- `POST /api/v1/international-geo/visibility/evidence/:id/review`
- `GET /api/v1/international-geo/visibility` includes `imports` and `trends`
- trends count approved evidence only

- [ ] **Step 4: Update root and maintainer docs**

Update current snapshot references from `0.17.0` to `0.18.0` where describing current release state.

- [ ] **Step 5: Add closeout doc**

Create `docs/STAGE_V0_18_CLOSEOUT.md` covering:

- scope completed,
- API/UI/model surface,
- operating boundary,
- verification,
- maintainer notes.

- [ ] **Step 6: Run checks**

Run:

```bash
git diff --check
npm run check
```

- [ ] **Step 7: Commit docs**

```bash
git add package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_18_CLOSEOUT.md
git commit -m "docs: close measured evidence operations v0.18"
```

---

### Task 7: Final Verification And Push

**Files:**
- No file edits expected.

- [ ] **Step 1: Run final local checks**

```bash
git diff --check origin/main..HEAD
npm run check
git status --short
```

Expected:

- no diff whitespace errors,
- `verify-mvp: OK`,
- clean worktree.

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Verify GitHub Actions**

```bash
gh run list --limit 5
gh run watch <latest-run-id> --exit-status
```

Expected: latest `check` workflow completes with `success`.

---

## Self-Review

- Spec coverage: batch import, ledger, review, trends, UI, API, docs, and boundaries are covered.
- TDD: Task 1 creates the failing verification surface before implementation tasks.
- Type consistency: route/action names use `importInternationalGeoVisibilityEvidenceBatch` and `reviewInternationalGeoVisibilityEvidence`; event names use `international-visibility-evidence-batch-import`, `international-visibility-evidence-approve`, and `international-visibility-evidence-reject`.
- Boundary: plan preserves no live provider/API calls and no external credentials.
- Scope: CSV file upload and real provider integrations remain out of v0.18.
