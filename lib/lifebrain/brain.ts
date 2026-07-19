import { AITask } from "@/lib/ai/types";
import { postAI } from "@/lib/ai/serverProxy";
import { selectProviderForTask } from "@/lib/ai/objectIntelligence/fallback";
import { decideLayers } from "./brainDecision";
import { retrieveContext } from "./brainRetriever";
import { createBrainContext } from "./brainContext";
import { reason } from "./brainReasoning";
import { buildPrompt } from "./brainPrompt";
import { generateInsight } from "./brainInsight";
import { useBrainMemoryStore } from "./brainMemory";
import {
  BrainAnswer,
  BrainAnswerRequest,
  BrainContext,
  BrainDecision,
  BrainRetrieval,
} from "./brainTypes";
import { BrainInsightBundle } from "./brainInsight";

// ---------------------------------------------------------------------------
// Life Brain — the AI operating system of LifeOS, and the ONLY AI Context
// Provider. Every AI feature enters through this facade:
//
//   brain.answer()           — the unified Q&A entry (chat / search /
//                              relationship / goal / project / reflection /
//                              workspace; images pass through to vision)
//   brain.reason()           — the reasoning pipeline (steps 1-5)
//   brain.createBrainContext — world model assembly
//   brain.retrieveContext()  — question-driven retrieval
//   brain.buildPrompt()      — single prompt assembly point
//   brain.generateInsight()  — today's insight bundle
//
// Brain never owns data and never recomputes graph metrics: Knowledge Graph
// is the memory, Timeline is time, Life Brain is the interpreter.
// ---------------------------------------------------------------------------

const LOCAL_MODE_NOTICE =
  "当前为本地模拟模式（AI 已关闭或隐私模式）。配置服务端 AI 后，Life Brain 将基于你的知识图谱与时间线回答。";

class LifeBrain {
  /** Reasoning pipeline steps 1-5 (understand → prompt). */
  reason = reason;

  /** World model assembly. */
  createBrainContext = createBrainContext;

  /** Question-driven retrieval. */
  retrieveContext = retrieveContext;

  /** Decision engine. */
  decideLayers = decideLayers;

  /** Single prompt assembly point. */
  buildPrompt = buildPrompt;

  /** Today's insight bundle (graph + timeline, cached). */
  generateInsight(): BrainInsightBundle {
    return generateInsight();
  }

  /**
   * The unified AI entry point. Everything — chat, search, relationship,
   * goal, project, reflection, workspace, image — flows through here.
   */
  async answer(request: BrainAnswerRequest): Promise<BrainAnswer> {
    const memoryStore = useBrainMemoryStore.getState();
    memoryStore.pushTurn({ role: "user", content: request.question });

    const reasoning = reason(request);
    const focus = reasoning.context.focusObject;

    const working = memoryStore.beginWorking({
      question: request.question,
      intent: reasoning.decision.intent,
      focusObjectId: focus?.id,
      retrievedEntityIds: [
        ...(focus ? [focus.id] : []),
        ...reasoning.context.neighbors.map((n) => n.object.id),
        ...reasoning.context.memories.map((m) => m.id),
      ],
      steps: reasoning.steps,
    });

    const base: Omit<BrainAnswer, "content"> = {
      intent: reasoning.decision.intent,
      task: reasoning.task,
      sources: reasoning.serialized.sources,
      steps: reasoning.steps,
      workingMemoryId: working.id,
      provider: "mock",
      model: "mock",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      latency: 0,
    };

    // Mock / privacy mode: zero network, honest local answer.
    if (selectProviderForTask(reasoning.task).isMock) {
      memoryStore.pushTurn({ role: "assistant", content: LOCAL_MODE_NOTICE, intent: reasoning.decision.intent });
      return { ...base, content: LOCAL_MODE_NOTICE };
    }

    try {
      const { content, meta } = await postAI({
        task: reasoning.task,
        prompt: reasoning.prompt,
        images: request.images,
        // Brain OWNS context assembly — suppress proxy-level injection to
        // avoid double-context (Context Engine stays for legacy engines).
        context: "",
        contextHint: { objectId: focus?.id, query: request.question },
        options: { jsonMode: false },
      });

      const text = content
        .trim()
        .replace(/^```(?:json|text|markdown)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      memoryStore.pushTurn({ role: "assistant", content: text, intent: reasoning.decision.intent });

      return {
        ...base,
        content: text,
        provider: meta.provider,
        model: meta.model,
        usage: meta.usage,
        latency: meta.latency,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      memoryStore.pushTurn({ role: "assistant", content: `（回答失败：${message}）` });
      return {
        ...base,
        content: `暂时无法回答（${message}）。请稍后再试。`,
      };
    }
  }
}

export const brain = new LifeBrain();

export type { BrainContext, BrainDecision, BrainRetrieval, AITask };
