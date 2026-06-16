"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { t } from "@/lib/i18n";

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  return {
    language,
    t: (key: string, vars: Record<string, string> = {}) => t(key, language, vars),
  };
}
