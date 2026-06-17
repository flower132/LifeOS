import { create } from "zustand";
import { storage } from "@/lib/storage";
import { AppSettings } from "@/lib/storage/types";
import {
  AIProviderId,
  DEFAULT_PROVIDER_CONFIGS,
  isValidAIProviderId,
} from "@/lib/ai/types";

export type Language = AppSettings["language"];
export type Theme = AppSettings["theme"];
export type AccentColor = AppSettings["accentColor"];
export type DateFormat = AppSettings["dateFormat"];
export type TimeFormat = AppSettings["timeFormat"];
export type AIProvider = AppSettings["aiProvider"];

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  theme: "light",
  themeColor: "light",
  accentColor: "blue",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  aiEnabled: true,
  aiPrivacyMode: false,
  aiProvider: "mock",
  aiModel: DEFAULT_PROVIDER_CONFIGS.mock.model,
  aiBaseUrl: DEFAULT_PROVIDER_CONFIGS.mock.baseUrl,
  aiApiKey: "",
  openaiKey: "",
  anthropicKey: "",
};

interface SettingsState extends AppSettings {
  loaded: boolean;
  _loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  hydrate: () => Promise<void>;
  persist: () => void;
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setThemeColor: (themeColor: AppSettings["themeColor"]) => Promise<void>;
  setAccentColor: (accentColor: AccentColor) => Promise<void>;
  setDateFormat: (dateFormat: DateFormat) => Promise<void>;
  setTimeFormat: (timeFormat: TimeFormat) => Promise<void>;
  setAIEnabled: (enabled: boolean) => Promise<void>;
  setAIPrivacyMode: (enabled: boolean) => Promise<void>;
  setAIProvider: (provider: AIProvider) => Promise<void>;
  setAIModel: (model: string) => Promise<void>;
  setAIBaseUrl: (baseUrl: string) => Promise<void>;
  setAIApiKey: (apiKey: string) => Promise<void>;
  reset: () => Promise<void>;
}

function coerceLanguage(value: string): Language {
  return value === "zh" ? "zh" : "en";
}

function coerceTheme(value: string): Theme {
  if (value === "dark" || value === "system") return value;
  return "light";
}

function coerceThemeColor(value: string): AppSettings["themeColor"] {
  return value === "dark" ? "dark" : "light";
}

function coerceAccentColor(value: string): AccentColor {
  if (value === "green" || value === "purple" || value === "orange") return value;
  return "blue";
}

function coerceDateFormat(value: string): DateFormat {
  if (value === "MM/DD/YYYY" || value === "DD/MM/YYYY") return value;
  return "YYYY-MM-DD";
}

function coerceTimeFormat(value: string): TimeFormat {
  return value === "12h" ? "12h" : "24h";
}

function coerceAIProvider(value: string): AIProviderId {
  return isValidAIProviderId(value) ? value : "mock";
}

function migrateLegacyAISettings(raw: Partial<AppSettings>): Partial<AppSettings> {
  const migrated: Partial<AppSettings> = { ...raw };

  // If the new unified key is already set, nothing to migrate.
  if (migrated.aiApiKey) return migrated;

  const provider = coerceAIProvider(migrated.aiProvider ?? "mock");
  const defaults = DEFAULT_PROVIDER_CONFIGS[provider];

  if (provider === "openai" && migrated.openaiKey) {
    migrated.aiApiKey = migrated.openaiKey;
    migrated.aiBaseUrl = defaults.baseUrl;
    migrated.aiModel =
      migrated.aiModel && migrated.aiModel !== "default"
        ? migrated.aiModel
        : defaults.model;
  } else if (provider === "anthropic" && migrated.anthropicKey) {
    migrated.aiApiKey = migrated.anthropicKey;
    migrated.aiBaseUrl = defaults.baseUrl;
    migrated.aiModel =
      migrated.aiModel && migrated.aiModel !== "default"
        ? migrated.aiModel
        : defaults.model;
  }

  return migrated;
}

function mergeWithDefaults(raw: Partial<AppSettings>): AppSettings {
  const migrated = migrateLegacyAISettings(raw);
  const provider = coerceAIProvider(migrated.aiProvider ?? DEFAULT_SETTINGS.aiProvider);
  const defaults = DEFAULT_PROVIDER_CONFIGS[provider];

  return {
    ...DEFAULT_SETTINGS,
    language: coerceLanguage(migrated.language ?? DEFAULT_SETTINGS.language),
    theme: coerceTheme(migrated.theme ?? DEFAULT_SETTINGS.theme),
    themeColor: coerceThemeColor(
      migrated.themeColor ?? DEFAULT_SETTINGS.themeColor
    ),
    accentColor: coerceAccentColor(
      migrated.accentColor ?? DEFAULT_SETTINGS.accentColor
    ),
    dateFormat: coerceDateFormat(migrated.dateFormat ?? DEFAULT_SETTINGS.dateFormat),
    timeFormat: coerceTimeFormat(migrated.timeFormat ?? DEFAULT_SETTINGS.timeFormat),
    aiEnabled:
      migrated.aiEnabled !== undefined ? Boolean(migrated.aiEnabled) : DEFAULT_SETTINGS.aiEnabled,
    aiPrivacyMode:
      migrated.aiPrivacyMode !== undefined
        ? Boolean(migrated.aiPrivacyMode)
        : DEFAULT_SETTINGS.aiPrivacyMode,
    aiProvider: provider,
    aiModel:
      typeof migrated.aiModel === "string" && migrated.aiModel.length > 0
        ? migrated.aiModel
        : defaults.model,
    aiBaseUrl:
      typeof migrated.aiBaseUrl === "string" && migrated.aiBaseUrl.length > 0
        ? migrated.aiBaseUrl
        : defaults.baseUrl,
    aiApiKey: typeof migrated.aiApiKey === "string" ? migrated.aiApiKey : DEFAULT_SETTINGS.aiApiKey,
    openaiKey: typeof migrated.openaiKey === "string" ? migrated.openaiKey : DEFAULT_SETTINGS.openaiKey,
    anthropicKey: typeof migrated.anthropicKey === "string" ? migrated.anthropicKey : DEFAULT_SETTINGS.anthropicKey,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,
  _loading: false,
  error: null,

  load: async () => {
    set({ _loading: true, error: null });
    try {
      const raw = await storage.getSettings();
      const settings = mergeWithDefaults(raw);
      set({ ...settings, loaded: true, _loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load settings";
      set({ error: message, loaded: true, _loading: false });
    }
  },
  hydrate: async () => get().load(),
  persist: () => {
    const state = get();
    void storage.setSettings({
      language: state.language,
      theme: state.theme,
      themeColor: state.themeColor,
      accentColor: state.accentColor,
      dateFormat: state.dateFormat,
      timeFormat: state.timeFormat,
      aiEnabled: state.aiEnabled,
      aiPrivacyMode: state.aiPrivacyMode,
      aiProvider: state.aiProvider,
      aiModel: state.aiModel,
      aiBaseUrl: state.aiBaseUrl,
      aiApiKey: state.aiApiKey,
      openaiKey: state.openaiKey,
      anthropicKey: state.anthropicKey,
    });
  },

  setLanguage: async (language) => {
    set({ language });
    try {
      await storage.setSettings({ language });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save language" });
    }
  },

  setTheme: async (theme) => {
    const themeColor: AppSettings["themeColor"] = theme === "dark" ? "dark" : "light";
    set({ theme, themeColor });
    try {
      await storage.setSettings({ theme, themeColor });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save theme" });
    }
  },

  setThemeColor: async (themeColor) => {
    set({ themeColor });
    try {
      await storage.setSettings({ themeColor });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save theme color" });
    }
  },

  setAccentColor: async (accentColor) => {
    set({ accentColor });
    try {
      await storage.setSettings({ accentColor });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save accent color" });
    }
  },

  setDateFormat: async (dateFormat) => {
    set({ dateFormat });
    try {
      await storage.setSettings({ dateFormat });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save date format" });
    }
  },

  setTimeFormat: async (timeFormat) => {
    set({ timeFormat });
    try {
      await storage.setSettings({ timeFormat });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save time format" });
    }
  },

  setAIEnabled: async (aiEnabled) => {
    set({ aiEnabled });
    try {
      await storage.setSettings({ aiEnabled });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI setting" });
    }
  },

  setAIPrivacyMode: async (aiPrivacyMode) => {
    set({ aiPrivacyMode });
    try {
      await storage.setSettings({ aiPrivacyMode });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI privacy mode" });
    }
  },

  setAIProvider: async (aiProvider) => {
    set({ aiProvider });
    try {
      await storage.setSettings({ aiProvider });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI provider" });
    }
  },

  setAIModel: async (aiModel) => {
    set({ aiModel });
    try {
      await storage.setSettings({ aiModel });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI model" });
    }
  },

  setAIBaseUrl: async (aiBaseUrl) => {
    set({ aiBaseUrl });
    try {
      await storage.setSettings({ aiBaseUrl });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI base URL" });
    }
  },

  setAIApiKey: async (aiApiKey) => {
    set({ aiApiKey });
    try {
      await storage.setSettings({ aiApiKey });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save AI API key" });
    }
  },

  reset: async () => {
    set({ ...DEFAULT_SETTINGS });
    try {
      await storage.setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to reset settings" });
    }
  },
}));
