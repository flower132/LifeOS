import {
  DecisionMemory,
  Highlight,
  HighlightCategory,
  MemoryMoment,
  MemoryRecord,
  ReflectionQuestion,
} from "@/lib/types";
import { generateId } from "@/lib/id";

/**
 * HighlightEngine — 年度亮点。
 *
 * 自动维护每年的 Highlights：最重要 / 成长最大 / 最快乐 / 最困难 /
 * 最重要决定 / 关系变化最大。供未来年度回顾直接使用。
 * 派生数据：按 (year, category) 调和，幂等。
 */

export interface HighlightEngineInput {
  records: MemoryRecord[];
  moments: MemoryMoment[];
  decisions: DecisionMemory[];
  reflections: ReflectionQuestion[];
}

const POSITIVE_PATTERN = /开心|快乐|幸福|激动|惊喜|感激|温暖|成就|兴奋|happy|grateful|excited|joy/i;
const NEGATIVE_PATTERN = /困难|压力|焦虑|难过|疲惫|失落|挣扎|崩溃|痛苦|hard|stress|anxious|sad|tired/i;

const MOMENT_KIND_SCORE: Record<string, number> = {
  first_goal_completed: 1,
  first_graduation: 0.95,
  first_venture: 0.9,
  first_job_change: 0.85,
  milestone: 0.8,
  first_move: 0.75,
  first_travel: 0.7,
  first_meeting: 0.5,
  first_goal: 0.6,
};

function buildForYear(
  year: number,
  input: HighlightEngineInput
): { category: HighlightCategory; title: string; memoryId?: string; objectId?: string; score: number }[] {
  const results: {
    category: HighlightCategory;
    title: string;
    memoryId?: string;
    objectId?: string;
    score: number;
  }[] = [];

  const yearRecords = input.records.filter((r) => r.facets.year === year);
  const yearMoments = input.moments.filter(
    (m) => new Date(m.occurredAt).getFullYear() === year
  );
  const yearDecisions = input.decisions.filter(
    (d) => new Date(d.decidedAt).getFullYear() === year
  );
  const yearReflections = input.reflections.filter(
    (r) =>
      r.status === "answered" &&
      new Date(r.answeredAt ?? r.createdAt).getFullYear() === year
  );

  // 最重要：得分最高的 Moment
  const topMoment = [...yearMoments].sort(
    (a, b) => (MOMENT_KIND_SCORE[b.kind] ?? 0.4) - (MOMENT_KIND_SCORE[a.kind] ?? 0.4)
  )[0];
  if (topMoment) {
    results.push({
      category: "most_important",
      title: topMoment.title,
      memoryId: `moment:${topMoment.id}`,
      objectId: topMoment.objectIds[0],
      score: MOMENT_KIND_SCORE[topMoment.kind] ?? 0.4,
    });
  }

  // 成长最大：最晚一条已回答的 Reflection
  const growth = [...yearReflections].sort(
    (a, b) =>
      new Date(b.answeredAt ?? b.createdAt).getTime() -
      new Date(a.answeredAt ?? a.createdAt).getTime()
  )[0];
  if (growth) {
    results.push({
      category: "most_growth",
      title: growth.question,
      memoryId: `reflection:${growth.id}`,
      score: 0.7,
    });
  }

  // 最快乐 / 最困难：情绪关键词密度最高的记忆
  const emotion = (pattern: RegExp) =>
    yearRecords
      .map((r) => {
        const matches = r.content.match(new RegExp(pattern.source, pattern.flags + (pattern.flags.includes("g") ? "" : "g")));
        return { record: r, count: matches ? matches.length : 0 };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)[0];

  const happiest = emotion(POSITIVE_PATTERN);
  if (happiest) {
    results.push({
      category: "happiest",
      title: happiest.record.content.slice(0, 40),
      memoryId: happiest.record.id,
      objectId: happiest.record.objectId ?? undefined,
      score: Math.min(happiest.count / 3, 1),
    });
  }
  const hardest = emotion(NEGATIVE_PATTERN);
  if (hardest) {
    results.push({
      category: "hardest",
      title: hardest.record.content.slice(0, 40),
      memoryId: hardest.record.id,
      objectId: hardest.record.objectId ?? undefined,
      score: Math.min(hardest.count / 3, 1),
    });
  }

  // 最重要决定：当年最晚一条有 outcome 的决策
  const keyDecision = [...yearDecisions].sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()
  )[0];
  if (keyDecision) {
    results.push({
      category: "key_decision",
      title: keyDecision.decision,
      memoryId: `decision:${keyDecision.id}`,
      objectId: keyDecision.objectIds[0],
      score: keyDecision.outcome ? 0.9 : 0.6,
    });
  }

  // 关系变化最大：当年记忆数最多的人物
  const personCounts = new Map<string, { count: number; name?: string }>();
  for (const r of yearRecords) {
    if (!r.objectId || !r.objectName) continue;
    const entry = personCounts.get(r.objectId) ?? { count: 0, name: r.objectName };
    entry.count += 1;
    personCounts.set(r.objectId, entry);
  }
  const topPerson = [...personCounts.entries()].sort(
    (a, b) => b[1].count - a[1].count
  )[0];
  if (topPerson && topPerson[1].count >= 3) {
    results.push({
      category: "relationship_change",
      title: `与 ${topPerson[1].name} 的故事最多`,
      objectId: topPerson[0],
      score: Math.min(topPerson[1].count / 10, 1),
    });
  }

  return results;
}

/** 全量重算亮点（按 (year, category) 调和，幂等）。 */
export function buildHighlights(
  input: HighlightEngineInput,
  existing: Highlight[],
  now: string = new Date().toISOString()
): Highlight[] {
  const years = new Set<number>();
  for (const r of input.records) years.add(r.facets.year);
  for (const m of input.moments) years.add(new Date(m.occurredAt).getFullYear());

  const existingByKey = new Map(
    existing.map((h) => [`${h.year}:${h.category}`, h])
  );

  const result: Highlight[] = [];
  for (const year of years) {
    for (const seed of buildForYear(year, input)) {
      const key = `${year}:${seed.category}`;
      const prev = existingByKey.get(key);
      if (prev) {
        result.push({
          ...prev,
          title: seed.title,
          memoryId: seed.memoryId,
          objectId: seed.objectId,
          score: seed.score,
        });
      } else {
        result.push({
          id: generateId(),
          year,
          category: seed.category,
          title: seed.title,
          memoryId: seed.memoryId,
          objectId: seed.objectId,
          score: seed.score,
          createdAt: now,
        });
      }
    }
  }

  return result.sort((a, b) => b.year - a.year || b.score - a.score);
}

/** 某一年的全部亮点（HistoryEngine 的 getYearHighlights 统一对外）。 */
export function getHighlightsForYear(highlights: Highlight[], year: number): Highlight[] {
  return highlights
    .filter((h) => h.year === year)
    .sort((a, b) => b.score - a.score);
}
