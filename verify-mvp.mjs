import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import {
  createArticleFromTopicAction,
  createChannelAction,
  createMediaSourceAction,
  createModelConfigAction,
  createPublishTaskAction,
  createKeywordCrawlJobAction,
  createTopicIdeasFromKeywords,
  evaluateConnectorPermission,
  getArticle,
  getAutomationConnector,
  getAutomationRun,
  getAutomationProviderConfig,
  getBrandProfile,
  getDashboardSummary,
  getCampaignAnalytics,
  getKeyword,
  getPromptTemplate,
  getPublishTask,
  getRuntimeStatus,
  getSourceStrategy,
  getSourceAdapterContract,
  getTopicIdea,
  getVisibilityAnalytics,
  getConnectorPermissionMatrix,
  listAutomationConnectors,
  listAutomationProviders,
  listAuditEvents,
  listAutomationRuns,
  listMediaSources,
  listProviderInvocations,
  listSourceAdapterContracts,
  listContentQualityTraces,
  listAudienceSegments,
  listMarketingCampaigns,
  listPromptTemplates,
  listSourceStrategies,
  reconnectChannelAction,
  resetRuntimeState,
  reviewArticleAction,
  approvePublishTaskAction,
  retryAutomationRunAction,
  runVisibilityCollectionAction,
  runSourceStrategyAction,
  runMarketingCampaignAction,
  saveAutomationProviderAction,
  saveBrandProfileAction,
  saveChannelAction,
  saveMediaSourceAction,
  saveModelConfigAction,
  saveSourceStrategyAction,
  startPublishTaskAction,
  submitArticleReviewAction,
  takeoverPublishTaskItemAction,
  testAutomationProviderAction,
  updateArticleAction,
  updateKeywordAction
} from "./mock-data.mjs";
import {
  applyPageSearch,
  buildReviewPayload,
  closePanelForPageChange,
  getActiveSearchValue,
  getPublishTaskActionState,
  getSelectedOpportunityKeywordIds,
  normalizeStoreSelections,
  resolvePublishPanelState
} from "./prototype/src/experience-utils.js";
import { applyRouteState, serializeRouteState } from "./prototype/src/route-state.js";
import { renderAnalytics } from "./prototype/src/pages/analytics.js";
import { renderDistribution } from "./prototype/src/pages/distribution.js";
import { renderKeywords } from "./prototype/src/pages/keywords.js";
import { renderSettings } from "./prototype/src/pages/settings.js";

const syntaxTargets = [
  "automation-providers.mjs",
  "server.mjs",
  "mock-data.mjs",
  "prototype/app.js",
  "prototype/src/api.js",
  "prototype/src/components.js",
  "prototype/src/config.js",
  "prototype/src/events.js",
  "prototype/src/experience-utils.js",
  "prototype/src/main.js",
  "prototype/src/pages/analytics.js",
  "prototype/src/pages/billing.js",
  "prototype/src/pages/content.js",
  "prototype/src/pages/dashboard.js",
  "prototype/src/pages/distribution.js",
  "prototype/src/pages/keywords.js",
  "prototype/src/pages/settings.js",
  "prototype/src/route-state.js",
  "prototype/src/render.js",
  "prototype/src/store.js",
  "prototype/src/utils.js"
];

function runSyntaxChecks() {
  for (const target of syntaxTargets) {
    const result = spawnSync(process.execPath, ["--check", target], {
      encoding: "utf8"
    });
    assert.equal(result.status, 0, `Syntax check failed for ${target}\n${result.stderr}`);
  }
}

async function runMockDataChecks() {
  const baselineSummary = getDashboardSummary();
  assert.ok(baselineSummary.weekly_new_keywords > 0, "Dashboard summary should be available");
  assert.ok(listMediaSources().items.length >= 3, "Media source library should be available");
  assert.ok(
    listSourceAdapterContracts().items.length >= 4,
    "Source adapter contract registry should be available"
  );
  const rssContract = getSourceAdapterContract("rss_like");
  assert.equal(rssContract?.contract_version, "v1", "Source adapter contracts should expose version");
  assert.ok(
    rssContract?.stages?.some((item) => item.stage_id === "fetch" && item.evidence_fields.includes("fetch_url_count")),
    "Source adapter contracts should define fetch evidence"
  );
  assert.ok(
    rssContract?.stages?.some((item) => item.stage_id === "normalize" && item.output_schema.includes("normalized_title")),
    "Source adapter contracts should define normalization output schema"
  );
  assert.ok(
    rssContract?.stages?.some((item) => item.stage_id === "dedupe" && item.failure_codes.includes("duplicate_cluster_overflow")),
    "Source adapter contracts should define dedupe failure taxonomy"
  );
  assert.ok(
    rssContract?.quality_signals?.includes("source_authority"),
    "Source adapter contracts should expose quality scoring signals"
  );
  assert.ok(listSourceStrategies().items.length >= 2, "Source strategies should be available");
  assert.ok(listAutomationProviders().items.length >= 3, "Automation provider registry should be available");
  assert.ok(listAutomationConnectors().items.length >= 6, "Automation connector registry should be available");
  assert.ok(listPromptTemplates().items.length >= 3, "Prompt template registry should be available");
  assert.equal(
    getPromptTemplate("geo_article_draft")?.active_version,
    1,
    "Prompt template detail should expose the active version"
  );
  assert.ok(
    getRuntimeStatus().prompts?.counts?.total >= 3,
    "Runtime status should include prompt template summary"
  );
  assert.ok(
    listAutomationConnectors().items.some((item) => item.connector_type === "source_connector"),
    "Automation connector registry should include source connectors"
  );
  assert.ok(
    listAutomationConnectors().items.some((item) => item.connector_type === "social_connector"),
    "Automation connector registry should include social publishing connectors"
  );
  assert.equal(
    getAutomationConnector("firecrawl_source")?.config?.api_key,
    "",
    "Connector config should not expose raw API keys"
  );
  assert.match(
    getAutomationConnector("firecrawl_source")?.config?.masked_api_key || "",
    /\*+key$/,
    "Connector config should expose only masked API key hints"
  );
  const mailtrainConnector = getAutomationConnector("mailtrain_email");
  assert.equal(
    mailtrainConnector?.credential_status,
    "configured",
    "Connector detail should expose credential readiness without raw secrets"
  );
  assert.ok(
    mailtrainConnector?.allowed_actions?.includes("campaign:send"),
    "Connector detail should expose scoped allowed actions"
  );
  assert.ok(
    mailtrainConnector?.dangerous_actions?.includes("campaign:delete"),
    "Connector detail should expose dangerous actions outside the boundary"
  );
  assert.equal(
    mailtrainConnector?.permission_boundary,
    "scoped_write",
    "Connector detail should expose a permission boundary"
  );
  assert.ok(
    mailtrainConnector?.last_permission_audit?.checked_at,
    "Connector detail should expose the latest permission audit"
  );
  assert.doesNotMatch(
    JSON.stringify(mailtrainConnector),
    /mailtrain-demo-key/,
    "Connector permission output should not leak raw secrets"
  );
  const permissionMatrix = getConnectorPermissionMatrix();
  assert.ok(
    permissionMatrix.items.some(
      (item) =>
        item.id === "mailtrain_email" &&
        item.allowed_actions.includes("segment:read") &&
        item.allowed_actions.includes("campaign:read") &&
        item.allowed_actions.includes("campaign:send")
    ),
    "Permission matrix should include Mailtrain read/send boundaries"
  );
  assert.ok(
    permissionMatrix.items.some(
      (item) =>
        item.id === "analytics_visibility" &&
        item.allowed_actions.includes("visibility:read") &&
        item.allowed_actions.includes("visibility:collect")
    ),
    "Permission matrix should include analytics visibility collection boundaries"
  );
  const blockedPermission = evaluateConnectorPermission("mailtrain_email", "campaign:delete");
  assert.equal(blockedPermission.allowed, false, "Dangerous connector actions should be denied by default");
  assert.equal(blockedPermission.reason_code, "dangerous_action", "Denied connector actions should be classified");
  assert.doesNotMatch(
    JSON.stringify(blockedPermission),
    /mailtrain-demo-key/,
    "Permission evaluation should not leak raw secrets"
  );
  assert.ok(
    getRuntimeStatus().connectors?.counts?.total >= 6,
    "Runtime status should include connector summary"
  );
  const visibilityAnalytics = getVisibilityAnalytics();
  assert.ok(
    visibilityAnalytics?.tracked_queries?.length >= 3,
    "Visibility analytics should expose tracked external queries"
  );
  assert.ok(
    visibilityAnalytics.tracked_queries.every((item) => item.target_url && item.engine && item.latest_snapshot),
    "Visibility tracked queries should include target URL, engine, and latest snapshot"
  );
  assert.ok(
    visibilityAnalytics.snapshots.some((item) => Number.isFinite(item.rank_position) && item.citation_count >= 0),
    "Visibility snapshots should include rank and citation metrics"
  );
  assert.ok(
    visibilityAnalytics.competitor_domains.some((item) => item.domain && item.share_of_voice >= 0),
    "Visibility analytics should include competitor domain snapshots"
  );
  const visibilityRunResult = runVisibilityCollectionAction({ trigger: "manual" });
  assert.equal(visibilityRunResult?.run?.status, "completed", "Visibility collection run should complete");
  assert.ok(
    visibilityRunResult.run.steps.length >= 3,
    "Visibility collection run should expose inspectable steps"
  );
  assert.ok(
    visibilityRunResult.snapshots_created >= visibilityAnalytics.tracked_queries.length,
    "Visibility collection should create snapshots for tracked queries"
  );
  assert.equal(
    getVisibilityAnalytics().collection_runs[0]?.id,
    visibilityRunResult.run.id,
    "Visibility analytics should expose latest collection run"
  );
  assert.ok(listAudienceSegments().items.length >= 3, "Audience segment library should be available");
  assert.ok(listMarketingCampaigns().items.length >= 2, "Marketing campaign library should be available");
  const campaignAnalytics = getCampaignAnalytics();
  assert.ok(
    campaignAnalytics.summary?.total_recipients >= 1,
    "Campaign analytics should expose audience reach"
  );
  assert.ok(
    campaignAnalytics.segments.every((item) => item.segment_name && item.member_count >= 0),
    "Campaign analytics should expose audience segment metrics"
  );
  const campaignRunResult = runMarketingCampaignAction("camp-1", { trigger: "manual" });
  assert.equal(campaignRunResult?.run?.status, "completed", "Marketing campaign run should complete");
  assert.ok(
    campaignRunResult.run.steps.length >= 3,
    "Marketing campaign run should expose lifecycle steps"
  );
  assert.ok(
    campaignRunResult.metrics.sent_count >= campaignRunResult.metrics.click_count,
    "Marketing campaign run should expose send/open/click metrics"
  );
  assert.equal(
    getCampaignAnalytics().campaign_runs[0]?.id,
    campaignRunResult.run.id,
    "Campaign analytics should expose latest campaign run"
  );

  const savedProvider = saveAutomationProviderAction("remote_geo_writer", {
    is_active: true,
    enabled: true,
    endpoint: "mock://article-generation",
    model_name: "deepseek-reasoner",
    api_key: "demo-secret-key",
    timeout_ms: 18000,
    retry_count: 3,
    notes: "验收写稿适配器"
  });
  assert.equal(savedProvider?.is_active, true, "Provider should be switchable to active");
  assert.equal(savedProvider?.config?.enabled, true, "Provider enabled flag should be saved");
  assert.equal(savedProvider?.config?.timeout_ms, 18000, "Provider timeout should be saved");
  assert.equal(
    getAutomationProviderConfig("remote_geo_writer")?.config?.endpoint,
    "mock://article-generation",
    "Provider endpoint should be queryable after save"
  );
  assert.equal(
    getAutomationProviderConfig("remote_geo_writer")?.protocol?.capability,
    "article_generation",
    "Provider protocol schema should be exposed on provider config"
  );
  assert.notEqual(
    getAutomationProviderConfig("remote_geo_writer")?.config?.api_key,
    "demo-secret-key",
    "Provider config should not expose raw API keys"
  );
  assert.match(
    getAutomationProviderConfig("remote_geo_writer")?.config?.masked_api_key || "",
    /\*+key$/,
    "Provider config should expose only a masked API key hint"
  );
  assert.throws(
    () =>
      saveAutomationProviderAction("remote_geo_writer", {
        endpoint: "http://127.0.0.1:1234/internal"
      }),
    /not allowed|private|loopback/i,
    "Provider config should reject loopback endpoints"
  );

  const providerTestSuccess = await testAutomationProviderAction("remote_geo_writer");
  assert.equal(providerTestSuccess?.success, true, "Mock provider test should succeed");
  assert.equal(providerTestSuccess?.schema_valid, true, "Mock provider test should validate response schema");
  assert.ok(providerTestSuccess?.sample_response?.article, "Mock provider test should return sample response");

  saveAutomationProviderAction("remote_topic_planner", {
    enabled: true,
    endpoint: "https://example.invalid/unreachable",
    timeout_ms: 500,
    retry_count: 0
  });
  const providerTestFailure = await testAutomationProviderAction("remote_topic_planner");
  assert.equal(providerTestFailure?.success, false, "Unreachable provider test should fail");
  assert.ok(providerTestFailure?.error_message, "Failed provider test should expose error message");
  assert.ok(
    listProviderInvocations().items.some(
      (item) =>
        item.operation === "test_connection" &&
        item.provider_id === "remote_geo_writer" &&
        item.schema_valid === true
    ),
    "Provider invocation logs should include successful connection tests"
  );
  assert.ok(
    listProviderInvocations().items.some(
      (item) =>
        item.operation === "test_connection" &&
        item.provider_id === "remote_topic_planner" &&
        Boolean(item.error_message)
    ),
    "Provider invocation logs should include failed connection tests"
  );

  const savedStrategy = saveSourceStrategyAction("stg-2", {
    schedule_mode: "cron_expression",
    cron_expression: "0 11 * * *",
    is_enabled: false,
    min_word_count: 900,
    required_terms_count: 1
  });
  assert.equal(savedStrategy?.schedule_mode, "cron_expression", "Strategy schedule mode should be saved");
  assert.equal(savedStrategy?.cron_expression, "0 11 * * *", "Strategy cron expression should be saved");
  assert.equal(savedStrategy?.is_enabled, false, "Strategy enabled flag should be saved");
  assert.equal(savedStrategy?.min_word_count, 900, "Strategy min word count should be saved");
  assert.equal(savedStrategy?.required_terms_count, 1, "Strategy term threshold should be saved");
  assert.equal(
    getSourceStrategy("stg-2")?.schedule_mode_label,
    "自定义定时",
    "Strategy schedule label should refresh with saved mode"
  );
  assert.equal(
    getSourceStrategy("stg-2")?.next_run_at,
    null,
    "Disabled strategy should not keep a next run timestamp"
  );

  const cronEnabledStrategy = saveSourceStrategyAction("stg-1", {
    schedule_mode: "cron_expression",
    cron_expression: "0 11 * * *",
    is_enabled: true
  });
  assert.equal(
    cronEnabledStrategy?.schedule_mode,
    "cron_expression",
    "Enabled cron strategy should keep cron schedule mode"
  );
  assert.ok(cronEnabledStrategy?.next_run_at, "Enabled cron strategy should compute next run time");
  assert.ok(
    Date.parse(cronEnabledStrategy.next_run_at) > Date.now() - 60 * 1000,
    "Enabled cron strategy should schedule a future run"
  );

  const runtimeStatus = getRuntimeStatus();
  assert.ok(runtimeStatus.counts.strategies >= 4, "Runtime counts should include strategies");
  assert.ok(runtimeStatus.counts.automation_runs >= 2, "Runtime counts should include automation runs");
  assert.ok(runtimeStatus.counts.provider_invocations >= 0, "Runtime counts should include provider invocations");
  assert.equal(
    runtimeStatus.providers?.active_provider_ids?.keyword_discovery,
    "local_question_expander",
    "Runtime status should include active keyword discovery provider"
  );
  assert.equal(
    runtimeStatus.providers?.active_provider_ids?.article_generation,
    "remote_geo_writer",
    "Runtime status should include the switched active article provider"
  );
  assert.ok(
    runtimeStatus.providers?.invocation_summary?.test_count >= 2,
    "Runtime status should include provider connection test summary"
  );

  const rescoredKeyword = updateKeywordAction("kw-3", "rescore");
  assert.ok(rescoredKeyword, "Keyword rescore should return a keyword");
  assert.equal(rescoredKeyword.status, "scored", "Rescore should keep keyword in scored state");

  const selectedKeyword = updateKeywordAction("kw-4", "select");
  assert.equal(selectedKeyword?.status, "selected", "Keyword should move to selected");

  const ignoredKeyword = updateKeywordAction("kw-4", "ignore");
  assert.equal(ignoredKeyword?.status, "ignored", "Keyword should move to ignored");

  const crawlResult = await createKeywordCrawlJobAction({
    name: "验收问题裂变",
    source_type: "authority_media",
    source_scope: "authority_media",
    monitoring_goal: "authority_follow",
    industry_topic: "中国智能体",
    seed_keywords: ["线索智能体"],
    source_targets: ["极客公园", "36氪 AI"],
    fetch_limit: 6,
    dedupe_enabled: true
  });
  assert.ok(crawlResult.new_items_count > 0, "Keyword crawl job should create questions");
  assert.equal(crawlResult.job.source_scope, "authority_media", "Keyword crawl job should keep source scope");
  assert.equal(
    crawlResult.job.monitoring_goal,
    "authority_follow",
    "Keyword crawl job should keep monitoring goal"
  );
  assert.ok(
    crawlResult.items.every((item) => item.source_scope === "authority_media"),
    "Generated questions should inherit source scope"
  );
  assert.ok(
    crawlResult.items.some((item) => item.source_origin_name),
    "Generated questions should include source origin names"
  );
  assert.ok(
    crawlResult.items.every((item) => item.provider_id),
    "Generated questions should carry keyword discovery provider metadata"
  );
  assert.equal(crawlResult.job.source_adapter_id, "headline_cluster", "Keyword crawl job should record adapter contract id");
  assert.equal(crawlResult.job.source_adapter_version, "v1", "Keyword crawl job should record adapter contract version");
  assert.ok(
    crawlResult.job.adapter_evidence?.fetch?.fetch_url_count >= 1,
    "Keyword crawl job should keep fetch evidence"
  );
  assert.ok(
    crawlResult.job.adapter_evidence?.normalize?.normalized_record_count >= crawlResult.job.raw_count,
    "Keyword crawl job should keep normalization evidence"
  );
  assert.equal(
    crawlResult.job.adapter_evidence?.dedupe?.deduped_record_count,
    crawlResult.job.deduped_count,
    "Keyword crawl job should keep dedupe evidence"
  );
  assert.ok(
    Number.isFinite(crawlResult.job.quality_summary?.average_quality_score),
    "Keyword crawl job should keep adapter quality score"
  );
  assert.ok(
    crawlResult.job.error_taxonomy.some((item) => item.code === "source_rate_limited"),
    "Keyword crawl job should expose crawl error taxonomy"
  );

  const fallbackProvider = saveAutomationProviderAction("remote_keyword_adapter", {
    is_active: true,
    enabled: true,
    endpoint: "https://example.invalid/unreachable",
    timeout_ms: 500,
    retry_count: 1
  });
  assert.equal(fallbackProvider?.is_active, true, "Remote keyword provider should be switchable to active");

  const fallbackCrawl = await createKeywordCrawlJobAction({
    name: "远程抓词回退验收",
    source_type: "authority_media",
    source_scope: "authority_media",
    monitoring_goal: "authority_follow",
    industry_topic: "回退测试",
    seed_keywords: ["回退测试"],
    fetch_limit: 2,
    dedupe_enabled: true
  });
  assert.equal(
    fallbackCrawl.job.provider_execution_mode,
    "fallback_local",
    "Keyword crawl should fall back to local provider on remote failure"
  );
  assert.ok(
    fallbackCrawl.job.provider_error_message,
    "Keyword crawl should surface remote provider error message"
  );

  const runsBefore = listAutomationRuns().total;
  const strategyRun = await runSourceStrategyAction("stg-3", {
    industry_topic: "中国智能体",
    fetch_limit: 5
  });
  assert.ok(strategyRun?.run?.id, "Source strategy should create an automation run");
  assert.equal(
    strategyRun.run.source_scope,
    "authority_media",
    "Automation run should inherit strategy scope"
  );
  assert.ok(strategyRun.run.generated_question_count > 0, "Automation run should generate questions");
  assert.ok(strategyRun.generated_topics.length > 0, "Automation run should generate topics");
  assert.ok(strategyRun.generated_articles.length > 0, "Automation run should generate article drafts");
  assert.ok(
    Array.isArray(strategyRun.run.event_logs) && strategyRun.run.event_logs.length > 0,
    "Automation run should keep event logs"
  );
  assert.ok(
    Array.isArray(strategyRun.run.steps) && strategyRun.run.steps.length >= 5,
    "Automation run should expose structured execution steps"
  );
  assert.ok(
    strategyRun.run.steps.every((item) => item.run_id === strategyRun.run.id),
    "Automation run steps should link back to the run"
  );
  assert.ok(
    strategyRun.run.steps.some((item) => item.step_type === "crawl" && item.provider_id),
    "Automation run steps should capture provider metadata"
  );
  assert.ok(
    strategyRun.run.steps.every((item) => item.status && item.status_label && item.started_at && item.finished_at),
    "Automation run steps should include status labels and timing"
  );
  assert.ok(
    getAutomationRun(strategyRun.run.id)?.steps?.length >= 5,
    "Automation run detail should include structured execution steps"
  );
  assert.ok(
    listAutomationRuns().items.find((item) => item.id === strategyRun.run.id)?.steps?.length >= 5,
    "Automation run list should include structured execution steps"
  );
  assert.equal(
    getSourceStrategy("stg-3")?.consecutive_failures,
    0,
    "Successful strategy run should reset consecutive failures"
  );
  assert.equal(
    getSourceStrategy("stg-3")?.last_run_at,
    strategyRun.run.created_at,
    "Strategy last run time should update after execution"
  );
  assert.equal(
    listAutomationRuns().total,
    runsBefore + 1,
    "Automation runs list should grow after strategy execution"
  );

  const autoPublishRun = await runSourceStrategyAction("stg-4", {
    industry_topic: "中国智能体",
    fetch_limit: 5
  });
  assert.ok(autoPublishRun?.run?.created_publish_task_id, "Immediate automation should create a publish task");
  assert.ok(autoPublishRun.run.auto_passed_count > 0, "Immediate automation should auto-pass at least one article");
  const autoPublishTask = getPublishTask(autoPublishRun.run.created_publish_task_id);
  assert.ok(autoPublishTask, "Auto-created publish task should be queryable");
  assert.equal(autoPublishTask.status, "completed", "Immediate auto publish task should be completed");
  assert.ok(
    autoPublishTask.items.every((item) => item.status === "published"),
    "Immediate auto publish should mark task items as published"
  );
  assert.ok(
    autoPublishRun.run.generated_article_ids.every(
      (articleId) => getArticle(articleId)?.publish_status === "published"
    ),
    "Immediate auto publish should update generated articles to published"
  );

  const retriedRun = await retryAutomationRunAction(autoPublishRun.run.id);
  assert.ok(retriedRun?.run?.id, "Automation run should be retryable");
  assert.equal(
    retriedRun.run.retry_of_run_id,
    autoPublishRun.run.id,
    "Retried automation run should keep source run id"
  );
  assert.ok(getAutomationRun(retriedRun.run.id), "Retried automation run should be queryable");

  const generatedTopics = await createTopicIdeasFromKeywords([crawlResult.items[0].id], "decision");
  assert.ok(generatedTopics.items.length > 0, "Topic generation should create topics");
  assert.ok(getTopicIdea(generatedTopics.items[0].id), "Generated topic should be queryable");
  assert.ok(
    generatedTopics.items.every((item) => item.provider_id),
    "Generated topics should carry topic planning provider metadata"
  );

  const generatedArticle = await createArticleFromTopicAction(generatedTopics.items[0].id);
  assert.ok(generatedArticle?.id, "Topic should generate an article draft");
  assert.equal(generatedArticle.topic_idea_id, generatedTopics.items[0].id, "Generated article should link to topic");
  assert.ok(generatedArticle.provider_id, "Generated article should carry article generation provider metadata");
  assert.equal(generatedArticle.provider_execution_mode, "remote", "Generated article should support remote provider execution");
  assert.equal(
    generatedArticle.prompt_template_id,
    "geo_article_draft",
    "Generated article should keep the prompt template id"
  );
  assert.equal(
    generatedArticle.prompt_template_version,
    1,
    "Generated article should keep the prompt template version"
  );
  assert.ok(
    listContentQualityTraces({ article_id: generatedArticle.id }).items[0]?.score >= 80,
    "Generated article should record a content quality trace"
  );
  assert.ok(
    listProviderInvocations().items.some(
      (item) => item.capability === "article_generation" && item.execution_mode === "remote"
    ),
    "Provider invocation logs should include remote article generation"
  );
  assert.ok(
    listProviderInvocations().items.some(
      (item) => item.capability === "keyword_discovery" && item.execution_mode === "fallback_local"
    ),
    "Provider invocation logs should include fallback keyword discovery"
  );

  const updatedArticle = updateArticleAction("ar-1", {
    title: "企业智能体平台怎么选：验收版",
    content_markdown: "这是一次本地验收保存，用于验证版本记录是否会追加。"
  });
  assert.match(updatedArticle?.title || "", /验收版/, "Article title should be updated");

  const submittedArticle = submitArticleReviewAction("ar-2");
  assert.equal(
    submittedArticle?.review_status,
    "review_pending",
    "Article should be submitted into review queue"
  );

  const reviewedArticle = reviewArticleAction("ar-2", "pass", "验收通过", []);
  assert.equal(
    reviewedArticle?.publish_status,
    "ready_to_publish",
    "Reviewed article should become ready to publish"
  );

  const createdTask = createPublishTaskAction({
    name: "验收发布任务",
    channel_id: "ch-1",
    publish_mode: "scheduled",
    scheduled_at: "2026-04-18T10:00:00+08:00",
    article_ids: ["ar-1", "ar-2"]
  });
  assert.ok(createdTask?.id, "Publish task should be created");
  assert.equal(createdTask.total_count, 2, "Publish task should contain selected articles");
  assert.ok(getPublishTask(createdTask.id), "Created publish task should be queryable");
  assert.ok(
    createdTask.items.every((item) => item.template_label && item.payload_preview),
    "Publish task items should include template mapping and payload preview"
  );
  assert.equal(createdTask.calendar_date, "2026-04-18", "Publish task should expose a calendar date");
  assert.ok(
    createdTask.items.every((item) => Array.isArray(item.post_variants) && item.post_variants.length > 0),
    "Publish task items should include channel-specific post variants"
  );
  assert.ok(
    createdTask.items.every((item) => Array.isArray(item.readiness_checks) && item.readiness_checks.length >= 3),
    "Publish task items should include readiness checks"
  );
  assert.ok(
    getPublishTask(createdTask.id)?.items?.[0]?.readiness_status,
    "Publish task detail should keep readiness status"
  );
  assert.equal(createdTask.approval_status, "pending", "Confirmed publish task should start as approval pending");
  assert.ok(
    Array.isArray(createdTask.approval_steps) && createdTask.approval_steps.length > 0,
    "Publish task should expose approval steps"
  );
  const blockedStartTask = startPublishTaskAction(createdTask.id);
  assert.equal(blockedStartTask.status, "queued", "Approval-pending task should not start");
  assert.equal(
    blockedStartTask.start_blocked_reason,
    "approval_required",
    "Approval-pending task should expose a structured start block reason"
  );
  const approvedTask = approvePublishTaskAction(createdTask.id, {
    action: "approve",
    note: "验收审批通过"
  });
  assert.equal(approvedTask.approval_status, "approved", "Publish task should become approved");
  assert.ok(approvedTask.approved_at, "Approved publish task should keep approval time");

  const startedTask = startPublishTaskAction(createdTask.id);
  assert.ok(startedTask, "Publish task should be startable");
  assert.ok(
    startedTask.items.every((item) => item.status === "published"),
    "Starting a task should publish queued items"
  );
  assert.ok(
    startedTask.items.every((item) => item.execution_mode),
    "Published task items should keep execution mode metadata"
  );

  reviewArticleAction(generatedArticle.id, "pass", "转入公众号人工接管验收", []);
  const manualTask = createPublishTaskAction({
    name: "公众号人工接管验收",
    channel_id: "ch-3",
    publish_mode: "scheduled",
    scheduled_at: "2026-04-19T10:00:00+08:00",
    require_confirmation: false,
    article_ids: [generatedArticle.id]
  });
  assert.ok(manualTask?.id, "WeChat publish task should be creatable");
  const failedWechatTask = startPublishTaskAction(manualTask.id);
  const failedWechatItem = failedWechatTask?.items?.find((item) => item.status === "failed");
  assert.ok(failedWechatItem, "Expired or guarded channel should produce failed task item");
  assert.ok(
    failedWechatItem?.failure_reason_code,
    "Failed task item should surface structured failure reason"
  );
  const manuallyTakenOver = takeoverPublishTaskItemAction(manualTask.id, failedWechatItem.id, {
    mode: "manual_publish"
  });
  assert.ok(
    manuallyTakenOver?.items?.some(
      (item) => item.id === failedWechatItem.id && item.execution_mode === "manual_takeover"
    ),
    "Manual takeover should mark failed item as published manually"
  );

  const savedProfile = saveBrandProfileAction({
    brand_name: "AgentCore OS GEO",
    one_liner: "面向中国智能体行业的问题抓取、内容生成与分发平台。",
    core_value_props: ["问题意图挖掘", "文章自动编排", "多渠道分发"],
    forbidden_terms: ["自动爆文"],
    glossary_terms: [{ term: "GEO", description: "面向生成式引擎的内容优化方法。" }]
  });
  assert.equal(savedProfile.brand_name, "AgentCore OS GEO", "Brand profile should persist updates");
  assert.equal(
    getBrandProfile().glossary_terms[0].term,
    "GEO",
    "Saved brand glossary should be readable"
  );

  const createdModel = createModelConfigAction({
    provider: "深度求索",
    provider_type: "官方接口",
    model_name: "deepseek-reasoner",
    purpose: "outline_generation",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    api_key: "model-secret-key",
    temperature: 0.6,
    max_tokens: 5000,
    timeout_ms: 22000,
    is_default: false,
    status: "active"
  });
  assert.ok(createdModel?.id, "Model config should be creatable");
  assert.notEqual(createdModel.api_key, "model-secret-key", "Created model should not expose raw API key");
  assert.match(createdModel.masked_api_key || "", /\*+key$/, "Created model should expose masked API key hint");

  const savedModel = saveModelConfigAction(createdModel.id, {
    model_name: "deepseek-reasoner-v2",
    endpoint: "https://api.deepseek.com/v1/responses",
    api_key: "updated-model-secret",
    status: "disabled"
  });
  assert.equal(savedModel?.model_name, "deepseek-reasoner-v2", "Model config should be saved");
  assert.match(savedModel?.endpoint || "", /responses/, "Model config should persist endpoint");
  assert.notEqual(savedModel?.api_key, "updated-model-secret", "Saved model should not expose raw API key");

  const createdChannel = createChannelAction({
    channel_type: "xiaohongshu",
    channel_name: "小红书",
    auth_status: "pending"
  });
  assert.ok(createdChannel?.id, "Channel should be creatable");

  const savedChannel = saveChannelAction(createdChannel.id, {
    account_name: "AgentCore 小红书",
    default_author: "运营团队",
    default_category: "智能体内容"
  });
  assert.equal(savedChannel?.account_name, "AgentCore 小红书", "Channel config should be saved");

  const reconnected = reconnectChannelAction(createdChannel.id);
  assert.equal(reconnected?.auth_status, "connected", "Channel reconnect should restore auth status");

  const createdSource = createMediaSourceAction({
    source_name: "新媒体内容源",
    source_type: "industry_self_media",
    platform: "xiaohongshu",
    sample_topics: ["智能体测评", "行业趋势"]
  });
  assert.ok(createdSource?.id, "Media source should be creatable");

  const savedSource = saveMediaSourceAction(createdSource.id, {
    source_name: "新媒体内容源升级版",
    extraction_mode: "entity_tracking",
    relevance_score: 91
  });
  assert.equal(savedSource?.source_name, "新媒体内容源升级版", "Media source should be saved");
  assert.equal(savedSource?.relevance_score, 91, "Media source score should persist");

  assert.ok(getKeyword("kw-3"), "Keyword should still be queryable after updates");

  const auditEvents = listAuditEvents({ page_size: 200 }).items;
  assert.ok(
    auditEvents.some(
      (item) =>
        item.action === "automation_provider.update" &&
        item.resource_type === "automation_provider" &&
        item.resource_id === "remote_geo_writer"
    ),
    "Provider config updates should be recorded in audit events"
  );
  assert.ok(
    auditEvents.some(
      (item) =>
        item.action === "model_config.update" &&
        item.resource_type === "model_config" &&
        item.resource_id === createdModel.id
    ),
    "Model config updates should be recorded in audit events"
  );
  assert.ok(
    auditEvents.some(
      (item) =>
        item.action === "publish_task.start" &&
        item.resource_type === "publish_task" &&
        item.resource_id === createdTask.id
    ),
    "Publish task starts should be recorded in audit events"
  );
  assert.equal(
    auditEvents.some((item) => JSON.stringify(item).includes("demo-secret-key")),
    false,
    "Audit events should not contain raw provider API keys"
  );
  assert.equal(
    auditEvents.some((item) => JSON.stringify(item).includes("updated-model-secret")),
    false,
    "Audit events should not contain raw model API keys"
  );

  resetRuntimeState();
  const resetAuditEvents = listAuditEvents({ page_size: 5 }).items;
  assert.equal(resetAuditEvents[0]?.action, "runtime.reset", "Runtime reset should be recorded in audit events");
  assert.equal(
    resetAuditEvents[0]?.resource_type,
    "runtime",
    "Runtime reset audit event should identify the runtime resource"
  );
}

function createRouteStateFixture() {
  return {
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
      strategy: null,
      automationRun: null
    },
    ui: {
      panel: ""
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
    }
  };
}

function runRouteStateChecks() {
  const contentStore = createRouteStateFixture();
  contentStore.page = "content";
  contentStore.tabs.content = "articles";
  contentStore.filters.content.query = "私有化";
  contentStore.filters.content.status = "ready_to_publish";
  contentStore.selectedIds.topic = "tp-3";
  contentStore.selectedIds.article = "ar-2";
  contentStore.selectedIds.review = "ar-1";

  const contentHash = serializeRouteState(contentStore);
  assert.match(contentHash, /page=content/, "Content page should serialize");
  assert.match(contentHash, /contentTab=articles/, "Content tab should serialize");
  assert.match(contentHash, /contentQuery=%E7%A7%81%E6%9C%89%E5%8C%96/, "Content query should serialize");
  assert.match(contentHash, /articleId=ar-2/, "Selected article should serialize");

  const restoredContentStore = createRouteStateFixture();
  applyRouteState(restoredContentStore, `#${contentHash}`);
  assert.equal(restoredContentStore.page, "content", "Content page should restore");
  assert.equal(restoredContentStore.tabs.content, "articles", "Content tab should restore");
  assert.equal(restoredContentStore.filters.content.query, "私有化", "Content query should restore");
  assert.equal(
    restoredContentStore.filters.content.status,
    "ready_to_publish",
    "Content status should restore"
  );
  assert.equal(restoredContentStore.selectedIds.article, "ar-2", "Selected article should restore");

  const settingsStore = createRouteStateFixture();
  settingsStore.page = "settings";
  settingsStore.tabs.settings = "providers";
  settingsStore.selectedIds.model = "md-2";
  settingsStore.selectedIds.channel = "ch-3";
  settingsStore.selectedIds.provider = "remote_geo_writer";
  settingsStore.selectedIds.strategy = "stg-4";
  settingsStore.selectedIds.automationRun = "run-2";

  const settingsHash = serializeRouteState(settingsStore);
  assert.match(settingsHash, /settingsTab=providers/, "Settings tab should serialize");
  assert.match(settingsHash, /modelId=md-2/, "Selected model should serialize");
  assert.match(settingsHash, /channelId=ch-3/, "Selected channel should serialize");
  assert.match(settingsHash, /providerId=remote_geo_writer/, "Selected provider should serialize");
  assert.match(settingsHash, /strategyId=stg-4/, "Selected strategy should serialize");

  const restoredSettingsStore = createRouteStateFixture();
  applyRouteState(restoredSettingsStore, `#${settingsHash}`);
  assert.equal(restoredSettingsStore.page, "settings", "Settings page should restore");
  assert.equal(restoredSettingsStore.tabs.settings, "providers", "Settings tab should restore");
  assert.equal(restoredSettingsStore.selectedIds.model, "md-2", "Selected model should restore");
  assert.equal(
    restoredSettingsStore.selectedIds.channel,
    "ch-3",
    "Selected channel should restore"
  );
  assert.equal(
    restoredSettingsStore.selectedIds.provider,
    "remote_geo_writer",
    "Selected provider should restore"
  );
  assert.equal(restoredSettingsStore.selectedIds.strategy, "stg-4", "Selected strategy should restore");

  const keywordStore = createRouteStateFixture();
  keywordStore.page = "keywords";
  keywordStore.tabs.keywords = "crawl";
  keywordStore.selectedIds.mediaSource = "src-3";
  keywordStore.selectedIds.strategy = "stg-2";
  keywordStore.selectedIds.automationRun = "run-3";
  keywordStore.ui.panel = "job";

  const keywordHash = serializeRouteState(keywordStore);
  assert.match(keywordHash, /keywordsTab=crawl/, "Keyword crawl tab should serialize");
  assert.match(keywordHash, /mediaSourceId=src-3/, "Selected media source should serialize");
  assert.match(keywordHash, /strategyId=stg-2/, "Selected strategy should serialize");
  assert.match(keywordHash, /runId=run-3/, "Selected crawl run should serialize");
  assert.match(keywordHash, /panel=job/, "Open panel should serialize");

  const restoredKeywordStore = createRouteStateFixture();
  applyRouteState(restoredKeywordStore, `#${keywordHash}`);
  assert.equal(restoredKeywordStore.tabs.keywords, "crawl", "Keyword crawl tab should restore");
  assert.equal(
    restoredKeywordStore.selectedIds.mediaSource,
    "src-3",
    "Selected media source should restore"
  );
  assert.equal(
    restoredKeywordStore.selectedIds.strategy,
    "stg-2",
    "Selected strategy should restore"
  );
  assert.equal(
    restoredKeywordStore.selectedIds.automationRun,
    "run-3",
    "Selected crawl run should restore"
  );
  assert.equal(restoredKeywordStore.ui.panel, "job", "Open panel should restore");

  const distributionStore = createRouteStateFixture();
  distributionStore.page = "distribution";
  distributionStore.tabs.distribution = "records";
  distributionStore.filters.distribution.query = "知乎";
  distributionStore.filters.distribution.status = "published";
  distributionStore.selectedIds.task = "task-4";
  distributionStore.ui.panel = "publish";

  const distributionHash = serializeRouteState(distributionStore);
  assert.match(distributionHash, /distributionTab=records/, "Distribution tab should serialize");
  assert.match(distributionHash, /distributionStatus=published/, "Distribution status should serialize");
  assert.match(distributionHash, /taskId=task-4/, "Selected task should serialize");
  assert.match(distributionHash, /panel=publish/, "Publish panel should serialize");

  const restoredDistributionStore = createRouteStateFixture();
  applyRouteState(restoredDistributionStore, `#${distributionHash}`);
  assert.equal(restoredDistributionStore.page, "distribution", "Distribution page should restore");
  assert.equal(
    restoredDistributionStore.tabs.distribution,
    "records",
    "Distribution tab should restore"
  );
  assert.equal(
    restoredDistributionStore.filters.distribution.query,
    "知乎",
    "Distribution query should restore"
  );
  assert.equal(
    restoredDistributionStore.filters.distribution.status,
    "published",
    "Distribution status should restore"
  );
  assert.equal(restoredDistributionStore.selectedIds.task, "task-4", "Selected task should restore");
  assert.equal(restoredDistributionStore.ui.panel, "publish", "Publish panel should restore");
}

function runExperienceChecks() {
  const passPayload = buildReviewPayload("pass", "");
  assert.equal(passPayload.comments, "结构完整，可进入待发布。", "Pass review should use default comment");
  assert.deepEqual(passPayload.reasonCodes, [], "Pass review should not include reason codes");

  const rejectPayload = buildReviewPayload("reject", "品牌表达还不够具体");
  assert.equal(rejectPayload.comments, "品牌表达还不够具体", "Reject review should keep typed comments");
  assert.deepEqual(
    rejectPayload.reasonCodes,
    ["brand_expression"],
    "Reject review should keep brand reason code"
  );

  const blockedPublish = resolvePublishPanelState({
    articles: [
      {
        id: "ar-2",
        title: "待审核文章",
        review_status: "review_pending",
        publish_status: "draft",
        target_channel_types: ["zhihu_column"]
      },
      {
        id: "ar-9",
        title: "可发布文章",
        review_status: "review_pending",
        publish_status: "ready_to_publish",
        target_channel_types: ["website_blog"]
      }
    ],
    channels: [
      { id: "ch-1", channel_type: "zhihu_column" },
      { id: "ch-2", channel_type: "website_blog" }
    ],
    articleId: "ar-2",
    currentForm: {
      name: "默认发布任务",
      channel_id: "ch-1",
      article_ids: []
    }
  });
  assert.equal(blockedPublish.blocked, true, "Draft article should block publish panel");
  assert.equal(
    blockedPublish.redirectTab,
    "reviews",
    "Review-pending article should redirect back to review queue"
  );

  const readyPublish = resolvePublishPanelState({
    articles: [
      {
        id: "ar-9",
        title: "可发布文章",
        review_status: "review_pending",
        publish_status: "ready_to_publish",
        target_channel_types: ["website_blog"]
      }
    ],
    channels: [
      { id: "ch-1", channel_type: "zhihu_column" },
      { id: "ch-2", channel_type: "website_blog" }
    ],
    articleId: "ar-9",
    currentForm: {
      name: "默认发布任务",
      channel_id: "ch-1",
      article_ids: []
    }
  });
  assert.equal(readyPublish.blocked, false, "Ready article should open publish panel");
  assert.equal(readyPublish.form.channel_id, "ch-2", "Ready article should prefer matching channel");
  assert.deepEqual(
    readyPublish.form.article_ids,
    ["ar-9"],
    "Ready article should be preselected in publish panel"
  );

  const keywordSearchStore = createRouteStateFixture();
  keywordSearchStore.page = "keywords";
  applyPageSearch(keywordSearchStore, "私有化");
  assert.equal(
    keywordSearchStore.filters.keywords.query,
    "私有化",
    "Topbar search should drive keyword query on keyword page"
  );
  assert.equal(
    getActiveSearchValue(keywordSearchStore),
    "私有化",
    "Topbar search value should reflect keyword query"
  );

  const contentSearchStore = createRouteStateFixture();
  contentSearchStore.page = "content";
  applyPageSearch(contentSearchStore, "品牌表达");
  assert.equal(
    contentSearchStore.filters.content.query,
    "品牌表达",
    "Topbar search should drive content query on content page"
  );

  const panelStore = createRouteStateFixture();
  panelStore.ui.panel = "publish";
  assert.equal(
    closePanelForPageChange(panelStore, "content"),
    true,
    "Cross-page navigation should close publish panel"
  );
  assert.equal(panelStore.ui.panel, "", "Publish panel should clear on content navigation");

  panelStore.ui.panel = "job";
  assert.equal(
    closePanelForPageChange(panelStore, "keywords"),
    false,
    "Keyword page should retain keyword-side panel"
  );

  const selectionStore = createRouteStateFixture();
  selectionStore.page = "content";
  selectionStore.tabs.content = "articles";
  selectionStore.filters.content.query = "已发布";
  selectionStore.selectedIds.article = "ar-hidden";
  selectionStore.data = {
    keywords: [
      { id: "kw-1", keyword: "中国智能体平台" }
    ],
    topics: [],
    articles: [
      {
        id: "ar-visible",
        title: "已发布文章",
        subtitle: "品牌表达",
        keyword_id: "kw-1",
        article_type: "article",
        review_status: "review_pending",
        publish_status: "published"
      },
      {
        id: "ar-hidden",
        title: "草稿文章",
        subtitle: "内部版本",
        keyword_id: "kw-1",
        article_type: "article",
        review_status: "review_pending",
        publish_status: "draft"
      }
    ],
    publishTasks: [],
    modelConfigs: [],
    channels: [],
    mediaSources: [],
    automationProviders: [],
    sourceStrategies: [],
    automationRuns: []
  };
  assert.equal(
    normalizeStoreSelections(selectionStore),
    true,
    "Selection normalization should report changes when current article is filtered out"
  );
  assert.equal(
    selectionStore.selectedIds.article,
    "ar-visible",
    "Selection normalization should move article focus to the first visible item"
  );

  const reviewSelectionStore = createRouteStateFixture();
  reviewSelectionStore.page = "content";
  reviewSelectionStore.tabs.content = "reviews";
  reviewSelectionStore.selectedIds.review = "ar-missing";
  reviewSelectionStore.data = {
    keywords: [],
    topics: [],
    articles: [
      {
        id: "ar-review",
        title: "待审核文章",
        review_status: "review_pending",
        publish_status: "draft"
      }
    ],
    publishTasks: [],
    modelConfigs: [],
    channels: [],
    mediaSources: [],
    automationProviders: [],
    sourceStrategies: [],
    automationRuns: []
  };
  normalizeStoreSelections(reviewSelectionStore);
  assert.equal(
    reviewSelectionStore.selectedIds.review,
    "ar-review",
    "Review tab should fall back to a visible pending review"
  );
  assert.equal(
    reviewSelectionStore.selectedIds.article,
    "ar-review",
    "Review tab should keep article selection aligned with the active review"
  );

  const batchStore = createRouteStateFixture();
  batchStore.page = "keywords";
  batchStore.filters.keywords.cluster = "购买决策";
  batchStore.data = {
    keywords: [
      {
        id: "kw-selected",
        keyword: "中国智能体平台怎么选",
        suggested_titles: [],
        intent: "decision",
        category: "decision",
        status: "selected"
      },
      {
        id: "kw-hidden",
        keyword: "智能体部署风险",
        suggested_titles: [],
        intent: "research",
        category: "deployment",
        status: "selected"
      }
    ]
  };
  assert.deepEqual(
    getSelectedOpportunityKeywordIds(batchStore),
    ["kw-selected"],
    "Batch topic generation should only use selected keywords visible under current filters"
  );

  const taskActionState = getPublishTaskActionState({
    status: "queued",
    items: [
      { status: "queued" },
      { status: "failed" }
    ]
  });
  assert.equal(taskActionState.canStart, true, "Queued task should be startable");
  assert.equal(taskActionState.canRetry, true, "Task with failures should support retry");
  assert.equal(taskActionState.canCancel, true, "Queued task should be cancelable");

  const completedTaskActionState = getPublishTaskActionState({
    status: "published",
    items: [
      { status: "published" }
    ]
  });
  assert.equal(completedTaskActionState.canStart, false, "Published task should not restart");
  assert.equal(completedTaskActionState.canCancel, false, "Published task should not cancel");
}

function runSettingsAuditUiChecks() {
  const html = renderSettings({
    tabs: {
      settings: "brand"
    },
    selectedIds: {},
    data: {
      brandProfile: {
        brand_name: "AgentCore OS",
        one_liner: "",
        core_value_props: [],
        forbidden_terms: [],
        glossary_terms: []
      },
      runtimeStatus: {
        persistence: {
          enabled: true,
          file: "/tmp/geo-pulse-state.json"
        },
        counts: {},
        scheduler: {},
        providers: {}
      },
      auditEvents: [
        {
          id: "aud-1",
          action: "auth.failure",
          resource_type: "api_request",
          resource_id: "/system/runtime/reset",
          created_at: "2026-07-05T10:00:00.000Z",
          details: {
            method: "POST",
            path: "/system/runtime/reset",
            reason: "invalid_or_missing_api_key"
          }
        },
        {
          id: "aud-2",
          action: "scheduler.tick",
          resource_type: "scheduler",
          resource_id: "automation_scheduler",
          created_at: "2026-07-05T10:01:00.000Z",
          details: {
            trigger: "manual",
            skipped_reason: "scheduler_disabled"
          }
        }
      ]
    }
  });

  assert.match(html, /审计日志/, "Settings page should show an audit log panel");
  assert.match(html, /auth\.failure/, "Settings audit log should render failed authorization events");
  assert.match(html, /scheduler\.tick/, "Settings audit log should render scheduler tick events");
  assert.match(html, /api_request/, "Settings audit log should render audit resource types");
  assert.match(html, /导出审计日志/, "Settings audit log should show an export action");
  assert.match(html, /\/api\/v1\/audit-events\/export\.csv/, "Settings audit export should link to the CSV endpoint");
  assert.doesNotMatch(html, /secret-token/, "Settings audit log should not expose secret token text");

  const staticHtml = renderSettings({
    tabs: {
      settings: "brand"
    },
    selectedIds: {},
    ui: {
      isStaticPreview: true
    },
    data: {
      brandProfile: {
        brand_name: "AgentCore OS",
        one_liner: "",
        core_value_props: [],
        forbidden_terms: [],
        glossary_terms: []
      },
      runtimeStatus: {
        persistence: {},
        counts: {},
        scheduler: {},
        providers: {}
      },
      auditEvents: [
        {
          id: "aud-static",
          action: "=cmd|calc",
          resource_type: "runtime",
          resource_id: "mock-data",
          actor_type: "system",
          actor_id: "local",
          created_at: "2026-07-05T10:02:00.000Z",
          details: {
            reason: "static_preview"
          }
        }
      ]
    }
  });

  assert.match(
    staticHtml,
    /href="data:text\/csv;charset=utf-8,/,
    "Static settings audit export should use an inline CSV download link"
  );
  assert.doesNotMatch(
    staticHtml,
    /href="\/api\/v1\/audit-events\/export\.csv"/,
    "Static settings audit export should not point at the live API endpoint"
  );
  assert.match(
    staticHtml,
    /%27%3Dcmd%7Ccalc/,
    "Static settings audit export should neutralize spreadsheet formula cells"
  );
}

function runSettingsAutomationStepUiChecks() {
  const html = renderSettings({
    tabs: {
      settings: "automation"
    },
    selectedIds: {
      strategy: "stg-ui",
      automationRun: "run-ui"
    },
    data: {
      sourceStrategies: [
        {
          id: "stg-ui",
          name: "权威媒体自动运营",
          source_scope: "authority_media",
          source_scope_label: "权威媒体",
          monitoring_goal: "authority_follow",
          monitoring_goal_label: "议题跟踪",
          schedule_mode: "manual",
          schedule_mode_label: "手动",
          review_policy: "manual_first",
          review_policy_label: "先审后发",
          publish_mode: "scheduled",
          default_channel_id: "ch-ui",
          min_word_count: 800,
          required_terms_count: 1,
          is_enabled: true,
          auto_generate_articles: true,
          auto_submit_review: true,
          auto_create_publish_task: false,
          block_on_forbidden_terms: true,
          allow_authority_direct_publish: false,
          consecutive_failures: 0
        }
      ],
      channels: [
        {
          id: "ch-ui",
          channel_name: "官网博客"
        }
      ],
      automationRuns: [
        {
          id: "run-ui",
          strategy_id: "stg-ui",
          status: "partial_failed",
          status_label: "部分失败",
          generated_question_count: 3,
          generated_topic_count: 2,
          generated_article_count: 1,
          auto_passed_count: 0,
          review_pending_count: 1,
          created_at: "2026-07-05T10:04:00.000Z",
          steps: [
            {
              id: "step-ui-crawl",
              run_id: "run-ui",
              step_type: "crawl",
              step_label: "内容源抓取",
              status: "succeeded",
              status_label: "已完成",
              provider_id: "local_question_expander",
              connector_id: "mock-source-connector",
              latency_ms: 128,
              input_preview: {
                source_scope: "authority_media"
              },
              output_preview: {
                question_count: 3
              },
              error_message: "",
              started_at: "2026-07-05T10:04:00.000Z",
              finished_at: "2026-07-05T10:04:01.000Z"
            },
            {
              id: "step-ui-review",
              run_id: "run-ui",
              step_type: "review",
              step_label: "审核守门",
              status: "warning",
              status_label: "需处理",
              provider_id: "",
              connector_id: "",
              latency_ms: 12,
              input_preview: {},
              output_preview: {
                review_pending_count: 1
              },
              error_message: "禁用词命中",
              started_at: "2026-07-05T10:04:02.000Z",
              finished_at: "2026-07-05T10:04:03.000Z"
            }
          ],
          event_logs: []
        }
      ]
    }
  });

  assert.match(html, /步骤时间线/, "Automation settings should render a structured step timeline");
  assert.match(html, /内容源抓取/, "Automation step timeline should render step labels");
  assert.match(html, /local_question_expander/, "Automation step timeline should render provider metadata");
  assert.match(html, /128 ms/, "Automation step timeline should render latency");
  assert.match(html, /禁用词命中/, "Automation step timeline should render step errors");
}

function runSettingsConnectorUiChecks() {
  const html = renderSettings({
    tabs: {
      settings: "providers"
    },
    selectedIds: {
      provider: "local_geo_writer"
    },
    data: {
      automationProviders: [
        {
          id: "local_geo_writer",
          label: "本地 GEO 写稿器",
          capability: "article_generation",
          type: "builtin",
          is_active: true,
          note: "本地写稿",
          config: {
            enabled: true
          },
          protocol: {
            capability: "article_generation",
            request: {
              required_fields: []
            },
            response: {
              required_fields: []
            },
            example_request_body: {},
            example_response_body: {}
          }
        }
      ],
      automationConnectors: [
        {
          id: "firecrawl_source",
          label: "Firecrawl 内容源连接器",
          connector_type: "source_connector",
          connector_type_label: "内容源",
          status: "ready",
          status_label: "可配置",
          is_enabled: false,
          scopes: ["crawl", "extract"],
          config: {
            endpoint: "mock://source-crawl",
            masked_api_key: "********key"
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
          scopes: ["schedule", "publish"],
          config: {
            endpoint: "mock://social-publish",
            masked_api_key: "********key"
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
          dangerous_actions: ["campaign:delete"],
          last_permission_audit: {
            status: "passed",
            status_label: "已通过",
            checked_at: "2026-07-05T10:05:00.000Z",
            findings: []
          },
          config: {
            endpoint: "mock://email-campaign",
            masked_api_key: "********key"
          }
        }
      ],
      providerInvocations: [],
      runtimeStatus: {
        providers: {
          invocation_summary: {}
        }
      }
    }
  });

  assert.match(html, /外部连接器/, "Provider settings should render connector registry");
  assert.match(html, /Firecrawl 内容源连接器/, "Connector registry should render source connector names");
  assert.match(html, /Postiz 社媒发布连接器/, "Connector registry should render social connector names");
  assert.match(html, /crawl, extract/, "Connector registry should render connector scopes");
  assert.match(html, /权限边界/, "Connector registry should render permission governance columns");
  assert.match(html, /凭据状态/, "Connector registry should render credential status");
  assert.match(html, /允许动作/, "Connector registry should render allowed action boundaries");
  assert.match(html, /危险动作/, "Connector registry should render dangerous action boundaries");
  assert.match(html, /campaign:send/, "Connector registry should render scoped send permissions");
  assert.match(html, /campaign:delete/, "Connector registry should render dangerous denied permissions");
  assert.doesNotMatch(html, /firecrawl-demo-key|postiz-demo-key/, "Connector registry should not expose raw connector secrets");
}

function runKeywordSourceAdapterUiChecks() {
  const html = renderKeywords({
    tabs: {
      keywords: "crawl"
    },
    filters: {
      keywords: {
        query: "",
        status: "all",
        form: "all",
        cluster: "all"
      }
    },
    selectedIds: {
      mediaSource: "src-ui",
      automationRun: ""
    },
    data: {
      keywords: [],
      mediaSources: [
        {
          id: "src-ui",
          source_name: "AgentCore 公众号",
          source_type: "owned_self_media",
          source_type_label: "自有自媒体",
          platform: "wechat_official",
          platform_label: "微信公众号",
          authority_tier: "owned",
          authority_tier_label: "自有资产",
          extraction_mode: "rss_like",
          extraction_mode_label: "文章标题与摘要抽取",
          adapter_contract_label: "RSS-like 标题摘要合同",
          adapter_contract_version: "v1",
          adapter_stages: ["fetch", "normalize", "dedupe", "score"],
          error_codes: ["source_timeout", "normalize_empty_title"],
          update_frequency: "daily",
          update_frequency_label: "日更",
          relevance_score: 94,
          status: "active",
          status_label: "正常",
          sample_topics: ["企业智能体落地"],
          last_crawled_at: "2026-07-05T10:12:00.000Z"
        }
      ],
      sourceStrategies: [],
      automationRuns: [],
      keywordJobs: [
        {
          id: "job-ui",
          name: "来源适配器验收",
          source_scope_label: "自有自媒体",
          monitoring_goal_label: "内容复用",
          industry_topic: "中国智能体",
          source_targets: ["AgentCore 公众号"],
          raw_count: 12,
          deduped_count: 7,
          status: "completed",
          status_label: "已完成",
          source_adapter_label: "RSS-like 标题摘要合同",
          source_adapter_version: "v1",
          quality_summary: {
            average_quality_score: 88,
            low_quality_count: 1
          },
          error_taxonomy: [
            {
              code: "source_timeout",
              label: "来源超时",
              severity: "warning"
            }
          ]
        }
      ]
    }
  });

  assert.match(html, /适配器契约/, "Keyword source library should render adapter contract context");
  assert.match(html, /RSS-like 标题摘要合同/, "Keyword source library should render adapter contract labels");
  assert.match(html, /fetch, normalize, dedupe, score/, "Keyword source library should render adapter stages");
  assert.match(html, /质量分/, "Keyword crawl jobs should render source quality scores");
  assert.match(html, /88/, "Keyword crawl jobs should render adapter quality values");
  assert.match(html, /错误分类/, "Keyword crawl jobs should render crawl error taxonomy");
  assert.match(html, /source_timeout/, "Keyword crawl jobs should render crawl error codes");
}

function runSettingsPromptTraceUiChecks() {
  const html = renderSettings({
    tabs: {
      settings: "models"
    },
    selectedIds: {
      model: "model-ui"
    },
    data: {
      modelConfigs: [
        {
          id: "model-ui",
          provider: "DeepSeek",
          provider_type: "兼容接口",
          model_name: "deepseek-chat",
          purpose: "article_generation",
          endpoint: "https://api.deepseek.example/v1",
          masked_api_key: "********key",
          temperature: 0.7,
          max_tokens: 4096,
          timeout_ms: 20000,
          status: "active",
          is_default: true,
          notes: ""
        }
      ],
      promptTemplates: [
        {
          id: "geo_article_draft",
          name: "GEO 文章初稿",
          purpose: "article_generation",
          active_version: 1,
          status: "active",
          status_label: "启用",
          updated_at: "2026-07-05T10:05:00.000Z"
        }
      ],
      contentQualityTraces: [
        {
          id: "qtrace-ui",
          article_id: "ar-ui",
          article_title: "企业智能体选型指南",
          prompt_template_id: "geo_article_draft",
          prompt_template_version: 1,
          model_config_id: "model-ui",
          provider_id: "remote_geo_writer",
          score: 88,
          status: "passed",
          status_label: "通过",
          created_at: "2026-07-05T10:06:00.000Z"
        }
      ]
    }
  });

  assert.match(html, /Prompt 模板/, "Model settings should render prompt templates");
  assert.match(html, /GEO 文章初稿/, "Prompt template table should render template names");
  assert.match(html, /质量 Trace/, "Model settings should render quality traces");
  assert.match(html, /企业智能体选型指南/, "Quality trace table should render article titles");
  assert.match(html, /88/, "Quality trace table should render scores");
}

function runDistributionPublishingOpsUiChecks() {
  const html = renderDistribution({
    tabs: {
      distribution: "tasks"
    },
    selectedIds: {
      task: "task-ui"
    },
    filters: {
      distribution: {
        query: "",
        status: "all"
      }
    },
    data: {
      channels: [
        {
          id: "ch-ui",
          channel_name: "官网博客"
        }
      ],
      publishRecords: [],
      publishTasks: [
        {
          id: "task-ui",
          name: "官网发布排期",
          channel_id: "ch-ui",
          channel: {
            channel_name: "官网博客"
          },
          total_count: 1,
          success_count: 0,
          failed_count: 0,
          manual_takeover_count: 0,
          publish_mode: "scheduled",
          publish_mode_label: "定时",
          scheduled_at: "2026-04-18T10:00:00+08:00",
          calendar_date: "2026-04-18",
          calendar_slot_label: "10:00",
          status: "queued",
          status_label: "排队中",
          approval_required: true,
          approval_status: "pending",
          approval_status_label: "待审批",
          approval_steps: [
            {
              id: "appr-ui",
              step_label: "运营负责人审批",
              status: "pending",
              status_label: "待审批",
              approver_name: "Luna"
            }
          ],
          adapter_label: "官网 CMS 适配器",
          items: [
            {
              id: "pti-ui",
              article_id: "ar-ui",
              article: {
                title: "企业智能体选型指南"
              },
              status: "queued",
              status_label: "排队中",
              template_label: "官网长文模板",
              adapter_label: "官网 CMS 适配器",
              attempt_count: 0,
              payload_preview: {
                title: "企业智能体选型指南"
              },
              post_variants: [
                {
                  id: "var-ui",
                  variant_type: "website_blog",
                  variant_label: "官网长文",
                  title: "企业智能体选型指南",
                  status: "ready",
                  status_label: "已就绪"
                }
              ],
              readiness_status: "ready",
              readiness_status_label: "已就绪",
              readiness_checks: [
                {
                  key: "title",
                  label: "标题",
                  status: "passed",
                  status_label: "已就绪"
                },
                {
                  key: "payload",
                  label: "渠道载荷",
                  status: "passed",
                  status_label: "已就绪"
                },
                {
                  key: "schedule",
                  label: "排期",
                  status: "passed",
                  status_label: "已就绪"
                }
              ]
            }
          ]
        }
      ]
    }
  });

  assert.match(html, /发布日历/, "Distribution tasks should render a publishing calendar panel");
  assert.match(html, /2026-04-18/, "Publishing calendar should render task dates");
  assert.match(html, /内容变体/, "Distribution task detail should render post variants");
  assert.match(html, /官网长文/, "Post variant list should render variant labels");
  assert.match(html, /就绪检查/, "Distribution task detail should render readiness checks");
  assert.match(html, /渠道载荷/, "Readiness checks should render check labels");
  assert.match(html, /审批状态/, "Distribution task detail should render approval status");
  assert.match(html, /待审批/, "Distribution task detail should render pending approval");
  assert.match(html, /审批通过/, "Distribution task detail should render approval action");
}

function runAnalyticsVisibilityUiChecks() {
  const html = renderAnalytics({
    tabs: {
      analytics: "visibility"
    },
    data: {
      analyticsKeywords: null,
      analyticsContent: null,
      analyticsChannels: null,
      analyticsVisibility: {
        summary: {
          tracked_queries: 3,
          top10_queries: 2,
          citation_mentions: 9,
          average_visibility_score: 76
        },
        tracked_queries: [
          {
            id: "visq-ui",
            query: "企业智能体平台怎么选",
            target_url: "https://agentcore.cn/blog/enterprise-agent-platform",
            engine: "google",
            engine_label: "Google",
            source_type_label: "搜索结果",
            status_label: "监控中",
            latest_snapshot: {
              rank_position: 4,
              citation_count: 3,
              visibility_score: 82,
              captured_at: "2026-04-18T09:00:00+08:00"
            }
          }
        ],
        snapshots: [
          {
            id: "viss-ui",
            query: "企业智能体平台怎么选",
            engine_label: "Google",
            rank_position: 4,
            citation_count: 3,
            visibility_score: 82,
            captured_at: "2026-04-18T09:00:00+08:00"
          }
        ],
        competitor_domains: [
          {
            domain: "dify.ai",
            source_type_label: "搜索结果",
            share_of_voice: 28,
            average_rank: 3.5,
            citation_count: 6
          }
        ],
        collection_runs: [
          {
            id: "visrun-ui",
            name: "外部可见度手动采集",
            trigger: "manual",
            trigger_label: "手动触发",
            status: "completed",
            status_label: "已完成",
            tracked_query_count: 3,
            snapshots_created: 3,
            competitor_domains_checked: 1,
            started_at: "2026-04-18T09:00:00+08:00",
            finished_at: "2026-04-18T09:02:00+08:00",
            steps: [
              {
                id: "visstep-ui-1",
                step_label: "抓取 SERP",
                status: "succeeded",
                status_label: "已完成",
                latency_ms: 480,
                output_preview: {
                  query_count: 3
                }
              }
            ]
          }
        ]
      }
    }
  });

  assert.match(html, /外部可见度/, "Analytics should render the visibility tab");
  assert.match(html, /企业智能体平台怎么选/, "Visibility UI should render tracked queries");
  assert.match(html, /agentcore\.cn\/blog\/enterprise-agent-platform/, "Visibility UI should render target URLs");
  assert.match(html, /dify\.ai/, "Visibility UI should render competitor domains");
  assert.match(html, /引用/, "Visibility UI should render citation metrics");
  assert.match(html, /采集运行/, "Visibility UI should render collection runs");
  assert.match(html, /运行采集/, "Visibility UI should render a collection trigger");
  assert.match(html, /抓取 SERP/, "Visibility UI should render collection run steps");
}

function runAnalyticsCampaignUiChecks() {
  const html = renderAnalytics({
    tabs: {
      analytics: "campaigns"
    },
    data: {
      analyticsKeywords: null,
      analyticsContent: null,
      analyticsChannels: null,
      analyticsVisibility: null,
      analyticsCampaigns: {
        summary: {
          active_segments: 3,
          active_campaigns: 2,
          total_recipients: 1280,
          average_click_rate: 12
        },
        segments: [
          {
            id: "seg-ui",
            segment_name: "企业智能体决策人群",
            source_label: "内容订阅",
            member_count: 860,
            status_label: "正常"
          }
        ],
        campaigns: [
          {
            id: "camp-ui",
            campaign_name: "企业智能体选型内容培育",
            segment_name: "企业智能体决策人群",
            status_label: "运行中",
            subject: "企业智能体平台怎么选",
            send_count: 860,
            open_rate: 38,
            click_rate: 12
          }
        ],
        campaign_runs: [
          {
            id: "camprun-ui",
            campaign_name: "企业智能体选型内容培育",
            trigger_label: "手动触发",
            status_label: "已完成",
            sent_count: 860,
            open_count: 327,
            click_count: 103,
            steps: [
              {
                id: "campstep-ui",
                step_label: "匹配受众分群",
                status_label: "已完成",
                output_preview: {
                  recipients: 860
                }
              }
            ]
          }
        ]
      }
    }
  });

  assert.match(html, /自有活动/, "Analytics should render campaign tab");
  assert.match(html, /企业智能体决策人群/, "Campaign UI should render audience segments");
  assert.match(html, /企业智能体选型内容培育/, "Campaign UI should render campaigns");
  assert.match(html, /运行活动/, "Campaign UI should render a campaign run trigger");
  assert.match(html, /匹配受众分群/, "Campaign UI should render campaign run steps");
}

function runPersistenceChecks() {
  const tempFile = path.join(os.tmpdir(), `geo-pulse-state-${Date.now()}.json`);
  const baseEnv = {
    ...process.env,
    GEO_ENABLE_PERSISTENCE: "1",
    GEO_DATA_FILE: tempFile
  };

  const createResult = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        const mod = await import("./mock-data.mjs");
        const model = mod.createModelConfigAction({
          provider: "Moonshot",
          model_name: "kimi-k2",
          purpose: "question_expansion",
          is_default: false,
          status: "active"
        });
        const channel = mod.createChannelAction({
          channel_type: "wechat_official",
          channel_name: "验收公众号",
          auth_status: "pending"
        });
        console.log(JSON.stringify({
          persistence: mod.getPersistenceStatus(),
          modelId: model.id,
          channelId: channel.id
        }));
      `
    ],
    {
      cwd: process.cwd(),
      env: baseEnv,
      encoding: "utf8"
    }
  );

  assert.equal(
    createResult.status,
    0,
    `Persistence setup failed\n${createResult.stderr || createResult.stdout}`
  );

  const createdPayload = JSON.parse(createResult.stdout.trim());
  assert.equal(createdPayload.persistence.enabled, true, "Persistence should be enabled in child process");
  assert.equal(createdPayload.persistence.file, tempFile, "Persistence file path should match override");
  assert.ok(fs.existsSync(tempFile), "Persistence file should be created on disk");
  const persistedBeforeFailure = JSON.parse(fs.readFileSync(tempFile, "utf8"));
  persistedBeforeFailure.sentinel = "keep-existing-state";
  fs.writeFileSync(tempFile, JSON.stringify(persistedBeforeFailure, null, 2));

  const reloadResult = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        const mod = await import("./mock-data.mjs");
        const models = mod.listModelConfigs();
        const channels = mod.listChannels();
        console.log(JSON.stringify({
          hasModel: models.items.some((item) => item.provider === "Moonshot" && item.model_name === "kimi-k2"),
          hasChannel: channels.items.some((item) => item.channel_name === "验收公众号")
        }));
      `
    ],
    {
      cwd: process.cwd(),
      env: baseEnv,
      encoding: "utf8"
    }
  );

  try {
    assert.equal(
      reloadResult.status,
      0,
      `Persistence reload failed\n${reloadResult.stderr || reloadResult.stdout}`
    );

    const restoredPayload = JSON.parse(reloadResult.stdout.trim());
    assert.equal(restoredPayload.hasModel, true, "Persisted model config should reload from disk");
    assert.equal(restoredPayload.hasChannel, true, "Persisted channel should reload from disk");

    const failedPersistResult = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
          const mod = await import("./mock-data.mjs");
          mod.createChannelAction({
            channel_type: "website_blog",
            channel_name: "原子写失败测试",
            auth_status: "pending"
          });
        `
      ],
      {
        cwd: process.cwd(),
        env: {
          ...baseEnv,
          GEO_SIMULATE_PERSIST_RENAME_FAILURE: "1"
        },
        encoding: "utf8"
      }
    );

    assert.notEqual(
      failedPersistResult.status,
      0,
      "Simulated atomic rename failure should fail the mutating action"
    );

    const persistedAfterFailure = JSON.parse(fs.readFileSync(tempFile, "utf8"));
    assert.equal(
      persistedAfterFailure.sentinel,
      "keep-existing-state",
      "Failed persistence write should preserve the previous complete state file"
    );
    assert.equal(
      persistedAfterFailure.channels.some((item) => item.channel_name === "原子写失败测试"),
      false,
      "Failed persistence write should not partially write new state into the existing file"
    );

    const resetResult = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
          const mod = await import("./mock-data.mjs");
          const status = mod.resetRuntimeState();
          const models = mod.listModelConfigs();
          const channels = mod.listChannels();
          console.log(JSON.stringify({
            status,
            hasModel: models.items.some((item) => item.provider === "Moonshot" && item.model_name === "kimi-k2"),
            hasChannel: channels.items.some((item) => item.channel_name === "验收公众号"),
            modelCount: models.total,
            channelCount: channels.total
          }));
        `
      ],
      {
        cwd: process.cwd(),
        env: baseEnv,
        encoding: "utf8"
      }
    );

    assert.equal(
      resetResult.status,
      0,
      `Persistence reset failed\n${resetResult.stderr || resetResult.stdout}`
    );

    const resetPayload = JSON.parse(resetResult.stdout.trim());
    assert.equal(resetPayload.status.persistence.enabled, true, "Reset status should still report persistence");
    assert.equal(resetPayload.hasModel, false, "Reset should remove persisted custom model");
    assert.equal(resetPayload.hasChannel, false, "Reset should remove persisted custom channel");
    assert.equal(resetPayload.modelCount, 3, "Reset should restore seed model count");
    assert.equal(resetPayload.channelCount, 3, "Reset should restore seed channel count");
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
}

function waitForServerReady(child, port) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start on port ${port}\n${output}`));
    }, 5000);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes(`http://localhost:${port}`)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited before ready with code ${code}\n${output}`));
    });
  });
}

function httpRequest(port, pathName, options = {}) {
  const {
    method = "GET",
    headers = {},
    body = undefined
  } = options;

  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathName,
        method,
        headers
      },
      (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          let payload = null;
          try {
            payload = raw ? JSON.parse(raw) : null;
          } catch {
            payload = raw;
          }
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: payload
          });
        });
      }
    );

    request.on("error", reject);
    if (body !== undefined) {
      request.write(body);
    }
    request.end();
  });
}

async function runHttpSecurityChecks() {
  const port = 3300 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_MAX_BODY_BYTES: "1024",
      GEO_MUTATION_RATE_LIMIT_PER_MINUTE: "2"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(child, port);

    const runtime = await httpRequest(port, "/api/v1/system/runtime", {
      headers: {
        Origin: "http://evil.example"
      }
    });
    assert.equal(runtime.status, 200, "Runtime GET should remain readable for local prototype use");
    assert.equal(
      runtime.headers["x-content-type-options"],
      "nosniff",
      "API responses should include nosniff"
    );
    assert.equal(
      runtime.headers["cache-control"],
      "no-store",
      "API responses should not be cached"
    );
    assert.notEqual(
      runtime.headers["access-control-allow-origin"],
      "*",
      "API responses should not allow all origins"
    );
    assert.equal(
      runtime.body?.data?.scheduler?.enabled,
      false,
      "Automation scheduler should be disabled by default"
    );

    const unauthorizedReset = await httpRequest(port, "/api/v1/system/runtime/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    assert.equal(unauthorizedReset.status, 401, "Mutating API routes should require an API key by default");

    const failedAuthEvents = await httpRequest(port, "/api/v1/audit-events?action=auth.failure");
    assert.equal(failedAuthEvents.status, 200, "Failed authorization events should be queryable");
    assert.equal(
      failedAuthEvents.body?.data?.items?.[0]?.action,
      "auth.failure",
      "Failed mutating authorization should be recorded as an audit event"
    );
    assert.equal(
      failedAuthEvents.body?.data?.items?.[0]?.resource_type,
      "api_request",
      "Failed authorization audit event should identify the API request resource"
    );

    const clientConfig = await httpRequest(port, "/api/v1/system/client-config");
    assert.equal(clientConfig.status, 200, "Client config should be readable by the same-origin app");
    assert.equal(
      clientConfig.body?.data?.mutation_auth_required,
      true,
      "Client config should report mutation auth requirement"
    );
    assert.ok(
      clientConfig.body?.data?.mutation_api_key,
      "Client config should provide the same-origin app with a startup mutation API key"
    );

    const connectors = await httpRequest(port, "/api/v1/automation-connectors");
    assert.equal(connectors.status, 200, "Automation connector registry should be queryable over the API");
    assert.ok(
      connectors.body?.data?.items?.some((item) => item.connector_type === "source_connector"),
      "Automation connector API should include source connectors"
    );
    assert.doesNotMatch(
      JSON.stringify(connectors.body?.data || {}),
      /firecrawl-demo-key|postiz-demo-key|mailtrain-demo-key/,
      "Automation connector API should not expose raw connector secrets"
    );

    const promptTemplates = await httpRequest(port, "/api/v1/prompt-templates");
    assert.equal(promptTemplates.status, 200, "Prompt template registry should be queryable over the API");
    assert.ok(
      promptTemplates.body?.data?.items?.some((item) => item.id === "geo_article_draft"),
      "Prompt template API should include the article draft template"
    );

    const qualityTraces = await httpRequest(port, "/api/v1/content-quality-traces");
    assert.equal(qualityTraces.status, 200, "Content quality traces should be queryable over the API");

    const authorizedReset = await httpRequest(port, "/api/v1/system/runtime/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GEO-API-Key": clientConfig.body.data.mutation_api_key
      },
      body: "{}"
    });
    assert.equal(authorizedReset.status, 200, "Mutating API routes should accept the startup API key");

    const auditEvents = await httpRequest(port, "/api/v1/audit-events?action=runtime.reset");
    assert.equal(auditEvents.status, 200, "Audit events should be queryable over the API");
    assert.equal(
      auditEvents.body?.data?.items?.[0]?.action,
      "runtime.reset",
      "Audit events API should include the runtime reset event"
    );

    const auditExport = await httpRequest(port, "/api/v1/audit-events/export.csv?action=runtime.reset");
    assert.equal(auditExport.status, 200, "Audit events should be exportable as CSV");
    assert.match(
      auditExport.headers["content-type"] || "",
      /text\/csv/,
      "Audit CSV export should use text/csv content type"
    );
    assert.match(
      auditExport.headers["content-disposition"] || "",
      /attachment; filename="geo-pulse-audit-events.csv"/,
      "Audit CSV export should be served as an attachment"
    );
    assert.match(String(auditExport.body), /action,resource_type,resource_id/, "Audit CSV should include headers");
    assert.match(String(auditExport.body), /runtime\.reset/, "Audit CSV should include filtered audit events");
    assert.doesNotMatch(String(auditExport.body), /mutation_api_key|fixed-remote-token|demo-secret-key/, "Audit CSV should not expose secrets");

    const secondWrite = await httpRequest(port, "/api/v1/brand-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-GEO-API-Key": clientConfig.body.data.mutation_api_key
      },
      body: JSON.stringify({
        brand_name: "限流验收品牌"
      })
    });
    assert.equal(secondWrite.status, 200, "Second mutating request within the window should be accepted");

    const rateLimitedWrite = await httpRequest(port, "/api/v1/brand-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-GEO-API-Key": clientConfig.body.data.mutation_api_key
      },
      body: JSON.stringify({
        brand_name: "应被限流"
      })
    });
    assert.equal(rateLimitedWrite.status, 429, "Mutating API should rate limit requests over the configured threshold");
    assert.equal(
      rateLimitedWrite.headers["retry-after"],
      "60",
      "Rate limited responses should expose a retry-after hint"
    );

    const oversizedBody = JSON.stringify({
      brand_name: "A".repeat(2048)
    });
    const oversized = await httpRequest(port, "/api/v1/brand-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(oversizedBody),
        "X-GEO-API-Key": clientConfig.body.data.mutation_api_key
      },
      body: oversizedBody
    });
    assert.equal(oversized.status, 413, "API should reject request bodies over GEO_MAX_BODY_BYTES");

    const html = await httpRequest(port, "/");
    assert.equal(html.status, 200, "Static index should be served");
    assert.equal(
      html.headers["x-content-type-options"],
      "nosniff",
      "Static responses should include nosniff"
    );
    assert.equal(
      html.headers["cache-control"],
      "no-store",
      "Static HTML should not be cached"
    );
    const contentSecurityPolicy = html.headers["content-security-policy"] || "";
    assert.match(
      contentSecurityPolicy,
      /default-src 'self'/,
      "Static HTML should include a default self CSP"
    );
    assert.match(
      contentSecurityPolicy,
      /object-src 'none'/,
      "Static HTML CSP should block plugin/object content"
    );
    assert.doesNotMatch(
      contentSecurityPolicy,
      /script-src[^;]*'unsafe-inline'/,
      "Static HTML CSP should not allow unsafe inline scripts"
    );
    const nonceMatch = contentSecurityPolicy.match(/script-src[^;]*'nonce-([^']+)'/);
    assert.ok(nonceMatch?.[1], "Static HTML CSP should authorize inline scripts with a nonce");
    assert.match(
      String(html.body),
      new RegExp(`<script nonce="${nonceMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`),
      "Static HTML inline script should carry the CSP nonce from the response"
    );
  } finally {
    child.kill("SIGTERM");
  }
}

async function runSchedulerAuditChecks() {
  const port = 3600 + Math.floor(Math.random() * 300);
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_MUTATION_RATE_LIMIT_PER_MINUTE: "20"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(child, port);

    const clientConfig = await httpRequest(port, "/api/v1/system/client-config");
    assert.equal(clientConfig.status, 200, "Scheduler audit test should load client config");

    const tick = await httpRequest(port, "/api/v1/system/runtime/scheduler/tick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GEO-API-Key": clientConfig.body.data.mutation_api_key
      },
      body: JSON.stringify({})
    });
    assert.equal(tick.status, 200, "Manual scheduler tick should be callable");

    const auditEvents = await httpRequest(port, "/api/v1/audit-events?action=scheduler.tick");
    assert.equal(auditEvents.status, 200, "Scheduler audit events should be queryable");
    assert.equal(
      auditEvents.body?.data?.items?.[0]?.action,
      "scheduler.tick",
      "Scheduler tick should be recorded in audit events"
    );
    assert.equal(
      auditEvents.body?.data?.items?.[0]?.resource_type,
      "scheduler",
      "Scheduler tick audit event should identify the scheduler resource"
    );
  } finally {
    child.kill("SIGTERM");
  }
}

async function runAuditCsvSpreadsheetSafetyChecks() {
  const port = 4500 + Math.floor(Math.random() * 300);
  const tempFile = path.join(os.tmpdir(), `geo-pulse-audit-csv-${Date.now()}.json`);
  fs.writeFileSync(
    tempFile,
    JSON.stringify(
      {
        auditEvents: [
          {
            id: "aud-formula",
            created_at: "2026-07-05T10:03:00.000Z",
            action: "=cmd|calc",
            resource_type: "+api_request",
            resource_id: "-runtime",
            actor_type: "@system",
            actor_id: "\tlocal",
            details: {
              reason: "=dangerous"
            }
          }
        ]
      },
      null,
      2
    )
  );

  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      GEO_ENABLE_PERSISTENCE: "1",
      GEO_DATA_FILE: tempFile
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(child, port);

    const auditExport = await httpRequest(port, "/api/v1/audit-events/export.csv");
    assert.equal(auditExport.status, 200, "Audit CSV spreadsheet safety test should export CSV");
    assert.match(String(auditExport.body), /"'=cmd\|calc"/, "Audit CSV should neutralize formula action cells");
    assert.match(String(auditExport.body), /"'\+api_request"/, "Audit CSV should neutralize plus-prefixed cells");
    assert.match(String(auditExport.body), /"'-runtime"/, "Audit CSV should neutralize minus-prefixed cells");
    assert.match(String(auditExport.body), /"'@system"/, "Audit CSV should neutralize at-prefixed cells");
    assert.match(String(auditExport.body), /"'\tlocal"/, "Audit CSV should neutralize tab-prefixed cells");
    assert.match(String(auditExport.body), /'=dangerous/, "Audit CSV should neutralize formula values inside details JSON");
  } finally {
    child.kill("SIGTERM");
    fs.rmSync(tempFile, { force: true });
  }
}

async function runRemoteAccessSecurityChecks() {
  const unsafePort = 3900 + Math.floor(Math.random() * 300);
  const unsafeChild = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(unsafePort),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_ALLOW_REMOTE_ACCESS: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const unsafeResult = await new Promise((resolve) => {
    let output = "";
    const timer = setTimeout(() => {
      unsafeChild.kill("SIGTERM");
      resolve({ code: null, output });
    }, 3000);
    unsafeChild.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    unsafeChild.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    unsafeChild.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });

  assert.notEqual(
    unsafeResult.code,
    0,
    "Remote access should not start without a fixed GEO_INTERNAL_API_KEY"
  );
  assert.match(
    unsafeResult.output,
    /GEO_INTERNAL_API_KEY/,
    "Unsafe remote access startup failure should explain the missing fixed key"
  );

  const safePort = 4200 + Math.floor(Math.random() * 300);
  const safeChild = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(safePort),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_ALLOW_REMOTE_ACCESS: "1",
      GEO_INTERNAL_API_KEY: "fixed-remote-token"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(safeChild, safePort);
    const clientConfig = await httpRequest(safePort, "/api/v1/system/client-config");
    assert.equal(clientConfig.status, 200, "Remote-safe server should expose client config");
    assert.equal(
      clientConfig.body?.data?.mutation_api_key,
      "",
      "Remote access mode should not expose the fixed mutation API key"
    );

    const unauthorizedReset = await httpRequest(safePort, "/api/v1/system/runtime/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    assert.equal(unauthorizedReset.status, 401, "Remote access mode should reject writes without fixed key");

    const authorizedReset = await httpRequest(safePort, "/api/v1/system/runtime/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GEO-API-Key": "fixed-remote-token"
      },
      body: "{}"
    });
    assert.equal(authorizedReset.status, 200, "Remote access mode should accept the fixed key");

    const unauthorizedAuditEvents = await httpRequest(safePort, "/api/v1/audit-events");
    assert.equal(
      unauthorizedAuditEvents.status,
      401,
      "Remote access mode should reject audit event reads without fixed key"
    );

    const authorizedAuditEvents = await httpRequest(safePort, "/api/v1/audit-events", {
      headers: {
        "X-GEO-API-Key": "fixed-remote-token"
      }
    });
    assert.equal(
      authorizedAuditEvents.status,
      200,
      "Remote access mode should accept audit event reads with fixed key"
    );

    const unauthorizedAuditExport = await httpRequest(safePort, "/api/v1/audit-events/export.csv");
    assert.equal(
      unauthorizedAuditExport.status,
      401,
      "Remote access mode should reject audit CSV export without fixed key"
    );

    const authorizedAuditExport = await httpRequest(safePort, "/api/v1/audit-events/export.csv", {
      headers: {
        "X-GEO-API-Key": "fixed-remote-token"
      }
    });
    assert.equal(
      authorizedAuditExport.status,
      200,
      "Remote access mode should accept audit CSV export with fixed key"
    );
  } finally {
    safeChild.kill("SIGTERM");
  }
}

try {
  runSyntaxChecks();
  await runMockDataChecks();
  runRouteStateChecks();
  runExperienceChecks();
  runSettingsAuditUiChecks();
  runSettingsAutomationStepUiChecks();
  runSettingsConnectorUiChecks();
  runKeywordSourceAdapterUiChecks();
  runSettingsPromptTraceUiChecks();
  runDistributionPublishingOpsUiChecks();
  runAnalyticsVisibilityUiChecks();
  runAnalyticsCampaignUiChecks();
  runPersistenceChecks();
  await runHttpSecurityChecks();
  await runSchedulerAuditChecks();
  await runAuditCsvSpreadsheetSafetyChecks();
  await runRemoteAccessSecurityChecks();
  console.log("verify-mvp: OK");
} catch (error) {
  console.error("verify-mvp: FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
