import { navigation, pageMeta, primaryActions } from "./config.js";
import { escapeHtml } from "./utils.js";

function primaryActionAttrs(currentPage) {
  if (currentPage === "keywords") {
    return 'data-action="open-job-panel"';
  }
  if (currentPage === "dashboard") {
    return 'data-nav="keywords"';
  }
  if (currentPage === "content") {
    return 'data-action="create-manual-article"';
  }
  if (currentPage === "distribution") {
    return 'data-action="open-publish-panel"';
  }
  if (currentPage === "analytics") {
    return 'data-action="export-artifact" data-export-type="analytics_visibility"';
  }
  if (currentPage === "international") {
    return 'data-action="international-audit"';
  }
  if (currentPage === "billing") {
    return 'data-action="upgrade-plan" data-plan-id="single_user_pro"';
  }
  if (currentPage === "settings") {
    return 'data-action="save-brand-profile"';
  }
  return "disabled";
}

export function sidebarMarkup(currentPage, session = {}) {
  const user = session?.user || {};
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"></div>
        <div>
          <div class="brand-title">中国智能体 GEO</div>
          <div class="brand-name">极脉</div>
          <div class="brand-subtitle">关键词抓取、内容生成与分发平台</div>
        </div>
      </div>
      <div class="nav-group-label">导航</div>
      <nav class="nav-list">
        ${navigation
          .map(
            (item) => `
              <button class="nav-item ${currentPage === item.id ? "active" : ""}" data-nav="${item.id}">
                <span class="nav-icon"></span>
                <span class="nav-copy">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${escapeHtml(item.desc)}</span>
                </span>
              </button>
            `
          )
          .join("")}
      </nav>
      <div class="sidebar-footer">
        <div class="profile">
          <div class="avatar">AI</div>
          <div>
            <div style="font-weight: 800">${escapeHtml(user.display_name || user.username || "未登录")}</div>
            <div class="plan-badge">${escapeHtml(user.role || "visitor")}</div>
          </div>
        </div>
        <button class="ghost-btn" style="width:100%" data-action="logout-session">退出登录</button>
      </div>
    </aside>
  `;
}

export function topbarMarkup(currentPage, search) {
  const [title, subtitle] = pageMeta[currentPage];
  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="crumb">极脉 / ${escapeHtml(title)}</div>
        <h1 class="page-title">${escapeHtml(title)}</h1>
        <div class="page-subtitle">${escapeHtml(subtitle)}</div>
      </div>
      <div class="topbar-right">
        <label class="search">
          <span>⌕</span>
          <input placeholder="搜索关键词、文章、任务或内容源" value="${escapeHtml(search)}" data-search-input />
        </label>
        <button class="primary-btn" ${primaryActionAttrs(currentPage)}>${escapeHtml(primaryActions[currentPage])}</button>
        <div class="icon-circle">中</div>
        <div class="icon-circle">🔔<span class="notif-dot">1</span></div>
      </div>
    </header>
  `;
}

export function loadingMarkup() {
  return `
    <div class="surface panel">
      <div class="notice">正在加载本地演示数据与接口服务，请稍候。</div>
    </div>
  `;
}

export function errorMarkup(message) {
  return `
    <div class="surface panel">
      <div class="empty-state">
        <h3>页面加载失败</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}
