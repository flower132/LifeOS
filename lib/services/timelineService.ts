import { Daypart, MemoryRecord } from "@/lib/types";
import {
  RelativeDayLabel,
  getDaypart,
  getLocalDayKey,
  getMonthKey,
  getRelativeDayLabel,
  lastNDaysRange,
  sameDayLastYearRange,
  thisYearRange,
  todayRange,
  yesterdayRange,
} from "./timeEngine";

/**
 * TimelineService — 叙事时间线。
 *
 * Timeline 不是普通列表，而是有叙事结构的故事流：
 *   今天 → 上午 / 下午 / 晚上
 *   昨天 → 上午 / 下午 / 晚上
 *   更早 → 按天 → 按月
 *
 * 所有页面统一从 TimelineService 获取时间线，禁止自行分组。
 */

export type TimelineScope =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "lastYear"
  | "all";

export interface TimelineSegment {
  daypart: Daypart;
  records: MemoryRecord[];
}

export interface TimelineDayGroup {
  dayKey: string; // YYYY-MM-DD
  relativeLabel: RelativeDayLabel;
  /** 近两天按叙事时段分组 */
  segments: TimelineSegment[];
  /** 全部记录（按时间倒序） */
  records: MemoryRecord[];
}

export interface TimelineMonthGroup {
  monthKey: string; // YYYY-MM
  days: TimelineDayGroup[];
}

export interface NarrativeTimeline {
  scope: TimelineScope;
  /** 近 30 天：按天分组，今天/昨天含叙事时段 */
  days: TimelineDayGroup[];
  /** 更远：按月聚合 */
  months: TimelineMonthGroup[];
  isEmpty: boolean;
  emptyText: string;
}

const DAYPART_ORDER: Daypart[] = [
  "earlyMorning",
  "morning",
  "afternoon",
  "evening",
  "night",
];

/** 各 scope 的空态文案 —— 温暖、叙事化，不说"没有数据"。 */
const EMPTY_TEXT: Record<TimelineScope, string> = {
  today: "今天还没有新的故事。",
  yesterday: "昨天安静地过去了。",
  last7Days: "这一周还没有留下痕迹。",
  last30Days: "最近的日子还在等待被记录。",
  lastYear: "这一年的故事才刚刚开始。",
  all: "这里还在等待第一段记忆。",
};

function scopeRange(scope: TimelineScope, now: Date): { from: string; to: string } | null {
  switch (scope) {
    case "today":
      return todayRange(now);
    case "yesterday":
      return yesterdayRange(now);
    case "last7Days":
      return lastNDaysRange(7, now);
    case "last30Days":
      return lastNDaysRange(30, now);
    case "lastYear":
      return thisYearRange(now);
    case "all":
      return null;
  }
}

function buildDayGroup(
  dayKey: string,
  records: MemoryRecord[],
  now: Date
): TimelineDayGroup {
  const relativeLabel = getRelativeDayLabel(records[0]?.createdAt ?? dayKey, now);
  const useDayparts = relativeLabel === "today" || relativeLabel === "yesterday";

  const segments: TimelineSegment[] = [];
  if (useDayparts) {
    const byDaypart = new Map<Daypart, MemoryRecord[]>();
    for (const record of records) {
      const daypart = getDaypart(new Date(record.createdAt));
      const list = byDaypart.get(daypart) ?? [];
      list.push(record);
      byDaypart.set(daypart, list);
    }
    for (const daypart of DAYPART_ORDER) {
      const list = byDaypart.get(daypart);
      if (list && list.length > 0) segments.push({ daypart, records: list });
    }
  }

  return { dayKey, relativeLabel, segments, records };
}

/** 构建叙事时间线。records 必须已按时间倒序（buildMemoryStream 的输出）。 */
export function buildTimeline(
  records: MemoryRecord[],
  scope: TimelineScope,
  now: Date = new Date()
): NarrativeTimeline {
  const range = scopeRange(scope, now);
  const inScope = range
    ? records.filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t >= new Date(range.from).getTime() && t <= new Date(range.to).getTime();
      })
    : records;

  const dayMap = new Map<string, MemoryRecord[]>();
  for (const record of inScope) {
    const dayKey = getLocalDayKey(new Date(record.createdAt));
    const list = dayMap.get(dayKey) ?? [];
    list.push(record);
    dayMap.set(dayKey, list);
  }

  const allDays = [...dayMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dayKey, dayRecords]) => buildDayGroup(dayKey, dayRecords, now));

  // 近 30 天按天展示；更远的归入月度聚合，避免长时间线稀释叙事感。
  const dayCutoff = lastNDaysRange(30, now).from;
  const recentDays = allDays.filter((g) => g.records[0] && g.records[0].createdAt >= dayCutoff);
  const olderDays = allDays.filter((g) => g.records[0] && g.records[0].createdAt < dayCutoff);

  const monthMap = new Map<string, TimelineDayGroup[]>();
  for (const group of olderDays) {
    const monthKey = getMonthKey(new Date(group.records[0].createdAt));
    const list = monthMap.get(monthKey) ?? [];
    list.push(group);
    monthMap.set(monthKey, list);
  }
  const months = [...monthMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([monthKey, days]) => ({ monthKey, days }));

  return {
    scope,
    days: scope === "lastYear" || scope === "all" ? recentDays : allDays,
    months: scope === "lastYear" || scope === "all" ? months : [],
    isEmpty: inScope.length === 0,
    emptyText: EMPTY_TEXT[scope],
  };
}

/** "去年今天" 的叙事时间线 —— 时间旅行的最小单元。 */
export function buildOnThisDayTimeline(
  records: MemoryRecord[],
  now: Date = new Date()
): NarrativeTimeline {
  const range = sameDayLastYearRange(now);
  const inScope = records.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= new Date(range.from).getTime() && t <= new Date(range.to).getTime();
  });
  const dayMap = new Map<string, MemoryRecord[]>();
  for (const record of inScope) {
    const dayKey = getLocalDayKey(new Date(record.createdAt));
    const list = dayMap.get(dayKey) ?? [];
    list.push(record);
    dayMap.set(dayKey, list);
  }
  const days = [...dayMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dayKey, dayRecords]) => buildDayGroup(dayKey, dayRecords, now));
  return {
    scope: "today",
    days,
    months: [],
    isEmpty: inScope.length === 0,
    emptyText: "去年的今天没有留下记录。",
  };
}
