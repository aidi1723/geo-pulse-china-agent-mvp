# Article Generation And Platform Rewrites v0.16 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build local-rule International GEO complete article generation and multi-platform rewrite generation from approved evidence assets.

**Architecture:** Extend the existing `internationalGeoState` in `mock-data.mjs` with generated articles, platform rewrites, generation runs, and a reserved provider seam. Add narrow API routes under `/api/v1/international-geo/content-generation`, wire browser actions/events, and render three dense-admin panels in the existing International GEO page. Keep generation deterministic, evidence-backed, review-first, and local-only.

**Tech Stack:** Node.js ESM, zero-dependency HTTP server, local mock state, browser HTML rendering, `verify-mvp.mjs` assertions, GitHub Actions running `npm run check`.

---

## File Structure

- Modify `mock-data.mjs`
  - Add `content_generation` shape inside `internationalGeoState`.
  - Add local generation provider rows.
  - Add generated article and rewrite models.
  - Add generation and review actions.
  - Persist and hydrate new arrays.

- Modify `server.mjs`
  - Import new model/action functions.
  - Add five `/international-geo/content-generation` routes.
  - Preserve existing auth and role gate behavior through current API router.

- Modify `prototype/src/api.js`
  - Add client API wrappers for read, article generation, rewrite generation, article review, and rewrite review.

- Modify `prototype/src/main.js`
  - Import new API wrappers.
  - Add action handlers for generate/review flows.
  - Refresh International GEO data after each action.

- Modify `prototype/src/events.js`
  - Wire new `data-action` names.

- Modify `prototype/src/pages/international.js`
  - Render `文章生成队列`, `多平台改写稿`, and `生成记录`.
  - Keep dense table/status patterns from `DESIGN.md`.

- Modify `verify-mvp.mjs`
  - Add source wiring checks.
  - Add mock-data behavior checks.
  - Add HTTP role checks.
  - Add UI rendering checks.

- Modify docs
  - `README.md`
  - `CHANGELOG.md`
  - `docs/API_REFERENCE.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DEVELOPMENT.md`
  - `docs/ROADMAP.md`
  - `docs/PHASE_2_ROADMAP.md`
  - `docs/PRODUCTION_DEPLOYMENT.md`
  - `docs/OPEN_SOURCE_RELEASE.md`
  - `docs/README.md`
  - `docs/MAINTENANCE.md`
  - Add `docs/STAGE_V0_16_CLOSEOUT.md`

---

### Task 1: Add Failing Source And UI Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add source wiring assertions**

In `runSingleUserSourceChecks()`, after the International GEO publishing assertions, add:

```js
  assert.match(
    apiSource,
    /export function getInternationalGeoContentGeneration\(\)/,
    "International GEO content generation should have a read client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoArticles\(\)/,
    "International GEO article generation should have a client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoPlatformRewrites\(\)/,
    "International GEO platform rewrite generation should have a client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoGeneratedArticle\(articleId, payload = \{\}\)/,
    "International GEO generated article review should have a client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoPlatformRewrite\(rewriteId, payload = \{\}\)/,
    "International GEO platform rewrite review should have a client API method"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoArticles as generateInternationalGeoArticlesApi/,
    "International GEO article generation should be imported into the browser action layer"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoPlatformRewrites as generateInternationalGeoPlatformRewritesApi/,
    "International GEO platform rewrite generation should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-content-articles-generate"/,
    "International GEO article generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-content-rewrites-generate"/,
    "International GEO platform rewrite generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-content-article-approve"/,
    "International GEO generated article approval should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-content-rewrite-approve"/,
    "International GEO platform rewrite approval should be wired in the event dispatcher"
  );
```

- [ ] **Step 2: Add UI rendering assertions**

In `runInternationalGeoUiChecks()`, after the evidence asset assertions and before publishing panel assertions, add:

```js
  assert.match(siteAuditHtml, /文章生成队列/, "International GEO should render generated article queue");
  assert.match(siteAuditHtml, /多平台改写稿/, "International GEO should render platform rewrites");
  assert.match(siteAuditHtml, /生成记录/, "International GEO should render content generation runs");
  assert.match(siteAuditHtml, /data-action="international-content-articles-generate"/);
  assert.match(siteAuditHtml, /data-action="international-content-rewrites-generate"/);
  assert.match(siteAuditHtml, /local_rules/, "Content generation UI should expose local_rules provider boundary");
```

- [ ] **Step 3: Run the failing check**

Run:

```bash
npm run check
```

Expected: FAIL with an assertion that `getInternationalGeoContentGeneration` or `文章生成队列` is missing.

- [ ] **Step 4: Commit failing tests**

```bash
git add verify-mvp.mjs
git commit -m "test: require international content generation workflow"
```

---

### Task 2: Add Mock Data Behavior Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add imports**

At the top import list from `./mock-data.mjs`, add these names:

```js
  generateInternationalGeoArticlesAction,
  generateInternationalGeoPlatformRewritesAction,
  getInternationalGeoContentGenerationState,
  reviewInternationalGeoGeneratedArticleAction,
  reviewInternationalGeoPlatformRewriteAction,
```

- [ ] **Step 2: Add model behavior assertions**

In `runMockDataChecks()`, after the publishing workflow checks, add:

```js
  const contentGenerationInitial = getInternationalGeoContentGenerationState();
  assert.ok(contentGenerationInitial.summary, "Content generation should expose a summary");
  assert.ok(
    contentGenerationInitial.providers.some((item) => item.id === "local_rules" && item.status === "active"),
    "Content generation should expose local_rules as the active provider"
  );
  assert.ok(
    contentGenerationInitial.providers.every((item) => item.id === "local_rules" || item.status === "reserved"),
    "External generation providers should be reserved, not active"
  );
  assert.ok(Array.isArray(contentGenerationInitial.articles), "Content generation should expose article rows");
  assert.ok(Array.isArray(contentGenerationInitial.rewrites), "Content generation should expose rewrite rows");
  assert.ok(Array.isArray(contentGenerationInitial.runs), "Content generation should expose generation runs");

  const generatedArticles = generateInternationalGeoArticlesAction();
  assert.ok(generatedArticles.articles.length >= 1, "Article generation should create article drafts");
  assert.ok(
    generatedArticles.articles.every(
      (item) =>
        item.generator_provider === "local_rules" &&
        item.review_status === "pending_review" &&
        item.article_status === "draft" &&
        item.source_asset_ids?.length &&
        item.source_asset_types?.length &&
        item.evidence_summary &&
        item.target_prompt &&
        item.content?.includes("Direct Answer Upfront") &&
        item.content?.includes("Human review checklist")
    ),
    "Generated articles should preserve local provider, evidence provenance, content, and review state"
  );
  assert.ok(
    generatedArticles.runs.some((item) => item.run_type === "article_generation" && item.status === "completed"),
    "Article generation should record a completed run"
  );

  const articleToApprove = generatedArticles.articles[0];
  const approvedArticle = reviewInternationalGeoGeneratedArticleAction(articleToApprove.id, {
    action: "approve",
    human_notes: "Claims checked for rewrite generation."
  });
  assert.equal(approvedArticle.review_status, "approved", "Generated article review should approve articles");
  assert.equal(approvedArticle.article_status, "approved_article", "Approved generated article should update status");

  assert.throws(
    () => reviewInternationalGeoGeneratedArticleAction(articleToApprove.id, { action: "publish" }),
    /VALIDATION_ERROR/,
    "Invalid generated article review actions should fail"
  );

  const generatedRewrites = generateInternationalGeoPlatformRewritesAction();
  assert.ok(generatedRewrites.rewrites.length >= 3, "Rewrite generation should create platform rewrites");
  assert.ok(
    generatedRewrites.rewrites.every(
      (item) =>
        item.generator_provider === "local_rules" &&
        item.review_status === "pending_review" &&
        item.rewrite_status === "draft" &&
        item.source_article_id === approvedArticle.id &&
        item.platform_key &&
        item.platform_name &&
        item.rewrite_type &&
        item.ai_visibility_goal &&
        item.moderation_notes?.length &&
        item.content?.includes("Canonical URL")
    ),
    "Generated rewrites should preserve source article, platform mapping, moderation notes, and content"
  );
  assert.ok(
    generatedRewrites.runs.some((item) => item.run_type === "platform_rewrite_generation" && item.status === "completed"),
    "Rewrite generation should record a completed run"
  );

  const rewriteToApprove = generatedRewrites.rewrites[0];
  const approvedRewrite = reviewInternationalGeoPlatformRewriteAction(rewriteToApprove.id, {
    action: "approve",
    human_notes: "Platform copy checked."
  });
  assert.equal(approvedRewrite.review_status, "approved", "Platform rewrite review should approve rewrites");
  assert.equal(approvedRewrite.rewrite_status, "approved_rewrite", "Approved platform rewrite should update status");

  assert.throws(
    () => reviewInternationalGeoPlatformRewriteAction(rewriteToApprove.id, { action: "publish" }),
    /VALIDATION_ERROR/,
    "Invalid platform rewrite review actions should fail"
  );
```

- [ ] **Step 3: Run the failing check**

Run:

```bash
npm run check
```

Expected: FAIL with an import error or missing export for `getInternationalGeoContentGenerationState`.

- [ ] **Step 4: Commit failing behavior tests**

```bash
git add verify-mvp.mjs
git commit -m "test: cover international article and rewrite generation"
```

---

### Task 3: Implement Local Generation Model

**Files:**
- Modify: `mock-data.mjs`

- [ ] **Step 1: Extend initial state shape**

Inside `internationalGeoState`, add:

```js
  content_generation: {
    providers: [],
    articles: [],
    rewrites: [],
    runs: []
  },
```

Inside `ensureInternationalGeoStateShape()`, add:

```js
  if (!internationalGeoState.content_generation || typeof internationalGeoState.content_generation !== "object") {
    internationalGeoState.content_generation = {
      providers: [],
      articles: [],
      rewrites: [],
      runs: []
    };
  }
  if (!Array.isArray(internationalGeoState.content_generation.providers)) {
    internationalGeoState.content_generation.providers = defaultInternationalGeoGenerationProviders();
  }
  if (!internationalGeoState.content_generation.providers.length) {
    internationalGeoState.content_generation.providers = defaultInternationalGeoGenerationProviders();
  }
  if (!Array.isArray(internationalGeoState.content_generation.articles)) {
    internationalGeoState.content_generation.articles = [];
  }
  if (!Array.isArray(internationalGeoState.content_generation.rewrites)) {
    internationalGeoState.content_generation.rewrites = [];
  }
  if (!Array.isArray(internationalGeoState.content_generation.runs)) {
    internationalGeoState.content_generation.runs = [];
  }
```

- [ ] **Step 2: Add provider and summary helpers**

Add after `hydrateInternationalGeoPublishingPlatforms()`:

```js
function defaultInternationalGeoGenerationProviders() {
  return [
    {
      id: "local_rules",
      label: "Local Rules",
      status: "active",
      provider_type: "local",
      external_credentials_required: false,
      supported_outputs: ["article", "platform_rewrite"],
      notes: "Deterministic local generator. No external AI calls."
    },
    {
      id: "openai",
      label: "OpenAI",
      status: "reserved",
      provider_type: "external_llm",
      external_credentials_required: true,
      supported_outputs: ["article", "platform_rewrite"],
      notes: "Reserved provider seam. Not executed in v0.16."
    },
    {
      id: "claude",
      label: "Claude",
      status: "reserved",
      provider_type: "external_llm",
      external_credentials_required: true,
      supported_outputs: ["article", "platform_rewrite"],
      notes: "Reserved provider seam. Not executed in v0.16."
    },
    {
      id: "gemini",
      label: "Gemini",
      status: "reserved",
      provider_type: "external_llm",
      external_credentials_required: true,
      supported_outputs: ["article", "platform_rewrite"],
      notes: "Reserved provider seam. Not executed in v0.16."
    }
  ];
}

function contentGenerationSummary() {
  const contentGeneration = internationalGeoState.content_generation || {};
  const articles = contentGeneration.articles || [];
  const rewrites = contentGeneration.rewrites || [];
  const runs = contentGeneration.runs || [];
  return {
    provider_count: (contentGeneration.providers || []).length,
    article_count: articles.length,
    approved_article_count: articles.filter((item) => item.review_status === "approved").length,
    rewrite_count: rewrites.length,
    approved_rewrite_count: rewrites.filter((item) => item.review_status === "approved").length,
    run_count: runs.length,
    active_provider: "local_rules"
  };
}
```

- [ ] **Step 3: Add article content generator**

Add after `evidenceAssetContent()`:

```js
function generatedArticleTitle(assets = []) {
  const input = internationalGeoState.input || defaultInternationalGeoInput;
  const prompt = input.primary_query || assets[0]?.target_prompt || "AI search visibility";
  return `${input.product_name || workspaceInput.product_name || "Product"} guide for ${prompt}`;
}

function generatedArticleContent(assets = []) {
  const input = internationalGeoState.input || defaultInternationalGeoInput;
  const product = input.product_name || workspaceInput.product_name || "Product";
  const prompt = input.primary_query || assets[0]?.target_prompt || "AI search visibility";
  const url = input.website_url || workspaceInput.website_url || assets[0]?.target_url || "";
  const evidenceRows = assets
    .map((asset) => `| ${asset.asset_type || "asset"} | ${asset.evidence_summary || asset.title || asset.id} | ${asset.id} |`)
    .join("\n");
  return `# ${generatedArticleTitle(assets)}

## Direct Answer Upfront
${product} should answer "${prompt}" with direct, source-backed facts, a canonical URL, structured data, and reviewable evidence. This local draft is generated from approved GEO evidence assets and must be reviewed before external publishing.

## Category Or Problem Definition
Buyers searching for ${prompt} need a concise explanation of the product category, the buyer problem, and the decision criteria that separate credible options from generic content.

## Product Positioning
${product} should be positioned with verified capabilities, supported markets, implementation boundaries, and links back to the canonical source.

## Evidence Table
| Evidence type | Summary | Source asset |
| --- | --- | --- |
${evidenceRows}

## Buyer Decision Criteria
- Confirm the official website and canonical URL.
- Check whether the page includes direct answers in the first section.
- Verify product facts, limitations, and comparison claims.
- Add JSON-LD, FAQ, sitemap, and /llms.txt references where relevant.
- Build third-party validation only from compliant public profiles and communities.

## Comparison, Alternatives, Or Specification Notes
Use approved comparison, alternatives, product-spec, or buyer-guide evidence only. Remove unsupported rankings, guarantees, or claims about real AI engine recommendations unless measured provider evidence exists.

## FAQ
### What should buyers know first?
They should know what ${product} does, who it is for, what evidence supports the claims, and where the canonical source lives.

### Does this draft prove AI recommendation?
No. It can improve retrieval and citation readiness, but real inclusion, citation, and recommendation must be measured or manually verified.

### Which canonical URL should be used?
Canonical URL: ${url}

## Schema, llms.txt, And Canonical Recommendations
- Keep Organization, Product, SoftwareApplication, FAQPage, Article, and BreadcrumbList schema aligned with the page.
- Keep /llms.txt concise and synchronized with the canonical page.
- Link supporting third-party profiles back to the canonical URL when platform policy allows it.

## Human Review Checklist
- Verify every product claim against approved evidence.
- Remove unsupported superlatives.
- Confirm canonical URL and target language.
- Confirm community posts disclose affiliation.
- Confirm this draft is not presented as measured AI inclusion or recommendation evidence.
`;
}
```

- [ ] **Step 4: Add rewrite content generator**

Add after `generatedArticleContent()`:

```js
function rewriteTypeForPlatform(platformKey) {
  return (
    {
      official_blog: "official_blog_article",
      medium: "medium_article",
      devto: "devto_article",
      hashnode: "hashnode_article",
      linkedin_company: "linkedin_post",
      linkedin_founder: "linkedin_post",
      reddit: "reddit_answer",
      quora: "quora_answer",
      youtube: "youtube_description",
      github: "github_readme_section",
      docs: "docs_section",
      product_hunt: "product_hunt_listing",
      g2: "g2_profile_copy",
      capterra: "capterra_profile_copy",
      alternative_to: "directory_listing",
      saasworthy: "directory_listing"
    }[platformKey] || "directory_listing"
  );
}

function platformRewriteContent(article, platform) {
  const rewriteType = rewriteTypeForPlatform(platform.platform_key);
  const canonicalUrl = article.canonical_url || article.target_url || "";
  const base = `Source article: ${article.title}
Canonical URL: ${canonicalUrl}
Provider: local_rules
Review required: verify claims before publishing.`;

  if (rewriteType === "linkedin_post") {
    return `# LinkedIn post

Teams evaluating ${article.target_prompt} should start with verifiable evidence: direct answers, structured data, canonical sources, and clear product boundaries.

${base}

Keep the post professional, disclose affiliation when relevant, and avoid unsupported ranking claims.`;
  }

  if (rewriteType === "reddit_answer" || rewriteType === "quora_answer") {
    return `# Helpful answer

Question angle: ${article.target_prompt}

Start with a neutral answer, explain evaluation criteria, and mention ${article.title} only when it directly helps the reader.

${base}

Disclose affiliation. Do not post promotional copy. Follow platform and community rules.`;
  }

  if (rewriteType === "youtube_description") {
    return `# YouTube description and chapter outline

Title: How to evaluate ${article.target_prompt}

Chapters:
1. Buyer problem
2. Direct answer
3. Evidence requirements
4. Product or workflow proof
5. Limitations and next steps

${base}

Add demo proof before publishing the description.`;
  }

  if (rewriteType === "github_readme_section" || rewriteType === "docs_section") {
    return `# Technical documentation section

Add a concise section explaining AI search and GEO readiness.

Include:
- verified product capabilities
- setup or workflow context only when confirmed
- canonical docs link
- limitations

${base}`;
  }

  if (rewriteType === "product_hunt_listing") {
    return `# Product Hunt listing copy

Product angle: ${article.target_prompt}

Prepare:
- tagline for reviewer approval
- maker note
- screenshot checklist
- category and positioning statement

${base}`;
  }

  if (rewriteType === "g2_profile_copy" || rewriteType === "capterra_profile_copy" || rewriteType === "directory_listing") {
    return `# Directory or review profile copy

Category: ${article.target_prompt}

Profile fields:
- product description
- category fit
- feature proof
- screenshot and review policy checklist

${base}`;
  }

  return `# Third-party article rewrite

Use this as a neutral explanatory article for ${platform.platform_name}.

Sections:
- direct answer
- product/category context
- evidence table summary
- limitations
- canonical reference

${base}`;
}
```

- [ ] **Step 5: Add exported state and actions**

Add after `getInternationalGeoPublishingState()`:

```js
export function getInternationalGeoContentGenerationState() {
  ensureInternationalGeoStateShape();
  const contentGeneration = internationalGeoState.content_generation;
  return deepClone({
    summary: contentGenerationSummary(),
    providers: contentGeneration.providers,
    articles: contentGeneration.articles,
    rewrites: contentGeneration.rewrites,
    runs: contentGeneration.runs
  });
}

export function generateInternationalGeoArticlesAction() {
  ensureInternationalGeoStateShape();
  const contentGeneration = internationalGeoState.content_generation;
  const approvedAssets = (internationalGeoState.geo_assets || []).filter(
    (item) => item.review_status === "approved" && item.opportunity_id
  );
  const run = {
    id: uniqueId("geogen"),
    run_type: "article_generation",
    generator_provider: "local_rules",
    status: approvedAssets.length ? "completed" : "blocked",
    input_asset_count: approvedAssets.length,
    output_article_count: approvedAssets.length ? 1 : 0,
    output_rewrite_count: 0,
    diagnostics: approvedAssets.length
      ? ["Generated from approved evidence assets only."]
      : ["Approve at least one evidence asset before generating articles."],
    started_at: nowIso(),
    finished_at: nowIso()
  };
  contentGeneration.runs.unshift(run);

  if (!approvedAssets.length) {
    persistState();
    return getInternationalGeoContentGenerationState();
  }

  const assetKey = approvedAssets.map((item) => item.id).sort().join(":");
  const existing = contentGeneration.articles.find((item) => item.source_asset_key === assetKey);
  if (!existing) {
    const input = internationalGeoState.input || defaultInternationalGeoInput;
    const article = {
      id: uniqueId("geoart"),
      source_asset_key: assetKey,
      source_asset_ids: approvedAssets.map((item) => item.id),
      source_asset_types: Array.from(new Set(approvedAssets.map((item) => item.asset_type))),
      generator_provider: "local_rules",
      generation_run_id: run.id,
      title: generatedArticleTitle(approvedAssets),
      target_prompt: input.primary_query || approvedAssets[0]?.target_prompt || "AI search visibility",
      target_market: input.target_market || "Global",
      target_language: input.target_language || "en",
      target_url: input.website_url || workspaceInput.website_url || "",
      canonical_url: input.website_url || workspaceInput.website_url || "",
      article_type: "geo_article",
      content_type: "text/markdown",
      word_count_estimate: 1200,
      review_status: "pending_review",
      article_status: "draft",
      content: generatedArticleContent(approvedAssets),
      outline: [
        "Direct Answer Upfront",
        "Category or problem definition",
        "Product positioning",
        "Evidence table",
        "Buyer decision criteria",
        "FAQ",
        "Human review checklist"
      ],
      evidence_summary: `Uses ${approvedAssets.length} approved International GEO evidence assets.`,
      risk_notes: [
        "Verify unsupported claims before publishing.",
        "Do not present this draft as measured AI inclusion or recommendation evidence."
      ],
      created_at: nowIso(),
      reviewed_at: null,
      human_notes: ""
    };
    contentGeneration.articles.unshift(article);
  }

  recordAuditEvent("international_geo.content_generation.article.generate", "international_geo_content_generation", run.id, {
    article_count: run.output_article_count,
    input_asset_count: run.input_asset_count
  });
  persistState();
  return getInternationalGeoContentGenerationState();
}
```

Continue the same export block with rewrite and review actions:

```js
export function reviewInternationalGeoGeneratedArticleAction(articleId, payload = {}) {
  ensureInternationalGeoStateShape();
  const action = String(payload.action || "").trim();
  if (!["approve", "reject"].includes(action)) {
    throw validationError("action", "Review action must be approve or reject.");
  }
  const article = internationalGeoState.content_generation.articles.find((item) => item.id === articleId);
  if (!article) return null;
  article.review_status = action === "approve" ? "approved" : "rejected";
  article.article_status = action === "approve" ? "approved_article" : "rejected_article";
  article.reviewed_at = nowIso();
  article.human_notes = String(payload.human_notes || "").trim();
  recordAuditEvent("international_geo.content_generation.article.review", "international_geo_generated_article", article.id, {
    action: article.review_status
  });
  persistState();
  return deepClone(article);
}

export function generateInternationalGeoPlatformRewritesAction() {
  ensureInternationalGeoStateShape();
  const contentGeneration = internationalGeoState.content_generation;
  const approvedArticles = contentGeneration.articles.filter((item) => item.review_status === "approved");
  const platforms = internationalGeoState.publishing_platforms || [];
  const run = {
    id: uniqueId("geogen"),
    run_type: "platform_rewrite_generation",
    generator_provider: "local_rules",
    status: approvedArticles.length ? "completed" : "blocked",
    input_asset_count: approvedArticles.length,
    output_article_count: 0,
    output_rewrite_count: 0,
    diagnostics: approvedArticles.length
      ? ["Generated platform rewrites from approved articles only."]
      : ["Approve at least one generated article before generating platform rewrites."],
    started_at: nowIso(),
    finished_at: nowIso()
  };
  contentGeneration.runs.unshift(run);

  approvedArticles.forEach((article) => {
    platforms.forEach((platform) => {
      const rewriteType = rewriteTypeForPlatform(platform.platform_key);
      const pairKey = `${article.id}:${platform.platform_key}`;
      if (contentGeneration.rewrites.some((item) => item.source_article_platform_key === pairKey)) return;
      contentGeneration.rewrites.unshift({
        id: uniqueId("georw"),
        source_article_id: article.id,
        source_article_platform_key: pairKey,
        platform_key: platform.platform_key,
        platform_name: platform.platform_name,
        rewrite_type: rewriteType,
        generator_provider: "local_rules",
        generation_run_id: run.id,
        title: `${platform.platform_name} rewrite for ${article.title}`,
        content_type: "text/markdown",
        content: platformRewriteContent(article, platform),
        format_notes: [
          `Format: ${rewriteType}`,
          "Use canonical link only after human review."
        ],
        ai_visibility_goal: platform.ai_recommendation_note || "Strengthen entity and citation readiness.",
        moderation_notes: [
          "Verify claims before publishing.",
          platform.risk_level === "high" ? "High-risk platform: avoid promotional language." : "Keep source-backed factual language."
        ],
        review_status: "pending_review",
        rewrite_status: "draft",
        created_at: nowIso(),
        reviewed_at: null,
        human_notes: ""
      });
      run.output_rewrite_count += 1;
    });
    article.article_status = "rewrites_generated";
  });

  recordAuditEvent("international_geo.content_generation.rewrite.generate", "international_geo_content_generation", run.id, {
    rewrite_count: run.output_rewrite_count,
    article_count: approvedArticles.length
  });
  persistState();
  return getInternationalGeoContentGenerationState();
}

export function reviewInternationalGeoPlatformRewriteAction(rewriteId, payload = {}) {
  ensureInternationalGeoStateShape();
  const action = String(payload.action || "").trim();
  if (!["approve", "reject"].includes(action)) {
    throw validationError("action", "Review action must be approve or reject.");
  }
  const rewrite = internationalGeoState.content_generation.rewrites.find((item) => item.id === rewriteId);
  if (!rewrite) return null;
  rewrite.review_status = action === "approve" ? "approved" : "rejected";
  rewrite.rewrite_status = action === "approve" ? "approved_rewrite" : "rejected_rewrite";
  rewrite.reviewed_at = nowIso();
  rewrite.human_notes = String(payload.human_notes || "").trim();
  recordAuditEvent("international_geo.content_generation.rewrite.review", "international_geo_platform_rewrite", rewrite.id, {
    action: rewrite.review_status
  });
  persistState();
  return deepClone(rewrite);
}
```

- [ ] **Step 6: Attach content generation to full International GEO state**

Inside `getInternationalGeoState()`, add:

```js
  state.content_generation = getInternationalGeoContentGenerationState();
```

- [ ] **Step 7: Run model tests**

Run:

```bash
npm run check
```

Expected: source/UI/API assertions may still fail, but mock-data import and model behavior assertions should no longer fail.

- [ ] **Step 8: Commit model implementation**

```bash
git add mock-data.mjs verify-mvp.mjs
git commit -m "feat: add international content generation model"
```

---

### Task 4: Expose HTTP API

**Files:**
- Modify: `server.mjs`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add HTTP route tests**

In `runHttpApiChecks()`, after publishing HTTP checks, add:

```js
    const viewerContentGeneration = await httpRequest(port, "/api/v1/international-geo/content-generation", {
      headers: { Cookie: viewerCookie }
    });
    assert.equal(viewerContentGeneration.status, 200, "Viewer should read International GEO content generation");
    assert.ok(viewerContentGeneration.body?.data?.summary, "Content generation HTTP response should include summary");

    const viewerGenerateArticles = await httpRequest(port, "/api/v1/international-geo/content-generation/articles/generate", {
      method: "POST",
      headers: { Cookie: viewerCookie }
    });
    assert.equal(viewerGenerateArticles.status, 403, "Viewer should not generate International GEO articles");

    const ownerGenerateArticles = await httpRequest(port, "/api/v1/international-geo/content-generation/articles/generate", {
      method: "POST",
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerGenerateArticles.status, 201, "Owner should generate International GEO articles");
    assert.ok(ownerGenerateArticles.body?.data?.articles?.length >= 1, "Owner article generation should return article rows");

    const generatedArticleId = ownerGenerateArticles.body.data.articles[0].id;
    const ownerReviewArticle = await httpRequest(
      port,
      `/api/v1/international-geo/content-generation/articles/${generatedArticleId}/review`,
      {
        method: "POST",
        headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", human_notes: "HTTP approval." })
      }
    );
    assert.equal(ownerReviewArticle.status, 200, "Owner should review generated articles");
    assert.equal(ownerReviewArticle.body?.data?.review_status, "approved");

    const ownerGenerateRewrites = await httpRequest(port, "/api/v1/international-geo/content-generation/rewrites/generate", {
      method: "POST",
      headers: { Cookie: ownerCookie }
    });
    assert.equal(ownerGenerateRewrites.status, 201, "Owner should generate International GEO platform rewrites");
    assert.ok(ownerGenerateRewrites.body?.data?.rewrites?.length >= 3, "Owner rewrite generation should return rewrite rows");

    const generatedRewriteId = ownerGenerateRewrites.body.data.rewrites[0].id;
    const ownerReviewRewrite = await httpRequest(
      port,
      `/api/v1/international-geo/content-generation/rewrites/${generatedRewriteId}/review`,
      {
        method: "POST",
        headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", human_notes: "HTTP rewrite approval." })
      }
    );
    assert.equal(ownerReviewRewrite.status, 200, "Owner should review platform rewrites");
    assert.equal(ownerReviewRewrite.body?.data?.review_status, "approved");

    const invalidRewriteReview = await httpRequest(
      port,
      `/api/v1/international-geo/content-generation/rewrites/${generatedRewriteId}/review`,
      {
        method: "POST",
        headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" })
      }
    );
    assert.equal(invalidRewriteReview.status, 400, "Invalid platform rewrite review should fail");
```

- [ ] **Step 2: Run failing HTTP tests**

Run:

```bash
npm run check
```

Expected: FAIL on missing `/international-geo/content-generation` route.

- [ ] **Step 3: Add imports to `server.mjs`**

Add to the destructured import from `mock-data.mjs`:

```js
  generateInternationalGeoArticlesAction,
  generateInternationalGeoPlatformRewritesAction,
  getInternationalGeoContentGenerationState,
  reviewInternationalGeoGeneratedArticleAction,
  reviewInternationalGeoPlatformRewriteAction,
```

- [ ] **Step 4: Add routes**

Insert after evidence asset routes and before publishing routes:

```js
  if (req.method === "GET" && pathname === "/international-geo/content-generation") {
    sendJson(res, 200, ok(getInternationalGeoContentGenerationState()));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/content-generation/articles/generate") {
    sendJson(res, 201, ok(generateInternationalGeoArticlesAction()));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/content-generation/rewrites/generate") {
    sendJson(res, 201, ok(generateInternationalGeoPlatformRewritesAction()));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/content-generation\/articles\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoGeneratedArticleAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Generated article not found", 404).body);
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

  if (req.method === "POST" && pathname.match(/^\/international-geo\/content-generation\/rewrites\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoPlatformRewriteAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Platform rewrite not found", 404).body);
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

- [ ] **Step 5: Run HTTP tests**

Run:

```bash
npm run check
```

Expected: API tests pass; frontend wiring assertions may still fail.

- [ ] **Step 6: Commit API routes**

```bash
git add server.mjs verify-mvp.mjs
git commit -m "feat: expose international content generation api"
```

---

### Task 5: Wire Client API And Actions

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add API wrappers**

In `prototype/src/api.js`, after International GEO evidence asset methods, add:

```js
export function getInternationalGeoContentGeneration() {
  return request("/api/v1/international-geo/content-generation");
}

export function generateInternationalGeoArticles() {
  return requestJson("/api/v1/international-geo/content-generation/articles/generate", "POST", {});
}

export function generateInternationalGeoPlatformRewrites() {
  return requestJson("/api/v1/international-geo/content-generation/rewrites/generate", "POST", {});
}

export function reviewInternationalGeoGeneratedArticle(articleId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/content-generation/articles/${encodeURIComponent(articleId)}/review`,
    "POST",
    payload
  );
}

export function reviewInternationalGeoPlatformRewrite(rewriteId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/content-generation/rewrites/${encodeURIComponent(rewriteId)}/review`,
    "POST",
    payload
  );
}
```

- [ ] **Step 2: Add action imports**

In `prototype/src/main.js`, add:

```js
  generateInternationalGeoArticles as generateInternationalGeoArticlesApi,
  generateInternationalGeoPlatformRewrites as generateInternationalGeoPlatformRewritesApi,
  reviewInternationalGeoGeneratedArticle as reviewInternationalGeoGeneratedArticleApi,
  reviewInternationalGeoPlatformRewrite as reviewInternationalGeoPlatformRewriteApi,
```

- [ ] **Step 3: Add action handlers**

In the `actions` object near other International GEO actions, add:

```js
  async generateInternationalGeoArticles() {
    try {
      const result = await generateInternationalGeoArticlesApi();
      store.data.internationalGeo.content_generation = result;
      await refreshData();
      showNotice("已生成完整文章草稿。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成完整文章失败");
      rerender();
    }
  },
  async generateInternationalGeoPlatformRewrites() {
    try {
      const result = await generateInternationalGeoPlatformRewritesApi();
      store.data.internationalGeo.content_generation = result;
      await refreshData();
      showNotice("已生成多平台改写稿。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成平台改写稿失败");
      rerender();
    }
  },
  async reviewInternationalGeoGeneratedArticle(articleId, action) {
    if (!articleId || !action) return;
    try {
      await reviewInternationalGeoGeneratedArticleApi(articleId, {
        action,
        human_notes: action === "approve" ? "Local generated article approved." : "Local generated article rejected."
      });
      await refreshData();
      showNotice(action === "approve" ? "文章已审核通过。" : "文章已驳回。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "文章审核失败");
      rerender();
    }
  },
  async reviewInternationalGeoPlatformRewrite(rewriteId, action) {
    if (!rewriteId || !action) return;
    try {
      await reviewInternationalGeoPlatformRewriteApi(rewriteId, {
        action,
        human_notes: action === "approve" ? "Platform rewrite approved." : "Platform rewrite rejected."
      });
      await refreshData();
      showNotice(action === "approve" ? "改写稿已审核通过。" : "改写稿已驳回。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "改写稿审核失败");
      rerender();
    }
  },
```

- [ ] **Step 4: Wire events**

In `prototype/src/events.js`, near other International GEO event handlers, add:

```js
    if (action === "international-content-articles-generate") {
      await actions.generateInternationalGeoArticles();
      return;
    }

    if (action === "international-content-rewrites-generate") {
      await actions.generateInternationalGeoPlatformRewrites();
      return;
    }

    if (action === "international-content-article-approve") {
      await actions.reviewInternationalGeoGeneratedArticle(actionButton.dataset.articleId, "approve");
      return;
    }

    if (action === "international-content-article-reject") {
      await actions.reviewInternationalGeoGeneratedArticle(actionButton.dataset.articleId, "reject");
      return;
    }

    if (action === "international-content-rewrite-approve") {
      await actions.reviewInternationalGeoPlatformRewrite(actionButton.dataset.rewriteId, "approve");
      return;
    }

    if (action === "international-content-rewrite-reject") {
      await actions.reviewInternationalGeoPlatformRewrite(actionButton.dataset.rewriteId, "reject");
      return;
    }
```

- [ ] **Step 5: Run client wiring tests**

Run:

```bash
npm run check
```

Expected: source wiring checks pass; UI rendering checks may still fail.

- [ ] **Step 6: Commit browser wiring**

```bash
git add prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "feat: wire international content generation actions"
```

---

### Task 6: Render International GEO Content Generation Panels

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Add status label support**

Extend `publishingStatusLabel()` with:

```js
      approved_article: "文章已通过",
      rejected_article: "文章已驳回",
      rewrites_generated: "已生成改写",
      approved_rewrite: "改写已通过",
      rejected_rewrite: "改写已驳回",
      packaged: "已打包",
      completed: "已完成",
      failed: "失败",
      local_rules: "local_rules",
```

- [ ] **Step 2: Add article panel renderer**

Add before `renderPublishingPlatformMatrix()`:

```js
function renderGeneratedArticleQueue(contentGeneration = {}) {
  const articles = contentGeneration.articles || [];
  const rows = articles.length
    ? articles.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || item.id || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.target_prompt || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.generator_provider || "local_rules")}</div>
              <div class="cell-sub">${escapeHtml((item.source_asset_types || []).map(assetLabel).join(" / ") || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.word_count_estimate || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.evidence_summary || "-")}</div>
            </td>
            <td>
              ${statusMarkup(publishingStatusLabel(item.article_status))}
              ${statusMarkup(publishingStatusLabel(item.review_status))}
            </td>
            <td>
              <div class="actions-row">
                <button class="ghost-btn" data-action="international-content-article-reject" data-article-id="${escapeHtml(item.id || "")}">驳回</button>
                <button class="secondary-btn" data-action="international-content-article-approve" data-article-id="${escapeHtml(item.id || "")}">审核通过</button>
              </div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无完整文章。请先审核通过证据资产，再生成完整文章。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="content-generation-articles">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">文章生成队列</h3>
          <div class="panel-note">local_rules 本地规则生成；只使用 approved evidence assets，不调用外部 AI。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-content-articles-generate">生成完整文章</button>
        </div>
      </div>
      ${tableMarkup(["文章", "Provider / 证据", "字数 / 摘要", "状态", "动作"], rows)}
    </section>
  `;
}
```

- [ ] **Step 3: Add rewrite and run renderers**

Add after `renderGeneratedArticleQueue()`:

```js
function renderPlatformRewriteQueue(contentGeneration = {}) {
  const rewrites = contentGeneration.rewrites || [];
  const rows = rewrites.length
    ? rewrites.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.platform_name || item.platform_key || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.rewrite_type || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.title || item.id || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.source_article_id || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.ai_visibility_goal || "-")}</div>
              <div class="cell-sub">${escapeHtml((item.moderation_notes || []).join(" / ") || "-")}</div>
            </td>
            <td>
              ${statusMarkup(publishingStatusLabel(item.rewrite_status))}
              ${statusMarkup(publishingStatusLabel(item.review_status))}
            </td>
            <td>
              <div class="actions-row">
                <button class="ghost-btn" data-action="international-content-rewrite-reject" data-rewrite-id="${escapeHtml(item.id || "")}">驳回</button>
                <button class="secondary-btn" data-action="international-content-rewrite-approve" data-rewrite-id="${escapeHtml(item.id || "")}">审核通过</button>
              </div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无平台改写稿。请先审核通过完整文章，再生成改写稿。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="content-generation-rewrites">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">多平台改写稿</h3>
          <div class="panel-note">按高权重平台生成不同语气和格式的本地草稿；仍需人工审核后再手动发布。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-content-rewrites-generate">生成平台改写稿</button>
        </div>
      </div>
      ${tableMarkup(["平台", "改写稿", "AI 目标 / 风险", "状态", "动作"], rows)}
    </section>
  `;
}

function renderContentGenerationRuns(contentGeneration = {}) {
  const runs = contentGeneration.runs || [];
  const rows = runs.length
    ? runs.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.run_type || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.id || "-")}</div>
            </td>
            <td>${escapeHtml(item.generator_provider || "local_rules")}</td>
            <td>${statusMarkup(publishingStatusLabel(item.status))}</td>
            <td>${escapeHtml(item.input_asset_count || 0)}</td>
            <td>${escapeHtml(item.output_article_count || 0)} / ${escapeHtml(item.output_rewrite_count || 0)}</td>
            <td>
              <div class="cell-title">${escapeHtml(item.finished_at || "-")}</div>
              <div class="cell-sub">${escapeHtml((item.diagnostics || []).join(" / ") || "-")}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无生成记录。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="content-generation-runs">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">生成记录</h3>
          <div class="panel-note">记录 local_rules 生成运行；不包含外部模型 token、费用或平台发布结果。</div>
        </div>
      </div>
      ${tableMarkup(["运行", "Provider", "状态", "输入", "文章 / 改写", "时间 / 诊断"], rows)}
    </section>
  `;
}
```

- [ ] **Step 4: Insert panels into `renderInternationalGeo()`**

Inside `renderInternationalGeo(data = internationalGeo)`, add:

```js
  const contentGeneration = data.content_generation || {};
```

Then insert after the existing `renderGeoAssetPreviews(mergeGeoAssetPreviews(data.geo_assets || [], data.evidence_assets || {}))` call and before `renderPublishingPlatformMatrix(publishing)`:

```js
    ${renderGeneratedArticleQueue(contentGeneration)}
    ${renderPlatformRewriteQueue(contentGeneration)}
    ${renderContentGenerationRuns(contentGeneration)}
```

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm run check
```

Expected: UI rendering assertions pass.

- [ ] **Step 6: Commit UI panels**

```bash
git add prototype/src/pages/international.js verify-mvp.mjs
git commit -m "feat: render international content generation panels"
```

---

### Task 7: Align Docs, Closeout, And Release Metadata

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
- Create: `docs/STAGE_V0_16_CLOSEOUT.md`

- [ ] **Step 1: Bump version**

Change `package.json`:

```json
"version": "0.16.0"
```

- [ ] **Step 2: Add changelog entry**

Prepend to `CHANGELOG.md`:

```markdown
## 0.16.0 - 2026-07-07

International GEO article generation and platform rewrites.

### Added

- Local-rule complete article generation from approved International GEO evidence assets.
- Local-rule multi-platform rewrites from approved generated articles.
- Generation providers with `local_rules` active and `openai`, `claude`, and `gemini` reserved.
- Review states for generated articles and platform rewrites.
- International GEO UI panels for `文章生成队列`, `多平台改写稿`, and `生成记录`.
- API routes for reading content generation state, generating articles, generating rewrites, and reviewing outputs.

### Boundaries

- no external LLM provider calls,
- no model credentials,
- no automatic external publishing,
- no real AI/search/SERP/indexing measurement,
- generated outputs are reviewable local drafts and do not represent measured inclusion, citation, recommendation, or publication evidence.

### Verification

- `npm run check`
```

- [ ] **Step 3: Add API reference section**

In `docs/API_REFERENCE.md`, add:

```markdown
### International GEO Content Generation

- `GET /international-geo/content-generation`: viewer route for providers, summary, generated articles, platform rewrites, and generation runs.
- `POST /international-geo/content-generation/articles/generate`: editor route that generates local-rule complete articles from approved evidence assets.
- `POST /international-geo/content-generation/rewrites/generate`: editor route that generates platform rewrites from approved generated articles.
- `POST /international-geo/content-generation/articles/:id/review`: editor route that approves or rejects a generated article.
- `POST /international-geo/content-generation/rewrites/:id/review`: editor route that approves or rejects a platform rewrite.

Content generation is local-only in v0.16. `local_rules` is the only active provider; `openai`, `claude`, and `gemini` are reserved provider seams and are not executed.
```

- [ ] **Step 4: Add closeout document**

Create `docs/STAGE_V0_16_CLOSEOUT.md`:

```markdown
# Stage v0.16 Closeout

## Scope Completed

- Local-rule complete article generation from approved International GEO evidence assets.
- Local-rule multi-platform rewrites from approved generated articles.
- Reserved provider seam for future external LLM providers with only `local_rules` active.
- Review states for generated articles and platform rewrites.
- UI, API, tests, and documentation alignment for `文章生成队列`, `多平台改写稿`, and `生成记录`.

## Operating Boundary

local generation and handoff only; no external LLM provider calls, no model credentials, no automatic external publishing, no live AI/search/SERP/indexing verification, and no measured inclusion, citation, recommendation, or publication evidence.

## Verification

- `npm run check`

## Maintainer Notes

- Keep generated output provenance tied to approved evidence assets.
- Do not activate external providers without credential storage, permission boundaries, usage logging, error handling, and content safety review.
- Do not present local drafts or rewrites as measured AI visibility evidence.
```

- [ ] **Step 5: Update remaining docs**

Apply this wording consistently across README, architecture, roadmap, development, production, open-source release, maintenance, and docs index:

```markdown
v0.16 adds local-rule International GEO complete article generation and multi-platform rewrites from approved evidence assets. Generated outputs are reviewable local drafts only. The workflow does not call external LLM providers, store model credentials, publish externally, or measure real AI inclusion, citation, recommendation, indexing, or external distribution.
```

- [ ] **Step 6: Run docs and full checks**

Run:

```bash
node -e 'JSON.parse(require("fs").readFileSync("package.json","utf8")); console.log("package json ok")'
npm run check
git diff --check
```

Expected:

- `package json ok`
- `verify-mvp: OK`
- `git diff --check` exits 0 with no output

- [ ] **Step 7: Commit docs and version**

```bash
git add package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/README.md docs/MAINTENANCE.md docs/STAGE_V0_16_CLOSEOUT.md
git commit -m "docs: close article generation workflow v0.16"
```

---

### Task 8: Final Verification And Push

**Files:**
- No code changes expected.

- [ ] **Step 1: Run final local verification**

Run:

```bash
npm run check
```

Expected:

```text
verify-mvp: OK
```

- [ ] **Step 2: Inspect git status**

Run:

```bash
git status --short
```

Expected: no output.

- [ ] **Step 3: Push**

Run:

```bash
git push
```

Expected: push to `main` succeeds.

- [ ] **Step 4: Check GitHub Actions**

Run:

```bash
gh run list --limit 3
gh run watch <latest-run-id> --exit-status
```

Expected: latest `check` workflow completes with `success`.
