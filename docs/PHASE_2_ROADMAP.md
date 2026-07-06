# Phase 2 Roadmap

## Purpose

Phase 2 turns the current v0.10 rule-first GEO audit into an evidence-based and integration-ready GEO operating system.

The current product can prepare audits and assets from local inputs. Phase 2 should add real site evidence, measured AI visibility data, controlled external distribution, and stronger production foundations before the project claims live engine inclusion or recommendation monitoring.

## Phase 2 Direction

Build in this order:

1. Live site crawl and evidence collection.
2. Evidence-backed GEO scoring.
3. AI visibility monitoring through approved data sources.
4. External distribution connectors with manual guardrails.
5. Production hardening for hosted team use.

## Track 1: Live Site Crawl And Evidence Collection

Goal: make site GEO audits depend on real public website evidence instead of local input only.

Scope:

- Fetch the submitted homepage.
- Fetch `robots.txt`.
- Fetch `sitemap.xml`.
- Fetch `/llms.txt`.
- Extract page title, meta description, canonical, H1, headings, visible text summary, and internal links.
- Extract JSON-LD blocks from crawled pages.
- Store crawl status, HTTP status, content type, fetch timestamp, and error reason.

Acceptance:

- A user can enter a real URL and receive a crawl evidence snapshot.
- Failed fetches show clear non-blocking errors.
- Audit checks reference evidence snippets instead of generic recommendations.
- The system preserves the v0.10 local-only fallback when crawling is disabled.

## Track 2: Evidence-Backed GEO Audit Scoring

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

- Each audit check has status, evidence, recommendation, and source URL.
- Audit scoring explains why points were gained or lost.
- UI includes a compact evidence drawer or evidence table.

## Track 3: AI Engine Visibility Monitoring

Goal: measure brand inclusion, citations, and recommendation presence using controlled providers or approved APIs.

Scope:

- Track prompt sets by market, language, buyer intent, and product category.
- Store measured snapshots for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot/Bing only when a compliant data source is configured.
- Record brand mention, citation URL, recommendation rank, competitor mentions, and source timestamp.
- Separate measured data from simulated or seed data in the UI.
- Add connector diagnostics for each visibility data provider.

Acceptance:

- The UI clearly labels measured, simulated, and unavailable engine data.
- No page claims real engine inclusion without a stored measured snapshot.
- Failed provider calls are visible in diagnostics and do not corrupt previous snapshots.

## Track 4: Content And Asset Production Upgrade

Goal: generate better GEO content from real crawl evidence and measured prompt gaps.

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

- `v0.11`: live site crawl and evidence collection.
- `v0.12`: evidence-backed GEO scoring and evidence UI.
- `v0.13`: AI visibility monitoring connectors and measured prompt snapshots.
- `v0.14`: content and asset production upgrade from evidence.
- `v0.15`: external distribution connectors with approval gates.
- `v0.16`: database persistence, secrets, monitoring, and production hardening.
- `v0.17+`: multi-tenant SaaS readiness if the product direction requires it.

## Phase 2 Boundaries

Do not claim real-time AI engine inclusion, recommendation ranking, or automatic distribution until the relevant connector is implemented, configured, and storing measured evidence.

Phase 2 should keep three labels visible in product and docs:

- `Rule-first`: generated from local rules and user input.
- `Crawl-evidenced`: verified from the target website.
- `Measured`: captured from an approved external visibility or publishing data source.
