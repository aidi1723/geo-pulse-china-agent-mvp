# Open Source Release Checklist

## License Decision

The repository is prepared for GNU General Public License version 3.

- SPDX package value: `GPL-3.0-only`
- License file: `LICENSE`
- Contributor agreement: contributions are accepted under GPLv3 through `CONTRIBUTING.md`

This is a project-owner compliance note, not legal advice.

## Current Readiness

Ready for GitHub publication as a v0.8 single-user launch-ready workspace after owner review.

Verified release gate:

```bash
npm run check
```

Expected output:

```text
verify-mvp: OK
```

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

## Pre-Publish Checklist

- Review public repository name and description.
- Review all Chinese product documents for content that should remain public.
- Confirm no customer data, private endpoints, credentials, tokens, or internal-only notes are present.
- Run `docs/PRIVACY_RELEASE_REVIEW.md` and resolve all true positives.
- Confirm `data/geo-pulse-state.json` is not committed.
- Confirm `.DS_Store` and local environment files are not committed.
- Run `npm run check`.
- Review [v0.8 Stage Closeout](STAGE_V0_8_CLOSEOUT.md) for single-user boundary and remaining SaaS gaps.
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
- Require `npm run check` or equivalent CI before merging.
- Add repository topics: `geo`, `seo`, `agent`, `content-automation`, `nodejs`, `ai-search`.
- Use GitHub license detection to confirm GPLv3.

## Privacy Incident Handling

If local paths, credentials, customer data, or internal notes were pushed before release review, follow `docs/PRIVACY_RELEASE_REVIEW.md`.

For a new repository with no external contributors, prefer replacing the public branch with a privacy-reviewed single-commit history using `git push --force-with-lease origin main`. For established repositories, coordinate the rewrite with maintainers and contributors before changing public history.

## Release Notes Draft

GEO Pulse China Agent v0.8 is a zero-dependency GEO/SEO operations workspace for agent content workflows. It includes source ingestion contracts, automation providers, connector governance, connector tests, connector diagnostics, local backup import/restore, launch preflight, publishing operations, visibility metrics, campaign loops, audit logs, international GEO planning, exportable artifacts, production guardrails, and local verification.

The current snapshot is suitable for controlled single-tenant deployment behind an external access layer. It is not a complete SaaS platform without built-in login, RBAC, durable database storage, real third-party integrations, monitoring, and multi-tenant operations.
