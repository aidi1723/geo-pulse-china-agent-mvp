export const navigation = [
  { id: "dashboard", label: "总览看板", desc: "本周关键词、内容与分发总览" },
  { id: "keywords", label: "关键词中心", desc: "问题库、意图簇、话题地图、来源抓取" },
  { id: "content", label: "内容中心", desc: "选题、草稿、审核、模板编排" },
  { id: "distribution", label: "分发中心", desc: "渠道适配、发布任务、人工接管" },
  { id: "analytics", label: "分析复盘", desc: "关键词、内容、渠道表现分析" },
  { id: "billing", label: "套餐与账单", desc: "额度、账单与开票状态" },
  { id: "settings", label: "系统设置", desc: "品牌知识、模型接入、渠道与自动化" }
];

export const pageMeta = {
  dashboard: ["总览看板", "中国智能体 GEO 自动运营总览"],
  keywords: ["关键词中心", "抓问题、做聚类、沉淀话题图谱"],
  content: ["内容中心", "从选题到文章审核的一体化流程"],
  distribution: ["分发中心", "多渠道发布、失败接管与结果回写"],
  analytics: ["分析复盘", "关键词、内容与渠道效果分析"],
  billing: ["套餐与账单", "额度、账单与开票状态"],
  settings: ["系统设置", "品牌知识、模型接入与运行策略配置"]
};

export const primaryActions = {
  dashboard: "新建任务",
  keywords: "抓取关键词",
  content: "新建内容",
  distribution: "创建发布任务",
  analytics: "导出分析",
  billing: "升级套餐",
  settings: "保存配置"
};
