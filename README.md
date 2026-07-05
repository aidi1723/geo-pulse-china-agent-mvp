# GEO Pulse China Agent MVP

License: GPL-3.0-only

Status: local, mock-first MVP ready for open-source publication after repository owner review.

这个仓库现在包含两部分内容：

1. 中国智能体 GEO 平台的一期产品方案、后台设计和交互文档
2. 一个可直接运行的最小全栈 MVP 骨架

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

## 运行 MVP

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

所有写入类 API 默认都需要携带 `X-GEO-API-Key`。服务未配置时会在启动时生成一次性本地开发 token，前端同源页面会自动读取并携带；如果需要固定 token，可显式配置：

```bash
GEO_INTERNAL_API_KEY=local-dev-key node server.mjs
```

开启 `GEO_ALLOW_REMOTE_ACCESS=1` 时必须配置固定 `GEO_INTERNAL_API_KEY`，并且 `/api/v1/system/client-config` 不会返回该 key；调用写接口、审计日志读取接口和审计 CSV 导出接口的外部客户端需要自行安全保存并发送 `X-GEO-API-Key`。

远程 provider endpoint 默认只允许 `mock://` 和 `https://`，并会拦截 loopback、私网与链路本地地址。请求体默认上限为 1MB，可通过 `GEO_MAX_BODY_BYTES` 调整。

写入类 API 默认有内存限流保护，默认每个 API key 或远端地址每分钟 120 次。可通过 `GEO_MUTATION_RATE_LIMIT_PER_MINUTE` 调整，超过后返回 `429` 和 `Retry-After`。

服务端响应默认带基础安全头：

- API JSON：`X-Content-Type-Options: nosniff`、`Cache-Control: no-store`
- HTML 静态页：`X-Content-Type-Options: nosniff`、`Cache-Control: no-store`、`Content-Security-Policy`
- 其他静态资源：`X-Content-Type-Options: nosniff`

## 工程校验

本地可以直接运行一轮基础验收：

```bash
npm run check
```

这会完成两类检查：

- 关键前后端文件的 `node --check` 语法校验
- mock 数据层的核心动作验收，包括问题裂变、问题状态更新、选题生成、文章保存与审核、品牌知识保存
- 前端路由状态验收，包括内容中心、分发中心、设置页的 hash 状态序列化与恢复

## 开源维护文档

- 文档索引：[docs/README.md](docs/README.md)
- 开发指南：[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- 架构说明：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API 参考：[docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- 扩展指南：[docs/EXTENDING.md](docs/EXTENDING.md)
- 维护指南：[docs/MAINTENANCE.md](docs/MAINTENANCE.md)
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
- 外部可见度支持手动采集运行，记录 SERP 抓取、快照写入和竞品声量步骤
- 分析页支持自有活动闭环，可查看受众分群、campaign 指标和活动运行步骤
- Dashboard 指标卡片到关键词、内容、分发页的快捷跳转
- 内容中心、分发中心、设置页的 URL hash 状态恢复
- 服务端本地 JSON 持久化，支持重启后恢复模型、渠道、文章、任务等运行态数据
- 设置页运行态面板，可查看本地持久化状态并重置回初始种子数据
- 可执行的本地验收脚本
- 根文档、可开发稿、接口设计和低保真交互说明

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
- `/api/v1/system/runtime`
- `/api/v1/system/runtime/scheduler`
- `/api/v1/system/runtime/scheduler/tick`
- `/api/v1/system/runtime/reset`
- `/api/v1/channels/:id/reconnect`
- `/api/v1/articles/from-topic`
- `/api/v1/keywords/:id/actions`

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
