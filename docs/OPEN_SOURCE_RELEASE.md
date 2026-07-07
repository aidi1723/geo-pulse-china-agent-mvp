# Open Source Release Checklist

## License Decision

The repository is prepared for GNU General Public License version 3.

- SPDX package value: `GPL-3.0-only`
- License file: `LICENSE`
- Contributor agreement: contributions are accepted under GPLv3 through `CONTRIBUTING.md`

This is a project-owner compliance note, not legal advice.

## Current Readiness

Ready for GitHub publication as a v0.21.0 one-organization team-access workspace after owner review.

Verified release gate:

```bash
npm run check
```

Expected output:

```text
verify-mvp: OK
```

GitHub also includes a `check` workflow that runs the same command on pushes and pull requests targeting `main`.

## Files Added For Publication

- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/API_REFERENCE.md`
- `docs/EXTENDING.md`
- `docs/DEVELOPMENT.md`
- `docs/MAINTENANCE.md`
- `docs/ROADMAP.md`
- `docs/OPEN_SOURCE_RELEASE.md`
- `docs/STAGE_V0_9_1_CLOSEOUT.md`
- `docs/STAGE_V0_10_CLOSEOUT.md`
- `docs/STAGE_V0_11_CLOSEOUT.md`
- `docs/STAGE_V0_12_CLOSEOUT.md`
- `docs/STAGE_V0_13_CLOSEOUT.md`
- `docs/STAGE_V0_14_CLOSEOUT.md`
- `docs/STAGE_V0_15_CLOSEOUT.md`
- `docs/STAGE_V0_16_CLOSEOUT.md`
- `docs/STAGE_V0_17_CLOSEOUT.md`
- `docs/STAGE_V0_18_CLOSEOUT.md`
- `docs/STAGE_V0_19_CLOSEOUT.md`
- `docs/STAGE_V0_20_CLOSEOUT.md`
- `.github/workflows/check.yml`

## Pre-Publish Checklist

- Review public repository name and description.
- Review all Chinese product documents for content that should remain public.
- Confirm no customer data, private endpoints, credentials, tokens, or internal-only notes are present.
- Run `docs/PRIVACY_RELEASE_REVIEW.md` and resolve all true positives.
- Confirm `data/geo-pulse-state.json` is not committed.
- Confirm `.DS_Store` and local environment files are not committed.
- Run `npm run check`.
- Confirm the GitHub `check` workflow passes after pushing.
- Review [v0.9 Stage Closeout](STAGE_V0_9_CLOSEOUT.md), [v0.9.1 Stage Closeout](STAGE_V0_9_1_CLOSEOUT.md), [v0.10 Stage Closeout](STAGE_V0_10_CLOSEOUT.md), [v0.11 Stage Closeout](STAGE_V0_11_CLOSEOUT.md), [v0.12 Stage Closeout](STAGE_V0_12_CLOSEOUT.md), [v0.13 Stage Closeout](STAGE_V0_13_CLOSEOUT.md), [v0.14 Stage Closeout](STAGE_V0_14_CLOSEOUT.md), [v0.15 Stage Closeout](STAGE_V0_15_CLOSEOUT.md), [v0.16 Stage Closeout](STAGE_V0_16_CLOSEOUT.md), [v0.17 Stage Closeout](STAGE_V0_17_CLOSEOUT.md), [v0.18 Stage Closeout](STAGE_V0_18_CLOSEOUT.md), [v0.19 Stage Closeout](STAGE_V0_19_CLOSEOUT.md), [v0.20 Stage Closeout](STAGE_V0_20_CLOSEOUT.md), and [v0.21 Stage Closeout](STAGE_V0_21_CLOSEOUT.md) for the team-access boundary, CI gate, site GEO audit boundary, crawl evidence boundary, evidence-backed scoring boundary, AI visibility measurement boundary, evidence-asset local review boundary, publishing handoff boundary, content-generation boundary, manual measured-evidence import boundary, measured evidence operations boundary, production integration foundation boundary, delivery hardening boundary, OpenAI-compatible LLM generation boundary, and remaining SaaS/live-monitoring/publishing gaps.
- Create a clean Git history from the intended public root.

## Suggested GitHub Setup

From the repository root:

```bash
git init
git add .
git commit -m "chore: prepare GPLv3 open source release"
git branch -M main
```

Then create an empty GitHub repository. GitHub will show the exact `git remote add origin ...` command for that repository. Run that exact command, then push:

```bash
git push -u origin main
```

Do not publish until the owner has reviewed the pre-publish checklist.

## Recommended GitHub Settings

- Enable private vulnerability reporting.
- Protect the `main` branch after the first push.
- Require the GitHub Actions `check` workflow before merging.
- Add repository topics: `geo`, `seo`, `agent`, `content-automation`, `nodejs`, `ai-search`.
- Use GitHub license detection to confirm GPLv3.

## Privacy Incident Handling

If local paths, credentials, customer data, or internal notes were pushed before release review, follow `docs/PRIVACY_RELEASE_REVIEW.md`.

For a new repository with no external contributors, prefer replacing the public branch with a privacy-reviewed single-commit history using `git push --force-with-lease origin main`. For established repositories, coordinate the rewrite with maintainers and contributors before changing public history.

## Release Notes Draft

GEO Pulse China Agent v0.21.0 is a zero-dependency GEO/SEO operations workspace for agent content workflows. It includes built-in login, owner/admin/editor/viewer roles, source ingestion contracts, automation providers, connector governance, connector tests, connector diagnostics, local backup import/restore, launch preflight, production readiness checks, delivery readiness report, sanitized delivery bundle export, publishing operations, visibility metrics, campaign loops, audit logs, International GEO site audit, guarded live crawl evidence, evidence-backed scoring, generated GEO assets, AI visibility measurement foundation, manual measured visibility evidence operations, evidence-driven local asset opportunities, local-rule article generation, configurable OpenAI-compatible LLM generation, multi-platform rewrite generation, review queue state, local high-authority publishing platform list, review-only publishing packages, manual tracking records, visibility provider dry-run configs, publishing connector dry-run configs, international GEO planning, exportable artifacts, production guardrails, local verification, and minimal GitHub CI.

The current snapshot is suitable for controlled one-organization deployment behind an external access layer. It is not a complete SaaS platform, real-time AI search monitoring platform, automatic publishing system, or indexing/recommendation verification tool. v0.13 visibility runs default to `unavailable` snapshots and do not query real ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, or AI visibility providers. v0.17/v0.18 manual evidence operations can create `measured` snapshots from human-entered observations with `manual_import` provenance and `measured_import` runs; those snapshots are only as accurate as operator-entered evidence and do not support automated monitoring claims. v0.19 visibility provider and publishing connector configs do not call live AI/search/SERP/indexing/provider/CMS/social/community APIs, do not publish externally, and do not return raw credentials. v0.21 content generation may call only the operator-configured OpenAI-compatible endpoint for reviewable International GEO article drafts and platform rewrites. v0.21 delivery bundles are sanitized handoff reports, not runtime backups, and must not export raw secrets, sessions, password hashes, backup snapshots, full local state, raw audit logs, raw connector configs, `api_key` fields, prompts, article bodies, or rewrite bodies. Durable database storage, OAuth/SSO, MFA, real third-party visibility integrations, live publishing/indexing connectors, CSV/file-upload imports, automated provider imports, monitoring, and multi-tenant operations remain future work.
