# Maintenance Guide

## Release Gate

Use this gate before every public update:

```bash
npm run check
```

Do not mark a release ready unless the command exits successfully.

## Routine Maintenance

Weekly or before a release:

- Review `README.md` against current commands and APIs.
- Review `docs/API_REFERENCE.md` against `server.mjs`.
- Review `docs/EXTENDING.md` when provider, connector, source adapter, API, or UI extension patterns change.
- Review `docs/ROADMAP.md` when a planned slice lands or scope changes.
- Review `CHANGELOG.md` for user-visible changes.
- Run `npm run check`.
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
- Scheduler off by default.
- Audit events enabled for sensitive actions.
- CSV export neutralizes spreadsheet formula prefixes.
- Provider endpoint SSRF guard remains active.
- Connector permission checks remain active before external collection or campaign actions.

## Privacy Release Review

Before publishing or after major documentation updates, follow [Privacy Release Review](PRIVACY_RELEASE_REVIEW.md).

Key rule: if private content was already pushed to a public branch, a normal cleanup commit is not enough because the old content remains in Git history. For an early public release, clean the tree, verify it, create a privacy-reviewed single-commit history, and update the public branch with `git push --force-with-lease origin main`.

Do this only when the repository owner accepts history rewriting. For established repositories with external contributors, coordinate first.

## Productionization Backlog

The MVP is open-source-ready as a local prototype, not as a hosted production service. Production work should include:

- Real authentication and authorization.
- Database persistence and backup policy.
- Deployment configuration.
- Monitoring and alerting.
- Operator runbooks.
- Real provider, connector, and source adapter implementations.
- Security contact ownership and incident response process.

## Dependency Policy

The project currently has no runtime npm dependencies. New dependencies should be added only when they remove substantial complexity and have a clear license, active maintenance, and small attack surface.

## Documentation Maintenance

Use [Documentation Index](README.md) as the table of contents. New maintainer-facing documents should be linked there and from the root `README.md`.
