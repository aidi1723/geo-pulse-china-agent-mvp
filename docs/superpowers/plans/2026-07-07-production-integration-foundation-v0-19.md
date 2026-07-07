# Production Integration Foundation v0.19 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build v0.19 production integration foundation across visibility providers, production readiness, and publishing connectors while preserving the no-live-external-call boundary.

**Architecture:** Extend the existing zero-dependency mock domain model in `mock-data.mjs`, expose narrowly scoped API routes in `server.mjs`, wire browser API/actions/events, render compact admin panels using the existing dark operational UI, and close with aligned docs. New tests go into `verify-mvp.mjs` before implementation.

**Tech Stack:** Node.js ESM, local JSON state, browser prototype modules under `prototype/src`, `verify-mvp.mjs`, no runtime npm dependencies.

---

## Files And Responsibilities

- Modify `verify-mvp.mjs`: add source, model, HTTP, and UI assertions for all v0.19 surfaces.
- Modify `mock-data.mjs`: add visibility provider configs, production readiness read model, publishing connector configs, dry-run tests, diagnostics, audit events, and sanitized responses.
- Modify `server.mjs`: import new actions and expose v0.19 API routes with existing auth/error patterns.
- Modify `prototype/src/api.js`: add browser API wrappers.
- Modify `prototype/src/main.js`: add payload builders and action handlers.
- Modify `prototype/src/events.js`: wire new data actions.
- Modify `prototype/src/pages/international.js`: render visibility provider and publishing connector panels.
- Modify `prototype/src/pages/settings.js`: render production readiness panels.
- Modify current docs and add `docs/STAGE_V0_19_CLOSEOUT.md`.
- Update `package.json` to `0.19.0`.

## Task 1: Failing Regression Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add import expectations and source assertions**

Add source-level assertions near the existing v0.18 International GEO assertions:

```js
assertSourceContains(
  "mock-data.mjs",
  /getInternationalGeoVisibilityProviderState/,
  "International GEO visibility provider state should be exposed"
);
assertSourceContains(
  "mock-data.mjs",
  /testInternationalGeoVisibilityProviderAction/,
  "International GEO visibility provider dry-run test should exist"
);
assertSourceContains(
  "mock-data.mjs",
  /getProductionReadinessState/,
  "Production readiness state should be exposed"
);
assertSourceContains(
  "mock-data.mjs",
  /getInternationalGeoPublishingConnectorState/,
  "International GEO publishing connector state should be exposed"
);
assertSourceContains(
  "prototype/src/api.js",
  /export function testInternationalGeoVisibilityProvider/,
  "Browser API should expose visibility provider dry-run tests"
);
assertSourceContains(
  "prototype/src/events.js",
  /international-visibility-provider-test/,
  "Visibility provider test action should be wired"
);
assertSourceContains(
  "prototype/src/events.js",
  /international-publishing-connector-test/,
  "Publishing connector test action should be wired"
);
assertSourceContains(
  "prototype/src/events.js",
  /refresh-production-readiness/,
  "Production readiness refresh action should be wired"
);
```

- [ ] **Step 2: Add model behavior assertions**

Import the new actions from `mock-data.mjs`:

```js
import {
  diagnoseInternationalGeoPublishingConnectorsAction,
  diagnoseInternationalGeoVisibilityProvidersAction,
  getInternationalGeoPublishingConnectorState,
  getInternationalGeoVisibilityProviderState,
  getProductionReadinessState,
  runProductionReadinessCheckAction,
  saveInternationalGeoPublishingConnectorAction,
  saveInternationalGeoVisibilityProviderAction,
  testInternationalGeoPublishingConnectorAction,
  testInternationalGeoVisibilityProviderAction
} from "./mock-data.mjs";
```

Add behavior checks after the v0.18 visibility evidence tests:

```js
const providerState = getInternationalGeoVisibilityProviderState();
assert(providerState.providers.length >= 6, "Visibility provider registry should include supported AI engines");
assert(
  providerState.providers.every((item) => !JSON.stringify(item).includes("provider-secret")),
  "Visibility provider responses should not expose raw secrets"
);
const configuredProvider = saveInternationalGeoVisibilityProviderAction("visprov_chatgpt_search", {
  status: "configured",
  approval_status: "requested",
  endpoint: "https://example.com/visibility",
  api_key: "provider-secret",
  notes: "Dry-run only"
});
assert.equal(configuredProvider.credential_status, "masked", "Visibility provider should store masked credential status");
assert.doesNotMatch(JSON.stringify(configuredProvider), /provider-secret/, "Visibility provider config should mask raw keys");
const providerTest = testInternationalGeoVisibilityProviderAction("visprov_chatgpt_search");
assert.equal(providerTest.external_call_performed, false, "Visibility provider dry-run must not call external endpoints");
assert(providerTest.checks.length >= 4, "Visibility provider dry-run should return check rows");
const providerDiagnostics = diagnoseInternationalGeoVisibilityProvidersAction();
assert(providerDiagnostics.items.length >= 6, "Provider diagnose-all should return every provider");
const unavailableRun = runInternationalGeoVisibilityMeasurementAction({ trigger: "v0_19_provider_boundary_test" });
assert(
  unavailableRun.snapshots.every((item) => item.data_status === "unavailable"),
  "Configured provider foundation must not create measured snapshots without approved provider evidence"
);
const productionReadiness = getProductionReadinessState();
assert(productionReadiness.checks.length >= 8, "Production readiness should include handoff checks");
assert(productionReadiness.masked_secret_inventory.length >= 1, "Production readiness should expose masked secret inventory");
assert.doesNotMatch(JSON.stringify(productionReadiness), /provider-secret/, "Production readiness should not expose raw secrets");
const productionCheck = runProductionReadinessCheckAction();
assert(productionCheck.checks.length >= productionReadiness.checks.length, "Production readiness check should return checks");
const publishingConnectorState = getInternationalGeoPublishingConnectorState();
assert(publishingConnectorState.connectors.length >= 8, "Publishing connector registry should include target platforms");
const savedPublishingConnector = saveInternationalGeoPublishingConnectorAction("geopubconn_medium", {
  status: "configured",
  endpoint: "https://example.com/medium",
  api_key: "publishing-secret"
});
assert.equal(savedPublishingConnector.credential_status, "masked", "Publishing connector should mask configured credentials");
assert.doesNotMatch(JSON.stringify(savedPublishingConnector), /publishing-secret/, "Publishing connector config should not expose raw key");
const publishingTest = testInternationalGeoPublishingConnectorAction("geopubconn_medium");
assert.equal(publishingTest.external_call_performed, false, "Publishing connector dry-run must not publish externally");
assert(publishingTest.checks.some((item) => item.id === "external_publish_blocked"), "Publishing dry-run should include external publish boundary");
const publishingDiagnostics = diagnoseInternationalGeoPublishingConnectorsAction();
assert(publishingDiagnostics.items.length >= 8, "Publishing connector diagnose-all should return every connector");
```

- [ ] **Step 3: Add HTTP assertions**

Add checks after existing International GEO visibility HTTP tests:

```js
const providerList = await httpRequest(port, "/api/v1/international-geo/visibility/providers", {
  headers: ownerHeaders
});
assert.equal(providerList.status, 200, "Owner should read visibility providers");
const viewerProviderUpdate = await httpRequest(port, "/api/v1/international-geo/visibility/providers/visprov_chatgpt_search", {
  method: "PUT",
  headers: viewerHeaders,
  body: JSON.stringify({ status: "configured" })
});
assert.equal(viewerProviderUpdate.status, 403, "Viewer should not update visibility providers");
const ownerProviderUpdate = await httpRequest(port, "/api/v1/international-geo/visibility/providers/visprov_chatgpt_search", {
  method: "PUT",
  headers: ownerHeaders,
  body: JSON.stringify({ status: "configured", endpoint: "https://example.com/provider", api_key: "http-provider-secret" })
});
assert.equal(ownerProviderUpdate.status, 200, "Owner should update visibility provider");
assert.doesNotMatch(JSON.stringify(ownerProviderUpdate.body), /http-provider-secret/, "Provider HTTP response should mask raw key");
const ownerProviderTest = await httpRequest(port, "/api/v1/international-geo/visibility/providers/visprov_chatgpt_search/test", {
  method: "POST",
  headers: ownerHeaders,
  body: JSON.stringify({})
});
assert.equal(ownerProviderTest.status, 200, "Owner should run provider dry-run test");
assert.equal(ownerProviderTest.body?.data?.external_call_performed, false, "Provider dry-run HTTP should not call external endpoint");
const missingProvider = await httpRequest(port, "/api/v1/international-geo/visibility/providers/missing-provider/test", {
  method: "POST",
  headers: ownerHeaders,
  body: JSON.stringify({})
});
assert.equal(missingProvider.status, 404, "Missing provider test should return 404");
const productionReadinessHttp = await httpRequest(port, "/api/v1/system/production-readiness", {
  headers: viewerHeaders
});
assert.equal(productionReadinessHttp.status, 200, "Viewer should read production readiness");
const viewerProductionCheck = await httpRequest(port, "/api/v1/system/production-readiness/check", {
  method: "POST",
  headers: viewerHeaders,
  body: JSON.stringify({})
});
assert.equal(viewerProductionCheck.status, 403, "Viewer should not run production readiness check");
const ownerProductionCheck = await httpRequest(port, "/api/v1/system/production-readiness/check", {
  method: "POST",
  headers: ownerHeaders,
  body: JSON.stringify({})
});
assert.equal(ownerProductionCheck.status, 200, "Owner should run production readiness check");
const publishingConnectorList = await httpRequest(port, "/api/v1/international-geo/publishing/connectors", {
  headers: viewerHeaders
});
assert.equal(publishingConnectorList.status, 200, "Viewer should read publishing connectors");
const ownerPublishingConnectorUpdate = await httpRequest(port, "/api/v1/international-geo/publishing/connectors/geopubconn_medium", {
  method: "PUT",
  headers: ownerHeaders,
  body: JSON.stringify({ status: "configured", endpoint: "https://example.com/medium", api_key: "http-publishing-secret" })
});
assert.equal(ownerPublishingConnectorUpdate.status, 200, "Owner should update publishing connector");
assert.doesNotMatch(JSON.stringify(ownerPublishingConnectorUpdate.body), /http-publishing-secret/, "Publishing connector HTTP response should mask raw key");
const ownerPublishingConnectorTest = await httpRequest(port, "/api/v1/international-geo/publishing/connectors/geopubconn_medium/test", {
  method: "POST",
  headers: ownerHeaders,
  body: JSON.stringify({})
});
assert.equal(ownerPublishingConnectorTest.status, 200, "Owner should run publishing connector dry-run test");
assert.equal(ownerPublishingConnectorTest.body?.data?.external_call_performed, false, "Publishing connector test should not call external platform");
```

- [ ] **Step 4: Add UI assertions**

Add International GEO UI checks:

```js
assert.match(internationalHtml, /可见度 Provider 配置/, "International GEO should render visibility provider config panel");
assert.match(internationalHtml, /Provider 诊断/, "International GEO should render visibility provider diagnostics panel");
assert.match(internationalHtml, /Provider 运行边界/, "International GEO should render visibility provider boundary panel");
assert.match(internationalHtml, /发布连接器配置/, "International GEO should render publishing connector config panel");
assert.match(internationalHtml, /发布连接器诊断/, "International GEO should render publishing connector diagnostics panel");
assert.match(internationalHtml, /发布运行边界/, "International GEO should render publishing connector boundary panel");
assert.match(internationalHtml, /international-visibility-provider-test/, "Provider dry-run action should render in UI");
assert.match(internationalHtml, /international-publishing-connector-test/, "Publishing connector dry-run action should render in UI");
```

Add Settings UI checks:

```js
assert.match(settingsHtml, /生产运行就绪/, "Settings should render production readiness panel");
assert.match(settingsHtml, /密钥与连接边界/, "Settings should render masked secret inventory panel");
assert.match(settingsHtml, /交付检查清单/, "Settings should render handoff checklist panel");
assert.match(settingsHtml, /refresh-production-readiness/, "Settings should wire production readiness refresh action");
```

- [ ] **Step 5: Run tests and confirm RED**

Run:

```bash
npm run check
```

Expected: fails with missing exports/functions/routes/UI text. If sandbox blocks local HTTP with `listen EPERM`, rerun with approved non-sandbox `npm run check`.

- [ ] **Step 6: Commit failing tests**

```bash
git add verify-mvp.mjs
git commit -m "test: require production integration foundation v0.19"
```

## Task 2: Visibility Provider Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add defaults and hydration**

Add `visibility_provider_configs` to `defaultInternationalGeoState` and `ensureInternationalGeoStateShape()`:

```js
visibility_provider_configs: defaultInternationalGeoVisibilityProviderConfigs()
```

Hydrate with:

```js
if (!Array.isArray(internationalGeoState.visibility_provider_configs)) {
  internationalGeoState.visibility_provider_configs = defaultInternationalGeoVisibilityProviderConfigs();
}
internationalGeoState.visibility_provider_configs = hydrateInternationalGeoVisibilityProviderConfigs(
  internationalGeoState.visibility_provider_configs
);
```

- [ ] **Step 2: Add config helpers**

Implement these helpers with explicit return shapes:

```js
const VISIBILITY_PROVIDER_STATUSES = new Set(["reserved", "configured", "blocked", "disabled"]);
const VISIBILITY_PROVIDER_APPROVAL_STATUSES = new Set(["not_requested", "requested", "approved", "rejected"]);

// defaultInternationalGeoVisibilityProviderConfigs(): returns one visprov_<engine_id> row per INTERNATIONAL_GEO_VISIBILITY_ENGINES item.
// hydrateInternationalGeoVisibilityProviderConfigs(configs): merges persisted rows onto defaults by stable id.
// sanitizeIntegrationConfig(config): returns endpoint, masked_api_key, timeout_ms, retry_count, notes; never returns api_key.
// integrationCredentialStatus(patch, current): returns "masked" when a new or existing key is present, "missing" otherwise.
// validateDryRunEndpoint(endpoint): returns { ok, status, message } and rejects non-https, localhost, private, and link-local host strings.
// buildVisibilityProviderDryRun(provider): returns { provider_id, status, checks, external_call_performed: false, tested_at }.
```

Use ids `visprov_${engine.id}` so tests and routes have stable ids.

- [ ] **Step 3: Add exported actions**

Implement these exports:

```js
// getInternationalGeoVisibilityProviderState(): returns { summary, providers, diagnostics }.
// saveInternationalGeoVisibilityProviderAction(providerId, patch): validates status/approval/endpoint, stores masked credential state, records audit, returns sanitized provider or null.
// testInternationalGeoVisibilityProviderAction(providerId): runs local dry-run checks, records audit, returns dry-run result or null.
// diagnoseInternationalGeoVisibilityProvidersAction(): dry-runs every provider, records audit, returns { summary, items }.
```

Audit actions:

- `international_geo.visibility_provider.update`
- `international_geo.visibility_provider.test`
- `international_geo.visibility_provider.diagnose`

- [ ] **Step 4: Integrate provider diagnostics into visibility state**

Update `getInternationalGeoVisibilityState()` to include:

```js
providers: getInternationalGeoVisibilityProviderState().providers,
provider_diagnostics: getInternationalGeoVisibilityProviderState().diagnostics
```

Update `internationalGeoVisibilitySummary()` with:

```js
provider_config_count
provider_ready_count
provider_blocked_count
```

- [ ] **Step 5: Run GREEN check for model section**

Run:

```bash
npm run check
```

Expected: model assertions pass; later HTTP/UI assertions still fail.

- [ ] **Step 6: Commit**

```bash
git add mock-data.mjs
git commit -m "feat: add visibility provider foundation model"
```

## Task 3: Production Readiness And Publishing Connector Models

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add publishing connector defaults and hydration**

Add `publishing_connectors` under International GEO publishing state and hydrate it from platform defaults:

```js
if (!Array.isArray(internationalGeoState.publishing_connectors)) {
  internationalGeoState.publishing_connectors = defaultInternationalGeoPublishingConnectors();
}
internationalGeoState.publishing_connectors = hydrateInternationalGeoPublishingConnectors(
  internationalGeoState.publishing_connectors
);
```

Use stable ids:

```js
geopubconn_official_blog
geopubconn_docs
geopubconn_medium
geopubconn_linkedin_company
geopubconn_youtube
geopubconn_github
geopubconn_reddit
geopubconn_quora
geopubconn_directory_review
```

- [ ] **Step 2: Add publishing connector actions**

Implement these exports:

```js
// getInternationalGeoPublishingConnectorState(): returns { summary, connectors, diagnostics }.
// saveInternationalGeoPublishingConnectorAction(connectorId, patch): validates status/endpoint, stores masked credential state, records audit, returns sanitized connector or null.
// testInternationalGeoPublishingConnectorAction(connectorId): runs local dry-run checks with external_call_performed false, records audit, returns result or null.
// diagnoseInternationalGeoPublishingConnectorsAction(): dry-runs every connector, records audit, returns { summary, items }.
```

Audit actions:

- `international_geo.publishing_connector.update`
- `international_geo.publishing_connector.test`
- `international_geo.publishing_connector.diagnose`

Every dry-run result must include:

```js
external_call_performed: false,
checks: [{ id: "external_publish_blocked", status: "passed", message: "No external platform API was called." }]
```

- [ ] **Step 3: Attach connector state to publishing read model**

Update `getInternationalGeoPublishingState()` to include:

```js
connectors: getInternationalGeoPublishingConnectorState().connectors,
connector_summary: getInternationalGeoPublishingConnectorState().summary
```

- [ ] **Step 4: Add production readiness read model**

Implement these helpers and exports:

```js
// productionReadinessCheck(id, category, label, status, message, recommendation): returns a normalized check row.
// buildMaskedSecretInventory(): returns env, automation connector, visibility provider, and publishing connector secret rows with masked values only.
// buildProductionHandoffChecklist(): returns checklist rows for docs, backup, auth, external access, connector boundaries, and provider boundaries.
// getProductionReadinessState(): returns { status, score, summary, checks, masked_secret_inventory, handoff_checklist, generated_at }.
// runProductionReadinessCheckAction(): records system.production_readiness.check audit and returns getProductionReadinessState().
```

Audit action:

- `system.production_readiness.check`

No raw key or password text may appear in returned objects.

- [ ] **Step 5: Run GREEN check for model section**

Run:

```bash
npm run check
```

Expected: model assertions pass; HTTP/UI assertions still fail.

- [ ] **Step 6: Commit**

```bash
git add mock-data.mjs
git commit -m "feat: add production and publishing connector models"
```

## Task 4: HTTP Routes

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Import new actions**

Add imports from `mock-data.mjs`:

```js
diagnoseInternationalGeoPublishingConnectorsAction,
diagnoseInternationalGeoVisibilityProvidersAction,
getInternationalGeoPublishingConnectorState,
getInternationalGeoVisibilityProviderState,
getProductionReadinessState,
runProductionReadinessCheckAction,
saveInternationalGeoPublishingConnectorAction,
saveInternationalGeoVisibilityProviderAction,
testInternationalGeoPublishingConnectorAction,
testInternationalGeoVisibilityProviderAction
```

- [ ] **Step 2: Add visibility provider routes**

Add routes near existing International GEO visibility routes:

```js
if (req.method === "GET" && pathname === "/international-geo/visibility/providers") {
  sendJson(res, 200, ok(getInternationalGeoVisibilityProviderState()));
  return;
}

if (req.method === "PUT" && pathname.match(/^\/international-geo\/visibility\/providers\/[^/]+$/)) {
  const id = pathname.split("/")[4];
  const body = await parseBody(req).catch(() => null);
  if (!body) {
    sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
    return;
  }
  try {
    const result = saveInternationalGeoVisibilityProviderAction(id, body);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Visibility provider not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
  } catch (err) {
    if ((err?.code || err?.message) === "VALIDATION_ERROR") {
      sendJson(res, 400, error("VALIDATION_ERROR", err.field_errors?.[0]?.message || err.message).body);
      return;
    }
    throw err;
  }
  return;
}
```

Add matching `POST /:id/test` and `POST /diagnose` routes.

- [ ] **Step 3: Add production readiness routes**

Add near system runtime/preflight routes:

```js
if (req.method === "GET" && pathname === "/system/production-readiness") {
  sendJson(res, 200, ok(getProductionReadinessState()));
  return;
}

if (req.method === "POST" && pathname === "/system/production-readiness/check") {
  sendJson(res, 200, ok(runProductionReadinessCheckAction()));
  return;
}
```

- [ ] **Step 4: Add publishing connector routes**

Add near International GEO publishing routes:

```js
if (req.method === "GET" && pathname === "/international-geo/publishing/connectors") {
  sendJson(res, 200, ok(getInternationalGeoPublishingConnectorState()));
  return;
}
```

Add matching `PUT /:id`, `POST /:id/test`, and `POST /diagnose` routes.

- [ ] **Step 5: Run GREEN check for HTTP section**

Run:

```bash
npm run check
```

Expected: HTTP assertions pass; browser/UI assertions still fail.

- [ ] **Step 6: Commit**

```bash
git add server.mjs
git commit -m "feat: expose production integration foundation api"
```

## Task 5: Browser API, Actions, And Events

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add browser API wrappers**

In `prototype/src/api.js` add:

```js
export function getInternationalGeoVisibilityProviders() {
  return request("/api/v1/international-geo/visibility/providers");
}

export function saveInternationalGeoVisibilityProvider(providerId, payload = {}) {
  return requestJson(`/api/v1/international-geo/visibility/providers/${encodeURIComponent(providerId)}`, "PUT", payload);
}

export function testInternationalGeoVisibilityProvider(providerId) {
  return requestJson(`/api/v1/international-geo/visibility/providers/${encodeURIComponent(providerId)}/test`, "POST", {});
}

export function diagnoseInternationalGeoVisibilityProviders() {
  return requestJson("/api/v1/international-geo/visibility/providers/diagnose", "POST", {});
}

export function getProductionReadiness() {
  return request("/api/v1/system/production-readiness");
}

export function runProductionReadinessCheck() {
  return requestJson("/api/v1/system/production-readiness/check", "POST", {});
}

export function getInternationalGeoPublishingConnectors() {
  return request("/api/v1/international-geo/publishing/connectors");
}

export function saveInternationalGeoPublishingConnector(connectorId, payload = {}) {
  return requestJson(`/api/v1/international-geo/publishing/connectors/${encodeURIComponent(connectorId)}`, "PUT", payload);
}

export function testInternationalGeoPublishingConnector(connectorId) {
  return requestJson(`/api/v1/international-geo/publishing/connectors/${encodeURIComponent(connectorId)}/test`, "POST", {});
}

export function diagnoseInternationalGeoPublishingConnectors() {
  return requestJson("/api/v1/international-geo/publishing/connectors/diagnose", "POST", {});
}
```

- [ ] **Step 2: Load new read models in refresh**

Update the main data refresh path so `store.data.internationalGeo.visibility.providers`, `store.data.internationalGeo.publishing.connectors`, and `store.data.runtimeStatus.production_readiness` are available. Prefer adding them to existing International GEO and runtime responses in `mock-data.mjs`; only call new GET wrappers if the existing aggregate does not include them.

- [ ] **Step 3: Add payload builders and actions**

In `prototype/src/main.js`, add helpers with these contracts:

```js
// getVisibilityProviderPayload(providerId): reads the row with data-visibility-provider-id and returns { status, approval_status, endpoint, api_key, notes }.
// getPublishingConnectorPayload(connectorId): reads the row with data-publishing-connector-id and returns { status, endpoint, api_key, notes }.
```

Add action handlers:

```js
// saveInternationalGeoVisibilityProvider(providerId): save provider payload, refresh data, show saved notice.
// testInternationalGeoVisibilityProvider(providerId): run provider dry-run, refresh data, show dry-run status.
// diagnoseInternationalGeoVisibilityProviders(): run diagnose-all, refresh data, show diagnosed count.
// refreshProductionReadiness(): run production readiness check, refresh data, show status and score.
// saveInternationalGeoPublishingConnector(connectorId): save connector payload, refresh data, show saved notice.
// testInternationalGeoPublishingConnector(connectorId): run connector dry-run, refresh data, show dry-run status.
// diagnoseInternationalGeoPublishingConnectors(): run diagnose-all, refresh data, show diagnosed count.
```

- [ ] **Step 4: Wire events**

In `prototype/src/events.js`, add:

```js
if (action === "international-visibility-provider-save") {
  await actions.saveInternationalGeoVisibilityProvider(actionButton.dataset.providerId);
  return;
}
if (action === "international-visibility-provider-test") {
  await actions.testInternationalGeoVisibilityProvider(actionButton.dataset.providerId);
  return;
}
if (action === "international-visibility-provider-diagnose") {
  await actions.diagnoseInternationalGeoVisibilityProviders();
  return;
}
if (action === "refresh-production-readiness") {
  await actions.refreshProductionReadiness();
  return;
}
if (action === "international-publishing-connector-save") {
  await actions.saveInternationalGeoPublishingConnector(actionButton.dataset.connectorId);
  return;
}
if (action === "international-publishing-connector-test") {
  await actions.testInternationalGeoPublishingConnector(actionButton.dataset.connectorId);
  return;
}
if (action === "international-publishing-connector-diagnose") {
  await actions.diagnoseInternationalGeoPublishingConnectors();
  return;
}
```

- [ ] **Step 5: Run GREEN check for action wiring**

Run:

```bash
npm run check
```

Expected: source/action assertions pass; UI text assertions still fail.

- [ ] **Step 6: Commit**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire production integration foundation actions"
```

## Task 6: UI Panels

**Files:**
- Modify: `prototype/src/pages/international.js`
- Modify: `prototype/src/pages/settings.js`

- [ ] **Step 1: Render visibility provider panels**

Add renderers in `prototype/src/pages/international.js`:

```js
// renderVisibilityProviderConfigPanel(providers): returns a table with provider, status, approval, credential, endpoint, notes, and save/test actions.
// renderVisibilityProviderDiagnosticsPanel(providers): returns latest test/diagnostic status rows and a diagnose-all button.
// renderVisibilityProviderBoundaryPanel(): returns a compact boundary panel stating no live AI/search provider calls are made in v0.19.
```

Include labels:

- `可见度 Provider 配置`
- `Provider 诊断`
- `Provider 运行边界`

Actions:

- `data-action="international-visibility-provider-save"`
- `data-action="international-visibility-provider-test"`
- `data-action="international-visibility-provider-diagnose"`

- [ ] **Step 2: Render publishing connector panels**

Add renderers in `prototype/src/pages/international.js`:

```js
// renderPublishingConnectorConfigPanel(connectors): returns a table with platform, connector type, status, credential, endpoint, notes, and save/test actions.
// renderPublishingConnectorDiagnosticsPanel(connectors): returns latest dry-run/diagnostic rows and a diagnose-all button.
// renderPublishingConnectorBoundaryPanel(): returns a compact boundary panel stating no external platform publish calls are made in v0.19.
```

Include labels:

- `发布连接器配置`
- `发布连接器诊断`
- `发布运行边界`

Actions:

- `data-action="international-publishing-connector-save"`
- `data-action="international-publishing-connector-test"`
- `data-action="international-publishing-connector-diagnose"`

- [ ] **Step 3: Insert panels into International GEO page**

Place provider panels near existing AI visibility panels and publishing connector panels near existing publishing workflow panels:

```js
${renderVisibilityProviderConfigPanel(visibility.providers || [])}
${renderVisibilityProviderDiagnosticsPanel(visibility.providers || [])}
${renderVisibilityProviderBoundaryPanel()}
...
${renderPublishingConnectorConfigPanel(publishing.connectors || [])}
${renderPublishingConnectorDiagnosticsPanel(publishing.connectors || [])}
${renderPublishingConnectorBoundaryPanel()}
```

- [ ] **Step 4: Render production readiness panels**

In `prototype/src/pages/settings.js`, add:

```js
// renderProductionReadinessPanel(productionReadiness): returns summary info rows and production readiness checks table.
// renderMaskedSecretInventoryPanel(productionReadiness): returns masked_secret_inventory table; never renders raw secrets.
// renderHandoffChecklistPanel(productionReadiness): returns handoff checklist rows with status and recommendation.
```

Include labels:

- `生产运行就绪`
- `密钥与连接边界`
- `交付检查清单`

Add action:

```html
<button class="secondary-btn" data-action="refresh-production-readiness">刷新生产检查</button>
```

- [ ] **Step 5: Run GREEN check for UI**

Run:

```bash
npm run check
```

Expected: all behavior/source/HTTP/UI assertions pass.

- [ ] **Step 6: Commit**

```bash
git add prototype/src/pages/international.js prototype/src/pages/settings.js
git commit -m "feat: render production integration foundation panels"
```

## Task 7: Documentation And Stage Closeout

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
- Create: `docs/STAGE_V0_19_CLOSEOUT.md`

- [ ] **Step 1: Update version**

Set `package.json`:

```json
"version": "0.19.0"
```

- [ ] **Step 2: Update changelog**

Add top entry:

```md
## 0.19.0 - 2026-07-07

Production integration foundation for International GEO.

### Added

- Visibility provider registry, dry-run tests, diagnostics, and boundary panels.
- Production readiness checks, masked secret inventory, and handoff checklist.
- Publishing connector registry, dry-run tests, diagnostics, and boundary panels.

### Boundaries

- Provider and connector tests are local dry runs only.
- No live AI/search/SERP/indexing/external platform APIs are called.
- No external publishing is performed.
- No raw credentials are returned in API or UI responses.
```

- [ ] **Step 3: Add closeout doc**

Create `docs/STAGE_V0_19_CLOSEOUT.md` with sections:

- Scope Completed
- Operating Boundary
- Verification
- Maintainer Notes

Include:

```md
v0.19 is an integration foundation. It is not a live AI monitoring system, external publishing system, external LLM generation system, production database migration, or multi-tenant SaaS release.
```

- [ ] **Step 4: Update current docs**

Update every listed doc to describe v0.19 as current state and include:

- visibility provider configs,
- production readiness,
- publishing connector configs,
- dry-run-only boundary,
- no raw credential exposure,
- future work remains real providers, durable secrets, database, monitoring, OAuth/SSO, MFA, multi-tenant SaaS.

- [ ] **Step 5: Stale text scan**

Run:

```bash
rg -n "v0\\.18\\.0|0\\.18\\.0|Post-v0\\.18|Non-Goals For v0\\.18|not a live provider|batch imports remain future" README.md docs package.json
```

Expected: only historical closeout/spec/plan files should mention v0.18 as historical context.

- [ ] **Step 6: Verify docs and commit**

Run:

```bash
git diff --check
npm run check
```

Expected: both pass. If sandbox blocks local HTTP with `listen EPERM`, rerun `npm run check` with approved non-sandbox permissions.

Commit:

```bash
git add package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_19_CLOSEOUT.md
git commit -m "docs: close production integration foundation v0.19"
```

## Task 8: Final Verification And GitHub Delivery

**Files:**
- No code edits expected.

- [ ] **Step 1: Run final local gates**

Run:

```bash
git diff --check origin/main..HEAD
npm run check
git status -sb
```

Expected:

- no diff whitespace errors,
- `verify-mvp: OK`,
- clean worktree ahead of `origin/main`.

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

- [ ] **Step 4: Final report**

Report in Chinese:

- latest version,
- latest commit,
- local `npm run check` result,
- GitHub Actions result,
- current delivery boundary,
- next recommended stage.
