import { Language } from "@/lib/i18n";
import { useSettingsStore } from "@/stores/settingsStore";
import { addAILog } from "@/lib/ai/logs";
import { selectProviderForAnalysis } from "@/lib/ai/objectIntelligence/fallback";
import { AIStructuredGenerationRequest } from "@/lib/ai/types";
import {
  AdvisorContext,
  AdvisorHomeInsightResult,
  AdvisorResult,
  AdvisorAskOptions,
  AdvisorHomeInsightOptions,
} from "./types";
import {
  buildAdvisorPrompt,
  buildHomeInsightPrompt,
} from "./promptBuilder";
import { resolveEvidence } from "./evidenceResolver";

function getLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  return useSettingsStore.getState().language;
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty response");
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    throw new Error(
      `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function normalizeAdvisorResult(raw: unknown): AdvisorResult {
  const data = (raw ?? {}) as Record<string, unknown>;

  const normalizeSection = (key: string) => {
    const section = (data[key] ?? {}) as Record<string, unknown>;
    const evidence = Array.isArray(section.evidence)
      ? section.evidence
          .map((item: unknown) => {
            const ev = item as Record<string, unknown>;
            return {
              quote: typeof ev.quote === "string" ? ev.quote : "",
              source: typeof ev.source === "string" ? ev.source : "",
            };
          })
          .filter((ev) => ev.quote || ev.source)
      : [];
    return {
      content: typeof section.content === "string" ? section.content : "",
      evidence,
    };
  };

  return {
    context: normalizeSection("context"),
    whatINotice: normalizeSection("whatINotice"),
    suggestion: normalizeSection("suggestion"),
    why: normalizeSection("why"),
  };
}

function normalizeHomeInsightResult(raw: unknown): AdvisorHomeInsightResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const evidence = Array.isArray(data.evidence)
    ? data.evidence
        .map((item: unknown) => {
          const ev = item as Record<string, unknown>;
          return {
            quote: typeof ev.quote === "string" ? ev.quote : "",
            source: typeof ev.source === "string" ? ev.source : "",
          };
        })
        .filter((ev) => ev.quote || ev.source)
    : [];
  return {
    narrative: typeof data.narrative === "string" ? data.narrative : "",
    maybeToday: typeof data.maybeToday === "string" ? data.maybeToday : "",
    evidence,
  };
}

function buildMockAdvisorResult(): AdvisorResult {
  return {
    context: {
      content:
        "当前为本地模拟模式。请配置真实 AI Provider 后，Advisor 将基于你的记忆生成建议。",
      evidence: [],
    },
    whatINotice: {
      content: "我注意到你正在探索 Advisor 功能。",
      evidence: [],
    },
    suggestion: {
      content: "也许可以先记录几条关于这个对象的笔记，再回来询问 Advisor。",
      evidence: [],
    },
    why: {
      content: "Advisor 需要基于真实记忆才能给出有意义的建议。",
      evidence: [],
    },
  };
}

function buildMockHomeInsightResult(): AdvisorHomeInsightResult {
  return {
    narrative:
      "当前为本地模拟模式。配置 AI Provider 后，我会根据你的记忆生成更贴心的 Insight。",
    maybeToday: "也许今天可以先记录一件小事。",
    evidence: [],
  };
}

async function runAdvisorGeneration<T>(
  context: AdvisorContext,
  buildPrompt: (language: Language) => string,
  normalize: (raw: unknown) => T,
  forceMock?: boolean
): Promise<T> {
  const selected = forceMock
    ? {
        provider: selectProviderForAnalysis({
          provider: "mock",
          apiKey: "",
          baseUrl: "",
          model: "mock",
        }),
        isMock: true,
      }
    : { provider: selectProviderForAnalysis(), isMock: false };

  if (selected.isMock) {
    // Mock provider does not understand Advisor JSON shape, so we return a
    // deterministic local shape to keep the UI usable end-to-end.
    return normalize({});
  }

  const language = getLanguage();
  const prompt = buildPrompt(language);
  const request: AIStructuredGenerationRequest = {
    prompt,
    images: undefined,
    schemaHint:
      '{"context":{"content":"string","evidence":[{"quote":"string","source":"string"}]},"whatINotice":{...},"suggestion":{...},"why":{...}}',
    objectType: context.object.type,
  };

  const start = performance.now();
  try {
    const text = await selected.provider.provider.generateStructuredObject(request);
    const durationMs = Math.round(performance.now() - start);
    const parsed = parseJsonResponse(text);

    addAILog({
      provider: selected.provider.providerId,
      model: selected.provider.model,
      durationMs,
      status: "success",
    });

    return normalize(parsed);
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    addAILog({
      provider: selected.provider.providerId,
      model: selected.provider.model,
      durationMs,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

class AdvisorService {
  async ask(
    context: AdvisorContext,
    question: string,
    options: AdvisorAskOptions = {}
  ): Promise<AdvisorResult> {
    if (options.forceMock || selectProviderForAnalysis().isMock) {
      return buildMockAdvisorResult();
    }

    const result = await runAdvisorGeneration(
      context,
      () => buildAdvisorPrompt(context, question, getLanguage()),
      normalizeAdvisorResult,
      false
    );

    return {
      context: {
        ...result.context,
        evidence: result.context.evidence.map((e) => resolveEvidence(e, context)),
      },
      whatINotice: {
        ...result.whatINotice,
        evidence: result.whatINotice.evidence.map((e) => resolveEvidence(e, context)),
      },
      suggestion: {
        ...result.suggestion,
        evidence: result.suggestion.evidence.map((e) => resolveEvidence(e, context)),
      },
      why: {
        ...result.why,
        evidence: result.why.evidence.map((e) => resolveEvidence(e, context)),
      },
    };
  }

  async generateHomeInsight(
    context: AdvisorContext,
    options: AdvisorHomeInsightOptions = {}
  ): Promise<AdvisorHomeInsightResult> {
    if (options.forceMock || selectProviderForAnalysis().isMock) {
      return buildMockHomeInsightResult();
    }

    const result = await runAdvisorGeneration(
      context,
      () => buildHomeInsightPrompt(context, getLanguage()),
      normalizeHomeInsightResult,
      false
    );

    return {
      ...result,
      evidence: result.evidence.map((e) => resolveEvidence(e, context)),
    };
  }
}

export const advisorService = new AdvisorService();
