"use client";

import { useEffect, useState } from "react";
import { LifeObject, AIAnalysisHistoryEntry } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { getAIAnalysisHistoryByObjectId } from "@/lib/ai/objectIntelligence/history";
import { formatDateTime } from "@/lib/utils";

interface HistoryTabProps {
  object: LifeObject;
}

export function HistoryTab({ object }: HistoryTabProps) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<AIAnalysisHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAIAnalysisHistoryByObjectId(object.id)
      .then((entries) => {
        if (mounted) setHistory(entries);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [object.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiHistoryEmpty") ?? "No AI analysis history yet."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function HistoryCard({ entry }: { entry: AIAnalysisHistoryEntry }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const profileChanged = Boolean(entry.profileSnapshot);
  const insightsCount = entry.insightsSnapshot?.length ?? 0;
  const suggestionsCount = entry.suggestionsSnapshot?.length ?? 0;
  const memoriesCount = entry.memoriesSnapshot?.length ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {formatDateTime(entry.createdAt)}
          </div>
          <div className="text-xs text-muted-foreground">
            {entry.provider} / {entry.model} · {entry.durationMs}ms
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-accent hover:text-accent/90"
        >
          {expanded ? t("collapse") ?? "Collapse" : t("expand") ?? "Expand"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {profileChanged && (
          <Badge>{t("aiProfileSection")} {t("changed")}</Badge>
        )}
        {insightsCount > 0 && (
          <Badge>
            {insightsCount} {t("aiInsightsSection")}
          </Badge>
        )}
        {suggestionsCount > 0 && (
          <Badge>
            {suggestionsCount} {t("aiSuggestionsSection")}
          </Badge>
        )}
        {memoriesCount > 0 && (
          <Badge>
            {memoriesCount} {t("aiMemoriesSection")}
          </Badge>
        )}
      </div>

      {entry.rawTextInput && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium">{t("aiInputTextLabel")}: </span>
          {entry.rawTextInput.slice(0, 200)}
          {entry.rawTextInput.length > 200 && "..."}
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {entry.profileSnapshot && (
            <SnapshotSection title={t("aiProfileSection")}>
              <pre className="overflow-x-auto text-xs text-muted-foreground">
                {JSON.stringify(entry.profileSnapshot, null, 2)}
              </pre>
            </SnapshotSection>
          )}
          {entry.insightsSnapshot && entry.insightsSnapshot.length > 0 && (
            <SnapshotSection title={t("aiInsightsSection")}>
              <ul className="space-y-2">
                {entry.insightsSnapshot.map((insight) => (
                  <li key={insight.id} className="text-sm">
                    <span className="font-medium">[{insight.category}] {insight.title}</span>
                    <p className="text-muted-foreground">{insight.description}</p>
                  </li>
                ))}
              </ul>
            </SnapshotSection>
          )}
          {entry.suggestionsSnapshot &&
            entry.suggestionsSnapshot.length > 0 && (
              <SnapshotSection title={t("aiSuggestionsSection")}>
                <ul className="space-y-2">
                  {entry.suggestionsSnapshot.map((suggestion) => (
                    <li key={suggestion.id} className="text-sm">
                      <span className="font-medium">[{suggestion.priority}] {suggestion.title}</span>
                      <p className="text-muted-foreground">{suggestion.description}</p>
                    </li>
                  ))}
                </ul>
              </SnapshotSection>
            )}
          {entry.memoriesSnapshot && entry.memoriesSnapshot.length > 0 && (
            <SnapshotSection title={t("aiMemoriesSection")}>
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {entry.memoriesSnapshot.map((memory) => (
                  <li key={memory.id}>{memory.content}</li>
                ))}
              </ul>
            </SnapshotSection>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

function SnapshotSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}
