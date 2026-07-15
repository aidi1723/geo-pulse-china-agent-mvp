# Documentation Index

This directory contains the maintainer-facing documentation for GEO Pulse China Agent v0.21.0.

## Start Here

- [Development Guide](DEVELOPMENT.md): local setup, test gate, environment variables, UI rules, and contribution workflow.
- [Architecture Guide](ARCHITECTURE.md): runtime structure, module boundaries, data flow, security model, and extension points.
- [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md): one-organization v0.21.0 deployment, built-in login, roles, International GEO site audit, guarded crawl evidence, evidence-backed scoring, AI visibility measurement foundation, manual measured evidence operations, evidence-driven local asset review workflow, local-rule article generation, configurable OpenAI-compatible LLM generation, platform rewrites, high-authority publishing platform list, package queue, manual tracking, visibility provider dry-run foundation, publishing connector dry-run foundation, production readiness checks, delivery readiness report, sanitized delivery bundle, environment, Docker, health checks, launch preflight, backup, import, CI gate, and rollback.
- [v0.2 Stage Closeout](STAGE_V0_2_CLOSEOUT.md): stage result, launch boundary, verification evidence, and closing copy.
- [v0.3 Stage Closeout](STAGE_V0_3_CLOSEOUT.md): single-user complete stage result, launch boundary, verification evidence, and closing copy.
- [v0.4 Stage Closeout](STAGE_V0_4_CLOSEOUT.md): connector integration-readiness stage result, launch boundary, verification evidence, and closing copy.
- [v0.5 Stage Closeout](STAGE_V0_5_CLOSEOUT.md): connector diagnostics stage result, launch boundary, verification evidence, and closing copy.
- [v0.6 Stage Closeout](STAGE_V0_6_CLOSEOUT.md): local backup/restore stage result, launch boundary, verification evidence, and closing copy.
- [v0.7 Stage Closeout](STAGE_V0_7_CLOSEOUT.md): backup import/recovery stage result, launch boundary, verification evidence, and closing copy.
- [v0.8 Stage Closeout](STAGE_V0_8_CLOSEOUT.md): launch preflight stage result, launch boundary, verification evidence, and closing copy.
- [v0.9 Stage Closeout](STAGE_V0_9_CLOSEOUT.md): multi-user access stage result, launch boundary, verification evidence, and closing copy.
- [v0.9.1 Stage Closeout](STAGE_V0_9_1_CLOSEOUT.md): minimal CI stage result, launch boundary, verification evidence, and closing copy.
- [v0.10 Stage Closeout](STAGE_V0_10_CLOSEOUT.md): site GEO audit and asset generation stage result, launch boundary, verification evidence, and closing copy.
- [v0.11 Stage Closeout](STAGE_V0_11_CLOSEOUT.md): live site crawl evidence stage result, safety boundary, verification evidence, and closing copy.
- [v0.12 Stage Closeout](STAGE_V0_12_CLOSEOUT.md): evidence-backed scoring stage result, API/UI surface, verification evidence, and closing copy.
- [v0.13 Stage Closeout](STAGE_V0_13_CLOSEOUT.md): AI visibility measurement foundation stage result, API/UI surface, data-source boundary, verification commands, and next stage.
- [v0.14 Stage Closeout](STAGE_V0_14_CLOSEOUT.md): evidence-driven local asset opportunities, queue, previews, review state, operating boundary, verification commands, and next stage.
- [v0.15 Stage Closeout](STAGE_V0_15_CLOSEOUT.md): high-authority publishing platform list, review-only package queue, manual tracking records, operating boundary, verification commands, and maintainer notes.
- [v0.16 Stage Closeout](STAGE_V0_16_CLOSEOUT.md): local-rule article generation, multi-platform rewrites, review queues, generation records, operating boundary, verification commands, and maintainer notes.
- [v0.17 Stage Closeout](STAGE_V0_17_CLOSEOUT.md): manual measured visibility evidence import, API/UI/model surface, operating boundary, verification commands, and maintainer notes.
- [v0.18 Stage Closeout](STAGE_V0_18_CLOSEOUT.md): measured evidence operations, batch import, import ledger, evidence review, approved-only trends, operating boundary, verification commands, and maintainer notes.
- [v0.19 Stage Closeout](STAGE_V0_19_CLOSEOUT.md): production integration foundation, visibility provider configs, publishing connector configs, production readiness checks, operating boundary, verification commands, and maintainer notes.
- [v0.20 Stage Closeout](STAGE_V0_20_CLOSEOUT.md): delivery readiness, sanitized delivery bundle, Settings delivery center, operating boundary, verification commands, and maintainer notes.
- [v0.21 Stage Closeout](STAGE_V0_21_CLOSEOUT.md): OpenAI-compatible LLM content generation, provider controls, fallback boundary, verification commands, and maintainer notes.
- [Project Audit And Optimization Closeout](PROJECT_AUDIT_OPTIMIZATION_CLOSEOUT_2026-07-16.md): deployment/API hardening, page-scoped loading, responsive accessibility, design alignment, SEO boundary, metrics, and verification evidence.
- [GitHub And Documentation Alignment Closeout](GITHUB_DOCUMENTATION_CLOSEOUT_2026-07-16.md): authoritative-document audit, corrected drift, GitHub publication evidence, CI result, and final handoff state.
- [API Reference](API_REFERENCE.md): current mock API groups, route behavior, mutation requirements, and response shape.
- [Extension Guide](EXTENDING.md): how to add providers, connectors, source adapters, UI pages, tests, and static preview data.
- [Maintenance Guide](MAINTENANCE.md): routine maintenance, release gate, runtime state, security defaults, and production backlog.
- [Privacy Release Review](PRIVACY_RELEASE_REVIEW.md): public-branch privacy scans, cleanup rules, and history-rewrite guidance.
- [Roadmap](ROADMAP.md): what is done, what remains local-first, and what belongs to post-v0.21 production hardening.
- [Phase 2 Roadmap](PHASE_2_ROADMAP.md): development tracks for deeper evidence scoring, measured AI visibility, external distribution, production hardening, and SaaS readiness.
- [Open Source Release Checklist](OPEN_SOURCE_RELEASE.md): publication readiness, GitHub settings, and release-note draft.
- [Minimal CI Plan](superpowers/plans/2026-07-06-minimal-ci.md): GitHub Actions quality gate plan for `npm run check`.

## Root-Level Documents

- [README](../README.md): project overview, run commands, completed capabilities, and API list.
- [DESIGN](../DESIGN.md): UI design source of truth.
- [CONTRIBUTING](../CONTRIBUTING.md): contribution workflow and PR checklist.
- [SECURITY](../SECURITY.md): vulnerability reporting and security boundaries.
- [CHANGELOG](../CHANGELOG.md): release history.
- [LICENSE](../LICENSE): GPLv3 license text.

## Product And Research References

The root-level Chinese product documents are retained as product context:

- `中国智能体GEO平台-落地计划.md`
- `中国智能体GEO平台-后台一期可开发稿.md`
- `中国智能体GEO平台-一期接口与数据表设计.md`
- `中国智能体GEO平台-核心页面低保真与交互说明.md`
- `中国智能体GEO平台-关键词引擎升级方案.md`
- `中国智能体GEO平台-监测系统与插件参考架构.md`
- `AgentCoreOS-GEO-Suite-产品拆解方案.md`
- `AgentCoreOS-GEO-网站优化与内容方案.md`

The `reports/` directory contains audit, benchmark, and security hardening notes used during MVP through v0.21 preparation. Dated stage closeouts and `docs/superpowers/` plans/specs preserve their historical scope; current operational truth lives in the root README and the maintainer guides listed above.
