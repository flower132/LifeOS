"use client";

import { LifeObject, ObjectAISuggestion } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { useObjectStore } from "@/stores/objectStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { AISuggestionCard } from "@/components/ai/cards";

interface AISuggestionsTabProps {
  object: LifeObject;
}

export function AISuggestionsTab({ object }: AISuggestionsTabProps) {
  const { t } = useTranslation();
  const { updateObject } = useObjectStore();
  const suggestions = object.aiSuggestions ?? [];

  const activeSuggestions = suggestions.filter((s) => s.status === "active");
  const doneSuggestions = suggestions.filter((s) => s.status === "done");
  const dismissedSuggestions = suggestions.filter(
    (s) => s.status === "dismissed"
  );

  const updateStatus = (id: string, status: ObjectAISuggestion["status"]) => {
    const next = suggestions.map((s) =>
      s.id === id
        ? {
            ...s,
            status,
            completedAt:
              status === "done" ? new Date().toISOString() : undefined,
          }
        : s
    );
    void updateObject(object.id, { aiSuggestions: next });
  };

  if (suggestions.length === 0) {
    return (
      <EmptyState description={t("aiSuggestionsEmpty")} />
    );
  }

  return (
    <div className="space-y-8">
      <SuggestionSection
        title={t("aiSuggestionsActive")}
        suggestions={activeSuggestions}
        emptyText={t("aiNoActiveSuggestions")}
        onDone={(id) => updateStatus(id, "done")}
        onDismiss={(id) => updateStatus(id, "dismissed")}
      />

      {doneSuggestions.length > 0 && (
        <SuggestionSection
          title={t("aiSuggestionsDone")}
          suggestions={doneSuggestions}
          emptyText=""
          onReactivate={(id) => updateStatus(id, "active")}
          dimmed
        />
      )}

      {dismissedSuggestions.length > 0 && (
        <SuggestionSection
          title={t("aiSuggestionsDismissed")}
          suggestions={dismissedSuggestions}
          emptyText=""
          onReactivate={(id) => updateStatus(id, "active")}
          dimmed
        />
      )}
    </div>
  );
}

interface SuggestionSectionProps {
  title: string;
  suggestions: ObjectAISuggestion[];
  emptyText: string;
  onDone?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onReactivate?: (id: string) => void;
  dimmed?: boolean;
}

function SuggestionSection({
  title,
  suggestions,
  emptyText,
  onDone,
  onDismiss,
  onReactivate,
  dimmed,
}: SuggestionSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({suggestions.length})
      </h3>
      {suggestions.length === 0 ? (
        emptyText && (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <AISuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDone={onDone}
              onDismiss={onDismiss}
              onReactivate={onReactivate}
              dimmed={dimmed}
            />
          ))}
        </div>
      )}
    </section>
  );
}
