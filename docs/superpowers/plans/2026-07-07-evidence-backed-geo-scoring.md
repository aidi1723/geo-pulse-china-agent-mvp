# Evidence-Backed GEO Scoring v0.12 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add deterministic, evidence-backed scoring to International GEO site audits and render the scoring evidence in the existing dense admin interface.

**Architecture:** Keep scoring in `mock-data.mjs` beside the existing International GEO audit helpers, enrich each check with score, confidence, priority, reasons, and actions, and store an audit-level `score_breakdown`. Keep the UI in `prototype/src/pages/international.js` with one compact score breakdown panel and expanded check-table metadata.

**Tech Stack:** Node.js ES modules, zero-dependency prototype server, static HTML renderer, `verify-mvp.mjs` integration checks.

---

## File Structure

- Modify `verify-mvp.mjs`: add red tests for score fields, score breakdown behavior, crawl evidence scoring changes, UI rendering, and legacy-safe rendering.
- Modify `mock-data.mjs`: add scoring rubric helpers, enrich checks, compute score breakdown, hydrate audit score breakdown on create/crawl/update flows.
- Modify `prototype/src/pages/international.js`: render `评分拆解` and scoring metadata in existing table patterns.
- Modify `prototype/src/static-api.js` only if fixture data needs a safe legacy scoring shape for static rendering checks.
- Modify documentation: `package.json`, `CHANGELOG.md`, `README.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/ROADMAP.md`, `docs/PHASE_2_ROADMAP.md`.
- Create `docs/STAGE_V0_12_CLOSEOUT.md`.

## Task 1: Red Tests For Evidence-Backed Scoring

**Files:**
- Modify: `verify-mvp.mjs`

- [x] **Step 1: Write failing assertions for audit scoring fields**

Add assertions after owner site audit creation in `runHttpApiChecks()`:

```js
assert.equal(ownerAudit.body?.data?.score_breakdown?.total_weight, 100, "Site audit should expose a 100-point score breakdown");
assert.ok(
  ownerAudit.body?.data?.checks?.every((item) => Number.isFinite(item.score_weight)),
  "Every site audit check should expose score_weight"
);
assert.ok(
  ownerAudit.body?.data?.checks?.every((item) => Number.isFinite(item.score_awarded)),
  "Every site audit check should expose score_awarded"
);
assert.ok(
  ownerAudit.body?.data?.checks?.every((item) => ["high", "medium", "low"].includes(item.confidence)),
  "Every site audit check should expose confidence"
);
assert.ok(
  ownerAudit.body?.data?.checks?.every((item) => ["high", "medium", "low"].includes(item.priority)),
  "Every site audit check should expose remediation priority"
);
```

- [x] **Step 2: Write failing assertions for crawl evidence scoring**

After successful crawl/apply behavior in `runHttpApiChecks()`, assert a synthetic crawl result has scored evidence. If the HTTP path cannot fetch external network in CI, use local action helpers in the non-HTTP section with `applyInternationalGeoSiteAuditCrawlEvidenceAction()`:

```js
const scoredAudit = createInternationalGeoSiteAuditAction({
  website_url: "https://example.com",
  product_name: "Example GEO Platform",
  primary_query: "best GEO platform for B2B teams",
  competitors: ["Semrush"]
});
const scoredWithEvidence = applyInternationalGeoSiteAuditCrawlEvidenceAction(scoredAudit.id, {
  provider_id: "test",
  status: "completed",
  resources: {
    homepage: {
      ok: true,
      status_code: 200,
      url: "https://example.com",
      title: "Example GEO Platform",
      h1: "Example GEO Platform",
      text_excerpt: "Example GEO Platform answers best GEO platform for B2B teams with 12 benchmarks, support, contact, privacy, partner proof, and comparison tables.",
      json_ld_types: ["Organization", "Product", "FAQPage"]
    },
    robots_txt: {
      ok: true,
      status_code: 200,
      mentioned_bots: ["Googlebot", "GPTBot", "ClaudeBot", "PerplexityBot"],
      text_excerpt: "User-agent: GPTBot"
    },
    sitemap_xml: {
      ok: true,
      status_code: 200,
      url_count: 4,
      sample_urls: ["https://example.com/"]
    },
    llms_txt: {
      ok: true,
      status_code: 200,
      text_excerpt: "# Example GEO Platform\nAI search readiness summary."
    }
  },
  issues: []
});
assert.ok(scoredWithEvidence.score > scoredAudit.score, "Crawl evidence should change weighted site audit score");
assert.equal(
  scoredWithEvidence.checks.find((item) => item.id === "llms_txt")?.confidence,
  "high",
  "Fetched llms.txt should create a high-confidence scored check"
);
assert.equal(
  scoredWithEvidence.checks.find((item) => item.id === "json_ld")?.score_awarded,
  14,
  "Relevant JSON-LD types should award full JSON-LD points"
);
```

- [x] **Step 3: Write failing assertions for missing evidence deductions**

Add a synthetic missing `/llms.txt` crawl:

```js
const missingLlmsAudit = applyInternationalGeoSiteAuditCrawlEvidenceAction(scoredAudit.id, {
  provider_id: "test",
  status: "partial",
  resources: {
    homepage: {
      ok: true,
      status_code: 200,
      url: "https://example.com",
      text_excerpt: "Example GEO Platform has contact and privacy details."
    },
    llms_txt: {
      ok: false,
      status_code: 404,
      error_code: "HTTP_404"
    }
  },
  issues: []
});
const missingLlmsCheck = missingLlmsAudit.checks.find((item) => item.id === "llms_txt");
assert.equal(missingLlmsCheck.priority, "high", "Missing llms.txt should be high priority");
assert.match(
  missingLlmsCheck.deduction_reasons.join(" "),
  /Missing \/llms\.txt/,
  "Missing llms.txt should expose a concrete deduction reason"
);
```

- [x] **Step 4: Write failing assertions for UI rendering**

Extend `runUiChecks()` after `siteAuditHtml` render:

```js
assert.match(siteAuditHtml, /评分拆解/, "International GEO page should render score breakdown");
assert.match(siteAuditHtml, /得分 \/ 权重/, "International GEO checks should show score awarded over weight");
assert.match(siteAuditHtml, /优先级/, "International GEO checks should show remediation priority");
assert.match(siteAuditHtml, /置信度/, "International GEO checks should show scoring confidence");
assert.doesNotThrow(
  () => renderInternationalGeo({ site_audits: { latest: { checks: [{ id: "legacy", label: "Legacy" }] } } }),
  "Legacy audit objects without scoring fields should render safely"
);
```

- [x] **Step 5: Run red test**

Run: `npm run check`

Expected: FAIL with missing `score_breakdown`, missing score fields, or missing UI text.

## Task 2: Weighted Scoring Model

**Files:**
- Modify: `mock-data.mjs`

- [x] **Step 1: Add rubric constants and scoring helpers**

Add helpers near `siteAuditScore()`:

```js
const SITE_AUDIT_SCORE_RUBRIC = {
  url_quality: { weight: 10, category: "technical" },
  robots_ai_access: { weight: 12, category: "crawler_access" },
  sitemap: { weight: 10, category: "technical" },
  llms_txt: { weight: 12, category: "ai_readability" },
  json_ld: { weight: 14, category: "structured_data" },
  direct_answer: { weight: 12, category: "content" },
  fact_density: { weight: 10, category: "content" },
  eeat: { weight: 10, category: "trust" },
  third_party_validation: { weight: 10, category: "entity_validation" }
};

function siteAuditWeight(check = {}) {
  return SITE_AUDIT_SCORE_RUBRIC[check.id]?.weight || 0;
}

function scoreConfidence(check = {}) {
  if (check.evidence_status === "crawl_evidenced" && ["robots_txt", "sitemap_xml", "llms_txt"].includes(check.evidence_source)) return "high";
  if (check.evidence_status === "crawl_evidenced") return "medium";
  if (check.evidence_status === "unavailable") return "high";
  return "low";
}
```

- [x] **Step 2: Add deterministic score enrichment**

Add `scoreSiteAuditCheck(check)` and use status/evidence to compute awarded points, deduction reasons, next actions, confidence, and priority. Use full weight for passed, half weight for warnings, zero for failed unless an id-specific rule overrides the warning award.

- [x] **Step 3: Compute audit-level score breakdown**

Replace `siteAuditScore()` with a breakdown-aware implementation:

```js
function siteAuditScoreBreakdown(checks = []) {
  const scoredChecks = checks.map(scoreSiteAuditCheck);
  const groupsMap = new Map();
  const priorityCounts = { high: 0, medium: 0, low: 0 };
  let crawlEvidencedWeight = 0;
  let totalWeight = 0;
  let awarded = 0;

  scoredChecks.forEach((check) => {
    const weight = Number(check.score_weight || 0);
    totalWeight += weight;
    awarded += Number(check.score_awarded || 0);
    priorityCounts[check.priority] = (priorityCounts[check.priority] || 0) + 1;
    if (check.evidence_status === "crawl_evidenced") crawlEvidencedWeight += weight;
    const category = check.category || SITE_AUDIT_SCORE_RUBRIC[check.id]?.category || "other";
    const group = groupsMap.get(category) || { category, weight: 0, awarded: 0, deducted: 0 };
    group.weight += weight;
    group.awarded += Number(check.score_awarded || 0);
    group.deducted += Number(check.score_deduction || 0);
    groupsMap.set(category, group);
  });

  const evidenceRatio = totalWeight ? crawlEvidencedWeight / totalWeight : 0;
  return {
    total_weight: totalWeight,
    awarded: Math.round(awarded),
    deducted: Math.max(0, totalWeight - Math.round(awarded)),
    confidence: evidenceRatio >= 0.75 ? "high" : evidenceRatio >= 0.4 ? "medium" : "low",
    priority_counts: priorityCounts,
    groups: [...groupsMap.values()]
  };
}
```

- [x] **Step 4: Hydrate audits on create and crawl apply**

Use a helper:

```js
function hydrateSiteAuditScoring(audit = {}) {
  const checks = (audit.checks || []).map(scoreSiteAuditCheck);
  const score_breakdown = siteAuditScoreBreakdown(checks);
  return {
    ...audit,
    checks,
    score_breakdown,
    score: score_breakdown.awarded
  };
}
```

Apply it in `createInternationalGeoSiteAuditAction()` and `applyInternationalGeoSiteAuditCrawlEvidenceAction()`.

- [x] **Step 5: Run green test**

Run: `npm run check`

Expected: scoring assertions pass; UI assertions may still fail until Task 3.

## Task 3: International GEO UI Scoring Panel

**Files:**
- Modify: `prototype/src/pages/international.js`

- [x] **Step 1: Add safe score helpers**

Add render helpers near `renderSiteAuditChecks()`:

```js
function scoreValue(value, fallback = "-") {
  return Number.isFinite(Number(value)) ? String(Number(value)) : fallback;
}

function priorityLabel(value) {
  return ({ high: "高", medium: "中", low: "低" })[value] || "-";
}

function confidenceLabel(value) {
  return ({ high: "高", medium: "中", low: "低" })[value] || "-";
}
```

- [x] **Step 2: Render `评分拆解`**

Add `renderScoreBreakdownPanel(audit = {})` using existing `surface panel`, `info-grid`, and `tableMarkup`. Include score, confidence, priority counts, and group rows with weight/awarded/deducted.

- [x] **Step 3: Extend check table**

Change `renderSiteAuditChecks()` columns to:

```js
tableMarkup(["检查项", "状态", "得分 / 权重", "优先级", "置信度", "证据 / 建议"], rows)
```

Each row should render:

```js
<td><strong>${scoreValue(item.score_awarded)}</strong><span class="cell-sub">/ ${scoreValue(item.score_weight)}</span></td>
<td>${statusMarkup(priorityLabel(item.priority))}</td>
<td>${statusMarkup(confidenceLabel(item.confidence))}</td>
```

Use the first `deduction_reasons[0]` and `next_actions[0]` in `cell-sub` lines when present.

- [x] **Step 4: Insert panel in page**

In `renderInternationalGeo()`, render the breakdown between the site audit panel and check table:

```js
${renderScoreBreakdownPanel(latestAudit)}
${renderSiteAuditChecks(latestAudit)}
```

- [x] **Step 5: Run green test**

Run: `npm run check`

Expected: scoring and UI assertions pass.

## Task 4: Documentation And Closeout Alignment

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/API_REFERENCE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/PHASE_2_ROADMAP.md`
- Create: `docs/STAGE_V0_12_CLOSEOUT.md`

- [x] **Step 1: Update version and changelog**

Set `package.json` version to `0.12.0`. Add a `0.12.0` entry to `CHANGELOG.md` describing evidence-backed International GEO scoring and noting that real AI engine inclusion/rank is still not measured.

- [x] **Step 2: Update product docs**

Update README and architecture/API/development docs to mention:

- check-level scoring fields,
- audit-level `score_breakdown`,
- deterministic crawl-evidence scoring,
- legacy-safe rendering,
- no real ChatGPT/Gemini/Claude/Perplexity querying in this release.

- [x] **Step 3: Update roadmap docs**

Mark Phase 2 scoring depth as implemented in v0.12 and keep future items for real AI engine monitoring, recursive crawl, JS rendering, publishing, and multi-tenant hardening.

- [x] **Step 4: Write closeout**

Create `docs/STAGE_V0_12_CLOSEOUT.md` with:

- shipped scope,
- verification commands,
- operational limits,
- next recommended phase.

- [x] **Step 5: Run documentation checks**

Run: `node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .`

Expected: exit 0 or only documented warnings unrelated to v0.12 docs.

## Task 5: Final Verification, Commit, Push

**Files:**
- All changed files.

- [x] **Step 1: Full verification**

Run: `npm run check`

Expected: exit 0.

- [x] **Step 2: Inspect diff**

Run: `git diff --stat`

Expected: only v0.12 scoring, UI, and docs files changed.

- [x] **Step 3: Commit**

Run:

```bash
git add verify-mvp.mjs mock-data.mjs prototype/src/pages/international.js prototype/src/static-api.js package.json CHANGELOG.md README.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/ROADMAP.md docs/PHASE_2_ROADMAP.md docs/STAGE_V0_12_CLOSEOUT.md docs/superpowers/plans/2026-07-07-evidence-backed-geo-scoring.md
git commit -m "feat: add evidence-backed international geo scoring"
```

- [x] **Step 4: Push**

Run: `git push`

Expected: branch updates on GitHub.

- [x] **Step 5: Confirm remote checks**

Run: `gh run list --limit 3` and inspect the latest workflow for the pushed commit.

Expected: latest check succeeds or a concrete failing job is reported.

## Self-Review

- Spec coverage: plan covers check-level score fields, audit-level score breakdown, confidence/priority, UI panel, API shape through existing routes, legacy-safe rendering, documentation, and verification.
- Placeholder scan: no `TBD`, `TODO`, or undefined follow-up sections remain.
- Type consistency: field names match the v0.12 spec: `score_weight`, `score_awarded`, `score_deduction`, `confidence`, `priority`, `deduction_reasons`, `next_actions`, and `score_breakdown`.
