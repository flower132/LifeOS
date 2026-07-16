import { LifeObject, MemoryRecord, MemoryRelationEdge, ReflectionQuestion } from "@/lib/types";
import { generateId } from "@/lib/id";

/**
 * MemoryConnectionEngine — 记忆关联。
 *
 * 后台自动建立 Memory 与 Memory 的关系（Goal → Meeting → Alice →
 * Reflection → Decision 式的链条），只沉淀数据，不绘制图谱。
 * 供 Why Now / Reflection / Relationship / Timeline 使用。
 *
 * 关联是派生数据：每次全量重算，按 (source, target, reason) 元组调和，
 * 保留存活边的 id 与 createdAt，保证幂等。
 */

export interface MemoryConnectionInput {
  records: MemoryRecord[];
  objects: LifeObject[];
  reflections: ReflectionQuestion[];
}

const SAME_OBJECT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EDGES_PER_MEMORY = 3;
const MAX_TOTAL_EDGES = 1000;

interface EdgeSeed {
  sourceMemoryId: string;
  targetMemoryId: string;
  reason: string;
  confidence: number;
}

function edgeKey(e: EdgeSeed): string {
  return `${e.sourceMemoryId}->${e.targetMemoryId}:${e.reason}`;
}

function buildSeeds(input: MemoryConnectionInput): EdgeSeed[] {
  const seeds: EdgeSeed[] = [];
  const nameOf = new Map(input.objects.map((o) => [o.id, o.name]));
  const byObject = new Map<string, MemoryRecord[]>();

  for (const record of input.records) {
    if (!record.objectId) continue;
    const list = byObject.get(record.objectId) ?? [];
    list.push(record);
    byObject.set(record.objectId, list);
  }

  // 规则 1：同一对象的时间邻近记忆（7 天内）
  for (const [objectId, list] of byObject) {
    const name = nameOf.get(objectId) ?? "它";
    const sorted = [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const gap =
          new Date(sorted[j].createdAt).getTime() -
          new Date(sorted[i].createdAt).getTime();
        if (gap > SAME_OBJECT_WINDOW_MS) break;
        seeds.push({
          sourceMemoryId: sorted[i].id,
          targetMemoryId: sorted[j].id,
          reason: `都与「${name}」有关，时间相近`,
          confidence: 0.6,
        });
        // 规则 2：同一对象的时间链条（前一条 → 后一条）
        if (j === i + 1) {
          seeds.push({
            sourceMemoryId: sorted[i].id,
            targetMemoryId: sorted[j].id,
            reason: `「${name}」故事的后续`,
            confidence: 0.5,
          });
        }
      }
    }
  }

  // 规则 3：Reflection 与其种子记忆（高置信度）
  for (const reflection of input.reflections) {
    if (reflection.status !== "answered") continue;
    const reflectionRecordId = `reflection:${reflection.id}`;
    const seedRecord = input.records.find(
      (r) => r.sourceId === reflection.seedId || r.objectId === reflection.seedId
    );
    if (seedRecord) {
      seeds.push({
        sourceMemoryId: seedRecord.id,
        targetMemoryId: reflectionRecordId,
        reason: "这次思考源于这段记忆",
        confidence: 0.9,
      });
    }
  }

  // 规则 4：Decision 与当天的相关记忆
  const decisions = input.records.filter((r) => r.kind === "decision");
  for (const decision of decisions) {
    const sameDay = input.records.filter(
      (r) =>
        r.id !== decision.id &&
        r.facets.day === decision.facets.day &&
        (r.objectId === decision.objectId || r.kind === "note")
    );
    for (const related of sameDay.slice(0, 2)) {
      seeds.push({
        sourceMemoryId: related.id,
        targetMemoryId: decision.id,
        reason: "这个决定源于当天的经历",
        confidence: 0.7,
      });
    }
  }

  return seeds;
}

export function buildMemoryConnections(
  input: MemoryConnectionInput,
  existing: MemoryRelationEdge[],
  now: string = new Date().toISOString()
): MemoryRelationEdge[] {
  const seeds = buildSeeds(input);

  // 限量：每条记忆最多 MAX_EDGES_PER_MEMORY 条边，全局封顶
  const perMemory = new Map<string, number>();
  const kept: EdgeSeed[] = [];
  const seen = new Set<string>();
  for (const seed of seeds.sort((a, b) => b.confidence - a.confidence)) {
    if (kept.length >= MAX_TOTAL_EDGES) break;
    const key = edgeKey(seed);
    if (seen.has(key)) continue;
    const sourceCount = perMemory.get(seed.sourceMemoryId) ?? 0;
    const targetCount = perMemory.get(seed.targetMemoryId) ?? 0;
    if (sourceCount >= MAX_EDGES_PER_MEMORY || targetCount >= MAX_EDGES_PER_MEMORY) continue;
    seen.add(key);
    perMemory.set(seed.sourceMemoryId, sourceCount + 1);
    perMemory.set(seed.targetMemoryId, targetCount + 1);
    kept.push(seed);
  }

  const existingByKey = new Map(
    existing.map((e) => [
      `${e.sourceMemoryId}->${e.targetMemoryId}:${e.reason}`,
      e,
    ])
  );

  return kept.map((seed) => {
    const prev = existingByKey.get(edgeKey(seed));
    if (prev) {
      return { ...prev, confidence: seed.confidence };
    }
    return {
      id: generateId(),
      sourceMemoryId: seed.sourceMemoryId,
      targetMemoryId: seed.targetMemoryId,
      reason: seed.reason,
      confidence: seed.confidence,
      createdAt: now,
    };
  });
}

/** 查询一条记忆的关联记忆 id 列表（双向）。 */
export function getConnectedMemoryIds(
  edges: MemoryRelationEdge[],
  memoryId: string
): string[] {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.sourceMemoryId === memoryId) ids.add(edge.targetMemoryId);
    if (edge.targetMemoryId === memoryId) ids.add(edge.sourceMemoryId);
  }
  return [...ids];
}
