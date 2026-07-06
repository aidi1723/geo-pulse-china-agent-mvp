export const store = {
  page: "dashboard",
  tabs: {
    keywords: "keywords",
    content: "topics",
    distribution: "tasks",
    analytics: "keywords",
    settings: "brand"
  },
  selectedIds: {
    keyword: null,
    topic: null,
    article: null,
    review: null,
    task: null,
    model: null,
    channel: null,
    mediaSource: null,
    provider: null,
    connector: null,
    strategy: null,
    automationRun: null
  },
  search: "",
  ui: {
    loading: true,
    error: "",
    notice: "",
    panel: ""
  },
  session: {
    current: {
      authenticated: false
    },
    loginForm: {
      username: "owner",
      password: ""
    },
    temporaryPasswordNotice: ""
  },
  forms: {
    keywordExpansion: {
      name: "中国智能体 问题裂变",
      source_type: "suggestion",
      industry_topic: "中国智能体",
      seed_keywords: "企业智能体",
      fetch_limit: 12,
      dedupe_enabled: true
    },
    keywordJob: {
      name: "中国智能体 问题抓取任务",
      source_type: "mixed_media",
      source_scope: "mixed_media",
      monitoring_goal: "full_funnel",
      industry_topic: "中国智能体",
      seed_keywords: "企业智能体\n销售智能体\n私有化智能体",
      source_targets: "AgentCore 公众号\n36氪 AI\n极客公园",
      fetch_limit: 20,
      dedupe_enabled: true
    },
    publishTask: {
      name: "中国智能体 内容分发任务",
      channel_id: "ch-1",
      publish_mode: "scheduled",
      scheduled_at: "2026-04-18T10:00",
      require_confirmation: true,
      auto_retry_failed: false,
      article_ids: []
    },
    user: {
      username: "",
      display_name: "",
      role: "viewer",
      temporary_password: ""
    },
    runtimeBackupImport: ""
  },
  filters: {
    keywords: {
      query: "",
      form: "all",
      cluster: "all"
    },
    content: {
      query: "",
      status: "all"
    },
    distribution: {
      query: "",
      status: "all"
    }
  },
  data: {
    workspace: null,
    dashboardSummary: null,
    keywordTrend: [],
    contentFunnel: [],
    topKeywords: [],
    recentPublishes: [],
    keywords: [],
    keywordJobs: [],
    topics: [],
    articles: [],
    articleDetails: {},
    templates: [],
    publishTasks: [],
    publishRecords: [],
    channels: [],
    mediaSources: [],
    automationProviders: [],
    automationConnectors: [],
    providerInvocations: [],
    auditEvents: [],
    sourceStrategies: [],
    automationRuns: [],
    analyticsKeywords: null,
    analyticsContent: null,
    analyticsChannels: null,
    analyticsCampaigns: null,
    analyticsVisibility: null,
    audienceSegments: [],
    marketingCampaigns: [],
    billingSummary: null,
    invoices: [],
    workspaceInput: null,
    internationalGeo: null,
    runtimeStatus: null,
    brandProfile: null,
    modelConfigs: [],
    promptTemplates: [],
    contentQualityTraces: [],
    members: [],
    users: []
  }
};

export function setLoading(loading) {
  store.ui.loading = loading;
}

export function setError(message) {
  store.ui.error = message;
}

export function setNotice(message) {
  store.ui.notice = message;
}

export function setSession(session) {
  store.session.current = session || { authenticated: false };
}

export function clearSession() {
  store.session.current = { authenticated: false };
  store.session.temporaryPasswordNotice = "";
}

export function hydrateData(payload) {
  store.data = {
    ...store.data,
    ...payload
  };

  if (!store.selectedIds.keyword && store.data.keywords[0]) {
    store.selectedIds.keyword = store.data.keywords[0].id;
  }
  if (!store.selectedIds.topic && store.data.topics[0]) {
    store.selectedIds.topic = store.data.topics[0].id;
  }
  if (!store.selectedIds.article && store.data.articles[0]) {
    store.selectedIds.article = store.data.articles[0].id;
  }
  if (!store.selectedIds.review) {
    const pendingReview = store.data.articles.find((item) => item.review_status === "review_pending");
    store.selectedIds.review = pendingReview?.id || store.data.articles[0]?.id || null;
  }
  if (!store.selectedIds.task && store.data.publishTasks[0]) {
    store.selectedIds.task = store.data.publishTasks[0].id;
  }
  if (!store.selectedIds.model && store.data.modelConfigs[0]) {
    store.selectedIds.model = store.data.modelConfigs[0].id;
  }
  if (!store.selectedIds.channel && store.data.channels[0]) {
    store.selectedIds.channel = store.data.channels[0].id;
  }
  if (!store.selectedIds.mediaSource && store.data.mediaSources[0]) {
    store.selectedIds.mediaSource = store.data.mediaSources[0].id;
  }
  if (!store.selectedIds.provider && store.data.automationProviders?.[0]) {
    store.selectedIds.provider = store.data.automationProviders[0].id;
  }
  if (!store.selectedIds.connector && store.data.automationConnectors?.[0]) {
    store.selectedIds.connector = store.data.automationConnectors[0].id;
  }
  if (!store.selectedIds.strategy && store.data.sourceStrategies?.[0]) {
    store.selectedIds.strategy = store.data.sourceStrategies[0].id;
  }
  if (!store.selectedIds.automationRun && store.data.automationRuns?.[0]) {
    store.selectedIds.automationRun = store.data.automationRuns[0].id;
  }
}
