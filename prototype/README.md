# GEO Pulse Prototype

这是一个零依赖的模块化后台原型，用来把中国智能体 GEO 平台一期的后台结构先跑起来。

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
- 默认读取 `server.mjs` 提供的 API stub
- 无需安装前端依赖
- 已包含页面导航、Tab 切换、详情抽屉和编辑页骨架
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
- 国际 GEO 支持海外 AI 搜索可读性、文章生成与分发规划，以及 ChatGPT Search、Perplexity、Google AI Overviews、Gemini、Claude、Copilot 等引擎监测模型展示
- v0.2 服务模式提供 `/healthz`、`/robots.txt`、`/sitemap.xml`、`/llms.txt` 和 `/favicon.ico`

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
- `src/pages/*.js`
  各页面渲染模块

## 下一步建议

1. 把当前原生 ESM 前端迁移到正式前端工程
2. 把 API stub 替换成真实持久化数据层
3. 把关键词、文章、发布任务改成真实异步状态
4. 把当前内置调度器替换成独立 worker / queue
5. 接入真实国际 GEO 监测、内容分发和第三方平台 API
