# Stage v0.18 Closeout

## Scope Completed

v0.18 operationalizes manual measured International GEO evidence:

- JSON batch import through `POST /api/v1/international-geo/visibility/evidence/imports`.
- Evidence review through `POST /api/v1/international-geo/visibility/evidence/:id/review`.
- Local import ledger rows with imported, pending, approved, and rejected counts.
- `pending_review`, `approved`, and `rejected` review states on manually imported measured snapshots.
- Approved-only visibility trend rows.
- International GEO UI panels for `批量导入测量证据`, `测量证据台账`, `证据复核`, and `可见度趋势`.
- Documentation and version alignment for v0.18.

The v0.17 single-row `导入测量证据` workflow remains available and now participates in the same ledger and review model.

## Operating Boundary

v0.18 records user-supplied measured evidence only. It does not call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, external platform, or external AI visibility APIs. It does not store external provider credentials. Imported `measured` snapshots are only as accurate as the operator-entered observation.

Batch import accepts JSON rows in the browser UI and API. It does not provide CSV upload, file upload, scheduled provider import, automated provider monitoring, or external publication. Rejected evidence is retained for auditability but excluded from approved-only trend rows.

Future work remains: approved external visibility providers, file-upload import workflows, database persistence, durable secret management, monitoring, external generation providers, external publishing/indexing connectors, and multi-tenant SaaS isolation.

## Verification

Before publishing v0.18, run:

```bash
npm run check
git diff --check
```

Expected local gate:

```text
verify-mvp: OK
```

## Maintainer Notes

- Preserve `manual_import` provenance when adding external providers.
- Keep manually imported evidence separate from future automated provider evidence.
- Trends must count approved evidence only.
- Do not claim automated AI engine inclusion, citation, recommendation rank, indexing, or external distribution until a compliant provider or connector stores approved measured evidence.
