"use client";

import { useMemo, useRef, useState } from "react";
import {
  Settings,
  Monitor,
  Database,
  Bot,
  Info,
  Download,
  Upload,
  Trash2,
  Activity,
  Terminal,
  History,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { hydrateStores } from "@/stores";
import { useTranslation } from "@/lib/useTranslation";
import { AIProviderId } from "@/lib/ai/types";
import { aiService, AITestResult, getAILogs, clearAILogs } from "@/lib/ai";
import { AIUsageLog } from "@/lib/ai/types";
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
import { AccountCard } from "@/components/settings/AccountCard";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonBlock, SkeletonText } from "@/components/ui/Skeleton";

import pkg from "@/package.json";

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
  const [testingAI, setTestingAI] = useState(false);
  const [testResult, setTestResult] = useState<AITestResult | null>(null);
  const [logs, setLogs] = useState<AIUsageLog[]>(() => getAILogs());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageUsage = useMemo(() => calculateStorageUsage(), []);

  const maskedApiKey = useMemo(() => {
    if (!aiApiKey) return "";
    if (aiApiKey.length <= 8) return "*".repeat(aiApiKey.length);
    return `${aiApiKey.slice(0, 4)}${"*".repeat(aiApiKey.length - 8)}${aiApiKey.slice(-4)}`;
  }, [aiApiKey]);

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

  const handleTestConnection = async () => {
    setTestingAI(true);
    setTestResult(null);
    try {
      const result = await aiService.testConnection();
      setTestResult(result);
      setLogs(getAILogs());
    } finally {
      setTestingAI(false);
    }
  };

  const handleClearLogs = () => {
    clearAILogs();
    setLogs([]);
  };

  const refreshLogs = () => {
    setLogs(getAILogs());
  };

  if (!loaded) {
    return (
      <WorkspaceLayout
        title={t("settingsTitle")}
        loading
        loadingSkeleton={
          <div className="space-y-6">
            <SkeletonText className="h-8 w-48" />
            <SkeletonBlock className="h-32" />
          </div>
        }
      />
    );
  }

  return (
    <WorkspaceLayout
      backHref="/home"
      backLabel={t("backToHome")}
      title={t("settingsTitle")}
      subtitle={t("settingsSubtitle")}
      icon={<Settings className="h-6 w-6 text-foreground" />}
      actions={<UserAvatar size="md" href="/settings/account" />}
      error={error ?? undefined}
    >
      <div className="space-y-6">

        {/* Account & Sync */}
        <SectionCard icon={Database} title={t("settingsAccountAndSync")}>
          <AccountCard />
        </SectionCard>

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
            <ErrorState
              description={importError}
              onRetry={handleImportClick}
              retryLabel={t("importJson")}
            />
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

            <button
              type="button"
              onClick={() => void handleTestConnection()}
              disabled={testingAI || aiProvider === "mock"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {testingAI ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              {testingAI ? t("testing") : t("testConnection")}
            </button>

            {aiProvider === "mock" && (
              <p className="text-xs text-muted-foreground">
                {t("testConnectionMockNotAvailable")}
              </p>
            )}

            {testResult && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  testResult.success
                    ? "border-green-500/20 bg-green-500/10 text-green-700"
                    : "border-destructive/20 bg-destructive/10 text-destructive"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.success
                    ? t("connectionSuccess")
                    : t("connectionFailed")}
                </div>
                <div className="mt-1 space-y-1 text-xs opacity-90">
                  <p>
                    {t("aiProvider")}: {activeProviderLabel}
                  </p>
                  <p>
                    {t("aiModel")}: {testResult.model || "-"}
                  </p>
                  {testResult.durationMs > 0 && (
                    <p>
                      {t("duration")}: {testResult.durationMs}ms
                    </p>
                  )}
                  {testResult.error && (
                    <p className="font-medium">{testResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* AI Debug */}
        <SectionCard icon={Terminal} title={t("aiDebug")}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("aiProvider")}</span>
              <span className="font-medium text-foreground">
                {activeProviderLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("aiModel")}</span>
              <span className="font-medium text-foreground">{aiModel || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("aiBaseUrl")}</span>
              <span className="max-w-[60%] truncate font-medium text-foreground">
                {aiBaseUrl || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("aiApiKey")}</span>
              <span className="font-medium text-foreground">
                {maskedApiKey || t("apiKeyHidden")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("aiEnabled")}</span>
              <span className="font-medium text-foreground">
                {aiEnabled ? t("toggleOn") : t("toggleOff")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("aiPrivacyMode")}
              </span>
              <span className="font-medium text-foreground">
                {aiPrivacyMode ? t("toggleOn") : t("toggleOff")}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* AI Logs */}
        <SectionCard icon={History} title={t("aiLogs")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={refreshLogs}
                className="text-xs font-medium text-accent hover:underline"
              >
                {t("refresh")}
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-xs font-medium text-destructive hover:underline"
              >
                {t("clearLogs")}
              </button>
            </div>

            {logs.length === 0 ? (
              <EmptyState description={t("noLogsYet")} />
            ) : (
              <div className="max-h-64 space-y-2 overflow-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border bg-background p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          log.status === "success"
                            ? "bg-green-500/10 text-green-700"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {log.status === "success" ? t("success") : t("error")}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      <p>
                        {t("aiProvider")}: {log.provider} · {t("aiModel")}:{" "}
                        {log.model}
                      </p>
                      <p>
                        {t("duration")}: {log.durationMs}ms
                      </p>
                      {log.error && (
                        <p className="text-destructive">{log.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    </WorkspaceLayout>
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
