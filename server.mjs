import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.GEO_ENABLE_PERSISTENCE = process.env.GEO_ENABLE_PERSISTENCE || "1";

const {
  approvePublishTaskAction,
  cancelPublishTaskAction,
  createArticleAction,
  createChannelAction,
  createContentTemplateAction,
  createExportJobAction,
  createMediaSourceAction,
  createPublishTaskAction,
  createModelConfigAction,
  createKeywordCrawlJobAction,
  createTopicIdeaAction,
  createArticleFromTopicAction,
  createTopicIdeasFromKeywords,
  generateInternationalGeoArtifactsAction,
  generateTopicOutlineAction,
  getArticle,
  getAutomationConnector,
  getAutomationProviderConfig,
  getAutomationProviderProtocolConfig,
  getBillingSummary,
  getBrandProfile,
  getCampaignAnalytics,
  getChannelAnalytics,
  getConnectorPermissionMatrix,
  getContentAnalytics,
  getContentFunnel,
  getCurrentWorkspace,
  getExportJobDownload,
  getInternationalGeoState,
  getDashboardSummary,
  getKeyword,
  getKeywordAnalytics,
  getKeywordTrend,
  getPublishTask,
  getRecentPublishes,
  getSourceAdapterContract,
  getSourceStrategy,
  getAutomationRun,
  getTopKeywords,
  getTopicIdea,
  getVisibilityAnalytics,
  getWorkspaceInput,
  listAudienceSegments,
  listArticles,
  listAuditEvents,
  listAutomationProviders,
  listAutomationConnectors,
  listConnectorHealthChecks,
  listChannels,
  listContentTemplates,
  listInvoices,
  listKeywordCrawlJobs,
  listKeywords,
  listMembers,
  listMediaSources,
  listMarketingCampaigns,
  listModelConfigs,
  listContentQualityTraces,
  listProviderInvocations,
  listPromptTemplates,
  listPublishRecords,
  listPublishTasks,
  listAutomationRuns,
  listSourceAdapterContracts,
  listSourceStrategies,
  listTopicIdeas,
  listUsageRecords,
  reviewArticleAction,
  runInternationalGeoAuditAction,
  reconnectChannelAction,
  recordAuditEventAction,
  runSourceStrategyAction,
  runMarketingCampaignAction,
  runVisibilityCollectionAction,
  retryAutomationRunAction,
  saveBrandProfileAction,
  saveChannelAction,
  saveInternationalGeoInputAction,
  saveMediaSourceAction,
  saveModelConfigAction,
  saveAutomationProviderAction,
  saveAutomationConnectorAction,
  saveSourceStrategyAction,
  saveWorkspaceInputAction,
  testAutomationProviderAction,
  testAutomationConnectorAction,
  retryPublishTaskFailedAction,
  startPublishTaskAction,
  submitArticleReviewAction,
  takeoverPublishTaskItemAction,
  updateBillingPlanAction,
  updateKeywordAction,
  updateTopicIdeaAction,
  updateArticleAction,
  logoutSessionAction,
  getPersistenceStatus,
  getRuntimeStatus,
  resetRuntimeState
} = await import("./mock-data.mjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageInfo = JSON.parse(await fs.readFile(path.join(__dirname, "package.json"), "utf8"));
const staticDir = path.join(__dirname, "prototype");
const port = Number(process.env.PORT || 3000);
const host = process.env.GEO_HOST || "";
const isProduction = process.env.NODE_ENV === "production";
const schedulerEnabled = process.env.GEO_ENABLE_AUTOMATION_SCHEDULER === "1";
const schedulerTickMs = Math.max(5000, Number(process.env.GEO_AUTOMATION_TICK_MS || 15000));
const schedulerMaxRunsPerTick = Math.max(1, Number(process.env.GEO_AUTOMATION_MAX_RUNS_PER_TICK || 2));
const schedulerDefaultIndustryTopic = process.env.GEO_DEFAULT_INDUSTRY_TOPIC || "中国智能体";
const maxBodyBytes = Math.max(1024, Number(process.env.GEO_MAX_BODY_BYTES || 1024 * 1024));
const mutationRateLimitPerMinute = Math.max(
  1,
  Number(process.env.GEO_MUTATION_RATE_LIMIT_PER_MINUTE || 120)
);
const allowRemoteAccess = process.env.GEO_ALLOW_REMOTE_ACCESS === "1";
const explicitInternalApiKey = process.env.GEO_INTERNAL_API_KEY || "";
const internalApiKey = explicitInternalApiKey || crypto.randomBytes(24).toString("hex");
const minProductionApiKeyLength = 24;
const publicSiteUrl = (process.env.GEO_PUBLIC_SITE_URL || `http://${host || "localhost"}:${port}`).replace(/\/+$/, "");

if (isProduction && explicitInternalApiKey.length < minProductionApiKeyLength) {
  console.error("NODE_ENV=production requires GEO_INTERNAL_API_KEY with at least 24 characters.");
  process.exit(1);
}

if (allowRemoteAccess && !explicitInternalApiKey) {
  console.error("GEO_ALLOW_REMOTE_ACCESS=1 requires a fixed GEO_INTERNAL_API_KEY.");
  process.exit(1);
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png"
};

function ok(data) {
  return {
    success: true,
    data,
    meta: {
      request_id: `req_${Date.now()}`
    }
  };
}

function error(code, message, status = 400) {
  return {
    status,
    body: {
      success: false,
      error: { code, message },
      meta: {
        request_id: `req_${Date.now()}`
      }
    }
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, status, content, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  res.end(content);
}

function sendBuffer(res, status, content, contentType) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=86400"
  });
  res.end(content);
}

function sendCsv(res, filename, content) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  res.end(content);
}

function healthPayload() {
  const persistence = getPersistenceStatus();
  return {
    ok: true,
    version: packageInfo.version,
    environment: process.env.NODE_ENV || "development",
    persistence: {
      enabled: persistence.enabled,
      file: persistence.enabled ? persistence.file : ""
    },
    scheduler: {
      enabled: schedulerEnabled,
      status: schedulerState.status
    },
    timestamp: new Date().toISOString()
  };
}

function robotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${publicSiteUrl}/sitemap.xml`,
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: Claude-SearchBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /"
  ].join("\n");
}

function sitemapXml() {
  const now = new Date().toISOString();
  const routes = ["/"];
  const urls = routes.map(
    (route) => `
  <url>
    <loc>${publicSiteUrl}${route}</loc>
    <lastmod>${now}</lastmod>
  </url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>
`;
}

function llmsTxt() {
  return [
    "# GEO Pulse",
    "",
    "GEO Pulse is a single-tenant admin prototype for Generative Engine Optimization and AI search visibility operations.",
    "",
    "## Core URLs",
    "",
    `- Admin shell: ${publicSiteUrl}/`,
    `- International GEO workspace: ${publicSiteUrl}/#page=international`,
    `- API runtime status: ${publicSiteUrl}/api/v1/system/runtime`,
    "",
    "## Product Scope",
    "",
    "- Keyword discovery and content opportunity management.",
    "- GEO content drafting, review, publishing task planning, and visibility analytics.",
    "- International GEO readiness for GPT, Gemini, Claude, Perplexity, and Copilot / Bing monitoring workflows.",
    "",
    "## Current Production Boundary",
    "",
    "This v0.2 deployment is single-tenant and should be protected by deployment-layer authentication such as a reverse proxy, VPN, or IP allowlist."
  ].join("\n");
}

const faviconIco = Buffer.from(
  "AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  "base64"
);

function csvCell(value) {
  const text = typeof value === "object" && value !== null
    ? JSON.stringify(neutralizeCsvObject(value))
    : neutralizeCsvText(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function neutralizeCsvText(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function neutralizeCsvObject(value) {
  if (Array.isArray(value)) {
    return value.map(neutralizeCsvObject);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, neutralizeCsvObject(item)])
    );
  }
  if (typeof value === "string") {
    return neutralizeCsvText(value);
  }
  return value;
}

function auditEventsCsv(events = []) {
  const headers = ["id", "created_at", "action", "resource_type", "resource_id", "actor_type", "actor_id", "details"];
  const rows = events.map((item) =>
    [
      item.id,
      item.created_at,
      item.action,
      item.resource_type,
      item.resource_id,
      item.actor_type,
      item.actor_id,
      item.details || {}
    ].map(csvCell).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function buildHtmlContentSecurityPolicy(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'"
  ].join("; ");
}

async function sendFile(res, filePath) {
  try {
    const ext = path.extname(filePath);
    let content = await fs.readFile(filePath);
    const headers = {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    };
    if (ext === ".html") {
      const nonce = crypto.randomBytes(16).toString("base64url");
      content = content.toString("utf8").replaceAll("__GEO_CSP_NONCE__", nonce);
      headers["Cache-Control"] = "no-store";
      headers["Content-Security-Policy"] = buildHtmlContentSecurityPolicy(nonce);
    }
    res.writeHead(200, headers);
    res.end(content);
  } catch {
    sendJson(res, 404, error("NOT_FOUND", "File not found", 404).body);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > maxBodyBytes) {
        const bodyError = new Error("Request body too large");
        bodyError.status = 413;
        reject(bodyError);
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getQuery(url) {
  const query = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

function isMutatingMethod(method) {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

function getAllowedApiOrigins(req) {
  const configured = String(process.env.GEO_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const hostHeader = req.headers.host;
  const localOrigins = hostHeader
    ? [`http://${hostHeader}`, `https://${hostHeader}`]
    : [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  return new Set([...configured, ...localOrigins]);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) {
    return;
  }
  if (getAllowedApiOrigins(req).has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
}

function isMutationAuthorized(req) {
  if (!isMutatingMethod(req.method)) {
    return true;
  }

  const origin = req.headers.origin;
  if (origin && !getAllowedApiOrigins(req).has(origin)) {
    return false;
  }

  return req.headers["x-geo-api-key"] === internalApiKey;
}

function isSensitiveReadPath(method, pathname) {
  return method === "GET" && ["/audit-events", "/audit-events/export.csv"].includes(pathname);
}

function isSensitiveReadAuthorized(req, pathname) {
  if (!allowRemoteAccess || !isSensitiveReadPath(req.method, pathname)) {
    return true;
  }

  return req.headers["x-geo-api-key"] === internalApiKey;
}

function recordAuthFailure(req, pathname, reason) {
  recordAuditEventAction("auth.failure", "api_request", pathname, {
    method: req.method,
    path: pathname,
    remote_address: req.socket.remoteAddress || "",
    reason
  });
}

const mutationRateBuckets = new Map();
const mutationRateWindowMs = 60 * 1000;

function getMutationRateKey(req) {
  return String(req.headers["x-geo-api-key"] || req.socket.remoteAddress || "anonymous");
}

function checkMutationRateLimit(req) {
  if (!isMutatingMethod(req.method)) {
    return {
      allowed: true,
      retry_after_seconds: 0
    };
  }

  const now = Date.now();
  const key = getMutationRateKey(req);
  const current = mutationRateBuckets.get(key);
  const bucket =
    current && now - current.window_started_at < mutationRateWindowMs
      ? current
      : {
          window_started_at: now,
          count: 0
        };

  bucket.count += 1;
  mutationRateBuckets.set(key, bucket);

  if (bucket.count <= mutationRateLimitPerMinute) {
    return {
      allowed: true,
      retry_after_seconds: 0
    };
  }

  return {
    allowed: false,
    retry_after_seconds: Math.max(1, Math.ceil((mutationRateWindowMs - (now - bucket.window_started_at)) / 1000))
  };
}

function isLoopbackAddress(value) {
  const address = String(value || "");
  return (
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1" ||
    address.startsWith("127.")
  );
}

function isRemoteAccessAllowed(req) {
  return allowRemoteAccess || isLoopbackAddress(req.socket.remoteAddress);
}

const schedulerState = {
  enabled: schedulerEnabled,
  tick_ms: schedulerTickMs,
  max_runs_per_tick: schedulerMaxRunsPerTick,
  default_industry_topic: schedulerDefaultIndustryTopic,
  status: schedulerEnabled ? "idle" : "disabled",
  started_at: new Date().toISOString(),
  last_tick_at: null,
  last_run_started_at: null,
  last_run_finished_at: null,
  last_success_at: null,
  last_error_at: null,
  last_error_message: "",
  last_dispatched_strategy_id: null,
  last_dispatched_run_id: null,
  total_ticks: 0,
  total_dispatched_runs: 0,
  active_strategy_ids: []
};

let schedulerTimer = null;

function isoNow() {
  return new Date().toISOString();
}

function listDueStrategies(now = Date.now()) {
  return listSourceStrategies({ page_size: 200 }).items
    .filter((item) => item.is_enabled !== false)
    .filter((item) => item.next_run_at && Number.isFinite(Date.parse(item.next_run_at)))
    .filter((item) => Date.parse(item.next_run_at) <= now)
    .sort((left, right) => Date.parse(left.next_run_at) - Date.parse(right.next_run_at));
}

function getSchedulerStatus() {
  const strategies = listSourceStrategies({ page_size: 200 }).items;
  const dueStrategies = listDueStrategies();
  const activeCount = strategies.filter((item) => item.is_enabled !== false).length;
  const scheduledCount = strategies.filter((item) => item.is_enabled !== false && item.next_run_at).length;
  const nextDueAt = strategies
    .filter((item) => item.is_enabled !== false && item.next_run_at)
    .map((item) => item.next_run_at)
    .sort()[0] || null;

  return {
    ...schedulerState,
    active_strategy_count: activeCount,
    scheduled_strategy_count: scheduledCount,
    due_strategy_count: dueStrategies.length,
    next_due_at: nextDueAt,
    due_strategy_ids: dueStrategies.map((item) => item.id).slice(0, 5)
  };
}

function getAugmentedRuntimeStatus() {
  return {
    ...getRuntimeStatus(),
    scheduler: getSchedulerStatus()
  };
}

function withSchedulerTickAudit(result, trigger) {
  recordAuditEventAction("scheduler.tick", "scheduler", "automation_scheduler", {
    trigger,
    scheduler_status: result?.scheduler?.status || "",
    skipped_reason: result?.skipped_reason || "",
    executed_run_count: Array.isArray(result?.executed_runs) ? result.executed_runs.length : 0,
    error_message: result?.error || ""
  });
  return result;
}

async function runAutomationSchedulerTick(options = {}) {
  const { force = false } = options;
  const trigger = options.trigger || (force ? "manual_force" : "scheduler");
  schedulerState.total_ticks += 1;
  schedulerState.last_tick_at = isoNow();

  if (!schedulerEnabled && !force) {
    schedulerState.status = "disabled";
    return withSchedulerTickAudit({
      scheduler: getSchedulerStatus(),
      executed_runs: [],
      skipped_reason: "scheduler_disabled"
    }, trigger);
  }

  if (schedulerState.active_strategy_ids.length) {
    schedulerState.status = "busy";
    return withSchedulerTickAudit({
      scheduler: getSchedulerStatus(),
      executed_runs: [],
      skipped_reason: "scheduler_busy"
    }, trigger);
  }

  const dueStrategies = listDueStrategies().slice(0, schedulerMaxRunsPerTick);
  if (!dueStrategies.length) {
    schedulerState.status = "idle";
    return withSchedulerTickAudit({
      scheduler: getSchedulerStatus(),
      executed_runs: [],
      skipped_reason: "no_due_strategy"
    }, trigger);
  }

  const executedRuns = [];
  schedulerState.status = "running";
  schedulerState.last_run_started_at = isoNow();
  schedulerState.active_strategy_ids = dueStrategies.map((item) => item.id);

  try {
    for (const strategy of dueStrategies) {
      const result = runSourceStrategyAction(strategy.id, {
        industry_topic: schedulerDefaultIndustryTopic,
        fetch_limit: 8,
        triggered_by: "scheduler"
      });
      const awaitedResult = await result;

      if (awaitedResult?.run?.id) {
        executedRuns.push({
          strategy_id: strategy.id,
          run_id: awaitedResult.run.id,
          status: awaitedResult.run.status,
          generated_question_count: awaitedResult.run.generated_question_count || 0,
          generated_article_count: awaitedResult.run.generated_article_count || 0
        });
        schedulerState.total_dispatched_runs += 1;
        schedulerState.last_success_at = isoNow();
        schedulerState.last_dispatched_strategy_id = strategy.id;
        schedulerState.last_dispatched_run_id = awaitedResult.run.id;
      }
    }

    schedulerState.status = "idle";
    schedulerState.last_run_finished_at = isoNow();
    return withSchedulerTickAudit({
      scheduler: getSchedulerStatus(),
      executed_runs: executedRuns
    }, trigger);
  } catch (runtimeError) {
    schedulerState.status = "error";
    schedulerState.last_run_finished_at = isoNow();
    schedulerState.last_error_at = isoNow();
    schedulerState.last_error_message =
      runtimeError instanceof Error ? runtimeError.message : String(runtimeError);
    return withSchedulerTickAudit({
      scheduler: getSchedulerStatus(),
      executed_runs: executedRuns,
      error: schedulerState.last_error_message
    }, trigger);
  } finally {
    schedulerState.active_strategy_ids = [];
  }
}

function startAutomationScheduler() {
  if (!schedulerEnabled || schedulerTimer) {
    return;
  }

  schedulerTimer = setInterval(() => {
    void runAutomationSchedulerTick();
  }, schedulerTickMs);

  if (typeof schedulerTimer.unref === "function") {
    schedulerTimer.unref();
  }

  setTimeout(() => {
    void runAutomationSchedulerTick();
  }, 1500);
}

function stopAutomationScheduler() {
  if (!schedulerTimer) {
    return;
  }
  clearInterval(schedulerTimer);
  schedulerTimer = null;
  schedulerState.status = schedulerEnabled ? "idle" : "disabled";
}

async function handleApi(req, res, url) {
  const pathname = url.pathname.replace(/^\/api\/v1/, "");
  const query = getQuery(url);

  if (req.method === "OPTIONS") {
    applyCors(req, res);
    res.writeHead(204, {
      "Access-Control-Allow-Headers": "Content-Type, X-GEO-API-Key",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS"
    });
    res.end();
    return;
  }

  if (!isMutationAuthorized(req)) {
    recordAuthFailure(req, pathname, "invalid_or_missing_api_key");
    sendJson(res, internalApiKey ? 401 : 403, error("UNAUTHORIZED", "Mutation is not authorized", internalApiKey ? 401 : 403).body);
    return;
  }

  if (!isSensitiveReadAuthorized(req, pathname)) {
    recordAuthFailure(req, pathname, "invalid_or_missing_api_key");
    sendJson(res, 401, error("UNAUTHORIZED", "Request is not authorized", 401).body);
    return;
  }

  if (req.method === "GET" && pathname === "/workspaces/current") {
    sendJson(res, 200, ok(getCurrentWorkspace()));
    return;
  }

  if (req.method === "GET" && pathname === "/workspace-input") {
    sendJson(res, 200, ok(getWorkspaceInput()));
    return;
  }

  if (req.method === "PUT" && pathname === "/workspace-input") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    sendJson(res, 200, ok(saveWorkspaceInputAction(body)));
    return;
  }

  if (req.method === "GET" && pathname === "/members") {
    sendJson(res, 200, ok(listMembers(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/media-sources") {
    sendJson(res, 200, ok(listMediaSources(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/source-adapter-contracts") {
    sendJson(res, 200, ok(listSourceAdapterContracts(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/source-adapter-contracts\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const contract = getSourceAdapterContract(id);
    if (!contract || contract.id !== id) {
      sendJson(res, 404, error("NOT_FOUND", "Source adapter contract not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(contract));
    return;
  }

  if (req.method === "POST" && pathname === "/media-sources") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 201, ok(createMediaSourceAction(body || {})));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/media-sources\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const source = saveMediaSourceAction(id, body);
    if (!source) {
      sendJson(res, 404, error("NOT_FOUND", "Media source not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(source));
    return;
  }

  if (req.method === "GET" && pathname === "/automation-providers") {
    sendJson(res, 200, ok(listAutomationProviders(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/automation-connectors") {
    sendJson(res, 200, ok(listAutomationConnectors(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/connector-permissions") {
    sendJson(res, 200, ok(getConnectorPermissionMatrix(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/automation-connectors\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const connector = getAutomationConnector(id);
    if (!connector) {
      sendJson(res, 404, error("NOT_FOUND", "Automation connector not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(connector));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/automation-connectors\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const connector = saveAutomationConnectorAction(id, body);
    if (!connector) {
      sendJson(res, 404, error("NOT_FOUND", "Automation connector not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(connector));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/automation-connectors\/[^/]+\/test$/)) {
    const id = pathname.split("/")[2];
    const result = await testAutomationConnectorAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Automation connector not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "GET" && pathname === "/connector-health-checks") {
    sendJson(res, 200, ok(listConnectorHealthChecks(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/provider-invocations") {
    sendJson(res, 200, ok(listProviderInvocations(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/audit-events/export.csv") {
    sendCsv(res, "geo-pulse-audit-events.csv", auditEventsCsv(listAuditEvents(query).items));
    return;
  }

  if (req.method === "GET" && pathname === "/audit-events") {
    sendJson(res, 200, ok(listAuditEvents(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/automation-providers\/[^/]+\/protocol$/)) {
    const id = pathname.split("/")[2];
    const protocol = getAutomationProviderProtocolConfig(id);
    if (!protocol) {
      sendJson(res, 404, error("NOT_FOUND", "Automation provider protocol not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(protocol));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/automation-providers\/[^/]+\/test$/)) {
    const id = pathname.split("/")[2];
    const result = await testAutomationProviderAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Automation provider not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/automation-providers\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const provider = getAutomationProviderConfig(id);
    if (!provider) {
      sendJson(res, 404, error("NOT_FOUND", "Automation provider not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(provider));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/automation-providers\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const provider = saveAutomationProviderAction(id, body);
    if (!provider) {
      sendJson(res, 404, error("NOT_FOUND", "Automation provider not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(provider));
    return;
  }

  if (req.method === "GET" && pathname === "/source-strategies") {
    sendJson(res, 200, ok(listSourceStrategies(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/source-strategies\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const strategy = getSourceStrategy(id);
    if (!strategy) {
      sendJson(res, 404, error("NOT_FOUND", "Source strategy not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(strategy));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/source-strategies\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const strategy = saveSourceStrategyAction(id, body);
    if (!strategy) {
      sendJson(res, 404, error("NOT_FOUND", "Source strategy not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(strategy));
    return;
  }

  if (req.method === "GET" && pathname === "/automation-runs") {
    sendJson(res, 200, ok(listAutomationRuns(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/automation-runs\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const run = getAutomationRun(id);
    if (!run) {
      sendJson(res, 404, error("NOT_FOUND", "Automation run not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(run));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/automation-runs\/[^/]+\/retry$/)) {
    const id = pathname.split("/")[2];
    const result = await retryAutomationRunAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Automation run not found", 404).body);
      return;
    }
    sendJson(res, 201, ok(result));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/source-strategies\/[^/]+\/run$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    const result = await runSourceStrategyAction(id, body || {});
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Source strategy not found", 404).body);
      return;
    }
    sendJson(res, 201, ok(result));
    return;
  }

  if (req.method === "GET" && pathname === "/system/runtime") {
    sendJson(res, 200, ok(getAugmentedRuntimeStatus()));
    return;
  }

  if (req.method === "GET" && pathname === "/system/client-config") {
    sendJson(res, 200, ok({
      mutation_auth_required: true,
      mutation_header_name: "X-GEO-API-Key",
      mutation_api_key: allowRemoteAccess ? "" : internalApiKey
    }));
    return;
  }

  if (req.method === "GET" && pathname === "/system/runtime/scheduler") {
    sendJson(res, 200, ok(getSchedulerStatus()));
    return;
  }

  if (req.method === "POST" && pathname === "/system/runtime/scheduler/tick") {
    const body = await parseBody(req).catch(() => null);
    if (body === null) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const result = await runAutomationSchedulerTick({
      force: body.force === true
    });
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "POST" && pathname === "/system/runtime/reset") {
    resetRuntimeState();
    sendJson(res, 200, ok(getAugmentedRuntimeStatus()));
    return;
  }

  if (req.method === "GET" && pathname === "/brand-profile") {
    sendJson(res, 200, ok(getBrandProfile()));
    return;
  }

  if (req.method === "PUT" && pathname === "/brand-profile") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    sendJson(res, 200, ok(saveBrandProfileAction(body)));
    return;
  }

  if (req.method === "GET" && pathname === "/model-configs") {
    sendJson(res, 200, ok(listModelConfigs(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/prompt-templates") {
    sendJson(res, 200, ok(listPromptTemplates(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/content-quality-traces") {
    sendJson(res, 200, ok(listContentQualityTraces(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/model-configs") {
    const body = await parseBody(req).catch(() => null);
    sendJson(res, 201, ok(createModelConfigAction(body || {})));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/model-configs\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const model = saveModelConfigAction(id, body);
    if (!model) {
      sendJson(res, 404, error("NOT_FOUND", "Model config not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(model));
    return;
  }

  if (req.method === "GET" && pathname === "/channels") {
    sendJson(res, 200, ok(listChannels(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/channels") {
    const body = await parseBody(req).catch(() => null);
    sendJson(res, 201, ok(createChannelAction(body || {})));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/channels\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const channel = saveChannelAction(id, body);
    if (!channel) {
      sendJson(res, 404, error("NOT_FOUND", "Channel not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(channel));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/channels\/[^/]+\/reconnect$/)) {
    const id = pathname.split("/")[2];
    const channel = reconnectChannelAction(id);
    if (!channel) {
      sendJson(res, 404, error("NOT_FOUND", "Channel not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(channel));
    return;
  }

  if (req.method === "GET" && pathname === "/keyword-crawl-jobs") {
    sendJson(res, 200, ok(listKeywordCrawlJobs(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/keyword-crawl-jobs") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.name || !body?.source_type) {
      sendJson(res, 400, error("VALIDATION_ERROR", "name and source_type are required").body);
      return;
    }
    sendJson(res, 201, ok(await createKeywordCrawlJobAction(body)));
    return;
  }

  if (req.method === "GET" && pathname === "/keywords") {
    sendJson(res, 200, ok(listKeywords(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/keywords/batch") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.ids?.length || !body?.action) {
      sendJson(res, 400, error("VALIDATION_ERROR", "ids and action are required").body);
      return;
    }
    sendJson(res, 200, ok({ affected_count: body.ids.length, action: body.action }));
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/keywords/")) {
    const id = pathname.split("/")[2];
    const keyword = getKeyword(id);
    if (!keyword) {
      sendJson(res, 404, error("NOT_FOUND", "Keyword not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(keyword));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/keywords\/[^/]+\/actions$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body?.action) {
      sendJson(res, 400, error("VALIDATION_ERROR", "action is required").body);
      return;
    }
    const keyword = updateKeywordAction(id, body.action);
    if (!keyword) {
      sendJson(res, 404, error("NOT_FOUND", "Keyword not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(keyword));
    return;
  }

  if (req.method === "GET" && pathname === "/topic-ideas") {
    sendJson(res, 200, ok(listTopicIdeas(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/topic-ideas") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.title) {
      sendJson(res, 400, error("VALIDATION_ERROR", "title is required").body);
      return;
    }
    sendJson(res, 201, ok(createTopicIdeaAction(body)));
    return;
  }

  if (req.method === "POST" && pathname === "/topic-ideas/from-keywords") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.keyword_ids?.length) {
      sendJson(res, 400, error("VALIDATION_ERROR", "keyword_ids are required").body);
      return;
    }
    sendJson(res, 201, ok(await createTopicIdeasFromKeywords(body.keyword_ids, body.template_type)));
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/topic-ideas\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const topic = updateTopicIdeaAction(id, body);
    if (!topic) {
      sendJson(res, 404, error("NOT_FOUND", "Topic idea not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(topic));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/topic-ideas\/[^/]+\/outline$/)) {
    const id = pathname.split("/")[2];
    const topic = generateTopicOutlineAction(id);
    if (!topic) {
      sendJson(res, 404, error("NOT_FOUND", "Topic idea not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(topic));
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/topic-ideas/")) {
    const id = pathname.split("/")[2];
    const topic = getTopicIdea(id);
    if (!topic) {
      sendJson(res, 404, error("NOT_FOUND", "Topic idea not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(topic));
    return;
  }

  if (req.method === "GET" && pathname === "/content-templates") {
    sendJson(res, 200, ok(listContentTemplates(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/content-templates") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.name) {
      sendJson(res, 400, error("VALIDATION_ERROR", "name is required").body);
      return;
    }
    sendJson(res, 201, ok(createContentTemplateAction(body)));
    return;
  }

  if (req.method === "GET" && pathname === "/articles") {
    sendJson(res, 200, ok(listArticles(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/articles") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.title) {
      sendJson(res, 400, error("VALIDATION_ERROR", "title is required").body);
      return;
    }
    sendJson(res, 201, ok(createArticleAction(body)));
    return;
  }

  if (req.method === "POST" && pathname === "/articles/from-topic") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.topic_id) {
      sendJson(res, 400, error("VALIDATION_ERROR", "topic_id is required").body);
      return;
    }
    const article = await createArticleFromTopicAction(body.topic_id);
    if (!article) {
      sendJson(res, 404, error("NOT_FOUND", "Topic idea not found", 404).body);
      return;
    }
    sendJson(res, 201, ok(article));
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/articles/")) {
    const parts = pathname.split("/").filter(Boolean);
    const id = parts[1];
    if (parts.length === 3 && parts[2] === "versions") {
      const article = getArticle(id);
      if (!article) {
        sendJson(res, 404, error("NOT_FOUND", "Article not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(article.versions || []));
      return;
    }
    const article = getArticle(id);
    if (!article) {
      sendJson(res, 404, error("NOT_FOUND", "Article not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(article));
    return;
  }

  if (req.method === "PATCH" && pathname.match(/^\/articles\/[^/]+$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    const article = updateArticleAction(id, body);
    if (!article) {
      sendJson(res, 404, error("NOT_FOUND", "Article not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(article));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/articles\/[^/]+\/submit-review$/)) {
    const id = pathname.split("/")[2];
    const article = submitArticleReviewAction(id);
    if (!article) {
      sendJson(res, 404, error("NOT_FOUND", "Article not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(article));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/articles\/[^/]+\/review$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => null);
    if (!body?.action) {
      sendJson(res, 400, error("VALIDATION_ERROR", "action is required").body);
      return;
    }
    const result = reviewArticleAction(id, body.action, body.comments || "", body.reason_codes || []);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Article not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "GET" && pathname === "/publish-tasks") {
    sendJson(res, 200, ok(listPublishTasks(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/publish-tasks") {
    const body = await parseBody(req).catch(() => null);
    if (!body?.name || !body?.channel_id || !body?.article_ids?.length) {
      sendJson(res, 400, error("VALIDATION_ERROR", "name, channel_id and article_ids are required").body);
      return;
    }
    const task = createPublishTaskAction(body);
    if (!task) {
      sendJson(res, 400, error("VALIDATION_ERROR", "invalid publish task payload").body);
      return;
    }
    sendJson(res, 201, ok(task));
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/publish-tasks/")) {
    const id = pathname.split("/")[2];
    const task = getPublishTask(id);
    if (!task) {
      sendJson(res, 404, error("NOT_FOUND", "Publish task not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(task));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/publish-tasks\/[^/]+\/start$/)) {
    const id = pathname.split("/")[2];
    const task = startPublishTaskAction(id);
    if (!task) {
      sendJson(res, 404, error("NOT_FOUND", "Publish task not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(task));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/publish-tasks\/[^/]+\/retry-failed$/)) {
    const id = pathname.split("/")[2];
    const task = retryPublishTaskFailedAction(id);
    if (!task) {
      sendJson(res, 404, error("NOT_FOUND", "Publish task not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(task));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/publish-tasks\/[^/]+\/approval$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => ({}));
    const task = approvePublishTaskAction(id, body || {});
    if (!task) {
      sendJson(res, 404, error("NOT_FOUND", "Publish task not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(task));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/publish-tasks\/[^/]+\/items\/[^/]+\/takeover$/)) {
    const [, , taskId, , itemId] = pathname.split("/");
    const body = await parseBody(req).catch(() => ({}));
    const task = takeoverPublishTaskItemAction(taskId, itemId, body || {});
    if (!task) {
      sendJson(res, 404, error("NOT_FOUND", "Publish task item not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(task));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/publish-tasks\/[^/]+\/cancel$/)) {
    const id = pathname.split("/")[2];
    const task = cancelPublishTaskAction(id);
    if (!task) {
      sendJson(res, 404, error("NOT_FOUND", "Publish task not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(task));
    return;
  }

  if (req.method === "GET" && pathname === "/publish-records") {
    sendJson(res, 200, ok(listPublishRecords(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/dashboard/summary") {
    sendJson(res, 200, ok(getDashboardSummary()));
    return;
  }

  if (req.method === "GET" && pathname === "/dashboard/keyword-trend") {
    sendJson(res, 200, ok(getKeywordTrend()));
    return;
  }

  if (req.method === "GET" && pathname === "/dashboard/content-funnel") {
    sendJson(res, 200, ok(getContentFunnel()));
    return;
  }

  if (req.method === "GET" && pathname === "/dashboard/top-keywords") {
    sendJson(res, 200, ok(getTopKeywords()));
    return;
  }

  if (req.method === "GET" && pathname === "/dashboard/recent-publishes") {
    sendJson(res, 200, ok(getRecentPublishes()));
    return;
  }

  if (req.method === "GET" && pathname === "/analytics/keywords") {
    sendJson(res, 200, ok(getKeywordAnalytics()));
    return;
  }

  if (req.method === "GET" && pathname === "/analytics/content") {
    sendJson(res, 200, ok(getContentAnalytics()));
    return;
  }

  if (req.method === "GET" && pathname === "/analytics/channels") {
    sendJson(res, 200, ok(getChannelAnalytics()));
    return;
  }

  if (req.method === "GET" && pathname === "/analytics/campaigns") {
    sendJson(res, 200, ok(getCampaignAnalytics()));
    return;
  }

  if (req.method === "GET" && pathname === "/analytics/visibility") {
    sendJson(res, 200, ok(getVisibilityAnalytics()));
    return;
  }

  if (req.method === "POST" && pathname === "/analytics/visibility/collect") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 200, ok(runVisibilityCollectionAction(body || {})));
    return;
  }

  if (req.method === "GET" && pathname === "/audience-segments") {
    sendJson(res, 200, ok(listAudienceSegments(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/marketing-campaigns") {
    sendJson(res, 200, ok(listMarketingCampaigns(query)));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/marketing-campaigns\/[^/]+\/run$/)) {
    const id = pathname.split("/")[2];
    const body = await parseBody(req).catch(() => ({}));
    const result = runMarketingCampaignAction(id, body || {});
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Marketing campaign not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "POST" && pathname === "/exports") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 201, ok(createExportJobAction(body || {})));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/exports\/[^/]+\/download$/)) {
    const id = pathname.split("/")[2];
    const job = getExportJobDownload(id);
    if (!job) {
      sendJson(res, 404, error("NOT_FOUND", "Export job not found", 404).body);
      return;
    }
    res.setHeader("Content-Disposition", `attachment; filename="${job.file_name}"`);
    sendText(res, 200, job.content, job.content_type);
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo") {
    sendJson(res, 200, ok(getInternationalGeoState()));
    return;
  }

  if (req.method === "PUT" && pathname === "/international-geo/input") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    sendJson(res, 200, ok(saveInternationalGeoInputAction(body)));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/audit") {
    sendJson(res, 200, ok(runInternationalGeoAuditAction()));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/artifacts") {
    sendJson(res, 200, ok(generateInternationalGeoArtifactsAction()));
    return;
  }

  if (req.method === "GET" && pathname === "/billing/summary") {
    sendJson(res, 200, ok(getBillingSummary()));
    return;
  }

  if (req.method === "POST" && pathname === "/billing/plan") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 200, ok(updateBillingPlanAction(body || {})));
    return;
  }

  if (req.method === "GET" && pathname === "/billing/usage-records") {
    sendJson(res, 200, ok(listUsageRecords(query)));
    return;
  }

  if (req.method === "GET" && pathname === "/billing/invoices") {
    sendJson(res, 200, ok(listInvoices(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/session/logout") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 200, ok(logoutSessionAction(body || {})));
    return;
  }

  sendJson(res, 404, error("NOT_FOUND", "API route not found", 404).body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (!isRemoteAccessAllowed(req)) {
    sendJson(res, 403, error("FORBIDDEN", "Remote access is disabled by default", 403).body);
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    sendJson(res, 200, healthPayload());
    return;
  }

  if (req.method === "GET" && url.pathname === "/robots.txt") {
    sendText(res, 200, robotsTxt());
    return;
  }

  if (req.method === "GET" && url.pathname === "/sitemap.xml") {
    sendText(res, 200, sitemapXml(), "application/xml; charset=utf-8");
    return;
  }

  if (req.method === "GET" && url.pathname === "/llms.txt") {
    sendText(res, 200, llmsTxt());
    return;
  }

  if (req.method === "GET" && url.pathname === "/favicon.ico") {
    sendBuffer(res, 200, faviconIco, "image/x-icon");
    return;
  }

  if (url.pathname.startsWith("/api/v1")) {
    applyCors(req, res);
    const contentLength = Number(req.headers["content-length"] || 0);
    if (isMutatingMethod(req.method) && contentLength > maxBodyBytes) {
      sendJson(res, 413, error("PAYLOAD_TOO_LARGE", "Request body too large", 413).body);
      return;
    }
    const rateLimit = checkMutationRateLimit(req);
    if (!rateLimit.allowed) {
      res.setHeader("Retry-After", String(rateLimit.retry_after_seconds));
      sendJson(res, 429, error("RATE_LIMITED", "Too many mutating API requests", 429).body);
      return;
    }
    try {
      await handleApi(req, res, url);
    } catch (runtimeError) {
      const status = Number(runtimeError?.status || 400);
      const message = runtimeError instanceof Error ? runtimeError.message : String(runtimeError);
      sendJson(res, status, error(status === 413 ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR", message, status).body);
    }
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(staticDir, safePath);

  if (!filePath.startsWith(staticDir)) {
    sendJson(res, 403, error("FORBIDDEN", "Invalid path", 403).body);
    return;
  }

  await sendFile(res, filePath);
});

startAutomationScheduler();

const onListening = () => {
  const persistence = getPersistenceStatus();
  const displayHost = host || "localhost";
  console.log(
    `GEO Pulse MVP running at http://${displayHost}:${port} (persistence: ${
      persistence.enabled ? persistence.file : "disabled"
    })`
  );
};

if (host) {
  server.listen(port, host, onListening);
} else {
  server.listen(port, onListening);
}

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    stopAutomationScheduler();
    server.close(() => {
      process.exit(0);
    });
  });
});
