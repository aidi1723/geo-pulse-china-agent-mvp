import {
  approvePublishTask as approvePublishTaskApi,
  bootstrapData,
  cancelPublishTask,
  createContentTemplate as createContentTemplateApi,
  createExportJob as createExportJobApi,
  createArticleFromTopic,
  createManualArticle as createManualArticleApi,
  createManualTopic as createManualTopicApi,
  createChannel as createChannelApi,
  createMediaSource as createMediaSourceApi,
  createModelConfig as createModelConfigApi,
  createPublishTask as createPublishTaskApi,
  createKeywordCrawlJob,
  createTopicsFromKeywords,
  exportDownloadUrl,
  generateInternationalGeoArtifacts as generateInternationalGeoArtifactsApi,
  generateTopicOutline as generateTopicOutlineApi,
  getArticleDetail,
  logoutSession as logoutSessionApi,
  resetRuntimeState as resetRuntimeStateApi,
  reconnectChannel as reconnectChannelApi,
  reviewArticle,
  retryAutomationRun as retryAutomationRunApi,
  runSourceStrategy as runSourceStrategyApi,
  runMarketingCampaign as runMarketingCampaignApi,
  runSchedulerTick as runSchedulerTickApi,
  runInternationalGeoAudit as runInternationalGeoAuditApi,
  runVisibilityCollection as runVisibilityCollectionApi,
  saveAutomationProvider as saveAutomationProviderApi,
  saveAutomationConnector as saveAutomationConnectorApi,
  saveBrandProfile,
  saveChannel as saveChannelApi,
  saveInternationalGeoInput as saveInternationalGeoInputApi,
  saveMediaSource as saveMediaSourceApi,
  saveModelConfig as saveModelConfigApi,
  saveSourceStrategy as saveSourceStrategyApi,
  submitArticleReview,
  takeoverPublishTaskItem as takeoverPublishTaskItemApi,
  testAutomationProvider as testAutomationProviderApi,
  testAutomationConnector as testAutomationConnectorApi,
  updateBillingPlan as updateBillingPlanApi,
  updateTopic as updateTopicApi,
  retryPublishTask,
  startPublishTask,
  updateKeyword,
  updateArticle
} from "./api.js?v=20260417-5";
import { applyRouteState, serializeRouteState } from "./route-state.js?v=20260418-2";
import { renderApp } from "./render.js?v=20260418-3";
import { bindEvents } from "./events.js?v=20260418-3";
import {
  buildReviewPayload,
  getActiveSearchValue,
  getSelectedOpportunityKeywordIds,
  normalizeStoreSelections,
  resolvePublishPanelState
} from "./experience-utils.js?v=20260418-3";
import { hydrateData, setError, setLoading, setNotice, store } from "./store.js?v=20260417-5";

const root = document.getElementById("app");
let noticeTimer = null;

function rerender() {
  if (!store.ui.loading && !store.ui.error) {
    normalizeStoreSelections(store);
  }
  store.search = getActiveSearchValue(store);
  renderApp(root, store);
  syncHashState();
}

function applyHashState() {
  applyRouteState(store, window.location.hash);
}

function syncHashState() {
  const nextHash = serializeRouteState(store);
  const currentHash = window.location.hash.replace(/^#/, "");
  if (nextHash === currentHash) {
    return;
  }

  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
}

function showNotice(message) {
  setNotice(message);
  rerender();
  if (noticeTimer) {
    clearTimeout(noticeTimer);
  }
  noticeTimer = setTimeout(() => {
    setNotice("");
    rerender();
  }, 2400);
}

function getSelectedArticlePayload(articleId) {
  const container = root.querySelector(".editor-area");
  if (!container || !articleId) {
    return null;
  }
  const title = container.querySelector('[data-article-field="title"]')?.value || "";
  const content = container.querySelector('[data-article-field="content_markdown"]')?.value || "";
  return {
    title,
    content_markdown: content
  };
}

function getReviewComments(articleId) {
  if (!articleId) {
    return "";
  }

  return (
    root.querySelector(`[data-review-comments="${articleId}"]`)?.value ||
    root.querySelector("[data-review-comments]")?.value ||
    ""
  ).trim();
}

function parseLineArray(value) {
  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getBrandProfilePayload() {
  const container = root.querySelector('[data-settings-panel="brand"]');
  if (!container) {
    return null;
  }

  const glossaryLines = parseLineArray(
    container.querySelector('[data-brand-field="glossary_terms"]')?.value || ""
  );

  return {
    brand_name: container.querySelector('[data-brand-field="brand_name"]')?.value?.trim() || "",
    one_liner: container.querySelector('[data-brand-field="one_liner"]')?.value?.trim() || "",
    core_value_props: parseLineArray(
      container.querySelector('[data-brand-field="core_value_props"]')?.value || ""
    ),
    forbidden_terms: parseLineArray(
      container.querySelector('[data-brand-field="forbidden_terms"]')?.value || ""
    ),
    glossary_terms: glossaryLines
      .map((line) => {
        const [term, ...rest] = line.split(/[:：]/);
        return {
          term: (term || "").trim(),
          description: rest.join("：").trim()
        };
      })
      .filter((item) => item.term && item.description)
  };
}

function getModelConfigPayload() {
  const container = root.querySelector('[data-settings-panel="model"]');
  if (!container) return null;
  return {
    provider: container.querySelector('[data-model-field="provider"]')?.value?.trim() || "",
    provider_type: container.querySelector('[data-model-field="provider_type"]')?.value?.trim() || "",
    model_name: container.querySelector('[data-model-field="model_name"]')?.value?.trim() || "",
    purpose: container.querySelector('[data-model-field="purpose"]')?.value?.trim() || "",
    endpoint: container.querySelector('[data-model-field="endpoint"]')?.value?.trim() || "",
    api_key: container.querySelector('[data-model-field="api_key"]')?.value?.trim() || "",
    temperature: Number(container.querySelector('[data-model-field="temperature"]')?.value || 0.7),
    max_tokens: Number(container.querySelector('[data-model-field="max_tokens"]')?.value || 4096),
    timeout_ms: Number(container.querySelector('[data-model-field="timeout_ms"]')?.value || 20000),
    notes: container.querySelector('[data-model-field="notes"]')?.value?.trim() || "",
    status: container.querySelector('[data-model-field="status"]')?.value || "active",
    is_default: (container.querySelector('[data-model-field="is_default"]')?.value || "false") === "true"
  };
}

function getMediaSourcePayload() {
  const container = root.querySelector('[data-settings-panel="media-source"]');
  if (!container) return null;
  return {
    source_name: container.querySelector('[data-source-field="source_name"]')?.value?.trim() || "",
    source_type: container.querySelector('[data-source-field="source_type"]')?.value || "industry_self_media",
    platform: container.querySelector('[data-source-field="platform"]')?.value || "wechat_official",
    authority_tier: container.querySelector('[data-source-field="authority_tier"]')?.value || "kol",
    extraction_mode: container.querySelector('[data-source-field="extraction_mode"]')?.value || "headline_cluster",
    update_frequency: container.querySelector('[data-source-field="update_frequency"]')?.value || "daily",
    relevance_score: Number(container.querySelector('[data-source-field="relevance_score"]')?.value || 80),
    status: container.querySelector('[data-source-field="status"]')?.value || "active",
    sample_topics: parseLineArray(
      container.querySelector('[data-source-field="sample_topics"]')?.value || ""
    )
  };
}

function getChannelConfigPayload() {
  const container = root.querySelector('[data-settings-panel="channel"]');
  if (!container) return null;
  return {
    channel_name: container.querySelector('[data-channel-field="channel_name"]')?.value?.trim() || "",
    account_name: container.querySelector('[data-channel-field="account_name"]')?.value?.trim() || "",
    default_author: container.querySelector('[data-channel-field="default_author"]')?.value?.trim() || "",
    default_category: container.querySelector('[data-channel-field="default_category"]')?.value?.trim() || "",
    auth_status: container.querySelector('[data-channel-field="auth_status"]')?.value || "pending"
  };
}

function getAutomationProviderPayload() {
  const container = root.querySelector('[data-settings-panel="provider"]');
  if (!container) return null;
  return {
    is_active:
      (container.querySelector('[data-provider-field="is_active"]')?.value || "false") === "true",
    enabled:
      (container.querySelector('[data-provider-field="enabled"]')?.value || "true") === "true",
    endpoint: container.querySelector('[data-provider-field="endpoint"]')?.value?.trim() || "",
    model_name: container.querySelector('[data-provider-field="model_name"]')?.value?.trim() || "",
    api_key: container.querySelector('[data-provider-field="api_key"]')?.value?.trim() || "",
    timeout_ms: Number(container.querySelector('[data-provider-field="timeout_ms"]')?.value || 1000),
    retry_count: Number(container.querySelector('[data-provider-field="retry_count"]')?.value || 0),
    notes: container.querySelector('[data-provider-field="notes"]')?.value?.trim() || ""
  };
}

function getAutomationConnectorPayload() {
  const container = root.querySelector('[data-settings-panel="connector"]');
  if (!container) return null;
  return {
    is_enabled:
      (container.querySelector('[data-connector-field="is_enabled"]')?.value || "false") === "true",
    status: container.querySelector('[data-connector-field="status"]')?.value || "ready",
    endpoint: container.querySelector('[data-connector-field="endpoint"]')?.value?.trim() || "",
    api_key: container.querySelector('[data-connector-field="api_key"]')?.value?.trim() || "",
    timeout_ms: Number(container.querySelector('[data-connector-field="timeout_ms"]')?.value || 10000),
    retry_count: Number(container.querySelector('[data-connector-field="retry_count"]')?.value || 0),
    notes: container.querySelector('[data-connector-field="notes"]')?.value?.trim() || ""
  };
}

function getSourceStrategyPayload() {
  const container = root.querySelector('[data-settings-panel="strategy"]');
  if (!container) return null;
  return {
    name: container.querySelector('[data-strategy-field="name"]')?.value?.trim() || "",
    schedule_mode: container.querySelector('[data-strategy-field="schedule_mode"]')?.value || "manual",
    cron_expression:
      container.querySelector('[data-strategy-field="cron_expression"]')?.value?.trim() || "",
    is_enabled:
      (container.querySelector('[data-strategy-field="is_enabled"]')?.value || "true") === "true",
    auto_generate_articles:
      (container.querySelector('[data-strategy-field="auto_generate_articles"]')?.value || "true") ===
      "true",
    auto_submit_review:
      (container.querySelector('[data-strategy-field="auto_submit_review"]')?.value || "true") ===
      "true",
    review_policy:
      container.querySelector('[data-strategy-field="review_policy"]')?.value || "manual_first",
    auto_create_publish_task:
      (container.querySelector('[data-strategy-field="auto_create_publish_task"]')?.value || "false") ===
      "true",
    publish_mode: container.querySelector('[data-strategy-field="publish_mode"]')?.value || "scheduled",
    default_channel_id:
      container.querySelector('[data-strategy-field="default_channel_id"]')?.value || "ch-1",
    min_word_count: Number(
      container.querySelector('[data-strategy-field="min_word_count"]')?.value || 800
    ),
    required_terms_count: Number(
      container.querySelector('[data-strategy-field="required_terms_count"]')?.value || 2
    ),
    block_on_forbidden_terms:
      (container.querySelector('[data-strategy-field="block_on_forbidden_terms"]')?.value || "true") ===
      "true",
    allow_authority_direct_publish:
      (container.querySelector('[data-strategy-field="allow_authority_direct_publish"]')?.value ||
        "false") === "true"
  };
}

function normalizeDateTimeLocal(value) {
  if (!value) return "";
  return value.includes(":") && value.length === 16 ? `${value}:00+08:00` : value;
}

async function refreshData(options = {}) {
  const { loading = false } = options;
  try {
    if (loading) {
      setLoading(true);
      setError("");
      rerender();
    }
    const data = await bootstrapData();
    const existingDetails = store.data.articleDetails || {};
    hydrateData(data);
    store.data.articleDetails = existingDetails;
  } catch (error) {
    setError(error instanceof Error ? error.message : "Unknown error");
  } finally {
    setLoading(false);
    rerender();
  }
}

const actions = {
  async submitKeywordPanel() {
    if (store.ui.panel === "expand") {
      await actions.expandQuestions(store.forms.keywordExpansion);
      return;
    }
    if (store.ui.panel === "job") {
      await actions.createQuestionJob(store.forms.keywordJob);
    }
  },
  async expandQuestions(formOverride) {
    try {
      const form = formOverride || store.forms.keywordExpansion;
      const focusedKeyword =
        form.industry_topic ||
        store.data.keywords.find((item) => item.id === store.selectedIds.keyword)?.keyword ||
        "中国智能体平台";
      const result = await createKeywordCrawlJob({
        name: form.name || `${focusedKeyword} 问题裂变`,
        source_type: form.source_type || "suggestion",
        industry_topic: focusedKeyword,
        seed_keywords: String(form.seed_keywords || focusedKeyword)
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean),
        fetch_limit: form.fetch_limit || 12,
        dedupe_enabled: form.dedupe_enabled !== false
      });
      store.page = "keywords";
      store.tabs.keywords = "keywords";
      store.selectedIds.keyword = result.items?.[0]?.id || store.selectedIds.keyword;
      store.ui.panel = "";
      await refreshData();
      showNotice(`已裂变 ${result.new_items_count || 0} 个自然语言问题。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "裂变问题失败");
      rerender();
    }
  },
  async createQuestionJob(formOverride) {
    try {
      const form = formOverride || store.forms.keywordJob;
      const result = await createKeywordCrawlJob({
        name: form.name || "中国智能体 问题抓取任务",
        source_type: form.source_type || "mixed_media",
        source_scope: form.source_scope || form.source_type || "mixed_media",
        monitoring_goal: form.monitoring_goal || "full_funnel",
        industry_topic: form.industry_topic || "中国智能体",
        seed_keywords: String(form.seed_keywords || "")
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean),
        source_targets: String(form.source_targets || "")
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean),
        fetch_limit: form.fetch_limit || 20,
        dedupe_enabled: form.dedupe_enabled !== false
      });
      store.page = "keywords";
      store.tabs.keywords = "crawl";
      store.selectedIds.keyword = result.items?.[0]?.id || store.selectedIds.keyword;
      store.ui.panel = "";
      await refreshData();
      showNotice(`问题抓取任务已完成，新增 ${result.new_items_count || 0} 个问题。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "创建问题抓取任务失败");
      rerender();
    }
  },
  async runSourceStrategy(strategyId) {
    if (!strategyId) return;
    try {
      const strategy = store.data.sourceStrategies.find((item) => item.id === strategyId);
      const result = await runSourceStrategyApi(strategyId, {
        industry_topic: store.forms.keywordJob.industry_topic || "中国智能体",
        fetch_limit: 8
      });
      store.page = "keywords";
      store.tabs.keywords = "crawl";
      store.selectedIds.strategy = strategyId;
      store.selectedIds.automationRun = result.run?.id || store.selectedIds.automationRun;
      store.selectedIds.keyword =
        result.generated_questions?.[0]?.id || result.run?.generated_keyword_ids?.[0] || store.selectedIds.keyword;
      await refreshData();
      showNotice(
        `${strategy?.name || "自动运营策略"}已运行：新增 ${result.run?.generated_question_count || 0} 个问题，生成 ${result.run?.generated_article_count || 0} 篇草稿。`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "运行自动运营策略失败");
      rerender();
    }
  },
  async retryAutomationRun(runId) {
    if (!runId) return;
    try {
      const result = await retryAutomationRunApi(runId);
      await refreshData();
      store.page = "keywords";
      store.tabs.keywords = "crawl";
      store.selectedIds.automationRun = result.run?.id || runId;
      store.selectedIds.strategy = result.run?.strategy_id || store.selectedIds.strategy;
      store.selectedIds.keyword =
        result.generated_questions?.[0]?.id || store.selectedIds.keyword;
      showNotice(`已重试自动运营执行，新增 ${result.run?.generated_article_count || 0} 篇草稿。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "重试自动运营执行失败");
      rerender();
    }
  },
  async generateTopic(keywordId) {
    if (!keywordId) return;
    try {
      const result = await createTopicsFromKeywords([keywordId], "decision");
      store.selectedIds.topic = result.items?.[0]?.id || null;
      store.page = "content";
      store.tabs.content = "topics";
      await refreshData();
      showNotice("已根据关键词生成选题。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成选题失败");
      rerender();
    }
  },
  async generateTopicsBatch(keywordIds = getSelectedOpportunityKeywordIds(store)) {
    if (!keywordIds.length) {
      setError("当前筛选下没有可批量生成的机会池问题");
      rerender();
      return;
    }

    try {
      const result = await createTopicsFromKeywords(keywordIds, "decision");
      store.selectedIds.topic = result.items?.[0]?.id || store.selectedIds.topic;
      store.page = "content";
      store.tabs.content = "topics";
      await refreshData();
      showNotice(`已批量生成 ${result.items?.length || 0} 个选题。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "批量生成选题失败");
      rerender();
    }
  },
  async createManualTopic() {
    try {
      const keyword = store.data.keywords.find((item) => item.id === store.selectedIds.keyword);
      const topic = await createManualTopicApi({
        title: keyword?.suggested_titles?.[0] || `${store.data.workspaceInput?.product_name || "GEO"} 单用户选题`,
        keyword: keyword?.keyword || store.data.workspaceInput?.product_name || "GEO",
        keyword_id: keyword?.id || "",
        template_type: keyword?.intent === "decision" ? "decision" : "how_to",
        core_messages: store.data.brandProfile?.core_value_props || [],
        required_terms: ["llms.txt", "JSON-LD", "Direct Answer"]
      });
      store.selectedIds.topic = topic.id;
      store.page = "content";
      store.tabs.content = "topics";
      await refreshData();
      showNotice("已新建单用户选题。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "新建选题失败");
      rerender();
    }
  },
  async editTopic(topicId) {
    if (!topicId) return;
    try {
      const current = store.data.topics.find((item) => item.id === topicId);
      const topic = await updateTopicApi(topicId, {
        title: current?.title?.includes("单用户优化")
          ? current.title
          : `${current?.title || "GEO 选题"}（单用户优化）`,
        priority: Math.max(1, Number(current?.priority || 2) - 1)
      });
      store.selectedIds.topic = topic.id;
      await refreshData();
      showNotice("选题已完成本地编辑。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "编辑选题失败");
      rerender();
    }
  },
  async generateOutline(topicId) {
    if (!topicId) return;
    try {
      const topic = await generateTopicOutlineApi(topicId);
      store.selectedIds.topic = topic.id;
      await refreshData();
      showNotice("已生成文章大纲。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成大纲失败");
      rerender();
    }
  },
  async generateArticle(topicId) {
    if (!topicId) return;
    try {
      const article = await createArticleFromTopic(topicId);
      store.selectedIds.article = article.id;
      store.selectedIds.topic = topicId;
      store.page = "content";
      store.tabs.content = "articles";
      store.data.articleDetails[article.id] = article;
      await refreshData();
      showNotice("已根据选题生成文章草稿。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成草稿失败");
      rerender();
    }
  },
  async createManualArticle() {
    try {
      const topic = store.data.topics.find((item) => item.id === store.selectedIds.topic);
      const article = await createManualArticleApi({
        topic_idea_id: topic?.id || "",
        title: topic?.title || `${store.data.workspaceInput?.product_name || "GEO"} 单用户文章`,
        content_markdown: `Direct answer: ${topic?.title || "Single-user GEO workflow"}.\n\nUse structured facts, direct answers, llms.txt, JSON-LD, and distribution evidence to increase AI-search citation readiness.`,
        target_channel_types: topic?.target_channels || ["website_blog"]
      });
      store.selectedIds.article = article.id;
      store.page = "content";
      store.tabs.content = "articles";
      store.data.articleDetails[article.id] = article;
      await refreshData();
      showNotice("已新建单用户文章草稿。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "新建文章失败");
      rerender();
    }
  },
  async createContentTemplate() {
    try {
      const template = await createContentTemplateApi({
        name: "单用户 Direct Answer 模板",
        template_type: "how_to",
        applicable_categories: ["definition", "comparison", "how_to"],
        structure: ["Direct answer", "Evidence table", "FAQ", "CTA"]
      });
      store.page = "content";
      store.tabs.content = "templates";
      await refreshData();
      showNotice(`已新增模板：${template.name}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "新增模板失败");
      rerender();
    }
  },
  async exportArtifact(exportType = "content_articles") {
    try {
      const job = await createExportJobApi({
        artifact_type: exportType || "content_articles",
        format: "csv"
      });
      if (typeof window !== "undefined" && job?.id) {
        window.open(exportDownloadUrl(job.id), "_blank", "noopener,noreferrer");
      }
      showNotice(`已生成导出文件：${job.file_name || "export.csv"}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "导出失败");
      rerender();
    }
  },
  async assignReview(articleId) {
    if (!articleId) return;
    showNotice("单用户模式下已由当前操作者接收复审任务。");
  },
  async openPublishPanel(articleId) {
    const nextState = resolvePublishPanelState({
      articles: store.data.articles,
      channels: store.data.channels,
      articleId,
      currentArticleId: store.selectedIds.article,
      currentForm: store.forms.publishTask
    });

    if (nextState.blocked) {
      store.ui.panel = "";
      store.page = nextState.redirectPage || "content";
      if (nextState.redirectTab) {
        store.tabs.content = nextState.redirectTab;
      }
      if (nextState.selectedArticleId) {
        store.selectedIds.article = nextState.selectedArticleId;
      }
      if (nextState.selectedReviewId) {
        store.selectedIds.review = nextState.selectedReviewId;
      }
      rerender();
      showNotice(nextState.reason);
      return;
    }

    store.forms.publishTask = nextState.form;
    store.page = "distribution";
    store.tabs.distribution = "tasks";
    store.ui.panel = "publish";
    rerender();
  },
  togglePublishArticle(articleId) {
    if (!articleId) return;
    const selectedIds = new Set(store.forms.publishTask.article_ids || []);
    if (selectedIds.has(articleId)) {
      selectedIds.delete(articleId);
    } else {
      selectedIds.add(articleId);
    }
    store.forms.publishTask.article_ids = [...selectedIds];
    rerender();
  },
  async updateKeyword(keywordId, action) {
    if (!keywordId || !action) return;
    try {
      const result = await updateKeyword(keywordId, action);
      store.selectedIds.keyword = result.id;
      await refreshData();
      const notices = {
        select: "问题已加入机会池。",
        watchlist: "问题已移到观察列表。",
        ignore: "问题已标记为忽略。",
        rescore: "问题已重新打分。"
      };
      showNotice(notices[action] || "问题状态已更新。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "更新问题状态失败");
      rerender();
    }
  },
  async reviewArticle(articleId, action) {
    if (!articleId || !action) return;
    try {
      const reviewPayload = buildReviewPayload(action, getReviewComments(articleId));
      const detail = await reviewArticle(
        articleId,
        action,
        reviewPayload.comments,
        reviewPayload.reasonCodes
      );
      store.data.articleDetails[articleId] = detail;
      store.selectedIds.review = null;
      await refreshData();
      if (action === "pass") {
        store.selectedIds.article = articleId;
        await actions.openPublishPanel(articleId);
        showNotice("文章已审核通过，可直接创建发布任务。");
        return;
      }
      showNotice("文章已驳回并回到草稿状态。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "审核操作失败");
      rerender();
    }
  },
  async startTask(taskId) {
    if (!taskId) return;
    try {
      await startPublishTask(taskId);
      await refreshData();
      showNotice("发布任务已启动并更新结果。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "启动任务失败");
      rerender();
    }
  },
  async retryTask(taskId) {
    if (!taskId) return;
    try {
      await retryPublishTask(taskId);
      await refreshData();
      showNotice("失败项已重试。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "重试失败项失败");
      rerender();
    }
  },
  async approveTask(taskId, approvalAction = "approve") {
    if (!taskId) return;
    try {
      await approvePublishTaskApi(taskId, {
        action: approvalAction,
        note: approvalAction === "reject" ? "运营侧退回发布审批。" : "运营侧审批通过。"
      });
      await refreshData();
      showNotice(approvalAction === "reject" ? "发布任务已退回。" : "发布任务已审批通过。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "处理发布审批失败");
      rerender();
    }
  },
  async cancelTask(taskId) {
    if (!taskId) return;
    try {
      await cancelPublishTask(taskId);
      await refreshData();
      showNotice("发布任务已取消。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "取消任务失败");
      rerender();
    }
  },
  async takeoverTaskItem(taskId, itemId, mode) {
    if (!taskId || !itemId || !mode) return;
    try {
      await takeoverPublishTaskItemApi(taskId, itemId, {
        mode
      });
      await refreshData();
      showNotice(mode === "requeue" ? "失败项已恢复排队。" : "失败项已人工接管并标记为已发布。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "处理失败项失败");
      rerender();
    }
  },
  async createPublishTask() {
    try {
      const form = store.forms.publishTask;
      if (!form.article_ids?.length) {
        setError("请至少选择一篇待发布文章");
        rerender();
        return;
      }
      const task = await createPublishTaskApi({
        name: form.name,
        channel_id: form.channel_id,
        publish_mode: form.publish_mode,
        scheduled_at: normalizeDateTimeLocal(form.scheduled_at),
        require_confirmation: true,
        auto_retry_failed: form.auto_retry_failed === true,
        article_ids: form.article_ids
      });
      store.selectedIds.task = task.id;
      store.page = "distribution";
      store.tabs.distribution = "tasks";
      store.ui.panel = "";
      await refreshData();
      showNotice("发布任务已创建并进入排队。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "创建发布任务失败");
      rerender();
    }
  },
  async loadArticleDetail(articleId) {
    if (!articleId) return;
    try {
      const detail = await getArticleDetail(articleId);
      store.selectedIds.article = articleId;
      store.data.articleDetails[articleId] = detail;
      rerender();
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载文章详情失败");
      rerender();
    }
  },
  async saveArticle(articleId) {
    const payload = getSelectedArticlePayload(articleId);
    if (!articleId || !payload) return;
    try {
      const detail = await updateArticle(articleId, payload);
      store.data.articleDetails[articleId] = detail;
      await refreshData();
      showNotice("文章已保存并生成新版本。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存文章失败");
      rerender();
    }
  },
  async submitReview(articleId) {
    if (!articleId) return;
    try {
      const detail = await submitArticleReview(articleId);
      store.data.articleDetails[articleId] = detail;
      await refreshData();
      store.selectedIds.review = articleId;
      store.tabs.content = "reviews";
      showNotice("文章已提交审核。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "提交审核失败");
      rerender();
    }
  },
  async saveBrandProfile() {
    const payload = getBrandProfilePayload();
    if (!payload) return;
    try {
      const result = await saveBrandProfile(payload);
      store.data.brandProfile = result;
      rerender();
      showNotice("品牌知识配置已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存品牌知识失败");
      rerender();
    }
  },
  async saveModelConfig() {
    const modelId = store.selectedIds.model;
    const payload = getModelConfigPayload();
    if (!modelId || !payload) return;
    try {
      await saveModelConfigApi(modelId, payload);
      await refreshData();
      showNotice("模型接入已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存模型配置失败");
      rerender();
    }
  },
  async createModelConfig() {
    try {
      const created = await createModelConfigApi({});
      store.selectedIds.model = created.id;
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "models";
      showNotice("已新增模型接入。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "新增模型配置失败");
      rerender();
    }
  },
  async saveMediaSource() {
    const sourceId = store.selectedIds.mediaSource;
    const payload = getMediaSourcePayload();
    if (!sourceId || !payload) return;
    try {
      await saveMediaSourceApi(sourceId, payload);
      await refreshData();
      store.page = "keywords";
      store.tabs.keywords = "crawl";
      showNotice("内容源配置已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存内容源失败");
      rerender();
    }
  },
  async createMediaSource() {
    try {
      const created = await createMediaSourceApi({});
      store.selectedIds.mediaSource = created.id;
      await refreshData();
      store.page = "keywords";
      store.tabs.keywords = "crawl";
      showNotice("已新增内容源。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "新增内容源失败");
      rerender();
    }
  },
  async saveChannelConfig() {
    const channelId = store.selectedIds.channel;
    const payload = getChannelConfigPayload();
    if (!channelId || !payload) return;
    try {
      await saveChannelApi(channelId, payload);
      await refreshData();
      showNotice("渠道配置已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存渠道配置失败");
      rerender();
    }
  },
  async saveAutomationProvider() {
    const providerId = store.selectedIds.provider;
    const payload = getAutomationProviderPayload();
    if (!providerId || !payload) return;
    try {
      const saved = await saveAutomationProviderApi(providerId, payload);
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "providers";
      store.selectedIds.provider = saved.id;
      showNotice("能力服务配置已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存能力适配器失败");
      rerender();
    }
  },
  async testAutomationProvider() {
    const providerId = store.selectedIds.provider;
    const payload = getAutomationProviderPayload();
    if (!providerId || !payload) return;
    try {
      await saveAutomationProviderApi(providerId, payload);
      const result = await testAutomationProviderApi(providerId);
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "providers";
      store.selectedIds.provider = providerId;
      showNotice(
        result.success
          ? `连接测试成功，耗时 ${result.duration_ms || 0} ms。`
          : `连接测试失败：${result.error_message || "未知错误"}`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "连接测试失败");
      rerender();
    }
  },
  async saveAutomationConnector() {
    const connectorId = store.selectedIds.connector;
    const payload = getAutomationConnectorPayload();
    if (!connectorId || !payload) return;
    try {
      const saved = await saveAutomationConnectorApi(connectorId, payload);
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "providers";
      store.selectedIds.connector = saved.id;
      showNotice("连接器配置已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存连接器配置失败");
      rerender();
    }
  },
  async testAutomationConnector() {
    const connectorId = store.selectedIds.connector;
    const payload = getAutomationConnectorPayload();
    if (!connectorId || !payload) return;
    try {
      await saveAutomationConnectorApi(connectorId, payload);
      const result = await testAutomationConnectorApi(connectorId);
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "providers";
      store.selectedIds.connector = connectorId;
      showNotice(
        result.success
          ? `连接器测试成功，耗时 ${result.duration_ms || 0} ms。`
          : `连接器测试失败：${result.error_message || "未知错误"}`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "连接器测试失败");
      rerender();
    }
  },
  async createChannel() {
    try {
      const created = await createChannelApi({});
      store.selectedIds.channel = created.id;
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "channels";
      showNotice("已新增渠道配置。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "新增渠道失败");
      rerender();
    }
  },
  async reconnectChannel(channelId) {
    if (!channelId) return;
    try {
      await reconnectChannelApi(channelId);
      await refreshData();
      store.selectedIds.channel = channelId;
      showNotice("渠道已重新认证并恢复连接。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "重新认证失败");
      rerender();
    }
  },
  async saveSourceStrategy() {
    const strategyId = store.selectedIds.strategy;
    const payload = getSourceStrategyPayload();
    if (!strategyId || !payload) return;
    try {
      const saved = await saveSourceStrategyApi(strategyId, payload);
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "automation";
      store.selectedIds.strategy = saved.id;
      showNotice("自动运营策略已保存。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存自动运营策略失败");
      rerender();
    }
  },
  async resetRuntimeState() {
    try {
      await resetRuntimeStateApi();
      store.data.articleDetails = {};
      store.selectedIds = {
        ...store.selectedIds,
        keyword: null,
        topic: null,
        article: null,
        review: null,
        task: null,
        model: null,
        channel: null,
        mediaSource: null,
        provider: null,
        strategy: null,
        automationRun: null
      };
      await refreshData();
      store.page = "settings";
      store.tabs.settings = "brand";
      showNotice("运行态已重置为初始种子数据。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "重置运行态失败");
      rerender();
    }
  },
  async runSchedulerTick(force = false) {
    try {
      const result = await runSchedulerTickApi(force);
      await refreshData();
      const executedCount = result.executed_runs?.length || 0;
      showNotice(
        executedCount
          ? `调度器已触发，本轮执行 ${executedCount} 条到期策略。`
          : "调度器已轮询，当前没有到期策略。"
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "执行调度轮询失败");
      rerender();
    }
  },
  async runVisibilityCollection() {
    try {
      const result = await runVisibilityCollectionApi({
        trigger: "manual"
      });
      await refreshData();
      store.page = "analytics";
      store.tabs.analytics = "visibility";
      showNotice(`外部可见度采集已完成，新增 ${result.snapshots_created || 0} 条快照。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "外部可见度采集失败");
      rerender();
    }
  },
  async runMarketingCampaign(campaignId) {
    const targetCampaignId = campaignId || store.data.marketingCampaigns?.[0]?.id;
    if (!targetCampaignId) return;
    try {
      const result = await runMarketingCampaignApi(targetCampaignId, {
        trigger: "manual"
      });
      await refreshData();
      store.page = "analytics";
      store.tabs.analytics = "campaigns";
      showNotice(`自有活动已运行，发送 ${result.metrics?.sent_count || 0} 人。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "运行自有活动失败");
      rerender();
    }
  },
  async runInternationalAudit() {
    try {
      const result = await runInternationalGeoAuditApi();
      store.data.internationalGeo = result;
      store.page = "international";
      rerender();
      showNotice(`国际 GEO 审计完成，AI-ready score ${result.summary?.ai_ready_score || "-"}。`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "国际 GEO 审计失败");
      rerender();
    }
  },
  async generateInternationalArtifacts() {
    try {
      await saveInternationalGeoInputApi({
        website_url: store.data.workspaceInput?.website_url || store.data.internationalGeo?.input?.website_url,
        product_name: store.data.workspaceInput?.product_name || store.data.internationalGeo?.input?.product_name
      });
      const artifacts = await generateInternationalGeoArtifactsApi();
      await refreshData();
      store.page = "international";
      showNotice(`已生成 llms.txt 和 JSON-LD：${artifacts.llms_txt ? "完成" : "待检查"}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "生成国际 GEO 资产失败");
      rerender();
    }
  },
  async upgradePlan(planId = "single_user_pro") {
    try {
      await updateBillingPlanApi({
        plan_id: planId,
        billing_cycle: "monthly"
      });
      await refreshData();
      store.page = "billing";
      showNotice("单用户本地套餐已更新，无需真实支付。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "更新套餐失败");
      rerender();
    }
  },
  async logoutSession() {
    try {
      await logoutSessionApi({ reason: "single_user_ui" });
      store.search = "";
      store.ui.panel = "";
      store.page = "dashboard";
      rerender();
      showNotice("已退出当前单用户操作视图。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "退出失败");
      rerender();
    }
  }
};

applyHashState();
bindEvents(root, store, rerender, actions);
window.addEventListener("hashchange", () => {
  applyHashState();
  rerender();
});
rerender();
refreshData({ loading: true });
