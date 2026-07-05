# 中国智能体 GEO 平台一期接口与数据表设计

## 1. 文档目标

这份文档用于定义中国智能体 GEO 平台一期后台的：

- 核心数据实体
- 数据表结构
- 主要接口清单
- 异步任务边界
- 前后端联调约定

默认假设：

- 一期使用关系型数据库，建议 PostgreSQL
- 后台接口采用 REST
- 长耗时任务走异步 Job
- 渠道发布结果通过任务回写，不强依赖实时 webhook

## 2. 一期范围

本期只覆盖以下业务链路：

1. 工作区与成员
2. 关键词抓取与管理
3. 机会池与选题
4. 文章生成与审核
5. 渠道配置与发布任务
6. 基础分析
7. 套餐与用量

不覆盖：

- AI 提及率监测
- 竞品跟踪
- 网站审计
- 自动改写站点
- 复杂审批流

## 3. 技术约定

## 3.1 命名约定

- 表名：复数下划线命名，如 `keywords`
- 主键：`id`，使用 UUID
- 时间字段：`created_at`、`updated_at`
- 软删除：一期不默认启用，必要时加 `deleted_at`
- 枚举值：小写下划线，如 `review_pending`

## 3.2 状态字段约定

- 关键词状态：`new` `scored` `selected` `watchlist` `ignored` `duplicate`
- 选题状态：`draft` `ready` `generating` `generated` `archived`
- 文章状态：`draft` `review_pending` `review_passed` `review_rejected` `ready_to_publish` `published`
- 发布任务状态：`draft` `queued` `running` `partial_failed` `completed` `failed` `canceled`
- 发布项状态：`queued` `publishing` `published` `failed` `canceled`

## 3.3 通用响应结构

成功响应建议统一：

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_xxx"
  }
}
```

分页响应建议统一：

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "page_size": 20,
    "total": 120
  },
  "meta": {
    "request_id": "req_xxx"
  }
}
```

错误响应建议统一：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "channel_id is required"
  },
  "meta": {
    "request_id": "req_xxx"
  }
}
```

## 4. 核心数据表

## 4.1 workspaces

用于隔离团队数据。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| name | varchar(120) | 是 | 工作区名称 |
| slug | varchar(80) | 是 | 唯一标识 |
| plan_code | varchar(40) | 是 | 套餐编码 |
| status | varchar(20) | 是 | `active` `trial` `expired` |
| timezone | varchar(50) | 是 | 时区 |
| owner_user_id | uuid | 是 | 所有者 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `unique(slug)`
- `index(owner_user_id)`

## 4.2 users

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| email | varchar(160) | 是 | 邮箱 |
| name | varchar(80) | 是 | 姓名 |
| avatar_url | text | 否 | 头像 |
| status | varchar(20) | 是 | `active` `invited` `disabled` |
| last_login_at | timestamptz | 否 | 最近登录时间 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `unique(email)`

## 4.3 workspace_members

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| user_id | uuid | 是 | 用户 ID |
| role | varchar(30) | 是 | `owner` `admin` `editor` `reviewer` `operator` |
| status | varchar(20) | 是 | `active` `invited` |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `unique(workspace_id, user_id)`
- `index(workspace_id, role)`

## 4.4 brand_profiles

存放品牌知识与写作约束。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| brand_name | varchar(120) | 是 | 品牌名称 |
| one_liner | text | 否 | 一句话介绍 |
| core_value_props | jsonb | 否 | 核心卖点数组 |
| forbidden_terms | jsonb | 否 | 禁用表述数组 |
| glossary_terms | jsonb | 否 | 术语词表 |
| competitor_blacklist_terms | jsonb | 否 | 竞品黑名单词 |
| default_cta | text | 否 | 默认 CTA |
| tone_style | varchar(40) | 否 | 语气 |
| default_word_count_min | int | 否 | 默认最小字数 |
| default_word_count_max | int | 否 | 默认最大字数 |
| faq_default_count | int | 否 | FAQ 默认数量 |
| force_compare_block | boolean | 是 | 是否强制对比块 |
| force_cta_block | boolean | 是 | 是否强制 CTA |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `unique(workspace_id)`

## 4.5 model_configs

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| provider | varchar(40) | 是 | 模型提供方 |
| model_name | varchar(80) | 是 | 模型名 |
| purpose | varchar(40) | 是 | `keyword_analysis` `outline_generation` `article_generation` `title_optimization` |
| api_base | text | 否 | 接口基址 |
| masked_api_key | varchar(120) | 否 | 脱敏 key |
| is_default | boolean | 是 | 是否默认 |
| status | varchar(20) | 是 | `active` `inactive` `error` |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, purpose)`

## 4.6 channels

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| channel_type | varchar(40) | 是 | `website_blog` `wechat_official` `zhihu_column` `medium` |
| channel_name | varchar(120) | 是 | 渠道显示名称 |
| account_name | varchar(120) | 否 | 账号名 |
| auth_status | varchar(20) | 是 | `connected` `expired` `invalid` |
| auth_payload | jsonb | 否 | 加密前原始认证信息的安全引用 |
| default_author | varchar(80) | 否 | 默认作者 |
| default_category | varchar(80) | 否 | 默认分类 |
| default_tags | jsonb | 否 | 默认标签 |
| default_cover_rule | varchar(80) | 否 | 默认封面规则 |
| is_default | boolean | 是 | 是否默认 |
| last_synced_at | timestamptz | 否 | 最近同步时间 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, channel_type)`

## 4.7 keyword_crawl_jobs

抓取任务记录。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| name | varchar(120) | 是 | 任务名 |
| source_type | varchar(40) | 是 | `suggestion` `related_search` `qa_hot` `competitor_site` `manual_import` |
| industry_topic | varchar(120) | 否 | 行业主题 |
| seed_keywords | jsonb | 否 | 种子词 |
| fetch_limit | int | 是 | 抓取上限 |
| dedupe_enabled | boolean | 是 | 是否去重 |
| status | varchar(20) | 是 | `queued` `running` `completed` `failed` |
| raw_count | int | 否 | 原始结果数 |
| deduped_count | int | 否 | 去重后数 |
| error_message | text | 否 | 失败原因 |
| started_at | timestamptz | 否 | 开始时间 |
| finished_at | timestamptz | 否 | 结束时间 |
| created_by | uuid | 是 | 创建人 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, status, created_at desc)`

## 4.8 keywords

一期核心表。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| crawl_job_id | uuid | 否 | 来源抓取任务 |
| keyword | varchar(255) | 是 | 关键词 |
| normalized_keyword | varchar(255) | 是 | 归一化关键词 |
| category | varchar(40) | 否 | `definition` `comparison` `decision` `scenario` `deployment` `brand_extension` |
| intent | varchar(40) | 否 | `awareness` `consideration` `decision` |
| industry | varchar(80) | 否 | 行业 |
| language | varchar(20) | 是 | `zh-CN` |
| source | varchar(40) | 否 | 来源类型 |
| priority_score | numeric(5,2) | 否 | 总分 |
| business_value_score | numeric(5,2) | 否 | 商业价值分 |
| geo_fit_score | numeric(5,2) | 否 | GEO 适配分 |
| content_fit_score | numeric(5,2) | 否 | 内容可写性分 |
| competition_level | varchar(20) | 否 | `low` `medium` `high` |
| recommended_content_type | varchar(30) | 否 | `article` `faq` `comparison_page` `scenario_page` |
| recommended_channel_types | jsonb | 否 | 推荐渠道数组 |
| suggested_titles | jsonb | 否 | 推荐标题方向 |
| status | varchar(20) | 是 | 关键词状态 |
| owner_user_id | uuid | 否 | 负责人 |
| last_scored_at | timestamptz | 否 | 最近打分时间 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `unique(workspace_id, normalized_keyword)`
- `index(workspace_id, status, priority_score desc)`
- `index(workspace_id, category, intent)`

## 4.9 keyword_sources

保留关键词来源细节，便于详情页展示。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| keyword_id | uuid | 是 | 关键词 ID |
| source_type | varchar(40) | 是 | 来源类型 |
| source_value | text | 否 | 原始来源内容 |
| rank_order | int | 否 | 位置排名 |
| extra_meta | jsonb | 否 | 扩展信息 |
| created_at | timestamptz | 是 | 创建时间 |

索引建议：

- `index(keyword_id, source_type)`

## 4.10 topic_ideas

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| keyword_id | uuid | 是 | 来源关键词 |
| title | varchar(255) | 是 | 选题标题 |
| content_type | varchar(30) | 是 | `article` `faq` `comparison_page` `scenario_page` |
| template_type | varchar(30) | 是 | `definition` `comparison` `scenario` `decision` |
| target_channels | jsonb | 否 | 目标渠道 |
| target_audience | varchar(120) | 否 | 目标用户 |
| core_messages | jsonb | 否 | 核心卖点数组 |
| required_terms | jsonb | 否 | 必带术语 |
| forbidden_terms | jsonb | 否 | 禁用表述 |
| cta_type | varchar(40) | 否 | CTA 类型 |
| priority | int | 否 | 优先级 1-5 |
| brand_fit | varchar(20) | 否 | `high` `medium` `low` |
| status | varchar(20) | 是 | 选题状态 |
| owner_user_id | uuid | 否 | 负责人 |
| created_by | uuid | 是 | 创建人 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, status, updated_at desc)`
- `index(keyword_id)`

## 4.11 content_templates

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 否 | 工作区 ID，空表示系统模板 |
| name | varchar(120) | 是 | 模板名称 |
| template_type | varchar(30) | 是 | 模板类型 |
| applicable_categories | jsonb | 否 | 适用关键词分类 |
| section_schema | jsonb | 是 | 标准章节结构 |
| required_blocks | jsonb | 否 | 必须模块 |
| default_cta | text | 否 | 默认 CTA |
| default_tone | varchar(40) | 否 | 默认语气 |
| forbidden_terms | jsonb | 否 | 模板级禁用词 |
| is_enabled | boolean | 是 | 是否启用 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, template_type)`

## 4.12 articles

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| topic_idea_id | uuid | 否 | 来源选题 |
| keyword_id | uuid | 否 | 来源关键词 |
| template_id | uuid | 否 | 模板 ID |
| title | varchar(255) | 是 | 标题 |
| subtitle | text | 否 | 副标题 |
| article_type | varchar(30) | 是 | 文章类型 |
| target_channel_types | jsonb | 否 | 目标渠道 |
| word_count | int | 否 | 正文字数 |
| outline_json | jsonb | 否 | 大纲 |
| content_markdown | text | 否 | 正文 |
| excerpt | text | 否 | 摘要 |
| seo_title | varchar(255) | 否 | SEO 标题 |
| seo_description | text | 否 | SEO 描述 |
| tags | jsonb | 否 | 标签 |
| cover_asset_url | text | 否 | 封面 |
| review_status | varchar(30) | 是 | 审核状态 |
| publish_status | varchar(30) | 是 | 发布状态 |
| last_reviewed_by | uuid | 否 | 最近审核人 |
| last_reviewed_at | timestamptz | 否 | 最近审核时间 |
| owner_user_id | uuid | 否 | 负责人 |
| created_by | uuid | 是 | 创建人 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, review_status, updated_at desc)`
- `index(workspace_id, publish_status, updated_at desc)`
- `index(topic_idea_id)`

## 4.13 article_versions

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| article_id | uuid | 是 | 文章 ID |
| version_no | int | 是 | 版本号 |
| generation_mode | varchar(30) | 否 | `manual` `ai_outline` `ai_full` `ai_regenerate` |
| title | varchar(255) | 否 | 标题快照 |
| outline_json | jsonb | 否 | 大纲快照 |
| content_markdown | text | 否 | 正文快照 |
| created_by | uuid | 是 | 创建人 |
| created_at | timestamptz | 是 | 创建时间 |

索引建议：

- `unique(article_id, version_no)`

## 4.14 article_reviews

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| article_id | uuid | 是 | 文章 ID |
| reviewer_user_id | uuid | 是 | 审核人 |
| action | varchar(30) | 是 | `pass` `reject` `request_revision` |
| reason_codes | jsonb | 否 | 原因码数组 |
| comments | text | 否 | 审核意见 |
| created_at | timestamptz | 是 | 创建时间 |

索引建议：

- `index(article_id, created_at desc)`

## 4.15 publish_tasks

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| name | varchar(120) | 是 | 任务名 |
| channel_id | uuid | 是 | 渠道 ID |
| publish_mode | varchar(20) | 是 | `immediate` `scheduled` |
| scheduled_at | timestamptz | 否 | 计划发布时间 |
| require_confirmation | boolean | 是 | 发布前确认 |
| auto_retry_failed | boolean | 是 | 自动重试失败项 |
| status | varchar(20) | 是 | 任务状态 |
| total_count | int | 是 | 总文章数 |
| success_count | int | 是 | 成功数 |
| failed_count | int | 是 | 失败数 |
| created_by | uuid | 是 | 创建人 |
| started_at | timestamptz | 否 | 开始时间 |
| finished_at | timestamptz | 否 | 结束时间 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(workspace_id, status, created_at desc)`
- `index(channel_id, scheduled_at)`

## 4.16 publish_task_items

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| publish_task_id | uuid | 是 | 发布任务 ID |
| article_id | uuid | 是 | 文章 ID |
| channel_id | uuid | 是 | 渠道 ID |
| status | varchar(20) | 是 | 发布项状态 |
| published_url | text | 否 | 外链地址 |
| external_post_id | varchar(160) | 否 | 渠道返回 ID |
| failure_reason_code | varchar(60) | 否 | 失败原因码 |
| failure_message | text | 否 | 失败详情 |
| published_at | timestamptz | 否 | 发布时间 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

索引建议：

- `index(publish_task_id, status)`
- `index(article_id, channel_id)`

## 4.17 usage_records

用于 Billing 和统计。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| usage_type | varchar(30) | 是 | `keyword_crawl` `article_generation` `publish` |
| quantity | numeric(10,2) | 是 | 数量 |
| unit | varchar(20) | 是 | 单位 |
| related_resource_type | varchar(40) | 否 | 关联资源类型 |
| related_resource_id | uuid | 否 | 关联资源 ID |
| occurred_at | timestamptz | 是 | 发生时间 |
| created_at | timestamptz | 是 | 创建时间 |

索引建议：

- `index(workspace_id, usage_type, occurred_at desc)`

## 4.18 operation_logs

一期建议保留基础操作日志。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| workspace_id | uuid | 是 | 工作区 ID |
| operator_user_id | uuid | 是 | 操作人 |
| resource_type | varchar(40) | 是 | 资源类型 |
| resource_id | uuid | 是 | 资源 ID |
| action | varchar(40) | 是 | 动作 |
| detail | jsonb | 否 | 明细 |
| created_at | timestamptz | 是 | 创建时间 |

索引建议：

- `index(workspace_id, resource_type, created_at desc)`

## 5. 数据关系

核心关系如下：

- 一个 `workspace` 有多个 `workspace_members`
- 一个 `workspace` 对应一份 `brand_profiles`
- 一个 `workspace` 有多个 `channels`
- 一个 `keyword_crawl_job` 可产生多个 `keywords`
- 一个 `keyword` 可生成多个 `topic_ideas`
- 一个 `topic_idea` 可生成多个 `articles`
- 一个 `article` 可有多个 `article_versions`
- 一个 `article` 可有多个 `article_reviews`
- 一个 `publish_task` 包含多个 `publish_task_items`
- 一个 `usage_record` 关联抓取、生成或发布资源

## 6. 接口清单

以下接口默认都在：

`/api/v1`

并默认要求：

- 登录态
- 通过当前 `workspace_id` 做数据隔离

## 6.1 Workspace / 成员

### GET `/workspaces/current`

返回当前工作区信息和套餐摘要。

### GET `/members`

返回成员列表。

查询参数：

- `role`
- `status`
- `page`
- `page_size`

### POST `/members`

邀请成员。

请求体：

```json
{
  "email": "editor@example.com",
  "name": "编辑A",
  "role": "editor"
}
```

### PATCH `/members/{member_id}`

更新角色或状态。

### DELETE `/members/{member_id}`

移除成员。

## 6.2 Brand / 模型 / 渠道配置

### GET `/brand-profile`

获取品牌知识配置。

### PUT `/brand-profile`

更新品牌知识配置。

### GET `/model-configs`

获取模型配置列表。

### POST `/model-configs`

新增模型配置。

### PATCH `/model-configs/{id}`

更新模型配置。

### GET `/channels`

获取渠道列表。

查询参数：

- `channel_type`
- `auth_status`

### POST `/channels`

新增渠道配置。

### PATCH `/channels/{id}`

更新渠道配置。

### POST `/channels/{id}/reconnect`

重新认证。

## 6.3 关键词抓取

### GET `/keyword-crawl-jobs`

抓取任务列表。

### POST `/keyword-crawl-jobs`

创建抓取任务。

请求体：

```json
{
  "name": "企业智能体相关词抓取",
  "source_type": "suggestion",
  "industry_topic": "企业智能体",
  "seed_keywords": ["企业智能体", "销售智能体"],
  "fetch_limit": 200,
  "dedupe_enabled": true
}
```

返回：

- `job_id`
- `status`

### GET `/keyword-crawl-jobs/{id}`

抓取任务详情。

### POST `/keyword-crawl-jobs/{id}/rerun`

重新执行抓取任务。

## 6.4 关键词管理

### GET `/keywords`

关键词列表。

查询参数：

- `keyword`
- `category`
- `intent`
- `status`
- `source`
- `score_min`
- `score_max`
- `page`
- `page_size`

### GET `/keywords/{id}`

关键词详情。

返回：

- 基础字段
- 打分明细
- 来源明细
- 推荐标题方向
- 相关关键词

### PATCH `/keywords/{id}`

更新关键词基础信息。

可更新字段：

- `category`
- `intent`
- `industry`
- `status`
- `owner_user_id`

### POST `/keywords/{id}/score`

重新打分。

返回：

- 4 个维度分数
- 总分
- 推荐内容类型
- 推荐标题方向

### POST `/keywords/batch`

批量操作。

请求体：

```json
{
  "ids": ["uuid1", "uuid2"],
  "action": "move_to_watchlist"
}
```

建议支持动作：

- `assign_category`
- `move_to_watchlist`
- `ignore`
- `generate_topic`
- `export`

## 6.5 选题管理

### GET `/topic-ideas`

选题列表。

查询参数：

- `status`
- `template_type`
- `owner_user_id`
- `keyword_id`

### POST `/topic-ideas`

手动创建选题。

### POST `/topic-ideas/from-keywords`

从关键词批量生成选题。

请求体：

```json
{
  "keyword_ids": ["uuid1", "uuid2"],
  "template_type": "definition"
}
```

### GET `/topic-ideas/{id}`

选题详情。

### PATCH `/topic-ideas/{id}`

更新选题。

### POST `/topic-ideas/{id}/generate-outline`

异步生成大纲。

返回：

- `job_id`
- `topic_idea_id`

### POST `/topic-ideas/{id}/generate-article`

异步生成草稿。

请求体可选：

```json
{
  "regenerate": false
}
```

## 6.6 模板管理

### GET `/content-templates`

模板列表。

### POST `/content-templates`

新增模板。

### PATCH `/content-templates/{id}`

更新模板。

### POST `/content-templates/{id}/toggle`

启用或停用模板。

## 6.7 文章管理

### GET `/articles`

文章列表。

查询参数：

- `review_status`
- `publish_status`
- `article_type`
- `keyword_id`
- `owner_user_id`

### POST `/articles`

手动新建文章。

### GET `/articles/{id}`

文章详情。

返回：

- 基础信息
- 正文
- 版本列表
- 最近审核记录
- 发布摘要

### PATCH `/articles/{id}`

更新文章。

### POST `/articles/{id}/submit-review`

提交审核。

效果：

- `review_status` 更新为 `review_pending`

### POST `/articles/{id}/review`

审核文章。

请求体：

```json
{
  "action": "pass",
  "reason_codes": [],
  "comments": "结构完整，可发布"
}
```

支持动作：

- `pass`
- `reject`
- `request_revision`

### POST `/articles/{id}/duplicate`

复制文章。

### GET `/articles/{id}/versions`

文章版本列表。

### POST `/articles/{id}/regenerate`

重新生成全文或某一部分。

## 6.8 发布任务

### GET `/publish-tasks`

发布任务列表。

查询参数：

- `status`
- `channel_id`
- `publish_mode`

### POST `/publish-tasks`

创建发布任务。

请求体：

```json
{
  "name": "知乎专栏周二排期",
  "channel_id": "uuid-channel",
  "article_ids": ["uuid-article-1", "uuid-article-2"],
  "publish_mode": "scheduled",
  "scheduled_at": "2026-04-18T10:00:00+08:00",
  "require_confirmation": true,
  "auto_retry_failed": false
}
```

### GET `/publish-tasks/{id}`

发布任务详情。

### POST `/publish-tasks/{id}/start`

启动任务。

### POST `/publish-tasks/{id}/cancel`

取消任务。

### POST `/publish-tasks/{id}/retry-failed`

重试失败项。

### GET `/publish-records`

发布记录列表。

查询参数：

- `channel_id`
- `status`
- `from`
- `to`

## 6.9 Dashboard / Analytics

### GET `/dashboard/summary`

返回首页核心卡片数据。

返回建议包含：

- 本周新增关键词数
- 高优先级关键词数
- 本周生成文章数
- 本周发布成功率

### GET `/dashboard/keyword-trend`

返回关键词趋势图数据。

### GET `/dashboard/content-funnel`

返回内容漏斗数据。

### GET `/dashboard/top-keywords`

返回高优先级关键词 Top 列表。

### GET `/dashboard/recent-publishes`

返回最近发布日志。

### GET `/analytics/keywords`

返回关键词分析数据。

### GET `/analytics/content`

返回内容分析数据。

### GET `/analytics/channels`

返回渠道分析数据。

## 6.10 Billing

### GET `/billing/summary`

返回套餐和额度摘要。

### GET `/billing/usage-records`

返回用量记录。

查询参数：

- `usage_type`
- `from`
- `to`

### GET `/billing/invoices`

返回账单记录。

## 7. 异步任务设计

## 7.1 任务类型

一期建议统一一张任务表或统一任务队列，任务类型包括：

- `keyword_crawl`
- `keyword_score`
- `generate_outline`
- `generate_article`
- `publish_task_run`

## 7.2 任务状态

- `queued`
- `running`
- `completed`
- `failed`
- `canceled`

## 7.3 任务执行原则

- 抓取、生成、发布都异步
- 任务失败必须保留错误明细
- 可重试任务必须幂等
- 发布任务要支持部分成功

## 7.4 前端轮询建议

前端不强依赖 websocket，一期可用轮询：

- 列表页轮询 10 到 15 秒
- 详情页轮询 5 秒
- 长任务完成后自动刷新当前资源

## 8. 页面与接口映射

## 8.1 Dashboard

- `GET /dashboard/summary`
- `GET /dashboard/keyword-trend`
- `GET /dashboard/content-funnel`
- `GET /dashboard/top-keywords`
- `GET /dashboard/recent-publishes`

## 8.2 Keyword Center

- `GET /keyword-crawl-jobs`
- `POST /keyword-crawl-jobs`
- `GET /keywords`
- `GET /keywords/{id}`
- `PATCH /keywords/{id}`
- `POST /keywords/{id}/score`
- `POST /keywords/batch`
- `POST /topic-ideas/from-keywords`

## 8.3 Content Center

- `GET /topic-ideas`
- `POST /topic-ideas`
- `PATCH /topic-ideas/{id}`
- `POST /topic-ideas/{id}/generate-outline`
- `POST /topic-ideas/{id}/generate-article`
- `GET /articles`
- `GET /articles/{id}`
- `PATCH /articles/{id}`
- `POST /articles/{id}/submit-review`
- `POST /articles/{id}/review`
- `GET /articles/{id}/versions`

## 8.4 Distribution Tasks

- `GET /channels`
- `POST /channels`
- `PATCH /channels/{id}`
- `GET /publish-tasks`
- `POST /publish-tasks`
- `GET /publish-tasks/{id}`
- `POST /publish-tasks/{id}/start`
- `POST /publish-tasks/{id}/cancel`
- `POST /publish-tasks/{id}/retry-failed`
- `GET /publish-records`

## 8.5 Settings / Billing

- `GET /brand-profile`
- `PUT /brand-profile`
- `GET /model-configs`
- `POST /model-configs`
- `PATCH /model-configs/{id}`
- `GET /billing/summary`
- `GET /billing/usage-records`
- `GET /billing/invoices`

## 9. 前后端联调重点

联调时最容易出问题的是以下几块：

- 状态字段不一致
- 批量操作的幂等性
- 大纲和正文生成的异步回写
- 发布失败原因回传不清楚
- 列表页筛选和统计口径不一致

建议先联调这 5 条链路：

1. 抓取任务创建 -> 关键词入库 -> 列表展示
2. 关键词打分 -> 进入机会池 -> 批量生成选题
3. 选题生成大纲 -> 生成文章 -> 保存版本
4. 文章提交审核 -> 审核通过 -> 进入待发布
5. 创建发布任务 -> 执行 -> 回写成功/失败结果

## 10. 一期最小建表清单

如果要最小起步，一期最少先建以下表：

- `workspaces`
- `users`
- `workspace_members`
- `brand_profiles`
- `model_configs`
- `channels`
- `keyword_crawl_jobs`
- `keywords`
- `keyword_sources`
- `topic_ideas`
- `content_templates`
- `articles`
- `article_versions`
- `article_reviews`
- `publish_tasks`
- `publish_task_items`
- `usage_records`

## 11. 一句话结论

这份设计的重点不是把接口铺得很大，而是保证“关键词 -> 选题 -> 文章 -> 审核 -> 发布 -> 统计”这条链路一次打通，并且后续还能平滑扩展到更完整的 GEO 能力。
