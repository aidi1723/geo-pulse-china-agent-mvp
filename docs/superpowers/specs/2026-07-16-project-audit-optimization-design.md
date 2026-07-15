# Project Audit And Balanced Optimization Design

## Goal

This optimization pass should make GEO Pulse safer to deploy, faster to operate, and usable across desktop and narrow viewports while preserving the existing product scope, routes, data contracts, role model, and local-first operating boundary.

The work is a balanced hardening pass. It addresses verified defects and shared-system drift without splitting the large domain files or redesigning business workflows.

## Approved Approach

Three implementation depths were considered:

1. A conservative patch would fix only deployment, API parsing, mobile navigation, and form accessibility defects. It would leave the design-system drift and full-data refresh cost in place.
2. The approved balanced pass fixes those defects, aligns shared UI tokens and primitives with `DESIGN.md`, and replaces full-data refreshes with page-scoped loading.
3. A deep rewrite would also split `mock-data.mjs`, `server.mjs`, `verify-mvp.mjs`, and the frontend controller into new modules. That would expand regression risk beyond the verified problems and is intentionally deferred.

## Verified Baseline

The audit established the following baseline on 2026-07-16:

- `npm run check` completes with `verify-mvp: OK` when local port binding is available.
- The Google SEO static checker reports 0 errors and 0 warnings across 122 scanned files.
- The repository starts from a clean `main` at `1fac795`.
- The browser workspace loads without console errors after local owner login.
- The logged-in dashboard initially loads 67 resources, including 42 API requests, with about 2.1 MB transferred.
- `bootstrapData()` fetches all business domains, and almost every successful mutation calls it again.
- At 390px width the dashboard overflows horizontally by 120px and Settings by 352px.
- The responsive stylesheet hides the sidebar below 1180px, while the replacement mobile area contains only an environment notice. No module navigation remains visible.
- On the Settings brand view, 10 of 11 inputs, selects, and textareas have no programmatic label.
- The login password field is not inside a form, producing a browser diagnostic and preventing standard form submission semantics.
- `DESIGN.md` specifies a dark, dense, operational admin surface, but the shared stylesheet implements a light promotional layout with decorative gradients, large radii, oversized headings, and card-heavy composition.
- `docker-compose.yml` does not pass `GEO_BOOTSTRAP_OWNER_PASSWORD`, although production startup requires it.
- `server.mjs` listens on all interfaces when `GEO_HOST` is unset and relies on request-time rejection for non-loopback traffic.
- All 52 `parseBody(req)` call sites catch JSON parsing errors locally; several substitute `{}`, allowing malformed or oversized chunked bodies to reach mutation handlers as empty payloads.

## Scope

### 1. Deployment And Network Hardening

- Change the default bind host to `127.0.0.1`.
- Preserve intentional remote binding through explicit `GEO_HOST=0.0.0.0` and `GEO_ALLOW_REMOTE_ACCESS=1`.
- Pass `GEO_BOOTSTRAP_OWNER_PASSWORD` through Docker Compose as a required production value.
- Keep existing API key, production password, remote-access, rate-limit, body-size, session, CORS, CSP, and SSRF boundaries intact.
- Add verification that default startup reports and uses the loopback host and that the Compose environment contains both required production secrets.

### 2. API Body Error Semantics

- Stop swallowing `parseBody()` errors in individual routes.
- Let the existing top-level API error boundary return `400 VALIDATION_ERROR` for malformed JSON and `413 PAYLOAD_TOO_LARGE` for oversized chunked bodies.
- Ensure malformed payloads never invoke domain mutation actions.
- Keep optional empty request bodies valid for actions that currently accept them. An absent body resolves to `{}` inside `parseBody()` and does not require a route-level catch.
- Add HTTP regression coverage for malformed JSON and chunked body overflow before changing production code.

### 3. Page-Scoped Frontend Data Loading

Replace the single all-domain bootstrap with explicit shared and page loaders.

The shared loader should fetch only data required by the shell and cross-page navigation:

- current workspace,
- workspace input,
- runtime status.

Each page loader should fetch the domains needed by that page and its immediate actions:

| Page | Required data groups |
| --- | --- |
| Dashboard | dashboard summary, keyword trend, content funnel, top keywords, recent publishes, runtime status |
| Keywords | keywords, crawl jobs, media sources, source strategies, automation runs, providers, connectors, provider invocations |
| Content | topics, articles, templates, prompt templates, quality traces, channels |
| Distribution | publish tasks, publish records, channels, articles |
| Analytics | keyword, content, channel, campaign, visibility analytics, audience segments, campaigns |
| International GEO | International GEO aggregate and workspace input |
| Billing | billing summary and invoices |
| Settings | brand profile, runtime status, models, prompts, quality traces, members, users, providers, connectors, source strategies, automation runs, channels, audit events |

Data loading rules:

- Login loads shared data and the current page only.
- Navigation loads the destination page before rendering its final state.
- A mutation refreshes only the current page data unless the action explicitly changes shared runtime data.
- Existing store keys remain stable so page renderers and actions do not need new data contracts.
- Loading and error states remain visible through the current store model.
- Static preview mode uses the same page-loader contract against the existing static route adapter.
- Concurrent requests remain grouped with `Promise.all`, but unrelated page domains are not fetched.

The target is to reduce dashboard login from 42 API requests to no more than 11, including session and client configuration requests, without removing displayed information.

### 4. Responsive Navigation And Layout

- Add a compact mobile navigation control inside the existing responsive shell. It should expose all eight modules, indicate the active module, and use the current `data-nav` behavior.
- Keep the desktop sidebar and information architecture unchanged.
- Convert topbar controls into stable responsive tracks so search, the primary action, language indicator, and notification indicator cannot force horizontal page overflow.
- Keep wide operational tables horizontally scrollable inside their table containers rather than expanding the document body.
- Set appropriate `min-width: 0`, wrapping, and responsive constraints on grid children, panels, action rows, and form controls.
- Verify zero document-level horizontal overflow at 390px, 768px, 1180px, and 1440px.

### 5. Accessibility And Interaction Semantics

- Render login as a real `<form>` with a submit button and associated labels so Enter submits the credentials.
- Introduce a shared deterministic input-id helper or explicit ids so visible labels are associated with controls across the login, shared panels, Settings, and International GEO forms.
- Add accessible names to search and any icon-only interactive controls.
- Add visible `:focus-visible` treatment for buttons, links, inputs, selects, textareas, navigation items, and tabs.
- Mark active navigation and tabs with `aria-current` or `aria-selected` where appropriate.
- Make panels that behave as dialogs expose dialog semantics, an accessible name, keyboard focus entry, and Escape-to-close behavior.
- Preserve disabled, loading, empty, error, success, warning, and destructive states without relying on color alone.
- Respect `prefers-reduced-motion` for shared transitions.

The work does not introduce a new UI library. It uses semantic HTML, existing event delegation, and shared CSS.

### 6. Design-System Alignment

`DESIGN.md` remains the source of truth. The closest implementation reference is a dense admin system, adapted to the existing zero-dependency HTML/CSS/JavaScript architecture rather than adding Refine, shadcn/ui, or another framework.

Shared tokens should define:

- dark neutral page background,
- slightly raised operational surfaces,
- readable primary and muted text,
- blue action accent,
- green success, amber warning, and red danger roles,
- subtle borders rather than decorative shadows,
- 4px to 8px radii for controls and panels,
- compact 4px-based spacing rhythm,
- stable control heights and restrained 120-180ms transitions.

Shared component changes should precede page overrides:

- body and app shell,
- sidebar and mobile navigation,
- topbar and search,
- buttons and focus states,
- surfaces, panels, tables, tabs, badges, inputs, drawers, empty states, and notices,
- dashboard hero and metrics converted into compact operational summary bands.

The redesign must remove decorative radial backgrounds, promotional hero composition, glassmorphism, oversized 20px+ radii, and excessive shadow depth. It must preserve all content, actions, routes, and data relationships.

### 7. SEO And Indexing Boundary

This repository is an authenticated operations workspace, not a public marketing site. Existing `robots.txt`, `sitemap.xml`, and `llms.txt` routes are retained because they are part of the documented product contract.

The optimization should:

- keep the current static SEO check passing,
- add `X-Robots-Tag: noindex, nofollow` to HTML shell responses so the login/admin UI is not treated as public search content,
- keep the `sitemap.xml` route valid but exclude the noindex admin shell from its URL entries,
- keep `robots.txt`, `sitemap.xml`, `llms.txt`, and health responses directly available according to the current remote-access boundary,
- document that public product acquisition content should be hosted separately if search traffic is desired.

No marketing landing page or new public route is added.

## Error Handling

- API parse failures return structured JSON errors from the shared server boundary.
- Page loader failures keep the last successfully loaded store values, expose the current error state, and do not falsely mark the page as loaded.
- A failed destination-page load leaves navigation recoverable; the user can retry or choose another module.
- Static preview failures continue to surface the original API error when no static route exists.
- Browser interactions must not silently swallow login, load, or mutation errors.

## Testing Strategy

All behavioral changes follow red-green-refactor in `verify-mvp.mjs`.

Regression coverage should prove:

- Docker Compose passes both required production secrets.
- Default host is loopback and explicit remote host behavior remains available.
- Malformed JSON returns 400 and does not mutate state.
- Chunked oversized JSON returns 413 and does not mutate state.
- The frontend exposes shared and page-scoped loader definitions.
- Dashboard loading does not request unrelated Settings, Analytics, International GEO, or Billing endpoints.
- Mutations refresh only the active page data.
- Login renders a form with associated labels and submit semantics.
- Mobile navigation renders all modules and uses existing navigation actions.
- All currently rendered form controls have an associated label or explicit accessible name.
- shared CSS includes focus-visible, reduced-motion, narrow-layout, table-overflow, and design-token rules.
- HTML responses include the intended indexing header while SEO static routes remain available.

Final verification should include:

- `npm run check`,
- Google SEO static checker,
- secret-pattern and repository cleanliness scans,
- real-browser login and navigation,
- desktop screenshots at 1440x900,
- narrow screenshots at 390x844,
- DOM checks for horizontal overflow and form labels,
- keyboard checks for login submit, navigation, focus visibility, panel close, and Escape behavior,
- console and failed-request checks.

## Documentation And Closeout

Update the smallest authoritative documentation set affected by the changes:

- `README.md` for loopback defaults and the optimized operational UI,
- `docs/ARCHITECTURE.md` for page-scoped frontend loading,
- `docs/DEVELOPMENT.md` for loader and accessibility rules,
- `docs/PRODUCTION_DEPLOYMENT.md` for the corrected Compose environment,
- `docs/MAINTENANCE.md` for the audit verification record,
- `CHANGELOG.md` for user-visible fixes,
- a new dated closeout report under `docs/`.

The closeout report should lead with outcomes, list modified files and verification evidence, compare before/after browser metrics, record the Safe-Agent router scenario and selected verification guidance, and state unresolved risks.

## Out Of Scope

- Splitting the large server, data, verification, or controller files.
- Adding npm runtime dependencies or a frontend framework.
- Changing business routes, domain schemas, permissions, or product workflows.
- Adding live AI visibility, SERP, indexing, publishing, CMS, social, or community connectors.
- Database migration, multi-tenant isolation, OAuth/SSO, MFA, billing integration, or external secret management.
- A public marketing or acquisition site.
- Automatic external deployment, publishing, account changes, or production data mutation.

## Acceptance Criteria

The pass is complete when:

- deployment configuration starts with all required production environment values,
- malformed and oversized API bodies fail at the shared boundary without domain mutation,
- default local startup binds to loopback,
- all modules are reachable at narrow widths,
- 390px pages have no document-level horizontal overflow,
- all currently rendered form controls have programmatic labels or explicit accessible names, and forms support keyboard-operable submission,
- the shared UI visibly matches the dark, compact operational rules in `DESIGN.md`,
- dashboard login uses no more than 11 API requests and mutations no longer trigger an all-domain reload,
- existing behavior and route-state checks remain green,
- SEO, security, browser, responsive, and accessibility verification pass,
- the closeout report records evidence and remaining production boundaries.
