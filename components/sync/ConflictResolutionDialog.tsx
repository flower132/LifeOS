"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { DataStats, RemoteSummary } from "@/lib/sync/types";

interface ConflictResolutionDialogProps {
  localStats: DataStats;
  remoteSummary: RemoteSummary;
  onResolve: (strategy: "merge" | "local" | "remote") => void;
}

export function ConflictResolutionDialog({
  localStats,
  remoteSummary,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [selected, setSelected] = useState<"merge" | "local" | "remote">("merge");

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">发现两份数据</h2>
        <p className="mt-1 text-sm text-muted-foreground">请选择如何处理</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DataBox title="本地数据" stats={localStats} />
        <DataBox title="账号数据" summary={remoteSummary} />
      </div>

      <div className="space-y-2">
        <Option
          label="合并（推荐）"
          description="UUID 不同全部保留，UUID 相同以更新时间新的为准。"
          selected={selected === "merge"}
          onClick={() => setSelected("merge")}
          recommended
        />
        <Option
          label="使用账号数据"
          description="用账号中的数据覆盖本地数据。"
          selected={selected === "remote"}
          onClick={() => setSelected("remote")}
        />
        <Option
          label="使用本地数据"
          description="用本地数据覆盖账号中的数据。"
          selected={selected === "local"}
          onClick={() => setSelected("local")}
        />
      </div>

      <button
        type="button"
        onClick={() => onResolve(selected)}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 active:scale-[0.98]"
      >
        确认选择
      </button>
    </div>
  );
}

function DataBox({
  title,
  stats,
  summary,
}: {
  title: string;
  stats?: DataStats;
  summary?: RemoteSummary;
}) {
  const items = stats
    ? [
        { label: "Objects", value: stats.objects },
        { label: "Memories", value: stats.memories },
        { label: "Notes", value: stats.notes },
        { label: "Relations", value: stats.relations },
      ]
    : summary
    ? [
        { label: "Objects", value: summary.objects },
        { label: "Notes", value: summary.notes },
        { label: "Relations", value: summary.relations },
        { label: "Tags", value: summary.tags },
      ]
    : [];

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Option({
  label,
  description,
  selected,
  onClick,
  recommended,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-accent bg-accent/5"
          : "border-border bg-background hover:bg-muted/50"
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-accent bg-accent text-accent-foreground" : "border-border"
        }`}
      >
        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {recommended && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
              推荐
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
