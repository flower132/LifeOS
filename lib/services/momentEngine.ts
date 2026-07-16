import { LifeObject, MemoryMoment, MomentKind, Note } from "@/lib/types";
import { generateId } from "@/lib/id";

/**
 * MomentEngine — 自动识别重要人生时刻。
 *
 * Moment 是一种特殊的 Memory（不是 Tag），由引擎从 Object / Note 中
 * 自动检测并持久化，供时间旅行、年度回顾、人生章节使用。
 *
 * v1 为规则引擎（离线可用、确定性、幂等）；
 * 未来可叠加 AI 识别更丰富的时刻，dedupeKey 保证不重复。
 */

export interface MomentEngineInput {
  objects: LifeObject[];
  notes: Note[];
}

interface DetectedMoment {
  dedupeKey: string;
  kind: MomentKind;
  title: string;
  description?: string;
  objectIds: string[];
  memoryIds: string[];
  occurredAt: string;
}

// ── 关键词表（中英文） ────────────────────────────────────────────────────────

const KEYWORD_RULES: { kind: MomentKind; pattern: RegExp; title: string }[] = [
  {
    kind: "first_travel",
    pattern: /旅行|旅游|机票|航班|高铁|出差途中|travel|flight|trip/i,
    title: "第一次旅行",
  },
  {
    kind: "first_move",
    pattern: /搬家|新居|入住新家|搬去|搬到了|moving|moved to/i,
    title: "第一次搬家",
  },
  {
    kind: "first_job_change",
    pattern: /换工作|跳槽|入职|离职|新工作|first day at|new job|joined/i,
    title: "第一次换工作",
  },
  {
    kind: "first_venture",
    pattern: /创业|注册公司|创立|创办|startup|founded/i,
    title: "第一次创业",
  },
  {
    kind: "first_graduation",
    pattern: /毕业|学位|答辩通过|graduation|graduated/i,
    title: "第一次毕业",
  },
];

function detectFromObjects(objects: LifeObject[]): DetectedMoment[] {
  const detected: DetectedMoment[] = [];

  // 第一次认识某人：每个 person 对象的创建即一段关系的开始
  for (const person of objects.filter((o) => o.type === "person")) {
    detected.push({
      dedupeKey: `first_meeting:${person.id}`,
      kind: "first_meeting",
      title: `第一次认识 ${person.name}`,
      objectIds: [person.id],
      memoryIds: [],
      occurredAt: person.created_at,
    });
  }

  // 第一次创建目标：全量 goal 中最早的一个
  const goals = objects
    .filter((o) => o.type === "goal")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  if (goals.length > 0) {
    detected.push({
      dedupeKey: "first_goal",
      kind: "first_goal",
      title: `第一次创建目标：${goals[0].name}`,
      objectIds: [goals[0].id],
      memoryIds: [],
      occurredAt: goals[0].created_at,
    });
  }

  // 第一次完成目标：status = completed 中最早更新的一个
  const completedGoals = goals.filter(
    (g) => g.properties?.status === "completed"
  );
  if (completedGoals.length > 0) {
    const first = completedGoals.sort(
      (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    )[0];
    detected.push({
      dedupeKey: "first_goal_completed",
      kind: "first_goal_completed",
      title: `第一次完成目标：${first.name}`,
      objectIds: [first.id],
      memoryIds: [],
      occurredAt: first.updated_at,
    });
  }

  // 重要事件 → milestone（AI 评估 importance >= 8 的 event 对象）
  for (const event of objects.filter((o) => o.type === "event")) {
    const profile = event.aiProfile;
    if (profile?.type === "event" && profile.importance >= 8) {
      detected.push({
        dedupeKey: `milestone:${event.id}`,
        kind: "milestone",
        title: event.name,
        description: event.description,
        objectIds: [event.id],
        memoryIds: [],
        occurredAt: event.created_at,
      });
    }
  }

  return detected;
}

function detectFromNotes(notes: Note[]): DetectedMoment[] {
  const detected: DetectedMoment[] = [];
  const sorted = [...notes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const rule of KEYWORD_RULES) {
    const hit = sorted.find((note) => rule.pattern.test(note.content));
    if (hit) {
      detected.push({
        dedupeKey: rule.kind,
        kind: rule.kind,
        title: rule.title,
        description: hit.content.slice(0, 80),
        objectIds: hit.object_id ? [hit.object_id] : [],
        memoryIds: [`note:${hit.id}`],
        occurredAt: hit.created_at,
      });
    }
  }

  return detected;
}

/**
 * 检测 Moments 并与已有 Moments 调和（幂等）：
 * - dedupeKey 相同的保留原 id 与 createdAt；
 * - 来源数据更新时刷新 occurredAt / title；
 * - 不再被检测到的（如对象被删除）保留——人生时刻不因数据整理而被抹除。
 */
export function detectMoments(
  input: MomentEngineInput,
  existing: MemoryMoment[],
  now: string = new Date().toISOString()
): MemoryMoment[] {
  const detected = [...detectFromObjects(input.objects), ...detectFromNotes(input.notes)];
  const existingByKey = new Map(existing.map((m) => [m.dedupeKey, m]));
  const result: MemoryMoment[] = [];
  const seenKeys = new Set<string>();

  for (const d of detected) {
    if (seenKeys.has(d.dedupeKey)) continue;
    seenKeys.add(d.dedupeKey);
    const prev = existingByKey.get(d.dedupeKey);
    if (prev) {
      result.push({
        ...prev,
        title: d.title,
        description: d.description ?? prev.description,
        objectIds: d.objectIds,
        memoryIds: d.memoryIds.length > 0 ? d.memoryIds : prev.memoryIds,
        occurredAt: d.occurredAt,
        updatedAt: now,
      });
    } else {
      result.push({
        id: generateId(),
        kind: d.kind,
        dedupeKey: d.dedupeKey,
        title: d.title,
        description: d.description,
        memoryIds: d.memoryIds,
        objectIds: d.objectIds,
        occurredAt: d.occurredAt,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 保留不再被检测到的人工/历史 Moment
  for (const prev of existing) {
    if (!seenKeys.has(prev.dedupeKey)) result.push(prev);
  }

  return result.sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
}
