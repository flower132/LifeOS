import enUS from "./en-US";
import jaJP from "./ja-JP";
import zhCN from "./zh-CN";

export const supportedLocales = ["zh-CN", "en-US", "ja-JP"] as const;
export type Locale = (typeof supportedLocales)[number];
export type TranslationValues = Record<string, string | number>;

export const dictionaries: Record<Locale, Readonly<Record<string, string>>> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ja-JP": jaJP,
};

/** Maps persisted language values to a UI locale without changing AI prompt language. */
export function localeFromLanguage(language: "zh" | "en"): Locale {
  return language === "zh" ? "zh-CN" : "en-US";
}

export function interpolate(message: string, values: TranslationValues = {}): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] === undefined ? match : String(values[key])
  );
}

export function resolveTranslation(
  key: string,
  locale: Locale,
  values: TranslationValues = {}
): string | undefined {
  const dictionary = dictionaries[locale];
  const count = values.count;
  const pluralKey = typeof count === "number"
    ? `${key}_${new Intl.PluralRules(locale).select(count)}`
    : key;
  return dictionary[pluralKey] ?? dictionary[key] ?? dictionaries["en-US"][pluralKey] ?? dictionaries["en-US"][key];
}
