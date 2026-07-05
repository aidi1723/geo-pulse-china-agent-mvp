#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_REPO = process.cwd();
const REPORTS_DIR = "reports";
const NOW = new Date().toISOString().slice(0, 10);

const SOURCE_FILES = [
  { label: "README", relativePath: "README.md", type: "markdown" },
  { label: "User Guide ZH", relativePath: "docs/USER_GUIDE.zh-CN.md", type: "markdown" },
  { label: "Solution OS", relativePath: "docs/SOLUTION_OS.md", type: "markdown" },
  { label: "Use Cases", relativePath: "docs/USE_CASES.md", type: "markdown" },
  { label: "Layout Metadata", relativePath: "src/app/layout.tsx", type: "code" },
  { label: "Homepage", relativePath: "src/app/page.tsx", type: "code" },
];

const KEYWORD_GROUPS = [
  {
    id: "core",
    label: "核心产品词",
    intent: "确保 AI 能准确理解 AgentCoreOS 的产品形态。",
    keywords: [
      "AgentCore OS",
      "local-first",
      "本地优先",
      "AI 工作桌面",
      "workflow",
      "工作流",
      "BYOK",
      "private",
      "私有",
      "industry solution operating system",
      "solution operating system",
    ],
  },
  {
    id: "china-commercial",
    label: "中国商业转化词",
    intent: "确保内容覆盖中国客户会直接搜索和提问的词。",
    keywords: [
      "企业数字员工",
      "AI 数字员工",
      "数字员工系统",
      "企业智能体",
      "企业级 Agent",
      "企业级 AI Agent",
      "私有化 AI Agent",
      "私有化部署",
      "企业 AI 工作流",
      "企业定制",
      "企业定制入口",
    ],
  },
  {
    id: "growth-scenarios",
    label: "增长与业务场景词",
    intent: "确保你们的公开内容能承接具体需求场景。",
    keywords: [
      "销售跟进",
      "销售自动化",
      "外贸",
      "外贸数字员工",
      "内容创作",
      "研究分析",
      "客户服务",
      "知识库",
      "询盘",
      "企业私有模型",
      "内网模型",
    ],
  },
  {
    id: "ai-discovery",
    label: "AI 推荐与比较词",
    intent: "为 AI 推荐、比较和问答类 Prompt 做准备。",
    keywords: [
      "what is",
      "是什么",
      "适合",
      "怎么选",
      "区别",
      "对比",
      "推荐",
      "哪家好",
      "use case",
      "FAQ",
      "case study",
    ],
  },
];

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function toPlainText(content, type) {
  if (!content) return "";
  if (type === "markdown") {
    return content
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/^#+\s*/gm, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/\r/g, " ")
      .replace(/\n+/g, "\n");
  }
  return content.replace(/\r/g, " ");
}

function escapeRegex(source) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countKeyword(text, keyword) {
  if (!text || !keyword) return 0;
  const isAscii = /^[\x00-\x7F]+$/.test(keyword);
  if (isAscii) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "gi");
    return [...text.matchAll(regex)].length;
  }
  return text.split(keyword).length - 1;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function extractMetadata(layoutSource) {
  const titleMatch = layoutSource.match(/title:\s*"([^"]+)"/);
  const descriptionMatch = layoutSource.match(/description:\s*"([^"]+)"/);
  return {
    title: titleMatch?.[1] ?? "",
    description: descriptionMatch?.[1] ?? "",
  };
}

function detectHomepageMode(homepageSource) {
  const hasUseClient = homepageSource.includes('"use client"') || homepageSource.includes("'use client'");
  const hasDynamicNoSSR = homepageSource.includes("ssr: false");
  const hasDesktopClient = homepageSource.includes("DesktopClient");
  if (hasUseClient && hasDynamicNoSSR && hasDesktopClient) {
    return "client-only-desktop-shell";
  }
  return "mixed-or-server-rendered";
}

function listExistingFiles(repoRoot) {
  const interesting = [
    "docs/FAQ.md",
    "docs/FAQ.zh-CN.md",
    "docs/COMPARE.md",
    "docs/COMPARISON.md",
    "docs/CASE_STUDIES.md",
    "docs/CASE_STUDY.md",
    "docs/ENTERPRISE.md",
    "docs/PRIVATE_DEPLOYMENT.md",
  ];
  return interesting.filter((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
}

function detectContactSignals(text) {
  const phoneRegex = /\+?\d[\d\s-]{7,}\d/g;
  return [...new Set(text.match(phoneRegex) ?? [])].filter((item) => !/^\d{4}-\d{2}-\d{2}$/.test(item.trim()));
}

function buildActionPlan(findings) {
  const actions = [];
  if (findings.homepageClientOnly) {
    actions.push("把官网首页改成可服务端输出的公开营销页，桌面壳放到二级入口，不要让首页只渲染 DesktopClient。");
  }
  if (findings.missingChinaTerms.length >= 4) {
    actions.push("补一页中文公开落地页，主打“企业数字员工 + 私有化 AI Agent + 企业 AI 工作流”三件事。");
  }
  if (!findings.hasFaqSignal) {
    actions.push("补 FAQ 页面，优先回答“AgentCore OS 是什么、适合谁、与 RPA / 普通 AI 助手有什么区别、是否支持私有化部署”。");
  }
  if (!findings.hasComparisonSignal) {
    actions.push("补对比内容，至少要有“AgentCore OS vs 通用聊天工具 / 普通工作流工具 / 纯 SaaS AI 平台”三类说明。");
  }
  if (findings.metadataTooGeneric) {
    actions.push("重写首页 title 和 description，加入中文商业词和具体场景，不要只保留英文泛描述。");
  }
  if (!findings.hasCaseSignal) {
    actions.push("补案例或 use case 页面，把销售跟进、内容创作、研究分析、外贸流程这几条链写成可被 AI 引用的结构。");
  }
  return actions;
}

function buildPageIdeas() {
  return [
    "什么是企业数字员工系统：解释 AgentCore OS 与普通聊天机器人、RPA 的区别。",
    "私有化 AI Agent 平台方案：强调本地优先、BYOK、内网模型与企业敏感数据边界。",
    "销售跟进数字员工：整理询盘、客户背景研究、跟进内容生成、资产沉淀。",
    "外贸数字员工工作台：围绕询盘、报价、客户研究、邮件跟进做完整场景。",
    "AgentCore OS 适合哪些企业：面向老板、运营、销售、技术、研究五类角色写清入口。",
    "AgentCore OS 与通用 AI 工具对比：突出 workflow、role desk、asset accumulation。",
  ];
}

function buildFaqIdeas() {
  return [
    "AgentCore OS 是什么？",
    "AgentCore OS 和企业数字员工系统是什么关系？",
    "AgentCore OS 适合哪些行业和团队？",
    "是否支持私有化部署和本地模型？",
    "和普通 AI 聊天工具、RPA、自动化平台有什么区别？",
    "是否适合销售跟进、外贸、内容运营、研究分析？",
  ];
}

function buildReport({
  repoRoot,
  metadata,
  keywordResults,
  findings,
  sourcePresence,
  contactSignals,
  actionPlan,
}) {
  const missingGroups = keywordResults
    .map((group) => ({
      label: group.label,
      missing: group.keywords.filter((keyword) => keyword.count === 0).map((keyword) => keyword.term),
    }))
    .filter((group) => group.missing.length > 0);

  return [
    `# AgentCoreOS GEO 审计报告`,
    ``,
    `- 审计日期：${NOW}`,
    `- 审计仓库：${repoRoot}`,
    `- 审计目标：用当前 AgentCoreOS 公开资料，评估项目是否容易被 AI 理解、引用和推荐`,
    ``,
    `## 一、核心判断`,
    ``,
    `当前 AgentCoreOS 已经有较强的产品方向和业务场景表达，但公开内容更偏“开发者说明 + 产品内结构说明”，还没有形成一套专门面向 GEO 和中国商业转化的公开叙事。`,
    ``,
    `最主要的风险不是内容完全没有，而是：`,
    `- 首页公开可抓取内容过少，当前首页更像桌面壳入口，不像营销页`,
    `- metadata 过于泛化，缺少中国商业搜索和 AI 推荐场景下的关键词`,
    `- “企业数字员工 / 私有化 AI Agent / 外贸数字员工 / 销售自动化”这类高价值中文词没有形成系统覆盖`,
    `- 缺少 FAQ、对比页、案例页这类最容易被 AI 摘取和引用的结构化资产`,
    ``,
    `## 二、高优先级发现`,
    ``,
    `- 首页模式：${findings.homepageClientOnly ? "高风险，client-only Desktop 壳" : "可接受，存在可抓取公开内容"}`,
    `- 首页 title：${metadata.title || "未识别"}`,
    `- 首页 description：${metadata.description || "未识别"}`,
    `- Metadata 风险：${findings.metadataTooGeneric ? "偏泛，没有突出 AgentCoreOS 的差异化和中国商业词" : "可接受"}`,
    `- FAQ 资产：${findings.hasFaqSignal ? "已发现相关信号" : "未发现明确 FAQ 页面或 FAQ 信号"}`,
    `- 对比资产：${findings.hasComparisonSignal ? "已发现相关信号" : "未发现明确对比页或对比型内容"}`,
    `- 案例资产：${findings.hasCaseSignal ? "已发现相关信号" : "案例信号偏弱，公开表达不足"}`,
    `- 联系信号：${contactSignals.length > 0 ? contactSignals.join(" / ") : "未明显识别到公开联系信息"}`,
    ``,
    `## 三、关键词覆盖`,
    ``,
    ...keywordResults.flatMap((group) => {
      const totalHits = sum(group.keywords.map((item) => item.count));
      const covered = group.keywords.filter((item) => item.count > 0).length;
      return [
        `### ${group.label}`,
        ``,
        `- 目标：${group.intent}`,
        `- 覆盖情况：${covered}/${group.keywords.length} 个关键词有命中，总命中 ${totalHits} 次`,
        `- 已覆盖：${group.keywords.filter((item) => item.count > 0).map((item) => `${item.term}(${item.count})`).join("、") || "无"}`,
        `- 缺失：${group.keywords.filter((item) => item.count === 0).map((item) => item.term).join("、") || "无"}`,
        ``,
      ];
    }),
    `## 四、内容资产缺口`,
    ``,
    `- 当前已读取的关键文件：${sourcePresence.join("、")}`,
    `- 已发现的 FAQ/对比/企业资料文件：${findings.existingAssetFiles.length > 0 ? findings.existingAssetFiles.join("、") : "未发现"}`,
    ...missingGroups.map((group) => `- ${group.label} 缺失关键词：${group.missing.slice(0, 8).join("、")}`),
    ``,
    `## 五、建议优先动作`,
    ``,
    ...actionPlan.map((action) => `- ${action}`),
    ``,
    `## 六、建议新增页面`,
    ``,
    ...buildPageIdeas().map((item) => `- ${item}`),
    ``,
    `## 七、建议 FAQ 题目`,
    ``,
    ...buildFaqIdeas().map((item) => `- ${item}`),
    ``,
    `## 八、建议首页 metadata 初稿`,
    ``,
    `- Title：AgentCore OS | 企业数字员工系统与私有化 AI Agent 工作流平台`,
    `- Description：AgentCore OS 是一个本地优先、支持私有化部署的企业数字员工与 AI 工作流平台，适合销售跟进、内容创作、研究分析、外贸和企业运营场景。`,
    ``,
    `## 九、结论`,
    ``,
    `如果目标是“先优化 AgentCoreOS 自己的 GEO，再把它推广出去”，最值钱的第一步不是继续补更多内部功能，而是先把公开叙事补齐：`,
    `- 让首页有清晰可抓取的营销文本`,
    `- 让中国商业词进入 title、description、FAQ、案例页和对比页`,
    `- 让 AI 能在“这是什么、适合谁、和谁不同、能解决什么问题”这四个维度上稳定引用 AgentCoreOS`,
    ``,
  ].join("\n");
}

function buildActionBrief({ repoRoot, findings, actionPlan }) {
  return [
    `# AgentCoreOS GEO 行动清单`,
    ``,
    `- 日期：${NOW}`,
    `- 仓库：${repoRoot}`,
    ``,
    `## 本周先做`,
    ``,
    ...actionPlan.slice(0, 4).map((item, index) => `${index + 1}. ${item}`),
    ``,
    `## 立即可写的内容`,
    ``,
    `1. 首页中文 Hero 文案`,
    `2. 企业数字员工说明页`,
    `3. 私有化部署页`,
    `4. 销售跟进数字员工页`,
    `5. FAQ 页`,
    ``,
    `## 当前判断`,
    ``,
    `- 首页 client-only 风险：${findings.homepageClientOnly ? "是" : "否"}`,
    `- 缺 FAQ：${findings.hasFaqSignal ? "否" : "是"}`,
    `- 缺对比页：${findings.hasComparisonSignal ? "否" : "是"}`,
    `- 缺案例表达：${findings.hasCaseSignal ? "否" : "是"}`,
    ``,
  ].join("\n");
}

function main() {
  const repoRoot = path.resolve(process.argv[2] || DEFAULT_REPO);
  if (!fs.existsSync(repoRoot)) {
    console.error(`仓库不存在：${repoRoot}`);
    process.exit(1);
  }

  const sources = SOURCE_FILES.map((source) => {
    const absolutePath = path.join(repoRoot, source.relativePath);
    const raw = readFileSafe(absolutePath);
    return {
      ...source,
      absolutePath,
      raw,
      text: toPlainText(raw, source.type),
      exists: Boolean(raw),
    };
  });

  const joinedText = sources.map((source) => source.text).join("\n\n");
  const joinedRaw = sources.map((source) => source.raw).join("\n\n");
  const metadataSource = sources.find((source) => source.relativePath === "src/app/layout.tsx")?.raw ?? "";
  const homepageSource = sources.find((source) => source.relativePath === "src/app/page.tsx")?.raw ?? "";
  const metadata = extractMetadata(metadataSource);
  const homepageMode = detectHomepageMode(homepageSource);
  const existingAssetFiles = listExistingFiles(repoRoot);
  const contactSignals = detectContactSignals(joinedText);

  const keywordResults = KEYWORD_GROUPS.map((group) => ({
    ...group,
    keywords: group.keywords.map((term) => ({
      term,
      count: countKeyword(joinedText, term),
    })),
  }));

  const missingChinaTerms =
    keywordResults.find((group) => group.id === "china-commercial")?.keywords.filter((item) => item.count === 0).map((item) => item.term) ??
    [];

  const findings = {
    homepageClientOnly: homepageMode === "client-only-desktop-shell",
    metadataTooGeneric:
      !metadata.description ||
      metadata.title.trim() === "AgentCore OS" ||
      (!/企业数字员工|AI Agent|私有化|sales|workflow|本地优先|local-first/i.test(metadata.description) &&
        !/企业数字员工|AI Agent|私有化|workflow|本地优先|local-first/i.test(metadata.title)),
    hasFaqSignal:
      existingAssetFiles.some((filePath) => /FAQ/i.test(filePath)) || /^#+\s*(FAQ|常见问题)\b/m.test(joinedRaw),
    hasComparisonSignal: /对比|区别|vs\b|compare/i.test(joinedText),
    hasCaseSignal: /use case|案例|case study|场景/i.test(joinedText),
    existingAssetFiles,
    missingChinaTerms,
  };

  const actionPlan = buildActionPlan(findings);
  const report = buildReport({
    repoRoot,
    metadata,
    keywordResults,
    findings,
    sourcePresence: sources.filter((source) => source.exists).map((source) => source.relativePath),
    contactSignals,
    actionPlan,
  });
  const actionBrief = buildActionBrief({ repoRoot, findings, actionPlan });

  const outputDir = path.join(process.cwd(), REPORTS_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  const reportPath = path.join(outputDir, "agentcoreos-geo-report.md");
  const briefPath = path.join(outputDir, "agentcoreos-geo-action-plan.md");

  fs.writeFileSync(reportPath, report);
  fs.writeFileSync(briefPath, actionBrief);

  console.log(`已生成报告：${reportPath}`);
  console.log(`已生成行动清单：${briefPath}`);
}

main();
