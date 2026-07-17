"use client";

import { useLayoutEffect, useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { hydrateStores } from "@/stores";
import { storage } from "@/lib/storage";
import { syncService } from "@/lib/sync/SyncService";
import { companionScheduler } from "@/lib/companion/scheduler";
import { longTermMemoryService } from "@/lib/services";
import {
  DEFAULT_ACCENT_COLOR,
  getAccentCssVariables,
  isAccentColorId,
} from "@/lib/theme/accentColors";
import { DevTools } from "./DevTools";
import { Spinner } from "@/components/ui/Spinner";

function getEffectiveThemeColor(
  theme: "light" | "dark" | "system"
): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
  }
  return theme === "dark" ? "dark" : "light";
}

function applyTheme(themeColor: "light" | "dark"): void {
  const html = document.documentElement;
  if (themeColor === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
  html.setAttribute("data-theme", themeColor);
}

/**
 * 写入整套 Accent CSS 变量（--accent / --accent-soft /
 * --accent-foreground / --shadow-focus），按明暗模式取变体。
 * 变量值统一来自 lib/theme/accentColors，禁止写死。
 */
function applyAccentColor(
  accentColor: string,
  mode: "light" | "dark"
): void {
  const id = isAccentColorId(accentColor) ? accentColor : DEFAULT_ACCENT_COLOR;
  const variables = getAccentCssVariables(id, mode);
  const style = document.documentElement.style;
  for (const [name, value] of Object.entries(variables)) {
    style.setProperty(name, value);
  }
}

function applyLanguage(language: "zh" | "en"): void {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
}

function applySettings(settings: ReturnType<typeof useSettingsStore.getState>): void {
  const themeColor = getEffectiveThemeColor(settings.theme);
  applyTheme(themeColor);
  applyAccentColor(settings.accentColor, themeColor);
  applyLanguage(settings.language);
}

function HydrationSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-3 text-center">
        <Spinner size="md" />
        <p className="text-sm text-muted-foreground">Loading LifeOS...</p>
      </div>
    </div>
  );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;

    async function runHydration() {
      try {
        await storage.migrateIfNeeded();
      } catch (err) {
        console.error("[LifeOS] Storage migration failed:", err);
      }

      try {
        await hydrateStores();
      } catch (err) {
        console.error("[LifeOS] Store hydration failed:", err);
      }

      try {
        syncService.init();
      } catch (err) {
        console.error("[LifeOS] Sync service init failed:", err);
      }

      if (cancelled) return;

      const settings = useSettingsStore.getState();
      applySettings(settings);
      setHydrated(true);
    }

    void runHydration();

    return () => {
      cancelled = true;
    };
  }, []);

  // React to settings changes after hydration.
  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe((state) => {
      applySettings(state);
    });
    return unsubscribe;
  }, []);

  // React to system theme changes when theme is set to "system".
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const settings = useSettingsStore.getState();
      if (settings.theme === "system") {
        applyTheme(getEffectiveThemeColor("system"));
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "dev";
      navigator.serviceWorker
        .register(`/sw.js?v=${buildId}`)
        .then((registration) => {
          console.log("[LifeOS] SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[LifeOS] SW registration failed:", error);
        });
    }
  }, []);

  // Trigger Daily Companion once stores are hydrated.
  useEffect(() => {
    if (!hydrated) return;
    companionScheduler.onPageVisit();
  }, [hydrated]);

  // Long-term Memory：订阅一手数据变化，启动时全量刷新一次。
  useEffect(() => {
    if (!hydrated) return;
    longTermMemoryService.init();
    longTermMemoryService.scheduleRefresh();
  }, [hydrated]);

  return (
    <>
      {hydrated ? children : <HydrationSkeleton />}
      <DevTools />
    </>
  );
}
