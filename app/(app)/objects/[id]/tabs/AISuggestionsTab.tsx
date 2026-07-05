"use client";

import { LifeObject, ObjectAISuggestion } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { useObjectStore } from "@/stores/objectStore";
import { Check, X, RotateCcw } from "lucide-react";

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

  const updateSuggestionStatus = (
    id: string,
    status: ObjectAISuggestion["status"]
  ) => {
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
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiSuggestionsEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SuggestionSection
        title={t("aiSuggestionsActive") ?? "Active"}
        suggestions={activeSuggestions}
        emptyText={t("aiNoActiveSuggestions") ?? "No active suggestions."}
        actions={[
          {
            status: "done",
            icon: Check,
            label: t("markDone") ?? "Done",
          },
          {
            status: "dismissed",
            icon: X,
            label: t("dismiss") ?? "Dismiss",
          },
        ]}
        onAction={updateSuggestionStatus}
      />

      {doneSuggestions.length > 0 && (
        <SuggestionSection
          title={t("aiSuggestionsDone") ?? "Done"}
          suggestions={doneSuggestions}
          emptyText=""
          actions={[
            {
              status: "active",
              icon: RotateCcw,
              label: t("reactivate") ?? "Reactivate",
            },
          ]}
          onAction={updateSuggestionStatus}
          dimmed
        />
      )}

      {dismissedSuggestions.length > 0 && (
        <SuggestionSection
          title={t("aiSuggestionsDismissed") ?? "Dismissed"}
          suggestions={dismissedSuggestions}
          emptyText=""
          actions={[
            {
              status: "active",
              icon: RotateCcw,
              label: t("reactivate") ?? "Reactivate",
            },
          ]}
          onAction={updateSuggestionStatus}
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
  actions: { status: ObjectAISuggestion["status"]; icon: React.ComponentType<{ className?: string }>; label: string }[];
  onAction: (id: string, status: ObjectAISuggestion["status"]) => void;
  dimmed?: boolean;
}

function SuggestionSection({
  title,
  suggestions,
  emptyText,
  actions,
  onAction,
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
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              actions={actions}
              onAction={onAction}
              dimmed={dimmed}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface SuggestionCardProps {
  suggestion: ObjectAISuggestion;
  actions: { status: ObjectAISuggestion["status"]; icon: React.ComponentType<{ className?: string }>; label: string }[];
  onAction: (id: string, status: ObjectAISuggestion["status"]) => void;
  dimmed?: boolean;
}

function SuggestionCard({
  suggestion,
  actions,
  onAction,
  dimmed,
}: SuggestionCardProps) {
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
    <div
      className={`rounded-xl border border-border bg-card p-4 ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass}`}
        >
          {priorityLabel}
        </span>
        <div className="flex items-center gap-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.status}
                type="button"
                onClick={() => onAction(suggestion.id, action.status)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent"
                title={action.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
      <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        {suggestion.description}
      </p>
      {suggestion.completedAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("completedAt") ?? "Completed"}:{" "}
          {new Date(suggestion.completedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
