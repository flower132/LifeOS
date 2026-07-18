import { LifeObject } from "@/lib/types";
import { Memory } from "../types";

/** Per-object-type knowledge builder: memories → durable knowledge lines. */
export type ObjectKnowledgeStrategy = (
  object: LifeObject,
  memories: Memory[]
) => string[];

export function memoriesForObject(objectId: string, memories: Memory[]): Memory[] {
  return memories
    .filter((m) => m.relations.some((r) => r.targetId === objectId))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function topInsights(memories: Memory[], limit = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const memory of memories) {
    for (const insight of memory.insights) {
      if (seen.has(insight)) continue;
      seen.add(insight);
      out.push(insight);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function recentSummaries(memories: Memory[], limit = 3): string[] {
  return memories
    .slice(0, limit)
    .map((m) => {
      const date = new Date(m.timestamp).toISOString().slice(0, 10);
      return `${date} ${m.summary ?? m.content.slice(0, 40)}`;
    });
}

export function frequentTopics(memories: Memory[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    for (const topic of memory.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic);
}
