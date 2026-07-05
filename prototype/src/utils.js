export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function labelFromMap(value, map, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return map[value] || String(value);
}

export function channelTypeLabel(value) {
  return labelFromMap(value, {
    website_blog: "官网博客",
    zhihu_column: "知乎专栏",
    wechat_official: "微信公众号",
    xiaohongshu: "小红书",
    news_site: "媒体站点",
    video_account: "视频号"
  });
}

export function contentTypeLabel(value) {
  return labelFromMap(value, {
    article: "文章",
    comparison_page: "对比页",
    scenario_page: "场景页",
    faq: "问答页"
  });
}

export function templateTypeLabel(value) {
  return labelFromMap(value, {
    definition: "定义型",
    comparison: "对比型",
    scenario: "场景型",
    decision: "决策型",
    faq: "问答型",
    deployment: "部署型"
  });
}

export function capabilityLabel(value) {
  return labelFromMap(value, {
    keyword_discovery: "问题发现",
    topic_planning: "选题规划",
    article_generation: "文章生成"
  });
}

export function providerTypeLabel(value) {
  return labelFromMap(value, {
    builtin: "本地内置",
    http_adapter: "接口适配",
    llm_adapter: "模型适配"
  });
}

export function executionModeLabel(value) {
  return labelFromMap(value, {
    local: "本地执行",
    remote: "远程执行",
    fallback_local: "本地回退",
    queued: "排队中",
    retry_queued: "重试排队",
    manual_takeover: "人工接管",
    manual_publish: "人工发布",
    manual_requeue: "人工恢复",
    failed: "执行失败",
    canceled: "已取消"
  });
}

export function providerOperationLabel(value) {
  return labelFromMap(value, {
    execute: "执行请求",
    test_connection: "连接测试"
  });
}

export function schedulerStatusLabel(value) {
  return labelFromMap(value, {
    idle: "空闲",
    disabled: "已停用",
    busy: "忙碌",
    running: "运行中",
    error: "异常"
  });
}

export function generationModeLabel(value) {
  return labelFromMap(value, {
    ai_full: "模型生成",
    manual: "人工修改"
  });
}

export function statusMarkup(status) {
  let cls = "status-pill";
  if (["已完成", "已发布", "已通过", "已连接", "正常", "启用中", "已支付", "已开票", "active"].includes(status)) {
    cls += " status-success";
  } else if (["失败", "认证失效", "待审核", "待审批", "待开票", "部分失败", "已退回"].includes(status)) {
    cls += status === "部分失败" || status === "待审核" || status === "待审批" || status === "待开票" ? " status-warning" : " status-danger";
  } else if (["机会池", "待发布", "运行中", "默认", "排队中", "已批准", "免审批"].includes(status)) {
    cls += " status-primary";
  }
  return `<span class="${cls}">${escapeHtml(status)}</span>`;
}

export function tableMarkup(headers, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${headers.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  `;
}

export function subtabMarkup(active, tab, label, group) {
  return `<button class="subtab ${active === tab ? "active" : ""}" data-tab-group="${group}" data-tab="${tab}">${escapeHtml(label)}</button>`;
}

export function metricCard(label, value, note = "") {
  return `
    <article class="surface metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value" style="font-size:38px">${escapeHtml(value)}</div>
      <div class="cell-sub">${escapeHtml(note)}</div>
    </article>
  `;
}

export function formatDateTime(value, fallback = "-") {
  if (!value) {
    return fallback;
  }
  return String(value).replace("T", " ").slice(0, 16);
}
