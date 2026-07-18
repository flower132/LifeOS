import { LifeObject } from "@/lib/types";

/** Per-type customization of the Object Intelligence profile analysis. */
export interface ObjectIntelligenceStrategy {
  /** Type-specific instructions injected into the profile prompt. */
  promptInstructions(object: LifeObject): string;
}
