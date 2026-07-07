# Evidence-Driven Assets v0.14 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic International GEO workflow that turns audit evidence and AI visibility gaps into reviewable local GEO asset opportunities, queue items, generated previews, and approve/reject review state.

**Architecture:** Extend the existing local mock-state model in `mock-data.mjs` with derived opportunity generation, queue records, evidence-backed asset previews, and review actions. Expose narrow `/api/v1/international-geo/evidence-assets` routes, wire them into the existing prototype action layer, and render compact dense-admin panels inside the current International GEO page.

**Tech Stack:** Node.js ESM, local JSON/mock state, built-in HTTP server, vanilla JS prototype UI, `verify-mvp.mjs`, `npm run check`.

---

## File Map

- Modify `verify-mvp.mjs`: add red tests for mock data, HTTP RBAC, client API wiring, event wiring, and International GEO UI rendering.
- Modify `mock-data.mjs`: add evidence asset arrays to International GEO state, derive opportunities, generate queue/assets, review assets, and expose read helpers.
- Modify `server.mjs`: import new mock-data actions and add five evidence asset API routes.
- Modify `prototype/src/api.js`: add evidence asset client API methods.
- Modify `prototype/src/main.js`: import client API methods and expose browser actions for generate/review.
- Modify `prototype/src/events.js`: wire `data-action` handlers for generate, approve, and reject.
- Modify `prototype/src/pages/international.js`: render opportunity, queue, and provenance metadata panels.
- Modify `prototype/src/static-api.js` or `prototype/src/static-routes.js` only if `npm run check` shows static preview lacks seeded evidence asset data.
- Modify docs/version files: `package.json`, `package-lock.json` if present and versioned, `CHANGELOG.md`, `README.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PHASE_2_ROADMAP.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/OPEN_SOURCE_RELEASE.md`, `docs/README.md`, `docs/MAINTENANCE.md`.
- Create `docs/STAGE_V0_14_CLOSEOUT.md`.

## Task 1: Red Tests For v0.14 Contracts

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add imports for new data actions**

Add these names to the existing import list from `./mock-data.mjs`:

```js
  generateInternationalGeoEvidenceAssetsAction,
  getInternationalGeoEvidenceAssetsState,
  reviewInternationalGeoEvidenceAssetAction,
```

- [ ] **Step 2: Add mock-data assertions after the existing visibility run assertions**

Place this block after the `visibilityRun` assertions in the International GEO section:

```js
  const evidenceAssetsInitial = getInternationalGeoEvidenceAssetsState();
  assert.ok(evidenceAssetsInitial.summary, "Evidence asset state should expose a summary");
  assert.ok(Array.isArray(evidenceAssetsInitial.opportunities), "Evidence asset state should expose opportunities");
  assert.ok(Array.isArray(evidenceAssetsInitial.queue), "Evidence asset state should expose queue items");
  assert.ok(Array.isArray(evidenceAssetsInitial.assets), "Evidence asset state should expose generated assets");

  const evidenceAssetsGenerated = generateInternationalGeoEvidenceAssetsAction();
  assert.ok(
    evidenceAssetsGenerated.opportunities.some((item) => item.source_type === "score_deduction"),
    "Evidence opportunities should include site audit scoring deductions"
  );
  assert.ok(
    evidenceAssetsGenerated.opportunities.some((item) => item.source_type === "visibility_gap"),
    "Evidence opportunities should include AI visibility gaps"
  );
  const generatedAssetTypes = new Set(evidenceAssetsGenerated.assets.map((item) => item.asset_type));
  [
    "llms_txt_update",
    "json_ld_patch",
    "faq_block",
    "comparison_brief",
    "definition_brief",
    "product_spec_brief"
  ].forEach((assetType) => {
    assert.ok(generatedAssetTypes.has(assetType), `Generated evidence assets should include ${assetType}`);
  });
  assert.ok(
    evidenceAssetsGenerated.assets.every(
      (item) => item.evidence_source_type && item.evidence_source_id && item.evidence_summary && item.confidence
    ),
    "Every generated evidence asset should expose provenance and confidence"
  );

  const assetToApprove = evidenceAssetsGenerated.assets[0];
  const approvedAsset = reviewInternationalGeoEvidenceAssetAction(assetToApprove.id, { action: "approve" });
  assert.equal(approvedAsset.review_status, "approved", "Evidence asset review should approve assets");
  const assetToReject = evidenceAssetsGenerated.assets.find((item) => item.id !== assetToApprove.id);
  const rejectedAsset = reviewInternationalGeoEvidenceAssetAction(assetToReject.id, {
    action: "reject",
    human_notes: "Needs stronger source proof."
  });
  assert.equal(rejectedAsset.review_status, "rejected", "Evidence asset review should reject assets");
  assert.throws(
    () => reviewInternationalGeoEvidenceAssetAction(assetToApprove.id, { action: "publish" }),
    /VALIDATION_ERROR/,
    "Invalid evidence asset review actions should be rejected"
  );
  assert.equal(
    reviewInternationalGeoEvidenceAssetAction("missing_evidence_asset", { action: "approve" }),
    null,
    "Unknown evidence asset ids should return null"
  );
```

- [ ] **Step 3: Add frontend source wiring assertions near the existing International GEO visibility source checks**

Add these assertions near the existing `international-visibility-run` source checks:

```js
  assert.match(
    apiSource,
    /export function getInternationalGeoEvidenceAssets\(\)/,
    "International GEO evidence assets should have a read client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoEvidenceAssets\(\)/,
    "International GEO evidence assets should have a generate client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoEvidenceAsset\(assetId, payload = \{\}\)/,
    "International GEO evidence assets should have a review client API method"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoEvidenceAssets as generateInternationalGeoEvidenceAssetsApi/,
    "International GEO evidence asset generation should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-evidence-assets-generate"/,
    "International GEO evidence asset generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-evidence-asset-approve"/,
    "International GEO evidence asset approval should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-evidence-asset-reject"/,
    "International GEO evidence asset rejection should be wired in the event dispatcher"
  );
```

- [ ] **Step 4: Add UI assertions to the International GEO render test**

Add these assertions after existing `GEO 资产` assertions:

```js
  assert.match(siteAuditHtml, /证据驱动内容机会/, "International GEO page should render evidence opportunities");
  assert.match(siteAuditHtml, /资产生成队列/, "International GEO page should render the evidence asset queue");
  assert.match(siteAuditHtml, /证据来源/, "International GEO assets should render provenance metadata");
  assert.match(siteAuditHtml, /审核通过/, "International GEO evidence assets should expose approve action");
  assert.match(siteAuditHtml, /驳回/, "International GEO evidence assets should expose reject action");
```

- [ ] **Step 5: Add HTTP RBAC assertions near the existing International GEO HTTP tests**

Place after the visibility HTTP checks and before legacy artifact checks:

```js
    const viewerEvidenceAssets = await httpRequest(port, "/api/v1/international-geo/evidence-assets", {
      headers: viewerHeaders
    });
    assert.equal(viewerEvidenceAssets.status, 200, "Viewer should read International GEO evidence assets");
    assert.ok(
      viewerEvidenceAssets.body?.data?.summary,
      "Evidence assets HTTP response should include a summary"
    );

    const viewerGenerateEvidenceAssets = await httpRequest(port, "/api/v1/international-geo/evidence-assets/generate", {
      method: "POST",
      headers: viewerHeaders
    });
    assert.equal(viewerGenerateEvidenceAssets.status, 403, "Viewer should not generate evidence assets");

    const ownerGenerateEvidenceAssets = await httpRequest(port, "/api/v1/international-geo/evidence-assets/generate", {
      method: "POST",
      headers: ownerHeaders
    });
    assert.equal(ownerGenerateEvidenceAssets.status, 201, "Owner should generate evidence assets");
    assert.ok(
      ownerGenerateEvidenceAssets.body?.data?.assets?.length >= 6,
      "Owner evidence asset generation should return generated assets"
    );

    const generatedEvidenceAssetId = ownerGenerateEvidenceAssets.body.data.assets[0].id;
    const viewerReviewEvidenceAsset = await httpRequest(
      port,
      `/api/v1/international-geo/evidence-assets/${generatedEvidenceAssetId}/review`,
      {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(viewerReviewEvidenceAsset.status, 403, "Viewer should not review evidence assets");

    const ownerReviewEvidenceAsset = await httpRequest(
      port,
      `/api/v1/international-geo/evidence-assets/${generatedEvidenceAssetId}/review`,
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(ownerReviewEvidenceAsset.status, 200, "Owner should review evidence assets");
    assert.equal(ownerReviewEvidenceAsset.body?.data?.review_status, "approved");

    const invalidEvidenceAssetReview = await httpRequest(
      port,
      `/api/v1/international-geo/evidence-assets/${generatedEvidenceAssetId}/review`,
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({ action: "publish" })
      }
    );
    assert.equal(invalidEvidenceAssetReview.status, 400, "Invalid evidence asset review should fail");
```

- [ ] **Step 6: Run tests and confirm red**

Run:

```bash
npm run check
```

Expected: FAIL with missing exports such as `generateInternationalGeoEvidenceAssetsAction` or missing API/UI strings.

- [ ] **Step 7: Commit red tests**

```bash
git add verify-mvp.mjs
git commit -m "test: specify evidence driven assets v0.14"
```

## Task 2: Evidence Asset Data Model And Actions

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Extend International GEO state shape**

Inside `ensureInternationalGeoStateShape()`, after the `geo_assets` array guard, add:

```js
  if (!Array.isArray(internationalGeoState.asset_opportunities)) {
    internationalGeoState.asset_opportunities = [];
  }
  if (!Array.isArray(internationalGeoState.asset_generation_queue)) {
    internationalGeoState.asset_generation_queue = [];
  }
```

- [ ] **Step 2: Add evidence asset helper constants and summary builder after `jsonLdAsset()`**

```js
const EVIDENCE_ASSET_TYPE_BY_CHECK = {
  llms_txt: "llms_txt_update",
  json_ld: "json_ld_patch",
  direct_answer: "definition_brief",
  fact_density: "product_spec_brief",
  eeat: "buyer_guide_brief",
  third_party_validation: "comparison_brief",
  robots_ai_access: "buyer_guide_brief",
  sitemap: "definition_brief",
  url_quality: "definition_brief"
};

const EVIDENCE_ASSET_TYPES = [
  "llms_txt_update",
  "json_ld_patch",
  "faq_block",
  "comparison_brief",
  "alternatives_brief",
  "definition_brief",
  "product_spec_brief",
  "buyer_guide_brief"
];

function evidenceAssetsSummary() {
  const queue = internationalGeoState.asset_generation_queue || [];
  const assets = (internationalGeoState.geo_assets || []).filter((item) => item.opportunity_id || item.queue_item_id);
  return {
    opportunity_count: (internationalGeoState.asset_opportunities || []).length,
    queued_count: queue.filter((item) => item.status === "queued").length,
    generated_count: queue.filter((item) => ["generated", "approved", "rejected"].includes(item.status)).length,
    approved_count: assets.filter((item) => item.review_status === "approved").length,
    rejected_count: assets.filter((item) => item.review_status === "rejected").length
  };
}
```

- [ ] **Step 3: Add opportunity derivation helpers after the constants**

```js
function latestInternationalGeoAudit() {
  ensureInternationalGeoStateShape();
  return internationalGeoState.site_audits.latest || internationalGeoState.site_audits.items[0] || null;
}

function opportunityId(sourceType, sourceId, assetType) {
  return `geoopp_${sourceType}_${sourceId}_${assetType}`.replace(/[^a-zA-Z0-9_]+/g, "_");
}

function makeEvidenceOpportunity(patch = {}) {
  const input = internationalGeoState.input || {};
  return {
    id: patch.id,
    source_type: patch.source_type,
    source_id: patch.source_id,
    source_label: patch.source_label || patch.source_id,
    severity: patch.severity || patch.priority || "medium",
    priority: patch.priority || patch.severity || "medium",
    confidence: patch.confidence || "medium",
    market: patch.market || input.target_market || "Global",
    language: patch.language || input.target_language || "en",
    target_url: patch.target_url || input.website_url || "",
    target_prompt: patch.target_prompt || input.primary_query || "",
    asset_type: patch.asset_type,
    title: patch.title,
    reason: patch.reason,
    evidence_summary: patch.evidence_summary,
    recommended_action: patch.recommended_action,
    status: patch.status || "open",
    created_at: patch.created_at || nowIso()
  };
}

function deriveScoreDeductionOpportunities(audit) {
  if (!audit) return [];
  return (audit.checks || [])
    .filter((check) => ["high", "medium"].includes(check.priority) && Number(check.score_deduction || 0) > 0)
    .map((check) =>
      makeEvidenceOpportunity({
        id: opportunityId("score_deduction", `${audit.id}_${check.id}`, EVIDENCE_ASSET_TYPE_BY_CHECK[check.id] || "definition_brief"),
        source_type: "score_deduction",
        source_id: `${audit.id}:${check.id}`,
        source_label: check.label || check.id,
        severity: check.priority,
        priority: check.priority,
        confidence: check.confidence || "medium",
        market: audit.target_market,
        language: audit.target_language,
        target_url: audit.website_url,
        target_prompt: audit.primary_query,
        asset_type: EVIDENCE_ASSET_TYPE_BY_CHECK[check.id] || "definition_brief",
        title: `${check.label || check.id} evidence asset`,
        reason: check.deduction_reasons?.[0] || check.message || "Audit scoring found a GEO readiness gap.",
        evidence_summary: `Audit check ${check.id} awarded ${check.score_awarded}/${check.score_weight} points.`,
        recommended_action: check.next_actions?.[0] || check.recommendation || "Generate and review a local GEO asset."
      })
    );
}
```

- [ ] **Step 4: Add crawl, visibility, and fallback opportunity derivation**

```js
function deriveCrawlEvidenceOpportunities(audit) {
  const resources = audit?.crawl_evidence?.resources || {};
  const opportunities = [];
  const homepage = resources.homepage;
  const robots = resources.robots_txt;
  const sitemap = resources.sitemap_xml;
  const llms = resources.llms_txt;

  if (llms && (!llms.ok || !String(llms.text_excerpt || "").trim())) {
    opportunities.push(
      makeEvidenceOpportunity({
        id: opportunityId("crawl_evidence", `${audit.id}_llms_txt`, "llms_txt_update"),
        source_type: "crawl_evidence",
        source_id: `${audit.id}:llms_txt`,
        source_label: "llms.txt",
        severity: "high",
        priority: "high",
        confidence: "high",
        market: audit.target_market,
        language: audit.target_language,
        target_url: audit.website_url,
        target_prompt: audit.primary_query,
        asset_type: "llms_txt_update",
        title: "Create or refresh /llms.txt from crawl evidence",
        reason: "/llms.txt is unavailable or empty in crawl evidence.",
        evidence_summary: llms.text_excerpt || llms.error_code || "llms.txt was unavailable.",
        recommended_action: "Generate a concise llms.txt update and review it before publishing."
      })
    );
  }

  if (homepage && (!Array.isArray(homepage.json_ld_types) || homepage.json_ld_types.length === 0)) {
    opportunities.push(
      makeEvidenceOpportunity({
        id: opportunityId("crawl_evidence", `${audit.id}_homepage_json_ld`, "json_ld_patch"),
        source_type: "crawl_evidence",
        source_id: `${audit.id}:homepage_json_ld`,
        source_label: "Homepage JSON-LD",
        severity: "high",
        priority: "high",
        confidence: "high",
        market: audit.target_market,
        language: audit.target_language,
        target_url: audit.website_url,
        target_prompt: audit.primary_query,
        asset_type: "json_ld_patch",
        title: "Add homepage entity JSON-LD",
        reason: "Homepage crawl did not expose supported JSON-LD types.",
        evidence_summary: homepage.text_excerpt || "Homepage had no detected JSON-LD types.",
        recommended_action: "Generate conservative Organization/Product/FAQ JSON-LD for review."
      })
    );
  }

  if (sitemap && Number(sitemap.url_count || 0) === 0) {
    opportunities.push(
      makeEvidenceOpportunity({
        id: opportunityId("crawl_evidence", `${audit.id}_sitemap`, "definition_brief"),
        source_type: "crawl_evidence",
        source_id: `${audit.id}:sitemap_xml`,
        source_label: "sitemap.xml",
        severity: "medium",
        priority: "medium",
        confidence: "high",
        market: audit.target_market,
        language: audit.target_language,
        target_url: audit.website_url,
        target_prompt: audit.primary_query,
        asset_type: "definition_brief",
        title: "Create canonical GEO content map",
        reason: "Sitemap evidence contains zero URLs.",
        evidence_summary: sitemap.error_code || "sitemap.xml had zero detected URLs.",
        recommended_action: "Plan definition and FAQ pages before sitemap submission."
      })
    );
  }

  if (robots && (!Array.isArray(robots.mentioned_bots) || robots.mentioned_bots.length === 0)) {
    opportunities.push(
      makeEvidenceOpportunity({
        id: opportunityId("crawl_evidence", `${audit.id}_robots`, "buyer_guide_brief"),
        source_type: "crawl_evidence",
        source_id: `${audit.id}:robots_txt`,
        source_label: "robots.txt",
        severity: "medium",
        priority: "medium",
        confidence: "high",
        market: audit.target_market,
        language: audit.target_language,
        target_url: audit.website_url,
        target_prompt: audit.primary_query,
        asset_type: "buyer_guide_brief",
        title: "Document AI crawler access policy",
        reason: "robots.txt evidence has no known AI/search crawler mentions.",
        evidence_summary: robots.text_excerpt || robots.error_code || "No relevant bot mentions detected.",
        recommended_action: "Create a buyer-facing trust note and update crawler policy separately."
      })
    );
  }

  return opportunities;
}

function assetTypeForPromptSet(promptSet = {}) {
  const text = `${promptSet.buyer_intent || ""} ${promptSet.prompt || ""}`.toLowerCase();
  if (text.includes("alternative")) return "alternatives_brief";
  if (text.includes("compare") || text.includes("comparison") || text.includes("best")) return "comparison_brief";
  if (text.includes("deploy") || text.includes("security") || text.includes("pricing") || text.includes("support")) return "faq_block";
  if (text.includes("spec") || text.includes("criteria")) return "product_spec_brief";
  return "definition_brief";
}

function deriveVisibilityGapOpportunities() {
  const snapshots = internationalGeoState.visibility_snapshots || [];
  const promptSets = internationalGeoState.visibility_prompt_sets || [];
  const opportunities = [];

  snapshots
    .filter((snapshot) => snapshot.data_status === "unavailable")
    .forEach((snapshot) => {
      opportunities.push(
        makeEvidenceOpportunity({
          id: opportunityId("visibility_gap", snapshot.id, assetTypeForPromptSet(snapshot)),
          source_type: "visibility_gap",
          source_id: snapshot.id,
          source_label: snapshot.engine_label || snapshot.engine_id || "AI visibility snapshot",
          severity: "medium",
          priority: "medium",
          confidence: "medium",
          market: snapshot.market,
          language: snapshot.language,
          target_url: snapshot.target_url,
          target_prompt: snapshot.prompt,
          asset_type: assetTypeForPromptSet(snapshot),
          title: `Prepare citation-ready source for ${snapshot.engine_label || snapshot.engine_id}`,
          reason: "Visibility snapshot is unavailable because no approved provider evidence is configured.",
          evidence_summary: "This gap does not mean the brand was mentioned, cited, ranked, or recommended.",
          recommended_action: "Generate a reviewable asset for future AI visibility measurement."
        })
      );
    });

  promptSets
    .filter((promptSet) => !snapshots.some((snapshot) => snapshot.prompt_set_id === promptSet.id))
    .forEach((promptSet) => {
      opportunities.push(
        makeEvidenceOpportunity({
          id: opportunityId("visibility_gap", promptSet.id, assetTypeForPromptSet(promptSet)),
          source_type: "visibility_gap",
          source_id: promptSet.id,
          source_label: "Prompt set without snapshots",
          severity: "medium",
          priority: "medium",
          confidence: "low",
          market: promptSet.market,
          language: promptSet.language,
          target_url: promptSet.target_url,
          target_prompt: promptSet.prompt,
          asset_type: assetTypeForPromptSet(promptSet),
          title: `Prepare source asset for: ${promptSet.prompt}`,
          reason: "Prompt set exists but no measurement snapshot has been created.",
          evidence_summary: "Local prompt configuration needs a citation-ready owned source before future measurement.",
          recommended_action: "Generate a brief or FAQ block for human review."
        })
      );
    });

  return opportunities;
}

function deriveRuleFirstOpportunities() {
  const input = internationalGeoState.input || {};
  return ["llms_txt_update", "json_ld_patch", "faq_block", "definition_brief"].map((assetType) =>
    makeEvidenceOpportunity({
      id: opportunityId("rule_first", assetType, assetType),
      source_type: "rule_first",
      source_id: `rule_first:${assetType}`,
      source_label: "Rule-first International GEO input",
      severity: "medium",
      priority: "medium",
      confidence: "low",
      market: input.target_market || "Global",
      language: input.target_language || "en",
      target_url: input.website_url || "",
      target_prompt: input.primary_query || "",
      asset_type: assetType,
      title: `Rule-first ${assetType.replace(/_/g, " ")}`,
      reason: "No scored audit or visibility evidence is available yet.",
      evidence_summary: "Generated from local International GEO input only.",
      recommended_action: "Run a site audit and visibility measurement before production use."
    })
  );
}
```

- [ ] **Step 5: Add deterministic asset content generator**

```js
function evidenceAssetContent(opportunity = {}) {
  const input = internationalGeoState.input || {};
  const productName = input.product_name || "Review product name";
  const targetUrl = opportunity.target_url || input.website_url || "Review canonical URL";
  const prompt = opportunity.target_prompt || input.primary_query || "Review primary buyer query";
  const competitors = normalizeStringArray(input.competitors).join(", ") || "category alternatives";
  const evidenceNote = `Evidence note: ${opportunity.evidence_summary}`;

  if (opportunity.asset_type === "llms_txt_update") {
    return `# ${productName}\n\n${productName} serves ${opportunity.market || "global"} buyers researching ${prompt}.\n\nOfficial site: ${targetUrl}\nLanguage: ${opportunity.language || "en"}\n\n## Core topics\n- Generative Engine Optimization\n- AI search visibility\n- Structured product facts\n- Citation-ready content\n\n## Suggested pages\n- ${targetUrl}\n- ${targetUrl}/faq\n- ${targetUrl}/compare\n\n## Competitor context\n${competitors}\n\n${evidenceNote}\n`;
  }

  if (opportunity.asset_type === "json_ld_patch") {
    return jsonLdAsset("SoftwareApplication", {
      name: productName,
      url: targetUrl,
      applicationCategory: "Generative Engine Optimization",
      description: "Review and replace with approved product description",
      audience: opportunity.market || "Global buyers"
    });
  }

  if (opportunity.asset_type === "faq_block") {
    return `## FAQ\n\n### What does ${productName} help buyers evaluate?\n${productName} helps buyers evaluate ${prompt}. ${evidenceNote}\n\n### Is this AI visibility data externally measured?\nNo. This asset is a local preparation draft until an approved provider supplies evidence.\n\n### What proof should be added before publishing?\nAdd approved product facts, customer proof, pricing caveats, security details, and source links.\n\n### How should this be reviewed?\nConfirm the claim, source, schema, and canonical URL before use.\n`;
  }

  if (opportunity.asset_type === "comparison_brief") {
    return `# Comparison brief: ${prompt}\n\n## Direct answer\nUse this page to compare ${productName} with ${competitors} using verifiable criteria.\n\n## Criteria\n- AI search visibility workflow\n- llms.txt and JSON-LD readiness\n- Evidence and citation support\n- Review and governance controls\n\n## Proof needed\n- Product screenshots or docs\n- Public pricing or packaging notes\n- Customer, partner, or third-party proof\n\n## Table outline\n| Criteria | ${productName} | Alternatives | Evidence needed |\n| --- | --- | --- | --- |\n| AI visibility workflow | Review | Review | Source link |\n\n${evidenceNote}\n`;
  }

  if (opportunity.asset_type === "alternatives_brief") {
    return `# Alternatives brief: ${prompt}\n\n## Direct answer\nThis asset should explain alternatives without claiming competitors are inferior unless approved evidence supports it.\n\n## Structure\n- Category definition\n- Buyer use cases\n- Evaluation criteria\n- Alternative shortlist policy\n- Evidence checklist\n\n${evidenceNote}\n`;
  }

  if (opportunity.asset_type === "product_spec_brief") {
    return `# Product spec brief: ${productName}\n\n## Facts to collect\n- Deployment model\n- Integrations\n- Security and compliance\n- Support and onboarding\n- Pricing caveats\n- Measurable outcomes\n\n## Source requirements\nEach fact needs an approved internal or public source before publishing.\n\n${evidenceNote}\n`;
  }

  if (opportunity.asset_type === "buyer_guide_brief") {
    return `# Buyer guide brief: ${prompt}\n\n## Evaluation criteria\n- Business fit\n- Data access and crawler policy\n- Governance and review workflow\n- Proof quality\n- Implementation risk\n\n## Risk questions\n- Which claims are sourced?\n- Which crawler policies are intentional?\n- Which pages are canonical?\n\n${evidenceNote}\n`;
  }

  return `# Definition brief: ${prompt}\n\n## Direct answer\nDefine the category and explain where ${productName} fits for ${opportunity.market || "global"} buyers.\n\n## Page requirements\n- Direct answer in the first 100 words\n- Entity definition\n- Use cases\n- FAQ candidates\n- Organization/Product/FAQPage schema recommendation\n\n${evidenceNote}\n`;
}
```

- [ ] **Step 6: Add exported read, generate, and review actions before `saveInternationalGeoInputAction()`**

```js
export function getInternationalGeoEvidenceAssetsState() {
  ensureInternationalGeoStateShape();
  return deepClone({
    summary: evidenceAssetsSummary(),
    opportunities: internationalGeoState.asset_opportunities || [],
    queue: internationalGeoState.asset_generation_queue || [],
    assets: (internationalGeoState.geo_assets || []).filter((item) => item.opportunity_id || item.queue_item_id)
  });
}

export function generateInternationalGeoEvidenceAssetsAction() {
  ensureInternationalGeoStateShape();
  const audit = latestInternationalGeoAudit();
  let opportunities = [
    ...deriveScoreDeductionOpportunities(audit),
    ...deriveCrawlEvidenceOpportunities(audit),
    ...deriveVisibilityGapOpportunities()
  ];

  if (opportunities.length === 0) {
    opportunities = deriveRuleFirstOpportunities();
  }

  const seen = new Set();
  opportunities = opportunities.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const byType = new Map(opportunities.map((item) => [item.asset_type, item]));
  EVIDENCE_ASSET_TYPES.forEach((assetType) => {
    if (!byType.has(assetType)) {
      const fallback = deriveRuleFirstOpportunities().find((item) => item.asset_type === assetType);
      if (fallback) opportunities.push(fallback);
    }
  });

  const createdAt = nowIso();
  const queueItems = opportunities.map((opportunity) => ({
    id: uniqueId("geoqueue"),
    opportunity_id: opportunity.id,
    asset_type: opportunity.asset_type,
    title: opportunity.title,
    status: "generated",
    review_status: "pending_review",
    source_type: opportunity.source_type,
    source_id: opportunity.source_id,
    assigned_to: "",
    queued_at: createdAt,
    generated_at: createdAt,
    reviewed_at: null
  }));
  const assets = opportunities.map((opportunity, index) => ({
    id: uniqueId("geoasset"),
    queue_item_id: queueItems[index].id,
    opportunity_id: opportunity.id,
    asset_type: opportunity.asset_type,
    title: opportunity.title,
    content_type: opportunity.asset_type === "json_ld_patch" ? "application/ld+json" : "text/markdown",
    content: evidenceAssetContent(opportunity),
    evidence_source_type: opportunity.source_type,
    evidence_source_id: opportunity.source_id,
    evidence_summary: opportunity.evidence_summary,
    confidence: opportunity.confidence,
    review_status: "pending_review",
    human_notes: "",
    created_at: createdAt,
    reviewed_at: null
  }));

  const assetIds = new Set(assets.map((item) => item.id));
  internationalGeoState.asset_opportunities = opportunities;
  internationalGeoState.asset_generation_queue = queueItems;
  internationalGeoState.geo_assets = [
    ...assets,
    ...(internationalGeoState.geo_assets || []).filter((item) => !(item.opportunity_id || item.queue_item_id) && !assetIds.has(item.id))
  ];
  internationalGeoState.updated_at = createdAt;
  recordAuditEvent("international_geo.evidence_assets.generate", "international_geo", "evidence_assets", {
    opportunity_count: opportunities.length,
    asset_count: assets.length
  });
  persistState();
  return getInternationalGeoEvidenceAssetsState();
}

export function reviewInternationalGeoEvidenceAssetAction(assetId, payload = {}) {
  ensureInternationalGeoStateShape();
  const action = String(payload.action || "").trim();
  if (!["approve", "reject"].includes(action)) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  const asset = (internationalGeoState.geo_assets || []).find((item) => item.id === assetId && (item.opportunity_id || item.queue_item_id));
  if (!asset) return null;
  const reviewStatus = action === "approve" ? "approved" : "rejected";
  const reviewedAt = nowIso();
  asset.review_status = reviewStatus;
  asset.human_notes = String(payload.human_notes || asset.human_notes || "").trim();
  asset.reviewed_at = reviewedAt;
  const queueItem = (internationalGeoState.asset_generation_queue || []).find((item) => item.id === asset.queue_item_id);
  if (queueItem) {
    queueItem.status = reviewStatus;
    queueItem.review_status = reviewStatus;
    queueItem.reviewed_at = reviewedAt;
  }
  recordAuditEvent("international_geo.evidence_asset.review", "international_geo_evidence_asset", asset.id, {
    review_status: reviewStatus
  });
  persistState();
  return deepClone(asset);
}
```

- [ ] **Step 7: Include evidence state in `getInternationalGeoState()`**

Change `getInternationalGeoState()` to add:

```js
  state.evidence_assets = getInternationalGeoEvidenceAssetsState();
```

Keep it after `state.visibility = getInternationalGeoVisibilityState();`.

- [ ] **Step 8: Run tests**

Run:

```bash
npm run check
```

Expected: mock-data assertions pass farther than Task 1, then fail on missing HTTP routes or frontend wiring.

- [ ] **Step 9: Commit data model**

```bash
git add mock-data.mjs
git commit -m "feat: add evidence driven geo asset state"
```

## Task 3: HTTP Evidence Asset Routes

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Add imports**

Add these names to the destructuring import from `mock-data.mjs`:

```js
  generateInternationalGeoEvidenceAssetsAction,
  getInternationalGeoEvidenceAssetsState,
  reviewInternationalGeoEvidenceAssetAction,
```

- [ ] **Step 2: Add read routes after `/international-geo/visibility` routes**

```js
  if (req.method === "GET" && pathname === "/international-geo/evidence-assets") {
    sendJson(res, 200, ok(getInternationalGeoEvidenceAssetsState()));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/evidence-assets/opportunities") {
    sendJson(res, 200, ok({ items: getInternationalGeoEvidenceAssetsState().opportunities }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/evidence-assets/queue") {
    sendJson(res, 200, ok({ items: getInternationalGeoEvidenceAssetsState().queue }));
    return;
  }
```

- [ ] **Step 3: Add generate route**

```js
  if (req.method === "POST" && pathname === "/international-geo/evidence-assets/generate") {
    sendJson(res, 201, ok(generateInternationalGeoEvidenceAssetsAction()));
    return;
  }
```

- [ ] **Step 4: Add review route with validation handling**

```js
  if (req.method === "POST" && pathname.match(/^\/international-geo\/evidence-assets\/[^/]+\/review$/)) {
    const id = pathname.split("/")[3];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoEvidenceAssetAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Evidence asset not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        sendJson(res, 400, error("VALIDATION_ERROR", "Review action must be approve or reject").body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 5: Verify RBAC uses existing route policy**

Run:

```bash
npm run check
```

Expected: HTTP evidence route assertions pass. If a write route returns `200` for viewer, add the route pattern to the existing authorization/write guard list using the same policy applied to `/international-geo/visibility/run` and `/international-geo/site-audits`.

- [ ] **Step 6: Commit routes**

```bash
git add server.mjs
git commit -m "feat: expose evidence driven geo asset api"
```

## Task 4: Frontend API And Actions

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add client API methods after `runInternationalGeoVisibilityMeasurement()`**

```js
export function getInternationalGeoEvidenceAssets() {
  return request("/api/v1/international-geo/evidence-assets");
}

export function generateInternationalGeoEvidenceAssets() {
  return requestJson("/api/v1/international-geo/evidence-assets/generate", "POST", {});
}

export function reviewInternationalGeoEvidenceAsset(assetId, payload = {}) {
  return requestJson(`/api/v1/international-geo/evidence-assets/${encodeURIComponent(assetId)}/review`, "POST", payload);
}
```

- [ ] **Step 2: Import frontend API methods in `prototype/src/main.js`**

Add these aliases to the existing API import list:

```js
  generateInternationalGeoEvidenceAssets as generateInternationalGeoEvidenceAssetsApi,
  reviewInternationalGeoEvidenceAsset as reviewInternationalGeoEvidenceAssetApi,
```

- [ ] **Step 3: Add browser actions near existing International GEO actions**

Add these methods inside the exported actions object:

```js
  async generateInternationalGeoEvidenceAssets() {
    await generateInternationalGeoEvidenceAssetsApi();
    await this.loadPage("international");
  },

  async reviewInternationalGeoEvidenceAsset(assetId, action) {
    if (!assetId) return;
    await reviewInternationalGeoEvidenceAssetApi(assetId, { action });
    await this.loadPage("international");
  },
```

- [ ] **Step 4: Wire events in `prototype/src/events.js`**

Add these branches near the existing `international-visibility-run` branch:

```js
    if (action === "international-evidence-assets-generate") {
      await actions.generateInternationalGeoEvidenceAssets();
      return;
    }

    if (action === "international-evidence-asset-approve") {
      await actions.reviewInternationalGeoEvidenceAsset(target.dataset.assetId, "approve");
      return;
    }

    if (action === "international-evidence-asset-reject") {
      await actions.reviewInternationalGeoEvidenceAsset(target.dataset.assetId, "reject");
      return;
    }
```

- [ ] **Step 5: Run tests**

```bash
npm run check
```

Expected: frontend source wiring assertions pass; UI assertions may still fail until Task 5.

- [ ] **Step 6: Commit frontend wiring**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire evidence asset actions"
```

## Task 5: International GEO UI Panels

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add label helpers near existing label helpers**

```js
function evidenceSourceLabel(value) {
  return (
    {
      score_deduction: "评分扣分",
      crawl_evidence: "抓取证据",
      visibility_gap: "可见度缺口",
      rule_first: "规则优先"
    }[value] || value || "-"
  );
}

function reviewStatusLabel(value) {
  return (
    {
      pending_review: "待审核",
      approved: "已通过",
      rejected: "已驳回"
    }[value] || value || "-"
  );
}
```

- [ ] **Step 2: Add opportunities panel before `renderGeoAssetPreviews()`**

```js
function renderEvidenceOpportunitiesPanel(evidenceAssets = {}) {
  const opportunities = evidenceAssets.opportunities || [];
  const rows = opportunities.length
    ? opportunities.slice(0, 8).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.reason || "-")}</div>
            </td>
            <td>${statusMarkup(evidenceSourceLabel(item.source_type))}</td>
            <td>${statusMarkup(priorityLabel(item.priority))}</td>
            <td>${escapeHtml(assetLabel(item.asset_type))}</td>
            <td>
              <div class="cell-title">${escapeHtml(item.evidence_summary || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.recommended_action || "-")}</div>
            </td>
            <td>${statusMarkup(item.status || "open")}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无证据驱动内容机会。运行站点审计、可见度测量或点击生成证据资产。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="evidence-opportunities">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">证据驱动内容机会</h3>
          <div class="panel-note">从评分扣分、抓取证据、AI 可见度缺口和规则输入生成的下一步资产建议。</div>
        </div>
        <button class="secondary-btn" data-action="international-evidence-assets-generate">生成证据资产</button>
      </div>
      ${tableMarkup(["机会", "来源", "优先级", "资产类型", "证据 / 动作", "状态"], rows)}
    </section>
  `;
}
```

- [ ] **Step 3: Add queue panel**

```js
function renderEvidenceAssetQueuePanel(evidenceAssets = {}) {
  const queue = evidenceAssets.queue || [];
  const rows = queue.length
    ? queue.slice(0, 8).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || item.id)}</div>
              <div class="cell-sub">${escapeHtml(item.id)}</div>
            </td>
            <td>${escapeHtml(assetLabel(item.asset_type))}</td>
            <td>${statusMarkup(evidenceSourceLabel(item.source_type))}</td>
            <td>${statusMarkup(item.status || "-")}</td>
            <td>${statusMarkup(reviewStatusLabel(item.review_status))}</td>
            <td>${escapeHtml(item.generated_at || item.queued_at || "-")}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无资产生成队列。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="evidence-asset-queue">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">资产生成队列</h3>
          <div class="panel-note">本地生成、待人工审核的 GEO 资产队列；不自动发布到外部平台。</div>
        </div>
      </div>
      ${tableMarkup(["队列", "资产类型", "来源", "状态", "审核", "生成时间"], rows)}
    </section>
  `;
}
```

- [ ] **Step 4: Extend `renderGeoAssetPreviews()` metadata and review buttons**

Replace the preview card body with this structure:

```js
      <article class="compact-panel">
        <div class="panel-head">
          <div>
            <h4 class="panel-title">${escapeHtml(assetLabel(item.asset_type))}</h4>
            <div class="panel-note">${escapeHtml(item.content_type || "-")}</div>
          </div>
          ${
            item.opportunity_id
              ? `<div class="actions-row">
                  <button class="ghost-btn" data-action="international-evidence-asset-approve" data-asset-id="${escapeHtml(item.id)}">审核通过</button>
                  <button class="ghost-btn" data-action="international-evidence-asset-reject" data-asset-id="${escapeHtml(item.id)}">驳回</button>
                </div>`
              : ""
          }
        </div>
        ${
          item.opportunity_id
            ? `<div class="info-grid">
                <div class="info-row"><span>证据来源</span><strong>${escapeHtml(evidenceSourceLabel(item.evidence_source_type))}</strong></div>
                <div class="info-row"><span>置信度</span><strong>${escapeHtml(confidenceLabel(item.confidence))}</strong></div>
                <div class="info-row"><span>审核状态</span><strong>${escapeHtml(reviewStatusLabel(item.review_status))}</strong></div>
              </div>
              <div class="panel-note">${escapeHtml(item.evidence_summary || "-")}</div>`
            : ""
        }
        <pre class="code-preview">${escapeHtml(item.content || "")}</pre>
      </article>
```

- [ ] **Step 5: Render new panels in `renderInternationalGeo()`**

Add:

```js
    ${renderEvidenceOpportunitiesPanel(data.evidence_assets || {})}
    ${renderEvidenceAssetQueuePanel(data.evidence_assets || {})}
```

Place both after `renderSiteAuditHistory(...)` and before `renderGeoAssetPreviews(...)`.

- [ ] **Step 6: Run tests**

```bash
npm run check
```

Expected: UI assertions pass. Remaining failures should be docs/version related only after Task 6.

- [ ] **Step 7: Commit UI**

```bash
git add prototype/src/pages/international.js
git commit -m "feat: render evidence driven geo assets"
```

## Task 6: Static Preview And Documentation Alignment

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` if it exists and contains the project version
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
- Create: `docs/STAGE_V0_14_CLOSEOUT.md`
- Modify: `prototype/src/static-api.js` or `prototype/src/static-routes.js` only if static tests fail

- [ ] **Step 1: Update version to `0.14.0`**

In `package.json`, set:

```json
  "version": "0.14.0",
```

If `package-lock.json` exists, update the root package version and package entry version to `0.14.0`.

- [ ] **Step 2: Add changelog entry**

Add at the top of `CHANGELOG.md`:

```md
## 0.14.0 - Evidence-Driven International GEO Assets

- Added evidence-driven International GEO content opportunities derived from site audit scoring, crawl evidence, AI visibility gaps, and rule-first input.
- Added local asset generation queue and review states for generated GEO asset previews.
- Added `/api/v1/international-geo/evidence-assets` read, generate, opportunities, queue, and review endpoints.
- Added International GEO UI panels for evidence opportunities, asset queue status, and provenance metadata.
- Confirmed v0.14 does not publish externally, create full article drafts, or perform real ChatGPT/Gemini/Claude/Perplexity/Google AIO/Copilot monitoring.
```

- [ ] **Step 3: Update API docs**

In `docs/API_REFERENCE.md`, add:

```md
### International GEO Evidence Assets

- `GET /api/v1/international-geo/evidence-assets`: returns `{ summary, opportunities, queue, assets }`.
- `GET /api/v1/international-geo/evidence-assets/opportunities`: returns evidence-driven opportunity rows.
- `GET /api/v1/international-geo/evidence-assets/queue`: returns local generation queue rows.
- `POST /api/v1/international-geo/evidence-assets/generate`: owner/editor/admin action that derives opportunities and generates local reviewable assets.
- `POST /api/v1/international-geo/evidence-assets/:id/review`: owner/editor/admin action with `{ "action": "approve" }` or `{ "action": "reject", "human_notes": "..." }`.

Evidence assets are local review artifacts. They are not automatically published and do not represent measured AI engine inclusion.
```

- [ ] **Step 4: Update architecture and operations docs**

Add the same boundary language to `README.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PHASE_2_ROADMAP.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/OPEN_SOURCE_RELEASE.md`, `docs/README.md`, and `docs/MAINTENANCE.md`:

```md
v0.14 adds evidence-driven International GEO asset opportunities, queue items, generated local previews, and approve/reject review state. The workflow creates reviewable local assets only; it does not publish externally, generate full long-form articles, or call live AI search engines for inclusion/ranking measurement.
```

- [ ] **Step 5: Create closeout document**

Create `docs/STAGE_V0_14_CLOSEOUT.md` with:

```md
# Stage v0.14 Closeout

## Scope Completed

- Evidence-driven International GEO opportunities.
- Local asset generation queue.
- Generated GEO asset previews with provenance metadata.
- Approve/reject review state.
- API, UI, tests, and documentation alignment.

## Operating Boundary

v0.14 generates reviewable local assets only. It does not publish to CMS, social, community, directory, or search platforms. It does not generate full articles. It does not measure live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Microsoft Copilot, Bing, or SERP inclusion.

## Recommended Next Stage

v0.15 should add export packages and connector handoff contracts for reviewed assets, while keeping publication behind explicit human approval.

## Verification

- `npm run check`
```

- [ ] **Step 6: Run tests**

```bash
npm run check
```

Expected: PASS with `verify-mvp: OK`.

- [ ] **Step 7: Commit docs**

```bash
git add package.json package-lock.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_14_CLOSEOUT.md
git commit -m "docs: close evidence driven assets v0.14"
```

If static preview needed changes, include those files and use:

```bash
git add prototype/src/static-api.js prototype/src/static-routes.js
git commit -m "fix: seed evidence assets in static preview"
```

## Task 7: Final Verification, Commit Hygiene, And Push

**Files:**
- Read-only verification unless failures require a scoped fix.

- [ ] **Step 1: Check status**

```bash
git status --short --branch
```

Expected: clean working tree on `main`, ahead of `origin/main`.

- [ ] **Step 2: Run full check**

```bash
npm run check
```

Expected:

```text
verify-mvp: OK
```

- [ ] **Step 3: Inspect recent commits**

```bash
git log --oneline -8
```

Expected commits include:

```text
docs: close evidence driven assets v0.14
feat: render evidence driven geo assets
feat: wire evidence asset actions
feat: expose evidence driven geo asset api
feat: add evidence driven geo asset state
test: specify evidence driven assets v0.14
docs: design evidence driven assets v0.14
```

- [ ] **Step 4: Push to GitHub**

```bash
git push
```

Expected: push succeeds to `origin/main`.

- [ ] **Step 5: Verify GitHub Actions**

```bash
gh run list --limit 3
gh run watch
```

Expected: latest workflow for `main` completes successfully.

## Rollback Checkpoint

Starting point before v0.14 implementation: `d9a73b9 docs: design evidence driven assets v0.14` on `main`, with v0.13 merge at `00c3c0a`.

Rollback if:

- generated evidence assets lack `evidence_source_type`, `evidence_source_id`, `evidence_summary`, or `confidence`,
- UI implies external publication or measured AI engine inclusion,
- viewer can generate/review evidence assets,
- `npm run check` cannot pass,
- API returns raw provider credentials or connector secrets.

Rollback command if needed:

```bash
git revert <bad-commit-range>
npm run check
git push
```

## Self-Review

- Spec coverage: tasks cover state shape, opportunity derivation, queue records, asset generation, review actions, API routes, RBAC, UI panels, static preview compatibility, docs, closeout, verification, and push.
- Scope boundary: plan does not add external publishing, full article generation, live AI engine calls, recursive crawling, database migrations, or multi-tenant SaaS changes.
- Placeholder scan: no forbidden placeholder tokens or vague deferred-work notes remain.
- Type consistency: field names match the design spec: `source_type`, `source_id`, `asset_type`, `evidence_source_type`, `evidence_source_id`, `evidence_summary`, `confidence`, `review_status`.
