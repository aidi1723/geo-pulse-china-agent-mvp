# Phase 2 Roadmap

## Purpose

Phase 2 turns the current v0.18 evidence-scored GEO audit, visibility foundation, manual measured evidence operations, local evidence-asset review workflow, local content-generation workflow, and publishing handoff workflow into a broader measured and integration-ready GEO operating system.

The current product can prepare audits and assets from local inputs, attach guarded public-site crawl evidence, explain a deterministic 100-point scoring breakdown, store prompt sets, provider readiness, visibility runs, prompt snapshots with explicit data-status labels, manually import and batch-import human-verified measured visibility evidence, review imported evidence, produce approved-only visibility trends, generate evidence-driven local asset opportunities with review state, generate local-rule article drafts from approved evidence assets, generate platform rewrites from approved article drafts, generate review-only publishing packages from approved evidence assets, and track publication/indexing/AI mention/citation/recommendation fields manually. Phase 2 should next add automated measured AI visibility data from approved providers, controlled external distribution connectors, automation with explicit approval gates, and stronger production foundations before the project claims automated live engine monitoring, indexing, citation, recommendation, or publication outcomes.

## Phase 2 Direction

Build in this order:

1. AI visibility monitoring through approved data sources beyond v0.18 manual import and review.
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

Status: v0.18 manual measured-evidence operations complete. Future provider integrations are still required for automated monitoring claims.

Goal: measure brand inclusion, citations, and recommendation presence using controlled providers or approved APIs.

Scope:

- Track prompt sets by market, language, buyer intent, product or brand context, and supported engines.
- Store prompt snapshots for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot/Bing, with default local runs marked `unavailable`.
- Store measured snapshots when human-verified evidence is manually imported or batch-imported in v0.17/v0.18, or when a future compliant data source is configured and approved provider evidence is attached.
- Review manual evidence as `pending_review`, `approved`, or `rejected`; use approved evidence only for local trend rows.
- Record brand mention, citation URL, recommendation rank, competitor mentions, and source timestamp.
- Separate measured data from simulated or seed data in the UI.
- Add connector diagnostics for each future visibility data provider.

Acceptance:

- The UI clearly labels measured, simulated, and unavailable engine data.
- No page claims real engine inclusion without a stored measured snapshot.
- No page claims automated monitoring unless the snapshot came from future approved provider evidence.
- Failed provider calls are visible in diagnostics and do not corrupt previous snapshots.

## Track 4: Content And Asset Production Upgrade

Status: v0.18 baseline complete for local review assets, local-rule article drafts, platform rewrites, publishing package handoff, manual tracking, manual measured visibility evidence import, batch import, evidence review, import ledger, and approved-only trends. Automated measured providers, file-upload imports, external LLM generation providers, connector automation, and publication connectors remain future work.

Goal: generate better GEO content from crawl evidence, score deductions, and prompt visibility gaps.

Scope:

- Generate `llms.txt` from crawled site facts and workspace product context.
- Generate JSON-LD from detected entity gaps.
- Generate FAQ blocks from prompt gaps and visible product facts.
- Generate comparison, alternatives, definition, product-spec, and buyer-guide briefs.
- Generate full article drafts from approved evidence assets with provenance and human review state.
- Generate platform-specific rewrites from approved article drafts with moderation notes and canonical URL preservation.
- Add content quality checks for direct answer, citation readiness, fact density, schema alignment, and E-E-A-T.

Acceptance:

- Generated assets cite which evidence they used.
- Operators can review, copy, and regenerate each asset.
- Existing v0.10 asset types remain backward compatible.

Boundary:

- v0.14 adds evidence-driven International GEO asset opportunities, queue items, generated local previews, and approve/reject review state. The workflow creates reviewable local assets only; it does not publish externally, generate full long-form articles, or call live AI search engines for inclusion/ranking measurement.
- v0.15 adds local high-authority publishing platform rows, authority signals, AI recommendation-probability notes, deterministic publishing packages from approved evidence assets, review-only package queue state, and manual/local tracking records. The workflow is local planning/handoff only; it does not publish externally, store platform credentials, generate full articles, call live AI/search/SERP/indexing services, or verify real inclusion/recommendation.
- v0.16 adds local-rule full article drafts and platform rewrites from approved local evidence. The workflow is still local and review-first; it does not call external LLMs, publish externally, store platform credentials, call live AI/search/SERP/indexing services, or verify real inclusion/recommendation.
- v0.17 adds manual measured visibility evidence import. Imported snapshots use `manual_import` provenance and `measured_import` runs; they are human-entered evidence only and do not call live AI/search/SERP/indexing services, store provider credentials, or support automated monitoring claims.
- v0.18 adds manual measured evidence operations. Operators can batch-import JSON rows, track import ledgers, approve or reject imported snapshots, and view approved-only trend rows. The workflow remains human-entered evidence only and does not call live AI/search/SERP/indexing services, store provider credentials, or support automated monitoring claims.

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
- `v0.16`: local-rule article generation and platform rewrites. Complete baseline; measured providers, connectors, external LLM generation, and automation remain future work.
- `v0.17`: manual measured visibility evidence import. Complete baseline.
- `v0.18`: measured evidence operations with JSON batch import, import ledger, evidence review, and approved-only trends. Complete baseline; automated measured providers, file-upload imports, connectors, external LLM generation, external publishing/indexing connectors, and automation remain future work.
- `v0.19`: approved visibility data provider connector foundation, or database persistence and production hardening if deployment risk becomes the priority.
- `v0.20+`: multi-tenant SaaS readiness if the product direction requires it.

## Phase 2 Boundaries

Do not claim real-time AI engine inclusion, recommendation ranking, automated monitoring, or automatic distribution until the relevant connector is implemented, configured, and storing approved provider evidence.

Phase 2 should keep five evidence and data-status labels visible in product and docs:

- `Rule-first`: generated from local rules and user input.
- `Crawl-evidenced`: verified from the target website.
- `Measured`: captured from manually imported or batch-imported human-verified evidence in v0.17/v0.18, or from an approved external visibility or publishing data source in a future provider integration.
- `Simulated`: demo or seed visibility data that must not be presented as real engine output.
- `Unavailable`: no compliant provider data is available for that prompt/provider pair.
