# International GEO Section Design

## Goal

Add a first-version `International GEO` section to the GEO Pulse admin prototype. The section should show that the product can support global Generative Engine Optimization / AI SEO workflows, especially for independent websites, B2B export companies, SaaS products, and brand sites targeting overseas markets.

This is a read-only mock-first product slice. It should demonstrate the operational model before connecting real integrations such as GEO Optimizer, Ahrefs, Semrush, Profound, AthenaHQ, ZipTie, or live AI search APIs.

## Product Positioning

The section is an international AI search visibility workspace, not only an English keyword center.

It should help operators answer four questions:

1. Is the site AI-readable through assets such as `llms.txt`, JSON-LD Schema, robots rules, AI crawler access, direct-answer blocks, facts, tables, and E-E-A-T signals?
2. Is the brand visible and cited in ChatGPT Search, Perplexity, Google AI Overviews, Gemini, and Claude?
3. Which international keyword or prompt opportunities should become content, FAQ, comparison, product entity, or statistics-rich pages?
4. Which external entity channels need coverage, such as Reddit, Quora, Wikipedia, LinkedIn, Medium, YouTube, industry directories, or vertical forums?

## Navigation

Add a new left navigation item:

- ID: `international`
- Label: `国际 GEO`
- Description: `跨市场、跨语言、跨 AI 搜索引擎的可见度运营`

Place it near analytics because it is a visibility and operations workspace.

## Page Layout

The UI must follow the existing `DESIGN.md` rules:

- Dense dark admin interface.
- Compact panels, tables, status pills, metric blocks, and operational copy.
- No marketing hero section, decorative gradient, or large promotional card.
- Reuse existing helpers such as `surface panel`, `tableMarkup`, `statusMarkup`, `info-row`, `cell-title`, and `cell-sub` where practical.

The page should include these zones:

1. Global readiness metrics
   - AI-ready score.
   - `llms.txt` status.
   - JSON-LD coverage.
   - AI crawler access.
   - Citation opportunity count.

2. Filters
   - Market.
   - Language.
   - AI engine.
   - Content stage.

3. AI Engine Visibility
   - Engines: ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude.
   - Fields: market, brand mentions, citation count, share of voice, cited URL, competitor gap, last checked time, status.

4. International Keyword Opportunities
   - Fields: keyword or prompt, market, language, intent, recommended format, citation potential, recommended action.
   - Content concepts should include Direct Answer Upfront, statistics/table enrichment, FAQ, comparison, and product entity pages.

5. GEO Audit Checklist
   - Items: `llms.txt`, JSON-LD Schema, robots and AI crawler access, Direct Answer Upfront, statistics/table evidence, author or expert proof, FAQ structure, product or organization entity markup.
   - Each item should have a status, severity, current signal, and fix recommendation.

6. Entity and Channel Coverage
   - Channels: Reddit, Quora, Wikipedia, LinkedIn, Medium, YouTube, industry directories, vertical forums.
   - Fields: coverage status, entity consistency, evidence count, next action.

## Data Model

The first version may use static mock data in the frontend page module or seed data exposed through existing bootstrap/static route patterns. It should not require new write APIs.

Recommended data groups:

- `internationalGeo.summary`
- `internationalGeo.filters`
- `internationalGeo.engineVisibility`
- `internationalGeo.keywordOpportunities`
- `internationalGeo.auditChecklist`
- `internationalGeo.entityCoverage`

The data should explicitly include international markets such as US, EU, UK, and SEA, and languages such as `en-US`, `en-GB`, and `en`.

## Out of Scope

- Real GEO Optimizer CLI execution.
- Live ChatGPT Search, Perplexity, Google AIO, Gemini, or Claude scraping.
- Real Ahrefs, Semrush, Profound, AthenaHQ, or ZipTie integrations.
- Write flows for creating audits, publishing content, or saving credentials.
- Production multi-market settings, billing, or tenant isolation.

## Testing And Verification

Add regression coverage so `npm run check` proves the section is wired into the prototype.

Expected checks:

- Navigation contains `international`.
- The page renderer can render the international page.
- The rendered page includes international GEO concepts such as `llms.txt`, JSON-LD, ChatGPT Search, Perplexity, Google AI Overviews, Direct Answer, and Entity Coverage.
- Static preview data or page-local mock data is enough for the page to render without a server.

Manual verification:

- Start the local app and open the new section.
- Confirm the section follows the existing dense admin style.
- Confirm no unrelated routes, mutation APIs, or settings flows are changed.

## Acceptance Criteria

- `国际 GEO` appears in the sidebar.
- Selecting the page displays a complete international AI search visibility workspace.
- The page covers readiness, engine visibility, keyword opportunities, audit checklist, and external entity coverage.
- The first version is read-only and works with mock data.
- `npm run check` passes.
