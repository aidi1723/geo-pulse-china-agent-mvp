# Minimal CI Design

## Goal

Add a minimal GitHub Actions quality gate so every push and pull request can run the existing project verification command before code is reviewed or deployed.

## Current Gap

v0.9 has a reliable local gate through `npm run check`, but GitHub does not run that gate automatically. Maintainers can forget to run checks before pushing, and pull requests have no visible baseline signal.

## In Scope

- Add one GitHub Actions workflow under `.github/workflows/check.yml`.
- Trigger the workflow on pushes and pull requests targeting `main`.
- Use Node.js 20 because the development guide requires Node.js 20 or newer.
- Run `npm run check` as the only CI command.
- Keep the workflow dependency-free and aligned with the zero-dependency project shape.
- Document the CI gate in README, development docs, docs index, roadmap, and changelog.

## Out of Scope

- Deployment automation.
- Docker image publishing.
- Matrix testing across multiple Node versions.
- Lint tooling or dependency installation beyond what the current package requires.
- Branch protection configuration, which must be set in GitHub repository settings.

## Success Criteria

- `.github/workflows/check.yml` is present and readable.
- The workflow runs `npm run check` on push and pull request events for `main`.
- Local verification still returns `verify-mvp: OK`.
- Documentation tells contributors that GitHub CI mirrors the local check gate.
