"use client";

import { useEffect, useState } from "react";
import { LifeObject, Note, Relation } from "@/lib/types";
import { aiService, PersonProfile } from "@/lib/ai";
import { Sparkles, User } from "lucide-react";

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
  const [insight, setInsight] = useState<PersonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aiService
      .generatePersonProfile(object, notes, relations, getObjectName)
      .then((result) => {
        if (!cancelled) setInsight(result);
      })
      .catch(() => {
        if (!cancelled)
          setInsight({
            summary: "AI insight unavailable for this person.",
            personality_traits: [],
            recent_behavior_patterns: [],
            relationship_summary: "",
            interaction_level: "low",
            attention_needed: [],
          });
      })
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [object, notes, relations, getObjectName]);

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-900">AI Person Profile</h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-indigo-100" />
        </div>
      ) : insight ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-700">
            {insight.summary}
          </p>

          {insight.personality_traits.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Personality Traits
              </p>
              <ul className="flex flex-wrap gap-2">
                {insight.personality_traits.map((trait, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
                  >
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.recent_behavior_patterns.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recent Patterns
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {insight.recent_behavior_patterns.map((pattern, i) => (
                  <li key={i}>{pattern}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.relationship_summary && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Relationship
              </p>
              <p className="text-sm text-slate-700">{insight.relationship_summary}</p>
            </div>
          )}

          {insight.attention_needed.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attention Needed
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                {insight.attention_needed.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">
              Interaction level: {" "}
              <span className="font-medium text-slate-700">{insight.interaction_level}</span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
