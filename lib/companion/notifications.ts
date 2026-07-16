import { CompanionReminder } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { getLocalDateString } from "./utils/date";
import { isInDNDWindow } from "./quietMode";

export function requestNotificationPermission(): void {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    void Notification.requestPermission();
  }
}

export function showReminderNotification(reminder: CompanionReminder): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const settings = useSettingsStore.getState();
  if (!settings.allowNotifications) return;

  if (
    settings.quietMode?.enabled &&
    isInDNDWindow(settings.quietMode.doNotDisturbStart, settings.quietMode.doNotDisturbEnd)
  ) {
    return;
  }

  const today = getLocalDateString();
  const meta = useIntelligenceStore.getState().companionMeta;
  if (meta.lastReminderDate === today) return;

  try {
    const notification = new Notification("LifeOS", {
      body: `${reminder.title}\n${reminder.whyNow}`,
      tag: "lifeos-reminder",
      requireInteraction: false,
      data: { reminderId: reminder.id },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/home";
    };
  } catch (err) {
    console.error("[Companion Notification] Failed to show notification:", err);
  }
}
