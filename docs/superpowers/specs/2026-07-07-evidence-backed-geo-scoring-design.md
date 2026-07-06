# Evidence-Backed GEO Scoring v0.12 Design

## Goal

Upgrade International GEO site audits from simple pass/warning/failed scoring to evidence-backed scoring with explicit weights, deduction reasons, confidence, and remediation priority.

v0.12 should make the audit useful as an operator-facing diagnostic:

- why the score changed,
- which evidence caused the score change,
- what should be fixed first,
- which findings are rule-first versus crawl-evidenced,
- what remains unavailable because crawl evidence failed or is not present.

## Current State

v0.11 can:

- create durable International GEO site audits,
- attach `crawl_evidence`,
- rebuild evidence-aware checks,
- show homepage, `robots.txt`, `sitemap.xml`, and `/llms.txt` evidence,
- keep rule-first fallback behavior.

Current scoring is intentionally basic:

```js
100 - warning_count * 6 - failed_count * 18
```

This is easy to understand but too coarse for production-facing GEO diagnostics. It does not explain weighted impact, confidence, or remediation priority.

## Product Boundary

v0.12 adds deeper scoring from existing local input and v0.11 crawl evidence.

v0.12 does not add:

- real ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, or Copilot querying,
- real SERP collection,
- recursive crawling,
- JavaScript rendering,
- external publishing,
- database migrations,
- multi-tenant SaaS isolation.

The product must continue to distinguish:

- `rule_first`: generated from local rules and user input,
- `crawl_evidenced`: verified from the submitted public website,
- `unavailable`: unavailable because crawl failed, the resource was missing, or no usable evidence exists.

## Recommended Approach

Use a deterministic scoring rubric in `mock-data.mjs`, close to the existing site audit helpers.

Each check should keep the current public shape and add optional scoring fields:

```js
{
  id: "llms_txt",
  status: "warning",
  evidence_status: "unavailable",
  evidence_source: "llms_txt",
  evidence: "HTTP_404",
  score_weight: 12,
  score_awarded: 2,
  score_deduction: 10,
  confidence: "high",
  priority: "high",
  deduction_reasons: [
    "Missing /llms.txt on crawled site."
  ],
  next_actions: [
    "Publish /llms.txt with product, audience, canonical pages, and entity summary."
  ]
}
```

The audit should expose a score breakdown:

```js
score_breakdown: {
  total_weight: 100,
  awarded: 68,
  deducted: 32,
  confidence: "medium",
  priority_counts: {
    high: 2,
    medium: 4,
    low: 3
  },
  groups: [
    { category: "technical", weight: 20, awarded: 14, deducted: 6 },
    { category: "crawler_access", weight: 12, awarded: 6, deducted: 6 },
    { category: "ai_readability", weight: 12, awarded: 2, deducted: 10 },
    { category: "structured_data", weight: 14, awarded: 8, deducted: 6 },
    { category: "content", weight: 22, awarded: 18, deducted: 4 },
    { category: "trust", weight: 10, awarded: 6, deducted: 4 },
    { category: "entity_validation", weight: 10, awarded: 4, deducted: 6 }
  ]
}
```

## Scoring Rubric

The first v0.12 rubric should stay narrow and deterministic.

| Check | Weight | Evidence Source | Main Pass Criteria |
| --- | ---: | --- | --- |
| `url_quality` | 10 | homepage | HTTPS URL and homepage reachable |
| `robots_ai_access` | 12 | `robots_txt` | `robots.txt` reachable and mentions or permits known AI/search crawlers |
| `sitemap` | 10 | `sitemap_xml` | sitemap reachable and has at least one URL |
| `llms_txt` | 12 | `llms_txt` | `/llms.txt` reachable and contains concise text |
| `json_ld` | 14 | homepage | JSON-LD contains Organization, Product, SoftwareApplication, FAQPage, Article, or BreadcrumbList |
| `direct_answer` | 12 | homepage | homepage excerpt includes product name or primary query signal |
| `fact_density` | 10 | homepage | excerpt includes measurable facts, numbers, specs, tables, or comparison terms |
| `eeat` | 10 | homepage | excerpt includes trust signals such as about, contact, security, privacy, case, customer, support, or author |
| `third_party_validation` | 10 | homepage/local input | competitor context or external proof terms are present |

Total weight: 100.

## Confidence Rules

Confidence describes how trustworthy the scoring result is.

- `high`: crawl evidence exists for the required resource and the rule can be evaluated directly.
- `medium`: rule is based on homepage crawl evidence or partial crawl evidence.
- `low`: rule is based only on local input or fallback assumptions.

Audit-level confidence:

- `high`: 75% or more of total weight is `crawl_evidenced`.
- `medium`: 40-74% of total weight is `crawl_evidenced`.
- `low`: less than 40% of total weight is `crawl_evidenced`.

## Priority Rules

Priority is separate from status.

- `high`: large deduction on a high-impact check, or homepage unreachable, missing `/llms.txt`, blocked/absent crawler access evidence, or missing structured data.
- `medium`: evidence exists but is weak or incomplete.
- `low`: rule-first improvement, small deduction, or informational gap.

The UI should let operators scan high-priority fixes without reading every row.

## Data Flow

1. Operator creates a site audit.
2. System builds rule-first checks with scoring fields.
3. Operator runs crawl evidence.
4. System rebuilds checks with evidence-aware status and scoring fields.
5. System computes `score`, `summary`, and `score_breakdown`.
6. UI renders:
   - overall score,
   - score breakdown by category,
   - each check's weight, awarded points, confidence, priority, deduction reasons, and next actions.

## UI Design

Keep the current dense admin layout from `DESIGN.md`.

Add one compact panel near the existing audit checks:

- title: `评分拆解`,
- total score and confidence,
- category rows with weight, awarded, deducted,
- high/medium/low priority counts.

Extend the check table content, not the navigation:

- show `score_awarded / score_weight`,
- show `priority`,
- show `confidence`,
- keep evidence text terse,
- show top deduction reason and next action in existing `cell-title` / `cell-sub` patterns.

Do not add:

- hero sections,
- marketing cards,
- decorative charts,
- a new route,
- nested card layouts.

## API Shape

No new route is required.

Existing routes return richer audit objects:

- `GET /api/v1/international-geo`
- `GET /api/v1/international-geo/site-audits`
- `GET /api/v1/international-geo/site-audits/:id`
- `POST /api/v1/international-geo/site-audits`
- `POST /api/v1/international-geo/site-audits/:id/crawl`

Backward compatibility:

- Existing consumers can ignore the new fields.
- Old audit records without `score_breakdown` must hydrate safely by rebuilding or defaulting.

## Error Handling

- Crawl failures continue to create `unavailable` evidence states.
- Unsafe crawl target behavior remains unchanged.
- Missing scoring fields on legacy records should not break UI rendering.
- Unknown check ids receive a safe default weight of 0 and keep their existing status.

## Testing

Extend `verify-mvp.mjs` before implementation.

Required assertions:

- rule-first audits include `score_breakdown`,
- synthetic crawl evidence changes awarded/deducted points,
- `/llms.txt` evidence changes `llms_txt` to a high-confidence scored check,
- missing `/llms.txt` produces a deduction reason and high priority,
- JSON-LD types affect `json_ld` points,
- UI renders `评分拆解`, `score_awarded / score_weight`, `priority`, and `confidence`,
- legacy audit objects without scoring fields render safely.

## Documentation

Update:

- `README.md`,
- `CHANGELOG.md`,
- `docs/API_REFERENCE.md`,
- `docs/ARCHITECTURE.md`,
- `docs/DEVELOPMENT.md`,
- `docs/ROADMAP.md`,
- `docs/PHASE_2_ROADMAP.md`,
- add `docs/STAGE_V0_12_CLOSEOUT.md`.

## Launch Statement

v0.12 should be described as evidence-backed scoring depth for International GEO audits. It makes site audit results more actionable, but it still does not measure real AI engine inclusion or recommendation rank.
