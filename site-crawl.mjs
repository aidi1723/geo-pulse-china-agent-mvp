import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_BODY_BYTES = 512 * 1024;
const DEFAULT_MAX_REDIRECTS = 3;
const USER_AGENT = "GEO-Pulse-SiteAudit/0.11";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function crawlBlocked(message) {
  const error = new Error(message ? `CRAWL_TARGET_BLOCKED: ${message}` : "CRAWL_TARGET_BLOCKED");
  error.code = "CRAWL_TARGET_BLOCKED";
  return error;
}

function codedError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function responseError(code, responseInfo) {
  const error = codedError(code);
  error.responseInfo = responseInfo;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function excerpt(value, limit = 600) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function resourceUrl(originUrl, pathname) {
  const url = new URL(originUrl.href);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.href;
}

function ipv4Parts(address) {
  const parts = String(address || "").split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((item) => Number(item));
  if (numbers.some((item) => !Number.isInteger(item) || item < 0 || item > 255)) return null;
  return numbers;
}

function normalizedHost(hostname) {
  let host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
  return host;
}

function expandedIpv6Groups(address) {
  let value = normalizedHost(address);
  const zoneIndex = value.indexOf("%");
  if (zoneIndex !== -1) value = value.slice(0, zoneIndex);

  let embeddedIpv4 = null;
  const lastColon = value.lastIndexOf(":");
  const tail = lastColon === -1 ? value : value.slice(lastColon + 1);
  if (tail.includes(".")) {
    embeddedIpv4 = ipv4Parts(tail);
    if (!embeddedIpv4) return null;
    const high = ((embeddedIpv4[0] << 8) | embeddedIpv4[1]).toString(16);
    const low = ((embeddedIpv4[2] << 8) | embeddedIpv4[3]).toString(16);
    value = `${value.slice(0, lastColon)}:${high}:${low}`;
  }

  const halves = value.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves[1] ? halves[1].split(":").filter(Boolean) : [];
  const missing = halves.length === 2 ? 8 - left.length - right.length : 0;
  if (missing < 0) return null;

  const groups = halves.length === 2 ? [...left, ...Array(missing).fill("0"), ...right] : left;
  if (groups.length !== 8) return null;

  const numbers = groups.map((group) => Number.parseInt(group, 16));
  if (numbers.some((item) => !Number.isInteger(item) || item < 0 || item > 0xffff)) return null;
  return { numbers, embeddedIpv4 };
}

export function normalizeCrawlTarget(value) {
  const text = String(value || "").trim();
  const url = new URL(text);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw crawlBlocked("Only http and https crawl targets are allowed");
  }
  url.hash = "";
  return url;
}

export function isBlockedHostname(hostname) {
  const host = normalizedHost(hostname);
  return !host || BLOCKED_HOSTS.has(host) || host.endsWith(".local");
}

export function isBlockedIpAddress(address) {
  const host = normalizedHost(address);
  const family = net.isIP(host);
  if (!family) return false;

  if (family === 4) {
    const parts = ipv4Parts(host);
    if (!parts) return false;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  const parsed = expandedIpv6Groups(host);
  if (!parsed) return false;
  const { numbers, embeddedIpv4 } = parsed;
  const [first, second, third, fourth, fifth, sixth] = numbers;

  const isMapped = first === 0 && second === 0 && third === 0 && fourth === 0 && fifth === 0 && sixth === 0xffff;
  const isCompatible = first === 0 && second === 0 && third === 0 && fourth === 0 && fifth === 0 && sixth === 0;
  if (embeddedIpv4 && (isMapped || isCompatible) && isBlockedIpAddress(embeddedIpv4.join("."))) return true;
  if (isMapped || isCompatible) {
    const mappedIpv4 = [
      (numbers[6] >> 8) & 0xff,
      numbers[6] & 0xff,
      (numbers[7] >> 8) & 0xff,
      numbers[7] & 0xff
    ].join(".");
    if (isBlockedIpAddress(mappedIpv4)) return true;
  }

  const isUnspecified = numbers.every((item) => item === 0);
  const isLoopback = numbers.slice(0, 7).every((item) => item === 0) && numbers[7] === 1;
  const isUniqueLocal = (first & 0xfe00) === 0xfc00;
  const isLinkLocal = (first & 0xffc0) === 0xfe80;
  const isMulticast = (first & 0xff00) === 0xff00;

  return isUnspecified || isLoopback || isUniqueLocal || isLinkLocal || isMulticast;
}

export function validateCrawlTarget(value) {
  const url = normalizeCrawlTarget(value);
  if (isBlockedHostname(url.hostname) || isBlockedIpAddress(url.hostname)) {
    throw crawlBlocked("Crawl target host is blocked by safety policy");
  }
  return url;
}

async function assertDnsSafe(url) {
  const hostname = normalizedHost(url.hostname);
  if (net.isIP(hostname)) {
    if (isBlockedIpAddress(hostname)) throw crawlBlocked("Crawl target IP is blocked by safety policy");
    return;
  }
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (records.some((record) => isBlockedIpAddress(record.address))) {
    throw crawlBlocked("Crawl target resolves to a blocked IP range");
  }
}

function headersGet(headers, name) {
  const value = headers[String(name || "").toLowerCase()];
  if (Array.isArray(value)) return value.join(", ");
  return value || "";
}

function responseInfoFromMessage(response, url) {
  const status = response.statusCode || 0;
  return {
    url,
    status_code: status,
    ok: status >= 200 && status < 300,
    content_type: headersGet(response.headers, "content-type"),
    location: headersGet(response.headers, "location")
  };
}

function createResponseLike(info) {
  return {
    status: info.status_code,
    ok: info.ok,
    headers: {
      get(name) {
        if (String(name || "").toLowerCase() === "content-type") return info.content_type;
        return "";
      }
    }
  };
}

function isSupportedContentType(contentType, resourceType) {
  const type = String(contentType || "").toLowerCase().split(";")[0].trim();
  if (!type) return true;
  if (resourceType === "homepage") {
    return ["text/html", "application/xhtml+xml", "text/plain"].includes(type);
  }
  if (resourceType === "robots_txt" || resourceType === "llms_txt") {
    return ["text/plain", "text/markdown", "text/x-markdown", "text/html"].includes(type);
  }
  if (resourceType === "sitemap_xml") {
    return ["application/xml", "text/xml", "application/rss+xml", "application/atom+xml", "text/plain"].includes(type);
  }
  return type.startsWith("text/") || type.includes("xml") || type.includes("json");
}

async function safeLookup(hostname, options, callback) {
  try {
    const host = normalizedHost(hostname);
    if (isBlockedHostname(host) || isBlockedIpAddress(host)) {
      callback(crawlBlocked("Crawl target host is blocked by safety policy"));
      return;
    }
    if (net.isIP(host)) {
      callback(null, host, net.isIP(host));
      return;
    }
    const records = await dns.lookup(host, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isBlockedIpAddress(record.address))) {
      callback(crawlBlocked("Crawl target resolves to a blocked IP range"));
      return;
    }
    const preferredFamily = options?.family ? records.find((record) => record.family === options.family) : null;
    const selected = preferredFamily || records[0];
    callback(null, selected.address, selected.family);
  } catch (error) {
    callback(error);
  }
}

function readHttpResource(url, options, resourceType) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(url, {
      method: "GET",
      lookup: safeLookup,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,text/plain,application/xml,text/xml,application/xhtml+xml,text/markdown,*/*;q=0.5"
      }
    });
    let settled = false;
    let responseInfo = null;
    const chunks = [];
    let total = 0;
    const timer = setTimeout(() => {
      request.destroy(codedError("FETCH_TIMEOUT"));
    }, options.timeoutMs);

    function settle(callback, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    }

    request.on("response", (response) => {
      responseInfo = responseInfoFromMessage(response, url.href);
      if (REDIRECT_STATUSES.has(responseInfo.status_code)) {
        response.resume();
        settle(resolve, { responseInfo, body: "" });
        return;
      }
      if (!isSupportedContentType(responseInfo.content_type, resourceType)) {
        response.resume();
        settle(resolve, { responseInfo, body: "", unsupportedContentType: true });
        return;
      }
      response.on("data", (chunk) => {
        total += chunk.byteLength;
        if (total > options.maxBodyBytes) {
          request.destroy(responseError("BODY_TOO_LARGE", responseInfo));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      response.on("end", () => {
        settle(resolve, { responseInfo, body: Buffer.concat(chunks).toString("utf8") });
      });
      response.on("error", (error) => {
        settle(reject, error);
      });
    });
    request.on("error", (error) => {
      if (error?.code === "BODY_TOO_LARGE" && !error.responseInfo) error.responseInfo = responseInfo;
      settle(reject, error);
    });
    request.end();
  });
}

async function fetchLimited(url, options, resourceType) {
  let current = validateCrawlTarget(url);
  for (let redirect = 0; ; redirect += 1) {
    const result = await readHttpResource(current, options, resourceType);
    const response = createResponseLike(result.responseInfo);
    if (REDIRECT_STATUSES.has(response.status)) {
      const location = result.responseInfo.location;
      if (redirect >= options.maxRedirects) throw codedError("TOO_MANY_REDIRECTS");
      if (!location) return { response, url: current.href, body: "" };
      current = validateCrawlTarget(new URL(location, current.href).href);
      continue;
    }
    if (result.unsupportedContentType) {
      return { response, url: current.href, body: "", unsupportedContentType: true };
    }
    return { response, url: current.href, body: result.body };
  }
}

function matchFirst(text, pattern) {
  return String(text || "").match(pattern)?.[1]?.trim() || "";
}

function stripTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function jsonLdTypes(html) {
  const types = new Set();
  const blocks = String(html || "").match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of blocks) {
    const raw = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [])];
      for (const node of nodes) {
        const type = node?.["@type"];
        if (Array.isArray(type)) type.forEach((item) => types.add(String(item)));
        else if (type) types.add(String(type));
      }
    } catch {
      types.add("Invalid JSON-LD");
    }
  }
  return [...types].slice(0, 12);
}

function parseHomepage(body, finalUrl, response) {
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    title: matchFirst(body, /<title[^>]*>([\s\S]*?)<\/title>/i),
    meta_description: matchFirst(body, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i),
    canonical_url: matchFirst(body, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i),
    h1: matchFirst(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, " "),
    text_excerpt: excerpt(stripTags(body), 900),
    json_ld_types: jsonLdTypes(body),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function parseRobots(body, finalUrl, response) {
  const bots = ["Googlebot", "Bingbot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "GPTBot"];
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    text_excerpt: String(body || "").slice(0, 900),
    mentioned_bots: bots.filter((bot) => String(body || "").toLowerCase().includes(bot.toLowerCase())),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function parseSitemap(body, finalUrl, response) {
  const urls = [...String(body || "").matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim());
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    url_count: urls.length,
    sample_urls: urls.slice(0, 5),
    text_excerpt: String(body || "").slice(0, 900),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function parseTextResource(body, finalUrl, response) {
  return {
    url: finalUrl,
    status_code: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    text_excerpt: String(body || "").slice(0, 900),
    fetched_at: nowIso(),
    error_code: ""
  };
}

function failedResource(url, error) {
  const responseInfo = error?.responseInfo || {};
  return {
    url: responseInfo.url || String(url || ""),
    status_code: responseInfo.status_code || 0,
    ok: false,
    content_type: responseInfo.content_type || "",
    text_excerpt: "",
    fetched_at: nowIso(),
    error_code: error?.code || error?.message || "FETCH_FAILED"
  };
}

function unsupportedResource(finalUrl, response) {
  return {
    url: finalUrl,
    status_code: response.status,
    ok: false,
    content_type: response.headers.get("content-type") || "",
    text_excerpt: "",
    fetched_at: nowIso(),
    error_code: "UNSUPPORTED_CONTENT_TYPE"
  };
}

async function fetchResource(url, parser, options, resourceType) {
  try {
    const result = await fetchLimited(url, options, resourceType);
    if (result.unsupportedContentType) return unsupportedResource(result.url, result.response);
    return parser(result.body, result.url, result.response);
  } catch (error) {
    if (error?.code === "CRAWL_TARGET_BLOCKED") throw error;
    return failedResource(url, error);
  }
}

export async function crawlInternationalGeoSite(target, options = {}) {
  const startedAt = nowIso();
  const homepageUrl = validateCrawlTarget(target);
  const limits = {
    timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS,
    maxBodyBytes: options.maxBodyBytes || DEFAULT_MAX_BODY_BYTES,
    maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  };
  const origin = homepageUrl.origin;
  const resources = {
    homepage: await fetchResource(homepageUrl.href, parseHomepage, limits, "homepage"),
    robots_txt: await fetchResource(resourceUrl(homepageUrl, "/robots.txt"), parseRobots, limits, "robots_txt"),
    sitemap_xml: await fetchResource(resourceUrl(homepageUrl, "/sitemap.xml"), parseSitemap, limits, "sitemap_xml"),
    llms_txt: await fetchResource(resourceUrl(homepageUrl, "/llms.txt"), parseTextResource, limits, "llms_txt")
  };
  const values = Object.values(resources);
  const okCount = values.filter((item) => item.ok).length;
  const status = okCount === values.length ? "completed" : okCount > 0 ? "partial" : "failed";

  return {
    provider_id: "builtin_safe_fetch",
    execution_mode: "live_fetch",
    status,
    started_at: startedAt,
    completed_at: nowIso(),
    origin,
    resources,
    issues: values.filter((item) => !item.ok).map((item) => ({
      url: item.url,
      error_code: item.error_code || "FETCH_FAILED"
    }))
  };
}
