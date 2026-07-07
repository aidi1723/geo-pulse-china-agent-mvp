# Stage v0.17 Closeout

## Scope Completed

- Manual measured visibility evidence import for International GEO prompt snapshots.
- API route: `POST /api/v1/international-geo/visibility/evidence/import`.
- Imported snapshot provenance: `data_status: "measured"`, `provider_id: "manual_import"`, and human-entered evidence fields.
- Import run provenance: `data_source_type: "measured_import"`.
- Provider readiness update with `permission_status: "manual_review"`.
- International GEO UI panel for `导入测量证据`.
- Documentation and version alignment for v0.17.

## Operating Boundary

v0.17 records user-supplied measured evidence only. It does not call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, external platform, or external AI visibility APIs. It does not store external provider credentials. Imported `measured` snapshots are only as accurate as the operator-entered observation.

Manual imports can support human-verified evidence review, but only future approved provider integrations with stored provider evidence can support automated monitoring claims. Batch imports, external LLM generation, external publishing/indexing connectors, durable DB, OAuth/SSO, MFA, monitoring, and multi-tenant controls remain future work.

## Verification

- `npm run check`
- `git diff --check`

## Maintainer Notes

- Keep `manual_import` visibly distinct from future automated providers.
- Keep `measured_import` runs distinct from provider API collection runs.
- Do not present imported evidence as automated monitoring or live provider coverage.
- Preserve the `measured`, `simulated`, and `unavailable` data-status boundary when adding future provider connectors.
