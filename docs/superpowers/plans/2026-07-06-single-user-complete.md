# Single-User Complete v0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GEO Pulse v0.3 fully usable for one local/single-tenant operator.

**Architecture:** Keep the zero-dependency Node server and static admin shell. Add local-first data actions in `mock-data.mjs`, API routes in `server.mjs`, browser client actions in `prototype/src/main.js` and `prototype/src/events.js`, and compact UI controls in existing page modules.

**Tech Stack:** Node.js ES modules, built-in HTTP server, browser ESM modules, local JSON persistence, existing `verify-mvp.mjs` regression suite.

---

## Files

- Modify `mock-data.mjs`: local-first actions for workspace input, topics, articles, templates, exports, International GEO, billing plan, and logout.
- Modify `server.mjs`: add API routes and export download route.
- Modify `prototype/src/api.js`: add client wrappers for new endpoints.
- Modify `prototype/src/main.js`: add UI action handlers and payload readers.
- Modify `prototype/src/events.js`: route new button actions.
- Modify `prototype/src/pages/content.js`: enable new topic/article/template/outline/export buttons.
- Modify `prototype/src/pages/international.js`: replace read-only buttons with editable/auditable actions.
- Modify `prototype/src/pages/keywords.js`, `distribution.js`, `analytics.js`, `billing.js`, and `components.js`: replace disabled "coming soon" actions with exports, plan switch, and logout.
- Modify `verify-mvp.mjs`: add v0.3 regression checks.
- Update `README.md`, `docs/API_REFERENCE.md`, `docs/ROADMAP.md`, `CHANGELOG.md`, and stage closeout docs.

## Task 1: Tests First

- [x] Add failing assertions to `verify-mvp.mjs` for new v0.3 endpoints and UI text removal.
- [x] Run `npm run check` and confirm it fails because the endpoints/actions do not exist yet.

## Task 2: Local Data Actions

- [x] Add workspace input state and save action.
- [x] Add manual topic create/update and outline generation.
- [x] Add manual article create action.
- [x] Add content template create action.
- [x] Add export job generation and download content lookup.
- [x] Add International GEO input, audit, and artifact generation.
- [x] Add local billing plan update and safe logout result.
- [x] Run `npm run check` until data action tests pass.

## Task 3: Server API Routes

- [x] Add JSON routes for all v0.3 read/mutation endpoints.
- [x] Add `GET /api/v1/exports/:id/download` with text/CSV/JSON content type.
- [x] Ensure all mutations use the existing API-key guard.
- [x] Run `npm run check` until HTTP checks pass.

## Task 4: Browser Client And Events

- [x] Add client wrappers in `prototype/src/api.js`.
- [x] Add action handlers in `prototype/src/main.js`.
- [x] Add event routing in `prototype/src/events.js`.
- [x] Ensure notices and selected ids update after every action.

## Task 5: UI Enablement

- [x] Replace content "coming soon" buttons with create, edit, outline, template, and export actions.
- [x] Replace keyword, distribution, and analytics export dead-ends with export actions.
- [x] Replace International GEO read-only toolbar with save input, audit, and artifact actions.
- [x] Replace billing upgrade dead-end with local plan update.
- [x] Replace logout dead-end with safe single-user logout action.
- [x] Preserve the existing dense admin style from `DESIGN.md`.

## Task 6: Docs And Verification

- [x] Update docs and changelog to identify v0.3 single-user complete scope.
- [x] Run `npm run check`.
- [x] Run Google SEO static check.
- [x] Run browser smoke for content, international GEO, exports, billing, and logout-visible state.
- [x] Commit implementation in focused commits.

## Review

- Scope matches Scheme A: local-first complete workflow, no multi-tenant SaaS.
- No real third-party credentials are required.
- Disabled buttons are allowed only for invalid state, not missing feature copy.
- The verification suite is the release gate.

## Completion Evidence

- Spec commit: `9a7617d docs: define single-user v0.3 scope`
- Data/API commit: `3e695a0 feat: add single-user local actions`
- Browser workflow commit: `2cc408c feat: wire single-user browser workflows`
- `npm run check`: `verify-mvp: OK`
- Google SEO static scan: `Errors: 0`, `Warnings: 0`
- Browser smoke: content, International GEO, billing, and logout/primary action visibility checked with Playwright snapshots
