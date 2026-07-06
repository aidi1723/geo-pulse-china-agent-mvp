import { escapeHtml, metricCard, statusMarkup, tableMarkup } from "../utils.js";

const internationalGeo = {
  summary: {
    ai_ready_score: 78,
    llms_status: "已部署",
    schema_coverage: "68%",
    crawler_access: "允许",
    citation_opportunities: 24
  },
  filters: {
    markets: ["US", "EU", "UK", "SEA"],
    languages: ["en-US", "en-GB", "en"],
    engines: ["ChatGPT Search", "Perplexity", "Google AI Overviews", "Gemini", "Claude"],
    stages: ["Readiness audit", "Citation monitoring", "Content opportunity", "Entity coverage"]
  },
  engineVisibility: [
    {
      engine: "ChatGPT Search",
      market: "US",
      brand_mentions: 7,
      citation_count: 4,
      share_of_voice: 18,
      cited_url: "/enterprise-ai-agent-platform",
      competitor_gap: "Zapier AI / Jasper",
      status: "监控中",
      last_checked: "2026-07-06 09:30"
    },
    {
      engine: "Perplexity",
      market: "EU",
      brand_mentions: 11,
      citation_count: 8,
      share_of_voice: 24,
      cited_url: "/private-ai-agent-platform",
      competitor_gap: "Glean / Writer",
      status: "领先",
      last_checked: "2026-07-06 09:18"
    },
    {
      engine: "Google AI Overviews",
      market: "UK",
      brand_mentions: 3,
      citation_count: 2,
      share_of_voice: 9,
      cited_url: "/sales-and-trade-digital-employee",
      competitor_gap: "HubSpot AI",
      status: "待提升",
      last_checked: "2026-07-06 08:55"
    },
    {
      engine: "Gemini",
      market: "SEA",
      brand_mentions: 5,
      citation_count: 3,
      share_of_voice: 14,
      cited_url: "/faq",
      competitor_gap: "Intercom Fin",
      status: "观察",
      last_checked: "2026-07-06 08:40"
    },
    {
      engine: "Claude",
      market: "US",
      brand_mentions: 4,
      citation_count: 1,
      share_of_voice: 11,
      cited_url: "/compare",
      competitor_gap: "LangChain / CrewAI",
      status: "待提升",
      last_checked: "2026-07-06 08:20"
    }
  ],
  keywordOpportunities: [
    {
      prompt: "best enterprise AI agent platform for private deployment",
      market: "US",
      language: "en-US",
      intent: "Decision",
      format: "Comparison page",
      potential: "高",
      action: "Add Direct Answer Upfront and pricing-neutral comparison table"
    },
    {
      prompt: "how to build AI agents for B2B sales workflow",
      market: "EU",
      language: "en",
      intent: "Education",
      format: "How-to guide",
      potential: "中",
      action: "Add implementation steps, statistics, and source citations"
    },
    {
      prompt: "private AI agent vs RPA for enterprise automation",
      market: "UK",
      language: "en-GB",
      intent: "Comparison",
      format: "FAQ / vs page",
      potential: "高",
      action: "Create FAQ blocks and product entity schema"
    },
    {
      prompt: "AI agent platform for export sales teams",
      market: "SEA",
      language: "en",
      intent: "Scenario",
      format: "Scenario page",
      potential: "中",
      action: "Add product parameters and regional use-case proof"
    }
  ],
  auditChecklist: [
    {
      item: "llms.txt",
      severity: "高",
      status: "已完成",
      signal: "Root summary includes product scope, URLs and audience",
      recommendation: "Keep it aligned with sitemap after each product page release"
    },
    {
      item: "JSON-LD Schema",
      severity: "高",
      status: "部分完成",
      signal: "Organization and FAQ exist; Product and SoftwareApplication missing",
      recommendation: "Add product entity markup to solution and comparison pages"
    },
    {
      item: "Robots and AI crawler access",
      severity: "中",
      status: "已完成",
      signal: "No AI crawler block detected in robots policy",
      recommendation: "Document crawler policy for GPTBot, ClaudeBot and PerplexityBot"
    },
    {
      item: "Direct Answer Upfront",
      severity: "高",
      status: "待修复",
      signal: "Core pages answer after long intro copy",
      recommendation: "Move direct answer into first 100 words of each target page"
    },
    {
      item: "Statistics and table evidence",
      severity: "中",
      status: "待修复",
      signal: "Few numeric claims and comparison tables",
      recommendation: "Add parameter tables, deployment facts and sourced statistics"
    },
    {
      item: "Author / E-E-A-T proof",
      severity: "中",
      status: "观察",
      signal: "Company proof exists but expert authors are thin",
      recommendation: "Add reviewer, credentials and update date to technical pages"
    },
    {
      item: "FAQ structure",
      severity: "中",
      status: "部分完成",
      signal: "FAQ exists but does not cover international buyer objections",
      recommendation: "Add pricing, deployment, privacy, support and comparison questions"
    },
    {
      item: "Product Entity Coverage",
      severity: "高",
      status: "待修复",
      signal: "Product name is not consistently connected to category terms",
      recommendation: "Unify entity references across site, profiles and third-party pages"
    }
  ],
  entityCoverage: [
    {
      channel: "Reddit",
      status: "缺口",
      consistency: "低",
      evidence_count: 2,
      action: "Seed non-promotional answers in SaaS and automation communities"
    },
    {
      channel: "Quora",
      status: "观察",
      consistency: "中",
      evidence_count: 5,
      action: "Answer comparison and private deployment questions"
    },
    {
      channel: "Wikipedia",
      status: "缺口",
      consistency: "低",
      evidence_count: 0,
      action: "Do not force a page; build third-party citations first"
    },
    {
      channel: "LinkedIn",
      status: "正常",
      consistency: "高",
      evidence_count: 18,
      action: "Keep founder, product and company descriptions aligned"
    },
    {
      channel: "Medium",
      status: "观察",
      consistency: "中",
      evidence_count: 4,
      action: "Republish technical explainers with canonical references"
    },
    {
      channel: "YouTube",
      status: "缺口",
      consistency: "低",
      evidence_count: 1,
      action: "Add demo transcripts and product walkthrough metadata"
    },
    {
      channel: "Industry directories",
      status: "正常",
      consistency: "中",
      evidence_count: 9,
      action: "Align category names with enterprise AI agent platform"
    },
    {
      channel: "Vertical forums",
      status: "观察",
      consistency: "中",
      evidence_count: 6,
      action: "Track citations in automation and B2B export communities"
    }
  ]
};

function renderFilterSummary(filters = {}) {
  const groups = [
    ["市场", filters.markets],
    ["语言", filters.languages],
    ["AI 引擎", filters.engines],
    ["阶段", filters.stages]
  ];

  return groups
    .map(
      ([label, values]) => `
        <div class="info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml((values || []).join(" / "))}</strong>
        </div>
      `
    )
    .join("");
}

function renderEngineVisibilityTable(items = []) {
  return tableMarkup(
    ["AI 引擎", "市场", "品牌提及 / 引用", "Share of Voice", "引用 URL", "竞品缺口", "状态"],
    items.map(
      (item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.engine)}</div>
            <div class="cell-sub">${escapeHtml(item.last_checked)}</div>
          </td>
          <td>${escapeHtml(item.market)}</td>
          <td>${escapeHtml(item.brand_mentions)} / ${escapeHtml(item.citation_count)}</td>
          <td>${escapeHtml(item.share_of_voice)}%</td>
          <td>${escapeHtml(item.cited_url)}</td>
          <td>${escapeHtml(item.competitor_gap)}</td>
          <td>${statusMarkup(item.status)}</td>
        </tr>
      `
    )
  );
}

function renderKeywordOpportunityTable(items = []) {
  return tableMarkup(
    ["Prompt / Keyword", "市场", "语言", "意图", "内容格式", "引用潜力", "建议动作"],
    items.map(
      (item) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(item.prompt)}</div></td>
          <td>${escapeHtml(item.market)}</td>
          <td>${escapeHtml(item.language)}</td>
          <td>${escapeHtml(item.intent)}</td>
          <td>${escapeHtml(item.format)}</td>
          <td>${statusMarkup(item.potential)}</td>
          <td>${escapeHtml(item.action)}</td>
        </tr>
      `
    )
  );
}

function renderAuditChecklistTable(items = []) {
  return tableMarkup(
    ["审计项", "严重度", "状态", "当前信号", "修复建议"],
    items.map(
      (item) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(item.item)}</div></td>
          <td>${statusMarkup(item.severity)}</td>
          <td>${statusMarkup(item.status)}</td>
          <td>${escapeHtml(item.signal)}</td>
          <td>${escapeHtml(item.recommendation)}</td>
        </tr>
      `
    )
  );
}

function renderEntityCoverageTable(items = []) {
  return tableMarkup(
    ["Entity Coverage", "覆盖状态", "一致性", "证据数", "下一步"],
    items.map(
      (item) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(item.channel)}</div></td>
          <td>${statusMarkup(item.status)}</td>
          <td>${escapeHtml(item.consistency)}</td>
          <td>${escapeHtml(item.evidence_count)}</td>
          <td>${escapeHtml(item.action)}</td>
        </tr>
      `
    )
  );
}

export function renderInternationalGeo(data = internationalGeo) {
  const summary = data.summary || {};

  return `
    <section class="surface toolbar">
      <div>
        <h2 class="section-title">国际 GEO</h2>
        <div class="panel-note">Generative Engine Optimization / AI SEO visibility workspace for global markets.</div>
      </div>
      <div class="actions-row">
        <button class="ghost-btn" disabled>Read-only MVP</button>
        <button class="secondary-btn" disabled>AI Readiness Audit</button>
      </div>
    </section>

    <div class="metric-grid">
      ${metricCard("AI-ready score", `${summary.ai_ready_score ?? "-"} / 100`, "Global readiness score")}
      ${metricCard("llms.txt", summary.llms_status || "-", "LLM-readable site summary")}
      ${metricCard("JSON-LD", summary.schema_coverage || "-", "Schema and entity coverage")}
      ${metricCard("Citation opportunities", summary.citation_opportunities ?? "-", "Direct Answer and source gaps")}
    </div>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">Global Filters</h3>
          <div class="panel-note">Market, language, engine and content-stage scope for international GEO operations.</div>
        </div>
      </div>
      <div class="info-grid">
        ${renderFilterSummary(data.filters)}
        <div class="info-row">
          <span>AI crawler access</span>
          <strong>${escapeHtml(summary.crawler_access || "-")}</strong>
        </div>
      </div>
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">AI Engine Visibility</h3>
          <div class="panel-note">Track brand mentions, citations and Share of Voice across ChatGPT Search, Perplexity, Google AI Overviews, Gemini and Claude.</div>
        </div>
      </div>
      ${renderEngineVisibilityTable(data.engineVisibility)}
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">International Keyword Opportunities</h3>
          <div class="panel-note">Prompt-led content opportunities for Direct Answer Upfront, statistics/table evidence, FAQ and product entity pages.</div>
        </div>
      </div>
      ${renderKeywordOpportunityTable(data.keywordOpportunities)}
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">GEO Audit Checklist</h3>
          <div class="panel-note">Lighthouse-style AI readiness checks for llms.txt, JSON-LD, robots, crawler access, E-E-A-T, FAQ and Product Entity Coverage.</div>
        </div>
      </div>
      ${renderAuditChecklistTable(data.auditChecklist)}
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">Entity & Channel Coverage</h3>
          <div class="panel-note">Entity Coverage across Reddit, Quora, Wikipedia, LinkedIn, Medium, YouTube, directories and vertical forums.</div>
        </div>
      </div>
      ${renderEntityCoverageTable(data.entityCoverage)}
    </section>
  `;
}
