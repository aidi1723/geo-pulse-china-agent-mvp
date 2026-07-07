# Measured Visibility Evidence Import v0.17 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual measured-evidence import workflow that turns human-verified AI visibility observations into `measured` International GEO snapshots.

**Architecture:** Extend the existing International GEO visibility state in `mock-data.mjs` with a single-row import action. Add one HTTP route, one browser API wrapper, one browser action/event, and one dense admin UI panel. Keep the workflow manual, local, evidence-provenance-first, and separate from external provider automation.

**Tech Stack:** Node.js ESM, zero-dependency HTTP server, local mock state, browser HTML rendering, `verify-mvp.mjs` assertions, GitHub Actions running `npm run check`.

---

## File Structure

- Modify `verify-mvp.mjs`
  - Add failing source/UI assertions for measured evidence import wiring.
  - Add mock-data behavior assertions for valid and invalid measured imports.
  - Add HTTP role/validation assertions for the new import route.

- Modify `mock-data.mjs`
  - Export `importInternationalGeoVisibilityEvidenceAction`.
  - Add validation and normalization helpers for prompt set, engine, source, capture time, brand mention, URLs, competitors, confidence, and recommendation rank.
  - Create measured snapshot rows, measured import run rows, and provider readiness updates.

- Modify `server.mjs`
  - Import the new action.
  - Add `POST /international-geo/visibility/evidence/import`.
  - Return `400 VALIDATION_ERROR` for invalid import payloads.

- Modify `prototype/src/api.js`
  - Add `importInternationalGeoVisibilityEvidence(payload = {})`.

- Modify `prototype/src/main.js`
  - Import the API wrapper.
  - Add form payload collection and a browser action.

- Modify `prototype/src/events.js`
  - Wire `data-action="international-visibility-evidence-import"`.

- Modify `prototype/src/pages/international.js`
  - Render `导入测量证据` after `AI 可见度测量` and before `引擎数据源状态`.
  - Add compact form fields and button.
  - Show `manual_import` / source provenance in the prompt snapshot table.

- Modify docs
  - `package.json` to `0.17.0`
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
  - Add `docs/STAGE_V0_17_CLOSEOUT.md`

---

### Task 1: Add Failing Source And UI Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add source wiring assertions**

In `runSingleUserSourceChecks()`, after the existing International GEO visibility run assertions, add:

```js
  assert.match(
    apiSource,
    /export function importInternationalGeoVisibilityEvidence\(payload = \{\}\)/,
    "International GEO measured evidence import should have a client API method"
  );
  assert.match(
    mainSource,
    /importInternationalGeoVisibilityEvidence as importInternationalGeoVisibilityEvidenceApi/,
    "International GEO measured evidence import should be imported into the browser action layer"
  );
  assert.match(
    mainSource,
    /importInternationalGeoVisibilityEvidence\(\)/,
    "International GEO measured evidence import should have a browser action handler"
  );
  assert.match(
    eventsSource,
    /action === "international-visibility-evidence-import"/,
    "International GEO measured evidence import should be wired in the event dispatcher"
  );
```

- [ ] **Step 2: Add UI rendering assertions**

In `runInternationalGeoUiChecks()`, after the `AI 可见度测量` assertions and before provider readiness assertions, add:

```js
  assert.match(siteAuditHtml, /导入测量证据/, "International GEO should render measured evidence import panel");
  assert.match(siteAuditHtml, /data-action="international-visibility-evidence-import"/);
  assert.match(siteAuditHtml, /manual_import/, "Measured evidence import UI should expose manual_import boundary");
  assert.match(siteAuditHtml, /measured_import/, "Measured evidence import UI should expose measured_import run boundary");
```

- [ ] **Step 3: Run failing check**

Run:

```bash
npm run check
```

Expected: FAIL with a missing `importInternationalGeoVisibilityEvidence` source assertion.

- [ ] **Step 4: Commit failing source/UI tests**

```bash
git add verify-mvp.mjs
git commit -m "test: require measured visibility evidence import workflow"
```

---

### Task 2: Add Mock Data Behavior Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add import**

At the top import list from `./mock-data.mjs`, add:

```js
  importInternationalGeoVisibilityEvidenceAction,
```

- [ ] **Step 2: Add behavior assertions**

In `runMockDataChecks()`, after the existing default International GEO visibility run assertions and before evidence asset checks, add:

```js
  const measuredPromptSet = createInternationalGeoVisibilityPromptSetAction({
    prompt: "best AI search optimization platform for exporters",
    market: "US",
    language: "en-US",
    buyer_intent: "decision",
    product_name: "AgentCore GEO",
    target_url: "https://example.com/agentcore-geo",
    target_brand: "AgentCore GEO",
    competitors: ["Profound", "AthenaHQ"],
    engines: ["chatgpt_search", "gemini"]
  });

  const measuredImport = importInternationalGeoVisibilityEvidenceAction({
    prompt_set_id: measuredPromptSet.id,
    engine_id: "chatgpt_search",
    source_type: "manual_observation",
    source_label: "Manual ChatGPT Search check",
    source_url: "https://chatgpt.com/",
    captured_at: "2026-07-07T10:30:00.000Z",
    brand_mentioned: true,
    citation_urls: "https://example.com/agentcore-geo\nhttps://example.com/compare",
    recommendation_rank: "3",
    competitors_mentioned: "Profound\nAthenaHQ",
    confidence: "medium",
    raw_observation: "The answer recommended AgentCore GEO at #3 and cited two owned URLs.",
    evidence_note: "Manual reviewer copied the result from ChatGPT Search."
  });
  assert.equal(measuredImport.snapshot.data_status, "measured", "Measured import should create measured snapshot");
  assert.equal(measuredImport.snapshot.provider_id, "manual_import", "Measured import should use manual_import provider");
  assert.equal(measuredImport.snapshot.source_type, "manual_observation", "Measured import should preserve source type");
  assert.equal(measuredImport.snapshot.owned_citation_count, 2, "Measured import should count citation URLs");
  assert.deepEqual(
    measuredImport.snapshot.citation_urls,
    ["https://example.com/agentcore-geo", "https://example.com/compare"],
    "Measured import should normalize citation URLs"
  );
  assert.equal(measuredImport.snapshot.recommendation_rank, 3, "Measured import should normalize rank");
  assert.equal(measuredImport.run.data_source_type, "measured_import", "Measured import should create measured_import run");
  assert.equal(measuredImport.run.snapshots_created, 1, "Measured import run should create one snapshot");
  assert.ok(
    measuredImport.summary.measured_snapshots >= 1,
    "Measured import should increase measured snapshot summary count"
  );

  const visibilityAfterMeasuredImport = getInternationalGeoVisibilityState();
  const readinessAfterMeasuredImport = visibilityAfterMeasuredImport.provider_readiness.find(
    (item) => item.engine_id === "chatgpt_search"
  );
  assert.equal(
    readinessAfterMeasuredImport?.data_status,
    "measured",
    "Measured import should update provider readiness to measured"
  );
  assert.equal(
    readinessAfterMeasuredImport?.provider_id,
    "manual_import",
    "Measured import should update provider readiness provider id"
  );
  assert.ok(
    visibilityAfterMeasuredImport.snapshots.some(
      (item) => item.id === measuredImport.snapshot.id && item.import_mode === "manual_single"
    ),
    "Measured import should persist manual_single snapshot"
  );

  assert.throws(
    () =>
      importInternationalGeoVisibilityEvidenceAction({
        prompt_set_id: "missing-prompt-set",
        engine_id: "chatgpt_search",
        source_type: "manual_observation",
        captured_at: "2026-07-07T10:30:00.000Z",
        brand_mentioned: false,
        evidence_note: "No mention."
      }),
    /VALIDATION_ERROR/,
    "Measured import should reject unknown prompt set"
  );

  assert.throws(
    () =>
      importInternationalGeoVisibilityEvidenceAction({
        prompt_set_id: measuredPromptSet.id,
        engine_id: "claude",
        source_type: "manual_observation",
        captured_at: "2026-07-07T10:30:00.000Z",
        brand_mentioned: false,
        evidence_note: "No mention."
      }),
    /VALIDATION_ERROR/,
    "Measured import should reject engines not included in the prompt set"
  );

  assert.throws(
    () =>
      importInternationalGeoVisibilityEvidenceAction({
        prompt_set_id: measuredPromptSet.id,
        engine_id: "chatgpt_search",
        source_type: "manual_observation",
        brand_mentioned: false,
        evidence_note: "Missing captured_at."
      }),
    /VALIDATION_ERROR/,
    "Measured import should reject missing captured_at"
  );

  assert.throws(
    () =>
      importInternationalGeoVisibilityEvidenceAction({
        prompt_set_id: measuredPromptSet.id,
        engine_id: "chatgpt_search",
        source_type: "manual_observation",
        captured_at: "2026-07-07T10:30:00.000Z",
        brand_mentioned: true
      }),
    /VALIDATION_ERROR/,
    "Measured import should reject brand mentions without evidence detail"
  );
```

- [ ] **Step 3: Run failing check**

Run:

```bash
npm run check
```

Expected: FAIL with missing export for `importInternationalGeoVisibilityEvidenceAction`.

- [ ] **Step 4: Commit failing behavior tests**

```bash
git add verify-mvp.mjs
git commit -m "test: cover measured visibility evidence imports"
```

---

### Task 3: Implement Mock Data Import Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add constants and validation helpers**

Add after `normalizeInternationalGeoVisibilityEngines()`:

```js
const INTERNATIONAL_GEO_VISIBILITY_IMPORT_SOURCE_TYPES = new Set([
  "manual_observation",
  "manual_export",
  "provider_report"
]);

const INTERNATIONAL_GEO_VISIBILITY_IMPORT_CONFIDENCE = new Set(["low", "medium", "high"]);

function visibilityValidationError(field, message) {
  const err = new Error("VALIDATION_ERROR");
  err.code = "VALIDATION_ERROR";
  err.field_errors = [{ field, message }];
  return err;
}

function normalizeBooleanField(value, field) {
  if (value === true || value === false) return value;
  if (String(value).trim() === "true") return true;
  if (String(value).trim() === "false") return false;
  throw visibilityValidationError(field, `${field} must be true or false.`);
}

function normalizeUrlArray(value, field) {
  const items = normalizeStringArray(value);
  items.forEach((item) => {
    try {
      const url = new URL(item);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      throw visibilityValidationError(field, `${field} must contain valid http(s) URLs.`);
    }
  });
  return items;
}

function normalizeRecommendationRank(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const rank = Number(value);
  if (!Number.isInteger(rank) || rank < 1) {
    throw visibilityValidationError("recommendation_rank", "recommendation_rank must be a positive integer.");
  }
  return rank;
}

function normalizeCapturedAt(value) {
  const text = String(value || "").trim();
  if (!text) throw visibilityValidationError("captured_at", "captured_at is required.");
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw visibilityValidationError("captured_at", "captured_at must be a valid date.");
  }
  return date.toISOString();
}

function normalizeVisibilityImportPayload(payload = {}) {
  const promptSetId = String(payload.prompt_set_id || "").trim();
  if (!promptSetId) throw visibilityValidationError("prompt_set_id", "prompt_set_id is required.");
  const promptSet = internationalGeoState.visibility_prompt_sets.find((item) => item.id === promptSetId);
  if (!promptSet) throw visibilityValidationError("prompt_set_id", "Unknown prompt_set_id.");

  const engineId = String(payload.engine_id || "").trim();
  if (!engineId) throw visibilityValidationError("engine_id", "engine_id is required.");
  normalizeInternationalGeoVisibilityEngines([engineId]);
  if (!(promptSet.engines || []).includes(engineId)) {
    throw visibilityValidationError("engine_id", "engine_id must be included in the selected prompt set.");
  }

  const sourceType = String(payload.source_type || "").trim();
  if (!sourceType) throw visibilityValidationError("source_type", "source_type is required.");
  if (!INTERNATIONAL_GEO_VISIBILITY_IMPORT_SOURCE_TYPES.has(sourceType)) {
    throw visibilityValidationError("source_type", "Unsupported source_type.");
  }

  const brandMentioned = normalizeBooleanField(payload.brand_mentioned, "brand_mentioned");
  const capturedAt = normalizeCapturedAt(payload.captured_at);
  const citationUrls = normalizeUrlArray(payload.citation_urls || [], "citation_urls");
  const recommendationRank = normalizeRecommendationRank(payload.recommendation_rank);
  const competitorsMentioned = normalizeStringArray(payload.competitors_mentioned || []);
  const rawObservation = String(payload.raw_observation || "").trim();
  const evidenceNote = String(payload.evidence_note || "").trim();
  const confidence = String(payload.confidence || "medium").trim();
  if (!INTERNATIONAL_GEO_VISIBILITY_IMPORT_CONFIDENCE.has(confidence)) {
    throw visibilityValidationError("confidence", "Unsupported confidence.");
  }
  if (brandMentioned && !citationUrls.length && !recommendationRank && !rawObservation) {
    throw visibilityValidationError(
      "brand_mentioned",
      "Brand-mentioned imports require citation_urls, recommendation_rank, or raw_observation."
    );
  }
  if (sourceType === "manual_observation" && !evidenceNote && !rawObservation) {
    throw visibilityValidationError(
      "evidence_note",
      "manual_observation imports require evidence_note or raw_observation."
    );
  }

  return {
    promptSet,
    prompt_set_id: promptSetId,
    engine_id: engineId,
    provider_id: String(payload.provider_id || "manual_import").trim() || "manual_import",
    source_type: sourceType,
    source_label: String(payload.source_label || "Manual measured evidence").trim(),
    source_url: String(payload.source_url || "").trim(),
    captured_at: capturedAt,
    brand_mentioned: brandMentioned,
    owned_citation_count:
      payload.owned_citation_count === null || payload.owned_citation_count === undefined || payload.owned_citation_count === ""
        ? citationUrls.length
        : Number(payload.owned_citation_count),
    citation_urls: citationUrls,
    recommendation_rank: recommendationRank,
    competitors_mentioned: competitorsMentioned,
    confidence,
    raw_observation: rawObservation,
    evidence_note: evidenceNote
  };
}
```

- [ ] **Step 2: Add provider readiness update helper**

Add after `buildUnavailableVisibilitySnapshot()`:

```js
function updateVisibilityProviderReadinessForImport(snapshot) {
  let row = internationalGeoState.visibility_provider_readiness.find((item) => item.engine_id === snapshot.engine_id);
  if (!row) {
    row = {
      engine_id: snapshot.engine_id,
      engine_label: snapshot.engine_label
    };
    internationalGeoState.visibility_provider_readiness.push(row);
  }
  row.data_status = "measured";
  row.provider_id = snapshot.provider_id;
  row.connector_id = "manual_import";
  row.permission_status = "manual_review";
  row.last_measured_at = snapshot.captured_at;
  row.diagnostic = "Latest measured evidence was imported manually. No provider API was called.";
  row.diagnostics = [row.diagnostic];
}
```

- [ ] **Step 3: Add import action**

Add after `runInternationalGeoVisibilityMeasurementAction()`:

```js
export function importInternationalGeoVisibilityEvidenceAction(payload = {}) {
  ensureInternationalGeoStateShape();
  const startedAt = nowIso();
  const normalized = normalizeVisibilityImportPayload(payload);
  const run = {
    id: uniqueId("aivrun"),
    trigger: "manual_import",
    status: "completed",
    data_source_type: "measured_import",
    provider_id: normalized.provider_id,
    prompt_count: 1,
    engine_count: 1,
    snapshots_created: 1,
    started_at: startedAt,
    finished_at: nowIso(),
    steps: []
  };
  run.steps = [
    {
      id: uniqueId("aivstep"),
      run_id: run.id,
      sequence: 1,
      step_type: "validate_import",
      status: "succeeded",
      status_label: "Measured evidence validated",
      output_preview: {
        prompt_set_id: normalized.prompt_set_id,
        engine_id: normalized.engine_id
      }
    },
    {
      id: uniqueId("aivstep"),
      run_id: run.id,
      sequence: 2,
      step_type: "write_measured_snapshot",
      status: "succeeded",
      status_label: "Measured snapshot recorded",
      output_preview: {
        snapshots_created: 1
      }
    }
  ];

  const snapshot = {
    id: uniqueId("aivs"),
    prompt_set_id: normalized.prompt_set_id,
    run_id: run.id,
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
    import_mode: "manual_single"
  };
  validateInternationalGeoVisibilitySnapshot(snapshot);
  internationalGeoState.visibility_snapshots.unshift(snapshot);
  internationalGeoState.visibility_runs.unshift(run);
  updateVisibilityProviderReadinessForImport(snapshot);
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.visibility.evidence.import", "international_geo_visibility_snapshot", snapshot.id, {
    prompt_set_id: snapshot.prompt_set_id,
    engine_id: snapshot.engine_id,
    provider_id: snapshot.provider_id,
    data_status: snapshot.data_status
  });
  persistState();
  return deepClone({
    snapshot,
    run,
    summary: internationalGeoVisibilitySummary()
  });
}
```

- [ ] **Step 4: Run behavior tests**

Run:

```bash
npm run check
```

Expected: source assertions still fail until client/UI tasks are implemented, but the missing mock export failure should be resolved. If sandbox blocks the local HTTP server with `listen EPERM`, rerun with approved non-sandbox permissions.

- [ ] **Step 5: Commit model implementation**

```bash
git add mock-data.mjs
git commit -m "feat: add measured visibility evidence import model"
```

---

### Task 4: Add HTTP API Route

**Files:**
- Modify: `server.mjs`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add server import**

In `server.mjs`, add `importInternationalGeoVisibilityEvidenceAction` to the `mock-data.mjs` import list.

- [ ] **Step 2: Add route**

Add after the existing `/international-geo/visibility/run` route:

```js
  if (req.method === "POST" && pathname === "/international-geo/visibility/evidence/import") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(importInternationalGeoVisibilityEvidenceAction(body)));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid measured visibility evidence";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 3: Add HTTP assertions**

In `runHttpChecks()`, after the existing International GEO visibility run HTTP checks and before evidence asset HTTP checks, add:

```js
    const viewerMeasuredImport = await httpRequest(
      port,
      "/api/v1/international-geo/visibility/evidence/import",
      {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({
          prompt_set_id: "aiprompt-seed-1",
          engine_id: "chatgpt_search",
          source_type: "manual_observation",
          captured_at: "2026-07-07T10:30:00.000Z",
          brand_mentioned: false,
          evidence_note: "Viewer should not be able to import."
        })
      }
    );
    assert.equal(viewerMeasuredImport.status, 403, "Viewer should not import measured visibility evidence");

    const ownerMeasuredPromptSet = await httpRequest(port, "/api/v1/international-geo/visibility/prompt-sets", {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        prompt: "best AI search optimization platform for exporters",
        market: "US",
        language: "en-US",
        product_name: "AgentCore GEO",
        target_url: "https://example.com/agentcore-geo",
        target_brand: "AgentCore GEO",
        engines: ["chatgpt_search"]
      })
    });
    assert.equal(ownerMeasuredPromptSet.status, 201, "Owner should create measured import prompt set");

    const ownerMeasuredImport = await httpRequest(
      port,
      "/api/v1/international-geo/visibility/evidence/import",
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({
          prompt_set_id: ownerMeasuredPromptSet.body.data.id,
          engine_id: "chatgpt_search",
          source_type: "manual_observation",
          source_url: "https://chatgpt.com/",
          captured_at: "2026-07-07T10:30:00.000Z",
          brand_mentioned: true,
          citation_urls: ["https://example.com/agentcore-geo"],
          recommendation_rank: 2,
          raw_observation: "Manual observation cited the owned page.",
          evidence_note: "HTTP import test."
        })
      }
    );
    assert.equal(ownerMeasuredImport.status, 201, "Owner should import measured visibility evidence");
    assert.equal(ownerMeasuredImport.body?.data?.snapshot?.data_status, "measured");
    assert.equal(ownerMeasuredImport.body?.data?.run?.data_source_type, "measured_import");

    const invalidMeasuredImport = await httpRequest(
      port,
      "/api/v1/international-geo/visibility/evidence/import",
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({
          prompt_set_id: ownerMeasuredPromptSet.body.data.id,
          engine_id: "chatgpt_search",
          source_type: "manual_observation",
          brand_mentioned: true
        })
      }
    );
    assert.equal(invalidMeasuredImport.status, 400, "Invalid measured visibility evidence import should fail");
```

- [ ] **Step 4: Run check**

Run:

```bash
npm run check
```

Expected: HTTP route tests pass once reached; source/UI assertions may still fail until client and UI tasks are complete. If sandbox blocks the local HTTP server with `listen EPERM`, rerun with approved non-sandbox permissions.

- [ ] **Step 5: Commit HTTP route**

```bash
git add server.mjs verify-mvp.mjs
git commit -m "feat: expose measured visibility evidence import api"
```

---

### Task 5: Wire Client API And Browser Action

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add client API wrapper**

In `prototype/src/api.js`, after `runInternationalGeoVisibilityMeasurement()` add:

```js
export function importInternationalGeoVisibilityEvidence(payload = {}) {
  return requestJson("/api/v1/international-geo/visibility/evidence/import", "POST", payload);
}
```

- [ ] **Step 2: Import wrapper in main**

In `prototype/src/main.js`, add to the API imports:

```js
  importInternationalGeoVisibilityEvidence as importInternationalGeoVisibilityEvidenceApi,
```

- [ ] **Step 3: Add payload collector**

In `prototype/src/main.js`, after `getInternationalSiteAuditPayload()` add:

```js
function getInternationalVisibilityEvidencePayload() {
  const container = root.querySelector('[data-international-panel="visibility-evidence-import"]');
  if (!container) return null;
  return {
    prompt_set_id: container.querySelector('[data-visibility-evidence-field="prompt_set_id"]')?.value || "",
    engine_id: container.querySelector('[data-visibility-evidence-field="engine_id"]')?.value || "",
    brand_mentioned: container.querySelector('[data-visibility-evidence-field="brand_mentioned"]')?.value || "",
    citation_urls: parseLineArray(
      container.querySelector('[data-visibility-evidence-field="citation_urls"]')?.value || ""
    ),
    recommendation_rank:
      container.querySelector('[data-visibility-evidence-field="recommendation_rank"]')?.value?.trim() || "",
    competitors_mentioned: parseLineArray(
      container.querySelector('[data-visibility-evidence-field="competitors_mentioned"]')?.value || ""
    ),
    source_type: container.querySelector('[data-visibility-evidence-field="source_type"]')?.value || "manual_observation",
    source_url: container.querySelector('[data-visibility-evidence-field="source_url"]')?.value?.trim() || "",
    captured_at: container.querySelector('[data-visibility-evidence-field="captured_at"]')?.value?.trim() || "",
    confidence: container.querySelector('[data-visibility-evidence-field="confidence"]')?.value || "medium",
    raw_observation:
      container.querySelector('[data-visibility-evidence-field="raw_observation"]')?.value?.trim() || "",
    evidence_note:
      container.querySelector('[data-visibility-evidence-field="evidence_note"]')?.value?.trim() || ""
  };
}
```

- [ ] **Step 4: Add browser action**

In the `actions` object, after `runInternationalGeoVisibilityMeasurement()` add:

```js
  async importInternationalGeoVisibilityEvidence() {
    const payload = getInternationalVisibilityEvidencePayload();
    if (!payload) return;
    try {
      const result = await importInternationalGeoVisibilityEvidenceApi(payload);
      await refreshData();
      store.page = "international";
      showNotice(`测量证据已导入：${result.snapshot?.engine_label || result.snapshot?.engine_id || "measured"}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "导入测量证据失败");
      rerender();
    }
  },
```

- [ ] **Step 5: Wire event**

In `prototype/src/events.js`, after `international-visibility-run` handling add:

```js
    if (action === "international-visibility-evidence-import") {
      await actions.importInternationalGeoVisibilityEvidence();
      return;
    }
```

- [ ] **Step 6: Run check**

Run:

```bash
npm run check
```

Expected: client source assertions pass; UI assertions may still fail until Task 6.

- [ ] **Step 7: Commit client wiring**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire measured visibility evidence import action"
```

---

### Task 6: Render Measured Evidence Import UI

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add field option helpers**

Add before `renderVisibilityMeasurementPanel()`:

```js
function renderVisibilityPromptOptions(promptSets = []) {
  const items = promptSets.length ? promptSets : [{ id: "", prompt: "No prompt set available" }];
  return items
    .map((item, index) => `<option value="${escapeHtml(item.id || "")}" ${index === 0 ? "selected" : ""}>${escapeHtml(item.prompt || item.id || "-")}</option>`)
    .join("");
}

function renderVisibilityEngineOptions(promptSets = []) {
  const engineIds = [...new Set((promptSets || []).flatMap((item) => item.engines || []))];
  const items = engineIds.length ? engineIds : ["chatgpt_search", "gemini", "claude", "perplexity"];
  return items
    .map((engineId, index) => `<option value="${escapeHtml(engineId)}" ${index === 0 ? "selected" : ""}>${escapeHtml(internationalEngineLabel(engineId))}</option>`)
    .join("");
}
```

If the file does not have `internationalEngineLabel()`, add:

```js
function internationalEngineLabel(engineId) {
  return (
    {
      chatgpt_search: "ChatGPT Search",
      perplexity: "Perplexity",
      google_ai_overviews: "Google AI Overviews",
      gemini: "Gemini",
      claude: "Claude",
      copilot_bing: "Copilot / Bing"
    }[engineId] || engineId || "-"
  );
}
```

- [ ] **Step 2: Add import panel renderer**

Add after `renderVisibilityMeasurementPanel()`:

```js
function renderMeasuredVisibilityEvidenceImportPanel(visibility = {}) {
  const promptSets = visibility.prompt_sets || [];
  const defaultCapturedAt = new Date().toISOString().slice(0, 16);
  return `
    <section class="surface panel" data-international-panel="visibility-evidence-import">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">导入测量证据</h3>
          <div class="panel-note">人工录入来自 ChatGPT Search、Gemini、Claude、Perplexity、Google AIO 或 Copilot/Bing 的核验证据；不会调用外部 provider。</div>
          <div class="panel-note">Provider boundary: manual_import / measured_import，结果只代表人工录入时点的 measured evidence。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-visibility-evidence-import">导入证据</button>
        </div>
      </div>
      <div class="form-grid compact-form">
        <label>Prompt set<select data-visibility-evidence-field="prompt_set_id">${renderVisibilityPromptOptions(promptSets)}</select></label>
        <label>Engine<select data-visibility-evidence-field="engine_id">${renderVisibilityEngineOptions(promptSets)}</select></label>
        <label>Brand mentioned<select data-visibility-evidence-field="brand_mentioned"><option value="true">是</option><option value="false">否</option></select></label>
        <label>Recommendation rank<input data-visibility-evidence-field="recommendation_rank" placeholder="3" /></label>
        <label>Source type<select data-visibility-evidence-field="source_type"><option value="manual_observation">manual_observation</option><option value="manual_export">manual_export</option><option value="provider_report">provider_report</option></select></label>
        <label>Captured at<input data-visibility-evidence-field="captured_at" type="datetime-local" value="${escapeHtml(defaultCapturedAt)}" /></label>
        <label>Confidence<select data-visibility-evidence-field="confidence"><option value="medium">medium</option><option value="high">high</option><option value="low">low</option></select></label>
        <label>Source URL<input data-visibility-evidence-field="source_url" placeholder="https://chatgpt.com/" /></label>
        <label class="span-2">Citation URLs<textarea data-visibility-evidence-field="citation_urls" rows="3" placeholder="https://example.com/page"></textarea></label>
        <label class="span-2">Competitors mentioned<textarea data-visibility-evidence-field="competitors_mentioned" rows="2" placeholder="Profound&#10;AthenaHQ"></textarea></label>
        <label class="span-2">Raw observation<textarea data-visibility-evidence-field="raw_observation" rows="3" placeholder="Paste the observed answer summary or reviewer note."></textarea></label>
        <label class="span-2">Evidence note<textarea data-visibility-evidence-field="evidence_note" rows="2" placeholder="Manual reviewer copied the result from ChatGPT Search."></textarea></label>
      </div>
    </section>
  `;
}
```

- [ ] **Step 3: Improve snapshot provenance display**

In `renderPromptSnapshotTable()`, replace the last `<td>` body with:

```js
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.confidence))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.provider_id || item.source_type || item.diagnostics?.[0] || item.diagnostic))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.source_url || item.evidence_note || item.raw_observation || item.diagnostics?.[0] || item.diagnostic))}</div>
            </td>
```

- [ ] **Step 4: Insert panel**

In `renderInternationalGeo()`, after:

```js
    ${renderVisibilityMeasurementPanel(visibility)}
```

insert:

```js
    ${renderMeasuredVisibilityEvidenceImportPanel(visibility)}
```

- [ ] **Step 5: Run check**

Run:

```bash
npm run check
```

Expected: all v0.17 behavior, HTTP, source, and UI assertions pass. If sandbox blocks the local HTTP server with `listen EPERM`, rerun with approved non-sandbox permissions.

- [ ] **Step 6: Commit UI**

```bash
git add prototype/src/pages/international.js
git commit -m "feat: render measured visibility evidence import panel"
```

---

### Task 7: Documentation And Version Closeout

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
- Create: `docs/STAGE_V0_17_CLOSEOUT.md`

- [ ] **Step 1: Bump package version**

In `package.json`:

```json
"version": "0.17.0"
```

- [ ] **Step 2: Add changelog entry**

At the top of `CHANGELOG.md`, add:

```md
## 0.17.0 - 2026-07-07

Manual measured visibility evidence import.

### Added

- Manual measured-evidence import for International GEO visibility snapshots.
- `measured_import` run records and `manual_import` provider provenance.
- Provider readiness updates when an imported evidence row marks an engine as measured.
- International GEO UI panel for `导入测量证据`.

### Boundaries

- imports are user-supplied measured evidence, not automated provider calls,
- no external provider credentials are stored,
- no live ChatGPT/Gemini/Claude/Perplexity/Google AI Overviews/Copilot/Bing/SERP/indexing APIs are called,
- imported evidence reflects the human-entered observation and should be rechecked over time.

### Verification

- `npm run check`
```

- [ ] **Step 3: Add closeout doc**

Create `docs/STAGE_V0_17_CLOSEOUT.md`:

```md
# Stage v0.17 Closeout

## Scope Completed

- Manual measured-evidence import for International GEO visibility snapshots.
- Single-row import validation for prompt set, engine, source type, capture time, brand mention, citations, recommendation rank, competitors, confidence, observation, and evidence note.
- `measured` snapshot creation with `manual_import` provider provenance.
- `measured_import` visibility run records.
- Provider readiness update for imported engines.
- International GEO UI, API, tests, and documentation alignment for `导入测量证据`.

## Operating Boundary

v0.17 records user-supplied measured evidence only. It does not call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, or external AI visibility APIs. It does not store external provider credentials. Imported evidence can support visibility analysis only to the extent that the human-entered observation is accurate.

## Verification

- `node -e 'JSON.parse(require("fs").readFileSync("package.json","utf8")); console.log("package json ok")'`
- `npm run check`

## Maintainer Notes

- Keep `manual_import` visibly distinct from future automated providers.
- Do not mark engine inclusion, citation, or recommendation claims as automated unless a future approved provider stores measured provider evidence.
- Preserve imported evidence metadata when adding batch imports or provider connectors.
```

- [ ] **Step 4: Update current-state docs**

Update the listed docs so they describe v0.17 as the current snapshot and include this boundary:

```md
v0.17 adds manual measured evidence import for International GEO visibility snapshots. Imported snapshots are user-supplied evidence with `manual_import` provenance and `measured_import` runs. The workflow does not call live AI/search/SERP/indexing providers, store external provider credentials, or verify claims beyond the human-entered evidence.
```

- [ ] **Step 5: Run docs verification**

Run:

```bash
node -e 'JSON.parse(require("fs").readFileSync("package.json","utf8")); console.log("package json ok")'
npm run check
```

Expected: both pass. If sandbox blocks the local HTTP server with `listen EPERM`, rerun `npm run check` with approved non-sandbox permissions.

- [ ] **Step 6: Commit docs**

```bash
git add package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_17_CLOSEOUT.md
git commit -m "docs: close measured visibility evidence import v0.17"
```

---

### Task 8: Final Verification And Push

**Files:**
- No code changes expected.

- [ ] **Step 1: Run final local verification**

Run:

```bash
npm run check
git status --short
```

Expected:

```text
verify-mvp: OK
```

and no uncommitted changes.

If sandbox blocks the local HTTP server with `listen EPERM`, rerun `npm run check` with approved non-sandbox permissions.

- [ ] **Step 2: Push**

Run:

```bash
git push origin main
```

- [ ] **Step 3: Confirm GitHub Actions**

Run:

```bash
gh run list --limit 5
gh run watch <latest-run-id> --exit-status
```

Expected: latest `check` run completes with `success`.
