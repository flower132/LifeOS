import "server-only";

import { AIProvider } from "../provider";
import { createOpenAICompatibleProvider } from "./openaiCompatible";

/**
 * OpenAI provider — code-ready, disabled until keyed.
 *
 * Reserved surface per architecture: chat / vision / audio / file /
 * reasoning. Chat and vision are wired today; audio (transcribe) and file
 * upload return controlled NotSupported results until wired.
 *
 * Enable: set OPENAI_API_KEY in the server environment.
 */
export const openaiProvider: AIProvider = createOpenAICompatibleProvider({
  id: "openai",
  label: "OpenAI",
  defaultBaseUrl: "https://api.openai.com/v1",
  baseUrlEnv: "OPENAI_BASE_URL",
  apiKeyEnv: ["OPENAI_API_KEY"],
  supportsVisionRequests: true,
});
