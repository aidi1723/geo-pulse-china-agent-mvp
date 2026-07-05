# GEO Pulse Community Project Benchmark

- Date: 2026-07-05
- Scope: community/open-source projects relevant to GEO/SEO content automation, LLM workflow orchestration, publishing operations, and observability
- Current project baseline: zero-dependency Node MVP with mock API, provider registry, local scheduler, audit events, static admin prototype, and security hardening

## Reference Projects

| Project | Why It Matters | What To Learn |
| --- | --- | --- |
| Dify | Mature open-source LLM app platform with workflows, agents, datasets, tools, and operational app concepts. | Treat AI workflows as first-class products: app-level configuration, tool/dataset binding, prompt/model settings, run visibility, and deployable endpoints. |
| Flowise | Visual low-code builder for LLM apps and agent flows. | Node/edge style workflow composition, reusable flow templates, credential management, and non-developer friendly orchestration UX. |
| n8n | Mature workflow automation platform with many integrations, triggers, execution history, retry semantics, and credentials. | Connector ecosystem, execution graph, run logs, manual vs scheduled triggers, data mapping, and durable workflow history. |
| Langfuse | Open-source LLM engineering and observability platform. | Prompt/version tracking, traces, spans, scores, datasets, evaluation workflows, cost/latency metrics, and production observability. |
| Postiz | Open-source social media scheduling and AI-assisted content publishing platform. | Publishing calendar, channel/account connection, post variants, approvals, scheduling, and distribution-focused UX. |
| Firecrawl | Open-source web crawling/scraping API for turning web pages into LLM-ready data. | Source ingestion abstraction, crawl jobs, extraction formats, rate/error handling, and source quality controls. |
| Mailtrain | Open-source email marketing automation and list management platform. | Audience segmentation, campaign templates, subscriptions, list hygiene, and email campaign lifecycle. |
| SerpBear | Open-source search engine rank tracking app. | Keyword rank tracking, SERP position history, competitor visibility, and SEO reporting loops. |

## Patterns Worth Copying

1. Workflow runs need a durable step model
   - Our scheduler and automation runs exist, but the run trace is still mostly domain-specific.
   - Dify, Flowise, and n8n all make execution steps inspectable.
   - Gap: add a normalized `workflow_steps` or `automation_run_steps` model with step status, provider, input preview, output preview, retry count, latency, error, and next action.

2. Providers should become connectors, not just model endpoints
   - Our provider registry is a strong start for keyword/topic/article generation.
   - n8n and Flowise show that long-term leverage comes from connectors: crawler, SERP, CMS, social, email, CRM, analytics, webhook.
   - Gap: define a connector interface separate from model provider config.

3. GEO/SEO work needs source ingestion as a product surface
   - Firecrawl's value is not just scraping; it normalizes messy web input for downstream AI workflows.
   - Our media source library and crawl jobs are present, but they are still mock-heavy.
   - Gap: add source adapter contracts: fetch, normalize, dedupe, quality score, extraction evidence, and crawl error taxonomy.
   - Status: first implementation slice completed. Source adapter contracts now define fetch, normalize, dedupe, score, evidence fields, quality signals, privacy boundary, and crawl error taxonomy; crawl jobs retain adapter evidence and quality summaries.

4. LLMOps needs prompt/version/evaluation primitives
   - Langfuse highlights traces, prompt versions, datasets, scores, cost, latency, and evaluation loops.
   - Our model config stores provider/model settings but not prompt lineage or quality feedback.
   - Gap: add prompt templates with versions, run traces, manual quality score, and regression datasets for generated content.

5. Publishing should be calendar/channel driven
   - Postiz makes scheduled publishing and channel accounts the center of the product.
   - Our publish task flow exists, but lacks a calendar view, post variants, asset readiness, and per-channel preview.
   - Gap: add channel calendar, post variant model, approval state, and publish readiness checklist.

6. Marketing automation needs audience loops
   - Mailtrain's list/campaign model is relevant for owned distribution.
   - Our MVP covers content and channels, but not audiences, segments, or campaign performance loops.
   - Gap: add audience segment stubs and campaign-level metrics before building deeper email/social automation.
   - Status: first implementation slice completed. The MVP now has audience segment stubs, campaign records, manual campaign runs, lifecycle steps, and send/open/click metrics in the analytics surface.

7. SEO/GEO outcomes require external measurement
   - SerpBear shows the minimum useful SEO loop: tracked keyword, rank history, competitor/domain, and report.
   - Our analytics are internal mock metrics.
   - Gap: add rank/visibility tracking stubs for target queries and citations, even before real SERP APIs are connected.

8. Security and governance cannot be an afterthought
   - Workflow platforms become risky when they execute arbitrary connectors or user-defined code.
   - Our recent hardening is useful, but connector expansion will need scoped credentials, per-connector permissions, and safer execution boundaries.
   - Gap: credential scopes, connector allowlists, per-action audit details, and admin-only dangerous operations.
   - Status: first implementation slice completed. Connector records now expose credential status, permission boundaries, allowed actions, dangerous actions, and latest permission audit; visibility collection and Mailtrain-style campaign execution now check connector permissions before writing run results.

## Priority Gap List

### P0: Make Automation Runs Inspectable

Add a reusable automation step timeline:

- `automation_run_steps`
- step type: crawl, dedupe, score, plan_topic, draft_article, review, create_publish_task, publish
- status: queued, running, succeeded, failed, skipped, waiting_approval
- timing, retry count, provider/connector id
- input/output preview with secret redaction
- error code and operator hint

Why first: it improves debugging, user trust, and future connector work without requiring real third-party integrations.

Status: first implementation slice completed in this MVP. Automation runs now expose structured `steps`, the settings automation review panel renders a compact step timeline, and static preview data includes representative step records.

### P1: Connector Interface

Define a connector registry alongside the provider registry:

- `source_connector`
- `serp_connector`
- `cms_connector`
- `social_connector`
- `email_connector`
- `analytics_connector`

Start with mock connectors, strict config validation, masked credentials, and audit events.

Status: first implementation slice completed in this MVP. A read-only connector registry now separates source, SERP, CMS, social, email, and analytics connectors from model providers. The API and settings page expose connector type, scopes, endpoint, status, and masked credential hints.

### P1: Prompt And Quality Trace

Add prompt templates and content quality scoring:

- prompt template id/version
- model/provider id
- generated content trace
- manual score and rejection reason
- regression dataset fixtures

This is the minimum Langfuse-style layer we can own locally before integrating external LLMOps.

Status: first implementation slice completed in this MVP. Prompt templates are exposed through API and settings UI, generated articles keep prompt template/version metadata, and content quality traces record article, model, provider, score, and status.

### P2: Publishing Calendar And Variants

Extend publish tasks into an operational publishing surface:

- calendar view
- per-channel post variant
- readiness checklist
- approval state
- retry/failure reason visibility

Status: implementation slices completed in this MVP. Publish tasks now expose calendar date/slot metadata, task items include per-channel post variants and readiness checks, and the distribution UI shows a publishing calendar plus item-level variant/readiness detail. Task-level approval state is now part of the publish model, with approval steps, approve/reject actions, and a start guard for approval-pending tasks.

### P2: External Visibility Metrics

Add mock-first rank and citation tracking:

- tracked query
- target URL/topic/article
- engine/source type
- rank/citation snapshot
- competitor/domain snapshot

Status: implementation slices completed in this MVP. Analytics now exposes an external visibility view with tracked query targets, search/answer-engine source type, rank and citation snapshots, and competitor domain share-of-voice snapshots. A mock-first visibility collection run can now be triggered, producing inspectable steps for query preparation, SERP fetching, snapshot writing, and competitor comparison.

## Recommended Next Implementation Slice

The MVP is now at a practical local handoff point. The remaining work is production integration rather than mock-first product shape.

Recommended closing checklist before external deployment:

- Replace mock connectors/providers with real credentials in a non-local environment.
- Add deployment config, backups, and operator runbooks.
- Add real source adapter implementations behind the current contract.
- Keep scoped connector permissions and audit export enabled before inviting non-local users.

## Source Links

- Dify: https://github.com/langgenius/dify
- Flowise: https://github.com/FlowiseAI/Flowise
- n8n: https://github.com/n8n-io/n8n
- Langfuse: https://github.com/langfuse/langfuse
- Postiz: https://github.com/gitroomhq/postiz-app
- Firecrawl: https://github.com/mendableai/firecrawl
- Mailtrain: https://github.com/Mailtrain-org/mailtrain
- SerpBear: https://github.com/towfiqi/serpbear
