"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useTranslation } from "@/lib/useTranslation";
import { SelfAIProfile } from "@/lib/types";
import { LabelValueCard } from "@/components/ui/LabelValueCard";

export function SelfSummaryCard() {
  const { t } = useTranslation();
  const { objects, loaded } = useObjectStore();

  const self = objects.find((o) => o.type === "self");
  const profile = self?.aiProfile as SelfAIProfile | undefined;

  if (!loaded || !self || !profile?.understandingSummary) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {self.name}
          </h2>
        </div>
        <Link
          href={`/objects/${self.id}`}
          className="text-xs font-medium text-accent hover:text-accent/90"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="space-y-4">
        <LabelValueCard label={t("selfCurrentFocus")}>
          {profile.currentFocus || t("aiNotAvailable")}
        </LabelValueCard>

        <LabelValueCard label={t("selfUnderstanding")}>
          {profile.understandingSummary}
        </LabelValueCard>
      </div>
    </div>
  );
}
