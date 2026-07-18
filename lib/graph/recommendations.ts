import { LifeObject } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { memoriesForObject } from "@/lib/memory/strategies/shared";
import { GraphInsight } from "./types";

// ---------------------------------------------------------------------------
// Graph Recommendation — rule-based insights computed FROM the graph (never
// LLM-generated): fading contacts, stalled goals, quiet projects, growing
// relations.
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24;
const FADING_DAYS = 30;
const STALLED_DAYS = 14;
const MAX_INSIGHTS = 5;

function daysSinceLastMemory(memories: { timestamp: number }[], now: number): number {
  const latest = Math.max(0, ...memories.map((m) => m.timestamp));
  if (latest === 0) return Infinity;
  return Math.floor((now - latest) / DAY_MS);
}

const IN_PROGRESS_STATUS = ["in_progress", "进行中", "active"];

export function recommendInsights(now = Date.now()): GraphInsight[] {
  if (typeof window === "undefined") return [];

  const objects = useObjectStore.getState().objects;
  const memories = useMemoryStore.getState().memories;
  const insights: GraphInsight[] = [];

  const byType = (type: LifeObject["type"]) => objects.filter((o) => o.type === type);

  // Contact fading: previously-active people with no recent memories.
  for (const person of byType("person")) {
    const linked = memoriesForObject(person.id, memories);
    if (linked.length < 2) continue; // never-active people are not "fading"
    const days = daysSinceLastMemory(linked, now);
    if (days >= FADING_DAYS && days !== Infinity) {
      insights.push({
        id: `fading:${person.id}`,
        kind: "contact_fading",
        objectId: person.id,
        objectName: person.name,
        message: `最近一个月，你和${person.name}的联系减少了。`,
        suggestion: "建议安排一次沟通。",
        days,
      });
    }
  }

  // Stalled goals / quiet projects.
  for (const object of [...byType("goal"), ...byType("project")]) {
    const status = String(object.properties?.status ?? "").toLowerCase();
    if (!IN_PROGRESS_STATUS.includes(status)) continue;
    const linked = memoriesForObject(object.id, memories);
    const days = daysSinceLastMemory(linked, now);
    if (days >= STALLED_DAYS) {
      insights.push({
        id: `stalled:${object.id}`,
        kind: object.type === "goal" ? "goal_stalled" : "project_quiet",
        objectId: object.id,
        objectName: object.name,
        message: `你已经 ${days === Infinity ? "很久" : `${days} 天`}没有推进：${object.name}。`,
        suggestion: object.type === "goal" ? "建议安排一个最小行动。" : "建议同步一次进展。",
        days: days === Infinity ? 999 : days,
      });
    }
  }

  return insights
    .sort((a, b) => b.days - a.days)
    .slice(0, MAX_INSIGHTS);
}
