# Publishing Platform Workflow v0.15 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a conservative International GEO publishing workflow that recommends distribution platforms, generates review-only publishing packages from approved evidence assets, and tracks manual publishing, indexing, AI mention, citation, and recommendation status.

**Architecture:** Extend the existing local International GEO mock-state model in `mock-data.mjs` with platform matrix records, deterministic package generation, review actions, and manual tracking updates. Expose narrow `/api/v1/international-geo/publishing` routes, wire them into the current browser action layer, and render three compact dense-admin panels inside the existing International GEO page without external publishing, credentials, live AI/search calls, or full article generation.

**Tech Stack:** Node.js ESM, local JSON/mock state, built-in HTTP server, vanilla JS prototype UI, `DESIGN.md` dense admin components, `verify-mvp.mjs`, `npm run check`.

---

## File Map

- Modify `verify-mvp.mjs`: add red tests for mock-data contracts, HTTP RBAC, client API methods, event wiring, UI panels, and manual/local boundary labels.
- Modify `mock-data.mjs`: add publishing platform defaults, publishing package state, tracking state, deterministic package generation, package review, tracking update validation, and read helpers.
- Modify `server.mjs`: import new publishing helpers and add seven International GEO publishing API routes.
- Modify `prototype/src/api.js`: add publishing workflow client API methods.
- Modify `prototype/src/main.js`: import publishing client API methods and add browser actions for package generation, review, and demo tracking update.
- Modify `prototype/src/events.js`: wire publishing workflow `data-action` handlers.
- Modify `prototype/src/pages/international.js`: render `发布平台矩阵`, `发布包队列`, and `收录与推荐追踪` panels using existing dense table/status patterns.
- Modify `package.json`: bump version to `0.15.0`.
- Modify docs: `CHANGELOG.md`, `README.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PHASE_2_ROADMAP.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/OPEN_SOURCE_RELEASE.md`, `docs/README.md`, and `docs/MAINTENANCE.md`.
- Create `docs/STAGE_V0_15_CLOSEOUT.md`.

## Design Constraints

- Reuse the current `DESIGN.md` language: `surface panel`, compact tables, `statusMarkup`, `info-row`, `cell-title`, and `cell-sub`.
- Keep publishing workflow inside International GEO; do not add top-level navigation.
- All package content is a review package, checklist, outline, or brief. It must not become a full article.
- All indexing, mention, citation, and recommendation values are local/manual records. They must not be labeled as measured provider evidence.
- No external platform credentials, automatic publish buttons, platform API calls, AI engine calls, SERP calls, or indexing-provider calls.

## Task 1: Red Tests For v0.15 Contracts

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add mock-data imports**

Add these names to the existing import list from `./mock-data.mjs`:

```js
  generateInternationalGeoPublishingPackagesAction,
  getInternationalGeoPublishingState,
  reviewInternationalGeoPublishingPackageAction,
  updateInternationalGeoPublishingTrackingAction,
```

- [ ] **Step 2: Add frontend source assertions**

Add these assertions inside `runSingleUserSourceChecks()` near the existing International GEO evidence asset source checks:

```js
  assert.match(
    apiSource,
    /export function getInternationalGeoPublishing\(\)/,
    "International GEO publishing workflow should have a read client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoPublishingPackages\(\)/,
    "International GEO publishing workflow should have a package generation client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoPublishingPackage\(packageId, payload = \{\}\)/,
    "International GEO publishing workflow should have a package review client API method"
  );
  assert.match(
    apiSource,
    /export function updateInternationalGeoPublishingTracking\(trackingId, payload = \{\}\)/,
    "International GEO publishing workflow should have a tracking update client API method"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoPublishingPackages as generateInternationalGeoPublishingPackagesApi/,
    "International GEO publishing package generation should be imported into the browser action layer"
  );
  assert.match(
    mainSource,
    /updateInternationalGeoPublishingTracking as updateInternationalGeoPublishingTrackingApi/,
    "International GEO publishing tracking update should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-packages-generate"/,
    "International GEO publishing package generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-package-approve"/,
    "International GEO publishing package approval should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-package-reject"/,
    "International GEO publishing package rejection should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-tracking-demo-update"/,
    "International GEO publishing tracking update should be wired in the event dispatcher"
  );
```

- [ ] **Step 3: Add mock-data publishing assertions**

Place this block in `runMockDataChecks()` after the existing evidence asset review assertions:

```js
  const publishingInitial = getInternationalGeoPublishingState();
  assert.ok(publishingInitial.summary, "Publishing workflow should expose a summary");
  assert.ok(Array.isArray(publishingInitial.platforms), "Publishing workflow should expose platform rows");
  assert.ok(Array.isArray(publishingInitial.packages), "Publishing workflow should expose package rows");
  assert.ok(Array.isArray(publishingInitial.tracking), "Publishing workflow should expose tracking rows");

  const expectedPlatformKeys = [
    "official_blog",
    "docs",
    "github",
    "linkedin_company",
    "linkedin_founder",
    "reddit",
    "quora",
    "youtube",
    "medium",
    "devto",
    "hashnode",
    "product_hunt",
    "g2",
    "capterra",
    "alternative_to",
    "saasworthy"
  ];
  const platformKeys = new Set(publishingInitial.platforms.map((item) => item.platform_key));
  expectedPlatformKeys.forEach((platformKey) => {
    assert.ok(platformKeys.has(platformKey), `Publishing platform matrix should include ${platformKey}`);
  });
  assert.ok(
    publishingInitial.platforms.every(
      (item) =>
        item.ai_visibility_fit?.chatgpt_search &&
        item.ai_visibility_fit?.gemini &&
        item.ai_visibility_fit?.claude &&
        item.risk_level &&
        item.publishing_mode &&
        Array.isArray(item.supported_package_types)
    ),
    "Publishing platform rows should include engine fit, risk, publishing mode, and package types"
  );

  const publishingGenerated = generateInternationalGeoPublishingPackagesAction();
  const generatedPackageTypes = new Set(publishingGenerated.packages.map((item) => item.package_type));
  [
    "website_article_brief",
    "docs_update_brief",
    "github_readme_update",
    "linkedin_post",
    "reddit_answer",
    "quora_answer"
  ].forEach((packageType) => {
    assert.ok(generatedPackageTypes.has(packageType), `Generated packages should include ${packageType}`);
  });
  assert.ok(
    publishingGenerated.packages.every(
      (item) =>
        item.source_asset_id &&
        item.evidence_source_type &&
        item.evidence_source_id &&
        item.evidence_summary &&
        item.content.includes("Manual handoff")
    ),
    "Generated publishing packages should preserve evidence provenance and manual handoff copy"
  );
  assert.equal(
    publishingGenerated.packages.some((item) => /full article/i.test(item.content)),
    false,
    "Generated publishing packages should not claim to be full articles"
  );

  const packageToApprove = publishingGenerated.packages[0];
  const approvedPackage = reviewInternationalGeoPublishingPackageAction(packageToApprove.id, {
    action: "approve",
    human_notes: "Approved for manual handoff."
  });
  assert.equal(approvedPackage.review_status, "approved", "Publishing package review should approve packages");
  assert.equal(approvedPackage.package_status, "approved_package", "Approved packages should expose approved package status");

  const packageToReject = publishingGenerated.packages.find((item) => item.id !== packageToApprove.id);
  const rejectedPackage = reviewInternationalGeoPublishingPackageAction(packageToReject.id, {
    action: "reject",
    human_notes: "Needs more proof."
  });
  assert.equal(rejectedPackage.review_status, "rejected", "Publishing package review should reject packages");
  assert.equal(rejectedPackage.package_status, "rejected_package", "Rejected packages should expose rejected package status");

  assert.throws(
    () => reviewInternationalGeoPublishingPackageAction(packageToApprove.id, { action: "publish" }),
    /VALIDATION_ERROR/,
    "Invalid publishing package review actions should be rejected"
  );
  assert.equal(
    reviewInternationalGeoPublishingPackageAction("missing_publishing_package", { action: "approve" }),
    null,
    "Unknown publishing package ids should return null"
  );

  const trackingRecord = publishingGenerated.tracking.find((item) => item.package_id === packageToApprove.id);
  const updatedTracking = updateInternationalGeoPublishingTrackingAction(trackingRecord.id, {
    publication_status: "manually_published",
    published_url: "https://example.com/geo-publishing-package",
    canonical_url: "https://example.com",
    indexing_status: "indexed",
    ai_mention_status: "mentioned",
    citation_status: "cited",
    recommendation_status: "recommended",
    evidence_url: "https://example.com/manual-evidence",
    evidence_note: "Manual reviewer checked the public URL."
  });
  assert.equal(updatedTracking.publication_status, "manually_published", "Tracking should record manual publication");
  assert.equal(updatedTracking.indexing_status, "indexed", "Tracking should record indexing status");
  assert.equal(updatedTracking.ai_mention_status, "mentioned", "Tracking should record AI mention status");
  assert.equal(updatedTracking.citation_status, "cited", "Tracking should record citation status");
  assert.equal(updatedTracking.recommendation_status, "recommended", "Tracking should record recommendation status");
  assert.throws(
    () =>
      updateInternationalGeoPublishingTrackingAction(trackingRecord.id, {
        publication_status: "manually_published",
        published_url: ""
      }),
    /VALIDATION_ERROR/,
    "Manual publication tracking should require an http published URL"
  );
  assert.throws(
    () =>
      updateInternationalGeoPublishingTrackingAction(trackingRecord.id, {
        indexing_status: "ranking_first"
      }),
    /VALIDATION_ERROR/,
    "Invalid tracking status values should be rejected"
  );
  assert.equal(
    updateInternationalGeoPublishingTrackingAction("missing_tracking_record", { indexing_status: "indexed" }),
    null,
    "Unknown tracking ids should return null"
  );
```

- [ ] **Step 4: Add UI render assertions**

Add these assertions after the existing International GEO evidence asset UI assertions:

```js
  assert.match(siteAuditHtml, /发布平台矩阵/, "International GEO page should render publishing platform matrix");
  assert.match(siteAuditHtml, /发布包队列/, "International GEO page should render publishing package queue");
  assert.match(siteAuditHtml, /收录与推荐追踪/, "International GEO page should render publishing tracking ledger");
  assert.match(siteAuditHtml, /Manual \/ local/, "Publishing UI should expose the manual local boundary");
  assert.match(siteAuditHtml, /ChatGPT Search/, "Publishing matrix should show ChatGPT Search fit");
  assert.match(siteAuditHtml, /Gemini/, "Publishing matrix should show Gemini fit");
  assert.match(siteAuditHtml, /Claude/, "Publishing matrix should show Claude fit");
  assert.match(siteAuditHtml, /data-action="international-publishing-packages-generate"/);
  assert.match(siteAuditHtml, /data-action="international-publishing-package-approve"/);
  assert.match(siteAuditHtml, /data-action="international-publishing-package-reject"/);
```

- [ ] **Step 5: Add HTTP RBAC assertions**

Place this block after the existing evidence asset HTTP assertions and before user-management HTTP assertions:

```js
    const viewerPublishing = await httpRequest(port, "/api/v1/international-geo/publishing", {
      headers: viewerHeaders
    });
    assert.equal(viewerPublishing.status, 200, "Viewer should read International GEO publishing workflow");
    assert.ok(viewerPublishing.body?.data?.summary, "Publishing HTTP response should include a summary");
    assert.ok(
      viewerPublishing.body?.data?.platforms?.length >= 16,
      "Publishing HTTP response should include default platform rows"
    );

    const viewerGeneratePublishing = await httpRequest(port, "/api/v1/international-geo/publishing/packages/generate", {
      method: "POST",
      headers: viewerHeaders
    });
    assert.equal(viewerGeneratePublishing.status, 403, "Viewer should not generate publishing packages");

    const ownerGeneratePublishing = await httpRequest(port, "/api/v1/international-geo/publishing/packages/generate", {
      method: "POST",
      headers: ownerHeaders
    });
    assert.equal(ownerGeneratePublishing.status, 201, "Owner should generate publishing packages");
    assert.ok(
      ownerGeneratePublishing.body?.data?.packages?.length >= 6,
      "Owner publishing package generation should return package rows"
    );

    const generatedPublishingPackageId = ownerGeneratePublishing.body.data.packages[0].id;
    const viewerReviewPublishing = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/packages/${generatedPublishingPackageId}/review`,
      {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(viewerReviewPublishing.status, 403, "Viewer should not review publishing packages");

    const ownerReviewPublishing = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/packages/${generatedPublishingPackageId}/review`,
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(ownerReviewPublishing.status, 200, "Owner should review publishing packages");
    assert.equal(ownerReviewPublishing.body?.data?.review_status, "approved");

    const invalidPublishingReview = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/packages/${generatedPublishingPackageId}/review`,
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({ action: "publish" })
      }
    );
    assert.equal(invalidPublishingReview.status, 400, "Invalid publishing package review should fail");

    const generatedTrackingId = ownerGeneratePublishing.body.data.tracking[0].id;
    const viewerTrackingUpdate = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/tracking/${generatedTrackingId}`,
      {
        method: "PUT",
        headers: viewerHeaders,
        body: JSON.stringify({ indexing_status: "indexed" })
      }
    );
    assert.equal(viewerTrackingUpdate.status, 403, "Viewer should not update publishing tracking");

    const ownerTrackingUpdate = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/tracking/${generatedTrackingId}`,
      {
        method: "PUT",
        headers: ownerHeaders,
        body: JSON.stringify({
          publication_status: "manually_published",
          published_url: "https://example.com/manual-published-package",
          canonical_url: "https://example.com",
          indexing_status: "indexed",
          ai_mention_status: "mentioned",
          citation_status: "cited",
          recommendation_status: "recommended"
        })
      }
    );
    assert.equal(ownerTrackingUpdate.status, 200, "Owner should update publishing tracking");
    assert.equal(ownerTrackingUpdate.body?.data?.publication_status, "manually_published");

    const invalidTrackingUpdate = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/tracking/${generatedTrackingId}`,
      {
        method: "PUT",
        headers: ownerHeaders,
        body: JSON.stringify({
          publication_status: "manually_published",
          published_url: ""
        })
      }
    );
    assert.equal(invalidTrackingUpdate.status, 400, "Invalid publishing tracking update should fail");
```

- [ ] **Step 6: Run tests and confirm red**

Run:

```bash
npm run check
```

Expected: FAIL with missing exports, missing API methods, missing route handlers, or missing UI labels for the v0.15 publishing workflow.

- [ ] **Step 7: Commit red tests**

Run:

```bash
git add verify-mvp.mjs
git commit -m "test: cover publishing platform workflow"
```

## Task 2: Mock Data Publishing Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Add publishing arrays to International GEO state shape**

In the `internationalGeoState` literal, add:

```js
  publishing_platforms: [],
  publishing_packages: [],
  publishing_tracking: [],
```

In `ensureInternationalGeoStateShape()`, add:

```js
  if (!Array.isArray(internationalGeoState.publishing_platforms)) {
    internationalGeoState.publishing_platforms = defaultInternationalGeoPublishingPlatforms();
  }
  if (!internationalGeoState.publishing_platforms.length) {
    internationalGeoState.publishing_platforms = defaultInternationalGeoPublishingPlatforms();
  }
  if (!Array.isArray(internationalGeoState.publishing_packages)) {
    internationalGeoState.publishing_packages = [];
  }
  if (!Array.isArray(internationalGeoState.publishing_tracking)) {
    internationalGeoState.publishing_tracking = [];
  }
```

In `getInternationalGeoState()`, add the publishing state next to visibility and evidence assets:

```js
  state.publishing = getInternationalGeoPublishingState();
```

- [ ] **Step 2: Add publishing constants**

Place this block after `INTERNATIONAL_GEO_VISIBILITY_DATA_STATUSES`:

```js
const INTERNATIONAL_GEO_PUBLISHING_PLATFORM_KEYS = [
  "official_blog",
  "docs",
  "github",
  "linkedin_company",
  "linkedin_founder",
  "reddit",
  "quora",
  "youtube",
  "medium",
  "devto",
  "hashnode",
  "product_hunt",
  "g2",
  "capterra",
  "alternative_to",
  "saasworthy"
];

const INTERNATIONAL_GEO_PUBLISHING_PACKAGE_TYPES = new Set([
  "website_article_brief",
  "docs_update_brief",
  "github_readme_update",
  "linkedin_post",
  "reddit_answer",
  "quora_answer",
  "youtube_outline",
  "medium_article_brief",
  "devto_article_brief",
  "newsletter_brief",
  "product_hunt_listing",
  "g2_profile_checklist",
  "capterra_profile_checklist",
  "directory_listing_checklist"
]);

const INTERNATIONAL_GEO_PACKAGE_REVIEW_ACTIONS = new Set(["approve", "reject"]);
const INTERNATIONAL_GEO_PUBLICATION_STATUSES = new Set([
  "planned",
  "packaged",
  "manually_published",
  "not_published",
  "blocked"
]);
const INTERNATIONAL_GEO_TRACKING_STATUSES = {
  indexing_status: new Set(["unknown", "not_checked", "not_indexed", "indexed", "blocked"]),
  ai_mention_status: new Set(["unknown", "not_checked", "not_mentioned", "mentioned", "blocked"]),
  citation_status: new Set(["unknown", "not_checked", "not_cited", "cited", "blocked"]),
  recommendation_status: new Set(["unknown", "not_checked", "not_recommended", "recommended", "blocked"])
};
```

- [ ] **Step 3: Add default platform matrix helper**

Place this helper after `defaultInternationalGeoProviderReadiness()`:

```js
function makePublishingPlatform(patch = {}) {
  return {
    id: `geopub_${patch.platform_key}`,
    platform_type: patch.platform_type || "owned",
    platform_key: patch.platform_key,
    platform_name: patch.platform_name,
    category: patch.category || "owned_site",
    recommended_asset_types: patch.recommended_asset_types || [],
    supported_package_types: patch.supported_package_types || [],
    ai_visibility_fit: {
      chatgpt_search: patch.ai_visibility_fit?.chatgpt_search || "medium",
      claude: patch.ai_visibility_fit?.claude || "medium",
      perplexity: patch.ai_visibility_fit?.perplexity || "medium",
      google_ai_overviews: patch.ai_visibility_fit?.google_ai_overviews || "medium",
      gemini: patch.ai_visibility_fit?.gemini || "medium",
      copilot_bing: patch.ai_visibility_fit?.copilot_bing || "medium"
    },
    indexing_value: patch.indexing_value || "medium",
    citation_value: patch.citation_value || "medium",
    entity_validation_value: patch.entity_validation_value || "medium",
    risk_level: patch.risk_level || "medium",
    publishing_mode: patch.publishing_mode || "manual",
    connector_status: "not_supported",
    review_policy: "human_required",
    notes: patch.notes || "Manual review required before external use."
  };
}

function defaultInternationalGeoPublishingPlatforms() {
  return [
    makePublishingPlatform({
      platform_key: "official_blog",
      platform_name: "Official Blog",
      platform_type: "owned",
      category: "owned_site",
      recommended_asset_types: ["definition_brief", "buyer_guide_brief", "comparison_brief", "faq_block"],
      supported_package_types: ["website_article_brief"],
      ai_visibility_fit: {
        chatgpt_search: "high",
        claude: "high",
        perplexity: "high",
        google_ai_overviews: "high",
        gemini: "high",
        copilot_bing: "medium"
      },
      indexing_value: "high",
      citation_value: "high",
      entity_validation_value: "medium",
      risk_level: "low",
      notes: "Use canonical owned pages with JSON-LD, sitemap, and llms.txt references."
    }),
    makePublishingPlatform({
      platform_key: "docs",
      platform_name: "Documentation",
      platform_type: "owned",
      category: "knowledge_base",
      recommended_asset_types: ["llms_txt_update", "json_ld_patch", "definition_brief", "product_spec_brief", "faq_block"],
      supported_package_types: ["docs_update_brief"],
      ai_visibility_fit: {
        chatgpt_search: "high",
        claude: "high",
        perplexity: "high",
        google_ai_overviews: "high",
        gemini: "high",
        copilot_bing: "high"
      },
      indexing_value: "high",
      citation_value: "high",
      entity_validation_value: "high",
      risk_level: "low",
      notes: "Docs should carry stable product facts, changelog links, FAQ proof, and llms.txt references."
    }),
    makePublishingPlatform({
      platform_key: "github",
      platform_name: "GitHub",
      platform_type: "developer",
      category: "developer_source",
      recommended_asset_types: ["definition_brief", "product_spec_brief"],
      supported_package_types: ["github_readme_update"],
      ai_visibility_fit: {
        chatgpt_search: "high",
        claude: "high",
        perplexity: "medium",
        google_ai_overviews: "medium",
        gemini: "medium",
        copilot_bing: "high"
      },
      indexing_value: "medium",
      citation_value: "high",
      entity_validation_value: "high",
      risk_level: "low",
      notes: "README updates should describe exact capabilities, installation, limits, and official links."
    }),
    makePublishingPlatform({
      platform_key: "linkedin_company",
      platform_name: "LinkedIn Company Page",
      platform_type: "professional_social",
      category: "social_profile",
      recommended_asset_types: ["comparison_brief", "definition_brief", "buyer_guide_brief"],
      supported_package_types: ["linkedin_post"],
      risk_level: "medium",
      notes: "Use professional, source-backed posts with canonical links and no unsupported superlatives."
    }),
    makePublishingPlatform({
      platform_key: "linkedin_founder",
      platform_name: "LinkedIn Founder Profile",
      platform_type: "professional_social",
      category: "expert_profile",
      recommended_asset_types: ["definition_brief", "buyer_guide_brief"],
      supported_package_types: ["linkedin_post"],
      risk_level: "medium",
      notes: "Founder posts should add expert context and disclose relationship to the product."
    }),
    makePublishingPlatform({
      platform_key: "reddit",
      platform_name: "Reddit",
      platform_type: "community",
      category: "community_discussion",
      recommended_asset_types: ["comparison_brief", "alternatives_brief", "faq_block"],
      supported_package_types: ["reddit_answer"],
      ai_visibility_fit: {
        chatgpt_search: "medium",
        claude: "medium",
        perplexity: "high",
        google_ai_overviews: "medium",
        gemini: "medium",
        copilot_bing: "medium"
      },
      risk_level: "high",
      notes: "Answers must be helpful, non-promotional, and compliant with community rules."
    }),
    makePublishingPlatform({
      platform_key: "quora",
      platform_name: "Quora",
      platform_type: "qa",
      category: "qa_site",
      recommended_asset_types: ["faq_block", "comparison_brief", "alternatives_brief"],
      supported_package_types: ["quora_answer"],
      ai_visibility_fit: {
        chatgpt_search: "medium",
        claude: "medium",
        perplexity: "high",
        google_ai_overviews: "medium",
        gemini: "medium",
        copilot_bing: "medium"
      },
      risk_level: "high",
      notes: "Answers should disclose affiliation and link only when directly relevant."
    }),
    makePublishingPlatform({
      platform_key: "youtube",
      platform_name: "YouTube",
      platform_type: "video",
      category: "video_search",
      recommended_asset_types: ["buyer_guide_brief"],
      supported_package_types: ["youtube_outline"],
      risk_level: "medium",
      notes: "Video outlines should require demo proof and description links to canonical sources."
    }),
    makePublishingPlatform({
      platform_key: "medium",
      platform_name: "Medium",
      platform_type: "knowledge_base",
      category: "third_party_article",
      recommended_asset_types: ["comparison_brief", "alternatives_brief", "definition_brief"],
      supported_package_types: ["medium_article_brief"],
      risk_level: "medium",
      notes: "Use as a supporting article brief with canonical links back to owned pages."
    }),
    makePublishingPlatform({
      platform_key: "devto",
      platform_name: "Dev.to",
      platform_type: "developer",
      category: "developer_article",
      recommended_asset_types: ["definition_brief", "product_spec_brief"],
      supported_package_types: ["devto_article_brief"],
      risk_level: "medium",
      notes: "Developer articles should focus on implementation facts and limitations."
    }),
    makePublishingPlatform({
      platform_key: "hashnode",
      platform_name: "Hashnode",
      platform_type: "developer",
      category: "developer_article",
      recommended_asset_types: ["definition_brief", "product_spec_brief"],
      supported_package_types: ["devto_article_brief"],
      risk_level: "medium",
      notes: "Hashnode package can reuse the developer article brief after human review."
    }),
    makePublishingPlatform({
      platform_key: "product_hunt",
      platform_name: "Product Hunt",
      platform_type: "directory",
      category: "launch_directory",
      recommended_asset_types: ["comparison_brief", "buyer_guide_brief"],
      supported_package_types: ["product_hunt_listing"],
      risk_level: "medium",
      notes: "Listing package should include positioning, screenshots, maker proof, and launch checklist."
    }),
    makePublishingPlatform({
      platform_key: "g2",
      platform_name: "G2",
      platform_type: "review_site",
      category: "review_profile",
      recommended_asset_types: ["product_spec_brief", "buyer_guide_brief"],
      supported_package_types: ["g2_profile_checklist"],
      risk_level: "medium",
      notes: "Profile checklist should focus on category, screenshots, proof, and review policy compliance."
    }),
    makePublishingPlatform({
      platform_key: "capterra",
      platform_name: "Capterra",
      platform_type: "review_site",
      category: "review_profile",
      recommended_asset_types: ["product_spec_brief", "buyer_guide_brief"],
      supported_package_types: ["capterra_profile_checklist"],
      risk_level: "medium",
      notes: "Profile checklist should align category, pricing notes, proof, and public screenshots."
    }),
    makePublishingPlatform({
      platform_key: "alternative_to",
      platform_name: "AlternativeTo",
      platform_type: "directory",
      category: "alternative_directory",
      recommended_asset_types: ["comparison_brief", "alternatives_brief"],
      supported_package_types: ["directory_listing_checklist"],
      risk_level: "medium",
      notes: "Directory listing should avoid unverifiable competitor claims."
    }),
    makePublishingPlatform({
      platform_key: "saasworthy",
      platform_name: "SaaSworthy",
      platform_type: "directory",
      category: "saas_directory",
      recommended_asset_types: ["alternatives_brief", "buyer_guide_brief"],
      supported_package_types: ["directory_listing_checklist"],
      risk_level: "medium",
      notes: "Directory package should prepare category, positioning, screenshots, and source proof."
    })
  ];
}
```

- [ ] **Step 4: Add recommendation maps and package content helper**

Add this block near `evidenceAssetContent()`:

```js
const PUBLISHING_ASSET_PLATFORM_MAP = {
  llms_txt_update: ["official_blog", "docs"],
  json_ld_patch: ["official_blog", "docs"],
  faq_block: ["official_blog", "docs", "quora"],
  comparison_brief: ["official_blog", "linkedin_company", "reddit", "quora", "medium", "product_hunt", "alternative_to"],
  alternatives_brief: ["official_blog", "reddit", "quora", "medium", "alternative_to", "saasworthy"],
  definition_brief: ["official_blog", "docs", "github", "linkedin_company", "medium", "devto", "hashnode"],
  product_spec_brief: ["docs", "github", "official_blog", "g2", "capterra"],
  buyer_guide_brief: ["official_blog", "linkedin_company", "youtube", "g2", "capterra", "saasworthy"]
};

const PUBLISHING_PACKAGE_TYPE_BY_PLATFORM = {
  official_blog: "website_article_brief",
  docs: "docs_update_brief",
  github: "github_readme_update",
  linkedin_company: "linkedin_post",
  linkedin_founder: "linkedin_post",
  reddit: "reddit_answer",
  quora: "quora_answer",
  youtube: "youtube_outline",
  medium: "medium_article_brief",
  devto: "devto_article_brief",
  hashnode: "devto_article_brief",
  product_hunt: "product_hunt_listing",
  g2: "g2_profile_checklist",
  capterra: "capterra_profile_checklist",
  alternative_to: "directory_listing_checklist",
  saasworthy: "directory_listing_checklist"
};

function publishingPackageTitle(packageType, platform, asset = {}) {
  const assetTitle = asset.title || evidenceAssetTitle(asset.asset_type);
  return `${platform.platform_name} ${packageType.replaceAll("_", " ")} for ${assetTitle}`;
}

function publishingPackageContent(packageType, platform, asset = {}) {
  const input = internationalGeoState.input || defaultInternationalGeoInput;
  const product = input.product_name || workspaceInput.product_name || "Product";
  const targetUrl = input.website_url || workspaceInput.website_url || asset.target_url || "";
  const prompt = input.primary_query || asset.target_prompt || "AI search visibility";
  const evidenceNote = asset.evidence_summary || "Review source evidence before publishing.";
  const sourceLine = `Source evidence: ${asset.evidence_source_type || "unknown"}:${asset.evidence_source_id || "unknown"}.`;
  const handoff = "Manual handoff: review claims, verify source proof, publish outside GEO Pulse, then record the public URL in tracking.";

  if (packageType === "website_article_brief") {
    return `# Website article brief\n\nDirect answer upfront: ${product} should answer \"${prompt}\" with verified product facts, canonical pages, structured data, and source-backed proof.\n\nCanonical URL recommendation: ${targetUrl}\n\n## Outline\n- Direct answer and category definition\n- Evidence table with product facts\n- Comparison or buyer decision criteria\n- FAQ block\n- JSON-LD recommendation\n\n## Proof checklist\n- Confirm canonical URL\n- Add Organization, Product, SoftwareApplication, FAQPage, Article, or BreadcrumbList schema when relevant\n- Link /llms.txt and sitemap references\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
  }

  if (packageType === "docs_update_brief") {
    return `# Documentation update brief\n\nDocs target: ${targetUrl}\n\n## Facts to verify\n- Product capability boundaries\n- Market and language support\n- Integration, crawl, or structured-data requirements\n- Changelog or FAQ insertion point\n\n## Linkage note\nConnect the docs page to /llms.txt, sitemap, and JSON-LD references.\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
  }

  if (packageType === "github_readme_update") {
    return `# GitHub README update package\n\n## Section suggestion\nAdd a concise \"AI search and GEO readiness\" section for ${product}.\n\n## Include\n- Install or usage context after reviewer confirmation\n- Official docs link: ${targetUrl}\n- Limitations and supported use cases\n- Source proof and review notes\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
  }

  if (packageType === "linkedin_post") {
    return `# LinkedIn post package\n\n${product} teams evaluating \"${prompt}\" should start with source-backed facts: canonical pages, structured data, /llms.txt, and evidence-rich buyer answers.\n\nLink: ${targetUrl}\n\nReview checklist:\n- Remove unsupported superlatives\n- Confirm claims and product proof\n- Keep tone professional and factual\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
  }

  if (packageType === "reddit_answer" || packageType === "quora_answer") {
    return `# Helpful answer package\n\nQuestion angle: ${prompt}\n\n## Answer structure\n- Start with a neutral direct answer\n- Explain evaluation criteria\n- Add source-backed facts only\n- Disclose affiliation when relevant\n- Link canonical source only if it directly helps\n\nModeration risk note: ${platform.platform_name} is high-risk for promotional posts. Keep the answer useful and non-promotional.\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
  }

  if (packageType === "youtube_outline") {
    return `# YouTube outline package\n\nVideo title: How to evaluate ${product} for ${prompt}\n\n## Sections\n1. Buyer problem\n2. Direct answer\n3. Required evidence\n4. Product or workflow demonstration\n5. Comparison criteria\n6. Limitations\n7. Canonical links and next steps\n\nDescription link checklist: include ${targetUrl} only after review.\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
  }

  return `# Profile or directory checklist\n\nPlatform: ${platform.platform_name}\nProduct: ${product}\nCanonical URL: ${targetUrl}\n\n## Fields to prepare\n- Category recommendation\n- Positioning statement\n- Product proof and screenshots\n- Public documentation links\n- Limitations and review checklist\n\n${sourceLine}\nEvidence note: ${evidenceNote}\n${handoff}\n`;
}
```

- [ ] **Step 5: Add publishing summary and read helper**

Add these exported helpers after `getInternationalGeoEvidenceAssetsState()`:

```js
function publishingSummary() {
  const packages = internationalGeoState.publishing_packages || [];
  const tracking = internationalGeoState.publishing_tracking || [];
  return {
    platform_count: (internationalGeoState.publishing_platforms || []).length,
    package_count: packages.length,
    approved_package_count: packages.filter((item) => item.review_status === "approved").length,
    manually_published_count: tracking.filter((item) => item.publication_status === "manually_published").length,
    indexed_count: tracking.filter((item) => item.indexing_status === "indexed").length,
    mentioned_count: tracking.filter((item) => item.ai_mention_status === "mentioned").length,
    cited_count: tracking.filter((item) => item.citation_status === "cited").length,
    recommended_count: tracking.filter((item) => item.recommendation_status === "recommended").length
  };
}

export function getInternationalGeoPublishingState() {
  ensureInternationalGeoStateShape();
  return deepClone({
    summary: publishingSummary(),
    platforms: internationalGeoState.publishing_platforms,
    packages: internationalGeoState.publishing_packages,
    tracking: internationalGeoState.publishing_tracking
  });
}
```

- [ ] **Step 6: Add package generation action**

Add this exported action after `getInternationalGeoPublishingState()`:

```js
export function generateInternationalGeoPublishingPackagesAction() {
  ensureInternationalGeoStateShape();
  const approvedAssets = (internationalGeoState.geo_assets || []).filter(
    (item) => (item.opportunity_id || item.queue_item_id) && item.review_status === "approved"
  );
  if (!approvedAssets.length) {
    return getInternationalGeoPublishingState();
  }

  const platformByKey = new Map(internationalGeoState.publishing_platforms.map((item) => [item.platform_key, item]));
  const existingByPair = new Map(
    (internationalGeoState.publishing_packages || []).map((item) => [`${item.source_asset_id}:${item.platform_id}`, item])
  );
  const existingTrackingByPackage = new Map(
    (internationalGeoState.publishing_tracking || []).map((item) => [item.package_id, item])
  );
  const createdAt = nowIso();

  approvedAssets.forEach((asset) => {
    const platformKeys = PUBLISHING_ASSET_PLATFORM_MAP[asset.asset_type] || ["official_blog"];
    platformKeys.forEach((platformKey) => {
      const platform = platformByKey.get(platformKey);
      if (!platform) return;
      const packageType = PUBLISHING_PACKAGE_TYPE_BY_PLATFORM[platformKey] || platform.supported_package_types[0];
      if (!INTERNATIONAL_GEO_PUBLISHING_PACKAGE_TYPES.has(packageType)) return;
      const pairKey = `${asset.id}:${platform.id}`;
      let pkg = existingByPair.get(pairKey);
      if (!pkg) {
        pkg = {
          id: uniqueId("geopkg"),
          source_asset_id: asset.id,
          source_asset_type: asset.asset_type,
          platform_id: platform.id,
          platform_name: platform.platform_name,
          package_type: packageType,
          title: publishingPackageTitle(packageType, platform, asset),
          target_prompt: internationalGeoState.input?.primary_query || "",
          target_url: internationalGeoState.input?.website_url || workspaceInput.website_url || "",
          canonical_url: internationalGeoState.input?.website_url || workspaceInput.website_url || "",
          package_status: "draft_package",
          review_status: "pending_review",
          content_type: "text/markdown",
          content: publishingPackageContent(packageType, platform, asset),
          checklist: [
            "Confirm canonical URL.",
            "Remove unsupported claims.",
            "Add approved product proof.",
            "Publish manually outside GEO Pulse.",
            "Record the public URL and manual tracking status after publication."
          ],
          evidence_source_type: asset.evidence_source_type,
          evidence_source_id: asset.evidence_source_id,
          evidence_summary: asset.evidence_summary,
          confidence: asset.confidence || "medium",
          created_at: createdAt,
          reviewed_at: null,
          human_notes: ""
        };
        internationalGeoState.publishing_packages.unshift(pkg);
        existingByPair.set(pairKey, pkg);
      }

      if (!existingTrackingByPackage.has(pkg.id)) {
        const tracking = {
          id: uniqueId("geotrack"),
          package_id: pkg.id,
          platform_id: platform.id,
          platform_name: platform.platform_name,
          source_asset_id: asset.id,
          published_url: "",
          canonical_url: pkg.canonical_url,
          target_prompt: pkg.target_prompt,
          publication_status: "packaged",
          indexing_status: "unknown",
          ai_mention_status: "unknown",
          citation_status: "unknown",
          recommendation_status: "unknown",
          evidence_url: "",
          evidence_note: "Manual/local tracking only. No live AI or search provider measurement has been performed.",
          last_checked_at: null,
          updated_at: createdAt
        };
        internationalGeoState.publishing_tracking.unshift(tracking);
        existingTrackingByPackage.set(pkg.id, tracking);
      }
    });
  });

  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.publishing.generate", "international_geo_publishing", "batch", {
    package_count: internationalGeoState.publishing_packages.length,
    tracking_count: internationalGeoState.publishing_tracking.length
  });
  persistState();
  return getInternationalGeoPublishingState();
}
```

- [ ] **Step 7: Add package review and tracking update actions**

Add these exported actions after `generateInternationalGeoPublishingPackagesAction()`:

```js
export function reviewInternationalGeoPublishingPackageAction(packageId, payload = {}) {
  ensureInternationalGeoStateShape();
  const action = String(payload.action || "").trim();
  if (!INTERNATIONAL_GEO_PACKAGE_REVIEW_ACTIONS.has(action)) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    error.field_errors = [{ field: "action", message: "Use approve or reject." }];
    throw error;
  }
  const pkg = internationalGeoState.publishing_packages.find((item) => item.id === packageId);
  if (!pkg) return null;
  const reviewStatus = action === "approve" ? "approved" : "rejected";
  pkg.review_status = reviewStatus;
  pkg.package_status = action === "approve" ? "approved_package" : "rejected_package";
  pkg.reviewed_at = nowIso();
  pkg.human_notes = String(payload.human_notes || "").trim();
  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.publishing.review", "international_geo_publishing_package", pkg.id, {
    review_status: pkg.review_status
  });
  persistState();
  return deepClone(pkg);
}

function assertValidTrackingStatus(field, value) {
  if (value === undefined) return;
  if (field === "publication_status" && !INTERNATIONAL_GEO_PUBLICATION_STATUSES.has(value)) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    error.field_errors = [{ field, message: `Invalid ${field}` }];
    throw error;
  }
  if (INTERNATIONAL_GEO_TRACKING_STATUSES[field] && !INTERNATIONAL_GEO_TRACKING_STATUSES[field].has(value)) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    error.field_errors = [{ field, message: `Invalid ${field}` }];
    throw error;
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function updateInternationalGeoPublishingTrackingAction(trackingId, payload = {}) {
  ensureInternationalGeoStateShape();
  const record = internationalGeoState.publishing_tracking.find((item) => item.id === trackingId);
  if (!record) return null;

  [
    "publication_status",
    "indexing_status",
    "ai_mention_status",
    "citation_status",
    "recommendation_status"
  ].forEach((field) => {
    if (payload[field] !== undefined) assertValidTrackingStatus(field, String(payload[field]));
  });

  const nextPublicationStatus = String(payload.publication_status || record.publication_status || "planned");
  const nextPublishedUrl = String(payload.published_url ?? record.published_url ?? "").trim();
  if (nextPublicationStatus === "manually_published" && !isHttpUrl(nextPublishedUrl)) {
    const error = new Error("VALIDATION_ERROR");
    error.code = "VALIDATION_ERROR";
    error.field_errors = [{ field: "published_url", message: "Manual publication requires an http published_url." }];
    throw error;
  }

  record.publication_status = nextPublicationStatus;
  record.published_url = nextPublishedUrl;
  record.canonical_url = String(payload.canonical_url ?? record.canonical_url ?? "").trim();
  record.indexing_status = String(payload.indexing_status || record.indexing_status || "unknown");
  record.ai_mention_status = String(payload.ai_mention_status || record.ai_mention_status || "unknown");
  record.citation_status = String(payload.citation_status || record.citation_status || "unknown");
  record.recommendation_status = String(payload.recommendation_status || record.recommendation_status || "unknown");
  record.evidence_url = String(payload.evidence_url ?? record.evidence_url ?? "").trim();
  record.evidence_note = String(payload.evidence_note ?? record.evidence_note ?? "").trim();
  record.last_checked_at = nowIso();
  record.updated_at = nowIso();

  const pkg = internationalGeoState.publishing_packages.find((item) => item.id === record.package_id);
  if (pkg && record.publication_status === "manually_published") {
    pkg.package_status = "manually_published";
  }

  internationalGeoState.updated_at = nowIso();
  recordAuditEvent("international_geo.publishing.tracking.update", "international_geo_publishing_tracking", record.id, {
    publication_status: record.publication_status,
    indexing_status: record.indexing_status,
    ai_mention_status: record.ai_mention_status,
    citation_status: record.citation_status,
    recommendation_status: record.recommendation_status
  });
  persistState();
  return deepClone(record);
}
```

- [ ] **Step 8: Run tests and commit model**

Run:

```bash
npm run check
```

Expected: FAIL only on missing server/client/UI/docs version surfaces, while direct mock-data assertions pass.

Commit:

```bash
git add mock-data.mjs verify-mvp.mjs
git commit -m "feat: add publishing workflow model"
```

## Task 3: Server Routes

**Files:**
- Modify: `server.mjs`

- [ ] **Step 1: Import publishing helpers**

Add these names to the import destructuring from `./mock-data.mjs`:

```js
  generateInternationalGeoPublishingPackagesAction,
  getInternationalGeoPublishingState,
  reviewInternationalGeoPublishingPackageAction,
  updateInternationalGeoPublishingTrackingAction,
```

- [ ] **Step 2: Add read routes**

Place these routes after the existing `/international-geo/evidence-assets/queue` route:

```js
  if (req.method === "GET" && pathname === "/international-geo/publishing") {
    sendJson(res, 200, ok(getInternationalGeoPublishingState()));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing/platforms") {
    sendJson(res, 200, ok({ items: getInternationalGeoPublishingState().platforms }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing/packages") {
    sendJson(res, 200, ok({ items: getInternationalGeoPublishingState().packages }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing/tracking") {
    sendJson(res, 200, ok({ items: getInternationalGeoPublishingState().tracking }));
    return;
  }
```

- [ ] **Step 3: Add package generation route**

Place this route after the read routes:

```js
  if (req.method === "POST" && pathname === "/international-geo/publishing/packages/generate") {
    sendJson(res, 201, ok(generateInternationalGeoPublishingPackagesAction()));
    return;
  }
```

- [ ] **Step 4: Add package review route**

Place this route after the generation route:

```js
  if (req.method === "POST" && pathname.match(/^\/international-geo\/publishing\/packages\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoPublishingPackageAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Publishing package not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || "Review action must be approve or reject";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 5: Add tracking update route**

Place this route after the package review route:

```js
  if (req.method === "PUT" && pathname.match(/^\/international-geo\/publishing\/tracking\/[^/]+$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = updateInternationalGeoPublishingTrackingAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Publishing tracking record not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || "Invalid publishing tracking update";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }
```

- [ ] **Step 6: Run tests and commit routes**

Run:

```bash
npm run check
```

Expected: FAIL only on client/UI/docs version surfaces if those are not finished.

Commit:

```bash
git add server.mjs verify-mvp.mjs
git commit -m "feat: expose publishing workflow api"
```

## Task 4: Browser API And Actions

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add browser API methods**

Add these functions in `prototype/src/api.js` after `reviewInternationalGeoEvidenceAsset()`:

```js
export function getInternationalGeoPublishing() {
  return request("/api/v1/international-geo/publishing");
}

export function generateInternationalGeoPublishingPackages() {
  return requestJson("/api/v1/international-geo/publishing/packages/generate", "POST", {});
}

export function reviewInternationalGeoPublishingPackage(packageId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/publishing/packages/${encodeURIComponent(packageId)}/review`,
    "POST",
    payload
  );
}

export function updateInternationalGeoPublishingTracking(trackingId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/publishing/tracking/${encodeURIComponent(trackingId)}`,
    "PUT",
    payload
  );
}
```

- [ ] **Step 2: Import browser API methods in main**

Add these aliases to the import from `./api.js?v=20260417-5` in `prototype/src/main.js`:

```js
  generateInternationalGeoPublishingPackages as generateInternationalGeoPublishingPackagesApi,
  reviewInternationalGeoPublishingPackage as reviewInternationalGeoPublishingPackageApi,
  updateInternationalGeoPublishingTracking as updateInternationalGeoPublishingTrackingApi,
```

- [ ] **Step 3: Add browser actions**

Add these methods to the exported `actions` object in `prototype/src/main.js` after `reviewInternationalGeoEvidenceAsset()`:

```js
  async generateInternationalGeoPublishingPackages() {
    try {
      const result = await generateInternationalGeoPublishingPackagesApi();
      await refreshData();
      store.page = "international";
      showNotice(`国际 GEO 发布包已生成 ${result.packages?.length || 0} 项。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成国际 GEO 发布包失败");
      rerender();
    }
  },
  async reviewInternationalGeoPublishingPackage(packageId, action) {
    if (!packageId) return;
    try {
      await reviewInternationalGeoPublishingPackageApi(packageId, { action });
      await refreshData();
      store.page = "international";
      showNotice(action === "approve" ? "发布包已审核通过。" : "发布包已驳回。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "审核国际 GEO 发布包失败");
      rerender();
    }
  },
  async updateInternationalGeoPublishingTrackingDemo(trackingId) {
    if (!trackingId) return;
    try {
      await updateInternationalGeoPublishingTrackingApi(trackingId, {
        publication_status: "manually_published",
        published_url: "https://example.com/manual-published-package",
        canonical_url:
          store.data.internationalGeo?.input?.website_url ||
          store.data.workspaceInput?.website_url ||
          "https://example.com",
        indexing_status: "not_checked",
        ai_mention_status: "not_checked",
        citation_status: "not_checked",
        recommendation_status: "not_checked",
        evidence_note: "Manual/local demo update. No live provider measurement was performed."
      });
      await refreshData();
      store.page = "international";
      showNotice("发布追踪已记录为人工发布，收录与推荐状态仍需人工核验。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "更新发布追踪失败");
      rerender();
    }
  },
```

- [ ] **Step 4: Wire events**

Add these handlers to `prototype/src/events.js` next to the existing International GEO handlers:

```js
    if (action === "international-publishing-packages-generate") {
      actions.generateInternationalGeoPublishingPackages();
      return;
    }

    if (action === "international-publishing-package-approve") {
      actions.reviewInternationalGeoPublishingPackage(target.dataset.packageId, "approve");
      return;
    }

    if (action === "international-publishing-package-reject") {
      actions.reviewInternationalGeoPublishingPackage(target.dataset.packageId, "reject");
      return;
    }

    if (action === "international-publishing-tracking-demo-update") {
      actions.updateInternationalGeoPublishingTrackingDemo(target.dataset.trackingId);
      return;
    }
```

- [ ] **Step 5: Run tests and commit browser wiring**

Run:

```bash
npm run check
```

Expected: FAIL only on UI/docs version surfaces if those are not finished.

Commit:

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js verify-mvp.mjs
git commit -m "feat: wire publishing workflow actions"
```

## Task 5: International GEO UI Panels

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add publishing label helpers**

Add these helpers near the existing `evidenceStatusLabel()` and `evidenceSourceLabel()` helpers:

```js
function publishingFitLabel(value) {
  return (
    {
      high: "高",
      medium: "中",
      low: "低"
    }[value] || value || "-"
  );
}

function publishingStatusLabel(value) {
  return (
    {
      draft_package: "草稿包",
      approved_package: "已通过",
      rejected_package: "已驳回",
      exported: "已导出",
      manually_published: "人工发布",
      pending_review: "待审核",
      approved: "已通过",
      rejected: "已驳回",
      planned: "计划中",
      packaged: "已打包",
      not_published: "未发布",
      blocked: "受阻",
      unknown: "未知",
      not_checked: "未核验",
      not_indexed: "未收录",
      indexed: "已收录",
      not_mentioned: "未提及",
      mentioned: "已提及",
      not_cited: "未引用",
      cited: "已引用",
      not_recommended: "未推荐",
      recommended: "已推荐"
    }[value] || value || "-"
  );
}
```

- [ ] **Step 2: Add platform matrix renderer**

Add this renderer before `renderInternationalGeo()`:

```js
function renderPublishingPlatformMatrix(publishing = {}) {
  const rows = publishing.platforms || [];
  const table = tableMarkup(
    ["平台", "类型", "适配资产", "AI 引擎适配", "价值", "风险", "模式"],
    rows.map((item) => [
      `<div class="cell-title">${escapeHtml(item.platform_name || "-")}</div><div class="cell-sub">${escapeHtml(item.platform_key || "-")}</div>`,
      `${statusMarkup(item.platform_type || "-")}<div class="cell-sub">${escapeHtml(item.category || "-")}</div>`,
      `<div class="cell-sub">${escapeHtml((item.recommended_asset_types || []).join(", ") || "-")}</div>`,
      `<div class="cell-sub">ChatGPT Search ${escapeHtml(publishingFitLabel(item.ai_visibility_fit?.chatgpt_search))} / Gemini ${escapeHtml(publishingFitLabel(item.ai_visibility_fit?.gemini))} / Claude ${escapeHtml(publishingFitLabel(item.ai_visibility_fit?.claude))}</div><div class="cell-sub">Perplexity ${escapeHtml(publishingFitLabel(item.ai_visibility_fit?.perplexity))} / Google AIO ${escapeHtml(publishingFitLabel(item.ai_visibility_fit?.google_ai_overviews))} / Bing ${escapeHtml(publishingFitLabel(item.ai_visibility_fit?.copilot_bing))}</div>`,
      `<div class="cell-sub">Index ${escapeHtml(publishingFitLabel(item.indexing_value))} / Citation ${escapeHtml(publishingFitLabel(item.citation_value))} / Entity ${escapeHtml(publishingFitLabel(item.entity_validation_value))}</div>`,
      statusMarkup(item.risk_level || "-"),
      `<div class="cell-title">${escapeHtml(item.publishing_mode || "manual")}</div><div class="cell-sub">${escapeHtml(item.connector_status || "not_supported")}</div>`
    ])
  );
  return `
    <section class="surface panel" data-international-panel="publishing-platforms">
      <div class="panel-heading">
        <div>
          <h2>发布平台矩阵</h2>
          <div class="panel-note">Manual / local platform planning only. No external credentials or automatic publishing.</div>
        </div>
      </div>
      ${table}
    </section>
  `;
}
```

- [ ] **Step 3: Add package queue renderer**

Add this renderer after `renderPublishingPlatformMatrix()`:

```js
function renderPublishingPackageQueue(publishing = {}) {
  const rows = publishing.packages || [];
  const table = tableMarkup(
    ["发布包", "来源资产", "平台", "类型", "状态", "动作"],
    rows.map((item) => [
      `<div class="cell-title">${escapeHtml(item.title || "-")}</div><div class="cell-sub">${escapeHtml(item.evidence_summary || "-")}</div>`,
      `<div class="cell-title">${escapeHtml(item.source_asset_type || "-")}</div><div class="cell-sub">${escapeHtml(item.evidence_source_type || "-")}:${escapeHtml(item.evidence_source_id || "-")}</div>`,
      `<div class="cell-title">${escapeHtml(item.platform_name || "-")}</div><div class="cell-sub">${escapeHtml(item.target_prompt || "-")}</div>`,
      statusMarkup(item.package_type || "-"),
      `${statusMarkup(publishingStatusLabel(item.review_status))}<div class="cell-sub">${escapeHtml(publishingStatusLabel(item.package_status))}</div>`,
      `<div class="action-row">
        <button class="ghost-btn" data-action="international-publishing-package-reject" data-package-id="${escapeHtml(item.id || "")}">驳回</button>
        <button class="secondary-btn" data-action="international-publishing-package-approve" data-package-id="${escapeHtml(item.id || "")}">审核通过</button>
      </div>`
    ])
  );
  return `
    <section class="surface panel" data-international-panel="publishing-packages">
      <div class="panel-heading">
        <div>
          <h2>发布包队列</h2>
          <div class="panel-note">Generated from approved evidence assets. Packages are briefs, outlines, and checklists, not full articles.</div>
        </div>
        <button class="secondary-btn" data-action="international-publishing-packages-generate">生成发布包</button>
      </div>
      ${rows.length ? table : `<div class="empty-state">暂无发布包。先审核通过证据资产，再生成发布包。</div>`}
    </section>
  `;
}
```

- [ ] **Step 4: Add tracking ledger renderer**

Add this renderer after `renderPublishingPackageQueue()`:

```js
function renderPublishingTrackingLedger(publishing = {}) {
  const rows = publishing.tracking || [];
  const table = tableMarkup(
    ["平台", "Published URL", "Canonical", "发布", "收录", "AI 提及", "引用", "推荐", "更新时间"],
    rows.map((item) => [
      `<div class="cell-title">${escapeHtml(item.platform_name || "-")}</div><div class="cell-sub">${escapeHtml(item.target_prompt || "-")}</div>`,
      item.published_url ? `<a href="${escapeHtml(item.published_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.published_url)}</a>` : `<button class="ghost-btn" data-action="international-publishing-tracking-demo-update" data-tracking-id="${escapeHtml(item.id || "")}">记录人工发布</button>`,
      `<div class="cell-sub">${escapeHtml(item.canonical_url || "-")}</div>`,
      statusMarkup(publishingStatusLabel(item.publication_status)),
      statusMarkup(publishingStatusLabel(item.indexing_status)),
      statusMarkup(publishingStatusLabel(item.ai_mention_status)),
      statusMarkup(publishingStatusLabel(item.citation_status)),
      statusMarkup(publishingStatusLabel(item.recommendation_status)),
      `<div class="cell-sub">${escapeHtml(item.updated_at || "-")}</div>`
    ])
  );
  return `
    <section class="surface panel" data-international-panel="publishing-tracking">
      <div class="panel-heading">
        <div>
          <h2>收录与推荐追踪</h2>
          <div class="panel-note">Manual / local tracking only. Unknown and not_checked are not measured engine evidence.</div>
        </div>
      </div>
      ${rows.length ? table : `<div class="empty-state">暂无追踪记录。生成发布包后会创建本地追踪行。</div>`}
    </section>
  `;
}
```

- [ ] **Step 5: Insert publishing panels in `renderInternationalGeo()`**

In `renderInternationalGeo(data = internationalGeo)`, define:

```js
  const publishing = data.publishing || {};
```

Insert these renderers after the line that renders `${renderGeoAssetPreviews(mergeGeoAssetPreviews(data.geo_assets || [], data.evidence_assets || {}))}` and before the market scope panel:

```js
    ${renderPublishingPlatformMatrix(publishing)}
    ${renderPublishingPackageQueue(publishing)}
    ${renderPublishingTrackingLedger(publishing)}
```

- [ ] **Step 6: Run tests and commit UI**

Run:

```bash
npm run check
```

Expected: PASS for all non-doc assertions if docs/version assertions have not been added, or FAIL only on docs/version assertions if already added.

Commit:

```bash
git add prototype/src/pages/international.js verify-mvp.mjs
git commit -m "feat: render publishing workflow panels"
```

## Task 6: Documentation And Version Alignment

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
- Create: `docs/STAGE_V0_15_CLOSEOUT.md`

- [ ] **Step 1: Bump version**

Change `package.json`:

```json
  "version": "0.15.0",
```

- [ ] **Step 2: Add changelog entry**

Insert this entry at the top of `CHANGELOG.md`:

```markdown
## 0.15.0 - 2026-07-07

International GEO publishing platform workflow.

### Added

- Local publishing platform matrix for owned, developer, professional social, community, Q&A, video, directory, review-site, and knowledge-base destinations.
- Deterministic publishing package generation from approved International GEO evidence assets.
- Review-only publishing package queue for website article briefs, docs updates, GitHub README updates, LinkedIn posts, Reddit/Quora answers, YouTube outlines, developer article briefs, Product Hunt listings, review profile checklists, and directory checklists.
- Manual/local tracking records for publication URL, canonical URL, indexing status, AI mention status, citation status, and recommendation status.
- International GEO UI panels for `发布平台矩阵`, `发布包队列`, and `收录与推荐追踪`.

### Boundaries

- v0.15 does not automatically publish to external platforms.
- v0.15 does not store external platform credentials.
- v0.15 does not generate full long-form articles.
- v0.15 does not query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing providers, or external platforms.
- v0.15 tracking values are manual/local records unless a future connector supplies approved evidence.
```

- [ ] **Step 3: Add API reference section**

In `docs/API_REFERENCE.md`, add:

```markdown
### International GEO Publishing Workflow

These routes power local publishing platform planning, review package generation, and manual tracking records.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/international-geo/publishing` | viewer | Read summary, platforms, packages, and tracking records. |
| `GET` | `/api/v1/international-geo/publishing/platforms` | viewer | Read the platform matrix. |
| `GET` | `/api/v1/international-geo/publishing/packages` | viewer | Read publishing package queue rows. |
| `GET` | `/api/v1/international-geo/publishing/tracking` | viewer | Read manual tracking records. |
| `POST` | `/api/v1/international-geo/publishing/packages/generate` | editor | Generate review packages from approved evidence assets. |
| `POST` | `/api/v1/international-geo/publishing/packages/:id/review` | editor | Approve or reject a local review package. |
| `PUT` | `/api/v1/international-geo/publishing/tracking/:id` | editor | Update manual publication, indexing, mention, citation, and recommendation statuses. |

Publishing workflow boundary: these routes do not publish externally, accept external platform credentials, create full articles, query AI/search providers, or claim measured indexing, citation, mention, or recommendation evidence.
```

- [ ] **Step 4: Update stage language across docs**

Update the listed docs so each one says the current snapshot is `v0.15.0` and describes the new local publishing workflow boundary:

```text
v0.15.0 adds an International GEO publishing platform matrix, review-only package queue, and manual/local indexing, AI mention, citation, and recommendation tracking. It does not automatically publish externally, manage external credentials, generate full articles, call live AI/search/SERP/indexing providers, or claim measured inclusion without approved provider evidence.
```

Apply this text in the sections that currently describe `v0.14.0`, post-v0.14 gaps, and production limitations.

- [ ] **Step 5: Create closeout doc**

Create `docs/STAGE_V0_15_CLOSEOUT.md`:

```markdown
# v0.15 Stage Closeout - Publishing Platform Workflow

Date: 2026-07-07

## Scope Completed

- Added an International GEO publishing platform matrix for owned, developer, professional social, community, Q&A, video, directory, review-site, and knowledge-base destinations.
- Added deterministic publishing package generation from approved evidence assets.
- Added review state for local publishing packages.
- Added manual/local tracking records for publication URL, canonical URL, indexing status, AI mention status, citation status, and recommendation status.
- Added International GEO UI panels for `发布平台矩阵`, `发布包队列`, and `收录与推荐追踪`.
- Added API routes for reading publishing workflow state, generating packages, reviewing packages, and updating tracking records.

## Operating Boundary

v0.15 is a local planning and handoff workflow. It does not automatically publish to external platforms, store external platform credentials, generate full long-form articles, query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing providers, or verify real external inclusion. Tracking values are manual/local records unless a future approved connector supplies measured evidence.

## Verification

- `npm run check`

## Maintainer Notes

- Keep package generation tied to approved evidence assets.
- Keep platform recommendations deterministic and review-first.
- Keep all measured AI/search inclusion claims behind future connector evidence.
- Before adding automatic publishing, define connector permissions, credential storage, external API error handling, moderation policy, audit events, and rollback behavior.
```

- [ ] **Step 6: Commit docs**

Run:

```bash
npm run check
```

Expected: PASS.

Commit:

```bash
git add package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_15_CLOSEOUT.md
git commit -m "docs: close publishing workflow v0.15"
```

## Task 7: Final Verification And Release Hygiene

**Files:**
- Inspect: all modified files

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run check
```

Expected:

```text
verify-mvp: OK
```

- [ ] **Step 2: Inspect git diff**

Run:

```bash
git status --short --branch
git log --oneline -5
```

Expected:

Expected: the branch status shows `main` ahead of `origin/main` by at least the v0.15 implementation commits, and the latest commits include the v0.15 design, tests, model, API, UI, docs, and closeout work.

- [ ] **Step 3: Run boundary source scan**

Run:

```bash
rg "automatic publish|auto publish|measured indexing|measured citation|measured recommendation|full article" README.md docs prototype/src mock-data.mjs server.mjs
```

Expected: Any matches must be boundary statements that deny those capabilities or conservative package labels that say generated packages are not full articles.

- [ ] **Step 4: Push when verification passes**

Run:

```bash
git push
```

Expected: push succeeds to `origin/main`.

- [ ] **Step 5: Check GitHub Actions**

Run:

```bash
gh run list --limit 3
gh run watch
```

Expected: the latest workflow for the pushed v0.15 commits passes.

## Self-Review

- Spec coverage: The plan covers the platform matrix, AI engine fit, package generation, package queue, package review, manual tracking, API routes, UI panels, role boundaries, docs, version bump, and closeout document.
- Product boundary: The plan keeps all publishing, indexing, AI mention, citation, and recommendation statuses manual/local and excludes external publishing, credentials, full articles, live AI engine calls, SERP calls, and indexing-provider calls.
- Type consistency: `getInternationalGeoPublishingState`, `generateInternationalGeoPublishingPackagesAction`, `reviewInternationalGeoPublishingPackageAction`, and `updateInternationalGeoPublishingTrackingAction` are used consistently across tests, mock data, server, and browser API layers.
- UI consistency: The plan reuses existing dense admin panels, tables, status pills, and action rows from `DESIGN.md`; no new top-level navigation or marketing layout is introduced.
