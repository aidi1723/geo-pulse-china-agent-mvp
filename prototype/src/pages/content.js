import {
  channelTypeLabel,
  escapeHtml,
  generationModeLabel,
  statusMarkup,
  subtabMarkup,
  tableMarkup,
  templateTypeLabel
} from "../utils.js";

function topicKeyword(store, topic) {
  return store.data.keywords.find((item) => item.id === topic.keyword_id)?.keyword || topic.keyword_id;
}

function articleKeyword(store, article) {
  return store.data.keywords.find((item) => item.id === article.keyword_id)?.keyword || "";
}

function matchesContentQuery(haystacks, query) {
  if (!query) return true;
  return haystacks.some((item) => String(item || "").toLowerCase().includes(query));
}

function matchesContentStatus(tab, item, status) {
  if (status === "all") return true;
  if (tab === "topics") {
    return item.status === status;
  }
  if (tab === "articles") {
    return item.review_status === status || item.publish_status === status;
  }
  if (tab === "reviews") {
    return item.review_status === status;
  }
  return true;
}

function statusOptions(tab) {
  if (tab === "topics") {
    return [
      ["all", "全部状态"],
      ["draft", "草稿选题"],
      ["generated", "已生成草稿"]
    ];
  }
  if (tab === "reviews") {
    return [
      ["all", "全部待审"],
      ["review_pending", "待审核"],
      ["review_rejected", "已驳回"]
    ];
  }
  return [
    ["all", "全部状态"],
    ["draft", "草稿"],
    ["review_pending", "待审核"],
    ["ready_to_publish", "待发布"],
    ["published", "已发布"]
  ];
}

function filterTopics(store) {
  const query = (store.filters.content.query || "").trim().toLowerCase();
  const status = store.filters.content.status || "all";
  return store.data.topics.filter((item) => {
    return (
      matchesContentQuery(
        [
          item.title,
          topicKeyword(store, item),
          item.content_type_label || item.content_type,
          item.template_type_label || item.template_type
        ],
        query
      ) && matchesContentStatus("topics", item, status)
    );
  });
}

function filterArticles(store) {
  const query = (store.filters.content.query || "").trim().toLowerCase();
  const status = store.filters.content.status || "all";
  return store.data.articles.filter((item) => {
    return (
      matchesContentQuery(
        [
          item.title,
          item.subtitle,
          articleKeyword(store, item),
          item.article_type_label || item.article_type,
          item.review_status_label || item.review_status,
          item.publish_status_label || item.publish_status
        ],
        query
      ) && matchesContentStatus("articles", item, status)
    );
  });
}

function filterReviews(store) {
  const query = (store.filters.content.query || "").trim().toLowerCase();
  const status = store.filters.content.status || "all";
  return store.data.articles.filter((item) => {
    if (!matchesContentStatus("reviews", item, status === "all" ? "review_pending" : status)) {
      return false;
    }
    return matchesContentQuery(
      [
        item.title,
        item.excerpt,
        item.article_type_label || item.article_type,
        articleKeyword(store, item)
      ],
      query
    );
  });
}

export function renderContent(store) {
  const tab = store.tabs.content;
  const options = statusOptions(tab);
  return `
    <section class="surface toolbar">
      <div class="subtabs">
        ${subtabMarkup(tab, "topics", "选题库", "content")}
        ${subtabMarkup(tab, "articles", "文章库", "content")}
        ${subtabMarkup(tab, "reviews", "审核队列", "content")}
        ${subtabMarkup(tab, "templates", "模板库", "content")}
      </div>
      <div class="toolbar-row">
        <div class="toolbar-left">
          <input class="mini-search" data-content-search placeholder="搜索选题、文章或待审核内容" value="${escapeHtml(store.filters.content.query)}" />
          ${options
            .map(
              ([value, label]) =>
                `<button class="filter-pill ${store.filters.content.status === value ? "active" : ""}" data-action="set-content-status" data-filter-value="${value}">${escapeHtml(label)}</button>`
            )
            .join("")}
        </div>
        <div class="toolbar-right">
          <button class="ghost-btn" data-action="reset-content-filters">重置筛选</button>
          <button class="ghost-btn" disabled title="导出能力即将开放">导出</button>
          <button class="primary-btn" disabled title="新建能力即将开放">${tab === "articles" ? "新建内容" : "新建选题"}</button>
        </div>
      </div>
    </section>
    ${tab === "topics" ? renderTopics(store, filterTopics(store)) : ""}
    ${tab === "articles" ? renderArticles(store, filterArticles(store)) : ""}
    ${tab === "reviews" ? renderReviews(store, filterReviews(store)) : ""}
    ${tab === "templates" ? renderTemplates(store.data.templates) : ""}
  `;
}

function renderTopics(store, topics) {
  const selected = topics.find((item) => item.id === store.selectedIds.topic) || topics[0];
  if (!topics.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有选题</h3>
        <p>可以重置筛选，或者先从问题库继续生成新的选题。</p>
      </div>
    `;
  }

  return `
    <div class="layout-split">
      <section class="surface panel">
        ${tableMarkup(
          ["选题", "来源关键词", "模板", "优先级", "品牌适配", "状态"],
          topics.map(
            (item) => `
              <tr data-select-topic="${item.id}">
                <td><div class="cell-title">${escapeHtml(item.title)}</div><div class="cell-sub">${escapeHtml(item.content_type_label || item.content_type)}</div></td>
                <td>${escapeHtml(topicKeyword(store, item))}</td>
                <td>${escapeHtml(item.template_type_label || item.template_type)}</td>
                <td>P${escapeHtml(item.priority)}</td>
                <td>${escapeHtml(item.brand_fit_label || item.brand_fit)}</td>
                <td>${statusMarkup(item.status_label || item.status)}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.title)}</div>
                <div class="cell-sub">${escapeHtml(topicKeyword(store, selected))}</div>
              </div>
              <div class="drawer-section">
                <h4>核心卖点</h4>
                <div class="stack">${(selected.core_messages || []).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>
              </div>
              <div class="drawer-section">
                <h4>必带术语</h4>
                <div class="stack">${(selected.required_terms || []).map((item) => `<span class="filter-pill">${escapeHtml(item)}</span>`).join("")}</div>
              </div>
              <div class="drawer-section">
                <div class="actions-row">
                  <button class="secondary-btn" disabled title="选题编辑即将开放">编辑选题</button>
                  <button class="secondary-btn" disabled title="自动大纲即将开放">生成大纲</button>
                  <button class="primary-btn" data-action="generate-article" data-topic-id="${escapeHtml(selected.id)}">生成草稿</button>
                </div>
              </div>
            `
            : ""
        }
      </aside>
    </div>
  `;
}

function renderArticles(store, articles) {
  const selected = articles.find((item) => item.id === store.selectedIds.article) || articles[0];
  const detail = selected ? store.data.articleDetails[selected.id] || selected : null;
  const canSubmitReview =
    selected &&
    selected.review_status !== "review_pending" &&
    selected.publish_status !== "ready_to_publish" &&
    selected.publish_status !== "published";
  const canOpenPublish = selected?.publish_status === "ready_to_publish";
  if (!articles.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有文章</h3>
        <p>可以切换状态，或者先从选题库生成新的文章草稿。</p>
      </div>
    `;
  }

  return `
    <section class="surface panel">
      <div class="chip-row" style="margin-bottom: 18px">
        ${articles
          .map(
            (item) => `
              <button class="chip ${item.id === selected?.id ? "active" : ""}" data-select-article="${item.id}">
                ${escapeHtml(item.title)}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="editor-layout">
        <div class="surface editor-area" style="background:rgba(255,255,255,0.76)">
          <div class="actions-row" style="justify-content: space-between; margin-bottom: 18px">
            <div>
              <div class="cell-title" style="font-size: 28px">${escapeHtml(detail?.title || selected.title)}</div>
              <div class="cell-sub">${escapeHtml(articleKeyword(store, selected))} / ${escapeHtml(selected.article_type_label || selected.article_type)}</div>
            </div>
            <div class="actions-row">
              <button class="ghost-btn" data-action="save-article" data-article-id="${escapeHtml(selected.id)}">保存</button>
              <button class="secondary-btn" data-action="submit-review" data-article-id="${escapeHtml(selected.id)}" ${canSubmitReview ? "" : 'disabled title="当前状态无需重复提交审核"'}>提交审核</button>
              <button class="primary-btn" data-action="open-publish-panel" data-article-id="${escapeHtml(selected.id)}" ${canOpenPublish ? "" : 'disabled title="审核通过并进入待发布后才可创建发布任务"'}>去发布</button>
            </div>
          </div>
          <div class="cell-sub" style="margin-bottom: 16px">
            ${
              canOpenPublish
                ? "当前文章已进入待发布状态，可以直接创建发布任务。"
                : "当前文章还不能直接发布。先保存并提交审核，审核通过后再进入分发。"
            }
          </div>
          <div class="editor-block">
            <h4>基础信息</h4>
            <div class="inline-grid">
              <input value="${escapeHtml(detail?.title || selected.title)}" data-article-field="title" />
              <input value="${escapeHtml((selected.target_channel_types || []).map((item) => channelTypeLabel(item)).join(" / "))}" />
            </div>
          </div>
          <div class="editor-block">
            <h4>文章大纲</h4>
            <div class="stack">${((detail?.outline_json || selected.outline_json) || []).map((item) => `<span class="filter-pill">${escapeHtml(item)}</span>`).join("")}</div>
          </div>
          <div class="editor-block">
            <h4>正文编辑区</h4>
            <textarea data-article-field="content_markdown">${escapeHtml(detail?.content_markdown || selected.content_markdown)}</textarea>
          </div>
          <div class="editor-block">
            <h4>问答区块</h4>
            <textarea>1. 企业智能体平台适合哪些团队？\n2. 和普通工作流工具有什么区别？\n3. 是否支持私有化部署？</textarea>
          </div>
          <div class="editor-block">
            <h4>行动引导区块</h4>
            <textarea>${escapeHtml(store.data.brandProfile?.default_cta || "预约智能体内容增长方案")}</textarea>
          </div>
        </div>
        <aside class="stack">
          <section class="surface panel">
            <div class="panel-head"><h3 class="panel-title">品牌知识</h3></div>
            <div class="stack">${(store.data.brandProfile?.core_value_props || []).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>
          </section>
          <section class="surface panel">
            <div class="panel-head"><h3 class="panel-title">审核记录</h3></div>
            <div class="notice">该文章当前状态：${escapeHtml(detail?.review_status_label || selected.review_status_label || selected.review_status)}</div>
          </section>
          <section class="surface panel">
            <div class="panel-head"><h3 class="panel-title">发布信息</h3></div>
            <div class="stack">
              <span class="filter-pill">SEO 标题：${escapeHtml(detail?.seo_title || selected.seo_title || "-")}</span>
              <span class="filter-pill">摘要已生成</span>
              <span class="filter-pill">目标渠道：${escapeHtml((selected.target_channel_types || []).map((item) => channelTypeLabel(item)).join(" / "))}</span>
            </div>
          </section>
          <section class="surface panel">
            <div class="panel-head">
              <h3 class="panel-title">版本记录</h3>
              <button class="secondary-btn" data-action="load-versions" data-article-id="${escapeHtml(selected.id)}">查看版本</button>
            </div>
            <div class="stack">
              ${((detail?.versions || []).length
                ? detail.versions
                    .map(
                      (item) => `
                        <div class="funnel-step">
                          <div>
                            <strong style="font-size:15px">v${escapeHtml(item.version_no)}</strong>
                            <div class="cell-sub">${escapeHtml(generationModeLabel(item.generation_mode || "manual"))}</div>
                          </div>
                          <span class="status-pill">${escapeHtml((item.created_at || "").replace("T", " ").slice(5, 16))}</span>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="cell-sub">点击“查看版本”加载文章版本历史。</div>`)}
            </div>
          </section>
        </aside>
      </div>
    </section>
  `;
}

function renderReviews(store, pending) {
  const selected = pending.find((item) => item.id === store.selectedIds.review) || pending[0];
  if (!pending.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有待审核文章</h3>
        <p>可以切换状态，或者先把草稿提交到审核队列。</p>
      </div>
    `;
  }

  return `
    <div class="layout-split">
      <section class="surface panel">
        ${tableMarkup(
          ["标题", "创建时间", "优先级", "类型", "状态"],
          pending.map(
            (item) => `
              <tr data-select-review="${item.id}">
                <td>${escapeHtml(item.title)}</td>
                <td>${escapeHtml((item.updated_at || "").replace("T", " ").slice(5, 16))}</td>
                <td>P1</td>
                <td>${escapeHtml(item.article_type_label || item.article_type)}</td>
                <td>${statusMarkup(item.review_status_label || item.review_status)}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:20px">${escapeHtml(selected.title)}</div>
                <div class="cell-sub">审核目标：检查结构、术语和品牌表达是否准确</div>
              </div>
              <div class="drawer-section">
                <h4>摘要预览</h4>
                <p style="margin:0; line-height:1.75; color:#304055">${escapeHtml(selected.excerpt || "")}</p>
              </div>
              <div class="drawer-section">
                <h4>审核意见</h4>
                <textarea data-review-comments="${escapeHtml(selected.id)}" style="width:100%; min-height:120px; padding:12px 14px; border-radius:12px; border:1px solid rgba(20,37,63,0.1)">CRM 不是被替代关系，这部分表达可以再明确一点；保留问答结构。</textarea>
              </div>
              <div class="drawer-section">
                <div class="actions-row">
                  <button class="danger-btn" data-action="review-article" data-review-action="reject" data-article-id="${escapeHtml(selected.id)}">驳回修改</button>
                  <button class="secondary-btn" disabled title="复审流转即将开放">指派复审</button>
                  <button class="primary-btn" data-action="review-article" data-review-action="pass" data-article-id="${escapeHtml(selected.id)}">审核通过</button>
                </div>
              </div>
            `
            : ""
        }
      </aside>
    </div>
  `;
}

function renderTemplates(templates) {
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">模板库</h3>
          <div class="panel-note">第一期只保留四种固定模板</div>
        </div>
        <button class="primary-btn" disabled title="模板管理即将开放">新增模板</button>
      </div>
      ${tableMarkup(
        ["模板名称", "模板类型", "适用分类", "状态"],
        templates.map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.name)}</td>
              <td>${escapeHtml(templateTypeLabel(item.template_type))}</td>
              <td>${escapeHtml((item.applicable_categories || []).map((category) => templateTypeLabel(category)).join(" / "))}</td>
              <td>${statusMarkup(item.is_enabled ? "启用中" : "停用")}</td>
            </tr>
          `
        )
      )}
    </section>
  `;
}
