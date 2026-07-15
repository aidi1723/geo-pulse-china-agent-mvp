# Project Audit And Balanced Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden GEO Pulse deployment and API parsing, reduce browser data loading, restore mobile and keyboard usability, align the shared UI with `DESIGN.md`, and publish an evidence-backed closeout report without changing product workflows.

**Architecture:** Keep the zero-dependency Node server, hash router, store, page renderers, and delegated browser event model. Centralize request planning in `prototype/src/api.js`, semantic enhancement in a focused accessibility module, and visual behavior in shared CSS tokens; leave the large domain model files intact.

**Tech Stack:** Node.js 20+, ECMAScript modules, native HTTP, native HTML/CSS/JavaScript, existing `verify-mvp.mjs` regression gate, Playwright CLI, Google SEO static checker.

---

## File Map

- Modify `verify-mvp.mjs`: add regression tests for deployment, body parsing, request plans, semantic HTML, accessibility source, CSS system rules, and noindex behavior.
- Modify `server.mjs`: default loopback binding, shared JSON parse errors, stable oversized-body handling, HTML indexing header, and sitemap exclusion.
- Modify `docker-compose.yml`: pass the required production owner password.
- Modify `prototype/sitemap.xml`: keep a valid empty sitemap for the authenticated workspace.
- Modify `prototype/src/api.js`: replace all-domain bootstrap with shared and page-scoped request plans.
- Modify `prototype/src/main.js`: load only shared/current-page data and expose page refresh to navigation.
- Modify `prototype/src/events.js`: await destination loading, submit login forms, and close panels with Escape.
- Create `prototype/src/accessibility.js`: associate labels, add accessible fallbacks, and manage dialog focus.
- Modify `prototype/src/render.js`: semantic login form, mobile navigation, dialog metadata, and post-render accessibility enhancement.
- Modify `prototype/src/components.js`: accessible search, active navigation state, and compact mobile navigation markup.
- Modify `prototype/src/utils.js`: tab semantics.
- Modify `prototype/styles.css`: dark operational tokens, compact primitives, focus states, responsive navigation, overflow containment, and reduced motion.
- Modify `README.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/MAINTENANCE.md`, and `CHANGELOG.md`: align authoritative guidance.
- Create `docs/PROJECT_AUDIT_OPTIMIZATION_CLOSEOUT_2026-07-16.md`: final evidence and residual-risk report.

### Task 1: Harden Deployment And Request Parsing

**Files:**
- Modify: `verify-mvp.mjs`
- Modify: `server.mjs`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add failing source and HTTP regressions**

In `runSingleUserSourceChecks()`, read the deployment sources and add these assertions:

```js
const serverSource = fs.readFileSync("server.mjs", "utf8");
const composeSource = fs.readFileSync("docker-compose.yml", "utf8");

assert.match(
  serverSource,
  /const host = process\.env\.GEO_HOST \|\| "127\.0\.0\.1"/,
  "Default server binding should be loopback"
);
assert.doesNotMatch(
  serverSource,
  /parseBody\(req\)\.catch/,
  "API routes should preserve shared body parsing errors"
);
assert.match(
  composeSource,
  /GEO_BOOTSTRAP_OWNER_PASSWORD:\s*\$\{GEO_BOOTSTRAP_OWNER_PASSWORD:\?GEO_BOOTSTRAP_OWNER_PASSWORD is required\}/,
  "Docker Compose should pass the required production owner password"
);
```

Add `runBodyParsingHttpChecks()` beside the existing HTTP checks. Start a server with persistence disabled, `GEO_MAX_BODY_BYTES=256`, `GEO_MUTATION_RATE_LIMIT_PER_MINUTE=20`, and a fixed API key. Log in, capture the current brand, send malformed JSON to `PUT /api/v1/brand-profile`, verify `400` and `VALIDATION_ERROR`, then re-read the brand and verify it did not change. Send a body larger than 256 bytes without a `Content-Length` header and verify `413` and `PAYLOAD_TOO_LARGE`.

```js
const malformed = await httpRequest(port, "/api/v1/brand-profile", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Cookie: ownerLogin.cookie
  },
  body: '{"brand_name":'
});
assert.equal(malformed.status, 400);
assert.equal(malformed.body?.error?.code, "VALIDATION_ERROR");

const oversized = await httpRequest(port, "/api/v1/brand-profile", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Cookie: ownerLogin.cookie
  },
  body: JSON.stringify({ brand_name: "A".repeat(512) })
});
assert.equal(oversized.status, 413);
assert.equal(oversized.body?.error?.code, "PAYLOAD_TOO_LARGE");
```

Call `await runBodyParsingHttpChecks()` in the final verification sequence.

- [ ] **Step 2: Run the gate and confirm RED**

Run:

```bash
npm run check
```

Expected: `verify-mvp: FAILED` at the first new assertion because the server still defaults to an empty host, route catches still exist, and Compose omits the password.

- [ ] **Step 3: Implement the shared parsing and deployment fixes**

In `server.mjs`:

```js
const host = process.env.GEO_HOST || "127.0.0.1";
```

Update `parseBody()` so it counts `chunk.length`, rejects once with `status = 413`, continues draining the request without appending data, and does not destroy the socket. Remove every route-level `.catch(() => null)` and `.catch(() => ({}))` from `parseBody(req)` calls so the existing outer `try/catch` produces the structured status.

In `verify-mvp.mjs`, update `waitForServerReady()` to recognize the stable startup prefix and port regardless of whether the explicit host is loopback or remote:

```js
if (output.includes(`GEO Pulse MVP running at http://`) && output.includes(`:${port}`)) {
  clearTimeout(timeout);
  resolve();
}
```

Always call:

```js
server.listen(port, host, onListening);
```

In `docker-compose.yml`, add:

```yaml
GEO_BOOTSTRAP_OWNER_PASSWORD: ${GEO_BOOTSTRAP_OWNER_PASSWORD:?GEO_BOOTSTRAP_OWNER_PASSWORD is required}
```

- [ ] **Step 4: Run the gate and confirm GREEN**

Run `npm run check`.

Expected: `verify-mvp: OK`, including malformed JSON `400`, chunked overflow `413`, unchanged brand state, and existing security tests.

- [ ] **Step 5: Commit Task 1**

```bash
git add verify-mvp.mjs server.mjs docker-compose.yml
git commit -m "fix: harden deployment and request parsing"
```

### Task 2: Replace All-Domain Bootstrap With Page-Scoped Loading

**Files:**
- Modify: `verify-mvp.mjs`
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [ ] **Step 1: Add failing request-plan tests**

Import `getPageDataPaths` from `prototype/src/api.js` and add `runPageDataPlanChecks()`:

```js
function runPageDataPlanChecks() {
  const dashboard = getPageDataPaths("dashboard", { includeShared: true });
  assert.deepEqual(dashboard, [
    "/api/v1/workspaces/current",
    "/api/v1/workspace-input",
    "/api/v1/system/runtime",
    "/api/v1/dashboard/summary",
    "/api/v1/dashboard/keyword-trend",
    "/api/v1/dashboard/content-funnel",
    "/api/v1/dashboard/top-keywords",
    "/api/v1/dashboard/recent-publishes"
  ]);
  assert.equal(dashboard.length, 8);
  assert.equal(dashboard.some((path) => path.includes("/users")), false);
  assert.equal(dashboard.some((path) => path.includes("/international-geo")), false);

  const settings = getPageDataPaths("settings");
  assert.ok(settings.includes("/api/v1/users"));
  assert.ok(settings.includes("/api/v1/audit-events?page_size=20"));

  const mainSource = fs.readFileSync("prototype/src/main.js", "utf8");
  const eventSource = fs.readFileSync("prototype/src/events.js", "utf8");
  assert.match(mainSource, /loadPageData\(store\.page/);
  assert.match(eventSource, /await actions\.refreshCurrentPage/);
}
```

Call it before browser source checks.

- [ ] **Step 2: Run the gate and confirm RED**

Run `npm run check`.

Expected: syntax/import failure because `getPageDataPaths` and `loadPageData` do not exist.

- [ ] **Step 3: Define complete page request plans**

In `prototype/src/api.js`, replace `bootstrapData()` with descriptor plans using `{ key, path, list }` entries. Use these exact groups:

```js
const sharedDataPlan = [
  { key: "workspace", path: "/api/v1/workspaces/current" },
  { key: "workspaceInput", path: "/api/v1/workspace-input" },
  { key: "runtimeStatus", path: "/api/v1/system/runtime" }
];

const pageDataPlans = {
  dashboard: [
    { key: "dashboardSummary", path: "/api/v1/dashboard/summary" },
    { key: "keywordTrend", path: "/api/v1/dashboard/keyword-trend" },
    { key: "contentFunnel", path: "/api/v1/dashboard/content-funnel" },
    { key: "topKeywords", path: "/api/v1/dashboard/top-keywords" },
    { key: "recentPublishes", path: "/api/v1/dashboard/recent-publishes" }
  ],
  keywords: [
    { key: "keywords", path: "/api/v1/keywords", list: true },
    { key: "keywordJobs", path: "/api/v1/keyword-crawl-jobs", list: true },
    { key: "mediaSources", path: "/api/v1/media-sources", list: true },
    { key: "sourceStrategies", path: "/api/v1/source-strategies", list: true },
    { key: "automationRuns", path: "/api/v1/automation-runs", list: true }
  ],
  content: [
    { key: "keywords", path: "/api/v1/keywords", list: true },
    { key: "topics", path: "/api/v1/topic-ideas", list: true },
    { key: "articles", path: "/api/v1/articles", list: true },
    { key: "templates", path: "/api/v1/content-templates", list: true },
    { key: "brandProfile", path: "/api/v1/brand-profile" }
  ],
  distribution: [
    { key: "publishTasks", path: "/api/v1/publish-tasks", list: true },
    { key: "publishRecords", path: "/api/v1/publish-records", list: true },
    { key: "channels", path: "/api/v1/channels", list: true },
    { key: "articles", path: "/api/v1/articles", list: true }
  ],
  analytics: [
    { key: "analyticsKeywords", path: "/api/v1/analytics/keywords" },
    { key: "analyticsContent", path: "/api/v1/analytics/content" },
    { key: "analyticsChannels", path: "/api/v1/analytics/channels" },
    { key: "analyticsCampaigns", path: "/api/v1/analytics/campaigns" },
    { key: "analyticsVisibility", path: "/api/v1/analytics/visibility" },
    { key: "audienceSegments", path: "/api/v1/audience-segments", list: true },
    { key: "marketingCampaigns", path: "/api/v1/marketing-campaigns", list: true }
  ],
  international: [
    { key: "internationalGeo", path: "/api/v1/international-geo" }
  ],
  billing: [
    { key: "billingSummary", path: "/api/v1/billing/summary" },
    { key: "invoices", path: "/api/v1/billing/invoices", list: true }
  ],
  settings: [
    { key: "brandProfile", path: "/api/v1/brand-profile" },
    { key: "modelConfigs", path: "/api/v1/model-configs", list: true },
    { key: "promptTemplates", path: "/api/v1/prompt-templates", list: true },
    { key: "contentQualityTraces", path: "/api/v1/content-quality-traces?page_size=20", list: true },
    { key: "users", path: "/api/v1/users", list: true },
    { key: "automationProviders", path: "/api/v1/automation-providers", list: true },
    { key: "automationConnectors", path: "/api/v1/automation-connectors", list: true },
    { key: "providerInvocations", path: "/api/v1/provider-invocations", list: true },
    { key: "auditEvents", path: "/api/v1/audit-events?page_size=20", list: true },
    { key: "sourceStrategies", path: "/api/v1/source-strategies", list: true },
    { key: "automationRuns", path: "/api/v1/automation-runs", list: true },
    { key: "channels", path: "/api/v1/channels", list: true }
  ]
};
```

Export:

```js
export function getPageDataPaths(page = "dashboard", options = {}) {
  const plan = options.includeShared
    ? [...sharedDataPlan, ...(pageDataPlans[page] || [])]
    : [...(pageDataPlans[page] || [])];
  return plan.map((entry) => entry.path);
}

export async function loadPageData(page = "dashboard", options = {}) {
  const plan = options.includeShared
    ? [...sharedDataPlan, ...(pageDataPlans[page] || [])]
    : [...(pageDataPlans[page] || [])];
  const values = await Promise.all(plan.map((entry) => request(entry.path)));
  return Object.fromEntries(
    plan.map((entry, index) => [entry.key, entry.list ? extractItems(values[index]) : values[index]])
  );
}
```

- [ ] **Step 4: Wire current-page refresh and navigation**

In `main.js`, import `loadPageData`, call `loadPageData(store.page, { includeShared })` from `refreshData()`, preserve `articleDetails`, and default `includeShared` to true for mutations. Add this action:

```js
async refreshCurrentPage(options = {}) {
  await refreshData({ loading: true, includeShared: false, ...options });
}
```

Initial authenticated load and login use `{ loading: true, includeShared: true }`.

In `events.js`, after applying a new `data-nav` state, render the loading state and await:

```js
await actions.refreshCurrentPage({ includeShared: false });
```

For `hashchange`, compare the prior and next page and invoke the same action only when the page changed.

- [ ] **Step 5: Run the gate and confirm GREEN**

Run `npm run check`.

Expected: `verify-mvp: OK`; request-plan tests prove the dashboard has eight data requests and excludes unrelated domains.

- [ ] **Step 6: Commit Task 2**

```bash
git add verify-mvp.mjs prototype/src/api.js prototype/src/main.js prototype/src/events.js
git commit -m "perf: load workspace data by page"
```

### Task 3: Restore Semantic Forms, Labels, Navigation, And Dialog Behavior

**Files:**
- Create: `prototype/src/accessibility.js`
- Modify: `verify-mvp.mjs`
- Modify: `prototype/src/render.js`
- Modify: `prototype/src/components.js`
- Modify: `prototype/src/utils.js`
- Modify: `prototype/src/events.js`
- Modify: `prototype/src/main.js`

- [ ] **Step 1: Add failing semantic rendering and source tests**

Extend `syntaxTargets` with `prototype/src/accessibility.js`. In `runAuthUiChecks()` require:

```js
assert.match(loginHtml, /<form[^>]+data-form="login"/);
assert.match(loginHtml, /<label[^>]+for="login-username"/);
assert.match(loginHtml, /id="login-username"/);
assert.match(loginHtml, /<button[^>]+type="submit"/);
```

For an authenticated minimal store, require mobile navigation, all eight `data-nav` values, `aria-current="page"`, and a global search `aria-label`. Add source assertions for `enhanceRenderedUi`, `associateControlLabels`, `role="dialog"`, `aria-modal="true"`, `event.key === "Escape"`, and a delegated `submit` listener.

- [ ] **Step 2: Run the gate and confirm RED**

Run `npm run check`.

Expected: syntax failure for the missing module or the first semantic assertion failure.

- [ ] **Step 3: Create the accessibility enhancer**

Create `prototype/src/accessibility.js` with:

```js
let controlSequence = 0;
let activeDialog = null;

function readableDataName(control) {
  const entry = Object.entries(control.dataset || {}).find(([key]) => key.endsWith("Field"));
  return entry ? String(entry[1] || entry[0]).replaceAll("_", " ") : "表单控件";
}

export function associateControlLabels(root) {
  root.querySelectorAll("label").forEach((label) => {
    const control = label.querySelector("input, select, textarea") ||
      label.parentElement?.querySelector(":scope > input, :scope > select, :scope > textarea");
    if (!control) return;
    if (!control.id) control.id = `geo-control-${++controlSequence}`;
    if (!label.contains(control)) label.htmlFor = control.id;
  });

  root.querySelectorAll("input, select, textarea").forEach((control) => {
    if (control.labels?.length || control.getAttribute("aria-label") || control.getAttribute("aria-labelledby")) return;
    control.setAttribute("aria-label", control.placeholder || readableDataName(control));
  });
}

export function enhanceRenderedUi(root) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  associateControlLabels(root);
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog && dialog !== activeDialog) {
    activeDialog = dialog;
    dialog.querySelector("button, input, select, textarea")?.focus();
  } else if (!dialog) {
    activeDialog = null;
  }
}
```

- [ ] **Step 4: Add semantic markup and keyboard behavior**

In `render.js`, make login a `<form data-form="login">`, use explicit `for`/`id`, and make the login button `type="submit"`. Add mobile navigation markup from `components.js`, add `role="dialog" aria-modal="true" aria-labelledby="app-panel-title"` to app panels, give their titles the matching id, and call `enhanceRenderedUi(root)` after each `root.innerHTML` assignment.

In `components.js`, add `aria-current="page"` to active sidebar/mobile navigation, set `aria-label="全局搜索"` on the search input, and export a mobile navigation using the same `navigation` array and `data-nav` contract.

In `utils.js`, render subtabs with `role="tab"` and `aria-selected`.

In `events.js`, prevent default for login button clicks, handle `submit` for `form[data-form="login"]`, and close an open panel on Escape. Keep click behavior for compatibility while preventing duplicate form submission.

- [ ] **Step 5: Run the gate and confirm GREEN**

Run `npm run check`.

Expected: `verify-mvp: OK`, with login form, mobile nav, dialog, tab, and enhancer assertions passing.

- [ ] **Step 6: Commit Task 3**

```bash
git add verify-mvp.mjs prototype/src/accessibility.js prototype/src/render.js prototype/src/components.js prototype/src/utils.js prototype/src/events.js prototype/src/main.js
git commit -m "fix: restore responsive and accessible navigation"
```

### Task 4: Align Shared UI With DESIGN.md And Eliminate Narrow Overflow

**Files:**
- Modify: `verify-mvp.mjs`
- Modify: `prototype/styles.css`

- [ ] **Step 1: Add failing design-system source checks**

In a new `runDesignSystemSourceChecks()` assert that the stylesheet contains dark semantic tokens, 8px maximum panel radius tokens, `.mobile-nav`, `:focus-visible`, `prefers-reduced-motion`, `.table-wrap { ... max-width: 100%`, and a 520px narrow breakpoint. Assert it no longer contains `radial-gradient` or `backdrop-filter`.

```js
assert.match(css, /--bg:\s*#0b0f14/);
assert.match(css, /--radius-lg:\s*8px/);
assert.match(css, /\.mobile-nav/);
assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(css, /radial-gradient|backdrop-filter/);
```

- [ ] **Step 2: Run the gate and confirm RED**

Run `npm run check`.

Expected: the dark token assertion fails against the current light theme.

- [ ] **Step 3: Replace global tokens and shared primitives**

Use this semantic token direction at `:root`:

```css
:root {
  --bg: #0b0f14;
  --panel: #121820;
  --panel-solid: #161d26;
  --panel-raised: #1a222d;
  --panel-border: #273241;
  --text: #e8edf3;
  --muted: #96a2b2;
  --primary: #4f8cff;
  --primary-strong: #8bb4ff;
  --primary-soft: rgba(79, 140, 255, 0.14);
  --success: #45c486;
  --warning: #f2b84b;
  --danger: #f06b78;
  --shadow-lg: 0 18px 40px rgba(0, 0, 0, 0.24);
  --shadow-md: 0 8px 22px rgba(0, 0, 0, 0.18);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.16);
  --radius-xl: 8px;
  --radius-lg: 8px;
  --radius-md: 6px;
  --radius-sm: 4px;
  --control-height: 38px;
}
```

Remove decorative page gradients, glass blur, oversized radii, negative letter spacing, and promotional shadows. Restyle the sidebar, surfaces, buttons, form controls, tabs, table, notices, code panels, empty states, dashboard hero, metrics, charts, topic map, and drawers through semantic tokens. Keep status colors distinct and readable.

- [ ] **Step 4: Implement stable responsive geometry**

At 1180px, show `.mobile-top` as a column containing the environment notice and horizontally scrollable `.mobile-nav`; hide only the desktop sidebar. Constrain all grid children with `min-width: 0`. At 720px and 520px, stack topbar controls, place search on its own row, keep primary actions and indicators in a wrapping action group, reduce panel padding, make `.table-wrap` the only horizontal scroll owner, and set `body { overflow-x: hidden; }` only after child containment is correct.

Add shared focus and motion rules:

```css
:where(button, a, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 5: Run the gate and confirm GREEN**

Run `npm run check`.

Expected: `verify-mvp: OK` and design source checks pass.

- [ ] **Step 6: Commit Task 4**

```bash
git add verify-mvp.mjs prototype/styles.css
git commit -m "style: align workspace with operational design system"
```

### Task 5: Correct The Indexing Boundary And Update Authoritative Docs

**Files:**
- Modify: `verify-mvp.mjs`
- Modify: `server.mjs`
- Modify: `prototype/sitemap.xml`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/MAINTENANCE.md`
- Modify: `CHANGELOG.md`
- Create: `docs/PROJECT_AUDIT_OPTIMIZATION_CLOSEOUT_2026-07-16.md`

- [ ] **Step 1: Add failing indexing assertions**

In `runHttpSecurityChecks()`, after loading `/`, add:

```js
assert.equal(
  html.headers["x-robots-tag"],
  "noindex, nofollow",
  "Authenticated workspace HTML should not be indexed"
);
assert.doesNotMatch(String(sitemap.body), /<url>/, "Sitemap should exclude the noindex admin shell");
```

Add a source assertion that `prototype/sitemap.xml` contains `<urlset` but no `<url>` entry.

- [ ] **Step 2: Run the gate and confirm RED**

Run `npm run check`.

Expected: the missing `x-robots-tag` assertion fails.

- [ ] **Step 3: Implement the indexing boundary**

For HTML in `sendFile()`, add:

```js
headers["X-Robots-Tag"] = "noindex, nofollow";
```

Return an empty valid `<urlset>` from `sitemapXml()` and mirror that in `prototype/sitemap.xml`. Keep the route, robots sitemap reference, and `llms.txt` unchanged.

- [ ] **Step 4: Write documentation and the closeout report**

Update the listed docs with exact behavior: loopback is the default host, Compose requires both production secrets, frontend data loads by page, the admin shell is noindex, the sitemap excludes the shell, UI controls follow the dark dense design system, and the product boundary remains controlled one-organization use.

Create the closeout report with these sections and populated evidence:

```markdown
# Project Audit And Optimization Closeout - 2026-07-16

## Outcome
## Fixed Findings
## Before And After Metrics
## Files Changed
## Verification Evidence
## Safe-Agent Routing Record
## Residual Risks
## Operating Boundary
```

Record router scenario `website-build-launch`, Route ID `sha256:14ef39a9c6a9274d652ff58c6fd142197d390ef0c73567ff3750fab1b5fd5152`, selected verification guidance for build, responsive screenshots, accessibility, browser navigation, and final diff review, plus actual final command outputs.

- [ ] **Step 5: Run targeted verification and confirm GREEN**

Run:

```bash
npm run check
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
git diff --check
```

Expected: `verify-mvp: OK`, SEO checker 0 errors/0 warnings, and no whitespace errors.

- [ ] **Step 6: Commit Task 5**

```bash
git add verify-mvp.mjs server.mjs prototype/sitemap.xml README.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/PRODUCTION_DEPLOYMENT.md docs/MAINTENANCE.md CHANGELOG.md docs/PROJECT_AUDIT_OPTIMIZATION_CLOSEOUT_2026-07-16.md
git commit -m "docs: close project optimization audit"
```

### Task 6: Run Browser, Security, Responsive, And Final Verification

**Files:**
- Modify if evidence changes: `docs/PROJECT_AUDIT_OPTIMIZATION_CLOSEOUT_2026-07-16.md`

- [ ] **Step 1: Start a clean local server**

Run on an unused port:

```bash
PORT=3010 GEO_ENABLE_PERSISTENCE=0 npm run start
```

Expected: `GEO Pulse MVP running at http://127.0.0.1:3010`.

- [ ] **Step 2: Verify login and request budget with Playwright CLI**

Open `http://127.0.0.1:3010/`, snapshot, fill owner credentials, press Enter from the password field, and assert the dashboard heading is visible. Use `requests` and a performance resource summary to verify no more than 11 API requests through login/dashboard load and no failed requests.

- [ ] **Step 3: Verify desktop and narrow layouts**

At 1440x900 and 390x844, capture dashboard and Settings screenshots. At each viewport evaluate:

```js
JSON.stringify({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  visibleNav: Array.from(document.querySelectorAll('[data-nav]')).filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }).length
})
```

Expected: `overflow: 0`; desktop sidebar visible at 1440px; all eight mobile module controls reachable at 390px.

- [ ] **Step 4: Verify labels, keyboard, dialog, console, and motion**

On Settings and International GEO, count controls without `labels`, `aria-label`, or `aria-labelledby`; expected 0. Tab through login and navigation to confirm visible focus. Open a panel, confirm dialog role/name/focus, press Escape, and confirm it closes. Emulate reduced motion and confirm transitions are effectively disabled. Check `console error` and failed requests; expected none.

- [ ] **Step 5: Run final automated and repository checks**

Run fresh:

```bash
npm run check
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
rg -n -S "(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)" . -g '!data/**' -g '!.git/**' -g '!.worktrees/**' -g '!output/**' -g '!Gemini_Generated_Image_*.png'
git diff --check
git status --short
```

Expected: all automated gates pass, secret scan contains no credential matches, diff check is clean, and only the intended closeout evidence edit is pending before the final commit.

- [ ] **Step 6: Finalize evidence and commit**

Update the closeout report with measured request count, transfer size, viewport overflow, label count, screenshots reviewed, and exact verification results.

```bash
git add docs/PROJECT_AUDIT_OPTIMIZATION_CLOSEOUT_2026-07-16.md
git commit -m "docs: record final optimization verification"
```

- [ ] **Step 7: Review the complete branch diff**

Run:

```bash
git status --short
git log --oneline main..HEAD
git diff --stat main...HEAD
git diff --check main...HEAD
```

Expected: clean worktree, focused commits for the six tasks, no whitespace errors, and no files outside the approved scope.
