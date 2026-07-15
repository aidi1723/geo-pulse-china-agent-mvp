# Project Audit And Optimization Closeout - 2026-07-16

## Outcome

The balanced optimization pass hardens the controlled one-organization deployment, prevents malformed request bodies from reaching domain actions, reduces browser data loading to active-page plans, restores narrow-screen navigation and form semantics, aligns the shared UI with `DESIGN.md`, and prevents the authenticated workspace from being indexed as public content.

Business routes, domain schemas, roles, persistence format, local-first integrations, and product workflows remain unchanged.

## Fixed Findings

| Severity | Finding | Resolution |
| --- | --- | --- |
| High | Docker Compose omitted the production owner password and could not satisfy startup validation. | Compose now requires and passes `GEO_BOOTSTRAP_OWNER_PASSWORD`. |
| High | Route-level body catches converted malformed or chunked oversized JSON into null/empty payloads. | All routes now preserve shared parser errors; regression tests prove 400/413 responses and unchanged state. |
| Medium | Default startup listened on every interface and relied on request-time rejection. | Default bind host is `127.0.0.1`; remote/container binding is explicit. |
| High | The sidebar disappeared below 1180px without replacement navigation. | A horizontally scrollable mobile module navigation exposes all eight modules. |
| High | Mobile pages overflowed the viewport and many controls had no programmatic labels. | Shared geometry contains tables/grids; semantic enhancement associates labels and dialog focus. |
| Medium | Login lacked native form submission and panels lacked dialog keyboard behavior. | Login uses form/submit semantics; panels expose dialog metadata and close on Escape. |
| Medium | Login and every mutation fetched all business domains. | Shared and page-specific request descriptors load only the active workflow. |
| Medium | UI implementation drifted from the dark dense operational `DESIGN.md`. | Shared tokens and primitives now use dark neutral surfaces, compact spacing, 4-8px radii, restrained shadows, visible focus, and reduced motion. |
| Medium | The authenticated shell was listed in the sitemap and allowed indexing. | HTML is `noindex, nofollow`; the valid sitemap excludes admin URLs. |

## Before And After Metrics

| Metric | Before | Implemented target |
| --- | ---: | ---: |
| Login/dashboard API requests | 42 API requests after login, 67 total resources | 8 data-plan requests plus session, client config, and login, maximum 11 API requests |
| Initial transfer | About 2.1 MB decoded/transferred in the audited browser session | Reduced by omitting unrelated domain responses; final browser measurement recorded in verification evidence |
| Dashboard overflow at 390px | 120px | 0px acceptance threshold |
| Settings overflow at 390px | 352px | 0px acceptance threshold |
| Unlabelled Settings brand controls | 10 of 11 | 0 acceptance threshold |
| Visible sidebar navigation at 390px | 0 | 8 mobile module controls |

## Files Changed

- Server and deployment: `server.mjs`, `docker-compose.yml`, `prototype/sitemap.xml`.
- Frontend data and interaction: `prototype/src/api.js`, `prototype/src/main.js`, `prototype/src/events.js`.
- UI semantics and design: `prototype/src/accessibility.js`, `prototype/src/render.js`, `prototype/src/components.js`, `prototype/src/utils.js`, `prototype/styles.css`.
- Verification: `verify-mvp.mjs`.
- Documentation: `README.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/MAINTENANCE.md`, this report, and the approved spec/plan.

## Verification Evidence

- Baseline and post-change regression gate: `npm run check` returned `verify-mvp: OK`.
- Google SEO static check scanned 124 files with 0 errors and 0 warnings.
- TDD regressions cover loopback defaults, Compose secrets, malformed JSON, chunked oversized bodies, page request plans, semantic login/mobile navigation, accessibility source rules, dark design tokens, responsive containment, reduced motion, noindex headers, and sitemap exclusion.
- Final real-browser measurements are appended before branch completion.

## Safe-Agent Routing Record

- Scenario bundle: `website-build-launch`.
- Route ID: `sha256:14ef39a9c6a9274d652ff58c6fd142197d390ef0c73567ff3750fab1b5fd5152`.
- Applied verification guidance: full build/regression gate, desktop and mobile screenshots, navigation trace, visible/DOM assertions, keyboard and focus checks, responsive overflow checks, console/request checks, static SEO check, secret scan, and final diff review.
- Safety boundary: method guidance only; no external publishing, deployment, account mutation, or production data action was performed.

## Residual Risks

- `mock-data.mjs`, `verify-mvp.mjs`, and the browser controller remain large files. Splitting them was intentionally excluded to avoid unrelated regression risk.
- Persistence and secrets remain local JSON/runtime configuration, not a production database or secret vault.
- Browser sessions remain in-memory and are lost on restart.
- No OAuth/SSO, MFA, multi-tenant isolation, production monitoring, or incident-response automation is added.
- The authenticated workspace is not a public acquisition site; a separate public site is required for search traffic.

## Operating Boundary

GEO Pulse remains a controlled one-organization workspace. It may call only an operator-configured OpenAI-compatible content-generation endpoint within the existing review-first workflow. It does not automatically publish, query live AI visibility/search/SERP/indexing providers, verify recommendations, manage external accounts, or provide database-backed multi-tenant SaaS controls.
