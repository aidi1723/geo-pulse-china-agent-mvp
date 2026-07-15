# Minimal CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal GitHub Actions workflow that runs the existing verification gate on pushes and pull requests.

**Architecture:** Keep CI as a repository-level workflow only. The application remains zero-dependency; GitHub Actions checks out the repo, sets up Node.js 20, and runs `npm run check`.

**Tech Stack:** GitHub Actions, Node.js 20, existing `npm run check` / `verify-mvp.mjs`.

---

### Task 1: Workflow

**Files:**
- Create: `.github/workflows/check.yml`

- [x] **Step 1: Create workflow**

Add a workflow named `check` that runs on push and pull request events targeting `main`.

- [x] **Step 2: Configure Node**

Use `actions/checkout@v7` and `actions/setup-node@v6` with `node-version: 20`.

- [x] **Step 3: Run project gate**

Run `npm run check` as the workflow's verification command.

### Task 2: Documentation

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/README.md`
- Modify: `docs/ROADMAP.md`

- [x] **Step 1: Document CI in README**

Mention that GitHub Actions runs the same `npm run check` gate on pushes and pull requests to `main`.

- [x] **Step 2: Document contributor workflow**

Add the CI gate to the development guide and docs index.

- [x] **Step 3: Update roadmap and changelog**

Move Minimal CI from the next slices list into completed capabilities and record the patch-level change.

### Task 3: Verification And Release Hygiene

**Files:**
- Modify only if verification exposes defects.

- [x] **Step 1: Run project check**

Run `npm run check`. Expected output includes `verify-mvp: OK`.

- [x] **Step 2: Run static SEO scan**

Run `node $HOME/.codex/skills/google-seo/scripts/check-static-seo.mjs .`. Expected output reports 0 errors and 0 warnings.

- [x] **Step 3: Inspect git status**

Confirm only Minimal CI files are staged for commit and pre-existing `docs/MAINTENANCE.md` remains unstaged.

- [x] **Step 4: Commit and push**

Commit with `ci: add minimal check workflow` and push `main` to `origin`.
