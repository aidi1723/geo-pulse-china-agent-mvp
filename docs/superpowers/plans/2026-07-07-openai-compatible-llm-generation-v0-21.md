# OpenAI-Compatible LLM Generation v0.21 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable OpenAI-compatible LLM generation for International GEO long-form article drafts and multi-platform rewrites while keeping publishing manual and all secrets masked.

**Architecture:** Extend the existing International GEO `content_generation` model in `mock-data.mjs` with sanitized OpenAI-compatible provider config, local test/run helpers, and remote-first generation with `local_rules` fallback. Expose provider configuration/test routes in `server.mjs`, wire browser API/actions/events, add compact provider controls to the existing International GEO content-generation UI, and update docs/version to v0.21. The implementation remains zero-dependency and uses Node's built-in `fetch`, `AbortController`, and existing endpoint validation helpers.

**Tech Stack:** Node.js ESM, zero runtime npm dependencies, local JSON state, existing browser prototype modules, `verify-mvp.mjs`, OpenAI-compatible Chat Completions HTTP contract.

---

## Files And Responsibilities

- Modify `verify-mvp.mjs`: add failing tests for provider config masking, route authorization, mock-compatible generation, fallback, UI controls, and delivery bundle sanitization.
- Modify `mock-data.mjs`: add OpenAI-compatible provider config helpers, provider test action, remote article/rewrite generation helpers, failure fallback, and sanitized read models.
- Modify `server.mjs`: add provider save/test routes under `/international-geo/content-generation/providers/:id`.
- Modify `prototype/src/api.js`: add provider save/test browser API wrappers.
- Modify `prototype/src/main.js`: add provider form helpers and actions.
- Modify `prototype/src/events.js`: wire provider save/test actions.
- Modify `prototype/src/pages/international.js`: render OpenAI-compatible provider configuration, masked credential status, provider test, and generation provenance.
- Modify docs and `package.json`: bump to `0.21.0`, add `docs/STAGE_V0_21_CLOSEOUT.md`, and align current-state docs.

## Task 1: Failing Regression Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add model imports**

Add these imports from `./mock-data.mjs` near the existing International GEO content-generation imports:

```js
  saveInternationalGeoContentGenerationProviderAction,
  testInternationalGeoContentGenerationProviderAction,
```

- [ ] **Step 2: Add source assertions**

Add assertions near the existing content-generation source checks:

```js
  assert.match(
    fs.readFileSync("mock-data.mjs", "utf8"),
    /saveInternationalGeoContentGenerationProviderAction/,
    "Content generation provider config should be saveable"
  );
  assert.match(
    fs.readFileSync("mock-data.mjs", "utf8"),
    /testInternationalGeoContentGenerationProviderAction/,
    "Content generation provider config should expose a provider test"
  );
  assert.match(
    apiSource,
    /export function saveInternationalGeoContentGenerationProvider/,
    "Browser API should save content generation provider config"
  );
  assert.match(
    apiSource,
    /export function testInternationalGeoContentGenerationProvider/,
    "Browser API should test content generation provider config"
  );
  assert.match(
    eventsSource,
    /save-international-geo-content-provider/,
    "Content generation provider save action should be wired"
  );
  assert.match(
    eventsSource,
    /test-international-geo-content-provider/,
    "Content generation provider test action should be wired"
  );
```

- [ ] **Step 3: Add model behavior assertions**

Add this block after the existing International GEO article/rewrite generation model checks:

```js
  const savedContentProvider = saveInternationalGeoContentGenerationProviderAction("openai_compatible", {
    status: "configured",
    endpoint: "mock://openai-compatible",
    model: "mock-geo-writer",
    api_key: "llm-secret-key",
    temperature: 0.4,
    max_tokens: 2400,
    timeout_ms: 12000,
    retry_count: 1,
    notes: "Mock-compatible provider"
  });
  assert.equal(savedContentProvider.credential_status, "masked", "Content provider should mask credentials");
  assert.doesNotMatch(JSON.stringify(savedContentProvider), /llm-secret-key|api_key":"[^"]/, "Content provider response should not expose raw key");
  assert.equal(savedContentProvider.provider_type, "openai_compatible", "Content provider should expose OpenAI-compatible type");

  const contentProviderTest = await testInternationalGeoContentGenerationProviderAction("openai_compatible");
  assert.equal(contentProviderTest.external_call_performed, false, "Mock provider test should stay local");
  assert.equal(contentProviderTest.status, "ready", "Mock-compatible provider test should be ready");

  const remoteArticles = await generateInternationalGeoArticlesAction();
  assert(
    remoteArticles.articles.some((item) => item.generator_provider === "openai_compatible"),
    "Configured OpenAI-compatible provider should generate article drafts"
  );
  assert.doesNotMatch(JSON.stringify(remoteArticles), /llm-secret-key|api_key":"[^"]/, "Remote article generation should not expose raw key");

  const remoteArticle = remoteArticles.articles.find((item) => item.generator_provider === "openai_compatible");
  assert(remoteArticle?.content?.includes("Direct Answer"), "Remote article draft should include generated long-form structure");
  reviewInternationalGeoGeneratedArticleAction(remoteArticle.id, { action: "approve" });

  const remoteRewrites = await generateInternationalGeoPlatformRewritesAction();
  assert(
    remoteRewrites.rewrites.some((item) => item.generator_provider === "openai_compatible"),
    "Configured OpenAI-compatible provider should generate platform rewrites"
  );

  saveInternationalGeoContentGenerationProviderAction("openai_compatible", {
    status: "configured",
    endpoint: "mock://openai-compatible-fail",
    model: "mock-geo-writer",
    api_key: "llm-secret-key"
  });
  const fallbackState = await generateInternationalGeoArticlesAction({ force_new: true });
  assert(
    fallbackState.runs.some((item) => item.generator_provider === "local_rules" && item.fallback_from_provider === "openai_compatible"),
    "Provider failure should fall back to local_rules and record fallback metadata"
  );
```

- [ ] **Step 4: Add HTTP assertions**

Add this block near the existing content-generation HTTP checks:

```js
    const viewerProviderSave = await httpRequest(
      port,
      "/api/v1/international-geo/content-generation/providers/openai_compatible",
      {
        method: "PUT",
        headers: viewerHeaders,
        body: JSON.stringify({ status: "configured" })
      }
    );
    assert.equal(viewerProviderSave.status, 403, "Viewer should not save content generation provider config");

    const ownerProviderSave = await httpRequest(
      port,
      "/api/v1/international-geo/content-generation/providers/openai_compatible",
      {
        method: "PUT",
        headers: ownerHeaders,
        body: JSON.stringify({
          status: "configured",
          endpoint: "mock://openai-compatible",
          model: "mock-geo-writer",
          api_key: "http-llm-secret-key",
          temperature: 0.3,
          max_tokens: 2200,
          timeout_ms: 12000,
          retry_count: 1
        })
      }
    );
    assert.equal(ownerProviderSave.status, 200, "Owner should save content generation provider config");
    assert.doesNotMatch(JSON.stringify(ownerProviderSave.body), /http-llm-secret-key|api_key":"[^"]/, "Provider save HTTP response should mask raw key");

    const viewerProviderTest = await httpRequest(
      port,
      "/api/v1/international-geo/content-generation/providers/openai_compatible/test",
      {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({})
      }
    );
    assert.equal(viewerProviderTest.status, 403, "Viewer should not test content generation provider");

    const ownerProviderTest = await httpRequest(
      port,
      "/api/v1/international-geo/content-generation/providers/openai_compatible/test",
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({})
      }
    );
    assert.equal(ownerProviderTest.status, 200, "Owner should test content generation provider");
    assert.equal(ownerProviderTest.body?.data?.external_call_performed, false, "Mock-compatible provider test should stay local");
```

- [ ] **Step 5: Add UI assertions**

Add these assertions near existing International GEO content generation UI assertions:

```js
  assert.match(internationalHtml, /OpenAI-compatible/, "International GEO should render OpenAI-compatible provider config");
  assert.match(internationalHtml, /data-content-provider-field="endpoint"/, "Provider endpoint field should render");
  assert.match(internationalHtml, /data-content-provider-field="model"/, "Provider model field should render");
  assert.match(internationalHtml, /save-international-geo-content-provider/, "Provider save action should render");
  assert.match(internationalHtml, /test-international-geo-content-provider/, "Provider test action should render");
  assert.match(internationalHtml, /生成来源/, "Content generation provenance should render");
```

- [ ] **Step 6: Run tests and confirm RED**

Run:

```bash
npm run check
```

Expected: fails with missing provider exports, routes, APIs, actions, or UI text. If the sandbox blocks local HTTP with `listen EPERM`, rerun with approved non-sandbox `npm run check`.

- [ ] **Step 7: Commit failing tests**

```bash
git add verify-mvp.mjs
git commit -m "test: require openai compatible llm generation v0.21"
```

## Task 2: Content Generation Provider Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add provider defaults and sanitization**

Near `defaultInternationalGeoGenerationProviders()`, replace reserved `openai` provider row with an executable `openai_compatible` row and preserve `claude` / `gemini` as reserved seams:

```js
{
  id: "openai_compatible",
  label: "OpenAI-compatible",
  status: "reserved",
  provider_type: "openai_compatible",
  external_credentials_required: true,
  supported_outputs: ["article", "platform_rewrite"],
  config: {
    endpoint: "mock://openai-compatible",
    model: "gpt-4.1-mini",
    api_key: "",
    temperature: 0.4,
    max_tokens: 2400,
    timeout_ms: 20000,
    retry_count: 1,
    notes: ""
  },
  endpoint: "mock://openai-compatible",
  credential_status: "missing",
  last_test_status: "not_run",
  last_tested_at: "",
  last_error_message: "",
  notes: "OpenAI Chat Completions compatible provider for article and rewrite generation."
}
```

Add helpers:

```js
function sanitizeContentGenerationProvider(provider = {}) {
  const config = provider.config || {};
  return {
    ...deepClone(provider),
    endpoint: String(config.endpoint || provider.endpoint || "").trim(),
    credential_status: config.api_key ? "masked" : "missing",
    config: {
      endpoint: String(config.endpoint || provider.endpoint || "").trim(),
      model: String(config.model || provider.model || "").trim(),
      api_key: "",
      masked_api_key: maskSecret(config.api_key || ""),
      temperature: clampNumber(config.temperature, 0, 2, 0.4),
      max_tokens: clampNumber(config.max_tokens, 512, 8000, 2400),
      timeout_ms: clampNumber(config.timeout_ms, 1000, 60000, 20000),
      retry_count: clampNumber(config.retry_count, 0, 3, 1),
      notes: String(config.notes || provider.notes || "").trim()
    }
  };
}
```

Also add `clampNumber(value, min, max, fallback)` if no equivalent helper exists.

- [ ] **Step 2: Add save action**

Add:

```js
export function saveInternationalGeoContentGenerationProviderAction(providerId, patch = {}) {
  ensureInternationalGeoStateShape();
  const provider = internationalGeoState.content_generation.providers.find((item) => item.id === providerId);
  if (!provider) return null;
  if (patch.status !== undefined && !["reserved", "configured", "disabled", "blocked"].includes(String(patch.status))) {
    throw validationError("status", "Unsupported content generation provider status.");
  }
  const nextConfig = { ...(provider.config || {}) };
  if (Object.prototype.hasOwnProperty.call(patch, "endpoint")) {
    const endpoint = String(patch.endpoint || "").trim();
    if (endpoint && !endpoint.startsWith("mock://")) {
      const endpointCheck = validateIntegrationEndpoint(endpoint);
      if (!endpointCheck.ok) throw validationError("endpoint", endpointCheck.message);
    }
    nextConfig.endpoint = endpoint;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "api_key")) {
    const apiKey = String(patch.api_key || "");
    if (apiKey && !isMaskedConnectorSecret(apiKey)) nextConfig.api_key = apiKey;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "model")) nextConfig.model = String(patch.model || "").trim();
  if (Object.prototype.hasOwnProperty.call(patch, "temperature")) nextConfig.temperature = clampNumber(patch.temperature, 0, 2, 0.4);
  if (Object.prototype.hasOwnProperty.call(patch, "max_tokens")) nextConfig.max_tokens = clampNumber(patch.max_tokens, 512, 8000, 2400);
  if (Object.prototype.hasOwnProperty.call(patch, "timeout_ms")) nextConfig.timeout_ms = clampNumber(patch.timeout_ms, 1000, 60000, 20000);
  if (Object.prototype.hasOwnProperty.call(patch, "retry_count")) nextConfig.retry_count = clampNumber(patch.retry_count, 0, 3, 1);
  if (Object.prototype.hasOwnProperty.call(patch, "notes")) nextConfig.notes = String(patch.notes || "").trim();
  provider.config = nextConfig;
  provider.endpoint = nextConfig.endpoint || "";
  provider.model = nextConfig.model || "";
  if (patch.status !== undefined) provider.status = String(patch.status);
  provider.credential_status = nextConfig.api_key ? "masked" : "missing";
  provider.notes = nextConfig.notes || provider.notes || "";
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.content_generation.provider.update", "international_geo_content_provider", provider.id, {
    changed_fields: Object.keys(patch).filter((key) => key !== "api_key"),
    status: provider.status,
    credential_status: provider.credential_status
  });
  persistState();
  return sanitizeContentGenerationProvider(provider);
}
```

- [ ] **Step 3: Add provider test action**

Add a mock-aware provider test:

```js
export async function testInternationalGeoContentGenerationProviderAction(providerId) {
  ensureInternationalGeoStateShape();
  const provider = internationalGeoState.content_generation.providers.find((item) => item.id === providerId);
  if (!provider) return null;
  const result = await runOpenAiCompatibleProviderTest(provider);
  provider.last_test_status = result.status;
  provider.last_tested_at = result.tested_at;
  provider.last_error_message = result.error_message || "";
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.content_generation.provider.test", "international_geo_content_provider", provider.id, {
    status: result.status,
    external_call_performed: result.external_call_performed
  });
  persistState();
  return result;
}
```

`runOpenAiCompatibleProviderTest(provider)` should:

- return `ready` and `external_call_performed: false` for `mock://openai-compatible`,
- return `blocked` and `external_call_performed: false` for missing endpoint/model/credential on non-mock endpoints,
- call the remote endpoint only when `https://` endpoint, model, and API key are configured.

- [ ] **Step 4: Update content generation read model**

In `getInternationalGeoContentGenerationState()`, return sanitized providers:

```js
providers: internationalGeoState.content_generation.providers.map(sanitizeContentGenerationProvider),
```

Update `contentGenerationSummary()` so `active_provider` returns `"openai_compatible"` when that provider has `status: "configured"` and credentials are present; otherwise `"local_rules"`.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run check
```

Expected: model assertions for provider config/test pass further; generation tests may still fail until Task 3 adds remote generation helpers.

- [ ] **Step 6: Commit model config**

```bash
git add mock-data.mjs
git commit -m "feat: add llm content provider config"
```

## Task 3: Remote Generation And Fallback

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add OpenAI-compatible request helpers**

Add helpers near the content-generation functions:

```js
function activeContentGenerationProvider() {
  ensureInternationalGeoStateShape();
  const provider = internationalGeoState.content_generation.providers.find((item) => item.id === "openai_compatible");
  if (!provider || provider.status !== "configured" || !provider.config?.endpoint || !provider.config?.model) return null;
  if (!provider.config.endpoint.startsWith("mock://") && !provider.config.api_key) return null;
  return provider;
}

function openAiCompatibleMessages(kind, payload = {}) {
  return [
    {
      role: "system",
      content: "You are a GEO content strategist. Write factual, reviewable, evidence-backed content. Do not claim measured AI inclusion, indexing, citation, or recommendation unless evidence says so."
    },
    {
      role: "user",
      content: JSON.stringify({ kind, ...payload }, null, 2)
    }
  ];
}
```

- [ ] **Step 2: Add mock generation helpers**

Add deterministic mock outputs for tests and local demos:

```js
function mockOpenAiCompatibleArticle(payload = {}) {
  const product = payload.input?.product_name || "GEO Pulse";
  const prompt = payload.input?.primary_query || "AI search visibility";
  return {
    title: `${product}: GEO answer for ${prompt}`,
    content: `# ${product}: GEO answer for ${prompt}\n\n## Direct Answer\n${product} helps teams prepare source-backed content for AI search retrieval.\n\n## Evidence\n${payload.evidence_summary || "Reviewed evidence assets should be checked by a human operator."}\n\n## FAQ\n\n### What should be reviewed before publishing?\nReview claims, sources, canonical URL, and platform rules before manual publication.\n`,
    diagnostic: "Generated by mock OpenAI-compatible provider."
  };
}

function mockOpenAiCompatibleRewrite(payload = {}) {
  const platform = payload.platform?.platform_name || "Target Platform";
  const title = payload.article?.title || "Approved GEO article";
  return {
    content: `# ${platform} rewrite\n\nSource: ${title}\n\nUse this reviewed, evidence-backed summary for manual publication. Preserve canonical URL and platform rules.\n`,
    diagnostic: "Generated by mock OpenAI-compatible provider."
  };
}
```

- [ ] **Step 3: Add remote call helper**

Add:

```js
async function callOpenAiCompatibleProvider(provider, messages, options = {}) {
  const config = provider.config || {};
  const endpoint = String(config.endpoint || "").trim();
  if (endpoint === "mock://openai-compatible") {
    return {
      ok: true,
      external_call_performed: false,
      content: JSON.stringify(options.kind === "rewrite" ? mockOpenAiCompatibleRewrite(options.payload) : mockOpenAiCompatibleArticle(options.payload))
    };
  }
  if (endpoint === "mock://openai-compatible-fail") {
    return {
      ok: false,
      external_call_performed: false,
      error_message: "Mock OpenAI-compatible provider failure."
    };
  }
  const endpointCheck = validateIntegrationEndpoint(endpoint);
  if (!endpointCheck.ok) {
    return { ok: false, external_call_performed: false, error_message: endpointCheck.message };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), clampNumber(config.timeout_ms, 1000, 60000, 20000));
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: clampNumber(config.temperature, 0, 2, 0.4),
        max_tokens: clampNumber(config.max_tokens, 512, 8000, 2400)
      }),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, external_call_performed: true, error_message: `HTTP ${response.status}: ${text.slice(0, 180)}` };
    }
    const json = JSON.parse(text);
    return {
      ok: true,
      external_call_performed: true,
      content: json.choices?.[0]?.message?.content || ""
    };
  } catch (error) {
    return {
      ok: false,
      external_call_performed: !endpoint.startsWith("mock://"),
      error_message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Integrate article generation**

Change `export function generateInternationalGeoArticlesAction()` to `export async function generateInternationalGeoArticlesAction(options = {})`.

When new approved assets exist and `activeContentGenerationProvider()` returns a provider:

- build messages with `openAiCompatibleMessages("article", payload)`,
- call `callOpenAiCompatibleProvider(provider, messages, { kind: "article", payload })`,
- parse returned JSON when possible,
- create the article with `generator_provider: "openai_compatible"`,
- set `provider_execution_mode` to `"remote"` when `external_call_performed` is true and `"mock"` when false,
- include `provider_error_message: ""`.

If the provider result is not ok, create the existing `local_rules` article and add run metadata:

```js
generator_provider: "local_rules",
fallback_from_provider: "openai_compatible",
provider_error_message: result.error_message || "Provider failed."
```

When `options.force_new === true`, allow creating a new article even if all approved assets have already been used by appending a fresh source key suffix such as `:${createdAt}`.

- [ ] **Step 5: Integrate rewrite generation**

Change `export function generateInternationalGeoPlatformRewritesAction()` to `export async function generateInternationalGeoPlatformRewritesAction(options = {})`.

When provider is active:

- generate each missing rewrite through `callOpenAiCompatibleProvider(provider, messages, { kind: "rewrite", payload })`,
- create rewrites with `generator_provider: "openai_compatible"` on success,
- fall back to `platformRewriteContent(article, platform)` with `generator_provider: "local_rules"` and `fallback_from_provider: "openai_compatible"` on failure,
- record run metadata with counts for remote success and fallback count.

- [ ] **Step 6: Update existing call sites for async**

Because the actions become async:

- In `server.mjs`, `await generateInternationalGeoArticlesAction()` and `await generateInternationalGeoPlatformRewritesAction()`.
- In `verify-mvp.mjs`, await direct calls.
- Existing frontend API calls already use HTTP and need no async signature change.

- [ ] **Step 7: Run tests**

Run:

```bash
npm run check
```

Expected: model generation assertions pass further; route/UI assertions may still fail until later tasks.

- [ ] **Step 8: Commit remote generation**

```bash
git add mock-data.mjs server.mjs verify-mvp.mjs
git commit -m "feat: use llm provider for geo content generation"
```

## Task 4: Provider API Routes

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Add imports**

Add these imports from `./mock-data.mjs`:

```js
  saveInternationalGeoContentGenerationProviderAction,
  testInternationalGeoContentGenerationProviderAction,
```

- [ ] **Step 2: Add provider save route**

Near existing `/international-geo/content-generation` routes, add:

```js
  if (req.method === "PUT" && pathname.match(/^\/international-geo\/content-generation\/providers\/[^/]+$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = saveInternationalGeoContentGenerationProviderAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Content generation provider not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid content generation provider";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 3: Add provider test route**

Add:

```js
  if (req.method === "POST" && pathname.match(/^\/international-geo\/content-generation\/providers\/[^/]+\/test$/)) {
    const id = pathname.split("/")[4];
    const result = await testInternationalGeoContentGenerationProviderAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Content generation provider not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
    return;
  }
```

The existing mutation role gate should keep viewer sessions from saving or testing providers.

- [ ] **Step 4: Run tests**

Run:

```bash
npm run check
```

Expected: HTTP route assertions pass further; browser API/UI source assertions may still fail.

- [ ] **Step 5: Commit routes**

```bash
git add server.mjs
git commit -m "feat: expose llm content provider api"
```

## Task 5: Browser API And Actions

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add browser API wrappers**

In `prototype/src/api.js`, near content-generation functions, add:

```js
export function saveInternationalGeoContentGenerationProvider(providerId, payload = {}) {
  return requestJson(`/api/v1/international-geo/content-generation/providers/${encodeURIComponent(providerId)}`, "PUT", payload);
}

export function testInternationalGeoContentGenerationProvider(providerId) {
  return requestJson(`/api/v1/international-geo/content-generation/providers/${encodeURIComponent(providerId)}/test`, "POST", {});
}
```

- [ ] **Step 2: Import wrappers in main**

In `prototype/src/main.js`, import:

```js
  saveInternationalGeoContentGenerationProvider as saveInternationalGeoContentGenerationProviderApi,
  testInternationalGeoContentGenerationProvider as testInternationalGeoContentGenerationProviderApi,
```

- [ ] **Step 3: Add provider form payload helper**

Add a helper near other International GEO payload helpers:

```js
function getInternationalGeoContentProviderPayload() {
  const container = root.querySelector('[data-content-provider="openai_compatible"]');
  if (!container) return null;
  const field = (name) => container.querySelector(`[data-content-provider-field="${name}"]`)?.value || "";
  return {
    status: field("status"),
    endpoint: field("endpoint"),
    model: field("model"),
    api_key: field("api_key"),
    temperature: Number(field("temperature") || 0.4),
    max_tokens: Number(field("max_tokens") || 2400),
    timeout_ms: Number(field("timeout_ms") || 20000),
    retry_count: Number(field("retry_count") || 1),
    notes: field("notes")
  };
}
```

- [ ] **Step 4: Add actions**

In the `actions` object, add:

```js
  async saveInternationalGeoContentGenerationProvider() {
    try {
      const payload = getInternationalGeoContentProviderPayload();
      if (!payload) return;
      await saveInternationalGeoContentGenerationProviderApi("openai_compatible", payload);
      await refreshData();
      store.page = "international";
      showNotice("内容生成 LLM Provider 已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存内容生成 Provider 失败");
      rerender();
    }
  },
  async testInternationalGeoContentGenerationProvider() {
    try {
      const result = await testInternationalGeoContentGenerationProviderApi("openai_compatible");
      await refreshData();
      store.page = "international";
      showNotice(`内容生成 Provider 测试完成：${result.status || "review"}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "测试内容生成 Provider 失败");
      rerender();
    }
  },
```

- [ ] **Step 5: Wire events**

In `prototype/src/events.js`, add:

```js
    if (action === "save-international-geo-content-provider") {
      await actions.saveInternationalGeoContentGenerationProvider();
      return;
    }

    if (action === "test-international-geo-content-provider") {
      await actions.testInternationalGeoContentGenerationProvider();
      return;
    }
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run check
```

Expected: browser API/action assertions pass further; UI rendering assertions may still fail.

- [ ] **Step 7: Commit browser wiring**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire llm content provider actions"
```

## Task 6: International GEO UI

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Inspect content generation render function**

Find the existing content generation panel around `const contentGeneration = data.content_generation || {};` and identify where provider rows are currently rendered.

- [ ] **Step 2: Add provider render helper**

Add a compact helper near existing International GEO content-generation helpers:

```js
function renderContentGenerationProviderPanel(contentGeneration = {}) {
  const provider = (contentGeneration.providers || []).find((item) => item.id === "openai_compatible") || {};
  const config = provider.config || {};
  return `
    <div class="section-block" data-content-provider="openai_compatible">
      <div class="panel-head">
        <div>
          <h4 class="panel-title" style="font-size:15px">OpenAI-compatible 内容生成</h4>
          <div class="panel-note">用于国际 GEO 长文章和多平台改写；生成内容仍需人工审核和手动发布。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="test-international-geo-content-provider">测试 Provider</button>
          <button class="primary-btn" data-action="save-international-geo-content-provider">保存 Provider</button>
        </div>
      </div>
      <div class="info-list">
        <div class="info-row"><span>状态</span><strong>${statusMarkup(provider.status_label || provider.status || "-")}</strong></div>
        <div class="info-row"><span>凭据</span><strong>${statusMarkup(provider.credential_status || "missing")}</strong></div>
        <div class="info-row"><span>上次测试</span><strong>${escapeHtml(provider.last_test_status || "-")}</strong></div>
        <div class="info-row"><span>生成来源</span><strong>${escapeHtml(contentGeneration.summary?.active_provider || "local_rules")}</strong></div>
      </div>
      <div class="form-grid" style="margin-top:14px">
        <div class="form-field">
          <label>状态</label>
          <select data-content-provider-field="status">
            ${["reserved", "configured", "disabled", "blocked"].map((status) => `<option value="${status}" ${provider.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Endpoint</label>
          <input data-content-provider-field="endpoint" value="${escapeHtml(config.endpoint || provider.endpoint || "")}" />
        </div>
        <div class="form-field">
          <label>Model</label>
          <input data-content-provider-field="model" value="${escapeHtml(config.model || provider.model || "")}" />
        </div>
        <div class="form-field">
          <label>API Key</label>
          <input data-content-provider-field="api_key" value="${escapeHtml(config.masked_api_key || "")}" />
        </div>
        <div class="form-field">
          <label>Temperature</label>
          <input data-content-provider-field="temperature" value="${escapeHtml(config.temperature ?? 0.4)}" />
        </div>
        <div class="form-field">
          <label>Max tokens</label>
          <input data-content-provider-field="max_tokens" value="${escapeHtml(config.max_tokens ?? 2400)}" />
        </div>
        <div class="form-field">
          <label>Timeout ms</label>
          <input data-content-provider-field="timeout_ms" value="${escapeHtml(config.timeout_ms ?? 20000)}" />
        </div>
        <div class="form-field">
          <label>Retry count</label>
          <input data-content-provider-field="retry_count" value="${escapeHtml(config.retry_count ?? 1)}" />
        </div>
        <div class="form-field full">
          <label>Notes</label>
          <textarea data-content-provider-field="notes">${escapeHtml(config.notes || provider.notes || "")}</textarea>
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 3: Render provider provenance in article/rewrite rows**

Where article and rewrite rows are rendered, add a compact metadata line:

```js
<div class="cell-sub">生成来源：${escapeHtml(item.generator_provider || "local_rules")}${item.fallback_from_provider ? ` / fallback: ${escapeHtml(item.fallback_from_provider)}` : ""}</div>
```

- [ ] **Step 4: Insert provider panel**

In the content generation section, render:

```js
${renderContentGenerationProviderPanel(contentGeneration)}
```

before article and rewrite queues.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run check
```

Expected: all functional and UI assertions pass.

- [ ] **Step 6: Commit UI**

```bash
git add prototype/src/pages/international.js
git commit -m "feat: add llm provider controls"
```

## Task 7: Delivery Bundle And Docs Alignment

**Files:**
- Modify: `mock-data.mjs`
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
- Create: `docs/STAGE_V0_21_CLOSEOUT.md`

- [ ] **Step 1: Update delivery bundle summary**

In `getDeliveryBundleState()`, add safe content-generation provider summary under `international_geo`:

```js
content_generation_provider_summary: {
  provider_count: contentGenerationState.summary.provider_count,
  active_provider: contentGenerationState.summary.active_provider,
  configured_count: (contentGenerationState.providers || []).filter((item) => item.status === "configured").length,
  masked_credential_count: (contentGenerationState.providers || []).filter((item) => item.credential_status === "masked").length
}
```

Do not include provider configs, raw keys, prompts, full article bodies, or rewrite bodies.

- [ ] **Step 2: Bump package version**

Change `package.json`:

```json
"version": "0.21.0"
```

- [ ] **Step 3: Add changelog entry**

Add at top of `CHANGELOG.md`:

```markdown
## 0.21.0 - 2026-07-07

OpenAI-compatible LLM content generation for International GEO.

### Added

- Configurable OpenAI-compatible content-generation provider.
- LLM-backed International GEO long-form article drafts.
- LLM-backed platform rewrites from approved articles.
- Provider test workflow, masked credential status, provenance, and local fallback.

### Boundaries

- External LLM calls happen only after operator configuration.
- Generated content remains review-first and manual-publish only.
- No AI search, SERP, indexing, visibility monitoring, CMS, social, community, directory, or review platform APIs are called by this feature.
- Raw API keys are never returned or included in delivery bundles.

### Verification

- `npm run check`
- `git diff --check`
```

- [ ] **Step 4: Add closeout doc**

Create `docs/STAGE_V0_21_CLOSEOUT.md`:

```markdown
# Stage v0.21 Closeout

## Scope Completed

v0.21 adds OpenAI-compatible LLM generation for International GEO:

- configurable content-generation provider,
- masked credential handling,
- provider test workflow,
- LLM article draft generation,
- LLM platform rewrite generation,
- local fallback and provenance,
- documentation and version alignment.

## Operating Boundary

v0.21 may call an operator-configured OpenAI-compatible LLM endpoint for content generation. It does not call AI search, SERP, indexing, visibility monitoring, CMS, social, community, directory, review-site, or publishing APIs. It does not register accounts, publish externally, bypass review, or claim measured AI inclusion from generated content.

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

- Keep API keys masked in all read models and delivery bundles.
- Keep generated articles and rewrites review-first.
- Keep publishing manual until approved publishing connectors exist.
```

- [ ] **Step 5: Update current docs**

Update the listed docs to describe:

- v0.21 as current version,
- OpenAI-compatible LLM content generation,
- operator-configured endpoint/key requirement,
- review-first generated content,
- manual external publishing,
- no AI-search/visibility/indexing claim from content generation alone.

- [ ] **Step 6: Search for stale current-version references**

Run:

```bash
rg 'v0\.20\.0|0\.20\.0|Post-v0\.20|Non-Goals For v0\.20|Current public snapshot: `0\.20\.0`|Ready for GitHub publication as a v0\.20' README.md docs package.json CHANGELOG.md
```

Expected: only historical changelog, closeout, spec, and plan files mention v0.20 as historical context.

- [ ] **Step 7: Run checks**

Run:

```bash
git diff --check
npm run check
```

Expected: both pass.

- [ ] **Step 8: Commit docs**

```bash
git add mock-data.mjs package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_21_CLOSEOUT.md
git commit -m "docs: close llm generation v0.21"
```

## Task 8: Final Verification And Push

**Files:**
- No code changes unless verification finds a defect.

- [ ] **Step 1: Run final whitespace check**

```bash
git diff --check origin/main..HEAD
```

Expected: no output and exit code 0.

- [ ] **Step 2: Run final project check**

```bash
npm run check
```

Expected:

```text
verify-mvp: OK
```

If sandbox blocks local HTTP with `listen EPERM`, rerun with approved non-sandbox `npm run check`.

- [ ] **Step 3: Check git status**

```bash
git status -sb
```

Expected: clean branch ahead of origin by the new v0.21 commits.

- [ ] **Step 4: Push main**

```bash
git push origin main
```

- [ ] **Step 5: Watch GitHub Actions**

```bash
gh run list --limit 5
LATEST_RUN_ID=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$LATEST_RUN_ID" --exit-status
```

Expected: latest `check` workflow completes with success.

- [ ] **Step 6: Final report**

Report in Chinese:

- version `0.21.0`,
- OpenAI-compatible provider config,
- article generation,
- platform rewrite generation,
- fallback behavior,
- masked credential boundary,
- manual publishing boundary,
- local and GitHub verification results.
