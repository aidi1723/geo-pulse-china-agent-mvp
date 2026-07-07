# GEO Pulse China Agent

License: GPL-3.0-only

Status: v0.21.0 one-organization team-access workspace with built-in login, RBAC, launch preflight, production readiness checks, delivery readiness report, sanitized delivery bundle export, International GEO site audit, guarded live crawl evidence, evidence-backed scoring, GEO asset generation, AI visibility measurement foundation, manual measured visibility evidence operations, evidence-driven local asset opportunities, local-rule article generation, configurable OpenAI-compatible LLM article generation, multi-platform rewrite generation, high-authority publishing platform list, review-only package queue, manual tracking records, visibility provider dry-run foundation, publishing connector dry-run foundation, controlled deployment docs, and minimal GitHub CI.

v0.21 can generate International GEO long-form article drafts and platform rewrites through an operator-configured OpenAI-compatible Chat Completions endpoint. The generated content is review-first; external publishing, account registration, indexing checks, AI visibility measurement, and recommendation verification remain manual or future connector work.

这个仓库现在包含两部分内容：

1. 中国智能体 GEO 平台的一期产品方案、后台设计和交互文档
2. 一个可直接运行、可单租户部署的最小全栈服务骨架

## 目录说明

- `LICENSE`
  GNU General Public License version 3
- `CONTRIBUTING.md`
  贡献流程、PR 检查和 GPLv3 贡献说明
- `SECURITY.md`
  漏洞报告方式和当前安全边界
- `CHANGELOG.md`
  开源发布变更记录
- `docs/`
  文档索引、架构、API、扩展、开发、维护、路线图和开源发布检查清单
- `prototype/`
  零依赖后台原型，可直接打开 `prototype/index.html`；静态预览模式下审计日志导出会生成内联 CSV 下载
- `server.mjs`
  零依赖 Node 服务，负责托管原型页面、返回 mock API，并默认开启本地数据持久化
- `mock-data.mjs`
  一期后台使用的示例数据、API stub 数据源和本地落盘逻辑
- `automation-providers.mjs`
  自动运营能力适配层与 provider registry，封装抓词、选题、写稿的替换点
- `data/`
  服务运行后自动生成的本地持久化数据目录
- `agentcoreos-geo-audit.mjs`
  早期的本地 GEO 审计脚本
- `reports/`
  审计输出报告
- `中国智能体GEO平台-*.md`
  产品定位、落地计划、后台可开发稿、接口与数据表、低保真交互说明

## 运行项目

直接启动本地服务：

```bash
node server.mjs
```

或者：

```bash
npm start
```

启动后访问：

- `http://localhost:3000/`

默认会把运行时变更写入 `data/geo-pulse-state.json`。如果需要自定义位置，可在启动时传入：

```bash
GEO_DATA_FILE=/custom/path/geo-pulse-state.json node server.mjs
```

持久化写入使用同目录临时文件加原子 rename 替换，避免进程中断时把已有 JSON 状态文件写成半截内容。

关键运行操作会写入内置审计日志，可在设置页运行态区域查看，也可通过 `/api/v1/audit-events` 查询，并通过 `/api/v1/audit-events/export.csv` 导出 CSV。当前覆盖运行态重置、provider 配置变更、模型配置变更、发布任务启动、scheduler tick 和失败鉴权。CSV 导出会中和 spreadsheet formula 前缀，避免审计字段被表格软件按公式执行。

自动运营调度器默认关闭。如果需要开启或调整：

```bash
GEO_ENABLE_AUTOMATION_SCHEDULER=1 \
GEO_AUTOMATION_TICK_MS=15000 \
GEO_AUTOMATION_MAX_RUNS_PER_TICK=2 \
GEO_DEFAULT_INDUSTRY_TOPIC=中国智能体 \
node server.mjs
```

如果只想以手动模式演示，可保持默认配置，或显式关闭调度器：

```bash
GEO_ENABLE_AUTOMATION_SCHEDULER=0 node server.mjs
```

默认只允许本机访问服务；如需在局域网或容器入口暴露，需要显式开启：

```bash
GEO_ALLOW_REMOTE_ACCESS=1 \
GEO_HOST=0.0.0.0 \
GEO_INTERNAL_API_KEY=change-me-long-random-token \
node server.mjs
```

浏览器工作台使用内置登录 session 和 owner/admin/editor/viewer 权限控制；写入类 API 需要 editor/admin/owner session，或由受控脚本携带 `X-GEO-API-Key`。如果需要给脚本固定 token，可显式配置：

```bash
GEO_INTERNAL_API_KEY=local-dev-key node server.mjs
```

开启 `GEO_ALLOW_REMOTE_ACCESS=1` 时必须配置固定 `GEO_INTERNAL_API_KEY`，并且 `/api/v1/system/client-config` 不会返回该 key；外部自动化客户端调用写接口、审计日志读取接口和审计 CSV 导出接口时需要自行安全保存并发送 `X-GEO-API-Key`。

远程 provider endpoint 默认只允许 `mock://` 和 `https://`，并会拦截 loopback、私网与链路本地地址。请求体默认上限为 1MB，可通过 `GEO_MAX_BODY_BYTES` 调整。

写入类 API 默认有内存限流保护，默认每个 API key 或远端地址每分钟 120 次。可通过 `GEO_MUTATION_RATE_LIMIT_PER_MINUTE` 调整，超过后返回 `429` 和 `Retry-After`。

服务端响应默认带基础安全头：

- API JSON：`X-Content-Type-Options: nosniff`、`Cache-Control: no-store`
- HTML 静态页：`X-Content-Type-Options: nosniff`、`Cache-Control: no-store`、`Content-Security-Policy`
- 其他静态资源：`X-Content-Type-Options: nosniff`

## 生产部署

v0.21.0 支持单组织多人受控部署，并在 International GEO 中提供规则优先的站点 GEO 审计、受保护的 live crawl evidence、证据化 100 分评分拆解、`llms.txt` / JSON-LD / FAQ / 内容分发资产生成、AI visibility measurement foundation、导入测量证据、批量导入测量证据、测量证据台账、证据复核、approved-only 可见度趋势、evidence-driven asset opportunities、local generation queue、generated local previews、approve/reject review state、local-rule 完整文章草稿生成、OpenAI-compatible LLM 文章草稿生成、多平台改写稿生成、生成记录、高权重发布平台清单、发布包队列、手动收录/推荐追踪、可见度 Provider 配置与 dry-run 诊断、发布连接器配置与 dry-run 诊断、生产运行就绪检查、交付就绪报告和脱敏交付包导出。生产环境必须配置固定的 `GEO_INTERNAL_API_KEY`、`GEO_BOOTSTRAP_OWNER_PASSWORD`，并在公网暴露前增加 HTTPS、反向代理、VPN、IP allowlist 或其他外部访问控制。

生产部署入口：

- 部署指南：[docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)
- 阶段收口：[docs/STAGE_V0_2_CLOSEOUT.md](docs/STAGE_V0_2_CLOSEOUT.md)
- v0.3 阶段收口：[docs/STAGE_V0_3_CLOSEOUT.md](docs/STAGE_V0_3_CLOSEOUT.md)
- v0.4 阶段收口：[docs/STAGE_V0_4_CLOSEOUT.md](docs/STAGE_V0_4_CLOSEOUT.md)
- v0.5 阶段收口：[docs/STAGE_V0_5_CLOSEOUT.md](docs/STAGE_V0_5_CLOSEOUT.md)
- v0.6 阶段收口：[docs/STAGE_V0_6_CLOSEOUT.md](docs/STAGE_V0_6_CLOSEOUT.md)
- v0.7 阶段收口：[docs/STAGE_V0_7_CLOSEOUT.md](docs/STAGE_V0_7_CLOSEOUT.md)
- v0.8 阶段收口：[docs/STAGE_V0_8_CLOSEOUT.md](docs/STAGE_V0_8_CLOSEOUT.md)
- v0.9 阶段收口：[docs/STAGE_V0_9_CLOSEOUT.md](docs/STAGE_V0_9_CLOSEOUT.md)
- v0.9.1 阶段收口：[docs/STAGE_V0_9_1_CLOSEOUT.md](docs/STAGE_V0_9_1_CLOSEOUT.md)
- v0.10 阶段收口：[docs/STAGE_V0_10_CLOSEOUT.md](docs/STAGE_V0_10_CLOSEOUT.md)
- v0.11 阶段收口：[docs/STAGE_V0_11_CLOSEOUT.md](docs/STAGE_V0_11_CLOSEOUT.md)
- v0.12 阶段收口：[docs/STAGE_V0_12_CLOSEOUT.md](docs/STAGE_V0_12_CLOSEOUT.md)
- v0.13 阶段收口：[docs/STAGE_V0_13_CLOSEOUT.md](docs/STAGE_V0_13_CLOSEOUT.md)
- v0.14 阶段收口：[docs/STAGE_V0_14_CLOSEOUT.md](docs/STAGE_V0_14_CLOSEOUT.md)
- v0.15 阶段收口：[docs/STAGE_V0_15_CLOSEOUT.md](docs/STAGE_V0_15_CLOSEOUT.md)
- v0.16 阶段收口：[docs/STAGE_V0_16_CLOSEOUT.md](docs/STAGE_V0_16_CLOSEOUT.md)
- v0.17 阶段收口：[docs/STAGE_V0_17_CLOSEOUT.md](docs/STAGE_V0_17_CLOSEOUT.md)
- v0.18 阶段收口：[docs/STAGE_V0_18_CLOSEOUT.md](docs/STAGE_V0_18_CLOSEOUT.md)
- v0.19 阶段收口：[docs/STAGE_V0_19_CLOSEOUT.md](docs/STAGE_V0_19_CLOSEOUT.md)
- v0.20 阶段收口：[docs/STAGE_V0_20_CLOSEOUT.md](docs/STAGE_V0_20_CLOSEOUT.md)
- 环境变量示例：[.env.example](.env.example)
- Docker Compose：[docker-compose.yml](docker-compose.yml)

v0.21.0 不是完整 SaaS，也不是实时 AI 引擎监控平台或自动发布系统：暂不包含多租户隔离、OAuth/SSO、MFA、真实支付计费、生产数据库迁移、真实第三方发布凭据、邮件邀请流程、ChatGPT Search / Gemini / Claude / Perplexity / Google AI Overviews / Copilot / Bing 查询、真实 SERP 采集、实时索引验证或自动第三方发布。当前 live crawl 仅限受保护地抓取提交站点的 homepage、`robots.txt`、`sitemap.xml` 和 `/llms.txt` 证据；证据化评分只基于本地输入与这些抓取证据，不代表真实 AI 引擎收录或推荐排名。v0.17/v0.18 `measured` snapshots 可以来自人工核验后手动导入或批量导入的 human-entered evidence，或未来接入并批准的 provider evidence；只有未来 provider evidence 支持自动化监控声明，演示或种子数据必须标记为 `simulated`。v0.19 可见度 Provider 和发布连接器只保存本地配置并执行 dry-run 诊断，返回 `external_call_performed: false` 和外部发布阻断状态；不会自动查询 AI/search/SERP/indexing/provider API，不会调用 CMS/社媒/社区/目录站 API，也不会返回原始密钥。v0.21 content generation workflow 可在操作员配置 OpenAI-compatible endpoint、model 和 API key 后生成可审阅的文章和改写稿，并在失败时回退 `local_rules`；它不外部发布、不保存外部平台凭据、不查询 AI/search/SERP/indexing/provider API，不代表真实索引、AI mention、引用、推荐或外部分发。v0.21 交付包只是脱敏移交报告，不是运行态备份，不导出原始密钥、session、密码哈希、备份 snapshot、完整本地状态、原始审计日志、prompt、文章正文或改写正文。

## 工程校验

本地可以直接运行一轮基础验收：

```bash
npm run check
```

这会完成两类检查：

- 关键前后端文件的 `node --check` 语法校验
- mock 数据层的核心动作验收，包括问题裂变、问题状态更新、选题生成、文章保存与审核、品牌知识保存
- 前端路由状态验收，包括内容中心、分发中心、设置页的 hash 状态序列化与恢复

GitHub Actions 会在 push 和 pull request 进入 `main` 时运行同一个 `npm run check` 门禁。仓库设置中可把 `check / verify` 设为必需状态检查后再合并。

## 开源维护文档

- 文档索引：[docs/README.md](docs/README.md)
- 开发指南：[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- 架构说明：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 生产部署指南：[docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)
- v0.2 阶段收口：[docs/STAGE_V0_2_CLOSEOUT.md](docs/STAGE_V0_2_CLOSEOUT.md)
- v0.20 阶段收口：[docs/STAGE_V0_20_CLOSEOUT.md](docs/STAGE_V0_20_CLOSEOUT.md)
- API 参考：[docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- 扩展指南：[docs/EXTENDING.md](docs/EXTENDING.md)
- 维护指南：[docs/MAINTENANCE.md](docs/MAINTENANCE.md)
- 隐私发布审查：[docs/PRIVACY_RELEASE_REVIEW.md](docs/PRIVACY_RELEASE_REVIEW.md)
- 路线图：[docs/ROADMAP.md](docs/ROADMAP.md)
- 开源发布检查清单：[docs/OPEN_SOURCE_RELEASE.md](docs/OPEN_SOURCE_RELEASE.md)
- 贡献说明：[CONTRIBUTING.md](CONTRIBUTING.md)
- 安全策略：[SECURITY.md](SECURITY.md)
- 变更记录：[CHANGELOG.md](CHANGELOG.md)

## 当前已完成

- 后台导航与核心页面骨架
- 关键词、选题、文章、审核、分发、分析、计费、设置页原型
- Dashboard 和核心列表页示例数据
- 一期主要 REST API 的 mock/stub
- 关键词中心 GEO 话题地图、筛选 URL 同步和问题状态动作
- 关键词中心接入媒体源库、来源策略和“自媒体/权威媒体 -> 选题 -> 写作 -> 分发”的自动运营骨架
- 内容源已补充 Source Adapter Contracts，覆盖 fetch、normalize、dedupe、quality score、crawl error taxonomy 和采集证据留存
- 来源策略支持一键运行，自动产出问题、选题和文章草稿执行记录
- 来源策略支持保存调度、审核、自动发布阈值，并沉淀执行日志与最近运行复盘
- 自动运营执行记录支持结构化步骤时间线、重试，混合来源策略可自动审核并立即创建发布任务
- 服务端内置自动调度器，支持按 `next_run_at` 轮询执行到期策略，并暴露运行态快照
- 抓词、选题、写稿能力已抽成 provider registry，运行态可查看当前启用 provider
- 内容源、SERP、CMS、社媒、邮件和效果分析已抽成 connector registry，设置页可查看连接器类型、scope、endpoint 和脱敏凭据
- 连接器已补充 scoped credential 权限边界，支持查看凭据状态、允许动作、危险动作、最近权限审计，并在可见性采集和邮件 Campaign 运行前执行权限守门
- provider registry 已支持持久化配置、激活切换与基础参数编辑，可作为真实能力接入入口
- 远程 provider 已支持异步 HTTP 调用、超时、重试、失败回退到本地 provider；`mock://` endpoint 可用于本地演示
- provider 调用日志已落盘，可追踪远程执行、本地回退、耗时、重试和错误
- 选题到文章草稿的生成闭环
- 内容中心到分发中心的发布任务创建闭环
- 设置页品牌知识保存能力
- 设置页模型配置、渠道配置的新增、保存和重新认证闭环
- 设置页模型区域支持 Prompt 模板版本和内容质量 Trace 可见性
- 分发中心支持发布日历、渠道内容变体和任务项就绪检查
- 分发任务支持审批状态、审批流展示和启动前审批守门
- 分析页支持外部可见度追踪，可查看查询、目标 URL、排名/引用快照和竞品域名声量
- 外部可见度支持手动采集运行，记录 mock SERP/连接器采集步骤、快照写入和竞品声量步骤
- 分析页支持自有活动闭环，可查看受众分群、campaign 指标和活动运行步骤
- Dashboard 指标卡片到关键词、内容、分发页的快捷跳转
- 内容中心、分发中心、设置页的 URL hash 状态恢复
- 服务端本地 JSON 持久化，支持重启后恢复模型、渠道、文章、任务等运行态数据
- 设置页运行态面板，可查看本地持久化状态并重置回初始种子数据
- 可执行的本地验收脚本
- 根文档、可开发稿、接口设计和低保真交互说明
- 国际 GEO 板块，覆盖海外 AI 搜索可读性、文章生成与分发规划、ChatGPT Search、Perplexity、Google AI Overviews、Gemini、Claude、Copilot 等引擎可见度监测模型
- v0.2 单租户生产部署基础，包括 `/healthz`、`/robots.txt`、`/sitemap.xml`、`/llms.txt`、Docker、Docker Compose、`.env.example` 和部署文档
- v0.3 单用户完整闭环，包括网站/产品输入、手动选题、选题编辑、大纲生成、手动文章、模板新增、导出、国际 GEO 审计、`llms.txt`/JSON-LD 资产生成、本地套餐切换和安全退出动作
- v0.4 连接器集成就绪，包括连接器配置、连接测试、健康检查、密钥脱敏和运行状态汇总
- v0.5 连接器诊断，包括就绪得分、权限判定、审计上下文、建议动作和关联运行步骤
- v0.6 单用户本地备份/恢复，包括备份创建、列表、下载、校验、恢复、运行态摘要和审计事件
- v0.7 备份导入恢复，包括导入校验、导入已下载备份 JSON、源备份 ID 保留和导入审计
- v0.8 上线预检，包括持久化、鉴权、远程访问、备份恢复、连接器、GEO 静态入口和调度器检查
- v0.9 多用户访问，包括用户名/密码登录、HTTP-only session、owner/admin/editor/viewer 权限、用户管理和访问审计
- v0.9.1 最小 CI 门禁，包括 GitHub Actions 在 push / pull request 自动运行 `npm run check`
- v0.9.1 维护收尾，包括维护指南、生产部署指南、架构说明、开源发布清单和收尾文案对齐
- v0.10 International GEO 站点审计，包括输入网站与产品、生成规则优先审计、查看检查项、保留审计记录和生成可复制 GEO 资产
- v0.10 GEO 资产生成，包括 `llms.txt`、Organization JSON-LD、Product JSON-LD、FAQ JSON-LD、article brief 和 distribution brief
- v0.11 Live Site Crawl Evidence，包括安全 URL 校验、连接期 IP 阻断、重定向校验、超时/体积限制、homepage / `robots.txt` / `sitemap.xml` / `/llms.txt` 抓取证据、evidence-aware 检查项和 UI 证据面板
- v0.12 Evidence-backed GEO scoring，包括 100 分确定性 rubric、检查项得分/扣分/置信度/优先级/扣分原因/下一步动作、审计级 `score_breakdown`、旧审计安全补齐和 UI `评分拆解` 面板
- v0.13 AI visibility measurement foundation，包括 International GEO prompt sets、ChatGPT Search / Perplexity / Google AI Overviews / Gemini / Claude / Copilot / Bing provider readiness、visibility runs、prompt snapshots、UI panels、浏览器按钮 wiring，以及 `measured` / `simulated` / `unavailable` 数据状态边界；默认本地运行只生成 `unavailable` snapshots，不查询真实 AI 或 SERP provider
- v0.14 Evidence-driven International GEO asset opportunities，包括从站点审计评分、crawl evidence、AI visibility gaps 和 rule-first input 生成 opportunity rows、local generation queue、带 provenance metadata 的 generated local previews，以及 approve/reject review state；这些资产仅供本地审阅，不外部发布、不生成完整长文、不代表真实 AI 引擎测量结果
- v0.15 International GEO publishing platform workflow，包括本地高权重发布平台清单、每个平台的权重信号和 AI 推荐概率说明、从 approved evidence assets 确定性生成的 review-only publishing packages，以及 publication URL、canonical URL、indexing status、AI mention status、citation status、recommendation status 的 manual/local tracking；这些记录仅用于本地 planning/handoff，不代表真实收录或推荐
- v0.16 International GEO content generation workflow，包括 `local_rules` 本地规则 provider、从 approved evidence assets 生成完整文章草稿、文章 approve/reject 审核、从 approved articles 生成官网/Medium/LinkedIn/Reddit/Quora/目录站等多平台改写稿、改写稿 approve/reject 审核，以及 article/rewrite generation runs；这些草稿仅供本地审阅和人工分发，不代表真实外部发布、索引、AI mention、引用或推荐
- v0.17 Manual measured visibility evidence import，包括 `POST /api/v1/international-geo/visibility/evidence/import`、`manual_import` provider provenance、`measured_import` run records、readiness `manual_review` 状态，以及 International GEO `导入测量证据` 面板；这些 measured snapshots 是人工录入证据，不调用外部 provider，也不代表自动化监控
- v0.18 Measured evidence operations，包括 `POST /api/v1/international-geo/visibility/evidence/imports` 批量导入、`POST /api/v1/international-geo/visibility/evidence/:id/review` 复核、测量证据台账、pending/approved/rejected 状态、approved-only 可见度趋势，以及 `批量导入测量证据`、`测量证据台账`、`证据复核`、`可见度趋势` UI 面板；这些能力仍是本地人工证据运营，不调用外部 AI/search/provider API
- v0.19 Production integration foundation，包括可见度 Provider 配置、审批状态、masked credentials、dry-run 测试、diagnose-all、发布连接器配置、dry-run 发布边界、生产运行就绪检查、密钥与连接边界、交付检查清单，以及 `可见度 Provider 配置`、`Provider 诊断`、`Provider 运行边界`、`发布连接器配置`、`发布连接器诊断`、`发布运行边界`、`生产运行就绪` UI 面板；这些能力仍是本地集成基础，不调用外部 AI/search/SERP/indexing/provider/CMS/social/community API，不自动发布，不返回原始密钥
- v0.20 Delivery hardening，包括交付就绪报告、脱敏交付包导出、`交付中心` UI、交付边界、交付步骤、`GET /api/v1/system/delivery-readiness`、`POST /api/v1/system/delivery-readiness/check` 和 `GET /api/v1/system/delivery-bundle`；交付包是移交报告，不是备份，不调用外部 AI/search/SERP/indexing/provider/CMS/social/community API，不自动发布，不导出原始密钥

## 当前 API 范围

已包含这些核心接口的 stub：

- `/api/v1/dashboard/*`
- `/api/v1/keywords`
- `/api/v1/keyword-crawl-jobs`
- `/api/v1/media-sources`
- `/api/v1/source-adapter-contracts`
- `/api/v1/source-adapter-contracts/:id`
- `/api/v1/automation-providers`
- `/api/v1/automation-providers/:id`
- `/api/v1/automation-connectors`
- `/api/v1/automation-connectors/:id`
- `/api/v1/connector-permissions`
- `/api/v1/provider-invocations`
- `/api/v1/audit-events`
- `/api/v1/audit-events/export.csv`
- `/api/v1/source-strategies`
- `/api/v1/source-strategies/:id`
- `/api/v1/automation-runs`
- `/api/v1/automation-runs/:id`
- `/api/v1/automation-runs/:id/retry`
- `/api/v1/source-strategies/:id/run`
- `/api/v1/topic-ideas`
- `/api/v1/articles`
- `/api/v1/publish-tasks`
- `/api/v1/publish-tasks/:id/approval`
- `/api/v1/publish-records`
- `/api/v1/channels`
- `/api/v1/analytics/*`
- `/api/v1/analytics/visibility/collect`
- `/api/v1/audience-segments`
- `/api/v1/marketing-campaigns`
- `/api/v1/marketing-campaigns/:id/run`
- `/api/v1/billing/*`
- `/api/v1/brand-profile`
- `/api/v1/model-configs`
- `/api/v1/prompt-templates`
- `/api/v1/content-quality-traces`
- `/api/v1/session/current`
- `/api/v1/session/login`
- `/api/v1/session/logout`
- `/api/v1/users`
- `/api/v1/users/:id/disable`
- `/api/v1/users/:id/reset-password`
- `/api/v1/system/runtime`
- `/api/v1/system/preflight`
- `/api/v1/system/production-readiness`
- `/api/v1/system/production-readiness/check`
- `/api/v1/system/delivery-readiness`
- `/api/v1/system/delivery-readiness/check`
- `/api/v1/system/delivery-bundle`
- `/api/v1/system/backups`
- `/api/v1/system/backups/import/validate`
- `/api/v1/system/backups/import`
- `/api/v1/system/backups/:id/download`
- `/api/v1/system/backups/:id/validate`
- `/api/v1/system/backups/:id/restore`
- `/api/v1/system/runtime/scheduler`
- `/api/v1/system/runtime/scheduler/tick`
- `/api/v1/system/runtime/reset`
- `/api/v1/channels/:id/reconnect`
- `/api/v1/articles/from-topic`
- `/api/v1/articles`
- `/api/v1/keywords/:id/actions`
- `/api/v1/workspace-input`
- `/api/v1/topic-ideas`
- `/api/v1/topic-ideas/:id`
- `/api/v1/topic-ideas/:id/outline`
- `/api/v1/content-templates`
- `/api/v1/exports`
- `/api/v1/exports/:id/download`
- `/api/v1/international-geo`
- `/api/v1/international-geo/input`
- `/api/v1/international-geo/audit`
- `/api/v1/international-geo/artifacts`
- `/api/v1/international-geo/site-audits`
- `/api/v1/international-geo/site-audits/:id`
- `/api/v1/international-geo/site-audits/:id/assets`
- `/api/v1/international-geo/site-audits/:id/crawl`
- `/api/v1/international-geo/visibility`
- `/api/v1/international-geo/visibility/runs`
- `/api/v1/international-geo/visibility/snapshots`
- `/api/v1/international-geo/visibility/prompt-sets`
- `/api/v1/international-geo/visibility/run`
- `/api/v1/international-geo/visibility/evidence/import`
- `/api/v1/international-geo/visibility/evidence/imports`
- `/api/v1/international-geo/visibility/evidence/:id/review`
- `/api/v1/international-geo/visibility/providers`
- `/api/v1/international-geo/visibility/providers/:id`
- `/api/v1/international-geo/visibility/providers/:id/test`
- `/api/v1/international-geo/visibility/providers/diagnose`
- `/api/v1/international-geo/evidence-assets`
- `/api/v1/international-geo/evidence-assets/opportunities`
- `/api/v1/international-geo/evidence-assets/queue`
- `/api/v1/international-geo/evidence-assets/generate`
- `/api/v1/international-geo/evidence-assets/:id/review`
- `/api/v1/international-geo/content-generation`
- `/api/v1/international-geo/content-generation/articles/generate`
- `/api/v1/international-geo/content-generation/articles/:id/review`
- `/api/v1/international-geo/content-generation/rewrites/generate`
- `/api/v1/international-geo/content-generation/rewrites/:id/review`
- `/api/v1/international-geo/publishing`
- `/api/v1/international-geo/publishing/platforms`
- `/api/v1/international-geo/publishing/packages`
- `/api/v1/international-geo/publishing/tracking`
- `/api/v1/international-geo/publishing/connectors`
- `/api/v1/international-geo/publishing/connectors/:id`
- `/api/v1/international-geo/publishing/connectors/:id/test`
- `/api/v1/international-geo/publishing/connectors/diagnose`
- `/api/v1/international-geo/publishing/packages/generate`
- `/api/v1/international-geo/publishing/packages/:id/review`
- `/api/v1/international-geo/publishing/tracking/:id`
- `/api/v1/billing/plan`
- `/api/v1/session/logout`

## 运维端点

这些端点不在 `/api/v1` 下，用于部署、健康检查和 GEO/SEO 基础可读性：

- `/healthz`
- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- `/favicon.ico`

## 旧审计工具

如果还需要使用早期审计脚本，默认审计当前工作目录：

```bash
node agentcoreos-geo-audit.mjs
```

也可以传入其他仓库路径：

```bash
node agentcoreos-geo-audit.mjs /path/to/repo
```

## License

This project is licensed under the GNU General Public License version 3. See [LICENSE](LICENSE).
