import {
  escapeHtml,
  executionModeLabel,
  formatDateTime,
  statusMarkup,
  subtabMarkup,
  tableMarkup
} from "../utils.js";
import { getPublishTaskActionState } from "../experience-utils.js?v=20260418-3";

function payloadPreviewMarkup(payload) {
  if (!payload) {
    return '<div class="cell-sub">当前任务项还没有生成渠道载荷。</div>';
  }
  return `<pre class="code-panel">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
}

function renderPublishingCalendar(tasks, channels) {
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">发布日历</h3>
          <div class="panel-note">按排期、渠道和执行状态查看待发布任务</div>
        </div>
      </div>
      ${tableMarkup(
        ["日期", "时间", "任务", "渠道", "状态"],
        tasks.map((task) => {
          const channelName = channels.find((item) => item.id === task.channel_id)?.channel_name || task.channel_id;
          return `
            <tr data-select-task="${escapeHtml(task.id)}">
              <td>${escapeHtml(task.calendar_date || (task.scheduled_at || "").slice(0, 10) || "-")}</td>
              <td>${escapeHtml(task.calendar_slot_label || (task.scheduled_at || "").slice(11, 16) || "-")}</td>
              <td>
                <div class="cell-title">${escapeHtml(task.name)}</div>
                <div class="cell-sub">${escapeHtml(task.publish_mode_label || task.publish_mode || "-")} / ${escapeHtml(task.total_count || 0)} 篇</div>
              </td>
              <td>${escapeHtml(channelName)}</td>
              <td>${statusMarkup(task.status_label || task.status)}</td>
            </tr>
          `;
        })
      )}
    </section>
  `;
}

function renderPostVariants(variants = []) {
  if (!variants.length) {
    return '<div class="cell-sub">当前任务项还没有内容变体。</div>';
  }

  return tableMarkup(
    ["变体", "标题", "摘要", "状态"],
    variants.map(
      (variant) => `
        <tr>
          <td>${escapeHtml(variant.variant_label || variant.variant_type || "-")}</td>
          <td>${escapeHtml(variant.title || "-")}</td>
          <td>${escapeHtml(variant.summary || "-")}</td>
          <td>${statusMarkup(variant.status_label || variant.status)}</td>
        </tr>
      `
    )
  );
}

function renderReadinessChecks(checks = []) {
  if (!checks.length) {
    return '<div class="cell-sub">当前任务项还没有就绪检查。</div>';
  }

  return tableMarkup(
    ["检查项", "结果", "说明"],
    checks.map(
      (check) => `
        <tr>
          <td>${escapeHtml(check.label || check.key || "-")}</td>
          <td>${statusMarkup(check.status_label || check.status)}</td>
          <td>${escapeHtml(check.message || "-")}</td>
        </tr>
      `
    )
  );
}

function renderApprovalSteps(steps = []) {
  if (!steps.length) {
    return '<div class="cell-sub">当前任务没有审批步骤。</div>';
  }

  return tableMarkup(
    ["审批步骤", "审批人", "状态", "备注"],
    steps.map(
      (step) => `
        <tr>
          <td>${escapeHtml(step.step_label || "-")}</td>
          <td>${escapeHtml(step.approver_name || step.approver_id || "-")}</td>
          <td>${statusMarkup(step.status_label || step.status || "-")}</td>
          <td>${escapeHtml(step.note || step.approved_at || "-")}</td>
        </tr>
      `
    )
  );
}

export function renderDistribution(store) {
  const tab = store.tabs.distribution;
  const query = (store.filters.distribution.query || "").trim().toLowerCase();
  const status = store.filters.distribution.status || "all";
  const filteredTasks = store.data.publishTasks.filter((item) => {
    const channelName =
      store.data.channels.find((channel) => channel.id === item.channel_id)?.channel_name || "";
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      channelName.toLowerCase().includes(query);
    const matchesStatus = status === "all" || item.status === status;
    return matchesQuery && matchesStatus;
  });
  const filteredRecords = store.data.publishRecords.filter((item) => {
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.channel_name.toLowerCase().includes(query);
    const matchesStatus = status === "all" || item.status === status;
    return matchesQuery && matchesStatus;
  });
  const filteredChannels = store.data.channels.filter((item) => {
    if (!query) return true;
    return (
      item.channel_name.toLowerCase().includes(query) ||
      String(item.account_name || "").toLowerCase().includes(query)
    );
  });
  return `
    <section class="surface toolbar">
      <div class="subtabs">
        ${subtabMarkup(tab, "tasks", "发布任务", "distribution")}
        ${subtabMarkup(tab, "channels", "渠道账号", "distribution")}
        ${subtabMarkup(tab, "records", "发布记录", "distribution")}
      </div>
      <div class="toolbar-row">
        <div class="toolbar-left">
          <input class="mini-search" data-distribution-search placeholder="搜索任务、文章或渠道" value="${escapeHtml(store.filters.distribution.query)}" />
          <button class="filter-pill ${status === "all" ? "active" : ""}" data-action="set-distribution-status" data-filter-value="all">全部状态</button>
          <button class="filter-pill ${status === "running" ? "active" : ""}" data-action="set-distribution-status" data-filter-value="running">运行中</button>
          <button class="filter-pill ${status === "queued" ? "active" : ""}" data-action="set-distribution-status" data-filter-value="queued">排队中</button>
          <button class="filter-pill ${status === "partial_failed" ? "active" : ""}" data-action="set-distribution-status" data-filter-value="partial_failed">部分失败</button>
          <button class="filter-pill ${status === "published" ? "active" : ""}" data-action="set-distribution-status" data-filter-value="published">已发布</button>
          <button class="filter-pill ${status === "failed" ? "active" : ""}" data-action="set-distribution-status" data-filter-value="failed">失败</button>
        </div>
        <div class="toolbar-right">
          <button class="ghost-btn" data-action="reset-distribution-filters">重置筛选</button>
          <button class="ghost-btn" disabled title="导出能力即将开放">导出结果</button>
          <button class="primary-btn" data-action="open-publish-panel">创建发布任务</button>
        </div>
      </div>
    </section>
    ${tab === "tasks" ? renderTasks(store, filteredTasks) : ""}
    ${tab === "channels" ? renderChannels(filteredChannels) : ""}
    ${tab === "records" ? renderRecords(filteredRecords) : ""}
  `;
}

function renderTasks(store, tasks) {
  const selected = tasks.find((item) => item.id === store.selectedIds.task) || tasks[0];
  const selectedTask = store.data.publishTasks.find((item) => item.id === selected?.id) || selected || null;
  const selectedItems = selectedTask?.items || [];
  const actionState = getPublishTaskActionState(selectedTask);
  if (!tasks.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有发布任务</h3>
        <p>可以重置筛选，或者新建一个发布任务继续验证分发链路。</p>
      </div>
    `;
  }
  return `
    <div class="stack-blocks">
      ${renderPublishingCalendar(tasks, store.data.channels)}
      <div class="layout-split">
        <section class="surface panel">
          ${tableMarkup(
            ["任务名称", "渠道", "内容数", "发布模式", "执行时间", "审批", "状态"],
            tasks.map(
              (task) => `
                <tr data-select-task="${task.id}">
                  <td>${escapeHtml(task.name)}</td>
                  <td>${escapeHtml(store.data.channels.find((item) => item.id === task.channel_id)?.channel_name || task.channel_id)}</td>
                  <td>${escapeHtml(task.total_count)}</td>
                  <td>${escapeHtml(task.publish_mode_label || task.publish_mode)}</td>
                  <td>${escapeHtml((task.scheduled_at || "").replace("T", " ").slice(5, 16))}</td>
                  <td>${statusMarkup(task.approval_status_label || task.approval_status || "-")}</td>
                  <td>${statusMarkup(task.status_label || task.status)}</td>
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
                <div class="cell-title" style="font-size:22px">${escapeHtml(selected.name)}</div>
                <div class="chip-row" style="margin-top:12px">
                  ${statusMarkup(selected.status_label || selected.status)}
                  <span class="status-pill">${escapeHtml(store.data.channels.find((item) => item.id === selected.channel_id)?.channel_name || "")}</span>
                </div>
              </div>
              <div class="drawer-section">
                <h4>任务摘要</h4>
                <div class="info-list">
                  <div class="info-row"><span>总文章数</span><strong>${escapeHtml(selected.total_count)}</strong></div>
                  <div class="info-row"><span>成功数</span><strong>${escapeHtml(selected.success_count)}</strong></div>
                  <div class="info-row"><span>失败数</span><strong>${escapeHtml(selected.failed_count)}</strong></div>
                  <div class="info-row"><span>人工接管</span><strong>${escapeHtml(selected.manual_takeover_count || 0)}</strong></div>
                  <div class="info-row"><span>适配器</span><strong>${escapeHtml(selected.adapter_label || selected.channel?.adapter_label || "-")}</strong></div>
                  <div class="info-row"><span>计划时间</span><strong>${escapeHtml(formatDateTime(selected.scheduled_at))}</strong></div>
                  <div class="info-row"><span>审批状态</span><strong>${escapeHtml(selected.approval_status_label || selected.approval_status || "-")}</strong></div>
                </div>
              </div>
              <div class="drawer-section">
                <h4>审批流</h4>
                ${renderApprovalSteps(selected.approval_steps)}
              </div>
              <div class="drawer-section">
                <h4>任务明细</h4>
                <div class="stack">
                  ${
                    selectedItems.length
                      ? selectedItems.map((item) => `
                        <div class="funnel-step" style="display:block">
                          <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start">
                            <div>
                              <strong style="font-size:15px">${escapeHtml(item.article?.title || item.article_id)}</strong>
                              <div class="cell-sub">${escapeHtml(item.template_label || "-")} / ${escapeHtml(item.adapter_label || "-")} / 尝试 ${escapeHtml(item.attempt_count || 0)} 次</div>
                              <div class="cell-sub">${escapeHtml(item.failure_message || item.published_url || item.channel?.channel_name || "-")}</div>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end">
                              ${statusMarkup(item.status_label || item.status)}
                              ${item.readiness_status_label ? statusMarkup(item.readiness_status_label) : ""}
                              ${
                                item.status === "failed"
                                  ? `<button class="secondary-btn" data-action="task-item-takeover" data-task-id="${escapeHtml(selected.id)}" data-item-id="${escapeHtml(item.id)}" data-takeover-mode="manual_publish">人工发布完成</button>
                                     <button class="ghost-btn" data-action="task-item-takeover" data-task-id="${escapeHtml(selected.id)}" data-item-id="${escapeHtml(item.id)}" data-takeover-mode="requeue">恢复排队</button>`
                                  : ""
                              }
                            </div>
                          </div>
                          <div style="margin-top:12px">
                            ${payloadPreviewMarkup(item.payload_preview)}
                          </div>
                          <div style="margin-top:12px">
                            <div class="cell-title" style="margin-bottom:8px">内容变体</div>
                            ${renderPostVariants(item.post_variants)}
                          </div>
                          <div style="margin-top:12px">
                            <div class="cell-title" style="margin-bottom:8px">就绪检查</div>
                            ${renderReadinessChecks(item.readiness_checks)}
                          </div>
                        </div>
                      `).join("")
                      : `<div class="cell-sub">当前任务还没有明细项。</div>`
                  }
                </div>
              </div>
              <div class="drawer-section">
                <div class="actions-row">
                  <button class="secondary-btn" data-action="task-start" data-task-id="${escapeHtml(selected.id)}" ${actionState.canStart ? "" : `disabled title="${escapeHtml(actionState.startReason)}"`}>启动任务</button>
                  <button class="secondary-btn" data-action="task-approve" data-task-id="${escapeHtml(selected.id)}" data-approval-action="approve" ${actionState.canApprove ? "" : "disabled"}>审批通过</button>
                  <button class="ghost-btn" data-action="task-approve" data-task-id="${escapeHtml(selected.id)}" data-approval-action="reject" ${actionState.canApprove ? "" : "disabled"}>退回审批</button>
                  <button class="secondary-btn" data-action="task-retry" data-task-id="${escapeHtml(selected.id)}" ${actionState.canRetry ? "" : `disabled title="${escapeHtml(actionState.retryReason)}"`}>重试失败项</button>
                  <button class="ghost-btn" data-action="task-cancel" data-task-id="${escapeHtml(selected.id)}" ${actionState.canCancel ? "" : `disabled title="${escapeHtml(actionState.cancelReason)}"`}>取消任务</button>
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

function renderChannels(channels) {
  if (!channels.length) {
    return `
      <div class="empty-state">
        <h3>没有匹配的渠道账号</h3>
        <p>当前搜索条件下没有渠道记录。</p>
      </div>
    `;
  }
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">渠道账号</h3>
          <div class="panel-note">发布能力优先保证官网、知乎和公众号</div>
        </div>
        <button class="primary-btn" data-action="create-channel-config">新增渠道</button>
      </div>
      ${tableMarkup(
        ["渠道类型", "账号名称", "适配器", "认证状态", "默认作者", "最近同步"],
        channels.map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.channel_name)}</td>
              <td>${escapeHtml(item.account_name || "-")}</td>
              <td>${escapeHtml(item.adapter_label || "-")}</td>
              <td>${statusMarkup(item.auth_status_label || item.auth_status)}</td>
              <td>${escapeHtml(item.default_author || "-")}</td>
              <td>${escapeHtml(formatDateTime(item.last_synced_at))}</td>
            </tr>
          `
        )
      )}
    </section>
  `;
}

function renderRecords(records) {
  if (!records.length) {
    return `
      <div class="empty-state">
        <h3>当前筛选下没有发布记录</h3>
        <p>可以切换状态筛选，或者先执行一个发布任务。</p>
      </div>
    `;
  }
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">发布记录</h3>
          <div class="panel-note">查看历史结果和失败原因</div>
        </div>
      </div>
      ${tableMarkup(
        ["发布时间", "文章标题", "渠道", "结果状态", "模板", "执行方式", "失败原因"],
        records.map(
          (item) => `
            <tr>
              <td>${escapeHtml(formatDateTime(item.published_at))}</td>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.channel_name)}</td>
              <td>${statusMarkup(item.status_label || item.status)}</td>
              <td>${escapeHtml(item.template_label || "-")}</td>
              <td>${escapeHtml(executionModeLabel(item.execution_mode || "-"))}</td>
              <td>${escapeHtml(item.failure_reason_label || item.failure_message || item.published_url || "-")}</td>
            </tr>
          `
        )
      )}
    </section>
  `;
}
