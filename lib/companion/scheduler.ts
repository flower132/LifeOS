import { companionService } from "./index";
import { useSettingsStore } from "@/stores/settingsStore";
import { shouldCompanionBeQuiet } from "./quietMode";

function requestIdleCallbackSafe(
  callback: () => void,
  options?: IdleRequestOptions
): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
}

export const companionScheduler = {
  onPageVisit(): void {
    if (typeof window === "undefined") return;

    const settings = useSettingsStore.getState();
    if (!settings.companionEnabled) return;

    requestIdleCallbackSafe(() => {
      void companionService.ensureTodayFocus();
      void companionService.ensureTodayStory();

      if (!shouldCompanionBeQuiet()) {
        void companionService.maybeScheduleReminder();
        void companionService.maybeScheduleReflection();
        void companionService.maybeGenerateReview();
      }
    });
  },

  requestNotificationPermission(): void {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      void Notification.requestPermission();
    }
  },
};
