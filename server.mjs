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
  createInternationalGeoVisibilityPromptSetAction,
  createInternationalGeoSiteAuditAction,
  createMediaSourceAction,
  createPublishTaskAction,
  createRuntimeBackupAction,
  importRuntimeBackupAction,
  crawlInternationalGeoSiteAuditAction,
  createModelConfigAction,
  createKeywordCrawlJobAction,
  createTopicIdeaAction,
  createArticleFromTopicAction,
  createTopicIdeasFromKeywords,
  generateInternationalGeoArticlesAction,
  generateInternationalGeoArtifactsAction,
  generateInternationalGeoPlatformRewritesAction,
  generateInternationalGeoEvidenceAssetsAction,
  generateInternationalGeoPublishingPackagesAction,
  generateInternationalGeoSiteAuditAssetsAction,
  generateTopicOutlineAction,
  importInternationalGeoVisibilityEvidenceBatchAction,
  importInternationalGeoVisibilityEvidenceAction,
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
  getInternationalGeoContentGenerationState,
  getInternationalGeoEvidenceAssetsState,
  getInternationalGeoPublishingState,
  getInternationalGeoVisibilityState,
  getInternationalGeoSiteAudit,
  getDashboardSummary,
  getKeyword,
  getKeywordAnalytics,
  getKeywordTrend,
  getPublishTask,
  getRuntimeBackupDownload,
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
  listConnectorDiagnostics,
  listChannels,
  listContentTemplates,
  listInvoices,
  listInternationalGeoSiteAudits,
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
  listRuntimeBackups,
  listAutomationRuns,
  listSourceAdapterContracts,
  listSourceStrategies,
  listTopicIdeas,
  listUsageRecords,
  reviewArticleAction,
  reviewInternationalGeoVisibilityEvidenceAction,
  reviewInternationalGeoGeneratedArticleAction,
  reviewInternationalGeoEvidenceAssetAction,
  reviewInternationalGeoPlatformRewriteAction,
  reviewInternationalGeoPublishingPackageAction,
  runInternationalGeoAuditAction,
  runInternationalGeoVisibilityMeasurementAction,
  reconnectChannelAction,
  recordAuditEventAction,
  runSourceStrategyAction,
  runMarketingCampaignAction,
  runConnectorDiagnosticAction,
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
  updateInternationalGeoPublishingTrackingAction,
  updateKeywordAction,
  updateTopicIdeaAction,
  updateArticleAction,
  authenticateUserAction,
  createUserAction,
  disableUserAction,
  getUserById,
  listUsers,
  resetUserPasswordAction,
  logoutSessionAction,
  getPersistenceStatus,
  getRuntimeStatus,
  resetRuntimeState,
  validateRuntimeBackupImportAction,
  validateRuntimeBackupAction,
  restoreRuntimeBackupAction
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
const sessionCookieName = "geo_session";
const sessionTtlMs = Math.max(15 * 60 * 1000, Number(process.env.GEO_SESSION_TTL_MS || 8 * 60 * 60 * 1000));
const sessions = new Map();
const publicSiteUrl = (process.env.GEO_PUBLIC_SITE_URL || `http://${host || "localhost"}:${port}`).replace(/\/+$/, "");

if (isProduction && explicitInternalApiKey.length < minProductionApiKeyLength) {
  console.error("NODE_ENV=production requires GEO_INTERNAL_API_KEY with at least 24 characters.");
  process.exit(1);
}

if (isProduction && !process.env.GEO_BOOTSTRAP_OWNER_PASSWORD) {
  console.error("NODE_ENV=production requires GEO_BOOTSTRAP_OWNER_PASSWORD for first owner bootstrap.");
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

function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const index = pair.indexOf("=");
      if (index > -1) {
        acc[pair.slice(0, index)] = decodeURIComponent(pair.slice(index + 1));
      }
      return acc;
    }, {});
}

function sessionCookie(token, expiresAt) {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];
  if (isProduction) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProduction ? "; Secure" : ""}`;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionTtlMs;
  sessions.set(token, {
    user_id: user.id,
    expires_at: expiresAt
  });
  return {
    token,
    expires_at: new Date(expiresAt).toISOString()
  };
}

function getSessionFromRequest(req) {
  const token = parseCookies(req)[sessionCookieName];
  const session = token ? sessions.get(token) : null;
  if (!session || session.expires_at <= Date.now()) {
    if (token) {
      sessions.delete(token);
    }
    return {
      authenticated: false
    };
  }

  const user = getUserById(session.user_id);
  if (!user || user.status !== "active") {
    sessions.delete(token);
    return {
      authenticated: false
    };
  }

  return {
    authenticated: true,
    token,
    user,
    expires_at: new Date(session.expires_at).toISOString()
  };
}

const roleRank = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3
};

function hasRoleAtLeast(user, role) {
  return (roleRank[user?.role] ?? -1) >= (roleRank[role] ?? 999);
}

function isPublicApiPath(method, pathname) {
  return (
    (method === "GET" && pathname === "/session/current") ||
    (method === "POST" && pathname === "/session/login") ||
    (method === "GET" && pathname === "/system/client-config")
  );
}

function requiredRoleForMutation(method, pathname) {
  if (!isMutatingMethod(method)) {
    return "viewer";
  }
  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return "admin";
  }
  if (pathname.includes("/restore") || pathname === "/system/runtime/reset") {
    return "owner";
  }
  if (
    pathname.startsWith("/automation-providers") ||
    pathname.startsWith("/automation-connectors") ||
    pathname.startsWith("/model-configs") ||
    pathname.startsWith("/channels") ||
    pathname.startsWith("/system/backups") ||
    pathname === "/brand-profile" ||
    pathname === "/billing/plan"
  ) {
    return "admin";
  }
  return "editor";
}

function canCreateTargetRole(actor, targetRole) {
  if (actor?.role === "owner") return true;
  if (actor?.role === "admin") return ["editor", "viewer"].includes(targetRole);
  return false;
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
    scheduler: getSchedulerStatus(),
    preflight: getLaunchPreflight()
  };
}

function preflightCheck(id, category, label, status, message, recommendation = "") {
  return {
    id,
    category,
    label,
    status,
    message,
    recommendation
  };
}

function getLaunchPreflight() {
  const runtime = getRuntimeStatus();
  const scheduler = getSchedulerStatus();
  const checks = [];

  checks.push(
    preflightCheck(
      "persistence",
      "data",
      "本地持久化",
      runtime.persistence?.enabled ? "passed" : "warning",
      runtime.persistence?.enabled
        ? "本地 JSON 持久化已开启。"
        : "当前运行态未开启持久化，重启后会回到种子数据。",
      runtime.persistence?.enabled
        ? "上线前确认数据目录已挂载并可备份。"
        : "设置 GEO_ENABLE_PERSISTENCE=1，并挂载 GEO_DATA_FILE 所在目录。"
    )
  );

  const keyLength = explicitInternalApiKey.length;
  const authStatus = isProduction && keyLength < minProductionApiKeyLength
    ? "failed"
    : keyLength >= minProductionApiKeyLength
      ? "passed"
      : "warning";
  checks.push(
    preflightCheck(
      "mutation_auth",
      "security",
      "写接口鉴权",
      authStatus,
      keyLength >= minProductionApiKeyLength
        ? "已配置固定长度的内部 API key。"
        : "当前使用启动时生成或长度不足的内部 API key。",
      keyLength >= minProductionApiKeyLength
        ? "继续通过外部访问层保护服务。"
        : "上线前设置至少 24 位的 GEO_INTERNAL_API_KEY。"
    )
  );

  const usersPage = listUsers({ page_size: 100 });
  const activeOwners = usersPage.items.filter((item) => item.role === "owner" && item.status === "active");
  checks.push(
    preflightCheck(
      "user_auth",
      "security",
      "用户认证",
      activeOwners.length > 0 ? "passed" : "failed",
      activeOwners.length > 0 ? "存在可用 owner 用户。" : "没有可用 owner 用户。",
      activeOwners.length > 0 ? "上线前确认已修改 bootstrap 临时密码。" : "创建至少一个 active owner 用户。"
    )
  );

  checks.push(
    preflightCheck(
      "session_security",
      "security",
      "会话安全",
      isProduction ? "passed" : "warning",
      isProduction ? "生产环境会话 Cookie 启用 Secure。" : "开发环境会话 Cookie 未启用 Secure。",
      "生产部署使用 NODE_ENV=production、HTTPS 和固定 bootstrap 密码。"
    )
  );

  checks.push(
    preflightCheck(
      "remote_access",
      "security",
      "远程访问边界",
      allowRemoteAccess ? "warning" : "passed",
      allowRemoteAccess
        ? "服务允许非本机请求，必须依赖外部访问控制。"
        : "远程访问默认关闭，仅允许本机受控使用。",
      allowRemoteAccess
        ? "确认已配置反向代理认证、VPN、IP allowlist 或等效访问层。"
        : "如需暴露服务，先配置固定 API key 和外部访问控制。"
    )
  );

  const backupCount = runtime.backups?.count || 0;
  checks.push(
    preflightCheck(
      "backup_recovery",
      "data",
      "备份恢复",
      backupCount > 0 ? "passed" : "warning",
      backupCount > 0
        ? `已有 ${backupCount} 个本地备份记录。`
        : "尚未创建本地备份。",
      backupCount > 0
        ? "上线前下载一份备份 JSON 并存放到应用主机外。"
        : "上线前创建、校验并下载至少一份备份。"
    )
  );

  const connectorFailureCount = runtime.connectors?.health_summary?.failure_count || 0;
  const connectorTotal = runtime.connectors?.counts?.total || 0;
  checks.push(
    preflightCheck(
      "connectors",
      "operations",
      "连接器状态",
      connectorFailureCount > 0 || connectorTotal === 0 ? "warning" : "passed",
      connectorFailureCount > 0
        ? `最近连接器健康检查存在 ${connectorFailureCount} 个失败。`
        : `已登记 ${connectorTotal} 个连接器，当前无失败健康检查。`,
      connectorFailureCount > 0
        ? "上线前处理失败连接器或保持相关工作流关闭。"
        : "继续使用连接器诊断检查真实集成前置条件。"
    )
  );

  const geoStaticReady =
    robotsTxt().includes("Sitemap:") &&
    sitemapXml().includes("<urlset") &&
    llmsTxt().includes("GEO Pulse") &&
    faviconIco.length > 0;
  checks.push(
    preflightCheck(
      "geo_static",
      "geo",
      "GEO 静态入口",
      geoStaticReady ? "passed" : "failed",
      geoStaticReady
        ? "healthz、robots、sitemap、llms.txt 和 favicon 能由服务生成。"
        : "至少一个 GEO/SEO 静态入口未能生成。",
      geoStaticReady
        ? "上线前确认 GEO_PUBLIC_SITE_URL 指向最终域名。"
        : "修复静态入口后再上线。"
    )
  );

  checks.push(
    preflightCheck(
      "scheduler",
      "operations",
      "自动调度",
      scheduler.enabled ? "passed" : "warning",
      scheduler.enabled
        ? `调度器已开启，当前状态：${scheduler.status || "unknown"}。`
        : "自动调度器未开启，策略需要手动触发。",
      scheduler.enabled
        ? "确认 GEO_AUTOMATION_TICK_MS 和每轮执行上限符合预期。"
        : "如需自动运营，设置 GEO_ENABLE_AUTOMATION_SCHEDULER=1。"
    )
  );

  const summary = {
    passed: checks.filter((item) => item.status === "passed").length,
    warnings: checks.filter((item) => item.status === "warning").length,
    failed: checks.filter((item) => item.status === "failed").length,
    blockers: checks.filter((item) => item.status === "failed").length
  };
  const score = Math.max(0, Math.min(100, 100 - summary.failed * 30 - summary.warnings * 8));
  const status = summary.failed > 0 ? "blocked" : summary.warnings > 0 ? "review" : "ready";

  return {
    status,
    score,
    summary,
    checks,
    generated_at: isoNow()
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

  const session = getSessionFromRequest(req);
  const apiKeyAuthorized = req.headers["x-geo-api-key"] === internalApiKey;

  if (req.method === "GET" && pathname === "/session/current") {
    const safeSession = session.authenticated
      ? {
          authenticated: true,
          user: session.user,
          expires_at: session.expires_at
        }
      : { authenticated: false };
    sendJson(res, 200, ok(safeSession));
    return;
  }

  if (req.method === "POST" && pathname === "/session/login") {
    const body = await parseBody(req).catch(() => null);
    const user = authenticateUserAction(body || {}, {
      remote_address: req.socket.remoteAddress || ""
    });
    if (!user) {
      sendJson(res, 401, error("UNAUTHENTICATED", "Invalid username or password", 401).body);
      return;
    }
    const nextSession = createSession(user);
    res.setHeader("Set-Cookie", sessionCookie(nextSession.token, Date.parse(nextSession.expires_at)));
    sendJson(res, 200, ok({
      authenticated: true,
      user,
      expires_at: nextSession.expires_at
    }));
    return;
  }

  if (!isPublicApiPath(req.method, pathname) && !session.authenticated && !apiKeyAuthorized) {
    recordAuthFailure(req, pathname, "missing_or_expired_session");
    sendJson(res, 401, error("UNAUTHENTICATED", "Login is required", 401).body);
    return;
  }

  if (!apiKeyAuthorized && !isPublicApiPath(req.method, pathname)) {
    if (isSensitiveReadPath(req.method, pathname) && !hasRoleAtLeast(session.user, "admin")) {
      recordAuthFailure(req, pathname, "insufficient_role");
      sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
      return;
    }

    const requiredRole = requiredRoleForMutation(req.method, pathname);
    if (!hasRoleAtLeast(session.user, requiredRole)) {
      recordAuthFailure(req, pathname, "insufficient_role");
      sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
      return;
    }
  }

  if (req.method === "POST" && pathname === "/session/logout") {
    if (session.token) {
      sessions.delete(session.token);
    }
    res.setHeader("Set-Cookie", clearSessionCookie());
    recordAuditEventAction("auth.logout", "user", session.user?.id || "anonymous", {
      username: session.user?.username || ""
    });
    sendJson(res, 200, ok({ success: true }));
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

  if (req.method === "GET" && pathname === "/users") {
    sendJson(res, 200, ok(listUsers(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/users") {
    const body = await parseBody(req).catch(() => null);
    const targetRole = body?.role || "viewer";
    if (!apiKeyAuthorized && !canCreateTargetRole(session.user, targetRole)) {
      recordAuthFailure(req, pathname, "insufficient_role");
      sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
      return;
    }
    const result = createUserAction(body || {}, session.user || { id: "api-key" });
    if (!result) {
      sendJson(res, 400, error("VALIDATION_ERROR", "User could not be created").body);
      return;
    }
    sendJson(res, 201, ok(result));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/users\/[^/]+\/disable$/)) {
    const userId = decodeURIComponent(pathname.split("/")[2]);
    const targetUser = getUserById(userId);
    if (!targetUser) {
      sendJson(res, 404, error("NOT_FOUND", "User not found", 404).body);
      return;
    }
    if (!apiKeyAuthorized && targetUser.role === "owner" && session.user?.role !== "owner") {
      recordAuthFailure(req, pathname, "insufficient_role");
      sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
      return;
    }
    const result = disableUserAction(userId, session.user || { id: "api-key" });
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/users\/[^/]+\/reset-password$/)) {
    const userId = decodeURIComponent(pathname.split("/")[2]);
    const targetUser = getUserById(userId);
    if (!targetUser) {
      sendJson(res, 404, error("NOT_FOUND", "User not found", 404).body);
      return;
    }
    if (!apiKeyAuthorized && targetUser.role === "owner" && session.user?.role !== "owner") {
      recordAuthFailure(req, pathname, "insufficient_role");
      sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
      return;
    }
    const result = resetUserPasswordAction(userId, session.user || { id: "api-key" });
    sendJson(res, 200, ok(result));
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

  if (req.method === "POST" && pathname.match(/^\/automation-connectors\/[^/]+\/diagnose$/)) {
    const id = pathname.split("/")[2];
    const result = runConnectorDiagnosticAction(id);
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

  if (req.method === "GET" && pathname === "/connector-diagnostics") {
    sendJson(res, 200, ok(listConnectorDiagnostics(query)));
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

  if (req.method === "GET" && pathname === "/system/preflight") {
    sendJson(res, 200, ok(getLaunchPreflight()));
    return;
  }

  if (req.method === "GET" && pathname === "/system/backups") {
    sendJson(res, 200, ok(listRuntimeBackups(query)));
    return;
  }

  if (req.method === "POST" && pathname === "/system/backups") {
    const body = await parseBody(req).catch(() => null);
    if (body === null) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    sendJson(res, 201, ok(createRuntimeBackupAction(body || {})));
    return;
  }

  if (req.method === "POST" && pathname === "/system/backups/import/validate") {
    const body = await parseBody(req).catch(() => null);
    if (body === null) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    sendJson(res, 200, ok(validateRuntimeBackupImportAction(body || {})));
    return;
  }

  if (req.method === "POST" && pathname === "/system/backups/import") {
    const body = await parseBody(req).catch(() => null);
    if (body === null) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(importRuntimeBackupAction(body || {})));
      return;
    } catch (runtimeError) {
      const status = Number(runtimeError?.status || 400);
      const message = runtimeError instanceof Error ? runtimeError.message : String(runtimeError);
      sendJson(res, status, error("BACKUP_IMPORT_FAILED", message, status).body);
      return;
    }
  }

  if (req.method === "GET" && pathname.match(/^\/system\/backups\/[^/]+\/download$/)) {
    const id = pathname.split("/")[3];
    const artifact = getRuntimeBackupDownload(id);
    if (!artifact) {
      sendJson(res, 404, error("NOT_FOUND", "Runtime backup not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(artifact));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/system\/backups\/[^/]+\/validate$/)) {
    const id = pathname.split("/")[3];
    const result = validateRuntimeBackupAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Runtime backup not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(result));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/system\/backups\/[^/]+\/restore$/)) {
    const id = pathname.split("/")[3];
    try {
      const result = restoreRuntimeBackupAction(id);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Runtime backup not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
      return;
    } catch (runtimeError) {
      const status = Number(runtimeError?.status || 400);
      const message = runtimeError instanceof Error ? runtimeError.message : String(runtimeError);
      sendJson(res, status, error("BACKUP_RESTORE_FAILED", message, status).body);
      return;
    }
  }

  if (req.method === "GET" && pathname === "/system/client-config") {
    sendJson(res, 200, ok({
      mutation_auth_required: true,
      mutation_header_name: "X-GEO-API-Key",
      mutation_api_key: ""
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

  if (req.method === "GET" && pathname === "/international-geo/visibility") {
    sendJson(res, 200, ok(getInternationalGeoVisibilityState()));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/visibility/runs") {
    sendJson(res, 200, ok({ items: getInternationalGeoVisibilityState().runs }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/visibility/snapshots") {
    sendJson(res, 200, ok({ items: getInternationalGeoVisibilityState().snapshots }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/evidence-assets") {
    sendJson(res, 200, ok(getInternationalGeoEvidenceAssetsState()));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/evidence-assets/opportunities") {
    sendJson(res, 200, ok({ items: getInternationalGeoEvidenceAssetsState().opportunities }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/evidence-assets/queue") {
    sendJson(res, 200, ok({ items: getInternationalGeoEvidenceAssetsState().queue }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/content-generation") {
    sendJson(res, 200, ok(getInternationalGeoContentGenerationState()));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/content-generation/articles/generate") {
    sendJson(res, 201, ok(generateInternationalGeoArticlesAction()));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/content-generation/rewrites/generate") {
    sendJson(res, 201, ok(generateInternationalGeoPlatformRewritesAction()));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/content-generation\/articles\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoGeneratedArticleAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Generated article not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || "Review action must be approve or reject";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/content-generation\/rewrites\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoPlatformRewriteAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Platform rewrite not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || "Review action must be approve or reject";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing") {
    sendJson(res, 200, ok(getInternationalGeoPublishingState()));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing/platforms") {
    sendJson(res, 200, ok({ items: getInternationalGeoPublishingState().platforms }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing/packages") {
    sendJson(res, 200, ok({ items: getInternationalGeoPublishingState().packages }));
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/publishing/tracking") {
    sendJson(res, 200, ok({ items: getInternationalGeoPublishingState().tracking }));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/visibility/prompt-sets") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(createInternationalGeoVisibilityPromptSetAction(body)));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid visibility prompt set";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/visibility/run") {
    const body = await parseBody(req).catch(() => ({}));
    sendJson(res, 200, ok(runInternationalGeoVisibilityMeasurementAction(body || {})));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/visibility/evidence/import") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(importInternationalGeoVisibilityEvidenceAction(body)));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid measured visibility evidence";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/visibility/evidence/imports") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(importInternationalGeoVisibilityEvidenceBatchAction(body)));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid measured visibility evidence batch";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/visibility\/evidence\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoVisibilityEvidenceAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Measured visibility evidence not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || err.message || "Invalid measured visibility evidence review";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/evidence-assets/generate") {
    sendJson(res, 201, ok(generateInternationalGeoEvidenceAssetsAction()));
    return;
  }

  if (req.method === "POST" && pathname === "/international-geo/publishing/packages/generate") {
    sendJson(res, 201, ok(generateInternationalGeoPublishingPackagesAction()));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/publishing\/packages\/[^/]+\/review$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoPublishingPackageAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Publishing package not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || "Review action must be approve or reject";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "PUT" && pathname.match(/^\/international-geo\/publishing\/tracking\/[^/]+$/)) {
    const id = pathname.split("/")[4];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = updateInternationalGeoPublishingTrackingAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Publishing tracking record not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        const message = err.field_errors?.[0]?.message || "Invalid publishing tracking update";
        sendJson(res, 400, error("VALIDATION_ERROR", message).body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/evidence-assets\/[^/]+\/review$/)) {
    const id = pathname.split("/")[3];
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      const result = reviewInternationalGeoEvidenceAssetAction(id, body);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Evidence asset not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      if ((err?.code || err?.message) === "VALIDATION_ERROR") {
        sendJson(res, 400, error("VALIDATION_ERROR", "Review action must be approve or reject").body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "GET" && pathname === "/international-geo/site-audits") {
    sendJson(res, 200, ok(listInternationalGeoSiteAudits(query)));
    return;
  }

  if (req.method === "GET" && pathname.match(/^\/international-geo\/site-audits\/[^/]+$/)) {
    const id = pathname.split("/")[3];
    const audit = getInternationalGeoSiteAudit(id);
    if (!audit) {
      sendJson(res, 404, error("NOT_FOUND", "Site GEO audit not found", 404).body);
      return;
    }
    sendJson(res, 200, ok(audit));
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

  if (req.method === "POST" && pathname === "/international-geo/site-audits") {
    const body = await parseBody(req).catch(() => null);
    if (!body) {
      sendJson(res, 400, error("INVALID_JSON", "Request body must be valid JSON").body);
      return;
    }
    try {
      sendJson(res, 201, ok(createInternationalGeoSiteAuditAction(body)));
    } catch (err) {
      const code = err?.code || err?.message;
      if (code === "INVALID_SITE_URL") {
        sendJson(res, 400, error("INVALID_SITE_URL", "Website URL must be a valid http or https URL").body);
        return;
      }
      if (code === "PRODUCT_NAME_REQUIRED") {
        sendJson(res, 400, error("PRODUCT_NAME_REQUIRED", "Product name is required").body);
        return;
      }
      throw err;
    }
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/site-audits\/[^/]+\/assets$/)) {
    const id = pathname.split("/")[3];
    const result = generateInternationalGeoSiteAuditAssetsAction(id);
    if (!result) {
      sendJson(res, 404, error("NOT_FOUND", "Site GEO audit not found", 404).body);
      return;
    }
    sendJson(res, 201, ok(result));
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/international-geo\/site-audits\/[^/]+\/crawl$/)) {
    const id = pathname.split("/")[3];
    try {
      const result = await crawlInternationalGeoSiteAuditAction(id);
      if (!result) {
        sendJson(res, 404, error("NOT_FOUND", "Site GEO audit not found", 404).body);
        return;
      }
      sendJson(res, 200, ok(result));
    } catch (err) {
      const code = err?.code || err?.message;
      if (code === "CRAWL_TARGET_BLOCKED") {
        sendJson(res, 400, error("CRAWL_TARGET_BLOCKED", err.message || "Crawl target is blocked by safety policy").body);
        return;
      }
      throw err;
    }
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
