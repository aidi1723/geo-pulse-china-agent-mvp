# Site GEO Audit And Asset Generation v0.10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rule-first site GEO audit workflow and generated GEO asset previews to the existing International GEO workspace.

**Architecture:** Extend the existing International GEO data model in `mock-data.mjs`, expose routes from the existing `/api/v1/international-geo/*` group in `server.mjs`, and render the workflow inside `prototype/src/pages/international.js` using existing dense admin UI helpers. Existing `/international-geo/audit` and `/international-geo/artifacts` routes must keep working by delegating to the new audit/asset helpers.

**Tech Stack:** Node.js ESM, zero runtime dependencies, vanilla browser prototype, existing HTTP session/RBAC guard, `verify-mvp.mjs`, GitHub Actions `npm run check`.

---

## File Map

- `verify-mvp.mjs`: Add red tests first for data helpers, HTTP/RBAC behavior, and International GEO UI rendering.
- `mock-data.mjs`: Add site audit records, generated asset records, deterministic audit scoring/check builders, persistence snapshot fields, audit events, and exported actions.
- `server.mjs`: Import new actions and add International GEO site audit routes.
- `prototype/src/api.js`: Add frontend API wrappers for site audit list/detail/create and asset generation.
- `prototype/src/main.js`: Add form reader and actions for running a site audit and generating assets.
- `prototype/src/events.js`: Wire new `data-action` buttons to actions.
- `prototype/src/pages/international.js`: Render the site audit form, latest summary/checks, recent audits, and asset previews.
- `prototype/src/static-api.js`: Keep static preview route shape compatible by adding read-only sample audit/assets data.
- `README.md`, `CHANGELOG.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/README.md`, `docs/STAGE_V0_10_CLOSEOUT.md`: Document v0.10 scope, routes, boundary, and verification.

---

### Task 1: Red Tests For v0.10 Behavior

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Extend imports**

Add the new functions to the `mock-data.mjs` import list. The test should fail until implementation exports them:

```js
  createInternationalGeoSiteAuditAction,
  generateInternationalGeoSiteAuditAssetsAction,
  getInternationalGeoSiteAudit,
  listInternationalGeoSiteAudits,
```

- [ ] **Step 2: Add mock-data assertions in `runMockDataChecks()`**

Add assertions after the existing International GEO assertions:

```js
  assert.ok(
    getInternationalGeoState().site_audits,
    "International GEO state should expose site audit records"
  );
  assert.ok(
    Array.isArray(getInternationalGeoState().geo_assets),
    "International GEO state should expose generated GEO assets"
  );

  assert.throws(
    () =>
      createInternationalGeoSiteAuditAction({
        website_url: "not-a-url",
        product_name: "Invalid Site"
      }),
    /INVALID_SITE_URL/,
    "Invalid site audit URL should be rejected"
  );

  const siteAudit = createInternationalGeoSiteAuditAction({
    website_url: "https://example.com",
    product_name: "Example GEO Platform",
    target_market: "US",
    target_language: "en-US",
    primary_query: "best GEO platform for B2B teams",
    competitors: ["Semrush", "Ahrefs"]
  });

  assert.equal(siteAudit.website_url, "https://example.com");
  assert.ok(siteAudit.score >= 0 && siteAudit.score <= 100, "Site audit should have a bounded score");
  assert.match(siteAudit.status, /^(ready|review|blocked)$/);
  assert.ok(siteAudit.checks.some((item) => item.id === "llms_txt"));
  assert.ok(siteAudit.checks.some((item) => item.id === "json_ld"));
  assert.ok(siteAudit.summary.warnings >= 0);
  assert.equal(getInternationalGeoSiteAudit(siteAudit.id)?.id, siteAudit.id);
  assert.ok(listInternationalGeoSiteAudits().items.some((item) => item.id === siteAudit.id));

  const assets = generateInternationalGeoSiteAuditAssetsAction(siteAudit.id);
  assert.ok(assets.items.some((item) => item.asset_type === "llms_txt"));
  assert.ok(assets.items.some((item) => item.asset_type === "organization_json_ld"));
  assert.ok(assets.items.some((item) => item.asset_type === "product_json_ld"));
  assert.ok(assets.items.some((item) => item.asset_type === "faq_json_ld"));
  assert.ok(assets.items.some((item) => item.asset_type === "article_brief"));
  assert.ok(assets.items.some((item) => item.asset_type === "distribution_brief"));
  assert.ok(JSON.stringify(assets).includes("Example GEO Platform"));
```

- [ ] **Step 3: Add HTTP/RBAC assertions**

In the HTTP test section that already logs in owner/viewer/editor users, add checks:

```js
  const unauthAudit = await requestJson(`${baseUrl}/api/v1/international-geo/site-audits`, {
    method: "POST",
    body: JSON.stringify({
      website_url: "https://example.com",
      product_name: "Example GEO Platform"
    })
  });
  assert.equal(unauthAudit.status, 401, "Unauthenticated site audit creation should be denied");

  const ownerAudit = await requestJson(`${baseUrl}/api/v1/international-geo/site-audits`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      website_url: "https://example.com",
      product_name: "Example GEO Platform",
      target_market: "US",
      target_language: "en-US",
      primary_query: "best GEO platform for B2B teams",
      competitors: ["Semrush", "Ahrefs"]
    })
  });
  assert.equal(ownerAudit.status, 201);
  assert.ok(ownerAudit.body.data.checks.some((item) => item.id === "robots_ai_access"));

  const viewerAssets = await requestJson(
    `${baseUrl}/api/v1/international-geo/site-audits/${ownerAudit.body.data.id}/assets`,
    {
      method: "POST",
      headers: viewerHeaders,
      body: JSON.stringify({})
    }
  );
  assert.equal(viewerAssets.status, 403, "Viewer should not generate site audit assets");

  const ownerAssets = await requestJson(
    `${baseUrl}/api/v1/international-geo/site-audits/${ownerAudit.body.data.id}/assets`,
    {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({})
    }
  );
  assert.equal(ownerAssets.status, 201);
  assert.ok(ownerAssets.body.data.items.some((item) => item.asset_type === "llms_txt"));
```

Use the exact helper/header names already present in `verify-mvp.mjs`; if they differ, adapt this snippet to the local names without changing behavior.

- [ ] **Step 4: Add UI render assertions**

In the existing UI rendering checks for `renderInternationalGeo`, add:

```js
  const internationalHtml = renderInternationalGeo({
    ...getInternationalGeoState(),
    site_audits: {
      items: [
        {
          id: "sga-test",
          website_url: "https://example.com",
          product_name: "Example GEO Platform",
          target_market: "US",
          target_language: "en-US",
          score: 82,
          status: "review",
          summary: { passed: 6, warnings: 3, failed: 0, blockers: 0, generated_assets: 6 },
          checks: [
            {
              id: "llms_txt",
              category: "ai_readability",
              label: "llms.txt",
              status: "warning",
              message: "Recommended to verify live /llms.txt.",
              recommendation: "Install a concise llms.txt file."
            }
          ],
          created_at: "2026-07-06T00:00:00.000Z"
        }
      ],
      latest: {
        id: "sga-test",
        website_url: "https://example.com",
        product_name: "Example GEO Platform",
        score: 82,
        status: "review",
        summary: { passed: 6, warnings: 3, failed: 0, blockers: 0, generated_assets: 6 },
        checks: []
      }
    },
    geo_assets: [
      {
        id: "asset-test",
        audit_id: "sga-test",
        asset_type: "llms_txt",
        title: "llms.txt",
        content: "# Example GEO Platform",
        content_type: "text/markdown",
        created_at: "2026-07-06T00:00:00.000Z"
      }
    ]
  });
  assert.match(internationalHtml, /站点 GEO 审计/);
  assert.match(internationalHtml, /data-action="international-site-audit"/);
  assert.match(internationalHtml, /data-action="international-site-assets"/);
  assert.match(internationalHtml, /GEO 资产/);
  assert.match(internationalHtml, /llms\.txt/);
```

- [ ] **Step 5: Run red check**

Run:

```bash
npm run check
```

Expected: fail because new imports/routes/rendered labels do not exist yet.

### Task 2: Data Model, Audit Builder, Assets, And Persistence

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add state fields**

Near `internationalGeoState`, add persistent fields:

```js
site_audits: {
  items: [],
  latest: null
},
geo_assets: []
```

If `internationalGeoState` already exists as an object literal, add these keys there rather than creating top-level arrays.

- [ ] **Step 2: Add URL and status helpers**

Near existing International GEO helpers, add small helpers:

```js
function normalizeSiteAuditUrl(value) {
  const text = String(value || "").trim();
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function siteAuditStatusFromChecks(checks = []) {
  if (checks.some((item) => item.status === "failed")) return "blocked";
  if (checks.some((item) => item.status === "warning")) return "review";
  return "ready";
}

function siteAuditSummary(checks = [], generatedAssetCount = 0) {
  return {
    passed: checks.filter((item) => item.status === "passed").length,
    warnings: checks.filter((item) => item.status === "warning").length,
    failed: checks.filter((item) => item.status === "failed").length,
    blockers: checks.filter((item) => item.status === "failed").length,
    generated_assets: generatedAssetCount
  };
}

function siteAuditScore(checks = []) {
  const score = 100 - checks.filter((item) => item.status === "warning").length * 6 - checks.filter((item) => item.status === "failed").length * 18;
  return Math.max(0, Math.min(100, score));
}
```

- [ ] **Step 3: Add deterministic check builder**

Add:

```js
function buildSiteAuditChecks(input) {
  const isHttps = String(input.website_url || "").startsWith("https://");
  const competitorCount = normalizeStringArray(input.competitors).length;
  const hasQuery = Boolean(String(input.primary_query || "").trim());
  return [
    {
      id: "url_quality",
      category: "technical",
      label: "URL quality",
      status: isHttps ? "passed" : "warning",
      message: isHttps ? "Detected HTTPS from local input." : "Local input is not HTTPS.",
      recommendation: isHttps ? "Keep HTTPS enforced for all canonical pages." : "Use HTTPS canonical URLs before public GEO work."
    },
    {
      id: "robots_ai_access",
      category: "crawler_access",
      label: "AI crawler access",
      status: "warning",
      message: "Recommended to verify live robots.txt for GPT, Gemini/Google, Claude, Perplexity, and Bing/Copilot crawlers.",
      recommendation: "Allow intended AI/search crawlers and document crawler policy in robots.txt."
    },
    {
      id: "sitemap",
      category: "technical",
      label: "Sitemap",
      status: "warning",
      message: "Recommended to verify sitemap.xml on the live site.",
      recommendation: "Publish sitemap.xml and submit it to Google Search Console and Bing Webmaster Tools."
    },
    {
      id: "llms_txt",
      category: "ai_readability",
      label: "llms.txt",
      status: "warning",
      message: "Recommended to install a concise /llms.txt generated from this audit.",
      recommendation: "Add /llms.txt with product, audience, core pages, and canonical entity summary."
    },
    {
      id: "json_ld",
      category: "structured_data",
      label: "JSON-LD",
      status: "warning",
      message: "Recommended to install Organization, Product/SoftwareApplication, and FAQPage schema.",
      recommendation: "Use the generated JSON-LD assets and validate them before deployment."
    },
    {
      id: "direct_answer",
      category: "content",
      label: "Direct Answer",
      status: hasQuery ? "passed" : "warning",
      message: hasQuery ? "Primary query is present in local input." : "Primary buyer/query prompt is missing.",
      recommendation: "Place a direct answer to the buyer query within the first 100 words of target pages."
    },
    {
      id: "fact_density",
      category: "content",
      label: "Fact density",
      status: "warning",
      message: "Recommended to verify product parameters, tables, measurable claims, and source citations on live pages.",
      recommendation: "Add specs, comparison tables, numbers, and sourced claims to increase citation usefulness."
    },
    {
      id: "eeat",
      category: "trust",
      label: "E-E-A-T",
      status: "warning",
      message: "Recommended to verify author, company, credential, case, and support signals on live pages.",
      recommendation: "Add named authors, company proof, security posture, case evidence, and update timestamps."
    },
    {
      id: "third_party_validation",
      category: "entity_validation",
      label: "Third-party validation",
      status: competitorCount > 0 ? "passed" : "warning",
      message: competitorCount > 0 ? "Competitor context is present in local input." : "Competitor context is missing.",
      recommendation: "Build cross-validation signals on Reddit, Quora, LinkedIn, directories, partner pages, and industry forums."
    }
  ];
}
```

- [ ] **Step 4: Add exported site audit actions**

Add exports:

```js
export function listInternationalGeoSiteAudits(query = {}) {
  const items = [...(internationalGeoState.site_audits?.items || [])].sort((left, right) =>
    String(right.created_at || "").localeCompare(String(left.created_at || ""))
  );
  return paginate(items, query.page, query.page_size);
}

export function getInternationalGeoSiteAudit(auditId) {
  const audit = (internationalGeoState.site_audits?.items || []).find((item) => item.id === auditId);
  return audit ? deepClone(audit) : null;
}

export function createInternationalGeoSiteAuditAction(payload = {}) {
  const websiteUrl = normalizeSiteAuditUrl(payload.website_url || internationalGeoState.input?.website_url || workspaceInput.website_url);
  if (!websiteUrl) {
    const error = new Error("INVALID_SITE_URL");
    error.code = "INVALID_SITE_URL";
    throw error;
  }
  const productName = String(payload.product_name || internationalGeoState.input?.product_name || workspaceInput.product_name || "").trim();
  if (!productName) {
    const error = new Error("PRODUCT_NAME_REQUIRED");
    error.code = "PRODUCT_NAME_REQUIRED";
    throw error;
  }
  const input = {
    website_url: websiteUrl,
    product_name: productName,
    target_market: String(payload.target_market || internationalGeoState.input?.target_market || "Global").trim(),
    target_language: String(payload.target_language || internationalGeoState.input?.target_language || "en").trim(),
    primary_query: String(payload.primary_query || internationalGeoState.input?.primary_query || "").trim(),
    competitors: normalizeStringArray(payload.competitors || internationalGeoState.input?.competitors || [])
  };
  const checks = buildSiteAuditChecks(input);
  const score = siteAuditScore(checks);
  const status = siteAuditStatusFromChecks(checks);
  const audit = {
    id: uniqueId("sga"),
    ...input,
    score,
    status,
    summary: siteAuditSummary(checks, 0),
    checks,
    created_at: nowIso()
  };
  internationalGeoState.input = { ...internationalGeoState.input, ...input };
  internationalGeoState.site_audits = internationalGeoState.site_audits || { items: [], latest: null };
  internationalGeoState.site_audits.items.unshift(audit);
  internationalGeoState.site_audits.latest = audit;
  internationalGeoState.summary = {
    ...(internationalGeoState.summary || {}),
    ai_ready_score: score,
    llms_status: "待生成",
    crawler_access: status === "blocked" ? "需复核" : "建议复核",
    citation_opportunities: Math.max(8, 24 - input.competitors.length)
  };
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.site_audit.create", "international_geo_site_audit", audit.id, {
    website_url: audit.website_url,
    product_name: audit.product_name,
    target_market: audit.target_market,
    score: audit.score,
    status: audit.status
  });
  persistState();
  return deepClone(audit);
}
```

- [ ] **Step 5: Add asset generation action**

Add:

```js
function jsonLdAsset(type, data) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": type, ...data }, null, 2);
}

export function generateInternationalGeoSiteAuditAssetsAction(auditId) {
  const audit = getInternationalGeoSiteAudit(auditId);
  if (!audit) return null;
  const competitors = normalizeStringArray(audit.competitors);
  const createdAt = nowIso();
  const assets = [
    {
      id: uniqueId("geoasset"),
      audit_id: audit.id,
      asset_type: "llms_txt",
      title: "llms.txt",
      content_type: "text/markdown",
      content: `# ${audit.product_name}\n\n${audit.product_name} helps ${audit.target_market || "global"} buyers evaluate ${audit.primary_query || "AI search visibility and GEO operations"}.\n\nOfficial site: ${audit.website_url}\nTarget language: ${audit.target_language || "en"}\n\nKey topics:\n- Generative Engine Optimization\n- AI search visibility\n- llms.txt\n- JSON-LD structured data\n- Direct-answer content\n\nCompetitors to compare against:\n${competitors.map((item) => `- ${item}`).join("\n") || "- Category leaders"}\n`,
      created_at: createdAt
    },
    {
      id: uniqueId("geoasset"),
      audit_id: audit.id,
      asset_type: "organization_json_ld",
      title: "Organization JSON-LD",
      content_type: "application/ld+json",
      content: jsonLdAsset("Organization", {
        name: audit.product_name,
        url: audit.website_url,
        knowsAbout: ["Generative Engine Optimization", "AI search visibility", "structured data"]
      }),
      created_at: createdAt
    },
    {
      id: uniqueId("geoasset"),
      audit_id: audit.id,
      asset_type: "product_json_ld",
      title: "Product JSON-LD",
      content_type: "application/ld+json",
      content: jsonLdAsset("SoftwareApplication", {
        name: audit.product_name,
        applicationCategory: "Generative Engine Optimization",
        url: audit.website_url,
        audience: audit.target_market || "Global B2B teams",
        featureList: ["Site GEO audit", "llms.txt generation", "JSON-LD recommendations", "AI search content planning"]
      }),
      created_at: createdAt
    },
    {
      id: uniqueId("geoasset"),
      audit_id: audit.id,
      asset_type: "faq_json_ld",
      title: "FAQPage JSON-LD",
      content_type: "application/ld+json",
      content: jsonLdAsset("FAQPage", {
        mainEntity: [
          {
            "@type": "Question",
            name: `What is ${audit.product_name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${audit.product_name} is positioned for ${audit.primary_query || "GEO and AI search visibility"} in ${audit.target_market || "global"} markets.`
            }
          },
          {
            "@type": "Question",
            name: `How should ${audit.product_name} improve AI search visibility?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "Install llms.txt, add Organization/Product/FAQ JSON-LD, publish direct-answer pages, and build third-party validation signals."
            }
          }
        ]
      }),
      created_at: createdAt
    },
    {
      id: uniqueId("geoasset"),
      audit_id: audit.id,
      asset_type: "article_brief",
      title: "GEO Article Brief",
      content_type: "text/markdown",
      content: `# Direct-answer article brief\n\nPrimary query: ${audit.primary_query || "AI search visibility"}\n\n## Direct answer\n${audit.product_name} helps buyers solve ${audit.primary_query || "GEO visibility"} by combining clear entity definitions, structured data, factual proof, and citation-ready content.\n\n## Sections\n1. Direct answer upfront\n2. Product/entity definition\n3. Comparison table against ${competitors.join(", ") || "category alternatives"}\n4. Product facts and measurable claims\n5. FAQ block\n6. Source and author proof\n`,
      created_at: createdAt
    },
    {
      id: uniqueId("geoasset"),
      audit_id: audit.id,
      asset_type: "distribution_brief",
      title: "Distribution Brief",
      content_type: "text/markdown",
      content: `# Distribution brief\n\nPrioritize:\n- Official resource center\n- FAQ page linked from llms.txt\n- Comparison page\n- LinkedIn article\n- Reddit or Quora answer where allowed\n- Industry directory or partner profile\n- GitHub/docs page for technical proof\n\nUse the same entity name, canonical URL, and direct-answer wording across channels.\n`,
      created_at: createdAt
    }
  ];
  internationalGeoState.geo_assets = [
    ...assets,
    ...(internationalGeoState.geo_assets || []).filter((item) => item.audit_id !== audit.id)
  ];
  const storedAudit = (internationalGeoState.site_audits?.items || []).find((item) => item.id === audit.id);
  if (storedAudit) {
    storedAudit.summary = siteAuditSummary(storedAudit.checks, assets.length);
    internationalGeoState.site_audits.latest = storedAudit;
  }
  internationalGeoState.artifacts = {
    llms_txt: assets.find((item) => item.asset_type === "llms_txt")?.content || "",
    json_ld: assets.find((item) => item.asset_type === "product_json_ld")?.content || "",
    distribution_brief: assets.find((item) => item.asset_type === "distribution_brief")?.content || ""
  };
  internationalGeoState.summary.llms_status = "已生成";
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.assets.generate", "international_geo_site_audit", audit.id, {
    website_url: audit.website_url,
    product_name: audit.product_name,
    asset_count: assets.length
  });
  persistState();
  return { audit: getInternationalGeoSiteAudit(audit.id), items: deepClone(assets) };
}
```

- [ ] **Step 6: Delegate existing actions**

Update `runInternationalGeoAuditAction()` so it calls `createInternationalGeoSiteAuditAction(internationalGeoState.input)` and then continues updating `engineVisibility` as it does today. Update `generateInternationalGeoArtifactsAction()` so it creates an audit if none exists and then calls `generateInternationalGeoSiteAuditAssetsAction(latestAudit.id)`, returning the compatibility `internationalGeoState.artifacts` object.

- [ ] **Step 7: Include new fields in snapshot/import**

Update runtime serialization/hydration helpers that include `internationalGeoState` so `site_audits` and `geo_assets` survive local persistence, backup download/import, restore, and reset. This should usually be automatic if the fields live inside `internationalGeoState`; verify no sanitizer drops them.

- [ ] **Step 8: Run check**

Run:

```bash
npm run check
```

Expected: data helper tests should move forward; HTTP/UI tests may still fail until server/UI tasks are complete.

### Task 3: Server Routes And Authorization

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Extend imports from `mock-data.mjs`**

Import:

```js
  createInternationalGeoSiteAuditAction,
  generateInternationalGeoSiteAuditAssetsAction,
  getInternationalGeoSiteAudit,
  listInternationalGeoSiteAudits,
```

- [ ] **Step 2: Add route list/detail**

Near existing `/international-geo` routes, add:

```js
  if (req.method === "GET" && pathname === "/international-geo/site-audits") {
    sendJson(res, 200, ok(listInternationalGeoSiteAudits(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/international-geo\/site-audits\/[^/]+$/)) {
    const id = pathname.split("/")[3];
    const audit = getInternationalGeoSiteAudit(id);
    if (!audit) {
      sendJson(res, 404, error("NOT_FOUND", "Site GEO audit not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(audit));
    return;
  }
```

- [ ] **Step 3: Add create route**

Add:

```js
  if (req.method === "POST" && pathname === "/international-geo/site-audits") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(createInternationalGeoSiteAuditAction(body)));
    } catch (err) {
      const code = err?.code || err?.message;
      if (code === "INVALID_SITE_URL") {
        sendJson(res, 400, error("INVALID_SITE_URL", "Website URL must be a valid http or https URL").body);
        return;
      }
      if (code === "PRODUCT_NAME_REQUIRED") {
        sendJson(res, 400, error("PRODUCT_NAME_REQUIRED", "Product name is required").body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 4: Add asset generation route**

Add:

```js
  if (req.method === "POST" && pathname.match(/^\/international-geo\/site-audits\/[^/]+\/assets$/)) {
    const id = pathname.split("/")[3];
    const result = generateInternationalGeoSiteAuditAssetsAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Site GEO audit not found", 404).body);
      return;
    }
    sendJson(res, 201, ok(result));
    return;
  }
```

- [ ] **Step 5: Confirm RBAC**

Do not add special bypass logic. Existing mutation authorization should deny unauthenticated users and viewer role while allowing editor/admin/owner and `X-GEO-API-Key` automation access.

- [ ] **Step 6: Run check**

Run:

```bash
npm run check
```

Expected: HTTP tests should pass or move forward; UI tests may still fail until frontend is complete.

### Task 4: Frontend API And Actions

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add API wrappers**

In `prototype/src/api.js`, add:

```js
export function listInternationalGeoSiteAudits() {
  return request("/api/v1/international-geo/site-audits");
}

export function getInternationalGeoSiteAudit(auditId) {
  return request(`/api/v1/international-geo/site-audits/${auditId}`);
}

export function createInternationalGeoSiteAudit(payload) {
  return requestJson("/api/v1/international-geo/site-audits", "POST", payload);
}

export function generateInternationalGeoSiteAuditAssets(auditId) {
  return requestJson(`/api/v1/international-geo/site-audits/${auditId}/assets`, "POST", {});
}
```

Bootstrap can continue to load all International GEO data from `/api/v1/international-geo`, because the new state is embedded there.

- [ ] **Step 2: Import wrappers in `prototype/src/main.js`**

Add aliases:

```js
  createInternationalGeoSiteAudit as createInternationalGeoSiteAuditApi,
  generateInternationalGeoSiteAuditAssets as generateInternationalGeoSiteAuditAssetsApi,
```

- [ ] **Step 3: Add form reader**

Add near other form readers:

```js
function getInternationalSiteAuditPayload() {
  const container = root.querySelector('[data-international-panel="site-audit"]');
  if (!container) return null;
  return {
    website_url: container.querySelector('[data-international-audit-field="website_url"]')?.value?.trim() || "",
    product_name: container.querySelector('[data-international-audit-field="product_name"]')?.value?.trim() || "",
    target_market: container.querySelector('[data-international-audit-field="target_market"]')?.value?.trim() || "",
    target_language: container.querySelector('[data-international-audit-field="target_language"]')?.value?.trim() || "",
    primary_query: container.querySelector('[data-international-audit-field="primary_query"]')?.value?.trim() || "",
    competitors: parseLineArray(
      container.querySelector('[data-international-audit-field="competitors"]')?.value || ""
    )
  };
}
```

- [ ] **Step 4: Add action `runInternationalSiteAudit()`**

Add to `actions`:

```js
  async runInternationalSiteAudit() {
    const payload = getInternationalSiteAuditPayload();
    if (!payload) return;
    try {
      const audit = await createInternationalGeoSiteAuditApi(payload);
      await refreshData();
      store.page = "international";
      showNotice(`站点 GEO 审计完成：${audit.score ?? "-"} / ${audit.status || "review"}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "站点 GEO 审计失败");
      rerender();
    }
  },
```

- [ ] **Step 5: Add action `generateInternationalSiteAssets()`**

Add:

```js
  async generateInternationalSiteAssets() {
    const latestAuditId =
      store.data.internationalGeo?.site_audits?.latest?.id ||
      store.data.internationalGeo?.site_audits?.items?.[0]?.id;
    if (!latestAuditId) {
      setError("请先运行站点 GEO 审计");
      rerender();
      return;
    }
    try {
      const result = await generateInternationalGeoSiteAuditAssetsApi(latestAuditId);
      await refreshData();
      store.page = "international";
      showNotice(`GEO 资产已生成：${result.items?.length || 0} 项。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成 GEO 资产失败");
      rerender();
    }
  },
```

- [ ] **Step 6: Wire events**

In `prototype/src/events.js`, add action mappings near existing International GEO action mappings:

```js
    if (action === "international-site-audit") {
      await actions.runInternationalSiteAudit();
      return;
    }

    if (action === "international-site-assets") {
      await actions.generateInternationalSiteAssets();
      return;
    }
```

- [ ] **Step 7: Run check**

Run:

```bash
npm run check
```

Expected: syntax should pass; UI tests may still fail until render task is complete.

### Task 5: International GEO UI

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add small helpers**

Add helpers near other render helpers:

```js
function auditStatusLabel(value) {
  const labels = {
    ready: "就绪",
    review: "需复核",
    blocked: "阻断",
    passed: "通过",
    warning: "告警",
    failed: "失败"
  };
  return labels[value] || value || "-";
}

function assetLabel(value) {
  const labels = {
    llms_txt: "llms.txt",
    organization_json_ld: "Organization JSON-LD",
    product_json_ld: "Product JSON-LD",
    faq_json_ld: "FAQ JSON-LD",
    article_brief: "Article brief",
    distribution_brief: "Distribution brief"
  };
  return labels[value] || value || "-";
}
```

- [ ] **Step 2: Add site audit form renderer**

Add:

```js
function renderSiteAuditPanel(data = {}) {
  const input = data.input || {};
  const latest = data.site_audits?.latest || data.site_audits?.items?.[0] || null;
  const competitors = Array.isArray(input.competitors) ? input.competitors.join("\n") : "";
  return `
    <section class="surface panel" data-international-panel="site-audit">
      <div class="section-head">
        <div>
          <h3>站点 GEO 审计</h3>
          <div class="panel-note">输入网址和产品信息，生成规则优先的 AI 搜索可读性审计。</div>
        </div>
        <div class="action-row">
          <button class="ghost-btn" data-action="international-site-assets">生成 GEO 资产</button>
          <button class="secondary-btn" data-action="international-site-audit">运行站点审计</button>
        </div>
      </div>
      <div class="form-grid compact-form">
        <label>Website URL<input data-international-audit-field="website_url" value="${escapeHtml(input.website_url || "")}" /></label>
        <label>Product / Brand<input data-international-audit-field="product_name" value="${escapeHtml(input.product_name || "")}" /></label>
        <label>Target market<input data-international-audit-field="target_market" value="${escapeHtml(input.target_market || "Global")}" /></label>
        <label>Target language<input data-international-audit-field="target_language" value="${escapeHtml(input.target_language || "en")}" /></label>
        <label class="span-2">Primary buyer query<input data-international-audit-field="primary_query" value="${escapeHtml(input.primary_query || "")}" /></label>
        <label class="span-2">Competitors<textarea data-international-audit-field="competitors" rows="3">${escapeHtml(competitors)}</textarea></label>
      </div>
      ${
        latest
          ? `<div class="info-list">
              <div class="info-row"><span>最近审计</span><strong>${escapeHtml(latest.product_name || "-")}</strong></div>
              <div class="info-row"><span>分数</span><strong>${escapeHtml(latest.score ?? "-")}</strong></div>
              <div class="info-row"><span>状态</span><strong>${escapeHtml(auditStatusLabel(latest.status))}</strong></div>
              <div class="info-row"><span>资产</span><strong>${escapeHtml(latest.summary?.generated_assets ?? 0)}</strong></div>
            </div>`
          : `<div class="empty-state">暂无站点审计。</div>`
      }
    </section>
  `;
}
```

- [ ] **Step 3: Add checks table renderer**

Add:

```js
function renderSiteAuditChecks(audit = {}) {
  const checks = audit?.checks || [];
  const rows = checks.map(
    (item) => `
      <tr>
        <td><div class="cell-title">${escapeHtml(item.label || item.id)}</div><div class="cell-sub">${escapeHtml(item.category || "-")}</div></td>
        <td>${statusMarkup(auditStatusLabel(item.status))}</td>
        <td><div class="cell-title">${escapeHtml(item.message || "-")}</div><div class="cell-sub">${escapeHtml(item.recommendation || "-")}</div></td>
      </tr>
    `
  );
  return `
    <section class="surface panel">
      <div class="section-head">
        <div>
          <h3>审计检查项</h3>
          <div class="panel-note">v0.10 是规则优先审计；需要上线后再核验 live robots、sitemap、Schema 和 AI 引擎收录。</div>
        </div>
      </div>
      ${tableMarkup(["检查项", "状态", "证据 / 建议"], rows, "暂无审计检查项。")}
    </section>
  `;
}
```

- [ ] **Step 4: Add recent audits renderer**

Add:

```js
function renderSiteAuditHistory(siteAudits = {}) {
  const rows = (siteAudits.items || []).slice(0, 5).map(
    (item) => `
      <tr>
        <td><div class="cell-title">${escapeHtml(item.product_name || "-")}</div><div class="cell-sub">${escapeHtml(item.website_url || "-")}</div></td>
        <td>${escapeHtml(item.target_market || "-")}</td>
        <td><strong>${escapeHtml(item.score ?? "-")}</strong></td>
        <td>${statusMarkup(auditStatusLabel(item.status))}</td>
        <td>${escapeHtml(item.summary?.generated_assets ?? 0)}</td>
      </tr>
    `
  );
  return `
    <section class="surface panel">
      <div class="section-head">
        <div>
          <h3>最近审计记录</h3>
          <div class="panel-note">保留最近站点 GEO 审计，便于比较输入和资产生成状态。</div>
        </div>
      </div>
      ${tableMarkup(["站点", "市场", "分数", "状态", "资产"], rows, "暂无站点审计记录。")}
    </section>
  `;
}
```

- [ ] **Step 5: Add asset previews renderer**

Add:

```js
function renderGeoAssetPreviews(assets = []) {
  const rows = (assets || []).slice(0, 6).map(
    (item) => `
      <article class="surface panel compact-panel">
        <div class="section-head">
          <div>
            <h4>${escapeHtml(assetLabel(item.asset_type))}</h4>
            <div class="panel-note">${escapeHtml(item.content_type || "-")}</div>
          </div>
        </div>
        <pre class="code-preview">${escapeHtml(item.content || "")}</pre>
      </article>
    `
  );
  return `
    <section class="surface panel">
      <div class="section-head">
        <div>
          <h3>GEO 资产</h3>
          <div class="panel-note">可复制到站点、CMS 或分发任务中的 llms.txt、JSON-LD、FAQ 和内容简报。</div>
        </div>
      </div>
      <div class="asset-preview-grid">
        ${rows.join("") || `<div class="empty-state">暂无 GEO 资产，请先运行审计并生成资产。</div>`}
      </div>
    </section>
  `;
}
```

If `compact-panel`, `code-preview`, or `asset-preview-grid` classes do not exist, either reuse existing classes or add minimal CSS to `prototype/styles.css` in Task 6.

- [ ] **Step 6: Insert renderers in `renderInternationalGeo()`**

Inside the page content after the top action/summary area, insert:

```js
${renderSiteAuditPanel(data)}
${renderSiteAuditChecks(data.site_audits?.latest || data.site_audits?.items?.[0] || {})}
${renderSiteAuditHistory(data.site_audits || {})}
${renderGeoAssetPreviews(data.geo_assets || [])}
```

Keep existing engine visibility, inclusion, prompt monitoring, content tasks, distribution plan, and audit checklist sections below.

- [ ] **Step 7: Run check**

Run:

```bash
npm run check
```

Expected: UI render tests should pass or reveal missing CSS/class issues.

### Task 6: Static Preview And Styling Compatibility

**Files:**
- Modify: `prototype/src/static-api.js`
- Modify: `prototype/styles.css` only if needed by Task 5

- [ ] **Step 1: Expand static International GEO response**

In `prototype/src/static-api.js`, extend the fallback `/international-geo` object with:

```js
site_audits: {
  items: [
    {
      id: "sga-static",
      website_url: "https://example.com",
      product_name: "GEO Pulse",
      target_market: "US",
      target_language: "en-US",
      primary_query: "best GEO platform for B2B teams",
      competitors: ["Semrush", "Ahrefs"],
      score: 82,
      status: "review",
      summary: { passed: 3, warnings: 6, failed: 0, blockers: 0, generated_assets: 2 },
      checks: [
        {
          id: "llms_txt",
          category: "ai_readability",
          label: "llms.txt",
          status: "warning",
          message: "Recommended to verify live /llms.txt.",
          recommendation: "Install a concise llms.txt file."
        }
      ],
      created_at: "2026-07-06T00:00:00.000Z"
    }
  ],
  latest: null
},
geo_assets: [
  {
    id: "asset-static",
    audit_id: "sga-static",
    asset_type: "llms_txt",
    title: "llms.txt",
    content: "# GEO Pulse\n\nStatic preview GEO asset.",
    content_type: "text/markdown",
    created_at: "2026-07-06T00:00:00.000Z"
  }
]
```

Set `latest` to the same audit object after creating the literal, or duplicate the object if simpler.

- [ ] **Step 2: Add CSS only if render looks broken**

If `code-preview` or asset previews render without existing styling, add minimal styles:

```css
.asset-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.code-preview {
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(5, 10, 20, 0.72);
  color: var(--text);
  font-size: 12px;
  line-height: 1.55;
}
```

Use existing CSS variables/classes if names differ; do not introduce a new color palette.

- [ ] **Step 3: Run check**

Run:

```bash
npm run check
```

Expected: `verify-mvp: OK` unless documentation still needs updates.

### Task 7: Documentation And Version Closeout

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/API_REFERENCE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/README.md`
- Create: `docs/STAGE_V0_10_CLOSEOUT.md`

- [ ] **Step 1: Bump version**

Set `package.json` version to:

```json
"version": "0.10.0"
```

- [ ] **Step 2: Add changelog section**

At the top of `CHANGELOG.md`, add:

```markdown
## 0.10.0 - 2026-07-06

Site GEO audit and asset generation.

### Added

- Rule-first International GEO site audit records with stable check ids, score, status, summary, and audit events.
- API routes for creating, listing, reading, and generating assets from site GEO audits.
- Copyable GEO asset previews for `llms.txt`, Organization JSON-LD, Product JSON-LD, FAQ JSON-LD, article briefs, and distribution briefs.
- International GEO UI workflow for site input -> audit -> checks -> generated assets.

### Boundaries

- v0.10 does not perform live crawling, real AI search engine querying, real SERP collection, or automatic third-party publishing.

### Verification

- `npm run check`
- Static SEO scan
- GitHub Actions `check`
```

- [ ] **Step 3: Update route docs**

In `docs/API_REFERENCE.md`, document:

```text
GET /api/v1/international-geo/site-audits
GET /api/v1/international-geo/site-audits/:id
POST /api/v1/international-geo/site-audits
POST /api/v1/international-geo/site-audits/:id/assets
```

State that mutation routes require editor/admin/owner session or `X-GEO-API-Key`.

- [ ] **Step 4: Update public docs**

Update README/current completed list and docs index with v0.10. Update architecture with new International GEO audit/asset records and API boundary. Update development/production docs to state v0.10 is rule-first and not live AI monitoring.

- [ ] **Step 5: Add `docs/STAGE_V0_10_CLOSEOUT.md`**

Create a closeout doc with:

```markdown
# v0.10 Stage Closeout

## Stage Result

GEO Pulse has reached the v0.10 site GEO audit and asset generation stage.

## What Is Included

- Site GEO audit input inside International GEO.
- Durable rule-first audit records.
- Stable checks for URL quality, AI crawler access recommendations, sitemap, llms.txt, JSON-LD, direct-answer content, fact density, E-E-A-T, and third-party validation.
- Generated assets for llms.txt, Organization JSON-LD, Product JSON-LD, FAQ JSON-LD, article brief, and distribution brief.
- API routes, audit events, local persistence, backup compatibility, and UI previews.

## Launch Boundary

Use v0.10 as a practical first-step GEO audit and asset preparation tool for one organization.

It is not live AI search monitoring and does not query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, SERP APIs, or external publishing platforms.

## Verification

\`\`\`bash
npm run check
node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .
\`\`\`

Expected:

\`\`\`text
verify-mvp: OK
Errors: 0
Warnings: 0
\`\`\`

## Closing Copy

GEO Pulse v0.10 turns International GEO into a usable site audit and asset generation workflow. Operators can enter a website and product context, create a rule-first GEO audit, inspect check-level recommendations, and generate copyable llms.txt, JSON-LD, FAQ, article, and distribution assets. The next stage should connect live site crawling and AI visibility monitoring before claiming real-time engine inclusion or recommendation tracking.
```

- [ ] **Step 6: Run check**

Run:

```bash
npm run check
node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

Expected: `verify-mvp: OK`, 0 SEO errors, 0 SEO warnings.

### Task 8: Browser Smoke, Final Verification, Commit, Push

**Files:**
- Modify only if smoke reveals defects.

- [ ] **Step 1: Run browser smoke**

Start server:

```bash
PORT=3106 GEO_ENABLE_PERSISTENCE=0 npm run start
```

Open:

```bash
$HOME/.codex/skills/playwright/scripts/playwright_cli.sh open 'http://localhost:3106/'
```

Smoke path:

1. Confirm login page renders.
2. Login as `owner` / `geo-owner-change-me`.
3. Navigate to International GEO.
4. Confirm "站点 GEO 审计" panel renders.
5. Fill URL/product/query if needed.
6. Click `运行站点审计`.
7. Confirm latest audit score/checks appear.
8. Click `生成 GEO 资产`.
9. Confirm `GEO 资产`, `llms.txt`, and JSON-LD previews appear.
10. Logout.
11. Stop server and remove `.playwright-cli`.

- [ ] **Step 2: Final local verification**

Run:

```bash
npm run check
node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .
git status --short
```

Expected:

- `verify-mvp: OK`
- SEO scan: 0 errors, 0 warnings
- Only intended v0.10 files changed

- [ ] **Step 3: Commit implementation**

Commit in scoped commits:

```bash
git add verify-mvp.mjs mock-data.mjs server.mjs prototype/src/api.js prototype/src/main.js prototype/src/events.js prototype/src/pages/international.js prototype/src/static-api.js prototype/styles.css
git commit -m "feat: add site geo audit assets"

git add package.json README.md CHANGELOG.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/README.md docs/STAGE_V0_10_CLOSEOUT.md
git commit -m "docs: close site geo audit v0.10"
```

If `prototype/styles.css` was not changed, omit it from the first `git add`.

- [ ] **Step 4: Push and confirm CI**

Run:

```bash
git push origin main
gh run list --limit 5
gh run watch <latest-run-id> --exit-status
```

Expected: GitHub Actions `check` completes with `success`.

## Self-Review

- Spec coverage: The plan covers site audit input, audit records, asset records, API, UI, audit events, persistence, RBAC, tests, docs, browser smoke, and CI.
- Placeholder scan: The plan contains no unresolved placeholder markers or vague future steps.
- Type consistency: Function names are consistent across data layer, server, API wrappers, and frontend actions:
  - `createInternationalGeoSiteAuditAction`
  - `generateInternationalGeoSiteAuditAssetsAction`
  - `getInternationalGeoSiteAudit`
  - `listInternationalGeoSiteAudits`
  - `createInternationalGeoSiteAudit`
  - `generateInternationalGeoSiteAuditAssets`
