import "server-only";

import {
  AIProviderError,
  AIProviderV2,
} from "../provider";

/**
 * Gemini provider — RESERVED.
 *
 * To activate: implement generate()/chat() against the Gemini generateContent
 * API (key from process.env.GEMINI_API_KEY) and repoint tasks in
 * TASK_ROUTING (lib/ai/models.ts).
 */
class GeminiProvider implements AIProviderV2 {
  readonly id = "gemini" as const;

  async generate(): Promise<never> {
    throw new AIProviderError("not_implemented", "Not Implemented");
  }

  async chat(): Promise<never> {
    throw new AIProviderError("not_implemented", "Not Implemented");
  }

  async stream(): Promise<never> {
    throw new AIProviderError("not_implemented", "Not Implemented");
  }

  async embedding(): Promise<never> {
    throw new AIProviderError("not_implemented", "Not Implemented");
  }
}

export const geminiProvider = new GeminiProvider();
