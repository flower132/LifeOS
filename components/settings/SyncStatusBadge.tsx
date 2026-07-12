"use client";

import { CheckCircle2, CircleAlert, CloudOff } from "lucide-react";
import { useSyncStore } from "@/stores/syncStore";
import { useTranslation } from "@/lib/useTranslation";
import { Spinner } from "@/components/ui/Spinner";

function formatRelativeTime(iso: string | null, t: ReturnType<typeof useTranslation>["t"]): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 10) return t("syncStatusJustNow");
  if (diff < 60) return t("syncStatusSecondsAgo", { seconds: String(diff) });
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return t("syncStatusMinutesAgo", { minutes: String(minutes) });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("syncStatusHoursAgo", { hours: String(hours) });
  const days = Math.floor(hours / 24);
  return t("syncStatusDaysAgo", { days: String(days) });
}

export function SyncStatusBadge({ showText = true }: { showText?: boolean }) {
  const { t } = useTranslation();
  const { status, lastSyncAt, isOnline, pendingCount } = useSyncStore();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CloudOff className="h-4 w-4" />
        {showText && <span>{t("syncStatusOffline")}</span>}
      </div>
    );
  }

  if (status === "syncing") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-accent">
        <Spinner size="sm" />
        {showText && <span>{t("syncStatusSyncing")}</span>}
      </div>
    );
  }

  if (status === "pending" || pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
        {showText && <span>{t("syncStatusPending")}</span>}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-destructive">
        <CircleAlert className="h-4 w-4" />
        {showText && <span>{t("syncStatusError")}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4" />
      {showText && (
        <span>{lastSyncAt ? t("syncStatusSyncedAt", { time: formatRelativeTime(lastSyncAt, t) }) : t("syncStatusSynced")}</span>
      )}
    </div>
  );
}
