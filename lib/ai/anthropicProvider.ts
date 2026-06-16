import {
  AIProvider,
  EventGoalInsight,
  Language,
  PersonProfile,
  SelfState,
} from "./types";

function buildSystemPrompt(shape: string, language: Language): string {
  const langHint =
    language === "zh"
      ? "Respond in Chinese (Simplified)."
      : "Respond in English.";

  return `You are a structured understanding engine for a personal life OS. Based ONLY on the user data provided, generate a JSON object matching this exact shape:
${shape}
Rules:
- Do not invent facts not present in the data.
- If data is insufficient, say so explicitly in fields.
- Keep each string concise (1-2 sentences).
- ${langHint}`;
}

const PERSON_SHAPE = JSON.stringify(
  {
    summary: "string",
    personality_traits: ["string"],
    recent_behavior_patterns: ["string"],
    relationship_summary: "string",
    interaction_level: "high | medium | low",
    attention_needed: ["string"],
  },
  null,
  2
);

const SELF_SHAPE = JSON.stringify(
  {
    current_state: "string",
    emotional_trend: "string",
    focus_areas: ["string"],
    risks: ["string"],
    recommendations: ["string"],
  },
  null,
  2
);

const EVENT_SHAPE = JSON.stringify(
  {
    summary: "string",
    progress_insight: "string",
    blockers: ["string"],
  },
  null,
  2
);

async function callAnthropic<T>(
  system: string,
  userContent: string
): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl =
    process.env.ANTHROPIC_API_BASE || "https://api.anthropic.com/v1";
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userContent }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
  };

  const text = data.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Empty response from Anthropic");

  // Extract JSON if wrapped in markdown fences
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
  const json = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(json) as T;
}

function buildUserContent(
  objectName: string,
  objectDescription: string | undefined,
  notesText: string,
  relationsText?: string
): string {
  return `Object name: ${objectName}\nDescription: ${objectDescription || "None"}\n\nNotes:\n${notesText || "None"}${relationsText !== undefined ? `\n\nRelations:\n${relationsText || "None"}` : ""}`;
}

export const anthropicProvider: AIProvider = {
  async generatePersonProfile(
    objectName,
    objectDescription,
    notesText,
    relationsText,
    language
  ): Promise<PersonProfile> {
    return callAnthropic<PersonProfile>(
      buildSystemPrompt(PERSON_SHAPE, language),
      buildUserContent(
        objectName,
        objectDescription,
        notesText,
        relationsText
      )
    );
  },

  async generateSelfState(
    objectName,
    objectDescription,
    notesText,
    relationsText,
    language
  ): Promise<SelfState> {
    return callAnthropic<SelfState>(
      buildSystemPrompt(SELF_SHAPE, language),
      buildUserContent(objectName, objectDescription, notesText, relationsText)
    );
  },

  async generateEventInsight(
    objectName,
    objectDescription,
    notesText,
    language
  ): Promise<EventGoalInsight> {
    return callAnthropic<EventGoalInsight>(
      buildSystemPrompt(EVENT_SHAPE, language),
      buildUserContent(objectName, objectDescription, notesText)
    );
  },
};
