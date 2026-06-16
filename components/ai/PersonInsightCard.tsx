"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note, Relation } from "@/lib/types";
import { aiService, PersonProfile } from "@/lib/ai";
import { Sparkles, User } from "lucide-react";
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
  const [insight, setInsight] = useState<PersonProfile | null>(null);
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
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {insight.summary}
          </p>

          {insight.personality_traits.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("personalityTraits")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {insight.personality_traits.map((trait, i) => (
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

          {insight.recent_behavior_patterns.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("recentPatterns")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
                {insight.recent_behavior_patterns.map((pattern, i) => (
                  <li key={i}>{pattern}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.relationship_summary && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("relationship")}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{insight.relationship_summary}</p>
            </div>
          )}

          {insight.attention_needed.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("attentionNeeded")}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
                {insight.attention_needed.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("interactionLevel")}: {" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">{insight.interaction_level}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
