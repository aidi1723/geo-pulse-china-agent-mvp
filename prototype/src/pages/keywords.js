import {
  channelTypeLabel,
  escapeHtml,
  formatDateTime,
  statusMarkup,
  subtabMarkup,
  tableMarkup
} from "../utils.js";

const TOPIC_GROUPS = [
  {
    title: "购买决策",
    note: "适合对比页、决策页",
    accent: "decision"
  },
  {
    title: "技术解释",
    note: "适合定义文、问答页",
    accent: "explain"
  },
  {
    title: "对比选择",
    note: "适合对比页",
    accent: "compare"
  },
  {
    title: "部署与风险",
    note: "适合部署说明页",
    accent: "risk"
  },
  {
    title: "行业场景",
    note: "适合场景页 / 案例页",
    accent: "scenario"
  }
];

function questionFormLabel(keyword) {
  if ((keyword.keyword || "").includes("怎么") || (keyword.keyword || "").includes("如何")) return "how";
  if ((keyword.keyword || "").includes("区别") || (keyword.keyword || "").includes("对比")) return "vs";
  if ((keyword.keyword || "").includes("哪") || (keyword.keyword || "").includes("怎么选")) return "which";
  if ((keyword.keyword || "").includes("什么")) return "what";
  return "query";
}

function clusterLabel(keyword) {
  if (keyword.intent === "decision") return "购买决策";
  if (keyword.category === "comparison") return "对比选择";
  if (keyword.category === "deployment") return "部署与风险";
  if (keyword.category === "scenario") return "行业场景";
  return "技术解释";
}

function questionFormText(form) {
  return (
    {
      all: "全部问法",
      what: "是什么",
      how: "怎么做",
      vs: "怎么比",
      which: "怎么选",
      query: "泛搜索"
    }[form] || form
  );
}

function matchesForm(keyword, form) {
  if (form === "all") return true;
  return questionFormLabel(keyword) === form;
}

function matchesCluster(keyword, cluster) {
  if (cluster === "all") return true;
  return clusterLabel(keyword) === cluster;
}

function filterKeywords(keywords, filters) {
  return keywords.filter((item) => {
    const query = (filters.query || "").trim();
    const queryMatched =
      !query ||
      item.keyword.toLowerCase().includes(query.toLowerCase()) ||
      (item.suggested_titles || []).some((title) => title.toLowerCase().includes(query.toLowerCase()));
    return queryMatched && matchesForm(item, filters.form) && matchesCluster(item, filters.cluster);
  });
}

function buildTopicGroups(keywords) {
  return TOPIC_GROUPS.map((group) => ({
    ...group,
    items: keywords.filter((item) => clusterLabel(item) === group.title)
  }));
}

function truncateLabel(value, maxLength = 26) {
  const text = String(value || "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function eventLevelLabel(level) {
  return (
    {
      info: "信息",
      warn: "告警",
      error: "错误"
    }[level] || level || "-"
  );
}

function keywordActionDisabledAttr(keyword, action) {
  const disabled =
    !keyword ||
    (action === "select" && keyword.status === "selected") ||
    (action === "watchlist" && keyword.status === "watchlist") ||
    (action === "ignore" && keyword.status === "ignored");

  if (!disabled) {
    return "";
  }

  const title =
    !keyword
      ? "请先选择问题"
      : action === "select"
        ? "该问题已在机会池中"
        : action === "watchlist"
          ? "该问题已在观察列表中"
          : "该问题已标记为忽略";

  return `disabled title="${escapeHtml(title)}"`;
}

function keywordDrawer(keyword) {
  if (!keyword) return "";
  return `
    <div class="drawer-section">
      <div class="cell-title" style="font-size:22px">${escapeHtml(keyword.keyword)}</div>
      <div class="chip-row" style="margin-top: 12px">
        <span class="status-pill status-primary">${escapeHtml(keyword.category_label || keyword.category)}</span>
        <span class="status-pill">${escapeHtml(keyword.intent_label || keyword.intent)}</span>
        ${statusMarkup(keyword.status_label || keyword.status)}
      </div>
    </div>
    <div class="drawer-section">
      <h4>打分结果</h4>
      <div class="info-list">
        <div class="info-row"><span>商业价值</span><strong>${escapeHtml(keyword.business_value_score)}</strong></div>
        <div class="info-row"><span>GEO 适配度</span><strong>${escapeHtml(keyword.geo_fit_score)}</strong></div>
        <div class="info-row"><span>内容可写性</span><strong>${escapeHtml(keyword.content_fit_score)}</strong></div>
        <div class="info-row"><span>竞争强度</span><strong>${escapeHtml(keyword.competition_label || keyword.competition_level)}</strong></div>
      </div>
    </div>
    <div class="drawer-section">
      <h4>推荐标题方向</h4>
      <div class="stack">
        ${(keyword.suggested_titles || []).map((title) => `<span class="filter-pill">${escapeHtml(title)}</span>`).join("")}
      </div>
    </div>
    <div class="drawer-section">
      <h4>相关关键词</h4>
      <div class="chip-row">
        ${(keyword.related_keywords || []).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
    <div class="drawer-section">
      <h4>来源上下文</h4>
      <div class="info-list">
        <div class="info-row"><span>来源类型</span><strong>${escapeHtml(keyword.source_label || keyword.source || "-")}</strong></div>
        <div class="info-row"><span>来源范围</span><strong>${escapeHtml(keyword.source_scope_label || "-")}</strong></div>
        <div class="info-row"><span>来源账号 / 媒体</span><strong>${escapeHtml(keyword.source_origin_name || "-")}</strong></div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="actions-row">
        <button class="secondary-btn" data-action="keyword-status" data-keyword-action="rescore" data-keyword-id="${escapeHtml(keyword.id)}">重新打分</button>
        <button class="secondary-btn" data-action="keyword-status" data-keyword-action="select" data-keyword-id="${escapeHtml(keyword.id)}" ${keywordActionDisabledAttr(keyword, "select")}>加入机会池</button>
        <button class="ghost-btn" data-action="keyword-status" data-keyword-action="watchlist" data-keyword-id="${escapeHtml(keyword.id)}" ${keywordActionDisabledAttr(keyword, "watchlist")}>移到观察</button>
        <button class="ghost-btn" data-action="keyword-status" data-keyword-action="ignore" data-keyword-id="${escapeHtml(keyword.id)}" ${keywordActionDisabledAttr(keyword, "ignore")}>标记忽略</button>
        <button class="primary-btn" data-action="generate-topic" data-keyword-id="${escapeHtml(keyword.id)}">生成选题</button>
      </div>
    </div>
  `;
}

function renderTopicMapGraph(groups, selectedKeywordId, activeCluster) {
  const visibleGroups = groups.filter((group) => group.items.length);
  if (!visibleGroups.length) {
    return "";
  }

  const rootLabel = "中国智能体";
  const svgWidth = 1040;
  const rootWidth = 180;
  const rootHeight = 78;
  const clusterWidth = 196;
  const clusterHeight = 72;
  const questionWidth = 314;
  const questionHeight = 80;
  const laneGap = 34;
  const questionGap = 16;
  const rootX = 40;
  const clusterX = 332;
  const questionX = 644;

  let cursorY = 40;
  const lanes = visibleGroups.map((group) => {
    const questionSpan = group.items.length * questionHeight + Math.max(0, group.items.length - 1) * questionGap;
    const laneHeight = Math.max(clusterHeight, questionSpan);
    const questions = group.items.map((item, index) => ({
      ...item,
      y: cursorY + index * (questionHeight + questionGap) + questionHeight / 2
    }));
    const clusterY = questions.length
      ? average(questions.map((item) => item.y))
      : cursorY + laneHeight / 2;

    const lane = {
      ...group,
      laneHeight,
      clusterY,
      questions
    };
    cursorY += laneHeight + laneGap;
    return lane;
  });

  const svgHeight = Math.max(cursorY - laneGap + 40, 320);
  const rootY = average(lanes.map((lane) => lane.clusterY)) || svgHeight / 2;
  const rootRight = rootX + rootWidth;
  const clusterLeft = clusterX;
  const clusterRight = clusterX + clusterWidth;
  const questionLeft = questionX;

  return `
    <div class="topic-map-stage">
      <svg class="topic-map-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="GEO 话题地图">
        <defs>
          <linearGradient id="topicRootFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(17,100,216,0.18)"></stop>
            <stop offset="100%" stop-color="rgba(17,100,216,0.04)"></stop>
          </linearGradient>
        </defs>
        ${lanes
          .map(
            (lane) => `
              <path
                class="topic-link ${activeCluster === lane.title ? "is-active" : ""}"
                d="M ${rootRight} ${rootY} C ${rootRight + 92} ${rootY}, ${clusterLeft - 82} ${lane.clusterY}, ${clusterLeft} ${lane.clusterY}"
              ></path>
              ${lane.questions
                .map(
                  (item) => `
                    <path
                      class="topic-link topic-link-secondary ${item.id === selectedKeywordId ? "is-active" : ""}"
                      d="M ${clusterRight} ${lane.clusterY} C ${clusterRight + 54} ${lane.clusterY}, ${questionLeft - 52} ${item.y}, ${questionLeft} ${item.y}"
                    ></path>
                  `
                )
                .join("")}
            `
          )
          .join("")}

        <g class="topic-node topic-node-root">
          <rect x="${rootX}" y="${rootY - rootHeight / 2}" width="${rootWidth}" height="${rootHeight}" rx="24"></rect>
          <text x="${rootX + 24}" y="${rootY - 6}" class="topic-node-title">${escapeHtml(rootLabel)}</text>
          <text x="${rootX + 24}" y="${rootY + 20}" class="topic-node-meta">核心主题根节点</text>
        </g>

        ${lanes
          .map(
            (lane) => `
              <g
                class="topic-node topic-node-cluster topic-node-${lane.accent} ${activeCluster === lane.title ? "is-active" : ""}"
                data-action="set-keyword-cluster"
                data-filter-value="${escapeHtml(lane.title)}"
              >
                <rect x="${clusterX}" y="${lane.clusterY - clusterHeight / 2}" width="${clusterWidth}" height="${clusterHeight}" rx="22"></rect>
                <text x="${clusterX + 20}" y="${lane.clusterY - 6}" class="topic-node-title">${escapeHtml(lane.title)}</text>
                <text x="${clusterX + 20}" y="${lane.clusterY + 20}" class="topic-node-meta">${escapeHtml(lane.items.length)} 个问题 · ${escapeHtml(lane.note)}</text>
              </g>
              ${lane.questions
                .map(
                  (item) => `
                    <g
                      class="topic-node topic-node-question ${item.id === selectedKeywordId ? "is-active" : ""}"
                      data-select-keyword="${escapeHtml(item.id)}"
                    >
                      <rect x="${questionX}" y="${item.y - questionHeight / 2}" width="${questionWidth}" height="${questionHeight}" rx="22"></rect>
                      <text x="${questionX + 18}" y="${item.y - 8}" class="topic-node-title">${escapeHtml(truncateLabel(item.keyword, 28))}</text>
                      <text x="${questionX + 18}" y="${item.y + 18}" class="topic-node-meta">${escapeHtml(questionFormText(questionFormLabel(item)))} · ${escapeHtml(item.recommended_content_type_label || item.recommended_content_type)}</text>
                    </g>
                  `
                )
                .join("")}
            `
          )
          .join("")}
      </svg>
    </div>
  `;
}

export function renderKeywords(store) {
  const tab = store.tabs.keywords;
  const filteredKeywords = filterKeywords(store.data.keywords, store.filters.keywords);
  const keyword = filteredKeywords.find((item) => item.id === store.selectedIds.keyword) || filteredKeywords[0];
  return `
    <section class="surface toolbar">
      <div class="subtabs">
        ${subtabMarkup(tab, "keywords", "问题库", "keywords")}
        ${subtabMarkup(tab, "opportunities", "意图簇", "keywords")}
        ${subtabMarkup(tab, "map", "话题地图", "keywords")}
        ${subtabMarkup(tab, "crawl", "抓取记录", "keywords")}
      </div>
      <div class="toolbar-row">
        <div class="toolbar-left">
          <input class="mini-search" data-keyword-search placeholder="搜索自然语言问题" value="${escapeHtml(store.filters.keywords.query)}" />
          <button class="filter-pill ${store.filters.keywords.form === "all" ? "active" : ""}" data-action="set-keyword-form" data-filter-value="all">全部问法</button>
          <button class="filter-pill ${store.filters.keywords.form === "what" ? "active" : ""}" data-action="set-keyword-form" data-filter-value="what">是什么</button>
          <button class="filter-pill ${store.filters.keywords.form === "how" ? "active" : ""}" data-action="set-keyword-form" data-filter-value="how">怎么做</button>
          <button class="filter-pill ${store.filters.keywords.form === "vs" ? "active" : ""}" data-action="set-keyword-form" data-filter-value="vs">怎么比</button>
          <button class="filter-pill ${store.filters.keywords.form === "which" ? "active" : ""}" data-action="set-keyword-form" data-filter-value="which">怎么选</button>
        </div>
        <div class="toolbar-right">
          <button class="ghost-btn" data-action="reset-keyword-filters">重置筛选</button>
          <button class="ghost-btn" data-action="export-artifact" data-export-type="keywords">导出</button>
          <button class="primary-btn" data-action="open-expand-panel">裂变问题</button>
        </div>
      </div>
      <div class="toolbar-row" style="margin-top: 12px">
        <div class="toolbar-left">
          <button class="filter-pill ${store.filters.keywords.cluster === "all" ? "active" : ""}" data-action="set-keyword-cluster" data-filter-value="all">全部意图簇</button>
          <button class="filter-pill ${store.filters.keywords.cluster === "购买决策" ? "active" : ""}" data-action="set-keyword-cluster" data-filter-value="购买决策">购买决策</button>
          <button class="filter-pill ${store.filters.keywords.cluster === "技术解释" ? "active" : ""}" data-action="set-keyword-cluster" data-filter-value="技术解释">技术解释</button>
          <button class="filter-pill ${store.filters.keywords.cluster === "对比选择" ? "active" : ""}" data-action="set-keyword-cluster" data-filter-value="对比选择">对比选择</button>
          <button class="filter-pill ${store.filters.keywords.cluster === "部署与风险" ? "active" : ""}" data-action="set-keyword-cluster" data-filter-value="部署与风险">部署与风险</button>
          <button class="filter-pill ${store.filters.keywords.cluster === "行业场景" ? "active" : ""}" data-action="set-keyword-cluster" data-filter-value="行业场景">行业场景</button>
        </div>
      </div>
    </section>
    ${tab === "keywords" ? renderKeywordList(filteredKeywords, keyword) : ""}
    ${tab === "opportunities" ? renderOpportunityList(filteredKeywords) : ""}
    ${tab === "map" ? renderTopicMap(filteredKeywords, store.filters.keywords, keyword) : ""}
    ${tab === "crawl" ? renderCrawlJobs(store) : ""}
  `;
}

function renderKeywordList(keywords, selectedKeyword) {
  if (!keywords.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有问题</h3>
        <p>可以重置筛选，或者用新的种子主题继续裂变问题。</p>
      </div>
    `;
  }
  return `
    <div class="layout-split">
      <section class="surface panel">
        <div class="actions-row" style="margin-bottom: 16px">
          <span class="filter-pill active">当前焦点：${escapeHtml(selectedKeyword?.keyword || "未选择")}</span>
          <button class="secondary-btn" data-action="keyword-status" data-keyword-action="select" data-keyword-id="${escapeHtml(selectedKeyword?.id || "")}" ${keywordActionDisabledAttr(selectedKeyword, "select")}>加入机会池</button>
          <button class="secondary-btn" data-action="keyword-status" data-keyword-action="rescore" data-keyword-id="${escapeHtml(selectedKeyword?.id || "")}" ${selectedKeyword ? "" : "disabled"}>重新打分</button>
          <button class="ghost-btn" data-action="keyword-status" data-keyword-action="ignore" data-keyword-id="${escapeHtml(selectedKeyword?.id || "")}" ${keywordActionDisabledAttr(selectedKeyword, "ignore")}>标记忽略</button>
          <button class="primary-btn" data-action="generate-topic" data-keyword-id="${escapeHtml(selectedKeyword?.id || "")}" ${selectedKeyword ? "" : "disabled"}>生成选题</button>
        </div>
        ${tableMarkup(
          ["问题", "问法", "意图簇", "来源", "GEO分", "模板匹配", "状态"],
          keywords.map(
            (item) => `
              <tr data-select-keyword="${item.id}">
                <td>
                  <div class="cell-title">${escapeHtml(item.keyword)}</div>
                  <div class="cell-sub">${escapeHtml(item.suggested_titles?.[0] || "")}</div>
                </td>
                <td><span class="filter-pill">${questionFormText(questionFormLabel(item))}</span></td>
                <td>${escapeHtml(clusterLabel(item))}</td>
                <td><div class="cell-title">${escapeHtml(item.source_label || item.source)}</div><div class="cell-sub">${escapeHtml(item.source_origin_name || "-")}</div></td>
                <td><span class="status-pill status-primary">${escapeHtml(item.priority_score)}</span></td>
                <td>${escapeHtml(item.recommended_content_type_label || item.recommended_content_type)}</td>
                <td>${statusMarkup(item.status_label || item.status)}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer">${keywordDrawer(selectedKeyword)}</aside>
    </div>
  `;
}

function renderOpportunityList(keywords) {
  const items = keywords.filter((item) => item.status === "selected");
  if (!items.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有高价值意图簇</h3>
        <p>可以切换问法或意图簇，或者先把新问题推进到机会池。</p>
      </div>
    `;
  }
  return `
    <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">高价值问题意图簇</h3>
            <div class="panel-note">把自然语言问题聚成购买决策、技术解释、对比选择等意图簇</div>
          </div>
          <button class="primary-btn" data-action="generate-topics-batch">批量生成 ${escapeHtml(items.length)} 个选题</button>
        </div>
        ${tableMarkup(
          ["问题", "意图簇", "GEO分", "内容可写性", "推荐模板", "推荐渠道", "操作"],
          items.map(
            (item) => `
            <tr>
              <td><div class="cell-title">${escapeHtml(item.keyword)}</div><div class="cell-sub">${escapeHtml(item.category_label || item.category)}</div></td>
              <td>${escapeHtml(clusterLabel(item))}</td>
              <td>${escapeHtml(item.priority_score)}</td>
              <td>${escapeHtml(item.geo_fit_score)}</td>
              <td>${escapeHtml(item.recommended_content_type_label || item.recommended_content_type)}</td>
              <td>${escapeHtml((item.recommended_channel_types || []).map((channel) => channelTypeLabel(channel)).join(" / "))}</td>
              <td><div class="actions-row"><button class="secondary-btn" data-nav="keywords" data-keywords-tab="keywords" data-keyword-id="${escapeHtml(item.id)}">查看问题</button><button class="secondary-btn" data-action="generate-topic" data-keyword-id="${escapeHtml(item.id)}">生成选题</button></div></td>
            </tr>
          `
          )
        )}
    </section>
  `;
}

function renderTopicMap(keywords, filters, selectedKeyword) {
  const groups = buildTopicGroups(keywords);
  const totalVisible = groups.reduce((sum, group) => sum + group.items.length, 0);
  const adoptedCount = keywords.filter((item) => item.status === "selected").length;
  const selectedCluster = filters.cluster === "all" ? selectedKeyword && clusterLabel(selectedKeyword) : filters.cluster;

  if (!totalVisible) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有话题地图节点</h3>
        <p>当前问法筛选为 ${escapeHtml(questionFormText(filters.form))}，意图簇筛选为 ${escapeHtml(filters.cluster === "all" ? "全部" : filters.cluster)}。</p>
      </div>
    `;
  }

  return `
    <div class="topic-map-layout">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">话题地图</h3>
            <div class="panel-note">从种子主题裂变自然语言问题，再按意图簇构建 GEO 问答网络。点击意图簇可直接筛选，点击问题节点可查看详情。</div>
          </div>
          <span class="status-pill status-primary">种子主题 → 意图簇 → 内容模板 / ${totalVisible} 个节点</span>
        </div>
        <div class="topic-map-summary">
          <span class="filter-pill active">核心主题：中国智能体</span>
          <span class="filter-pill">问法：${escapeHtml(questionFormText(filters.form === "all" ? "all" : filters.form))}</span>
          <span class="filter-pill">意图簇：${escapeHtml(filters.cluster === "all" ? "全部" : filters.cluster)}</span>
          <span class="filter-pill">机会池：${escapeHtml(adoptedCount)}</span>
        </div>
        ${renderTopicMapGraph(groups, selectedKeyword?.id, selectedCluster)}
        <div class="topic-map-legend">
          ${groups
            .map(
              (group) => `
                <button
                  class="topic-legend-item ${selectedCluster === group.title ? "active" : ""}"
                  data-action="set-keyword-cluster"
                  data-filter-value="${escapeHtml(group.title)}"
                >
                  <span>${escapeHtml(group.title)}</span>
                  <strong>${escapeHtml(group.items.length)}</strong>
                </button>
              `
            )
            .join("")}
        </div>
      </section>
      <aside class="stack">
        <section class="surface panel">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">布局建议</h3>
              <div class="panel-note">当前视图已经按 GEO 的自然语言问答结构切开。</div>
            </div>
          </div>
          <div class="stack">
            <div class="funnel-step">
              <div>
                <strong style="font-size:16px">核心主题</strong>
                <div class="cell-sub">先确定中国智能体里的核心产品语义和目标行业。</div>
              </div>
              <span class="status-pill">1 个</span>
            </div>
            <div class="funnel-step">
              <div>
                <strong style="font-size:16px">意图分层</strong>
                <div class="cell-sub">把问题拆成购买决策、技术解释、部署风险和场景案例。</div>
              </div>
              <span class="status-pill">${escapeHtml(groups.filter((group) => group.items.length).length)} 簇</span>
            </div>
            <div class="funnel-step">
              <div>
                <strong style="font-size:16px">内容模板</strong>
                <div class="cell-sub">优先把高分问题送进对比页、问答页、案例页模板。</div>
              </div>
              <button class="secondary-btn" data-action="generate-topic" data-keyword-id="${escapeHtml(selectedKeyword?.id || "")}" ${selectedKeyword ? "" : 'disabled title="请先选择问题节点"'}>匹配模板</button>
            </div>
          </div>
        </section>
        <section class="surface drawer">
          ${keywordDrawer(selectedKeyword)}
        </section>
      </aside>
    </div>
  `;
}

function renderSourceLibrary(store, sources) {
  const selected =
    sources.find((item) => item.id === store.selectedIds.mediaSource) ||
    sources[0] ||
    null;
  return `
    <div class="layout-split">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">内容源库</h3>
            <div class="panel-note">把自有自媒体、行业自媒体和权威媒体统一管理成可编排的问题来源。</div>
          </div>
          <button class="primary-btn" data-action="create-media-source">新增内容源</button>
        </div>
        ${tableMarkup(
          ["来源", "层级", "抽取方式", "频率", "相关度", "状态"],
          sources.map(
            (item) => `
              <tr data-select-media-source="${item.id}">
                <td><div class="cell-title">${escapeHtml(item.source_name)}</div><div class="cell-sub">${escapeHtml(item.platform_label || item.platform)}</div></td>
                <td>${escapeHtml(item.source_type_label || item.source_type)}</td>
                <td>${escapeHtml(item.extraction_mode_label || item.extraction_mode)}</td>
                <td>${escapeHtml(item.update_frequency_label || item.update_frequency)}</td>
                <td><span class="status-pill status-primary">${escapeHtml(item.relevance_score)}</span></td>
                <td>${statusMarkup(item.status_label || item.status)}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer" data-settings-panel="media-source">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.source_name)}</div>
                <div class="chip-row" style="margin-top:12px">
                  ${statusMarkup(selected.status_label || selected.status)}
                  <span class="status-pill">${escapeHtml(selected.platform_label || selected.platform)}</span>
                  <span class="status-pill">${escapeHtml(selected.source_type_label || selected.source_type)}</span>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field full">
                  <label>来源名称</label>
                  <input data-source-field="source_name" value="${escapeHtml(selected.source_name || "")}" />
                </div>
                <div class="form-field">
                  <label>来源层级</label>
                  <select data-source-field="source_type">
                    <option value="owned_self_media" ${selected.source_type === "owned_self_media" ? "selected" : ""}>自有自媒体</option>
                    <option value="industry_self_media" ${selected.source_type === "industry_self_media" ? "selected" : ""}>行业自媒体</option>
                    <option value="authority_media" ${selected.source_type === "authority_media" ? "selected" : ""}>权威媒体</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>所属平台</label>
                  <select data-source-field="platform">
                    <option value="wechat_official" ${selected.platform === "wechat_official" ? "selected" : ""}>微信公众号</option>
                    <option value="zhihu_column" ${selected.platform === "zhihu_column" ? "selected" : ""}>知乎专栏</option>
                    <option value="news_site" ${selected.platform === "news_site" ? "selected" : ""}>媒体站点</option>
                    <option value="website_blog" ${selected.platform === "website_blog" ? "selected" : ""}>官网博客</option>
                    <option value="xiaohongshu" ${selected.platform === "xiaohongshu" ? "selected" : ""}>小红书</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>权重层级</label>
                  <select data-source-field="authority_tier">
                    <option value="owned" ${selected.authority_tier === "owned" ? "selected" : ""}>自有资产</option>
                    <option value="kol" ${selected.authority_tier === "kol" ? "selected" : ""}>行业 KOL</option>
                    <option value="media" ${selected.authority_tier === "media" ? "selected" : ""}>行业媒体</option>
                    <option value="research_media" ${selected.authority_tier === "research_media" ? "selected" : ""}>研究型媒体</option>
                    <option value="developer_media" ${selected.authority_tier === "developer_media" ? "selected" : ""}>开发者媒体</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>抽取方式</label>
                  <select data-source-field="extraction_mode">
                    <option value="rss_like" ${selected.extraction_mode === "rss_like" ? "selected" : ""}>文章标题与摘要抽取</option>
                    <option value="question_thread" ${selected.extraction_mode === "question_thread" ? "selected" : ""}>问题与评论抽取</option>
                    <option value="headline_cluster" ${selected.extraction_mode === "headline_cluster" ? "selected" : ""}>标题聚类</option>
                    <option value="entity_tracking" ${selected.extraction_mode === "entity_tracking" ? "selected" : ""}>实体与趋势抽取</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>更新频率</label>
                  <select data-source-field="update_frequency">
                    <option value="hourly" ${selected.update_frequency === "hourly" ? "selected" : ""}>小时级</option>
                    <option value="daily" ${selected.update_frequency === "daily" ? "selected" : ""}>日更</option>
                    <option value="weekly" ${selected.update_frequency === "weekly" ? "selected" : ""}>周更</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>相关度分值</label>
                  <input type="number" min="0" max="100" data-source-field="relevance_score" value="${escapeHtml(selected.relevance_score || 0)}" />
                </div>
                <div class="form-field">
                  <label>状态</label>
                  <select data-source-field="status">
                    <option value="active" ${selected.status === "active" ? "selected" : ""}>正常</option>
                    <option value="disabled" ${selected.status === "disabled" ? "selected" : ""}>停用</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>样例主题</label>
                  <textarea data-source-field="sample_topics">${escapeHtml((selected.sample_topics || []).join("\n"))}</textarea>
                </div>
              </div>
              <div class="actions-row" style="margin-top:16px; justify-content:space-between">
                <span class="cell-sub">最近抓取：${escapeHtml(formatDateTime(selected.last_crawled_at))}</span>
                <button class="primary-btn" data-action="save-media-source">保存内容源</button>
              </div>
              <div class="drawer-section">
                <h4>适配器契约</h4>
                <div class="info-list">
                  <div class="info-row"><span>合同</span><strong>${escapeHtml(selected.adapter_contract_label || selected.extraction_mode_label || "-")}</strong></div>
                  <div class="info-row"><span>版本</span><strong>${escapeHtml(selected.adapter_contract_version || "-")}</strong></div>
                  <div class="info-row"><span>阶段</span><strong style="max-width:62%; text-align:right">${escapeHtml((selected.adapter_stages || []).join(", ") || "-")}</strong></div>
                  <div class="info-row"><span>错误分类</span><strong style="max-width:62%; text-align:right">${escapeHtml((selected.error_codes || []).slice(0, 4).join(", ") || "-")}</strong></div>
                </div>
                <div class="cell-sub" style="margin-top:12px">${escapeHtml(selected.privacy_boundary || "仅处理公开来源字段。")}</div>
              </div>
            `
            : ""
        }
      </aside>
    </div>
  `;
}

function renderAutomationStrategies(strategies) {
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">自动运营飞轮</h3>
          <div class="panel-note">来源监控不是终点，后面要接选题、写作模板和多渠道分发。</div>
        </div>
      </div>
      <div class="stack">
        ${strategies
          .map(
            (item) => `
              <div class="funnel-step">
                <div>
                  <strong style="font-size:16px">${escapeHtml(item.name)}</strong>
                  <div class="cell-sub">${escapeHtml(item.orchestration_note)}</div>
                  <div class="chip-row" style="margin-top:10px">
                    <span class="filter-pill">${escapeHtml(item.source_scope_label)}</span>
                    <span class="filter-pill">${escapeHtml(item.monitoring_goal_label)}</span>
                    <span class="filter-pill">${escapeHtml(item.cadence_label)}</span>
                  </div>
                  <div class="actions-row" style="margin-top:12px">
                    <button class="secondary-btn" data-action="run-source-strategy" data-strategy-id="${escapeHtml(item.id)}">立即运行</button>
                  </div>
                </div>
                <span class="status-pill">${escapeHtml((item.distribution_channels || []).length)} 渠道</span>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAutomationRuns(runs) {
  if (!runs.length) {
    return `
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">自动运营执行记录</h3>
            <div class="panel-note">策略运行后会在这里沉淀问题、选题和草稿产出结果。</div>
          </div>
        </div>
        <div class="empty-state" style="padding:28px">
          <h3>还没有自动运营执行记录</h3>
          <p>可以先运行一条来源策略，生成问题、选题和文章草稿。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">自动运营执行记录</h3>
          <div class="panel-note">把来源策略执行结果沉淀成可复盘的运行记录。</div>
        </div>
      </div>
      ${tableMarkup(
        ["策略", "来源范围", "主题", "问题数", "选题数", "草稿数", "状态", "操作"],
        runs.map(
          (item) => `
            <tr data-select-automation-run="${item.id}">
              <td><div class="cell-title">${escapeHtml(item.strategy_name)}</div><div class="cell-sub">${escapeHtml((item.created_at || "").replace("T", " ").slice(5, 16))}</div></td>
              <td>${escapeHtml(item.source_scope_label || item.source_scope)}</td>
              <td>${escapeHtml(item.industry_topic || "-")}</td>
              <td>${escapeHtml(item.generated_question_count || 0)}</td>
              <td>${escapeHtml(item.generated_topic_count || 0)}</td>
              <td>${escapeHtml(item.generated_article_count || 0)}</td>
              <td><div class="cell-title">${statusMarkup(item.status_label || item.status)}</div><div class="cell-sub">告警 ${escapeHtml(item.warn_count || 0)} / 错误 ${escapeHtml(item.error_count || 0)}</div></td>
              <td>
                ${
                  item.status === "failed" || item.status === "partial_failed"
                    ? `<button class="secondary-btn" data-action="retry-automation-run" data-run-id="${escapeHtml(item.id)}">重试</button>`
                    : `<button class="ghost-btn" data-nav="settings" data-settings-tab="automation" data-strategy-id="${escapeHtml(item.strategy_id)}" data-run-id="${escapeHtml(item.id)}">查看策略</button>`
                }
              </td>
            </tr>
          `
        )
      )}
    </section>
  `;
}

function renderAutomationRunDetail(run) {
  if (!run) {
    return `
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">执行详情</h3>
            <div class="panel-note">选择一条自动运营执行记录，查看问题抓取、审核和分发链路。</div>
          </div>
        </div>
        <div class="empty-state" style="padding:28px">
          <h3>还没有选中执行记录</h3>
          <p>可以点击上方执行记录，查看完整日志和执行结果。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">执行详情</h3>
          <div class="panel-note">复盘这一轮自动运营的产出、守门结果和分发动作。</div>
        </div>
        <div class="chip-row">
          ${statusMarkup(run.status_label || run.status)}
          <span class="status-pill">${escapeHtml(run.strategy_name)}</span>
          <span class="status-pill">${escapeHtml(run.source_scope_label || run.source_scope || "-")}</span>
        </div>
      </div>
      <div class="grid-two">
        <div class="surface" style="padding:18px; border:1px solid rgba(12,26,75,0.08)">
          <div class="info-list">
            <div class="info-row"><span>执行时间</span><strong>${escapeHtml(formatDateTime(run.created_at))}</strong></div>
            <div class="info-row"><span>行业主题</span><strong>${escapeHtml(run.industry_topic || "-")}</strong></div>
            <div class="info-row"><span>抓取任务</span><strong>${escapeHtml(run.crawl_job_id || "-")}</strong></div>
            <div class="info-row"><span>新增问题</span><strong>${escapeHtml(run.generated_question_count || 0)}</strong></div>
            <div class="info-row"><span>生成选题</span><strong>${escapeHtml(run.generated_topic_count || 0)}</strong></div>
            <div class="info-row"><span>生成草稿</span><strong>${escapeHtml(run.generated_article_count || 0)}</strong></div>
            <div class="info-row"><span>自动通过</span><strong>${escapeHtml(run.auto_passed_count || 0)}</strong></div>
            <div class="info-row"><span>待人工审核</span><strong>${escapeHtml(run.review_pending_count || 0)}</strong></div>
            <div class="info-row"><span>发布任务</span><strong>${escapeHtml(run.created_publish_task_id || "-")}</strong></div>
          </div>
        </div>
        <div class="surface" style="padding:18px; border:1px solid rgba(12,26,75,0.08)">
          <h4 style="margin:0 0 14px">执行日志</h4>
          <div class="stack">
            ${
              (run.event_logs || []).length
                ? run.event_logs.map(
                    (log) => `
                      <div class="funnel-step">
                        <div>
                          <strong style="font-size:15px">${escapeHtml(log.step || "-")} / ${escapeHtml(eventLevelLabel(log.level))}</strong>
                          <div class="cell-sub">${escapeHtml(log.message || "-")}</div>
                          <div class="cell-sub">${escapeHtml(formatDateTime(log.created_at))}</div>
                        </div>
                        ${
                          log.level === "error"
                            ? statusMarkup("失败")
                            : log.level === "warn"
                              ? statusMarkup("部分失败")
                              : statusMarkup("已完成")
                        }
                      </div>
                    `
                  ).join("")
                : `<div class="cell-sub">当前记录还没有事件日志。</div>`
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCrawlJobs(store) {
  const jobs = store.data.keywordJobs || [];
  const sources = (store.data.mediaSources || []).slice(0, 5);
  const strategies = (store.data.sourceStrategies || []).slice(0, 4);
  const allRuns = store.data.automationRuns || [];
  const runs = allRuns.slice(0, 6);
  const selectedRun = allRuns.find((item) => item.id === store.selectedIds.automationRun) || runs[0] || null;
  return `
    <div class="grid-two">
      ${renderSourceLibrary(store, sources)}
      ${renderAutomationStrategies(strategies)}
    </div>
    ${renderAutomationRuns(runs)}
    ${renderAutomationRunDetail(selectedRun)}
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">抓取记录</h3>
          <div class="panel-note">记录问题源、裂变范围、自动运营目标和结果，可作为自媒体选题中控台。</div>
        </div>
        <button class="primary-btn" data-action="open-job-panel">新建问题抓取任务</button>
      </div>
      ${tableMarkup(
        ["任务名称", "来源范围", "适配器契约", "主题", "新增问题", "去重后", "质量分", "错误分类", "状态"],
        jobs.map(
          (job) => `
            <tr>
              <td><div class="cell-title">${escapeHtml(job.name)}</div><div class="cell-sub">${escapeHtml((job.source_targets || []).join(" / ") || (job.source_ids || []).join(" / ") || "-")}</div></td>
              <td>${escapeHtml(job.source_scope_label || job.source_type_label || job.source_type)}</td>
              <td><div class="cell-title">${escapeHtml(job.source_adapter_label || "-")}</div><div class="cell-sub">${escapeHtml(job.source_adapter_version || "-")} / ${escapeHtml(job.monitoring_goal_label || "-")}</div></td>
              <td>${escapeHtml(job.industry_topic || (job.seed_keywords || []).join(" / "))}</td>
              <td>${escapeHtml(job.raw_count)}</td>
              <td>${escapeHtml(job.deduped_count)}</td>
              <td><span class="status-pill status-primary">${escapeHtml(job.quality_summary?.average_quality_score ?? "-")}</span></td>
              <td><div class="cell-sub">${escapeHtml((job.error_taxonomy || []).slice(0, 2).map((item) => item.code || item).join(", ") || "-")}</div></td>
              <td>${statusMarkup(job.status_label || job.status)}</td>
            </tr>
          `
        )
      )}
    </section>
  `;
}
