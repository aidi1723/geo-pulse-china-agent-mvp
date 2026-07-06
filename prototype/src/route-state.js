const validPages = new Set([
  "dashboard",
  "keywords",
  "content",
  "distribution",
  "analytics",
  "international",
  "billing",
  "settings"
]);

const validTabs = {
  keywords: new Set(["keywords", "opportunities", "map", "crawl"]),
  content: new Set(["topics", "articles", "reviews", "templates"]),
  distribution: new Set(["tasks", "channels", "records"]),
  analytics: new Set(["keywords", "content", "channels"]),
  settings: new Set(["brand", "models", "channels", "providers", "automation"])
};

const routeTabKeys = {
  keywords: "keywordsTab",
  content: "contentTab",
  distribution: "distributionTab",
  analytics: "analyticsTab",
  settings: "settingsTab"
};

const validKeywordForms = new Set(["all", "what", "how", "vs", "which", "query"]);
const validKeywordClusters = new Set([
  "all",
  "购买决策",
  "技术解释",
  "对比选择",
  "部署与风险",
  "行业场景"
]);
const validContentStatuses = new Set([
  "all",
  "draft",
  "generated",
  "review_pending",
  "review_rejected",
  "ready_to_publish",
  "published"
]);
const validDistributionStatuses = new Set([
  "all",
  "running",
  "queued",
  "partial_failed",
  "published",
  "failed"
]);
const validPanels = new Set(["expand", "job", "publish"]);

function parseHashState(hash = "") {
  return new URLSearchParams(String(hash).replace(/^#/, "").trim());
}

function setParam(params, key, value) {
  if (value === null || value === undefined || value === "") {
    return;
  }
  params.set(key, String(value));
}

export function applyRouteState(store, hash = "") {
  const params = parseHashState(hash);
  const page = params.get("page");

  if (validPages.has(page)) {
    store.page = page;
  }

  Object.entries(routeTabKeys).forEach(([group, paramKey]) => {
    const tab = params.get(paramKey);
    if (tab && validTabs[group].has(tab)) {
      store.tabs[group] = tab;
    }
  });

  const keywordQuery = params.get("keywordQuery");
  const keywordForm = params.get("keywordForm");
  const keywordCluster = params.get("keywordCluster");
  const keywordId = params.get("keywordId");
  const mediaSourceId = params.get("mediaSourceId");
  if (keywordQuery !== null) {
    store.filters.keywords.query = keywordQuery;
  }
  if (keywordForm && validKeywordForms.has(keywordForm)) {
    store.filters.keywords.form = keywordForm;
  }
  if (keywordCluster && validKeywordClusters.has(keywordCluster)) {
    store.filters.keywords.cluster = keywordCluster;
  }
  if (keywordId) {
    store.selectedIds.keyword = keywordId;
  }
  if (mediaSourceId) {
    store.selectedIds.mediaSource = mediaSourceId;
  }

  const contentQuery = params.get("contentQuery");
  const contentStatus = params.get("contentStatus");
  const topicId = params.get("topicId");
  const articleId = params.get("articleId");
  const reviewId = params.get("reviewId");
  if (contentQuery !== null) {
    store.filters.content.query = contentQuery;
  }
  if (contentStatus && validContentStatuses.has(contentStatus)) {
    store.filters.content.status = contentStatus;
  }
  if (topicId) {
    store.selectedIds.topic = topicId;
  }
  if (articleId) {
    store.selectedIds.article = articleId;
  }
  if (reviewId) {
    store.selectedIds.review = reviewId;
  }

  const distributionQuery = params.get("distributionQuery");
  const distributionStatus = params.get("distributionStatus");
  const taskId = params.get("taskId");
  if (distributionQuery !== null) {
    store.filters.distribution.query = distributionQuery;
  }
  if (distributionStatus && validDistributionStatuses.has(distributionStatus)) {
    store.filters.distribution.status = distributionStatus;
  }
  if (taskId) {
    store.selectedIds.task = taskId;
  }

  const modelId = params.get("modelId");
  const channelId = params.get("channelId");
  const providerId = params.get("providerId");
  const connectorId = params.get("connectorId");
  const strategyId = params.get("strategyId");
  const runId = params.get("runId");
  const panel = params.get("panel");
  if (modelId) {
    store.selectedIds.model = modelId;
  }
  if (channelId) {
    store.selectedIds.channel = channelId;
  }
  if (providerId) {
    store.selectedIds.provider = providerId;
  }
  if (connectorId) {
    store.selectedIds.connector = connectorId;
  }
  if (strategyId) {
    store.selectedIds.strategy = strategyId;
  }
  if (runId) {
    store.selectedIds.automationRun = runId;
  }
  if (panel && validPanels.has(panel) && store.ui) {
    store.ui.panel = panel;
  }
}

export function serializeRouteState(store) {
  const params = new URLSearchParams();
  params.set("page", store.page);

  Object.entries(routeTabKeys).forEach(([group, paramKey]) => {
    if (store.tabs[group]) {
      params.set(paramKey, store.tabs[group]);
    }
  });

  if (store.page === "keywords") {
    setParam(params, "keywordQuery", store.filters.keywords.query);
    setParam(params, "keywordForm", store.filters.keywords.form);
    setParam(params, "keywordCluster", store.filters.keywords.cluster);
    setParam(params, "keywordId", store.selectedIds.keyword);
    if (store.tabs.keywords === "crawl") {
      setParam(params, "mediaSourceId", store.selectedIds.mediaSource);
      setParam(params, "strategyId", store.selectedIds.strategy);
      setParam(params, "runId", store.selectedIds.automationRun);
    }
  }

  if (store.page === "content") {
    setParam(params, "contentQuery", store.filters.content.query);
    setParam(params, "contentStatus", store.filters.content.status);
    setParam(params, "topicId", store.selectedIds.topic);
    setParam(params, "articleId", store.selectedIds.article);
    setParam(params, "reviewId", store.selectedIds.review);
  }

  if (store.page === "distribution") {
    setParam(params, "distributionQuery", store.filters.distribution.query);
    setParam(params, "distributionStatus", store.filters.distribution.status);
    setParam(params, "taskId", store.selectedIds.task);
  }

  if (store.page === "settings") {
    setParam(params, "modelId", store.selectedIds.model);
    setParam(params, "channelId", store.selectedIds.channel);
    setParam(params, "providerId", store.selectedIds.provider);
    setParam(params, "connectorId", store.selectedIds.connector);
    setParam(params, "strategyId", store.selectedIds.strategy);
    if (store.tabs.settings === "automation") {
      setParam(params, "runId", store.selectedIds.automationRun);
    }
  }

  if (store.ui?.panel && validPanels.has(store.ui.panel)) {
    setParam(params, "panel", store.ui.panel);
  }

  return params.toString();
}
