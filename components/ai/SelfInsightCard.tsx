"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note, Relation } from "@/lib/types";
import { aiService, SelfInsight } from "@/lib/ai";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface SelfInsightCardProps {
  object: LifeObject;
  notes: Note[];
  relations: Relation[];
  getObjectName: (id: string) => string;
}

export function SelfInsightCard({
  object,
  notes,
  relations,
  getObjectName,
}: SelfInsightCardProps) {
  const { t } = useTranslation();
  const [insight, setInsight] = useState<SelfInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setHasError(false);
      try {
        const result = await aiService.generateSelfState(
          object,
          notes,
          relations,
          getObjectName
        );
        if (!cancelled) setInsight(result);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [object, notes, relations, getObjectName]);

  const summary = insight?.summary ?? "";
  const focusAreas = Array.isArray(insight?.focus_areas)
    ? insight.focus_areas
    : [];
  const strengths = Array.isArray(insight?.strengths)
    ? insight.strengths
    : [];
  const weaknesses = Array.isArray(insight?.weaknesses)
    ? insight.weaknesses
    : [];

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("aiSelfState")}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-accent/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-accent/10" />
        </div>
      ) : hasError || !insight ? (
        <p className="text-sm text-muted-foreground">{t("aiUnavailable")}</p>
      ) : (
        <div className="space-y-4">
          {summary && (
            <p className="text-sm leading-relaxed text-foreground">
              {summary}
            </p>
          )}

          {(focusAreas?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("focusAreas")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
                {focusAreas.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(strengths?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("personalityTraits")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {strengths.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-background px-2.5 py-1 text-xs text-foreground shadow-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(weaknesses?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("risks")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
                {weaknesses.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
