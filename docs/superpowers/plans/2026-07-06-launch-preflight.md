# Launch Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only launch preflight route and settings UI so a single operator can see deployment blockers and warnings in one place.

**Architecture:** Build preflight in `server.mjs` because it depends on process environment and runtime route capabilities. Include the same result in `/system/runtime`, add a dedicated `/system/preflight` route, fetch it from the frontend, and render it in the existing settings runtime panel.

**Tech Stack:** Node.js ESM, existing vanilla frontend, `verify-mvp.mjs`, existing dark admin UI helpers.

---

### Task 1: Red Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [x] **Step 1: Add HTTP assertions**

Assert `GET /api/v1/system/preflight` returns status 200, a `status` field, a numeric score, summary counts, and checks for persistence, mutation auth, backup recovery, connectors, GEO static routes, and scheduler.

- [x] **Step 2: Add runtime assertions**

Assert `GET /api/v1/system/runtime` includes `preflight`.

- [x] **Step 3: Add UI assertions**

Assert settings runtime UI renders "上线预检", status/score rows, a preflight check table, and `data-action="refresh-launch-preflight"`.

- [x] **Step 4: Run red check**

Run `npm run check`. Expected failure: preflight route or UI is missing.

### Task 2: Server Preflight

**Files:**
- Modify: `server.mjs`

- [x] **Step 1: Add helper**

Implement `getLaunchPreflight()` that returns score, status, summary, checks, and generated timestamp.

- [x] **Step 2: Add route**

Add `GET /system/preflight`.

- [x] **Step 3: Include in runtime**

Add `preflight: getLaunchPreflight()` to `getAugmentedRuntimeStatus()`.

### Task 3: Frontend API And Action

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`

- [x] **Step 1: Add API wrapper**

Add `getLaunchPreflight()`.

- [x] **Step 2: Add refresh action**

Add `refreshLaunchPreflight()` that fetches preflight, stores it into `store.data.runtimeStatus.preflight`, stays on settings/brand, and shows a notice.

- [x] **Step 3: Wire event**

Map `refresh-launch-preflight` to the action.

### Task 4: Settings UI

**Files:**
- Modify: `prototype/src/pages/settings.js`

- [x] **Step 1: Add renderer**

Add `renderLaunchPreflight(preflight = {})` using existing table and info list helpers.

- [x] **Step 2: Insert in runtime panel**

Render it near backup controls in the "运行态与数据" panel.

### Task 5: Documentation

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/API_REFERENCE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/README.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/OPEN_SOURCE_RELEASE.md`
- Create: `docs/STAGE_V0_8_CLOSEOUT.md`

- [x] **Step 1: Bump version**

Set package version to `0.8.0`.

- [x] **Step 2: Document preflight**

Add route, UI, deployment checklist, roadmap status, and v0.8 closeout.

### Task 6: Verification

**Files:**
- Modify only if checks expose defects.

- [x] **Step 1: Run full check**

Run `npm run check`. Expected: `verify-mvp: OK`.

- [x] **Step 2: Run static SEO scan**

Run `node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .`. Expected: 0 errors and 0 warnings.

- [x] **Step 3: Run browser smoke**

Start the app with persistence disabled, open settings, verify preflight renders, click refresh, and confirm the table remains visible.

- [x] **Step 4: Commit**

Commit spec/plan and implementation/docs in scoped commits, excluding pre-existing dirty `docs/MAINTENANCE.md`.
