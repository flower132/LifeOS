"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { DataStats, RemoteSummary } from "@/lib/sync/types";
import { useTranslation } from "@/lib/useTranslation";

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
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"merge" | "local" | "remote">("merge");

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t("sync.conflict.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("sync.conflict.description")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DataBox title={t("sync.conflict.localData")} stats={localStats} />
        <DataBox title={t("sync.conflict.accountData")} summary={remoteSummary} />
      </div>

      <div className="space-y-2">
        <Option
          label={t("sync.conflict.merge")}
          description={t("sync.conflict.mergeDescription")}
          selected={selected === "merge"}
          onClick={() => setSelected("merge")}
          recommended
        />
        <Option
          label={t("sync.conflict.useAccount")}
          description={t("sync.conflict.useAccountDescription")}
          selected={selected === "remote"}
          onClick={() => setSelected("remote")}
        />
        <Option
          label={t("sync.conflict.useLocal")}
          description={t("sync.conflict.useLocalDescription")}
          selected={selected === "local"}
          onClick={() => setSelected("local")}
        />
      </div>

      <button
        type="button"
        onClick={() => onResolve(selected)}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 active:scale-[0.98]"
      >
        {t("sync.conflict.confirm")}
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
  const { t } = useTranslation();
  const items = stats
    ? [
        { label: t("objectsTitle"), value: stats.objects },
        { label: t("memory"), value: stats.memories },
        { label: t("notes"), value: stats.notes },
        { label: t("relations"), value: stats.relations },
      ]
    : summary
    ? [
        { label: t("objectsTitle"), value: summary.objects },
        { label: t("notes"), value: summary.notes },
        { label: t("relations"), value: summary.relations },
        { label: t("tags"), value: summary.tags },
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
  const { t } = useTranslation();
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
              {t("sync.conflict.recommended")}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
