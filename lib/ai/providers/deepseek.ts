import "server-only";

import { AIProvider } from "../provider";
import { createOpenAICompatibleProvider } from "./openaiCompatible";

/**
 * DeepSeek provider — the active provider.
 *
 * Supported: chat / JSON output (analyze / extract / summarize via JSON mode);
 * tool calling is wired at the protocol level (reserved). Vision, document,
 * audio and embeddings have no official DeepSeek endpoint here and return a
 * controlled NotSupported result.
 *
 * Key: process.env.DEEPSEEK_API_KEY (server only).
 */
export const deepseekProvider: AIProvider = createOpenAICompatibleProvider({
  id: "deepseek",
  label: "DeepSeek",
  defaultBaseUrl: "https://api.deepseek.com/v1",
  baseUrlEnv: "DEEPSEEK_BASE_URL",
  apiKeyEnv: ["DEEPSEEK_API_KEY"],
  supportsVisionRequests: false,
});
