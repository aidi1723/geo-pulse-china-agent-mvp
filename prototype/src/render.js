import { errorMarkup, loadingMarkup, sidebarMarkup, topbarMarkup } from "./components.js";
import { renderDashboard } from "./pages/dashboard.js?v=20260418-3";
import { renderKeywords } from "./pages/keywords.js?v=20260418-3";
import { renderContent } from "./pages/content.js?v=20260418-3";
import { renderDistribution } from "./pages/distribution.js?v=20260418-3";
import { renderAnalytics } from "./pages/analytics.js?v=20260418-3";
import { renderInternationalGeo } from "./pages/international.js?v=20260418-3";
import { renderBilling } from "./pages/billing.js?v=20260418-3";
import { renderSettings } from "./pages/settings.js?v=20260418-3";
import { escapeHtml } from "./utils.js";

export function renderApp(root, store) {
  const isStaticPreview =
    typeof window !== "undefined" && window.location?.protocol === "file:";
  if (!isStaticPreview && !store.session?.current?.authenticated) {
    root.innerHTML = renderLogin(store);
    return;
  }

  const environmentNotice = isStaticPreview
    ? "当前为静态预览模式，已加载本地只读演示数据。若需保存或执行动作，请通过 http://localhost:3000/ 打开。"
    : "当前为本地演示环境，前后端已接入本地接口服务。";

  root.innerHTML = `
    <div class="app-shell">
      ${sidebarMarkup(store.page, store.session?.current)}
      <main class="content-shell">
        <div class="mobile-top">
          <div class="notice">${environmentNotice}</div>
        </div>
        ${store.ui.notice ? `<div class="notice" style="margin-bottom: 14px">${store.ui.notice}</div>` : ""}
        ${topbarMarkup(store.page, store.search)}
        <section class="page-body">
          ${renderPage(store)}
        </section>
      </main>
      ${renderPanel(store)}
    </div>
  `;
}

function renderLogin(store) {
  return `
    <main class="login-shell">
      <section class="surface panel login-panel">
        <div class="panel-head">
          <div>
            <h1 class="page-title">登录 GEO Pulse</h1>
            <div class="panel-note">使用团队账号进入 GEO 运营工作台。</div>
          </div>
        </div>
        ${store.ui.error ? `<div class="notice" style="margin-top:14px">${escapeHtml(store.ui.error)}</div>` : ""}
        <div class="form-grid" style="margin-top:18px">
          <div class="form-field full">
            <label>用户名</label>
            <input data-login-field="username" value="${escapeHtml(store.session?.loginForm?.username || "")}" />
          </div>
          <div class="form-field full">
            <label>密码</label>
            <input type="password" data-login-field="password" value="${escapeHtml(store.session?.loginForm?.password || "")}" />
          </div>
        </div>
        <div class="actions-row" style="margin-top:18px">
          <button class="primary-btn" data-action="login-session">登录</button>
        </div>
      </section>
    </main>
  `;
}

function renderPage(store) {
  if (store.ui.loading) {
    return loadingMarkup();
  }
  if (store.ui.error) {
    return errorMarkup(store.ui.error);
  }

  switch (store.page) {
    case "dashboard":
      return renderDashboard(store.data);
    case "keywords":
      return renderKeywords(store);
    case "content":
      return renderContent(store);
    case "distribution":
      return renderDistribution(store);
    case "analytics":
      return renderAnalytics(store);
    case "international":
      return renderInternationalGeo(store.data.internationalGeo);
    case "billing":
      return renderBilling(store.data);
    case "settings":
      return renderSettings(store);
    default:
      return loadingMarkup();
  }
}

function renderPanel(store) {
  if (!store.ui.panel) {
    return "";
  }

  if (store.page === "keywords") {
    const form =
      store.ui.panel === "expand"
        ? store.forms.keywordExpansion
        : store.forms.keywordJob;

    return `
      <aside class="surface app-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${store.ui.panel === "expand" ? "问题裂变配置" : "问题抓取任务配置"}</h3>
            <div class="panel-note">${store.ui.panel === "expand" ? "根据种子主题自动裂变自然语言问题" : "创建一个带来源类型和种子问题的抓取任务"}</div>
          </div>
          <button class="ghost-btn" data-action="close-panel">关闭</button>
        </div>
        <div class="form-grid" style="margin-top: 14px">
          <div class="form-field">
            <label>任务名称</label>
            <input data-form="${store.ui.panel}" data-field="name" value="${form.name}" />
          </div>
          <div class="form-field">
            <label>来源类型</label>
            <select data-form="${store.ui.panel}" data-field="source_type">
              <option value="suggestion" ${form.source_type === "suggestion" ? "selected" : ""}>搜索联想</option>
              <option value="mixed_media" ${form.source_type === "mixed_media" ? "selected" : ""}>混合媒体监控</option>
              <option value="owned_self_media" ${form.source_type === "owned_self_media" ? "selected" : ""}>自有自媒体</option>
              <option value="industry_self_media" ${form.source_type === "industry_self_media" ? "selected" : ""}>行业自媒体</option>
              <option value="authority_media" ${form.source_type === "authority_media" ? "selected" : ""}>权威媒体</option>
              <option value="qa_hot" ${form.source_type === "qa_hot" ? "selected" : ""}>问答热词</option>
              <option value="related_search" ${form.source_type === "related_search" ? "selected" : ""}>相关搜索</option>
              <option value="manual_import" ${form.source_type === "manual_import" ? "selected" : ""}>手动导入</option>
            </select>
          </div>
          ${
            store.ui.panel === "job"
              ? `
                <div class="form-field">
                  <label>来源范围</label>
                  <select data-form="job" data-field="source_scope">
                    <option value="mixed_media" ${form.source_scope === "mixed_media" ? "selected" : ""}>混合来源</option>
                    <option value="owned_self_media" ${form.source_scope === "owned_self_media" ? "selected" : ""}>自有自媒体</option>
                    <option value="industry_self_media" ${form.source_scope === "industry_self_media" ? "selected" : ""}>行业自媒体</option>
                    <option value="authority_media" ${form.source_scope === "authority_media" ? "selected" : ""}>权威媒体</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>运营目标</label>
                  <select data-form="job" data-field="monitoring_goal">
                    <option value="full_funnel" ${form.monitoring_goal === "full_funnel" ? "selected" : ""}>全链路自动运营</option>
                    <option value="repurpose" ${form.monitoring_goal === "repurpose" ? "selected" : ""}>内容复用</option>
                    <option value="hotspot_follow" ${form.monitoring_goal === "hotspot_follow" ? "selected" : ""}>热点跟进</option>
                    <option value="authority_follow" ${form.monitoring_goal === "authority_follow" ? "selected" : ""}>议题跟踪</option>
                  </select>
                </div>
              `
              : ""
          }
          <div class="form-field full">
            <label>行业主题</label>
            <input data-form="${store.ui.panel}" data-field="industry_topic" value="${form.industry_topic}" />
          </div>
          <div class="form-field full">
            <label>种子关键词</label>
            <textarea data-form="${store.ui.panel}" data-field="seed_keywords">${form.seed_keywords}</textarea>
          </div>
          ${
            store.ui.panel === "job"
              ? `
                <div class="form-field full">
                  <label>重点监控媒体 / 账号</label>
                  <textarea data-form="job" data-field="source_targets">${form.source_targets || ""}</textarea>
                </div>
              `
              : ""
          }
          <div class="form-field">
            <label>抓取 / 裂变上限</label>
            <input type="number" min="1" max="100" data-form="${store.ui.panel}" data-field="fetch_limit" value="${form.fetch_limit}" />
          </div>
          <div class="form-field">
            <label>自动去重</label>
            <select data-form="${store.ui.panel}" data-field="dedupe_enabled">
              <option value="true" ${form.dedupe_enabled ? "selected" : ""}>开启</option>
              <option value="false" ${!form.dedupe_enabled ? "selected" : ""}>关闭</option>
            </select>
          </div>
        </div>
        <div class="actions-row" style="margin-top: 18px">
          <button class="secondary-btn" data-action="submit-panel">${store.ui.panel === "expand" ? "开始裂变问题" : "创建抓取任务"}</button>
        </div>
      </aside>
    `;
  }

  if (store.page === "distribution" && store.ui.panel === "publish") {
    const form = store.forms.publishTask;
    const selectedArticleIds = new Set(form.article_ids || []);
    const publishableArticles = store.data.articles.filter((item) => item.publish_status === "ready_to_publish");
    return `
      <aside class="surface app-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">创建发布任务</h3>
            <div class="panel-note">选择渠道、发布时间和待分发文章，把内容中心里的文章推进到发布队列。</div>
          </div>
          <button class="ghost-btn" data-action="close-panel">关闭</button>
        </div>
        <div class="form-grid" style="margin-top: 14px">
          <div class="form-field full">
            <label>任务名称</label>
            <input data-form="publish" data-field="name" value="${form.name}" />
          </div>
          <div class="form-field">
            <label>发布渠道</label>
            <select data-form="publish" data-field="channel_id">
              ${store.data.channels
                .map(
                  (item) => `<option value="${item.id}" ${form.channel_id === item.id ? "selected" : ""}>${item.channel_name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="form-field">
            <label>发布方式</label>
            <select data-form="publish" data-field="publish_mode">
              <option value="scheduled" ${form.publish_mode === "scheduled" ? "selected" : ""}>定时发布</option>
              <option value="immediate" ${form.publish_mode === "immediate" ? "selected" : ""}>立即发布</option>
            </select>
          </div>
          <div class="form-field">
            <label>计划时间</label>
            <input type="datetime-local" data-form="publish" data-field="scheduled_at" value="${form.scheduled_at}" />
          </div>
          <div class="form-field">
            <label>失败自动重试</label>
            <select data-form="publish" data-field="auto_retry_failed">
              <option value="false" ${!form.auto_retry_failed ? "selected" : ""}>关闭</option>
              <option value="true" ${form.auto_retry_failed ? "selected" : ""}>开启</option>
            </select>
          </div>
          <div class="form-field full">
            <label>待发布文章</label>
            ${
              publishableArticles.length
                ? `<div class="select-list">
              ${publishableArticles
                .map(
                  (item) => `
                    <label class="select-card ${selectedArticleIds.has(item.id) ? "active" : ""}" data-action="toggle-publish-article" data-article-id="${item.id}">
                      <input
                        type="checkbox"
                        ${selectedArticleIds.has(item.id) ? "checked" : ""}
                      />
                      <div>
                        <div class="cell-title">${item.title}</div>
                        <div class="cell-sub">${item.review_status_label || item.review_status} / ${item.publish_status_label || item.publish_status}</div>
                      </div>
                    </label>
                  `
                )
                .join("")}
            </div>`
                : `<div class="empty-state" style="padding: 22px">
                    <h3 style="font-size:18px; margin-bottom:8px">暂无可发布文章</h3>
                    <p>只有“待发布”状态的文章才会进入分发任务。先在内容中心完成审核。</p>
                  </div>`
            }
          </div>
        </div>
        <div class="actions-row" style="margin-top: 18px; justify-content: space-between">
          <span class="cell-sub">已选 ${selectedArticleIds.size} 篇文章</span>
          <button class="primary-btn" data-action="create-publish-task" ${selectedArticleIds.size ? "" : "disabled"}>创建发布任务</button>
        </div>
      </aside>
    `;
  }

  return "";
}
