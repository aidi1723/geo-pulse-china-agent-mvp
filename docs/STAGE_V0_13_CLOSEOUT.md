# v0.13 Stage Closeout

## Stage Result

v0.13 adds the International GEO AI visibility measurement foundation.

The product can now:

- store visibility prompt sets with a required prompt plus optional market, language, buyer intent, product name, target URL, target brand, competitors, and engine ids,
- expose provider readiness for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot / Bing,
- create visibility runs and prompt snapshots,
- label snapshot data as `measured`, `simulated`, or `unavailable`,
- show International GEO visibility panels for provider readiness, visibility summary, runs, and snapshots,
- wire the browser action for local visibility run creation.

## API Surface

New International GEO visibility routes:

```text
GET /api/v1/international-geo/visibility
GET /api/v1/international-geo/visibility/runs
GET /api/v1/international-geo/visibility/snapshots
POST /api/v1/international-geo/visibility/prompt-sets
POST /api/v1/international-geo/visibility/run
```

The routes sit beside the existing International GEO audit, crawl, scoring, and asset routes. Viewer sessions can read visibility state. Editor/admin/owner sessions, or controlled scripts with `X-GEO-API-Key`, can create prompt sets and local runs.

## UI Surface

International GEO now includes:

- visibility measurement summary for prompt-set and engine coverage,
- provider readiness status for each target AI/search surface,
- visibility run history,
- prompt snapshots with data-status labels,
- browser button wiring for starting local runs.

The UI remains an operational admin workspace. It does not add a marketing page or claim live engine monitoring.

## Data-Source Boundary

v0.13 is not real AI search monitoring.

Data-status labels mean:

- `measured`: captured from a future approved external provider with stored provider evidence.
- `simulated`: demo or seed data that must not be presented as real engine output.
- `unavailable`: no compliant provider data exists for that prompt/provider pair.

Default local visibility runs create `unavailable` snapshots only. v0.13 does not query ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, Copilot, Bing, SERP APIs, or other AI visibility providers. It does not claim real engine inclusion, citation presence, recommendation rank, competitor rank, or measured visibility without approved provider evidence.

Prompt sets, readiness rows, runs, and snapshots do not expose raw provider credentials.

## Verification

Run for local closeout:

```bash
npm run check
```

The parent release gate should also run the static SEO scan:

```bash
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

## Current Launch Statement

GEO Pulse v0.13.0 can be used in a controlled one-organization deployment for International GEO readiness work, guarded public-site evidence, evidence-backed scoring, GEO asset preparation, and AI visibility measurement planning. Operators can define prompt sets, review provider readiness, run local availability checks, and inspect unavailable/simulated/measured labels without confusing foundation state for real engine monitoring.

It should not be marketed as a real-time AI search monitoring platform. Real ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP collection, recommendation ranking, and automatic external publishing remain future connector-backed work.

## Next Stage

Recommended v0.14 direction:

- generate evidence-driven content and assets from crawl findings, score deductions, and prompt gaps,
- keep generated assets tied to the evidence or prompt gap that produced them,
- add future approved visibility providers only when measured snapshots can store provider evidence,
- preserve clear `measured`, `simulated`, and `unavailable` labels across product and docs.
