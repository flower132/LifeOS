import { AIProviderId } from "./types";

export const KNOWN_VISION_MODELS = new Set([
  // OpenAI
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4-turbo",
  "gpt-4-vision",
  // Anthropic
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-3-5-sonnet",
  "claude-3-opus",
  "claude-3-sonnet",
  // Gemini
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.0-pro-vision",
  // OpenRouter aliases
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-4-turbo",
  "anthropic/claude-3-5-sonnet",
  "google/gemini-1.5-pro",
  "google/gemini-1.5-flash",
]);

function modelNameMatchesKnownVisionModel(model: string): boolean {
  const lower = model.toLowerCase();
  for (const known of KNOWN_VISION_MODELS) {
    if (lower.includes(known.toLowerCase())) return true;
  }
  return false;
}

export function isVisionCapable(
  provider: AIProviderId,
  model: string
): boolean {
  switch (provider) {
    case "anthropic":
    case "gemini":
      // Modern Anthropic and Gemini models universally support vision.
      return true;
    case "openai":
    case "openrouter":
    case "kimi":
    case "siliconflow":
    case "deepseek":
      // OpenAI-compatible providers: detect by model name.
      return modelNameMatchesKnownVisionModel(model);
    case "ollama":
    case "custom":
    case "mock":
    default:
      // Unknown capability: degrade gracefully.
      return false;
  }
}
