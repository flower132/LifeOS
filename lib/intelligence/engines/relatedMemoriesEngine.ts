import { RelatedMemory } from "../core/types";
import { relatedMemoriesOutputSchema } from "../schemas";

export function mapRelatedMemoriesOutput(rawOutput: unknown): RelatedMemory[] {
  const parsed = relatedMemoriesOutputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    console.error("[Intelligence] Related memories parse error:", parsed.error);
    return [];
  }
  return parsed.data.relatedMemories;
}
