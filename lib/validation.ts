import {
  LifeObject,
  Note,
  Relation,
  Tag,
  Template,
  TemplateCreateInput,
} from "./types";

const VALID_OBJECT_TYPES = new Set([
  "person",
  "self",
  "event",
  "idea",
  "goal",
]);

const VALID_RELATION_TYPES = new Set([
  "family",
  "friend",
  "colleague",
  "mentor",
  "partner",
  "custom",
]);

const VALID_TEMPLATE_CATEGORIES = new Set([
  "person",
  "self",
  "goal",
  "event",
  "idea",
  "task",
  "custom",
]);

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isValidLifeObject(obj: unknown): obj is LifeObject {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;

  if (!isValidId(o.id)) return false;
  if (!VALID_OBJECT_TYPES.has(o.type as string)) return false;
  if (typeof o.name !== "string" || o.name.trim().length === 0) return false;
  if (!Array.isArray(o.tag_ids)) return false;
  if (!o.tag_ids.every((id) => isValidId(id))) return false;
  if (!isValidIsoDate(o.created_at)) return false;
  if (!isValidIsoDate(o.updated_at)) return false;
  if (o.description !== undefined && typeof o.description !== "string") {
    return false;
  }

  return true;
}

export function isValidNote(obj: unknown): obj is Note {
  if (!obj || typeof obj !== "object") return false;
  const n = obj as Record<string, unknown>;

  if (!isValidId(n.id)) return false;
  if (!isValidId(n.object_id)) return false;
  if (typeof n.content !== "string" || n.content.trim().length === 0) {
    return false;
  }
  if (!isValidIsoDate(n.created_at)) return false;

  return true;
}

export function isValidRelation(obj: unknown): obj is Relation {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;

  if (!isValidId(r.id)) return false;
  if (!isValidId(r.source_object_id)) return false;
  if (!isValidId(r.target_object_id)) return false;
  if (!VALID_RELATION_TYPES.has(r.type as string)) return false;
  if (!isValidIsoDate(r.created_at)) return false;
  if (r.note !== undefined && typeof r.note !== "string") return false;
  if (
    r.strength !== undefined &&
    (typeof r.strength !== "number" || r.strength < 0 || r.strength > 1)
  ) {
    return false;
  }

  return true;
}

export function isValidTag(obj: unknown): obj is Tag {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;

  if (!isValidId(t.id)) return false;
  if (typeof t.name !== "string" || t.name.trim().length === 0) return false;
  if (!isValidIsoDate(t.createdAt)) return false;
  if (typeof t.usageCount !== "number" || t.usageCount < 0) return false;
  if (t.color !== undefined && typeof t.color !== "string") return false;

  return true;
}

export function validateInputObject(
  obj: Omit<LifeObject, "id" | "created_at" | "updated_at"
>
): void {
  if (!VALID_OBJECT_TYPES.has(obj.type)) {
    throw new Error(`Invalid object type: ${obj.type}`);
  }
  if (!obj.name || obj.name.trim().length === 0) {
    throw new Error("Object name is required");
  }
  if (!Array.isArray(obj.tag_ids)) {
    throw new Error("Object tag_ids must be an array");
  }
}

export function validateInputNote(
  note: Omit<Note, "id" | "created_at">
): void {
  if (!note.object_id || note.object_id.trim().length === 0) {
    throw new Error("Note object_id is required");
  }
  if (!note.content || note.content.trim().length === 0) {
    throw new Error("Note content is required");
  }
}

export function validateInputRelation(
  relation: Omit<Relation, "id" | "created_at">
): void {
  if (!relation.source_object_id || !relation.target_object_id) {
    throw new Error("Relation source and target object ids are required");
  }
  if (!VALID_RELATION_TYPES.has(relation.type)) {
    throw new Error(`Invalid relation type: ${relation.type}`);
  }
}

export function validateInputTag(
  tag: Omit<Tag, "id" | "createdAt" | "usageCount"
>
): void {
  if (!tag.name || tag.name.trim().length === 0) {
    throw new Error("Tag name is required");
  }
}

export function isValidTemplate(obj: unknown): obj is Template {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;

  if (!isValidId(t.id)) return false;
  if (typeof t.name !== "string" || t.name.trim().length === 0) return false;
  if (!VALID_TEMPLATE_CATEGORIES.has(t.category as string)) return false;
  if (typeof t.isDefault !== "boolean") return false;
  if (typeof t.content !== "string") return false;
  if (!isValidIsoDate(t.createdAt)) return false;
  if (!isValidIsoDate(t.updatedAt)) return false;
  if (typeof t.usageCount !== "number" || t.usageCount < 0) return false;
  if (t.lastUsedAt !== undefined && !isValidIsoDate(t.lastUsedAt)) return false;

  return true;
}

export function validateInputTemplate(template: TemplateCreateInput): void {
  if (!template.name || template.name.trim().length === 0) {
    throw new Error("Template name is required");
  }
  if (!VALID_TEMPLATE_CATEGORIES.has(template.category)) {
    throw new Error(`Invalid template category: ${template.category}`);
  }
  if (typeof template.isDefault !== "boolean") {
    throw new Error("Template isDefault must be a boolean");
  }
  if (typeof template.content !== "string") {
    throw new Error("Template content must be a string");
  }
}
