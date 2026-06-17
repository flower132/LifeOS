import { AIProvider, AIProviderConfig } from "../types";

export function createMockProvider(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _config: AIProviderConfig
): AIProvider {
  return {
    async generate(prompt: string): Promise<string> {
      const lower = prompt.toLowerCase();
      const isPerson = lower.includes("person");
      const isSelf = lower.includes("self");

      if (isPerson) {
        return JSON.stringify({
          traits: ["No clear patterns recorded yet."],
          relationship_status: "Relationship context is sparse.",
          notes: "A person in your life. Data is insufficient for a detailed profile.",
        });
      }

      if (isSelf) {
        return JSON.stringify({
          focus_areas: ["Record more notes to identify focus areas."],
          strengths: ["Insufficient data to assess strengths."],
          weaknesses: ["Insufficient data to assess weaknesses."],
          summary: "Current state is unclear due to limited data.",
        });
      }

      return JSON.stringify({
        summary: "Limited data available for this object.",
        progress_insight: "No measurable progress yet.",
        blockers: ["Add notes to surface blockers."],
      });
    },
  };
}
