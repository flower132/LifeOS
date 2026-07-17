import { LifeObject, Note } from "@/lib/types";
import { propertiesToPromptContext } from "@/lib/objectProperties";
import { AIAnalysisInput } from "@/lib/ai/objectIntelligence/types";

/**
 * OBJECT_UPDATE task prompt — serialize the current object state plus new
 * material into the analysis input consumed by the object-analysis prompt.
 */

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function serializeCurrentObject(object: LifeObject): string {
  const parts = [
    `对象名称：${object.name}`,
    `对象类型：${object.type}`,
  ];

  if (object.description) {
    parts.push(`对象描述：${object.description}`);
  }

  const propertiesContext = propertiesToPromptContext(
    object.type,
    object.properties
  );
  if (propertiesContext) {
    parts.push(`对象属性：\n${propertiesContext}`);
  }

  if (object.aiProfile) {
    parts.push(`AI 画像：\n${JSON.stringify(object.aiProfile, null, 2)}`);
  }

  const insights = object.aiInsights ?? [];
  if (insights.length > 0) {
    parts.push(
      `当前洞察：\n${insights
        .map(
          (i) =>
            `- [${i.category}] ${i.title}: ${i.description} (confidence: ${i.confidence})`
        )
        .join("\n")}`
    );
  }

  const suggestions = object.aiSuggestions ?? [];
  if (suggestions.length > 0) {
    parts.push(
      `当前建议：\n${suggestions
        .map((s) => `- [${s.priority}] ${s.title}: ${s.description}`)
        .join("\n")}`
    );
  }

  const memories = object.memories ?? [];
  if (memories.length > 0) {
    parts.push(
      `当前记忆：\n${memories.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  return parts.join("\n\n");
}

function serializeNotes(notes: Note[], limit = 20): string {
  if (notes.length === 0) return "（无历史笔记）";
  const sorted = [...notes].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const recent = sorted.slice(0, limit);
  return recent
    .map(
      (note, index) =>
        `[历史记录 ${index + 1}] ${formatDate(note.created_at)}\n${note.content}`
    )
    .join("\n---\n");
}

export function buildUpdateInput(
  object: LifeObject,
  existingNotes: Note[],
  newInput: AIAnalysisInput
): AIAnalysisInput {
  const contextText = `【当前对象状态】\n${serializeCurrentObject(object)}\n\n【历史笔记】\n${serializeNotes(
    existingNotes
  )}`;

  const newMaterialParts: string[] = [];
  if (newInput.textInput.trim()) {
    newMaterialParts.push(`【新增素材】\n${newInput.textInput}`);
  }
  if (newInput.images.length > 0) {
    newMaterialParts.push(`（新增素材包含 ${newInput.images.length} 张图片）`);
  }

  const textInput = [contextText, ...newMaterialParts].join("\n\n");

  return {
    textInput,
    images: newInput.images,
  };
}
