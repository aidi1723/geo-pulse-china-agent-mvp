# Phase 2 Roadmap

## Purpose

Phase 2 turns the current v0.15 evidence-scored GEO audit, visibility foundation, local evidence-asset review workflow, and publishing handoff workflow into a broader measured and integration-ready GEO operating system.

The current product can prepare audits and assets from local inputs, attach guarded public-site crawl evidence, explain a deterministic 100-point scoring breakdown, store prompt sets, provider readiness, visibility runs, and prompt snapshots with explicit data-status labels, generate evidence-driven local asset opportunities with review state, generate review-only publishing packages from approved evidence assets, and track publication/indexing/AI mention/citation/recommendation fields manually. Phase 2 should next add measured AI visibility data from approved providers, controlled external distribution connectors, automation with explicit approval gates, and stronger production foundations before the project claims live engine inclusion, indexing, citation, recommendation, or publication outcomes.

## Phase 2 Direction

Build in this order:

1. AI visibility monitoring through approved data sources.
2. External distribution connectors with manual guardrails.
3. Measured indexing, citation, recommendation, and publication evidence through approved connectors.
4. Production hardening for hosted team use.

## Track 1: Live Site Crawl And Evidence Collection

Status: v0.11 baseline complete.

Goal: make site GEO audits depend on real public website evidence instead of local input only.

Scope:

- Fetch the submitted homepage.
- Fetch `robots.txt`.
- Fetch `sitemap.xml`.
- Fetch `/llms.txt`.
- Extract page title, meta description, canonical, H1, visible text summary, bot mentions, sitemap URLs, and JSON-LD types.
- Store crawl status, HTTP status, content type, fetch timestamp, and error reason.

Acceptance:

- A user can enter a real URL and receive a crawl evidence snapshot.
- Failed fetches show clear non-blocking errors.
- Audit checks reference evidence snippets instead of generic recommendations.
- The system preserves the local rule-first fallback when crawling fails or is unavailable.

## Track 2: Evidence-Backed GEO Audit Scoring

Status: v0.12 baseline complete.

Goal: upgrade the audit from rule recommendations to check-level proof.

Scope:

- Validate whether `robots.txt` allows intended search and AI crawlers.
- Count sitemap URLs and detect missing or invalid sitemap responses.
- Detect whether `/llms.txt` exists and whether it contains concise product, audience, and core-page summaries.
- Parse JSON-LD and identify Organization, Product, SoftwareApplication, FAQPage, Article, and BreadcrumbList coverage.
- Check direct-answer placement from visible page text.
- Estimate fact density from tables, numbers, specs, source links, and FAQ content.
- Attach evidence to every audit check.

Acceptance:

- Each audit check has status, evidence, recommendation, scoring fields, confidence, priority, deduction reasons, and next actions.
- Audit scoring explains why points were gained or lost through `score_breakdown`.
- UI includes a compact `评分拆解` panel and scored check table.

Remaining future depth:

- Validate full robots allow/disallow semantics instead of only crawler mentions.
- Expand fact-density extraction beyond homepage excerpts.
- Add recursive sitemap page evidence and browser rendering only after crawler scope is explicitly approved.

## Track 3: AI Engine Visibility Monitoring

Status: v0.13 foundation complete. Future provider integrations are still required for measured data.

Goal: measure brand inclusion, citations, and recommendation presence using controlled providers or approved APIs.

Scope:

- Track prompt sets by market, language, buyer intent, product or brand context, and supported engines.
- Store prompt snapshots for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot/Bing, with default local runs marked `unavailable`.
- Store measured snapshots only when a compliant data source is configured and approved provider evidence is attached.
- Record brand mention, citation URL, recommendation rank, competitor mentions, and source timestamp.
- Separate measured data from simulated or seed data in the UI.
- Add connector diagnostics for each visibility data provider.

Acceptance:

- The UI clearly labels measured, simulated, and unavailable engine data.
- No page claims real engine inclusion without a stored measured snapshot.
- Failed provider calls are visible in diagnostics and do not corrupt previous snapshots.

## Track 4: Content And Asset Production Upgrade

Status: v0.15 baseline complete for local review assets, publishing package handoff, and manual tracking. Measured providers, connector automation, and publication connectors remain future work.

Goal: generate better GEO content from crawl evidence, score deductions, and prompt visibility gaps.

Scope:

- Generate `llms.txt` from crawled site facts and workspace product context.
- Generate JSON-LD from detected entity gaps.
- Generate FAQ blocks from prompt gaps and visible product facts.
- Generate comparison, alternatives, definition, product-spec, and buyer-guide briefs.
- Add content quality checks for direct answer, citation readiness, fact density, schema alignment, and E-E-A-T.

Acceptance:

- Generated assets cite which evidence they used.
- Operators can review, copy, and regenerate each asset.
- Existing v0.10 asset types remain backward compatible.

Boundary:

- v0.14 adds evidence-driven International GEO asset opportunities, queue items, generated local previews, and approve/reject review state. The workflow creates reviewable local assets only; it does not publish externally, generate full long-form articles, or call live AI search engines for inclusion/ranking measurement.
- v0.15 adds local high-authority publishing platform rows, authority signals, AI recommendation-probability notes, deterministic publishing packages from approved evidence assets, review-only package queue state, and manual/local tracking records. The workflow is local planning/handoff only; it does not publish externally, store platform credentials, generate full articles, call live AI/search/SERP/indexing services, or verify real inclusion/recommendation.

## Track 5: External Distribution Connectors

Goal: move from manual distribution briefs to controlled external publishing or task creation.

Scope:

- Add connectors for owned website/CMS, docs, Medium, LinkedIn, YouTube transcript workflows, directories, and approved community channels.
- Keep Reddit, Quora, Wikipedia, and forums as guarded manual workflows unless explicit compliant publishing APIs and policies are configured.
- Add per-channel readiness checks.
- Add approval gates before any external publish action.
- Store external publish evidence, URL, status, and rollback notes.

Acceptance:

- No third-party publishing happens without connector permissions and human approval.
- Distribution tasks distinguish owned channels, partner channels, community channels, and reference-only channels.
- Failed publish attempts produce actionable diagnostics.

## Track 6: Multi-User Production Hardening

Goal: make the current single-organization multi-user model safer for sustained hosted use.

Scope:

- Database-backed persistence and migrations.
- Database-grade backup and restore.
- Durable secret management outside local JSON.
- OAuth/SSO option if required by deployment.
- MFA option for owner/admin accounts.
- Audit log retention and export policy.
- Production logging, metrics, alerting, and incident runbook.

Acceptance:

- Local JSON is no longer the only persistence option.
- Secrets are never stored or exported in raw form.
- Owner/admin security controls are documented and test-covered.

## Track 7: Multi-Tenant SaaS Readiness

Goal: define the path from one-organization deployment to SaaS, without mixing tenant data.

Scope:

- Tenant/workspace isolation.
- Per-tenant users, roles, audit logs, connector configs, crawl evidence, and visibility snapshots.
- Billing and usage metering model.
- Tenant-scoped API keys.
- Data retention and deletion controls.

Acceptance:

- Every persisted record has a tenant/workspace boundary.
- Cross-tenant reads and writes are covered by regression tests.
- SaaS mode is explicitly separate from one-organization deployment mode.

## Suggested Version Slices

- `v0.11`: live site crawl and evidence collection. Complete baseline.
- `v0.12`: deeper evidence-backed GEO scoring. Complete baseline.
- `v0.13`: AI visibility measurement foundation. Complete baseline; measured provider integrations remain future work.
- `v0.14`: evidence-driven local content and asset production upgrade. Complete baseline; external publishing and full article generation remain future work.
- `v0.15`: local high-authority publishing platform list, review-only publishing packages, and manual tracking. Complete baseline; measured providers, connectors, and automation remain future work.
- `v0.16`: measured visibility/tracking providers or controlled connector automation with explicit evidence and approval gates.
- `v0.17`: database persistence, secrets, monitoring, and production hardening.
- `v0.18+`: multi-tenant SaaS readiness if the product direction requires it.

## Phase 2 Boundaries

Do not claim real-time AI engine inclusion, recommendation ranking, or automatic distribution until the relevant connector is implemented, configured, and storing measured evidence.

Phase 2 should keep five evidence and data-status labels visible in product and docs:

- `Rule-first`: generated from local rules and user input.
- `Crawl-evidenced`: verified from the target website.
- `Measured`: captured from an approved external visibility or publishing data source.
- `Simulated`: demo or seed visibility data that must not be presented as real engine output.
- `Unavailable`: no compliant provider data is available for that prompt/provider pair.
