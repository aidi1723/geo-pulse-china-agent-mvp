function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

const providerCatalog = {
  keyword_discovery: [
    {
      id: "local_question_expander",
      label: "本地问题裂变器",
      type: "builtin",
      status: "active",
      status_label: "正常",
      capability: "keyword_discovery",
      note: "基于来源范围、行业主题和种子词做本地问题生成，可替换为真实搜索或爬虫适配层。"
    },
    {
      id: "remote_keyword_adapter",
      label: "远程抓词适配器",
      type: "http_adapter",
      status: "beta",
      status_label: "待接入",
      capability: "keyword_discovery",
      note: "预留给真实搜索建议词、PAA、站内问答或采集服务。"
    }
  ],
  topic_planning: [
    {
      id: "local_topic_planner",
      label: "本地选题规划器",
      type: "builtin",
      status: "active",
      status_label: "正常",
      capability: "topic_planning",
      note: "根据关键词意图、模板类型和渠道推荐生成选题。"
    },
    {
      id: "remote_topic_planner",
      label: "远程选题规划器",
      type: "llm_adapter",
      status: "beta",
      status_label: "待接入",
      capability: "topic_planning",
      note: "预留给 DeepSeek、Kimi、豆包等选题编排服务。"
    }
  ],
  article_generation: [
    {
      id: "local_geo_writer",
      label: "本地 GEO 写稿器",
      type: "builtin",
      status: "active",
      status_label: "正常",
      capability: "article_generation",
      note: "按 GEO 结构输出初稿，可替换成真实大模型写作服务。"
    },
    {
      id: "remote_geo_writer",
      label: "远程写稿适配器",
      type: "llm_adapter",
      status: "beta",
      status_label: "待接入",
      capability: "article_generation",
      note: "预留给 DeepSeek、Kimi、OpenAI 兼容接口等写作服务。"
    }
  ]
};

const defaultProviderConfigs = {
  local_question_expander: {
    enabled: true,
    endpoint: "",
    model_name: "",
    api_key: "",
    timeout_ms: 1200,
    retry_count: 0,
    notes: "本地内置问题裂变逻辑。"
  },
  remote_keyword_adapter: {
    enabled: false,
    endpoint: "mock://keyword-discovery",
    model_name: "",
    api_key: "",
    timeout_ms: 8000,
    retry_count: 2,
    notes: "替换为真实搜索建议词、PAA 或采集服务。"
  },
  local_topic_planner: {
    enabled: true,
    endpoint: "",
    model_name: "",
    api_key: "",
    timeout_ms: 1200,
    retry_count: 0,
    notes: "本地规则式选题规划。"
  },
  remote_topic_planner: {
    enabled: false,
    endpoint: "mock://topic-planning",
    model_name: "deepseek-chat",
    api_key: "",
    timeout_ms: 12000,
    retry_count: 2,
    notes: "替换为真实 LLM 选题规划服务。"
  },
  local_geo_writer: {
    enabled: true,
    endpoint: "",
    model_name: "",
    api_key: "",
    timeout_ms: 1500,
    retry_count: 0,
    notes: "本地 GEO 草稿生成。"
  },
  remote_geo_writer: {
    enabled: false,
    endpoint: "mock://article-generation",
    model_name: "deepseek-reasoner",
    api_key: "",
    timeout_ms: 20000,
    retry_count: 2,
    notes: "替换为真实写稿模型服务。"
  }
};

const providerProtocolSchemas = {
  keyword_discovery: {
    request: {
      body: {
        provider_id: "remote_keyword_adapter",
        capability: "keyword_discovery",
        model_name: "",
        payload: {
          seed_keywords: ["企业智能体"],
          industry_topic: "中国智能体",
          source_scope: "authority_media",
          monitoring_goal: "authority_follow",
          fetch_limit: 8
        }
      },
      required_fields: ["provider_id", "capability", "payload"]
    },
    response: {
      body: {
        items: [
          {
            question: "中国企业怎么评估企业智能体平台？",
            normalized_keyword: "中国企业怎么评估企业智能体平台？",
            suggested_titles: ["中国企业怎么评估企业智能体平台？"],
            category: "definition",
            intent: "decision"
          }
        ]
      },
      required_fields: ["items"],
      item_required_fields: ["question"]
    }
  },
  topic_planning: {
    request: {
      body: {
        provider_id: "remote_topic_planner",
        capability: "topic_planning",
        model_name: "deepseek-chat",
        payload: {
          keywords: [
            {
              id: "kw-1",
              keyword: "企业智能体平台怎么选",
              recommended_content_type: "comparison_page",
              recommended_content_type_label: "对比页",
              industry: "企业智能体"
            }
          ],
          template_type: "decision"
        }
      },
      required_fields: ["provider_id", "capability", "payload"]
    },
    response: {
      body: {
        items: [
          {
            title: "企业智能体平台怎么选：5 个评估维度",
            keyword_id: "kw-1",
            template_type: "decision",
            content_type: "comparison_page"
          }
        ]
      },
      required_fields: ["items"],
      item_required_fields: ["title"]
    }
  },
  article_generation: {
    request: {
      body: {
        provider_id: "remote_geo_writer",
        capability: "article_generation",
        model_name: "deepseek-reasoner",
        payload: {
          topic: {
            id: "tp-1",
            title: "企业智能体平台怎么选：5 个评估维度",
            keyword_id: "kw-1",
            template_type: "decision",
            content_type: "comparison_page"
          },
          keyword: {
            id: "kw-1",
            keyword: "企业智能体平台怎么选",
            industry: "企业智能体"
          }
        }
      },
      required_fields: ["provider_id", "capability", "payload"]
    },
    response: {
      body: {
        article: {
          title: "企业智能体平台怎么选：5 个评估维度",
          content_markdown: "# 企业智能体平台怎么选：5 个评估维度",
          seo_title: "企业智能体平台怎么选：5 个评估维度",
          seo_description: "面向中国智能体行业的 GEO 草稿"
        },
        version: {
          title: "企业智能体平台怎么选：5 个评估维度",
          content_markdown: "# 企业智能体平台怎么选：5 个评估维度"
        }
      },
      required_fields: ["article"],
      article_required_fields: ["title", "content_markdown"]
    }
  }
};

let activeProviderIds = {
  keyword_discovery: process.env.GEO_KEYWORD_PROVIDER || "local_question_expander",
  topic_planning: process.env.GEO_TOPIC_PROVIDER || "local_topic_planner",
  article_generation: process.env.GEO_ARTICLE_PROVIDER || "local_geo_writer"
};

let providerConfigs = deepClone(defaultProviderConfigs);

const articleTypeLabels = {
  article: "文章",
  comparison_page: "对比页",
  scenario_page: "场景页",
  faq: "问答页"
};

function safeClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function maskSecret(value) {
  const secret = String(value || "");
  if (!secret) {
    return "";
  }
  const visible = secret.slice(-3);
  return `${"*".repeat(Math.max(8, secret.length - visible.length))}${visible}`;
}

function sanitizeProviderConfig(config = {}) {
  const cloned = deepClone(config);
  const maskedApiKey = maskSecret(cloned.api_key);
  cloned.api_key = "";
  cloned.masked_api_key = maskedApiKey;
  return cloned;
}

function isMaskedSecret(value) {
  return /^\*{4,}.{0,8}$/.test(String(value || ""));
}

function getCatalogProvider(providerId) {
  return Object.values(providerCatalog).flat().find((item) => item.id === providerId) || null;
}

function isBlockedProviderHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host === "::1") {
    return true;
  }

  const parts = host.split(".").map((part) => Number(part));
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [first, second] = parts;
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first === 169 && second === 254 ||
      first === 172 && second >= 16 && second <= 31 ||
      first === 192 && second === 168 ||
      first === 100 && second >= 64 && second <= 127
    );
  }

  return false;
}

export function validateProviderEndpoint(endpoint) {
  const value = String(endpoint || "").trim();
  if (!value) {
    return;
  }
  if (value.startsWith("mock://")) {
    return;
  }

  let parsed = null;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Provider endpoint is not a valid URL");
  }

  const allowInsecureHttp = process.env.GEO_ALLOW_INSECURE_PROVIDER_HTTP === "1";
  if (parsed.protocol !== "https:" && !(allowInsecureHttp && parsed.protocol === "http:")) {
    throw new Error("Provider endpoint is not allowed: use https:// or mock://");
  }

  if (isBlockedProviderHost(parsed.hostname)) {
    throw new Error("Provider endpoint is not allowed: private or loopback hosts are blocked");
  }
}

function getProvider(capability) {
  const providerId = activeProviderIds[capability];
  const resolved =
    providerCatalog[capability]?.find((item) => item.id === providerId) || providerCatalog[capability]?.[0] || null;
  if (!resolved) {
    return null;
  }
  return {
    ...resolved,
    config: deepClone(providerConfigs[resolved.id] || {})
  };
}

export function getAutomationProviderState() {
  return {
    activeProviderIds: deepClone(activeProviderIds),
    providerConfigs: deepClone(providerConfigs)
  };
}

export function hydrateAutomationProviderState(payload = {}) {
  if (payload.activeProviderIds && typeof payload.activeProviderIds === "object") {
    activeProviderIds = {
      ...activeProviderIds,
      ...deepClone(payload.activeProviderIds)
    };
  }

  if (payload.providerConfigs && typeof payload.providerConfigs === "object") {
    providerConfigs = {
      ...providerConfigs,
      ...deepClone(payload.providerConfigs)
    };
  }
}

export function getAutomationProvider(providerId) {
  const provider = getCatalogProvider(providerId);
  if (!provider) {
    return null;
  }
  const config = providerConfigs[provider.id] || {};
  return {
    ...provider,
    is_active: activeProviderIds[provider.capability] === provider.id,
    config: sanitizeProviderConfig(config),
    protocol: getAutomationProviderProtocol(providerId)
  };
}

function getAutomationProviderInternal(providerId) {
  const provider = getCatalogProvider(providerId);
  if (!provider) {
    return null;
  }
  return {
    ...provider,
    is_active: activeProviderIds[provider.capability] === provider.id,
    config: deepClone(providerConfigs[provider.id] || {}),
    protocol: getAutomationProviderProtocol(providerId)
  };
}

export function saveAutomationProvider(providerId, patch = {}) {
  const provider = getCatalogProvider(providerId);
  if (!provider) {
    return null;
  }

  const currentConfig = providerConfigs[providerId] || {};
  const nextConfig = {
    ...currentConfig
  };

  if (typeof patch.enabled === "boolean") nextConfig.enabled = patch.enabled;
  if (typeof patch.endpoint === "string") {
    const endpoint = patch.endpoint.trim();
    validateProviderEndpoint(endpoint);
    nextConfig.endpoint = endpoint;
  }
  if (typeof patch.model_name === "string") nextConfig.model_name = patch.model_name.trim();
  if (patch.clear_api_key === true) {
    nextConfig.api_key = "";
  } else if (typeof patch.api_key === "string") {
    const apiKey = patch.api_key.trim();
    if (apiKey && !isMaskedSecret(apiKey)) {
      nextConfig.api_key = apiKey;
    }
  }
  if (typeof patch.timeout_ms === "number") nextConfig.timeout_ms = Math.max(500, Math.round(patch.timeout_ms));
  if (typeof patch.retry_count === "number") nextConfig.retry_count = Math.max(0, Math.round(patch.retry_count));
  if (typeof patch.notes === "string") nextConfig.notes = patch.notes.trim();

  providerConfigs[providerId] = nextConfig;

  if (patch.is_active === true) {
    activeProviderIds[provider.capability] = providerId;
  }

  return getAutomationProvider(providerId);
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

function makeTopicTitle(keyword) {
  return keyword.suggested_titles?.[0] || keyword.keyword;
}

function buildProviderRemoteRequest(provider, payload) {
  return {
    provider_id: provider.id,
    capability: provider.capability,
    model_name: provider?.config?.model_name || "",
    payload: safeClone(payload)
  };
}

function buildProviderTestRuntimeHelpers(capability) {
  const now = new Date().toISOString();
  const idFactory = (prefix) => `test-${prefix}`;

  if (capability === "topic_planning") {
    return {
      now,
      user_id: "user-1",
      idFactory,
      pickTemplateType: () => "decision",
      templateLabel: (value) =>
        (
          {
            decision: "决策",
            awareness: "认知",
            consideration: "考虑"
          }[value] || value || "决策"
        )
    };
  }

  if (capability === "article_generation") {
    return {
      now,
      idFactory,
      brandProfile: {
        default_cta: "预约中国智能体 GEO 演示"
      },
      articleTypeLabel: (value) => articleTypeLabels[value] || value || "文章"
    };
  }

  return {
    now,
    idFactory
  };
}

export function getAutomationProviderProtocol(target) {
  const provider = getCatalogProvider(target);
  const capability = provider?.capability || target;
  const schema = capability ? providerProtocolSchemas[capability] : null;
  if (!schema) {
    return null;
  }

  return {
    capability,
    provider_id: provider?.id || null,
    provider_label: provider?.label || null,
    request: deepClone(schema.request),
    response: deepClone(schema.response),
    example_request_body: deepClone(schema.request?.body || {}),
    example_response_body: deepClone(schema.response?.body || {})
  };
}

export function buildProviderTestPayload(providerOrId) {
  const provider =
    typeof providerOrId === "string" ? getAutomationProviderInternal(providerOrId) : providerOrId || null;
  if (!provider) {
    return null;
  }

  const protocol = getAutomationProviderProtocol(provider.id);
  const payload = deepClone(protocol?.request?.body?.payload || {});
  return {
    ...payload,
    ...buildProviderTestRuntimeHelpers(provider.capability)
  };
}

function collectMissingFields(subject, fields, prefix) {
  const missing = [];
  for (const field of fields || []) {
    const value = subject?.[field];
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (isMissing) {
      missing.push(`${prefix}.${field}`);
    }
  }
  return missing;
}

export function validateRemoteResponse(capability, response) {
  const schema = providerProtocolSchemas[capability];
  const errors = [];
  if (!schema) {
    return {
      valid: true,
      errors,
      schema: null
    };
  }

  if (!response || typeof response !== "object" || Array.isArray(response)) {
    errors.push("response must be an object");
  } else {
    errors.push(...collectMissingFields(response, schema.response?.required_fields || [], "response"));

    if (Array.isArray(response.items) && Array.isArray(schema.response?.item_required_fields)) {
      response.items.forEach((item, index) => {
        errors.push(
          ...collectMissingFields(item, schema.response.item_required_fields, `response.items[${index}]`)
        );
      });
    }

    if (capability === "article_generation") {
      if (!response.article || typeof response.article !== "object" || Array.isArray(response.article)) {
        errors.push("response.article must be an object");
      } else {
        errors.push(
          ...collectMissingFields(
            response.article,
            schema.response?.article_required_fields || [],
            "response.article"
          )
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    schema: getAutomationProviderProtocol(capability)
  };
}

export function listAutomationProviders() {
  return Object.entries(providerCatalog).flatMap(([capability, items]) =>
    items.map((item) => ({
      ...getAutomationProvider(item.id),
      capability
    }))
  );
}

export function getAutomationProviderSummary() {
  const allProviders = listAutomationProviders();
  return {
    active_provider_ids: {
      ...activeProviderIds
    },
    counts: {
      total: allProviders.length,
      active: allProviders.filter((item) => item.is_active).length
    },
    capabilities: Object.keys(providerCatalog).map((capability) => ({
      capability,
      active_provider_id: activeProviderIds[capability],
      provider_count: providerCatalog[capability].length,
      active_provider_label: getProvider(capability)?.label || null
    })),
    items: allProviders
  };
}

function buildLocalKeywordDiscoveryResult(input, providerOverride = null) {
  const provider = providerOverride || getProvider("keyword_discovery");
  const seeds = Array.isArray(input.seed_keywords) ? input.seed_keywords.filter(Boolean) : [];
  const topic = input.industry_topic || seeds[0] || "中国智能体";
  const sourceScope = input.source_scope || "mixed_media";
  const monitoringGoal = input.monitoring_goal || "full_funnel";
  const fetchLimit = Number(input.fetch_limit) || 20;
  const generatedQuestions = (seeds.length
    ? seeds.flatMap((seed) => buildQuestionsFromSourceScope(seed, sourceScope, monitoringGoal))
    : buildQuestionsFromSourceScope(topic, sourceScope, monitoringGoal)).slice(0, fetchLimit);

  return {
    provider,
    items: generatedQuestions.map((question) => ({
      question,
      normalized_keyword: question.toLowerCase().trim(),
      suggested_titles: makeSuggestedTitles(question),
      ...inferQuestionMeta(question)
    }))
  };
}

function buildLocalTopicPlanningResult(input, providerOverride = null) {
  const provider = providerOverride || getProvider("topic_planning");
  const now = input.now;
  const userId = input.user_id || "user-1";
  const items = (input.keywords || []).map((keyword, index) => {
    const resolvedTemplate = input.template_type || input.pickTemplateType(keyword);
    return {
      id: `${input.idFactory("tp")}-${index + 1}`,
      keyword_id: keyword.id,
      title: makeTopicTitle(keyword),
      content_type: keyword.recommended_content_type,
      content_type_label: keyword.recommended_content_type_label,
      template_type: resolvedTemplate,
      template_type_label: input.templateLabel(resolvedTemplate),
      target_channels: keyword.recommended_channel_types || ["website_blog"],
      target_audience: `${keyword.industry} 相关团队`,
      core_messages: [
        "优先解释业务场景和适用对象",
        "避免把智能体写成通用 AI 工具",
        "保留问答与行动引导结构"
      ],
      required_terms: keyword.related_keywords?.slice(0, 3) || [],
      forbidden_terms: ["自动爆文", "万能智能体"],
      cta_type: "book_demo",
      priority: 1,
      brand_fit: "high",
      brand_fit_label: "高",
      owner_user_id: keyword.owner_user_id || userId,
      provider_id: provider?.id || null,
      provider_label: provider?.label || null,
      status: "draft",
      status_label: "草稿",
      created_at: now,
      updated_at: now
    };
  });

  return {
    provider,
    items
  };
}

function buildLocalArticleGenerationResult(input, providerOverride = null) {
  const provider = providerOverride || getProvider("article_generation");
  const { topic, keyword, brandProfile, articleTypeLabel, idFactory, now } = input;
  const articleId = idFactory("ar");
  const outline = [
    "问题背景与适用对象",
    "核心判断框架",
    "落地步骤与边界",
    "常见问题",
    "行动引导"
  ];

  const article = {
    id: articleId,
    topic_idea_id: topic.id,
    keyword_id: topic.keyword_id,
    title: topic.title,
    subtitle: `${keyword?.industry || "中国智能体"} 场景下的 GEO 草稿`,
    article_type: topic.content_type || "article",
    article_type_label: articleTypeLabel(topic.content_type || "article"),
    target_channel_types: topic.target_channels || ["website_blog"],
    word_count: 920,
    outline_json: outline,
    content_markdown: [
      `# ${topic.title}`,
      "",
      `这是一篇基于“${keyword?.keyword || topic.title}”自动生成的初稿，优先解释适用对象、落地方式和风险边界。`,
      "",
      `本文按 ${topic.template_type_label || topic.template_type || "文章"} 结构编排，覆盖 ${keyword?.industry || "中国智能体"} 语境下最核心的判断点。`,
      "",
      "## 为什么这个问题值得单独写",
      "企业在评估中国智能体产品时，真正关心的不是单个模型能力，而是流程、场景、权限与交付边界。",
      "",
      "## 最小判断框架",
      `1. 明确 ${keyword?.industry || "业务场景"} 的目标和约束`,
      "2. 判断是否需要私有化、审核和角色协同",
      "3. 选择适合官网、知乎或公众号的表达方式",
      "",
      "## 术语锚点",
      `围绕 ${[keyword?.industry || "中国智能体", topic.template_type_label || topic.template_type || "文章"].join("、")} 建立稳定表达，方便后续审核与分发。`,
      "",
      "## 常见问题",
      "1. 适合哪些团队先做？",
      "2. 与传统工具有什么边界？",
      "3. 如何验证真正能落地？",
      "",
      "## 行动引导",
      brandProfile.default_cta
    ].join("\n"),
    excerpt: `基于选题“${topic.title}”生成的初稿，适合继续编辑、审核与发布。`,
    seo_title: topic.title,
    seo_description: `${topic.title}，围绕中国智能体行业的 GEO 问答意图生成的文章草稿。`,
    tags: [keyword?.industry || "中国智能体", topic.template_type_label || topic.template_type],
    provider_id: provider?.id || null,
    provider_label: provider?.label || null,
    review_status: "draft",
    review_status_label: "草稿",
    publish_status: "draft",
    publish_status_label: "草稿",
    owner_user_id: topic.owner_user_id || "user-1",
    created_by: "user-1",
    updated_at: now
  };

  const version = {
    id: idFactory("ver"),
    article_id: articleId,
    version_no: 1,
    generation_mode: "ai_full",
    title: article.title,
    content_markdown: article.content_markdown,
    created_by: "user-1",
    created_at: now
  };

  return {
    provider,
    article,
    version
  };
}

function executionMeta(provider, mode, extra = {}) {
  return {
    capability: provider?.capability || extra.capability || "",
    provider_id: provider?.id || null,
    provider_label: provider?.label || null,
    provider_type: provider?.type || null,
    mode,
    endpoint: provider?.config?.endpoint || "",
    model_name: provider?.config?.model_name || "",
    ...extra
  };
}

function normalizeRemoteQuestionItem(item = {}) {
  const question = String(item.question || item.keyword || "").trim();
  return {
    question,
    normalized_keyword: String(item.normalized_keyword || question.toLowerCase().trim()),
    suggested_titles: Array.isArray(item.suggested_titles) && item.suggested_titles.length
      ? item.suggested_titles
      : makeSuggestedTitles(question),
    ...inferQuestionMeta(question),
    ...item
  };
}

function normalizeRemoteTopicItem(item = {}, input, index) {
  const keyword = input.keywords[index] || input.keywords[0];
  const resolvedTemplate = item.template_type || input.template_type || input.pickTemplateType(keyword);
  return {
    id: item.id || `${input.idFactory("tp")}-${index + 1}`,
    keyword_id: item.keyword_id || keyword.id,
    title: item.title || makeTopicTitle(keyword),
    content_type: item.content_type || keyword.recommended_content_type,
    content_type_label: item.content_type_label || keyword.recommended_content_type_label,
    template_type: resolvedTemplate,
    template_type_label: item.template_type_label || input.templateLabel(resolvedTemplate),
    target_channels: item.target_channels || keyword.recommended_channel_types || ["website_blog"],
    target_audience: item.target_audience || `${keyword.industry} 相关团队`,
    core_messages: item.core_messages || [
      "优先解释业务场景和适用对象",
      "避免把智能体写成通用 AI 工具",
      "保留问答与行动引导结构"
    ],
    required_terms: item.required_terms || keyword.related_keywords?.slice(0, 3) || [],
    forbidden_terms: item.forbidden_terms || ["自动爆文", "万能智能体"],
    cta_type: item.cta_type || "book_demo",
    priority: item.priority || 1,
    brand_fit: item.brand_fit || "high",
    brand_fit_label: item.brand_fit_label || "高",
    owner_user_id: item.owner_user_id || keyword.owner_user_id || input.user_id || "user-1",
    status: item.status || "draft",
    status_label: item.status_label || "草稿",
    created_at: item.created_at || input.now,
    updated_at: item.updated_at || input.now
  };
}

function normalizeRemoteArticleResult(result = {}, input) {
  const local = buildLocalArticleGenerationResult(input);
  if (!result.article || typeof result.article !== "object") {
    return local;
  }

  const article = {
    ...local.article,
    ...result.article,
    id: local.article.id,
    topic_idea_id: input.topic?.id || local.article.topic_idea_id,
    keyword_id: input.topic?.keyword_id || local.article.keyword_id,
    updated_at: input.now || local.article.updated_at
  };

  const version = {
    ...local.version,
    ...result.version,
    article_id: article.id,
    title: result.version?.title || article.title,
    content_markdown: result.version?.content_markdown || article.content_markdown
  };

  return {
    article,
    version
  };
}

function buildMockRemoteResponse(provider, payload) {
  if (provider.capability === "keyword_discovery") {
    const local = buildLocalKeywordDiscoveryResult(payload, provider);
    return {
      items: local.items.map((item) => ({
        ...item,
        question: `${item.question} [远程]`
      }))
    };
  }
  if (provider.capability === "topic_planning") {
    const local = buildLocalTopicPlanningResult(payload, provider);
    return {
      items: local.items.map((item) => ({
        ...item,
        title: `${item.title} / 远程规划`
      }))
    };
  }
  if (provider.capability === "article_generation") {
    const local = buildLocalArticleGenerationResult(payload, provider);
    return {
      article: {
        ...local.article,
        title: `${local.article.title}｜远程草稿`
      },
      version: {
        ...local.version,
        title: `${local.version.title}｜远程草稿`
      }
    };
  }

  return {};
}

async function invokeRemoteProvider(provider, payload, options = {}) {
  const endpoint = String(provider?.config?.endpoint || "").trim();
  const retryCount = Math.max(0, Number(provider?.config?.retry_count || 0));
  const timeoutMs = Math.max(500, Number(provider?.config?.timeout_ms || 8000));
  const requestBody = buildProviderRemoteRequest(provider, payload);
  const headers = {
    "Content-Type": "application/json"
  };
  if (provider?.config?.api_key) {
    headers.Authorization = `Bearer ${provider.config.api_key}`;
  }

  if (!endpoint) {
    throw new Error("Provider endpoint is empty");
  }
  validateProviderEndpoint(endpoint);

  const startedAt = Date.now();
  let lastError = null;
  let lastAttempts = 0;
  for (let attempt = 1; attempt <= retryCount + 1; attempt += 1) {
    let timer = null;
    try {
      let responseData = null;

      if (endpoint.startsWith("mock://")) {
        responseData = buildMockRemoteResponse(provider, payload);
      } else {
        const controller = new AbortController();
        timer = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Remote provider responded with ${response.status}`);
        }

        responseData = await response.json();
      }

      const validation = options.validateResponse
        ? validateRemoteResponse(provider.capability, responseData)
        : { valid: true, errors: [] };
      if (!validation.valid) {
        throw new Error(`Remote provider schema invalid: ${validation.errors.join("; ")}`);
      }

      return {
        response: responseData,
        endpoint,
        attempts: attempt,
        duration_ms: Date.now() - startedAt,
        schema_valid: validation.valid,
        validation_errors: validation.errors || [],
        request_body: requestBody
      };
    } catch (error) {
      lastError = error;
      lastAttempts = attempt;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  const resolvedError = lastError || new Error("Remote provider request failed");
  resolvedError.providerAttempts = lastAttempts || retryCount + 1;
  resolvedError.providerDurationMs = Date.now() - startedAt;
  resolvedError.providerEndpoint = endpoint;
  throw resolvedError;
}

export async function testAutomationProviderConnection(providerId) {
  const provider = getAutomationProviderInternal(providerId);
  if (!provider) {
    return null;
  }

  const payload = buildProviderTestPayload(provider);
  const protocol = getAutomationProviderProtocol(providerId);
  const requestBody = buildProviderRemoteRequest(provider, payload);

  if (provider.type === "builtin") {
    const startedAt = Date.now();
    const sampleResponse = buildMockRemoteResponse(provider, payload);
    const validation = validateRemoteResponse(provider.capability, sampleResponse);
    return {
      success: validation.valid,
      capability: provider.capability,
      provider_id: provider.id,
      provider_label: provider.label,
      provider_type: provider.type,
      endpoint: "local://builtin",
      attempts: 1,
      duration_ms: Date.now() - startedAt,
      execution_mode: "local",
      schema_valid: validation.valid,
      error_message: validation.valid ? "" : validation.errors.join("; "),
      validation_errors: validation.errors,
      request_body: requestBody,
      sample_response: sampleResponse,
      protocol
    };
  }

  try {
    const result = await invokeRemoteProvider(provider, payload, {
      validateResponse: true
    });
    return {
      success: true,
      capability: provider.capability,
      provider_id: provider.id,
      provider_label: provider.label,
      provider_type: provider.type,
      endpoint: result.endpoint,
      attempts: result.attempts,
      duration_ms: result.duration_ms,
      execution_mode: "remote",
      schema_valid: result.schema_valid,
      error_message: "",
      validation_errors: result.validation_errors || [],
      request_body: result.request_body,
      sample_response: result.response,
      protocol
    };
  } catch (error) {
    return {
      success: false,
      capability: provider.capability,
      provider_id: provider.id,
      provider_label: provider.label,
      provider_type: provider.type,
      endpoint: error?.providerEndpoint || provider.config?.endpoint || "",
      attempts: error?.providerAttempts || Math.max(1, Number(provider.config?.retry_count || 0) + 1),
      duration_ms: error?.providerDurationMs || 0,
      execution_mode: "remote",
      schema_valid: false,
      error_message: error instanceof Error ? error.message : String(error),
      validation_errors: [],
      request_body: requestBody,
      sample_response: null,
      protocol
    };
  }
}

async function executeProvider(capability, input, localBuilder, remoteNormalizer) {
  const provider = getProvider(capability);
  if (!provider) {
    throw new Error(`Provider for capability ${capability} is not configured`);
  }

  if (provider.type === "builtin") {
    const result = localBuilder(input, provider);
    return {
      ...result,
      execution: executionMeta(provider, "local")
    };
  }

  if (provider.config?.enabled === false) {
    const fallbackProvider = getCatalogProvider(
      {
        keyword_discovery: "local_question_expander",
        topic_planning: "local_topic_planner",
        article_generation: "local_geo_writer"
      }[capability]
    );
    const result = localBuilder(input, fallbackProvider);
    return {
      ...result,
      execution: executionMeta(provider, "fallback_local", {
        fallback_provider_id: fallbackProvider?.id || null,
        error_message: "Remote provider is disabled"
      })
    };
  }

  validateProviderEndpoint(provider.config?.endpoint || "");

  try {
    const remoteResult = await invokeRemoteProvider(provider, input, {
      validateResponse: true
    });
    const normalized = remoteNormalizer(remoteResult.response, input);
    return {
      ...normalized,
      provider,
      execution: executionMeta(provider, "remote", {
        attempts: remoteResult.attempts,
        duration_ms: remoteResult.duration_ms,
        schema_valid: remoteResult.schema_valid
      })
    };
  } catch (error) {
    const fallbackProvider = getCatalogProvider(
      {
        keyword_discovery: "local_question_expander",
        topic_planning: "local_topic_planner",
        article_generation: "local_geo_writer"
      }[capability]
    );
    const fallback = localBuilder(input, fallbackProvider);
    return {
      ...fallback,
      execution: executionMeta(provider, "fallback_local", {
        fallback_provider_id: fallbackProvider?.id || null,
        error_message: error instanceof Error ? error.message : String(error),
        attempts: error?.providerAttempts || 1,
        duration_ms: error?.providerDurationMs || 0
      })
    };
  }
}

export async function discoverKeywordQuestions(input) {
  return executeProvider(
    "keyword_discovery",
    input,
    buildLocalKeywordDiscoveryResult,
    (response) => ({
      items: Array.isArray(response.items) ? response.items.map(normalizeRemoteQuestionItem) : []
    })
  );
}

export async function planTopicsFromKeywords(input) {
  return executeProvider(
    "topic_planning",
    input,
    buildLocalTopicPlanningResult,
    (response, payload) => ({
      items: Array.isArray(response.items)
        ? response.items.map((item, index) => normalizeRemoteTopicItem(item, payload, index))
        : []
    })
  );
}

export async function generateArticleDraft(input) {
  return executeProvider(
    "article_generation",
    input,
    buildLocalArticleGenerationResult,
    (response, payload) => normalizeRemoteArticleResult(response, payload)
  );
}
