import { Daypart, Season, TimeFacets } from "@/lib/types";

/**
 * TimeEngine — LifeOS 统一时间服务。
 *
 * 所有页面与服务必须通过 TimeEngine 获取时间语义，
 * 禁止在页面 / Store 中自行计算"今天 / 本周 / 去年今天"等概念。
 *
 * 全部为纯函数：不读写 Store、不访问 Storage、可单测。
 * 本地时区语义：day / weekday / hour / season 均按用户本地时区计算，
 * 与 lib/companion/utils/date.ts 的 getLocalDateString 保持一致。
 */

// ── 基础分面 ─────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export function getLocalDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getISOWeekKey(date: Date = new Date()): string {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7
  );
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getQuarterKey(date: Date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

/** 北半球季节（LifeOS 默认）。3-5 春 / 6-8 夏 / 9-11 秋 / 12-2 冬。 */
export function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function getDaypart(date: Date = new Date()): Daypart {
  const hour = date.getHours();
  if (hour < 6) return "earlyMorning";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

/** 为任意 ISO 时间戳生成完整时间分面。所有 Memory 自动携带。 */
export function getTimeFacets(iso: string): TimeFacets {
  const date = new Date(iso);
  return {
    day: getLocalDayKey(date),
    week: getISOWeekKey(date),
    month: getMonthKey(date),
    quarter: getQuarterKey(date),
    year: date.getFullYear(),
    weekday: date.getDay(),
    hour: date.getHours(),
    season: getSeason(date),
  };
}

// ── 时间区间 ─────────────────────────────────────────────────────────────────

export interface TimeRange {
  from: string; // ISO inclusive
  to: string; // ISO inclusive
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d;
}

function endOfLocalDay(date: Date): Date {
  const d = startOfLocalDay(date);
  return new Date(d.getTime() + DAY_MS - 1);
}

function toRange(from: Date, to: Date): TimeRange {
  return { from: from.toISOString(), to: to.toISOString() };
}

export function todayRange(now: Date = new Date()): TimeRange {
  return toRange(startOfLocalDay(now), endOfLocalDay(now));
}

export function yesterdayRange(now: Date = new Date()): TimeRange {
  const yesterday = new Date(startOfLocalDay(now).getTime() - DAY_MS);
  return toRange(startOfLocalDay(yesterday), endOfLocalDay(yesterday));
}

export function thisWeekRange(now: Date = new Date()): TimeRange {
  // ISO week: Monday - Sunday
  const day = startOfLocalDay(now);
  const dow = day.getDay() || 7; // Sunday -> 7
  const monday = new Date(day.getTime() - (dow - 1) * DAY_MS);
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  return toRange(monday, endOfLocalDay(sunday));
}

export function lastNDaysRange(n: number, now: Date = new Date()): TimeRange {
  const from = new Date(startOfLocalDay(now).getTime() - (n - 1) * DAY_MS);
  return toRange(from, endOfLocalDay(now));
}

export function thisMonthRange(now: Date = new Date()): TimeRange {
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return toRange(from, endOfLocalDay(to));
}

export function monthRange(monthKey: string): TimeRange | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return toRange(from, endOfLocalDay(to));
}

export function thisYearRange(now: Date = new Date()): TimeRange {
  const from = new Date(now.getFullYear(), 0, 1);
  const to = new Date(now.getFullYear(), 11, 31);
  return toRange(from, endOfLocalDay(to));
}

export function yearRange(year: number): TimeRange {
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31);
  return toRange(from, endOfLocalDay(to));
}

export function lastYearRange(now: Date = new Date()): TimeRange {
  return yearRange(now.getFullYear() - 1);
}

/** 去年今天。 */
export function sameDayLastYearRange(now: Date = new Date()): TimeRange {
  const d = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return toRange(startOfLocalDay(d), endOfLocalDay(d));
}

/** 去年这周（ISO 周对齐到去年同一周）。 */
export function sameWeekLastYearRange(now: Date = new Date()): TimeRange {
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return thisWeekRange(lastYear);
}

/** N 年前今天。 */
export function sameDayYearsAgoRange(yearsAgo: number, now: Date = new Date()): TimeRange {
  const d = new Date(now.getFullYear() - yearsAgo, now.getMonth(), now.getDate());
  return toRange(startOfLocalDay(d), endOfLocalDay(d));
}

/** 某年某季。quarter: 1-4 */
export function seasonRange(year: number, season: Season): TimeRange {
  const from = { spring: 0, summer: 3, autumn: 6, winter: 9 } as const;
  const startMonth = from[season];
  const fromDate =
    season === "winter" ? new Date(year, 11, 1) : new Date(year, startMonth, 1);
  const toDate =
    season === "winter"
      ? new Date(year + 1, 1, 0) // end of January next year? — winter spans Dec-Feb
      : new Date(year, startMonth + 3, 0);
  return toRange(fromDate, endOfLocalDay(toDate));
}

// ── 相对时间语义（后台自动计算） ─────────────────────────────────────────────

export type RelativeDayLabel =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "thisYear"
  | "lastYear"
  | "earlier";

export function isToday(iso: string, now: Date = new Date()): boolean {
  return getLocalDayKey(new Date(iso)) === getLocalDayKey(now);
}

export function isYesterday(iso: string, now: Date = new Date()): boolean {
  const yesterday = new Date(startOfLocalDay(now).getTime() - DAY_MS);
  return getLocalDayKey(new Date(iso)) === getLocalDayKey(yesterday);
}

export function isThisWeek(iso: string, now: Date = new Date()): boolean {
  return getISOWeekKey(new Date(iso)) === getISOWeekKey(now);
}

export function isThisMonth(iso: string, now: Date = new Date()): boolean {
  return getMonthKey(new Date(iso)) === getMonthKey(now);
}

export function isThisYear(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getFullYear() === now.getFullYear();
}

export function isLastYear(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getFullYear() === now.getFullYear() - 1;
}

export function isSameDayYearsAgo(
  iso: string,
  yearsAgo: number,
  now: Date = new Date()
): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() - yearsAgo &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function getRelativeDayLabel(
  iso: string,
  now: Date = new Date()
): RelativeDayLabel {
  if (isToday(iso, now)) return "today";
  if (isYesterday(iso, now)) return "yesterday";
  if (isThisWeek(iso, now)) return "thisWeek";
  if (isThisMonth(iso, now)) return "thisMonth";
  if (isThisYear(iso, now)) return "thisYear";
  if (isLastYear(iso, now)) return "lastYear";
  return "earlier";
}

export function inRange(iso: string, range: TimeRange): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(range.from).getTime() && t <= new Date(range.to).getTime();
}

/** 两个 ISO 日期之间相隔的整年数（用于周年计算）。 */
export function fullYearsBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  let years = to.getFullYear() - from.getFullYear();
  const anniversaryThisYear = new Date(
    to.getFullYear(),
    from.getMonth(),
    from.getDate()
  );
  if (to.getTime() < anniversaryThisYear.getTime()) years -= 1;
  return Math.max(0, years);
}

/** 提取 "MM-DD"，用于周年匹配。 */
export function getMonthDay(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export const timeEngine = {
  getLocalDayKey,
  getISOWeekKey,
  getMonthKey,
  getQuarterKey,
  getSeason,
  getDaypart,
  getTimeFacets,
  todayRange,
  yesterdayRange,
  thisWeekRange,
  lastNDaysRange,
  thisMonthRange,
  monthRange,
  thisYearRange,
  yearRange,
  lastYearRange,
  sameDayLastYearRange,
  sameWeekLastYearRange,
  sameDayYearsAgoRange,
  seasonRange,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  isLastYear,
  isSameDayYearsAgo,
  getRelativeDayLabel,
  inRange,
  fullYearsBetween,
  getMonthDay,
};
