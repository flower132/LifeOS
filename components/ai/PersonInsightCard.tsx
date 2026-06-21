"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note, Relation } from "@/lib/types";
import { aiService, PersonInsight } from "@/lib/ai";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface PersonInsightCardProps {
  object: LifeObject;
  notes: Note[];
  relations: Relation[];
  getObjectName: (id: string) => string;
}

export function PersonInsightCard({
  object,
  notes,
  relations,
  getObjectName,
}: PersonInsightCardProps) {
  const { t } = useTranslation();
  const [insight, setInsight] = useState<PersonInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setHasError(false);
      try {
        const result = await aiService.generatePersonProfile(
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

  const traits = Array.isArray(insight?.traits) ? insight.traits : [];
  const relationshipStatus = insight?.relationship_status ?? "";
  const notesText = insight?.notes ?? "";

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("aiPersonProfile")}
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
          {notesText && (
            <p className="text-sm leading-relaxed text-foreground">
              {notesText}
            </p>
          )}

          {(traits?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("personalityTraits")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {traits.map((trait, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-background px-2.5 py-1 text-xs text-foreground shadow-sm"
                  >
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relationshipStatus && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("relationship")}
              </p>
              <p className="text-sm text-foreground">
                {relationshipStatus}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
