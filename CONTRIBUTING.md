# Contributing

Thank you for considering a contribution to GEO Pulse China Agent MVP.

## Scope

This repository is a zero-dependency, mock-first MVP. Keep contributions aligned with that constraint unless a maintainer explicitly approves a larger architectural change.

Good first contribution areas:

- Documentation fixes and examples.
- UI consistency fixes that preserve the existing dark admin style.
- Regression tests in `verify-mvp.mjs`.
- Mock-first improvements to providers, connectors, source adapters, audit logs, or publishing flows.

Out of scope by default:

- Real third-party credentials committed to the repo.
- Large framework migrations.
- Production deployment assumptions without documentation.
- Hidden network calls, telemetry, or background jobs.

## Development Flow

1. Read `README.md`, `docs/DEVELOPMENT.md`, and `docs/MAINTENANCE.md`.
2. For architecture or API changes, also read `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, and `docs/EXTENDING.md`.
3. Run `npm run check` before changing behavior so you know the baseline.
4. Add or update tests in `verify-mvp.mjs` for behavior changes.
5. Keep edits small and focused.
6. Run `npm run check` again before submitting.

## Pull Request Checklist

- The change has a clear user or maintainer benefit.
- No secrets, tokens, local state files, or private customer data are included.
- `npm run check` passes.
- Public docs are updated if behavior, commands, APIs, or release steps changed.
- GPLv3 licensing remains intact.

## License

By contributing, you agree that your contribution is licensed under the GNU General Public License version 3 as distributed in `LICENSE`.
