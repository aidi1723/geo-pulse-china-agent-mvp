# Integration Readiness v0.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing connector registry configurable, testable, and observable for a single-user local deployment.

**Architecture:** Keep the zero-dependency Node server and browser ESM shell. Extend `mock-data.mjs` with connector mutation and health-check actions, expose them through `server.mjs`, and wire settings-page controls through the existing API, main action, event, table, drawer, and notice patterns.

**Tech Stack:** Node.js ES modules, built-in HTTP server, browser ESM modules, local JSON persistence, existing `verify-mvp.mjs` regression suite.

---

## Files

- Modify `mock-data.mjs`: connector save/test/list health actions and runtime summary.
- Modify `server.mjs`: connector mutation, test, and health-check routes.
- Modify `prototype/src/api.js`: browser wrappers for connector save/test/health.
- Modify `prototype/src/main.js`: connector payload reader and save/test actions.
- Modify `prototype/src/events.js`: route connector save/test button clicks.
- Modify `prototype/src/pages/settings.js`: selectable connector rows and detail drawer.
- Modify `verify-mvp.mjs`: failing tests first for data actions, routes, and UI source.
- Update `docs/API_REFERENCE.md`, `docs/ROADMAP.md`, `CHANGELOG.md`, and create `docs/STAGE_V0_4_CLOSEOUT.md`.

## Task 1: Tests First

- [x] Add failing imports and assertions to `verify-mvp.mjs` for `saveAutomationConnectorAction`, `testAutomationConnectorAction`, and `listConnectorHealthChecks`.
- [x] Add HTTP checks for `PUT /api/v1/automation-connectors/:id`, `POST /api/v1/automation-connectors/:id/test`, and `GET /api/v1/connector-health-checks`.
- [x] Add UI render/source checks for connector selection, save, and test controls.
- [x] Run `npm run check` and confirm it fails because connector actions do not exist yet.

## Task 2: Local Connector Actions

- [x] Add connector health-check storage to `mock-data.mjs`.
- [x] Add endpoint validation for connector configs.
- [x] Add `saveAutomationConnectorAction(connectorId, patch)`.
- [x] Add `testAutomationConnectorAction(connectorId)`.
- [x] Add `listConnectorHealthChecks(query)`.
- [x] Persist state and record audit events after save/test.
- [x] Run `npm run check` until data-action tests pass.

## Task 3: Server API Routes

- [x] Import the new connector actions in `server.mjs`.
- [x] Add the connector PUT, test, and health-check routes.
- [x] Return structured `404`, `400`, and action errors through existing JSON helpers.
- [x] Run `npm run check` until HTTP checks pass.

## Task 4: Browser Wiring

- [x] Add connector client wrappers in `prototype/src/api.js`.
- [x] Add `getAutomationConnectorPayload`, `saveAutomationConnector`, and `testAutomationConnector` in `prototype/src/main.js`.
- [x] Add event cases for `save-connector-config` and `test-connector-config` in `prototype/src/events.js`.
- [x] Refresh data and show compact notices after save/test.

## Task 5: Settings UI

- [x] Make connector rows selectable with `data-select-connector`.
- [x] Add a connector drawer using the existing panel, form-grid, info-list, and actions-row classes.
- [x] Show masked key hints, permission boundary, recent health check, and audit status.
- [x] Keep the existing provider drawer intact.
- [x] Run rendered UI checks.

## Task 6: Docs And Verification

- [x] Update API docs, roadmap, changelog, and closeout copy for v0.4.
- [x] Run `npm run check`.
- [x] Run the Google SEO/static scan command used by the repo if available.
- [x] Run browser smoke on settings connectors.
- [x] Commit v0.4 changes without staging unrelated `docs/MAINTENANCE.md`.
