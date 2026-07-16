import { useSettingsStore } from "@/stores/settingsStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useNoteStore } from "@/stores/noteStore";
import { Note } from "@/lib/types";

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function isInDNDWindow(
  start: string,
  end: string,
  now = new Date()
): boolean {
  const startTime = parseTime(start);
  const endTime = parseTime(end);
  if (!startTime || !endTime) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startTime.hour * 60 + startTime.minute;
  const endMinutes = endTime.hour * 60 + endTime.minute;

  if (startMinutes === endMinutes) return false;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  // Overnight window, e.g. 22:00 - 07:00
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function hasLowMoodSignal(
  notes: Note[],
  keywords: string[],
  now = new Date()
): boolean {
  if (keywords.length === 0) return false;

  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const recent = notes.filter((n) => n.created_at >= cutoff);
  if (recent.length === 0) return false;

  return recent.some((note) =>
    keywords.some((keyword) =>
      note.content.toLowerCase().includes(keyword.toLowerCase())
    )
  );
}

export function shouldCompanionBeQuiet(now = new Date()): boolean {
  const settings = useSettingsStore.getState();
  if (!settings.quietMode?.enabled) return false;

  const meta = useIntelligenceStore.getState().companionMeta;
  const notes = useNoteStore.getState().notes;

  if (
    isInDNDWindow(
      settings.quietMode.doNotDisturbStart,
      settings.quietMode.doNotDisturbEnd,
      now
    )
  ) {
    return true;
  }

  const threshold = settings.quietMode.consecutiveRejectionThreshold;
  if (
    typeof threshold === "number" &&
    threshold > 0 &&
    meta.consecutiveRejections >= threshold
  ) {
    return true;
  }

  if (
    hasLowMoodSignal(notes, settings.quietMode.lowMoodKeywords ?? [], now)
  ) {
    return true;
  }

  return false;
}
