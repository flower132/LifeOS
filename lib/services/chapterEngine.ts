import {
  LifeChapter,
  LifeObject,
  MemoryMoment,
  MemoryRecord,
  Note,
} from "@/lib/types";
import { generateId } from "@/lib/id";
import { buildMemoryStream } from "./memoryStream";
import { getLocalDayKey, getSeason } from "./timeEngine";

/**
 * ChapterEngine — 人生章节。
 *
 * AI 根据 Memory 自动把人生切分为章节（研究生阶段 / 上海生活 / 找工作时期）。
 * v1 为确定性规则分段：以重大人生时刻（搬家 / 换工作 / 毕业 / 创业）和
 * 长时间记录空白作为章节边界，保证离线可用与幂等。
 * 未来可叠加 AI 命名与语义优化（enhance 接口预留）。
 */

/** 作为章节边界的重大时刻 */
const BOUNDARY_MOMENT_KINDS = new Set([
  "first_move",
  "first_job_change",
  "first_graduation",
  "first_venture",
]);

/** 超过该天数的记录空白也视为章节边界 */
const GAP_BOUNDARY_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ChapterEngineInput {
  objects: LifeObject[];
  notes: Note[];
  moments: MemoryMoment[];
}

interface ChapterSegment {
  startIso: string;
  endIso?: string;
  records: MemoryRecord[];
}

const SEASON_LABEL: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

function segmentByBoundaries(
  records: MemoryRecord[],
  moments: MemoryMoment[]
): ChapterSegment[] {
  if (records.length === 0) return [];

  const ascending = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // 收集边界时间点（重大时刻 + 记录大空白）
  const boundaryTimes = new Set<number>();
  for (const moment of moments) {
    if (BOUNDARY_MOMENT_KINDS.has(moment.kind)) {
      boundaryTimes.add(new Date(moment.occurredAt).getTime());
    }
  }
  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1].createdAt).getTime();
    const curr = new Date(ascending[i].createdAt).getTime();
    if (curr - prev > GAP_BOUNDARY_DAYS * DAY_MS) {
      boundaryTimes.add(curr);
    }
  }

  const segments: ChapterSegment[] = [];
  let current: ChapterSegment = {
    startIso: ascending[0].createdAt,
    records: [],
  };

  for (const record of ascending) {
    const t = new Date(record.createdAt).getTime();
    if (boundaryTimes.has(t) && current.records.length > 0) {
      current.endIso = record.createdAt;
      segments.push(current);
      current = { startIso: record.createdAt, records: [] };
    }
    current.records.push(record);
  }
  segments.push(current);
  return segments;
}

function topByCount<T>(items: T[], key: (item: T) => string | undefined, max: number): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

function buildChapterTitle(segment: ChapterSegment): string {
  const start = new Date(segment.startIso);
  const season = SEASON_LABEL[getSeason(start)];
  const year = start.getFullYear();
  const end = segment.endIso ? new Date(segment.endIso) : null;
  if (end && end.getFullYear() !== year) {
    return `${year} · ${season} — ${end.getFullYear()}`;
  }
  return `${year} · ${season}`;
}

function buildChapterDescription(
  segment: ChapterSegment,
  objects: LifeObject[]
): string {
  const nameOf = new Map(objects.map((o) => [o.id, o.name]));
  const peopleNames = topByCount(
    segment.records,
    (r) => (r.objectId ? nameOf.get(r.objectId) : undefined),
    3
  );
  if (peopleNames.length > 0) {
    return `这段日子里，与 ${peopleNames.join("、")} 有关的记忆最多。`;
  }
  return `这段日子留下了 ${segment.records.length} 条记忆。`;
}

function pickRepresentativeMemories(segment: ChapterSegment): string[] {
  const scored = segment.records.map((r) => {
    let score = 0;
    if (r.kind === "moment") score += 3;
    if (r.kind === "decision") score += 2;
    score += Math.min(r.content.length / 100, 2);
    return { id: r.id, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.id);
}

/**
 * 检测章节并与已有章节调和（幂等）：
 * - dedupeKey = "chapter:<startDayKey>"，重跑保持稳定 id；
 * - 进行中的章节随新记忆延展 endDate；
 * - 用户未来手动修改的章节（userModified，预留）不被覆盖。
 */
export function detectChapters(
  input: ChapterEngineInput,
  existing: LifeChapter[],
  now: string = new Date().toISOString()
): LifeChapter[] {
  const records = buildMemoryStream({
    notes: input.notes,
    objects: input.objects,
    moments: input.moments,
  });
  const segments = segmentByBoundaries(records, input.moments);
  const existingByKey = new Map(existing.map((c) => [c.dedupeKey, c]));

  const chapters: LifeChapter[] = segments.map((segment, index) => {
    const startDay = getLocalDayKey(new Date(segment.startIso));
    const dedupeKey = `chapter:${startDay}`;
    const isLast = index === segments.length - 1;
    const prev = existingByKey.get(dedupeKey);

    const people = topByCount(
      segment.records.filter((r) => {
        if (!r.objectId) return false;
        return input.objects.find((o) => o.id === r.objectId)?.type === "person";
      }),
      (r) => r.objectId ?? undefined,
      5
    );
    const goals = input.objects
      .filter(
        (o) =>
          o.type === "goal" &&
          o.created_at >= segment.startIso &&
          (!segment.endIso || o.created_at <= segment.endIso)
      )
      .map((o) => o.id)
      .slice(0, 5);

    const base: Omit<LifeChapter, "id" | "createdAt" | "updatedAt"> = {
      dedupeKey,
      title: buildChapterTitle(segment),
      description: buildChapterDescription(segment, input.objects),
      startDate: segment.startIso,
      endDate: isLast ? undefined : segment.endIso,
      people,
      goals,
      places: prev?.places ?? [],
      representativeMemoryIds: pickRepresentativeMemories(segment),
      status: isLast ? "active" : "closed",
    };

    if (prev) {
      return { ...prev, ...base, updatedAt: now };
    }
    return { ...base, id: generateId(), createdAt: now, updatedAt: now };
  });

  return chapters;
}

/** 查询某个对象当前所属的章节（Workspace 引用）。 */
export function getChapterForObject(
  chapters: LifeChapter[],
  objectId: string
): LifeChapter | null {
  return (
    chapters.find(
      (c) => c.people.includes(objectId) || c.goals.includes(objectId)
    ) ?? null
  );
}
