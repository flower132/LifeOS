import {
  DecisionMemory,
  LifeObject,
  MemoryMoment,
  MemoryRecord,
  Note,
  ReflectionQuestion,
} from "@/lib/types";
import { getTimeFacets } from "./timeEngine";

/**
 * MemoryStream — 统一记忆归一化。
 *
 * 把分散在 Note / ObjectMemory / Moment / Decision / Reflection 中的
 * 人生记录归一化为带时间分面的 MemoryRecord 流。
 * 所有 Timeline / History / Connection 引擎统一从这里读取，不重复查询。
 */

export interface MemoryStreamInput {
  notes: Note[];
  objects: LifeObject[];
  moments?: MemoryMoment[];
  decisions?: DecisionMemory[];
  reflections?: ReflectionQuestion[];
}

function buildObjectNameMap(objects: LifeObject[]): Map<string, string> {
  return new Map(objects.map((o) => [o.id, o.name]));
}

export function buildMemoryStream(input: MemoryStreamInput): MemoryRecord[] {
  const objectNames = buildObjectNameMap(input.objects);
  const records: MemoryRecord[] = [];

  for (const note of input.notes) {
    records.push({
      id: `note:${note.id}`,
      kind: "note",
      content: note.content,
      sourceId: note.id,
      objectId: note.object_id,
      objectName: note.object_id ? objectNames.get(note.object_id) : undefined,
      createdAt: note.created_at,
      facets: getTimeFacets(note.created_at),
    });
  }

  for (const object of input.objects) {
    for (const memory of object.memories ?? []) {
      records.push({
        id: `objectMemory:${memory.id}`,
        kind: "objectMemory",
        content: memory.content,
        sourceId: memory.id,
        objectId: object.id,
        objectName: object.name,
        createdAt: memory.createdAt,
        facets: getTimeFacets(memory.createdAt),
      });
    }
  }

  for (const moment of input.moments ?? []) {
    records.push({
      id: `moment:${moment.id}`,
      kind: "moment",
      content: moment.title,
      sourceId: moment.id,
      objectId: moment.objectIds[0] ?? null,
      objectName: moment.objectIds[0]
        ? objectNames.get(moment.objectIds[0])
        : undefined,
      createdAt: moment.occurredAt,
      facets: getTimeFacets(moment.occurredAt),
    });
  }

  for (const decision of input.decisions ?? []) {
    records.push({
      id: `decision:${decision.id}`,
      kind: "decision",
      content: decision.decision,
      sourceId: decision.id,
      objectId: decision.objectIds[0] ?? null,
      objectName: decision.objectIds[0]
        ? objectNames.get(decision.objectIds[0])
        : undefined,
      createdAt: decision.decidedAt,
      facets: getTimeFacets(decision.decidedAt),
    });
  }

  for (const reflection of input.reflections ?? []) {
    if (reflection.status !== "answered" || !reflection.answer) continue;
    const at = reflection.answeredAt ?? reflection.createdAt;
    records.push({
      id: `reflection:${reflection.id}`,
      kind: "reflection",
      content: `${reflection.question} — ${reflection.answer}`,
      sourceId: reflection.id,
      createdAt: at,
      facets: getTimeFacets(at),
    });
  }

  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** 记忆总量上限保护：时间线展示不需要全量加载到视图。 */
export function limitStream(records: MemoryRecord[], max = 500): MemoryRecord[] {
  return records.length > max ? records.slice(0, max) : records;
}
