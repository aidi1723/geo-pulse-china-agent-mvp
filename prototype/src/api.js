import { handleStaticRequest } from "./static-api.js?v=20260417-5";

const jsonHeaders = {
  Accept: "application/json"
};

const fetchOptions = {
  credentials: "same-origin"
};

const isStaticPreview =
  typeof window !== "undefined" && window.location?.protocol === "file:";

let clientConfigPromise = null;

async function getClientConfig() {
  if (isStaticPreview) {
    return {};
  }

  if (!clientConfigPromise) {
    clientConfigPromise = fetch("/api/v1/system/client-config", {
      ...fetchOptions,
      headers: jsonHeaders
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Client config failed: ${response.status}`);
        }
        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error?.message || "Unknown client config error");
        }
        return payload.data || {};
      })
      .catch(() => ({}));
  }

  return clientConfigPromise;
}

async function getMutationHeaders() {
  const config = await getClientConfig();
  const headerName = config.mutation_header_name || "X-GEO-API-Key";
  const apiKey = config.mutation_api_key || "";
  return apiKey ? { [headerName]: apiKey } : {};
}

async function request(path) {
  if (isStaticPreview) {
    return handleStaticRequest(path, "GET");
  }

  try {
    const response = await fetch(path, {
      ...fetchOptions,
      headers: jsonHeaders
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const payload = await response.json();
    if (!payload.success) {
      throw new Error(payload.error?.message || "Unknown API error");
    }
    return payload.data;
  } catch (error) {
    return fallbackStaticRequest(path, error);
  }
}

async function requestJson(path, method, body) {
  if (isStaticPreview) {
    return handleStaticRequest(path, method, body);
  }

  const mutationHeaders = await getMutationHeaders();
  const response = await fetch(path, {
    ...fetchOptions,
    method,
    headers: {
      ...jsonHeaders,
      "Content-Type": "application/json",
      ...mutationHeaders
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error?.message || "Unknown API error");
  }
  return payload.data;
}

async function fallbackStaticRequest(path, originalError) {
  try {
    return await handleStaticRequest(path, "GET");
  } catch {
    throw originalError;
  }
}

function extractItems(result) {
  return result.items || [];
}

export async function bootstrapData() {
  const [
    workspace,
    workspaceInput,
    dashboardSummary,
    keywordTrend,
    contentFunnel,
    topKeywords,
    recentPublishes,
    keywordsResult,
    keywordJobsResult,
    topicsResult,
    articlesResult,
    templatesResult,
    publishTasksResult,
    publishRecordsResult,
    channelsResult,
    mediaSourcesResult,
    automationProvidersResult,
    automationConnectorsResult,
    providerInvocationsResult,
    auditEventsResult,
    sourceStrategiesResult,
    automationRunsResult,
    analyticsKeywords,
    analyticsContent,
    analyticsChannels,
    analyticsCampaigns,
    analyticsVisibility,
    audienceSegmentsResult,
    marketingCampaignsResult,
    billingSummary,
    invoicesResult,
    internationalGeo,
    runtimeStatus,
    brandProfile,
    modelConfigsResult,
    promptTemplatesResult,
    contentQualityTracesResult,
    membersResult,
    usersResult
  ] = await Promise.all([
    request("/api/v1/workspaces/current"),
    request("/api/v1/workspace-input"),
    request("/api/v1/dashboard/summary"),
    request("/api/v1/dashboard/keyword-trend"),
    request("/api/v1/dashboard/content-funnel"),
    request("/api/v1/dashboard/top-keywords"),
    request("/api/v1/dashboard/recent-publishes"),
    request("/api/v1/keywords"),
    request("/api/v1/keyword-crawl-jobs"),
    request("/api/v1/topic-ideas"),
    request("/api/v1/articles"),
    request("/api/v1/content-templates"),
    request("/api/v1/publish-tasks"),
    request("/api/v1/publish-records"),
    request("/api/v1/channels"),
    request("/api/v1/media-sources"),
    request("/api/v1/automation-providers"),
    request("/api/v1/automation-connectors"),
    request("/api/v1/provider-invocations"),
    request("/api/v1/audit-events?page_size=20"),
    request("/api/v1/source-strategies"),
    request("/api/v1/automation-runs"),
    request("/api/v1/analytics/keywords"),
    request("/api/v1/analytics/content"),
    request("/api/v1/analytics/channels"),
    request("/api/v1/analytics/campaigns"),
    request("/api/v1/analytics/visibility"),
    request("/api/v1/audience-segments"),
    request("/api/v1/marketing-campaigns"),
    request("/api/v1/billing/summary"),
    request("/api/v1/billing/invoices"),
    request("/api/v1/international-geo"),
    request("/api/v1/system/runtime"),
    request("/api/v1/brand-profile"),
    request("/api/v1/model-configs"),
    request("/api/v1/prompt-templates"),
    request("/api/v1/content-quality-traces?page_size=20"),
    request("/api/v1/members"),
    request("/api/v1/users")
  ]);

  return {
    workspace,
    workspaceInput,
    dashboardSummary,
    keywordTrend,
    contentFunnel,
    topKeywords,
    recentPublishes,
    keywords: extractItems(keywordsResult),
    keywordJobs: extractItems(keywordJobsResult),
    topics: extractItems(topicsResult),
    articles: extractItems(articlesResult),
    templates: extractItems(templatesResult),
    publishTasks: extractItems(publishTasksResult),
    publishRecords: extractItems(publishRecordsResult),
    channels: extractItems(channelsResult),
    mediaSources: extractItems(mediaSourcesResult),
    automationProviders: extractItems(automationProvidersResult),
    automationConnectors: extractItems(automationConnectorsResult),
    providerInvocations: extractItems(providerInvocationsResult),
    auditEvents: extractItems(auditEventsResult),
    sourceStrategies: extractItems(sourceStrategiesResult),
    automationRuns: extractItems(automationRunsResult),
    analyticsKeywords,
    analyticsContent,
    analyticsChannels,
    analyticsCampaigns,
    analyticsVisibility,
    audienceSegments: extractItems(audienceSegmentsResult),
    marketingCampaigns: extractItems(marketingCampaignsResult),
    billingSummary,
    invoices: extractItems(invoicesResult),
    internationalGeo,
    runtimeStatus,
    brandProfile,
    modelConfigs: extractItems(modelConfigsResult),
    promptTemplates: extractItems(promptTemplatesResult),
    contentQualityTraces: extractItems(contentQualityTracesResult),
    members: extractItems(membersResult),
    users: extractItems(usersResult)
  };
}

export function getCurrentSession() {
  return request("/api/v1/session/current");
}

export function loginSession(payload) {
  return requestJson("/api/v1/session/login", "POST", payload);
}

export function createKeywordCrawlJob(payload) {
  return requestJson("/api/v1/keyword-crawl-jobs", "POST", payload);
}

export function runSourceStrategy(strategyId, payload = {}) {
  return requestJson(`/api/v1/source-strategies/${strategyId}/run`, "POST", payload);
}

export function saveSourceStrategy(strategyId, payload) {
  return requestJson(`/api/v1/source-strategies/${strategyId}`, "PUT", payload);
}

export function saveAutomationProvider(providerId, payload) {
  return requestJson(`/api/v1/automation-providers/${providerId}`, "PUT", payload);
}

export function saveAutomationConnector(connectorId, payload) {
  return requestJson(`/api/v1/automation-connectors/${connectorId}`, "PUT", payload);
}

export function getAutomationProviderProtocol(providerId) {
  return request(`/api/v1/automation-providers/${providerId}/protocol`);
}

export function testAutomationProvider(providerId) {
  return requestJson(`/api/v1/automation-providers/${providerId}/test`, "POST", {});
}

export function testAutomationConnector(connectorId) {
  return requestJson(`/api/v1/automation-connectors/${connectorId}/test`, "POST", {});
}

export function runConnectorDiagnostic(connectorId) {
  return requestJson(`/api/v1/automation-connectors/${connectorId}/diagnose`, "POST", {});
}

export function retryAutomationRun(runId) {
  return requestJson(`/api/v1/automation-runs/${runId}/retry`, "POST", {});
}

export function updateKeyword(keywordId, action) {
  return requestJson(`/api/v1/keywords/${keywordId}/actions`, "POST", {
    action
  });
}

export function createTopicsFromKeywords(keywordIds, templateType = "decision") {
  return requestJson("/api/v1/topic-ideas/from-keywords", "POST", {
    keyword_ids: keywordIds,
    template_type: templateType
  });
}

export function createManualTopic(payload) {
  return requestJson("/api/v1/topic-ideas", "POST", payload);
}

export function updateTopic(topicId, payload) {
  return requestJson(`/api/v1/topic-ideas/${topicId}`, "PUT", payload);
}

export function generateTopicOutline(topicId) {
  return requestJson(`/api/v1/topic-ideas/${topicId}/outline`, "POST", {});
}

export function getArticleDetail(articleId) {
  return request(`/api/v1/articles/${articleId}`);
}

export function createArticleFromTopic(topicId) {
  return requestJson("/api/v1/articles/from-topic", "POST", {
    topic_id: topicId
  });
}

export function createManualArticle(payload) {
  return requestJson("/api/v1/articles", "POST", payload);
}

export function getArticleVersions(articleId) {
  return request(`/api/v1/articles/${articleId}/versions`);
}

export function updateArticle(articleId, payload) {
  return requestJson(`/api/v1/articles/${articleId}`, "PATCH", payload);
}

export function submitArticleReview(articleId) {
  return requestJson(`/api/v1/articles/${articleId}/submit-review`, "POST", {});
}

export function reviewArticle(articleId, action, comments = "", reasonCodes = []) {
  return requestJson(`/api/v1/articles/${articleId}/review`, "POST", {
    action,
    comments,
    reason_codes: reasonCodes
  });
}

export function createContentTemplate(payload) {
  return requestJson("/api/v1/content-templates", "POST", payload);
}

export function createExportJob(payload) {
  return requestJson("/api/v1/exports", "POST", payload);
}

export function exportDownloadUrl(exportId) {
  return `/api/v1/exports/${encodeURIComponent(exportId)}/download`;
}

export function saveInternationalGeoInput(payload) {
  return requestJson("/api/v1/international-geo/input", "PUT", payload);
}

export function listInternationalGeoSiteAudits() {
  return request("/api/v1/international-geo/site-audits");
}

export function getInternationalGeoSiteAudit(auditId) {
  return request(`/api/v1/international-geo/site-audits/${auditId}`);
}

export function createInternationalGeoSiteAudit(payload) {
  return requestJson("/api/v1/international-geo/site-audits", "POST", payload);
}

export function generateInternationalGeoSiteAuditAssets(auditId) {
  return requestJson(`/api/v1/international-geo/site-audits/${auditId}/assets`, "POST", {});
}

export function crawlInternationalGeoSiteAudit(auditId) {
  return requestJson(`/api/v1/international-geo/site-audits/${auditId}/crawl`, "POST", {});
}

export function runInternationalGeoAudit() {
  return requestJson("/api/v1/international-geo/audit", "POST", {});
}

export function generateInternationalGeoArtifacts() {
  return requestJson("/api/v1/international-geo/artifacts", "POST", {});
}

export function runInternationalGeoVisibilityMeasurement(payload = {}) {
  return requestJson("/api/v1/international-geo/visibility/run", "POST", payload);
}

export function importInternationalGeoVisibilityEvidence(payload = {}) {
  return requestJson("/api/v1/international-geo/visibility/evidence/import", "POST", payload);
}

export function importInternationalGeoVisibilityEvidenceBatch(payload = {}) {
  return requestJson("/api/v1/international-geo/visibility/evidence/imports", "POST", payload);
}

export function reviewInternationalGeoVisibilityEvidence(snapshotId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/visibility/evidence/${encodeURIComponent(snapshotId)}/review`,
    "POST",
    payload
  );
}

export function getInternationalGeoEvidenceAssets() {
  return request("/api/v1/international-geo/evidence-assets");
}

export function generateInternationalGeoEvidenceAssets() {
  return requestJson("/api/v1/international-geo/evidence-assets/generate", "POST", {});
}

export function reviewInternationalGeoEvidenceAsset(assetId, payload = {}) {
  return requestJson(`/api/v1/international-geo/evidence-assets/${encodeURIComponent(assetId)}/review`, "POST", payload);
}

export function getInternationalGeoPublishing() {
  return request("/api/v1/international-geo/publishing");
}

export function getInternationalGeoContentGeneration() {
  return request("/api/v1/international-geo/content-generation");
}

export function generateInternationalGeoArticles() {
  return requestJson("/api/v1/international-geo/content-generation/articles/generate", "POST", {});
}

export function generateInternationalGeoPlatformRewrites() {
  return requestJson("/api/v1/international-geo/content-generation/rewrites/generate", "POST", {});
}

export function reviewInternationalGeoGeneratedArticle(articleId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/content-generation/articles/${encodeURIComponent(articleId)}/review`,
    "POST",
    payload
  );
}

export function reviewInternationalGeoPlatformRewrite(rewriteId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/content-generation/rewrites/${encodeURIComponent(rewriteId)}/review`,
    "POST",
    payload
  );
}

export function generateInternationalGeoPublishingPackages() {
  return requestJson("/api/v1/international-geo/publishing/packages/generate", "POST", {});
}

export function reviewInternationalGeoPublishingPackage(packageId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/publishing/packages/${encodeURIComponent(packageId)}/review`,
    "POST",
    payload
  );
}

export function updateInternationalGeoPublishingTracking(trackingId, payload = {}) {
  return requestJson(
    `/api/v1/international-geo/publishing/tracking/${encodeURIComponent(trackingId)}`,
    "PUT",
    payload
  );
}

export function updateBillingPlan(payload) {
  return requestJson("/api/v1/billing/plan", "POST", payload);
}

export function logoutSession(payload = {}) {
  return requestJson("/api/v1/session/logout", "POST", payload);
}

export function createUser(payload) {
  return requestJson("/api/v1/users", "POST", payload);
}

export function disableUser(userId) {
  return requestJson(`/api/v1/users/${encodeURIComponent(userId)}/disable`, "POST", {});
}

export function resetUserPassword(userId) {
  return requestJson(`/api/v1/users/${encodeURIComponent(userId)}/reset-password`, "POST", {});
}

export function startPublishTask(taskId) {
  return requestJson(`/api/v1/publish-tasks/${taskId}/start`, "POST", {});
}

export function createPublishTask(payload) {
  return requestJson("/api/v1/publish-tasks", "POST", payload);
}

export function retryPublishTask(taskId) {
  return requestJson(`/api/v1/publish-tasks/${taskId}/retry-failed`, "POST", {});
}

export function approvePublishTask(taskId, payload = {}) {
  return requestJson(`/api/v1/publish-tasks/${taskId}/approval`, "POST", payload);
}

export function cancelPublishTask(taskId) {
  return requestJson(`/api/v1/publish-tasks/${taskId}/cancel`, "POST", {});
}

export function runVisibilityCollection(payload = {}) {
  return requestJson("/api/v1/analytics/visibility/collect", "POST", payload);
}

export function runMarketingCampaign(campaignId, payload = {}) {
  return requestJson(`/api/v1/marketing-campaigns/${campaignId}/run`, "POST", payload);
}

export function takeoverPublishTaskItem(taskId, itemId, payload) {
  return requestJson(`/api/v1/publish-tasks/${taskId}/items/${itemId}/takeover`, "POST", payload);
}

export function saveBrandProfile(payload) {
  return requestJson("/api/v1/brand-profile", "PUT", payload);
}

export function getRuntimeStatus() {
  return request("/api/v1/system/runtime");
}

export function getLaunchPreflight() {
  return request("/api/v1/system/preflight");
}

export function listRuntimeBackups() {
  return request("/api/v1/system/backups");
}

export function createRuntimeBackup(payload = {}) {
  return requestJson("/api/v1/system/backups", "POST", payload);
}

export function getRuntimeBackupDownload(backupId) {
  return request(`/api/v1/system/backups/${backupId}/download`);
}

export function validateRuntimeBackup(backupId) {
  return requestJson(`/api/v1/system/backups/${backupId}/validate`, "POST", {});
}

export function validateRuntimeBackupImport(payload = {}) {
  return requestJson("/api/v1/system/backups/import/validate", "POST", payload);
}

export function importRuntimeBackup(payload = {}) {
  return requestJson("/api/v1/system/backups/import", "POST", payload);
}

export function restoreRuntimeBackup(backupId) {
  return requestJson(`/api/v1/system/backups/${backupId}/restore`, "POST", {});
}

export function runSchedulerTick(force = false) {
  return requestJson("/api/v1/system/runtime/scheduler/tick", "POST", {
    force
  });
}

export function resetRuntimeState() {
  return requestJson("/api/v1/system/runtime/reset", "POST", {});
}

export function createModelConfig(payload) {
  return requestJson("/api/v1/model-configs", "POST", payload);
}

export function saveModelConfig(modelId, payload) {
  return requestJson(`/api/v1/model-configs/${modelId}`, "PUT", payload);
}

export function createMediaSource(payload) {
  return requestJson("/api/v1/media-sources", "POST", payload);
}

export function saveMediaSource(sourceId, payload) {
  return requestJson(`/api/v1/media-sources/${sourceId}`, "PUT", payload);
}

export function createChannel(payload) {
  return requestJson("/api/v1/channels", "POST", payload);
}

export function saveChannel(channelId, payload) {
  return requestJson(`/api/v1/channels/${channelId}`, "PUT", payload);
}

export function reconnectChannel(channelId) {
  return requestJson(`/api/v1/channels/${channelId}/reconnect`, "POST", {});
}

export function getModelConfigs() {
  return request("/api/v1/model-configs");
}

export function getChannels() {
  return request("/api/v1/channels");
}
