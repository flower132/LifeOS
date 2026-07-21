"use client";

import { useEffect, useState } from "react";
import { Moon, Send, X } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { CompanionEvidenceList } from "@/components/companion/CompanionEvidenceList";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { companionService } from "@/lib/companion";
import { recordFeedback } from "@/lib/companion/learning";
import { getLocalDateString } from "@/lib/companion/utils/date";

export function ReflectionCard() {
  const { t } = useTranslation();
  const today = getLocalDateString();
  const reflections = useIntelligenceStore((s) => s.cache.reflections);
  const hydrated = useIntelligenceStore((s) => s.hydrated);
  const companionEnabled = useSettingsStore((s) => s.companionEnabled);
  const setReflections = useIntelligenceStore((s) => s.setReflections);

  const reflection =
    reflections.find((r) => r.date === today && r.status === "pending") ?? null;

  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await companionService.ensureReflection();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiAnalysisFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    if (!companionEnabled) return;
    const hour = new Date().getHours();
    if (hour >= 18 && !reflection && !isLoading && !error) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, reflection, companionEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateReflection = async (
    updates: Partial<typeof reflection>
  ) => {
    if (!reflection) return;
    const next = reflections.map((r) =>
      r.id === reflection.id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    await setReflections(next);
  };

  const handleAnswer = () => {
    if (!answer.trim()) return;
    void updateReflection({ answer: answer.trim(), status: "answered", answeredAt: new Date().toISOString() });
    if (reflection) {
      recordFeedback({
        kind: "reflection",
        itemId: reflection.id,
        action: "done",
        reason: `sourceId:${reflection.seedId}`,
      });
    }
  };

  const handleDismiss = () => {
    void updateReflection({ status: "dismissed" });
    if (reflection) {
      recordFeedback({
        kind: "reflection",
        itemId: reflection.id,
        action: "dismiss",
        reason: `sourceId:${reflection.seedId}`,
      });
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          {t("reflectionLoading")}
        </div>
      </div>
    );
  }

  if (!companionEnabled || !reflection) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <ErrorState description={error} onRetry={() => void generate()} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("eveningReflection")}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-foreground">{reflection.question}</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={t("reflectionPlaceholder")}
        rows={3}
        className="mb-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
      />

      <div className="flex items-center justify-between">
        <CompanionEvidenceList evidence={reflection.evidence} />
        <button
          type="button"
          onClick={handleAnswer}
          disabled={!answer.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {t("answer")}
        </button>
      </div>
    </div>
  );
}
