"use client";

import { ObjectAISuggestion } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, X, RotateCcw } from "lucide-react";

export interface AISuggestionCardProps {
  suggestion: ObjectAISuggestion;
  onDone?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onReactivate?: (id: string) => void;
  dimmed?: boolean;
}

const priorityStyles: Record<
  ObjectAISuggestion["priority"],
  string
> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-muted text-muted-foreground",
};

const actionConfigs: Record<
  string,
  { icon: typeof Check; labelKey: string }
> = {
  done: { icon: Check, labelKey: "markDone" },
  dismissed: { icon: X, labelKey: "dismiss" },
  active: { icon: RotateCcw, labelKey: "reactivate" },
};

export function AISuggestionCard({
  suggestion,
  onDone,
  onDismiss,
  onReactivate,
  dimmed,
}: AISuggestionCardProps) {
  const { t } = useTranslation();

  const priorityLabel = t(
    `aiPriority${suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}`
  );

  const availableActions: ObjectAISuggestion["status"][] = [];
  if (suggestion.status === "active") {
    availableActions.push("done", "dismissed");
  } else {
    availableActions.push("active");
  }

  const handleAction = (status: ObjectAISuggestion["status"]) => {
    if (status === "done") onDone?.(suggestion.id);
    if (status === "dismissed") onDismiss?.(suggestion.id);
    if (status === "active") onReactivate?.(suggestion.id);
  };

  return (
    <Card variant="ai" className={dimmed ? "opacity-60" : undefined}>
      <div className="mb-2 flex items-center justify-between">
        <Badge className={priorityStyles[suggestion.priority]}>{priorityLabel}</Badge>
        <div className="flex items-center gap-1">
          {availableActions.map((status) => {
            const config = actionConfigs[status];
            const Icon = config.icon;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleAction(status)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent"
                title={t(config.labelKey) ?? config.labelKey}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
      <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
      {suggestion.completedAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("completedAt")}:{" "}
          {new Date(suggestion.completedAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
