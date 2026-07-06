# Single-User Complete v0.3 Design

## Goal

Move GEO Pulse from a deployable v0.2 workspace to a v0.3 single-user product where every core workflow can be completed locally or in a controlled single-tenant deployment.

This phase follows Scheme A: local-first complete workflow. It does not require real third-party accounts, multi-tenant SaaS infrastructure, or paid billing integration.

## Product Boundary

Supported in v0.3:

- One user, one workspace, one locally persisted data file.
- Domestic GEO and International GEO workflows.
- Website/product/market input captured in the workspace.
- Keyword/question generation, topic generation, article generation, article editing, review, publishing task creation, approval, run, retry, and export.
- International GEO audit generation using local rules.
- AI engine visibility planning for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, Microsoft Copilot, You.com, Phind, Brave Search AI, Reddit, Quora, and vertical communities.
- Exportable outputs for keywords, articles, publishing tasks, analytics, `llms.txt`, and JSON-LD recommendations.
- Local provider and connector simulation with clear labels that the default mode is local execution.

Deferred after v0.3:

- Multi-user login and RBAC.
- Multi-tenant workspaces.
- Real billing payment.
- Real CMS/social/email account publishing.
- Real AI search engine scraping APIs.
- Production database and migrations.

## Completion Definition

The UI should no longer contain dead-end primary workflow buttons. A button may be disabled only when the current state makes the action invalid, and the reason must be state-specific. It should not be disabled because the feature is "coming soon".

The following flows must work end to end:

1. User enters a website, product, target market, and target audience.
2. User generates keyword questions from that input.
3. User generates topics from selected questions.
4. User creates or edits topics manually.
5. User generates an outline and article draft.
6. User creates or edits an article manually.
7. User saves, submits, reviews, approves, and publishes an article through a task.
8. User exports keyword, content, distribution, analytics, and international GEO artifacts.
9. User runs an International GEO readiness audit and receives local recommendations.
10. User generates `llms.txt` and JSON-LD recommendation text from local data.
11. User can change plan state locally in billing without payment.
12. User can perform a single-user logout action that clears local UI state without pretending to manage accounts.

## UI Design

Keep the existing dense dark admin style from `DESIGN.md`.

- Use existing toolbar, panel, drawer, table, chip, status pill, and action-row patterns.
- Do not add landing-page sections or decorative visuals.
- Prefer compact forms inside panels and drawers.
- Export actions should be explicit buttons and should download local files when served through the browser.
- International GEO should become an editable workspace, not a read-only presentation page.

## Data Model

Add local-first models where needed:

- `workspace_input`: website URL, product name, industry, target markets, audience, language, competitors, differentiators.
- `export_jobs`: export id, artifact type, file name, generated_at, summary, content.
- `international_geo_state`: audit input, generated score, engine visibility rows, content opportunities, llms text, JSON-LD recommendation.
- `billing_plan_state`: selected plan, billing cycle, seats fixed at one, upgrade history.

Keep these models in local JSON persistence through the existing `mock-data.mjs` state system.

## API Design

Add local mutation/read endpoints:

- `GET /api/v1/workspace-input`
- `PUT /api/v1/workspace-input`
- `POST /api/v1/topic-ideas`
- `PUT /api/v1/topic-ideas/:id`
- `POST /api/v1/articles`
- `POST /api/v1/topic-ideas/:id/outline`
- `POST /api/v1/content-templates`
- `POST /api/v1/exports`
- `GET /api/v1/exports/:id/download`
- `GET /api/v1/international-geo`
- `PUT /api/v1/international-geo/input`
- `POST /api/v1/international-geo/audit`
- `POST /api/v1/international-geo/artifacts`
- `POST /api/v1/billing/plan`
- `POST /api/v1/session/logout`

Use existing mutation authorization rules.

## Testing

Extend `verify-mvp.mjs` with assertions for:

- Creating and editing topics.
- Creating manual articles.
- Generating outlines.
- Creating templates.
- Export job creation and download.
- International GEO input save, audit, and artifact generation.
- Billing plan local upgrade.
- Logout route returns a safe single-user result.
- Rendered UI no longer contains "即将开放" or "Read-only MVP".

## Stage Closeout Copy

GEO Pulse v0.3 is the single-user complete edition. It lets one operator run the complete domestic and international GEO workflow locally: from website/product input, to questions, topics, articles, review, distribution, analytics, International GEO audit, and exportable AI-search artifacts. It remains local-first and single-tenant; SaaS login, RBAC, multi-tenant isolation, real billing, and real third-party publishing integrations belong to later stages.
