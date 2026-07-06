# v0.12 Stage Closeout

## Stage Result

v0.12 adds evidence-backed scoring depth to International GEO site audits.

The product can now:

- score existing International GEO audit checks against a deterministic 100-point rubric,
- attach `score_weight`, `score_awarded`, `score_deduction`, `confidence`, `priority`, `deduction_reasons`, and `next_actions` to every check,
- expose audit-level `score_breakdown` with total weight, awarded points, deducted points, confidence, priority counts, and category groups,
- recalculate scores when guarded crawl evidence is applied,
- hydrate older audit objects without scoring fields,
- show `评分拆解` and scored check metadata in the International GEO workspace.

## API Surface

No new route is required.

Existing International GEO routes return richer site audit objects:

```text
GET /api/v1/international-geo
GET /api/v1/international-geo/site-audits
GET /api/v1/international-geo/site-audits/:id
POST /api/v1/international-geo/site-audits
POST /api/v1/international-geo/site-audits/:id/crawl
```

New check fields:

```text
score_weight
score_awarded
score_deduction
confidence
priority
deduction_reasons
next_actions
```

New audit field:

```text
score_breakdown
```

## UI Surface

International GEO now includes:

- compact `评分拆解` panel,
- category rows for weight, awarded points, and deducted points,
- priority counts,
- check-table columns for `得分 / 权重`, `优先级`, and `置信度`,
- top deduction reason and next action inside the existing evidence/recommendation cell.

The UI remains a dense operational admin workspace and does not add a new route, hero section, chart-heavy dashboard, or marketing layout.

## Safety Boundary

v0.12 scores only local inputs and v0.11 guarded crawl evidence. It is more actionable than the previous pass/warning/fail score, but it is still not real AI engine monitoring.

v0.12 does not:

- query ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, or SERP APIs,
- measure engine inclusion, citation rank, or recommendation rank,
- recursively crawl websites,
- render JavaScript-heavy pages,
- automatically publish to third-party platforms,
- add database migrations, durable secret storage, or SaaS multi-tenant isolation.

## Verification

Completed:

```bash
npm run check
```

The check covers:

- rule-first audits exposing score breakdown,
- scored check fields on every International GEO site audit check,
- synthetic crawl evidence changing awarded/deducted points,
- fetched `/llms.txt` creating a high-confidence scored check,
- missing `/llms.txt` creating a high-priority deduction reason,
- JSON-LD type detection awarding structured-data points,
- International GEO UI rendering for `评分拆解`, `得分 / 权重`, `优先级`, and `置信度`,
- legacy audit rendering without scoring fields,
- HTTP API site-audit responses exposing weighted score breakdown.

## Current Launch Statement

GEO Pulse v0.12.0 can be used in a controlled one-organization deployment for International GEO readiness work with guarded public-site evidence and evidence-backed scoring. Operators can input a website and product, create a site audit, fetch limited public evidence, inspect weighted findings, prioritize fixes, and generate GEO assets.

It should not be marketed as a real-time AI search monitoring platform. Real ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, SERP collection, recommendation ranking, and automatic external publishing remain future connector-backed work.

## Next Stage

Recommended v0.13 direction:

- add measured AI visibility connectors only for approved providers,
- store prompt snapshots by market, language, buyer intent, and engine,
- label engine data as measured, simulated, or unavailable,
- keep rule-first, crawl-evidenced, and measured states clearly separated.
