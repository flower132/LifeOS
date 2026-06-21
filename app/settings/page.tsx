"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Monitor,
  Database,
  Bot,
  Info,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { hydrateStores } from "@/stores";
import { useTranslation } from "@/lib/useTranslation";
import { AIProviderId } from "@/lib/ai/types";
import {
  exportAllData,
  downloadJson,
  exportAllDataAsMarkdown,
  downloadMarkdown,
  importAllData,
  calculateStorageUsage,
  formatStorageUsage,
  clearAllData,
} from "@/lib/export";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require("@/package.json");

export default function SettingsPage() {
  const { t } = useTranslation();
  const {
    language,
    theme,
    accentColor,
    dateFormat,
    timeFormat,
    aiEnabled,
    aiPrivacyMode,
    aiProvider,
    aiModel,
    aiBaseUrl,
    aiApiKey,
    loaded,
    error,
    setLanguage,
    setTheme,
    setAccentColor,
    setDateFormat,
    setTimeFormat,
    setAIEnabled,
    setAIPrivacyMode,
    setAIProvider,
    setAIModel,
    setAIBaseUrl,
    setAIApiKey,
  } = useSettingsStore();

  const [exportingJson, setExportingJson] = useState(false);
  const [exportingMarkdown, setExportingMarkdown] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageUsage = useMemo(() => calculateStorageUsage(), []);

  const activeProviderLabel = useMemo(() => {
    switch (aiProvider) {
      case "openai":
        return t("providerOpenAI");
      case "anthropic":
        return t("providerAnthropic");
      case "deepseek":
        return t("providerDeepSeek");
      case "kimi":
        return t("providerKimi");
      case "gemini":
        return t("providerGemini");
      case "openrouter":
        return t("providerOpenRouter");
      case "siliconflow":
        return t("providerSiliconFlow");
      case "ollama":
        return t("providerOllama");
      case "custom":
        return t("providerCustom");
      default:
        return t("providerMock");
    }
  }, [aiProvider, t]);

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const data = await exportAllData();
      downloadJson(data, `lifeos-export-${Date.now()}.json`);
    } finally {
      setExportingJson(false);
    }
  };

  const handleExportMarkdown = async () => {
    setExportingMarkdown(true);
    try {
      const content = await exportAllDataAsMarkdown();
      downloadMarkdown(content, `lifeos-export-${Date.now()}.md`);
    } finally {
      setExportingMarkdown(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      await hydrateStores();
      window.location.reload();
    } catch (err) {
      console.error("Failed to import data:", err);
      setImportError(
        err instanceof Error ? err.message : t("failedToImportData")
      );
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClear = async () => {
    if (!confirm(t("clearCacheConfirm"))) return;
    setClearing(true);
    await clearAllData();
    window.location.reload();
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/home"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToHome")}
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("settingsTitle")}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settingsSubtitle")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* General */}
        <SectionCard icon={Monitor} title={t("general")}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("language")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void setLanguage("zh")}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    language === "zh"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-input bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  简体中文
                </button>
                <button
                  type="button"
                  onClick={() => void setLanguage("en")}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    language === "en"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-input bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("theme")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["light", "dark", "system"] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    type="button"
                    onClick={() => void setTheme(themeOption)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      theme === themeOption
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-input bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {t(themeOption)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("accentColor")}
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(["blue", "green", "purple", "orange"] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => void setAccentColor(color)}
                    className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-colors ${
                      accentColor === color
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-input bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-full"
                      style={{
                        backgroundColor:
                          color === "blue"
                            ? "#3b82f6"
                            : color === "green"
                            ? "#22c55e"
                            : color === "purple"
                            ? "#8b5cf6"
                            : "#f97316",
                      }}
                    />
                    <span>{t(color)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("dateFormat")}
              </label>
              <select
                value={dateFormat}
                onChange={(e) =>
                  void setDateFormat(
                    e.target.value as "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY"
                  )
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("timeFormat")}
              </label>
              <select
                value={timeFormat}
                onChange={(e) => void setTimeFormat(e.target.value as "24h" | "12h")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              >
                <option value="24h">24 {t("hour")}</option>
                <option value="12h">12 {t("hour")}</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Data Management */}
        <SectionCard icon={Database} title={t("dataManagement")}>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("storageDescription")}
          </p>
          <div className="mb-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t("storageUsage")}
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatStorageUsage(storageUsage)}
            </span>
          </div>

          {importError && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {importError}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void handleExportJson()}
              disabled={exportingJson}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportingJson ? t("exporting") : t("exportJson")}
            </button>
            <button
              type="button"
              onClick={() => void handleExportMarkdown()}
              disabled={exportingMarkdown}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportingMarkdown ? t("exporting") : t("exportMarkdown")}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {importing ? t("importing") : t("importJson")}
            </button>
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={clearing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? t("clearing") : t("clearCache")}
            </button>
          </div>
        </SectionCard>

        {/* AI Settings */}
        <SectionCard icon={Bot} title={t("aiSettings")}>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {t("aiEnabled")}
              </span>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => void setAIEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-input text-accent focus:ring-accent"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {t("aiPrivacyMode")}
              </span>
              <input
                type="checkbox"
                checked={aiPrivacyMode}
                onChange={(e) => void setAIPrivacyMode(e.target.checked)}
                className="h-5 w-5 rounded border-input text-accent focus:ring-accent"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              {t("aiPrivacyModeDescription")}
            </p>

            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                {t("aiProvider")}
              </span>
              <select
                value={aiProvider}
                onChange={(e) =>
                  void setAIProvider(e.target.value as AIProviderId)
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              >
                <option value="mock">{t("providerMock")}</option>
                <option value="openai">{t("providerOpenAI")}</option>
                <option value="anthropic">{t("providerAnthropic")}</option>
                <option value="deepseek">{t("providerDeepSeek")}</option>
                <option value="kimi">{t("providerKimi")}</option>
                <option value="gemini">{t("providerGemini")}</option>
                <option value="openrouter">{t("providerOpenRouter")}</option>
                <option value="siliconflow">{t("providerSiliconFlow")}</option>
                <option value="ollama">{t("providerOllama")}</option>
                <option value="custom">{t("providerCustom")}</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {t("currentProvider")}: {activeProviderLabel}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                {t("aiModel")}
              </span>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => void setAIModel(e.target.value)}
                placeholder={t("aiModelPlaceholder")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                {t("aiBaseUrl")}
              </span>
              <input
                type="text"
                value={aiBaseUrl}
                onChange={(e) => void setAIBaseUrl(e.target.value)}
                placeholder={t("aiBaseUrlPlaceholder")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                {t("aiApiKey")}
              </span>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => void setAIApiKey(e.target.value)}
                placeholder={t("aiApiKeyPlaceholder")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground">
                {t("keyStoredLocally")}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* About */}
        <SectionCard icon={Info} title={t("about")}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("version")}</span>
              <span className="font-medium text-foreground">
                {pkg.version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("storageType")}</span>
              <span className="font-medium text-foreground">
                {t("localStorage")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("buildTime")}</span>
              <span className="font-medium text-foreground">
                {process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()}
              </span>
            </div>
            <p className="text-muted-foreground">{t("aboutDescription")}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold text-card-foreground">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
