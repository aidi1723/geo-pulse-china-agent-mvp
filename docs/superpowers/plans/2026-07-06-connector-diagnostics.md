# Connector Diagnostics v0.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local connector diagnostics and connector-to-run visibility for one operator.

**Architecture:** Extend the existing `mock-data.mjs` connector layer with diagnostic records built from connector config, latest health checks, permission decisions, audit events, and automation run steps. Expose diagnostics through `server.mjs`, wire browser actions through existing API/main/events patterns, and render a compact diagnostic section in the settings connector drawer.

**Tech Stack:** Node.js ES modules, built-in HTTP server, browser ESM modules, local JSON persistence, existing `verify-mvp.mjs` regression suite.

---

## Files

- Modify `mock-data.mjs`: diagnostic storage, diagnostic builder, list/run actions, connector sanitization.
- Modify `server.mjs`: diagnostic POST and list routes.
- Modify `prototype/src/api.js`: diagnostic client wrappers.
- Modify `prototype/src/main.js`: run connector diagnostic action.
- Modify `prototype/src/events.js`: route diagnostic button clicks.
- Modify `prototype/src/pages/settings.js`: diagnostic button and latest diagnostic panel.
- Modify `verify-mvp.mjs`: data action, HTTP, and rendered UI checks.
- Update `CHANGELOG.md`, `docs/API_REFERENCE.md`, `docs/ROADMAP.md`, and create `docs/STAGE_V0_5_CLOSEOUT.md`.

## Task 1: Tests First

- [x] Add failing imports and assertions for `runConnectorDiagnosticAction` and `listConnectorDiagnostics`.
- [x] Assert diagnostics include readiness score, checks, recommendations, recent audit events, recent run steps, and no raw secrets.
- [x] Add HTTP assertions for diagnostic POST and list routes.
- [x] Add rendered UI assertions for `data-action="run-connector-diagnostic"` and latest diagnostic content.
- [x] Run `npm run check` and confirm it fails because diagnostics are missing.

## Task 2: Data Actions

- [x] Add `connectorDiagnostics` to serializable and hydrated runtime state.
- [x] Add `buildConnectorDiagnostic(connector)` using config, permission decisions, audit events, health checks, and automation run steps.
- [x] Add `runConnectorDiagnosticAction(connectorId)` and `listConnectorDiagnostics(query)`.
- [x] Attach `last_diagnostic` to sanitized connector details.
- [x] Persist state and record `automation_connector.diagnose` audit events.

## Task 3: API Routes

- [x] Import diagnostic actions in `server.mjs`.
- [x] Add `POST /automation-connectors/:id/diagnose`.
- [x] Add `GET /connector-diagnostics`.
- [x] Keep existing JSON error behavior for missing connectors.

## Task 4: Browser Wiring

- [x] Add `runConnectorDiagnostic` and optional `getConnectorDiagnostics` wrappers in `prototype/src/api.js`.
- [x] Add `actions.runConnectorDiagnostic` in `prototype/src/main.js`.
- [x] Add `run-connector-diagnostic` handling in `prototype/src/events.js`.
- [x] Refresh data and keep selected connector after diagnostics.

## Task 5: Settings UI

- [x] Add a compact "运行诊断" button beside save/test actions.
- [x] Render latest diagnostic score/status/checks/recommendations in the connector drawer.
- [x] Render recent run steps and audit context without raw secrets.
- [x] Preserve current dense dark admin style from `DESIGN.md`.

## Task 6: Docs And Verification

- [x] Update API docs, roadmap, changelog, and closeout copy for v0.5.
- [x] Run `npm run check`.
- [x] Run the static SEO scan.
- [x] Run browser smoke on settings connector diagnostics.
- [x] Commit v0.5 changes without staging unrelated `docs/MAINTENANCE.md`.
