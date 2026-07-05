import { escapeHtml, formatDateTime, schedulerStatusLabel, statusMarkup, tableMarkup } from "../utils.js";

export function renderDashboard(data) {
  const summary = data.dashboardSummary || {};
  const scheduler = data.runtimeStatus?.scheduler || {};
  const providers = data.runtimeStatus?.providers || {};
  const activeKeywordProvider =
    providers.capabilities?.find((item) => item.capability === "keyword_discovery")?.active_provider_label ||
    providers.active_provider_ids?.keyword_discovery ||
    "-";
  const activeArticleProvider =
    providers.capabilities?.find((item) => item.capability === "article_generation")?.active_provider_label ||
    providers.active_provider_ids?.article_generation ||
    "-";
  const metrics = [
    { label: "本周新增关键词", value: summary.weekly_new_keywords ?? "-", foot: "较上周新增 22 个高质量词", delta: "+18%", up: true, action: 'data-nav="keywords"', cta: "查看问题库" },
    { label: "高优先级关键词", value: summary.high_priority_keywords ?? "-", foot: "18 个词可直接进入选题", delta: "+9%", up: true, action: 'data-action="open-keyword-view" data-keyword-tab="opportunities"', cta: "进入意图簇" },
    { label: "本周生成文章", value: summary.weekly_generated_articles ?? "-", foot: "12 篇已通过审核", delta: "+31%", up: true, action: 'data-action="open-content-view" data-content-tab="articles" data-content-status="draft"', cta: "查看草稿" },
    { label: "本周发布成功率", value: `${summary.weekly_publish_success_rate ?? "-"}%`, foot: "知乎与官网双渠道稳定", delta: "-2%", up: false, action: 'data-action="open-distribution-view" data-distribution-tab="records" data-distribution-status="published"', cta: "查看发布记录" }
  ];

  return `
    <section class="surface hero-panel">
      <div>
        <div class="hero-tag">中国智能体内容增长中枢</div>
        <h2 class="hero-title">围绕自然语言问答意图，持续抓词、写稿、分发并监控结果</h2>
        <div class="hero-note">当前系统已经覆盖关键词发现、选题规划、文章生成、渠道分发与失败接管，可直接作为中文行业内容运营后台使用。</div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <span>当前抓词能力</span>
          <strong>${escapeHtml(activeKeywordProvider)}</strong>
        </div>
        <div class="hero-stat">
          <span>当前写稿能力</span>
          <strong>${escapeHtml(activeArticleProvider)}</strong>
        </div>
        <div class="hero-stat">
          <span>自动调度状态</span>
          <strong>${escapeHtml(schedulerStatusLabel(scheduler.status || "-"))}</strong>
        </div>
      </div>
    </section>
    <div class="grid-cards">
      ${metrics
        .map(
          (metric) => `
            <article class="surface metric-card">
              <div class="metric-label">${escapeHtml(metric.label)}</div>
              <div class="metric-value">${escapeHtml(metric.value)}</div>
              <div class="metric-foot">
                <span class="trend ${metric.up ? "up" : "down"}">${metric.delta} ${metric.up ? "↑" : "↓"}</span>
                <span>${escapeHtml(metric.foot)}</span>
              </div>
              <div class="actions-row" style="margin-top:16px">
                <button class="secondary-btn" ${metric.action}>${escapeHtml(metric.cta)}</button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
    <div class="grid-two">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">自动运营引擎</h3>
            <div class="panel-note">观察本地调度器是否在稳定轮询和派发到期策略。</div>
          </div>
          <button class="secondary-btn" data-nav="settings" data-settings-tab="automation">查看策略</button>
        </div>
        <div class="info-list">
          <div class="info-row"><span>引擎状态</span><strong>${escapeHtml(scheduler.status || "-")}</strong></div>
          <div class="info-row"><span>当前到期策略</span><strong>${escapeHtml(scheduler.due_strategy_count ?? "-")}</strong></div>
          <div class="info-row"><span>下一个到期时间</span><strong>${escapeHtml(formatDateTime(scheduler.next_due_at))}</strong></div>
          <div class="info-row"><span>上次轮询</span><strong>${escapeHtml(formatDateTime(scheduler.last_tick_at))}</strong></div>
          <div class="info-row"><span>累计派发</span><strong>${escapeHtml(scheduler.total_dispatched_runs ?? "-")}</strong></div>
        </div>
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">自动运营资产</h3>
            <div class="panel-note">交付后最关键的是可持续积累问题、文章和执行记录。</div>
          </div>
        </div>
        <div class="info-list">
          <div class="info-row"><span>问题总数</span><strong>${escapeHtml(data.runtimeStatus?.counts?.keywords ?? "-")}</strong></div>
          <div class="info-row"><span>选题总数</span><strong>${escapeHtml(data.runtimeStatus?.counts?.topics ?? "-")}</strong></div>
          <div class="info-row"><span>文章总数</span><strong>${escapeHtml(data.runtimeStatus?.counts?.articles ?? "-")}</strong></div>
          <div class="info-row"><span>策略总数</span><strong>${escapeHtml(data.runtimeStatus?.counts?.strategies ?? "-")}</strong></div>
          <div class="info-row"><span>执行记录总数</span><strong>${escapeHtml(data.runtimeStatus?.counts?.automation_runs ?? "-")}</strong></div>
        </div>
      </section>
    </div>
    <div class="grid-two">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">关键词趋势图</h3>
            <div class="panel-note">最近 7 天新增词与高分词趋势</div>
          </div>
          <div class="chip-row">
            <span class="chip active">7 天</span>
            <span class="chip">30 天</span>
          </div>
        </div>
        <div class="chart">
          <div class="chart-bars">
            ${data.keywordTrend
              .map(
                (item) => `
                  <div class="bar-group">
                    <div class="bar" style="height:${item.new_keywords}%"></div>
                    <div class="bar soft" style="height:${item.high_score_keywords}%"></div>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="chart-labels">
            ${data.keywordTrend
              .map((item) => `<span>${escapeHtml(item.date.slice(5).replace("-", "/"))}</span>`)
              .join("")}
          </div>
        </div>
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">内容生产漏斗</h3>
            <div class="panel-note">从关键词到发布的当前阶段分布</div>
          </div>
        </div>
        <div class="funnel">
          ${data.contentFunnel
            .map(
              (step) => `
                <div class="funnel-step">
                  <div>
                    <strong>${escapeHtml(step.label)}</strong>
                    <div class="cell-sub">当前阶段的实际数量</div>
                  </div>
                  <span class="status-pill status-primary">${escapeHtml(step.value)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </section>
    </div>
    <div class="grid-two">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">重点关键词机会</h3>
            <div class="panel-note">当前最值得进入选题的高优先级词</div>
          </div>
          <button class="secondary-btn" data-nav="keywords" data-keywords-tab="opportunities">进入机会池</button>
        </div>
        ${tableMarkup(
          ["关键词", "分类", "优先级分", "推荐内容", "状态", "操作"],
          data.topKeywords.slice(0, 4).map(
            (item) => `
              <tr>
                <td>
                  <div class="cell-title">${escapeHtml(item.keyword)}</div>
                  <div class="cell-sub">${escapeHtml(item.source_label || item.source)}</div>
                </td>
                <td>${escapeHtml(item.category_label || item.category)}</td>
                <td><span class="status-pill status-primary">${escapeHtml(item.priority_score)}</span></td>
                <td>${escapeHtml(item.recommended_content_type_label || item.recommended_content_type)}</td>
                <td>${statusMarkup(item.status_label || item.status)}</td>
                <td><button class="secondary-btn" data-nav="keywords" data-keywords-tab="keywords" data-keyword-id="${item.id}">查看问题</button></td>
              </tr>
            `
          )
        )}
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">最近发布日志</h3>
            <div class="panel-note">已发布与失败项快速查看</div>
          </div>
          <button class="secondary-btn" data-nav="distribution" data-distribution-tab="records">查看发布任务</button>
        </div>
        ${tableMarkup(
          ["时间", "文章", "渠道", "状态", "外链"],
          data.recentPublishes.slice(0, 4).map(
            (item) => `
              <tr>
                <td>${escapeHtml((item.published_at || "待执行").replace("T", " ").slice(5, 16))}</td>
                <td><div class="cell-title">${escapeHtml(item.title)}</div></td>
                <td>${escapeHtml(item.channel_name)}</td>
                <td>${statusMarkup(item.status_label || item.status)}</td>
                <td>${escapeHtml(item.published_url || "-")}</td>
              </tr>
            `
          )
        )}
      </section>
    </div>
  `;
}
