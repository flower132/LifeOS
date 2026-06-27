import { AIProvider, AIProviderConfig, AIProviderId } from "@/lib/ai/types";
import { registry } from "@/lib/ai/registry";
import { useSettingsStore } from "@/stores/settingsStore";

export interface SelectedProvider {
  provider: AIProvider;
  providerId: AIProviderId;
  model: string;
  /** True when privacy mode, AI disabled, missing key, or explicit mock selected. */
  isMock: boolean;
}

/**
 * Determine which provider should be used for an analysis request.
 *
 * This function lives outside ObjectIntelligenceEngine so the engine stays
 * provider-agnostic. It respects:
 *   - AI disabled state
 *   - Privacy mode
 *   - Missing API key
 *   - Explicit mock selection
 */
export function selectProviderForAnalysis(config?: AIProviderConfig): SelectedProvider {
  if (typeof window === "undefined") {
    return createMockSelection();
  }

  const state = useSettingsStore.getState();

  if (!state.aiEnabled || state.aiPrivacyMode) {
    return createMockSelection();
  }

  const effectiveConfig: AIProviderConfig = config ?? {
    provider: state.aiProvider,
    apiKey: state.aiApiKey,
    baseUrl: state.aiBaseUrl,
    model: state.aiModel,
  };

  if (
    effectiveConfig.provider === "mock" ||
    !effectiveConfig.apiKey.trim()
  ) {
    return createMockSelection();
  }

  return {
    provider: registry.create(effectiveConfig.provider, effectiveConfig),
    providerId: effectiveConfig.provider,
    model: effectiveConfig.model,
    isMock: false,
  };
}

function createMockSelection(): SelectedProvider {
  const mockConfig: AIProviderConfig = {
    provider: "mock",
    apiKey: "",
    baseUrl: "",
    model: "mock",
  };

  return {
    provider: registry.create("mock", mockConfig),
    providerId: "mock",
    model: "mock",
    isMock: true,
  };
}

/**
 * Detect whether the analysis should run at all.
 *
 * Returns false only when AI is disabled and the caller did not explicitly
 * request a mock run (e.g. for testing or privacy-mode preview).
 */
export function shouldRunAnalysis(forceMock = false): boolean {
  if (forceMock) return true;
  if (typeof window === "undefined") return false;
  return useSettingsStore.getState().aiEnabled;
}
