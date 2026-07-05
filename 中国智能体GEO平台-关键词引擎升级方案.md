# 中国智能体 GEO 平台关键词引擎升级方案

## 1. 为什么要升级

当前项目里“关键词”模块的定义仍然偏接近传统 SEO 工具：

- 抓词
- 打分
- 生成选题
- 写文章

这条链路对普通内容生产成立，但对 GEO 不够。

在 GEO 里，真正需要争夺的不是传统短尾词，而是：

- 自然语言问答
- 多轮意图链
- 主题权威网络
- 能被大模型直接复述的问题结构

换句话说，我们的平台不应该把输入理解成“关键词”，而应该把输入理解成：

`用户可能会向 AI 提出的真实问题集合`

## 2. 对 GEO 关键词的新定义

### 2.1 旧定义

旧定义是：

- 铝合金窗
- 隔音玻璃
- 防火门

这种词适合搜索引擎页面竞争，不足以支撑大模型问答。

### 2.2 新定义

GEO 里关键词应拆成 4 层：

1. 种子主题
2. 自然语言问题
3. 意图簇
4. 话题地图节点

例如输入：

`中国铝合金门窗工厂`

系统输出不应该只是几十个短词，而应该是：

- 哪家中国铝合金门窗工厂适合沿海台风地区项目？
- 如何判断铝合金型材是否适合高盐雾环境？
- 中国门窗工厂出口中东项目要注意哪些认证？
- 断桥铝系统窗和普通铝窗的防水差别在哪里？

这才是大模型更可能回答的 GEO 问题形态。

## 3. 从外部项目和商业标杆吸收什么

## 3.1 可确认的开源与官方产品模式

### A. `sundios/people-also-ask`

价值：

- 直接抓 Google `People Also Ask`
- 提供真实问题句式
- 适合当作 GEO 问题源头之一

对我们项目的启发：

- 关键词抓取不应只抓短词
- 要优先抓“问题句”
- 要保留问题之间的上下级关系

### B. AnswerThePublic

价值：

- 不是只给词表
- 而是把自动补全问题按 `what / why / how / which / vs` 等问法结构可视化

对我们项目的启发：

- 前端关键词页不该只是表格
- 需要有“问题意图图谱”视图
- 让老板一眼看到一个主题可以裂变出多少 AI 问答机会

### C. AlsoAsked

价值：

- 它不是简单列出问题
- 而是把 `People Also Ask` 的关系结构组织成树
- 官方 FAQ 也明确强调其核心差异是“映射问题之间的连接关系”

对我们项目的启发：

- 我们的关键词模块必须支持“父问题 -> 子问题 -> 深层问题”
- 这比单纯搜索量更接近 GEO 的知识路径
- “话题地图”应成为平台里的一级能力，而不是附属字段

## 3.2 无法完全确认的项目

你提到的：

- `Keyword-Clustering-using-LLMs`
- `Topical-Authority-Generator`

我没有在当前核对中找到明确、稳定、可直接引用的 GitHub 主仓。

因此在产品设计里不直接绑定某个未经确认的具体仓库，而是吸收它们代表的方法论：

- 用 LLM 做问题意图聚类
- 用种子词自动扩展话题权威图
- 用主题树反推发文计划

这部分方法可以继续做，但在对外文档里建议不要写死某个未核实仓库名。

## 4. 我们的关键词引擎应升级成什么

## 4.1 新名称建议

不建议再把模块只叫 `Keyword Center`。

更准确的命名是：

- `Intent & Topic Center`
- 或中文直接叫：`问题意图中心`

如果要保持当前英文导航，也建议副标题改成：

`Questions, Intent Clusters, Topical Maps`

## 4.2 新的最小闭环

关键词模块应从原来的：

`抓词 -> 打分 -> 生成文章`

升级为：

`种子主题 -> 问题裂变 -> 意图聚类 -> 话题地图 -> 模板匹配 -> 文章生成`

## 4.3 三步飞轮

### 第一步：Seed to Prompts

输入：

- 中国智能体
- 企业智能体平台
- 外贸智能体

输出：

- 50 到 100 个自然语言问句
- 问法标签：`what / how / why / which / vs / best / price / compare`

### 第二步：Intent Clustering

对问题进行聚类，而不是对字面词进行聚类。

最少先聚成这些簇：

- 购买决策类
- 技术科普类
- 对比选择类
- 部署风险类
- 行业案例类

### 第三步：Template Matching

按意图簇分配内容模板：

- 购买决策类 -> 决策页 / 对比页
- 技术科普类 -> 定义型文章 / FAQ
- 对比选择类 -> 对比页
- 部署风险类 -> 部署说明页 / FAQ
- 行业案例类 -> 场景页 / 案例页

## 5. 对现有产品结构的具体改动

## 5.1 Keyword Center 页面改造

当前结构：

- 关键词库
- 机会池
- 抓取记录

建议升级为：

- 问题库
- 意图簇
- 话题地图
- 抓取记录

### 问题库

不再默认显示短尾词，而显示完整问题句。

核心字段改成：

- 问题原文
- 问法类型
- 意图簇
- 主题
- GEO 价值分
- 模板匹配结果
- 状态

### 意图簇

按问题的真实用途组织内容：

- 购买决策
- 技术解释
- 对比选择
- 部署与合规
- 行业场景

### 话题地图

增加树图/关系图视图，表示：

- 中心主题
- 一级问题簇
- 二级问题节点
- 推荐生成内容类型

## 5.2 Dashboard 指标改造

把“关键词数”换成更 GEO 化的指标：

- 本周新增问题数
- 已聚类问题数
- 话题地图节点数
- 高价值决策问题数

## 5.3 Analytics 改造

增加两个分析口径：

- 问法分布：`what / how / why / which / vs`
- 意图分布：`认知 / 比较 / 决策 / 部署 / 案例`

## 6. 数据模型补充建议

在现有数据模型基础上，建议后续补这些字段：

### keywords 表

新增：

- `query_form`
- `is_question`
- `parent_keyword_id`
- `cluster_id`
- `topic_map_id`
- `question_depth`

### topic_ideas 表

新增：

- `intent_cluster`
- `question_source_type`
- `topic_map_node_id`

### 新增表：intent_clusters

字段建议：

- `id`
- `workspace_id`
- `name`
- `description`
- `cluster_type`
- `created_at`
- `updated_at`

### 新增表：topic_map_nodes

字段建议：

- `id`
- `workspace_id`
- `root_topic`
- `parent_node_id`
- `keyword_id`
- `node_type`
- `depth`
- `recommended_template`
- `created_at`
- `updated_at`

## 7. 一期实现建议

为了不把范围做炸，建议分两层做：

### 一期马上做

- 支持问题句优先展示
- 支持问法标签
- 支持意图簇字段
- 支持话题地图视图
- 支持模板自动匹配

### 二期再做

- 真正的 LLM 聚类
- 更复杂的问题树扩展
- 多来源抓取质量比较
- 话题覆盖缺口分析

## 8. 对当前项目最关键的结论

我们现在不该把项目理解成：

`关键词抓取 + AI 写作工具`

而应该理解成：

`面向中国智能体公司的问题意图挖掘、话题权威构建与内容分发平台`

这会直接改变：

- 后台 UI
- 数据结构
- 关键词打分逻辑
- 模板分配逻辑
- 销售话术

## 9. 已建议纳入原型的改动

基于这次升级，原型层建议立即体现：

1. 关键词页增加 `话题地图` 视图
2. 关键词列表字段从“关键词”改成“问题 / 意图 / 模板”
3. 加入 `what / how / why / vs / which` 问法标签
4. 把“生成选题”动作改成“从问题意图生成选题”
5. 在 Dashboard 和 Analytics 中逐步弱化传统关键词语义

## 10. 参考来源

以下是本次升级中实际核对过的参考来源：

- `sundios/people-also-ask`
  https://github.com/sundios/people-also-ask
- AnswerThePublic 官方站
  https://answerthepublic.com/
- AnswerThePublic 研究页示例
  https://answerthepublic.com/research/on/ask
- AlsoAsked FAQ
  https://alsoasked.com/faqs
- AlsoAsked 深度搜索说明
  https://help.alsoasked.com/en/articles/6231671-what-is-deep-search
- AlsoAsked 与 AnswerThePublic 的差异说明
  https://help.alsoasked.com/en/articles/6116841-how-is-alsoasked-different-from-answerthepublic
