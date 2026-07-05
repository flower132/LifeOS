"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, RefreshCw, Sparkles } from "lucide-react";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";
import { EvidenceList } from "@/components/advisor/EvidenceList";
import { useTranslation } from "@/lib/useTranslation";
import { AdvisorContext, AdvisorHomeInsightResult } from "@/lib/ai/advisor/types";
import { advisorService } from "@/lib/ai/advisor";
import { selectTodayFocus } from "@/lib/ai/advisor/focusSelector";

export function TodayFocusCard() {
  const { t } = useTranslation();
  const { objects, loaded: objectsLoaded } = useObjectStore();
  const { notes, loaded: notesLoaded } = useNoteStore();
  const { getByObjectId: getRelationsByObjectId } = useRelationStore();

  const [insight, setInsight] = useState<AdvisorHomeInsightResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const object = useMemo(() => {
    return selectTodayFocus(objects, notes);
  }, [objects, notes]);

  const context: AdvisorContext | null = useMemo(() => {
    if (!object) return null;
    const objectNotes = notes
      .filter((n) => n.object_id === object.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    const relations = getRelationsByObjectId(object.id);
    const relatedObjectIds = new Set<string>();
    relations.forEach((r) => {
      relatedObjectIds.add(r.source_object_id);
      relatedObjectIds.add(r.target_object_id);
    });
    relatedObjectIds.delete(object.id);
    const relatedObjects = objects.filter((o) => relatedObjectIds.has(o.id)
    );
    return {
      object,
      notes: objectNotes,
      relations,
      relatedObjects,
    };
  }, [object, notes, getRelationsByObjectId, objects]);

  const generateInsight = async () => {
    if (!context) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await advisorService.generateHomeInsight(context);
      setInsight(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (context && !insight && !isLoading) {
      void generateInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isReady = objectsLoaded && notesLoaded;

  if (!isReady) {
    return (
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    );
  }

  if (!object || !context) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("advisorNoFocus")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("todayFocus")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void generateInsight()}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent/10 hover:text-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {t("advisorRefresh")}
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <ObjectTypeBadge type={object.type} />
        <Link
          href={`/objects/${object.id}`}
          className="text-base font-medium text-foreground hover:text-accent"
        >
          {object.name}
        </Link>
        <Link
          href={`/advisor?objectId=${object.id}`}
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("askLifeOS")}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {insight?.narrative ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("advisorInsightTitle")}
            </h3>
            <p className="text-sm leading-relaxed text-foreground">
              {insight.narrative}
            </p>
            <EvidenceList evidence={insight.evidence} />
          </div>

          {insight.maybeToday && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("advisorMaybeTodayTitle")}
              </h3>
              <p className="text-sm leading-relaxed text-foreground">
                {insight.maybeToday}
              </p>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-accent/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-accent/10" />
        </div>
      ) : null}
    </div>
  );
}
