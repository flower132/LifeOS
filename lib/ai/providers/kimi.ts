import "server-only";

import { AIProvider } from "../provider";
import { createOpenAICompatibleProvider } from "./openaiCompatible";

/**
 * Kimi (Moonshot AI) provider — code-ready, disabled until keyed.
 *
 * OpenAI-compatible Chat Completions; long-context models (128K) are declared
 * in the Model Registry. Reserved surface per architecture: chat / vision /
 * file / longContext — file uploads return NotSupported until wired.
 *
 * Enable: set KIMI_API_KEY (or MOONSHOT_API_KEY) in the server environment.
 */
export const kimiProvider: AIProvider = createOpenAICompatibleProvider({
  id: "kimi",
  label: "Kimi",
  defaultBaseUrl: "https://api.moonshot.cn/v1",
  baseUrlEnv: "KIMI_BASE_URL",
  apiKeyEnv: ["KIMI_API_KEY", "MOONSHOT_API_KEY"],
  supportsVisionRequests: true,
});
