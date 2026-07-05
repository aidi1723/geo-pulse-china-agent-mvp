import { STATIC_ROUTE_RESPONSES } from "./static-routes.js";

const STATIC_WRITE_ERROR =
  "当前是静态预览模式，只支持只读浏览。若需保存、生成或发布，请先运行 npm start 并打开 http://localhost:3000/。";

export async function handleStaticRequest(path, method = "GET") {
  const normalizedMethod = String(method || "GET").toUpperCase();
  const route = normalizeRoute(path);

  if (normalizedMethod !== "GET") {
    throw new Error(STATIC_WRITE_ERROR);
  }

  const response = STATIC_ROUTE_RESPONSES[route];
  if (response === undefined) {
    throw new Error(`Static preview route not found: ${route}`);
  }

  return clone(response);
}

function normalizeRoute(path) {
  const input = String(path || "/");
  const pathname = input.split("?")[0] || "/";
  return pathname.startsWith("/api/v1") ? pathname.replace(/^\/api\/v1/, "") || "/" : pathname;
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
