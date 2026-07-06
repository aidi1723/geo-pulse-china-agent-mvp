import { escapeHtml, statusMarkup, tableMarkup } from "../utils.js";

export function renderBilling(data) {
  const summary = data.billingSummary || { quotas: {}, usage: {} };
  return `
    <div class="grid-two">
      <section class="surface panel">
        <div class="panel-head">
        <div>
          <h3 class="panel-title">当前套餐</h3>
          <div class="panel-note">${escapeHtml(summary.plan_name || "专业版")} / 月付</div>
        </div>
        <button class="primary-btn" data-action="upgrade-plan" data-plan-id="single_user_pro">升级套餐</button>
      </div>
        <div class="grid-cards" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
          ${[
            ["关键词额度", summary.quotas.keyword_crawl, summary.usage.keyword_crawl],
            ["生成额度", summary.quotas.article_generation, summary.usage.article_generation],
            ["发布额度", summary.quotas.publish, summary.usage.publish]
          ]
            .map(
              ([label, total, used]) => `
                <article class="surface metric-card" style="padding:20px">
                  <div class="metric-label">${escapeHtml(label)}</div>
                  <div class="metric-value" style="font-size:34px">${escapeHtml(total ?? "-")}</div>
                  <div class="cell-sub">本月已用 ${escapeHtml(used ?? "-")}</div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">用量摘要</h3>
            <div class="panel-note">当前按抓取、生成、发布三个维度计量</div>
          </div>
        </div>
        <div class="stack">
          <div class="funnel-step"><strong>关键词抓取</strong><span class="status-pill status-primary">${escapeHtml(summary.usage.keyword_crawl)} / ${escapeHtml(summary.quotas.keyword_crawl)}</span></div>
          <div class="funnel-step"><strong>文章生成</strong><span class="status-pill status-primary">${escapeHtml(summary.usage.article_generation)} / ${escapeHtml(summary.quotas.article_generation)}</span></div>
          <div class="funnel-step"><strong>分发发布</strong><span class="status-pill status-primary">${escapeHtml(summary.usage.publish)} / ${escapeHtml(summary.quotas.publish)}</span></div>
        </div>
      </section>
    </div>
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">账单记录</h3>
          <div class="panel-note">第一期只保留基础账单和开票状态</div>
        </div>
      </div>
      ${tableMarkup(
        ["账单编号", "账单周期", "金额", "支付状态", "开票状态"],
        data.invoices.map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.id)}</td>
              <td>${escapeHtml(item.period)}</td>
              <td>¥${escapeHtml(item.amount)}</td>
              <td>${statusMarkup(item.payment_status_label || item.payment_status)}</td>
              <td>${statusMarkup(item.invoice_status_label || item.invoice_status)}</td>
            </tr>
          `
        )
      )}
    </section>
  `;
}
