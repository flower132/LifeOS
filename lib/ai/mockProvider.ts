import {
  AIProvider,
  EventGoalInsight,
  Language,
  PersonProfile,
  SelfState,
} from "./types";

function summarizeNotes(notesText: string, maxChars = 200): string {
  if (!notesText) return "";
  const trimmed = notesText.trim();
  return trimmed.length > maxChars ? trimmed.slice(0, maxChars) + "..." : trimmed;
}

function countNotes(notesText: string): number {
  if (!notesText) return 0;
  return notesText.split("\n---\n").filter(Boolean).length;
}

function t(zh: string, en: string, language: Language): string {
  return language === "zh" ? zh : en;
}

export const mockProvider: AIProvider = {
  async generatePersonProfile(
    objectName,
    objectDescription,
    notesText,
    relationsText,
    language
  ): Promise<PersonProfile> {
    const noteCount = countNotes(notesText);
    const notesPreview = summarizeNotes(notesText);

    return {
      summary: t(
        `基于 ${noteCount} 条记录，${objectName} 是你人生系统中的一个重要对象。${objectDescription || ""}`,
        `Based on ${noteCount} records, ${objectName} is an important object in your life system. ${objectDescription || ""}`,
        language
      ),
      personality_traits: [
        t(
          "系统基于现有记录还无法推断性格特征",
          "The system cannot infer personality traits from existing records yet",
          language
        ),
        t(
          "建议通过更多笔记来丰富画像",
          "Add more notes to enrich the profile",
          language
        ),
      ],
      recent_behavior_patterns: noteCount
        ? [
            t(
              "最近有相关记录被持续记录",
              "Recent records are being logged consistently",
              language
            ),
            notesPreview,
          ]
        : [
            t("暂无近期行为记录", "No recent behavior records", language),
          ],
      relationship_summary: relationsText
        ? t(
            `${objectName} 与系统中的其他对象存在关联。`,
            `${objectName} is connected to other objects in the system.`,
            language
          )
        : t(
            `尚未建立 ${objectName} 与其他对象的明确关系。`,
            `No explicit relationship has been established between ${objectName} and other objects yet.`,
            language
          ),
      interaction_level: noteCount > 5 ? "high" : noteCount > 0 ? "medium" : "low",
      attention_needed: noteCount
        ? [
            t(
              "继续保持记录，以生成更准确的洞察",
              "Keep recording to generate more accurate insights",
              language
            ),
          ]
        : [
            t(
              "建议添加关于此对象的笔记以建立画像",
              "Add notes about this object to build a profile",
              language
            ),
          ],
    };
  },

  async generateSelfState(
    objectName,
    objectDescription,
    notesText,
    relationsText,
    language
  ): Promise<SelfState> {
    const noteCount = countNotes(notesText);
    const relationCount = relationsText
      ? relationsText.split("\n").filter(Boolean).length
      : 0;

    return {
      current_state: t(
        `当前记录了 ${noteCount} 条笔记和 ${relationCount} 段关系。${objectDescription || ""}`,
        `Currently ${noteCount} notes and ${relationCount} relations are recorded. ${objectDescription || ""}`,
        language
      ),
      emotional_trend: noteCount
        ? t(
            "情绪趋势需要更多带情绪标签的笔记才能判断。",
            "Emotional trends require more notes with emotional labels to determine.",
            language
          )
        : t(
            "暂无足够数据判断情绪趋势。",
            "Not enough data to determine emotional trends.",
            language
          ),
      focus_areas: noteCount
        ? [
            t(
              "持续记录以发现关注焦点",
              "Keep recording to discover focus areas",
              language
            ),
          ]
        : [
            t(
              "从记录日常事件和想法开始",
              "Start by recording daily events and ideas",
              language
            ),
          ],
      risks: [
        t(
          "数据不足时，AI 洞察仅基于已有记录，不会编造事实。",
          "When data is insufficient, AI insights are based only on existing records and will not fabricate facts.",
          language
        ),
      ],
      recommendations: [
        t(
          "每天至少记录一条关于自己或重要对象的笔记",
          "Record at least one note about yourself or important objects every day",
          language
        ),
        t("为目标和事件添加描述", "Add descriptions to goals and events", language),
        t("使用标签对笔记进行分类", "Use tags to categorize notes", language),
      ],
    };
  },

  async generateEventInsight(
    objectName,
    objectDescription,
    notesText,
    language
  ): Promise<EventGoalInsight> {
    const noteCount = countNotes(notesText);
    const notesPreview = summarizeNotes(notesText);

    return {
      summary: t(
        `${objectName}。${objectDescription || ""} 目前有 ${noteCount} 条相关记录。`,
        `${objectName}. ${objectDescription || ""} Currently has ${noteCount} related records.`,
        language
      ),
      progress_insight: noteCount
        ? t(
            `最新记录：${notesPreview}`,
            `Latest record: ${notesPreview}`,
            language
          )
        : t(
            "尚未添加任何相关记录，无法评估进展。",
            "No related records have been added yet, progress cannot be evaluated.",
            language
          ),
      blockers: noteCount
        ? [
            t(
              "系统未检测到明确阻碍，需进一步记录细节。",
              "The system has not detected clear blockers; more detailed records are needed.",
              language
            ),
          ]
        : [
            t(
              "缺少记录，无法识别阻碍。",
              "Insufficient records to identify blockers.",
              language
            ),
          ],
    };
  },
};
