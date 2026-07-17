import "server-only";

import { AIProvider } from "./provider";
import { RoutableProviderId } from "./models";
import { deepseekProvider } from "./providers/deepseek";
import { kimiProvider } from "./providers/kimi";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";
import { claudeProvider } from "./providers/claude";

// ---------------------------------------------------------------------------
// Provider Registry — the single place providers are registered. The router
// resolves providers exclusively through here; a provider is "enabled" when
// its API key exists in the server environment, so adding a key in ops is all
// it takes to bring a provider online.
// ---------------------------------------------------------------------------

export const PROVIDER_REGISTRY: Record<RoutableProviderId, AIProvider> = {
  deepseek: deepseekProvider,
  kimi: kimiProvider,
  gemini: geminiProvider,
  openai: openaiProvider,
  claude: claudeProvider,
};

/** Env vars that enable each provider (tried in order). */
const PROVIDER_KEY_ENV: Record<RoutableProviderId, string[]> = {
  deepseek: ["DEEPSEEK_API_KEY"],
  kimi: ["KIMI_API_KEY", "MOONSHOT_API_KEY"],
  gemini: ["GEMINI_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  claude: ["ANTHROPIC_API_KEY"],
};

export function getProvider(id: RoutableProviderId): AIProvider {
  return PROVIDER_REGISTRY[id];
}

export function listProviders(): RoutableProviderId[] {
  return Object.keys(PROVIDER_REGISTRY) as RoutableProviderId[];
}

/** A provider is enabled when its API key is present in the environment. */
export function isProviderEnabled(id: RoutableProviderId): boolean {
  return PROVIDER_KEY_ENV[id].some((envName) => Boolean(process.env[envName]));
}

/** Primary env var name for a provider's key (for actionable errors). */
export function primaryKeyEnv(id: RoutableProviderId): string {
  return PROVIDER_KEY_ENV[id][0];
}

/** All currently enabled providers — used by the router's degradation. */
export function listEnabledProviders(): RoutableProviderId[] {
  return listProviders().filter(isProviderEnabled);
}
