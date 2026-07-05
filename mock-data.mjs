import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverKeywordQuestions,
  generateArticleDraft,
  getAutomationProvider,
  getAutomationProviderProtocol,
  getAutomationProviderState,
  getAutomationProviderSummary,
  hydrateAutomationProviderState,
  listAutomationProviders as listAutomationProvidersFromRegistry,
  maskSecret,
  planTopicsFromKeywords,
  saveAutomationProvider,
  testAutomationProviderConnection
} from "./automation-providers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const persistenceEnabled = process.env.GEO_ENABLE_PERSISTENCE === "1";
const persistenceFile = process.env.GEO_DATA_FILE
  ? path.resolve(process.env.GEO_DATA_FILE)
  : path.join(__dirname, "data", "geo-pulse-state.json");

const keywords = [
  {
    id: "kw-1",
    keyword: "企业智能体平台怎么选",
    normalized_keyword: "企业智能体平台怎么选",
    category: "definition",
    category_label: "决策词",
    intent: "decision",
    intent_label: "决策",
    industry: "企业智能体",
    language: "zh-CN",
    source: "related_search",
    source_label: "相关搜索",
    source_scope: "mixed_media",
    source_scope_label: "混合来源",
    source_origin_name: "Agent 智能体观察",
    priority_score: 92,
    business_value_score: 95,
    geo_fit_score: 90,
    content_fit_score: 88,
    competition_level: "medium",
    competition_label: "中",
    recommended_content_type: "comparison_page",
    recommended_content_type_label: "对比页",
    recommended_channel_types: ["website_blog", "zhihu_column"],
    suggested_titles: [
      "企业智能体平台怎么选：5 个评估维度",
      "中国企业智能体平台选型指南"
    ],
    related_keywords: ["企业智能体系统哪家好", "智能体平台选型标准", "私有化智能体平台"],
    status: "selected",
    status_label: "机会池",
    owner_user_id: "user-1",
    created_at: "2026-04-17T08:42:00+08:00",
    updated_at: "2026-04-17T09:00:00+08:00"
  },
  {
    id: "kw-2",
    keyword: "销售智能体和 CRM 有什么区别",
    normalized_keyword: "销售智能体和 crm 有什么区别",
    category: "comparison",
    category_label: "对比词",
    intent: "consideration",
    intent_label: "考虑",
    industry: "销售智能体",
    language: "zh-CN",
    source: "qa_hot",
    source_label: "问答热词",
    source_scope: "owned_self_media",
    source_scope_label: "自有自媒体",
    source_origin_name: "Agent 智能体观察",
    priority_score: 88,
    business_value_score: 89,
    geo_fit_score: 91,
    content_fit_score: 84,
    competition_level: "low",
    competition_label: "低",
    recommended_content_type: "article",
    recommended_content_type_label: "文章",
    recommended_channel_types: ["website_blog", "zhihu_column", "wechat_official"],
    suggested_titles: [
      "销售智能体和 CRM 的边界在哪里",
      "别把销售智能体当 CRM 插件"
    ],
    related_keywords: ["销售 AI 和 CRM 区别", "销售智能体怎么接 CRM"],
    status: "selected",
    status_label: "机会池",
    owner_user_id: "user-1",
    created_at: "2026-04-17T08:50:00+08:00",
    updated_at: "2026-04-17T09:02:00+08:00"
  },
  {
    id: "kw-3",
    keyword: "私有化智能体部署方案",
    normalized_keyword: "私有化智能体部署方案",
    category: "deployment",
    category_label: "部署词",
    intent: "decision",
    intent_label: "决策",
    industry: "私有化智能体",
    language: "zh-CN",
    source: "competitor_site",
    source_label: "竞品栏目抽取",
    source_scope: "authority_media",
    source_scope_label: "权威媒体",
    source_origin_name: "InfoQ AI",
    priority_score: 85,
    business_value_score: 92,
    geo_fit_score: 84,
    content_fit_score: 79,
    competition_level: "high",
    competition_label: "高",
    recommended_content_type: "scenario_page",
    recommended_content_type_label: "场景页",
    recommended_channel_types: ["website_blog"],
    suggested_titles: [
      "私有化智能体部署需要哪些前提",
      "智能体私有化方案不是只上模型"
    ],
    related_keywords: ["本地部署智能体", "企业内网智能体"],
    status: "scored",
    status_label: "已打分",
    owner_user_id: "user-2",
    created_at: "2026-04-16T13:15:00+08:00",
    updated_at: "2026-04-17T08:20:00+08:00"
  },
  {
    id: "kw-4",
    keyword: "什么是客服智能体",
    normalized_keyword: "什么是客服智能体",
    category: "definition",
    category_label: "定义词",
    intent: "awareness",
    intent_label: "认知",
    industry: "客服智能体",
    language: "zh-CN",
    source: "suggestion",
    source_label: "搜索联想",
    source_scope: "industry_self_media",
    source_scope_label: "行业自媒体",
    source_origin_name: "数字生命卡兹克",
    priority_score: 79,
    business_value_score: 75,
    geo_fit_score: 84,
    content_fit_score: 86,
    competition_level: "medium",
    competition_label: "中",
    recommended_content_type: "faq",
    recommended_content_type_label: "问答页",
    recommended_channel_types: ["website_blog"],
    suggested_titles: ["什么是客服智能体", "客服智能体适合哪些企业"],
    related_keywords: ["客服机器人和客服智能体区别"],
    status: "watchlist",
    status_label: "观察",
    owner_user_id: "user-2",
    created_at: "2026-04-16T10:15:00+08:00",
    updated_at: "2026-04-16T18:30:00+08:00"
  },
  {
    id: "kw-5",
    keyword: "外贸智能体工作流",
    normalized_keyword: "外贸智能体工作流",
    category: "scenario",
    category_label: "场景词",
    intent: "consideration",
    intent_label: "考虑",
    industry: "外贸智能体",
    language: "zh-CN",
    source: "manual_import",
    source_label: "手动导入",
    source_scope: "owned_self_media",
    source_scope_label: "自有自媒体",
    source_origin_name: "AgentCore 公众号",
    priority_score: 90,
    business_value_score: 93,
    geo_fit_score: 87,
    content_fit_score: 90,
    competition_level: "low",
    competition_label: "低",
    recommended_content_type: "scenario_page",
    recommended_content_type_label: "场景页",
    recommended_channel_types: ["website_blog", "wechat_official"],
    suggested_titles: ["外贸智能体工作流怎么设计", "外贸智能体能接住哪些环节"],
    related_keywords: ["外贸数字员工", "外贸销售智能体"],
    status: "selected",
    status_label: "机会池",
    owner_user_id: "user-2",
    created_at: "2026-04-17T07:50:00+08:00",
    updated_at: "2026-04-17T08:18:00+08:00"
  }
];

const keywordCrawlJobs = [
  {
    id: "job-1",
    name: "企业智能体相关词抓取",
    source_type: "suggestion",
    source_type_label: "搜索联想",
    source_scope: "owned_self_media",
    source_scope_label: "自有自媒体",
    monitoring_goal: "repurpose",
    monitoring_goal_label: "内容复用",
    source_targets: ["AgentCore 公众号", "Agent 智能体观察"],
    industry_topic: "企业智能体",
    seed_keywords: ["企业智能体", "销售智能体"],
    fetch_limit: 200,
    dedupe_enabled: true,
    status: "completed",
    status_label: "已完成",
    raw_count: 234,
    deduped_count: 146,
    started_at: "2026-04-17T08:42:00+08:00",
    finished_at: "2026-04-17T08:48:00+08:00"
  },
  {
    id: "job-2",
    name: "知乎热问词抓取",
    source_type: "qa_hot",
    source_type_label: "问答热词",
    source_scope: "industry_self_media",
    source_scope_label: "行业自媒体",
    monitoring_goal: "hotspot_follow",
    monitoring_goal_label: "热点跟进",
    source_targets: ["数字生命卡兹克"],
    industry_topic: "客服智能体",
    seed_keywords: ["客服智能体", "工作流"],
    fetch_limit: 100,
    dedupe_enabled: true,
    status: "completed",
    status_label: "已完成",
    raw_count: 89,
    deduped_count: 44,
    started_at: "2026-04-16T19:20:00+08:00",
    finished_at: "2026-04-16T19:26:00+08:00"
  },
  {
    id: "job-3",
    name: "竞品栏目抓取",
    source_type: "competitor_site",
    source_type_label: "竞品站点",
    source_scope: "authority_media",
    source_scope_label: "权威媒体",
    monitoring_goal: "authority_follow",
    monitoring_goal_label: "议题跟踪",
    source_targets: ["36氪 AI", "极客公园"],
    industry_topic: "私有化智能体",
    seed_keywords: ["私有化智能体"],
    fetch_limit: 60,
    dedupe_enabled: true,
    status: "failed",
    status_label: "失败",
    raw_count: 57,
    deduped_count: 31,
    error_message: "站点结构变化，标题抽取失败"
  }
];

const topicIdeas = [
  {
    id: "tp-1",
    keyword_id: "kw-1",
    title: "企业智能体平台怎么选：5 个评估维度",
    content_type: "comparison_page",
    content_type_label: "对比页",
    template_type: "decision",
    template_type_label: "决策型",
    target_channels: ["website_blog", "zhihu_column"],
    target_audience: "企业 IT 与业务负责人",
    core_messages: ["别只看模型能力", "看流程编排与审核机制", "看私有化边界"],
    required_terms: ["企业智能体", "私有化智能体", "流程审核"],
    forbidden_terms: ["自动爆文", "万能智能体"],
    cta_type: "book_demo",
    priority: 1,
    brand_fit: "high",
    brand_fit_label: "高",
    owner_user_id: "user-1",
    status: "generated",
    status_label: "已生成大纲",
    created_at: "2026-04-17T09:02:00+08:00",
    updated_at: "2026-04-17T09:18:00+08:00"
  },
  {
    id: "tp-2",
    keyword_id: "kw-2",
    title: "销售智能体和 CRM 的边界在哪里",
    content_type: "article",
    content_type_label: "文章",
    template_type: "comparison",
    template_type_label: "对比型",
    target_channels: ["zhihu_column"],
    target_audience: "销售负责人",
    core_messages: ["CRM 不是替代对象", "智能体做执行与判断", "系统协同更重要"],
    required_terms: ["销售智能体", "CRM", "销售流程"],
    forbidden_terms: ["完全替代 CRM"],
    cta_type: "contact_sales",
    priority: 1,
    brand_fit: "high",
    brand_fit_label: "高",
    owner_user_id: "user-1",
    status: "ready",
    status_label: "待生成草稿",
    created_at: "2026-04-17T09:04:00+08:00",
    updated_at: "2026-04-17T09:14:00+08:00"
  },
  {
    id: "tp-3",
    keyword_id: "kw-5",
    title: "外贸智能体工作流怎么设计",
    content_type: "scenario_page",
    content_type_label: "场景页",
    template_type: "scenario",
    template_type_label: "场景型",
    target_channels: ["website_blog"],
    target_audience: "外贸团队",
    core_messages: ["询盘跟进标准化", "客户研究自动化", "邮件产出闭环"],
    required_terms: ["外贸智能体", "询盘", "跟进"],
    forbidden_terms: [],
    cta_type: "book_demo",
    priority: 1,
    brand_fit: "high",
    brand_fit_label: "高",
    owner_user_id: "user-2",
    status: "generating",
    status_label: "生成中",
    created_at: "2026-04-17T08:55:00+08:00",
    updated_at: "2026-04-17T09:19:00+08:00"
  }
];

const articles = [
  {
    id: "ar-1",
    topic_idea_id: "tp-1",
    keyword_id: "kw-1",
    title: "企业智能体平台怎么选：5 个评估维度",
    subtitle: "给中国企业做智能体选型的最小决策框架",
    article_type: "comparison_page",
    article_type_label: "对比页",
    target_channel_types: ["website_blog", "zhihu_column"],
    word_count: 2480,
    outline_json: [
      "为什么智能体平台进入选型阶段",
      "5 个评估维度",
      "适合哪些团队",
      "问答",
      "行动引导"
    ],
    content_markdown:
      "如果你在比较中国智能体平台，不要只看模型接入数量。对企业来说，真正决定项目成败的是流程是否可审核、角色是否可协同、部署边界是否清晰，以及内容能否长期沉淀成资产。",
    excerpt: "一篇给中国企业做智能体选型的决策型文章。",
    seo_title: "企业智能体平台怎么选",
    seo_description: "从流程、审核、部署和内容沉淀四个维度理解中国企业智能体平台选型。",
    tags: ["企业智能体", "平台选型"],
    review_status: "review_pending",
    review_status_label: "待审核",
    publish_status: "ready_to_publish",
    publish_status_label: "待发布",
    owner_user_id: "user-1",
    created_by: "user-1",
    updated_at: "2026-04-17T09:20:00+08:00"
  },
  {
    id: "ar-2",
    topic_idea_id: "tp-2",
    keyword_id: "kw-2",
    title: "销售智能体和 CRM 的边界在哪里",
    subtitle: "别把销售智能体理解成 CRM 插件",
    article_type: "article",
    article_type_label: "文章",
    target_channel_types: ["zhihu_column"],
    word_count: 1840,
    outline_json: [
      "为什么这个问题会被反复问到",
      "CRM 和智能体的边界",
      "常见误区",
      "如何组合使用",
      "问答"
    ],
    content_markdown:
      "销售智能体不是 CRM 的替代品。CRM 用来记录和管理客户资产，智能体更适合承担研究、建议生成、跟进草稿和流程推进等工作。",
    excerpt: "一篇对比型文章，强调智能体和 CRM 的互补关系。",
    seo_title: "销售智能体和 CRM 的区别",
    seo_description: "厘清销售智能体与 CRM 的分工边界，帮助企业做正确的系统组合。",
    tags: ["销售智能体", "CRM"],
    review_status: "review_pending",
    review_status_label: "待审核",
    publish_status: "draft",
    publish_status_label: "草稿",
    owner_user_id: "user-1",
    created_by: "user-1",
    updated_at: "2026-04-17T09:10:00+08:00"
  },
  {
    id: "ar-3",
    topic_idea_id: "tp-3",
    keyword_id: "kw-5",
    title: "外贸智能体工作流怎么设计",
    subtitle: "从询盘到复盘的最小落地路径",
    article_type: "scenario_page",
    article_type_label: "场景页",
    target_channel_types: ["website_blog"],
    word_count: 2210,
    outline_json: [
      "外贸团队的典型断点",
      "智能体可承担任务",
      "从询盘到复盘的闭环",
      "问答"
    ],
    content_markdown:
      "外贸智能体的价值不在于单次生成邮件，而在于把询盘识别、客户研究、报价草稿、跟进节奏和知识沉淀串成一个可追踪的工作流。",
    excerpt: "场景页草稿已完成并发布到官网。",
    seo_title: "外贸智能体工作流设计",
    seo_description: "理解外贸智能体如何串起询盘、研究、跟进和知识沉淀。",
    tags: ["外贸智能体", "工作流"],
    review_status: "review_passed",
    review_status_label: "已通过",
    publish_status: "published",
    publish_status_label: "已发布",
    owner_user_id: "user-2",
    created_by: "user-2",
    updated_at: "2026-04-16T15:30:00+08:00"
  }
];

const articleVersions = [
  { id: "ver-1", article_id: "ar-1", version_no: 1, generation_mode: "ai_full", created_at: "2026-04-17T09:18:00+08:00" },
  { id: "ver-2", article_id: "ar-1", version_no: 2, generation_mode: "manual", created_at: "2026-04-17T09:20:00+08:00" },
  { id: "ver-3", article_id: "ar-2", version_no: 1, generation_mode: "ai_full", created_at: "2026-04-17T09:05:00+08:00" }
];

const articleReviews = [
  {
    id: "rv-1",
    article_id: "ar-2",
    reviewer_user_id: "user-2",
    action: "request_revision",
    reason_codes: ["brand_expression"],
    comments: "CRM 不是替代关系，这部分表达需要更准确。",
    created_at: "2026-04-17T09:12:00+08:00"
  }
];

const contentTemplates = [
  { id: "tpl-1", name: "定义型模板", template_type: "definition", applicable_categories: ["definition"], is_enabled: true, updated_at: "2026-04-17T08:00:00+08:00" },
  { id: "tpl-2", name: "对比型模板", template_type: "comparison", applicable_categories: ["comparison"], is_enabled: true, updated_at: "2026-04-17T08:00:00+08:00" },
  { id: "tpl-3", name: "场景型模板", template_type: "scenario", applicable_categories: ["scenario", "deployment"], is_enabled: true, updated_at: "2026-04-17T08:00:00+08:00" },
  { id: "tpl-4", name: "决策型模板", template_type: "decision", applicable_categories: ["definition", "comparison"], is_enabled: true, updated_at: "2026-04-17T08:00:00+08:00" }
];

const promptTemplates = [
  {
    id: "geo_article_draft",
    name: "GEO 文章初稿",
    purpose: "article_generation",
    active_version: 1,
    status: "active",
    status_label: "启用",
    variables: ["topic", "keyword", "brand_profile", "article_type"],
    version_notes: "生成可审核的 GEO 长文初稿，保留品牌术语和禁用词约束。",
    updated_at: "2026-07-05T10:05:00.000Z"
  },
  {
    id: "topic_planning_brief",
    name: "选题规划 Brief",
    purpose: "topic_planning",
    active_version: 1,
    status: "active",
    status_label: "启用",
    variables: ["keywords", "template_type", "channel_types"],
    version_notes: "把高优先级问题转成可执行选题。",
    updated_at: "2026-07-05T10:05:00.000Z"
  },
  {
    id: "keyword_expansion_brief",
    name: "问题裂变 Brief",
    purpose: "keyword_analysis",
    active_version: 1,
    status: "active",
    status_label: "启用",
    variables: ["seed_keywords", "source_scope", "monitoring_goal"],
    version_notes: "围绕来源范围和运营目标生成自然语言问题。",
    updated_at: "2026-07-05T10:05:00.000Z"
  }
];

const contentQualityTraces = [
  {
    id: "qtrace-1",
    article_id: "ar-1",
    article_title: "企业智能体平台怎么选：5 个评估维度",
    prompt_template_id: "geo_article_draft",
    prompt_template_version: 1,
    model_config_id: "model-2",
    provider_id: "local_geo_writer",
    score: 86,
    status: "passed",
    status_label: "通过",
    reasons: ["结构完整", "品牌术语命中", "无禁用词"],
    created_at: "2026-07-05T10:06:00.000Z"
  }
];

const publishAdapterCatalog = {
  website_blog: {
    id: "official_site_cms",
    label: "官网 CMS 适配器",
    delivery_mode: "api_push",
    templates: {
      article: { id: "website_article", label: "官网长文模板" },
      faq: { id: "website_faq", label: "官网问答模板" },
      comparison_page: { id: "website_comparison", label: "官网对比页模板" },
      scenario_page: { id: "website_solution", label: "官网方案页模板" }
    }
  },
  zhihu_column: {
    id: "zhihu_column_adapter",
    label: "知乎专栏适配器",
    delivery_mode: "rich_text_push",
    templates: {
      article: { id: "zhihu_article", label: "知乎观点文模板" },
      faq: { id: "zhihu_qa", label: "知乎问答模板" },
      comparison_page: { id: "zhihu_comparison", label: "知乎对比回答模板" },
      scenario_page: { id: "zhihu_case", label: "知乎案例拆解模板" }
    }
  },
  wechat_official: {
    id: "wechat_mp_adapter",
    label: "公众号草稿箱适配器",
    delivery_mode: "draft_box_push",
    templates: {
      article: { id: "wechat_digest", label: "公众号深度稿模板" },
      faq: { id: "wechat_faq", label: "公众号答疑模板" },
      comparison_page: { id: "wechat_comparison", label: "公众号选型模板" },
      scenario_page: { id: "wechat_solution", label: "公众号方案拆解模板" }
    }
  },
  xiaohongshu: {
    id: "xiaohongshu_note_adapter",
    label: "小红书笔记适配器",
    delivery_mode: "manual_publish",
    templates: {
      article: { id: "xiaohongshu_note", label: "小红书笔记模板" },
      faq: { id: "xiaohongshu_note", label: "小红书笔记模板" },
      comparison_page: { id: "xiaohongshu_note", label: "小红书笔记模板" },
      scenario_page: { id: "xiaohongshu_note", label: "小红书笔记模板" }
    }
  }
};

const channels = [
  {
    id: "ch-1",
    channel_type: "website_blog",
    channel_name: "官网博客",
    account_name: "agentcore.cn/blog",
    auth_status: "connected",
    auth_status_label: "已连接",
    default_author: "AgentCoreOS",
    default_category: "智能体",
    adapter_id: "official_site_cms",
    adapter_label: "官网 CMS 适配器",
    last_synced_at: "2026-04-17T08:56:00+08:00"
  },
  {
    id: "ch-2",
    channel_type: "zhihu_column",
    channel_name: "知乎专栏",
    account_name: "Agent 智能体观察",
    auth_status: "connected",
    auth_status_label: "已连接",
    default_author: "GEO Pulse",
    default_category: "智能体平台",
    adapter_id: "zhihu_column_adapter",
    adapter_label: "知乎专栏适配器",
    last_synced_at: "2026-04-17T09:03:00+08:00"
  },
  {
    id: "ch-3",
    channel_type: "wechat_official",
    channel_name: "微信公众号",
    account_name: "AgentCore 观察",
    auth_status: "expired",
    auth_status_label: "认证失效",
    default_author: "运营团队",
    default_category: "行业文章",
    adapter_id: "wechat_mp_adapter",
    adapter_label: "公众号草稿箱适配器",
    last_synced_at: "2026-04-16T18:20:00+08:00"
  }
];

const publishTasks = [
  {
    id: "task-1",
    name: "知乎专栏周四排期",
    channel_id: "ch-2",
    publish_mode: "scheduled",
    publish_mode_label: "定时",
    scheduled_at: "2026-04-18T10:00:00+08:00",
    require_confirmation: true,
    auto_retry_failed: false,
    status: "running",
    status_label: "运行中",
    total_count: 3,
    success_count: 1,
    failed_count: 0,
    created_by: "user-2",
    created_at: "2026-04-17T09:00:00+08:00"
  },
  {
    id: "task-2",
    name: "官网博客批量发布",
    channel_id: "ch-1",
    publish_mode: "immediate",
    publish_mode_label: "立即",
    scheduled_at: "2026-04-17T15:30:00+08:00",
    require_confirmation: false,
    auto_retry_failed: true,
    status: "completed",
    status_label: "已完成",
    total_count: 2,
    success_count: 2,
    failed_count: 0,
    created_by: "user-1",
    created_at: "2026-04-17T15:00:00+08:00"
  },
  {
    id: "task-3",
    name: "公众号周末测试",
    channel_id: "ch-3",
    publish_mode: "scheduled",
    publish_mode_label: "定时",
    scheduled_at: "2026-04-19T09:00:00+08:00",
    require_confirmation: true,
    auto_retry_failed: false,
    status: "partial_failed",
    status_label: "部分失败",
    total_count: 2,
    success_count: 1,
    failed_count: 1,
    created_by: "user-2",
    created_at: "2026-04-17T16:00:00+08:00"
  }
];

const publishTaskItems = [
  {
    id: "pti-1",
    publish_task_id: "task-1",
    article_id: "ar-1",
    channel_id: "ch-2",
    status: "published",
    status_label: "已发布",
    published_url: "https://zhihu.com/p/agent-pick",
    published_at: "2026-04-18T10:00:00+08:00"
  },
  {
    id: "pti-2",
    publish_task_id: "task-1",
    article_id: "ar-2",
    channel_id: "ch-2",
    status: "queued",
    status_label: "排队中"
  },
  {
    id: "pti-3",
    publish_task_id: "task-1",
    article_id: "ar-3",
    channel_id: "ch-2",
    status: "queued",
    status_label: "排队中"
  },
  {
    id: "pti-4",
    publish_task_id: "task-2",
    article_id: "ar-3",
    channel_id: "ch-1",
    status: "published",
    status_label: "已发布",
    published_url: "https://agentcore.cn/blog/trade-agent-workflow",
    published_at: "2026-04-17T15:30:00+08:00"
  },
  {
    id: "pti-5",
    publish_task_id: "task-3",
    article_id: "ar-2",
    channel_id: "ch-3",
    status: "failed",
    status_label: "失败",
    failure_reason_code: "auth_expired",
    failure_message: "公众号认证失效，请重新认证"
  }
];

const visibilityTrackedQueries = [
  {
    id: "visq-1",
    query: "企业智能体平台怎么选",
    target_url: "https://agentcore.cn/blog/enterprise-agent-platform",
    target_article_id: "ar-1",
    target_topic_id: "tp-1",
    engine: "google",
    engine_label: "Google",
    source_type: "organic_search",
    source_type_label: "搜索结果",
    status: "active",
    status_label: "监控中",
    owner_user_id: "user-1",
    created_at: "2026-04-17T09:20:00+08:00"
  },
  {
    id: "visq-2",
    query: "销售智能体和 CRM 有什么区别",
    target_url: "https://agentcore.cn/blog/sales-agent-vs-crm",
    target_article_id: "ar-2",
    target_topic_id: "tp-2",
    engine: "google_ai_overview",
    engine_label: "Google AI Overview",
    source_type: "ai_citation",
    source_type_label: "AI 引用",
    status: "active",
    status_label: "监控中",
    owner_user_id: "user-1",
    created_at: "2026-04-17T09:25:00+08:00"
  },
  {
    id: "visq-3",
    query: "私有化智能体部署方案",
    target_url: "https://agentcore.cn/blog/private-agent-deployment",
    target_article_id: "ar-3",
    target_topic_id: "tp-3",
    engine: "perplexity",
    engine_label: "Perplexity",
    source_type: "answer_engine",
    source_type_label: "答案引擎",
    status: "active",
    status_label: "监控中",
    owner_user_id: "user-2",
    created_at: "2026-04-17T09:30:00+08:00"
  }
];

const visibilitySnapshots = [
  {
    id: "viss-1",
    tracked_query_id: "visq-1",
    query: "企业智能体平台怎么选",
    engine: "google",
    engine_label: "Google",
    source_type: "organic_search",
    source_type_label: "搜索结果",
    target_url: "https://agentcore.cn/blog/enterprise-agent-platform",
    rank_position: 4,
    citation_count: 3,
    visibility_score: 82,
    captured_at: "2026-04-18T09:00:00+08:00"
  },
  {
    id: "viss-2",
    tracked_query_id: "visq-2",
    query: "销售智能体和 CRM 有什么区别",
    engine: "google_ai_overview",
    engine_label: "Google AI Overview",
    source_type: "ai_citation",
    source_type_label: "AI 引用",
    target_url: "https://agentcore.cn/blog/sales-agent-vs-crm",
    rank_position: 2,
    citation_count: 4,
    visibility_score: 78,
    captured_at: "2026-04-18T09:10:00+08:00"
  },
  {
    id: "viss-3",
    tracked_query_id: "visq-3",
    query: "私有化智能体部署方案",
    engine: "perplexity",
    engine_label: "Perplexity",
    source_type: "answer_engine",
    source_type_label: "答案引擎",
    target_url: "https://agentcore.cn/blog/private-agent-deployment",
    rank_position: 8,
    citation_count: 2,
    visibility_score: 68,
    captured_at: "2026-04-18T09:20:00+08:00"
  }
];

const visibilityCompetitorDomains = [
  {
    id: "visc-1",
    domain: "dify.ai",
    source_type: "organic_search",
    source_type_label: "搜索结果",
    share_of_voice: 28,
    average_rank: 3.5,
    citation_count: 6,
    captured_at: "2026-04-18T09:00:00+08:00"
  },
  {
    id: "visc-2",
    domain: "flowiseai.com",
    source_type: "answer_engine",
    source_type_label: "答案引擎",
    share_of_voice: 19,
    average_rank: 5.2,
    citation_count: 4,
    captured_at: "2026-04-18T09:00:00+08:00"
  },
  {
    id: "visc-3",
    domain: "langchain.com",
    source_type: "ai_citation",
    source_type_label: "AI 引用",
    share_of_voice: 16,
    average_rank: 6.1,
    citation_count: 5,
    captured_at: "2026-04-18T09:00:00+08:00"
  }
];

const visibilityCollectionRuns = [
  {
    id: "visrun-1",
    name: "外部可见度每日采集",
    trigger: "scheduled",
    trigger_label: "定时触发",
    status: "completed",
    status_label: "已完成",
    connector_id: "analytics_visibility",
    connector_label: "效果分析连接器",
    tracked_query_count: 3,
    snapshots_created: 3,
    competitor_domains_checked: 3,
    started_at: "2026-04-18T09:00:00+08:00",
    finished_at: "2026-04-18T09:02:00+08:00",
    steps: [
      {
        id: "visstep-1",
        step_type: "prepare_queries",
        step_label: "整理追踪查询",
        status: "succeeded",
        status_label: "已完成",
        connector_id: "analytics_visibility",
        latency_ms: 120,
        output_preview: { query_count: 3 }
      },
      {
        id: "visstep-2",
        step_type: "fetch_serp",
        step_label: "抓取 SERP",
        status: "succeeded",
        status_label: "已完成",
        connector_id: "analytics_visibility",
        latency_ms: 620,
        output_preview: { engine_count: 3 }
      },
      {
        id: "visstep-3",
        step_type: "write_snapshots",
        step_label: "写入排名与引用快照",
        status: "succeeded",
        status_label: "已完成",
        connector_id: "analytics_visibility",
        latency_ms: 180,
        output_preview: { snapshots_created: 3 }
      }
    ]
  }
];

const audienceSegments = [
  {
    id: "seg-1",
    segment_name: "企业智能体决策人群",
    source: "content_subscription",
    source_label: "内容订阅",
    member_count: 860,
    matched_keywords: ["企业智能体平台怎么选", "私有化智能体"],
    preferred_channel: "email",
    preferred_channel_label: "邮件",
    status: "active",
    status_label: "正常",
    updated_at: "2026-04-18T10:00:00+08:00"
  },
  {
    id: "seg-2",
    segment_name: "销售智能体兴趣人群",
    source: "article_click",
    source_label: "文章点击",
    member_count: 320,
    matched_keywords: ["销售智能体", "CRM 对比"],
    preferred_channel: "wechat_private",
    preferred_channel_label: "企微",
    status: "active",
    status_label: "正常",
    updated_at: "2026-04-18T10:05:00+08:00"
  },
  {
    id: "seg-3",
    segment_name: "私有化部署线索",
    source: "form_submit",
    source_label: "表单线索",
    member_count: 100,
    matched_keywords: ["私有化部署", "合规要求"],
    preferred_channel: "email",
    preferred_channel_label: "邮件",
    status: "active",
    status_label: "正常",
    updated_at: "2026-04-18T10:10:00+08:00"
  }
];

const marketingCampaigns = [
  {
    id: "camp-1",
    campaign_name: "企业智能体选型内容培育",
    segment_id: "seg-1",
    segment_name: "企业智能体决策人群",
    article_id: "ar-1",
    subject: "企业智能体平台怎么选：5 个评估维度",
    campaign_type: "nurture_email",
    campaign_type_label: "内容培育邮件",
    status: "active",
    status_label: "运行中",
    send_count: 860,
    open_count: 327,
    click_count: 103,
    open_rate: 38,
    click_rate: 12,
    last_run_at: "2026-04-18T10:20:00+08:00"
  },
  {
    id: "camp-2",
    campaign_name: "销售智能体对比再营销",
    segment_id: "seg-2",
    segment_name: "销售智能体兴趣人群",
    article_id: "ar-2",
    subject: "销售智能体和 CRM 的边界在哪里",
    campaign_type: "remarketing",
    campaign_type_label: "再营销",
    status: "draft",
    status_label: "草稿",
    send_count: 0,
    open_count: 0,
    click_count: 0,
    open_rate: 0,
    click_rate: 0,
    last_run_at: null
  }
];

const marketingCampaignRuns = [
  {
    id: "camprun-1",
    campaign_id: "camp-1",
    campaign_name: "企业智能体选型内容培育",
    segment_id: "seg-1",
    segment_name: "企业智能体决策人群",
    trigger: "scheduled",
    trigger_label: "定时触发",
    status: "completed",
    status_label: "已完成",
    sent_count: 860,
    open_count: 327,
    click_count: 103,
    started_at: "2026-04-18T10:20:00+08:00",
    finished_at: "2026-04-18T10:24:00+08:00",
    steps: [
      {
        id: "campstep-1",
        step_type: "match_segment",
        step_label: "匹配受众分群",
        status: "succeeded",
        status_label: "已完成",
        output_preview: { recipients: 860 }
      },
      {
        id: "campstep-2",
        step_type: "render_message",
        step_label: "渲染活动内容",
        status: "succeeded",
        status_label: "已完成",
        output_preview: { subject: "企业智能体平台怎么选：5 个评估维度" }
      },
      {
        id: "campstep-3",
        step_type: "record_metrics",
        step_label: "记录发送与点击指标",
        status: "succeeded",
        status_label: "已完成",
        output_preview: { sent_count: 860, open_count: 327, click_count: 103 }
      }
    ]
  }
];

const usageRecords = [
  { id: "use-1", usage_type: "keyword_crawl", quantity: 640, unit: "次", occurred_at: "2026-04-17T09:00:00+08:00" },
  { id: "use-2", usage_type: "article_generation", quantity: 96, unit: "篇", occurred_at: "2026-04-17T09:00:00+08:00" },
  { id: "use-3", usage_type: "publish", quantity: 28, unit: "次", occurred_at: "2026-04-17T09:00:00+08:00" }
];

const invoices = [
  { id: "INV-2026-04", period: "2026-04-01 ~ 2026-04-30", amount: 2980, payment_status: "paid", payment_status_label: "已支付", invoice_status: "pending", invoice_status_label: "待开票" },
  { id: "INV-2026-03", period: "2026-03-01 ~ 2026-03-31", amount: 2980, payment_status: "paid", payment_status_label: "已支付", invoice_status: "issued", invoice_status_label: "已开票" }
];

const members = [
  { id: "mem-1", user_id: "user-1", name: "Luna", email: "luna@example.com", role: "admin", status: "active", last_login_at: "2026-04-17T09:10:00+08:00" },
  { id: "mem-2", user_id: "user-2", name: "Mia", email: "mia@example.com", role: "editor", status: "active", last_login_at: "2026-04-17T08:58:00+08:00" }
];

const brandProfile = {
  brand_name: "AgentCore OS",
  one_liner: "一个面向中国智能体公司的关键词分析、内容生成与分发平台。",
  core_value_props: [
    "面向中国智能体行业的 GEO 内容增长",
    "从关键词到文章到分发的最短闭环",
    "默认支持品牌知识与人工审核"
  ],
  forbidden_terms: ["万能智能体", "自动爆文", "无需审核"],
  glossary_terms: [
    { term: "企业智能体", description: "可在企业流程中执行、协同和沉淀的智能体系统。" },
    { term: "私有化智能体", description: "支持本地部署、权限控制和模型边界管理的智能体方案。" }
  ],
  default_cta: "预约智能体内容增长方案",
  tone_style: "专业直接",
  default_word_count_min: 1800,
  default_word_count_max: 2600,
  faq_default_count: 3,
  force_compare_block: true,
  force_cta_block: true
};

const modelConfigs = [
  {
    id: "mdl-1",
    provider: "深度求索",
    provider_type: "官方接口",
    model_name: "deepseek-chat",
    purpose: "keyword_analysis",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    api_key: "",
    temperature: 0.4,
    max_tokens: 3200,
    timeout_ms: 20000,
    is_default: true,
    status: "active",
    notes: "用于关键词意图分析和问题裂变。"
  },
  {
    id: "mdl-2",
    provider: "月之暗面",
    provider_type: "官方接口",
    model_name: "kimi-k2",
    purpose: "article_generation",
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    api_key: "",
    temperature: 0.7,
    max_tokens: 6400,
    timeout_ms: 30000,
    is_default: true,
    status: "active",
    notes: "用于中文长文生成和润色。"
  },
  {
    id: "mdl-3",
    provider: "豆包",
    provider_type: "火山方舟",
    model_name: "doubao-pro-32k",
    purpose: "outline_generation",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    api_key: "",
    temperature: 0.5,
    max_tokens: 4000,
    timeout_ms: 25000,
    is_default: false,
    status: "active",
    notes: "用于大纲生成和结构扩写。"
  }
];

let uniqueIdCounter = 0;

const mediaSources = [
  {
    id: "src-1",
    source_name: "AgentCore 公众号",
    source_type: "owned_self_media",
    source_type_label: "自有自媒体",
    platform: "wechat_official",
    platform_label: "微信公众号",
    authority_tier: "owned",
    authority_tier_label: "自有资产",
    extraction_mode: "rss_like",
    extraction_mode_label: "文章标题与摘要抽取",
    update_frequency: "daily",
    update_frequency_label: "日更",
    relevance_score: 94,
    status: "active",
    status_label: "正常",
    sample_topics: ["企业智能体落地", "销售智能体工作流", "私有化交付"],
    last_crawled_at: "2026-04-17T08:20:00+08:00"
  },
  {
    id: "src-2",
    source_name: "Agent 智能体观察",
    source_type: "owned_self_media",
    source_type_label: "自有自媒体",
    platform: "zhihu_column",
    platform_label: "知乎专栏",
    authority_tier: "owned",
    authority_tier_label: "自有资产",
    extraction_mode: "question_thread",
    extraction_mode_label: "问题与评论抽取",
    update_frequency: "daily",
    update_frequency_label: "日更",
    relevance_score: 91,
    status: "active",
    status_label: "正常",
    sample_topics: ["智能体选型", "智能体与传统软件对比", "企业试点案例"],
    last_crawled_at: "2026-04-17T08:42:00+08:00"
  },
  {
    id: "src-3",
    source_name: "数字生命卡兹克",
    source_type: "industry_self_media",
    source_type_label: "行业自媒体",
    platform: "wechat_official",
    platform_label: "微信公众号",
    authority_tier: "kol",
    authority_tier_label: "行业 KOL",
    extraction_mode: "headline_cluster",
    extraction_mode_label: "标题聚类",
    update_frequency: "daily",
    update_frequency_label: "日更",
    relevance_score: 88,
    status: "active",
    status_label: "正常",
    sample_topics: ["AI Agent 创业", "ToB 智能体产品", "国内模型生态"],
    last_crawled_at: "2026-04-17T07:54:00+08:00"
  },
  {
    id: "src-4",
    source_name: "极客公园",
    source_type: "authority_media",
    source_type_label: "权威媒体",
    platform: "news_site",
    platform_label: "科技媒体",
    authority_tier: "media",
    authority_tier_label: "行业媒体",
    extraction_mode: "headline_cluster",
    extraction_mode_label: "标题聚类",
    update_frequency: "daily",
    update_frequency_label: "日更",
    relevance_score: 82,
    status: "active",
    status_label: "正常",
    sample_topics: ["Agent 行业趋势", "模型产品发布", "组织级 AI 应用"],
    last_crawled_at: "2026-04-17T08:05:00+08:00"
  },
  {
    id: "src-5",
    source_name: "36氪 AI",
    source_type: "authority_media",
    source_type_label: "权威媒体",
    platform: "news_site",
    platform_label: "科技媒体",
    authority_tier: "media",
    authority_tier_label: "行业媒体",
    extraction_mode: "headline_cluster",
    extraction_mode_label: "标题聚类",
    update_frequency: "hourly",
    update_frequency_label: "小时级",
    relevance_score: 84,
    status: "active",
    status_label: "正常",
    sample_topics: ["企业服务融资", "AI 商业化", "行业方案商"],
    last_crawled_at: "2026-04-17T08:50:00+08:00"
  },
  {
    id: "src-6",
    source_name: "机器之心",
    source_type: "authority_media",
    source_type_label: "权威媒体",
    platform: "news_site",
    platform_label: "专业媒体",
    authority_tier: "research_media",
    authority_tier_label: "研究型媒体",
    extraction_mode: "entity_tracking",
    extraction_mode_label: "实体与趋势抽取",
    update_frequency: "daily",
    update_frequency_label: "日更",
    relevance_score: 79,
    status: "active",
    status_label: "正常",
    sample_topics: ["模型能力", "Agent Framework", "评测基准"],
    last_crawled_at: "2026-04-17T06:40:00+08:00"
  },
  {
    id: "src-7",
    source_name: "InfoQ AI",
    source_type: "authority_media",
    source_type_label: "权威媒体",
    platform: "news_site",
    platform_label: "开发者媒体",
    authority_tier: "developer_media",
    authority_tier_label: "开发者媒体",
    extraction_mode: "entity_tracking",
    extraction_mode_label: "技术实体抽取",
    update_frequency: "weekly",
    update_frequency_label: "周更",
    relevance_score: 77,
    status: "active",
    status_label: "正常",
    sample_topics: ["工程化落地", "多智能体架构", "数据与评测"],
    last_crawled_at: "2026-04-16T20:10:00+08:00"
  }
];

const sourceAdapterContracts = [
  {
    id: "rss_like",
    label: "RSS-like 标题摘要合同",
    contract_version: "v1",
    source_modes: ["rss_like"],
    purpose: "用于自有博客、公众号同步源、RSS 风格列表页的标题、摘要和链接抽取。",
    stages: [
      {
        stage_id: "fetch",
        stage_label: "抓取",
        output_schema: ["raw_url", "raw_title", "raw_excerpt", "published_at"],
        evidence_fields: ["fetch_url_count", "http_status_sample", "source_ref_count"],
        failure_codes: ["source_timeout", "source_rate_limited", "source_unreachable"]
      },
      {
        stage_id: "normalize",
        stage_label: "规范化",
        output_schema: ["normalized_title", "normalized_excerpt", "canonical_url", "source_published_at"],
        evidence_fields: ["normalized_record_count", "retained_field_count", "dropped_empty_title_count"],
        failure_codes: ["normalize_empty_title", "normalize_missing_url"]
      },
      {
        stage_id: "dedupe",
        stage_label: "去重",
        output_schema: ["canonical_key", "duplicate_group_id", "dedupe_reason"],
        evidence_fields: ["deduped_record_count", "duplicate_count", "dedupe_strategy"],
        failure_codes: ["duplicate_cluster_overflow", "canonical_collision"]
      },
      {
        stage_id: "score",
        stage_label: "质量评分",
        output_schema: ["quality_score", "quality_signals", "quality_notes"],
        evidence_fields: ["average_quality_score", "low_quality_count", "quality_signal_count"],
        failure_codes: ["quality_below_threshold"]
      }
    ],
    quality_signals: ["source_authority", "freshness", "title_specificity", "topic_relevance"],
    privacy_boundary: "只保留公开标题、摘要、URL 和时间，不采集私信、评论身份或后台指标。"
  },
  {
    id: "question_thread",
    label: "问题线程抽取合同",
    contract_version: "v1",
    source_modes: ["question_thread"],
    purpose: "用于知乎专栏、问答社区和评论线程，把问题、回答摘要和热度信号规范化为可选题输入。",
    stages: [
      {
        stage_id: "fetch",
        stage_label: "抓取",
        output_schema: ["thread_url", "question_title", "answer_excerpt", "engagement_hint"],
        evidence_fields: ["fetch_url_count", "thread_count", "source_ref_count"],
        failure_codes: ["source_timeout", "source_rate_limited", "thread_access_limited"]
      },
      {
        stage_id: "normalize",
        stage_label: "规范化",
        output_schema: ["normalized_question", "normalized_answer_excerpt", "canonical_url"],
        evidence_fields: ["normalized_record_count", "retained_field_count", "dropped_empty_title_count"],
        failure_codes: ["normalize_empty_question", "normalize_missing_url"]
      },
      {
        stage_id: "dedupe",
        stage_label: "去重",
        output_schema: ["canonical_question_key", "duplicate_group_id", "dedupe_reason"],
        evidence_fields: ["deduped_record_count", "duplicate_count", "dedupe_strategy"],
        failure_codes: ["duplicate_cluster_overflow", "canonical_collision"]
      },
      {
        stage_id: "score",
        stage_label: "质量评分",
        output_schema: ["quality_score", "quality_signals", "quality_notes"],
        evidence_fields: ["average_quality_score", "low_quality_count", "quality_signal_count"],
        failure_codes: ["quality_below_threshold"]
      }
    ],
    quality_signals: ["question_clarity", "engagement_hint", "freshness", "topic_relevance"],
    privacy_boundary: "只保留公开问题文本和聚合热度，不保留用户身份、私域互动或可识别评论明细。"
  },
  {
    id: "headline_cluster",
    label: "标题聚类合同",
    contract_version: "v1",
    source_modes: ["headline_cluster"],
    purpose: "用于行业媒体和竞品栏目，把多标题输入聚类为议题方向和候选问题。",
    stages: [
      {
        stage_id: "fetch",
        stage_label: "抓取",
        output_schema: ["raw_url", "raw_headline", "source_section", "published_at"],
        evidence_fields: ["fetch_url_count", "http_status_sample", "source_ref_count"],
        failure_codes: ["source_timeout", "source_rate_limited", "source_unreachable", "layout_changed"]
      },
      {
        stage_id: "normalize",
        stage_label: "规范化",
        output_schema: ["normalized_title", "canonical_url", "section_label", "source_published_at"],
        evidence_fields: ["normalized_record_count", "retained_field_count", "dropped_empty_title_count"],
        failure_codes: ["normalize_empty_title", "normalize_missing_url", "layout_parse_failed"]
      },
      {
        stage_id: "dedupe",
        stage_label: "去重",
        output_schema: ["canonical_key", "duplicate_group_id", "dedupe_reason"],
        evidence_fields: ["deduped_record_count", "duplicate_count", "dedupe_strategy"],
        failure_codes: ["duplicate_cluster_overflow", "canonical_collision"]
      },
      {
        stage_id: "score",
        stage_label: "质量评分",
        output_schema: ["quality_score", "quality_signals", "quality_notes"],
        evidence_fields: ["average_quality_score", "low_quality_count", "quality_signal_count"],
        failure_codes: ["quality_below_threshold"]
      }
    ],
    quality_signals: ["source_authority", "freshness", "headline_specificity", "topic_relevance"],
    privacy_boundary: "只处理公开栏目页和文章标题，不抓取登录态内容或付费墙正文。"
  },
  {
    id: "entity_tracking",
    label: "实体趋势抽取合同",
    contract_version: "v1",
    source_modes: ["entity_tracking"],
    purpose: "用于跟踪品牌、产品、人物、技术词和竞品实体的公开提及趋势。",
    stages: [
      {
        stage_id: "fetch",
        stage_label: "抓取",
        output_schema: ["raw_url", "raw_title", "entity_mentions", "published_at"],
        evidence_fields: ["fetch_url_count", "entity_match_count", "source_ref_count"],
        failure_codes: ["source_timeout", "source_rate_limited", "source_unreachable"]
      },
      {
        stage_id: "normalize",
        stage_label: "规范化",
        output_schema: ["normalized_title", "canonical_entity", "canonical_url", "mention_context"],
        evidence_fields: ["normalized_record_count", "retained_field_count", "dropped_empty_title_count"],
        failure_codes: ["normalize_empty_title", "entity_alias_conflict", "normalize_missing_url"]
      },
      {
        stage_id: "dedupe",
        stage_label: "去重",
        output_schema: ["canonical_entity_key", "duplicate_group_id", "dedupe_reason"],
        evidence_fields: ["deduped_record_count", "duplicate_count", "dedupe_strategy"],
        failure_codes: ["duplicate_cluster_overflow", "canonical_collision"]
      },
      {
        stage_id: "score",
        stage_label: "质量评分",
        output_schema: ["quality_score", "quality_signals", "quality_notes"],
        evidence_fields: ["average_quality_score", "low_quality_count", "quality_signal_count"],
        failure_codes: ["quality_below_threshold"]
      }
    ],
    quality_signals: ["entity_confidence", "source_authority", "freshness", "topic_relevance"],
    privacy_boundary: "只保留公开实体提及和上下文摘要，不保留个人身份画像或非公开客户信息。"
  }
];

const sourceStrategies = [
  {
    id: "stg-1",
    name: "自有内容复用飞轮",
    source_scope: "owned_self_media",
    source_scope_label: "自有自媒体",
    monitoring_goal: "repurpose",
    monitoring_goal_label: "内容复用",
    cadence: "daily",
    cadence_label: "每日滚动",
    source_ids: ["src-1", "src-2"],
    template_types: ["comparison_page", "article", "faq"],
    distribution_channels: ["website_blog", "wechat_official", "zhihu_column"],
    orchestration_note: "抓取自有高互动标题与评论问题，转成官网长文、公众号深度稿和知乎问答版。",
    is_enabled: true,
    schedule_mode: "daily",
    schedule_mode_label: "每日滚动",
    cron_expression: "",
    next_run_at: "2026-04-18T09:00:00+08:00",
    last_run_at: "2026-04-17T08:48:00+08:00",
    consecutive_failures: 0,
    auto_generate_articles: true,
    auto_submit_review: true,
    review_policy: "manual_first",
    review_policy_label: "先审后发",
    auto_create_publish_task: false,
    publish_mode: "scheduled",
    publish_mode_label: "定时",
    default_channel_id: "ch-1",
    min_word_count: 800,
    required_terms_count: 2,
    block_on_forbidden_terms: true,
    allow_authority_direct_publish: false
  },
  {
    id: "stg-2",
    name: "行业自媒体热点跟进",
    source_scope: "industry_self_media",
    source_scope_label: "行业自媒体",
    monitoring_goal: "hotspot_follow",
    monitoring_goal_label: "热点跟进",
    cadence: "daily",
    cadence_label: "每日滚动",
    source_ids: ["src-3"],
    template_types: ["article", "scenario_page"],
    distribution_channels: ["wechat_official", "zhihu_column"],
    orchestration_note: "围绕 KOL 高频表达补充品牌立场和场景解释，避免只做转述。",
    is_enabled: true,
    schedule_mode: "daily",
    schedule_mode_label: "每日滚动",
    cron_expression: "",
    next_run_at: "2026-04-18T10:00:00+08:00",
    last_run_at: "2026-04-17T07:54:00+08:00",
    consecutive_failures: 0,
    auto_generate_articles: true,
    auto_submit_review: true,
    review_policy: "manual_first",
    review_policy_label: "先审后发",
    auto_create_publish_task: false,
    publish_mode: "scheduled",
    publish_mode_label: "定时",
    default_channel_id: "ch-2",
    min_word_count: 820,
    required_terms_count: 2,
    block_on_forbidden_terms: true,
    allow_authority_direct_publish: false
  },
  {
    id: "stg-3",
    name: "权威媒体议题跟踪",
    source_scope: "authority_media",
    source_scope_label: "权威媒体",
    monitoring_goal: "authority_follow",
    monitoring_goal_label: "议题跟踪",
    cadence: "twice_daily",
    cadence_label: "每日两轮",
    source_ids: ["src-4", "src-5", "src-6", "src-7"],
    template_types: ["comparison_page", "faq", "scenario_page"],
    distribution_channels: ["website_blog", "zhihu_column"],
    orchestration_note: "把媒体议题转成企业视角的问题解释、对比页和问答页，抢占模型回答里的权威表述。",
    is_enabled: true,
    schedule_mode: "twice_daily",
    schedule_mode_label: "每日两轮",
    cron_expression: "",
    next_run_at: "2026-04-17T18:00:00+08:00",
    last_run_at: "2026-04-17T09:12:00+08:00",
    consecutive_failures: 0,
    auto_generate_articles: true,
    auto_submit_review: true,
    review_policy: "manual_first",
    review_policy_label: "先审后发",
    auto_create_publish_task: false,
    publish_mode: "scheduled",
    publish_mode_label: "定时",
    default_channel_id: "ch-1",
    min_word_count: 840,
    required_terms_count: 2,
    block_on_forbidden_terms: true,
    allow_authority_direct_publish: false
  },
  {
    id: "stg-4",
    name: "混合来源自动运营",
    source_scope: "mixed_media",
    source_scope_label: "混合来源",
    monitoring_goal: "full_funnel",
    monitoring_goal_label: "全链路自动运营",
    cadence: "always_on",
    cadence_label: "持续运行",
    source_ids: ["src-1", "src-3", "src-4", "src-5"],
    template_types: ["comparison_page", "article", "faq", "scenario_page"],
    distribution_channels: ["website_blog", "wechat_official", "zhihu_column"],
    orchestration_note: "先抓自媒体热点，再用权威媒体补证据，自动进入选题、写作和分发。",
    is_enabled: true,
    schedule_mode: "always_on",
    schedule_mode_label: "持续运行",
    cron_expression: "",
    next_run_at: "2026-04-17T10:30:00+08:00",
    last_run_at: "2026-04-17T09:20:00+08:00",
    consecutive_failures: 0,
    auto_generate_articles: true,
    auto_submit_review: true,
    review_policy: "auto_pass",
    review_policy_label: "规则通过自动审核",
    auto_create_publish_task: true,
    publish_mode: "immediate",
    publish_mode_label: "立即",
    default_channel_id: "ch-1",
    min_word_count: 850,
    required_terms_count: 2,
    block_on_forbidden_terms: true,
    allow_authority_direct_publish: false
  }
];

const automationRuns = [
  {
    id: "run-1",
    strategy_id: "stg-1",
    strategy_name: "自有内容复用飞轮",
    source_scope: "owned_self_media",
    source_scope_label: "自有自媒体",
    monitoring_goal: "repurpose",
    monitoring_goal_label: "内容复用",
    industry_topic: "中国智能体",
    crawl_job_id: "job-1",
    generated_question_count: 6,
    generated_topic_count: 2,
    generated_article_count: 1,
    status: "completed",
    status_label: "已完成",
    created_at: "2026-04-17T08:48:00+08:00"
  },
  {
    id: "run-2",
    strategy_id: "stg-3",
    strategy_name: "权威媒体议题跟踪",
    source_scope: "authority_media",
    source_scope_label: "权威媒体",
    monitoring_goal: "authority_follow",
    monitoring_goal_label: "议题跟踪",
    industry_topic: "私有化智能体",
    crawl_job_id: "job-3",
    generated_question_count: 5,
    generated_topic_count: 2,
    generated_article_count: 0,
    status: "completed",
    status_label: "已完成",
    created_at: "2026-04-17T09:12:00+08:00"
  }
];

const automationRunSteps = [
  {
    id: "step-1",
    run_id: "run-1",
    step_type: "crawl",
    step_label: "内容源抓取",
    status: "succeeded",
    status_label: "已完成",
    provider_id: "local_question_expander",
    connector_id: "mock-source-connector",
    latency_ms: 0,
    input_preview: {
      source_scope: "owned_self_media"
    },
    output_preview: {
      question_count: 6
    },
    error_message: "",
    started_at: "2026-04-17T08:48:00+08:00",
    finished_at: "2026-04-17T08:48:00+08:00"
  },
  {
    id: "step-2",
    run_id: "run-2",
    step_type: "crawl",
    step_label: "内容源抓取",
    status: "succeeded",
    status_label: "已完成",
    provider_id: "local_question_expander",
    connector_id: "mock-source-connector",
    latency_ms: 0,
    input_preview: {
      source_scope: "authority_media"
    },
    output_preview: {
      question_count: 5
    },
    error_message: "",
    started_at: "2026-04-17T09:12:00+08:00",
    finished_at: "2026-04-17T09:12:00+08:00"
  }
];

const automationConnectors = [
  {
    id: "firecrawl_source",
    label: "Firecrawl 内容源连接器",
    connector_type: "source_connector",
    connector_type_label: "内容源",
    status: "ready",
    status_label: "可配置",
    is_enabled: false,
    scopes: ["crawl", "extract", "normalize"],
    credential_status: "configured",
    credential_status_label: "已配置",
    permission_boundary: "read_only",
    permission_boundary_label: "只读采集",
    allowed_actions: ["source:read", "source:crawl", "source:extract"],
    dangerous_actions: ["source:delete", "source:write"],
    last_permission_audit: {
      status: "passed",
      status_label: "已通过",
      checked_at: "2026-07-05T09:10:00.000Z",
      findings: ["API key 仅用于抓取与正文抽取，不授予写入目标站点权限。"]
    },
    note: "预留给网页抓取、正文抽取、Markdown/结构化内容转换。",
    config: {
      endpoint: "mock://source-crawl",
      api_key: "firecrawl-demo-key",
      timeout_ms: 12000,
      retry_count: 2
    }
  },
  {
    id: "serpbear_rank_tracker",
    label: "SerpBear 排名追踪连接器",
    connector_type: "serp_connector",
    connector_type_label: "搜索可见性",
    status: "planned",
    status_label: "规划中",
    is_enabled: false,
    scopes: ["rank_snapshot", "competitor_snapshot"],
    credential_status: "missing",
    credential_status_label: "未配置",
    permission_boundary: "planned_only",
    permission_boundary_label: "规划占位",
    allowed_actions: ["serp:read"],
    dangerous_actions: ["serp:mutate", "serp:delete"],
    last_permission_audit: {
      status: "needs_review",
      status_label: "待复核",
      checked_at: "2026-07-05T09:12:00.000Z",
      findings: ["真实 SERP 凭据接入前仅保留只读快照边界。"]
    },
    note: "预留给关键词排名、竞品域名和搜索可见性快照。",
    config: {
      endpoint: "mock://serp-rank",
      api_key: "",
      timeout_ms: 10000,
      retry_count: 1
    }
  },
  {
    id: "cms_webhook",
    label: "CMS Webhook 连接器",
    connector_type: "cms_connector",
    connector_type_label: "站点发布",
    status: "ready",
    status_label: "可配置",
    is_enabled: false,
    scopes: ["draft", "publish", "sync_status"],
    credential_status: "missing",
    credential_status_label: "未配置",
    permission_boundary: "scoped_write",
    permission_boundary_label: "分域写入",
    allowed_actions: ["cms:draft", "cms:publish", "cms:status:read"],
    dangerous_actions: ["cms:delete", "cms:theme:write", "cms:user:write"],
    last_permission_audit: {
      status: "needs_review",
      status_label: "待复核",
      checked_at: "2026-07-05T09:14:00.000Z",
      findings: ["发布权限需限制在内容草稿、发布和状态回传，不允许站点主题或用户权限。"]
    },
    note: "预留给官网 CMS、WordPress、Headless CMS 或站内发布接口。",
    config: {
      endpoint: "mock://cms-publish",
      api_key: "",
      timeout_ms: 10000,
      retry_count: 2
    }
  },
  {
    id: "postiz_social",
    label: "Postiz 社媒发布连接器",
    connector_type: "social_connector",
    connector_type_label: "社媒分发",
    status: "planned",
    status_label: "规划中",
    is_enabled: false,
    scopes: ["schedule", "publish", "variant_preview"],
    credential_status: "configured",
    credential_status_label: "已配置",
    permission_boundary: "scoped_write",
    permission_boundary_label: "分域写入",
    allowed_actions: ["social:profile:read", "social:post:schedule", "social:post:publish"],
    dangerous_actions: ["social:account:delete", "social:permission:write"],
    last_permission_audit: {
      status: "needs_review",
      status_label: "待复核",
      checked_at: "2026-07-05T09:16:00.000Z",
      findings: ["社媒连接器只允许排期和发布内容变体，不允许账号级权限变更。"]
    },
    note: "预留给社媒账号、排期日历、内容变体和发布结果回传。",
    config: {
      endpoint: "mock://social-publish",
      api_key: "postiz-demo-key",
      timeout_ms: 12000,
      retry_count: 2
    }
  },
  {
    id: "mailtrain_email",
    label: "Mailtrain 邮件营销连接器",
    connector_type: "email_connector",
    connector_type_label: "邮件触达",
    status: "ready",
    status_label: "已启用",
    is_enabled: true,
    scopes: ["segment", "campaign", "send"],
    credential_status: "configured",
    credential_status_label: "已配置",
    permission_boundary: "scoped_write",
    permission_boundary_label: "分域写入",
    allowed_actions: ["segment:read", "campaign:read", "campaign:send"],
    dangerous_actions: ["campaign:delete", "subscriber:export", "subscriber:delete"],
    last_permission_audit: {
      status: "passed",
      status_label: "已通过",
      checked_at: "2026-07-05T09:18:00.000Z",
      findings: ["发送权限限定在已审核 Campaign，禁止导出或删除订阅者数据。"]
    },
    note: "预留给订阅列表、受众分组、邮件 Campaign 和发送结果回传。",
    config: {
      endpoint: "mock://email-campaign",
      api_key: "mailtrain-demo-key",
      timeout_ms: 12000,
      retry_count: 2
    }
  },
  {
    id: "analytics_visibility",
    label: "可见性分析连接器",
    connector_type: "analytics_connector",
    connector_type_label: "效果分析",
    status: "ready",
    status_label: "已启用",
    is_enabled: true,
    scopes: ["traffic", "citation", "conversion"],
    credential_status: "configured",
    credential_status_label: "已配置",
    permission_boundary: "read_only",
    permission_boundary_label: "只读采集",
    allowed_actions: ["visibility:read", "visibility:collect"],
    dangerous_actions: ["analytics:property:write", "analytics:user:write", "analytics:delete"],
    last_permission_audit: {
      status: "passed",
      status_label: "已通过",
      checked_at: "2026-07-05T09:20:00.000Z",
      findings: ["效果分析连接器只允许读取和汇总可见性指标，不允许修改分析资产。"]
    },
    note: "预留给站点分析、AI 引用、线索转化和内容表现回传。",
    config: {
      endpoint: "mock://analytics-visibility",
      api_key: "",
      timeout_ms: 10000,
      retry_count: 1
    }
  }
];

const providerInvocations = [];
const auditEvents = [];
const maxAuditEvents = 500;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function replaceArray(target, nextValue) {
  target.splice(0, target.length, ...deepClone(Array.isArray(nextValue) ? nextValue : []));
}

function replaceObject(target, nextValue) {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
  Object.assign(
    target,
    deepClone(nextValue && typeof nextValue === "object" && !Array.isArray(nextValue) ? nextValue : {})
  );
}

function sanitizeConnectorConfig(config = {}) {
  return {
    ...deepClone(config || {}),
    api_key: "",
    masked_api_key: maskSecret(config.api_key)
  };
}

function sanitizeAutomationConnector(connector = {}) {
  return {
    ...deepClone(connector),
    config: sanitizeConnectorConfig(connector.config || {})
  };
}

function connectorPermissionRow(connector = {}) {
  return {
    id: connector.id,
    label: connector.label,
    connector_type: connector.connector_type,
    connector_type_label: connector.connector_type_label,
    status: connector.status,
    status_label: connector.status_label,
    is_enabled: Boolean(connector.is_enabled),
    credential_status: connector.credential_status || "missing",
    credential_status_label: connector.credential_status_label || "未配置",
    permission_boundary: connector.permission_boundary || "planned_only",
    permission_boundary_label: connector.permission_boundary_label || "规划占位",
    scopes: deepClone(connector.scopes || []),
    allowed_actions: deepClone(connector.allowed_actions || []),
    dangerous_actions: deepClone(connector.dangerous_actions || []),
    last_permission_audit: deepClone(
      connector.last_permission_audit || {
        status: "needs_review",
        status_label: "待复核",
        checked_at: null,
        findings: []
      }
    )
  };
}

export function getConnectorPermissionMatrix(query = {}) {
  let items = automationConnectors.map(connectorPermissionRow);
  if (query.connector_type) items = items.filter((item) => item.connector_type === query.connector_type);
  if (query.status) items = items.filter((item) => item.status === query.status);
  if (query.permission_boundary) {
    items = items.filter((item) => item.permission_boundary === query.permission_boundary);
  }
  return paginate(items, query.page, query.page_size);
}

export function evaluateConnectorPermission(connectorId, action) {
  const connector = byId(automationConnectors, connectorId);
  if (!connector) {
    return {
      allowed: false,
      reason_code: "connector_not_found",
      reason_label: "连接器不存在",
      connector_id: connectorId || null,
      action: action || "",
      evaluated_at: nowIso()
    };
  }

  const row = connectorPermissionRow(connector);
  let allowed = true;
  let reasonCode = "allowed";
  let reasonLabel = "允许执行";

  if (!row.is_enabled || row.status !== "ready") {
    allowed = false;
    reasonCode = "connector_disabled";
    reasonLabel = "连接器未启用";
  } else if (row.credential_status !== "configured") {
    allowed = false;
    reasonCode = "credential_missing";
    reasonLabel = "凭据未配置";
  } else if (row.dangerous_actions.includes(action)) {
    allowed = false;
    reasonCode = "dangerous_action";
    reasonLabel = "动作超出权限边界";
  } else if (!row.allowed_actions.includes(action)) {
    allowed = false;
    reasonCode = "action_not_allowed";
    reasonLabel = "动作未授权";
  }

  return {
    allowed,
    reason_code: reasonCode,
    reason_label: reasonLabel,
    connector_id: row.id,
    connector_label: row.label,
    action: action || "",
    permission_boundary: row.permission_boundary,
    permission_boundary_label: row.permission_boundary_label,
    credential_status: row.credential_status,
    credential_status_label: row.credential_status_label,
    audit_status: row.last_permission_audit.status,
    evaluated_at: nowIso()
  };
}

function getConnectorSummary() {
  const countsByType = automationConnectors.reduce((acc, item) => {
    acc[item.connector_type] = Number(acc[item.connector_type] || 0) + 1;
    return acc;
  }, {});
  const needsReview = automationConnectors.filter(
    (item) => item.last_permission_audit?.status !== "passed"
  ).length;
  return {
    counts: {
      total: automationConnectors.length,
      enabled: automationConnectors.filter((item) => item.is_enabled).length,
      ready: automationConnectors.filter((item) => item.status === "ready").length,
      planned: automationConnectors.filter((item) => item.status === "planned").length,
      permission_needs_review: needsReview
    },
    counts_by_type: countsByType
  };
}

function getPromptSummary() {
  return {
    counts: {
      total: promptTemplates.length,
      active: promptTemplates.filter((item) => item.status === "active").length,
      quality_traces: contentQualityTraces.length
    },
    latest_trace_at: contentQualityTraces[0]?.created_at || null
  };
}

function getSerializableState() {
  return {
    automationProviderState: getAutomationProviderState(),
    providerInvocations,
    auditEvents,
    automationRunSteps,
    keywords,
    keywordCrawlJobs,
    topicIdeas,
    articles,
    articleVersions,
    articleReviews,
    contentTemplates,
    promptTemplates,
    contentQualityTraces,
    channels,
    publishTasks,
    publishTaskItems,
    visibilityTrackedQueries,
    visibilitySnapshots,
    visibilityCompetitorDomains,
    visibilityCollectionRuns,
    audienceSegments,
    marketingCampaigns,
    marketingCampaignRuns,
    usageRecords,
    invoices,
    members,
    brandProfile,
    modelConfigs,
    mediaSources,
    sourceStrategies,
    automationRuns
  };
}

function hydrateRuntimeState(payload = {}) {
  hydrateAutomationProviderState(payload.automationProviderState ?? {});
  replaceArray(providerInvocations, payload.providerInvocations ?? providerInvocations);
  replaceArray(auditEvents, payload.auditEvents ?? auditEvents);
  replaceArray(automationRunSteps, payload.automationRunSteps ?? automationRunSteps);
  replaceArray(keywords, payload.keywords ?? keywords);
  replaceArray(keywordCrawlJobs, payload.keywordCrawlJobs ?? keywordCrawlJobs);
  replaceArray(topicIdeas, payload.topicIdeas ?? topicIdeas);
  replaceArray(articles, payload.articles ?? articles);
  replaceArray(articleVersions, payload.articleVersions ?? articleVersions);
  replaceArray(articleReviews, payload.articleReviews ?? articleReviews);
  replaceArray(contentTemplates, payload.contentTemplates ?? contentTemplates);
  replaceArray(promptTemplates, payload.promptTemplates ?? promptTemplates);
  replaceArray(contentQualityTraces, payload.contentQualityTraces ?? contentQualityTraces);
  replaceArray(channels, payload.channels ?? channels);
  replaceArray(publishTasks, payload.publishTasks ?? publishTasks);
  replaceArray(publishTaskItems, payload.publishTaskItems ?? publishTaskItems);
  replaceArray(visibilityTrackedQueries, payload.visibilityTrackedQueries ?? visibilityTrackedQueries);
  replaceArray(visibilitySnapshots, payload.visibilitySnapshots ?? visibilitySnapshots);
  replaceArray(visibilityCompetitorDomains, payload.visibilityCompetitorDomains ?? visibilityCompetitorDomains);
  replaceArray(visibilityCollectionRuns, payload.visibilityCollectionRuns ?? visibilityCollectionRuns);
  replaceArray(audienceSegments, payload.audienceSegments ?? audienceSegments);
  replaceArray(marketingCampaigns, payload.marketingCampaigns ?? marketingCampaigns);
  replaceArray(marketingCampaignRuns, payload.marketingCampaignRuns ?? marketingCampaignRuns);
  replaceArray(usageRecords, payload.usageRecords ?? usageRecords);
  replaceArray(invoices, payload.invoices ?? invoices);
  replaceArray(members, payload.members ?? members);
  replaceObject(brandProfile, payload.brandProfile ?? brandProfile);
  replaceArray(modelConfigs, payload.modelConfigs ?? modelConfigs);
  replaceArray(mediaSources, payload.mediaSources ?? mediaSources);
  replaceArray(sourceStrategies, payload.sourceStrategies ?? sourceStrategies);
  replaceArray(automationRuns, payload.automationRuns ?? automationRuns);
}

function sanitizeAuditDetails(details = {}) {
  const cloned = deepClone(details && typeof details === "object" && !Array.isArray(details) ? details : {});
  for (const key of Object.keys(cloned)) {
    if (/api[_-]?key|token|secret|password/i.test(key)) {
      cloned[key] = "[redacted]";
    } else if (cloned[key] && typeof cloned[key] === "object") {
      cloned[key] = sanitizeAuditDetails(cloned[key]);
    }
  }
  return cloned;
}

function recordAuditEvent(action, resourceType, resourceId, details = {}) {
  const event = {
    id: uniqueId("aud"),
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    actor_type: "system",
    actor_id: "local-mvp",
    details: sanitizeAuditDetails(details),
    created_at: nowIso()
  };
  auditEvents.unshift(event);
  if (auditEvents.length > maxAuditEvents) {
    auditEvents.length = maxAuditEvents;
  }
  return event;
}

const defaultStateSnapshot = deepClone(getSerializableState());

function persistState() {
  if (!persistenceEnabled) {
    return;
  }

  const directory = path.dirname(persistenceFile);
  const tempFile = path.join(
    directory,
    `.${path.basename(persistenceFile)}.${process.pid}.${Date.now()}.tmp`
  );

  fs.mkdirSync(directory, { recursive: true });

  try {
    const handle = fs.openSync(tempFile, "w");
    try {
      fs.writeFileSync(handle, JSON.stringify(getSerializableState(), null, 2));
      fs.fsyncSync(handle);
    } finally {
      fs.closeSync(handle);
    }

    if (process.env.GEO_SIMULATE_PERSIST_RENAME_FAILURE === "1") {
      throw new Error("Simulated persistence rename failure");
    }

    fs.renameSync(tempFile, persistenceFile);
  } catch (error) {
    try {
      fs.rmSync(tempFile, { force: true });
    } catch {
      // Best-effort cleanup; preserve the original persistence error.
    }
    throw error;
  }
}

function initializePersistence() {
  if (!persistenceEnabled) {
    return;
  }

  try {
    if (fs.existsSync(persistenceFile)) {
      const payload = JSON.parse(fs.readFileSync(persistenceFile, "utf8"));
      hydrateRuntimeState(payload);
      return;
    }
  } catch (error) {
    console.warn(
      `[mock-data] failed to load persisted state from ${persistenceFile}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  persistState();
}

export function getPersistenceStatus() {
  return {
    enabled: persistenceEnabled,
    file: persistenceFile
  };
}

export function getRuntimeStatus() {
  const providerSummary = getAutomationProviderSummary();
  const providerInvocationSummary = getProviderInvocationSummary();
  return {
    persistence: getPersistenceStatus(),
    providers: {
      ...providerSummary,
      invocation_summary: providerInvocationSummary
    },
    connectors: getConnectorSummary(),
    prompts: getPromptSummary(),
    counts: {
      keywords: keywords.length,
      topics: topicIdeas.length,
      articles: articles.length,
      tasks: publishTasks.length,
      channels: channels.length,
      models: modelConfigs.length,
      prompt_templates: promptTemplates.length,
      content_quality_traces: contentQualityTraces.length,
      strategies: sourceStrategies.length,
      automation_runs: automationRuns.length,
      automation_run_steps: automationRunSteps.length,
      provider_invocations: providerInvocations.length
    },
    updated_at: nowIso()
  };
}

export function resetRuntimeState() {
  hydrateRuntimeState(defaultStateSnapshot);
  recordAuditEvent("runtime.reset", "runtime", "local", {
    counts: {
      keywords: keywords.length,
      topics: topicIdeas.length,
      articles: articles.length,
      tasks: publishTasks.length
    }
  });
  persistState();
  return getRuntimeStatus();
}

initializePersistence();

function paginate(items, page = 1, pageSize = 20) {
  const pageNumber = Number(page) || 1;
  const size = Number(pageSize) || 20;
  const start = (pageNumber - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: pageNumber,
    page_size: size,
    total: items.length
  };
}

function byId(list, id) {
  return list.find((item) => item.id === id) || null;
}

function getChannelById(id) {
  return byId(channels, id);
}

function getMediaSourceById(id) {
  return byId(mediaSources, id);
}

function getSourceStrategyById(id) {
  return byId(sourceStrategies, id);
}

function getArticleById(id) {
  return byId(articles, id);
}

function getTaskItems(taskId) {
  const task = byId(publishTasks, taskId);
  return publishTaskItems
    .filter((item) => item.publish_task_id === taskId)
    .map((item) => enrichPublishTaskItem(item, task));
}

function nowIso() {
  return new Date().toISOString();
}

function uniqueId(prefix) {
  uniqueIdCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueIdCounter}`;
}

function templateLabel(templateType) {
  return (
    {
      definition: "定义型",
      comparison: "对比型",
      scenario: "场景型",
      decision: "决策型"
    }[templateType] || templateType
  );
}

function contentTypeLabel(contentType) {
  return (
    {
      article: "文章",
      faq: "问答页",
      comparison_page: "对比页",
      scenario_page: "场景页"
    }[contentType] || contentType
  );
}

function pickTemplateType(keyword) {
  if (keyword.category === "comparison") return "comparison";
  if (keyword.category === "scenario" || keyword.category === "deployment") return "scenario";
  if (keyword.intent === "decision") return "decision";
  return "definition";
}

function makeTopicTitle(keyword) {
  return keyword.suggested_titles?.[0] || keyword.keyword;
}

function articleTypeLabel(articleType) {
  return (
    {
      article: "文章",
      faq: "问答页",
      comparison_page: "对比页",
      scenario_page: "场景页"
    }[articleType] || articleType
  );
}

function makeSlug(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function summarizeMarkdown(content = "", maxLength = 120) {
  const plain = String(content || "")
    .replace(/^#+\s*/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}

function getPublishAdapter(channelType) {
  return publishAdapterCatalog[channelType] || publishAdapterCatalog.website_blog;
}

function getPublishTemplate(channelType, articleType = "article") {
  const adapter = getPublishAdapter(channelType);
  return (
    adapter.templates[articleType] ||
    adapter.templates.article || {
      id: "generic_publish_template",
      label: "通用发布模板"
    }
  );
}

function buildPublishPayloadPreview(article, channel) {
  const adapter = getPublishAdapter(channel?.channel_type);
  const template = getPublishTemplate(channel?.channel_type, article?.article_type);
  const summary = article?.excerpt || summarizeMarkdown(article?.content_markdown || "", 140);
  const base = {
    title: article?.title || "",
    summary,
    tags: article?.tags || [],
    author: channel?.default_author || article?.created_by || "运营团队",
    category: channel?.default_category || article?.article_type_label || articleTypeLabel(article?.article_type),
    cta_text: brandProfile.default_cta
  };

  if (channel?.channel_type === "website_blog") {
    return {
      adapter_id: adapter.id,
      adapter_label: adapter.label,
      delivery_mode: adapter.delivery_mode,
      template_id: template.id,
      template_label: template.label,
      payload: {
        ...base,
        slug: makeSlug(article?.seo_title || article?.title || article?.id),
        seo_title: article?.seo_title || article?.title || "",
        seo_description: article?.seo_description || summary,
        body_markdown: article?.content_markdown || ""
      }
    };
  }

  if (channel?.channel_type === "zhihu_column") {
    return {
      adapter_id: adapter.id,
      adapter_label: adapter.label,
      delivery_mode: adapter.delivery_mode,
      template_id: template.id,
      template_label: template.label,
      payload: {
        ...base,
        intro: summary,
        answer_markdown: article?.content_markdown || "",
        topics: article?.tags || [],
        cover_statement: "以下内容基于中国智能体行业实践整理。"
      }
    };
  }

  if (channel?.channel_type === "wechat_official") {
    return {
      adapter_id: adapter.id,
      adapter_label: adapter.label,
      delivery_mode: adapter.delivery_mode,
      template_id: template.id,
      template_label: template.label,
      payload: {
        ...base,
        digest: summary,
        cover_title: article?.title || "",
        body_markdown: article?.content_markdown || "",
        source_statement: "内容由 GEO Pulse 自动编排，发布前需人工复核。"
      }
    };
  }

  return {
    adapter_id: adapter.id,
    adapter_label: adapter.label,
    delivery_mode: adapter.delivery_mode,
    template_id: template.id,
    template_label: template.label,
    payload: {
      ...base,
      note_excerpt: summarizeMarkdown(article?.content_markdown || "", 80),
      body_markdown: article?.content_markdown || ""
    }
  };
}

function buildPublishCalendarFields(scheduledAt) {
  const value = String(scheduledAt || "").trim();
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) {
    return {
      calendar_date: match[1],
      calendar_slot_label: match[2]
    };
  }

  return {
    calendar_date: value.slice(0, 10),
    calendar_slot_label: value.includes(" ") ? value.slice(11, 16) : ""
  };
}

function withPublishTaskCalendar(task) {
  return {
    ...task,
    ...buildPublishCalendarFields(task.scheduled_at)
  };
}

function approvalStatusLabel(status) {
  return (
    {
      pending: "待审批",
      approved: "已批准",
      rejected: "已退回",
      not_required: "免审批"
    }[status] || status || "待审批"
  );
}

function defaultApprovalStatus(task) {
  if (task.approval_status) return task.approval_status;
  if (task.require_confirmation === false) return "not_required";
  if (["running", "completed", "partial_failed", "failed", "canceled"].includes(task.status)) return "approved";
  return "pending";
}

function defaultApprovalSteps(task, approvalStatus = defaultApprovalStatus(task)) {
  if (Array.isArray(task.approval_steps) && task.approval_steps.length) {
    return task.approval_steps;
  }
  return [
    {
      id: `${task.id}-approval-owner`,
      step_label: "运营负责人审批",
      status: approvalStatus === "rejected" ? "rejected" : approvalStatus === "pending" ? "pending" : "approved",
      status_label: approvalStatus === "rejected" ? "已退回" : approvalStatus === "pending" ? "待审批" : "已批准",
      approver_id: task.approved_by || "user-1",
      approver_name: task.approved_by_name || "Luna",
      approved_at: task.approved_at || null,
      note: task.approval_note || ""
    }
  ];
}

function withPublishTaskApproval(task) {
  const approvalStatus = defaultApprovalStatus(task);
  const approvalRequired = task.approval_required ?? task.require_confirmation !== false;
  return {
    ...task,
    approval_required: approvalRequired,
    approval_status: approvalStatus,
    approval_status_label: task.approval_status_label || approvalStatusLabel(approvalStatus),
    approval_steps: defaultApprovalSteps(task, approvalStatus),
    approved_by: task.approved_by || null,
    approved_by_name: task.approved_by_name || null,
    approved_at: task.approved_at || null,
    approval_note: task.approval_note || ""
  };
}

function channelPostVariantLabel(channelType) {
  return (
    {
      website_blog: "官网长文",
      zhihu_column: "知乎回答",
      wechat_official: "公众号草稿"
    }[channelType] || "渠道内容"
  );
}

function channelPostVariantType(channelType) {
  return (
    {
      website_blog: "website_blog",
      zhihu_column: "zhihu_answer",
      wechat_official: "wechat_draft"
    }[channelType] || "generic_post"
  );
}

function buildPostVariants(article, channel, preview) {
  const payload = preview?.payload || {};
  const channelType = channel?.channel_type || "generic";
  const title = payload.title || article?.title || "";
  const summary =
    payload.summary || payload.digest || payload.intro || summarizeMarkdown(article?.content_markdown || "", 120);

  return [
    {
      id: `${article?.id || "article"}-${channel?.id || channelType}-primary`,
      variant_type: channelPostVariantType(channelType),
      variant_label: channelPostVariantLabel(channelType),
      title,
      summary,
      status: title ? "ready" : "warning",
      status_label: title ? "已就绪" : "需补标题"
    }
  ];
}

function readinessCheck(key, label, status, message) {
  return {
    key,
    label,
    status,
    status_label:
      {
        passed: "已就绪",
        warning: "需确认",
        failed: "阻断"
      }[status] || status,
    message
  };
}

function buildReadinessChecks(article, channel, preview, task) {
  const payload = preview?.payload || {};
  const checks = [
    readinessCheck(
      "title",
      "标题",
      article?.title || payload.title ? "passed" : "failed",
      article?.title || payload.title ? "文章标题可用于渠道内容。" : "缺少文章标题。"
    ),
    readinessCheck(
      "content",
      "正文内容",
      article?.content_markdown || payload.body_markdown || payload.answer_markdown ? "passed" : "failed",
      article?.content_markdown || payload.body_markdown || payload.answer_markdown
        ? "正文内容已生成。"
        : "正文为空，无法发布。"
    ),
    readinessCheck(
      "payload",
      "渠道载荷",
      preview?.payload ? "passed" : "failed",
      preview?.payload ? `${preview.template_label || "渠道模板"} 已完成映射。` : "渠道载荷尚未生成。"
    ),
    readinessCheck(
      "channel_auth",
      "渠道认证",
      channel?.auth_status === "connected" ? "passed" : "failed",
      channel?.auth_status === "connected"
        ? `${channel.channel_name || "渠道"} 已连接。`
        : `${channel?.channel_name || "渠道"} 认证不可用。`
    ),
    readinessCheck(
      "schedule",
      "排期",
      task?.scheduled_at ? "passed" : "warning",
      task?.scheduled_at ? `计划 ${buildPublishCalendarFields(task.scheduled_at).calendar_slot_label || "待定"} 执行。` : "缺少明确排期。"
    )
  ];

  if (task?.require_confirmation) {
    checks.push(
      readinessCheck(
        "confirmation",
        "人工确认",
        channel?.channel_type === "wechat_official" ? "warning" : "passed",
        channel?.channel_type === "wechat_official" ? "公众号发布前需要人工确认。" : "任务已开启确认要求。"
      )
    );
  }

  return checks;
}

function summarizeReadiness(checks = []) {
  if (checks.some((item) => item.status === "failed")) {
    return {
      readiness_status: "blocked",
      readiness_status_label: "阻断"
    };
  }
  if (checks.some((item) => item.status === "warning")) {
    return {
      readiness_status: "warning",
      readiness_status_label: "需确认"
    };
  }
  return {
    readiness_status: "ready",
    readiness_status_label: "已就绪"
  };
}

function enrichPublishTaskItem(item, task = byId(publishTasks, item.publish_task_id)) {
  const article = getArticleById(item.article_id);
  const channel = getChannelById(item.channel_id);
  const preview = article && channel ? buildPublishPayloadPreview(article, channel) : null;
  const payloadPreview = item.payload_preview || preview?.payload || null;
  const postVariants =
    Array.isArray(item.post_variants) && item.post_variants.length
      ? item.post_variants
      : buildPostVariants(article, channel, preview);
  const readinessChecks =
    Array.isArray(item.readiness_checks) && item.readiness_checks.length
      ? item.readiness_checks
      : buildReadinessChecks(article, channel, preview, task);
  const readinessSummary = summarizeReadiness(readinessChecks);

  return {
    ...item,
    article,
    channel,
    adapter_id: item.adapter_id || preview?.adapter_id || channel?.adapter_id || "",
    adapter_label: item.adapter_label || preview?.adapter_label || channel?.adapter_label || "",
    template_id: item.template_id || preview?.template_id || "",
    template_label: item.template_label || preview?.template_label || "",
    delivery_mode: item.delivery_mode || preview?.delivery_mode || "",
    failure_reason_label: item.failure_reason_label || publishFailureLabel(item.failure_reason_code),
    payload_preview: payloadPreview,
    post_variants: postVariants,
    readiness_checks: readinessChecks,
    readiness_status: item.readiness_status || readinessSummary.readiness_status,
    readiness_status_label: item.readiness_status_label || readinessSummary.readiness_status_label
  };
}

function publishFailureLabel(code) {
  if (!code) {
    return "";
  }
  return (
    {
      auth_expired: "认证失效",
      payload_invalid: "格式映射失败",
      article_missing: "文章不存在",
      content_empty: "正文为空",
      manual_confirmation_required: "需要人工确认"
    }[code] || code || "发布失败"
  );
}

function buildPublishedUrl(channel, article, executionMode = "api_push") {
  const slug = makeSlug(article?.seo_title || article?.title || article?.id || "article");
  if (channel?.channel_type === "website_blog") {
    return `https://agentcore.cn/blog/${slug}`;
  }
  if (channel?.channel_type === "zhihu_column") {
    return `https://zhuanlan.zhihu.com/p/${slug}`;
  }
  if (channel?.channel_type === "wechat_official") {
    return executionMode === "manual_takeover"
      ? `https://mp.weixin.qq.com/s/${slug}`
      : `https://mp.weixin.qq.com/draft/${slug}`;
  }
  return `https://example.local/${channel?.channel_type || "publish"}/${slug}`;
}

function recalculatePublishTask(task) {
  const items = publishTaskItems.filter((item) => item.publish_task_id === task.id);
  const publishedCount = items.filter((item) => item.status === "published").length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const queuedCount = items.filter((item) => item.status === "queued").length;
  const manualTakeoverCount = items.filter((item) => item.execution_mode === "manual_takeover").length;

  task.total_count = items.length;
  task.success_count = publishedCount;
  task.failed_count = failedCount;
  task.manual_takeover_count = manualTakeoverCount;

  if (task.status !== "canceled") {
    if (queuedCount && !publishedCount && !failedCount) {
      task.status = "queued";
      task.status_label = "排队中";
    } else if (queuedCount) {
      task.status = "running";
      task.status_label = "运行中";
    } else if (failedCount && publishedCount) {
      task.status = "partial_failed";
      task.status_label = "部分失败";
    } else if (failedCount) {
      task.status = "failed";
      task.status_label = "失败";
    } else {
      task.status = "completed";
      task.status_label = "已完成";
    }
  }

  task.updated_at = nowIso();
  return task;
}

function markPublishTaskItemFailed(item, reasonCode, message) {
  item.status = "failed";
  item.status_label = "失败";
  item.execution_mode = "failed";
  item.failure_reason_code = reasonCode;
  item.failure_reason_label = publishFailureLabel(reasonCode);
  item.failure_message = message;
  item.manual_takeover_required =
    reasonCode === "auth_expired" || reasonCode === "manual_confirmation_required";
  item.last_attempted_at = nowIso();
  item.attempt_count = Number(item.attempt_count || 0) + 1;
  item.updated_at = nowIso();
  markArticleQueued(item.article_id);
}

function markPublishTaskItemPublished(item, channel, article, executionMode) {
  item.status = "published";
  item.status_label = "已发布";
  item.execution_mode = executionMode;
  item.manual_takeover_required = false;
  item.published_at = nowIso();
  item.published_url = buildPublishedUrl(channel, article, executionMode);
  item.last_attempted_at = item.published_at;
  item.attempt_count = Number(item.attempt_count || 0) + 1;
  item.updated_at = nowIso();
  delete item.failure_reason_code;
  delete item.failure_reason_label;
  delete item.failure_message;
  markArticlePublished(item.article_id);
}

function executePublishTaskItem(item, task, options = {}) {
  const article = getArticleById(item.article_id);
  const channel = getChannelById(item.channel_id);
  const forceManual = options.mode === "manual_takeover";
  const preview = article && channel ? buildPublishPayloadPreview(article, channel) : null;
  const readinessChecks = buildReadinessChecks(article, channel, preview, task);
  const readinessSummary = summarizeReadiness(readinessChecks);

  item.adapter_id = preview?.adapter_id || item.adapter_id || channel?.adapter_id || "";
  item.adapter_label = preview?.adapter_label || item.adapter_label || channel?.adapter_label || "";
  item.template_id = preview?.template_id || item.template_id || "";
  item.template_label = preview?.template_label || item.template_label || "";
  item.delivery_mode = preview?.delivery_mode || item.delivery_mode || "";
  item.payload_preview = preview?.payload || item.payload_preview || null;
  item.post_variants = buildPostVariants(article, channel, preview);
  item.readiness_checks = readinessChecks;
  item.readiness_status = readinessSummary.readiness_status;
  item.readiness_status_label = readinessSummary.readiness_status_label;

  if (!article) {
    markPublishTaskItemFailed(item, "article_missing", "文章不存在，无法执行分发。");
    return item;
  }

  if (!channel) {
    markPublishTaskItemFailed(item, "payload_invalid", "渠道不存在，无法生成发布载荷。");
    return item;
  }

  if (channel.auth_status !== "connected" && !forceManual) {
    markPublishTaskItemFailed(item, "auth_expired", `${channel.channel_name} 认证失效，请先重新认证。`);
    return item;
  }

  if (!article.content_markdown) {
    markPublishTaskItemFailed(item, "content_empty", "正文为空，无法生成发布内容。");
    return item;
  }

  if (task.require_confirmation && channel.channel_type === "wechat_official" && !forceManual) {
    markPublishTaskItemFailed(
      item,
      "manual_confirmation_required",
      "公众号渠道要求人工确认后再发布，已转入人工接管。"
    );
    return item;
  }

  markPublishTaskItemPublished(item, channel, article, forceManual ? "manual_takeover" : preview?.delivery_mode || "api_push");
  return item;
}

function buildPublishTaskItem(task, articleId, channelId, index = 0) {
  const article = getArticleById(articleId);
  const channel = getChannelById(channelId);
  const preview = article && channel ? buildPublishPayloadPreview(article, channel) : null;
  const readinessChecks = buildReadinessChecks(article, channel, preview, task);
  const readinessSummary = summarizeReadiness(readinessChecks);
  return {
    id: `${uniqueId("pti")}-${index}`,
    publish_task_id: task.id,
    article_id: articleId,
    channel_id: channelId,
    status: "queued",
    status_label: "排队中",
    execution_mode: "queued",
    adapter_id: preview?.adapter_id || channel?.adapter_id || "",
    adapter_label: preview?.adapter_label || channel?.adapter_label || "",
    template_id: preview?.template_id || "",
    template_label: preview?.template_label || "",
    delivery_mode: preview?.delivery_mode || "",
    payload_preview: preview?.payload || null,
    post_variants: buildPostVariants(article, channel, preview),
    readiness_checks: readinessChecks,
    readiness_status: readinessSummary.readiness_status,
    readiness_status_label: readinessSummary.readiness_status_label,
    attempt_count: 0,
    manual_takeover_required: false,
    updated_at: nowIso()
  };
}

function markArticlePublished(articleId) {
  const article = getArticleById(articleId);
  if (!article) return;
  article.publish_status = "published";
  article.publish_status_label = "已发布";
  article.updated_at = nowIso();
}

function markArticleQueued(articleId) {
  const article = getArticleById(articleId);
  if (!article) return;
  article.publish_status = "ready_to_publish";
  article.publish_status_label = "待发布";
  article.updated_at = nowIso();
}

function sourceLabel(sourceType) {
  return (
    {
      owned_self_media: "自有自媒体",
      industry_self_media: "行业自媒体",
      authority_media: "权威媒体",
      mixed_media: "混合来源",
      suggestion: "搜索联想",
      related_search: "相关搜索",
      qa_hot: "问答热词",
      competitor_site: "竞品站点",
      manual_import: "手动导入"
    }[sourceType] || sourceType
  );
}

function sourceScopeLabel(sourceScope) {
  return (
    {
      owned_self_media: "自有自媒体",
      industry_self_media: "行业自媒体",
      authority_media: "权威媒体",
      mixed_media: "混合来源"
    }[sourceScope] || sourceScope || "混合来源"
  );
}

function getSourceAdapterByMode(mode = "") {
  return sourceAdapterContracts.find((item) => item.id === mode || item.source_modes.includes(mode)) || sourceAdapterContracts[0];
}

function sourceAdapterErrorLabel(code) {
  return (
    {
      source_timeout: "来源超时",
      source_rate_limited: "来源限流",
      source_unreachable: "来源不可达",
      thread_access_limited: "线程访问受限",
      layout_changed: "页面结构变化",
      layout_parse_failed: "结构解析失败",
      normalize_empty_title: "标题为空",
      normalize_empty_question: "问题为空",
      normalize_missing_url: "缺少链接",
      entity_alias_conflict: "实体别名冲突",
      duplicate_cluster_overflow: "重复簇过大",
      canonical_collision: "规范键冲突",
      quality_below_threshold: "质量低于阈值"
    }[code] || code
  );
}

function sourceAdapterErrorSeverity(code) {
  if (/unreachable|parse_failed|access_limited/.test(code)) return "error";
  if (/rate_limited|timeout|below_threshold|layout_changed/.test(code)) return "warning";
  return "info";
}

function sourceAdapterErrorTaxonomy(contract = {}) {
  const codes = new Set();
  (contract.stages || []).forEach((stage) => {
    (stage.failure_codes || []).forEach((code) => codes.add(code));
  });
  return [...codes].map((code) => ({
    code,
    label: sourceAdapterErrorLabel(code),
    severity: sourceAdapterErrorSeverity(code)
  }));
}

function enrichMediaSource(source = {}) {
  const contract = getSourceAdapterByMode(source.extraction_mode || "headline_cluster");
  return {
    ...source,
    adapter_contract_id: contract.id,
    adapter_contract_label: contract.label,
    adapter_contract_version: contract.contract_version,
    adapter_stages: (contract.stages || []).map((item) => item.stage_id),
    quality_signals: [...(contract.quality_signals || [])],
    error_codes: sourceAdapterErrorTaxonomy(contract).map((item) => item.code),
    privacy_boundary: contract.privacy_boundary
  };
}

function buildSourceAdapterEvidence({ contract, sourceIds = [], rawCount = 0, dedupedCount = 0, sourceScope = "" }) {
  const duplicateCount = Math.max(0, Number(rawCount || 0) - Number(dedupedCount || 0));
  const qualityBase = sourceScope === "authority_media" ? 88 : sourceScope === "owned_self_media" ? 91 : 84;
  const averageQuality = Math.max(60, Math.min(98, qualityBase - Math.min(12, duplicateCount)));
  return {
    fetch: {
      fetch_url_count: Math.max(1, sourceIds.length || 1),
      source_ref_count: Math.max(1, sourceIds.length || 1),
      http_status_sample: "200, 200, 304"
    },
    normalize: {
      normalized_record_count: Number(rawCount || 0),
      retained_field_count: new Set((contract.stages || []).flatMap((stage) => stage.output_schema || [])).size,
      dropped_empty_title_count: 0
    },
    dedupe: {
      deduped_record_count: Number(dedupedCount || 0),
      duplicate_count: duplicateCount,
      dedupe_strategy: "normalized-title+canonical-url"
    },
    score: {
      average_quality_score: averageQuality,
      low_quality_count: duplicateCount > 6 ? 1 : 0,
      quality_signal_count: (contract.quality_signals || []).length
    }
  };
}

function buildSourceQualitySummary(evidence = {}, contract = {}) {
  return {
    average_quality_score: Number(evidence.score?.average_quality_score || 0),
    low_quality_count: Number(evidence.score?.low_quality_count || 0),
    signals: [...(contract.quality_signals || [])]
  };
}

function enrichKeywordCrawlJob(job = {}) {
  const contract = getSourceAdapterByMode(job.source_adapter_id || job.extraction_mode || "headline_cluster");
  const adapterEvidence =
    job.adapter_evidence ||
    buildSourceAdapterEvidence({
      contract,
      sourceIds: job.source_ids || [],
      rawCount: job.raw_count,
      dedupedCount: job.deduped_count,
      sourceScope: job.source_scope
    });
  return {
    ...job,
    source_adapter_id: job.source_adapter_id || contract.id,
    source_adapter_label: job.source_adapter_label || contract.label,
    source_adapter_version: job.source_adapter_version || contract.contract_version,
    adapter_evidence: adapterEvidence,
    quality_summary: job.quality_summary || buildSourceQualitySummary(adapterEvidence, contract),
    error_taxonomy: job.error_taxonomy || sourceAdapterErrorTaxonomy(contract)
  };
}

function monitoringGoalLabel(goal) {
  return (
    {
      repurpose: "内容复用",
      hotspot_follow: "热点跟进",
      authority_follow: "议题跟踪",
      full_funnel: "全链路自动运营"
    }[goal] || goal || "问题发现"
  );
}

function scheduleModeLabel(mode) {
  return (
    {
      manual: "手动",
      hourly: "每小时",
      daily: "每日滚动",
      twice_daily: "每日两轮",
      always_on: "持续运行",
      cron_expression: "自定义定时"
    }[mode] || mode || "手动"
  );
}

function reviewPolicyLabel(policy) {
  return (
    {
      manual_first: "先审后发",
      auto_pass: "规则通过自动审核"
    }[policy] || policy || "先审后发"
  );
}

function addMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

function computeNextCronRunAt(expression = "", baseIso = nowIso()) {
  const fields = String(expression || "").trim().split(/\s+/);
  if (fields.length !== 5) return null;

  const [minuteField, hourField] = fields;
  const minute = minuteField === "*" ? null : Number(minuteField);
  const hour = hourField === "*" ? null : Number(hourField);

  if (
    (minute !== null && (!Number.isInteger(minute) || minute < 0 || minute > 59)) ||
    (hour !== null && (!Number.isInteger(hour) || hour < 0 || hour > 23))
  ) {
    return null;
  }

  const next = new Date(baseIso);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  for (let step = 0; step < 60 * 24 * 14; step += 1) {
    if ((minute === null || next.getMinutes() === minute) && (hour === null || next.getHours() === hour)) {
      return next.toISOString();
    }
    next.setMinutes(next.getMinutes() + 1);
  }

  return null;
}

function computeNextRunAt(mode, baseIso = nowIso(), isEnabled = true, cronExpression = "") {
  if (!isEnabled) return null;
  if (mode === "hourly") return addMinutes(baseIso, 60);
  if (mode === "daily") return addMinutes(baseIso, 24 * 60);
  if (mode === "twice_daily") return addMinutes(baseIso, 12 * 60);
  if (mode === "always_on") return addMinutes(baseIso, 15);
  if (mode === "cron_expression") return computeNextCronRunAt(cronExpression, baseIso);
  return null;
}

function pickSourceIdsForScope(sourceScope) {
  if (sourceScope === "owned_self_media") {
    return mediaSources.filter((item) => item.source_type === "owned_self_media").map((item) => item.id);
  }
  if (sourceScope === "industry_self_media") {
    return mediaSources.filter((item) => item.source_type === "industry_self_media").map((item) => item.id);
  }
  if (sourceScope === "authority_media") {
    return mediaSources.filter((item) => item.source_type === "authority_media").map((item) => item.id);
  }
  return mediaSources.slice(0, 4).map((item) => item.id);
}

function inferQuestionMeta(question) {
  if (question.includes("区别") || question.includes("对比")) {
    return {
      category: "comparison",
      category_label: "对比词",
      intent: "consideration",
      intent_label: "考虑",
      recommended_content_type: "comparison_page",
      recommended_content_type_label: "对比页"
    };
  }
  if (question.includes("怎么选") || question.includes("哪家") || question.includes("最好")) {
    return {
      category: "definition",
      category_label: "决策词",
      intent: "decision",
      intent_label: "决策",
      recommended_content_type: "comparison_page",
      recommended_content_type_label: "对比页"
    };
  }
  if (question.includes("部署") || question.includes("私有化") || question.includes("合规")) {
    return {
      category: "deployment",
      category_label: "部署词",
      intent: "decision",
      intent_label: "决策",
      recommended_content_type: "scenario_page",
      recommended_content_type_label: "场景页"
    };
  }
  if (question.includes("流程") || question.includes("落地") || question.includes("工作流")) {
    return {
      category: "scenario",
      category_label: "场景词",
      intent: "consideration",
      intent_label: "考虑",
      recommended_content_type: "scenario_page",
      recommended_content_type_label: "场景页"
    };
  }
  return {
    category: "definition",
    category_label: "定义词",
    intent: "awareness",
    intent_label: "认知",
    recommended_content_type: "article",
    recommended_content_type_label: "文章"
  };
}

function makeSuggestedTitles(question) {
  return [question, `${question}：中国智能体 GEO 解释与实践`];
}

function buildQuestionSet(seed) {
  const value = seed.trim();
  return [
    `什么是${value}，适合哪些中国企业？`,
    `${value}怎么落地到实际业务流程？`,
    `${value}和普通 AI 工具有什么区别？`,
    `企业在选择${value}时最该关注哪些能力？`,
    `${value}是否支持私有化部署和合规要求？`,
    `哪些行业最适合优先上线${value}？`
  ];
}

function buildQuestionsFromSourceScope(seed, sourceScope, monitoringGoal) {
  const value = seed.trim();

  if (sourceScope === "owned_self_media") {
    return [
      `${value}在公众号里最容易被咨询的真实问题有哪些？`,
      `${value}怎么把知乎高互动问答改写成官网长文？`,
      `哪些关于${value}的内容适合公众号、官网和知乎三端分发？`,
      `${value}用户在自有内容评论区最常追问什么？`,
      `${value}怎么把已有品牌内容重组为 AI 更容易引用的文章？`
    ];
  }

  if (sourceScope === "industry_self_media") {
    return [
      `行业自媒体最近在讨论${value}时最常提到哪些争议点？`,
      `${value}在行业 KOL 语境里最常被拿来和什么方案对比？`,
      `围绕${value}，哪些话题适合做快速跟进型文章？`,
      `${value}在自媒体热点里最容易引发转发的问题是什么？`,
      `如果跟进${value}热点，哪些角度最容易形成品牌观点？`
    ];
  }

  if (sourceScope === "authority_media") {
    return [
      `权威媒体最近在讨论${value}时最常引用哪些判断框架？`,
      `${value}在权威报道里最常关联哪些行业趋势和政策变化？`,
      `围绕${value}，哪些问题适合写成更容易被 AI 引用的解释型文章？`,
      `${value}在权威媒体中最容易延展出的企业决策问题有哪些？`,
      `如果基于权威报道写${value}，最该补充哪些企业落地视角？`
    ];
  }

  if (monitoringGoal === "repurpose") {
    return [
      `怎么把关于${value}的旧文章拆成问答页、对比页和公众号短稿？`,
      `${value}现有内容里，哪些问题值得被重新包装成 GEO 文章？`,
      `${value}的品牌知识如何稳定复用到多渠道内容里？`
    ];
  }

  return [
    ...buildQuestionSet(value),
    `各类自媒体最近最关注${value}的哪些问题？`,
    `权威媒体与行业自媒体在${value}上的表达差异是什么？`,
    `怎么围绕${value}建立可自动写作和自动分发的内容飞轮？`
  ];
}

function recalcSummaryCounts() {
  const highPriorityCount = keywords.filter((item) => item.priority_score >= 85).length;
  const generatedArticles = articles.length;
  const publishSuccessRate = publishTaskItems.length
    ? Math.round((publishTaskItems.filter((item) => item.status === "published").length / publishTaskItems.length) * 100)
    : 0;
  return {
    weekly_new_keywords: keywords.length,
    high_priority_keywords: highPriorityCount,
    weekly_generated_articles: generatedArticles,
    weekly_publish_success_rate: publishSuccessRate
  };
}

export function getDashboardSummary() {
  return recalcSummaryCounts();
}

export function getKeywordTrend() {
  return [
    { date: "2026-04-11", new_keywords: 38, high_score_keywords: 22 },
    { date: "2026-04-12", new_keywords: 54, high_score_keywords: 24 },
    { date: "2026-04-13", new_keywords: 48, high_score_keywords: 28 },
    { date: "2026-04-14", new_keywords: 62, high_score_keywords: 34 },
    { date: "2026-04-15", new_keywords: 81, high_score_keywords: 44 },
    { date: "2026-04-16", new_keywords: 73, high_score_keywords: 38 },
    { date: "2026-04-17", new_keywords: 88, high_score_keywords: 49 }
  ];
}

export function getContentFunnel() {
  return [
    { label: "已选关键词", value: 38 },
    { label: "已生成选题", value: 21 },
    { label: "已生成草稿", value: 16 },
    { label: "待审核文章", value: 6 },
    { label: "已发布文章", value: 12 }
  ];
}

export function getTopKeywords() {
  return keywords.filter((item) => item.priority_score >= 85);
}

export function getRecentPublishes() {
  return publishTaskItems
    .filter((item) => item.status === "published" || item.status === "failed")
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      title: getArticleById(item.article_id)?.title || "",
      channel_name: getChannelById(item.channel_id)?.channel_name || "",
      status: item.status,
      status_label: item.status_label,
      published_url: item.published_url || null,
      published_at: item.published_at || null,
      failure_message: item.failure_message || null
    }));
}

export function listKeywordCrawlJobs(query = {}) {
  return paginate(keywordCrawlJobs.map(enrichKeywordCrawlJob), query.page, query.page_size);
}

export function listMediaSources(query = {}) {
  let items = mediaSources.map(enrichMediaSource);
  if (query.source_type) items = items.filter((item) => item.source_type === query.source_type);
  if (query.platform) items = items.filter((item) => item.platform === query.platform);
  return paginate(items, query.page, query.page_size);
}

export function listSourceAdapterContracts(query = {}) {
  let items = sourceAdapterContracts.map((item) => ({
    ...deepClone(item),
    error_taxonomy: sourceAdapterErrorTaxonomy(item)
  }));
  if (query.mode) items = items.filter((item) => item.source_modes.includes(query.mode) || item.id === query.mode);
  return paginate(items, query.page, query.page_size);
}

export function getSourceAdapterContract(id) {
  const contract = sourceAdapterContracts.find((item) => item.id === id || item.source_modes.includes(id));
  return contract
    ? {
        ...deepClone(contract),
        error_taxonomy: sourceAdapterErrorTaxonomy(contract)
      }
    : null;
}

export function listAutomationProviders(query = {}) {
  let items = listAutomationProvidersFromRegistry();
  if (query.capability) items = items.filter((item) => item.capability === query.capability);
  if (query.status) items = items.filter((item) => item.status === query.status);
  return paginate(items, query.page, query.page_size);
}

export function listAutomationConnectors(query = {}) {
  let items = automationConnectors.map(sanitizeAutomationConnector);
  if (query.connector_type) items = items.filter((item) => item.connector_type === query.connector_type);
  if (query.status) items = items.filter((item) => item.status === query.status);
  return paginate(items, query.page, query.page_size);
}

export function getAutomationConnector(id) {
  const connector = byId(automationConnectors, id);
  return connector ? sanitizeAutomationConnector(connector) : null;
}

function recordProviderInvocation(capability, execution = {}, extra = {}) {
  const invocation = {
    id: uniqueId("pinv"),
    capability,
    provider_id: execution.provider_id || null,
    provider_label: execution.provider_label || null,
    provider_type: execution.provider_type || null,
    execution_mode: execution.mode || "local",
    endpoint: execution.endpoint || "",
    model_name: execution.model_name || "",
    attempts: Number(execution.attempts || 1),
    duration_ms: Number(execution.duration_ms || 0),
    error_message: execution.error_message || "",
    fallback_provider_id: execution.fallback_provider_id || null,
    created_at: nowIso(),
    ...extra
  };
  providerInvocations.unshift(invocation);
  return invocation;
}

function automationStepLabel(stepType) {
  return (
    {
      start: "启动策略",
      crawl: "内容源抓取",
      rank: "问题筛选",
      topic: "选题规划",
      draft: "草稿生成",
      review: "审核守门",
      publish: "发布编排"
    }[stepType] || stepType || "执行步骤"
  );
}

function automationStepStatus(level) {
  if (level === "error") {
    return {
      status: "failed",
      status_label: "失败"
    };
  }
  if (level === "warn") {
    return {
      status: "warning",
      status_label: "需处理"
    };
  }
  return {
    status: "succeeded",
    status_label: "已完成"
  };
}

function compactPreview(value = {}) {
  const result = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (["id", "step", "level", "message", "created_at", "provider_id", "provider_execution_mode", "error_message"].includes(key)) {
      continue;
    }
    result[key] = item;
  }
  return result;
}

function createAutomationRunSteps(run, runLogs = []) {
  return runLogs.map((log, index) => {
    const status = automationStepStatus(log.level);
    return {
      id: uniqueId("step"),
      run_id: run.id,
      sequence: index + 1,
      step_type: log.step || "step",
      step_label: automationStepLabel(log.step),
      status: status.status,
      status_label: status.status_label,
      provider_id: log.provider_id || null,
      connector_id: log.source_connector_id || log.connector_id || null,
      latency_ms: Number(log.duration_ms || log.latency_ms || 0),
      input_preview: {
        strategy_id: run.strategy_id,
        industry_topic: run.industry_topic,
        source_scope: run.source_scope
      },
      output_preview: compactPreview(log),
      error_message: log.level === "error" || log.level === "warn" ? log.message || "" : "",
      started_at: log.created_at || run.created_at,
      finished_at: log.created_at || run.created_at
    };
  });
}

function stepsForRun(runId) {
  return automationRunSteps
    .filter((item) => item.run_id === runId)
    .sort((left, right) => Number(left.sequence || 0) - Number(right.sequence || 0));
}

function withAutomationRunSteps(run) {
  return run
    ? {
        ...deepClone(run),
        steps: stepsForRun(run.id)
      }
    : null;
}

export function getProviderInvocationSummary() {
  const items = providerInvocations.slice(0, 200);
  return {
    total: providerInvocations.length,
    remote_count: items.filter((item) => item.execution_mode === "remote").length,
    fallback_count: items.filter((item) => item.execution_mode === "fallback_local").length,
    test_count: items.filter((item) => item.operation === "test_connection").length,
    error_count: items.filter((item) => item.error_message).length,
    average_duration_ms: items.length
      ? Math.round(items.reduce((sum, item) => sum + Number(item.duration_ms || 0), 0) / items.length)
      : 0,
    last_invoked_at: items[0]?.created_at || null
  };
}

export function listProviderInvocations(query = {}) {
  let items = [...providerInvocations];
  if (query.capability) items = items.filter((item) => item.capability === query.capability);
  if (query.provider_id) items = items.filter((item) => item.provider_id === query.provider_id);
  if (query.execution_mode) items = items.filter((item) => item.execution_mode === query.execution_mode);
  if (query.operation) items = items.filter((item) => item.operation === query.operation);
  return paginate(items, query.page, query.page_size);
}

export function listAuditEvents(query = {}) {
  let items = [...auditEvents];
  if (query.action) items = items.filter((item) => item.action === query.action);
  if (query.resource_type) items = items.filter((item) => item.resource_type === query.resource_type);
  if (query.resource_id) items = items.filter((item) => item.resource_id === query.resource_id);
  return paginate(items, query.page, query.page_size);
}

export function listPromptTemplates(query = {}) {
  let items = [...promptTemplates];
  if (query.purpose) items = items.filter((item) => item.purpose === query.purpose);
  if (query.status) items = items.filter((item) => item.status === query.status);
  return paginate(items, query.page, query.page_size);
}

export function getPromptTemplate(id) {
  return byId(promptTemplates, id);
}

export function listContentQualityTraces(query = {}) {
  let items = [...contentQualityTraces];
  if (query.article_id) items = items.filter((item) => item.article_id === query.article_id);
  if (query.prompt_template_id) items = items.filter((item) => item.prompt_template_id === query.prompt_template_id);
  if (query.model_config_id) items = items.filter((item) => item.model_config_id === query.model_config_id);
  return paginate(items, query.page, query.page_size);
}

export function recordAuditEventAction(action, resourceType, resourceId, details = {}) {
  const event = recordAuditEvent(action, resourceType, resourceId, details);
  persistState();
  return event;
}

export function getAutomationProviderConfig(providerId) {
  return getAutomationProvider(providerId);
}

export function getAutomationProviderProtocolConfig(providerId) {
  return getAutomationProviderProtocol(providerId);
}

export function saveAutomationProviderAction(providerId, patch = {}) {
  const provider = saveAutomationProvider(providerId, patch);
  if (!provider) {
    return null;
  }
  recordAuditEvent("automation_provider.update", "automation_provider", providerId, {
    changed_fields: Object.keys(patch).filter((key) => key !== "api_key"),
    capability: provider.capability,
    is_active: provider.is_active,
    enabled: provider.config?.enabled !== false
  });
  persistState();
  return provider;
}

export async function testAutomationProviderAction(providerId) {
  const provider = getAutomationProvider(providerId);
  if (!provider) {
    return null;
  }

  const result = await testAutomationProviderConnection(providerId);
  if (!result) {
    return null;
  }

  const invocation = recordProviderInvocation(
    provider.capability,
    {
      capability: provider.capability,
      provider_id: provider.id,
      provider_label: provider.label,
      provider_type: provider.type,
      mode: result.execution_mode || "remote",
      endpoint: result.endpoint || provider.config?.endpoint || "",
      model_name: provider.config?.model_name || "",
      attempts: result.attempts || 1,
      duration_ms: result.duration_ms || 0,
      error_message: result.error_message || ""
    },
    {
      operation: "test_connection",
      schema_valid: result.schema_valid,
      request_body: result.request_body,
      sample_response: result.sample_response
    }
  );

  persistState();
  return {
    ...result,
    invocation_id: invocation.id,
    invocation
  };
}

export function listSourceStrategies(query = {}) {
  let items = [...sourceStrategies];
  if (query.source_scope) items = items.filter((item) => item.source_scope === query.source_scope);
  if (query.monitoring_goal) items = items.filter((item) => item.monitoring_goal === query.monitoring_goal);
  return paginate(items, query.page, query.page_size);
}

export function getSourceStrategy(id) {
  return byId(sourceStrategies, id);
}

export function saveSourceStrategyAction(strategyId, patch = {}) {
  const strategy = sourceStrategies.find((item) => item.id === strategyId);
  if (!strategy) return null;

  if (typeof patch.name === "string") strategy.name = patch.name.trim() || strategy.name;
  if (typeof patch.monitoring_goal === "string") {
    strategy.monitoring_goal = patch.monitoring_goal;
    strategy.monitoring_goal_label = monitoringGoalLabel(patch.monitoring_goal);
  }
  if (typeof patch.schedule_mode === "string") {
    strategy.schedule_mode = patch.schedule_mode;
    strategy.schedule_mode_label = scheduleModeLabel(patch.schedule_mode);
    strategy.cadence = patch.schedule_mode;
    strategy.cadence_label = scheduleModeLabel(patch.schedule_mode);
  }
  if (typeof patch.cron_expression === "string") strategy.cron_expression = patch.cron_expression.trim();
  if (typeof patch.is_enabled === "boolean") strategy.is_enabled = patch.is_enabled;
  if (typeof patch.auto_generate_articles === "boolean") {
    strategy.auto_generate_articles = patch.auto_generate_articles;
  }
  if (typeof patch.auto_submit_review === "boolean") {
    strategy.auto_submit_review = patch.auto_submit_review;
  }
  if (typeof patch.review_policy === "string") {
    strategy.review_policy = patch.review_policy;
    strategy.review_policy_label = reviewPolicyLabel(patch.review_policy);
  }
  if (typeof patch.auto_create_publish_task === "boolean") {
    strategy.auto_create_publish_task = patch.auto_create_publish_task;
  }
  if (typeof patch.publish_mode === "string") {
    strategy.publish_mode = patch.publish_mode;
    strategy.publish_mode_label = patch.publish_mode === "immediate" ? "立即" : "定时";
  }
  if (typeof patch.default_channel_id === "string") {
    strategy.default_channel_id = patch.default_channel_id.trim() || strategy.default_channel_id;
  }
  if (typeof patch.min_word_count === "number") {
    strategy.min_word_count = Math.max(200, Math.round(patch.min_word_count));
  }
  if (typeof patch.required_terms_count === "number") {
    strategy.required_terms_count = Math.max(0, Math.round(patch.required_terms_count));
  }
  if (typeof patch.block_on_forbidden_terms === "boolean") {
    strategy.block_on_forbidden_terms = patch.block_on_forbidden_terms;
  }
  if (typeof patch.allow_authority_direct_publish === "boolean") {
    strategy.allow_authority_direct_publish = patch.allow_authority_direct_publish;
  }
  if (Array.isArray(patch.source_ids) && patch.source_ids.length) {
    strategy.source_ids = patch.source_ids.map((item) => String(item).trim()).filter(Boolean);
  }
  if (Array.isArray(patch.distribution_channels) && patch.distribution_channels.length) {
    strategy.distribution_channels = patch.distribution_channels.map((item) => String(item).trim()).filter(Boolean);
  }

  strategy.next_run_at =
    typeof patch.next_run_at === "string"
      ? patch.next_run_at ||
        computeNextRunAt(strategy.schedule_mode, nowIso(), strategy.is_enabled, strategy.cron_expression)
      : computeNextRunAt(strategy.schedule_mode, nowIso(), strategy.is_enabled, strategy.cron_expression);

  persistState();
  return strategy;
}

export function listAutomationRuns(query = {}) {
  let items = [...automationRuns];
  if (query.strategy_id) items = items.filter((item) => item.strategy_id === query.strategy_id);
  if (query.status) items = items.filter((item) => item.status === query.status);
  return paginate(items.map(withAutomationRunSteps), query.page, query.page_size);
}

export function listKeywords(query = {}) {
  let items = [...keywords];
  if (query.category) items = items.filter((item) => item.category === query.category);
  if (query.status) items = items.filter((item) => item.status === query.status);
  if (query.keyword) items = items.filter((item) => item.keyword.includes(query.keyword));
  return paginate(items, query.page, query.page_size);
}

export function getKeyword(id) {
  return byId(keywords, id);
}

function keywordStatusLabel(status) {
  return (
    {
      selected: "机会池",
      scored: "已打分",
      watchlist: "观察",
      ignored: "已忽略"
    }[status] || status
  );
}

export function updateKeywordAction(keywordId, action) {
  const keyword = keywords.find((item) => item.id === keywordId);
  if (!keyword) return null;

  if (action === "select") {
    keyword.status = "selected";
    keyword.status_label = keywordStatusLabel("selected");
  }

  if (action === "watchlist") {
    keyword.status = "watchlist";
    keyword.status_label = keywordStatusLabel("watchlist");
  }

  if (action === "ignore") {
    keyword.status = "ignored";
    keyword.status_label = keywordStatusLabel("ignored");
  }

  if (action === "rescore") {
    keyword.geo_fit_score = Math.min(99, Number(keyword.geo_fit_score || 0) + 2);
    keyword.content_fit_score = Math.min(99, Number(keyword.content_fit_score || 0) + 1);
    keyword.priority_score = Math.min(
      99,
      Math.round(
        (Number(keyword.business_value_score || 0) +
          Number(keyword.geo_fit_score || 0) +
          Number(keyword.content_fit_score || 0)) /
          3
      )
    );
    if (keyword.status !== "selected") {
      keyword.status = "scored";
      keyword.status_label = keywordStatusLabel("scored");
    }
  }

  keyword.updated_at = nowIso();
  persistState();
  return keyword;
}

export function listTopicIdeas(query = {}) {
  let items = [...topicIdeas];
  if (query.status) items = items.filter((item) => item.status === query.status);
  if (query.keyword_id) items = items.filter((item) => item.keyword_id === query.keyword_id);
  return paginate(items, query.page, query.page_size);
}

export function getTopicIdea(id) {
  return byId(topicIdeas, id);
}

export function listContentTemplates(query = {}) {
  let items = [...contentTemplates];
  if (query.template_type) items = items.filter((item) => item.template_type === query.template_type);
  return paginate(items, query.page, query.page_size);
}

export function listArticles(query = {}) {
  let items = [...articles];
  if (query.review_status) items = items.filter((item) => item.review_status === query.review_status);
  if (query.publish_status) items = items.filter((item) => item.publish_status === query.publish_status);
  if (query.keyword_id) items = items.filter((item) => item.keyword_id === query.keyword_id);
  return paginate(items, query.page, query.page_size);
}

export function getArticle(id) {
  const article = byId(articles, id);
  if (!article) return null;
  return {
    ...article,
    versions: articleVersions.filter((item) => item.article_id === id),
    reviews: articleReviews.filter((item) => item.article_id === id)
  };
}

export function updateArticleAction(articleId, patch = {}) {
  const article = articles.find((item) => item.id === articleId);
  if (!article) return null;

  if (typeof patch.title === "string") {
    article.title = patch.title.trim() || article.title;
  }
  if (typeof patch.content_markdown === "string") {
    article.content_markdown = patch.content_markdown;
    article.word_count = patch.content_markdown.trim().length;
    article.excerpt = patch.content_markdown.trim().slice(0, 80);
  }
  if (typeof patch.seo_title === "string") {
    article.seo_title = patch.seo_title;
  }
  if (typeof patch.excerpt === "string") {
    article.excerpt = patch.excerpt;
  }

  article.updated_at = nowIso();

  const nextVersion =
    articleVersions
      .filter((item) => item.article_id === articleId)
      .reduce((max, item) => Math.max(max, item.version_no), 0) + 1;

  articleVersions.unshift({
    id: uniqueId("ver"),
    article_id: articleId,
    version_no: nextVersion,
    generation_mode: "manual",
    title: article.title,
    content_markdown: article.content_markdown,
    created_by: "user-1",
    created_at: nowIso()
  });

  persistState();
  return getArticle(articleId);
}

export async function createArticleFromTopicAction(topicId) {
  const topic = topicIdeas.find((item) => item.id === topicId);
  if (!topic) return null;

  const existing = articles.find((item) => item.topic_idea_id === topicId);
  if (existing) {
    return getArticle(existing.id);
  }

  const keyword = getKeyword(topic.keyword_id);
  const generated = await generateArticleDraft({
    topic,
    keyword,
    brandProfile,
    articleTypeLabel,
    idFactory: uniqueId,
    now: nowIso()
  });
  const providerInvocation = recordProviderInvocation("article_generation", generated.execution, {
    topic_id: topic.id,
    keyword_id: topic.keyword_id,
    output_count: 1
  });
  const promptTemplate = getPromptTemplate("geo_article_draft");
  const modelConfig =
    modelConfigs.find((item) => item.purpose === "article_generation" && item.is_default) ||
    modelConfigs.find((item) => item.purpose === "article_generation") ||
    modelConfigs[0];
  const articleQualityScore = Math.max(
    70,
    Math.min(
      98,
      82 +
        Math.min(8, Math.round(String(generated.article.content_markdown || "").length / 900)) +
        (generated.execution?.error_message ? -8 : 0)
    )
  );

  articles.unshift({
    ...generated.article,
    prompt_template_id: promptTemplate?.id || "geo_article_draft",
    prompt_template_version: promptTemplate?.active_version || 1,
    model_config_id: modelConfig?.id || null,
    provider_execution_mode: generated.execution?.mode || "local",
    provider_error_message: generated.execution?.error_message || "",
    provider_invocation_id: providerInvocation.id
  });
  articleVersions.unshift(generated.version);
  contentQualityTraces.unshift({
    id: uniqueId("qtrace"),
    article_id: generated.article.id,
    article_title: generated.article.title,
    prompt_template_id: promptTemplate?.id || "geo_article_draft",
    prompt_template_version: promptTemplate?.active_version || 1,
    model_config_id: modelConfig?.id || null,
    provider_id: generated.execution?.provider_id || generated.article.provider_id || null,
    score: articleQualityScore,
    status: articleQualityScore >= 80 ? "passed" : "needs_review",
    status_label: articleQualityScore >= 80 ? "通过" : "需复核",
    reasons: [
      "结构完整",
      generated.execution?.error_message ? "Provider 有异常信息" : "Provider 正常",
      "已绑定 Prompt 版本"
    ],
    created_at: nowIso()
  });

  topic.status = "generated";
  topic.status_label = "已生成草稿";
  topic.provider_execution_mode = generated.execution?.mode || "local";
  topic.provider_invocation_id = providerInvocation.id;
  topic.updated_at = nowIso();

  persistState();
  return getArticle(generated.article.id);
}

export function submitArticleReviewAction(articleId) {
  const article = articles.find((item) => item.id === articleId);
  if (!article) return null;

  article.review_status = "review_pending";
  article.review_status_label = "待审核";
  article.updated_at = nowIso();

  persistState();
  return getArticle(articleId);
}

export function listChannels(query = {}) {
  let items = [...channels];
  if (query.channel_type) items = items.filter((item) => item.channel_type === query.channel_type);
  if (query.auth_status) items = items.filter((item) => item.auth_status === query.auth_status);
  return paginate(
    items.map((item) => {
      const adapter = getPublishAdapter(item.channel_type);
      return {
        ...item,
        adapter_id: item.adapter_id || adapter.id,
        adapter_label: item.adapter_label || adapter.label,
        delivery_mode: adapter.delivery_mode
      };
    }),
    query.page,
    query.page_size
  );
}

export function saveChannelAction(channelId, patch = {}) {
  const channel = channels.find((item) => item.id === channelId);
  if (!channel) return null;

  if (typeof patch.channel_name === "string") channel.channel_name = patch.channel_name.trim() || channel.channel_name;
  if (typeof patch.account_name === "string") channel.account_name = patch.account_name.trim();
  if (typeof patch.default_author === "string") channel.default_author = patch.default_author.trim();
  if (typeof patch.default_category === "string") channel.default_category = patch.default_category.trim();
  if (typeof patch.auth_status === "string") {
    channel.auth_status = patch.auth_status;
    channel.auth_status_label =
      {
        connected: "已连接",
        expired: "认证失效",
        pending: "待连接"
      }[patch.auth_status] || patch.auth_status;
  }
  const adapter = getPublishAdapter(channel.channel_type);
  channel.adapter_id = adapter.id;
  channel.adapter_label = adapter.label;
  channel.last_synced_at = nowIso();
  persistState();
  return channel;
}

export function createChannelAction(payload = {}) {
  const id = uniqueId("ch");
  const channel = {
    id,
    channel_type: payload.channel_type || "website_blog",
    channel_name: payload.channel_name || "新渠道",
    account_name: payload.account_name || "",
    auth_status: payload.auth_status || "pending",
    auth_status_label:
      {
        connected: "已连接",
        expired: "认证失效",
        pending: "待连接"
      }[payload.auth_status || "pending"],
    default_author: payload.default_author || "",
    default_category: payload.default_category || "",
    adapter_id: getPublishAdapter(payload.channel_type || "website_blog").id,
    adapter_label: getPublishAdapter(payload.channel_type || "website_blog").label,
    last_synced_at: nowIso()
  };
  channels.unshift(channel);
  persistState();
  return channel;
}

export function reconnectChannelAction(channelId) {
  return saveChannelAction(channelId, {
    auth_status: "connected"
  });
}

export function listPublishTasks(query = {}) {
  let items = [...publishTasks];
  if (query.status) items = items.filter((item) => item.status === query.status);
  if (query.channel_id) items = items.filter((item) => item.channel_id === query.channel_id);
  return paginate(
    items.map((item) => getPublishTask(item.id) || item),
    query.page,
    query.page_size
  );
}

export function getPublishTask(id) {
  const task = byId(publishTasks, id);
  if (!task) return null;
  recalculatePublishTask(task);
  const taskWithCalendar = withPublishTaskApproval(withPublishTaskCalendar(task));
  return {
    ...taskWithCalendar,
    channel: getChannelById(task.channel_id),
    items: getTaskItems(id)
  };
}

export function createPublishTaskAction(payload = {}) {
  const articleIds = Array.isArray(payload.article_ids)
    ? payload.article_ids
        .map((item) => String(item).trim())
        .filter(Boolean)
        .filter((articleId) => {
          const article = getArticleById(articleId);
          return article && article.publish_status === "ready_to_publish";
        })
    : [];
  const channelId = String(payload.channel_id || "").trim();
  const name = String(payload.name || "").trim();
  const channel = getChannelById(channelId);

  if (!name || !channelId || !articleIds.length || !channel) {
    return null;
  }

  const taskId = uniqueId("task");
  const createdAt = nowIso();
  const publishMode = payload.publish_mode || "scheduled";
  const adapter = getPublishAdapter(channel.channel_type);
  const task = {
    id: taskId,
    name,
    channel_id: channelId,
    channel_type: channel.channel_type,
    adapter_id: adapter.id,
    adapter_label: adapter.label,
    publish_mode: publishMode,
    publish_mode_label: publishMode === "immediate" ? "立即" : "定时",
    scheduled_at: payload.scheduled_at || createdAt,
    require_confirmation: payload.require_confirmation !== false,
    approval_required: payload.require_confirmation !== false,
    approval_status: payload.require_confirmation === false ? "not_required" : "pending",
    approval_status_label: payload.require_confirmation === false ? "免审批" : "待审批",
    approval_steps: [
      {
        id: `${taskId}-approval-owner`,
        step_label: "运营负责人审批",
        status: payload.require_confirmation === false ? "approved" : "pending",
        status_label: payload.require_confirmation === false ? "已批准" : "待审批",
        approver_id: "user-1",
        approver_name: "Luna",
        approved_at: payload.require_confirmation === false ? createdAt : null,
        note: payload.require_confirmation === false ? "任务设置为免审批。" : ""
      }
    ],
    auto_retry_failed: payload.auto_retry_failed === true,
    status: "queued",
    status_label: "排队中",
    total_count: articleIds.length,
    success_count: 0,
    failed_count: 0,
    manual_takeover_count: 0,
    created_by: "user-1",
    created_at: createdAt,
    updated_at: createdAt
  };

  publishTasks.unshift(task);

  articleIds.forEach((articleId, index) => {
    publishTaskItems.unshift(buildPublishTaskItem(task, articleId, channelId, index));
    markArticleQueued(articleId);
  });

  recalculatePublishTask(task);
  persistState();
  return getPublishTask(taskId);
}

export function listPublishRecords(query = {}) {
  let items = publishTaskItems.filter((item) => item.status === "published" || item.status === "failed");
  if (query.channel_id) items = items.filter((item) => item.channel_id === query.channel_id);
  return paginate(
    items.map((item) => ({
      id: item.id,
      title: getArticleById(item.article_id)?.title || "",
      channel_name: getChannelById(item.channel_id)?.channel_name || "",
      status: item.status,
      status_label: item.status_label,
      published_url: item.published_url || null,
      published_at: item.published_at || null,
      execution_mode: item.execution_mode || byId(publishTasks, item.publish_task_id)?.publish_mode_label || "立即",
      template_label: item.template_label || "-",
      adapter_label: item.adapter_label || getChannelById(item.channel_id)?.adapter_label || "-",
      failure_reason_code: item.failure_reason_code || null,
      failure_reason_label: item.failure_reason_label || publishFailureLabel(item.failure_reason_code),
      failure_message: item.failure_message || null
    })),
    query.page,
    query.page_size
  );
}

export function getKeywordAnalytics() {
  return {
    summary: {
      new_keywords: keywords.length,
      high_score_keywords: keywords.filter((item) => item.priority_score >= 85).length,
      adopted_keywords: keywords.filter((item) => item.status === "selected").length,
      adoption_rate: keywords.length
        ? Math.round((keywords.filter((item) => item.status === "selected").length / keywords.length) * 100)
        : 0
    },
    top_unadopted_keywords: keywords.filter((item) => item.status !== "selected").slice(0, 3)
  };
}

export function getContentAnalytics() {
  return {
    summary: {
      generated_articles: 24,
      review_pass_rate: 72,
      average_word_count: 2160,
      average_process_hours: 7.8
    }
  };
}

export function getChannelAnalytics() {
  const failedItems = publishTaskItems.filter((item) => item.status === "failed");
  const total = publishTaskItems.length || 1;
  const counts = failedItems.reduce((acc, item) => {
    const key = item.failure_reason_label || publishFailureLabel(item.failure_reason_code);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return {
    summary: {
      publish_success_rate: Math.round(
        (publishTaskItems.filter((item) => item.status === "published").length / total) * 100
      ),
      publish_failure_rate: Math.round((failedItems.length / total) * 100),
      average_publish_minutes: 14,
      callback_rate: 100
    },
    failure_breakdown: Object.entries(counts).map(([reason, count]) => ({
      reason,
      ratio: failedItems.length ? Math.round((count / failedItems.length) * 100) : 0
    }))
  };
}

function latestVisibilitySnapshot(queryId) {
  return visibilitySnapshots
    .filter((item) => item.tracked_query_id === queryId)
    .sort((left, right) => String(right.captured_at || "").localeCompare(String(left.captured_at || "")))[0];
}

function buildVisibilityCollectionSteps(run, snapshotsCreated) {
  return [
    {
      id: uniqueId("visstep"),
      run_id: run.id,
      sequence: 1,
      step_type: "prepare_queries",
      step_label: "整理追踪查询",
      status: "succeeded",
      status_label: "已完成",
      connector_id: run.connector_id,
      latency_ms: 90,
      output_preview: {
        query_count: run.tracked_query_count
      }
    },
    {
      id: uniqueId("visstep"),
      run_id: run.id,
      sequence: 2,
      step_type: "fetch_serp",
      step_label: "抓取 SERP",
      status: "succeeded",
      status_label: "已完成",
      connector_id: run.connector_id,
      latency_ms: 540,
      output_preview: {
        engine_count: new Set(visibilityTrackedQueries.map((item) => item.engine)).size
      }
    },
    {
      id: uniqueId("visstep"),
      run_id: run.id,
      sequence: 3,
      step_type: "write_snapshots",
      step_label: "写入排名与引用快照",
      status: "succeeded",
      status_label: "已完成",
      connector_id: run.connector_id,
      latency_ms: 160,
      output_preview: {
        snapshots_created: snapshotsCreated
      }
    },
    {
      id: uniqueId("visstep"),
      run_id: run.id,
      sequence: 4,
      step_type: "compare_competitors",
      step_label: "更新竞品域名声量",
      status: "succeeded",
      status_label: "已完成",
      connector_id: run.connector_id,
      latency_ms: 130,
      output_preview: {
        competitor_domains_checked: run.competitor_domains_checked
      }
    }
  ];
}

export function runVisibilityCollectionAction(payload = {}) {
  const startedAt = nowIso();
  const permission = evaluateConnectorPermission("analytics_visibility", "visibility:collect");
  const connector = getAutomationConnector("analytics_visibility");
  if (!permission.allowed) {
    const run = {
      id: uniqueId("visrun"),
      name: payload.name || "外部可见度手动采集",
      trigger: payload.trigger || "manual",
      trigger_label: payload.trigger === "scheduled" ? "定时触发" : "手动触发",
      status: "blocked",
      status_label: "已阻止",
      connector_id: connector?.id || "analytics_visibility",
      connector_label: connector?.label || "效果分析连接器",
      tracked_query_count: visibilityTrackedQueries.length,
      snapshots_created: 0,
      competitor_domains_checked: 0,
      started_at: startedAt,
      finished_at: nowIso(),
      permission,
      steps: [
        {
          id: uniqueId("visstep"),
          run_id: null,
          sequence: 1,
          step_type: "permission_check",
          step_label: "连接器权限检查",
          status: "blocked",
          status_label: "已阻止",
          connector_id: connector?.id || "analytics_visibility",
          output_preview: {
            reason_code: permission.reason_code,
            reason_label: permission.reason_label
          }
        }
      ]
    };
    run.steps[0].run_id = run.id;
    visibilityCollectionRuns.unshift(run);
    recordAuditEvent("connector_permission.denied", "automation_connector", permission.connector_id, {
      action: permission.action,
      reason_code: permission.reason_code,
      permission_boundary: permission.permission_boundary
    });
    persistState();
    return {
      run,
      snapshots_created: 0,
      snapshots: [],
      permission
    };
  }
  const snapshotsCreated = visibilityTrackedQueries.length;
  const run = {
    id: uniqueId("visrun"),
    name: payload.name || "外部可见度手动采集",
    trigger: payload.trigger || "manual",
    trigger_label: payload.trigger === "scheduled" ? "定时触发" : "手动触发",
    status: "completed",
    status_label: "已完成",
    connector_id: connector?.id || "analytics_visibility",
    connector_label: connector?.label || "效果分析连接器",
    permission,
    tracked_query_count: visibilityTrackedQueries.length,
    snapshots_created: snapshotsCreated,
    competitor_domains_checked: visibilityCompetitorDomains.length,
    started_at: startedAt,
    finished_at: nowIso(),
    steps: []
  };

  const createdSnapshots = visibilityTrackedQueries.map((query, index) => {
    const previous = latestVisibilitySnapshot(query.id);
    const rankPosition = Math.max(1, Number(previous?.rank_position || 10) - (index % 2));
    const snapshot = {
      id: uniqueId("viss"),
      tracked_query_id: query.id,
      query: query.query,
      engine: query.engine,
      engine_label: query.engine_label,
      source_type: query.source_type,
      source_type_label: query.source_type_label,
      target_url: query.target_url,
      rank_position: rankPosition,
      citation_count: Number(previous?.citation_count || 0) + 1,
      visibility_score: Math.min(99, Number(previous?.visibility_score || 60) + 2),
      captured_at: run.finished_at,
      collection_run_id: run.id
    };
    visibilitySnapshots.unshift(snapshot);
    return snapshot;
  });

  run.steps = buildVisibilityCollectionSteps(run, createdSnapshots.length);
  visibilityCollectionRuns.unshift(run);
  recordAuditEvent("visibility_collection.run", "visibility_collection", run.id, {
    trigger: run.trigger,
    tracked_query_count: run.tracked_query_count,
    snapshots_created: run.snapshots_created,
    connector_id: run.connector_id
  });
  persistState();

  return {
    run,
    snapshots_created: createdSnapshots.length,
    snapshots: createdSnapshots
  };
}

export function getVisibilityAnalytics() {
  const trackedQueries = visibilityTrackedQueries.map((item) => ({
    ...item,
    article: getArticleById(item.target_article_id),
    topic: getTopicIdea(item.target_topic_id),
    latest_snapshot: latestVisibilitySnapshot(item.id) || null
  }));
  const activeSnapshots = trackedQueries.map((item) => item.latest_snapshot).filter(Boolean);
  const averageVisibility = activeSnapshots.length
    ? Math.round(activeSnapshots.reduce((sum, item) => sum + Number(item.visibility_score || 0), 0) / activeSnapshots.length)
    : 0;

  return {
    summary: {
      tracked_queries: trackedQueries.length,
      top10_queries: activeSnapshots.filter((item) => Number(item.rank_position || 0) <= 10).length,
      citation_mentions: activeSnapshots.reduce((sum, item) => sum + Number(item.citation_count || 0), 0),
      average_visibility_score: averageVisibility
    },
    tracked_queries: trackedQueries,
    snapshots: [...visibilitySnapshots].sort((left, right) =>
      String(right.captured_at || "").localeCompare(String(left.captured_at || ""))
    ),
    competitor_domains: [...visibilityCompetitorDomains].sort(
      (left, right) => Number(right.share_of_voice || 0) - Number(left.share_of_voice || 0)
    ),
    collection_runs: [...visibilityCollectionRuns].sort((left, right) =>
      String(right.started_at || "").localeCompare(String(left.started_at || ""))
    ),
    latest_run: visibilityCollectionRuns[0] || null
  };
}

export function listAudienceSegments(query = {}) {
  let items = [...audienceSegments];
  if (query.status) items = items.filter((item) => item.status === query.status);
  if (query.channel) items = items.filter((item) => item.preferred_channel === query.channel);
  return paginate(items, query.page, query.page_size);
}

export function listMarketingCampaigns(query = {}) {
  let items = [...marketingCampaigns];
  if (query.status) items = items.filter((item) => item.status === query.status);
  if (query.segment_id) items = items.filter((item) => item.segment_id === query.segment_id);
  return paginate(items, query.page, query.page_size);
}

function buildCampaignRunSteps(run, campaign, segment) {
  return [
    {
      id: uniqueId("campstep"),
      run_id: run.id,
      sequence: 1,
      step_type: "match_segment",
      step_label: "匹配受众分群",
      status: "succeeded",
      status_label: "已完成",
      output_preview: {
        segment_id: segment?.id || campaign.segment_id,
        recipients: run.sent_count
      }
    },
    {
      id: uniqueId("campstep"),
      run_id: run.id,
      sequence: 2,
      step_type: "render_message",
      step_label: "渲染活动内容",
      status: "succeeded",
      status_label: "已完成",
      output_preview: {
        subject: campaign.subject,
        article_id: campaign.article_id
      }
    },
    {
      id: uniqueId("campstep"),
      run_id: run.id,
      sequence: 3,
      step_type: "record_metrics",
      step_label: "记录发送与点击指标",
      status: "succeeded",
      status_label: "已完成",
      output_preview: {
        sent_count: run.sent_count,
        open_count: run.open_count,
        click_count: run.click_count
      }
    }
  ];
}

export function runMarketingCampaignAction(campaignId, payload = {}) {
  const campaign = byId(marketingCampaigns, campaignId);
  if (!campaign) return null;
  const permission = evaluateConnectorPermission("mailtrain_email", "campaign:send");
  const segment = byId(audienceSegments, campaign.segment_id);
  const recipientCount = Number(segment?.member_count || campaign.send_count || 0);
  const startedAt = nowIso();
  if (!permission.allowed) {
    const run = {
      id: uniqueId("camprun"),
      campaign_id: campaign.id,
      campaign_name: campaign.campaign_name,
      segment_id: campaign.segment_id,
      segment_name: campaign.segment_name,
      trigger: payload.trigger || "manual",
      trigger_label: payload.trigger === "scheduled" ? "定时触发" : "手动触发",
      status: "blocked",
      status_label: "已阻止",
      sent_count: 0,
      open_count: 0,
      click_count: 0,
      started_at: startedAt,
      finished_at: nowIso(),
      permission,
      steps: [
        {
          id: uniqueId("campstep"),
          run_id: null,
          sequence: 1,
          step_type: "permission_check",
          step_label: "连接器权限检查",
          status: "blocked",
          status_label: "已阻止",
          connector_id: "mailtrain_email",
          output_preview: {
            reason_code: permission.reason_code,
            reason_label: permission.reason_label
          }
        }
      ]
    };
    run.steps[0].run_id = run.id;
    marketingCampaignRuns.unshift(run);
    recordAuditEvent("connector_permission.denied", "automation_connector", permission.connector_id, {
      action: permission.action,
      reason_code: permission.reason_code,
      permission_boundary: permission.permission_boundary,
      campaign_id: campaign.id
    });
    persistState();
    return {
      run,
      metrics: {
        sent_count: 0,
        open_count: 0,
        click_count: 0
      },
      permission
    };
  }
  const openCount = Math.round(recipientCount * 0.38);
  const clickCount = Math.round(recipientCount * 0.12);
  const run = {
    id: uniqueId("camprun"),
    campaign_id: campaign.id,
    campaign_name: campaign.campaign_name,
    segment_id: campaign.segment_id,
    segment_name: campaign.segment_name,
    trigger: payload.trigger || "manual",
    trigger_label: payload.trigger === "scheduled" ? "定时触发" : "手动触发",
    status: "completed",
    status_label: "已完成",
    sent_count: recipientCount,
    open_count: openCount,
    click_count: clickCount,
    started_at: startedAt,
    finished_at: nowIso(),
    permission,
    steps: []
  };
  run.steps = buildCampaignRunSteps(run, campaign, segment);
  marketingCampaignRuns.unshift(run);

  campaign.status = "active";
  campaign.status_label = "运行中";
  campaign.send_count = recipientCount;
  campaign.open_count = openCount;
  campaign.click_count = clickCount;
  campaign.open_rate = recipientCount ? Math.round((openCount / recipientCount) * 100) : 0;
  campaign.click_rate = recipientCount ? Math.round((clickCount / recipientCount) * 100) : 0;
  campaign.last_run_at = run.finished_at;

  recordAuditEvent("marketing_campaign.run", "marketing_campaign", campaign.id, {
    campaign_run_id: run.id,
    segment_id: campaign.segment_id,
    sent_count: run.sent_count,
    open_count: run.open_count,
    click_count: run.click_count
  });
  persistState();

  return {
    run,
    metrics: {
      sent_count: run.sent_count,
      open_count: run.open_count,
      click_count: run.click_count
    }
  };
}

export function getCampaignAnalytics() {
  const totalRecipients = audienceSegments.reduce((sum, item) => sum + Number(item.member_count || 0), 0);
  const activeCampaigns = marketingCampaigns.filter((item) => item.status === "active");
  const averageClickRate = marketingCampaigns.length
    ? Math.round(
        marketingCampaigns.reduce((sum, item) => sum + Number(item.click_rate || 0), 0) /
          marketingCampaigns.length
      )
    : 0;
  return {
    summary: {
      active_segments: audienceSegments.filter((item) => item.status === "active").length,
      active_campaigns: activeCampaigns.length,
      total_recipients: totalRecipients,
      average_click_rate: averageClickRate
    },
    segments: [...audienceSegments],
    campaigns: [...marketingCampaigns],
    campaign_runs: [...marketingCampaignRuns].sort((left, right) =>
      String(right.started_at || "").localeCompare(String(left.started_at || ""))
    )
  };
}

export function getBillingSummary() {
  return {
    plan_name: "专业版",
    effective_at: "2026-04-01",
    expires_at: "2026-04-30",
    quotas: {
      keyword_crawl: 2000,
      article_generation: 300,
      publish: 120
    },
    usage: {
      keyword_crawl: 640,
      article_generation: 96,
      publish: 28
    }
  };
}

export function listUsageRecords(query = {}) {
  let items = [...usageRecords];
  if (query.usage_type) items = items.filter((item) => item.usage_type === query.usage_type);
  return paginate(items, query.page, query.page_size);
}

export function listInvoices(query = {}) {
  return paginate(invoices, query.page, query.page_size);
}

export function getBrandProfile() {
  return brandProfile;
}

export function saveBrandProfileAction(patch = {}) {
  const glossaryTerms = Array.isArray(patch.glossary_terms) ? patch.glossary_terms : brandProfile.glossary_terms;

  Object.assign(brandProfile, {
    ...patch,
    glossary_terms: glossaryTerms.map((item) => ({
      term: String(item.term || "").trim(),
      description: String(item.description || "").trim()
    })).filter((item) => item.term && item.description)
  });

  persistState();
  return getBrandProfile();
}

export function listModelConfigs(query = {}) {
  let items = [...modelConfigs];
  if (query.purpose) items = items.filter((item) => item.purpose === query.purpose);
  return paginate(items.map(sanitizeModelConfig), query.page, query.page_size);
}

function isMaskedSecretValue(value) {
  return /^\*{4,}.{0,8}$/.test(String(value || ""));
}

function sanitizeModelConfig(model = {}) {
  return {
    ...model,
    api_key: "",
    masked_api_key: maskSecret(model.api_key)
  };
}

export function saveModelConfigAction(modelId, patch = {}) {
  const model = modelConfigs.find((item) => item.id === modelId);
  if (!model) return null;

  if (typeof patch.provider === "string") model.provider = patch.provider.trim() || model.provider;
  if (typeof patch.provider_type === "string") model.provider_type = patch.provider_type.trim();
  if (typeof patch.model_name === "string") model.model_name = patch.model_name.trim() || model.model_name;
  if (typeof patch.purpose === "string") model.purpose = patch.purpose.trim() || model.purpose;
  if (typeof patch.endpoint === "string") model.endpoint = patch.endpoint.trim();
  if (patch.clear_api_key === true) {
    model.api_key = "";
  } else if (typeof patch.api_key === "string") {
    const apiKey = patch.api_key.trim();
    if (apiKey && !isMaskedSecretValue(apiKey)) {
      model.api_key = apiKey;
    }
  }
  if (typeof patch.notes === "string") model.notes = patch.notes.trim();
  if (typeof patch.temperature === "number") model.temperature = Math.max(0, Math.min(2, patch.temperature));
  if (typeof patch.max_tokens === "number") model.max_tokens = Math.max(256, Math.round(patch.max_tokens));
  if (typeof patch.timeout_ms === "number") model.timeout_ms = Math.max(500, Math.round(patch.timeout_ms));
  if (typeof patch.status === "string") model.status = patch.status;
  if (typeof patch.is_default === "boolean") {
    if (patch.is_default) {
      modelConfigs.forEach((item) => {
        if (item.purpose === (patch.purpose || model.purpose)) {
          item.is_default = false;
        }
      });
    }
    model.is_default = patch.is_default;
  }
  recordAuditEvent("model_config.update", "model_config", modelId, {
    changed_fields: Object.keys(patch).filter((key) => key !== "api_key"),
    provider: model.provider,
    model_name: model.model_name,
    purpose: model.purpose,
    status: model.status
  });
  persistState();
  return sanitizeModelConfig(model);
}

export function createModelConfigAction(payload = {}) {
  const model = {
    id: uniqueId("mdl"),
    provider: payload.provider || "新模型服务",
    provider_type: payload.provider_type || "兼容接口",
    model_name: payload.model_name || "模型名称",
    purpose: payload.purpose || "article_generation",
    endpoint: payload.endpoint || "",
    api_key: payload.api_key || "",
    temperature: typeof payload.temperature === "number" ? payload.temperature : 0.7,
    max_tokens: typeof payload.max_tokens === "number" ? payload.max_tokens : 4096,
    timeout_ms: typeof payload.timeout_ms === "number" ? payload.timeout_ms : 20000,
    notes: payload.notes || "",
    is_default: payload.is_default === true,
    status: payload.status || "active"
  };
  if (model.is_default) {
    modelConfigs.forEach((item) => {
      if (item.purpose === model.purpose) {
        item.is_default = false;
      }
    });
  }
  modelConfigs.unshift(model);
  persistState();
  return sanitizeModelConfig(model);
}

export function saveMediaSourceAction(sourceId, patch = {}) {
  const source = mediaSources.find((item) => item.id === sourceId);
  if (!source) return null;

  if (typeof patch.source_name === "string") source.source_name = patch.source_name.trim() || source.source_name;
  if (typeof patch.source_type === "string") {
    source.source_type = patch.source_type;
    source.source_type_label = sourceLabel(patch.source_type);
  }
  if (typeof patch.platform === "string") {
    source.platform = patch.platform;
    source.platform_label =
      {
        website_blog: "官网博客",
        news_site: "媒体站点",
        zhihu_column: "知乎专栏",
        wechat_official: "微信公众号",
        xiaohongshu: "小红书",
        video_account: "视频号"
      }[patch.platform] || patch.platform;
  }
  if (typeof patch.extraction_mode === "string") {
    source.extraction_mode = patch.extraction_mode;
    source.extraction_mode_label =
      {
        rss_like: "文章标题与摘要抽取",
        question_thread: "问题与评论抽取",
        headline_cluster: "标题聚类",
        entity_tracking: "实体与趋势抽取"
      }[patch.extraction_mode] || patch.extraction_mode;
  }
  if (typeof patch.update_frequency === "string") {
    source.update_frequency = patch.update_frequency;
    source.update_frequency_label =
      {
        hourly: "小时级",
        daily: "日更",
        weekly: "周更"
      }[patch.update_frequency] || patch.update_frequency;
  }
  if (typeof patch.relevance_score === "number") {
    source.relevance_score = Math.max(0, Math.min(100, Math.round(patch.relevance_score)));
  }
  if (typeof patch.status === "string") {
    source.status = patch.status;
    source.status_label = patch.status === "active" ? "正常" : patch.status === "disabled" ? "停用" : patch.status;
  }
  if (typeof patch.authority_tier === "string") {
    source.authority_tier = patch.authority_tier;
    source.authority_tier_label =
      {
        owned: "自有资产",
        kol: "行业 KOL",
        media: "行业媒体",
        research_media: "研究型媒体",
        developer_media: "开发者媒体"
      }[patch.authority_tier] || patch.authority_tier;
  }
  if (Array.isArray(patch.sample_topics)) {
    source.sample_topics = patch.sample_topics.map((item) => String(item).trim()).filter(Boolean);
  }
  source.last_crawled_at = patch.last_crawled_at || source.last_crawled_at || nowIso();
  persistState();
  return enrichMediaSource(source);
}

export function createMediaSourceAction(payload = {}) {
  const source = {
    id: uniqueId("src"),
    source_name: payload.source_name || "新内容源",
    source_type: payload.source_type || "industry_self_media",
    source_type_label: sourceLabel(payload.source_type || "industry_self_media"),
    platform: payload.platform || "wechat_official",
    platform_label:
      {
        website_blog: "官网博客",
        news_site: "媒体站点",
        zhihu_column: "知乎专栏",
        wechat_official: "微信公众号",
        xiaohongshu: "小红书",
        video_account: "视频号"
      }[payload.platform || "wechat_official"],
    authority_tier: payload.authority_tier || "kol",
    authority_tier_label:
      {
        owned: "自有资产",
        kol: "行业 KOL",
        media: "行业媒体",
        research_media: "研究型媒体",
        developer_media: "开发者媒体"
      }[payload.authority_tier || "kol"],
    extraction_mode: payload.extraction_mode || "headline_cluster",
    extraction_mode_label:
      {
        rss_like: "文章标题与摘要抽取",
        question_thread: "问题与评论抽取",
        headline_cluster: "标题聚类",
        entity_tracking: "实体与趋势抽取"
      }[payload.extraction_mode || "headline_cluster"],
    update_frequency: payload.update_frequency || "daily",
    update_frequency_label:
      {
        hourly: "小时级",
        daily: "日更",
        weekly: "周更"
      }[payload.update_frequency || "daily"],
    relevance_score: typeof payload.relevance_score === "number" ? payload.relevance_score : 80,
    status: payload.status || "active",
    status_label: payload.status === "disabled" ? "停用" : "正常",
    sample_topics: Array.isArray(payload.sample_topics)
      ? payload.sample_topics.map((item) => String(item).trim()).filter(Boolean)
      : ["行业趋势", "产品选型", "落地案例"],
    last_crawled_at: nowIso()
  };
  mediaSources.unshift(source);
  persistState();
  return enrichMediaSource(source);
}

export function listMembers(query = {}) {
  let items = [...members];
  if (query.role) items = items.filter((item) => item.role === query.role);
  return paginate(items, query.page, query.page_size);
}

export function getCurrentWorkspace() {
  return {
    id: "ws-1",
    name: "AgentCore China GEO",
    slug: "agentcore-china-geo",
    plan_code: "professional",
    status: "active",
    timezone: "Asia/Shanghai"
  };
}

export async function createTopicIdeasFromKeywords(keywordIds, templateType) {
  const created = [];
  const pendingKeywords = [];
  for (const keywordId of keywordIds) {
    const keyword = getKeyword(keywordId);
    if (!keyword) continue;

    const existing = topicIdeas.find((item) => item.keyword_id === keywordId);
    if (existing) {
      created.push(existing);
      continue;
    }

    keyword.status = "selected";
    keyword.status_label = "机会池";
    keyword.updated_at = nowIso();
    pendingKeywords.push(keyword);
  }

  if (pendingKeywords.length) {
    const planned = await planTopicsFromKeywords({
      keywords: pendingKeywords,
      template_type: templateType,
      pickTemplateType,
      templateLabel,
      idFactory: uniqueId,
      now: nowIso(),
      user_id: "user-1"
    });
    const providerInvocation = recordProviderInvocation("topic_planning", planned.execution, {
      keyword_count: pendingKeywords.length,
      output_count: planned.items.length
    });

    const normalizedItems = planned.items.map((item) => ({
      ...item,
      provider_execution_mode: planned.execution?.mode || "local",
      provider_error_message: planned.execution?.error_message || "",
      provider_invocation_id: providerInvocation.id
    }));
    topicIdeas.unshift(...normalizedItems);
    created.push(...normalizedItems);
  }

  persistState();
  return {
    created_count: created.length,
    items: created
  };
}

export async function createKeywordCrawlJobAction(payload = {}) {
  const seeds = (payload.seed_keywords || []).filter(Boolean);
  const topic = payload.industry_topic || seeds[0] || "中国智能体";
  const sourceType = payload.source_type || "suggestion";
  const sourceScope = payload.source_scope || (
    ["owned_self_media", "industry_self_media", "authority_media", "mixed_media"].includes(sourceType)
      ? sourceType
      : "mixed_media"
  );
  const monitoringGoal = payload.monitoring_goal || "full_funnel";
  const sourceIds = Array.isArray(payload.source_ids) && payload.source_ids.length
    ? payload.source_ids
    : pickSourceIdsForScope(sourceScope);
  const sourceTargets = Array.isArray(payload.source_targets) ? payload.source_targets : [];
  const primarySource = getMediaSourceById(sourceIds[0]);
  const adapterMode = payload.extraction_mode || primarySource?.extraction_mode || sourceType || "headline_cluster";
  const sourceAdapter = getSourceAdapterByMode(adapterMode);
  const discovery = await discoverKeywordQuestions({
    seed_keywords: seeds,
    industry_topic: topic,
    source_scope: sourceScope,
    monitoring_goal: monitoringGoal,
    fetch_limit: payload.fetch_limit
  });
  const providerInvocation = recordProviderInvocation("keyword_discovery", discovery.execution, {
    output_count: discovery.items.length,
    industry_topic: topic,
    source_scope: sourceScope
  });
  const generatedQuestions = discovery.items;

  const newItems = [];
  for (const candidate of generatedQuestions) {
    const normalized = candidate.normalized_keyword;
    const exists = keywords.find((item) => item.normalized_keyword === normalized);
    if (exists) {
      continue;
    }

    const sourceOrigin = getMediaSourceById(sourceIds[newItems.length % Math.max(sourceIds.length, 1)]);
    const item = {
      id: `${uniqueId("kw")}-${newItems.length + 1}`,
      keyword: candidate.question,
      normalized_keyword: normalized,
      industry: topic,
      language: "zh-CN",
      source: sourceType,
      source_label: sourceLabel(sourceType),
      source_scope: sourceScope,
      source_scope_label: sourceScopeLabel(sourceScope),
      source_origin_id: sourceOrigin?.id || null,
      source_origin_name: sourceOrigin?.source_name || sourceTargets[0] || `${sourceScopeLabel(sourceScope)}来源`,
      provider_id: discovery.provider?.id || null,
      provider_label: discovery.provider?.label || null,
      provider_execution_mode: discovery.execution?.mode || "local",
      provider_error_message: discovery.execution?.error_message || "",
      provider_invocation_id: providerInvocation.id,
      priority_score: 78 + (newItems.length % 5) * 3,
      business_value_score: 80 + (newItems.length % 4) * 4,
      geo_fit_score: 82 + (newItems.length % 3) * 3,
      content_fit_score: 79 + (newItems.length % 4) * 3,
      competition_level: newItems.length % 2 === 0 ? "medium" : "low",
      competition_label: newItems.length % 2 === 0 ? "中" : "低",
      recommended_channel_types: ["website_blog", "zhihu_column"],
      suggested_titles: candidate.suggested_titles,
      related_keywords: [topic, `${topic} 部署`, `${topic} 对比`],
      status: "new",
      status_label: "新问题",
      owner_user_id: "user-1",
      created_at: nowIso(),
      updated_at: nowIso(),
      ...candidate
    };
    newItems.push(item);
  }

  keywords.unshift(...newItems);
  const adapterEvidence = buildSourceAdapterEvidence({
    contract: sourceAdapter,
    sourceIds,
    rawCount: generatedQuestions.length,
    dedupedCount: newItems.length,
    sourceScope
  });

  const job = {
    id: uniqueId("job"),
    name: payload.name || `${topic} 问题裂变任务`,
    source_type: sourceType,
    source_type_label: sourceLabel(sourceType),
    source_scope: sourceScope,
    source_scope_label: sourceScopeLabel(sourceScope),
    monitoring_goal: monitoringGoal,
    monitoring_goal_label: monitoringGoalLabel(monitoringGoal),
    source_ids: sourceIds,
    source_targets: sourceTargets,
    industry_topic: topic,
    seed_keywords: seeds.length ? seeds : [topic],
    fetch_limit: payload.fetch_limit || generatedQuestions.length,
    dedupe_enabled: payload.dedupe_enabled !== false,
    source_adapter_id: sourceAdapter.id,
    source_adapter_label: sourceAdapter.label,
    source_adapter_version: sourceAdapter.contract_version,
    adapter_evidence: adapterEvidence,
    quality_summary: buildSourceQualitySummary(adapterEvidence, sourceAdapter),
    error_taxonomy: sourceAdapterErrorTaxonomy(sourceAdapter),
    provider_id: discovery.provider?.id || null,
    provider_label: discovery.provider?.label || null,
    provider_execution_mode: discovery.execution?.mode || "local",
    provider_error_message: discovery.execution?.error_message || "",
    provider_invocation_id: providerInvocation.id,
    status: "completed",
    status_label: "已完成",
    raw_count: generatedQuestions.length,
    deduped_count: newItems.length,
    started_at: nowIso(),
    finished_at: nowIso()
  };

  keywordCrawlJobs.unshift(job);

  persistState();
  return {
    job: enrichKeywordCrawlJob(job),
    new_items_count: newItems.length,
    items: newItems
  };
}

function appendRunLog(runLogs, step, level, message, extra = {}) {
  runLogs.push({
    id: uniqueId("alog"),
    step,
    level,
    message,
    created_at: nowIso(),
    ...extra
  });
}

function evaluateAutomationArticle(article, strategy) {
  const detail = getArticle(article.id) || article;
  const failures = [];
  const content = String(detail.content_markdown || "");
  const requiredTerms = detail.tags || [];

  if (Number(detail.word_count || 0) < Number(strategy.min_word_count || 0)) {
    failures.push(`字数低于阈值 ${strategy.min_word_count}`);
  }

  if (Number(strategy.required_terms_count || 0) > 0) {
    const matchedTerms = requiredTerms.filter((term) => content.includes(term));
    if (matchedTerms.length < Number(strategy.required_terms_count || 0)) {
      failures.push(`必带术语命中不足，当前 ${matchedTerms.length} / ${strategy.required_terms_count}`);
    }
  }

  if (strategy.block_on_forbidden_terms) {
    const forbiddenHit = (brandProfile.forbidden_terms || []).find((term) => term && content.includes(term));
    if (forbiddenHit) {
      failures.push(`命中禁用表达：${forbiddenHit}`);
    }
  }

  return {
    article: detail,
    passed: failures.length === 0,
    failures
  };
}

function shouldForceManualReview(strategy) {
  return strategy.review_policy !== "auto_pass" || strategy.source_scope === "authority_media";
}

function createAutoPublishTaskForRun(strategy, readyArticles, runLogs) {
  if (!readyArticles.length) {
    appendRunLog(runLogs, "publish", "warn", "没有可进入自动发布队列的文章。");
    return null;
  }

  const channel = getChannelById(strategy.default_channel_id);
  if (!channel) {
    appendRunLog(runLogs, "publish", "error", "默认发布渠道不存在。", {
      channel_id: strategy.default_channel_id
    });
    return null;
  }

  if (channel.auth_status !== "connected") {
    appendRunLog(runLogs, "publish", "error", "默认发布渠道未连接，自动发布被阻断。", {
      channel_id: channel.id
    });
    return null;
  }

  const task = createPublishTaskAction({
    name: `${strategy.name} / 自动分发`,
    channel_id: channel.id,
    publish_mode: strategy.publish_mode || "scheduled",
    scheduled_at:
      strategy.publish_mode === "immediate" ? nowIso() : addMinutes(nowIso(), 30),
    require_confirmation: false,
    auto_retry_failed: true,
    article_ids: readyArticles.map((item) => item.id)
  });

  if (!task) {
    appendRunLog(runLogs, "publish", "error", "自动创建发布任务失败。");
    return null;
  }

  appendRunLog(runLogs, "publish", "info", "已创建自动发布任务。", {
    publish_task_id: task.id,
    article_count: readyArticles.length
  });

  if (strategy.publish_mode === "immediate") {
    const started = startPublishTaskAction(task.id);
    appendRunLog(runLogs, "publish", "info", "已立即启动发布任务。", {
      publish_task_id: started?.id || task.id
    });
    return started || task;
  }

  return task;
}

export async function runSourceStrategyAction(strategyId, payload = {}) {
  const strategy = getSourceStrategyById(strategyId);
  if (!strategy) return null;

  if (strategy.is_enabled === false) {
    return {
      run: {
        id: uniqueId("run"),
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        status: "failed",
        status_label: "失败",
        error_message: "策略已停用",
        event_logs: [
          {
            id: uniqueId("alog"),
            step: "guard",
            level: "error",
            message: "策略已停用，无法执行。",
            created_at: nowIso()
          }
        ],
        created_at: nowIso()
      },
      crawl_job: null,
      generated_questions: [],
      generated_topics: [],
      generated_articles: []
    };
  }

  const sourceSeedKeywords = (strategy.source_ids || [])
    .map((sourceId) => getMediaSourceById(sourceId))
    .flatMap((source) => source?.sample_topics || [])
    .slice(0, 3);

  const industryTopic = String(payload.industry_topic || "中国智能体").trim() || "中国智能体";
  const seedKeywords = Array.isArray(payload.seed_keywords) && payload.seed_keywords.length
    ? payload.seed_keywords.map((item) => String(item).trim()).filter(Boolean)
    : sourceSeedKeywords.length
      ? sourceSeedKeywords
      : [industryTopic];

  const runLogs = [];
  appendRunLog(runLogs, "start", "info", "开始执行自动运营策略。", {
    strategy_id: strategy.id,
    industry_topic: industryTopic
  });

  const crawlResult = await createKeywordCrawlJobAction({
    name: `${strategy.name} / ${industryTopic}`,
    source_type: strategy.source_scope,
    source_scope: strategy.source_scope,
    monitoring_goal: strategy.monitoring_goal,
    industry_topic: industryTopic,
    seed_keywords: seedKeywords,
    source_targets: (strategy.source_ids || [])
      .map((sourceId) => getMediaSourceById(sourceId)?.source_name)
      .filter(Boolean),
    source_ids: strategy.source_ids || [],
    fetch_limit: Number(payload.fetch_limit) || 8,
    dedupe_enabled: payload.dedupe_enabled !== false
  });
  appendRunLog(runLogs, "crawl", "info", "问题抓取完成。", {
    crawl_job_id: crawlResult.job.id,
    question_count: crawlResult.new_items_count,
    provider_id: crawlResult.job.provider_id,
    provider_execution_mode: crawlResult.job.provider_execution_mode
  });

  const candidateKeywords = (crawlResult.items.length
    ? crawlResult.items
    : keywords.filter((item) => item.industry === industryTopic && item.source_scope === strategy.source_scope)
  )
    .slice()
    .sort((left, right) => Number(right.priority_score || 0) - Number(left.priority_score || 0))
    .slice(0, 3);
  appendRunLog(runLogs, "rank", "info", "已筛出高优先级问题。", {
    keyword_ids: candidateKeywords.map((item) => item.id)
  });

  const topicResult = candidateKeywords.length
    ? await createTopicIdeasFromKeywords(candidateKeywords.map((item) => item.id), undefined)
    : { created_count: 0, items: [] };
  appendRunLog(runLogs, "topic", "info", "选题生成完成。", {
    topic_count: topicResult.created_count || topicResult.items.length,
    provider_id: topicResult.items[0]?.provider_id || null,
    provider_execution_mode: topicResult.items[0]?.provider_execution_mode || null
  });

  const articleTargets = strategy.auto_generate_articles === false ? [] : topicResult.items.slice(0, 2);
  const generatedArticles = [];
  for (const topic of articleTargets) {
    const article = await createArticleFromTopicAction(topic.id);
    if (article) {
      generatedArticles.push(article);
    }
  }
  appendRunLog(runLogs, "draft", "info", "草稿生成完成。", {
    article_count: generatedArticles.length,
    provider_id: generatedArticles[0]?.provider_id || null,
    provider_execution_mode: generatedArticles[0]?.provider_execution_mode || null
  });

  const articleEvaluations = generatedArticles.map((article) =>
    evaluateAutomationArticle(article, strategy)
  );
  let reviewPendingCount = 0;
  let autoPassedCount = 0;

  if (strategy.auto_submit_review) {
    for (const result of articleEvaluations) {
      if (!result.passed) {
        appendRunLog(runLogs, "review", "warn", "文章未通过自动审核守门规则。", {
          article_id: result.article.id,
          failures: result.failures
        });
        continue;
      }

      if (shouldForceManualReview(strategy) && !strategy.allow_authority_direct_publish) {
        submitArticleReviewAction(result.article.id);
        reviewPendingCount += 1;
        appendRunLog(runLogs, "review", "info", "文章已自动提交审核。", {
          article_id: result.article.id
        });
        continue;
      }

      reviewArticleAction(result.article.id, "pass", "自动运营规则通过", []);
      autoPassedCount += 1;
      appendRunLog(runLogs, "review", "info", "文章已自动审核通过。", {
        article_id: result.article.id
      });
    }
  } else if (generatedArticles.length) {
    appendRunLog(runLogs, "review", "warn", "当前策略未开启自动提交审核，草稿停留在编辑阶段。");
  }

  const readyArticles = generatedArticles
    .map((article) => getArticle(article.id))
    .filter((item) => item?.publish_status === "ready_to_publish");
  const publishTask =
    strategy.auto_create_publish_task === true
      ? createAutoPublishTaskForRun(strategy, readyArticles, runLogs)
      : null;

  const errorCount = runLogs.filter((item) => item.level === "error").length;
  const warnCount = runLogs.filter((item) => item.level === "warn").length;
  const finishedAt = nowIso();
  strategy.last_run_at = finishedAt;
  strategy.next_run_at = computeNextRunAt(
    strategy.schedule_mode,
    finishedAt,
    strategy.is_enabled !== false,
    strategy.cron_expression
  );
  strategy.consecutive_failures = errorCount ? Number(strategy.consecutive_failures || 0) + 1 : 0;

  const run = {
    id: uniqueId("run"),
    strategy_id: strategy.id,
    strategy_name: strategy.name,
    source_scope: strategy.source_scope,
    source_scope_label: strategy.source_scope_label,
    monitoring_goal: strategy.monitoring_goal,
    monitoring_goal_label: strategy.monitoring_goal_label,
    industry_topic: industryTopic,
    crawl_job_id: crawlResult.job.id,
    generated_question_count: crawlResult.new_items_count,
    generated_topic_count: topicResult.created_count || topicResult.items.length,
    generated_article_count: generatedArticles.length,
    review_pending_count: reviewPendingCount,
    auto_passed_count: autoPassedCount,
    created_publish_task_id: publishTask?.id || null,
    generated_keyword_ids: candidateKeywords.map((item) => item.id),
    generated_topic_ids: topicResult.items.map((item) => item.id),
    generated_article_ids: generatedArticles.map((item) => item.id),
    status: errorCount ? "failed" : warnCount ? "partial_failed" : "completed",
    status_label: errorCount ? "失败" : warnCount ? "部分失败" : "已完成",
    error_count: errorCount,
    warn_count: warnCount,
    retry_of_run_id: payload.retry_of_run_id || null,
    event_logs: runLogs,
    created_at: finishedAt
  };
  const steps = createAutomationRunSteps(run, runLogs);

  automationRuns.unshift(run);
  automationRunSteps.unshift(...steps);
  persistState();
  const runWithSteps = withAutomationRunSteps(run);

  return {
    run: runWithSteps,
    crawl_job: crawlResult.job,
    generated_questions: crawlResult.items,
    generated_topics: topicResult.items,
    generated_articles: generatedArticles,
    publish_task: publishTask
  };
}

export function getAutomationRun(id) {
  return withAutomationRunSteps(byId(automationRuns, id));
}

export async function retryAutomationRunAction(runId) {
  const run = getAutomationRun(runId);
  if (!run) return null;
  return runSourceStrategyAction(run.strategy_id, {
    industry_topic: run.industry_topic,
    fetch_limit: 8,
    retry_of_run_id: run.id
  });
}

export function reviewArticleAction(articleId, action, comments = "", reasonCodes = []) {
  const article = articles.find((item) => item.id === articleId);
  if (!article) return null;

  articleReviews.unshift({
    id: uniqueId("rv"),
    article_id: articleId,
    reviewer_user_id: "user-1",
    action,
    reason_codes: reasonCodes,
    comments,
    created_at: nowIso()
  });

  if (action === "pass") {
    article.review_status = "review_passed";
    article.review_status_label = "已通过";
    article.publish_status = "ready_to_publish";
    article.publish_status_label = "待发布";
  } else {
    article.review_status = "review_rejected";
    article.review_status_label = "已驳回";
    article.publish_status = "draft";
    article.publish_status_label = "草稿";
  }

  article.updated_at = nowIso();
  persistState();
  return getArticle(articleId);
}

export function startPublishTaskAction(taskId) {
  const task = publishTasks.find((item) => item.id === taskId);
  if (!task) return null;

  const approvalStatus = defaultApprovalStatus(task);
  if ((task.approval_required ?? task.require_confirmation !== false) && approvalStatus !== "approved") {
    task.start_blocked_reason = "approval_required";
    task.start_blocked_reason_label = "发布任务待审批";
    task.updated_at = nowIso();
    persistState();
    return getPublishTask(taskId);
  }

  task.status = "running";
  task.status_label = "运行中";
  delete task.start_blocked_reason;
  delete task.start_blocked_reason_label;
  const queuedItems = publishTaskItems.filter((item) => item.publish_task_id === taskId && item.status === "queued");
  for (const item of queuedItems) {
    executePublishTaskItem(item, task, {
      mode: "start_task"
    });
  }

  recalculatePublishTask(task);
  recordAuditEvent("publish_task.start", "publish_task", taskId, {
    channel_id: task.channel_id,
    status: task.status,
    total_count: task.total_count,
    success_count: task.success_count,
    failed_count: task.failed_count
  });
  persistState();
  return getPublishTask(taskId);
}

export function approvePublishTaskAction(taskId, payload = {}) {
  const task = publishTasks.find((item) => item.id === taskId);
  if (!task) return null;

  const action = payload.action === "reject" ? "reject" : "approve";
  const approvedAt = nowIso();
  const nextStatus = action === "reject" ? "rejected" : "approved";
  task.approval_required = true;
  task.approval_status = nextStatus;
  task.approval_status_label = approvalStatusLabel(nextStatus);
  task.approved_by = "user-1";
  task.approved_by_name = "Luna";
  task.approved_at = action === "approve" ? approvedAt : null;
  task.approval_note = String(payload.note || (action === "approve" ? "审批通过。" : "审批退回。")).trim();
  task.approval_steps = [
    {
      id: `${task.id}-approval-owner`,
      step_label: "运营负责人审批",
      status: action === "approve" ? "approved" : "rejected",
      status_label: action === "approve" ? "已批准" : "已退回",
      approver_id: task.approved_by,
      approver_name: task.approved_by_name,
      approved_at: action === "approve" ? approvedAt : null,
      note: task.approval_note
    }
  ];
  task.updated_at = approvedAt;
  delete task.start_blocked_reason;
  delete task.start_blocked_reason_label;

  recordAuditEvent("publish_task.approval", "publish_task", taskId, {
    action,
    approval_status: task.approval_status,
    note: task.approval_note
  });
  persistState();
  return getPublishTask(taskId);
}

export function retryPublishTaskFailedAction(taskId) {
  const task = publishTasks.find((item) => item.id === taskId);
  if (!task) return null;

  const failedItems = publishTaskItems.filter((item) => item.publish_task_id === taskId && item.status === "failed");
  for (const item of failedItems) {
    item.status = "queued";
    item.status_label = "排队中";
    item.execution_mode = "retry_queued";
    item.manual_takeover_required = false;
    delete item.failure_reason_code;
    delete item.failure_reason_label;
    delete item.failure_message;
    executePublishTaskItem(item, task, {
      mode: "retry_failed"
    });
  }

  recalculatePublishTask(task);
  persistState();
  return getPublishTask(taskId);
}

export function takeoverPublishTaskItemAction(taskId, itemId, payload = {}) {
  const task = publishTasks.find((item) => item.id === taskId);
  if (!task) return null;

  const item = publishTaskItems.find(
    (publishItem) => publishItem.publish_task_id === taskId && publishItem.id === itemId
  );
  if (!item) return null;

  const mode = payload.mode || "manual_publish";
  const article = getArticleById(item.article_id);
  const channel = getChannelById(item.channel_id);

  if (mode === "requeue") {
    item.status = "queued";
    item.status_label = "排队中";
    item.execution_mode = "manual_requeue";
    item.manual_takeover_required = false;
    item.manual_takeover_note = "人工确认后恢复排队";
    item.updated_at = nowIso();
    delete item.failure_reason_code;
    delete item.failure_reason_label;
    delete item.failure_message;
    markArticleQueued(item.article_id);
    recalculatePublishTask(task);
    persistState();
    return getPublishTask(taskId);
  }

  if (!article || !channel) {
    return null;
  }

  item.manual_takeover_required = false;
  item.manual_takeover_note = String(payload.note || "人工接管后已完成发布").trim();
  markPublishTaskItemPublished(item, channel, article, "manual_takeover");
  if (payload.published_url) {
    item.published_url = String(payload.published_url).trim();
  }
  recalculatePublishTask(task);
  persistState();
  return getPublishTask(taskId);
}

export function cancelPublishTaskAction(taskId) {
  const task = publishTasks.find((item) => item.id === taskId);
  if (!task) return null;

  task.status = "canceled";
  task.status_label = "已取消";
  publishTaskItems
    .filter((item) => item.publish_task_id === taskId && item.status === "queued")
    .forEach((item) => {
      item.execution_mode = "canceled";
      item.updated_at = nowIso();
    });
  task.updated_at = nowIso();
  persistState();
  return getPublishTask(taskId);
}
