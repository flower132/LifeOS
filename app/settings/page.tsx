"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Languages,
  Monitor,
  Palette,
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
    openaiKey,
    anthropicKey,
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
    setOpenAIKey,
    setAnthropicKey,
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
      <div className="min-h-screen bg-white px-6 py-10 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/home"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToHome")}
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-slate-700 dark:text-slate-200" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {t("settingsTitle")}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("settingsSubtitle")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* General */}
        <SectionCard icon={Monitor} title={t("general")}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("language")}
              </label>
              <select
                value={language}
                onChange={(e) => void setLanguage(e.target.value as "zh" | "en")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="en">{t("english")}</option>
                <option value="zh">{t("chinese")}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("theme")}
              </label>
              <select
                value={theme}
                onChange={(e) =>
                  void setTheme(e.target.value as "light" | "dark" | "system")
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="light">{t("light")}</option>
                <option value="dark">{t("dark")}</option>
                <option value="system">{t("system")}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("dateFormat")}
              </label>
              <select
                value={dateFormat}
                onChange={(e) =>
                  void setDateFormat(
                    e.target.value as "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY"
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("timeFormat")}
              </label>
              <select
                value={timeFormat}
                onChange={(e) => void setTimeFormat(e.target.value as "24h" | "12h")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="24h">24 {t("hour")}</option>
                <option value="12h">12 {t("hour")}</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard icon={Palette} title={t("appearance")}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                        ? "border-accent bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t(themeOption)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                        ? "border-accent bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
          </div>
        </SectionCard>

        {/* Language */}
        <SectionCard icon={Languages} title={t("language")}>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void setLanguage("zh")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                language === "zh"
                  ? "border-accent bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              简体中文
            </button>
            <button
              type="button"
              onClick={() => void setLanguage("en")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                language === "en"
                  ? "border-accent bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              English
            </button>
          </div>
        </SectionCard>

        {/* Data Management */}
        <SectionCard icon={Database} title={t("dataManagement")}>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {t("storageDescription")}
          </p>
          <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {t("storageUsage")}
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {formatStorageUsage(storageUsage)}
            </span>
          </div>

          {importError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              {exportingJson ? t("exporting") : t("exportJson")}
            </button>
            <button
              type="button"
              onClick={() => void handleExportMarkdown()}
              disabled={exportingMarkdown}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Upload className="h-4 w-4" />
              {importing ? t("importing") : t("importJson")}
            </button>
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={clearing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
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
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t("aiEnabled")}
              </span>
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => void setAIEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t("aiPrivacyMode")}
              </span>
              <input
                type="checkbox"
                checked={aiPrivacyMode}
                onChange={(e) => void setAIPrivacyMode(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("aiPrivacyModeDescription")}
            </p>

            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("aiProvider")}
              </span>
              <select
                value={aiProvider}
                onChange={(e) =>
                  void setAIProvider(e.target.value as "mock" | "openai" | "anthropic")
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="mock">{t("providerMock")}</option>
                <option value="openai">{t("providerOpenAI")}</option>
                <option value="anthropic">{t("providerAnthropic")}</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("currentProvider")}: {activeProviderLabel}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("aiModel")}
              </span>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => void setAIModel(e.target.value)}
                placeholder="default"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("openaiKey")}
              </span>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => void setOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("keyStoredLocally")}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("anthropicKey")}
              </span>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => void setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("keyStoredLocally")}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* About */}
        <SectionCard icon={Info} title={t("about")}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">{t("version")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {pkg.version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">{t("storageType")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {t("localStorage")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">{t("buildTime")}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">{t("aboutDescription")}</p>
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
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
