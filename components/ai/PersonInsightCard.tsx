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

  const traits = insight?.traits ?? [];
  const relationshipStatus = insight?.relationship_status ?? "";
  const notesText = insight?.notes ?? "";

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          {t("aiPersonProfile")}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900" />
        </div>
      ) : hasError || !insight ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("aiUnavailable")}</p>
      ) : (
        <div className="space-y-4">
          {notesText && (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {notesText}
            </p>
          )}

          {(traits?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("personalityTraits")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {traits.map((trait, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
                  >
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relationshipStatus && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("relationship")}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {relationshipStatus}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
