# Stage v0.19 Closeout

## Scope Completed

v0.19 adds a production integration foundation without changing the local-first operating boundary:

- Visibility provider config registry for ChatGPT Search, Perplexity, Google AI Overviews, Gemini, Claude, and Copilot/Bing.
- Visibility provider save, dry-run test, and diagnose-all routes:
  - `GET /api/v1/international-geo/visibility/providers`
  - `PUT /api/v1/international-geo/visibility/providers/:id`
  - `POST /api/v1/international-geo/visibility/providers/:id/test`
  - `POST /api/v1/international-geo/visibility/providers/diagnose`
- Publishing connector config registry for owned site, docs, Medium, LinkedIn, YouTube, GitHub, Reddit, Quora, and directory/review workflows.
- Publishing connector save, dry-run test, and diagnose-all routes:
  - `GET /api/v1/international-geo/publishing/connectors`
  - `PUT /api/v1/international-geo/publishing/connectors/:id`
  - `POST /api/v1/international-geo/publishing/connectors/:id/test`
  - `POST /api/v1/international-geo/publishing/connectors/diagnose`
- Production readiness routes:
  - `GET /api/v1/system/production-readiness`
  - `POST /api/v1/system/production-readiness/check`
- Settings UI panels for `生产运行就绪`, `密钥与连接边界`, and `交付检查清单`.
- International GEO UI panels for `可见度 Provider 配置`, `Provider 诊断`, `Provider 运行边界`, `发布连接器配置`, `发布连接器诊断`, and `发布运行边界`.
- Documentation and version alignment for v0.19.

## Operating Boundary

v0.19 is dry-run only. Visibility provider tests and publishing connector tests return `external_call_performed: false`; publishing connector checks include `external_publish_blocked`.

The system does not call live ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews, Copilot, Bing, SERP, indexing, AI visibility provider, CMS, social, community, docs, video, directory, or review-site APIs. It does not automatically publish externally. Raw credentials are never returned by model, HTTP, production readiness, or UI responses.

Manual measured evidence from v0.17/v0.18 remains separate from future automated provider evidence. v0.19 provider config rows alone do not create `measured` snapshots and do not support automated monitoring claims.

Future work remains: approved live provider adapters, approved publishing/indexing connectors, external LLM generation providers, durable secret storage, database persistence, monitoring/alerting, OAuth/SSO, MFA, and multi-tenant SaaS isolation.

## Verification

Before publishing v0.19, run:

```bash
npm run check
git diff --check
```

Expected local gate:

```text
verify-mvp: OK
```

## Maintainer Notes

- Preserve dry-run behavior until a specific provider or publishing connector is approved and implemented.
- Keep raw credentials masked in every read model, HTTP response, production readiness response, and UI placeholder.
- Do not convert `unavailable` visibility runs to `measured` without imported human evidence or future approved provider evidence.
- Do not claim automated AI engine inclusion, citation, recommendation rank, indexing, external publishing, or external distribution from v0.19 config rows.
