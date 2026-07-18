import { LifeObject, Relation } from "@/lib/types";
import { Memory } from "@/lib/memory/types";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { computeRelationStrength } from "./strength";
import { RelationExplanation } from "./types";

// ---------------------------------------------------------------------------
// Explain Relation — fully transparent, data-only explanation of why the
// system considers a relation strong/weak. No LLM, no hallucination.
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24;

export interface ExplainInput {
  relation: Relation;
  focusObjectId: string;
  objects: LifeObject[];
  relations: Relation[];
  memories: Memory[];
  now?: number;
}

export function explainRelation(input: ExplainInput): RelationExplanation | null {
  const now = input.now ?? Date.now();
  const { relation, focusObjectId, objects, relations, memories } = input;

  const otherId =
    relation.source_object_id === focusObjectId
      ? relation.target_object_id
      : relation.source_object_id;
  const focus = objects.find((o) => o.id === focusObjectId);
  const other = objects.find((o) => o.id === otherId);
  if (!focus || !other) return null;

  const strength = computeRelationStrength({
    objectA: focus,
    objectB: other,
    memories,
    relations,
    now,
  });

  const memoriesA = memoriesForObject(focus.id, memories);
  const memoriesB = new Set(memoriesForObject(other.id, memories).map((m) => m.id));
  const sharedMemories = memoriesA.filter((m) => memoriesB.has(m.id));

  const cutoff = now - 30 * DAY_MS;
  const recentInteractions = sharedMemories.filter((m) => m.timestamp >= cutoff).length;

  const lastTs = Math.max(
    0,
    ...memoriesA.map((m) => m.timestamp),
    ...memoriesForObject(other.id, memories).map((m) => m.timestamp)
  );

  const sharedProjects = objects.filter(
    (o) =>
      o.type === "project" &&
      strength.factors.sharedProjects > 0 &&
      sharedMemories.some((m) => m.entities.projects.includes(o.id))
  );
  const sharedGoals = objects.filter(
    (o) =>
      o.type === "goal" &&
      strength.factors.sharedGoals > 0 &&
      sharedMemories.some((m) => m.entities.goals.includes(o.id))
  );

  const lastContactAt = lastTs > 0 ? new Date(lastTs).toISOString().slice(0, 10) : null;
  const levelText =
    strength.level === "strong" ? "很强" : strength.level === "medium" ? "中等" : "较弱";

  const text = [
    `系统认为你和${other.name}的关系${levelText}（${strength.score}/100），依据：`,
    `共同项目：${strength.factors.sharedProjects}`,
    `共同目标：${strength.factors.sharedGoals}`,
    `最近30天互动：${recentInteractions} 次`,
    `共同记忆：${sharedMemories.length} 条`,
    `共同事件：${strength.factors.sharedEvents}`,
    `最近联系：${lastContactAt ?? "暂无记录"}`,
  ].join("\n");

  return {
    relationId: relation.id,
    otherObjectId: other.id,
    otherObjectName: other.name,
    strength,
    sharedProjects: sharedProjects.map((o) => ({ id: o.id, name: o.name })),
    sharedGoals: sharedGoals.map((o) => ({ id: o.id, name: o.name })),
    recentInteractions,
    sharedMemories: sharedMemories.length,
    lastContactAt,
    text,
  };
}
