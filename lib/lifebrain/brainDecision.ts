import { AITask } from "@/lib/ai/types";
import { BrainDecision, BrainIntent } from "./brainTypes";

// ---------------------------------------------------------------------------
// Brain Decision Engine — decides which layers each intent needs.
//
//   简单聊天：不用 Timeline
//   Relationship：必须 Graph
//   Reflection：Timeline + Memory
//   Goal：Timeline + Project + Reflection
// ---------------------------------------------------------------------------

const DECISIONS: Record<BrainIntent, Omit<BrainDecision, "intent" | "reason">> = {
  chat: {
    includeGraph: false,
    graphHops: 0,
    timelineDays: 0,
    includeMemories: true,
    includeProfile: true,
    includeReflections: false,
    includeInsights: false,
    budgetTokens: 3000,
  },
  question: {
    includeGraph: true,
    graphHops: 1,
    timelineDays: 30,
    includeMemories: true,
    includeProfile: true,
    includeReflections: false,
    includeInsights: true,
    budgetTokens: 5000,
  },
  search: {
    includeGraph: true,
    graphHops: 2,
    timelineDays: 365,
    includeMemories: true,
    includeProfile: false,
    includeReflections: false,
    includeInsights: false,
    budgetTokens: 5000,
  },
  relationship: {
    includeGraph: true,
    graphHops: 2,
    timelineDays: 90,
    includeMemories: true,
    includeProfile: true,
    includeReflections: true,
    includeInsights: true,
    budgetTokens: 8000,
  },
  goal: {
    includeGraph: true,
    graphHops: 1,
    timelineDays: 90,
    includeMemories: true,
    includeProfile: true,
    includeReflections: true,
    includeInsights: true,
    budgetTokens: 8000,
  },
  project: {
    includeGraph: true,
    graphHops: 2,
    timelineDays: 90,
    includeMemories: true,
    includeProfile: true,
    includeReflections: false,
    includeInsights: true,
    budgetTokens: 8000,
  },
  reflection: {
    includeGraph: false,
    graphHops: 0,
    timelineDays: 30,
    includeMemories: true,
    includeProfile: true,
    includeReflections: true,
    includeInsights: true,
    budgetTokens: 5000,
  },
  workspace: {
    includeGraph: true,
    graphHops: 1,
    timelineDays: 30,
    includeMemories: true,
    includeProfile: true,
    includeReflections: false,
    includeInsights: true,
    budgetTokens: 5000,
  },
};

const REASONS: Record<BrainIntent, string> = {
  chat: "简单对话：仅需记忆与用户画像，不加载时间线",
  question: "通用问题：1 跳图谱 + 30 天时间线",
  search: "搜索：2 跳图谱 + 全年时间线",
  relationship: "关系问题：必须包含图谱（2 跳）+ 90 天互动 + 反思",
  goal: "目标问题：时间线里程碑 + 关联项目 + 反思",
  project: "项目问题：2 跳图谱 + 90 天进展",
  reflection: "反思：30 天时间线 + 长期记忆",
  workspace: "工作区概览：1 跳图谱 + 30 天动态",
};

export function decideLayers(intent: BrainIntent): BrainDecision {
  return { intent, ...DECISIONS[intent], reason: REASONS[intent] };
}

// ---------------------------------------------------------------------------
// Rule-based intent detection (transparent, no LLM needed).
// ---------------------------------------------------------------------------

const RELATIONSHIP_WORDS = [
  "沟通", "回复", " relationship", "吵架", "争执", "道歉", "约", "见", "联系",
  "老板", "同事", "朋友", "家人", "女朋友", "男朋友", "关系",
];
const GOAL_WORDS = ["目标", "进度", "推进", "完成", "计划", "坚持", "打卡"];
const PROJECT_WORDS = ["项目", "上线", "发布", "排期", "里程碑", "延期", "风险"];
const REFLECTION_WORDS = ["反思", "回顾", "总结", "感觉", "最近怎样", "状态"];
const SEARCH_WORDS = ["什么时候", "第一次", "去年", "今年", "搜索", "找", "哪些", "多少"];
const WORKSPACE_WORDS = ["今天", "本周", " workspace", "概览", "整体", "全局"];

export function detectIntent(
  question: string,
  hint?: { objectType?: string }
): BrainIntent {
  const q = question.toLowerCase();

  if (hint?.objectType === "person") return "relationship";
  if (hint?.objectType === "goal") return "goal";
  if (hint?.objectType === "project") return "project";

  if (SEARCH_WORDS.some((w) => q.includes(w))) return "search";
  if (RELATIONSHIP_WORDS.some((w) => q.includes(w))) return "relationship";
  if (GOAL_WORDS.some((w) => q.includes(w))) return "goal";
  if (PROJECT_WORDS.some((w) => q.includes(w))) return "project";
  if (REFLECTION_WORDS.some((w) => q.includes(w))) return "reflection";
  if (WORKSPACE_WORDS.some((w) => q.includes(w))) return "workspace";

  return "chat";
}

/**
 * AI Task → Brain intent (used when legacy engines enter via the Context
 * Engine). Tasks absent here get NO context injection.
 */
const TASK_INTENT: Partial<Record<AITask, BrainIntent>> = {
  RELATIONSHIP: "relationship",
  OBJECT_ANALYSIS: "question",
  OBJECT_UPDATE: "question",
  PERSON_UPDATE: "relationship",
  TODAY_FOCUS: "workspace",
  REMINDER: "workspace",
  WORKSPACE: "workspace",
  REFLECTION: "reflection",
  WEEKLY_REVIEW: "reflection",
  MONTHLY_STORY: "reflection",
  SUMMARY: "reflection",
  MEMORY_UNDERSTANDING: "chat",
  TODAY_STORY: "chat",
  PATTERN: "chat",
  CHAT: "chat",
  CONVERSATION: "chat",
  SEARCH: "search",
};

export function taskToIntent(task: AITask): BrainIntent | null {
  return TASK_INTENT[task] ?? null;
}
