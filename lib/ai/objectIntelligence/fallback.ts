import { AIProvider, AIProviderId, AITask } from "@/lib/ai/types";
import { createMockProvider } from "@/lib/ai/mock";
import { createServerTaskProvider } from "@/lib/ai/serverProxy";
import { useSettingsStore } from "@/stores/settingsStore";

export interface SelectedProvider {
  provider: AIProvider;
  providerId: AIProviderId;
  model: string;
  /** True when privacy mode, AI disabled, SSR, or an explicit mock request. */
  isMock: boolean;
}

/**
 * Determine which provider should serve an AI task.
 *
 * Mock stays 100% client-side (zero network calls) and is selected when:
 *   - rendering on the server (no settings available)
 *   - AI is disabled or privacy mode is on
 *   - the caller explicitly requests a mock run
 *
 * Otherwise a server task proxy is returned: generation goes through
 * /api/ai, and the router there resolves task → provider → model. A missing
 * server key surfaces as the unified `invalid_key` error through the
 * engines' existing error paths.
 */
export function selectProviderForTask(
  task: AITask,
  opts?: { forceMock?: boolean }
): SelectedProvider {
  if (typeof window === "undefined" || opts?.forceMock) {
    return createMockSelection();
  }

  const state = useSettingsStore.getState();
  if (!state.aiEnabled || state.aiPrivacyMode) {
    return createMockSelection();
  }

  return {
    provider: createServerTaskProvider(task),
    providerId: "server",
    model: "",
    isMock: false,
  };
}

function createMockSelection(): SelectedProvider {
  return {
    provider: createMockProvider(),
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
