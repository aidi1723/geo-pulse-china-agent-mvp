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
    if (route === "/workspace-input") {
      return clone({
        website_url: "https://example.com",
        product_name: "GEO Pulse",
        industry: "AI search operations",
        target_markets: ["CN", "US"],
        audience: "GEO operators and B2B marketing teams",
        language: "zh-CN",
        competitors: ["traditional SEO tools", "AI visibility platforms"],
        differentiators: ["local-first workflow", "domestic and international GEO"]
      });
    }
    if (route === "/international-geo") {
      const siteAudit = {
        id: "sga-static",
        website_url: "https://example.com",
        product_name: "GEO Pulse",
        target_market: "US",
        target_language: "en-US",
        primary_query: "best GEO platform for B2B teams",
        competitors: ["Semrush", "Ahrefs"],
        score: 82,
        status: "review",
        summary: { passed: 3, warnings: 6, failed: 0, blockers: 0, generated_assets: 2 },
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
      };

      return clone({
        summary: {
          ai_ready_score: 78,
          llms_status: "已生成",
          schema_coverage: "68%",
          crawler_access: "允许",
          citation_opportunities: 24
        },
        filters: {
          markets: ["US", "EU", "UK", "SEA"],
          languages: ["en-US", "en-GB", "en"],
          engines: ["ChatGPT Search", "Perplexity", "Google AI Overviews", "Gemini", "Claude", "Microsoft Copilot"],
          stages: ["Readiness audit", "Citation monitoring", "Content opportunity", "Entity coverage"]
        },
        engineVisibility: [],
        site_audits: {
          items: [siteAudit],
          latest: siteAudit
        },
        geo_assets: [
          {
            id: "asset-static",
            audit_id: "sga-static",
            asset_type: "llms_txt",
            title: "llms.txt",
            content: "# GEO Pulse\n\nStatic preview GEO asset.",
            content_type: "text/markdown",
            created_at: "2026-07-06T00:00:00.000Z"
          }
        ]
      });
    }
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
