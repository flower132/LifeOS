import "server-only";

import {
  AIProviderError,
  AIProviderV2,
} from "../provider";

/**
 * OpenAI provider — RESERVED.
 *
 * To activate: implement generate()/chat() against the OpenAI Chat
 * Completions API (key from process.env.OPENAI_API_KEY) and repoint tasks
 * in TASK_ROUTING (lib/ai/models.ts).
 */
class OpenAIProvider implements AIProviderV2 {
  readonly id = "openai" as const;

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

export const openaiProvider = new OpenAIProvider();
