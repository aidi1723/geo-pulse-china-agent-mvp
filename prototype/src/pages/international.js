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
  engineInclusion: [
    {
      engine: "GPT / ChatGPT Search",
      crawler: "OAI-SearchBot",
      access: "允许",
      index_source: "ChatGPT Search index",
      inclusion_signal: "品牌定义页可被检索",
      recommendation_signal: "2 个决策 Prompt 出现推荐",
      action: "保留 OAI-SearchBot 访问，补 FAQ 和对比页 citation"
    },
    {
      engine: "Gemini / Google AI Overviews",
      crawler: "Googlebot",
      access: "允许",
      index_source: "Google Search index",
      inclusion_signal: "核心页面具备 snippet 资格",
      recommendation_signal: "Google AI Overviews 提及低于竞品",
      action: "补 Product schema、参数表和 Search Console 索引覆盖"
    },
    {
      engine: "Claude",
      crawler: "Claude-SearchBot",
      access: "允许",
      index_source: "Claude search retrieval",
      inclusion_signal: "文档页和长文可访问",
      recommendation_signal: "技术解释 Prompt 有引用但无排名推荐",
      action: "强化 E-E-A-T、作者证明和私有化部署解释"
    },
    {
      engine: "Perplexity",
      crawler: "PerplexityBot",
      access: "允许",
      index_source: "Perplexity web index",
      inclusion_signal: "官网和 Medium 引用可见",
      recommendation_signal: "Citation count 高但 Share of Voice 分散",
      action: "补第三方目录和 Reddit / Quora 交叉验证信号"
    },
    {
      engine: "Copilot / Bing",
      crawler: "Bingbot",
      access: "待确认",
      index_source: "Bing index",
      inclusion_signal: "部分英文页面未进入 Bing",
      recommendation_signal: "Copilot 仍优先推荐 HubSpot AI",
      action: "提交 Bing Webmaster 和 IndexNow，补 alternatives 页面"
    }
  ],
  promptMonitoring: [
    {
      prompt: "best enterprise AI agent platform for B2B sales",
      engine: "ChatGPT Search",
      market: "US",
      brand_mentioned: "是",
      cited_url: "/enterprise-ai-agent-platform",
      recommendation_rank: "#3",
      competitors: "Jasper / Writer",
      action: "补采购指南和客户案例，提高推荐排序"
    },
    {
      prompt: "private AI agent platform for regulated companies",
      engine: "Claude",
      market: "EU",
      brand_mentioned: "是",
      cited_url: "/private-ai-agent-platform",
      recommendation_rank: "引用未推荐",
      competitors: "Glean / Moveworks",
      action: "增加安全、权限和部署边界的 Direct Answer"
    },
    {
      prompt: "AI agent platform alternatives to Zapier AI",
      engine: "Perplexity",
      market: "US",
      brand_mentioned: "否",
      cited_url: "-",
      recommendation_rank: "-",
      competitors: "Zapier / Make / n8n",
      action: "生成 alternatives 页面并同步到 Medium"
    },
    {
      prompt: "AI workflow platform for export sales teams",
      engine: "Google AI Overviews",
      market: "SEA",
      brand_mentioned: "是",
      cited_url: "/sales-and-trade-digital-employee",
      recommendation_rank: "#4",
      competitors: "HubSpot AI / Zoho",
      action: "补外贸销售场景参数表和 YouTube transcript"
    },
    {
      prompt: "enterprise AI agent software comparison",
      engine: "Copilot / Bing",
      market: "UK",
      brand_mentioned: "否",
      cited_url: "-",
      recommendation_rank: "-",
      competitors: "Salesforce / Intercom",
      action: "提交 Bing 索引并生成 comparison hub"
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
  contentTasks: [
    {
      type: "Definition page",
      title: "What is an enterprise AI agent platform?",
      target_prompt: "what is enterprise AI agent platform",
      target_engine: "Gemini / Google AI Overviews",
      channel: "官网资源中心",
      reason: "建立产品实体和品类定义",
      review_status: "待审核"
    },
    {
      type: "Comparison page",
      title: "Enterprise AI Agent Platform vs RPA",
      target_prompt: "private AI agent vs RPA",
      target_engine: "Claude",
      channel: "官网对比页",
      reason: "承接高意图对比问题",
      review_status: "草稿"
    },
    {
      type: "Alternatives page",
      title: "Best Zapier AI alternatives for enterprise workflows",
      target_prompt: "alternatives to Zapier AI",
      target_engine: "Perplexity",
      channel: "官网 + Medium",
      reason: "补竞品替代方案入口",
      review_status: "待生成"
    },
    {
      type: "FAQ",
      title: "Private AI agent deployment FAQ",
      target_prompt: "private AI agent deployment questions",
      target_engine: "ChatGPT Search",
      channel: "FAQ + llms.txt 链接",
      reason: "提高直接回答和 citation 命中率",
      review_status: "待审核"
    },
    {
      type: "Product parameter page",
      title: "AI agent platform security and integration specs",
      target_prompt: "enterprise AI agent platform security specs",
      target_engine: "Copilot / Bing",
      channel: "官网规格页",
      reason: "补事实密度、参数表和 Schema",
      review_status: "草稿"
    }
  ],
  distributionPlan: [
    {
      channel: "官网博客 / Resource Center",
      content: "定义页、采购指南、对比页、参数页",
      purpose: "建立可索引、可引用的主事实源",
      cadence: "每周 2 篇",
      guardrail: "人工审核后发布"
    },
    {
      channel: "LinkedIn",
      content: "案例摘要、观点短帖、创始人解释",
      purpose: "补品牌实体和专家信号",
      cadence: "每周 3 条",
      guardrail: "销售/品牌语气检查"
    },
    {
      channel: "Medium / Substack",
      content: "英文长文和技术解释同步稿",
      purpose: "扩大 Perplexity 和 Claude 可引用外部源",
      cadence: "每周 1 篇",
      guardrail: "canonical 引用官网"
    },
    {
      channel: "Reddit / Quora",
      content: "非硬广问答草稿",
      purpose: "补第三方讨论和交叉验证信号",
      cadence: "每周 5 个回答",
      guardrail: "必须人工发布"
    },
    {
      channel: "YouTube transcript",
      content: "演示视频说明和逐字稿",
      purpose: "补视频证据和产品使用场景",
      cadence: "每月 2 条",
      guardrail: "避免夸大效果"
    },
    {
      channel: "G2 / Capterra / 行业目录",
      content: "产品资料、分类、客户评价",
      purpose: "补 Copilot / Perplexity 第三方实体源",
      cadence: "每月维护",
      guardrail: "资料与官网一致"
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

function renderEngineInclusionTable(items = []) {
  return tableMarkup(
    ["AI 引擎", "Crawler / Bot", "访问", "索引来源", "收录信号", "推荐信号", "优化动作"],
    items.map(
      (item) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(item.engine)}</div></td>
          <td>${escapeHtml(item.crawler)}</td>
          <td>${statusMarkup(item.access)}</td>
          <td>${escapeHtml(item.index_source)}</td>
          <td>${escapeHtml(item.inclusion_signal)}</td>
          <td>${escapeHtml(item.recommendation_signal)}</td>
          <td>${escapeHtml(item.action)}</td>
        </tr>
      `
    )
  );
}

function renderPromptMonitoringTable(items = []) {
  return tableMarkup(
    ["Prompt", "引擎", "市场", "品牌提及", "引用 URL", "推荐位", "竞品", "下一步"],
    items.map(
      (item) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(item.prompt)}</div></td>
          <td>${escapeHtml(item.engine)}</td>
          <td>${escapeHtml(item.market)}</td>
          <td>${statusMarkup(item.brand_mentioned)}</td>
          <td>${escapeHtml(item.cited_url)}</td>
          <td>${escapeHtml(item.recommendation_rank)}</td>
          <td>${escapeHtml(item.competitors)}</td>
          <td>${escapeHtml(item.action)}</td>
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

function renderContentTaskTable(items = []) {
  return tableMarkup(
    ["Content Generation Tasks", "标题", "目标 Prompt", "目标引擎", "分发渠道", "生成原因", "审核"],
    items.map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.type)}</td>
          <td><div class="cell-title">${escapeHtml(item.title)}</div></td>
          <td>${escapeHtml(item.target_prompt)}</td>
          <td>${escapeHtml(item.target_engine)}</td>
          <td>${escapeHtml(item.channel)}</td>
          <td>${escapeHtml(item.reason)}</td>
          <td>${statusMarkup(item.review_status)}</td>
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

function renderDistributionPlanTable(items = []) {
  return tableMarkup(
    ["Distribution Execution Plan", "内容", "目的", "节奏", "守门规则"],
    items.map(
      (item) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(item.channel)}</div></td>
          <td>${escapeHtml(item.content)}</td>
          <td>${escapeHtml(item.purpose)}</td>
          <td>${escapeHtml(item.cadence)}</td>
          <td>${escapeHtml(item.guardrail)}</td>
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
        <button class="ghost-btn" data-action="international-artifacts">生成 llms.txt / JSON-LD</button>
        <button class="secondary-btn" data-action="international-audit">AI Readiness Audit</button>
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
          <h3 class="panel-title">AI 引擎收录与推荐矩阵</h3>
          <div class="panel-note">Unify crawler access, index source, inclusion signals and recommendation signals for GPT, Gemini, Claude, Perplexity and Copilot / Bing.</div>
        </div>
      </div>
      ${renderEngineInclusionTable(data.engineInclusion)}
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">Prompt 推荐监测</h3>
          <div class="panel-note">Track whether target prompts mention the brand, cite owned URLs, rank recommendations and expose competitor gaps.</div>
        </div>
      </div>
      ${renderPromptMonitoringTable(data.promptMonitoring)}
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
          <h3 class="panel-title">Content Generation Tasks</h3>
          <div class="panel-note">Map each generated article or page to a target prompt, AI engine, distribution channel and human review state.</div>
        </div>
      </div>
      ${renderContentTaskTable(data.contentTasks)}
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
          <h3 class="panel-title">Distribution Execution Plan</h3>
          <div class="panel-note">Owned content first, then high-signal third-party entity channels with manual guardrails for community posts.</div>
        </div>
      </div>
      ${renderDistributionPlanTable(data.distributionPlan)}
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
