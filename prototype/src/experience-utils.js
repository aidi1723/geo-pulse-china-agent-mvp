export function buildReviewPayload(action, comments = "") {
  const normalizedComments = String(comments || "").trim();

  if (action === "pass") {
    return {
      comments: normalizedComments || "结构完整，可进入待发布。",
      reasonCodes: []
    };
  }

  return {
    comments: normalizedComments || "需要补强品牌表达和边界说明。",
    reasonCodes: ["brand_expression"]
  };
}

const panelOwnerMap = {
  expand: "keywords",
  job: "keywords",
  publish: "distribution"
};

export function getActiveSearchValue(store) {
  if (store.page === "keywords") {
    return store.filters?.keywords?.query || "";
  }
  if (store.page === "content") {
    return store.filters?.content?.query || "";
  }
  if (store.page === "distribution") {
    return store.filters?.distribution?.query || "";
  }
  return store.search || "";
}

export function applyPageSearch(store, query) {
  const nextQuery = String(query || "");
  store.search = nextQuery;

  if (store.page === "keywords") {
    store.filters.keywords.query = nextQuery;
    return true;
  }
  if (store.page === "content") {
    store.filters.content.query = nextQuery;
    return true;
  }
  if (store.page === "distribution") {
    store.filters.distribution.query = nextQuery;
    return true;
  }

  return false;
}

export function closePanelForPageChange(store, nextPage) {
  const currentPanel = store.ui?.panel || "";
  if (!currentPanel) {
    return false;
  }

  if (panelOwnerMap[currentPanel] && panelOwnerMap[currentPanel] !== nextPage) {
    store.ui.panel = "";
    return true;
  }

  return false;
}

function pickExistingId(items = [], selectedId, options = {}) {
  const { fallbackToNull = false } = options;
  if (!items.length) {
    return fallbackToNull ? null : selectedId || null;
  }

  return items.some((item) => item.id === selectedId) ? selectedId : items[0]?.id || null;
}

function matchesContentQuery(haystacks, query) {
  if (!query) {
    return true;
  }

  return haystacks.some((item) => String(item || "").toLowerCase().includes(query));
}

function questionFormLabel(keyword) {
  if ((keyword.keyword || "").includes("怎么") || (keyword.keyword || "").includes("如何")) return "how";
  if ((keyword.keyword || "").includes("区别") || (keyword.keyword || "").includes("对比")) return "vs";
  if ((keyword.keyword || "").includes("哪") || (keyword.keyword || "").includes("怎么选")) return "which";
  if ((keyword.keyword || "").includes("什么")) return "what";
  return "query";
}

function clusterLabel(keyword) {
  if (keyword.intent === "decision") return "购买决策";
  if (keyword.category === "comparison") return "对比选择";
  if (keyword.category === "deployment") return "部署与风险";
  if (keyword.category === "scenario") return "行业场景";
  return "技术解释";
}

function matchesForm(keyword, form) {
  if (form === "all") {
    return true;
  }

  return questionFormLabel(keyword) === form;
}

function matchesCluster(keyword, cluster) {
  if (cluster === "all") {
    return true;
  }

  return clusterLabel(keyword) === cluster;
}

function getVisibleKeywords(store) {
  const query = (store.filters?.keywords?.query || "").trim().toLowerCase();
  const form = store.filters?.keywords?.form || "all";
  const cluster = store.filters?.keywords?.cluster || "all";

  return (store.data?.keywords || []).filter((item) => {
    const queryMatched =
      !query ||
      item.keyword.toLowerCase().includes(query) ||
      (item.suggested_titles || []).some((title) => title.toLowerCase().includes(query));

    return queryMatched && matchesForm(item, form) && matchesCluster(item, cluster);
  });
}

function getVisibleTopics(store) {
  const query = (store.filters?.content?.query || "").trim().toLowerCase();
  const status = store.filters?.content?.status || "all";

  return (store.data?.topics || []).filter((item) => {
    const keyword =
      store.data?.keywords?.find((candidate) => candidate.id === item.keyword_id)?.keyword || item.keyword_id;

    return (
      matchesContentQuery(
        [
          item.title,
          keyword,
          item.content_type_label || item.content_type,
          item.template_type_label || item.template_type
        ],
        query
      ) && (status === "all" || item.status === status)
    );
  });
}

function getVisibleArticles(store) {
  const query = (store.filters?.content?.query || "").trim().toLowerCase();
  const status = store.filters?.content?.status || "all";

  return (store.data?.articles || []).filter((item) => {
    const keyword =
      store.data?.keywords?.find((candidate) => candidate.id === item.keyword_id)?.keyword || "";

    const statusMatched =
      status === "all" || item.review_status === status || item.publish_status === status;

    return (
      matchesContentQuery(
        [
          item.title,
          item.subtitle,
          keyword,
          item.article_type_label || item.article_type,
          item.review_status_label || item.review_status,
          item.publish_status_label || item.publish_status
        ],
        query
      ) && statusMatched
    );
  });
}

function getVisibleReviews(store) {
  const query = (store.filters?.content?.query || "").trim().toLowerCase();
  const status = store.filters?.content?.status || "all";
  const requiredStatus = status === "all" ? "review_pending" : status;

  return (store.data?.articles || []).filter((item) => {
    if (item.review_status !== requiredStatus) {
      return false;
    }

    const keyword =
      store.data?.keywords?.find((candidate) => candidate.id === item.keyword_id)?.keyword || "";

    return matchesContentQuery(
      [
        item.title,
        item.excerpt,
        item.article_type_label || item.article_type,
        keyword
      ],
      query
    );
  });
}

function getVisibleTasks(store) {
  const query = (store.filters?.distribution?.query || "").trim().toLowerCase();
  const status = store.filters?.distribution?.status || "all";

  return (store.data?.publishTasks || []).filter((item) => {
    const channelName =
      store.data?.channels?.find((channel) => channel.id === item.channel_id)?.channel_name || "";
    const queryMatched =
      !query ||
      item.name.toLowerCase().includes(query) ||
      channelName.toLowerCase().includes(query);

    return queryMatched && (status === "all" || item.status === status);
  });
}

export function normalizeStoreSelections(store) {
  if (!store?.data) {
    return false;
  }

  let changed = false;
  const setIfChanged = (key, value) => {
    if (store.selectedIds[key] !== value) {
      store.selectedIds[key] = value;
      changed = true;
    }
  };

  if ((store.data.keywords || []).length) {
    setIfChanged("keyword", pickExistingId(store.data.keywords, store.selectedIds.keyword));
  }
  if ((store.data.topics || []).length) {
    setIfChanged("topic", pickExistingId(store.data.topics, store.selectedIds.topic));
  }
  if ((store.data.articles || []).length) {
    setIfChanged("article", pickExistingId(store.data.articles, store.selectedIds.article));
  }
  if ((store.data.publishTasks || []).length) {
    setIfChanged("task", pickExistingId(store.data.publishTasks, store.selectedIds.task));
  }
  if ((store.data.modelConfigs || []).length) {
    setIfChanged("model", pickExistingId(store.data.modelConfigs, store.selectedIds.model));
  }
  if ((store.data.channels || []).length) {
    setIfChanged("channel", pickExistingId(store.data.channels, store.selectedIds.channel));
  }
  if ((store.data.mediaSources || []).length) {
    setIfChanged("mediaSource", pickExistingId(store.data.mediaSources, store.selectedIds.mediaSource));
  }
  if ((store.data.automationProviders || []).length) {
    setIfChanged("provider", pickExistingId(store.data.automationProviders, store.selectedIds.provider));
  }
  if ((store.data.sourceStrategies || []).length) {
    setIfChanged("strategy", pickExistingId(store.data.sourceStrategies, store.selectedIds.strategy));
  }
  if ((store.data.automationRuns || []).length) {
    setIfChanged("automationRun", pickExistingId(store.data.automationRuns, store.selectedIds.automationRun));
  }

  const pendingReviews = (store.data.articles || []).filter((item) => item.review_status === "review_pending");
  if (pendingReviews.length) {
    setIfChanged("review", pickExistingId(pendingReviews, store.selectedIds.review));
  } else if ((store.data.articles || []).length) {
    setIfChanged("review", pickExistingId(store.data.articles, store.selectedIds.review));
  }

  if (store.page === "keywords" && ["keywords", "opportunities", "map"].includes(store.tabs?.keywords)) {
    const visibleKeywords = getVisibleKeywords(store);
    setIfChanged("keyword", pickExistingId(visibleKeywords, store.selectedIds.keyword, { fallbackToNull: true }));
  }

  if (store.page === "content") {
    if (store.tabs?.content === "topics") {
      const visibleTopics = getVisibleTopics(store);
      setIfChanged("topic", pickExistingId(visibleTopics, store.selectedIds.topic, { fallbackToNull: true }));
    }

    if (store.tabs?.content === "articles") {
      const visibleArticles = getVisibleArticles(store);
      setIfChanged(
        "article",
        pickExistingId(visibleArticles, store.selectedIds.article, { fallbackToNull: true })
      );
    }

    if (store.tabs?.content === "reviews") {
      const visibleReviews = getVisibleReviews(store);
      const nextReviewId = pickExistingId(visibleReviews, store.selectedIds.review, {
        fallbackToNull: true
      });
      setIfChanged("review", nextReviewId);
      if (nextReviewId) {
        setIfChanged("article", nextReviewId);
      }
    }
  }

  if (store.page === "distribution" && store.tabs?.distribution === "tasks") {
    const visibleTasks = getVisibleTasks(store);
    setIfChanged("task", pickExistingId(visibleTasks, store.selectedIds.task, { fallbackToNull: true }));
  }

  if (
    store.page === "settings" &&
    store.tabs?.settings === "automation" &&
    store.selectedIds.automationRun &&
    (store.data.automationRuns || []).length
  ) {
    const selectedRun = store.data.automationRuns.find((item) => item.id === store.selectedIds.automationRun);
    if (selectedRun?.strategy_id) {
      setIfChanged("strategy", selectedRun.strategy_id);
    }
  }

  return changed;
}

export function getSelectedOpportunityKeywordIds(store) {
  return getVisibleKeywords(store)
    .filter((item) => item.status === "selected")
    .map((item) => item.id);
}

export function getPublishTaskActionState(task) {
  const items = task?.items || [];
  const queuedCount = items.filter((item) => item.status === "queued").length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const isFinalStatus = ["published", "canceled"].includes(task?.status);
  const approvalPending = task?.approval_required && task?.approval_status !== "approved";

  return {
    queuedCount,
    failedCount,
    approvalPending,
    canStart: queuedCount > 0 && !isFinalStatus && task?.status !== "running" && !approvalPending,
    canRetry: failedCount > 0 && task?.status !== "canceled",
    canCancel: queuedCount > 0 && !isFinalStatus,
    canApprove: approvalPending && task?.approval_status !== "rejected",
    startReason:
      approvalPending
        ? "发布任务待审批"
        : queuedCount > 0
          ? task?.status === "running"
            ? "任务正在运行中"
            : ""
        : "当前没有排队中的任务项",
    retryReason: failedCount > 0 ? "" : "当前没有失败项可重试",
    cancelReason: queuedCount > 0 ? "" : "当前没有排队中的任务项可取消"
  };
}

export function resolvePublishPanelState({
  articles = [],
  channels = [],
  articleId = null,
  currentArticleId = null,
  currentForm = {}
} = {}) {
  const publishableArticles = articles.filter((item) => item.publish_status === "ready_to_publish");
  const preferredArticleId = articleId || currentArticleId || publishableArticles[0]?.id || null;
  const preferredArticle = articles.find((item) => item.id === preferredArticleId) || null;

  if (articleId && preferredArticle && preferredArticle.publish_status !== "ready_to_publish") {
    const waitingForReview = preferredArticle.review_status === "review_pending";
    return {
      blocked: true,
      reason: waitingForReview
        ? "文章还在审核中，审核通过后才能创建发布任务。"
        : "文章需先审核通过并进入待发布状态，才能创建发布任务。",
      redirectPage: "content",
      redirectTab: waitingForReview ? "reviews" : "articles",
      selectedArticleId: preferredArticle.id,
      selectedReviewId: waitingForReview ? preferredArticle.id : null,
      form: {
        ...currentForm,
        article_ids: []
      }
    };
  }

  if (!publishableArticles.length) {
    return {
      blocked: true,
      reason: "当前没有待发布文章，请先在内容中心完成审核。",
      redirectPage: "content",
      redirectTab: "reviews",
      selectedArticleId: preferredArticleId,
      selectedReviewId: null,
      form: {
        ...currentForm,
        article_ids: []
      }
    };
  }

  const selectedArticle =
    articles.find((item) => item.id === preferredArticleId && item.publish_status === "ready_to_publish") ||
    publishableArticles[0];
  const fallbackChannelType = selectedArticle?.target_channel_types?.[0];
  const fallbackChannel =
    channels.find((item) => item.channel_type === fallbackChannelType) || channels[0] || null;

  return {
    blocked: false,
    selectedArticleId: selectedArticle?.id || null,
    form: {
      ...currentForm,
      name: selectedArticle ? `${selectedArticle.title} 发布任务` : currentForm.name,
      channel_id: fallbackChannel?.id || currentForm.channel_id,
      article_ids: selectedArticle?.id ? [selectedArticle.id] : []
    }
  };
}
