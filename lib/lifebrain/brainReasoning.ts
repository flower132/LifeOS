import { Language } from "@/lib/i18n";
import { AITask } from "@/lib/ai/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { decideLayers, detectIntent } from "./brainDecision";
import { resolveFocusObject, retrieveContext } from "./brainRetriever";
import { createBrainContext, serializeBrainContext } from "./brainContext";
import { buildPrompt } from "./brainPrompt";
import {
  BrainAnswerRequest,
  BrainContext,
  BrainDecision,
  BrainReasoningStep,
} from "./brainTypes";
import { SerializedBrainContext } from "./brainContext";

// ---------------------------------------------------------------------------
// Brain Reasoning — the unified pipeline:
//
//   理解问题 (understand)
//     → 决定层级 (decide)
//     → 检索世界 (retrieve: Graph / Timeline / Memory / Reflection)
//     → 排序压缩 (rank + compress)
//     → 生成 Prompt（Brain Prompt Builder）
//     → 调用 Provider（经 AI Router，绝不直连）
//
// Every step is recorded as a transparent, data-only reasoning trace.
// ---------------------------------------------------------------------------

const INTENT_TASK: Record<string, AITask> = {
  chat: "CHAT",
  question: "SEARCH",
  search: "SEARCH",
  relationship: "RELATIONSHIP",
  goal: "WORKSPACE",
  project: "WORKSPACE",
  reflection: "REFLECTION",
  workspace: "WORKSPACE",
};

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

export interface ReasoningResult {
  decision: BrainDecision;
  context: BrainContext;
  serialized: SerializedBrainContext;
  prompt: string;
  task: AITask;
  steps: BrainReasoningStep[];
}

/** Steps 1-5 of the pipeline (everything before the provider call). */
export function reason(request: BrainAnswerRequest): ReasoningResult {
  const steps: BrainReasoningStep[] = [];

  // 1. Understand — intent detection (rule-based, transparent).
  const focus = resolveFocusObject(request.question, request.objectId);
  const intent =
    request.intent ?? detectIntent(request.question, { objectType: focus?.type });
  steps.push({
    step: "understand",
    detail: `意图识别：${intent}${focus ? `；讨论对象：${focus.name}` : "；无特定对象"}`,
  });

  // 2. Decide — which layers participate.
  const decision = decideLayers(intent);
  steps.push({ step: "decide", detail: decision.reason });

  // 3. Retrieve — graph / timeline / memory / reflections per decision.
  const retrieval = retrieveContext({
    question: request.question,
    decision,
    focusObjectId: focus?.id,
  });
  steps.push({
    step: "retrieve",
    detail: `检索：${retrieval.relatedObjects.length} 个关联对象、${retrieval.memories.length} 条记忆、${retrieval.timelineEvents.length} 条时间线事件、${retrieval.reflections.length} 条反思`,
  });

  // 4. Rank + compress — the world model within budget.
  const context = createBrainContext({ retrieval, decision });
  const serialized = serializeBrainContext(context);
  steps.push({
    step: "compress",
    detail: `上下文压缩至约 ${serialized.estimatedTokens} tokens（预算 ${decision.budgetTokens}）${serialized.truncated ? "，已截断" : ""}`,
  });

  // 5. Build the prompt (single assembly point; template follows intent).
  const prompt = buildPrompt({
    context,
    serialized,
    question: request.situation
      ? `${request.question}\n\n情境补充：${request.situation}`
      : request.question,
    language: getLanguage(),
  });
  steps.push({ step: "generate", detail: `Prompt 已构建，任务：${INTENT_TASK[intent]}` });

  return {
    decision,
    context,
    serialized,
    prompt,
    task: INTENT_TASK[intent],
    steps,
  };
}
