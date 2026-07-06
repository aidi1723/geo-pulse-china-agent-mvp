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

The unified workflow is:

1. Input a URL, product, target market, competitors, and target AI engines.
2. Audit crawl/index readiness for GPT, Gemini / Google AI Overviews, Claude, Perplexity, and Copilot / Bing.
3. Generate prompt monitoring sets and detect whether the brand is mentioned, cited, or recommended.
4. Generate content tasks mapped to the AI engine, target prompt, page type, and distribution channel.
5. Track distribution and entity coverage across owned pages and third-party platforms.

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

4. AI Engine Inclusion and Recommendation Matrix
   - Engines: GPT / ChatGPT Search, Gemini / Google AI Overviews, Claude, Perplexity, Copilot / Bing.
   - Fields: crawler or bot, crawler access, index source, inclusion signal, recommendation signal, optimization action.
   - Bot examples should include `OAI-SearchBot`, `Googlebot`, `Claude-SearchBot`, `PerplexityBot`, and `Bingbot`.

5. Prompt Recommendation Monitoring
   - Fields: prompt, engine, market, brand mentioned, cited URL, recommended rank, competitors, next action.

6. International Keyword Opportunities
   - Fields: keyword or prompt, market, language, intent, recommended format, citation potential, recommended action.
   - Content concepts should include Direct Answer Upfront, statistics/table enrichment, FAQ, comparison, and product entity pages.

7. Content Generation Tasks
   - Fields: page type, working title, target prompt, target engine, distribution channel, reason, review status.
   - Task types should cover definition pages, comparison pages, alternative pages, FAQ, product parameter pages, scenario pages, and case studies.

8. GEO Audit Checklist
   - Items: `llms.txt`, JSON-LD Schema, robots and AI crawler access, Direct Answer Upfront, statistics/table evidence, author or expert proof, FAQ structure, product or organization entity markup.
   - Each item should have a status, severity, current signal, and fix recommendation.

9. Entity and Channel Coverage
   - Channels: Reddit, Quora, Wikipedia, LinkedIn, Medium, YouTube, industry directories, vertical forums.
   - Fields: coverage status, entity consistency, evidence count, next action.

## Data Model

The first version may use static mock data in the frontend page module or seed data exposed through existing bootstrap/static route patterns. It should not require new write APIs.

Recommended data groups:

- `internationalGeo.summary`
- `internationalGeo.filters`
- `internationalGeo.engineVisibility`
- `internationalGeo.engineInclusion`
- `internationalGeo.promptMonitoring`
- `internationalGeo.keywordOpportunities`
- `internationalGeo.contentTasks`
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
- The rendered page includes AI engine inclusion and recommendation concepts such as `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `Bingbot`, Prompt Recommendation Monitoring, Content Generation Tasks, and Distribution Execution Plan.
- Static preview data or page-local mock data is enough for the page to render without a server.

Manual verification:

- Start the local app and open the new section.
- Confirm the section follows the existing dense admin style.
- Confirm no unrelated routes, mutation APIs, or settings flows are changed.

## Acceptance Criteria

- `国际 GEO` appears in the sidebar.
- Selecting the page displays a complete international AI search visibility workspace.
- The page covers readiness, engine visibility, AI engine inclusion, prompt recommendation monitoring, keyword opportunities, content generation tasks, audit checklist, distribution execution, and external entity coverage.
- The first version is read-only and works with mock data.
- `npm run check` passes.
