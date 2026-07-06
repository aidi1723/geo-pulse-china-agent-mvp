import { escapeHtml, metricCard, statusMarkup, subtabMarkup, tableMarkup } from "../utils.js";

function visibilityMetricCards(summary = {}) {
  return [
    ["追踪查询", summary.tracked_queries],
    ["Top 10 查询", summary.top10_queries],
    ["引用次数", summary.citation_mentions],
    ["平均可见度", summary.average_visibility_score]
  ];
}

function campaignMetricCards(summary = {}) {
  return [
    ["活跃分群", summary.active_segments],
    ["运行活动", summary.active_campaigns],
    ["触达人群", summary.total_recipients],
    ["平均点击率", `${summary.average_click_rate ?? "-"}%`]
  ];
}

function renderAudienceSegmentTable(items = []) {
  return tableMarkup(
    ["受众分群", "来源", "人数", "偏好渠道", "状态"],
    items.map(
      (item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.segment_name)}</div>
            <div class="cell-sub">${escapeHtml((item.matched_keywords || []).join(" / ") || "-")}</div>
          </td>
          <td>${escapeHtml(item.source_label || item.source || "-")}</td>
          <td>${escapeHtml(item.member_count ?? 0)}</td>
          <td>${escapeHtml(item.preferred_channel_label || item.preferred_channel || "-")}</td>
          <td>${statusMarkup(item.status_label || item.status || "-")}</td>
        </tr>
      `
    )
  );
}

function renderMarketingCampaignTable(items = []) {
  return tableMarkup(
    ["活动", "分群", "主题", "发送 / 打开 / 点击", "状态"],
    items.map(
      (item) => `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.campaign_name)}</div>
            <div class="cell-sub">${escapeHtml(item.campaign_type_label || item.campaign_type || "-")}</div>
          </td>
          <td>${escapeHtml(item.segment_name || item.segment_id || "-")}</td>
          <td>${escapeHtml(item.subject || "-")}</td>
          <td>${escapeHtml(item.send_count ?? 0)} / ${escapeHtml(item.open_count ?? 0)} / ${escapeHtml(item.click_count ?? 0)}</td>
          <td>${statusMarkup(item.status_label || item.status || "-")}</td>
        </tr>
      `
    )
  );
}

function renderCampaignRunSteps(steps = []) {
  if (!steps.length) {
    return '<div class="cell-sub">当前活动还没有运行步骤。</div>';
  }

  return tableMarkup(
    ["步骤", "状态", "输出"],
    steps.map(
      (step) => `
        <tr>
          <td>${escapeHtml(step.step_label || step.step_type || "-")}</td>
          <td>${statusMarkup(step.status_label || step.status || "-")}</td>
          <td>${escapeHtml(JSON.stringify(step.output_preview || {}))}</td>
        </tr>
      `
    )
  );
}

function renderCampaignRuns(runs = []) {
  const latestRun = runs[0];
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">活动运行</h3>
          <div class="panel-note">记录受众匹配、内容渲染和发送点击指标</div>
        </div>
      </div>
      ${
        runs.length
          ? tableMarkup(
              ["运行", "触发", "发送", "打开", "点击", "状态"],
              runs.map(
                (run) => `
                  <tr>
                    <td>
                      <div class="cell-title">${escapeHtml(run.campaign_name || run.id)}</div>
                      <div class="cell-sub">${escapeHtml(run.started_at || "-")}</div>
                    </td>
                    <td>${escapeHtml(run.trigger_label || run.trigger || "-")}</td>
                    <td>${escapeHtml(run.sent_count || 0)}</td>
                    <td>${escapeHtml(run.open_count || 0)}</td>
                    <td>${escapeHtml(run.click_count || 0)}</td>
                    <td>${statusMarkup(run.status_label || run.status || "-")}</td>
                  </tr>
                `
              )
            )
          : '<div class="cell-sub">当前还没有活动运行。</div>'
      }
      <div style="margin-top:12px">
        <div class="cell-title" style="margin-bottom:8px">最近运行步骤</div>
        ${renderCampaignRunSteps(latestRun?.steps || [])}
      </div>
    </section>
  `;
}

function renderVisibilityQueryTable(items = []) {
  return tableMarkup(
    ["查询", "目标 URL", "引擎", "排名 / 引用", "状态"],
    items.map((item) => {
      const snapshot = item.latest_snapshot || {};
      return `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(item.query)}</div>
            <div class="cell-sub">${escapeHtml(item.source_type_label || item.source_type || "-")}</div>
          </td>
          <td>${escapeHtml(item.target_url || "-")}</td>
          <td>${escapeHtml(item.engine_label || item.engine || "-")}</td>
          <td>${escapeHtml(snapshot.rank_position ? `#${snapshot.rank_position}` : "-")} / ${escapeHtml(snapshot.citation_count ?? 0)} 引用</td>
          <td>${statusMarkup(item.status_label || item.status || "-")}</td>
        </tr>
      `;
    })
  );
}

function renderCompetitorDomainTable(items = []) {
  return tableMarkup(
    ["竞品域名", "来源", "声量", "平均排名", "引用"],
    items.map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.domain)}</td>
          <td>${escapeHtml(item.source_type_label || item.source_type || "-")}</td>
          <td>${escapeHtml(item.share_of_voice ?? 0)}%</td>
          <td>${escapeHtml(item.average_rank ?? "-")}</td>
          <td>${escapeHtml(item.citation_count ?? 0)}</td>
        </tr>
      `
    )
  );
}

function renderVisibilityRunSteps(steps = []) {
  if (!steps.length) {
    return '<div class="cell-sub">当前采集运行没有步骤记录。</div>';
  }

  return tableMarkup(
    ["步骤", "状态", "耗时", "输出"],
    steps.map(
      (step) => `
        <tr>
          <td>${escapeHtml(step.step_label || step.step_type || "-")}</td>
          <td>${statusMarkup(step.status_label || step.status || "-")}</td>
          <td>${escapeHtml(step.latency_ms ?? 0)}ms</td>
          <td>${escapeHtml(JSON.stringify(step.output_preview || {}))}</td>
        </tr>
      `
    )
  );
}

function renderVisibilityCollectionRuns(runs = []) {
  const latestRun = runs[0];
  return `
    <section class="surface panel">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">采集运行</h3>
          <div class="panel-note">记录 SERP、AI 引用和竞品声量采集步骤</div>
        </div>
      </div>
      ${
        runs.length
          ? tableMarkup(
              ["运行", "触发", "查询", "快照", "竞品", "状态"],
              runs.map(
                (run) => `
                  <tr>
                    <td>
                      <div class="cell-title">${escapeHtml(run.name || run.id)}</div>
                      <div class="cell-sub">${escapeHtml(run.started_at || "-")}</div>
                    </td>
                    <td>${escapeHtml(run.trigger_label || run.trigger || "-")}</td>
                    <td>${escapeHtml(run.tracked_query_count || 0)}</td>
                    <td>${escapeHtml(run.snapshots_created || 0)}</td>
                    <td>${escapeHtml(run.competitor_domains_checked || 0)}</td>
                    <td>${statusMarkup(run.status_label || run.status || "-")}</td>
                  </tr>
                `
              )
            )
          : '<div class="cell-sub">当前还没有可见度采集运行。</div>'
      }
      <div style="margin-top:12px">
        <div class="cell-title" style="margin-bottom:8px">最近运行步骤</div>
        ${renderVisibilityRunSteps(latestRun?.steps || [])}
      </div>
    </section>
  `;
}

export function renderAnalytics(store) {
  const tab = store.tabs.analytics;
  const analytics =
    tab === "keywords"
      ? store.data.analyticsKeywords
      : tab === "content"
        ? store.data.analyticsContent
        : tab === "campaigns"
          ? store.data.analyticsCampaigns
        : tab === "visibility"
          ? store.data.analyticsVisibility
          : store.data.analyticsChannels;

  const summary = analytics?.summary || {};
  const cards =
    tab === "keywords"
      ? [
          ["新增关键词", summary.new_keywords],
          ["高分关键词", summary.high_score_keywords],
          ["已采用关键词", summary.adopted_keywords],
          ["关键词采用率", `${summary.adoption_rate ?? "-"}%`]
        ]
      : tab === "content"
        ? [
            ["生成文章数", summary.generated_articles],
            ["审核通过率", `${summary.review_pass_rate ?? "-"}%`],
          ["平均字数", summary.average_word_count],
          ["平均处理时长", `${summary.average_process_hours ?? "-"}h`]
        ]
        : tab === "campaigns"
          ? campaignMetricCards(summary)
        : tab === "visibility"
          ? visibilityMetricCards(summary)
        : [
            ["发布成功率", `${summary.publish_success_rate ?? "-"}%`],
            ["渠道失败率", `${summary.publish_failure_rate ?? "-"}%`],
            ["平均发布时间", `${summary.average_publish_minutes ?? "-"}m`],
            ["外链回写率", `${summary.callback_rate ?? "-"}%`]
          ];

  return `
    <section class="surface toolbar">
      <div class="subtabs">
        ${subtabMarkup(tab, "keywords", "关键词分析", "analytics")}
        ${subtabMarkup(tab, "content", "内容分析", "analytics")}
        ${subtabMarkup(tab, "channels", "渠道分析", "analytics")}
        ${subtabMarkup(tab, "campaigns", "自有活动", "analytics")}
        ${subtabMarkup(tab, "visibility", "外部可见度", "analytics")}
      </div>
      <div class="toolbar-row">
        <div class="toolbar-left">
          <span class="filter-pill active">最近 30 天</span>
          <span class="filter-pill">最近 7 天</span>
        </div>
        <div class="toolbar-right">
          ${
            tab === "campaigns"
              ? `<button class="primary-btn" data-action="campaign-run" data-campaign-id="${escapeHtml(store.data.analyticsCampaigns?.campaigns?.[0]?.id || "")}">运行活动</button>`
              : tab === "visibility"
              ? '<button class="primary-btn" data-action="visibility-collect">运行采集</button>'
              : ""
          }
          <button class="ghost-btn" data-action="export-artifact" data-export-type="analytics_visibility">导出数据</button>
        </div>
      </div>
    </section>
    <div class="grid-cards">
      ${cards.map(([label, value]) => metricCard(label, value ?? "-", "当前统计来自本地演示数据")).join("")}
    </div>
    <div class="grid-two">
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${tab === "keywords" ? "分布趋势" : tab === "content" ? "内容产出趋势" : tab === "campaigns" ? "受众分群" : tab === "visibility" ? "追踪查询" : "渠道成功率"}</h3>
            <div class="panel-note">${tab === "campaigns" ? "按来源、人数和偏好渠道维护自有受众" : tab === "visibility" ? "按目标 URL 观察搜索与答案引擎表现" : "用于判断当前阶段是否跑通"}</div>
          </div>
        </div>
        ${
          tab === "campaigns"
            ? renderAudienceSegmentTable(store.data.analyticsCampaigns?.segments || [])
            : tab === "visibility"
            ? renderVisibilityQueryTable(store.data.analyticsVisibility?.tracked_queries || [])
            : `<div class="chart">
                <div class="chart-bars">
                  ${[38, 54, 48, 62, 81, 73].map((value) => `<div class="bar-group"><div class="bar" style="height:${value}%"></div></div>`).join("")}
                </div>
                <div class="chart-labels"><span>4/11</span><span>4/12</span><span>4/13</span><span>4/14</span><span>4/15</span><span>4/16</span></div>
              </div>`
        }
      </section>
      <section class="surface panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">${tab === "channels" ? "失败原因分布" : tab === "campaigns" ? "活动表现" : tab === "visibility" ? "竞品域名快照" : "重点观察项"}</h3>
            <div class="panel-note">${tab === "campaigns" ? "跟踪发送、打开和点击表现" : tab === "visibility" ? "对比外部声量和 AI 引用占位" : "帮助团队决定下一步动作"}</div>
          </div>
        </div>
        ${
          tab === "campaigns"
            ? renderMarketingCampaignTable(store.data.analyticsCampaigns?.campaigns || [])
            : tab === "visibility"
            ? renderCompetitorDomainTable(store.data.analyticsVisibility?.competitor_domains || [])
            : tab === "channels"
            ? tableMarkup(
                ["原因", "占比", "建议动作"],
                (store.data.analyticsChannels?.failure_breakdown || []).map(
                  (item) => `
                    <tr>
                      <td>${item.reason}</td>
                      <td>${item.ratio}%</td>
                      <td>${item.reason === "认证失效" ? "先修复公众号连接" : item.reason === "格式映射失败" ? "补渠道适配器" : "补封面默认规则"}</td>
                    </tr>
                  `
                )
              )
            : tableMarkup(
                ["名称", "当前值", "说明"],
                (store.data.analyticsKeywords?.top_unadopted_keywords || []).map(
                  (item) => `
                    <tr>
                      <td>${item.keyword}</td>
                      <td>${item.priority_score}</td>
                      <td>${item.recommended_content_type_label} / ${item.category_label}</td>
                    </tr>
                  `
                )
              )
        }
      </section>
    </div>
    ${tab === "campaigns" ? renderCampaignRuns(store.data.analyticsCampaigns?.campaign_runs || []) : ""}
    ${tab === "visibility" ? renderVisibilityCollectionRuns(store.data.analyticsVisibility?.collection_runs || []) : ""}
  `;
}
