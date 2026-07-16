import {
  LifeChapter,
  ReflectionQuestion,
} from "@/lib/types";
import { TimeRange } from "./timeEngine";

/**
 * ReflectionArchive — Reflection 归档。
 *
 * 所有 Reflection 自动进入 Archive，支持按时间 / 主题 / 对象 / 章节查询，
 * 供未来的成长轨迹使用。纯函数，不访问 Store / Storage。
 */

export type ReflectionTheme = ReflectionQuestion["seedSource"];

export interface ReflectionArchiveQuery {
  timeRange?: TimeRange;
  theme?: ReflectionTheme;
  /** 按关联对象（seedId 命中的 LifeObject） */
  objectId?: string;
  /** 按人生章节（Reflection 时间落在章节区间内） */
  chapterId?: string;
  /** 只查已回答的 */
  answeredOnly?: boolean;
}

export interface ArchivedReflection {
  reflection: ReflectionQuestion;
  answeredAt?: string;
  theme: ReflectionTheme;
  chapterId?: string;
}

function toArchived(
  reflection: ReflectionQuestion,
  chapters: LifeChapter[]
): ArchivedReflection {
  const at = reflection.answeredAt ?? reflection.createdAt;
  const chapter = chapters.find((c) => {
    const start = new Date(c.startDate).getTime();
    const end = c.endDate ? new Date(c.endDate).getTime() : Number.POSITIVE_INFINITY;
    const t = new Date(at).getTime();
    return t >= start && t <= end;
  });
  return {
    reflection,
    answeredAt: reflection.answeredAt,
    theme: reflection.seedSource,
    chapterId: chapter?.id,
  };
}

/** 查询 Archive。chapters 用于章节归属判断。 */
export function queryReflections(
  reflections: ReflectionQuestion[],
  query: ReflectionArchiveQuery = {},
  chapters: LifeChapter[] = []
): ArchivedReflection[] {
  let items = reflections.map((r) => toArchived(r, chapters));

  if (query.answeredOnly) {
    items = items.filter((i) => i.reflection.status === "answered");
  }
  if (query.theme) {
    items = items.filter((i) => i.theme === query.theme);
  }
  if (query.objectId) {
    items = items.filter((i) => i.reflection.seedId === query.objectId);
  }
  if (query.chapterId) {
    items = items.filter((i) => i.chapterId === query.chapterId);
  }
  if (query.timeRange) {
    const from = new Date(query.timeRange.from).getTime();
    const to = new Date(query.timeRange.to).getTime();
    items = items.filter((i) => {
      const t = new Date(i.reflection.createdAt).getTime();
      return t >= from && t <= to;
    });
  }

  return items.sort(
    (a, b) =>
      new Date(b.reflection.createdAt).getTime() -
      new Date(a.reflection.createdAt).getTime()
  );
}

/** 成长轨迹数据：按时间正序的已回答 Reflection（供未来"成长轨迹"视图）。 */
export function getGrowthTrail(
  reflections: ReflectionQuestion[],
  chapters: LifeChapter[] = []
): ArchivedReflection[] {
  return queryReflections(reflections, { answeredOnly: true }, chapters).sort(
    (a, b) =>
      new Date(a.reflection.createdAt).getTime() -
      new Date(b.reflection.createdAt).getTime()
  );
}

/** 各主题的 Reflection 数量（供未来主题浏览，不做图表，只做数据）。 */
export function countByTheme(
  reflections: ReflectionQuestion[]
): Record<ReflectionTheme, number> {
  const counts: Record<ReflectionTheme, number> = {
    memory: 0,
    goal: 0,
    project: 0,
    relationship: 0,
    self: 0,
  };
  for (const r of reflections) {
    counts[r.seedSource] = (counts[r.seedSource] ?? 0) + 1;
  }
  return counts;
}
