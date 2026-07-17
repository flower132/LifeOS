import { propertiesToPromptContext } from "@/lib/objectProperties";
import { AdvisorContext, AdvisorObjectType } from "@/lib/ai/advisor/types";

/**
 * Shared context serialization for advisor-style prompts
 * (RELATIONSHIP / WORKSPACE tasks). Pure prompt-string builders only.
 */

export const ADVISOR_ROLES: Record<AdvisorObjectType, string> = {
  person: "关系经营顾问",
  goal: "目标规划顾问",
  project: "项目管理顾问",
  self: "自我成长顾问",
};

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

function serializeObject(object: AdvisorContext["object"]): string {
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

  return parts.join("\n");
}

function serializeMemories(object: AdvisorContext["object"]): string {
  const memories = object.memories ?? [];
  if (memories.length === 0) return "（无记忆）";
  return memories
    .map(
      (m) =>
        `[memory:${m.id}] ${formatDate(m.createdAt)}\n${m.content}`
    )
    .join("\n---\n");
}

function serializeNotes(notes: AdvisorContext["notes"]): string {
  if (notes.length === 0) return "（无笔记）";
  return notes
    .map(
      (n) =>
        `[note:${n.id}] ${formatDate(n.created_at)}\n${n.content}`
    )
    .join("\n---\n");
}

function serializeRelations(
  relations: AdvisorContext["relations"],
  relatedObjects: AdvisorContext["relatedObjects"]
): string {
  if (relations.length === 0) return "（无关系）";
  return relations
    .map((r) => {
      const otherId =
        r.source_object_id === r.target_object_id
          ? r.source_object_id
          : r.source_object_id;
      const other = relatedObjects.find((o) => o.id === otherId);
      const otherName = other?.name ?? "未知对象";
      const lines = [
        `[relation:${r.id}] ${r.type} with ${otherName}`,
      ];
      if (r.strength !== undefined) {
        lines.push(`强度：${Math.round(r.strength * 100)}%`);
      }
      if (r.note) {
        lines.push(`备注：${r.note}`);
      }
      return lines.join("\n");
    })
    .join("\n---\n");
}

export function buildAdvisorBaseContext(context: AdvisorContext): string {
  return `${serializeObject(context.object)}

相关记忆：
${serializeMemories(context.object)}

历史笔记：
${serializeNotes(context.notes)}

关系网络：
${serializeRelations(context.relations, context.relatedObjects)}`;
}
