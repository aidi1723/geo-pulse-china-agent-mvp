# Maintenance Guide

## Release Gate

Use this local gate before every public update:

```bash
npm run check
```

Do not mark a release ready unless the command exits successfully.

For GitHub-hosted work, also confirm the `check` workflow passes on the pushed branch or pull request. The workflow is defined in `.github/workflows/check.yml` and runs the same `npm run check` gate.

## Routine Maintenance

Weekly or before a release:

- Review `README.md` against current commands and APIs.
- Review `docs/API_REFERENCE.md` against `server.mjs`.
- Review `docs/EXTENDING.md` when provider, connector, source adapter, API, or UI extension patterns change.
- Review `docs/ROADMAP.md` when a planned slice lands or scope changes.
- Review `CHANGELOG.md` for user-visible changes.
- Run `npm run check`.
- Confirm GitHub Actions `check` passes after pushing.
- Confirm `.gitignore` still excludes local state, credentials, generated build output, and logs.
- Run the privacy release review in `docs/PRIVACY_RELEASE_REVIEW.md`.
- Review `reports/security-hardening-log.md` after security-related changes.
- Confirm no raw secrets appear in audit logs, provider configs, connector configs, static preview data, or docs.

## Runtime State

Default local state:

```text
data/geo-pulse-state.json
```

The file is generated runtime data and should not be published. To reset through the API, use the settings page runtime reset or:

```bash
curl -X POST http://localhost:3000/api/v1/system/runtime/reset \
  -H "Content-Type: application/json" \
  -H "X-GEO-API-Key: <local-key>" \
  -d "{}"
```

## Security Maintenance

Keep these defaults intact unless there is a documented replacement:

- Remote access off by default.
- Fixed API key required when remote access is enabled.
- Production startup requires a fixed `GEO_BOOTSTRAP_OWNER_PASSWORD`.
- Browser users authenticate through HTTP-only `geo_session` cookies.
- Owner/admin/editor/viewer permissions remain enforced by the server.
- Audit reads remain limited to admin/owner sessions or the system API key.
- Scheduler off by default.
- Audit events enabled for sensitive actions.
- CSV export neutralizes spreadsheet formula prefixes.
- Provider endpoint SSRF guard remains active.
- Connector permission checks remain active before external collection or campaign actions.

## Privacy Release Review

Before publishing or after major documentation updates, follow [Privacy Release Review](PRIVACY_RELEASE_REVIEW.md).

Key rule: if private content was already pushed to a public branch, a normal cleanup commit is not enough because the old content remains in Git history. For an early public release, clean the tree, verify it, create a privacy-reviewed single-commit history, and update the public branch with `git push --force-with-lease origin main`.

Do this only when the repository owner accepts history rewriting. For established repositories with external contributors, coordinate first.

## Maintenance Log

### 2026-07-07 - v0.19 Production Integration Foundation Closeout

- Scope: added International GEO visibility provider configs, approval status, masked credentials, dry-run tests, diagnose-all workflow, publishing connector configs, dry-run publishing boundary, production readiness checks, masked secret inventory, handoff checklist, and UI panels for provider/connector/readiness operations.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.19 closeout docs.
- Boundary: v0.19 is a dry-run production integration foundation only; no live AI/search/SERP/indexing/provider/CMS/social/community APIs, no automatic external publishing, no raw credential exposure, and no automated monitoring claims without future approved provider evidence.

### 2026-07-07 - v0.18 Measured Evidence Operations Closeout

- Scope: added International GEO JSON batch measured-evidence import, local import ledger rows, pending/approved/rejected review state, approved-only visibility trend rows, and the `批量导入测量证据`, `测量证据台账`, `证据复核`, and `可见度趋势` UI panels.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.18 closeout docs.
- Boundary: manual evidence operations are human-entered evidence only; no live AI/search/SERP/indexing/external platform APIs, no external provider credentials, no file uploads, no automated provider imports, and no automated monitoring claims without future approved provider evidence.

### 2026-07-07 - v0.17 Measured Visibility Evidence Import Closeout

- Scope: added manual measured visibility evidence import for International GEO, `manual_import` snapshot provenance, `measured_import` run records, readiness `manual_review` status, and the `导入测量证据` UI panel.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.17 closeout docs.
- Boundary: manual imports are human-entered evidence only; no live AI/search/SERP/indexing/external platform APIs, no external provider credentials, no batch imports, and no automated monitoring claims without future approved provider evidence.

### 2026-07-07 - v0.16 Content Generation Closeout

- Scope: added International GEO `local_rules` content-generation provider seam, deterministic full article drafts from approved evidence assets, generated article approve/reject review state, deterministic platform rewrites from approved generated articles, rewrite approve/reject review state, and generation run records.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.16 closeout docs.
- Boundary: local deterministic generation and human review only; external LLM providers are reserved but not executed; no external publishing, platform credentials, live AI/search/SERP/indexing verification, or measured inclusion/recommendation claims.

### 2026-07-07 - v0.15 Publishing Workflow Closeout

- Scope: added International GEO high-authority publishing platform list, authority signals, AI recommendation-probability notes, deterministic package generation from approved evidence assets, review-only package queue, and manual/local tracking records.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.15 closeout docs.
- Boundary: local planning/handoff only; platform notes only describe probability-lifting channels; no external publishing, credentials, full articles, live AI/search/SERP/indexing verification; tracking is manual/local unless future connector evidence.

### 2026-07-07 - v0.14 Evidence-Driven Asset Review Closeout

- Scope: added International GEO evidence-driven opportunities, local generation queue rows, generated local previews with provenance metadata, and approve/reject review state.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.14 closeout docs.
- Boundary: v0.14 generates reviewable local assets only. It does not publish externally, generate full long-form articles, call live AI search engines, or claim measured engine inclusion, citation presence, recommendation rank, or external distribution.

### 2026-07-07 - v0.13 AI Visibility Measurement Foundation Closeout

- Scope: added International GEO prompt sets, provider readiness, visibility runs, prompt snapshots, UI panels, and browser button wiring for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot / Bing readiness.
- Local gate: `npm run check` returned `verify-mvp: OK` after rerunning in the parent environment with local port binding available.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, open-source release checklist, changelog, maintenance guide, and v0.13 closeout docs.
- Boundary: v0.13 is a measurement foundation only. Default local runs create `unavailable` snapshots and do not query real AI/search providers or claim measured engine inclusion, citation presence, recommendation rank, or competitor rank.

### 2026-07-07 - v0.12 Evidence-Backed GEO Scoring Closeout

- Scope: added deterministic International GEO scoring fields, audit-level `score_breakdown`, legacy-safe score hydration, and UI `评分拆解`.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, changelog, and v0.12 closeout docs.
- Boundary: v0.12 deepens scoring from local input and guarded crawl evidence, but it does not add real AI search engine querying, measured engine inclusion/rank tracking, recursive crawling, JavaScript rendering, automatic third-party publishing, database persistence, OAuth/SSO, MFA, monitoring, or multi-tenant isolation.

### 2026-07-06 - v0.11 Live Site Crawl Evidence Closeout

- Scope: added guarded International GEO live crawl evidence for homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt`.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, phase 2 roadmap, changelog, open-source release checklist, and v0.11 closeout docs.
- Boundary: v0.11 adds safe public-site evidence collection, but it does not add recursive crawling, JavaScript rendering, real AI search engine querying, real SERP collection, automatic third-party publishing, database persistence, OAuth/SSO, MFA, monitoring, or multi-tenant isolation.

### 2026-07-06 - v0.10 Site GEO Audit And Asset Generation Closeout

- Scope: added International GEO site audit input, durable rule-first site audit records, generated GEO asset previews, and API routes for audit list/detail/create plus asset generation.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Static SEO gate: required for final closeout before publication.
- Documentation aligned: README, API reference, architecture guide, development guide, production deployment guide, roadmap, documentation index, changelog, open-source release checklist, and v0.10 closeout docs.
- Boundary: v0.10 is a rule-first audit and asset preparation tool. It does not add live crawling, real AI search engine querying, real SERP collection, automatic third-party publishing, database persistence, OAuth/SSO, MFA, monitoring, or multi-tenant isolation.

### 2026-07-06 - v0.9.1 Minimal CI Closeout

- Scope: added GitHub Actions `check` workflow for pushes and pull requests targeting `main`.
- Local gate: `npm run check` returned `verify-mvp: OK`.
- Static SEO gate: 82 files scanned, 0 errors, 0 warnings.
- Remote gate: GitHub Actions `check` completed successfully on `main` after the minimal CI workflow was pushed.
- Documentation aligned: README, development guide, contributing guide, roadmap, open-source release checklist, changelog, and v0.9.1 closeout docs.
- Boundary unchanged: v0.9.1 adds CI only; it does not add database persistence, OAuth/SSO, MFA, real integrations, monitoring, or multi-tenant isolation.

### 2026-07-05 - Public Repository Privacy Check

- Scope: public GitHub repository metadata, current tracked files, ignored local files, Git commit history, and the generated PNG asset metadata.
- Repository state: `main` branch was clean before review; public remote is `https://github.com/aidi1723/geo-pulse-china-agent-mvp.git`.
- Public metadata: repository visibility is public; repository owner/login is `aidi1723`; commit author email uses GitHub noreply.
- Checks run: local path scans for `/Users/`, `/home/`, and `C:\Users\`; secret-pattern scans for common API keys, GitHub tokens, AWS keys, private-key blocks, and demo/test key strings; email, phone, private endpoint, and ignored-file checks; Git history scans across all commits.
- Findings accepted as safe: local development URLs such as `localhost` and `127.0.0.1`; example emails under `example.com`; obvious fake/demo keys used by docs and tests; ignored local files `.DS_Store` and `data/geo-pulse-state.json` are not tracked.
- Finding cleaned before the v0.9.1 public update: `reports/agentcoreos-geo-report.md` now uses `demo-contact-placeholder` instead of the previous phone-shaped demo string.
- No evidence found of real local absolute paths, real personal email addresses, tracked `.env` files, tracked runtime state, or real credential patterns in the current tree or existing Git history.
- History rewrite: not performed.

## Post-v0.19 Production Hardening

v0.19.0 is deployable as a controlled one-organization team-access service behind an external access layer. Before treating it as a real SaaS, real-time AI search monitoring platform, external LLM generation system, external publishing system, or broadly exposed hosted service, production hardening should include:

- Database persistence, migrations, and database-grade backup policy.
- Monitoring and alerting.
- Durable secret management outside local JSON and source code.
- OAuth/SSO and MFA if external identity integration is required.
- Real provider, connector, and source adapter implementations.
- Measured AI visibility data sources and external publishing/indexing connectors before claiming automated real engine inclusion, recommendation tracking, indexing, citation, or automatic distribution.
- Live adapters behind the v0.19 provider and publishing connector registries, with explicit approval gates and diagnostics.
- Approved external generation providers before claiming external LLM-backed article or rewrite generation.
- Connector evidence and approval gates before moving reviewed evidence assets or publishing packages outside the local workflow.
- Security contact ownership and incident response process.
- Multi-tenant workspace isolation if multiple organizations use the service.
- Data retention, deletion, and privacy policy.

## Dependency Policy

The project currently has no runtime npm dependencies. New dependencies should be added only when they remove substantial complexity and have a clear license, active maintenance, and small attack surface.

## Documentation Maintenance

Use [Documentation Index](README.md) as the table of contents. New maintainer-facing documents should be linked there and from the root `README.md`.
