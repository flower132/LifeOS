import {
  DecisionMemory,
  LifeObject,
  MemoryMoment,
  Note,
  Relation,
} from "@/lib/types";

/**
 * RelationshipHistory — 关系时间线。
 *
 * Person Workspace 的 Relationship Timeline：认识 / 第一次合作 /
 * 一起完成项目 / 重新联系 / 生日……全部来自 Memory 自动生成，
 * 禁止人工维护。纯函数。
 */

export type RelationshipEventKind =
  | "met" // 认识
  | "birthday" // 生日（资料中的生日字段）
  | "memory" // 与 TA 有关的记忆
  | "note" // 与 TA 有关的笔记
  | "moment" // 与 TA 有关的人生时刻
  | "decision" // 与 TA 有关的决定
  | "relation_note"; // 关系备注的变化

export interface RelationshipEvent {
  id: string;
  kind: RelationshipEventKind;
  title: string;
  excerpt?: string;
  occurredAt: string; // ISO
}

export interface RelationshipTimelineInput {
  person: LifeObject;
  objects: LifeObject[];
  notes: Note[];
  relations: Relation[];
  moments: MemoryMoment[];
  decisions: DecisionMemory[];
}

/** 重新联系：两条记忆间隔超过该天数时生成一个"重新联系"节点 */
const RECONNECT_GAP_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function buildRelationshipTimeline(
  input: RelationshipTimelineInput
): RelationshipEvent[] {
  const { person, notes, relations, moments, decisions } = input;
  const events: RelationshipEvent[] = [];

  // 认识：person 对象的创建
  events.push({
    id: `met:${person.id}`,
    kind: "met",
    title: `认识 ${person.name}`,
    occurredAt: person.created_at,
  });

  // 生日：properties.birthday（支持 "YYYY-MM-DD" / "MM-DD"）
  const birthday = person.properties?.birthday;
  if (typeof birthday === "string" && birthday) {
    events.push({
      id: `birthday:${person.id}`,
      kind: "birthday",
      title: `${person.name} 的生日`,
      excerpt: birthday.slice(-5),
      occurredAt: person.created_at, // 展示占位；周年匹配由 AnniversaryEngine 负责
    });
  }

  // 与 TA 直接关联的笔记（按时间正序分析间隔）
  const personNotes = notes
    .filter((n) => n.object_id === person.id)
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  let prevTime: number | null = null;
  for (const note of personNotes) {
    const t = new Date(note.created_at).getTime();
    if (prevTime !== null && t - prevTime > RECONNECT_GAP_DAYS * DAY_MS) {
      events.push({
        id: `reconnect:${note.id}`,
        kind: "memory",
        title: "重新联系",
        excerpt: note.content.slice(0, 40),
        occurredAt: note.created_at,
      });
    }
    prevTime = t;
    events.push({
      id: `note:${note.id}`,
      kind: "note",
      title: "一段记录",
      excerpt: note.content.slice(0, 60),
      occurredAt: note.created_at,
    });
  }

  // 与 TA 有关的时刻（第一次合作 / 一起完成项目等来自 Moment）
  for (const moment of moments) {
    if (!moment.objectIds.includes(person.id)) continue;
    events.push({
      id: `moment:${moment.id}`,
      kind: "moment",
      title: moment.title,
      excerpt: moment.description,
      occurredAt: moment.occurredAt,
    });
  }

  // 与 TA 有关的决定
  for (const decision of decisions) {
    if (!decision.objectIds.includes(person.id)) continue;
    events.push({
      id: `decision:${decision.id}`,
      kind: "decision",
      title: decision.decision,
      excerpt: decision.reason,
      occurredAt: decision.decidedAt,
    });
  }

  // 关系备注：relation note 作为关系节点的注脚
  for (const relation of relations) {
    if (
      relation.source_object_id !== person.id &&
      relation.target_object_id !== person.id
    ) {
      continue;
    }
    if (!relation.note) continue;
    events.push({
      id: `relation:${relation.id}`,
      kind: "relation_note",
      title: "关系的一笔注脚",
      excerpt: relation.note,
      occurredAt: relation.created_at,
    });
  }

  return events.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}
