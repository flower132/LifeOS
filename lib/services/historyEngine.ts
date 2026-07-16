import {
  Anniversary,
  Highlight,
  LifeChapter,
  MemoryRecord,
} from "@/lib/types";
import {
  getISOWeekKey,
  sameDayYearsAgoRange,
} from "./timeEngine";
import { getTodayAnniversaries, AnniversaryOccurrence } from "./anniversaryEngine";
import { getHighlightsForYear } from "./highlightEngine";

/**
 * HistoryEngine — Time Travel API。
 *
 * 未来所有"时间旅行"类功能（去年今天、年度回顾、人生章节）
 * 统一调用这里，不重复查询数据库 / 不重复实现过滤逻辑。
 * 纯函数：输入已由 Service Layer 装配好的数据，输出视图模型。
 */

export interface DayInHistory {
  yearsAgo: number;
  records: MemoryRecord[];
}

export interface TodayInHistoryResult {
  /** 去年今天 / 三年前今天 / 五年前今天…按年分组 */
  days: DayInHistory[];
  /** 今天恰逢的周年 */
  anniversaries: AnniversaryOccurrence[];
  isEmpty: boolean;
  emptyText: string;
}

/** 历史上的今天：往年同日的全部记忆 + 今天的周年。 */
export function getTodayInHistory(
  records: MemoryRecord[],
  anniversaries: Anniversary[],
  now: Date = new Date()
): TodayInHistoryResult {
  const byYear = new Map<number, MemoryRecord[]>();
  const currentYear = now.getFullYear();

  for (const record of records) {
    const d = new Date(record.createdAt);
    if (d.getFullYear() >= currentYear) continue;
    if (d.getMonth() !== now.getMonth() || d.getDate() !== now.getDate()) continue;
    const yearsAgo = currentYear - d.getFullYear();
    const list = byYear.get(yearsAgo) ?? [];
    list.push(record);
    byYear.set(yearsAgo, list);
  }

  const days = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([yearsAgo, list]) => ({ yearsAgo, records: list }));

  const todayAnniversaries = getTodayAnniversaries(anniversaries, now);

  return {
    days,
    anniversaries: todayAnniversaries,
    isEmpty: days.length === 0 && todayAnniversaries.length === 0,
    emptyText: "往年的今天，还在等待故事。",
  };
}

/** 历史上的这周：往年同一 ISO 周的记忆，按年分组。 */
export function getWeekInHistory(
  records: MemoryRecord[],
  now: Date = new Date()
): DayInHistory[] {
  const thisWeek = getISOWeekKey(now);
  const currentYear = now.getFullYear();
  const byYear = new Map<number, MemoryRecord[]>();

  for (const record of records) {
    const d = new Date(record.createdAt);
    if (d.getFullYear() >= currentYear) continue;
    if (getISOWeekKey(d) !== thisWeek) continue;
    const yearsAgo = currentYear - d.getFullYear();
    const list = byYear.get(yearsAgo) ?? [];
    list.push(record);
    byYear.set(yearsAgo, list);
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([yearsAgo, list]) => ({ yearsAgo, records: list }));
}

/** 历史上的这个月：往年同月的记忆，按年分组。 */
export function getMonthInHistory(
  records: MemoryRecord[],
  now: Date = new Date()
): DayInHistory[] {
  const currentYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const byYear = new Map<number, MemoryRecord[]>();

  for (const record of records) {
    const d = new Date(record.createdAt);
    if (d.getFullYear() >= currentYear) continue;
    if (d.getMonth() !== thisMonth) continue;
    const yearsAgo = currentYear - d.getFullYear();
    const list = byYear.get(yearsAgo) ?? [];
    list.push(record);
    byYear.set(yearsAgo, list);
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([yearsAgo, list]) => ({ yearsAgo, records: list }));
}

/** 某一年的亮点（年度回顾直接调用）。 */
export function getYearHighlights(
  highlights: Highlight[],
  year: number
): Highlight[] {
  return getHighlightsForYear(highlights, year);
}

/** 获取章节：按 id 或当前进行中的章节。 */
export function getLifeChapter(
  chapters: LifeChapter[],
  id?: string
): LifeChapter | null {
  if (id) return chapters.find((c) => c.id === id) ?? null;
  return chapters.find((c) => c.status === "active") ?? null;
}

/** N 年前今天的记忆（三年前今天 / 五年前今天）。 */
export function getSameDayYearsAgo(
  records: MemoryRecord[],
  yearsAgo: number,
  now: Date = new Date()
): MemoryRecord[] {
  const range = sameDayYearsAgoRange(yearsAgo, now);
  return records.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= new Date(range.from).getTime() && t <= new Date(range.to).getTime();
  });
}
