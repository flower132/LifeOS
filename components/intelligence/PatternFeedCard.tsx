"use client";

import { useState } from "react";
import { Lightbulb, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { IntelligencePattern } from "@/lib/types";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { IntelligenceEvidenceList } from "./IntelligenceEvidenceList";

interface PatternFeedCardProps {
  patterns: IntelligencePattern[];
}

export function PatternFeedCard({ patterns }: PatternFeedCardProps) {
  const { t } = useTranslation();
  const { dismissPattern, feedbackPattern } = useIntelligenceStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const activePatterns = patterns.filter((p) => p.status === "active");

  if (activePatterns.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {t("patterns") ?? "Patterns"}
        </h2>
      </div>

      <div className="space-y-3">
        {activePatterns.slice(0, 2).map((pattern) => (
          <div
            key={pattern.id}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">{pattern.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {pattern.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void dismissPattern(pattern.id)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("dismiss")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [pattern.id]: !prev[pattern.id] }))
                }
                className="text-xs font-medium text-accent hover:text-accent/90"
              >
                {expanded[pattern.id]
                  ? t("hideEvidence") ?? "隐藏证据"
                  : t("viewEvidence") ?? "查看证据"}
              </button>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void feedbackPattern(pattern.id, "agree")}
                  className={`rounded-lg p-1 ${
                    pattern.userFeedback === "agree"
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={t("thisIsMe") ?? "是的"}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void feedbackPattern(pattern.id, "disagree")}
                  className={`rounded-lg p-1 ${
                    pattern.userFeedback === "disagree"
                      ? "text-destructive bg-destructive/10"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={t("thisIsNotMe") ?? "这不是我"}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {expanded[pattern.id] && (
              <div className="mt-3 border-t border-border pt-3">
                <IntelligenceEvidenceList evidence={pattern.evidence} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
