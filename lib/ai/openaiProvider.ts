import {
  AIProvider,
  EventGoalInsight,
  PersonProfile,
  SelfState,
} from "./types";

function buildPersonMessages(
  objectName: string,
  objectDescription: string | undefined,
  notesText: string,
  relationsText: string
) {
  return [
    {
      role: "system" as const,
      content: `You are a structured understanding engine for a personal life OS. Based ONLY on the user data provided, generate a JSON object matching this exact shape:
{
  "summary": "string",
  "personality_traits": ["string"],
  "recent_behavior_patterns": ["string"],
  "relationship_summary": "string",
  "interaction_level": "high" | "medium" | "low",
  "attention_needed": ["string"]
}
Rules:
- Do not invent facts not present in the data.
- If data is insufficient, say so explicitly in fields.
- Keep each string concise (1-2 sentences).`,
    },
    {
      role: "user" as const,
      content: `Object name: ${objectName}\nDescription: ${objectDescription || "None"}\n\nNotes:\n${notesText || "None"}\n\nRelations:\n${relationsText || "None"}`,
    },
  ];
}

function buildSelfMessages(
  objectName: string,
  objectDescription: string | undefined,
  notesText: string,
  relationsText: string
) {
  return [
    {
      role: "system" as const,
      content: `You are a structured understanding engine for a personal life OS. Based ONLY on the user data provided, generate a JSON object matching this exact shape:
{
  "current_state": "string",
  "emotional_trend": "string",
  "focus_areas": ["string"],
  "risks": ["string"],
  "recommendations": ["string"]
}
Rules:
- Do not invent facts not present in the data.
- If data is insufficient, say so explicitly in fields.
- Keep each string concise.`,
    },
    {
      role: "user" as const,
      content: `Object name: ${objectName}\nDescription: ${objectDescription || "None"}\n\nNotes:\n${notesText || "None"}\n\nRelations:\n${relationsText || "None"}`,
    },
  ];
}

function buildEventMessages(
  objectName: string,
  objectDescription: string | undefined,
  notesText: string
) {
  return [
    {
      role: "system" as const,
      content: `You are a structured understanding engine for a personal life OS. Based ONLY on the user data provided, generate a JSON object matching this exact shape:
{
  "summary": "string",
  "progress_insight": "string",
  "blockers": ["string"]
}
Rules:
- Do not invent facts not present in the data.
- If data is insufficient, say so explicitly in fields.
- Keep each string concise.`,
    },
    {
      role: "user" as const,
      content: `Object name: ${objectName}\nDescription: ${objectDescription || "None"}\n\nNotes:\n${notesText || "None"}`,
    },
  ];
}

async function callOpenAI<T>(messages: unknown[]): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");

  return JSON.parse(content) as T;
}

export const openaiProvider: AIProvider = {
  async generatePersonProfile(
    objectName,
    objectDescription,
    notesText,
    relationsText
  ): Promise<PersonProfile> {
    return callOpenAI<PersonProfile>(
      buildPersonMessages(
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
    relationsText
  ): Promise<SelfState> {
    return callOpenAI<SelfState>(
      buildSelfMessages(objectName, objectDescription, notesText, relationsText)
    );
  },

  async generateEventInsight(
    objectName,
    objectDescription,
    notesText
  ): Promise<EventGoalInsight> {
    return callOpenAI<EventGoalInsight>(
      buildEventMessages(objectName, objectDescription, notesText)
    );
  },
};
