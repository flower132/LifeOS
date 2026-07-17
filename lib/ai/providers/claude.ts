import "server-only";

import {
  AIProviderError,
  AIProviderV2,
} from "../provider";

/**
 * Claude provider — RESERVED.
 *
 * The full interface is implemented as throwing stubs so the router can
 * resolve Claude models from MODEL_CATALOG today. To activate: implement
 * generate()/chat() against the Anthropic Messages API (key from
 * process.env.ANTHROPIC_API_KEY) and repoint tasks in TASK_ROUTING.
 */
class ClaudeProvider implements AIProviderV2 {
  readonly id = "claude" as const;

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

export const claudeProvider = new ClaudeProvider();
