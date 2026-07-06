# International GEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `国际 GEO` workspace to the admin prototype for international AI search visibility and AI readiness workflows.

**Architecture:** The first version is frontend-only and mock-first. It adds one focused page module with local mock data, wires it into the existing navigation/router/render switch, and extends the existing verification script so the page is covered by `npm run check`.

**Tech Stack:** Zero-dependency ES modules, DOM string rendering, existing `utils.js` table/status helpers, Node `assert` in `verify-mvp.mjs`.

---

## File Structure

- Modify `prototype/src/config.js`: add the `international` nav item, page metadata, and disabled primary action label.
- Create `prototype/src/pages/international.js`: render the complete International GEO read-only workspace with local mock data.
- Modify `prototype/src/render.js`: import and render the new page when `store.page === "international"`.
- Modify `prototype/src/route-state.js`: treat `international` as a valid route page.
- Modify `verify-mvp.mjs`: import the new renderer, include syntax checking for the new file, and add assertions that the page renders key international GEO concepts.
- Optionally modify `prototype/src/store.js` only if a route/tab default is needed. The first version does not need new store state.

## Task 1: Add Failing Render Verification

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Write the failing test**

Add an import near the existing page imports:

```js
import { renderInternationalGeo } from "./prototype/src/pages/international.js";
```

Add `"prototype/src/pages/international.js"` to the `syntaxFiles` list.

Add a function near existing render tests:

```js
function assertInternationalGeoPageRenders() {
  const html = renderInternationalGeo();
  assert.match(html, /国际 GEO/, "International GEO page should render its title");
  assert.match(html, /llms\.txt/, "International GEO page should render llms.txt readiness");
  assert.match(html, /JSON-LD/, "International GEO page should render JSON-LD audit coverage");
  assert.match(html, /ChatGPT Search/, "International GEO page should render ChatGPT Search visibility");
  assert.match(html, /Perplexity/, "International GEO page should render Perplexity visibility");
  assert.match(html, /Google AI Overviews/, "International GEO page should render Google AIO visibility");
  assert.match(html, /Direct Answer/, "International GEO page should render Direct Answer guidance");
  assert.match(html, /Entity Coverage/, "International GEO page should render entity coverage");
}
```

Call it in the main verification sequence.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run check
```

Expected: FAIL because `prototype/src/pages/international.js` does not exist yet.

## Task 2: Implement International GEO Page

**Files:**
- Create: `prototype/src/pages/international.js`

- [ ] **Step 1: Write minimal page implementation**

Create `prototype/src/pages/international.js` with:

```js
import { escapeHtml, metricCard, statusMarkup, tableMarkup } from "../utils.js";

const internationalGeo = {
  summary: {
    ai_ready_score: 78,
    llms_status: "已部署",
    schema_coverage: "68%",
    crawler_access: "允许",
    citation_opportunities: 24
  },
  engineVisibility: [],
  keywordOpportunities: [],
  auditChecklist: [],
  entityCoverage: []
};

export function renderInternationalGeo(data = internationalGeo) {
  const summary = data.summary || {};
  return `
    <section class="surface toolbar">
      <div>
        <h2 class="section-title">国际 GEO</h2>
        <div class="panel-note">Generative Engine Optimization / AI SEO visibility workspace for global markets.</div>
      </div>
    </section>
    <div class="metric-grid">
      ${metricCard("AI-ready score", `${summary.ai_ready_score ?? "-"} / 100`, "AI readiness audit")}
      ${metricCard("llms.txt", summary.llms_status || "-", "LLM-readable site summary")}
      ${metricCard("JSON-LD", summary.schema_coverage || "-", "Schema coverage")}
      ${metricCard("Citation opportunities", summary.citation_opportunities ?? "-", "Direct Answer and entity gaps")}
    </div>
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">AI Engine Visibility</h3>
          <div class="panel-note">ChatGPT Search, Perplexity, Google AI Overviews, Gemini and Claude citation monitoring.</div>
        </div>
      </div>
    </section>
    <section class="surface panel">
      <h3 class="panel-title">GEO Audit Checklist</h3>
      <div class="panel-note">llms.txt, JSON-LD, AI crawler access, Direct Answer, E-E-A-T and Entity Coverage.</div>
    </section>
  `;
}
```

- [ ] **Step 2: Run test to verify it passes or reveals missing assertions**

Run:

```bash
npm run check
```

Expected: the new render assertions may pass, but fuller navigation assertions are not implemented yet.

## Task 3: Wire Navigation And Route

**Files:**
- Modify: `prototype/src/config.js`
- Modify: `prototype/src/render.js`
- Modify: `prototype/src/route-state.js`

- [ ] **Step 1: Add navigation config**

Add to `navigation` near analytics:

```js
{ id: "international", label: "国际 GEO", desc: "跨市场、跨语言、跨 AI 搜索引擎的可见度运营" }
```

Add to `pageMeta`:

```js
international: ["国际 GEO", "跨市场、跨语言、跨 AI 搜索引擎的可见度运营"]
```

Add to `primaryActions`:

```js
international: "生成审计"
```

- [ ] **Step 2: Add render switch**

Import:

```js
import { renderInternationalGeo } from "./pages/international.js?v=20260418-3";
```

Add switch case:

```js
case "international":
  return renderInternationalGeo();
```

- [ ] **Step 3: Add valid route**

Add `"international"` to `validPages` in `prototype/src/route-state.js`.

- [ ] **Step 4: Extend verification**

Add assertions in `verify-mvp.mjs`:

```js
assert(
  navigation.some((item) => item.id === "international" && item.label === "国际 GEO"),
  "Navigation should include International GEO"
);
```

and verify `applyRouteState` restores `page=international`.

## Task 4: Fill Page Tables And Polish

**Files:**
- Modify: `prototype/src/pages/international.js`

- [ ] **Step 1: Replace placeholder arrays with representative mock data**

Include mock data for:

- US, EU, UK, SEA markets.
- `en-US`, `en-GB`, and `en` languages.
- ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude.
- Audit items for `llms.txt`, JSON-LD Schema, robots and AI crawler access, Direct Answer Upfront, statistics/table evidence, author proof, FAQ structure, product entity markup.
- Entity channels for Reddit, Quora, Wikipedia, LinkedIn, Medium, YouTube, industry directories, vertical forums.

- [ ] **Step 2: Render complete tables**

Use `tableMarkup` for engine visibility, keyword opportunities, audit checklist, and entity coverage. Use `statusMarkup` for operational statuses.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run check
```

Expected: PASS.

## Task 5: Final Verification And Commit

**Files:**
- Verify all modified files.

- [ ] **Step 1: Inspect diff**

Run:

```bash
git diff -- prototype/src/config.js prototype/src/render.js prototype/src/route-state.js prototype/src/pages/international.js verify-mvp.mjs docs/superpowers/plans/2026-07-06-international-geo.md
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 3: Commit implementation**

Commit only this work and leave unrelated `docs/MAINTENANCE.md` untouched:

```bash
git add prototype/src/config.js prototype/src/render.js prototype/src/route-state.js prototype/src/pages/international.js verify-mvp.mjs docs/superpowers/plans/2026-07-06-international-geo.md
git commit -m "feat: add international geo workspace"
```

## Self-Review

- Spec coverage: navigation, readiness, engine visibility, keyword opportunities, audit checklist, entity coverage, read-only mock scope, and verification are covered.
- Placeholder scan: no `TBD`, `TODO`, or open implementation placeholders are required.
- Type consistency: the renderer uses page-local data and does not introduce new API contracts.
