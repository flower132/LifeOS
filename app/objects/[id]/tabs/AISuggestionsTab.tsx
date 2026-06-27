"use client";

import { LifeObject, ObjectAISuggestion } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface AISuggestionsTabProps {
  object: LifeObject;
}

export function AISuggestionsTab({ object }: AISuggestionsTabProps) {
  const { t } = useTranslation();
  const suggestions = object.aiSuggestions ?? [];

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiSuggestionsEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ObjectAISuggestion }) {
  const { t } = useTranslation();

  const priorityClass =
    suggestion.priority === "high"
      ? "bg-destructive/10 text-destructive"
      : suggestion.priority === "medium"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-muted text-muted-foreground";

  const priorityLabel = t(
    `aiPriority${suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}`
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass}`}>
          {priorityLabel}
        </span>
      </div>
      <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
    </div>
  );
}
