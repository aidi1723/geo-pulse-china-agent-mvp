# AI Visibility Monitoring v0.13 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the International GEO AI visibility measurement foundation with prompt sets, provider readiness, measurement runs, prompt snapshots, and explicit `measured` / `simulated` / `unavailable` data labels.

**Architecture:** Keep v0.13 local and deterministic. Add the visibility domain to `mock-data.mjs`, expose it through narrow International GEO API routes in `server.mjs`, and render compact tables in `prototype/src/pages/international.js` using existing dense admin components. Default runs create `unavailable` snapshots with diagnostics and never call external AI/search providers.

**Tech Stack:** Node.js ES modules, zero-dependency local state, server routes in `server.mjs`, static HTML renderer, `verify-mvp.mjs` regression gate.

---

## File Structure

- Modify `verify-mvp.mjs`: add red tests for visibility state, prompt-set creation, unavailable measurement runs, measured snapshot validation, UI labels, and HTTP RBAC.
- Modify `mock-data.mjs`: add International GEO visibility state, engine constants, prompt-set actions, measurement run action, snapshot validation, state hydration, and read models.
- Modify `server.mjs`: import new actions and expose `/international-geo/visibility` routes with existing auth/RBAC behavior.
- Modify `prototype/src/pages/international.js`: render `AI 可见度测量`, `引擎数据源状态`, `Prompt 测量快照`, and `测量运行记录`.
- Modify docs: `package.json`, `CHANGELOG.md`, `README.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PHASE_2_ROADMAP.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/OPEN_SOURCE_RELEASE.md`, `docs/README.md`, `docs/MAINTENANCE.md`.
- Create `docs/STAGE_V0_13_CLOSEOUT.md`.

## Task 1: Red Tests For Visibility Measurement Contracts

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add imports for the new actions**

Add these imports to the existing `mock-data.mjs` import list:

```js
  createInternationalGeoVisibilityPromptSetAction,
  getInternationalGeoVisibilityState,
  runInternationalGeoVisibilityMeasurementAction,
  validateInternationalGeoVisibilitySnapshot,
```

- [ ] **Step 2: Add local contract assertions**

Add this block near the current International GEO data-action checks, after the v0.12 site audit assertions:

```js
  const visibilityState = getInternationalGeoVisibilityState();
  assert.ok(
    visibilityState.prompt_sets.length >= 1,
    "International GEO visibility should expose prompt sets"
  );
  assert.ok(
    visibilityState.provider_readiness.every((item) =>
      ["measured", "simulated", "unavailable"].includes(item.data_status)
    ),
    "Provider readiness rows should expose stable data_status values"
  );
  assert.ok(
    visibilityState.summary.unavailable_snapshots >= 0,
    "International GEO visibility summary should expose unavailable counts"
  );
```

- [ ] **Step 3: Add prompt-set creation assertions**

Add this block immediately after the visibility state assertions:

```js
  const promptSet = createInternationalGeoVisibilityPromptSetAction({
    prompt: "best GEO platform for B2B exporters",
    market: "US",
    language: "en-US",
    buyer_intent: "comparison",
    product_name: "GEO Pulse",
    target_url: "https://example.com",
    target_brand: "GEO Pulse",
    competitors: ["Profound", "AthenaHQ"],
    engines: ["chatgpt_search", "perplexity"]
  });
  assert.equal(promptSet.prompt, "best GEO platform for B2B exporters");
  assert.deepEqual(promptSet.engines, ["chatgpt_search", "perplexity"]);
  assert.throws(
    () =>
      createInternationalGeoVisibilityPromptSetAction({
        prompt: "invalid engine prompt",
        engines: ["unknown_engine"]
      }),
    /VALIDATION_ERROR/,
    "Unsupported AI visibility engine ids should be rejected"
  );
```

- [ ] **Step 4: Add unavailable-run assertions**

Add this block after prompt-set assertions:

```js
  const visibilityRun = runInternationalGeoVisibilityMeasurementAction({ trigger: "manual" });
  assert.equal(
    visibilityRun.run.data_source_type,
    "unavailable",
    "Default International GEO visibility run should not claim measured data"
  );
  assert.ok(
    visibilityRun.snapshots_created >= getInternationalGeoVisibilityState().prompt_sets.length,
    "Visibility measurement should create snapshots for configured prompt sets"
  );
  assert.ok(
    visibilityRun.snapshots.every((item) => item.data_status === "unavailable"),
    "Default visibility snapshots should be unavailable until a provider is configured"
  );
  assert.ok(
    visibilityRun.snapshots.every((item) => item.brand_mentioned === null && item.recommendation_rank === null),
    "Unavailable snapshots should not invent brand mentions or ranks"
  );
```

- [ ] **Step 5: Add measured-snapshot validation assertion**

Add this block after unavailable-run assertions:

```js
  assert.throws(
    () =>
      validateInternationalGeoVisibilitySnapshot({
        data_status: "measured",
        engine_id: "perplexity",
        captured_at: "2026-07-07T00:00:00.000Z"
      }),
    /MEASURED_SOURCE_REQUIRED/,
    "Measured snapshots should require provider and source evidence"
  );
```

- [ ] **Step 6: Add UI assertions**

In `runUiChecks()`, after the International GEO page render assertions, add:

```js
  assert.match(siteAuditHtml, /AI 可见度测量/, "International GEO should render AI visibility measurement panel");
  assert.match(siteAuditHtml, /引擎数据源状态/, "International GEO should render engine provider readiness");
  assert.match(siteAuditHtml, /Prompt 测量快照/, "International GEO should render prompt measurement snapshots");
  assert.match(siteAuditHtml, /测量运行记录/, "International GEO should render visibility run history");
  assert.match(siteAuditHtml, /unavailable|simulated|measured/, "International GEO should expose data source labels");
```

- [ ] **Step 7: Add HTTP assertions**

In `runHttpApiChecks()`, after International GEO site audit HTTP assertions, add:

```js
    const visibilityRead = await httpRequest(port, "/api/v1/international-geo/visibility", {
      headers: { Cookie: viewerLogin.cookie }
    });
    assert.equal(visibilityRead.status, 200, "Viewer should read International GEO visibility state");
    assert.ok(
      visibilityRead.body?.data?.provider_readiness?.length >= 1,
      "Visibility HTTP read should include provider readiness"
    );

    const viewerPromptWrite = await httpRequest(port, "/api/v1/international-geo/visibility/prompt-sets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: viewerLogin.cookie
      },
      body: JSON.stringify({ prompt: "viewer should not write prompts" })
    });
    assert.equal(viewerPromptWrite.status, 403, "Viewer should not create visibility prompt sets");

    const ownerPromptWrite = await httpRequest(port, "/api/v1/international-geo/visibility/prompt-sets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        prompt: "best AI visibility platform",
        engines: ["chatgpt_search", "perplexity"]
      })
    });
    assert.equal(ownerPromptWrite.status, 201, "Owner should create visibility prompt sets");

    const ownerVisibilityRun = await httpRequest(port, "/api/v1/international-geo/visibility/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({ trigger: "manual" })
    });
    assert.equal(ownerVisibilityRun.status, 200, "Owner should run visibility measurement");
    assert.equal(
      ownerVisibilityRun.body?.data?.run?.data_source_type,
      "unavailable",
      "HTTP visibility run should not claim measured data without a provider"
    );
```

- [ ] **Step 8: Run red test**

Run: `npm run check`

Expected: FAIL because the imported functions and UI panels do not exist yet.

## Task 2: International GEO Visibility Data Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add engine and data-status constants**

Add near the `internationalGeoState` helpers:

```js
const INTERNATIONAL_GEO_VISIBILITY_ENGINES = [
  { id: "chatgpt_search", label: "ChatGPT Search" },
  { id: "perplexity", label: "Perplexity" },
  { id: "google_ai_overviews", label: "Google AI Overviews" },
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
  { id: "copilot_bing", label: "Copilot / Bing" }
];

const INTERNATIONAL_GEO_VISIBILITY_DATA_STATUSES = new Set(["measured", "simulated", "unavailable"]);

function internationalGeoEngineLabel(engineId) {
  return INTERNATIONAL_GEO_VISIBILITY_ENGINES.find((item) => item.id === engineId)?.label || engineId;
}
```

- [ ] **Step 2: Extend state shape**

Add these properties to `internationalGeoState`:

```js
  visibility_prompt_sets: [],
  visibility_provider_readiness: [],
  visibility_snapshots: [],
  visibility_runs: [],
```

Extend `ensureInternationalGeoStateShape()`:

```js
  if (!Array.isArray(internationalGeoState.visibility_prompt_sets)) {
    internationalGeoState.visibility_prompt_sets = defaultInternationalGeoVisibilityPromptSets();
  }
  if (!Array.isArray(internationalGeoState.visibility_provider_readiness)) {
    internationalGeoState.visibility_provider_readiness = defaultInternationalGeoProviderReadiness();
  }
  if (!Array.isArray(internationalGeoState.visibility_snapshots)) {
    internationalGeoState.visibility_snapshots = [];
  }
  if (!Array.isArray(internationalGeoState.visibility_runs)) {
    internationalGeoState.visibility_runs = [];
  }
```

- [ ] **Step 3: Add default prompt/readiness helpers**

Add:

```js
function defaultInternationalGeoVisibilityPromptSets() {
  const input = internationalGeoState.input || {};
  return [
    {
      id: "aiprompt_seed_comparison",
      prompt: input.primary_query || "best GEO platform for AI search",
      market: input.target_market || "Global",
      language: input.target_language || "en",
      buyer_intent: "comparison",
      product_name: input.product_name || "GEO Pulse",
      target_url: input.website_url || workspaceInput.website_url,
      target_brand: input.product_name || "GEO Pulse",
      competitors: normalizeStringArray(input.competitors || workspaceInput.competitors),
      engines: INTERNATIONAL_GEO_VISIBILITY_ENGINES.map((item) => item.id),
      status: "active",
      created_at: "2026-07-07T00:00:00.000Z"
    }
  ];
}

function defaultInternationalGeoProviderReadiness() {
  return INTERNATIONAL_GEO_VISIBILITY_ENGINES.map((engine) => ({
    engine_id: engine.id,
    engine_label: engine.label,
    data_status: "unavailable",
    provider_id: "",
    connector_id: "",
    permission_status: "not_configured",
    last_measured_at: null,
    diagnostics: [`No approved visibility provider configured for ${engine.label}.`]
  }));
}
```

- [ ] **Step 4: Add prompt-set validation and creation**

Add:

```js
function normalizeInternationalGeoVisibilityEngines(engines) {
  const requested = Array.isArray(engines) && engines.length ? engines : INTERNATIONAL_GEO_VISIBILITY_ENGINES.map((item) => item.id);
  const allowed = new Set(INTERNATIONAL_GEO_VISIBILITY_ENGINES.map((item) => item.id));
  const normalized = requested.map((item) => String(item || "").trim()).filter(Boolean);
  const invalid = normalized.filter((item) => !allowed.has(item));
  if (invalid.length) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    error.field_errors = [{ field: "engines", message: `Unsupported engines: ${invalid.join(", ")}` }];
    throw error;
  }
  return [...new Set(normalized)];
}

export function createInternationalGeoVisibilityPromptSetAction(payload = {}) {
  ensureInternationalGeoStateShape();
  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    error.field_errors = [{ field: "prompt", message: "Prompt is required" }];
    throw error;
  }
  const input = internationalGeoState.input || {};
  const promptSet = {
    id: uniqueId("aiprompt"),
    prompt,
    market: String(payload.market || input.target_market || "Global").trim(),
    language: String(payload.language || input.target_language || "en").trim(),
    buyer_intent: String(payload.buyer_intent || "comparison").trim(),
    product_name: String(payload.product_name || input.product_name || workspaceInput.product_name || "").trim(),
    target_url: String(payload.target_url || input.website_url || workspaceInput.website_url || "").trim(),
    target_brand: String(payload.target_brand || payload.product_name || input.product_name || workspaceInput.product_name || "").trim(),
    competitors: normalizeStringArray(payload.competitors || input.competitors || []),
    engines: normalizeInternationalGeoVisibilityEngines(payload.engines),
    status: "active",
    created_at: nowIso()
  };
  internationalGeoState.visibility_prompt_sets.unshift(promptSet);
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.visibility_prompt.create", "international_geo_visibility_prompt", promptSet.id, {
    prompt: promptSet.prompt,
    engine_count: promptSet.engines.length
  });
  persistState();
  return deepClone(promptSet);
}
```

- [ ] **Step 5: Add snapshot validation**

Add:

```js
export function validateInternationalGeoVisibilitySnapshot(snapshot = {}) {
  const dataStatus = String(snapshot.data_status || "").trim();
  if (!INTERNATIONAL_GEO_VISIBILITY_DATA_STATUSES.has(dataStatus)) {
    const error = new Error("INVALID_DATA_STATUS");
    error.code = "INVALID_DATA_STATUS";
    throw error;
  }
  if (dataStatus === "measured" && (!snapshot.provider_id || !snapshot.source_type || !snapshot.captured_at)) {
    const error = new Error("MEASURED_SOURCE_REQUIRED");
    error.code = "MEASURED_SOURCE_REQUIRED";
    throw error;
  }
  return true;
}
```

- [ ] **Step 6: Add unavailable measurement run action**

Add:

```js
function buildUnavailableVisibilitySnapshot(promptSet, engineId, run) {
  const snapshot = {
    id: uniqueId("aivs"),
    prompt_set_id: promptSet.id,
    run_id: run.id,
    engine_id: engineId,
    engine_label: internationalGeoEngineLabel(engineId),
    data_status: "unavailable",
    source_type: "unavailable",
    source_label: "No provider configured",
    captured_at: run.finished_at,
    brand_mentioned: null,
    owned_citation_count: null,
    citation_urls: [],
    recommendation_rank: null,
    competitors_mentioned: [],
    confidence: "low",
    diagnostics: ["No measured provider is configured. Snapshot records unavailable state only."]
  };
  validateInternationalGeoVisibilitySnapshot(snapshot);
  return snapshot;
}

export function runInternationalGeoVisibilityMeasurementAction(payload = {}) {
  ensureInternationalGeoStateShape();
  const startedAt = nowIso();
  const promptSets = internationalGeoState.visibility_prompt_sets.filter((item) => item.status !== "disabled");
  const engineIds = [...new Set(promptSets.flatMap((item) => item.engines || []))];
  const run = {
    id: uniqueId("aivrun"),
    trigger: payload.trigger || "manual",
    status: "completed_with_unavailable",
    data_source_type: "unavailable",
    provider_id: "",
    prompt_count: promptSets.length,
    engine_count: engineIds.length,
    snapshots_created: 0,
    started_at: startedAt,
    finished_at: nowIso(),
    steps: []
  };
  const snapshots = promptSets.flatMap((promptSet) =>
    (promptSet.engines || []).map((engineId) => buildUnavailableVisibilitySnapshot(promptSet, engineId, run))
  );
  run.snapshots_created = snapshots.length;
  run.steps = [
    {
      id: uniqueId("aivstep"),
      run_id: run.id,
      sequence: 1,
      step_type: "provider_readiness",
      status: "warning",
      status_label: "No provider configured",
      output_preview: {
        unavailable_engines: internationalGeoState.visibility_provider_readiness.filter((item) => item.data_status === "unavailable").length
      }
    },
    {
      id: uniqueId("aivstep"),
      run_id: run.id,
      sequence: 2,
      step_type: "write_snapshots",
      status: "succeeded",
      status_label: "Unavailable snapshots recorded",
      output_preview: {
        snapshots_created: snapshots.length
      }
    }
  ];
  internationalGeoState.visibility_snapshots.unshift(...snapshots);
  internationalGeoState.visibility_runs.unshift(run);
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.visibility.run", "international_geo_visibility_run", run.id, {
    trigger: run.trigger,
    data_source_type: run.data_source_type,
    snapshots_created: run.snapshots_created
  });
  persistState();
  return deepClone({ run, snapshots_created: snapshots.length, snapshots });
}
```

- [ ] **Step 7: Add read model**

Add:

```js
function internationalGeoVisibilitySummary() {
  const snapshots = internationalGeoState.visibility_snapshots || [];
  const countByStatus = (status) => snapshots.filter((item) => item.data_status === status).length;
  return {
    prompt_count: internationalGeoState.visibility_prompt_sets.length,
    engine_count: INTERNATIONAL_GEO_VISIBILITY_ENGINES.length,
    measured_snapshots: countByStatus("measured"),
    simulated_snapshots: countByStatus("simulated"),
    unavailable_snapshots: countByStatus("unavailable"),
    latest_run_status: internationalGeoState.visibility_runs[0]?.status || "not_run"
  };
}

export function getInternationalGeoVisibilityState() {
  ensureInternationalGeoStateShape();
  return deepClone({
    summary: internationalGeoVisibilitySummary(),
    prompt_sets: internationalGeoState.visibility_prompt_sets,
    provider_readiness: internationalGeoState.visibility_provider_readiness,
    snapshots: internationalGeoState.visibility_snapshots,
    runs: internationalGeoState.visibility_runs,
    latest_run: internationalGeoState.visibility_runs[0] || null
  });
}
```

Also update `getInternationalGeoState()` to include:

```js
  const state = deepClone(internationalGeoState);
  state.visibility = getInternationalGeoVisibilityState();
  return state;
```

- [ ] **Step 8: Run green test for data model**

Run: `npm run check`

Expected: local data assertions pass; server/UI assertions may still fail until Tasks 3 and 4.

## Task 3: HTTP Routes For Visibility State And Runs

**Files:**
- Modify: `server.mjs`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Import new actions in server**

Add to the destructured `mock-data.mjs` import:

```js
  createInternationalGeoVisibilityPromptSetAction,
  getInternationalGeoVisibilityState,
  runInternationalGeoVisibilityMeasurementAction,
```

- [ ] **Step 2: Add read and list routes**

Add before the existing `GET /international-geo/site-audits` route:

```js
  if (req.method === "GET" && pathname === "/international-geo/visibility") {
    sendJson(res, 200, ok(getInternationalGeoVisibilityState()));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/visibility/runs") {
    sendJson(res, 200, ok({ items: getInternationalGeoVisibilityState().runs }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/visibility/snapshots") {
    sendJson(res, 200, ok({ items: getInternationalGeoVisibilityState().snapshots }));
    return;
  }
```

- [ ] **Step 3: Add prompt-set mutation route**

Add:

```js
  if (req.method === "POST" && pathname === "/international-geo/visibility/prompt-sets") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(createInternationalGeoVisibilityPromptSetAction(body)));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        sendJson(res, 400, error("VALIDATION_ERROR", err.field_errors?.[0]?.message || "Invalid visibility prompt set").body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 4: Add run route**

Add:

```js
  if (req.method === "POST" && pathname === "/international-geo/visibility/run") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 200, ok(runInternationalGeoVisibilityMeasurementAction(body || {})));
    return;
  }
```

- [ ] **Step 5: Run HTTP checks**

Run: `npm run check`

Expected: HTTP assertions pass once server imports and routes are complete.

## Task 4: International GEO UI Panels

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add visibility label helpers**

Add near the existing scoring label helpers:

```js
function dataStatusLabel(value) {
  return (
    {
      measured: "measured",
      simulated: "simulated",
      unavailable: "unavailable"
    }[value] || "unavailable"
  );
}

function nullableMetric(value) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}
```

- [ ] **Step 2: Render measurement summary**

Add:

```js
function renderVisibilityMeasurementPanel(visibility = {}) {
  const summary = visibility.summary || {};
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">AI 可见度测量</h3>
          <div class="panel-note">Prompt measurement foundation with explicit measured, simulated and unavailable labels.</div>
        </div>
        <div class="actions-row">
          <button class="ghost-btn" data-action="international-visibility-run">运行测量</button>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-row"><span>Prompt</span><strong>${escapeHtml(nullableMetric(summary.prompt_count))}</strong></div>
        <div class="info-row"><span>Engines</span><strong>${escapeHtml(nullableMetric(summary.engine_count))}</strong></div>
        <div class="info-row"><span>measured</span><strong>${escapeHtml(nullableMetric(summary.measured_snapshots))}</strong></div>
        <div class="info-row"><span>simulated</span><strong>${escapeHtml(nullableMetric(summary.simulated_snapshots))}</strong></div>
        <div class="info-row"><span>unavailable</span><strong>${escapeHtml(nullableMetric(summary.unavailable_snapshots))}</strong></div>
        <div class="info-row"><span>Latest run</span><strong>${escapeHtml(summary.latest_run_status || "not_run")}</strong></div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 3: Render provider readiness table**

Add:

```js
function renderProviderReadinessTable(readiness = []) {
  const rows = readiness.length
    ? readiness.map(
        (item) => `
          <tr>
            <td><div class="cell-title">${escapeHtml(item.engine_label || item.engine_id)}</div><div class="cell-sub">${escapeHtml(item.engine_id || "-")}</div></td>
            <td>${statusMarkup(dataStatusLabel(item.data_status))}</td>
            <td><div class="cell-title">${escapeHtml(item.provider_id || "-")}</div><div class="cell-sub">${escapeHtml(item.connector_id || "-")}</div></td>
            <td>${escapeHtml(item.permission_status || "-")}</td>
            <td><div class="cell-title">${escapeHtml(item.last_measured_at || "-")}</div><div class="cell-sub">${escapeHtml((item.diagnostics || [])[0] || "-")}</div></td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无引擎数据源状态。</div></td></tr>`];
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">引擎数据源状态</h3>
          <div class="panel-note">Only configured providers may create measured snapshots; missing providers stay unavailable.</div>
        </div>
      </div>
      ${tableMarkup(["Engine", "Data", "Provider", "Permission", "Diagnostic"], rows)}
    </section>
  `;
}
```

- [ ] **Step 4: Render prompt snapshots and runs**

Add:

```js
function renderPromptSnapshotTable(snapshots = []) {
  const rows = snapshots.length
    ? snapshots.slice(0, 12).map(
        (item) => `
          <tr>
            <td><div class="cell-title">${escapeHtml(item.prompt_set_id || "-")}</div><div class="cell-sub">${escapeHtml(item.captured_at || "-")}</div></td>
            <td>${escapeHtml(item.engine_label || item.engine_id || "-")}</td>
            <td>${statusMarkup(dataStatusLabel(item.data_status))}</td>
            <td>${escapeHtml(nullableMetric(item.brand_mentioned))}</td>
            <td>${escapeHtml(nullableMetric(item.owned_citation_count))}</td>
            <td>${escapeHtml(nullableMetric(item.recommendation_rank))}</td>
            <td><div class="cell-title">${escapeHtml(item.confidence || "-")}</div><div class="cell-sub">${escapeHtml((item.diagnostics || [])[0] || "-")}</div></td>
          </tr>
        `
      )
    : [`<tr><td colspan="7"><div class="empty-state">暂无 Prompt 测量快照。</div></td></tr>`];
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">Prompt 测量快照</h3>
          <div class="panel-note">Unavailable rows record measurement gaps without inventing mentions, citations or ranks.</div>
        </div>
      </div>
      ${tableMarkup(["Prompt", "Engine", "Data", "Brand", "Citations", "Rank", "Confidence"], rows)}
    </section>
  `;
}

function renderVisibilityRunTable(runs = []) {
  const rows = runs.length
    ? runs.slice(0, 8).map(
        (item) => `
          <tr>
            <td><div class="cell-title">${escapeHtml(item.trigger || "-")}</div><div class="cell-sub">${escapeHtml(item.id || "-")}</div></td>
            <td>${statusMarkup(item.status || "-")}</td>
            <td>${escapeHtml(item.data_source_type || "-")}</td>
            <td>${escapeHtml(nullableMetric(item.snapshots_created))}</td>
            <td><div class="cell-title">${escapeHtml(item.started_at || "-")}</div><div class="cell-sub">${escapeHtml(item.finished_at || "-")}</div></td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无测量运行记录。</div></td></tr>`];
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">测量运行记录</h3>
          <div class="panel-note">Run history records provider readiness and snapshot writes.</div>
        </div>
      </div>
      ${tableMarkup(["Trigger", "Status", "Data source", "Snapshots", "Time"], rows)}
    </section>
  `;
}
```

- [ ] **Step 5: Insert panels in page**

In `renderInternationalGeo()`, define:

```js
  const visibility = data.visibility || {};
```

Render after `Global Filters` or before the existing seed engine tables:

```js
    ${renderVisibilityMeasurementPanel(visibility)}
    ${renderProviderReadinessTable(visibility.provider_readiness || [])}
    ${renderPromptSnapshotTable(visibility.snapshots || [])}
    ${renderVisibilityRunTable(visibility.runs || [])}
```

- [ ] **Step 6: Run UI checks**

Run: `npm run check`

Expected: UI assertions pass and legacy page rendering remains safe.

## Task 5: Documentation And Stage Closeout

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
- Create: `docs/STAGE_V0_13_CLOSEOUT.md`

- [ ] **Step 1: Bump version and changelog**

Set `package.json` version to `0.13.0`.

Add a `0.13.0` changelog entry:

```md
## 0.13.0 - 2026-07-07

AI visibility measurement foundation for International GEO.

### Added

- International GEO prompt sets for AI visibility monitoring.
- Provider readiness rows for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot / Bing.
- Measurement runs and prompt snapshots with explicit `measured`, `simulated`, and `unavailable` labels.
- Default unavailable snapshots when no approved provider is configured.
- International GEO UI panels for measurement summary, engine data-source status, prompt snapshots, and run history.

### Boundaries

- v0.13 does not query real AI engines, SERP providers, or browser-based AI products.
- v0.13 does not claim real engine inclusion or recommendation rank unless future approved providers produce validated `measured` snapshots.

### Verification

- `npm run check`
```

- [ ] **Step 2: Update API and architecture docs**

Document:

- `/international-geo/visibility` routes,
- prompt-set create rules,
- data-status labels,
- default unavailable run behavior,
- no raw provider credentials in responses.

- [ ] **Step 3: Update roadmap docs**

Mark v0.13 baseline complete once implemented and move next slice to evidence-driven content/asset production from prompt gaps.

- [ ] **Step 4: Create closeout**

Create `docs/STAGE_V0_13_CLOSEOUT.md` with:

- shipped scope,
- API/UI surface,
- data-source boundary,
- verification commands,
- next recommended stage.

- [ ] **Step 5: Run static SEO docs check**

Run: `node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .`

Expected: 0 errors and 0 warnings.

## Task 6: Final Verification, Commit, Push

**Files:**
- All changed files.

- [ ] **Step 1: Full verification**

Run: `npm run check`

Expected: `verify-mvp: OK`.

- [ ] **Step 2: Diff review**

Run: `git diff --check` and `git diff --stat`

Expected: no whitespace errors; only v0.13 data, route, UI, tests, and docs files changed.

- [ ] **Step 3: Commit**

Run:

```bash
git add verify-mvp.mjs mock-data.mjs server.mjs prototype/src/pages/international.js package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_13_CLOSEOUT.md docs/superpowers/plans/2026-07-07-ai-visibility-monitoring-v0-13.md
git commit -m "feat: add international geo ai visibility measurement foundation"
```

- [ ] **Step 4: Push and remote check**

Run:

```bash
git push
gh run list --limit 3
```

Expected: latest GitHub Actions `check` starts for the pushed commit. Use `gh run watch <run-id> --exit-status` and expect success.

## Rollback And Safety Notes

- Starting checkpoint: clean `main` at `827f63f docs: design ai visibility monitoring v0.13`.
- Rollback trigger: `npm run check` failure that cannot be fixed inside v0.13 scope, API responses leaking raw credentials, or UI presenting unavailable/simulated data as measured.
- Recovery: revert the v0.13 implementation commit while keeping the v0.13 design spec if the implementation needs to be replanned.
- Non-reversible risks: none expected; v0.13 uses local mock-state structures and no external provider calls.

## Self-Review

- Spec coverage: tasks cover prompt sets, provider readiness, runs, snapshots, labels, API routes, UI panels, validation, error handling, docs, and verification.
- Completeness scan: no marker text, incomplete sections, or missing implementation targets remain.
- Type consistency: field names match the v0.13 design: `data_status`, `provider_readiness`, `prompt_sets`, `snapshots`, `runs`, `measured`, `simulated`, and `unavailable`.
- Safe-Agent routing: task pack selected method-only execution skills; plan records rollback checkpoint, browser/network boundary, file scope, and verification expectations.
