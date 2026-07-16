import { Anniversary, LifeObject, MemoryMoment } from "@/lib/types";
import { generateId } from "@/lib/id";
import { fullYearsBetween, getMonthDay, isSameDayYearsAgo } from "./timeEngine";

/**
 * AnniversaryEngine — 周年。
 *
 * 自动识别：认识一个人一年、项目开始一年、目标创建一年、第一次旅行一年。
 * 支持"去年今天 / 三年前今天 / 五年前今天"的数据基础。
 * v1 只生成数据，不做推送。
 */

export interface AnniversaryEngineInput {
  objects: LifeObject[];
  moments: MemoryMoment[];
}

interface AnniversarySeed {
  title: string;
  sourceType: Anniversary["sourceType"];
  sourceId: string;
  originalDate: string;
}

function buildSeeds(input: AnniversaryEngineInput): AnniversarySeed[] {
  const seeds: AnniversarySeed[] = [];

  for (const object of input.objects) {
    if (object.type === "person") {
      seeds.push({
        title: `认识 ${object.name}`,
        sourceType: "person",
        sourceId: object.id,
        originalDate: object.created_at,
      });
    } else if (object.type === "goal") {
      seeds.push({
        title: `目标「${object.name}」创建`,
        sourceType: "goal",
        sourceId: object.id,
        originalDate: object.created_at,
      });
    } else if (object.type === "project") {
      seeds.push({
        title: `项目「${object.name}」开始`,
        sourceType: "project",
        sourceId: object.id,
        originalDate: object.created_at,
      });
    } else if (object.type === "event") {
      seeds.push({
        title: object.name,
        sourceType: "event",
        sourceId: object.id,
        originalDate: object.created_at,
      });
    }
  }

  for (const moment of input.moments) {
    seeds.push({
      title: moment.title,
      sourceType: "moment",
      sourceId: moment.id,
      originalDate: moment.occurredAt,
    });
  }

  return seeds;
}

/** 全量重算周年（派生数据，按 (sourceType, sourceId) 调和，幂等）。 */
export function buildAnniversaries(
  input: AnniversaryEngineInput,
  existing: Anniversary[],
  now: string = new Date().toISOString()
): Anniversary[] {
  const existingBySource = new Map(
    existing.map((a) => [`${a.sourceType}:${a.sourceId}`, a])
  );

  return buildSeeds(input).map((seed) => {
    const prev = existingBySource.get(`${seed.sourceType}:${seed.sourceId}`);
    if (prev) {
      return {
        ...prev,
        title: seed.title,
        originalDate: seed.originalDate,
        monthDay: getMonthDay(seed.originalDate),
      };
    }
    return {
      id: generateId(),
      title: seed.title,
      sourceType: seed.sourceType,
      sourceId: seed.sourceId,
      originalDate: seed.originalDate,
      monthDay: getMonthDay(seed.originalDate),
      createdAt: now,
    };
  });
}

export interface AnniversaryOccurrence {
  anniversary: Anniversary;
  yearsAgo: number;
}

/** 今天发生的周年（N 年前的今天）。 */
export function getTodayAnniversaries(
  anniversaries: Anniversary[],
  now: Date = new Date()
): AnniversaryOccurrence[] {
  return anniversaries
    .filter((a) => {
      const years = fullYearsBetween(a.originalDate, now.toISOString());
      return years >= 1 && isSameDayYearsAgo(a.originalDate, years, now);
    })
    .map((a) => ({
      anniversary: a,
      yearsAgo: fullYearsBetween(a.originalDate, now.toISOString()),
    }))
    .sort((a, b) => a.yearsAgo - b.yearsAgo);
}

/** N 年前今天的所有周年（三年前今天 / 五年前今天）。 */
export function getAnniversariesYearsAgo(
  anniversaries: Anniversary[],
  yearsAgo: number,
  now: Date = new Date()
): Anniversary[] {
  return anniversaries.filter((a) =>
    isSameDayYearsAgo(a.originalDate, yearsAgo, now)
  );
}

/** 即将到来（未来 N 天内）的周年 —— 数据备用，v1 不推送。 */
export function getUpcomingAnniversaries(
  anniversaries: Anniversary[],
  withinDays: number = 30,
  now: Date = new Date()
): { anniversary: Anniversary; date: Date; years: number }[] {
  const results: { anniversary: Anniversary; date: Date; years: number }[] = [];
  const [month, day] = [now.getMonth(), now.getDate()];

  for (const a of anniversaries) {
    const [m, d] = a.monthDay.split("-").map((s) => parseInt(s, 10));
    let next = new Date(now.getFullYear(), m - 1, d);
    if (
      m - 1 < month ||
      (m - 1 === month && d < day)
    ) {
      next = new Date(now.getFullYear() + 1, m - 1, d);
    }
    const diffDays = Math.round(
      (next.getTime() - new Date(now.getFullYear(), month, day).getTime()) /
        86400000
    );
    if (diffDays >= 0 && diffDays <= withinDays) {
      const years = next.getFullYear() - new Date(a.originalDate).getFullYear();
      if (years >= 1) results.push({ anniversary: a, date: next, years });
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}
