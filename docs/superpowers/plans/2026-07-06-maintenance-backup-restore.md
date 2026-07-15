# Single-User Backup and Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add local runtime backup, validation, download, and restore flows so the single-user prototype can be operated and recovered safely.

**Architecture:** Extend the existing `mock-data.mjs` runtime persistence layer with non-recursive backup snapshots. Add `/api/v1/system/backups` routes beside existing runtime endpoints, then surface the controls inside the existing settings runtime panel.

**Tech Stack:** Node.js ESM, built-in `crypto`, existing HTTP server, vanilla frontend modules, `verify-mvp.mjs`, static SEO checker, Playwright smoke test.

---

### Task 1: Red Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [x] **Step 1: Add failing imports**

Add `createRuntimeBackupAction`, `listRuntimeBackups`, `getRuntimeBackupDownload`, `validateRuntimeBackupAction`, and `restoreRuntimeBackupAction` to the `mock-data.mjs` import list in `verify-mvp.mjs`.

- [x] **Step 2: Add data-layer assertions**

Add checks that create a backup, list it, download the JSON artifact, validate the checksum, mutate brand state, restore from the backup, and confirm audit events were recorded.

- [x] **Step 3: Add HTTP assertions**

Add checks for:

```text
POST /api/v1/system/backups
GET /api/v1/system/backups
GET /api/v1/system/backups/:id/download
POST /api/v1/system/backups/:id/validate
POST /api/v1/system/backups/:id/restore
```

- [x] **Step 4: Add UI render assertions**

Assert the settings page contains the local backup section and `data-action` hooks for create, validate, download, and restore.

- [x] **Step 5: Run red verification**

Run `npm run check`. Expected: failure because the new backup action exports do not exist yet.

### Task 2: Runtime Backup Actions

**Files:**
- Modify: `mock-data.mjs`

- [x] **Step 1: Import crypto**

Add `import crypto from "node:crypto";`.

- [x] **Step 2: Add backup storage**

Add `const runtimeBackups = [];` near other mutable runtime collections.

- [x] **Step 3: Exclude backup history from captured snapshots**

Add `getBackupSnapshot()` that deep-clones `getSerializableState()` and deletes `runtimeBackups`.

- [x] **Step 4: Include metadata in persisted state**

Add `runtimeBackups` to `getSerializableState()` and `hydrateRuntimeState()`, but keep `getBackupSnapshot()` non-recursive.

- [x] **Step 5: Add exported actions**

Implement:

```js
export function listRuntimeBackups() {}
export function createRuntimeBackupAction(payload = {}) {}
export function getRuntimeBackupDownload(backupId) {}
export function validateRuntimeBackupAction(backupId) {}
export function restoreRuntimeBackupAction(backupId) {}
```

Each action records the expected audit event and calls `persistState()` after mutation.

- [x] **Step 6: Update runtime status**

Add `backups` summary to `getRuntimeStatus()`.

### Task 3: HTTP API

**Files:**
- Modify: `server.mjs`

- [x] **Step 1: Import backup actions**

Import the five backup exports from `mock-data.mjs`.

- [x] **Step 2: Add routes**

Add routes beside `/system/runtime`:

```text
GET /system/backups
POST /system/backups
GET /system/backups/:id/download
POST /system/backups/:id/validate
POST /system/backups/:id/restore
```

Use existing `ok()` and `error()` envelopes. The download route returns the artifact in the normal JSON envelope so the frontend can consume it consistently.

### Task 4: Frontend Controls

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`
- Modify: `prototype/src/pages/settings.js`

- [x] **Step 1: Add API wrappers**

Add wrappers for create/list/download/validate/restore backup endpoints.

- [x] **Step 2: Add actions**

Add actions that create a backup, validate a backup, download the JSON artifact via a browser blob, and restore after confirmation.

- [x] **Step 3: Add UI section**

Render backup summary and recent backup table inside the existing "运行态与数据" panel using current `info-list`, `actions-row`, table, and button classes.

- [x] **Step 4: Wire event actions**

Handle `create-runtime-backup`, `validate-runtime-backup`, `download-runtime-backup`, and `restore-runtime-backup`.

### Task 5: Documentation

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/API.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/ROADMAP.md`
- Create: `docs/STAGE_V0_6_CLOSEOUT.md`

- [x] **Step 1: Bump version**

Set package version to `0.6.0`.

- [x] **Step 2: Document API and operations**

Add the backup/restore API contract, local operator notes, and stage closeout summary.

### Task 6: Verification

**Files:**
- Modify only if verification exposes defects.

- [x] **Step 1: Run full check**

Run `npm run check`. Expected: `verify-mvp: OK`.

- [x] **Step 2: Run static SEO scan**

Run `node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .`. Expected: 0 errors.

- [x] **Step 3: Run browser smoke**

Start the app on an unused port with persistence disabled, open settings, create a backup, validate it, restore it, and confirm the UI shows the backup table without layout breakage.

- [x] **Step 4: Commit in scoped batches**

Commit spec/plan first, implementation/docs second, and closeout updates last. Exclude the pre-existing dirty `docs/MAINTENANCE.md`.
