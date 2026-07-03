import { generatePrefixedId } from "@/lib/id";
import { LifeObject, LifeObjectType } from "@/lib/types";

export interface CreationDraft {
  id: string;
  type: LifeObjectType;
  name: string;
  context?: string;
  selected: boolean;
  duplicate?: {
    existing: LifeObject;
    action: "create" | "use-existing";
  };
  enriched?: import("@/lib/ai/objectIntelligence/types").AIAnalysisResult;
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function parseBatchInput(text: string): string[] {
  if (!text.trim()) return [];
  const parts = text
    .split(/[\n,，;；]/)
    .map((s) => normalizeName(s))
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(part);
    }
  }
  return unique;
}

export function findDuplicateByName(
  name: string,
  objects: LifeObject[]
): LifeObject | undefined {
  const normalized = normalizeName(name).toLowerCase();
  if (!normalized) return undefined;
  return objects.find(
    (o) => normalizeName(o.name).toLowerCase() === normalized
  );
}

export function createDraftId(): string {
  return generatePrefixedId("draft");
}
