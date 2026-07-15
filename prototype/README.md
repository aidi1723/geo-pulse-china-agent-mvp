# GEO Pulse Prototype

这是 GEO Pulse v0.21.0 的零依赖模块化后台客户端。通过仓库根服务运行时，它使用内置登录、角色权限、本地 JSON 持久化和真实的本地 API 路由；直接打开 HTML 时使用静态预览数据。

## 打开方式

推荐通过仓库根目录的本地服务访问：

- `node server.mjs`
- 打开 `http://localhost:3000/`

通过本地服务访问时，设置页和内容/分发动作会默认落盘到仓库下的 `data/geo-pulse-state.json`。

如果只是看纯静态页面，也可以直接打开：

- `prototype/index.html`

## 当前覆盖

- Dashboard
- Keyword Center
- Content Center
- Distribution Tasks
- Analytics
- Account & Billing
- Settings
- International GEO

## 当前特性

- 使用原生 ESM 模块拆分前端
- 默认读取 `server.mjs` 提供的页面级 API 数据计划，登录后不再全量预取所有业务域
- 无需安装前端依赖
- 内置 owner/admin/editor/viewer 登录、移动端 8 模块导航、Tab、详情抽屉和具名模态面板
- 使用 `DESIGN.md` 的深色紧凑运维设计，支持 390px 窄屏、键盘焦点、表单可访问名称和 reduced-motion
- 关键词中心支持 GEO 问题筛选、意图簇和话题地图
- 关键词抓取页支持媒体源库、来源策略和自媒体自动运营飞轮展示
- 来源策略支持一键运行，自动生成执行记录、问题、选题和文章草稿
- 来源策略支持调度、审核和自动发布阈值配置，并在设置页查看执行日志
- 自动运营执行记录支持重试和跳转到策略配置页做复盘
- 内容中心支持搜索、状态筛选、选题转草稿、审核转发布
- 分发中心支持发布任务创建、重试、取消和结果回写
- 设置页支持品牌知识、模型配置、渠道配置的新增与保存
- 设置页支持查看本地持久化状态并一键重置运行态
- 设置页支持查看自动调度引擎状态，并手动触发一次调度轮询
- 设置页支持查看当前抓词、选题、写稿 provider 的启用状态
- 设置页支持切换和保存 provider 的 endpoint、模型名、超时、重试等基础参数
- 远程 provider 支持 `mock://` 演示模式，以及真实 HTTP endpoint 的超时、重试和回退
- provider 页可查看最近调用日志，区分 remote、fallback_local 和 local 执行模式
- 关键词、内容、分发、设置核心状态支持 URL hash 恢复
- 国际 GEO 支持受保护的站点证据抓取、证据化评分、人工 measured evidence、证据资产、审阅优先的文章/改写生成、发布包与手动追踪
- 内容生成可使用 `local_rules`，或由操作员配置 OpenAI-compatible endpoint；失败自动回退并记录 provider provenance
- 可见度 Provider 与发布连接器仍为 dry-run 基础，不查询真实 AI/search/SERP/indexing 服务，也不自动发布
- 服务模式提供 `/healthz`、`/robots.txt`、空管理端 sitemap、`/llms.txt` 和 `/favicon.ico`；管理 HTML 明确 `noindex, nofollow`

## 当前结构

- `app.js`
  前端模块入口
- `src/main.js`
  启动与数据加载
- `src/api.js`
  API 请求层
- `src/store.js`
  页面状态与数据存储
- `src/render.js`
  顶层渲染入口
- `src/accessibility.js`
  渲染后表单标签、Tab 和对话框焦点增强
- `src/pages/*.js`
  各页面渲染模块

## 下一步建议

1. 将本地 JSON 状态迁移到带迁移、备份与审计保留策略的生产数据库
2. 将内容生成凭据迁移到耐久密钥存储，并补充配额、成本、重试和监控
3. 在明确审批和权限守门后接入合规的 measured visibility provider
4. 在人工审批之后接入真实内容分发连接器，并保存外部证据
5. 将内置调度器迁移到独立 worker / queue，并补充生产监控与告警
