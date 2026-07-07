import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import {
  authenticateUserAction,
  applyInternationalGeoSiteAuditCrawlEvidenceAction,
  createArticleAction,
  createArticleFromTopicAction,
  createChannelAction,
  createContentTemplateAction,
  createExportJobAction,
  createInternationalGeoVisibilityPromptSetAction,
  createInternationalGeoSiteAuditAction,
  createMediaSourceAction,
  createModelConfigAction,
  createPublishTaskAction,
  createRuntimeBackupAction,
  createKeywordCrawlJobAction,
  createTopicIdeaAction,
  createTopicIdeasFromKeywords,
  evaluateConnectorPermission,
  generateInternationalGeoPublishingPackagesAction,
  generateInternationalGeoEvidenceAssetsAction,
  generateInternationalGeoArtifactsAction,
  generateInternationalGeoSiteAuditAssetsAction,
  generateTopicOutlineAction,
  getArticle,
  getAutomationConnector,
  getAutomationRun,
  getAutomationProviderConfig,
  getBrandProfile,
  getBillingSummary,
  getDashboardSummary,
  getExportJobDownload,
  getCampaignAnalytics,
  getInternationalGeoState,
  getInternationalGeoEvidenceAssetsState,
  getInternationalGeoPublishingState,
  getInternationalGeoVisibilityState,
  getInternationalGeoSiteAudit,
  getKeyword,
  getPromptTemplate,
  getPublishTask,
  getRuntimeBackupDownload,
  getRuntimeStatus,
  getSourceStrategy,
  getSourceAdapterContract,
  getTopicIdea,
  getVisibilityAnalytics,
  getConnectorPermissionMatrix,
  getWorkspaceInput,
  listUsers,
  listAutomationConnectors,
  listAutomationProviders,
  listAuditEvents,
  listAutomationRuns,
  listArticles,
  listContentTemplates,
  listConnectorHealthChecks,
  listConnectorDiagnostics,
  listInternationalGeoSiteAudits,
  listMediaSources,
  listProviderInvocations,
  listSourceAdapterContracts,
  listContentQualityTraces,
  listAudienceSegments,
  listMarketingCampaigns,
  listPromptTemplates,
  listRuntimeBackups,
  listSourceStrategies,
  listTopicIdeas,
  logoutSessionAction,
  reconnectChannelAction,
  resetRuntimeState,
  reviewArticleAction,
  reviewInternationalGeoEvidenceAssetAction,
  reviewInternationalGeoPublishingPackageAction,
  approvePublishTaskAction,
  crawlInternationalGeoSiteAuditAction,
  runInternationalGeoAuditAction,
  runInternationalGeoVisibilityMeasurementAction,
  retryAutomationRunAction,
  runVisibilityCollectionAction,
  runSourceStrategyAction,
  runMarketingCampaignAction,
  runConnectorDiagnosticAction,
  saveAutomationProviderAction,
  saveAutomationConnectorAction,
  saveBrandProfileAction,
  saveChannelAction,
  saveInternationalGeoInputAction,
  saveMediaSourceAction,
  saveModelConfigAction,
  saveSourceStrategyAction,
  saveWorkspaceInputAction,
  startPublishTaskAction,
  submitArticleReviewAction,
  takeoverPublishTaskItemAction,
  testAutomationConnectorAction,
  testAutomationProviderAction,
  updateBillingPlanAction,
  updateArticleAction,
  updateInternationalGeoPublishingTrackingAction,
  updateTopicIdeaAction,
  updateKeywordAction,
  verifyUserPassword,
  validateRuntimeBackupImportAction,
  validateRuntimeBackupAction,
  validateInternationalGeoVisibilitySnapshot,
  importRuntimeBackupAction,
  restoreRuntimeBackupAction
} from "./mock-data.mjs";
import {
  crawlInternationalGeoSite,
  normalizeCrawlTarget,
  validateCrawlTarget
} from "./site-crawl.mjs";
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
import { navigation } from "./prototype/src/config.js";
import { renderAnalytics } from "./prototype/src/pages/analytics.js";
import { renderBilling } from "./prototype/src/pages/billing.js";
import { renderContent } from "./prototype/src/pages/content.js";
import { renderDistribution } from "./prototype/src/pages/distribution.js";
import { renderInternationalGeo } from "./prototype/src/pages/international.js";
import { renderKeywords } from "./prototype/src/pages/keywords.js";
import { renderSettings } from "./prototype/src/pages/settings.js";
import { renderApp } from "./prototype/src/render.js";

const syntaxTargets = [
  "automation-providers.mjs",
  "server.mjs",
  "mock-data.mjs",
  "prototype/app.js",
  "prototype/robots.js",
  "prototype/sitemap.js",
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
  "prototype/src/pages/international.js",
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

function runSingleUserSourceChecks() {
  const sourceFiles = [
    "prototype/src/api.js",
    "prototype/src/components.js",
    "prototype/src/events.js",
    "prototype/src/main.js",
    "prototype/src/pages/analytics.js",
    "prototype/src/pages/billing.js",
    "prototype/src/pages/content.js",
    "prototype/src/pages/distribution.js",
    "prototype/src/pages/international.js",
    "prototype/src/pages/keywords.js"
  ];
  const combined = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const apiSource = fs.readFileSync("prototype/src/api.js", "utf8");
  const eventsSource = fs.readFileSync("prototype/src/events.js", "utf8");
  const mainSource = fs.readFileSync("prototype/src/main.js", "utf8");
  assert.doesNotMatch(
    combined,
    /即将开放|Read-only MVP/,
    "Single-user v0.3 source should not contain coming-soon or read-only workflow buttons"
  );
  assert.match(
    combined,
    /export function runInternationalGeoVisibilityMeasurement/,
    "International GEO visibility run button should have a client API method"
  );
  assert.match(
    combined,
    /runInternationalGeoVisibilityMeasurementApi/,
    "International GEO visibility run should be imported into the browser action layer"
  );
  assert.match(
    combined,
    /runInternationalGeoVisibilityMeasurement\(\)/,
    "International GEO visibility run should have a browser action handler"
  );
  assert.match(
    combined,
    /action === "international-visibility-run"/,
    "International GEO visibility run data-action should be wired in the event dispatcher"
  );
  assert.match(
    apiSource,
    /export function getInternationalGeoEvidenceAssets\(\)/,
    "International GEO evidence assets should have a read client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoEvidenceAssets\(\)/,
    "International GEO evidence assets should have a generate client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoEvidenceAsset\(assetId, payload = \{\}\)/,
    "International GEO evidence assets should have a review client API method"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoEvidenceAssets as generateInternationalGeoEvidenceAssetsApi/,
    "International GEO evidence asset generation should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-evidence-assets-generate"/,
    "International GEO evidence asset generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-evidence-asset-approve"/,
    "International GEO evidence asset approval should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-evidence-asset-reject"/,
    "International GEO evidence asset rejection should be wired in the event dispatcher"
  );
  assert.match(
    apiSource,
    /export function getInternationalGeoPublishing\(\)/,
    "International GEO publishing workflow should have a read client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoPublishingPackages\(\)/,
    "International GEO publishing workflow should have a package generation client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoPublishingPackage\(packageId, payload = \{\}\)/,
    "International GEO publishing workflow should have a package review client API method"
  );
  assert.match(
    apiSource,
    /export function updateInternationalGeoPublishingTracking\(trackingId, payload = \{\}\)/,
    "International GEO publishing workflow should have a tracking update client API method"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoPublishingPackages as generateInternationalGeoPublishingPackagesApi/,
    "International GEO publishing package generation should be imported into the browser action layer"
  );
  assert.match(
    mainSource,
    /updateInternationalGeoPublishingTracking as updateInternationalGeoPublishingTrackingApi/,
    "International GEO publishing tracking update should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-packages-generate"/,
    "International GEO publishing package generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-package-approve"/,
    "International GEO publishing package approval should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-package-reject"/,
    "International GEO publishing package rejection should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-publishing-tracking-demo-update"/,
    "International GEO publishing tracking update should be wired in the event dispatcher"
  );
  assert.match(
    apiSource,
    /export function getInternationalGeoContentGeneration\(\)/,
    "International GEO content generation should have a read client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoArticles\(\)/,
    "International GEO article generation should have a client API method"
  );
  assert.match(
    apiSource,
    /export function generateInternationalGeoPlatformRewrites\(\)/,
    "International GEO platform rewrite generation should have a client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoGeneratedArticle\(articleId, payload = \{\}\)/,
    "International GEO generated article review should have a client API method"
  );
  assert.match(
    apiSource,
    /export function reviewInternationalGeoPlatformRewrite\(rewriteId, payload = \{\}\)/,
    "International GEO platform rewrite review should have a client API method"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoArticles as generateInternationalGeoArticlesApi/,
    "International GEO article generation should be imported into the browser action layer"
  );
  assert.match(
    mainSource,
    /generateInternationalGeoPlatformRewrites as generateInternationalGeoPlatformRewritesApi/,
    "International GEO platform rewrite generation should be imported into the browser action layer"
  );
  assert.match(
    eventsSource,
    /action === "international-content-articles-generate"/,
    "International GEO article generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-content-rewrites-generate"/,
    "International GEO platform rewrite generation should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-content-article-approve"/,
    "International GEO generated article approval should be wired in the event dispatcher"
  );
  assert.match(
    eventsSource,
    /action === "international-content-rewrite-approve"/,
    "International GEO platform rewrite approval should be wired in the event dispatcher"
  );
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
  const users = listUsers();
  assert.ok(
    users.items.some((item) => item.role === "owner" && item.status === "active"),
    "User directory should include an active owner"
  );
  assert.doesNotMatch(JSON.stringify(users), /password_hash/, "User list should not expose password hashes");
  assert.equal(
    verifyUserPassword("owner", "geo-owner-change-me"),
    true,
    "Bootstrap owner password should verify in local development"
  );
  assert.equal(
    verifyUserPassword("owner", "bad-password"),
    false,
    "Invalid owner password should not verify"
  );
  assert.equal(
    authenticateUserAction({ username: "owner", password: "bad-password" }),
    null,
    "Invalid login should return null"
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
  const savedConnector = saveAutomationConnectorAction("firecrawl_source", {
    is_enabled: true,
    status: "ready",
    endpoint: "mock://source-crawl-v4",
    api_key: "connector-secret-key",
    timeout_ms: 9000,
    retry_count: 1,
    notes: "验收连接器配置"
  });
  assert.equal(savedConnector?.is_enabled, true, "Connector enabled flag should be saved");
  assert.equal(savedConnector?.config?.endpoint, "mock://source-crawl-v4", "Connector endpoint should be saved");
  assert.equal(savedConnector?.config?.timeout_ms, 9000, "Connector timeout should be saved");
  assert.equal(savedConnector?.credential_status, "configured", "Connector key should mark credentials configured");
  assert.notEqual(
    getAutomationConnector("firecrawl_source")?.config?.api_key,
    "connector-secret-key",
    "Saved connector config should not expose raw API keys"
  );
  assert.match(
    getAutomationConnector("firecrawl_source")?.config?.masked_api_key || "",
    /\*+key$/,
    "Saved connector config should expose only a masked key hint"
  );
  assert.throws(
    () =>
      saveAutomationConnectorAction("firecrawl_source", {
        endpoint: "http://127.0.0.1:7788/internal"
      }),
    /not allowed|private|loopback/i,
    "Connector config should reject loopback endpoints"
  );
  const connectorTestSuccess = await testAutomationConnectorAction("firecrawl_source");
  assert.equal(connectorTestSuccess?.success, true, "Mock connector test should succeed");
  assert.equal(connectorTestSuccess?.schema_valid, true, "Mock connector test should validate local schema");
  assert.equal(
    getAutomationConnector("firecrawl_source")?.last_health_check?.success,
    true,
    "Connector detail should expose the latest successful health check"
  );
  const failingConnector = saveAutomationConnectorAction("serpbear_rank_tracker", {
    is_enabled: true,
    status: "ready",
    endpoint: "https://example.invalid/unreachable",
    timeout_ms: 500,
    retry_count: 0
  });
  assert.equal(failingConnector?.status, "ready", "Connector status should be editable before testing");
  const connectorTestFailure = await testAutomationConnectorAction("serpbear_rank_tracker");
  assert.equal(connectorTestFailure?.success, false, "Unreachable connector test should fail");
  assert.ok(connectorTestFailure?.error_message, "Failed connector test should expose error message");
  assert.ok(
    listConnectorHealthChecks().items.some(
      (item) => item.connector_id === "firecrawl_source" && item.success === true
    ),
    "Connector health check list should include successful tests"
  );
  assert.ok(
    listConnectorHealthChecks().items.some(
      (item) => item.connector_id === "serpbear_rank_tracker" && item.success === false
    ),
    "Connector health check list should include failed tests"
  );
  assert.ok(
    listAuditEvents({ action: "automation_connector.update" }).items.some(
      (item) => item.resource_id === "firecrawl_source"
    ),
    "Connector updates should be recorded in the audit log"
  );
  assert.ok(
    listAuditEvents({ action: "automation_connector.test" }).items.some(
      (item) => item.resource_id === "firecrawl_source"
    ),
    "Connector tests should be recorded in the audit log"
  );
  assert.ok(
    getRuntimeStatus().connectors?.health_summary?.latest_checks?.some(
      (item) => item.connector_id === "firecrawl_source"
    ),
    "Runtime status should include latest connector health checks"
  );
  const connectorDiagnostic = runConnectorDiagnosticAction("firecrawl_source");
  assert.equal(
    connectorDiagnostic?.connector_id,
    "firecrawl_source",
    "Connector diagnostic should identify the connector"
  );
  assert.ok(
    connectorDiagnostic.readiness_score >= 80,
    "Healthy mock connector diagnostic should return a strong readiness score"
  );
  assert.ok(
    connectorDiagnostic.checks.some((item) => item.check_id === "latest_health" && item.status === "passed"),
    "Connector diagnostic should include latest health status"
  );
  assert.ok(
    connectorDiagnostic.permission_decisions.some((item) => item.action === "source:crawl" && item.allowed),
    "Connector diagnostic should include allowed permission decisions"
  );
  assert.ok(
    connectorDiagnostic.permission_decisions.some((item) => item.action === "source:delete" && !item.allowed),
    "Connector diagnostic should include denied dangerous action decisions"
  );
  assert.ok(
    connectorDiagnostic.recent_audit_events.some((item) => item.action === "automation_connector.test"),
    "Connector diagnostic should include recent connector audit events"
  );
  assert.ok(
    connectorDiagnostic.recent_run_steps.some((item) => item.connector_id === "firecrawl_source"),
    "Connector diagnostic should include recent run steps for the connector"
  );
  assert.ok(
    connectorDiagnostic.recommended_actions.length >= 1,
    "Connector diagnostic should include operator recommendations"
  );
  assert.equal(
    getAutomationConnector("firecrawl_source")?.last_diagnostic?.id,
    connectorDiagnostic.id,
    "Connector detail should expose the latest diagnostic"
  );
  assert.ok(
    listConnectorDiagnostics().items.some((item) => item.id === connectorDiagnostic.id),
    "Connector diagnostics should be listable"
  );
  assert.doesNotMatch(
    JSON.stringify(connectorDiagnostic),
    /connector-secret-key|firecrawl-demo-key/,
    "Connector diagnostic output should not leak raw connector secrets"
  );
  assert.ok(
    listAuditEvents({ action: "automation_connector.diagnose" }).items.some(
      (item) => item.resource_id === "firecrawl_source"
    ),
    "Connector diagnostics should be recorded in the audit log"
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

  assert.ok(
    getInternationalGeoState().site_audits,
    "International GEO state should expose site audit records"
  );
  assert.ok(
    Array.isArray(getInternationalGeoState().geo_assets),
    "International GEO state should expose generated GEO assets"
  );
  assert.throws(
    () =>
      createInternationalGeoSiteAuditAction({
        website_url: "not-a-url",
        product_name: "Invalid Site"
      }),
    /INVALID_SITE_URL/,
    "Invalid site audit URL should be rejected"
  );

  const siteAudit = createInternationalGeoSiteAuditAction({
    website_url: "https://example.com",
    product_name: "Example GEO Platform",
    target_market: "US",
    target_language: "en-US",
    primary_query: "best GEO platform for B2B teams",
    competitors: ["Semrush", "Ahrefs"]
  });
  assert.equal(siteAudit.website_url, "https://example.com", "Site audit should keep the audited URL");
  assert.ok(siteAudit.score >= 0 && siteAudit.score <= 100, "Site audit should have a bounded score");
  assert.match(siteAudit.status, /^(ready|review|blocked)$/, "Site audit should expose a review status");
  assert.ok(siteAudit.checks.some((item) => item.id === "llms_txt"), "Site audit should check llms.txt");
  assert.ok(siteAudit.checks.some((item) => item.id === "json_ld"), "Site audit should check JSON-LD");
  assert.ok(siteAudit.summary.warnings >= 0, "Site audit summary should expose warnings");
  assert.equal(siteAudit.score_breakdown?.total_weight, 100, "Site audit should expose a 100-point score breakdown");
  assert.ok(
    siteAudit.checks.every((item) => Number.isFinite(item.score_weight)),
    "Every site audit check should expose score_weight"
  );
  assert.ok(
    siteAudit.checks.every((item) => Number.isFinite(item.score_awarded)),
    "Every site audit check should expose score_awarded"
  );
  assert.ok(
    siteAudit.checks.every((item) => Number.isFinite(item.score_deduction)),
    "Every site audit check should expose score_deduction"
  );
  assert.ok(
    siteAudit.checks.every((item) => ["high", "medium", "low"].includes(item.confidence)),
    "Every site audit check should expose confidence"
  );
  assert.ok(
    siteAudit.checks.every((item) => ["high", "medium", "low"].includes(item.priority)),
    "Every site audit check should expose remediation priority"
  );
  assert.equal(
    getInternationalGeoSiteAudit(siteAudit.id)?.id,
    siteAudit.id,
    "Created site audit should be queryable by id"
  );
  assert.ok(
    listInternationalGeoSiteAudits().items.some((item) => item.id === siteAudit.id),
    "Created site audit should be listable"
  );

  const visibilityState = getInternationalGeoVisibilityState();
  assert.ok(
    visibilityState.prompt_sets.length >= 1,
    "International GEO visibility should expose prompt sets"
  );
  const expectedVisibilityEngines = [
    "chatgpt_search",
    "perplexity",
    "google_ai_overviews",
    "gemini",
    "claude",
    "copilot_bing"
  ];
  assert.ok(
    visibilityState.provider_readiness.length >= expectedVisibilityEngines.length,
    "International GEO visibility should expose provider readiness for supported engines"
  );
  const providerReadinessEngineIds = new Set(visibilityState.provider_readiness.map((item) => item.engine_id));
  assert.ok(
    expectedVisibilityEngines.every((engineId) => providerReadinessEngineIds.has(engineId)),
    "Provider readiness should include all supported AI visibility engines"
  );
  assert.ok(
    visibilityState.provider_readiness.every((item) =>
      ["measured", "simulated", "unavailable"].includes(item.data_status)
    ),
    "Provider readiness rows should expose stable data_status values"
  );
  assert.ok(
    visibilityState.summary.unavailable_snapshots >= 0,
    "International GEO visibility summary should expose unavailable counts"
  );

  const promptSet = createInternationalGeoVisibilityPromptSetAction({
    prompt: "best GEO platform for B2B exporters",
    market: "US",
    language: "en-US",
    buyer_intent: "comparison",
    product_name: "GEO Pulse",
    target_url: "https://example.com",
    target_brand: "GEO Pulse",
    competitors: ["Profound", "AthenaHQ"],
    engines: ["chatgpt_search", "perplexity"]
  });
  assert.equal(promptSet.prompt, "best GEO platform for B2B exporters");
  assert.deepEqual(promptSet.engines, ["chatgpt_search", "perplexity"]);
  assert.throws(
    () =>
      createInternationalGeoVisibilityPromptSetAction({
        prompt: "invalid engine prompt",
        engines: ["unknown_engine"]
      }),
    /VALIDATION_ERROR/,
    "Unsupported AI visibility engine ids should be rejected"
  );

  const visibilityRun = runInternationalGeoVisibilityMeasurementAction({ trigger: "manual" });
  assert.equal(
    visibilityRun.run.data_source_type,
    "unavailable",
    "Default International GEO visibility run should not claim measured data"
  );
  assert.ok(Array.isArray(visibilityRun.snapshots), "Visibility measurement should return snapshot rows");
  assert.ok(
    visibilityRun.snapshots_created >= getInternationalGeoVisibilityState().prompt_sets.length,
    "Visibility measurement should create snapshots for configured prompt sets"
  );
  assert.equal(
    visibilityRun.snapshots.length,
    visibilityRun.snapshots_created,
    "Visibility run snapshot count should match created snapshot count"
  );
  assert.ok(
    visibilityRun.snapshots.length >= promptSet.engines.length,
    "Visibility run should create snapshots for every prompt-set engine"
  );
  const visibilityRunEngineIds = new Set(visibilityRun.snapshots.map((item) => item.engine_id));
  assert.ok(
    promptSet.engines.every((engineId) => visibilityRunEngineIds.has(engineId)),
    "Visibility run should include snapshots for the created prompt-set engines"
  );
  assert.ok(
    visibilityRun.snapshots.every((item) => item.data_status === "unavailable"),
    "Default visibility snapshots should be unavailable until a provider is configured"
  );
  assert.ok(
    visibilityRun.snapshots.every((item) => item.brand_mentioned === null && item.recommendation_rank === null),
    "Unavailable snapshots should not invent brand mentions or ranks"
  );

  const evidenceAssetsInitial = getInternationalGeoEvidenceAssetsState();
  assert.ok(evidenceAssetsInitial.summary, "Evidence asset state should expose a summary");
  assert.ok(Array.isArray(evidenceAssetsInitial.opportunities), "Evidence asset state should expose opportunities");
  assert.ok(Array.isArray(evidenceAssetsInitial.queue), "Evidence asset state should expose queue items");
  assert.ok(Array.isArray(evidenceAssetsInitial.assets), "Evidence asset state should expose generated assets");

  const evidenceAssetsGenerated = generateInternationalGeoEvidenceAssetsAction();
  assert.ok(
    evidenceAssetsGenerated.opportunities.some((item) => item.source_type === "score_deduction"),
    "Evidence opportunities should include site audit scoring deductions"
  );
  assert.ok(
    evidenceAssetsGenerated.opportunities.some((item) => item.source_type === "visibility_gap"),
    "Evidence opportunities should include AI visibility gaps"
  );
  const generatedAssetTypes = new Set(evidenceAssetsGenerated.assets.map((item) => item.asset_type));
  [
    "llms_txt_update",
    "json_ld_patch",
    "faq_block",
    "comparison_brief",
    "alternatives_brief",
    "definition_brief",
    "product_spec_brief",
    "buyer_guide_brief"
  ].forEach((assetType) => {
    assert.ok(generatedAssetTypes.has(assetType), `Generated evidence assets should include ${assetType}`);
  });
  assert.ok(
    evidenceAssetsGenerated.assets.every(
      (item) => item.evidence_source_type && item.evidence_source_id && item.evidence_summary && item.confidence
    ),
    "Every generated evidence asset should expose provenance and confidence"
  );

  const assetToApprove = evidenceAssetsGenerated.assets[0];
  const approvedAsset = reviewInternationalGeoEvidenceAssetAction(assetToApprove.id, { action: "approve" });
  assert.equal(approvedAsset.review_status, "approved", "Evidence asset review should approve assets");
  const approvedPublishingAssetTypes = new Set(["comparison_brief", "definition_brief"]);
  evidenceAssetsGenerated.assets
    .filter((item) => approvedPublishingAssetTypes.has(item.asset_type) && item.id !== approvedAsset.id)
    .forEach((item) => {
      const approvedPublishingAsset = reviewInternationalGeoEvidenceAssetAction(item.id, { action: "approve" });
      assert.equal(
        approvedPublishingAsset.review_status,
        "approved",
        `Evidence asset ${item.asset_type} should approve for publishing package coverage`
      );
    });
  const assetToReject = evidenceAssetsGenerated.assets.find(
    (item) => item.id !== assetToApprove.id && !approvedPublishingAssetTypes.has(item.asset_type)
  );
  const rejectedAsset = reviewInternationalGeoEvidenceAssetAction(assetToReject.id, {
    action: "reject",
    human_notes: "Needs stronger source proof."
  });
  assert.equal(rejectedAsset.review_status, "rejected", "Evidence asset review should reject assets");
  assert.throws(
    () => reviewInternationalGeoEvidenceAssetAction(assetToApprove.id, { action: "publish" }),
    /VALIDATION_ERROR/,
    "Invalid evidence asset review actions should be rejected"
  );
  assert.equal(
    reviewInternationalGeoEvidenceAssetAction("missing_evidence_asset", { action: "approve" }),
    null,
    "Unknown evidence asset ids should return null"
  );

  const publishingInitial = getInternationalGeoPublishingState();
  assert.ok(publishingInitial.summary, "Publishing workflow should expose a summary");
  assert.ok(Array.isArray(publishingInitial.platforms), "Publishing workflow should expose platform rows");
  assert.ok(Array.isArray(publishingInitial.packages), "Publishing workflow should expose package rows");
  assert.ok(Array.isArray(publishingInitial.tracking), "Publishing workflow should expose tracking rows");

  const expectedPlatformKeys = [
    "official_blog",
    "docs",
    "github",
    "linkedin_company",
    "linkedin_founder",
    "reddit",
    "quora",
    "youtube",
    "medium",
    "devto",
    "hashnode",
    "product_hunt",
    "g2",
    "capterra",
    "alternative_to",
    "saasworthy"
  ];
  const platformKeys = new Set(publishingInitial.platforms.map((item) => item.platform_key));
  expectedPlatformKeys.forEach((platformKey) => {
    assert.ok(platformKeys.has(platformKey), `Publishing platform list should include ${platformKey}`);
  });
  assert.ok(
    publishingInitial.platforms.every(
      (item) =>
        item.ai_visibility_fit?.chatgpt_search &&
        item.ai_visibility_fit?.gemini &&
        item.ai_visibility_fit?.claude &&
        typeof item.authority_signal === "string" &&
        item.authority_signal.length > 20 &&
        typeof item.ai_recommendation_note === "string" &&
        item.ai_recommendation_note.length > 20 &&
        item.risk_level &&
        item.publishing_mode &&
        Array.isArray(item.supported_package_types)
    ),
    "Publishing platform rows should include engine fit, authority signals, recommendation notes, risk, publishing mode, and package types"
  );

  const publishingGenerated = generateInternationalGeoPublishingPackagesAction();
  const approvedEvidenceAssetIds = new Set(
    getInternationalGeoEvidenceAssetsState()
      .assets.filter((item) => item.review_status === "approved")
      .map((item) => item.id)
  );
  assert.ok(
    publishingGenerated.packages.every((item) => approvedEvidenceAssetIds.has(item.source_asset_id)),
    "Generated publishing packages should only use approved evidence assets"
  );
  assert.equal(
    publishingGenerated.packages.some((item) => item.source_asset_id === rejectedAsset.id),
    false,
    "Generated publishing packages should not use rejected evidence assets"
  );
  const generatedPackageTypes = new Set(publishingGenerated.packages.map((item) => item.package_type));
  [
    "website_article_brief",
    "docs_update_brief",
    "github_readme_update",
    "linkedin_post",
    "reddit_answer",
    "quora_answer"
  ].forEach((packageType) => {
    assert.ok(generatedPackageTypes.has(packageType), `Generated packages should include ${packageType}`);
  });
  assert.ok(
    publishingGenerated.packages.every(
      (item) =>
        item.source_asset_id &&
        item.evidence_source_type &&
        item.evidence_source_id &&
        item.evidence_summary &&
        item.content.includes("Manual handoff")
    ),
    "Generated publishing packages should preserve evidence provenance and manual handoff copy"
  );
  assert.equal(
    publishingGenerated.packages.some((item) => /full article/i.test(item.content)),
    false,
    "Generated publishing packages should not claim to be full articles"
  );

  const packageToApprove = publishingGenerated.packages[0];
  const approvedPackage = reviewInternationalGeoPublishingPackageAction(packageToApprove.id, {
    action: "approve",
    human_notes: "Approved for manual handoff."
  });
  assert.equal(approvedPackage.review_status, "approved", "Publishing package review should approve packages");
  assert.equal(approvedPackage.package_status, "approved_package", "Approved packages should expose approved package status");

  const packageToReject = publishingGenerated.packages.find((item) => item.id !== packageToApprove.id);
  const rejectedPackage = reviewInternationalGeoPublishingPackageAction(packageToReject.id, {
    action: "reject",
    human_notes: "Needs more proof."
  });
  assert.equal(rejectedPackage.review_status, "rejected", "Publishing package review should reject packages");
  assert.equal(rejectedPackage.package_status, "rejected_package", "Rejected packages should expose rejected package status");

  assert.throws(
    () => reviewInternationalGeoPublishingPackageAction(packageToApprove.id, { action: "publish" }),
    /VALIDATION_ERROR/,
    "Invalid publishing package review actions should be rejected"
  );
  assert.equal(
    reviewInternationalGeoPublishingPackageAction("missing_publishing_package", { action: "approve" }),
    null,
    "Unknown publishing package ids should return null"
  );

  const trackingRecord = publishingGenerated.tracking.find((item) => item.package_id === packageToApprove.id);
  const updatedTracking = updateInternationalGeoPublishingTrackingAction(trackingRecord.id, {
    publication_status: "manually_published",
    published_url: "https://example.com/geo-publishing-package",
    canonical_url: "https://example.com",
    indexing_status: "indexed",
    ai_mention_status: "mentioned",
    citation_status: "cited",
    recommendation_status: "recommended",
    evidence_url: "https://example.com/manual-evidence",
    evidence_note: "Manual reviewer checked the public URL."
  });
  assert.equal(updatedTracking.publication_status, "manually_published", "Tracking should record manual publication");
  assert.equal(updatedTracking.indexing_status, "indexed", "Tracking should record indexing status");
  assert.equal(updatedTracking.ai_mention_status, "mentioned", "Tracking should record AI mention status");
  assert.equal(updatedTracking.citation_status, "cited", "Tracking should record citation status");
  assert.equal(updatedTracking.recommendation_status, "recommended", "Tracking should record recommendation status");
  assert.throws(
    () =>
      updateInternationalGeoPublishingTrackingAction(trackingRecord.id, {
        publication_status: "manually_published",
        published_url: ""
      }),
    /VALIDATION_ERROR/,
    "Manual publication tracking should require an http published URL"
  );
  assert.throws(
    () =>
      updateInternationalGeoPublishingTrackingAction(trackingRecord.id, {
        indexing_status: "ranking_first"
      }),
    /VALIDATION_ERROR/,
    "Invalid tracking status values should be rejected"
  );
  assert.equal(
    updateInternationalGeoPublishingTrackingAction("missing_tracking_record", { indexing_status: "indexed" }),
    null,
    "Unknown tracking ids should return null"
  );

  assert.throws(
    () =>
      validateInternationalGeoVisibilitySnapshot({
        data_status: "measured",
        engine_id: "perplexity",
        captured_at: "2026-07-07T00:00:00.000Z"
      }),
    /MEASURED_SOURCE_REQUIRED/,
    "Measured snapshots should require provider and source evidence"
  );

  assert.equal(
    normalizeCrawlTarget("https://example.com/path?x=1")?.href,
    "https://example.com/path?x=1",
    "Safe crawl target should normalize https URLs"
  );
  assert.throws(
    () => validateCrawlTarget("file:///tmp/a"),
    /CRAWL_TARGET_BLOCKED/,
    "file URLs should be blocked for crawling"
  );
  assert.throws(
    () => validateCrawlTarget("not-a-url"),
    /CRAWL_TARGET_BLOCKED/,
    "Malformed crawl targets should be blocked with a stable crawl safety code"
  );
  assert.throws(
    () => validateCrawlTarget("http://localhost:3000"),
    /CRAWL_TARGET_BLOCKED/,
    "localhost crawl targets should be blocked"
  );
  assert.throws(
    () => validateCrawlTarget("http://127.0.0.1"),
    /CRAWL_TARGET_BLOCKED/,
    "loopback IP crawl targets should be blocked"
  );
  assert.throws(
    () => validateCrawlTarget("http://[::ffff:127.0.0.1]"),
    /CRAWL_TARGET_BLOCKED/,
    "IPv4-mapped IPv6 loopback crawl targets should be blocked"
  );
  assert.throws(
    () => validateCrawlTarget("http://[::ffff:7f00:1]"),
    /CRAWL_TARGET_BLOCKED/,
    "Canonical IPv4-mapped IPv6 loopback crawl targets should be blocked"
  );

  const evidencedAudit = applyInternationalGeoSiteAuditCrawlEvidenceAction(siteAudit.id, {
    provider_id: "builtin_safe_fetch",
    execution_mode: "live_fetch",
    status: "completed",
    started_at: "2026-07-06T00:00:00.000Z",
    completed_at: "2026-07-06T00:00:01.000Z",
    origin: "https://example.com",
    resources: {
      homepage: {
        url: "https://example.com",
        status_code: 200,
        ok: true,
        content_type: "text/html",
        title: "Example GEO Platform",
        meta_description: "Example GEO Platform for B2B teams.",
        canonical_url: "https://example.com",
        h1: "Example GEO Platform",
        text_excerpt: "Example GEO Platform helps B2B teams compare GEO platforms with facts and FAQ.",
        json_ld_types: ["Organization", "SoftwareApplication"],
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      },
      robots_txt: {
        url: "https://example.com/robots.txt",
        status_code: 200,
        ok: true,
        content_type: "text/plain",
        text_excerpt: "User-agent: Googlebot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /",
        mentioned_bots: ["Googlebot", "OAI-SearchBot"],
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      },
      sitemap_xml: {
        url: "https://example.com/sitemap.xml",
        status_code: 200,
        ok: true,
        content_type: "application/xml",
        url_count: 2,
        sample_urls: ["https://example.com/", "https://example.com/pricing"],
        text_excerpt: "<urlset><url><loc>https://example.com/</loc></url></urlset>",
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      },
      llms_txt: {
        url: "https://example.com/llms.txt",
        status_code: 200,
        ok: true,
        content_type: "text/markdown",
        text_excerpt: "# Example GEO Platform",
        fetched_at: "2026-07-06T00:00:00.000Z",
        error_code: ""
      }
    },
    issues: []
  });
  assert.equal(evidencedAudit.crawl_evidence.status, "completed", "Audit should store crawl evidence");
  assert.ok(evidencedAudit.score > siteAudit.score, "Crawl evidence should change weighted site audit score");
  assert.equal(
    evidencedAudit.checks.find((item) => item.id === "llms_txt")?.evidence_status,
    "crawl_evidenced",
    "llms.txt check should become crawl-evidenced"
  );
  assert.equal(
    evidencedAudit.checks.find((item) => item.id === "llms_txt")?.confidence,
    "high",
    "Fetched llms.txt should create a high-confidence scored check"
  );
  assert.equal(
    evidencedAudit.checks.find((item) => item.id === "json_ld")?.evidence_status,
    "crawl_evidenced",
    "JSON-LD check should become crawl-evidenced"
  );
  assert.equal(
    evidencedAudit.checks.find((item) => item.id === "json_ld")?.score_awarded,
    14,
    "Relevant JSON-LD types should award full JSON-LD points"
  );
  assert.match(
    evidencedAudit.checks.find((item) => item.id === "robots_ai_access")?.evidence || "",
    /OAI-SearchBot/,
    "Robots check should include bot evidence"
  );
  const missingLlmsAudit = applyInternationalGeoSiteAuditCrawlEvidenceAction(siteAudit.id, {
    provider_id: "test",
    status: "partial",
    resources: {
      homepage: {
        ok: true,
        status_code: 200,
        url: "https://example.com",
        text_excerpt: "Example GEO Platform has contact and privacy details."
      },
      llms_txt: {
        ok: false,
        status_code: 404,
        error_code: "HTTP_404"
      }
    },
    issues: []
  });
  const missingLlmsCheck = missingLlmsAudit.checks.find((item) => item.id === "llms_txt");
  assert.equal(missingLlmsCheck.priority, "high", "Missing llms.txt should be high priority");
  assert.match(
    missingLlmsCheck.deduction_reasons.join(" "),
    /Missing \/llms\.txt/,
    "Missing llms.txt should expose a concrete deduction reason"
  );
  await assert.rejects(
    () => crawlInternationalGeoSite("http://127.0.0.1"),
    /CRAWL_TARGET_BLOCKED/,
    "Unsafe live crawl targets should reject before network fetch"
  );

  const siteAssets = generateInternationalGeoSiteAuditAssetsAction(siteAudit.id);
  assert.ok(siteAssets.items.some((item) => item.asset_type === "llms_txt"), "Site assets should include llms.txt");
  assert.ok(
    siteAssets.items.some((item) => item.asset_type === "organization_json_ld"),
    "Site assets should include Organization JSON-LD"
  );
  assert.ok(
    siteAssets.items.some((item) => item.asset_type === "product_json_ld"),
    "Site assets should include Product JSON-LD"
  );
  assert.ok(
    siteAssets.items.some((item) => item.asset_type === "faq_json_ld"),
    "Site assets should include FAQ JSON-LD"
  );
  assert.ok(
    siteAssets.items.some((item) => item.asset_type === "article_brief"),
    "Site assets should include an article brief"
  );
  assert.ok(
    siteAssets.items.some((item) => item.asset_type === "distribution_brief"),
    "Site assets should include a distribution brief"
  );
  assert.match(
    JSON.stringify(siteAssets),
    /Example GEO Platform/,
    "Generated site assets should include the product context"
  );

  resetRuntimeState();
  const resetAuditEvents = listAuditEvents({ page_size: 5 }).items;
  assert.equal(resetAuditEvents[0]?.action, "runtime.reset", "Runtime reset should be recorded in audit events");
  assert.equal(
    resetAuditEvents[0]?.resource_type,
    "runtime",
    "Runtime reset audit event should identify the runtime resource"
  );

  const backup = createRuntimeBackupAction({ name: "验收备份" });
  assert.match(backup.id, /^bkp-/, "Runtime backup should return a backup id");
  assert.equal(backup.name, "验收备份", "Runtime backup should keep the operator label");
  assert.ok(backup.checksum, "Runtime backup should include a checksum");
  assert.ok(backup.counts?.keywords >= 1, "Runtime backup should include captured counts");

  const backupList = listRuntimeBackups();
  assert.ok(
    backupList.items.some((item) => item.id === backup.id),
    "Runtime backup list should include the created backup"
  );

  const backupDownload = getRuntimeBackupDownload(backup.id);
  assert.equal(backupDownload.kind, "geo-pulse-runtime-backup", "Backup download should identify its artifact type");
  assert.equal(backupDownload.backup.id, backup.id, "Backup download should include matching metadata");
  assert.equal(
    Object.prototype.hasOwnProperty.call(backupDownload.snapshot, "runtimeBackups"),
    false,
    "Backup snapshot should exclude recursive backup history"
  );

  const validation = validateRuntimeBackupAction(backup.id);
  assert.equal(validation.valid, true, "Created runtime backup should validate");
  assert.equal(validation.checksum, backup.checksum, "Runtime backup validation should recalculate the checksum");

  const backupBrandName = getBrandProfile().brand_name;
  saveBrandProfileAction({ brand_name: "恢复前临时品牌" });
  assert.equal(getBrandProfile().brand_name, "恢复前临时品牌", "Brand profile mutation should happen before restore");
  const restore = restoreRuntimeBackupAction(backup.id);
  assert.equal(restore.restored, true, "Runtime backup restore should report success");
  assert.equal(getBrandProfile().brand_name, backupBrandName, "Runtime backup restore should hydrate captured state");

  const backupAuditEvents = listAuditEvents({ page_size: 10 }).items;
  assert.ok(
    backupAuditEvents.some((item) => item.action === "runtime.backup.restore" && item.resource_id === backup.id),
    "Runtime backup restore should be recorded in audit events"
  );
  assert.ok(
    backupAuditEvents.some((item) => item.action === "runtime.backup.create" && item.resource_id === backup.id),
    "Runtime backup creation should remain visible in audit events after restore"
  );
  assert.equal(
    getRuntimeStatus().backups?.count >= 1,
    true,
    "Runtime status should include backup summary"
  );

  saveBrandProfileAction({ brand_name: "导入备份基线品牌" });
  const exportSourceBackup = createRuntimeBackupAction({ name: "导入源备份" });
  const exportArtifact = getRuntimeBackupDownload(exportSourceBackup.id);
  assert.equal(exportArtifact.backup.id, exportSourceBackup.id, "Import source artifact should match source backup");

  resetRuntimeState();
  const importValidation = validateRuntimeBackupImportAction({ artifact: exportArtifact });
  assert.equal(importValidation.valid, true, "Downloaded runtime backup artifact should validate for import");
  assert.equal(
    importValidation.source_backup_id,
    exportSourceBackup.id,
    "Import validation should expose the source backup id"
  );

  const importedBackup = importRuntimeBackupAction({
    artifact: exportArtifact,
    name: "导入后的备份"
  });
  assert.match(importedBackup.id, /^bkp-/, "Imported runtime backup should receive a local backup id");
  assert.notEqual(importedBackup.id, exportSourceBackup.id, "Imported runtime backup should avoid id collision");
  assert.equal(importedBackup.imported, true, "Imported runtime backup should be marked as imported");
  assert.equal(
    importedBackup.source_backup_id,
    exportSourceBackup.id,
    "Imported runtime backup should preserve source backup id"
  );
  assert.ok(
    listRuntimeBackups().items.some((item) => item.id === importedBackup.id),
    "Imported runtime backup should be listable"
  );

  restoreRuntimeBackupAction(importedBackup.id);
  assert.equal(
    getBrandProfile().brand_name,
    "导入备份基线品牌",
    "Imported runtime backup should restore the captured state"
  );

  const importAuditEvents = listAuditEvents({ page_size: 10 }).items;
  assert.ok(
    importAuditEvents.some((item) => item.action === "runtime.backup.import" && item.resource_id === importedBackup.id),
    "Runtime backup import should be recorded in audit events"
  );
}

async function runSingleUserCompleteChecks() {
  const savedInput = saveWorkspaceInputAction({
    website_url: "https://example.com",
    product_name: "AgentCore GEO",
    industry: "AI search operations",
    target_markets: ["US", "EU"],
    audience: "B2B SaaS marketing teams",
    language: "en",
    competitors: ["Profound", "AthenaHQ", "Semrush AI"],
    differentiators: ["single-user workflow", "local-first GEO operations"]
  });
  assert.equal(savedInput.product_name, "AgentCore GEO", "Workspace input should save product name");
  assert.equal(getWorkspaceInput().website_url, "https://example.com", "Workspace input should be readable");

  const manualTopic = createTopicIdeaAction({
    title: "How should B2B SaaS teams prepare for AI search?",
    keyword: "AI search readiness for B2B SaaS",
    template_type: "how_to",
    priority: 1,
    core_messages: ["Answer upfront", "Show evidence", "Publish llms.txt"],
    required_terms: ["llms.txt", "JSON-LD", "AI Overviews"]
  });
  assert.ok(manualTopic.id, "Manual topic should be creatable");

  const updatedTopic = updateTopicIdeaAction(manualTopic.id, {
    title: "How B2B SaaS teams prepare for AI search recommendations",
    priority: 2
  });
  assert.equal(updatedTopic.priority, 2, "Manual topic should be editable");
  assert.ok(
    listTopicIdeas().items.some((item) => item.id === manualTopic.id),
    "Manual topic should appear in topic list"
  );

  const outlineResult = generateTopicOutlineAction(manualTopic.id);
  assert.ok(outlineResult.outline_json.length >= 4, "Topic outline generation should create outline sections");

  const manualArticle = createArticleAction({
    topic_idea_id: manualTopic.id,
    title: "AI Search Readiness Checklist for B2B SaaS",
    content_markdown: "Direct answer: B2B SaaS teams need structured facts, citations, llms.txt, and JSON-LD.",
    target_channel_types: ["website_blog", "linkedin"]
  });
  assert.ok(manualArticle.id, "Manual article should be creatable");
  assert.ok(
    listArticles().items.some((item) => item.id === manualArticle.id),
    "Manual article should appear in article list"
  );

  const createdTemplate = createContentTemplateAction({
    name: "AI search direct-answer article",
    template_type: "how_to",
    applicable_categories: ["how_to", "comparison"],
    structure: ["Direct answer", "Evidence table", "FAQ", "CTA"]
  });
  assert.ok(createdTemplate.id, "Content template should be creatable");
  assert.ok(
    listContentTemplates().items.some((item) => item.id === createdTemplate.id),
    "Content template should appear in template list"
  );

  const exportJob = createExportJobAction({
    artifact_type: "content_articles",
    format: "csv",
    scope: "single_user_acceptance"
  });
  assert.ok(exportJob.id, "Export job should be creatable");
  const exportDownload = getExportJobDownload(exportJob.id);
  assert.match(exportDownload.content, /AI Search Readiness|title/i, "Export download should include article content");

  const internationalInput = saveInternationalGeoInputAction({
    website_url: "https://example.com",
    product_name: "AgentCore GEO",
    target_market: "United States",
    target_language: "English",
    primary_query: "best GEO platform for AI search",
    competitors: ["Profound", "AthenaHQ", "Semrush AI"]
  });
  assert.equal(internationalInput.product_name, "AgentCore GEO", "International GEO input should save");

  const audit = runInternationalGeoAuditAction();
  assert.ok(audit.summary.ai_ready_score >= 1, "International GEO audit should produce score");
  assert.ok(
    audit.engineVisibility.some((item) => /ChatGPT|Gemini|Claude|Copilot/.test(item.engine)),
    "International GEO audit should cover major AI engines"
  );

  const artifacts = generateInternationalGeoArtifactsAction();
  assert.match(artifacts.llms_txt, /AgentCore GEO/, "International artifacts should generate llms.txt text");
  assert.match(artifacts.json_ld, /application\/ld\+json|@context/, "International artifacts should generate JSON-LD");
  assert.ok(getInternationalGeoState().artifacts.llms_txt, "International GEO artifacts should persist");

  const upgradedPlan = updateBillingPlanAction({
    plan_id: "single_user_pro",
    billing_cycle: "monthly"
  });
  assert.equal(upgradedPlan.plan_id, "single_user_pro", "Billing plan should update locally");
  assert.equal(getBillingSummary().current_plan, "single_user_pro", "Billing summary should reflect local plan");

  const logout = logoutSessionAction({ reason: "single_user_manual" });
  assert.equal(logout.success, true, "Single-user logout should return safe success");

  const uiStore = {
    tabs: { content: "topics" },
    filters: { content: { query: "", status: "all" } },
    selectedIds: {},
    data: {
      keywords: [],
      topics: listTopicIdeas().items,
      articles: listArticles().items,
      templates: listContentTemplates().items,
      brandProfile: getBrandProfile(),
      articleDetails: {}
    }
  };
  const contentHtml = renderContent(uiStore);
  const internationalHtml = renderInternationalGeo(getInternationalGeoState());
  const billingHtml = renderBilling({ billingSummary: getBillingSummary(), invoices: [] });
  assert.doesNotMatch(
    `${contentHtml}\n${internationalHtml}\n${billingHtml}`,
    /即将开放|Read-only MVP/,
    "Core single-user UI should not show coming-soon or read-only dead ends"
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
  assert(
    navigation.some((item) => item.id === "international" && item.label === "国际 GEO"),
    "Navigation should include International GEO"
  );

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

  const internationalStore = createRouteStateFixture();
  internationalStore.page = "international";
  const internationalHash = serializeRouteState(internationalStore);
  assert.match(internationalHash, /page=international/, "International GEO page should serialize");

  const restoredInternationalStore = createRouteStateFixture();
  applyRouteState(restoredInternationalStore, `#${internationalHash}`);
  assert.equal(
    restoredInternationalStore.page,
    "international",
    "International GEO page should restore"
  );

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
        preflight: {
          status: "review",
          score: 82,
          summary: {
            passed: 5,
            warnings: 2,
            failed: 0,
            blockers: 0
          },
          checks: [
            {
              id: "persistence",
              category: "data",
              label: "本地持久化",
              status: "warning",
              message: "持久化未开启",
              recommendation: "开启 GEO_ENABLE_PERSISTENCE=1"
            },
            {
              id: "geo_static",
              category: "geo",
              label: "GEO 静态入口",
              status: "passed",
              message: "robots/sitemap/llms/favicon 已配置",
              recommendation: "上线前确认 public URL"
            }
          ],
          generated_at: "2026-07-05T10:03:00.000Z"
        },
        backups: {
          count: 1,
          latest: {
            id: "bkp-ui",
            name: "UI 验收备份",
            checksum: "abc123",
            created_at: "2026-07-05T10:03:00.000Z"
          },
          items: [
            {
              id: "bkp-ui",
              name: "UI 验收备份",
              checksum: "abc123",
              created_at: "2026-07-05T10:03:00.000Z",
              size_bytes: 2048,
              counts: {
                keywords: 5,
                articles: 2
              }
            }
          ]
        },
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
  assert.match(html, /本地备份/, "Settings runtime panel should show local backup controls");
  assert.match(html, /UI 验收备份/, "Settings runtime panel should render backup rows");
  assert.match(html, /data-action="create-runtime-backup"/, "Settings runtime panel should expose backup creation");
  assert.match(html, /data-action="validate-runtime-backup"/, "Settings runtime panel should expose backup validation");
  assert.match(html, /data-action="download-runtime-backup"/, "Settings runtime panel should expose backup download");
  assert.match(html, /data-action="restore-runtime-backup"/, "Settings runtime panel should expose backup restore");
  assert.match(html, /data-runtime-backup-import/, "Settings runtime panel should expose a backup import textarea");
  assert.match(
    html,
    /data-action="validate-runtime-backup-import"/,
    "Settings runtime panel should expose backup import validation"
  );
  assert.match(html, /data-action="import-runtime-backup"/, "Settings runtime panel should expose backup import");
  assert.match(html, /上线预检/, "Settings runtime panel should show launch preflight");
  assert.match(html, /data-action="refresh-launch-preflight"/, "Settings runtime panel should expose preflight refresh");
  assert.match(html, /本地持久化/, "Settings runtime panel should render preflight check rows");
  assert.match(html, /GEO 静态入口/, "Settings runtime panel should render GEO static preflight checks");

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

function renderAppToStringForTest(testStore) {
  const root = { innerHTML: "" };
  renderApp(root, testStore);
  return root.innerHTML;
}

function createMinimalUiStore(overrides = {}) {
  return {
    page: "dashboard",
    tabs: {
      keywords: "keywords",
      content: "topics",
      distribution: "tasks",
      analytics: "keywords",
      settings: "brand"
    },
    selectedIds: {},
    search: "",
    ui: {
      loading: false,
      error: "",
      notice: "",
      panel: ""
    },
    session: {
      current: { authenticated: false },
      loginForm: { username: "", password: "" }
    },
    forms: {},
    data: {
      dashboardSummary: {},
      runtimeStatus: {
        counts: {},
        scheduler: {},
        providers: {}
      },
      keywordTrend: [],
      contentFunnel: [],
      topKeywords: [],
      recentPublishes: []
    },
    ...overrides
  };
}

function runAuthUiChecks() {
  const loginHtml = renderAppToStringForTest(createMinimalUiStore());
  assert.match(loginHtml, /登录 GEO Pulse/, "Unauthenticated app should render the login view");
  assert.match(loginHtml, /data-action="login-session"/, "Login view should expose a login action");
  assert.doesNotMatch(loginHtml, /总览看板/, "Unauthenticated app should not render the admin dashboard");

  const settingsHtml = renderSettings({
    tabs: {
      settings: "brand"
    },
    selectedIds: {},
    session: {
      current: {
        user: {
          role: "owner"
        }
      }
    },
    forms: {
      user: {
        username: "",
        display_name: "",
        role: "viewer",
        temporary_password: ""
      }
    },
    data: {
      users: [
        {
          id: "usr_owner",
          username: "owner",
          display_name: "Owner",
          role: "owner",
          status: "active",
          last_login_at: "2026-07-06T10:00:00.000Z"
        }
      ],
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
      auditEvents: []
    }
  });
  assert.match(settingsHtml, /用户管理/, "Settings page should render user management");
  assert.match(settingsHtml, /data-action="create-user"/, "User management should expose create user action");
  assert.match(
    settingsHtml,
    /data-action="reset-user-password"/,
    "User management should expose password reset action"
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
      provider: "local_geo_writer",
      connector: "firecrawl_source"
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
            timeout_ms: 12000,
            retry_count: 2,
            masked_api_key: "********key"
          },
          last_health_check: {
            success: true,
            success_label: "测试通过",
            checked_at: "2026-07-05T10:10:00.000Z",
            duration_ms: 18,
            endpoint: "mock://source-crawl",
            schema_valid: true,
            error_message: ""
          },
          last_diagnostic: {
            id: "diag-ui",
            readiness_score: 92,
            status: "ready",
            status_label: "可上线",
            severity: "info",
            checks: [
              {
                check_id: "latest_health",
                label: "最近健康检查",
                status: "passed",
                status_label: "通过",
                detail: "mock://source-crawl 测试通过"
              },
              {
                check_id: "permission_boundary",
                label: "权限边界",
                status: "passed",
                status_label: "通过",
                detail: "危险动作已被拒绝"
              }
            ],
            recommended_actions: ["保持 mock 连接器可用，接真实服务前复核密钥权限。"],
            recent_run_steps: [
              {
                id: "step-ui",
                run_id: "run-ui",
                step_label: "内容源抓取",
                status_label: "已完成",
                connector_id: "firecrawl_source",
                latency_ms: 128,
                finished_at: "2026-07-05T10:11:00.000Z"
              }
            ],
            recent_audit_events: [
              {
                id: "aud-ui",
                action: "automation_connector.test",
                created_at: "2026-07-05T10:10:00.000Z"
              }
            ],
            created_at: "2026-07-05T10:12:00.000Z"
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
        },
        connectors: {
          health_summary: {
            latest_checks: [
              {
                connector_id: "firecrawl_source",
                success: true,
                checked_at: "2026-07-05T10:10:00.000Z"
              }
            ]
          }
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
  assert.match(html, /data-select-connector="firecrawl_source"/, "Connector rows should be selectable");
  assert.match(html, /data-settings-panel="connector"/, "Settings should render a connector detail drawer");
  assert.match(html, /data-connector-field="endpoint"/, "Connector drawer should expose endpoint editing");
  assert.match(html, /data-action="save-connector-config"/, "Connector drawer should expose save action");
  assert.match(html, /data-action="test-connector-config"/, "Connector drawer should expose test action");
  assert.match(html, /data-action="run-connector-diagnostic"/, "Connector drawer should expose diagnostic action");
  assert.match(html, /最近健康检查/, "Connector drawer should render recent health checks");
  assert.match(html, /最近诊断/, "Connector drawer should render latest diagnostic");
  assert.match(html, /92/, "Connector drawer should render diagnostic readiness score");
  assert.match(html, /内容源抓取/, "Connector diagnostic should render recent run steps");
  assert.match(html, /automation_connector\.test/, "Connector diagnostic should render audit context");
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

function runInternationalGeoUiChecks() {
  const html = renderInternationalGeo();

  assert.match(html, /国际 GEO/, "International GEO page should render its title");
  assert.match(html, /llms\.txt/, "International GEO page should render llms.txt readiness");
  assert.match(html, /JSON-LD/, "International GEO page should render JSON-LD audit coverage");
  assert.match(html, /ChatGPT Search/, "International GEO page should render ChatGPT Search visibility");
  assert.match(html, /Perplexity/, "International GEO page should render Perplexity visibility");
  assert.match(
    html,
    /Google AI Overviews/,
    "International GEO page should render Google AIO visibility"
  );
  assert.match(html, /Direct Answer/, "International GEO page should render Direct Answer guidance");
  assert.match(html, /Entity Coverage/, "International GEO page should render entity coverage");
  assert.match(
    html,
    /AI 引擎收录与推荐矩阵/,
    "International GEO page should render the engine inclusion matrix"
  );
  assert.match(html, /OAI-SearchBot/, "International GEO page should render OpenAI crawler coverage");
  assert.match(html, /Claude-SearchBot/, "International GEO page should render Claude crawler coverage");
  assert.match(html, /PerplexityBot/, "International GEO page should render Perplexity crawler coverage");
  assert.match(html, /Bingbot/, "International GEO page should render Bing crawler coverage");
  assert.match(
    html,
    /Prompt 推荐监测/,
    "International GEO page should render prompt recommendation monitoring"
  );
  assert.match(html, /Content Generation Tasks/, "International GEO page should render content tasks");
  assert.match(
    html,
    /Distribution Execution Plan/,
    "International GEO page should render distribution execution planning"
  );

  const siteAuditHtml = renderInternationalGeo({
    ...getInternationalGeoState(),
    site_audits: {
      items: [
        {
          id: "sga-test",
          website_url: "https://example.com",
          product_name: "Example GEO Platform",
          target_market: "US",
          target_language: "en-US",
          score: 82,
          status: "review",
          summary: { passed: 6, warnings: 3, failed: 0, blockers: 0, generated_assets: 6 },
          checks: [
            {
              id: "llms_txt",
              category: "ai_readability",
              label: "llms.txt",
              status: "warning",
              message: "Recommended to verify live /llms.txt.",
              recommendation: "Install a concise llms.txt file."
            }
          ],
          created_at: "2026-07-06T00:00:00.000Z"
        }
      ],
      latest: {
        id: "sga-test",
        website_url: "https://example.com",
        product_name: "Example GEO Platform",
        score: 82,
        status: "review",
        summary: { passed: 6, warnings: 3, failed: 0, blockers: 0, generated_assets: 6 },
        checks: [],
        crawl_evidence: {
          provider_id: "builtin_safe_fetch",
          execution_mode: "live_fetch",
          status: "completed",
          origin: "https://example.com",
          resources: {
            homepage: {
              ok: true,
              status_code: 200,
              title: "Example GEO Platform",
              json_ld_types: ["Organization"],
              text_excerpt: "Example text"
            },
            robots_txt: {
              ok: true,
              status_code: 200,
              mentioned_bots: ["Googlebot"],
              text_excerpt: "User-agent: *"
            },
            sitemap_xml: {
              ok: true,
              status_code: 200,
              url_count: 3,
              sample_urls: ["https://example.com/"]
            },
            llms_txt: {
              ok: true,
              status_code: 200,
              text_excerpt: "# Example GEO Platform"
            }
          },
          issues: []
        }
      }
    },
    geo_assets: [
      {
        id: "asset-test",
        audit_id: "sga-test",
        asset_type: "llms_txt",
        title: "llms.txt",
        content: "# Example GEO Platform",
        content_type: "text/markdown",
        created_at: "2026-07-06T00:00:00.000Z"
      }
    ],
    publishing: {
      summary: {
        platform_count: 1,
        package_count: 1,
        approved_package_count: 0,
        manually_published_count: 0,
        indexed_count: 0,
        mentioned_count: 0,
        cited_count: 0,
        recommended_count: 0
      },
      platforms: [
        {
          id: "geopub_official_blog",
          platform_key: "official_blog",
          platform_name: "Official Blog",
          platform_type: "owned",
          category: "owned_site",
          recommended_asset_types: ["comparison_brief", "definition_brief"],
          supported_package_types: ["website_article_brief"],
          ai_visibility_fit: {
            chatgpt_search: "high",
            gemini: "high",
            claude: "high",
            perplexity: "high",
            google_ai_overviews: "high",
            copilot_bing: "medium"
          },
          indexing_value: "high",
          citation_value: "high",
          entity_validation_value: "medium",
          risk_level: "low",
          publishing_mode: "manual",
          connector_status: "not_supported"
        }
      ],
      packages: [
        {
          id: "geopkg-ui",
          source_asset_id: "asset-test",
          source_asset_type: "comparison_brief",
          platform_id: "geopub_official_blog",
          platform_name: "Official Blog",
          package_type: "website_article_brief",
          title: "Official Blog package",
          target_prompt: "best GEO platform for B2B exporters",
          package_status: "draft_package",
          review_status: "pending_review",
          content_type: "text/markdown",
          evidence_source_type: "score_deduction",
          evidence_source_id: "sga-test:third_party_validation",
          evidence_summary: "Manual/local package fixture",
          confidence: "medium"
        }
      ],
      tracking: [
        {
          id: "geotrack-ui",
          package_id: "geopkg-ui",
          platform_id: "geopub_official_blog",
          platform_name: "Official Blog",
          source_asset_id: "asset-test",
          published_url: "",
          canonical_url: "https://example.com",
          target_prompt: "best GEO platform for B2B exporters",
          publication_status: "packaged",
          indexing_status: "unknown",
          ai_mention_status: "unknown",
          citation_status: "unknown",
          recommendation_status: "unknown",
          evidence_note: "Manual/local tracking only.",
          updated_at: "2026-07-07T00:00:00.000Z"
        }
      ]
    },
    visibility: {
      provider_readiness: [
        {
          engine_id: "chatgpt_search",
          engine_name: "ChatGPT Search",
          data_status: "unavailable",
          provider_id: "",
          last_checked_at: "2026-07-07T00:00:00.000Z"
        },
        {
          engine_id: "perplexity",
          engine_name: "Perplexity",
          data_status: "unavailable",
          provider_id: "",
          last_checked_at: "2026-07-07T00:00:00.000Z"
        },
        {
          engine_id: "google_ai_overviews",
          engine_name: "Google AI Overviews",
          data_status: "unavailable",
          provider_id: "",
          last_checked_at: "2026-07-07T00:00:00.000Z"
        },
        {
          engine_id: "gemini",
          engine_name: "Gemini",
          data_status: "unavailable",
          provider_id: "",
          last_checked_at: "2026-07-07T00:00:00.000Z"
        },
        {
          engine_id: "claude",
          engine_name: "Claude",
          data_status: "unavailable",
          provider_id: "",
          last_checked_at: "2026-07-07T00:00:00.000Z"
        },
        {
          engine_id: "copilot_bing",
          engine_name: "Copilot Bing",
          data_status: "unavailable",
          provider_id: "",
          last_checked_at: "2026-07-07T00:00:00.000Z"
        }
      ],
      snapshots: [
        {
          id: "vis-snap-chatgpt",
          prompt_set_id: "vis-prompt-ui",
          prompt: "best GEO platform for B2B exporters",
          engine_id: "chatgpt_search",
          engine_name: "ChatGPT Search",
          data_status: "unavailable",
          brand_mentioned: null,
          recommendation_rank: null,
          captured_at: "2026-07-07T00:00:00.000Z"
        },
        {
          id: "vis-snap-perplexity",
          prompt_set_id: "vis-prompt-ui",
          prompt: "best GEO platform for B2B exporters",
          engine_id: "perplexity",
          engine_name: "Perplexity",
          data_status: "unavailable",
          brand_mentioned: null,
          recommendation_rank: null,
          captured_at: "2026-07-07T00:00:00.000Z"
        }
      ],
      runs: [
        {
          id: "vis-run-ui",
          trigger: "manual",
          status: "completed",
          data_source_type: "unavailable",
          snapshots_created: 2,
          created_at: "2026-07-07T00:00:00.000Z"
        }
      ]
    }
  });
  assert.match(siteAuditHtml, /站点 GEO 审计/, "International GEO page should render site audit workflow");
  assert.match(
    siteAuditHtml,
    /data-action="international-site-audit"/,
    "International GEO page should expose site audit action"
  );
  assert.match(
    siteAuditHtml,
    /data-action="international-site-assets"/,
    "International GEO page should expose site asset generation action"
  );
  assert.match(siteAuditHtml, /data-action="international-site-crawl"/);
  assert.match(siteAuditHtml, /抓取站点证据/);
  assert.match(siteAuditHtml, /抓取证据/);
  assert.match(siteAuditHtml, /robots\.txt/);
  assert.match(siteAuditHtml, /sitemap\.xml/);
  assert.match(siteAuditHtml, /评分拆解/, "International GEO page should render score breakdown");
  assert.match(siteAuditHtml, /得分 \/ 权重/, "International GEO checks should show score awarded over weight");
  assert.match(siteAuditHtml, /优先级/, "International GEO checks should show remediation priority");
  assert.match(siteAuditHtml, /置信度/, "International GEO checks should show scoring confidence");
  assert.doesNotThrow(
    () => renderInternationalGeo({ site_audits: { latest: { checks: [{ id: "legacy", label: "Legacy" }] } } }),
    "Legacy audit objects without scoring fields should render safely"
  );
  assert.match(siteAuditHtml, /GEO 资产/, "International GEO page should render GEO assets");
  assert.match(siteAuditHtml, /llms\.txt/, "International GEO page should render llms.txt assets");
  assert.match(siteAuditHtml, /证据驱动内容机会/, "International GEO page should render evidence opportunities");
  assert.match(siteAuditHtml, /资产生成队列/, "International GEO page should render the evidence asset queue");
  assert.match(siteAuditHtml, /证据来源/, "International GEO assets should render provenance metadata");
  assert.match(siteAuditHtml, /审核通过/, "International GEO evidence assets should expose approve action");
  assert.match(siteAuditHtml, /驳回/, "International GEO evidence assets should expose reject action");
  assert.match(siteAuditHtml, /文章生成队列/, "International GEO should render generated article queue");
  assert.match(siteAuditHtml, /多平台改写稿/, "International GEO should render platform rewrites");
  assert.match(siteAuditHtml, /生成记录/, "International GEO should render content generation runs");
  assert.match(siteAuditHtml, /data-action="international-content-articles-generate"/);
  assert.match(siteAuditHtml, /data-action="international-content-rewrites-generate"/);
  assert.match(siteAuditHtml, /local_rules/, "Content generation UI should expose local_rules provider boundary");
  assert.match(siteAuditHtml, /高权重发布平台清单/, "International GEO page should render the publishing platform list");
  assert.match(siteAuditHtml, /推荐概率说明/, "Publishing platform list should explain AI recommendation probability");
  assert.match(siteAuditHtml, /只能增加概率/, "Publishing platform list should avoid guaranteed AI recommendation claims");
  assert.match(siteAuditHtml, /发布包队列/, "International GEO page should render publishing package queue");
  assert.match(siteAuditHtml, /收录与推荐追踪/, "International GEO page should render publishing tracking ledger");
  assert.match(siteAuditHtml, /Manual \/ local/, "Publishing UI should expose the manual local boundary");
  assert.match(siteAuditHtml, /ChatGPT Search/, "Publishing matrix should show ChatGPT Search fit");
  assert.match(siteAuditHtml, /Gemini/, "Publishing matrix should show Gemini fit");
  assert.match(siteAuditHtml, /Claude/, "Publishing matrix should show Claude fit");
  assert.match(siteAuditHtml, /data-action="international-publishing-packages-generate"/);
  assert.match(siteAuditHtml, /data-action="international-publishing-package-approve"/);
  assert.match(siteAuditHtml, /data-action="international-publishing-package-reject"/);
  assert.match(siteAuditHtml, /AI 可见度测量/, "International GEO should render AI visibility measurement panel");
  assert.match(siteAuditHtml, /引擎数据源状态/, "International GEO should render engine provider readiness");
  assert.match(siteAuditHtml, /Prompt 测量快照/, "International GEO should render prompt measurement snapshots");
  assert.match(siteAuditHtml, /测量运行记录/, "International GEO should render visibility run history");
  assert.match(siteAuditHtml, /unavailable|simulated|measured/, "International GEO should expose data source labels");
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

function getCookieHeader(response) {
  const setCookie = response.headers?.["set-cookie"];
  return Array.isArray(setCookie)
    ? setCookie.map((item) => item.split(";")[0]).join("; ")
    : "";
}

async function loginHttp(port, username = "owner", password = "geo-owner-change-me") {
  const response = await httpRequest(port, "/api/v1/session/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });
  return {
    response,
    cookie: getCookieHeader(response)
  };
}

function runProductionStartupChecks() {
  const missingSecret = spawnSync(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(4300 + Math.floor(Math.random() * 300)),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_INTERNAL_API_KEY: ""
    },
    encoding: "utf8",
    timeout: 2000
  });

  assert.notEqual(
    missingSecret.status,
    0,
    "Production startup should fail without a fixed API key"
  );
  assert.match(
    `${missingSecret.stdout}\n${missingSecret.stderr}`,
    /GEO_INTERNAL_API_KEY/,
    "Production startup failure should mention GEO_INTERNAL_API_KEY"
  );
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
      GEO_MUTATION_RATE_LIMIT_PER_MINUTE: "2",
      GEO_INTERNAL_API_KEY: "test-internal-key-1234567890"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(child, port);

    const health = await httpRequest(port, "/healthz");
    assert.equal(health.status, 200, "Health route should return 200");
    assert.equal(health.body?.ok, true, "Health route should report ok");
    assert.equal(Boolean(health.body?.internal_api_key), false, "Health route must not expose secrets");

    const robots = await httpRequest(port, "/robots.txt");
    assert.equal(robots.status, 200, "robots.txt should be served");
    assert.match(String(robots.body), /Sitemap:/, "robots.txt should point to sitemap");

    const sitemap = await httpRequest(port, "/sitemap.xml");
    assert.equal(sitemap.status, 200, "sitemap.xml should be served");
    assert.match(String(sitemap.body), /<urlset/, "sitemap should be XML urlset");

    const llms = await httpRequest(port, "/llms.txt");
    assert.equal(llms.status, 200, "llms.txt should be served");
    assert.match(String(llms.body), /GEO Pulse/, "llms.txt should describe the product");

    const favicon = await httpRequest(port, "/favicon.ico");
    assert.equal(favicon.status, 200, "favicon should be served");

    const ownerLogin = await loginHttp(port);
    assert.equal(ownerLogin.response.status, 200, "Owner login should be available for security checks");
    const authHeaders = {
      Cookie: ownerLogin.cookie
    };
    const systemMutationHeaders = {
      "Content-Type": "application/json",
      "X-GEO-API-Key": "test-internal-key-1234567890"
    };

    const runtime = await httpRequest(port, "/api/v1/system/runtime", {
      headers: {
        ...authHeaders,
        Origin: "http://evil.example"
      }
    });
    assert.equal(runtime.status, 200, "Runtime GET should be readable after login");
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
    assert.ok(runtime.body?.data?.preflight, "Runtime status should include launch preflight summary");
    assert.ok(
      runtime.body?.data?.preflight?.checks?.some((item) => item.id === "persistence"),
      "Runtime preflight should include persistence check"
    );

    const preflight = await httpRequest(port, "/api/v1/system/preflight", {
      headers: authHeaders
    });
    assert.equal(preflight.status, 200, "Launch preflight should be queryable over HTTP");
    assert.match(
      String(preflight.body?.data?.status || ""),
      /ready|review|blocked/,
      "Launch preflight should expose an overall status"
    );
    assert.equal(typeof preflight.body?.data?.score, "number", "Launch preflight should expose a numeric score");
    assert.ok(
      preflight.body?.data?.summary?.passed >= 0,
      "Launch preflight should expose summary counts"
    );
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "mutation_auth"),
      "Launch preflight should include mutation auth check"
    );
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "backup_recovery"),
      "Launch preflight should include backup recovery check"
    );
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "connectors"),
      "Launch preflight should include connector readiness check"
    );
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "geo_static"),
      "Launch preflight should include GEO static route check"
    );
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "scheduler"),
      "Launch preflight should include scheduler check"
    );
    assert.doesNotMatch(
      JSON.stringify(preflight.body?.data || {}),
      /mutation_api_key|fixed-remote-token|demo-secret-key/,
      "Launch preflight should not expose secrets"
    );

    const unauthorizedReset = await httpRequest(port, "/api/v1/system/runtime/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    assert.equal(unauthorizedReset.status, 401, "Mutating API routes should require an API key by default");

    const failedAuthEvents = await httpRequest(port, "/api/v1/audit-events?action=auth.failure", {
      headers: authHeaders
    });
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
    assert.equal(
      clientConfig.body?.data?.mutation_api_key,
      "",
      "Client config should not expose mutation API key after built-in login"
    );

    const connectors = await httpRequest(port, "/api/v1/automation-connectors", {
      headers: authHeaders
    });
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

    const promptTemplates = await httpRequest(port, "/api/v1/prompt-templates", {
      headers: authHeaders
    });
    assert.equal(promptTemplates.status, 200, "Prompt template registry should be queryable over the API");
    assert.ok(
      promptTemplates.body?.data?.items?.some((item) => item.id === "geo_article_draft"),
      "Prompt template API should include the article draft template"
    );

    const qualityTraces = await httpRequest(port, "/api/v1/content-quality-traces", {
      headers: authHeaders
    });
    assert.equal(qualityTraces.status, 200, "Content quality traces should be queryable over the API");

    const authorizedReset = await httpRequest(port, "/api/v1/system/runtime/reset", {
      method: "POST",
      headers: systemMutationHeaders,
      body: "{}"
    });
    assert.equal(authorizedReset.status, 200, "Mutating API routes should accept the startup API key");

    const auditEvents = await httpRequest(port, "/api/v1/audit-events?action=runtime.reset", {
      headers: authHeaders
    });
    assert.equal(auditEvents.status, 200, "Audit events should be queryable over the API");
    assert.equal(
      auditEvents.body?.data?.items?.[0]?.action,
      "runtime.reset",
      "Audit events API should include the runtime reset event"
    );

    const auditExport = await httpRequest(port, "/api/v1/audit-events/export.csv?action=runtime.reset", {
      headers: authHeaders
    });
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
      headers: systemMutationHeaders,
      body: JSON.stringify({
        brand_name: "限流验收品牌"
      })
    });
    assert.equal(secondWrite.status, 200, "Second mutating request within the window should be accepted");

    const rateLimitedWrite = await httpRequest(port, "/api/v1/brand-profile", {
      method: "PUT",
      headers: systemMutationHeaders,
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
        ...systemMutationHeaders,
        "Content-Length": Buffer.byteLength(oversizedBody),
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

async function runMultiUserAccessHttpChecks() {
  const port = 3400 + Math.floor(Math.random() * 400);
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_MUTATION_RATE_LIMIT_PER_MINUTE: "80"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(child, port);

    const unauthenticatedSession = await httpRequest(port, "/api/v1/session/current");
    assert.equal(unauthenticatedSession.status, 200, "Session current should be public");
    assert.equal(
      unauthenticatedSession.body?.data?.authenticated,
      false,
      "Session current should report unauthenticated state without cookie"
    );

    const unauthenticatedWorkspace = await httpRequest(port, "/api/v1/workspaces/current");
    assert.equal(unauthenticatedWorkspace.status, 401, "Workspace reads should require login");

    const invalidLogin = await httpRequest(port, "/api/v1/session/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "owner",
        password: "wrong-password"
      })
    });
    assert.equal(invalidLogin.status, 401, "Invalid login should be rejected");

    const ownerLogin = await loginHttp(port);
    assert.equal(ownerLogin.response.status, 200, "Owner login should succeed");
    assert.equal(ownerLogin.response.body?.data?.authenticated, true, "Owner login should return authenticated session");
    assert.equal(ownerLogin.response.body?.data?.user?.role, "owner", "Owner login should return owner role");
    assert.ok(ownerLogin.cookie.includes("geo_session="), "Owner login should set geo_session cookie");
    assert.doesNotMatch(
      JSON.stringify(ownerLogin.response.body?.data || {}),
      /password_hash|geo-owner-change-me/,
      "Login response should not expose passwords or hashes"
    );

    const authenticatedWorkspace = await httpRequest(port, "/api/v1/workspaces/current", {
      headers: {
        Cookie: ownerLogin.cookie
      }
    });
    assert.equal(authenticatedWorkspace.status, 200, "Authenticated workspace read should succeed");

    const createdViewer = await httpRequest(port, "/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        username: "viewer1",
        display_name: "Viewer One",
        role: "viewer",
        temporary_password: "viewer-pass-1234"
      })
    });
    assert.equal(createdViewer.status, 201, "Owner should create viewer user");
    assert.equal(createdViewer.body?.data?.user?.role, "viewer", "Created viewer should keep viewer role");
    assert.doesNotMatch(JSON.stringify(createdViewer.body?.data || {}), /password_hash/, "User create response should not expose password hash");

    const viewerLogin = await loginHttp(port, "viewer1", "viewer-pass-1234");
    assert.equal(viewerLogin.response.status, 200, "Viewer login should succeed");
    const ownerHeaders = {
      "Content-Type": "application/json",
      Cookie: ownerLogin.cookie
    };
    const viewerHeaders = {
      "Content-Type": "application/json",
      Cookie: viewerLogin.cookie
    };
    const viewerWrite = await httpRequest(port, "/api/v1/topic-ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: viewerLogin.cookie
      },
      body: JSON.stringify({
        title: "Viewer should not write"
      })
    });
    assert.equal(viewerWrite.status, 403, "Viewer should not mutate topic ideas");

    const unauthAudit = await httpRequest(port, "/api/v1/international-geo/site-audits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        website_url: "https://example.com",
        product_name: "Example GEO Platform"
      })
    });
    assert.equal(unauthAudit.status, 401, "Unauthenticated site audit creation should be denied");

    const ownerAudit = await httpRequest(port, "/api/v1/international-geo/site-audits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        website_url: "https://example.com",
        product_name: "Example GEO Platform",
        target_market: "US",
        target_language: "en-US",
        primary_query: "best GEO platform for B2B teams",
        competitors: ["Semrush", "Ahrefs"]
      })
    });
    assert.equal(ownerAudit.status, 201, "Owner should create a site audit");
    assert.equal(
      ownerAudit.body?.data?.score_breakdown?.total_weight,
      100,
      "Owner-created site audit should expose weighted score breakdown"
    );
    assert.ok(
      ownerAudit.body?.data?.checks?.every((item) => Number.isFinite(item.score_awarded)),
      "Owner-created site audit checks should expose awarded points"
    );
    assert.ok(
      ownerAudit.body?.data?.checks?.some((item) => item.id === "robots_ai_access"),
      "Owner-created site audit should include AI crawler robots access checks"
    );

    const unauthCrawl = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${ownerAudit.body?.data?.id}/crawl`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      }
    );
    assert.equal(unauthCrawl.status, 401, "Unauthenticated site crawl should be denied");

    const viewerCrawl = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${ownerAudit.body?.data?.id}/crawl`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: viewerLogin.cookie
        },
        body: "{}"
      }
    );
    assert.equal(viewerCrawl.status, 403, "Viewer should not crawl site audit evidence");

    const missingCrawl = await httpRequest(port, "/api/v1/international-geo/site-audits/missing/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: "{}"
    });
    assert.equal(missingCrawl.status, 404, "Unknown site crawl audit should return 404");

    const blockedAudit = await httpRequest(port, "/api/v1/international-geo/site-audits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        website_url: "http://127.0.0.1",
        product_name: "Blocked Crawl Target"
      })
    });
    assert.equal(blockedAudit.status, 201, "Audit can store a URL that live crawler later blocks");
    const blockedCrawl = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${blockedAudit.body?.data?.id}/crawl`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: ownerLogin.cookie
        },
        body: "{}"
      }
    );
    assert.equal(blockedCrawl.status, 400, "Blocked crawl target should return 400");
    assert.equal(blockedCrawl.body?.error?.code, "CRAWL_TARGET_BLOCKED");

    const viewerAssets = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${ownerAudit.body?.data?.id}/assets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: viewerLogin.cookie
        },
        body: "{}"
      }
    );
    assert.equal(viewerAssets.status, 403, "Viewer should not generate site audit assets");

    const ownerAssets = await httpRequest(
      port,
      `/api/v1/international-geo/site-audits/${ownerAudit.body?.data?.id}/assets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: ownerLogin.cookie
        },
        body: "{}"
      }
    );
    assert.equal(ownerAssets.status, 201, "Owner should generate site audit assets");
    assert.ok(
      ownerAssets.body?.data?.items?.some((item) => item.asset_type === "llms_txt"),
      "Generated site audit assets should include llms.txt"
    );

    const visibilityRead = await httpRequest(port, "/api/v1/international-geo/visibility", {
      headers: { Cookie: viewerLogin.cookie }
    });
    assert.equal(visibilityRead.status, 200, "Viewer should read International GEO visibility state");
    assert.ok(
      visibilityRead.body?.data?.provider_readiness?.length >= 1,
      "Visibility HTTP read should include provider readiness"
    );

    const viewerPromptWrite = await httpRequest(port, "/api/v1/international-geo/visibility/prompt-sets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: viewerLogin.cookie
      },
      body: JSON.stringify({ prompt: "viewer should not write prompts" })
    });
    assert.equal(viewerPromptWrite.status, 403, "Viewer should not create visibility prompt sets");

    const ownerPromptWrite = await httpRequest(port, "/api/v1/international-geo/visibility/prompt-sets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        prompt: "best AI visibility platform",
        engines: ["chatgpt_search", "perplexity"]
      })
    });
    assert.equal(ownerPromptWrite.status, 201, "Owner should create visibility prompt sets");

    const ownerVisibilityRun = await httpRequest(port, "/api/v1/international-geo/visibility/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({ trigger: "manual" })
    });
    assert.equal(ownerVisibilityRun.status, 200, "Owner should run visibility measurement");
    assert.equal(
      ownerVisibilityRun.body?.data?.run?.data_source_type,
      "unavailable",
      "HTTP visibility run should not claim measured data without a provider"
    );

    const viewerEvidenceAssets = await httpRequest(port, "/api/v1/international-geo/evidence-assets", {
      headers: {
        Cookie: viewerLogin.cookie
      }
    });
    assert.equal(viewerEvidenceAssets.status, 200, "Viewer should read International GEO evidence assets");
    assert.ok(
      viewerEvidenceAssets.body?.data?.summary,
      "Evidence assets HTTP response should include a summary"
    );

    const viewerGenerateEvidenceAssets = await httpRequest(port, "/api/v1/international-geo/evidence-assets/generate", {
      method: "POST",
      headers: {
        Cookie: viewerLogin.cookie
      }
    });
    assert.equal(viewerGenerateEvidenceAssets.status, 403, "Viewer should not generate evidence assets");

    const ownerGenerateEvidenceAssets = await httpRequest(port, "/api/v1/international-geo/evidence-assets/generate", {
      method: "POST",
      headers: {
        Cookie: ownerLogin.cookie
      }
    });
    assert.equal(ownerGenerateEvidenceAssets.status, 201, "Owner should generate evidence assets");
    assert.ok(
      ownerGenerateEvidenceAssets.body?.data?.assets?.length >= 6,
      "Owner evidence asset generation should return generated assets"
    );

    const generatedEvidenceAssetId = ownerGenerateEvidenceAssets.body.data.assets[0].id;
    const viewerReviewEvidenceAsset = await httpRequest(
      port,
      `/api/v1/international-geo/evidence-assets/${generatedEvidenceAssetId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: viewerLogin.cookie
        },
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(viewerReviewEvidenceAsset.status, 403, "Viewer should not review evidence assets");

    const ownerReviewEvidenceAsset = await httpRequest(
      port,
      `/api/v1/international-geo/evidence-assets/${generatedEvidenceAssetId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: ownerLogin.cookie
        },
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(ownerReviewEvidenceAsset.status, 200, "Owner should review evidence assets");
    assert.equal(ownerReviewEvidenceAsset.body?.data?.review_status, "approved");

    const invalidEvidenceAssetReview = await httpRequest(
      port,
      `/api/v1/international-geo/evidence-assets/${generatedEvidenceAssetId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: ownerLogin.cookie
        },
        body: JSON.stringify({ action: "publish" })
      }
    );
    assert.equal(invalidEvidenceAssetReview.status, 400, "Invalid evidence asset review should fail");

    const httpPublishingAssetTypes = new Set(["comparison_brief", "definition_brief"]);
    for (const asset of ownerGenerateEvidenceAssets.body.data.assets.filter(
      (item) => httpPublishingAssetTypes.has(item.asset_type) && item.id !== generatedEvidenceAssetId
    )) {
      const ownerReviewPublishingSourceAsset = await httpRequest(
        port,
        `/api/v1/international-geo/evidence-assets/${asset.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: ownerLogin.cookie
          },
          body: JSON.stringify({ action: "approve" })
        }
      );
      assert.equal(
        ownerReviewPublishingSourceAsset.status,
        200,
        `Owner should approve ${asset.asset_type} evidence assets for publishing package generation`
      );
      assert.equal(ownerReviewPublishingSourceAsset.body?.data?.review_status, "approved");
    }

    const viewerPublishing = await httpRequest(port, "/api/v1/international-geo/publishing", {
      headers: viewerHeaders
    });
    assert.equal(viewerPublishing.status, 200, "Viewer should read International GEO publishing workflow");
    assert.ok(viewerPublishing.body?.data?.summary, "Publishing HTTP response should include a summary");
    assert.ok(
      viewerPublishing.body?.data?.platforms?.length >= 16,
      "Publishing HTTP response should include default platform rows"
    );

    const viewerGeneratePublishing = await httpRequest(port, "/api/v1/international-geo/publishing/packages/generate", {
      method: "POST",
      headers: viewerHeaders
    });
    assert.equal(viewerGeneratePublishing.status, 403, "Viewer should not generate publishing packages");

    const ownerGeneratePublishing = await httpRequest(port, "/api/v1/international-geo/publishing/packages/generate", {
      method: "POST",
      headers: ownerHeaders
    });
    assert.equal(ownerGeneratePublishing.status, 201, "Owner should generate publishing packages");
    assert.ok(
      ownerGeneratePublishing.body?.data?.packages?.length >= 6,
      "Owner publishing package generation should return package rows"
    );

    const generatedPublishingPackageId = ownerGeneratePublishing.body.data.packages[0].id;
    const viewerReviewPublishing = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/packages/${generatedPublishingPackageId}/review`,
      {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(viewerReviewPublishing.status, 403, "Viewer should not review publishing packages");

    const ownerReviewPublishing = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/packages/${generatedPublishingPackageId}/review`,
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({ action: "approve" })
      }
    );
    assert.equal(ownerReviewPublishing.status, 200, "Owner should review publishing packages");
    assert.equal(ownerReviewPublishing.body?.data?.review_status, "approved");

    const invalidPublishingReview = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/packages/${generatedPublishingPackageId}/review`,
      {
        method: "POST",
        headers: ownerHeaders,
        body: JSON.stringify({ action: "publish" })
      }
    );
    assert.equal(invalidPublishingReview.status, 400, "Invalid publishing package review should fail");

    const generatedTrackingId = ownerGeneratePublishing.body.data.tracking[0].id;
    const viewerTrackingUpdate = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/tracking/${generatedTrackingId}`,
      {
        method: "PUT",
        headers: viewerHeaders,
        body: JSON.stringify({ indexing_status: "indexed" })
      }
    );
    assert.equal(viewerTrackingUpdate.status, 403, "Viewer should not update publishing tracking");

    const ownerTrackingUpdate = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/tracking/${generatedTrackingId}`,
      {
        method: "PUT",
        headers: ownerHeaders,
        body: JSON.stringify({
          publication_status: "manually_published",
          published_url: "https://example.com/manual-published-package",
          canonical_url: "https://example.com",
          indexing_status: "indexed",
          ai_mention_status: "mentioned",
          citation_status: "cited",
          recommendation_status: "recommended"
        })
      }
    );
    assert.equal(ownerTrackingUpdate.status, 200, "Owner should update publishing tracking");
    assert.equal(ownerTrackingUpdate.body?.data?.publication_status, "manually_published");

    const invalidTrackingUpdate = await httpRequest(
      port,
      `/api/v1/international-geo/publishing/tracking/${generatedTrackingId}`,
      {
        method: "PUT",
        headers: ownerHeaders,
        body: JSON.stringify({
          publication_status: "manually_published",
          published_url: ""
        })
      }
    );
    assert.equal(invalidTrackingUpdate.status, 400, "Invalid publishing tracking update should fail");

    const createdEditor = await httpRequest(port, "/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        username: "editor1",
        display_name: "Editor One",
        role: "editor",
        temporary_password: "editor-pass-1234"
      })
    });
    assert.equal(createdEditor.status, 201, "Owner should create editor user");

    const editorLogin = await loginHttp(port, "editor1", "editor-pass-1234");
    assert.equal(editorLogin.response.status, 200, "Editor login should succeed");
    const editorTopic = await httpRequest(port, "/api/v1/topic-ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: editorLogin.cookie
      },
      body: JSON.stringify({
        title: "Editor-created GEO topic"
      })
    });
    assert.equal(editorTopic.status, 201, "Editor should create operational topic ideas");

    const editorConfigWrite = await httpRequest(port, "/api/v1/model-configs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: editorLogin.cookie
      },
      body: JSON.stringify({
        provider: "Editor blocked provider"
      })
    });
    assert.equal(editorConfigWrite.status, 403, "Editor should not change model configuration");

    const createdAdmin = await httpRequest(port, "/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ownerLogin.cookie
      },
      body: JSON.stringify({
        username: "admin1",
        display_name: "Admin One",
        role: "admin",
        temporary_password: "admin-pass-1234"
      })
    });
    assert.equal(createdAdmin.status, 201, "Owner should create admin user");

    const adminLogin = await loginHttp(port, "admin1", "admin-pass-1234");
    assert.equal(adminLogin.response.status, 200, "Admin login should succeed");
    const adminCreatesEditor = await httpRequest(port, "/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminLogin.cookie
      },
      body: JSON.stringify({
        username: "editor2",
        display_name: "Editor Two",
        role: "editor",
        temporary_password: "editor-two-pass-1234"
      })
    });
    assert.equal(adminCreatesEditor.status, 201, "Admin should create editor users");

    const adminCreatesOwner = await httpRequest(port, "/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminLogin.cookie
      },
      body: JSON.stringify({
        username: "owner2",
        display_name: "Owner Two",
        role: "owner",
        temporary_password: "owner-two-pass-1234"
      })
    });
    assert.equal(adminCreatesOwner.status, 403, "Admin should not create owner users");

    const authAudit = await httpRequest(port, "/api/v1/audit-events?action=auth.login.failure", {
      headers: {
        Cookie: adminLogin.cookie
      }
    });
    assert.equal(authAudit.status, 200, "Admin should read auth audit events");
    assert.equal(
      authAudit.body?.data?.items?.[0]?.action,
      "auth.login.failure",
      "Invalid login should record audit event"
    );
    assert.doesNotMatch(
      JSON.stringify(authAudit.body?.data || {}),
      /wrong-password|password_hash|geo_session/,
      "Auth audit events should not expose secrets"
    );

    const preflight = await httpRequest(port, "/api/v1/system/preflight", {
      headers: {
        Cookie: adminLogin.cookie
      }
    });
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "user_auth"),
      "Launch preflight should include user auth check"
    );
    assert.ok(
      preflight.body?.data?.checks?.some((item) => item.id === "session_security"),
      "Launch preflight should include session security check"
    );

    const logout = await httpRequest(port, "/api/v1/session/logout", {
      method: "POST",
      headers: {
        Cookie: ownerLogin.cookie
      }
    });
    assert.equal(logout.status, 200, "Logout should succeed");
    assert.match(String(logout.headers["set-cookie"] || ""), /geo_session=;/, "Logout should clear session cookie");

    const afterLogout = await httpRequest(port, "/api/v1/workspaces/current", {
      headers: {
        Cookie: ownerLogin.cookie
      }
    });
    assert.equal(afterLogout.status, 401, "Logged out session should no longer read workspace");
  } finally {
    child.kill("SIGTERM");
  }
}

async function runSingleUserHttpChecks() {
  const port = 3800 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      GEO_ENABLE_PERSISTENCE: "0",
      GEO_MUTATION_RATE_LIMIT_PER_MINUTE: "80"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await waitForServerReady(child, port);
    const ownerLogin = await loginHttp(port);
    assert.equal(ownerLogin.response.status, 200, "Single-user HTTP checks should log in owner first");
    const readHeaders = {
      Cookie: ownerLogin.cookie
    };
    const mutationHeaders = {
      "Content-Type": "application/json",
      Cookie: ownerLogin.cookie
    };

    const workspace = await httpRequest(port, "/api/v1/workspace-input", {
      method: "PUT",
      headers: mutationHeaders,
      body: JSON.stringify({
        website_url: "https://example.com",
        product_name: "AgentCore GEO",
        target_markets: ["US"]
      })
    });
    assert.equal(workspace.status, 200, "Workspace input should be mutable over HTTP");
    assert.equal(workspace.body?.data?.product_name, "AgentCore GEO", "Workspace input API should return saved product");

    const topic = await httpRequest(port, "/api/v1/topic-ideas", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        title: "AI search readiness HTTP topic",
        keyword: "AI search readiness",
        template_type: "how_to"
      })
    });
    assert.equal(topic.status, 201, "Manual topic should be creatable over HTTP");

    const outline = await httpRequest(port, `/api/v1/topic-ideas/${topic.body.data.id}/outline`, {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(outline.status, 200, "Topic outline should be generatable over HTTP");
    assert.ok(outline.body?.data?.outline_json?.length >= 4, "Topic outline API should return sections");

    const article = await httpRequest(port, "/api/v1/articles", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        topic_idea_id: topic.body.data.id,
        title: "AI Search Readiness HTTP Article",
        content_markdown: "Direct answer: structure your facts for AI engines."
      })
    });
    assert.equal(article.status, 201, "Manual article should be creatable over HTTP");

    const exportJob = await httpRequest(port, "/api/v1/exports", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        artifact_type: "content_articles",
        format: "csv"
      })
    });
    assert.equal(exportJob.status, 201, "Export job should be creatable over HTTP");
    const exportDownload = await httpRequest(port, `/api/v1/exports/${exportJob.body.data.id}/download`, {
      headers: readHeaders
    });
    assert.equal(exportDownload.status, 200, "Export download should be available over HTTP");
    assert.match(String(exportDownload.body), /AI Search Readiness HTTP Article|title/, "Export download should contain exported data");

    const internationalInput = await httpRequest(port, "/api/v1/international-geo/input", {
      method: "PUT",
      headers: mutationHeaders,
      body: JSON.stringify({
        website_url: "https://example.com",
        product_name: "AgentCore GEO",
        target_market: "United States"
      })
    });
    assert.equal(internationalInput.status, 200, "International GEO input should save over HTTP");

    const internationalAudit = await httpRequest(port, "/api/v1/international-geo/audit", {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(internationalAudit.status, 200, "International GEO audit should run over HTTP");
    assert.ok(
      internationalAudit.body?.data?.engineVisibility?.some((item) => item.engine === "Gemini"),
      "International GEO HTTP audit should include Gemini"
    );

    const internationalArtifacts = await httpRequest(port, "/api/v1/international-geo/artifacts", {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(internationalArtifacts.status, 200, "International GEO artifacts should generate over HTTP");
    assert.match(internationalArtifacts.body?.data?.llms_txt || "", /AgentCore GEO/, "Artifacts API should return llms.txt");

    const billingPlan = await httpRequest(port, "/api/v1/billing/plan", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({ plan_id: "single_user_pro", billing_cycle: "monthly" })
    });
    assert.equal(billingPlan.status, 200, "Billing plan should update over HTTP");

    const savedConnector = await httpRequest(port, "/api/v1/automation-connectors/firecrawl_source", {
      method: "PUT",
      headers: mutationHeaders,
      body: JSON.stringify({
        is_enabled: true,
        status: "ready",
        endpoint: "mock://source-crawl-http",
        api_key: "http-connector-secret-key",
        timeout_ms: 9000,
        retry_count: 1,
        notes: "HTTP 验收连接器"
      })
    });
    assert.equal(savedConnector.status, 200, "Connector config should be mutable over HTTP");
    assert.equal(savedConnector.body?.data?.config?.endpoint, "mock://source-crawl-http", "Connector HTTP save should return endpoint");
    assert.doesNotMatch(
      JSON.stringify(savedConnector.body?.data || {}),
      /http-connector-secret-key/,
      "Connector HTTP save should not expose raw secrets"
    );

    const connectorTest = await httpRequest(port, "/api/v1/automation-connectors/firecrawl_source/test", {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(connectorTest.status, 200, "Connector test should run over HTTP");
    assert.equal(connectorTest.body?.data?.success, true, "Mock connector HTTP test should succeed");

    const connectorHealth = await httpRequest(port, "/api/v1/connector-health-checks", {
      headers: readHeaders
    });
    assert.equal(connectorHealth.status, 200, "Connector health checks should be queryable over HTTP");
    assert.ok(
      connectorHealth.body?.data?.items?.some((item) => item.connector_id === "firecrawl_source"),
      "Connector health API should include recent connector tests"
    );

    const connectorDiagnostic = await httpRequest(port, "/api/v1/automation-connectors/firecrawl_source/diagnose", {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(connectorDiagnostic.status, 200, "Connector diagnostic should run over HTTP");
    assert.equal(
      connectorDiagnostic.body?.data?.connector_id,
      "firecrawl_source",
      "Connector diagnostic API should identify the connector"
    );
    assert.ok(
      connectorDiagnostic.body?.data?.readiness_score >= 80,
      "Connector diagnostic API should expose readiness score"
    );
    assert.doesNotMatch(
      JSON.stringify(connectorDiagnostic.body?.data || {}),
      /http-connector-secret-key/,
      "Connector diagnostic API should not expose raw secrets"
    );

    const connectorDiagnostics = await httpRequest(port, "/api/v1/connector-diagnostics", {
      headers: readHeaders
    });
    assert.equal(connectorDiagnostics.status, 200, "Connector diagnostics should be queryable over HTTP");
    assert.ok(
      connectorDiagnostics.body?.data?.items?.some((item) => item.connector_id === "firecrawl_source"),
      "Connector diagnostics API should include recent diagnostics"
    );

    const backupBaselineBrand = await httpRequest(port, "/api/v1/brand-profile", {
      method: "PUT",
      headers: mutationHeaders,
      body: JSON.stringify({
        brand_name: "HTTP 备份品牌"
      })
    });
    assert.equal(backupBaselineBrand.status, 200, "Brand profile should be mutable before backup");

    const createdBackup = await httpRequest(port, "/api/v1/system/backups", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        name: "HTTP 验收备份"
      })
    });
    assert.equal(createdBackup.status, 201, "Runtime backup should be creatable over HTTP");
    assert.match(createdBackup.body?.data?.id || "", /^bkp-/, "Runtime backup API should return a backup id");

    const backupList = await httpRequest(port, "/api/v1/system/backups", {
      headers: readHeaders
    });
    assert.equal(backupList.status, 200, "Runtime backups should be listable over HTTP");
    assert.ok(
      backupList.body?.data?.items?.some((item) => item.id === createdBackup.body.data.id),
      "Runtime backup list API should include the created backup"
    );

    const backupDownload = await httpRequest(port, `/api/v1/system/backups/${createdBackup.body.data.id}/download`, {
      headers: readHeaders
    });
    assert.equal(backupDownload.status, 200, "Runtime backup download should be available over HTTP");
    assert.equal(
      backupDownload.body?.data?.kind,
      "geo-pulse-runtime-backup",
      "Runtime backup download API should return a backup artifact"
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(backupDownload.body?.data?.snapshot || {}, "runtimeBackups"),
      false,
      "Runtime backup download API should not include recursive backup history"
    );

    const backupValidation = await httpRequest(port, `/api/v1/system/backups/${createdBackup.body.data.id}/validate`, {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(backupValidation.status, 200, "Runtime backup validation should run over HTTP");
    assert.equal(backupValidation.body?.data?.valid, true, "Runtime backup validation API should mark created backup valid");

    const backupImportValidation = await httpRequest(port, "/api/v1/system/backups/import/validate", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        artifact: backupDownload.body.data
      })
    });
    assert.equal(backupImportValidation.status, 200, "Runtime backup import validation should run over HTTP");
    assert.equal(
      backupImportValidation.body?.data?.valid,
      true,
      `Runtime backup import validation API should mark downloaded artifact valid: ${JSON.stringify(backupImportValidation.body?.data || {})}`
    );
    assert.equal(
      backupImportValidation.body?.data?.source_backup_id,
      createdBackup.body.data.id,
      "Runtime backup import validation API should expose source backup id"
    );

    const importedBackup = await httpRequest(port, "/api/v1/system/backups/import", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        artifact: backupDownload.body.data,
        name: "HTTP 导入备份"
      })
    });
    assert.equal(
      importedBackup.status,
      201,
      `Runtime backup import should run over HTTP: ${JSON.stringify(importedBackup.body)}`
    );
    assert.notEqual(
      importedBackup.body?.data?.id,
      createdBackup.body.data.id,
      "Runtime backup import API should assign a new local backup id"
    );
    assert.equal(importedBackup.body?.data?.imported, true, "Runtime backup import API should mark backups imported");
    assert.equal(
      importedBackup.body?.data?.source_backup_id,
      createdBackup.body.data.id,
      "Runtime backup import API should preserve source backup id"
    );

    const mutatedBrand = await httpRequest(port, "/api/v1/brand-profile", {
      method: "PUT",
      headers: mutationHeaders,
      body: JSON.stringify({
        brand_name: "HTTP 恢复前临时品牌"
      })
    });
    assert.equal(mutatedBrand.status, 200, "Brand profile should be mutable after backup");

    const restoredBackup = await httpRequest(port, `/api/v1/system/backups/${createdBackup.body.data.id}/restore`, {
      method: "POST",
      headers: mutationHeaders,
      body: "{}"
    });
    assert.equal(restoredBackup.status, 200, "Runtime backup restore should run over HTTP");
    assert.equal(restoredBackup.body?.data?.restored, true, "Runtime backup restore API should report success");

    const restoredBrand = await httpRequest(port, "/api/v1/brand-profile", {
      headers: readHeaders
    });
    assert.equal(restoredBrand.status, 200, "Brand profile should be readable after restore");
    assert.equal(
      restoredBrand.body?.data?.brand_name,
      "HTTP 备份品牌",
      "Runtime backup restore API should recover captured brand profile state"
    );

    const unsafeConnector = await httpRequest(port, "/api/v1/automation-connectors/firecrawl_source", {
      method: "PUT",
      headers: mutationHeaders,
      body: JSON.stringify({
        endpoint: "http://127.0.0.1:7788/internal"
      })
    });
    assert.equal(unsafeConnector.status, 400, "Connector HTTP save should reject loopback endpoints");

    const logout = await httpRequest(port, "/api/v1/session/logout", {
      method: "POST",
      headers: readHeaders,
      body: JSON.stringify({ reason: "http_acceptance" })
    });
    assert.equal(logout.status, 200, "Single-user logout should be available over HTTP");
    assert.equal(logout.body?.data?.success, true, "Logout API should return success");
  } finally {
    child.kill();
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

    const ownerLogin = await loginHttp(port);
    assert.equal(ownerLogin.response.status, 200, "Scheduler audit test should log in owner");
    const authHeaders = {
      Cookie: ownerLogin.cookie
    };
    const mutationHeaders = {
      "Content-Type": "application/json",
      Cookie: ownerLogin.cookie
    };

    const tick = await httpRequest(port, "/api/v1/system/runtime/scheduler/tick", {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({})
    });
    assert.equal(tick.status, 200, "Manual scheduler tick should be callable");

    const auditEvents = await httpRequest(port, "/api/v1/audit-events?action=scheduler.tick", {
      headers: authHeaders
    });
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

    const ownerLogin = await loginHttp(port);
    assert.equal(ownerLogin.response.status, 200, "Audit CSV spreadsheet safety test should log in owner");
    const auditExport = await httpRequest(port, "/api/v1/audit-events/export.csv", {
      headers: {
        Cookie: ownerLogin.cookie
      }
    });
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
  runSingleUserSourceChecks();
  await runMockDataChecks();
  await runSingleUserCompleteChecks();
  runRouteStateChecks();
  runExperienceChecks();
  runAuthUiChecks();
  runSettingsAuditUiChecks();
  runSettingsAutomationStepUiChecks();
  runSettingsConnectorUiChecks();
  runKeywordSourceAdapterUiChecks();
  runSettingsPromptTraceUiChecks();
  runDistributionPublishingOpsUiChecks();
  runAnalyticsVisibilityUiChecks();
  runAnalyticsCampaignUiChecks();
  runInternationalGeoUiChecks();
  runPersistenceChecks();
  runProductionStartupChecks();
  await runHttpSecurityChecks();
  await runMultiUserAccessHttpChecks();
  await runSingleUserHttpChecks();
  await runSchedulerAuditChecks();
  await runAuditCsvSpreadsheetSafetyChecks();
  await runRemoteAccessSecurityChecks();
  console.log("verify-mvp: OK");
} catch (error) {
  console.error("verify-mvp: FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
