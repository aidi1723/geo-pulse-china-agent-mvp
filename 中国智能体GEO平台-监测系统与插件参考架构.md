# 中国智能体 GEO 平台监测系统与插件参考架构

## 1. 文档目标

这份文档用于把 GEO 监测系统、智能体插件库和行业资源集整理成：

- 可直接参考的后端能力
- 可吸收的方法论
- 仅适合调研的资源清单

目标不是把所有仓库都接进来，而是明确：

`哪些能成为 GEO-Pulse 的监测引擎，哪些能成为技能层，哪些只是研究资料。`

## 2. 总体原则

我们的项目当前主线是：

- 问题意图挖掘
- 内容生成
- 分发发布

在这个基础上，监测系统与插件库的角色应当是：

### 监测系统

负责回答：

- 大模型到底有没有推荐我
- 哪些 Prompt 下推荐了我
- 回答里怎么描述我
- 竞品是否被更频繁提及

### 插件库 / Skills

负责执行：

- 多步骤采集
- 内容标准化
- GEO 规则执行
- 自动工作流编排

### 行业资源集

负责支撑：

- 指标命名
- 方法论设计
- 竞品调研
- 商业化表达

## 3. 可直接参考的监测系统

## 3.1 `AI2HU/gego`

仓库：

- https://github.com/AI2HU/gego

### 适合吸收的部分

- 多模型 Prompt 调度
- 提问执行框架
- 自动重试和错误处理
- 结果保存与日志记录

### 在我们项目里的角色

不建议直接当成前台产品照搬。

建议把它定位为：

`监测引擎参考实现`

用于支撑未来的：

- 品牌提及监测
- 首次推荐率
- Prompt 采样
- 回答证据归档

### 适合纳入的模块

建议在我们代码结构里预留：

- `monitoring/providers`
- `monitoring/prompts`
- `monitoring/runs`
- `monitoring/results`
- `monitoring/retries`

### 当前阶段的结论

第一期不必立刻全量接入，但它应该成为二期“监测系统”最优先参考仓库。

## 4. 可吸收的智能体插件库

## 4.1 `VoltAgent/awesome-openclaw-skills`

仓库：

- https://github.com/VoltAgent/awesome-openclaw-skills

### 适合吸收的部分

- 把原子任务做成技能目录
- 用技能编排多个自动化动作
- 形成“可插拔的工作流能力层”

### 对我们项目的启发

当前平台里很多能力未来都不应写死在单个流程里，而应抽成技能：

- 问题裂变技能
- 意图聚类技能
- 内容结构化技能
- GEO 格式修复技能
- 发布适配技能

### 不建议直接做的事

- 不建议第一期就把 OpenClaw 或整套外部技能体系强绑定进主项目
- 不建议依赖第三方技能仓库的目录结构作为我们自己产品架构

### 更适合的落地方向

在我们项目里先抽一个内部技能层：

- `skills/monitoring`
- `skills/content`
- `skills/distribution`
- `skills/enrichment`

先定义接口和调用方式，再考虑兼容外部技能格式。

## 4.2 `aaron-he-zhu/seo-geo-claude-skills`

说明：

- 我没有在当前核对中直接打开到该 GitHub 仓库主页
- 但在公开技能目录站点中看到了对应仓库链接和技能列表描述

可核对到的索引页：

- https://agentskill.work/skills/aaron-he-zhu%2Fseo-geo-claude-skills

### 适合吸收的部分

- 把 GEO 任务拆成高质量指令模板
- 让内容优化、排名追踪、引用优化形成独立技能
- 强调长任务上下文保持

### 对我们项目的价值

它更适合被看成：

`技能设计参考`

而不是直接产品依赖。

### 在我们项目里的建议

可以从中借鉴三类内部技能定义：

- `geo-content-optimizer`
- `prompt-rank-tracker`
- `citation-structure-checker`

## 5. 行业标准与资源集

## 5.1 GEO Awesome Lists 的正确角色

这些项目不适合作为产品代码依赖，更适合作为：

- 研究资料
- 指标命名参考
- 商业化汇报术语库
- 竞品清单入口

## 5.2 可确认的 Awesome GEO 资源

### `amplifying-ai/awesome-generative-engine-optimization`

仓库：

- https://github.com/amplifying-ai/awesome-generative-engine-optimization

说明：

- 我没有在当前核对中找到你提到的 `Citedrelevance/awesome-generative-engine-optimization`
- 但找到了一个可确认存在、结构明确的同类 GEO 资源集

适合吸收：

- GEO 论文和工具索引
- 指标与方法论线索
- 行业生态概览

### `izak-fisher/awesome-geo`

仓库：

- https://github.com/izak-fisher/awesome-geo

说明：

- 我没有在当前核对中找到 `tentenco/awesome-geo`
- 但找到了一个可确认存在的 `awesome-geo` 资源仓

适合吸收：

- GEO 工具、资源、社区和 SaaS 清单
- 竞品调研入口
- 对外生态映射

## 5.3 未直接核对到的资源

以下条目在本次快速核对中未找到稳定可引用的官方仓库主页，因此当前不建议写入正式技术依赖清单：

- `Citedrelevance/awesome-generative-engine-optimization`
- `tentenco/awesome-geo`
- `jerrytregno/generative-engine-optimization-tools`

这些可以先放入“待二次核验资源池”。

## 6. 我们项目里的具体落地方式

## 6.1 一期：保留接口位，不做重监测

当前一期仍应聚焦：

- 问题意图挖掘
- 内容生成
- 审核
- 分发

但可以预留监测接口：

- `monitor/prompts`
- `monitor/runs`
- `monitor/results`
- `monitor/mentions`

## 6.2 二期：引入 GEO Monitor

二期建议新加一个内部模块：

`GEO Monitor`

职责：

- 多模型 Prompt 采样
- 提及率统计
- 回答证据保存
- 竞品缺席识别

这个模块的实现优先参考：

- `AI2HU/gego`

## 6.3 三期：引入技能执行层

三期再把以下能力抽成技能层：

- 关键词/问题裂变
- PAA 问题提取
- 意图聚类
- 内容模板匹配
- AI 引用结构优化
- 渠道发布适配

这时再参考：

- `awesome-openclaw-skills`
- `seo-geo-claude-skills`

## 7. 对当前代码结构的建议

基于现有仓库，建议未来逐步加这些目录：

### 监测层

- `monitoring/providers`
- `monitoring/prompts`
- `monitoring/runs`
- `monitoring/results`

### 技能层

- `skills/question-expansion`
- `skills/intent-clustering`
- `skills/content-optimization`
- `skills/publish-adapters`

### 研究层

- `research/awesome-geo`
- `research/benchmarks`
- `research/competitors`

## 8. 对产品话术的影响

如果未来把监测做进来，我们对外的话术应升级成：

`一个面向中国智能体公司的 GEO 内容与监测平台。`

而不是只说：

`关键词分析和发文平台。`

原因是：

- 关键词与内容是执行层
- 监测是证明价值的度量层
- Skills 是扩展层

三者合起来，产品会更像一个真正的 GEO 平台。

## 9. 当前建议的结论

这批参考项目应该分三档处理：

### 第一档：优先参考

- `AI2HU/gego`

### 第二档：方法参考

- `VoltAgent/awesome-openclaw-skills`
- `aaron-he-zhu/seo-geo-claude-skills`

### 第三档：研究资料

- `awesome-generative-engine-optimization`
- `awesome-geo`
- 其他 GEO tools lists

## 10. 参考来源

- `AI2HU/gego`
  https://github.com/AI2HU/gego
- `VoltAgent/awesome-openclaw-skills`
  https://github.com/VoltAgent/awesome-openclaw-skills
- `seo-geo-claude-skills` 索引页
  https://agentskill.work/skills/aaron-he-zhu%2Fseo-geo-claude-skills
- `amplifying-ai/awesome-generative-engine-optimization`
  https://github.com/amplifying-ai/awesome-generative-engine-optimization
- `izak-fisher/awesome-geo`
  https://github.com/izak-fisher/awesome-geo
