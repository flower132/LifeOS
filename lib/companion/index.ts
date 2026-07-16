import { generateFocus } from "./focusEngine";
import { ensureTodayStory } from "./storyEngine";
import { generateReflection } from "./reflectionEngine";
import { generateReminder } from "./reminderEngine";
import {
  generateDailyTimeline,
  generateWeeklyReview,
  generateMonthlyStory,
} from "./reviewEngine";
import { buildCompanionContext } from "./contextBuilder";
import {
  CompanionContext,
  EnsureFocusOptions,
  EnsureStoryOptions,
  StoryEngineResult,
  CompanionAppearanceKind,
} from "./types";
import { useIntelligenceStore } from "@/stores/intelligenceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  TodayFocus,
  ReflectionQuestion,
  CompanionReminder,
  DailyTimeline,
  WeeklyReview,
  MonthlyStory,
} from "@/lib/types";
import { getLocalDateString, getISOWeekKey, getMonthKey } from "./utils/date";
import { showReminderNotification } from "./notifications";
import { shouldCompanionBeQuiet } from "./quietMode";

function now(): string {
  return new Date().toISOString();
}

function isEvening(): boolean {
  const hour = new Date().getHours();
  return hour >= 18;
}

class CompanionService {
  private getStore() {
    return useIntelligenceStore.getState();
  }

  private getSettings() {
    return useSettingsStore.getState();
  }

  private isEnabled(): boolean {
    return this.getSettings().companionEnabled;
  }

  private async ensureContext(): Promise<CompanionContext | null> {
    return buildCompanionContext();
  }

  async ensureTodayFocus(options: EnsureFocusOptions = {}): Promise<TodayFocus | null> {
    if (!options.skipAi && !this.isEnabled()) return null;

    const today = getLocalDateString();
    const store = this.getStore();
    const cached = store.cache.todayFocuses.find((f) => f.date === today && f.status === "active");
    if (cached) return cached;

    const context = await this.ensureContext();
    if (!context) return null;

    const { focus } = await generateFocus(context);

    const nextFocuses = [focus, ...store.cache.todayFocuses.filter((f) => f.date !== today)].slice(
      0,
      30
    );
    await store.setTodayFocuses(nextFocuses);

    await this.recordAppearance({ kind: "focus", id: focus.id });

    return focus;
  }

  async ensureTodayStory(options: EnsureStoryOptions = {}): Promise<StoryEngineResult> {
    if (!this.isEnabled()) return { story: null };

    const today = getLocalDateString();
    const store = this.getStore();
    const cached = store.cache.todayStories.find((s) => s.date === today);
    if (cached && !options.force) return { story: cached };

    const result = await ensureTodayStory(today, options);

    if (result.story) {
      const nextStories = [result.story, ...store.cache.todayStories.filter((s) => s.date !== today)].slice(
        0,
        30
      );
      store.setTodayStories(nextStories);
      await this.recordAppearance({ kind: "story", id: result.story.id });
    }

    return result;
  }

  async maybeScheduleReminder(): Promise<void> {
    if (!this.isEnabled()) return;
    if (shouldCompanionBeQuiet()) return;

    const today = getLocalDateString();
    const store = this.getStore();
    if (store.companionMeta.lastReminderDate === today) return;

    const existingPending = store.cache.reminders.some(
      (r) => r.date === today && r.status === "pending"
    );
    if (existingPending) return;

    const context = await this.ensureContext();
    if (!context) return;

    const reminder = await generateReminder(context);
    if (!reminder) return;

    const nextReminders = [reminder, ...store.cache.reminders.filter((r) => r.date !== today)].slice(
      0,
      30
    );
    await store.setReminders(nextReminders);

    await store.setCompanionMeta({
      ...store.companionMeta,
      lastReminderDate: today,
    });

    showReminderNotification(reminder);

    await this.recordAppearance({ kind: "reminder", id: reminder.id });
  }

  async ensureReminder(): Promise<CompanionReminder | null> {
    if (!this.isEnabled()) return null;
    await this.maybeScheduleReminder();
    const today = getLocalDateString();
    return (
      this.getStore().cache.reminders.find(
        (r) => r.date === today && r.status === "pending"
      ) ?? null
    );
  }

  async ensureReflection(): Promise<ReflectionQuestion | null> {
    if (!this.isEnabled()) return null;
    return this.maybeScheduleReflection().then(() => {
      const today = getLocalDateString();
      return (
        this.getStore().cache.reflections.find(
          (r) => r.date === today && r.status === "pending"
        ) ?? null
      );
    });
  }

  async maybeScheduleReflection(): Promise<void> {
    if (!this.isEnabled()) return;
    if (shouldCompanionBeQuiet()) return;
    if (!isEvening()) return;

    const today = getLocalDateString();
    const store = this.getStore();
    if (store.companionMeta.lastReflectionDate === today) return;

    const existing = store.cache.reflections.filter((r) => r.date === today);
    const hasPending = existing.some((r) => r.status === "pending");
    if (hasPending) return;

    const context = await this.ensureContext();
    if (!context) return;

    const reflection = await generateReflection(context, existing);
    if (!reflection) return;

    const nextReflections = [reflection, ...store.cache.reflections.filter((r) => r.date !== today)].slice(
      0,
      30
    );
    await store.setReflections(nextReflections);

    await store.setCompanionMeta({
      ...store.companionMeta,
      lastReflectionDate: today,
    });

    await this.recordAppearance({ kind: "reflection", id: reflection.id });
  }

  async maybeGenerateReview(): Promise<void> {
    if (!this.isEnabled()) return;
    if (shouldCompanionBeQuiet()) return;

    const store = this.getStore();
    const meta = store.companionMeta;
    const currentWeekKey = getISOWeekKey();
    const currentMonthKey = getMonthKey();

    if (meta.lastWeeklyWeekKey !== currentWeekKey) {
      const review = await this.ensureWeeklyReview(currentWeekKey);
      if (review) {
        await store.setCompanionMeta({
          ...store.companionMeta,
          lastWeeklyWeekKey: currentWeekKey,
        });
      }
    }

    if (meta.lastMonthlyMonthKey !== currentMonthKey) {
      const story = await this.ensureMonthlyStory(currentMonthKey);
      if (story) {
        await store.setCompanionMeta({
          ...store.companionMeta,
          lastMonthlyMonthKey: currentMonthKey,
        });
      }
    }
  }

  async ensureDailyTimeline(date: string): Promise<DailyTimeline | null> {
    if (!this.isEnabled()) return null;

    const store = this.getStore();
    const cached = store.cache.dailyTimelines.find((t) => t.date === date);
    if (cached) return cached;

    const context = await this.ensureContext();
    if (!context) return null;

    const timeline = await generateDailyTimeline(context, date);
    if (!timeline) return null;

    const nextTimelines = [timeline, ...store.cache.dailyTimelines.filter((t) => t.date !== date)].slice(
      0,
      30
    );
    await store.setDailyTimelines(nextTimelines);
    await this.recordAppearance({ kind: "timeline" });

    return timeline;
  }

  async ensureWeeklyReview(weekKey: string): Promise<WeeklyReview | null> {
    if (!this.isEnabled()) return null;
    if (shouldCompanionBeQuiet()) return null;

    const store = this.getStore();
    const cached = store.cache.weeklyReviews.find(
      (r) => r.weekKey === weekKey && r.status === "active"
    );
    if (cached) return cached;

    const context = await this.ensureContext();
    if (!context) return null;

    const review = await generateWeeklyReview(context, weekKey);
    if (!review) return null;

    const nextReviews = [review, ...store.cache.weeklyReviews.filter((r) => r.weekKey !== weekKey)].slice(
      0,
      30
    );
    await store.setWeeklyReviews(nextReviews);
    await this.recordAppearance({ kind: "weekly", id: review.id });

    return review;
  }

  async ensureMonthlyStory(monthKey: string): Promise<MonthlyStory | null> {
    if (!this.isEnabled()) return null;
    if (shouldCompanionBeQuiet()) return null;

    const store = this.getStore();
    const cached = store.cache.monthlyStories.find(
      (s) => s.monthKey === monthKey && s.status === "active"
    );
    if (cached) return cached;

    const context = await this.ensureContext();
    if (!context) return null;

    const story = await generateMonthlyStory(context, monthKey);
    if (!story) return null;

    const nextStories = [story, ...store.cache.monthlyStories.filter((s) => s.monthKey !== monthKey)].slice(
      0,
      30
    );
    await store.setMonthlyStories(nextStories);
    await this.recordAppearance({ kind: "monthly", id: story.id });

    return story;
  }

  private async recordAppearance(
    appearance: Omit<{ kind: CompanionAppearanceKind; id?: string; createdAt: string }, "createdAt">
  ): Promise<void> {
    const store = this.getStore();
    const meta = store.companionMeta;
    const today = getLocalDateString();
    const isToday = meta.lastAppearanceAt
      ? getLocalDateString(new Date(meta.lastAppearanceAt)) === today
      : false;

    // `appearance.kind` is intentionally tracked for future telemetry.
    void appearance.kind;

    await store.setCompanionMeta({
      ...meta,
      lastAppearanceAt: now(),
      appearanceCountToday: isToday ? meta.appearanceCountToday + 1 : 1,
    });
  }
}

export const companionService = new CompanionService();
