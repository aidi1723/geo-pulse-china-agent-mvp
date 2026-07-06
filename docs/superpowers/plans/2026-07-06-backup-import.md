# Backup Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add import validation and import for downloaded runtime backup artifacts so a fresh local runtime can recover from exported JSON.

**Architecture:** Reuse the v0.6 backup artifact format and checksum helpers in `mock-data.mjs`. Add data actions, HTTP routes under `/system/backups/import`, frontend API wrappers, settings UI textarea/actions, and verification coverage.

**Tech Stack:** Node.js ESM, built-in `crypto`, existing vanilla browser frontend, `verify-mvp.mjs`, Playwright CLI smoke checks.

---

### Task 1: Red Tests

**Files:**
- Modify: `verify-mvp.mjs`

- [x] **Step 1: Add failing imports**

Import `validateRuntimeBackupImportAction` and `importRuntimeBackupAction` from `mock-data.mjs`.

- [x] **Step 2: Add data assertions**

Create a backup, download its artifact, reset runtime, validate the artifact import, import it under a new name, confirm the imported backup gets a new id and preserves `source_backup_id`, restore from the imported backup, and confirm audit events exist.

- [x] **Step 3: Add HTTP assertions**

Cover:

```text
POST /api/v1/system/backups/import/validate
POST /api/v1/system/backups/import
```

- [x] **Step 4: Add UI assertions**

Assert the settings runtime backup panel renders the import textarea and `data-action` hooks for import validation and import.

- [x] **Step 5: Run red check**

Run `npm run check`. Expected failure: missing backup import exports.

### Task 2: Data Actions

**Files:**
- Modify: `mock-data.mjs`

- [x] **Step 1: Add artifact normalization helper**

Accept either a parsed artifact object or a JSON string and return `{ artifact, issues }`.

- [x] **Step 2: Add validation action**

Export `validateRuntimeBackupImportAction(payload = {})`. It validates kind, schema version, backup metadata, snapshot object, checksum, and absence of `runtimeBackups` in the snapshot. It records `runtime.backup.import.validate` without storing snapshot data in audit details.

- [x] **Step 3: Add import action**

Export `importRuntimeBackupAction(payload = {})`. It validates first, creates a new `bkp-*` id, stores a backup entry with `imported`, `source_backup_id`, and `imported_at`, persists state, and records `runtime.backup.import`.

### Task 3: HTTP API

**Files:**
- Modify: `server.mjs`

- [x] **Step 1: Import actions**

Import `validateRuntimeBackupImportAction` and `importRuntimeBackupAction`.

- [x] **Step 2: Add routes**

Add routes beside existing backup routes:

```text
POST /system/backups/import/validate
POST /system/backups/import
```

Invalid imports should return HTTP 400 with a structured error.

### Task 4: Frontend

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`
- Modify: `prototype/src/pages/settings.js`

- [x] **Step 1: Add API wrappers**

Add wrappers for import validation and import.

- [x] **Step 2: Add actions**

Read textarea content by `data-runtime-backup-import`, parse JSON if possible, call validation/import endpoints, refresh data, and clear textarea after import.

- [x] **Step 3: Add UI controls**

Add textarea plus validate/import buttons inside `renderRuntimeBackups()`.

- [x] **Step 4: Wire event handlers**

Add handlers for `validate-runtime-backup-import` and `import-runtime-backup`.

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
- Create: `docs/STAGE_V0_7_CLOSEOUT.md`

- [x] **Step 1: Bump version**

Set package version to `0.7.0`.

- [x] **Step 2: Document import flow**

Add API contract, deployment recovery flow, roadmap status, and v0.7 closeout.

### Task 6: Verification

**Files:**
- Modify only if checks expose defects.

- [x] **Step 1: Run full check**

Run `npm run check`. Expected: `verify-mvp: OK`.

- [x] **Step 2: Run static SEO scan**

Run `node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .`. Expected: 0 errors and 0 warnings.

- [x] **Step 3: Run browser smoke**

Start the app with persistence disabled, create a backup, download/obtain artifact via API, paste it into the import textarea, validate import, import it, and verify the imported backup appears.

- [x] **Step 4: Commit**

Commit spec/plan and implementation/docs in scoped commits, excluding the pre-existing dirty `docs/MAINTENANCE.md`.
