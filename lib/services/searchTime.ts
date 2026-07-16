import { MomentKind, Season } from "@/lib/types";
import {
  TimeRange,
  getLocalDayKey,
  lastNDaysRange,
  lastYearRange,
  monthRange,
  sameDayLastYearRange,
  sameDayYearsAgoRange,
  seasonRange,
  thisMonthRange,
  thisWeekRange,
  thisYearRange,
  todayRange,
  yearRange,
  yesterdayRange,
} from "./timeEngine";

/**
 * SearchTime — 自然语言时间解析。
 *
 * 把"去年冬天 / 研究生时期 / 第一次见 Alice / 去年今天"
 * 解析为结构化时间查询，供搜索统一调用。
 * 纯函数，不访问 Store / Storage。
 */

export interface ParsedTimeQuery {
  kind: "range" | "chapter" | "moment";
  /** kind = range 时的时间区间 */
  range?: TimeRange;
  /** kind = chapter 时用于匹配 Chapter 标题的关键词 */
  chapterKeyword?: string;
  /** kind = moment 时的结构化时刻查询 */
  momentQuery?: { kind?: MomentKind; personName?: string };
  /** 人类可读的回显标签（原查询文本） */
  label: string;
}

export interface SearchTimeContext {
  /** self 对象生日（MM-DD 或 YYYY-MM-DD），用于解析"生日" */
  selfBirthday?: string;
  /** 已知章节标题，用于"研究生时期 / 上海时期"等匹配 */
  chapterTitles?: string[];
  now?: Date;
}

const CN_NUM: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const SEASON_WORDS: Record<string, Season> = {
  春天: "spring",
  春季: "spring",
  春: "spring",
  夏天: "summer",
  夏季: "summer",
  夏: "summer",
  秋天: "autumn",
  秋季: "autumn",
  秋: "autumn",
  冬天: "winter",
  冬季: "winter",
  冬: "winter",
  spring: "spring",
  summer: "summer",
  autumn: "autumn",
  fall: "autumn",
  winter: "winter",
};

function parseCnNumber(text: string): number | null {
  if (/^\d+$/.test(text)) return parseInt(text, 10);
  if (text === "十") return 10;
  const match = text.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
  if (match) {
    const tens = match[1] ? CN_NUM[match[1]] : 1;
    const ones = match[2] ? CN_NUM[match[2]] : 0;
    return tens * 10 + ones;
  }
  return CN_NUM[text] ?? null;
}

function trimTimeWords(query: string): string {
  return query
    .replace(/的时候|时期|期间|阶段|那会儿|那年|那段时间/g, "")
    .trim();
}

/**
 * 解析自然语言时间查询。
 * 返回 null 表示该查询不包含时间语义（调用方走普通文本搜索）。
 */
export function parseTimeQuery(
  rawQuery: string,
  context: SearchTimeContext = {}
): ParsedTimeQuery | null {
  const now = context.now ?? new Date();
  const q = rawQuery.trim();
  if (!q) return null;
  const lower = q.toLowerCase();

  const range = (r: TimeRange): ParsedTimeQuery => ({ kind: "range", range: r, label: q });

  // ── 今天 / 昨天 / 前天 ──
  if (/^(今天|今日|today)$/.test(lower)) return range(todayRange(now));
  if (/^(昨天|昨日|yesterday)$/.test(lower)) return range(yesterdayRange(now));
  if (/^前天$/.test(lower)) {
    return range(sameDayYearsAgoRange(0, new Date(now.getTime() - 2 * 86400000)));
  }

  // ── 去年今天 / N 年前今天 ──
  if (/^(去年今天|去年的今天)$/.test(lower)) return range(sameDayLastYearRange(now));
  const yearsAgoToday = q.match(/^([一二两三四五六七八九十\d]+)年前今天$/);
  if (yearsAgoToday) {
    const n = parseCnNumber(yearsAgoToday[1]);
    if (n && n > 0) return range(sameDayYearsAgoRange(n, now));
  }

  // ── 本周 / 上周 / 这周 ──
  if (/^(本周|这周|这个星期|this week)$/.test(lower)) return range(thisWeekRange(now));
  if (/^(上周|上个星期|last week)$/.test(lower)) {
    const lastWeek = new Date(now.getTime() - 7 * 86400000);
    return range(thisWeekRange(lastWeek));
  }

  // ── 本月 / 上个月 ──
  if (/^(本月|这个月|this month)$/.test(lower)) return range(thisMonthRange(now));
  if (/^(上个月|上月|last month)$/.test(lower)) {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return range(thisMonthRange(prev));
  }

  // ── 最近 N 天 ──
  const recentDays = q.match(/^最近([一二两三四五六七八九十\d]+)天$/) ?? lower.match(/^last (\d+) days$/);
  if (recentDays) {
    const n = parseCnNumber(recentDays[1]);
    if (n && n > 0) return range(lastNDaysRange(n, now));
  }

  // ── 今年 / 去年 / 前年 / N 年前 ──
  if (/^(今年|this year)$/.test(lower)) return range(thisYearRange(now));
  if (/^(去年|last year)$/.test(lower)) return range(lastYearRange(now));
  if (/^前年$/.test(lower)) return range(yearRange(now.getFullYear() - 2));
  const yearsAgo = q.match(/^([一二两三四五六七八九十\d]+)年前$/);
  if (yearsAgo) {
    const n = parseCnNumber(yearsAgo[1]);
    if (n && n > 0) return range(yearRange(now.getFullYear() - n));
  }

  // ── 具体年份 / 年月 ──
  const yearMonth = q.match(/^(\d{4})年(\d{1,2})月$/);
  if (yearMonth) {
    const key = `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}`;
    const r = monthRange(key);
    if (r) return range(r);
  }
  const yearOnly = q.match(/^(\d{4})年?$/) ?? lower.match(/^in (\d{4})$/);
  if (yearOnly) return range(yearRange(parseInt(yearOnly[1], 10)));

  // ── 季节：去年冬天 / 前年夏天 / 2019 年冬 / last winter ──
  const seasonMatch =
    q.match(/^(去年|前年|今年)?(\d{4})?年?的?(春天|春季|夏天|夏季|秋天|秋季|冬天|冬季|春|夏|秋|冬)$/) ??
    lower.match(/^(last |this )?(spring|summer|autumn|fall|winter)( (\d{4}))?$/);
  if (seasonMatch) {
    const seasonWord = (seasonMatch[3] ?? seasonMatch[4] ?? "").toLowerCase();
    const season = SEASON_WORDS[seasonWord];
    let year = now.getFullYear();
    if (seasonMatch[1] === "去年" || lower.startsWith("last ")) year -= 1;
    else if (seasonMatch[1] === "前年") year -= 2;
    else if (seasonMatch[2] || seasonMatch[4]) {
      year = parseInt((seasonMatch[2] ?? seasonMatch[4]) as string, 10);
    } else if (season && seasonRange(year, season).from > now.toISOString()) {
      // "冬天"但今年冬天还没到 → 指去年冬天
      year -= 1;
    }
    if (season) return range(seasonRange(year, season));
  }

  // ── 生日：去年生日 / 生日 ──
  if (/生日/.test(q) && context.selfBirthday) {
    const md = context.selfBirthday.slice(-5); // "MM-DD"
    const [month, day] = md.split("-").map((s) => parseInt(s, 10));
    let year = now.getFullYear();
    if (/去年/.test(q)) year -= 1;
    else if (/前年/.test(q)) year -= 2;
    else {
      const thisBirthday = new Date(year, month - 1, day);
      if (thisBirthday.getTime() > now.getTime()) year -= 1; // 今年生日还没过 → 去年
    }
    const dayKey = getLocalDayKey(new Date(year, month - 1, day));
    const r = monthRange(dayKey.slice(0, 7));
    void r;
    const from = new Date(year, month - 1, day);
    const to = new Date(from.getTime() + 86400000 - 1);
    return range({ from: from.toISOString(), to: to.toISOString() });
  }

  // ── 第一次：第一次见 Alice / 第一次旅行 ──
  const firstMatch = q.match(/^第一次(见|认识|遇见)?(.+)$/) ?? lower.match(/^first (?:met? )?(.+)$/);
  if (firstMatch) {
    const target = (firstMatch[2] ?? firstMatch[1] ?? "").trim();
    if (target) {
      const kindMap: [RegExp, MomentKind][] = [
        [/旅行|旅游|travel/, "first_travel"],
        [/搬家|move/, "first_move"],
        [/毕业|graduation/, "first_graduation"],
        [/创业|venture/, "first_venture"],
        [/换工作|跳槽|job/, "first_job_change"],
        [/目标|goal/, "first_goal"],
      ];
      const hit = kindMap.find(([re]) => re.test(target));
      if (hit) {
        return { kind: "moment", momentQuery: { kind: hit[1] }, label: q };
      }
      // "第一次见/认识某人" → first_meeting + personName
      return {
        kind: "moment",
        momentQuery: { kind: "first_meeting", personName: target },
        label: q,
      };
    }
  }

  // ── 章节时期：研究生时期 / 上海时期 / 在上海的时候 ──
  const chapterKeyword = trimTimeWords(q);
  if (chapterKeyword && chapterKeyword !== q || /时期|阶段|期间|的时候/.test(q)) {
    const titles = context.chapterTitles ?? [];
    const matched = titles.find(
      (title) => title.includes(chapterKeyword) || chapterKeyword.includes(title)
    );
    return {
      kind: "chapter",
      chapterKeyword: matched ?? chapterKeyword,
      label: q,
    };
  }

  return null;
}

/** 判断一段文本是否可能是时间查询（用于搜索框提示）。 */
export function looksLikeTimeQuery(query: string): boolean {
  return /今天|昨天|前年|去年|今年|上周|本周|最近|第一次|时期|阶段|生日|春天|夏天|秋天|冬天|年前|today|yesterday|last week|last year|first/.test(
    query.toLowerCase()
  );
}
