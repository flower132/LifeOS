"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Clock, SkipForward } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { CompanionEvidenceList } from "@/components/companion/CompanionEvidenceList";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { companionService } from "@/lib/companion";
import { recordFeedback } from "@/lib/companion/learning";
import { getLocalDateString } from "@/lib/companion/utils/date";

export function ReminderCard() {
  const { t } = useTranslation();
  const today = getLocalDateString();
  const reminders = useIntelligenceStore((s) => s.cache.reminders);
  const hydrated = useIntelligenceStore((s) => s.hydrated);
  const companionEnabled = useSettingsStore((s) => s.companionEnabled);
  const setReminders = useIntelligenceStore((s) => s.setReminders);

  const reminder =
    reminders.find((r) => r.date === today && r.status === "pending") ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await companionService.maybeScheduleReminder();
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
    if (!reminder && !isLoading && !error) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, reminder, companionEnabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateReminder = async (updates: Partial<typeof reminder>) => {
    if (!reminder) return;
    const next = reminders.map((r) =>
      r.id === reminder.id
        ? { ...r, ...updates, respondedAt: new Date().toISOString() }
        : r
    );
    await setReminders(next);
  };

  const sourceId =
    reminder?.objectId || reminder?.relationId || reminder?.memoryId || reminder?.id;

  const handleDone = () => {
    void updateReminder({ status: "done" });
    if (reminder) {
      recordFeedback({
        kind: "reminder",
        itemId: reminder.id,
        action: "done",
        reason: `sourceId:${sourceId}`,
      });
    }
  };

  const handleLater = () => {
    void updateReminder({ status: "later" });
    if (reminder) {
      recordFeedback({
        kind: "reminder",
        itemId: reminder.id,
        action: "later",
        reason: `sourceId:${sourceId}`,
      });
    }
  };

  const handleSkip = () => {
    void updateReminder({ status: "skipped" });
    if (reminder) {
      recordFeedback({
        kind: "reminder",
        itemId: reminder.id,
        action: "skip",
        reason: `sourceId:${sourceId}`,
      });
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          {t("reminderLoading")}
        </div>
      </div>
    );
  }

  if (!companionEnabled || !reminder) {
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
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {t("todayReminder")}
        </h2>
      </div>

      <p className="mb-1 text-sm font-medium text-foreground">{reminder.title}</p>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{reminder.whyNow}</p>

      <CompanionEvidenceList evidence={reminder.evidence} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDone}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Check className="h-3.5 w-3.5" />
          {t("done")}
        </button>
        <button
          type="button"
          onClick={handleLater}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Clock className="h-3.5 w-3.5" />
          {t("later")}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <SkipForward className="h-3.5 w-3.5" />
          {t("skip")}
        </button>
      </div>
    </div>
  );
}
