"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  interpolate,
  localeFromLanguage,
  resolveTranslation,
  type Locale,
  type TranslationValues,
} from "@/translations";

type TranslationContextValue = {
  locale: Locale;
  language: "zh" | "en";
  t: (key: string, values?: TranslationValues) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);
const warnedMissingKeys = new Set<string>();

export function TranslationProvider({ children }: { children: ReactNode }) {
  const language = useSettingsStore((state) => state.language);
  const locale = localeFromLanguage(language);

  const t = useCallback((key: string, values: TranslationValues = {}) => {
    const translated = resolveTranslation(key, locale, values);
    if (!translated) {
      if (process.env.NODE_ENV !== "production" && !warnedMissingKeys.has(key)) {
        warnedMissingKeys.add(key);
        console.warn(`[i18n] Missing translation: ${key}`);
      }
      return key;
    }
    return interpolate(translated, values);
  }, [locale]);

  const value = useMemo(() => ({ locale, language, t }), [language, locale, t]);
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslationContext(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) throw new Error("useTranslation must be used within TranslationProvider");
  return context;
}
