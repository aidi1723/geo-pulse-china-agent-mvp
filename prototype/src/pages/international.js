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

function auditStatusLabel(value) {
  const labels = {
    ready: "就绪",
    review: "需复核",
    blocked: "阻断",
    passed: "通过",
    warning: "告警",
    failed: "失败"
  };
  return labels[value] || value || "-";
}

function evidenceStatusLabel(value) {
  const labels = {
    rule_first: "规则生成",
    crawl_evidenced: "抓取证据",
    unavailable: "不可用"
  };
  return labels[value] || value || "规则生成";
}

function dataStatusLabel(value) {
  return ({ measured: "measured", simulated: "simulated", unavailable: "unavailable" }[value] || "unavailable");
}

function nullableMetric(value) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function resourceStatus(resource = {}) {
  if (!resource) return "-";
  if (resource.ok) return `HTTP ${resource.status_code || 200}`;
  return resource.error_code || `HTTP ${resource.status_code || 0}`;
}

function resourceDetail(resource = {}) {
  if (!resource) return "";
  const parts = [
    resource.title || resource.h1 || "",
    resource.json_ld_types?.length ? `JSON-LD: ${resource.json_ld_types.join(", ")}` : "",
    resource.mentioned_bots?.length ? `Bots: ${resource.mentioned_bots.join(", ")}` : "",
    typeof resource.url_count === "number" ? `URLs: ${resource.url_count}` : "",
    resource.sample_urls?.[0] ? `Sample: ${resource.sample_urls[0]}` : "",
    resource.text_excerpt || ""
  ].filter(Boolean);
  return parts.join(" / ");
}

function assetLabel(value) {
  const labels = {
    llms_txt: "llms.txt",
    llms_txt_update: "llms.txt 更新",
    organization_json_ld: "Organization JSON-LD",
    product_json_ld: "Product JSON-LD",
    faq_json_ld: "FAQ JSON-LD",
    json_ld_patch: "JSON-LD 补丁",
    faq_block: "FAQ 模块",
    comparison_brief: "对比简报",
    alternatives_brief: "替代方案简报",
    definition_brief: "定义简报",
    product_spec_brief: "产品规格简报",
    buyer_guide_brief: "买家指南简报",
    article_brief: "Article brief",
    distribution_brief: "Distribution brief"
  };
  return labels[value] || value || "-";
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

function renderVisibilityMeasurementPanel(visibility = {}) {
  const summary = visibility.summary || {};
  const snapshots = visibility.snapshots || [];
  const promptSets = visibility.prompt_sets || [];
  const readiness = visibility.provider_readiness || [];
  const latestRun = visibility.latest_run || visibility.runs?.[0] || {};
  const countSnapshots = (status) => snapshots.filter((item) => dataStatusLabel(item.data_status) === status).length;

  return `
    <section class="surface panel" data-international-panel="ai-visibility-measurement">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">AI 可见度测量</h3>
          <div class="panel-note">按 Prompt、引擎和数据源状态记录测量基础，不把 unavailable 标记为 measured。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-visibility-run">运行测量</button>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-row"><span>Prompt count</span><strong>${escapeHtml(nullableMetric(summary.prompt_count ?? promptSets.length))}</strong></div>
        <div class="info-row"><span>Engine count</span><strong>${escapeHtml(nullableMetric(summary.engine_count ?? readiness.length))}</strong></div>
        <div class="info-row"><span>measured</span><strong>${escapeHtml(nullableMetric(summary.measured_snapshots ?? countSnapshots("measured")))}</strong></div>
        <div class="info-row"><span>simulated</span><strong>${escapeHtml(nullableMetric(summary.simulated_snapshots ?? countSnapshots("simulated")))}</strong></div>
        <div class="info-row"><span>unavailable</span><strong>${escapeHtml(nullableMetric(summary.unavailable_snapshots ?? countSnapshots("unavailable")))}</strong></div>
        <div class="info-row"><span>Latest run</span><strong>${escapeHtml(nullableMetric(summary.latest_run_status || latestRun.status || "not_run"))}</strong></div>
      </div>
    </section>
  `;
}

function internationalEngineLabel(engineId) {
  const labels = {
    chatgpt_search: "ChatGPT Search",
    perplexity: "Perplexity",
    google_ai_overviews: "Google AI Overviews",
    gemini: "Gemini",
    claude: "Claude",
    copilot_bing: "Copilot / Bing"
  };
  return labels[engineId] || engineId || "-";
}

function visibilityPromptSetId(promptSet) {
  return promptSet?.id || promptSet?.prompt_set_id || promptSet?.key || "";
}

function visibilityPromptSetLabel(promptSet) {
  return promptSet?.label || promptSet?.name || promptSet?.prompt || visibilityPromptSetId(promptSet);
}

function visibilityPromptSetEngines(promptSet) {
  const engines = Array.isArray(promptSet?.engine_ids)
    ? promptSet.engine_ids
    : Array.isArray(promptSet?.engines)
      ? promptSet.engines
      : [];

  return engines
    .map((engine) => (typeof engine === "string" ? engine : engine?.id || engine?.engine_id || engine?.engine || ""))
    .filter(Boolean);
}

function renderVisibilityPromptOptions(promptSets = []) {
  const options = promptSets.length ? promptSets : [{ id: "" }];
  const selectedId = visibilityPromptSetId(options[0]);

  return options
    .map((promptSet) => {
      const value = visibilityPromptSetId(promptSet);
      const label = visibilityPromptSetLabel(promptSet) || "默认 Prompt Set";
      return `<option value="${escapeHtml(value)}" ${value === selectedId ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function renderVisibilityEngineOptions(promptSets = []) {
  const firstPromptSet = promptSets[0] || {};
  const engines = visibilityPromptSetEngines(firstPromptSet);
  const options = engines.length ? engines : ["chatgpt_search"];
  const selectedEngine = options[0] || "chatgpt_search";

  return options
    .map(
      (engineId) =>
        `<option value="${escapeHtml(engineId)}" ${engineId === selectedEngine ? "selected" : ""}>${escapeHtml(internationalEngineLabel(engineId))}</option>`
    )
    .join("");
}

function renderMeasuredVisibilityEvidenceImportPanel(visibility = {}) {
  return `
    <section class="surface panel" data-international-panel="visibility-evidence-import">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">导入测量证据</h3>
          <div class="panel-note">手动录入来自 ChatGPT Search、Gemini、Claude、Perplexity、Google AIO、Copilot/Bing 的可见度证据；这里只记录人工测量结果，不调用外部 provider。</div>
          <div class="panel-note">支持 manual_import / measured_import 证据标记，默认 source_type 为 manual_observation。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-visibility-evidence-import">导入证据</button>
        </div>
      </div>
      <div class="form-grid compact-form">
        <label>Prompt set
          <select data-visibility-evidence-field="prompt_set_id">
            ${renderVisibilityPromptOptions(visibility.prompt_sets || [])}
          </select>
        </label>
        <label>Engine
          <select data-visibility-evidence-field="engine_id">
            ${renderVisibilityEngineOptions(visibility.prompt_sets || [])}
          </select>
        </label>
        <label>Brand mentioned
          <select data-visibility-evidence-field="brand_mentioned">
            <option value="false" selected>否</option>
            <option value="true">是</option>
          </select>
        </label>
        <label>Recommendation rank<input data-visibility-evidence-field="recommendation_rank" value="" inputmode="numeric" /></label>
        <label>Source type
          <select data-visibility-evidence-field="source_type">
            <option value="manual_observation" selected>manual_observation</option>
            <option value="manual_export">manual_export</option>
            <option value="provider_report">provider_report</option>
          </select>
        </label>
        <label>Captured at<input data-visibility-evidence-field="captured_at" value="" placeholder="YYYY-MM-DD HH:mm" /></label>
        <label>Confidence
          <select data-visibility-evidence-field="confidence">
            <option value="medium" selected>medium</option>
            <option value="high">high</option>
            <option value="low">low</option>
          </select>
        </label>
        <label>Source URL<input data-visibility-evidence-field="source_url" value="" /></label>
        <label class="span-2">Citation URLs<textarea data-visibility-evidence-field="citation_urls" rows="3"></textarea></label>
        <label class="span-2">Competitors mentioned<textarea data-visibility-evidence-field="competitors_mentioned" rows="3"></textarea></label>
        <label class="span-2">Raw observation<textarea data-visibility-evidence-field="raw_observation" rows="4"></textarea></label>
        <label class="span-2">Evidence note<textarea data-visibility-evidence-field="evidence_note" rows="3"></textarea></label>
      </div>
    </section>
  `;
}

function renderMeasuredVisibilityEvidenceBatchImportPanel(visibility = {}) {
  const promptSet = visibility.prompt_sets?.[0] || {};
  const sampleRow = visibilityPromptSetId(promptSet)
    ? {
        prompt_set_id: visibilityPromptSetId(promptSet),
        engine_id: visibilityPromptSetEngines(promptSet)[0] || "chatgpt_search",
        source_type: "manual_observation",
        captured_at: "",
        brand_mentioned: false,
        citation_urls: [],
        recommendation_rank: "",
        competitors_mentioned: [],
        confidence: "medium",
        raw_observation: "",
        evidence_note: ""
      }
    : {
        prompt_set_id: "",
        engine_id: "chatgpt_search",
        source_type: "manual_observation",
        captured_at: "",
        brand_mentioned: false,
        citation_urls: [],
        recommendation_rank: "",
        competitors_mentioned: [],
        confidence: "medium",
        raw_observation: "",
        evidence_note: ""
      };

  return `
    <section class="surface panel" data-international-panel="visibility-evidence-batch-import">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">批量导入测量证据</h3>
          <div class="panel-note">粘贴人工核验后的 JSON rows；本地写入 manual_import / measured_import，不调用外部 provider。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-visibility-evidence-batch-import">批量导入</button>
        </div>
      </div>
      <div class="form-grid compact-form">
        <label>Source label<input data-visibility-evidence-batch-field="source_label" value="Manual measured evidence batch" /></label>
        <label>Import note<input data-visibility-evidence-batch-field="import_note" value="" /></label>
        <label class="span-2">Rows JSON<textarea data-visibility-evidence-batch-field="rows_json" rows="8">${escapeHtml(JSON.stringify([sampleRow], null, 2))}</textarea></label>
      </div>
    </section>
  `;
}

function renderMeasuredEvidenceImportLedger(imports = []) {
  const rows = imports.length
    ? imports.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.source_label))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.id))}</div>
            </td>
            <td>${statusMarkup(nullableMetric(item.status))}</td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.row_count))} rows / ${escapeHtml(nullableMetric(item.snapshots_created))} snapshots</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.import_mode))}</div>
            </td>
            <td>
              <div class="cell-title">Pending ${escapeHtml(nullableMetric(item.pending_review_count))} / Approved ${escapeHtml(nullableMetric(item.approved_count))}</div>
              <div class="cell-sub">Rejected ${escapeHtml(nullableMetric(item.rejected_count))}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.created_at))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.import_note))}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无测量证据导入台账。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="visibility-evidence-ledger">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">测量证据台账</h3>
          <div class="panel-note">记录 manual_import / measured_import 批次、来源和复核计数。</div>
        </div>
      </div>
      ${tableMarkup(["来源", "状态", "规模", "复核", "时间 / 备注"], rows)}
    </section>
  `;
}

function renderMeasuredEvidenceReviewTable(snapshots = []) {
  const measured = snapshots.filter((item) => item.data_status === "measured" && item.provider_id === "manual_import");
  const rows = measured.length
    ? measured.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.prompt_set_id))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.engine_label || item.engine_id))}</div>
            </td>
            <td>${statusMarkup(nullableMetric(item.review_status || "pending_review"))}</td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.captured_at))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.source_type))}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.brand_mentioned ? "品牌提及" : "未提及"))}</div>
              <div class="cell-sub">Rank ${escapeHtml(nullableMetric(item.recommendation_rank))} / Citations ${escapeHtml(nullableMetric(item.owned_citation_count))}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.evidence_note || item.raw_observation))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.review_note))}</div>
            </td>
            <td>
              <div class="actions-row">
                <button class="ghost-btn" data-action="international-visibility-evidence-reject" data-snapshot-id="${escapeHtml(item.id || "")}">驳回</button>
                <button class="secondary-btn" data-action="international-visibility-evidence-approve" data-snapshot-id="${escapeHtml(item.id || "")}">审核通过</button>
              </div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无可复核的测量证据。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="visibility-evidence-review">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">证据复核</h3>
          <div class="panel-note">人工导入证据默认 pending_review；趋势仅统计已通过证据。</div>
        </div>
      </div>
      ${tableMarkup(["Prompt / Engine", "复核状态", "时间 / Source", "结果", "证据 / 备注", "动作"], rows)}
    </section>
  `;
}

function renderVisibilityTrendTable(trends = []) {
  const rows = trends.length
    ? trends.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.prompt_set_id))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.engine_label || item.engine_id))}</div>
            </td>
            <td>${escapeHtml(nullableMetric(item.approved_snapshot_count))}</td>
            <td>${escapeHtml(nullableMetric(item.brand_mentioned_count))}</td>
            <td>${escapeHtml(nullableMetric(item.owned_citation_count))}</td>
            <td>
              <div class="cell-title">Best ${escapeHtml(nullableMetric(item.best_recommendation_rank))}</div>
              <div class="cell-sub">Latest ${escapeHtml(nullableMetric(item.latest_recommendation_rank))}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.latest_captured_at))}</div>
              <div class="cell-sub">${escapeHtml((item.competitors_mentioned || []).join(" / ") || "-")}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无已通过证据趋势。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="visibility-trends">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">可见度趋势</h3>
          <div class="panel-note">仅统计已通过证据；approved evidence only，未复核和已驳回证据不进入趋势。</div>
        </div>
      </div>
      ${tableMarkup(["Prompt / Engine", "Approved", "Brand mentions", "Owned citations", "Rank", "Latest / Competitors"], rows)}
    </section>
  `;
}

function renderProviderReadinessTable(readiness = []) {
  const rows = readiness.length
    ? readiness.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.engine_label || item.engine))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.engine_id))}</div>
            </td>
            <td>${statusMarkup(dataStatusLabel(item.data_status))}</td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.provider_id))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.connector_id))}</div>
            </td>
            <td>${statusMarkup(nullableMetric(item.permission_status))}</td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.last_measured_at))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.diagnostics?.[0] || item.diagnostic))}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无引擎数据源状态。</div></td></tr>`];

  return tableMarkup(["引擎", "Data status", "Provider / Connector", "Permission", "Last measured / Diagnostic"], rows);
}

function renderPromptSnapshotProvenance(item = {}) {
  const source = item.provider_id || item.source_type || item.data_source_type || "-";
  const detail =
    item.source_url ||
    item.evidence_note ||
    item.raw_observation ||
    item.diagnostics?.[0] ||
    item.diagnostic ||
    "-";

  return `
    <div class="cell-title">${escapeHtml(nullableMetric(item.confidence))}</div>
    <div class="cell-sub">${escapeHtml(nullableMetric(source))}</div>
    <div class="cell-sub">${escapeHtml(nullableMetric(detail))}</div>
  `;
}

function renderPromptSnapshotTable(snapshots = []) {
  const rows = snapshots.length
    ? snapshots.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.prompt_set_id))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.captured_at))}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.engine_label || item.engine))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.engine_id))}</div>
            </td>
            <td>${statusMarkup(dataStatusLabel(item.data_status))}</td>
            <td>${escapeHtml(nullableMetric(typeof item.brand_mentioned === "boolean" ? (item.brand_mentioned ? "是" : "否") : item.brand_mentioned))}</td>
            <td>${escapeHtml(nullableMetric(item.owned_citation_count ?? item.citation_count))}</td>
            <td>${escapeHtml(nullableMetric(item.recommendation_rank))}</td>
            <td>
              ${renderPromptSnapshotProvenance(item)}
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="7"><div class="empty-state">暂无 Prompt 测量快照。</div></td></tr>`];

  return tableMarkup(["Prompt / Captured", "Engine", "Data status", "Brand mention", "Citations", "Rank", "Provenance"], rows);
}

function renderVisibilityRunTable(runs = []) {
  const rows = runs.length
    ? runs.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(nullableMetric(item.trigger))}</div>
              <div class="cell-sub">${escapeHtml(nullableMetric(item.id))}</div>
            </td>
            <td>${statusMarkup(nullableMetric(item.status))}</td>
            <td>${statusMarkup(dataStatusLabel(item.data_source_type))}</td>
            <td>${escapeHtml(nullableMetric(item.snapshots_created))}</td>
            <td>${escapeHtml(nullableMetric(item.started_at))}</td>
            <td>${escapeHtml(nullableMetric(item.finished_at))}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无测量运行记录。</div></td></tr>`];

  return tableMarkup(["Trigger / ID", "Status", "Data source type", "Snapshots", "Started", "Finished"], rows);
}

function renderSiteAuditPanel(data = {}) {
  const input = data.input || {};
  const latest = data.site_audits?.latest || data.site_audits?.items?.[0] || null;
  const competitors = Array.isArray(input.competitors) ? input.competitors.join("\n") : "";

  return `
    <section class="surface panel" data-international-panel="site-audit">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">站点 GEO 审计</h3>
          <div class="panel-note">输入网址和产品信息，生成规则优先的 AI 搜索可读性审计。</div>
        </div>
        <div class="actions-row">
          <button class="ghost-btn" data-action="international-site-crawl">抓取站点证据</button>
          <button class="ghost-btn" data-action="international-site-assets">生成 GEO 资产</button>
          <button class="secondary-btn" data-action="international-site-audit">运行站点审计</button>
        </div>
      </div>
      <div class="form-grid compact-form">
        <label>Website URL<input data-international-audit-field="website_url" value="${escapeHtml(input.website_url || "")}" /></label>
        <label>Product / Brand<input data-international-audit-field="product_name" value="${escapeHtml(input.product_name || "")}" /></label>
        <label>Target market<input data-international-audit-field="target_market" value="${escapeHtml(input.target_market || "Global")}" /></label>
        <label>Target language<input data-international-audit-field="target_language" value="${escapeHtml(input.target_language || "en")}" /></label>
        <label class="span-2">Primary buyer query<input data-international-audit-field="primary_query" value="${escapeHtml(input.primary_query || "")}" /></label>
        <label class="span-2">Competitors<textarea data-international-audit-field="competitors" rows="3">${escapeHtml(competitors)}</textarea></label>
      </div>
      ${
        latest
          ? `<div class="info-grid">
              <div class="info-row"><span>最近审计</span><strong>${escapeHtml(latest.product_name || "-")}</strong></div>
              <div class="info-row"><span>分数</span><strong>${escapeHtml(latest.score ?? "-")}</strong></div>
              <div class="info-row"><span>状态</span><strong>${escapeHtml(auditStatusLabel(latest.status))}</strong></div>
              <div class="info-row"><span>资产</span><strong>${escapeHtml(latest.summary?.generated_assets ?? 0)}</strong></div>
            </div>`
          : `<div class="empty-state">暂无站点审计。</div>`
      }
    </section>
  `;
}

function scoreValue(value, fallback = "-") {
  return Number.isFinite(Number(value)) ? String(Number(value)) : fallback;
}

function priorityLabel(value) {
  return (
    {
      high: "高",
      medium: "中",
      low: "低"
    }[value] || "-"
  );
}

function confidenceLabel(value) {
  return (
    {
      high: "高",
      medium: "中",
      low: "低"
    }[value] || "-"
  );
}

function evidenceSourceLabel(value) {
  return (
    {
      score_deduction: "评分扣分",
      crawl_evidence: "抓取证据",
      visibility_gap: "可见度缺口",
      rule_first: "规则优先"
    }[value] || value || "-"
  );
}

function publishingFitLabel(value) {
  return ({ high: "高", medium: "中", low: "低" }[value] || value || "-");
}

function publishingStatusLabel(value) {
  return (
    {
      draft_package: "草稿包",
      approved_package: "已通过",
      rejected_package: "已驳回",
      exported: "已导出",
      manually_published: "人工发布",
      pending_review: "待审核",
      approved: "已通过",
      rejected: "已驳回",
      planned: "计划中",
      packaged: "已打包",
      not_published: "未发布",
      blocked: "受阻",
      unknown: "未知",
      not_checked: "未核验",
      not_indexed: "未收录",
      indexed: "已收录",
      not_mentioned: "未提及",
      mentioned: "已提及",
      not_cited: "未引用",
      cited: "已引用",
      not_recommended: "未推荐",
      recommended: "已推荐"
    }[value] || value || "-"
  );
}

function reviewStatusLabel(value) {
  return (
    {
      pending_review: "待审核",
      approved: "已通过",
      rejected: "已驳回"
    }[value] || value || "-"
  );
}

function compactUrlLabel(url) {
  const value = String(url || "");
  try {
    const parsed = new URL(value);
    const path = `${parsed.pathname || "/"}${parsed.search || ""}`;
    const compactPath = path.length > 28 ? `${path.slice(0, 25)}...` : path;
    return `${parsed.hostname}${compactPath === "/" ? "" : compactPath}`;
  } catch {
    return value.length > 32 ? `${value.slice(0, 29)}...` : value;
  }
}

function renderSafeExternalLink(url, label = compactUrlLabel(url)) {
  const value = String(url || "");
  const isSafe = /^https?:\/\//i.test(value);
  if (!isSafe) {
    return escapeHtml(value || "-");
  }
  return `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(value)}">${escapeHtml(label || compactUrlLabel(value))}</a>`;
}

function renderPublishingPlatformMatrix(publishing = {}) {
  const platforms = publishing.platforms || [];
  const rows = platforms.length
    ? platforms.map((item) => {
        const fit = item.ai_visibility_fit || {};
        return `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.platform_name || item.platform_key || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.platform_key || item.id || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.platform_type || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.category || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.authority_signal || "-")}</div>
              <div class="cell-sub">${escapeHtml((item.recommended_asset_types || []).map(assetLabel).join(" / ") || "-")}</div>
            </td>
            <td>
              <div class="cell-title">ChatGPT Search: ${escapeHtml(publishingFitLabel(fit.chatgpt_search))} / Gemini: ${escapeHtml(publishingFitLabel(fit.gemini))} / Claude: ${escapeHtml(publishingFitLabel(fit.claude))}</div>
              <div class="cell-sub">Perplexity: ${escapeHtml(publishingFitLabel(fit.perplexity))} / Google AIO: ${escapeHtml(publishingFitLabel(fit.google_ai_overviews))} / Bing: ${escapeHtml(publishingFitLabel(fit.copilot_bing))}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.ai_recommendation_note || "-")}</div>
              <div class="cell-sub">只能增加概率；真实收录、引用和推荐仍需上线后人工或 provider 证据核验。</div>
            </td>
            <td>
              <div class="cell-title">Index: ${escapeHtml(publishingFitLabel(item.indexing_value))} / Citation: ${escapeHtml(publishingFitLabel(item.citation_value))}</div>
              <div class="cell-sub">Entity: ${escapeHtml(publishingFitLabel(item.entity_validation_value))}</div>
            </td>
            <td>${statusMarkup(publishingFitLabel(item.risk_level))}</td>
            <td>
              <div class="cell-title">${escapeHtml(item.publishing_mode || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.connector_status || "-")}</div>
            </td>
          </tr>
        `;
      })
    : [`<tr><td colspan="8"><div class="empty-state">暂无发布平台。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="publishing-platforms">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">高权重发布平台清单</h3>
          <div class="panel-note">Manual / local 平台参考清单；这些平台可增强实体信号和第三方验证，文章发布后可能提高 AI 检索、引用、推荐概率，但不代表已被真实推荐。</div>
        </div>
      </div>
      ${tableMarkup(["平台", "类型", "权重信号 / 适配资产", "AI 引擎适配", "推荐概率说明", "价值", "风险", "模式"], rows)}
    </section>
  `;
}

function contentGenerationStatusLabel(value) {
  return (
    {
      active: "active",
      reserved: "reserved",
      pending_review: "待审核",
      approved: "已通过",
      rejected: "已驳回",
      draft: "草稿",
      approved_article: "已通过",
      rejected_article: "已驳回",
      approved_rewrite: "已通过",
      rejected_rewrite: "已驳回",
      completed: "已完成",
      blocked: "已阻塞"
    }[value] || value || "-"
  );
}

function runTypeLabel(value) {
  return (
    {
      article_generation: "文章生成",
      platform_rewrite_generation: "平台改写"
    }[value] || value || "-"
  );
}

function renderContentGenerationProviderSummary(contentGeneration = {}) {
  const providers = contentGeneration.providers || [];
  return providers.length
    ? providers
        .map(
          (item) => `
            <div class="info-row">
              <span>${escapeHtml(item.provider_name || item.id || "-")}</span>
              <strong>${escapeHtml(item.id || "-")} ${statusMarkup(contentGenerationStatusLabel(item.status))}</strong>
            </div>
          `
        )
        .join("")
    : `<div class="info-row"><span>Provider</span><strong>local_rules ${statusMarkup("active")}</strong></div>`;
}

function renderContentGenerationSummary(contentGeneration = {}) {
  const summary = contentGeneration.summary || {};
  return `
    <div class="info-grid">
      <div class="info-row"><span>生成 Provider</span><strong>${escapeHtml(summary.active_provider || "local_rules")}</strong></div>
      <div class="info-row"><span>文章草稿</span><strong>${escapeHtml(summary.article_count ?? 0)} / 已审 ${escapeHtml(summary.approved_article_count ?? 0)}</strong></div>
      <div class="info-row"><span>改写稿</span><strong>${escapeHtml(summary.rewrite_count ?? 0)} / 已审 ${escapeHtml(summary.approved_rewrite_count ?? 0)}</strong></div>
      <div class="info-row"><span>生成记录</span><strong>${escapeHtml(summary.run_count ?? 0)}</strong></div>
      ${renderContentGenerationProviderSummary(contentGeneration)}
    </div>
  `;
}

function renderGeneratedArticleQueue(contentGeneration = {}) {
  const articles = contentGeneration.articles || [];
  const rows = articles.length
    ? articles.slice(0, 8).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || item.id || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.id || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.target_prompt || "-")}</div>
              <div class="cell-sub">${item.canonical_url ? renderSafeExternalLink(item.canonical_url) : escapeHtml(item.target_url || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.generator_provider || "local_rules")}</div>
              <div class="cell-sub">${escapeHtml((item.source_asset_types || []).map(assetLabel).join(" / ") || "-")}</div>
            </td>
            <td>
              ${statusMarkup(contentGenerationStatusLabel(item.article_status))}
              ${statusMarkup(contentGenerationStatusLabel(item.review_status))}
            </td>
            <td>
              <div class="actions-row">
                <button class="ghost-btn" data-action="international-content-article-reject" data-article-id="${escapeHtml(item.id || "")}">驳回</button>
                <button class="secondary-btn" data-action="international-content-article-approve" data-article-id="${escapeHtml(item.id || "")}">审核通过</button>
              </div>
            </td>
          </tr>
        `
      )
    : [
        `<tr><td colspan="5">
          <div class="empty-state">暂无文章草稿。请先审核通过证据资产，再生成文章。</div>
          <div class="actions-row">
            <button class="ghost-btn" data-action="international-content-article-reject" data-article-id="" disabled>驳回</button>
            <button class="secondary-btn" data-action="international-content-article-approve" data-article-id="" disabled>审核通过</button>
          </div>
        </td></tr>`
      ];

  return `
    <section class="surface panel" data-international-panel="content-articles">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">文章生成队列</h3>
          <div class="panel-note">从已审核证据资产生成完整 Markdown 草稿；local_rules 为当前唯一启用 provider，外部 AI provider 仅预留。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-content-articles-generate">生成文章</button>
        </div>
      </div>
      ${renderContentGenerationSummary(contentGeneration)}
      ${tableMarkup(["文章", "Prompt / Canonical", "Provider / 来源", "状态", "动作"], rows)}
    </section>
  `;
}

function renderPlatformRewriteQueue(contentGeneration = {}) {
  const rewrites = contentGeneration.rewrites || [];
  const rows = rewrites.length
    ? rewrites.slice(0, 12).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.platform_name || item.platform_key || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.platform_key || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.source_article_title || item.source_article_id || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.rewrite_type || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.generator_provider || "local_rules")}</div>
              <div class="cell-sub">${escapeHtml(item.ai_visibility_goal || "-")}</div>
            </td>
            <td>
              ${statusMarkup(contentGenerationStatusLabel(item.rewrite_status))}
              ${statusMarkup(contentGenerationStatusLabel(item.review_status))}
            </td>
            <td>
              <div class="actions-row">
                <button class="ghost-btn" data-action="international-content-rewrite-reject" data-rewrite-id="${escapeHtml(item.id || "")}">驳回</button>
                <button class="secondary-btn" data-action="international-content-rewrite-approve" data-rewrite-id="${escapeHtml(item.id || "")}">审核通过</button>
              </div>
            </td>
          </tr>
        `
      )
    : [
        `<tr><td colspan="5">
          <div class="empty-state">暂无多平台改写稿。请先审核通过文章，再生成平台改写。</div>
          <div class="actions-row">
            <button class="ghost-btn" data-action="international-content-rewrite-reject" data-rewrite-id="" disabled>驳回</button>
            <button class="secondary-btn" data-action="international-content-rewrite-approve" data-rewrite-id="" disabled>审核通过</button>
          </div>
        </td></tr>`
      ];

  return `
    <section class="surface panel" data-international-panel="content-rewrites">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">多平台改写稿</h3>
          <div class="panel-note">把已审核文章改写为官网、Medium、LinkedIn、Reddit、Quora、目录站等平台可人工发布的草稿。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-content-rewrites-generate">生成改写稿</button>
        </div>
      </div>
      ${tableMarkup(["平台", "来源文章", "Provider / 目标", "状态", "动作"], rows)}
    </section>
  `;
}

function renderContentGenerationRuns(contentGeneration = {}) {
  const runs = contentGeneration.runs || [];
  const rows = runs.length
    ? runs.slice(0, 10).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(runTypeLabel(item.run_type))}</div>
              <div class="cell-sub">${escapeHtml(item.id || "-")}</div>
            </td>
            <td>${statusMarkup(contentGenerationStatusLabel(item.status))}</td>
            <td>${escapeHtml(item.generator_provider || "local_rules")}</td>
            <td>
              <div class="cell-title">Articles ${escapeHtml(item.output_article_count ?? item.source_article_count ?? 0)} / Rewrites ${escapeHtml(item.created_count ?? 0)}</div>
              <div class="cell-sub">Sources ${escapeHtml(item.source_asset_count ?? "-")} / Platforms ${escapeHtml(item.platform_count ?? "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.started_at || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.completed_at || item.diagnostic || "-")}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无生成记录。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="content-runs">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">生成记录</h3>
          <div class="panel-note">记录文章生成和平台改写的本地运行结果，便于追踪 local_rules 输出和阻塞原因。</div>
        </div>
      </div>
      ${tableMarkup(["运行", "状态", "Provider", "输出", "时间"], rows)}
    </section>
  `;
}

function renderPublishingPackageQueue(publishing = {}) {
  const packages = publishing.packages || [];
  const rows = packages.length
    ? packages.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || item.id || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.id || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(assetLabel(item.source_asset_type))}</div>
              <div class="cell-sub">${escapeHtml(item.source_asset_id || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.platform_name || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.platform_id || "-")}</div>
            </td>
            <td>
              <div class="cell-title">${escapeHtml(item.package_type || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.content_type || "-")}</div>
            </td>
            <td>
              ${statusMarkup(publishingStatusLabel(item.package_status))}
              ${statusMarkup(publishingStatusLabel(item.review_status))}
            </td>
            <td>
              <div class="actions-row">
                <button class="ghost-btn" data-action="international-publishing-package-reject" data-package-id="${escapeHtml(item.id || "")}">驳回</button>
                <button class="secondary-btn" data-action="international-publishing-package-approve" data-package-id="${escapeHtml(item.id || "")}">审核通过</button>
              </div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无发布包。请先审核通过证据资产，再生成发布包。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="publishing-packages">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">发布包队列</h3>
          <div class="panel-note">发布包是 brief、outline 和 checklist，不是完整文章；审核后人工复制到外部平台。</div>
        </div>
        <div class="actions-row">
          <button class="secondary-btn" data-action="international-publishing-packages-generate">生成发布包</button>
        </div>
      </div>
      ${tableMarkup(["发布包", "来源资产", "平台", "类型", "状态", "动作"], rows)}
    </section>
  `;
}

function renderPublishingTrackingLedger(publishing = {}) {
  const tracking = publishing.tracking || [];
  const rows = tracking.length
    ? tracking.map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.platform_name || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.platform_id || "-")}</div>
            </td>
            <td>
              ${
                item.published_url
                  ? renderSafeExternalLink(item.published_url)
                  : `<button class="ghost-btn" data-action="international-publishing-tracking-demo-update" data-tracking-id="${escapeHtml(item.id || "")}">记录人工发布</button>`
              }
            </td>
            <td>${item.canonical_url ? renderSafeExternalLink(item.canonical_url) : escapeHtml("-")}</td>
            <td>${statusMarkup(publishingStatusLabel(item.publication_status))}</td>
            <td>${statusMarkup(publishingStatusLabel(item.indexing_status))}</td>
            <td>${statusMarkup(publishingStatusLabel(item.ai_mention_status))}</td>
            <td>${statusMarkup(publishingStatusLabel(item.citation_status))}</td>
            <td>${statusMarkup(publishingStatusLabel(item.recommendation_status))}</td>
            <td>
              <div class="cell-title">${escapeHtml(item.updated_at || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.last_checked_at || item.evidence_note || "-")}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="9"><div class="empty-state">暂无收录与推荐追踪。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="publishing-tracking">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">收录与推荐追踪</h3>
          <div class="panel-note">Manual / local tracking only；unknown / not_checked 不是已测量的搜索或 AI 引擎证据。</div>
        </div>
      </div>
      ${tableMarkup(["平台", "Published URL", "Canonical", "发布", "收录", "AI 提及", "引用", "推荐", "更新时间"], rows)}
    </section>
  `;
}

function renderScoreBreakdownPanel(audit = {}) {
  const breakdown = audit?.score_breakdown || {};
  const groups = Array.isArray(breakdown.groups) ? breakdown.groups : [];
  const priorityCounts = breakdown.priority_counts || {};
  const rows = groups.length
    ? groups.map(
        (item) => `
          <tr>
            <td><div class="cell-title">${escapeHtml(item.category || "-")}</div></td>
            <td>${escapeHtml(scoreValue(item.weight))}</td>
            <td>${escapeHtml(scoreValue(item.awarded))}</td>
            <td>${escapeHtml(scoreValue(item.deducted))}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="4"><div class="empty-state">暂无评分拆解。</div></td></tr>`];

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">评分拆解</h3>
          <div class="panel-note">基于规则输入与站点抓取证据的确定性 GEO 审计评分。</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-row"><span>总分</span><strong>${escapeHtml(scoreValue(breakdown.awarded, scoreValue(audit.score)))}</strong></div>
        <div class="info-row"><span>总权重</span><strong>${escapeHtml(scoreValue(breakdown.total_weight))}</strong></div>
        <div class="info-row"><span>扣分</span><strong>${escapeHtml(scoreValue(breakdown.deducted))}</strong></div>
        <div class="info-row"><span>置信度</span><strong>${escapeHtml(confidenceLabel(breakdown.confidence))}</strong></div>
        <div class="info-row"><span>高优先级</span><strong>${escapeHtml(scoreValue(priorityCounts.high, "0"))}</strong></div>
        <div class="info-row"><span>中优先级</span><strong>${escapeHtml(scoreValue(priorityCounts.medium, "0"))}</strong></div>
        <div class="info-row"><span>低优先级</span><strong>${escapeHtml(scoreValue(priorityCounts.low, "0"))}</strong></div>
      </div>
      ${tableMarkup(["类别", "权重", "已得", "扣分"], rows)}
    </section>
  `;
}

function renderSiteAuditChecks(audit = {}) {
  const checks = audit?.checks || [];
  const rows = checks.length
    ? checks.map(
        (item) => {
          const firstDeduction = Array.isArray(item.deduction_reasons) ? item.deduction_reasons[0] : "";
          const firstAction = Array.isArray(item.next_actions) ? item.next_actions[0] : "";
          return `
            <tr>
              <td>
                <div class="cell-title">${escapeHtml(item.label || item.id)}</div>
                <div class="cell-sub">${escapeHtml(item.category || "-")}</div>
              </td>
              <td>${statusMarkup(auditStatusLabel(item.status))}</td>
              <td>
                <div class="cell-title">${escapeHtml(scoreValue(item.score_awarded))}</div>
                <div class="cell-sub">/ ${escapeHtml(scoreValue(item.score_weight))}</div>
              </td>
              <td>${statusMarkup(priorityLabel(item.priority))}</td>
              <td>${statusMarkup(confidenceLabel(item.confidence))}</td>
              <td>
                <div class="cell-title">${escapeHtml(item.message || "-")}</div>
                <div class="cell-sub">${escapeHtml(evidenceStatusLabel(item.evidence_status))}${item.evidence_source ? ` / ${escapeHtml(item.evidence_source)}` : ""}${item.evidence ? ` / ${escapeHtml(item.evidence)}` : ""}</div>
                <div class="cell-sub">${escapeHtml(firstDeduction || item.recommendation || "-")}</div>
                <div class="cell-sub">${escapeHtml(firstAction || item.recommendation || "-")}</div>
              </td>
            </tr>
          `;
        }
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无审计检查项。</div></td></tr>`];

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">审计检查项</h3>
          <div class="panel-note">规则优先审计会结合抓取证据补齐得分、优先级和置信度；AI 引擎收录仍需上线后核验。</div>
        </div>
      </div>
      ${tableMarkup(["检查项", "状态", "得分 / 权重", "优先级", "置信度", "证据 / 建议"], rows)}
    </section>
  `;
}

function renderCrawlEvidencePanel(audit = {}) {
  const evidence = audit?.crawl_evidence;
  const resources = evidence?.resources || {};
  const resourceRows = [
    ["homepage", "Homepage", resources.homepage],
    ["robots_txt", "robots.txt", resources.robots_txt],
    ["sitemap_xml", "sitemap.xml", resources.sitemap_xml],
    ["llms_txt", "llms.txt", resources.llms_txt]
  ];
  const rows = evidence
    ? resourceRows.map(
        ([key, label, resource]) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(label)}</div>
              <div class="cell-sub">${escapeHtml(resource?.url || key)}</div>
            </td>
            <td>${statusMarkup(resource?.ok ? "通过" : "需复核")}</td>
            <td>${escapeHtml(resourceStatus(resource))}</td>
            <td>
              <div class="cell-title">${escapeHtml(resource?.content_type || "-")}</div>
              <div class="cell-sub">${escapeHtml(resourceDetail(resource) || "-")}</div>
            </td>
          </tr>
        `
      )
    : [`<tr><td colspan="4"><div class="empty-state">暂无抓取证据。运行站点审计后可抓取 homepage、robots.txt、sitemap.xml 和 llms.txt。</div></td></tr>`];

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">抓取证据</h3>
          <div class="panel-note">${escapeHtml(evidence ? `${evidence.provider_id || "builtin_safe_fetch"} / ${evidence.status || "-"}` : "等待站点证据抓取。")}</div>
        </div>
      </div>
      ${tableMarkup(["资源", "状态", "HTTP / 错误", "摘要"], rows)}
    </section>
  `;
}

function renderSiteAuditHistory(siteAudits = {}) {
  const items = siteAudits.items || [];
  const rows = items.length
    ? items.slice(0, 5).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.product_name || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.website_url || "-")}</div>
            </td>
            <td>${escapeHtml(item.target_market || "-")}</td>
            <td><strong>${escapeHtml(item.score ?? "-")}</strong></td>
            <td>${statusMarkup(auditStatusLabel(item.status))}</td>
            <td>${escapeHtml(item.summary?.generated_assets ?? 0)}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="5"><div class="empty-state">暂无站点审计记录。</div></td></tr>`];

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">最近审计记录</h3>
          <div class="panel-note">保留最近站点 GEO 审计，便于比较输入和资产生成状态。</div>
        </div>
      </div>
      ${tableMarkup(["站点", "市场", "分数", "状态", "资产"], rows)}
    </section>
  `;
}

function renderEvidenceOpportunitiesPanel(evidenceAssets = {}) {
  const opportunities = evidenceAssets.opportunities || [];
  const rows = opportunities.length
    ? opportunities.slice(0, 8).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.reason || "-")}</div>
            </td>
            <td>${statusMarkup(evidenceSourceLabel(item.source_type))}</td>
            <td>${statusMarkup(priorityLabel(item.priority))}</td>
            <td>${escapeHtml(assetLabel(item.asset_type))}</td>
            <td>
              <div class="cell-title">${escapeHtml(item.evidence_summary || "-")}</div>
              <div class="cell-sub">${escapeHtml(item.recommended_action || "-")}</div>
            </td>
            <td>${statusMarkup(item.status || "open")}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无证据驱动内容机会。运行站点审计、可见度测量或点击生成证据资产。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="evidence-opportunities">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">证据驱动内容机会</h3>
          <div class="panel-note">从评分扣分、抓取证据、AI 可见度缺口和规则输入生成的下一步资产建议。</div>
        </div>
        <button class="secondary-btn" data-action="international-evidence-assets-generate">生成证据资产</button>
      </div>
      ${tableMarkup(["机会", "来源", "优先级", "资产类型", "证据 / 动作", "状态"], rows)}
    </section>
  `;
}

function renderEvidenceAssetQueuePanel(evidenceAssets = {}) {
  const queue = evidenceAssets.queue || [];
  const rows = queue.length
    ? queue.slice(0, 8).map(
        (item) => `
          <tr>
            <td>
              <div class="cell-title">${escapeHtml(item.title || item.id)}</div>
              <div class="cell-sub">${escapeHtml(item.id)}</div>
            </td>
            <td>${escapeHtml(assetLabel(item.asset_type))}</td>
            <td>${statusMarkup(evidenceSourceLabel(item.source_type))}</td>
            <td>${statusMarkup(item.status || "-")}</td>
            <td>${statusMarkup(reviewStatusLabel(item.review_status))}</td>
            <td>${escapeHtml(item.generated_at || item.queued_at || "-")}</td>
          </tr>
        `
      )
    : [`<tr><td colspan="6"><div class="empty-state">暂无资产生成队列。</div></td></tr>`];

  return `
    <section class="surface panel" data-international-panel="evidence-asset-queue">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">资产生成队列</h3>
          <div class="panel-note">本地生成、待人工审核的 GEO 资产队列；不自动发布到外部平台。</div>
        </div>
      </div>
      ${tableMarkup(["队列", "资产类型", "来源", "状态", "审核", "生成时间"], rows)}
    </section>
  `;
}

function mergeGeoAssetPreviews(geoAssets = [], evidenceAssets = {}) {
  const merged = [];
  const idIndex = new Map();
  const append = (item) => {
    if (!item?.id) {
      merged.push(item);
      return;
    }
    if (idIndex.has(item.id)) {
      merged[idIndex.get(item.id)] = item;
      return;
    }
    idIndex.set(item.id, merged.length);
    merged.push(item);
  };

  (geoAssets || []).forEach(append);
  (evidenceAssets.assets || []).forEach(append);
  return merged;
}

function renderGeoAssetPreviews(assets = []) {
  const evidenceItems = (assets || []).filter((item) => item?.opportunity_id);
  const legacyItems = (assets || []).filter((item) => !item?.opportunity_id).slice(0, Math.max(0, 6 - evidenceItems.length));
  const items = [...evidenceItems, ...legacyItems];
  const previews = items.map(
    (item) => {
      const hasOpportunity = Boolean(item.opportunity_id);
      const canReview = hasOpportunity && (!item.review_status || item.review_status === "pending_review");
      return `
        <article class="compact-panel">
          <div class="panel-head">
            <div>
              <h4 class="panel-title">${escapeHtml(assetLabel(item.asset_type))}</h4>
              <div class="panel-note">${escapeHtml(item.content_type || "-")}</div>
            </div>
            ${
              canReview
                ? `<div class="actions-row">
                    <button class="ghost-btn" data-action="international-evidence-asset-reject" data-asset-id="${escapeHtml(item.id || "")}">驳回</button>
                    <button class="secondary-btn" data-action="international-evidence-asset-approve" data-asset-id="${escapeHtml(item.id || "")}">审核通过</button>
                  </div>`
                : ""
            }
          </div>
          ${
            hasOpportunity
              ? `<div class="info-grid">
                  <div class="info-row"><span>证据来源</span><strong>${escapeHtml(evidenceSourceLabel(item.evidence_source_type))}</strong></div>
                  <div class="info-row"><span>置信度</span><strong>${escapeHtml(confidenceLabel(item.confidence))}</strong></div>
                  <div class="info-row"><span>审核状态</span><strong>${escapeHtml(reviewStatusLabel(item.review_status))}</strong></div>
                </div>
                <div class="panel-note">${escapeHtml(item.evidence_summary || "-")}</div>`
              : ""
          }
          <pre class="code-preview">${escapeHtml(item.content || "")}</pre>
        </article>
      `;
    }
  );

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">GEO 资产</h3>
          <div class="panel-note">可复制到站点、CMS 或分发任务中的 llms.txt、JSON-LD、FAQ 和内容简报。</div>
          <div class="panel-note">证据资产显示证据来源、置信度和审核状态，并支持审核通过 / 驳回。</div>
        </div>
      </div>
      <div class="asset-preview-grid">
        ${previews.join("") || `<div class="empty-state">暂无 GEO 资产，请先运行审计并生成资产。</div>`}
      </div>
    </section>
  `;
}

export function renderInternationalGeo(data = internationalGeo) {
  const summary = data.summary || {};
  const latestAudit = data.site_audits?.latest || data.site_audits?.items?.[0] || {};
  const visibility = data.visibility || {};
  const publishing = data.publishing || {};
  const contentGeneration = data.content_generation || {};

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

    ${renderSiteAuditPanel(data)}
    ${renderScoreBreakdownPanel(latestAudit)}
    ${renderSiteAuditChecks(latestAudit)}
    ${renderCrawlEvidencePanel(latestAudit)}
    ${renderSiteAuditHistory(data.site_audits || {})}
    ${renderEvidenceOpportunitiesPanel(data.evidence_assets || {})}
    ${renderEvidenceAssetQueuePanel(data.evidence_assets || {})}
    ${renderGeoAssetPreviews(mergeGeoAssetPreviews(data.geo_assets || [], data.evidence_assets || {}))}
    ${renderGeneratedArticleQueue(contentGeneration)}
    ${renderPlatformRewriteQueue(contentGeneration)}
    ${renderContentGenerationRuns(contentGeneration)}
    ${renderPublishingPlatformMatrix(publishing)}
    ${renderPublishingPackageQueue(publishing)}
    ${renderPublishingTrackingLedger(publishing)}

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

    ${renderVisibilityMeasurementPanel(visibility)}
    ${renderMeasuredVisibilityEvidenceImportPanel(visibility)}
    ${renderMeasuredVisibilityEvidenceBatchImportPanel(visibility)}
    ${renderMeasuredEvidenceImportLedger(visibility.imports || [])}
    ${renderMeasuredEvidenceReviewTable(visibility.snapshots || [])}
    ${renderVisibilityTrendTable(visibility.trends || [])}

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">引擎数据源状态</h3>
          <div class="panel-note">按引擎展示 measured、simulated、unavailable 数据源状态和连接器权限。</div>
        </div>
      </div>
      ${renderProviderReadinessTable(visibility.provider_readiness || [])}
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">Prompt 测量快照</h3>
          <div class="panel-note">每条快照保留 Prompt、引擎、数据状态、品牌提及、引用数和排名诊断。</div>
        </div>
      </div>
      ${renderPromptSnapshotTable(visibility.snapshots || [])}
    </section>

    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">测量运行记录</h3>
          <div class="panel-note">记录触发来源、运行状态、数据源类型、快照数量和起止时间。</div>
        </div>
      </div>
      ${renderVisibilityRunTable(visibility.runs || [])}
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
