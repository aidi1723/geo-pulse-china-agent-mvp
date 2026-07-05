# Changelog

## 0.1.0 - 2026-07-05

Initial open-source-ready MVP snapshot.

### Added

- Zero-dependency Node server and browser admin prototype.
- Mock API surface for dashboard, keywords, source strategies, articles, publishing, analytics, billing, settings, providers, connectors, prompt traces, and audit logs.
- Local JSON persistence with atomic file replacement.
- Automation provider registry, connector registry, connector permission matrix, and source adapter contracts.
- Structured automation run steps, visibility collection runs, campaign runs, publishing approval guard, and audit CSV export.
- Security hardening for mutation API keys, remote access guard, CORS/CSP basics, request size limits, rate limits, SSRF checks, and CSV formula neutralization.
- GPLv3 license, contribution guide, security policy, development guide, maintenance guide, and open-source release checklist.
- Maintainer documentation for architecture, API reference, extension workflow, documentation index, and roadmap.

### Verification

- `npm run check` is the release gate for the MVP.
