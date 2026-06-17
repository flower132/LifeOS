import {
  AIProvider,
  AIProviderConfig,
  AIProviderId,
} from "./types";
import { createMockProvider } from "./providers/mock";
import { createOpenAIProvider } from "./providers/openai";
import { createAnthropicProvider } from "./providers/anthropic";
import { createDeepSeekProvider } from "./providers/deepseek";
import { createKimiProvider } from "./providers/kimi";
import { createGeminiProvider } from "./providers/gemini";
import { createOpenRouterProvider } from "./providers/openrouter";
import { createSiliconFlowProvider } from "./providers/siliconflow";
import { createOllamaProvider } from "./providers/ollama";
import { createCustomProvider } from "./providers/custom";

type Factory = (config: AIProviderConfig) => AIProvider;

class AIProviderRegistry {
  private providers = new Map<AIProviderId, Factory>();

  register(id: AIProviderId, factory: Factory): void {
    this.providers.set(id, factory);
  }

  create(id: AIProviderId, config: AIProviderConfig): AIProvider {
    const factory = this.providers.get(id);
    if (!factory) {
      throw new Error(`Unknown AI provider: ${id}`);
    }
    return factory(config);
  }

  has(id: AIProviderId): boolean {
    return this.providers.has(id);
  }
}

export const registry = new AIProviderRegistry();

registry.register("mock", createMockProvider);
registry.register("openai", createOpenAIProvider);
registry.register("anthropic", createAnthropicProvider);
registry.register("deepseek", createDeepSeekProvider);
registry.register("kimi", createKimiProvider);
registry.register("gemini", createGeminiProvider);
registry.register("openrouter", createOpenRouterProvider);
registry.register("siliconflow", createSiliconFlowProvider);
registry.register("ollama", createOllamaProvider);
registry.register("custom", createCustomProvider);
