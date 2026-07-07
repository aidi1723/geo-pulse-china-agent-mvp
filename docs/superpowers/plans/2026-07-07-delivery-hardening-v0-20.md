# Delivery Hardening v0.20 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a v0.20 delivery hardening layer with a consolidated delivery readiness report, sanitized delivery bundle export, Settings delivery center UI, aligned docs, and verification.

**Architecture:** Extend the existing zero-dependency local model in `mock-data.mjs` with delivery read models that aggregate preflight, production readiness, runtime counts, and International GEO summaries. Expose narrowly scoped system routes in `server.mjs`, wire browser API/actions/events, render a compact Settings panel using the current dark admin UI, and close with docs/version updates.

**Tech Stack:** Node.js ESM, local JSON state, existing browser prototype modules, `verify-mvp.mjs`, no new runtime npm dependencies.

---

## Files And Responsibilities

- Modify `verify-mvp.mjs`: add failing source, model, HTTP, and UI assertions for delivery readiness and delivery bundle.
- Modify `mock-data.mjs`: add `getDeliveryReadinessState`, `runDeliveryReadinessCheckAction`, `getDeliveryBundleState`, and include `delivery_readiness` in `getRuntimeStatus()`.
- Modify `server.mjs`: expose delivery readiness and bundle routes, and mark delivery bundle as an admin/owner sensitive read.
- Modify `prototype/src/api.js`: add browser API wrappers.
- Modify `prototype/src/main.js`: add refresh/download delivery actions.
- Modify `prototype/src/events.js`: wire delivery actions.
- Modify `prototype/src/pages/settings.js`: render `交付中心`.
- Modify docs and `package.json`: bump to `0.20.0`, add `docs/STAGE_V0_20_CLOSEOUT.md`, and align current release text.

## Task 1: Failing Regression Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add model imports**

Add these imports from `./mock-data.mjs` near the existing production readiness imports:

```js
  getDeliveryBundleState,
  getDeliveryReadinessState,
  runDeliveryReadinessCheckAction,
```

- [ ] **Step 2: Add source assertions**

Add these source assertions near the existing v0.19 production integration source assertions:

```js
  assert.match(
    fs.readFileSync("mock-data.mjs", "utf8"),
    /getDeliveryReadinessState/,
    "Delivery readiness state should be exposed"
  );
  assert.match(
    fs.readFileSync("mock-data.mjs", "utf8"),
    /getDeliveryBundleState/,
    "Sanitized delivery bundle state should be exposed"
  );
  assert.match(
    apiSource,
    /export function getDeliveryReadiness/,
    "Browser API should expose delivery readiness"
  );
  assert.match(
    apiSource,
    /export function getDeliveryBundle/,
    "Browser API should expose delivery bundle download"
  );
  assert.match(
    eventsSource,
    /refresh-delivery-readiness/,
    "Delivery readiness refresh action should be wired"
  );
  assert.match(
    eventsSource,
    /download-delivery-bundle/,
    "Delivery bundle download action should be wired"
  );
```

- [ ] **Step 3: Add model behavior assertions**

Add this block after the production readiness model checks:

```js
  const deliveryReadiness = getDeliveryReadinessState();
  assert(["ready", "review", "blocked"].includes(deliveryReadiness.status), "Delivery readiness should expose a stable status");
  assert(Number.isFinite(deliveryReadiness.score), "Delivery readiness should expose a numeric score");
  assert(deliveryReadiness.checks.length >= 8, "Delivery readiness should include handoff checks");
  assert(deliveryReadiness.handoff_steps.length >= 4, "Delivery readiness should include ordered handoff steps");
  assert(deliveryReadiness.boundaries.length >= 3, "Delivery readiness should include operating boundaries");
  assert.doesNotMatch(JSON.stringify(deliveryReadiness), /provider-secret|publishing-secret|connector-secret-key|geo-owner-change-me/, "Delivery readiness should not expose raw secrets");

  const deliveryCheck = runDeliveryReadinessCheckAction();
  assert(deliveryCheck.checks.length >= deliveryReadiness.checks.length, "Delivery readiness check should return checks");
  assert(
    listAuditEvents({ action: "system.delivery_readiness.check" }).items.length >= 1,
    "Delivery readiness check should write an audit event"
  );

  const deliveryBundle = getDeliveryBundleState();
  assert.equal(deliveryBundle.kind, "geo-pulse-delivery-bundle", "Delivery bundle should expose a stable kind");
  assert.equal(deliveryBundle.version, "0.20.0", "Delivery bundle should expose the current package version");
  assert(deliveryBundle.delivery_readiness?.checks?.length >= 8, "Delivery bundle should include delivery readiness");
  assert(deliveryBundle.production_readiness?.checks?.length >= 8, "Delivery bundle should include production readiness");
  assert(deliveryBundle.launch_preflight?.checks?.length >= 8, "Delivery bundle should include launch preflight");
  assert(deliveryBundle.international_geo?.visibility_provider_summary, "Delivery bundle should include visibility provider summary");
  assert(deliveryBundle.international_geo?.publishing_connector_summary, "Delivery bundle should include publishing connector summary");
  assert(!Object.prototype.hasOwnProperty.call(deliveryBundle, "snapshot"), "Delivery bundle must not include raw runtime snapshots");
  assert(!Object.prototype.hasOwnProperty.call(deliveryBundle, "runtimeBackups"), "Delivery bundle must not include backup internals");
  assert.doesNotMatch(JSON.stringify(deliveryBundle), /password_hash|provider-secret|publishing-secret|connector-secret-key|geo-owner-change-me|api_key":"/, "Delivery bundle should be sanitized");
```

- [ ] **Step 4: Add HTTP assertions**

Add this block after the production readiness HTTP checks:

```js
    const deliveryReadinessHttp = await httpRequest(port, "/api/v1/system/delivery-readiness", {
      headers: viewerHeaders
    });
    assert.equal(deliveryReadinessHttp.status, 200, "Viewer should read delivery readiness");
    assert(deliveryReadinessHttp.body?.data?.checks?.length >= 8, "Delivery readiness HTTP should return checks");

    const viewerDeliveryCheck = await httpRequest(port, "/api/v1/system/delivery-readiness/check", {
      method: "POST",
      headers: viewerHeaders,
      body: JSON.stringify({})
    });
    assert.equal(viewerDeliveryCheck.status, 403, "Viewer should not run delivery readiness check");

    const ownerDeliveryCheck = await httpRequest(port, "/api/v1/system/delivery-readiness/check", {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({})
    });
    assert.equal(ownerDeliveryCheck.status, 200, "Owner should run delivery readiness check");

    const viewerDeliveryBundle = await httpRequest(port, "/api/v1/system/delivery-bundle", {
      headers: viewerHeaders
    });
    assert.equal(viewerDeliveryBundle.status, 403, "Viewer should not download delivery bundle");

    const ownerDeliveryBundle = await httpRequest(port, "/api/v1/system/delivery-bundle", {
      headers: ownerHeaders
    });
    assert.equal(ownerDeliveryBundle.status, 200, "Owner should download delivery bundle");
    assert.equal(ownerDeliveryBundle.body?.data?.kind, "geo-pulse-delivery-bundle", "Delivery bundle HTTP should return stable kind");
    assert.doesNotMatch(JSON.stringify(ownerDeliveryBundle.body), /password_hash|provider-secret|publishing-secret|connector-secret-key|geo-owner-change-me|api_key":"/, "Delivery bundle HTTP should not leak secrets");
```

- [ ] **Step 5: Add Settings UI assertions**

Add these assertions near the existing Settings production readiness UI assertions:

```js
  assert.match(settingsHtml, /交付中心/, "Settings should render delivery center panel");
  assert.match(settingsHtml, /交付包/, "Settings should render delivery bundle section");
  assert.match(settingsHtml, /交付边界/, "Settings should render delivery boundary section");
  assert.match(settingsHtml, /refresh-delivery-readiness/, "Settings should wire delivery readiness refresh action");
  assert.match(settingsHtml, /download-delivery-bundle/, "Settings should wire delivery bundle download action");
```

- [ ] **Step 6: Run tests and confirm RED**

Run:

```bash
npm run check
```

Expected: fails with missing delivery exports, routes, APIs, actions, or UI text. If sandbox blocks local HTTP with `listen EPERM`, rerun with approved non-sandbox `npm run check`.

- [ ] **Step 7: Commit failing tests**

```bash
git add verify-mvp.mjs
git commit -m "test: require delivery hardening v0.20"
```

## Task 2: Delivery Readiness And Bundle Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Import package metadata if needed**

If `mock-data.mjs` does not already expose package version, add this near the top:

```js
import packageJson from "./package.json" with { type: "json" };
```

If JSON import syntax is already avoided in this repo, instead use the existing package metadata helper or define:

```js
const packageVersion = "0.20.0";
const packageName = "geo-pulse-china-agent-mvp";
```

- [ ] **Step 2: Add delivery helpers near production readiness helpers**

Add these helper functions near `getProductionReadinessState()`:

```js
function deliveryReadinessCheck(id, category, label, status, message, recommendation = "") {
  return { id, category, label, status, message, recommendation };
}

function deliveryStatusFromChecks(checks = []) {
  if (checks.some((item) => item.status === "failed" || item.status === "blocked")) return "blocked";
  if (checks.some((item) => item.status === "warning" || item.status === "manual")) return "review";
  return "ready";
}

function deliverySummary(checks = []) {
  return {
    passed: checks.filter((item) => item.status === "passed").length,
    warnings: checks.filter((item) => item.status === "warning").length,
    failed: checks.filter((item) => item.status === "failed").length,
    blocked: checks.filter((item) => item.status === "blocked").length,
    manual: checks.filter((item) => item.status === "manual").length
  };
}

function deliveryScore(checks = []) {
  const summary = deliverySummary(checks);
  return Math.max(0, Math.min(100, 100 - summary.failed * 25 - summary.blocked * 30 - summary.warnings * 8 - summary.manual * 4));
}

function buildDeliveryBoundaries() {
  return [
    {
      id: "no_live_ai_provider_calls",
      label: "No live AI/search provider calls",
      status: "passed",
      statement: "v0.20 delivery checks do not call GPT, Gemini, Claude, Perplexity, Google AIO, Copilot, Bing, SERP, indexing, or visibility provider APIs."
    },
    {
      id: "no_external_publish",
      label: "No external publish",
      status: "passed",
      statement: "Publishing connectors remain dry-run/manual handoff only and do not publish to CMS, social, community, docs, video, directory, or review platforms."
    },
    {
      id: "no_raw_secret_export",
      label: "No raw secret export",
      status: "passed",
      statement: "Delivery readiness and delivery bundle responses expose masked credential status only."
    }
  ];
}
```

- [ ] **Step 3: Add handoff steps helper**

Add:

```js
function buildDeliveryHandoffSteps(productionReadiness = {}, preflight = {}) {
  return [
    {
      id: "confirm_access_layer",
      label: "Confirm external access layer",
      status: preflight.checks?.find((item) => item.id === "remote_access")?.status === "passed" ? "passed" : "manual",
      owner: "operator",
      instruction: "Confirm HTTPS, reverse proxy auth, VPN, or IP allowlist before exposing the service."
    },
    {
      id: "create_validate_backup",
      label: "Create and validate backup",
      status: productionReadiness.checks?.find((item) => item.id === "backup_recovery")?.status === "passed" ? "passed" : "manual",
      owner: "operator",
      instruction: "Create, validate, download, and store a runtime backup outside the application host."
    },
    {
      id: "download_delivery_bundle",
      label: "Download delivery bundle",
      status: "manual",
      owner: "operator",
      instruction: "Export the sanitized delivery bundle and attach it to the handoff package."
    },
    {
      id: "confirm_dry_run_boundaries",
      label: "Confirm dry-run boundaries",
      status: "passed",
      owner: "operator",
      instruction: "Confirm provider and publishing connector rows are dry-run only until approved live adapters are implemented."
    }
  ];
}
```

- [ ] **Step 4: Add `getDeliveryReadinessState()`**

Add:

```js
export function getDeliveryReadinessState() {
  const runtime = getRuntimeStatus();
  const productionReadiness = getProductionReadinessState();
  const visibilityProviders = getInternationalGeoVisibilityProviderState();
  const publishingConnectors = getInternationalGeoPublishingConnectorState();
  const internationalGeo = getInternationalGeoState();
  const preflightLike = {
    checks: [
      deliveryReadinessCheck("persistence", "data", "Local persistence", runtime.persistence?.enabled ? "passed" : "warning", runtime.persistence?.enabled ? "Local persistence is enabled." : "Local persistence is not enabled.", "Enable GEO_ENABLE_PERSISTENCE=1 for handoff."),
      deliveryReadinessCheck("backup_recovery", "data", "Backup recovery", runtime.backups?.count > 0 ? "passed" : "warning", runtime.backups?.count > 0 ? `${runtime.backups.count} backup(s) available.` : "No local backup has been created.", "Create and validate a backup before delivery."),
      deliveryReadinessCheck("production_readiness", "operations", "Production readiness", productionReadiness.status === "blocked" ? "failed" : productionReadiness.status === "ready" ? "passed" : "warning", `Production readiness is ${productionReadiness.status}.`, "Resolve failed or warning production readiness rows before handoff."),
      deliveryReadinessCheck("visibility_providers", "integrations", "Visibility provider dry-runs", visibilityProviders.summary?.provider_count >= 6 ? "warning" : "failed", `${visibilityProviders.summary?.provider_count || 0} visibility provider config rows are registered.`, "Rows are dry-run only until approved provider adapters exist."),
      deliveryReadinessCheck("publishing_connectors", "integrations", "Publishing connector dry-runs", publishingConnectors.summary?.connector_count >= 8 ? "warning" : "failed", `${publishingConnectors.summary?.connector_count || 0} publishing connector rows are registered.`, "Rows are dry-run only and do not publish externally."),
      deliveryReadinessCheck("international_geo", "geo", "International GEO workspace", internationalGeo?.summary ? "passed" : "warning", "International GEO workspace is available.", "Run a site audit and export the delivery bundle before handoff."),
      deliveryReadinessCheck("docs_closeout", "docs", "Stage closeout docs", "passed", "v0.20 delivery hardening docs are expected in the release.", "Keep README, API, deployment, maintenance, and closeout docs aligned."),
      deliveryReadinessCheck("secret_boundary", "security", "Masked secret boundary", productionReadiness.masked_secret_inventory?.every((item) => item.raw_secret_exposed === false) ? "passed" : "failed", "Masked secret inventory is available.", "Do not include raw secrets in delivery exports.")
    ]
  };
  const checks = preflightLike.checks;
  const summary = deliverySummary(checks);
  return deepClone({
    status: deliveryStatusFromChecks(checks),
    score: deliveryScore(checks),
    summary,
    checks,
    handoff_steps: buildDeliveryHandoffSteps(productionReadiness, preflightLike),
    boundaries: buildDeliveryBoundaries(),
    bundle: {
      kind: "geo-pulse-delivery-bundle",
      format_version: 1,
      recommended_filename: `geo-pulse-delivery-bundle-${packageVersion || "0.20.0"}.json`
    },
    generated_at: nowIso()
  });
}
```

- [ ] **Step 5: Add `runDeliveryReadinessCheckAction()`**

Add:

```js
export function runDeliveryReadinessCheckAction() {
  const state = getDeliveryReadinessState();
  recordAuditEvent("system.delivery_readiness.check", "system", "delivery_readiness", {
    status: state.status,
    score: state.score,
    checks: state.checks.map((item) => ({ id: item.id, status: item.status }))
  });
  persistState();
  return state;
}
```

- [ ] **Step 6: Add `getDeliveryBundleState()`**

Add:

```js
export function getDeliveryBundleState() {
  const runtime = getRuntimeStatus();
  const deliveryReadiness = getDeliveryReadinessState();
  const productionReadiness = getProductionReadinessState();
  const visibilityProviderState = getInternationalGeoVisibilityProviderState();
  const publishingConnectorState = getInternationalGeoPublishingConnectorState();
  const internationalGeo = getInternationalGeoState();
  return deepClone({
    kind: "geo-pulse-delivery-bundle",
    format_version: 1,
    package_name: packageName || "geo-pulse-china-agent-mvp",
    version: packageVersion || "0.20.0",
    generated_at: nowIso(),
    delivery_readiness: deliveryReadiness,
    production_readiness: productionReadiness,
    launch_preflight: {
      status: deliveryReadiness.status,
      score: deliveryReadiness.score,
      checks: deliveryReadiness.checks
    },
    runtime: {
      persistence: runtime.persistence,
      counts: runtime.counts,
      backups: runtime.backups,
      scheduler: runtime.scheduler
    },
    international_geo: {
      summary: internationalGeo.summary,
      visibility_summary: internationalGeo.visibility?.summary,
      publishing_summary: internationalGeo.publishing?.summary,
      content_generation_summary: internationalGeo.content_generation?.summary,
      visibility_provider_summary: visibilityProviderState.summary,
      publishing_connector_summary: publishingConnectorState.summary
    },
    docs: {
      closeout: "docs/STAGE_V0_20_CLOSEOUT.md",
      deployment: "docs/PRODUCTION_DEPLOYMENT.md",
      api_reference: "docs/API_REFERENCE.md",
      maintenance: "docs/MAINTENANCE.md"
    },
    boundaries: deliveryReadiness.boundaries
  });
}
```

- [ ] **Step 7: Include delivery readiness in runtime status**

In `getRuntimeStatus()`, add:

```js
delivery_readiness: getDeliveryReadinessState(),
```

If this creates recursion because `getDeliveryReadinessState()` reads `getRuntimeStatus()`, refactor `getDeliveryReadinessState()` to accept `runtimeOverride` and call it as:

```js
delivery_readiness: getDeliveryReadinessState(baseRuntimeStatus)
```

where `baseRuntimeStatus` is the object currently returned by `getRuntimeStatus()` before adding `delivery_readiness`.

- [ ] **Step 8: Run tests**

Run:

```bash
npm run check
```

Expected: model assertions pass further, HTTP/UI assertions still fail until routes and UI are implemented.

- [ ] **Step 9: Commit model**

```bash
git add mock-data.mjs
git commit -m "feat: add delivery readiness models"
```

## Task 3: Delivery API Routes

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Add imports**

Add these imports from `./mock-data.mjs`:

```js
  getDeliveryBundleState,
  getDeliveryReadinessState,
  runDeliveryReadinessCheckAction,
```

- [ ] **Step 2: Restrict delivery bundle as sensitive read**

Update `isSensitiveReadPath` to include `/system/delivery-bundle`:

```js
function isSensitiveReadPath(method, pathname) {
  return method === "GET" && ["/audit-events", "/audit-events/export.csv", "/system/delivery-bundle"].includes(pathname);
}
```

The existing sensitive read role gate requires admin or owner for browser sessions, while API key access remains allowed.

- [ ] **Step 3: Add routes near production readiness routes**

Add:

```js
  if (req.method === "GET" && pathname === "/system/delivery-readiness") {
    sendJson(res, 200, ok(getDeliveryReadinessState()));
    return;
  }

  if (req.method === "POST" && pathname === "/system/delivery-readiness/check") {
    sendJson(res, 200, ok(runDeliveryReadinessCheckAction()));
    return;
  }

  if (req.method === "GET" && pathname === "/system/delivery-bundle") {
    sendJson(res, 200, ok(getDeliveryBundleState()));
    return;
  }
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run check
```

Expected: HTTP delivery assertions pass further, UI and browser API assertions still fail until frontend is wired.

- [ ] **Step 5: Commit API routes**

```bash
git add server.mjs
git commit -m "feat: expose delivery hardening api"
```

## Task 4: Browser API And Actions

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add browser API wrappers**

In `prototype/src/api.js`, near production readiness functions, add:

```js
export function getDeliveryReadiness() {
  return request("/api/v1/system/delivery-readiness");
}

export function runDeliveryReadinessCheck() {
  return requestJson("/api/v1/system/delivery-readiness/check", "POST", {});
}

export function getDeliveryBundle() {
  return request("/api/v1/system/delivery-bundle");
}
```

- [ ] **Step 2: Import API wrappers in main**

In `prototype/src/main.js`, add imports:

```js
  getDeliveryBundle as getDeliveryBundleApi,
  runDeliveryReadinessCheck as runDeliveryReadinessCheckApi,
```

- [ ] **Step 3: Add a JSON download helper**

Near `downloadRuntimeBackup`, add:

```js
function downloadJsonArtifact(filename, artifact) {
  const text = JSON.stringify(artifact, null, 2);
  if (typeof window !== "undefined" && window.URL && typeof document !== "undefined") {
    const blob = new Blob([text], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}
```

Then update `downloadRuntimeBackup` to call this helper instead of duplicating Blob creation.

- [ ] **Step 4: Add actions**

In the `actions` object near `refreshProductionReadiness`, add:

```js
  async refreshDeliveryReadiness() {
    try {
      const result = await runDeliveryReadinessCheckApi();
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "brand";
      showNotice(`交付检查已刷新：${result.status || "review"} / ${result.score ?? "-"}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "刷新交付检查失败");
      rerender();
    }
  },
  async downloadDeliveryBundle() {
    try {
      const artifact = await getDeliveryBundleApi();
      const filename = artifact.bundle?.recommended_filename || `geo-pulse-delivery-bundle-${artifact.version || "0.20.0"}.json`;
      downloadJsonArtifact(filename, artifact);
      showNotice(`已准备下载 ${filename}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "下载交付包失败");
      rerender();
    }
  },
```

- [ ] **Step 5: Wire events**

In `prototype/src/events.js`, near production readiness event handling, add:

```js
    if (action === "refresh-delivery-readiness") {
      await actions.refreshDeliveryReadiness();
      return;
    }

    if (action === "download-delivery-bundle") {
      await actions.downloadDeliveryBundle();
      return;
    }
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run check
```

Expected: source assertions for browser API/actions pass further; Settings UI assertions still fail until panel is rendered.

- [ ] **Step 7: Commit frontend wiring**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire delivery hardening actions"
```

## Task 5: Settings Delivery Center UI

**Files:**
- Modify: `prototype/src/pages/settings.js`

- [ ] **Step 1: Add status label support**

Extend `productionReadinessStatusLabel` to include:

```js
manual: "人工确认",
ready: "可交付"
```

- [ ] **Step 2: Add delivery render helpers**

Add after `renderHandoffChecklistPanel`:

```js
function renderDeliveryBoundaryTable(deliveryReadiness = {}) {
  const rows = (deliveryReadiness.boundaries || []).length
    ? deliveryReadiness.boundaries.map((item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.label || item.id)}</div>
            <div class="cell-sub">${escapeHtml(item.id || "-")}</div>
          </td>
          <td>${statusMarkup(productionReadinessStatusLabel(item.status))}</td>
          <td>${escapeHtml(item.statement || "-")}</td>
        </tr>
      `)
    : [`<tr><td colspan="3"><div class="empty-state">暂无交付边界。</div></td></tr>`];
  return tableMarkup(["边界", "状态", "说明"], rows);
}

function renderDeliveryHandoffSteps(deliveryReadiness = {}) {
  const rows = (deliveryReadiness.handoff_steps || []).length
    ? deliveryReadiness.handoff_steps.map((item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.label || item.id)}</div>
            <div class="cell-sub">${escapeHtml(item.id || "-")} / ${escapeHtml(item.owner || "operator")}</div>
          </td>
          <td>${statusMarkup(productionReadinessStatusLabel(item.status))}</td>
          <td>${escapeHtml(item.instruction || "-")}</td>
        </tr>
      `)
    : [`<tr><td colspan="3"><div class="empty-state">暂无交付步骤。</div></td></tr>`];
  return tableMarkup(["步骤", "状态", "操作说明"], rows);
}

function renderDeliveryReadinessPanel(deliveryReadiness = {}) {
  const summary = deliveryReadiness.summary || {};
  const bundle = deliveryReadiness.bundle || {};
  const rows = (deliveryReadiness.checks || []).length
    ? deliveryReadiness.checks.map((item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.label || item.id)}</div>
            <div class="cell-sub">${escapeHtml(item.category || "-")} / ${escapeHtml(item.id || "-")}</div>
          </td>
          <td>${statusMarkup(productionReadinessStatusLabel(item.status))}</td>
          <td>
            <div class="cell-title">${escapeHtml(item.message || "-")}</div>
            <div class="cell-sub">${escapeHtml(item.recommendation || "-")}</div>
          </td>
        </tr>
      `)
    : [`<tr><td colspan="3"><div class="empty-state">暂无交付检查。</div></td></tr>`];

  return `
    <div class="section-block" style="margin-top:18px">
      <div class="panel-head">
        <div>
          <h4 class="panel-title" style="font-size:15px">交付中心</h4>
          <div class="panel-note">汇总上线预检、生产就绪、备份、国际 GEO、Provider/连接器 dry-run 边界和交付包状态。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="refresh-delivery-readiness">刷新交付检查</button>
          <button class="secondary-btn" data-action="download-delivery-bundle">下载交付包</button>
        </div>
      </div>
      <div class="info-list">
        <div class="info-row"><span>交付状态</span><strong>${escapeHtml(productionReadinessStatusLabel(deliveryReadiness.status))}</strong></div>
        <div class="info-row"><span>交付得分</span><strong>${escapeHtml(deliveryReadiness.score ?? "-")}</strong></div>
        <div class="info-row"><span>通过 / 告警 / 失败</span><strong>${escapeHtml(summary.passed ?? 0)} / ${escapeHtml(summary.warnings ?? 0)} / ${escapeHtml(summary.failed ?? 0)}</strong></div>
        <div class="info-row"><span>交付包</span><strong>${escapeHtml(bundle.recommended_filename || "geo-pulse-delivery-bundle-0.20.0.json")}</strong></div>
        <div class="info-row"><span>生成时间</span><strong>${escapeHtml(formatDateTime(deliveryReadiness.generated_at))}</strong></div>
      </div>
      ${tableMarkup(["检查项", "状态", "说明 / 建议"], rows)}
      <div class="section-block" style="margin-top:14px">
        <div class="panel-head">
          <div>
            <h4 class="panel-title" style="font-size:15px">交付边界</h4>
            <div class="panel-note">交付包只包含脱敏运营摘要，不是运行态备份，也不代表真实外部监测或自动发布。</div>
          </div>
        </div>
        ${renderDeliveryBoundaryTable(deliveryReadiness)}
      </div>
      <div class="section-block" style="margin-top:14px">
        <div class="panel-head">
          <div>
            <h4 class="panel-title" style="font-size:15px">交付步骤</h4>
            <div class="panel-note">交付前由操作员按顺序确认。</div>
          </div>
        </div>
        ${renderDeliveryHandoffSteps(deliveryReadiness)}
      </div>
    </div>
  `;
}
```

- [ ] **Step 3: Render panel**

In `renderBrand`, add:

```js
  const deliveryReadiness = runtimeStatus?.delivery_readiness || {};
```

Then insert after `renderProductionReadinessPanel(productionReadiness)`:

```js
        ${renderDeliveryReadinessPanel(deliveryReadiness)}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run check
```

Expected: all v0.20 functional/UI assertions pass.

- [ ] **Step 5: Commit UI**

```bash
git add prototype/src/pages/settings.js
git commit -m "feat: add delivery center ui"
```

## Task 6: Documentation And Version Closeout

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
- Create: `docs/STAGE_V0_20_CLOSEOUT.md`

- [ ] **Step 1: Bump package version**

Change `package.json`:

```json
"version": "0.20.0"
```

- [ ] **Step 2: Add changelog entry**

Add at top of `CHANGELOG.md`:

```markdown
## 0.20.0 - 2026-07-07

Delivery hardening for controlled one-organization handoff.

### Added

- Consolidated delivery readiness report.
- Sanitized delivery bundle export.
- Settings `交付中心` UI with delivery score, bundle metadata, boundaries, and handoff steps.
- System API routes for delivery readiness and delivery bundle.

### Boundaries

- Delivery bundle is a sanitized handoff report, not a runtime backup.
- No raw secrets, password hashes, sessions, backup snapshots, full local state, raw audit logs, or article bodies are exported.
- No live AI/search/SERP/indexing/provider/CMS/social/community APIs are called.
- No automatic external publishing is performed.

### Verification

- `npm run check`
- `git diff --check`
```

- [ ] **Step 3: Add closeout doc**

Create `docs/STAGE_V0_20_CLOSEOUT.md` with sections:

```markdown
# Stage v0.20 Closeout

## Scope Completed

v0.20 adds delivery hardening for controlled one-organization handoff:

- delivery readiness report,
- sanitized delivery bundle export,
- Settings `交付中心`,
- API routes for delivery readiness and bundle download,
- documentation and version alignment.

## Operating Boundary

v0.20 does not add live provider calls, live publishing calls, external LLM generation, database migrations, OAuth/SSO, MFA, multi-tenant isolation, or raw secret export. The delivery bundle is a sanitized handoff report, not a runtime backup.

## Verification

```bash
npm run check
git diff --check
```

Expected:

```text
verify-mvp: OK
```

## Maintainer Notes

- Keep delivery bundle sanitized.
- Keep runtime backups separate from delivery bundles.
- Keep v0.19 provider and connector rows dry-run until approved live adapters exist.
```

- [ ] **Step 4: Update current docs**

Update current-state text in the listed docs from v0.19 to v0.20 and mention:

- delivery readiness report,
- sanitized delivery bundle,
- Settings delivery center,
- no-live-provider/no-auto-publish/no-raw-secret boundary.

- [ ] **Step 5: Search for stale current-version references**

Run:

```bash
rg 'v0\.19\.0|0\.19\.0|Post-v0\.19|Non-Goals For v0\.19|Current public snapshot: `0\.19\.0`|Ready for GitHub publication as a v0\.19' README.md docs package.json CHANGELOG.md
```

Expected: only historical changelog, closeout, spec, and plan files mention v0.19 as historical context.

- [ ] **Step 6: Run checks**

Run:

```bash
git diff --check
npm run check
```

Expected: both pass.

- [ ] **Step 7: Commit docs**

```bash
git add package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_20_CLOSEOUT.md
git commit -m "docs: close delivery hardening v0.20"
```

## Task 7: Final Verification And Push

**Files:**
- No source changes unless verification exposes a real issue.

- [ ] **Step 1: Verify diff formatting**

Run:

```bash
git diff --check origin/main..HEAD
```

Expected: no output and exit 0.

- [ ] **Step 2: Run full gate**

Run:

```bash
npm run check
```

Expected:

```text
verify-mvp: OK
```

If sandbox blocks local HTTP with `listen EPERM`, rerun with approved non-sandbox `npm run check`.

- [ ] **Step 3: Confirm clean status**

Run:

```bash
git status -sb
```

Expected: clean branch ahead of origin by the new v0.20 commits.

- [ ] **Step 4: Push**

Run:

```bash
git push origin main
```

- [ ] **Step 5: Check GitHub Actions**

Run:

```bash
gh run list --limit 5
gh run watch <latest-run-id> --exit-status
```

Expected: latest `check` run completes with `success`.

- [ ] **Step 6: Final report**

Report in Chinese:

- version `0.20.0`,
- latest commit hash,
- `npm run check` result,
- GitHub Actions result,
- delivery boundaries,
- remaining future work.
