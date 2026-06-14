export interface PersonProfile {
  summary: string;
  personality_traits: string[];
  recent_behavior_patterns: string[];
  relationship_summary: string;
  interaction_level: "high" | "medium" | "low";
  attention_needed: string[];
}

export interface SelfState {
  current_state: string;
  emotional_trend: string;
  focus_areas: string[];
  risks: string[];
  recommendations: string[];
}

export interface EventGoalInsight {
  summary: string;
  progress_insight: string;
  blockers: string[];
}

export interface AIProvider {
  generatePersonProfile(
    objectName: string,
    objectDescription: string | undefined,
    notesText: string,
    relationsText: string
  ): Promise<PersonProfile>;

  generateSelfState(
    objectName: string,
    objectDescription: string | undefined,
    notesText: string,
    relationsText: string
  ): Promise<SelfState>;

  generateEventInsight(
    objectName: string,
    objectDescription: string | undefined,
    notesText: string
  ): Promise<EventGoalInsight>;
}
