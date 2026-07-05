"use client";

import { Loader2, CheckCircle2, CircleAlert, CloudOff } from "lucide-react";
import { useSyncStore } from "@/stores/syncStore";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 10) return "刚刚";
  if (diff < 60) return `${diff} 秒前`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function SyncStatusBadge({ showText = true }: { showText?: boolean }) {
  const { status, lastSyncAt, isOnline, pendingCount } = useSyncStore();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CloudOff className="h-4 w-4" />
        {showText && <span>离线</span>}
      </div>
    );
  }

  if (status === "syncing") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-accent">
        <Loader2 className="h-4 w-4 animate-spin" />
        {showText && <span>同步中…</span>}
      </div>
    );
  }

  if (status === "pending" || pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
        {showText && <span>等待同步</span>}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-sm text-destructive">
        <CircleAlert className="h-4 w-4" />
        {showText && <span>同步失败</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4" />
      {showText && (
        <span>{lastSyncAt ? `已同步 · ${formatRelativeTime(lastSyncAt)}` : "已同步"}</span>
      )}
    </div>
  );
}
