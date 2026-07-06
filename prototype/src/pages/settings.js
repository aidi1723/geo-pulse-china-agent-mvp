import {
  capabilityLabel,
  channelTypeLabel,
  escapeHtml,
  executionModeLabel,
  formatDateTime,
  providerOperationLabel,
  providerTypeLabel,
  schedulerStatusLabel,
  statusMarkup,
  subtabMarkup,
  tableMarkup
} from "../utils.js";

function eventLevelLabel(level) {
  return (
    {
      info: "信息",
      warn: "告警",
      error: "错误"
    }[level] || level || "-"
  );
}

function modelPurposeLabel(value) {
  return (
    {
      keyword_analysis: "关键词分析",
      article_generation: "文章生成",
      outline_generation: "大纲生成"
    }[value] || value || "-"
  );
}

function auditActionLabel(value) {
  return (
    {
      "runtime.reset": "运行态重置",
      "automation_provider.update": "能力服务更新",
      "automation_connector.update": "连接器更新",
      "automation_connector.test": "连接器测试",
      "model_config.update": "模型配置更新",
      "publish_task.start": "发布任务启动",
      "scheduler.tick": "调度轮询",
      "runtime.backup.create": "创建备份",
      "runtime.backup.validate": "校验备份",
      "runtime.backup.restore": "恢复备份",
      "auth.failure": "鉴权失败"
    }[value] || value || "-"
  );
}

function auditDetailSummary(details = {}) {
  if (!details || typeof details !== "object") {
    return "-";
  }
  const parts = [];
  if (details.method) parts.push(`方法 ${details.method}`);
  if (details.path) parts.push(`路径 ${details.path}`);
  if (details.reason) parts.push(`原因 ${details.reason}`);
  if (details.trigger) parts.push(`触发 ${details.trigger}`);
  if (details.skipped_reason) parts.push(`跳过 ${details.skipped_reason}`);
  if (details.changed_fields?.length) parts.push(`字段 ${details.changed_fields.join(", ")}`);
  if (details.status) parts.push(`状态 ${details.status}`);
  if (details.scheduler_status) parts.push(`调度 ${details.scheduler_status}`);
  return parts.join(" / ") || "-";
}

function compactJsonSummary(value = {}) {
  if (!value || typeof value !== "object") {
    return "-";
  }
  const parts = Object.entries(value)
    .slice(0, 3)
    .map(([key, item]) => `${key}: ${Array.isArray(item) ? item.join(", ") : item}`);
  return parts.join(" / ") || "-";
}

function csvCell(value) {
  const text = typeof value === "object" && value !== null
    ? JSON.stringify(neutralizeCsvObject(value))
    : neutralizeCsvText(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function neutralizeCsvText(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function neutralizeCsvObject(value) {
  if (Array.isArray(value)) {
    return value.map(neutralizeCsvObject);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, neutralizeCsvObject(item)])
    );
  }
  if (typeof value === "string") {
    return neutralizeCsvText(value);
  }
  return value;
}

function auditEventsCsv(events = []) {
  const headers = ["id", "created_at", "action", "resource_type", "resource_id", "actor_type", "actor_id", "details"];
  const rows = events.map((item) =>
    [
      item.id,
      item.created_at,
      item.action,
      item.resource_type,
      item.resource_id,
      item.actor_type,
      item.actor_id,
      item.details || {}
    ].map(csvCell).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function isStaticPreviewMode(store) {
  return (
    store.ui?.isStaticPreview === true ||
    (typeof window !== "undefined" && window.location?.protocol === "file:")
  );
}

function encodeCsvDataUrl(content) {
  return encodeURIComponent(content).replaceAll("'", "%27");
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function renderRuntimeBackups(backups = {}) {
  const items = backups.items || [];
  const latest = backups.latest || items[0] || null;
  const rows = items.length
    ? items.map((item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.name || item.id)}</div>
            <div class="cell-sub">${escapeHtml(item.id)}</div>
          </td>
          <td>${escapeHtml(formatDateTime(item.created_at))}</td>
          <td>
            <div class="cell-title">${escapeHtml(formatBytes(item.size_bytes))}</div>
            <div class="cell-sub">问题 ${escapeHtml(item.counts?.keywords ?? 0)} / 文章 ${escapeHtml(item.counts?.articles ?? 0)}</div>
          </td>
          <td>
            <div class="cell-title">${escapeHtml(String(item.checksum || "").slice(0, 12) || "-")}</div>
            <div class="cell-sub">Schema ${escapeHtml(item.schema_version || 1)}</div>
          </td>
          <td>
            <div class="actions-row">
              <button class="secondary-btn" data-action="validate-runtime-backup" data-backup-id="${escapeHtml(item.id)}">校验</button>
              <button class="secondary-btn" data-action="download-runtime-backup" data-backup-id="${escapeHtml(item.id)}">下载</button>
              <button class="danger-btn" data-action="restore-runtime-backup" data-backup-id="${escapeHtml(item.id)}">恢复</button>
            </div>
          </td>
        </tr>
      `)
    : [`
        <tr>
          <td colspan="5">
            <div class="empty-state">暂无本地备份。</div>
          </td>
        </tr>
      `];

  return `
    <div class="section-block" style="margin-top:18px">
      <div class="panel-head">
        <div>
          <h4 class="panel-title" style="font-size:15px">本地备份</h4>
          <div class="panel-note">仅显示备份元数据；下载动作会导出完整本地状态 JSON。</div>
        </div>
        <button class="secondary-btn" data-action="create-runtime-backup">创建备份</button>
      </div>
      <div class="info-list">
        <div class="info-row"><span>备份数量</span><strong>${escapeHtml(backups.count ?? items.length ?? 0)}</strong></div>
        <div class="info-row"><span>最新备份</span><strong>${escapeHtml(latest ? formatDateTime(latest.created_at) : "-")}</strong></div>
        <div class="info-row"><span>最新校验摘要</span><strong>${escapeHtml(latest?.checksum ? latest.checksum.slice(0, 16) : "-")}</strong></div>
      </div>
      ${tableMarkup(["备份", "创建时间", "体积 / 范围", "校验", "动作"], rows)}
    </div>
  `;
}

function saveButton(tab) {
  if (tab === "brand") {
    return '<button class="primary-btn" data-action="save-brand-profile">保存品牌知识</button>';
  }
  if (tab === "models") {
    return '<button class="primary-btn" data-action="save-model-config">保存模型接入</button>';
  }
  if (tab === "providers") {
    return '<button class="primary-btn" data-action="save-provider-config">保存能力服务</button>';
  }
  if (tab === "automation") {
    return '<button class="primary-btn" data-action="save-source-strategy">保存自动运营策略</button>';
  }
  return '<button class="primary-btn" data-action="save-channel-config">保存渠道配置</button>';
}

export function renderSettings(store) {
  const tab = store.tabs.settings;
  const isStaticPreview = isStaticPreviewMode(store);
  return `
    <section class="surface toolbar">
      <div class="subtabs">
        ${subtabMarkup(tab, "brand", "品牌知识", "settings")}
        ${subtabMarkup(tab, "models", "模型接入", "settings")}
        ${subtabMarkup(tab, "channels", "渠道配置", "settings")}
        ${subtabMarkup(tab, "providers", "能力服务", "settings")}
        ${subtabMarkup(tab, "automation", "自动运营", "settings")}
      </div>
      <div class="toolbar-row">
        <div class="toolbar-left">
          <span class="filter-pill active">一期核心配置</span>
          <span class="filter-pill">会影响后续生成结果</span>
        </div>
        <div class="toolbar-right">
          ${saveButton(tab)}
        </div>
      </div>
    </section>
    ${tab === "brand" ? renderBrand(store.data.brandProfile, store.data.runtimeStatus, store.data.auditEvents, isStaticPreview) : ""}
    ${tab === "models" ? renderModels(store) : ""}
    ${tab === "channels" ? renderChannels(store) : ""}
    ${tab === "providers" ? renderProviders(store) : ""}
    ${tab === "automation" ? renderAutomation(store) : ""}
  `;
}

function renderBrand(profile, runtimeStatus, auditEvents = [], isStaticPreview = false) {
  const persistence = runtimeStatus?.persistence || {};
  const counts = runtimeStatus?.counts || {};
  const scheduler = runtimeStatus?.scheduler || {};
  const providers = runtimeStatus?.providers || {};
  const backups = runtimeStatus?.backups || {};
  return `
    <div class="stack-blocks">
      <section class="surface panel" data-settings-panel="brand">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">品牌知识</h3>
            <div class="panel-note">让生成内容更像中国智能体公司的公开叙事，而不是通用 AI 写作。</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label>品牌名称</label>
            <input value="${escapeHtml(profile?.brand_name || "")}" data-brand-field="brand_name" />
          </div>
          <div class="form-field">
            <label>一句话介绍</label>
            <input value="${escapeHtml(profile?.one_liner || "")}" data-brand-field="one_liner" />
          </div>
          <div class="form-field full">
            <label>核心卖点</label>
            <textarea data-brand-field="core_value_props">${escapeHtml((profile?.core_value_props || []).join("\n"))}</textarea>
          </div>
          <div class="form-field full">
            <label>禁用表达</label>
            <textarea data-brand-field="forbidden_terms">${escapeHtml((profile?.forbidden_terms || []).join("\n"))}</textarea>
          </div>
          <div class="form-field full">
            <label>行业术语</label>
            <textarea data-brand-field="glossary_terms">${escapeHtml((profile?.glossary_terms || []).map((item) => `${item.term}：${item.description}`).join("\n"))}</textarea>
          </div>
        </div>
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">运行态与数据</h3>
            <div class="panel-note">本地演示环境默认落盘，重启服务后可恢复设置、文章、任务和渠道状态。</div>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row"><span>持久化状态</span><strong>${escapeHtml(persistence.enabled ? "已开启" : "未开启")}</strong></div>
          <div class="info-row"><span>数据文件</span><strong style="max-width:62%; text-align:right; word-break:break-all">${escapeHtml(persistence.file || "-")}</strong></div>
          <div class="info-row"><span>问题数</span><strong>${escapeHtml(counts.keywords ?? "-")}</strong></div>
          <div class="info-row"><span>选题数</span><strong>${escapeHtml(counts.topics ?? "-")}</strong></div>
          <div class="info-row"><span>文章数</span><strong>${escapeHtml(counts.articles ?? "-")}</strong></div>
          <div class="info-row"><span>任务数</span><strong>${escapeHtml(counts.tasks ?? "-")}</strong></div>
          <div class="info-row"><span>渠道数</span><strong>${escapeHtml(counts.channels ?? "-")}</strong></div>
          <div class="info-row"><span>模型数</span><strong>${escapeHtml(counts.models ?? "-")}</strong></div>
          <div class="info-row"><span>策略数</span><strong>${escapeHtml(counts.strategies ?? "-")}</strong></div>
          <div class="info-row"><span>执行记录数</span><strong>${escapeHtml(counts.automation_runs ?? "-")}</strong></div>
        </div>
        <div class="actions-row" style="margin-top:18px; justify-content:space-between">
          <span class="cell-sub">重置会恢复为仓库内置种子数据，并覆盖当前本地持久化文件。</span>
          <button class="danger-btn" data-action="reset-runtime-state">重置运行态</button>
        </div>
        ${renderRuntimeBackups(backups)}
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">自动调度引擎</h3>
            <div class="panel-note">本地服务内置轮询器，会按策略的 next_run_at 自动执行到期任务。</div>
          </div>
          <button class="secondary-btn" data-action="run-scheduler-tick">立即轮询</button>
        </div>
        <div class="info-list">
          <div class="info-row"><span>引擎状态</span><strong>${escapeHtml(schedulerStatusLabel(scheduler.status))}</strong></div>
          <div class="info-row"><span>调度开关</span><strong>${escapeHtml(scheduler.enabled ? "已开启" : "未开启")}</strong></div>
          <div class="info-row"><span>轮询间隔</span><strong>${escapeHtml(scheduler.tick_ms ? `${scheduler.tick_ms} 毫秒` : "-")}</strong></div>
          <div class="info-row"><span>每轮上限</span><strong>${escapeHtml(scheduler.max_runs_per_tick ?? "-")}</strong></div>
          <div class="info-row"><span>启用策略</span><strong>${escapeHtml(scheduler.active_strategy_count ?? "-")}</strong></div>
          <div class="info-row"><span>已排期策略</span><strong>${escapeHtml(scheduler.scheduled_strategy_count ?? "-")}</strong></div>
          <div class="info-row"><span>当前到期策略</span><strong>${escapeHtml(scheduler.due_strategy_count ?? "-")}</strong></div>
          <div class="info-row"><span>下一个到期时间</span><strong>${escapeHtml(formatDateTime(scheduler.next_due_at))}</strong></div>
          <div class="info-row"><span>上次轮询</span><strong>${escapeHtml(formatDateTime(scheduler.last_tick_at))}</strong></div>
          <div class="info-row"><span>上次成功派发</span><strong>${escapeHtml(formatDateTime(scheduler.last_success_at))}</strong></div>
          <div class="info-row"><span>累计派发次数</span><strong>${escapeHtml(scheduler.total_dispatched_runs ?? "-")}</strong></div>
          <div class="info-row"><span>最近错误</span><strong style="max-width:62%; text-align:right; word-break:break-all">${escapeHtml(scheduler.last_error_message || "-")}</strong></div>
        </div>
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">能力适配层</h3>
            <div class="panel-note">当前已把抓词、选题和写稿能力抽成统一服务层，后续可直接替换成真实模型和接口。</div>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row"><span>能力服务总数</span><strong>${escapeHtml(providers.counts?.total ?? "-")}</strong></div>
          <div class="info-row"><span>启用中的服务</span><strong>${escapeHtml(providers.counts?.active ?? "-")}</strong></div>
          <div class="info-row"><span>问题发现</span><strong>${escapeHtml(providers.active_provider_ids?.keyword_discovery || "-")}</strong></div>
          <div class="info-row"><span>选题规划</span><strong>${escapeHtml(providers.active_provider_ids?.topic_planning || "-")}</strong></div>
          <div class="info-row"><span>文章生成</span><strong>${escapeHtml(providers.active_provider_ids?.article_generation || "-")}</strong></div>
        </div>
      </section>
      ${renderAuditEvents(auditEvents, isStaticPreview)}
    </div>
  `;
}

function renderAuditEvents(auditEvents = [], isStaticPreview = false) {
  const exportHref = isStaticPreview
    ? `data:text/csv;charset=utf-8,${encodeCsvDataUrl(auditEventsCsv(auditEvents || []))}`
    : "/api/v1/audit-events/export.csv";
  const rows = (auditEvents || []).slice(0, 8).map(
    (item) => `
      <tr>
        <td><div class="cell-title">${escapeHtml(auditActionLabel(item.action))}</div><div class="cell-sub">${escapeHtml(item.action || "-")}</div></td>
        <td>${escapeHtml(item.resource_type || "-")}</td>
        <td><div class="cell-sub" style="word-break:break-all">${escapeHtml(item.resource_id || "-")}</div></td>
        <td><div class="cell-sub">${escapeHtml(auditDetailSummary(item.details))}</div></td>
        <td>${escapeHtml(formatDateTime(item.created_at))}</td>
      </tr>
    `
  );

  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
            <h3 class="panel-title">审计日志</h3>
            <div class="panel-note">最近关键运行操作，包含配置变更、发布动作、调度轮询和失败鉴权。</div>
          </div>
        <a class="secondary-btn" href="${escapeHtml(exportHref)}" download="geo-pulse-audit-events.csv">导出审计日志</a>
      </div>
      ${
        rows.length
          ? tableMarkup(["动作", "资源类型", "资源", "摘要", "时间"], rows)
          : '<div class="cell-sub">暂无审计事件。</div>'
      }
    </section>
  `;
}

function renderAutomationRunSteps(steps = []) {
  if (!steps.length) {
    return '<div class="cell-sub">当前执行记录暂无结构化步骤。</div>';
  }

  const rows = steps.map(
    (step) => `
      <tr>
        <td>
          <div class="cell-title">${escapeHtml(step.step_label || step.step_type || "-")}</div>
          <div class="cell-sub">${escapeHtml(step.step_type || "-")}</div>
        </td>
        <td>${statusMarkup(step.status_label || step.status || "-")}</td>
        <td>
          <div class="cell-sub">${escapeHtml(step.provider_id || "-")}</div>
          <div class="cell-sub">${escapeHtml(step.connector_id || "-")}</div>
        </td>
        <td>${escapeHtml(`${Number(step.latency_ms || 0)} ms`)}</td>
        <td><div class="cell-sub">${escapeHtml(compactJsonSummary(step.output_preview))}</div></td>
        <td><div class="cell-sub">${escapeHtml(step.error_message || "-")}</div></td>
      </tr>
    `
  );

  return tableMarkup(["步骤", "状态", "Provider / Connector", "耗时", "输出摘要", "异常"], rows);
}

function renderModels(store) {
  const selected = store.data.modelConfigs.find((item) => item.id === store.selectedIds.model) || store.data.modelConfigs[0];
  return `
    <div class="layout-split">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">模型接入中心</h3>
            <div class="panel-note">按任务类型接入不同模型，支持中国模型官方接口和兼容接口统一管理。</div>
          </div>
          <button class="primary-btn" data-action="create-model-config">新增模型</button>
        </div>
        ${tableMarkup(
          ["服务商", "模型名", "用途", "接口地址", "默认状态", "调用状态"],
          store.data.modelConfigs.map(
            (item) => `
              <tr data-select-model="${item.id}">
                <td>${escapeHtml(item.provider)}</td>
                <td>${escapeHtml(item.model_name)}</td>
                <td>${escapeHtml(modelPurposeLabel(item.purpose))}</td>
                <td><div class="cell-sub">${escapeHtml(item.endpoint || "-")}</div></td>
                <td>${statusMarkup(item.is_default ? "默认" : "备用")}</td>
                <td>${statusMarkup(item.status === "active" ? "正常" : item.status)}</td>
              </tr>
            `
          )
        )}
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">Prompt 模板</h3>
            <div class="panel-note">记录生成链路使用的模板、版本和用途，便于后续做回归评测。</div>
          </div>
        </div>
        ${tableMarkup(
          ["模板", "用途", "版本", "状态", "更新时间"],
          (store.data.promptTemplates || []).map(
            (item) => `
              <tr>
                <td><div class="cell-title">${escapeHtml(item.name)}</div><div class="cell-sub">${escapeHtml(item.id)}</div></td>
                <td>${escapeHtml(modelPurposeLabel(item.purpose))}</td>
                <td>${escapeHtml(`v${item.active_version || 1}`)}</td>
                <td>${statusMarkup(item.status_label || item.status || "-")}</td>
                <td>${escapeHtml(formatDateTime(item.updated_at))}</td>
              </tr>
            `
          )
        )}
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">质量 Trace</h3>
            <div class="panel-note">最近生成内容的 Prompt 版本、模型配置和质量评分。</div>
          </div>
        </div>
        ${tableMarkup(
          ["文章", "Prompt", "模型", "Provider", "分数", "状态"],
          (store.data.contentQualityTraces || []).slice(0, 8).map(
            (item) => `
              <tr>
                <td><div class="cell-title">${escapeHtml(item.article_title || item.article_id)}</div><div class="cell-sub">${escapeHtml(item.article_id || "-")}</div></td>
                <td><div class="cell-sub">${escapeHtml(item.prompt_template_id || "-")} / v${escapeHtml(item.prompt_template_version || 1)}</div></td>
                <td><div class="cell-sub">${escapeHtml(item.model_config_id || "-")}</div></td>
                <td><div class="cell-sub">${escapeHtml(item.provider_id || "-")}</div></td>
                <td>${escapeHtml(item.score ?? "-")}</td>
                <td>${statusMarkup(item.status_label || item.status || "-")}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer" data-settings-panel="model">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.model_name)}</div>
                <div class="chip-row" style="margin-top:12px">
                  ${statusMarkup(selected.is_default ? "默认" : "备用")}
                  ${statusMarkup(selected.status === "active" ? "正常" : selected.status)}
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label>服务商</label>
                  <input data-model-field="provider" value="${escapeHtml(selected.provider)}" />
                </div>
                <div class="form-field">
                  <label>接入类型</label>
                  <input data-model-field="provider_type" value="${escapeHtml(selected.provider_type || "")}" />
                </div>
                <div class="form-field">
                  <label>模型名称</label>
                  <input data-model-field="model_name" value="${escapeHtml(selected.model_name)}" />
                </div>
                <div class="form-field">
                  <label>主要用途</label>
                  <select data-model-field="purpose">
                    <option value="keyword_analysis" ${selected.purpose === "keyword_analysis" ? "selected" : ""}>关键词分析</option>
                    <option value="article_generation" ${selected.purpose === "article_generation" ? "selected" : ""}>文章生成</option>
                    <option value="outline_generation" ${selected.purpose === "outline_generation" ? "selected" : ""}>大纲生成</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>接口地址</label>
                  <input data-model-field="endpoint" value="${escapeHtml(selected.endpoint || "")}" />
                </div>
                <div class="form-field full">
                  <label>密钥</label>
                  <input type="password" data-model-field="api_key" value="" placeholder="${escapeHtml(selected.masked_api_key || "")}" />
                </div>
                <div class="form-field">
                  <label>温度</label>
                  <input type="number" min="0" max="2" step="0.1" data-model-field="temperature" value="${escapeHtml(selected.temperature ?? 0.7)}" />
                </div>
                <div class="form-field">
                  <label>最大输出</label>
                  <input type="number" min="256" data-model-field="max_tokens" value="${escapeHtml(selected.max_tokens ?? 4096)}" />
                </div>
                <div class="form-field">
                  <label>超时毫秒</label>
                  <input type="number" min="500" data-model-field="timeout_ms" value="${escapeHtml(selected.timeout_ms ?? 20000)}" />
                </div>
                <div class="form-field">
                  <label>状态</label>
                  <select data-model-field="status">
                    <option value="active" ${selected.status === "active" ? "selected" : ""}>正常</option>
                    <option value="disabled" ${selected.status === "disabled" ? "selected" : ""}>停用</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>默认状态</label>
                  <select data-model-field="is_default">
                    <option value="true" ${selected.is_default ? "selected" : ""}>默认</option>
                    <option value="false" ${!selected.is_default ? "selected" : ""}>备用</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>接入说明</label>
                  <textarea data-model-field="notes">${escapeHtml(selected.notes || "")}</textarea>
                </div>
              </div>
            `
            : ""
        }
      </aside>
    </div>
  `;
}

function renderChannels(store) {
  const selected = store.data.channels.find((item) => item.id === store.selectedIds.channel) || store.data.channels[0];
  return `
    <div class="layout-split">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">渠道配置</h3>
            <div class="panel-note">第一期优先保证官网博客、知乎和公众号发布稳定。</div>
          </div>
          <button class="primary-btn" data-action="create-channel-config">新增渠道</button>
        </div>
        ${tableMarkup(
          ["渠道", "账号", "认证状态", "默认作者", "默认分类", "操作"],
          store.data.channels.map(
            (item) => `
              <tr data-select-channel="${item.id}">
                <td>${escapeHtml(item.channel_name)}</td>
                <td>${escapeHtml(item.account_name || "-")}</td>
                <td>${statusMarkup(item.auth_status_label || item.auth_status)}</td>
                <td>${escapeHtml(item.default_author || "-")}</td>
                <td>${escapeHtml(item.default_category || "-")}</td>
                <td>
                  ${
                    item.auth_status === "expired"
                      ? `<button class="secondary-btn" data-action="reconnect-channel" data-channel-id="${item.id}">重新认证</button>`
                      : `<button class="secondary-btn" data-select-channel="${item.id}">编辑映射</button>`
                  }
                </td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer" data-settings-panel="channel">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.channel_name)}</div>
                <div class="chip-row" style="margin-top:12px">
                  ${statusMarkup(selected.auth_status_label || selected.auth_status)}
                  <span class="status-pill">${escapeHtml(channelTypeLabel(selected.channel_type))}</span>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label>渠道名称</label>
                  <input data-channel-field="channel_name" value="${escapeHtml(selected.channel_name)}" />
                </div>
                <div class="form-field">
                  <label>账号名称</label>
                  <input data-channel-field="account_name" value="${escapeHtml(selected.account_name || "")}" />
                </div>
                <div class="form-field">
                  <label>默认作者</label>
                  <input data-channel-field="default_author" value="${escapeHtml(selected.default_author || "")}" />
                </div>
                <div class="form-field">
                  <label>默认分类</label>
                  <input data-channel-field="default_category" value="${escapeHtml(selected.default_category || "")}" />
                </div>
                <div class="form-field full">
                  <label>认证状态</label>
                  <select data-channel-field="auth_status">
                    <option value="connected" ${selected.auth_status === "connected" ? "selected" : ""}>已连接</option>
                    <option value="expired" ${selected.auth_status === "expired" ? "selected" : ""}>认证失效</option>
                    <option value="pending" ${selected.auth_status === "pending" ? "selected" : ""}>待连接</option>
                  </select>
                </div>
              </div>
            `
            : ""
        }
      </aside>
    </div>
  `;
}

function formatJsonBlock(value) {
  return escapeHtml(JSON.stringify(value || {}, null, 2));
}

function renderFieldList(fields = []) {
  if (!fields.length) {
    return '<span class="cell-sub">-</span>';
  }
  return fields.map((field) => `<span class="status-pill">${escapeHtml(field)}</span>`).join("");
}

function renderProviders(store) {
  const selected =
    store.data.automationProviders.find((item) => item.id === store.selectedIds.provider) ||
    store.data.automationProviders[0];
  const selectedConnector =
    (store.data.automationConnectors || []).find((item) => item.id === store.selectedIds.connector) ||
    (store.data.automationConnectors || [])[0];
  const recentInvocations = (store.data.providerInvocations || []).filter(
    (item) => item.provider_id === selected?.id || item.fallback_provider_id === selected?.id
  ).slice(0, 5);
  const latestTest = (store.data.providerInvocations || []).find(
    (item) => item.provider_id === selected?.id && item.operation === "test_connection"
  );
  const providerSummary = store.data.runtimeStatus?.providers?.invocation_summary || {};
  const connectorSummary = store.data.runtimeStatus?.connectors?.counts || {};
  const connectorHealth = selectedConnector?.last_health_check || null;
  const connectorDiagnostic = selectedConnector?.last_diagnostic || null;
  const protocol = selected?.protocol || null;

  return `
    <div class="stack-blocks">
      <div class="layout-split">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">调用观测</h3>
            <div class="panel-note">记录能力服务的远程执行、回退、本地兜底和错误情况。</div>
          </div>
        </div>
        <div class="grid-three">
          <article class="surface metric-card">
            <div class="metric-label">调用总数</div>
            <div class="metric-value" style="font-size:38px">${escapeHtml(providerSummary.total ?? 0)}</div>
            <div class="cell-sub">最近运行期内沉淀的能力服务调用日志</div>
          </article>
          <article class="surface metric-card">
            <div class="metric-label">远程执行</div>
            <div class="metric-value" style="font-size:38px">${escapeHtml(providerSummary.remote_count ?? 0)}</div>
            <div class="cell-sub">真正走远程服务的次数</div>
          </article>
          <article class="surface metric-card">
            <div class="metric-label">本地回退</div>
            <div class="metric-value" style="font-size:38px">${escapeHtml(providerSummary.fallback_count ?? 0)}</div>
            <div class="cell-sub">远程失败或停用后回退到本地</div>
          </article>
        </div>
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">外部连接器</h3>
            <div class="panel-note">把内容源、SERP、CMS、社媒、邮件和效果分析从模型能力中拆出，后续按连接器接真实系统。</div>
          </div>
        </div>
        <div class="info-list" style="margin-bottom:14px">
          <div class="info-row"><span>连接器总数</span><strong>${escapeHtml(connectorSummary.total ?? (store.data.automationConnectors || []).length)}</strong></div>
          <div class="info-row"><span>可配置</span><strong>${escapeHtml(connectorSummary.ready ?? "-")}</strong></div>
          <div class="info-row"><span>规划中</span><strong>${escapeHtml(connectorSummary.planned ?? "-")}</strong></div>
          <div class="info-row"><span>权限待复核</span><strong>${escapeHtml(connectorSummary.permission_needs_review ?? "-")}</strong></div>
        </div>
        ${tableMarkup(
          ["连接器", "类型", "状态", "凭据状态", "权限边界", "允许动作", "危险动作", "审计"],
          (store.data.automationConnectors || []).map(
            (item) => `
              <tr data-select-connector="${escapeHtml(item.id)}">
                <td>
                  <div class="cell-title">${escapeHtml(item.label)}</div>
                  <div class="cell-sub">${escapeHtml(item.id)}</div>
                  <div class="cell-sub" style="word-break:break-all">${escapeHtml(item.config?.endpoint || "-")}</div>
                </td>
                <td>${escapeHtml(item.connector_type_label || item.connector_type || "-")}</td>
                <td>${statusMarkup(item.status_label || item.status || "-")}</td>
                <td>
                  ${statusMarkup(item.credential_status_label || item.credential_status || "-")}
                  <div class="cell-sub">${escapeHtml(item.config?.masked_api_key || "-")}</div>
                </td>
                <td>
                  ${statusMarkup(item.permission_boundary_label || item.permission_boundary || "-")}
                  <div class="cell-sub">${escapeHtml((item.scopes || []).join(", ") || "-")}</div>
                </td>
                <td><div class="cell-sub">${escapeHtml((item.allowed_actions || []).join(", ") || "-")}</div></td>
                <td><div class="cell-sub">${escapeHtml((item.dangerous_actions || []).join(", ") || "-")}</div></td>
                <td>
                  ${statusMarkup(item.last_permission_audit?.status_label || item.last_permission_audit?.status || "-")}
                  <div class="cell-sub">${escapeHtml(item.last_permission_audit?.checked_at || "-")}</div>
                </td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer" data-settings-panel="connector">
        ${
          selectedConnector
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selectedConnector.label)}</div>
                <div class="chip-row" style="margin-top:12px">
                  <span class="status-pill">${escapeHtml(selectedConnector.connector_type_label || selectedConnector.connector_type || "-")}</span>
                  ${statusMarkup(selectedConnector.status_label || selectedConnector.status || "-")}
                  ${statusMarkup(selectedConnector.credential_status_label || selectedConnector.credential_status || "-")}
                </div>
                <div class="panel-note" style="margin-top:12px">${escapeHtml(selectedConnector.note || "-")}</div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label>启用状态</label>
                  <select data-connector-field="is_enabled">
                    <option value="true" ${selectedConnector.is_enabled ? "selected" : ""}>启用</option>
                    <option value="false" ${!selectedConnector.is_enabled ? "selected" : ""}>停用</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>连接器状态</label>
                  <select data-connector-field="status">
                    <option value="ready" ${selectedConnector.status === "ready" ? "selected" : ""}>可配置</option>
                    <option value="planned" ${selectedConnector.status === "planned" ? "selected" : ""}>规划中</option>
                    <option value="disabled" ${selectedConnector.status === "disabled" ? "selected" : ""}>已停用</option>
                    <option value="error" ${selectedConnector.status === "error" ? "selected" : ""}>异常</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>接口地址</label>
                  <input data-connector-field="endpoint" value="${escapeHtml(selectedConnector.config?.endpoint || "")}" />
                </div>
                <div class="form-field">
                  <label>密钥</label>
                  <input type="password" data-connector-field="api_key" value="" placeholder="${escapeHtml(selectedConnector.config?.masked_api_key || "")}" />
                </div>
                <div class="form-field">
                  <label>超时（毫秒）</label>
                  <input type="number" min="500" data-connector-field="timeout_ms" value="${escapeHtml(selectedConnector.config?.timeout_ms || 10000)}" />
                </div>
                <div class="form-field">
                  <label>重试次数</label>
                  <input type="number" min="0" data-connector-field="retry_count" value="${escapeHtml(selectedConnector.config?.retry_count || 0)}" />
                </div>
                <div class="form-field full">
                  <label>备注</label>
                  <textarea data-connector-field="notes">${escapeHtml(selectedConnector.config?.notes || "")}</textarea>
                </div>
              </div>
              <div class="actions-row" style="margin-top:18px; justify-content:space-between">
                <span class="cell-sub">连接器测试会先保存当前配置，再执行一次 mock 或 HTTPS 健康检查。</span>
                <div class="actions-row">
                  <button class="secondary-btn" data-action="save-connector-config">保存连接器</button>
                  <button class="secondary-btn" data-action="test-connector-config">连接器测试</button>
                  <button class="secondary-btn" data-action="run-connector-diagnostic">运行诊断</button>
                </div>
              </div>
              <div class="drawer-section">
                <h4>权限边界</h4>
                <div class="info-list">
                  <div class="info-row"><span>边界</span><strong>${escapeHtml(selectedConnector.permission_boundary_label || selectedConnector.permission_boundary || "-")}</strong></div>
                  <div class="info-row"><span>范围</span><strong style="max-width:62%; text-align:right">${escapeHtml((selectedConnector.scopes || []).join(", ") || "-")}</strong></div>
                  <div class="info-row"><span>允许动作</span><strong style="max-width:62%; text-align:right">${escapeHtml((selectedConnector.allowed_actions || []).join(", ") || "-")}</strong></div>
                  <div class="info-row"><span>危险动作</span><strong style="max-width:62%; text-align:right">${escapeHtml((selectedConnector.dangerous_actions || []).join(", ") || "-")}</strong></div>
                </div>
              </div>
              <div class="drawer-section">
                <h4>最近健康检查</h4>
                ${
                  connectorHealth
                    ? `
                      <div class="info-list">
                        <div class="info-row"><span>检查时间</span><strong>${escapeHtml(formatDateTime(connectorHealth.checked_at))}</strong></div>
                        <div class="info-row"><span>结果</span><strong>${escapeHtml(connectorHealth.success_label || (connectorHealth.success ? "测试通过" : "测试失败"))}</strong></div>
                        <div class="info-row"><span>执行模式</span><strong>${escapeHtml(connectorHealth.execution_mode || "-")}</strong></div>
                        <div class="info-row"><span>耗时</span><strong>${escapeHtml(`${connectorHealth.duration_ms || 0} 毫秒`)}</strong></div>
                        <div class="info-row"><span>接口地址</span><strong style="max-width:62%; text-align:right; word-break:break-all">${escapeHtml(connectorHealth.endpoint || "-")}</strong></div>
                      </div>
                      ${
                        connectorHealth.error_message
                          ? `<div class="cell-sub" style="margin-top:12px; word-break:break-all">${escapeHtml(connectorHealth.error_message)}</div>`
                          : ""
                      }
                    `
                    : `<div class="cell-sub">当前连接器还没有健康检查记录。</div>`
                }
              </div>
              <div class="drawer-section">
                <h4>最近诊断</h4>
                ${
                  connectorDiagnostic
                    ? `
                      <div class="info-list">
                        <div class="info-row"><span>诊断时间</span><strong>${escapeHtml(formatDateTime(connectorDiagnostic.created_at))}</strong></div>
                        <div class="info-row"><span>就绪得分</span><strong>${escapeHtml(connectorDiagnostic.readiness_score ?? 0)}</strong></div>
                        <div class="info-row"><span>状态</span><strong>${escapeHtml(connectorDiagnostic.status_label || connectorDiagnostic.status || "-")}</strong></div>
                      </div>
                      <div class="stack" style="margin-top:14px">
                        ${
                          (connectorDiagnostic.checks || []).map(
                            (check) => `
                              <div class="funnel-step">
                                <div>
                                  <strong style="font-size:15px">${escapeHtml(check.label || check.check_id || "-")}</strong>
                                  <div class="cell-sub">${escapeHtml(check.detail || "-")}</div>
                                </div>
                                ${statusMarkup(check.status_label || check.status || "-")}
                              </div>
                            `
                          ).join("")
                        }
                      </div>
                      <div style="margin-top:16px">
                        <h4>建议动作</h4>
                        <div class="stack">
                          ${
                            (connectorDiagnostic.recommended_actions || []).length
                              ? connectorDiagnostic.recommended_actions.map(
                                  (item) => `<div class="cell-sub">${escapeHtml(item)}</div>`
                                ).join("")
                              : `<div class="cell-sub">暂无建议。</div>`
                          }
                        </div>
                      </div>
                      <div style="margin-top:16px">
                        <h4>关联运行步骤</h4>
                        <div class="stack">
                          ${
                            (connectorDiagnostic.recent_run_steps || []).length
                              ? connectorDiagnostic.recent_run_steps.map(
                                  (step) => `
                                    <div class="funnel-step">
                                      <div>
                                        <strong style="font-size:15px">${escapeHtml(step.step_label || step.step_type || "-")}</strong>
                                        <div class="cell-sub">${escapeHtml(step.run_id || "-")} / ${escapeHtml(step.connector_id || "-")} / ${escapeHtml(step.latency_ms || 0)} ms</div>
                                      </div>
                                      ${statusMarkup(step.status_label || step.status || "-")}
                                    </div>
                                  `
                                ).join("")
                              : `<div class="cell-sub">暂无关联运行步骤。</div>`
                          }
                        </div>
                      </div>
                      <div style="margin-top:16px">
                        <h4>审计上下文</h4>
                        <div class="stack">
                          ${
                            (connectorDiagnostic.recent_audit_events || []).length
                              ? connectorDiagnostic.recent_audit_events.map(
                                  (event) => `
                                    <div class="funnel-step">
                                      <div>
                                        <strong style="font-size:15px">${escapeHtml(event.action || "-")}</strong>
                                        <div class="cell-sub">${escapeHtml(formatDateTime(event.created_at))}</div>
                                      </div>
                                      ${statusMarkup("审计")}
                                    </div>
                                  `
                                ).join("")
                              : `<div class="cell-sub">暂无审计上下文。</div>`
                          }
                        </div>
                      </div>
                    `
                    : `<div class="cell-sub">当前连接器还没有诊断记录。</div>`
                }
              </div>
            `
            : `<div class="cell-sub">暂无连接器。</div>`
        }
      </aside>
      </div>
      <div class="layout-split">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">能力适配器</h3>
            <div class="panel-note">把抓词、选题、写稿的执行能力抽成可切换的统一服务，方便后续接真实接口。</div>
          </div>
        </div>
        ${tableMarkup(
          ["能力", "服务名称", "类型", "激活状态", "配置状态"],
          store.data.automationProviders.map(
            (item) => `
              <tr data-select-provider="${item.id}">
                <td>${escapeHtml(capabilityLabel(item.capability))}</td>
                <td><div class="cell-title">${escapeHtml(item.label)}</div><div class="cell-sub">${escapeHtml(item.id)}</div></td>
                <td>${escapeHtml(providerTypeLabel(item.type))}</td>
                <td>${statusMarkup(item.is_active ? "默认" : "备用")}</td>
                <td>${statusMarkup(item.config?.enabled ? "正常" : "停用")}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer" data-settings-panel="provider">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.label)}</div>
                <div class="chip-row" style="margin-top:12px">
                  <span class="status-pill">${escapeHtml(capabilityLabel(selected.capability))}</span>
                  <span class="status-pill">${escapeHtml(providerTypeLabel(selected.type))}</span>
                  ${statusMarkup(selected.is_active ? "默认" : "备用")}
                </div>
                <div class="panel-note" style="margin-top:12px">${escapeHtml(selected.note || "-")}</div>
              </div>
              <div class="form-grid">
                <div class="form-field">
                  <label>设为当前默认</label>
                  <select data-provider-field="is_active">
                    <option value="true" ${selected.is_active ? "selected" : ""}>是</option>
                    <option value="false" ${!selected.is_active ? "selected" : ""}>否</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>启用状态</label>
                  <select data-provider-field="enabled">
                    <option value="true" ${selected.config?.enabled !== false ? "selected" : ""}>启用</option>
                    <option value="false" ${selected.config?.enabled === false ? "selected" : ""}>停用</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>接口地址</label>
                  <input data-provider-field="endpoint" value="${escapeHtml(selected.config?.endpoint || "")}" />
                </div>
                <div class="form-field">
                  <label>模型名称</label>
                  <input data-provider-field="model_name" value="${escapeHtml(selected.config?.model_name || "")}" />
                </div>
                <div class="form-field">
                  <label>密钥</label>
                  <input type="password" data-provider-field="api_key" value="" placeholder="${escapeHtml(selected.config?.masked_api_key || "")}" />
                </div>
                <div class="form-field">
                  <label>超时（毫秒）</label>
                  <input type="number" min="500" data-provider-field="timeout_ms" value="${escapeHtml(selected.config?.timeout_ms || 1000)}" />
                </div>
                <div class="form-field">
                  <label>重试次数</label>
                  <input type="number" min="0" data-provider-field="retry_count" value="${escapeHtml(selected.config?.retry_count || 0)}" />
                </div>
                <div class="form-field full">
                  <label>备注</label>
                  <textarea data-provider-field="notes">${escapeHtml(selected.config?.notes || "")}</textarea>
                </div>
              </div>
              <div class="actions-row" style="margin-top:18px; justify-content:space-between">
                <span class="cell-sub">连接测试会先保存当前配置，再按协议示例发起一次测试请求。</span>
                <button class="secondary-btn" data-action="test-provider-config">连接测试</button>
              </div>
              <div class="drawer-section">
                <h4>协议说明</h4>
                <div class="info-list">
                  <div class="info-row"><span>能力</span><strong>${escapeHtml(capabilityLabel(protocol?.capability || selected.capability || "-"))}</strong></div>
                  <div class="info-row"><span>请求必填</span><strong style="max-width:62%; text-align:right">${renderFieldList(protocol?.request?.required_fields || [])}</strong></div>
                  <div class="info-row"><span>响应必填</span><strong style="max-width:62%; text-align:right">${renderFieldList(protocol?.response?.required_fields || [])}</strong></div>
                </div>
                <div class="stack" style="margin-top:14px">
                  <div>
                    <div class="cell-sub" style="margin-bottom:8px">请求示例</div>
                    <pre class="code-panel">${formatJsonBlock(protocol?.example_request_body)}</pre>
                  </div>
                  <div>
                    <div class="cell-sub" style="margin-bottom:8px">响应示例</div>
                    <pre class="code-panel">${formatJsonBlock(protocol?.example_response_body)}</pre>
                  </div>
                </div>
              </div>
              <div class="drawer-section">
                <h4>最近测试</h4>
                ${
                  latestTest
                    ? `
                      <div class="info-list">
                        <div class="info-row"><span>测试时间</span><strong>${escapeHtml(formatDateTime(latestTest.created_at))}</strong></div>
                        <div class="info-row"><span>执行模式</span><strong>${escapeHtml(executionModeLabel(latestTest.execution_mode || "-"))}</strong></div>
                        <div class="info-row"><span>耗时</span><strong>${escapeHtml(`${latestTest.duration_ms || 0} 毫秒`)}</strong></div>
                        <div class="info-row"><span>尝试次数</span><strong>${escapeHtml(latestTest.attempts || 1)}</strong></div>
                        <div class="info-row"><span>协议校验</span><strong>${escapeHtml(latestTest.schema_valid === false ? "失败" : "通过")}</strong></div>
                        <div class="info-row"><span>接口地址</span><strong style="max-width:62%; text-align:right; word-break:break-all">${escapeHtml(latestTest.endpoint || "-")}</strong></div>
                        <div class="info-row"><span>结果</span><strong>${latestTest.error_message ? "失败" : "成功"}</strong></div>
                      </div>
                      ${
                        latestTest.error_message
                          ? `<div class="cell-sub" style="margin-top:12px; word-break:break-all">${escapeHtml(latestTest.error_message)}</div>`
                          : ""
                      }
                    `
                    : `<div class="cell-sub">当前能力服务还没有连接测试记录。</div>`
                }
              </div>
              <div class="drawer-section">
                <h4>最近调用</h4>
                <div class="stack">
                  ${
                    recentInvocations.length
                      ? recentInvocations.map(
                          (item) => `
                            <div class="funnel-step">
                              <div>
                                <strong style="font-size:15px">${escapeHtml(providerOperationLabel(item.operation || "execute"))} / ${escapeHtml(executionModeLabel(item.execution_mode || "-"))} / ${escapeHtml(capabilityLabel(item.capability || "-"))}</strong>
                                <div class="cell-sub">${escapeHtml(formatDateTime(item.created_at))} / ${escapeHtml(item.duration_ms || 0)} 毫秒 / 尝试 ${escapeHtml(item.attempts || 1)}</div>
                                <div class="cell-sub">${escapeHtml(item.error_message || item.endpoint || "-")}</div>
                              </div>
                              ${
                                item.error_message
                                  ? statusMarkup("部分失败")
                                  : item.execution_mode === "remote"
                                    ? statusMarkup("已完成")
                                    : statusMarkup("默认")
                              }
                            </div>
                          `
                        ).join("")
                      : `<div class="cell-sub">当前能力服务还没有调用记录。</div>`
                  }
                </div>
              </div>
            `
            : ""
        }
      </aside>
      </div>
    </div>
  `;
}

function renderAutomation(store) {
  const selected =
    store.data.sourceStrategies.find((item) => item.id === store.selectedIds.strategy) ||
    store.data.sourceStrategies[0];
  const latestRuns = (store.data.automationRuns || []).filter(
    (item) => item.strategy_id === selected?.id
  );
  const selectedRun =
    latestRuns.find((item) => item.id === store.selectedIds.automationRun) || latestRuns[0] || null;
  const enabledCount = (store.data.sourceStrategies || []).filter((item) => item.is_enabled).length;
  const autoPublishCount = (store.data.sourceStrategies || []).filter(
    (item) => item.auto_create_publish_task
  ).length;
  const failingCount = (store.data.sourceStrategies || []).filter(
    (item) => Number(item.consecutive_failures || 0) > 0
  ).length;

  return `
    <div class="stack-blocks">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">自动运营总览</h3>
            <div class="panel-note">聚合调度状态、自动审核和自动分发开关，便于交付后做运维巡检。</div>
          </div>
          <button class="secondary-btn" data-action="run-scheduler-tick">立即轮询</button>
        </div>
        <div class="grid-three">
          <article class="surface metric-card">
            <div class="metric-label">启用策略</div>
            <div class="metric-value" style="font-size:38px">${escapeHtml(enabledCount)}</div>
            <div class="cell-sub">当前共 ${escapeHtml((store.data.sourceStrategies || []).length)} 条来源策略</div>
          </article>
          <article class="surface metric-card">
            <div class="metric-label">自动分发开启</div>
            <div class="metric-value" style="font-size:38px">${escapeHtml(autoPublishCount)}</div>
            <div class="cell-sub">可直接进入发布任务的策略数</div>
          </article>
          <article class="surface metric-card">
            <div class="metric-label">失败策略</div>
            <div class="metric-value" style="font-size:38px">${escapeHtml(failingCount)}</div>
            <div class="cell-sub">连续失败大于 0 的策略需要人工排查</div>
          </article>
        </div>
      </section>
      <div class="layout-split">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">自动运营策略</h3>
            <div class="panel-note">配置调度、审核守门规则和自动分发默认项，让来源策略持续运行。</div>
          </div>
        </div>
        ${tableMarkup(
          ["策略", "调度", "审核策略", "自动发布", "默认渠道", "状态"],
          store.data.sourceStrategies.map(
            (item) => `
              <tr data-select-strategy="${item.id}">
                <td><div class="cell-title">${escapeHtml(item.name)}</div><div class="cell-sub">${escapeHtml(item.source_scope_label || item.source_scope)}</div></td>
                <td>${escapeHtml(item.schedule_mode_label || item.schedule_mode || "-")}</td>
                <td>${escapeHtml(item.review_policy_label || item.review_policy || "-")}</td>
                <td>${statusMarkup(item.auto_create_publish_task ? "启用中" : "手动")}</td>
                <td>${escapeHtml(store.data.channels.find((channel) => channel.id === item.default_channel_id)?.channel_name || "-")}</td>
                <td>${statusMarkup(item.is_enabled ? "正常" : "停用")}</td>
              </tr>
            `
          )
        )}
      </section>
      <aside class="surface drawer" data-settings-panel="strategy">
        ${
          selected
            ? `
              <div class="drawer-section">
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.name)}</div>
                <div class="chip-row" style="margin-top:12px">
                  ${statusMarkup(selected.is_enabled ? "正常" : "停用")}
                  <span class="status-pill">${escapeHtml(selected.schedule_mode_label || selected.schedule_mode)}</span>
                  <span class="status-pill">${escapeHtml(selected.review_policy_label || selected.review_policy)}</span>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-field full">
                  <label>策略名称</label>
                  <input data-strategy-field="name" value="${escapeHtml(selected.name)}" />
                </div>
                <div class="form-field">
                  <label>调度方式</label>
                  <select data-strategy-field="schedule_mode">
                    <option value="manual" ${selected.schedule_mode === "manual" ? "selected" : ""}>手动</option>
                    <option value="hourly" ${selected.schedule_mode === "hourly" ? "selected" : ""}>每小时</option>
                    <option value="daily" ${selected.schedule_mode === "daily" ? "selected" : ""}>每日</option>
                    <option value="twice_daily" ${selected.schedule_mode === "twice_daily" ? "selected" : ""}>每日两轮</option>
                    <option value="always_on" ${selected.schedule_mode === "always_on" ? "selected" : ""}>持续运行</option>
                    <option value="cron_expression" ${selected.schedule_mode === "cron_expression" ? "selected" : ""}>自定义定时</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>启用状态</label>
                  <select data-strategy-field="is_enabled">
                    <option value="true" ${selected.is_enabled ? "selected" : ""}>启用</option>
                    <option value="false" ${!selected.is_enabled ? "selected" : ""}>停用</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>定时表达式</label>
                  <input data-strategy-field="cron_expression" value="${escapeHtml(selected.cron_expression || "")}" />
                </div>
                <div class="form-field">
                  <label>自动生成草稿</label>
                  <select data-strategy-field="auto_generate_articles">
                    <option value="true" ${selected.auto_generate_articles ? "selected" : ""}>开启</option>
                    <option value="false" ${!selected.auto_generate_articles ? "selected" : ""}>关闭</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>自动提交审核</label>
                  <select data-strategy-field="auto_submit_review">
                    <option value="true" ${selected.auto_submit_review ? "selected" : ""}>开启</option>
                    <option value="false" ${!selected.auto_submit_review ? "selected" : ""}>关闭</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>审核策略</label>
                  <select data-strategy-field="review_policy">
                    <option value="manual_first" ${selected.review_policy === "manual_first" ? "selected" : ""}>先审后发</option>
                    <option value="auto_pass" ${selected.review_policy === "auto_pass" ? "selected" : ""}>规则通过自动审核</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>自动创建发布任务</label>
                  <select data-strategy-field="auto_create_publish_task">
                    <option value="true" ${selected.auto_create_publish_task ? "selected" : ""}>开启</option>
                    <option value="false" ${!selected.auto_create_publish_task ? "selected" : ""}>关闭</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>发布方式</label>
                  <select data-strategy-field="publish_mode">
                    <option value="scheduled" ${selected.publish_mode === "scheduled" ? "selected" : ""}>定时</option>
                    <option value="immediate" ${selected.publish_mode === "immediate" ? "selected" : ""}>立即</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>默认发布渠道</label>
                  <select data-strategy-field="default_channel_id">
                    ${store.data.channels
                      .map(
                        (item) =>
                          `<option value="${item.id}" ${selected.default_channel_id === item.id ? "selected" : ""}>${escapeHtml(item.channel_name)}</option>`
                      )
                      .join("")}
                  </select>
                </div>
                <div class="form-field">
                  <label>最小字数</label>
                  <input type="number" min="200" data-strategy-field="min_word_count" value="${escapeHtml(selected.min_word_count || 800)}" />
                </div>
                <div class="form-field">
                  <label>必带术语命中数</label>
                  <input type="number" min="0" data-strategy-field="required_terms_count" value="${escapeHtml(selected.required_terms_count || 0)}" />
                </div>
                <div class="form-field">
                  <label>命中禁用词即阻断</label>
                  <select data-strategy-field="block_on_forbidden_terms">
                    <option value="true" ${selected.block_on_forbidden_terms ? "selected" : ""}>开启</option>
                    <option value="false" ${!selected.block_on_forbidden_terms ? "selected" : ""}>关闭</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>允许权威媒体直发</label>
                  <select data-strategy-field="allow_authority_direct_publish">
                    <option value="false" ${!selected.allow_authority_direct_publish ? "selected" : ""}>关闭</option>
                    <option value="true" ${selected.allow_authority_direct_publish ? "selected" : ""}>开启</option>
                  </select>
                </div>
              </div>
              <div class="drawer-section">
                <h4>调度状态</h4>
                <div class="info-list">
                  <div class="info-row"><span>上次执行</span><strong>${escapeHtml(formatDateTime(selected.last_run_at))}</strong></div>
                  <div class="info-row"><span>下次执行</span><strong>${escapeHtml(formatDateTime(selected.next_run_at))}</strong></div>
                  <div class="info-row"><span>连续失败</span><strong>${escapeHtml(selected.consecutive_failures || 0)}</strong></div>
                </div>
              </div>
              <div class="drawer-section">
                <div class="actions-row">
                  <button class="secondary-btn" data-action="run-source-strategy" data-strategy-id="${escapeHtml(selected.id)}">立即运行</button>
                </div>
              </div>
              <div class="drawer-section">
                <h4>最近执行记录</h4>
                <div class="stack">
                  ${
                    latestRuns.length
                      ? latestRuns
                          .slice(0, 3)
                          .map(
                            (item) => `
                              <div class="funnel-step" data-select-automation-run="${item.id}">
                                <div>
                                  <strong style="font-size:15px">${escapeHtml(item.status_label || item.status)}</strong>
                                  <div class="cell-sub">${escapeHtml(formatDateTime(item.created_at))} / 问题 ${escapeHtml(item.generated_question_count || 0)} / 草稿 ${escapeHtml(item.generated_article_count || 0)}</div>
                                </div>
                                ${
                                  item.status === "failed" || item.status === "partial_failed"
                                    ? `<button class="secondary-btn" data-action="retry-automation-run" data-run-id="${escapeHtml(item.id)}">重试</button>`
                                    : statusMarkup(item.status_label || item.status)
                                }
                              </div>
                            `
                          )
                          .join("")
                      : `<div class="cell-sub">该策略还没有执行记录。</div>`
                  }
                </div>
              </div>
              <div class="drawer-section">
                <h4>执行复盘</h4>
                ${
                  selectedRun
                    ? `
                      <div class="info-list">
                        <div class="info-row"><span>执行时间</span><strong>${escapeHtml(formatDateTime(selectedRun.created_at))}</strong></div>
                        <div class="info-row"><span>新增问题</span><strong>${escapeHtml(selectedRun.generated_question_count || 0)}</strong></div>
                        <div class="info-row"><span>生成选题</span><strong>${escapeHtml(selectedRun.generated_topic_count || 0)}</strong></div>
                        <div class="info-row"><span>生成草稿</span><strong>${escapeHtml(selectedRun.generated_article_count || 0)}</strong></div>
                        <div class="info-row"><span>自动通过</span><strong>${escapeHtml(selectedRun.auto_passed_count || 0)}</strong></div>
                        <div class="info-row"><span>待审核</span><strong>${escapeHtml(selectedRun.review_pending_count || 0)}</strong></div>
                        <div class="info-row"><span>发布任务</span><strong>${escapeHtml(selectedRun.created_publish_task_id || "-")}</strong></div>
                      </div>
                      <div class="stack" style="margin-top:14px">
                        <div>
                          <h4>步骤时间线</h4>
                          ${renderAutomationRunSteps(selectedRun.steps || [])}
                        </div>
                      </div>
                      <div class="stack" style="margin-top:14px">
                        ${(selectedRun.event_logs || [])
                          .map(
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
                          )
                          .join("")}
                      </div>
                    `
                    : `<div class="cell-sub">当前策略还没有可复盘的执行记录。</div>`
                }
              </div>
            `
            : ""
        }
      </aside>
      </div>
    </div>
  `;
}
