import { LifeObjectType } from "@/lib/types";
import {
  AIProvider,
  AIProviderConfig,
  AIStructuredGenerationRequest,
} from "../types";

/**
 * Build a type-aware mock structured response.
 *
 * The mock provider must implement generateStructuredObject so the engine can
 * run offline/privacy-mode analysis end-to-end. The output shape follows the
 * unified Object Intelligence output schema, and the `profile.type` field always
 * matches the requested objectType so every registered profile mapper can parse
 * it successfully.
 */
function buildMockStructuredResponse(
  request: AIStructuredGenerationRequest
): string {
  const type: LifeObjectType = request.objectType ?? "person";
  const hasImages = (request.images?.length ?? 0) > 0;

  const common = {
    insights: [
      {
        category: "数据不足",
        title: "当前为本地模拟分析",
        description:
          "未配置真实 AI Provider 或处于隐私模式。请提供素材并启用 AI 分析以获取洞察。",
        confidence: 0,
        evidence: [],
      },
    ],
    suggestions: [
      {
        title: "配置 AI Provider",
        description:
          "在 Settings 中配置 OpenAI、Claude 或其他 Provider 以获取真实分析。",
        priority: "medium",
      },
    ],
    memories: [
      {
        content: hasImages
          ? "用户上传了图片素材（模拟模式未分析）。"
          : "用户提供了文本素材（模拟模式未分析）。",
      },
    ],
    confidence_score: 0,
    analysis_summary:
      "当前为本地模拟分析。请配置真实 AI Provider 以获取详细洞察。",
  };

  switch (type) {
    case "goal":
      return JSON.stringify({
        basic_profile: {
          name: "",
          target_date: "",
          priority: "",
          status: "",
        },
        profile: {
          type: "goal",
          difficulty: 5,
          successProbability: 0,
          requiredResources: [],
          estimatedDuration: "",
          motivationType: "mixed",
        },
        ...common,
      });

    case "project":
      return JSON.stringify({
        basic_profile: {
          name: "",
          timeline: "",
          status: "",
        },
        profile: {
          type: "project",
          complexity: 5,
          riskLevel: "medium",
          timelineEstimate: "",
          keyStakeholders: [],
        },
        ...common,
      });

    case "self":
      return JSON.stringify({
        basic_profile: {
          name: "",
          current_focus: "",
        },
        profile: {
          type: "self",
          strengths: [],
          weaknesses: [],
          growthAreas: [],
          currentFocus: "",
        },
        ...common,
      });

    case "knowledge":
      return JSON.stringify({
        basic_profile: {
          name: "",
          topic: "",
        },
        profile: {
          type: "knowledge",
          difficulty: 5,
          relatedTopics: [],
          knowledgeGraph: [],
        },
        ...common,
      });

    case "event":
      return JSON.stringify({
        basic_profile: {
          name: "",
          date: "",
          location: "",
        },
        profile: {
          type: "event",
          impactLevel: "medium",
          importance: 50,
          stakeholders: [],
        },
        ...common,
      });

    case "idea":
      return JSON.stringify({
        basic_profile: {
          name: "",
          domain: "",
        },
        profile: {
          type: "idea",
          novelty: 50,
          feasibility: 50,
          marketPotential: 50,
          relatedDomains: [],
        },
        ...common,
      });

    case "person":
    default:
      return JSON.stringify({
        basic_profile: {
          name: "",
          nickname: "",
          age: "",
          occupation: "",
          city: "",
        },
        profile: {
          type: "person",
          mbti: "",
          mbtiConfidence: 0,
          bigFive: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            emotionalStability: 50,
          },
          personalitySummary:
            "当前为本地模拟分析。请配置真实 AI Provider 以获取详细洞察。",
        },
        ...common,
      });
  }
}

export function createMockProvider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _config: AIProviderConfig
): AIProvider {
  return {
    async generate(prompt: string): Promise<string> {
      return buildMockStructuredResponse({ prompt, images: [] });
    },
    async generateWithImages(
      prompt: string,
      images: import("../types").AIImageInput[]
    ): Promise<string> {
      return buildMockStructuredResponse({ prompt, images });
    },
    async generateStructuredObject(
      request: AIStructuredGenerationRequest
    ): Promise<string> {
      return buildMockStructuredResponse(request);
    },
  };
}
