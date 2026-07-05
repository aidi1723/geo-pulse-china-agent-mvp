# Open Source Release Checklist

## License Decision

The repository is prepared for GNU General Public License version 3.

- SPDX package value: `GPL-3.0-only`
- License file: `LICENSE`
- Contributor agreement: contributions are accepted under GPLv3 through `CONTRIBUTING.md`

This is a project-owner compliance note, not legal advice.

## Current Readiness

Ready for GitHub publication as a local, mock-first MVP after owner review.

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
- Confirm `data/geo-pulse-state.json` is not committed.
- Confirm `.DS_Store` and local environment files are not committed.
- Run `npm run check`.
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
- Add repository topics: `geo`, `seo`, `agent`, `content-automation`, `nodejs`, `mvp`.
- Use GitHub license detection to confirm GPLv3.

## Release Notes Draft

GEO Pulse China Agent MVP is a zero-dependency, mock-first admin prototype for GEO/SEO content operations around agent workflows. It includes source ingestion contracts, automation providers, connector governance, publishing operations, visibility metrics, campaign loops, audit logs, and local verification.

The first public snapshot is intended for review, experimentation, and extension. It is not a production-hosted service without additional authentication, persistence, deployment, and operations work.
