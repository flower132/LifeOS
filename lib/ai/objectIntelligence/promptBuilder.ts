import { Language } from "@/lib/i18n";
import { LifeObjectType } from "@/lib/types";
import { AIAnalysisInput } from "./types";
import { aiProfileRegistry } from "./profiles";

export function buildObjectAnalysisPrompt(
  type: LifeObjectType,
  input: AIAnalysisInput,
  language: Language
): string {
  const profile = aiProfileRegistry.get(type);
  if (!profile) {
    throw new Error(`No AI profile definition registered for type: ${type}`);
  }
  return profile.buildPrompt(input, language);
}
