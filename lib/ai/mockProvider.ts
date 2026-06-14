import {
  AIProvider,
  EventGoalInsight,
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

export const mockProvider: AIProvider = {
  async generatePersonProfile(
    objectName,
    objectDescription,
    notesText,
    relationsText
  ): Promise<PersonProfile> {
    const noteCount = countNotes(notesText);
    const notesPreview = summarizeNotes(notesText);

    return {
      summary: `基于 ${noteCount} 条记录，${objectName} 是你人生系统中的一个重要对象。${objectDescription || ""}`,
      personality_traits: [
        "系统基于现有记录还无法推断性格特征",
        "建议通过更多笔记来丰富画像",
      ],
      recent_behavior_patterns: noteCount
        ? ["最近有相关记录被持续记录", notesPreview]
        : ["暂无近期行为记录"],
      relationship_summary: relationsText
        ? `${objectName} 与系统中的其他对象存在关联。`
        : `尚未建立 ${objectName} 与其他对象的明确关系。`,
      interaction_level: noteCount > 5 ? "high" : noteCount > 0 ? "medium" : "low",
      attention_needed: noteCount
        ? ["继续保持记录，以生成更准确的洞察"]
        : ["建议添加关于此对象的笔记以建立画像"],
    };
  },

  async generateSelfState(
    objectName,
    objectDescription,
    notesText,
    relationsText
  ): Promise<SelfState> {
    const noteCount = countNotes(notesText);
    const relationCount = relationsText
      ? relationsText.split("\n").filter(Boolean).length
      : 0;

    return {
      current_state: `当前记录了 ${noteCount} 条笔记和 ${relationCount} 段关系。${objectDescription || ""}`,
      emotional_trend: noteCount
        ? "情绪趋势需要更多带情绪标签的笔记才能判断。"
        : "暂无足够数据判断情绪趋势。",
      focus_areas: noteCount
        ? ["持续记录以发现关注焦点"]
        : ["从记录日常事件和想法开始"],
      risks: ["数据不足时，AI 洞察仅基于已有记录，不会编造事实。"],
      recommendations: [
        "每天至少记录一条关于自己或重要对象的笔记",
        "为目标和事件添加描述",
        "使用标签对笔记进行分类",
      ],
    };
  },

  async generateEventInsight(
    objectName,
    objectDescription,
    notesText
  ): Promise<EventGoalInsight> {
    const noteCount = countNotes(notesText);
    const notesPreview = summarizeNotes(notesText);

    return {
      summary: `${objectName}。${objectDescription || ""} 目前有 ${noteCount} 条相关记录。`,
      progress_insight: noteCount
        ? `最新记录：${notesPreview}`
        : "尚未添加任何相关记录，无法评估进展。",
      blockers: noteCount
        ? ["系统未检测到明确阻碍，需进一步记录细节。"]
        : ["缺少记录，无法识别阻碍。"],
    };
  },
};
