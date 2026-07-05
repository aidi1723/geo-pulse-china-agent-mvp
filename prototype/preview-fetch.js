import { handleStaticRequest } from "./src/static-api.js?v=20260417-5";

const isStaticPreview =
  typeof window !== "undefined" && window.location?.protocol === "file:";

if (isStaticPreview && typeof window.fetch === "function" && !window.__GEO_PREVIEW_FETCH_PATCHED__) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === "string" ? input : input?.url || "";
    const pathname = extractPathname(requestUrl);
    const method =
      init.method ||
      (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET") ||
      "GET";

    if (pathname?.startsWith("/api/v1/")) {
      try {
        const data = await handleStaticRequest(pathname, method);
        return jsonResponse(200, { success: true, data });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Static preview request failed";
        const status = String(message).includes("只支持只读浏览") ? 405 : 404;
        return jsonResponse(status, {
          success: false,
          error: {
            code: status === 405 ? "STATIC_PREVIEW_READ_ONLY" : "STATIC_PREVIEW_NOT_FOUND",
            message
          }
        });
      }
    }

    return nativeFetch(input, init);
  };

  window.__GEO_PREVIEW_FETCH_PATCHED__ = true;
}

function extractPathname(value) {
  if (!value) return "";
  if (value.startsWith("/")) return value.split("?")[0];
  try {
    return new URL(value, window.location.href).pathname;
  } catch {
    return "";
  }
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
