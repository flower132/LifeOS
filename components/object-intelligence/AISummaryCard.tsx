"use client";

import { useEffect, useMemo, useState } from "react";
import { LifeObject } from "@/lib/types";
import { useObjectIntelligenceStore } from "@/stores/objectIntelligenceStore";
import { useMemoryStore } from "@/stores/memoryStore";
import {
  objectIntelligenceEngine,
  objectIntelligenceUpdater,
} from "@/lib/object-intelligence";
import { ensureGraphSummary, getGraphSummary } from "@/lib/graph";
import { Card } from "@/components/ui/Card";
import { MessageCircleHeart, RefreshCw, Sparkles, TrendingUp, AlertTriangle, Network } from "lucide-react";
import { CommunicationDialog } from "./CommunicationDialog";
import { useTranslation } from "@/lib/useTranslation";

interface AISummaryCardProps {
  object: LifeObject;
}

/**
 * AI Summary Card — the object's living intelligence at the top of its page:
 * AI 理解 (summary/traits), 最近变化, 洞察, confidence, plus type-specific
 * extras (Goal 进展, Project Health) and the Communication Assistant.
 *
 * Performance: renders from the cached profile only — never triggers a
 * synchronous AI call. Missing profiles are queued for background build.
 */
export function AISummaryCard({ object }: AISummaryCardProps) {
  const { t } = useTranslation();
  const stored = useObjectIntelligenceStore((s) => s.profiles[object.id]);
  const profile = stored?.profile;
  const memories = useMemoryStore((s) => s.memories);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Queue a background build when the object has no profile yet.
  useEffect(() => {
    if (!profile) objectIntelligenceUpdater.ensureProfile(object.id);
  }, [object.id, profile]);

  // Graph summary: cached, refreshed in the background when stale.
  useEffect(() => {
    ensureGraphSummary(object.id);
  }, [object.id]);
  const graphSummary = useMemo(
    () => getGraphSummary(object.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [object.id, memories]
  );

  const goalInsight = useMemo(
    () => (object.type === "goal" ? objectIntelligenceEngine.getGoalInsight(object) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [object, profile]
  );
  const projectHealth = useMemo(
    () => (object.type === "project" ? objectIntelligenceEngine.getProjectHealth(object) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [object, profile]
  );

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await objectIntelligenceEngine.refreshProfile(object);
    } finally {
      setRefreshing(false);
    }
  };

  if (!profile) {
    return (
      <Card variant="ai" className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          {t("aiProfileBuilding")}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="ai" className="mb-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            {t("aiUnderstanding")}
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              {Math.round(profile.confidence * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            {object.type === "person" && (
              <button
                type="button"
                onClick={() => setAdviceOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20"
              >
                <MessageCircleHeart className="h-3.5 w-3.5" />
                {t("communicationAssistant")}
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              title={t("refresh")}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {profile.summary && (
          <p className="text-sm leading-relaxed text-foreground">{profile.summary}</p>
        )}

        {graphSummary && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Network className="h-3.5 w-3.5" />
              {t("graphSummary")}
            </p>
            <p className="leading-relaxed text-foreground">{graphSummary}</p>
          </div>
        )}

        {profile.traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {trait}
              </span>
            ))}
          </div>
        )}

        {profile.recentChanges.length > 0 && (
          <div className="text-sm">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              {t("recentChanges")}
            </p>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
              {profile.recentChanges.slice(0, 3).map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        {profile.communicationStyle && (
          <p className="rounded-lg bg-accent/5 p-3 text-sm text-foreground">
            💬 {profile.communicationStyle}
          </p>
        )}

        {profile.risk.length > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {profile.risk[0]}
          </p>
        )}

        {goalInsight && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-foreground">{goalInsight.message}</p>
            <p className="mt-0.5 text-muted-foreground">
              {t("suggestionLabel")}：{goalInsight.suggestion}
            </p>
          </div>
        )}

        {projectHealth && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">{projectHealth.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {projectHealth.reasons.join("；")}
            </p>
          </div>
        )}
      </Card>

      {object.type === "person" && (
        <CommunicationDialog
          person={object}
          open={adviceOpen}
          onClose={() => setAdviceOpen(false)}
        />
      )}
    </>
  );
}
