import { Language } from "@/lib/i18n";
import {
  AIErrorCode,
  AIProvider,
  AIStructuredGenerationRequest,
} from "@/lib/ai/types";
import { LifeObjectType } from "@/lib/types";
import { AIAnalysisInput, AIAnalysisRunResult } from "./types";
import { buildObjectAnalysisPrompt } from "./promptBuilder";
import { mapObjectAnalysisResult } from "./mapper";

export interface AnalyzeObjectOptions {
  provider: AIProvider;
  providerId: import("@/lib/ai/types").AIProviderId;
  model: string;
  language: Language;
}

/**
 * Type-agnostic AI analysis engine for LifeObjects.
 *
 * The engine knows nothing about concrete AI providers, storage adapters, or
 * React components. It only orchestrates:
 *
 *   1. Prompt construction via the registered AIProfileDefinition.
 *   2. Structured object generation through the injected AIProvider.
 *   3. Normalization and mapping of the provider output.
 *
 * Adding a new object type requires only a new AIProfileDefinition; this class
 * must never contain `if (type === "person")` branches.
 */
export class ObjectIntelligenceEngine {
  /**
   * Analyze raw input for a given object type.
   *
   * @param type - The object type to analyze.
   * @param input - Text and optional images provided by the user.
   * @param options - Injected provider and metadata.
   * @returns A typed analysis run result, including raw output for history.
   */
  async analyze(
    type: LifeObjectType,
    input: AIAnalysisInput,
    options: AnalyzeObjectOptions
  ): Promise<AIAnalysisRunResult> {
    const start = performance.now();

    try {
      const prompt = buildObjectAnalysisPrompt(type, input, options.language);
      const request: AIStructuredGenerationRequest = {
        prompt,
        images: input.images.length > 0 ? input.images : undefined,
        objectType: type,
      };

      const text = await this.generateStructured(options.provider, request);
      const parsed = this.parseJsonResponse(text);
      const data = mapObjectAnalysisResult(type, parsed);

      if (!data) {
        throw new Error(
          `AI output could not be mapped to a valid analysis result for type "${type}".`
        );
      }

      const durationMs = Math.round(performance.now() - start);

      return {
        success: true,
        data,
        provider: options.providerId,
        model: options.model,
        durationMs,
        fallback: false,
        rawOutput: text,
      };
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);

      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        errorCode: this.inferErrorCode(err),
        provider: options.providerId,
        model: options.model,
        durationMs,
        fallback: false,
      };
    }
  }

  private async generateStructured(
    provider: AIProvider,
    request: AIStructuredGenerationRequest
  ): Promise<string> {
    // Prefer generateStructuredObject; providers implement it uniformly.
    return provider.generateStructuredObject(request);
  }

  private parseJsonResponse(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Empty response from AI provider");
    }

    try {
      return JSON.parse(trimmed);
    } catch (err) {
      throw new Error(
        `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private inferErrorCode(err: unknown): AIErrorCode {
    if (!(err instanceof Error)) return "unknown";

    const message = err.message.toLowerCase();

    if (message.includes("api key") || message.includes("unauthorized") || message.includes("401")) {
      return "invalid_key";
    }
    if (message.includes("rate limit") || message.includes("429") || message.includes("too many requests")) {
      return "rate_limit";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "model_not_found";
    }
    if (message.includes("network") || message.includes("fetch") || message.includes("cors")) {
      return "network";
    }
    if (message.includes("mixed content")) {
      return "mixed_content";
    }
    if (message.includes("timeout")) {
      return "timeout";
    }
    if (message.includes("json parse") || message.includes("json")) {
      return "json_parse";
    }

    return "unknown";
  }
}

export const objectIntelligenceEngine = new ObjectIntelligenceEngine();
