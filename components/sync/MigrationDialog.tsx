"use client";

import { Cloud, ArrowRight } from "lucide-react";
import { DataStats } from "@/lib/sync/types";

interface MigrationDialogProps {
  stats: DataStats;
  onMigrate: () => void;
  onKeepLocal: () => void;
}

export function MigrationDialog({ stats, onMigrate, onKeepLocal }: MigrationDialogProps) {
  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Cloud className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">欢迎回来</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          检测到你的浏览器中已有数据：
        </p>
      </div>

      <div className="space-y-2 rounded-xl bg-muted/50 p-4">
        <StatRow label="Memory" value={stats.memories} />
        <StatRow label="Objects" value={stats.objects} />
        <StatRow label="Notes" value={stats.notes} />
        <StatRow label="Relations" value={stats.relations} />
        <StatRow label="Tags" value={stats.tags} />
        <StatRow label="Templates" value={stats.templates} />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        是否同步到你的账号？
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onMigrate}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 active:scale-[0.98]"
        >
          同步到账号
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={onKeepLocal}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          暂时保留本地
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value} 条</span>
    </div>
  );
}
