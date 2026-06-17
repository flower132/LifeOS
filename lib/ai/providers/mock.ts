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
          summary: "A person in your life. Data is insufficient for a detailed profile.",
          personality_traits: ["No clear patterns recorded yet."],
          recent_behavior_patterns: ["No recent interactions recorded."],
          relationship_summary: "Relationship context is sparse.",
          interaction_level: "low",
          attention_needed: ["Add more notes to build a richer profile."],
        });
      }

      if (isSelf) {
        return JSON.stringify({
          current_state: "Current state is unclear due to limited data.",
          emotional_trend: "No strong trend detected.",
          focus_areas: ["Record more notes to identify focus areas."],
          risks: ["Insufficient data to assess risks."],
          recommendations: ["Keep capturing daily reflections."],
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
