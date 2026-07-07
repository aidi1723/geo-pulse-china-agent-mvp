import {
  applyPageSearch,
  closePanelForPageChange
} from "./experience-utils.js?v=20260418-3";

export function bindEvents(root, store, rerender, actions) {
  root.addEventListener("click", async (event) => {
    const navButton = event.target.closest("[data-nav]");
    if (navButton) {
      closePanelForPageChange(store, navButton.dataset.nav);
      store.page = navButton.dataset.nav;
      if (navButton.dataset.keywordsTab) {
        store.tabs.keywords = navButton.dataset.keywordsTab;
      }
      if (navButton.dataset.contentTab) {
        store.tabs.content = navButton.dataset.contentTab;
      }
      if (navButton.dataset.distributionTab) {
        store.tabs.distribution = navButton.dataset.distributionTab;
      }
      if (navButton.dataset.analyticsTab) {
        store.tabs.analytics = navButton.dataset.analyticsTab;
      }
      if (navButton.dataset.settingsTab) {
        store.tabs.settings = navButton.dataset.settingsTab;
      }
      if (navButton.dataset.keywordId) {
        store.selectedIds.keyword = navButton.dataset.keywordId;
      }
      if (navButton.dataset.topicId) {
        store.selectedIds.topic = navButton.dataset.topicId;
      }
      if (navButton.dataset.articleId) {
        store.selectedIds.article = navButton.dataset.articleId;
      }
      if (navButton.dataset.taskId) {
        store.selectedIds.task = navButton.dataset.taskId;
      }
      if (navButton.dataset.modelId) {
        store.selectedIds.model = navButton.dataset.modelId;
      }
      if (navButton.dataset.channelId) {
        store.selectedIds.channel = navButton.dataset.channelId;
      }
      if (navButton.dataset.providerId) {
        store.selectedIds.provider = navButton.dataset.providerId;
      }
      if (navButton.dataset.strategyId) {
        store.selectedIds.strategy = navButton.dataset.strategyId;
      }
      if (navButton.dataset.runId) {
        store.selectedIds.automationRun = navButton.dataset.runId;
      }
      rerender();
      return;
    }

    const tabButton = event.target.closest("[data-tab-group]");
    if (tabButton) {
      const group = tabButton.dataset.tabGroup;
      const tab = tabButton.dataset.tab;
      const nextPage =
        group === "keywords"
          ? "keywords"
          : group === "content"
            ? "content"
            : group === "distribution"
              ? "distribution"
              : group === "analytics"
                ? "analytics"
                : "settings";
      closePanelForPageChange(store, nextPage);
      store.tabs[group] = tab;
      rerender();
      return;
    }

    const keywordRow = event.target.closest("[data-select-keyword]");
    if (keywordRow) {
      store.selectedIds.keyword = keywordRow.dataset.selectKeyword;
      rerender();
      return;
    }

    const topicRow = event.target.closest("[data-select-topic]");
    if (topicRow) {
      store.selectedIds.topic = topicRow.dataset.selectTopic;
      rerender();
      return;
    }

    const reviewRow = event.target.closest("[data-select-review]");
    if (reviewRow) {
      store.selectedIds.review = reviewRow.dataset.selectReview;
      store.selectedIds.article = reviewRow.dataset.selectReview;
      rerender();
      return;
    }

    const articleButton = event.target.closest("[data-select-article]");
    if (articleButton) {
      store.selectedIds.article = articleButton.dataset.selectArticle;
      await actions.loadArticleDetail(articleButton.dataset.selectArticle);
      return;
    }

    const taskRow = event.target.closest("[data-select-task]");
    if (taskRow) {
      store.selectedIds.task = taskRow.dataset.selectTask;
      rerender();
      return;
    }

    const modelRow = event.target.closest("[data-select-model]");
    if (modelRow) {
      store.selectedIds.model = modelRow.dataset.selectModel;
      rerender();
      return;
    }

    const channelRow = event.target.closest("[data-select-channel]");
    if (channelRow) {
      store.selectedIds.channel = channelRow.dataset.selectChannel;
      rerender();
      return;
    }

    const providerRow = event.target.closest("[data-select-provider]");
    if (providerRow) {
      store.selectedIds.provider = providerRow.dataset.selectProvider;
      rerender();
      return;
    }

    const connectorRow = event.target.closest("[data-select-connector]");
    if (connectorRow) {
      store.selectedIds.connector = connectorRow.dataset.selectConnector;
      rerender();
      return;
    }

    const mediaSourceRow = event.target.closest("[data-select-media-source]");
    if (mediaSourceRow) {
      store.selectedIds.mediaSource = mediaSourceRow.dataset.selectMediaSource;
      rerender();
      return;
    }

    const strategyRow = event.target.closest("[data-select-strategy]");
    if (strategyRow) {
      store.selectedIds.strategy = strategyRow.dataset.selectStrategy;
      rerender();
      return;
    }

    const automationRunRow = event.target.closest("[data-select-automation-run]");
    if (automationRunRow) {
      store.selectedIds.automationRun = automationRunRow.dataset.selectAutomationRun;
      const selectedRun = store.data.automationRuns.find(
        (item) => item.id === automationRunRow.dataset.selectAutomationRun
      );
      if (selectedRun?.strategy_id) {
        store.selectedIds.strategy = selectedRun.strategy_id;
      }
      rerender();
      return;
    }

    if (event.target.closest("[data-open-keyword]")) {
      const trigger = event.target.closest("[data-open-keyword]");
      closePanelForPageChange(store, "keywords");
      store.page = "keywords";
      store.tabs.keywords = "keywords";
      if (trigger?.dataset.openKeyword) {
        store.selectedIds.keyword = trigger.dataset.openKeyword;
      }
      rerender();
      return;
    }

    if (event.target.closest("[data-open-topic]")) {
      closePanelForPageChange(store, "content");
      store.page = "content";
      store.tabs.content = "topics";
      rerender();
      return;
    }

    if (event.target.closest("[data-open-article]")) {
      closePanelForPageChange(store, "content");
      store.page = "content";
      store.tabs.content = "articles";
      if (!store.selectedIds.article) {
        store.selectedIds.article = store.data.articles[0]?.id || null;
      }
      rerender();
      return;
    }

    if (event.target.closest("[data-action='open-publish-panel']")) {
      const trigger = event.target.closest("[data-action='open-publish-panel']");
      await actions.openPublishPanel(trigger?.dataset.articleId || null);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    if (action === "open-expand-panel") {
      store.ui.panel = "expand";
      rerender();
      return;
    }

    if (action === "open-job-panel") {
      store.ui.panel = "job";
      rerender();
      return;
    }

    if (action === "close-panel") {
      store.ui.panel = "";
      rerender();
      return;
    }

    if (action === "submit-panel") {
      await actions.submitKeywordPanel();
      return;
    }

    if (action === "set-keyword-form") {
      store.filters.keywords.form = actionButton.dataset.filterValue || "all";
      rerender();
      return;
    }

    if (action === "set-keyword-cluster") {
      store.filters.keywords.cluster = actionButton.dataset.filterValue || "all";
      rerender();
      return;
    }

    if (action === "reset-keyword-filters") {
      store.filters.keywords.query = "";
      store.filters.keywords.form = "all";
      store.filters.keywords.cluster = "all";
      rerender();
      return;
    }

    if (action === "open-keyword-view") {
      closePanelForPageChange(store, "keywords");
      store.page = "keywords";
      store.tabs.keywords = actionButton.dataset.keywordTab || "keywords";
      rerender();
      return;
    }

    if (action === "set-content-status") {
      store.filters.content.status = actionButton.dataset.filterValue || "all";
      rerender();
      return;
    }

    if (action === "reset-content-filters") {
      store.filters.content.query = "";
      store.filters.content.status = "all";
      rerender();
      return;
    }

    if (action === "open-content-view") {
      closePanelForPageChange(store, "content");
      store.page = "content";
      store.tabs.content = actionButton.dataset.contentTab || "articles";
      store.filters.content.status = actionButton.dataset.contentStatus || "all";
      rerender();
      return;
    }

    if (action === "generate-topic") {
      await actions.generateTopic(actionButton.dataset.keywordId || store.selectedIds.keyword);
      return;
    }

    if (action === "create-manual-topic") {
      await actions.createManualTopic();
      return;
    }

    if (action === "edit-topic") {
      await actions.editTopic(actionButton.dataset.topicId || store.selectedIds.topic);
      return;
    }

    if (action === "generate-outline") {
      await actions.generateOutline(actionButton.dataset.topicId || store.selectedIds.topic);
      return;
    }

    if (action === "generate-article") {
      await actions.generateArticle(actionButton.dataset.topicId || store.selectedIds.topic);
      return;
    }

    if (action === "create-manual-article") {
      await actions.createManualArticle();
      return;
    }

    if (action === "create-content-template") {
      await actions.createContentTemplate();
      return;
    }

    if (action === "export-artifact") {
      await actions.exportArtifact(actionButton.dataset.exportType);
      return;
    }

    if (action === "assign-review") {
      await actions.assignReview(actionButton.dataset.articleId || store.selectedIds.review);
      return;
    }

    if (action === "generate-topics-batch") {
      await actions.generateTopicsBatch();
      return;
    }

    if (action === "keyword-status") {
      await actions.updateKeyword(
        actionButton.dataset.keywordId || store.selectedIds.keyword,
        actionButton.dataset.keywordAction
      );
      return;
    }

    if (action === "expand-questions") {
      await actions.expandQuestions();
      return;
    }

    if (action === "create-question-job") {
      await actions.createQuestionJob();
      return;
    }

    if (action === "run-source-strategy") {
      await actions.runSourceStrategy(actionButton.dataset.strategyId);
      return;
    }

    if (action === "retry-automation-run") {
      await actions.retryAutomationRun(actionButton.dataset.runId);
      return;
    }

    if (action === "review-article") {
      await actions.reviewArticle(
        actionButton.dataset.articleId,
        actionButton.dataset.reviewAction
      );
      return;
    }

    if (action === "save-article") {
      await actions.saveArticle(actionButton.dataset.articleId);
      return;
    }

    if (action === "submit-review") {
      await actions.submitReview(actionButton.dataset.articleId);
      return;
    }

    if (action === "load-versions") {
      await actions.loadArticleDetail(actionButton.dataset.articleId);
      return;
    }

    if (action === "task-start") {
      await actions.startTask(actionButton.dataset.taskId);
      return;
    }

    if (action === "task-retry") {
      await actions.retryTask(actionButton.dataset.taskId);
      return;
    }

    if (action === "task-approve") {
      await actions.approveTask(actionButton.dataset.taskId, actionButton.dataset.approvalAction || "approve");
      return;
    }

    if (action === "task-cancel") {
      await actions.cancelTask(actionButton.dataset.taskId);
      return;
    }

    if (action === "visibility-collect") {
      await actions.runVisibilityCollection();
      return;
    }

    if (action === "campaign-run") {
      await actions.runMarketingCampaign(actionButton.dataset.campaignId);
      return;
    }

    if (action === "international-audit") {
      await actions.runInternationalAudit();
      return;
    }

    if (action === "international-site-audit") {
      await actions.runInternationalSiteAudit();
      return;
    }

    if (action === "international-site-assets") {
      await actions.generateInternationalSiteAssets();
      return;
    }

    if (action === "international-site-crawl") {
      await actions.crawlInternationalSiteEvidence();
      return;
    }

    if (action === "international-visibility-run") {
      await actions.runInternationalGeoVisibilityMeasurement();
      return;
    }

    if (action === "international-visibility-evidence-import") {
      await actions.importInternationalGeoVisibilityEvidence();
      return;
    }

    if (action === "international-evidence-assets-generate") {
      await actions.generateInternationalGeoEvidenceAssets();
      return;
    }

    if (action === "international-evidence-asset-approve") {
      await actions.reviewInternationalGeoEvidenceAsset(actionButton.dataset.assetId, "approve");
      return;
    }

    if (action === "international-evidence-asset-reject") {
      await actions.reviewInternationalGeoEvidenceAsset(actionButton.dataset.assetId, "reject");
      return;
    }

    if (action === "international-content-articles-generate") {
      await actions.generateInternationalGeoArticles();
      return;
    }

    if (action === "international-content-article-approve") {
      await actions.reviewInternationalGeoGeneratedArticle(actionButton.dataset.articleId, "approve");
      return;
    }

    if (action === "international-content-article-reject") {
      await actions.reviewInternationalGeoGeneratedArticle(actionButton.dataset.articleId, "reject");
      return;
    }

    if (action === "international-content-rewrites-generate") {
      await actions.generateInternationalGeoPlatformRewrites();
      return;
    }

    if (action === "international-content-rewrite-approve") {
      await actions.reviewInternationalGeoPlatformRewrite(actionButton.dataset.rewriteId, "approve");
      return;
    }

    if (action === "international-content-rewrite-reject") {
      await actions.reviewInternationalGeoPlatformRewrite(actionButton.dataset.rewriteId, "reject");
      return;
    }

    if (action === "international-publishing-packages-generate") {
      await actions.generateInternationalGeoPublishingPackages();
      return;
    }

    if (action === "international-publishing-package-approve") {
      await actions.reviewInternationalGeoPublishingPackage(actionButton.dataset.packageId, "approve");
      return;
    }

    if (action === "international-publishing-package-reject") {
      await actions.reviewInternationalGeoPublishingPackage(actionButton.dataset.packageId, "reject");
      return;
    }

    if (action === "international-publishing-tracking-demo-update") {
      await actions.updateInternationalGeoPublishingTrackingDemo(actionButton.dataset.trackingId);
      return;
    }

    if (action === "international-artifacts") {
      await actions.generateInternationalArtifacts();
      return;
    }

    if (action === "upgrade-plan") {
      await actions.upgradePlan(actionButton.dataset.planId || "single_user_pro");
      return;
    }

    if (action === "login-session") {
      await actions.loginSession();
      return;
    }

    if (action === "logout-session") {
      await actions.logoutSession();
      return;
    }

    if (action === "create-user") {
      await actions.createUser();
      return;
    }

    if (action === "disable-user") {
      await actions.disableUser(actionButton.dataset.userId);
      return;
    }

    if (action === "reset-user-password") {
      await actions.resetUserPassword(actionButton.dataset.userId);
      return;
    }

    if (action === "task-item-takeover") {
      await actions.takeoverTaskItem(
        actionButton.dataset.taskId,
        actionButton.dataset.itemId,
        actionButton.dataset.takeoverMode
      );
      return;
    }

    if (action === "save-brand-profile") {
      await actions.saveBrandProfile();
      return;
    }

    if (action === "save-model-config") {
      await actions.saveModelConfig();
      return;
    }

    if (action === "save-channel-config") {
      await actions.saveChannelConfig();
      return;
    }

    if (action === "save-provider-config") {
      await actions.saveAutomationProvider();
      return;
    }

    if (action === "test-provider-config") {
      await actions.testAutomationProvider();
      return;
    }

    if (action === "save-connector-config") {
      await actions.saveAutomationConnector();
      return;
    }

    if (action === "test-connector-config") {
      await actions.testAutomationConnector();
      return;
    }

    if (action === "run-connector-diagnostic") {
      await actions.runConnectorDiagnostic();
      return;
    }

    if (action === "save-source-strategy") {
      await actions.saveSourceStrategy();
      return;
    }

    if (action === "reset-runtime-state") {
      await actions.resetRuntimeState();
      return;
    }

    if (action === "refresh-launch-preflight") {
      await actions.refreshLaunchPreflight();
      return;
    }

    if (action === "create-runtime-backup") {
      await actions.createRuntimeBackup();
      return;
    }

    if (action === "validate-runtime-backup") {
      await actions.validateRuntimeBackup(actionButton.dataset.backupId);
      return;
    }

    if (action === "validate-runtime-backup-import") {
      await actions.validateRuntimeBackupImport();
      return;
    }

    if (action === "import-runtime-backup") {
      await actions.importRuntimeBackup();
      return;
    }

    if (action === "download-runtime-backup") {
      await actions.downloadRuntimeBackup(actionButton.dataset.backupId);
      return;
    }

    if (action === "restore-runtime-backup") {
      await actions.restoreRuntimeBackup(actionButton.dataset.backupId);
      return;
    }

    if (action === "run-scheduler-tick") {
      await actions.runSchedulerTick(actionButton.dataset.force === "true");
      return;
    }

    if (action === "create-model-config") {
      await actions.createModelConfig();
      return;
    }

    if (action === "create-channel-config") {
      await actions.createChannel();
      return;
    }

    if (action === "create-media-source") {
      await actions.createMediaSource();
      return;
    }

    if (action === "save-media-source") {
      await actions.saveMediaSource();
      return;
    }

    if (action === "reconnect-channel") {
      await actions.reconnectChannel(actionButton.dataset.channelId || store.selectedIds.channel);
      return;
    }

    if (action === "toggle-publish-article") {
      actions.togglePublishArticle(actionButton.dataset.articleId);
      return;
    }

    if (action === "create-publish-task") {
      await actions.createPublishTask();
      return;
    }

    if (action === "set-distribution-status") {
      store.filters.distribution.status = actionButton.dataset.filterValue || "all";
      rerender();
      return;
    }

    if (action === "reset-distribution-filters") {
      store.filters.distribution.query = "";
      store.filters.distribution.status = "all";
      rerender();
      return;
    }

    if (action === "open-distribution-view") {
      closePanelForPageChange(store, "distribution");
      store.page = "distribution";
      store.tabs.distribution = actionButton.dataset.distributionTab || "tasks";
      store.filters.distribution.status = actionButton.dataset.distributionStatus || "all";
      rerender();
      return;
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-search-input]")) {
      applyPageSearch(store, event.target.value);
      rerender();
      return;
    }

    if (event.target.matches("[data-login-field]")) {
      store.session.loginForm[event.target.dataset.loginField] = event.target.value;
      return;
    }

    if (event.target.matches("[data-form][data-field]")) {
      const formType = event.target.dataset.form;
      const formName =
        formType === "expand"
          ? "keywordExpansion"
          : formType === "job"
            ? "keywordJob"
            : "publishTask";
      const field = event.target.dataset.field;
      let value = event.target.value;
      if (field === "fetch_limit") {
        value = Number(value) || 0;
      }
      if (field === "dedupe_enabled" || field === "auto_retry_failed") {
        value = value === "true";
      }
      store.forms[formName][field] = value;
      if (
        formName === "keywordJob" &&
        field === "source_type" &&
        ["owned_self_media", "industry_self_media", "authority_media", "mixed_media"].includes(value)
      ) {
        store.forms.keywordJob.source_scope = value;
      }
      return;
    }

    if (event.target.matches("[data-runtime-backup-import]")) {
      store.forms.runtimeBackupImport = event.target.value;
      return;
    }

    if (event.target.matches("[data-user-field]")) {
      store.forms.user[event.target.dataset.userField] = event.target.value;
      return;
    }

    if (event.target.matches("[data-keyword-search]")) {
      store.filters.keywords.query = event.target.value;
      store.search = event.target.value;
      rerender();
      return;
    }

    if (event.target.matches("[data-content-search]")) {
      store.filters.content.query = event.target.value;
      store.search = event.target.value;
      rerender();
      return;
    }

    if (event.target.matches("[data-distribution-search]")) {
      store.filters.distribution.query = event.target.value;
      store.search = event.target.value;
      rerender();
    }
  });
}
