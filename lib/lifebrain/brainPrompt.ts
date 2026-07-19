import { Language } from "@/lib/i18n";
import { BrainContext } from "./brainTypes";
import { SerializedBrainContext } from "./brainContext";

// ---------------------------------------------------------------------------
// Brain Prompt Builder — the single place prompts are assembled.
//
//   禁止页面拼 Prompt。禁止字符串拼接。
//   Prompt = Template(slots) + BrainContext（由 Brain 统一填充）。
// ---------------------------------------------------------------------------

export type BrainPromptTemplateId =
  | "chat"
  | "search"
  | "relationship_advice"
  | "goal_review"
  | "project_analysis"
  | "reflection"
  | "todays_focus"
  | "object_summary"
  | "life_replay"
  | "workspace_briefing";

interface PromptTemplate {
  id: BrainPromptTemplateId;
  /** Role instruction placed before the question/context. */
  role: (language: Language) => string;
  /** Closing instruction (output contract). */
  rules: (language: Language) => string;
}

const TEMPLATES: Record<BrainPromptTemplateId, PromptTemplate> = {
  chat: {
    id: "chat",
    role: () => "你是用户的 LifeOS 陪伴助手。基于用户的人生上下文，温暖、简洁地回答。",
    rules: (language) =>
      `1. 只基于上下文，信息不足时诚实说明。\n2. 不使用"你应该"，多用"也许"。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  search: {
    id: "search",
    role: () => "你是用户的 LifeOS 检索助手。严格基于上下文中的记录回答。",
    rules: (language) =>
      `1. 只能使用上下文中的信息，禁止外部知识。\n2. 引用具体日期。\n3. 没有答案就说"没有找到相关记录"。\n4. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  relationship_advice: {
    id: "relationship_advice",
    role: () => "你是用户的 LifeOS 关系沟通顾问。基于人物画像、关系图谱与互动历史给出沟通建议。",
    rules: (language) =>
      `1. 建议必须引用上下文中的真实信息。\n2. 先理解对方状态，再给具体、可执行的建议。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  goal_review: {
    id: "goal_review",
    role: () => "你是用户的 LifeOS 目标规划顾问。基于目标的时间线与进展，分析状态、阻碍与下一步。",
    rules: (language) =>
      `1. 只基于上下文，不编造进展。\n2. 给出一条最小可执行的下一步。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  project_analysis: {
    id: "project_analysis",
    role: () => "你是用户的 LifeOS 项目分析顾问。基于项目时间线与关系网络，分析进度、风险与下一步。",
    rules: (language) =>
      `1. 只基于上下文。\n2. 风险要具体，建议要可执行。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  reflection: {
    id: "reflection",
    role: () => "你是一位温暖、安静、谦逊的 LifeOS 陪伴助手。基于时间线与长期记忆，陪用户反思。",
    rules: (language) =>
      `1. 温柔、克制，不制造焦虑。\n2. 只基于真实记录。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  todays_focus: {
    id: "todays_focus",
    role: () => "你是用户的 LifeOS 今日焦点顾问。基于图谱与时间线，说明今天最值得做的一件事。",
    rules: (language) =>
      `1. 只推荐一件事，说明为什么是现在。\n2. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  object_summary: {
    id: "object_summary",
    role: () => "你是用户的 LifeOS 对象分析助手。基于上下文总结这个对象的状态。",
    rules: (language) =>
      `1. 只基于上下文。\n2. 3-5 句，具体、克制。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  life_replay: {
    id: "life_replay",
    role: () => "你是用户的 LifeOS 人生回放助手。基于时间线生成温柔的回顾旁白。",
    rules: (language) =>
      `1. 只基于上下文。\n2. 结构：投入 → 人物 → 完成 → 成长。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
  workspace_briefing: {
    id: "workspace_briefing",
    role: () => "你是用户的 LifeOS 工作区助手。基于全局上下文，说明当前最值得关注的动态。",
    rules: (language) =>
      `1. 只基于上下文。\n2. 简洁、具体。\n3. ${language === "zh" ? "请使用简体中文回复。" : "Please respond in English."}`,
  },
};

const INTENT_TEMPLATE: Record<string, BrainPromptTemplateId> = {
  chat: "chat",
  question: "search",
  search: "search",
  relationship: "relationship_advice",
  goal: "goal_review",
  project: "project_analysis",
  reflection: "reflection",
  workspace: "workspace_briefing",
};

/** The single prompt assembly point. */
export function buildPrompt(params: {
  context: BrainContext;
  serialized: SerializedBrainContext;
  question: string;
  language: Language;
  templateId?: BrainPromptTemplateId;
}): string {
  const { context, serialized, question, language } = params;
  const template =
    TEMPLATES[params.templateId ?? INTENT_TEMPLATE[context.intent] ?? "chat"];

  return `${template.role(language)}

${serialized.block}

用户问题：
${question}

输出要求：
${template.rules(language)}`;
}

export function getTemplate(id: BrainPromptTemplateId): PromptTemplate {
  return TEMPLATES[id];
}
