import { create } from "zustand";
import { storage } from "@/lib/storage";
import { AppSettings } from "@/lib/storage/types";
import {
  DEFAULT_ACCENT_COLOR,
  isAccentColorId,
} from "@/lib/theme/accentColors";

export type Language = AppSettings["language"];
export type Theme = AppSettings["theme"];
export type AccentColor = AppSettings["accentColor"];
export type DateFormat = AppSettings["dateFormat"];
export type TimeFormat = AppSettings["timeFormat"];

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  theme: "light",
  themeColor: "light",
  accentColor: "purple",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  aiEnabled: true,
  aiPrivacyMode: false,
  companionEnabled: true,
  allowNotifications: false,
  quietMode: {
    enabled: true,
    doNotDisturbStart: "22:00",
    doNotDisturbEnd: "07:00",
    consecutiveRejectionThreshold: 3,
    lowMoodKeywords: ["累", "难过", "烦躁", "tired", "sad", "疲惫", "焦虑"],
  },
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
  setCompanionEnabled: (enabled: boolean) => Promise<void>;
  setAllowNotifications: (enabled: boolean) => Promise<void>;
  setQuietMode: (quietMode: AppSettings["quietMode"]) => Promise<void>;
  reset: () => Promise<void>;
}

function coerceLanguage(value: string): Language {
  return value === "zh" ? "zh" : "en";
}

function coerceTheme(value: string): Theme {
  return value === "dark" || value === "system" ? value : "light";
}

function coerceThemeColor(value: string): AppSettings["themeColor"] {
  return value === "dark" ? "dark" : "light";
}

function coerceAccentColor(value: string): AccentColor {
  // 统一由 accentColors 配置守卫：新增颜色无需改这里，
  // 且不会再把合法颜色（如 blue）强制重置为 purple。
  return isAccentColorId(value) ? value : DEFAULT_ACCENT_COLOR;
}

function coerceDateFormat(value: string): DateFormat {
  return value === "MM/DD/YYYY" || value === "DD/MM/YYYY" ? value : "YYYY-MM-DD";
}

function coerceTimeFormat(value: string): TimeFormat {
  return value === "12h" ? "12h" : "24h";
}

function coerceQuietMode(
  value: unknown
): AppSettings["quietMode"] {
  const defaults = DEFAULT_SETTINGS.quietMode;
  if (!value || typeof value !== "object") return defaults;
  const q = value as Record<string, unknown>;
  return {
    enabled: typeof q.enabled === "boolean" ? q.enabled : defaults.enabled,
    doNotDisturbStart:
      typeof q.doNotDisturbStart === "string"
        ? q.doNotDisturbStart
        : defaults.doNotDisturbStart,
    doNotDisturbEnd:
      typeof q.doNotDisturbEnd === "string"
        ? q.doNotDisturbEnd
        : defaults.doNotDisturbEnd,
    consecutiveRejectionThreshold:
      typeof q.consecutiveRejectionThreshold === "number"
        ? q.consecutiveRejectionThreshold
        : defaults.consecutiveRejectionThreshold,
    lowMoodKeywords: Array.isArray(q.lowMoodKeywords)
      ? q.lowMoodKeywords.filter((k): k is string => typeof k === "string")
      : defaults.lowMoodKeywords,
  };
}

/**
 * Legacy BYOK keys (user-provided provider/apiKey/baseUrl/model) must not
 * remain in browser storage: all AI traffic now goes through /api/ai with
 * env-configured server keys. Writing undefined drops the keys on serialize.
 */
function stripLegacyBYOKSettings(raw: Partial<AppSettings>): void {
  const legacy = raw as Record<string, unknown>;
  const LEGACY_KEYS = [
    "aiProvider",
    "aiApiKey",
    "aiModel",
    "aiBaseUrl",
    "openaiKey",
    "anthropicKey",
  ];
  if (!LEGACY_KEYS.some((key) => key in legacy)) return;

  const patch: Record<string, undefined> = {};
  for (const key of LEGACY_KEYS) patch[key] = undefined;
  void storage.setSettings(patch as Partial<AppSettings>).catch(() => {
    // Best-effort cleanup; never block settings load.
  });
}

function mergeWithDefaults(raw: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    language: coerceLanguage(raw.language ?? DEFAULT_SETTINGS.language),
    theme: coerceTheme(raw.theme ?? DEFAULT_SETTINGS.theme),
    themeColor: coerceThemeColor(raw.themeColor ?? DEFAULT_SETTINGS.themeColor),
    accentColor: coerceAccentColor(raw.accentColor ?? DEFAULT_SETTINGS.accentColor),
    dateFormat: coerceDateFormat(raw.dateFormat ?? DEFAULT_SETTINGS.dateFormat),
    timeFormat: coerceTimeFormat(raw.timeFormat ?? DEFAULT_SETTINGS.timeFormat),
    aiEnabled:
      raw.aiEnabled !== undefined ? Boolean(raw.aiEnabled) : DEFAULT_SETTINGS.aiEnabled,
    aiPrivacyMode:
      raw.aiPrivacyMode !== undefined
        ? Boolean(raw.aiPrivacyMode)
        : DEFAULT_SETTINGS.aiPrivacyMode,
    companionEnabled:
      raw.companionEnabled !== undefined
        ? Boolean(raw.companionEnabled)
        : DEFAULT_SETTINGS.companionEnabled,
    allowNotifications:
      raw.allowNotifications !== undefined
        ? Boolean(raw.allowNotifications)
        : DEFAULT_SETTINGS.allowNotifications,
    quietMode: coerceQuietMode(raw.quietMode),
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
      stripLegacyBYOKSettings(raw);
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
      companionEnabled: state.companionEnabled,
      allowNotifications: state.allowNotifications,
      quietMode: state.quietMode,
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

  setCompanionEnabled: async (companionEnabled) => {
    set({ companionEnabled });
    try {
      await storage.setSettings({ companionEnabled });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save companion setting" });
    }
  },

  setAllowNotifications: async (allowNotifications) => {
    set({ allowNotifications });
    try {
      await storage.setSettings({ allowNotifications });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save notification setting" });
    }
  },

  setQuietMode: async (quietMode) => {
    set({ quietMode });
    try {
      await storage.setSettings({ quietMode });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save quiet mode" });
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
