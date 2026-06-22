import { storage } from "./storage";
import { LifeObject, Note, Relation, Tag, Template } from "./types";
import {
  getDefaultProperties,
  migratePropertyKeys,
  PROPERTY_SCHEMAS,
  templateToProperties,
} from "./objectProperties";

const STORAGE_VERSION = 5;

export interface ExportedData {
  version: number;
  exportedAt: string;
  objects: unknown;
  notes: unknown;
  relations: unknown;
  tags: unknown;
  templates: unknown;
  settings: unknown;
}

function looksLikeTemplateContent(
  content: string,
  type: string,
  schemaLabelsByType: Record<string, Set<string>>
): boolean {
  const schemaLabels = schemaLabelsByType[type];
  if (!schemaLabels) return false;

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 3) return false;

  let labelMatches = 0;
  let labelLines = 0;

  for (const line of lines) {
    const match = line.match(/^(.+?)[：:]\s*(.*)$/);
    if (!match) continue;
    const label = match[1].trim().toLowerCase();
    if (!label) continue;
    labelLines++;
    if (schemaLabels.has(label)) {
      labelMatches++;
    }
  }

  const hasHeadings = lines.some((line) => line.startsWith("#"));
  return hasHeadings || (labelLines > 0 && labelMatches / labelLines >= 0.5);
}

export async function exportAllData(): Promise<ExportedData> {
  const [objects, notes, relations, tags, templates, settings] = await Promise.all([
    storage.getObjects(),
    storage.getNotes(),
    storage.getRelations(),
    storage.getTags(),
    storage.getTemplates(),
    storage.getSettings(),
  ]);

  return {
    version: 5,
    exportedAt: new Date().toISOString(),
    objects,
    notes,
    relations,
    tags,
    templates,
    settings,
  };
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAllDataAsMarkdown(): Promise<string> {
  const [objects, notes, relations, tags] = await Promise.all([
    storage.getObjects(),
    storage.getNotes(),
    storage.getRelations(),
    storage.getTags(),
  ]);

  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const objectMap = new Map(objects.map((o) => [o.id, o]));

  const lines: string[] = [];
  lines.push("# LifeOS Export");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Objects");
  lines.push("");
  if (objects.length === 0) {
    lines.push("_No objects._");
  } else {
    for (const obj of objects) {
      lines.push(`### ${obj.name}`);
      lines.push("");
      lines.push(`- **Type:** ${obj.type}`);
      if (obj.description) {
        lines.push(`- **Description:** ${obj.description}`);
      }
      if (obj.tag_ids.length > 0) {
        const tagNames = obj.tag_ids
          .map((id) => tagMap.get(id)?.name)
          .filter(Boolean)
          .join(", ");
        lines.push(`- **Tags:** ${tagNames}`);
      }
      lines.push(`- **Created:** ${obj.created_at}`);
      lines.push(`- **Updated:** ${obj.updated_at}`);
      lines.push("");
    }
  }

  lines.push("## Notes");
  lines.push("");
  if (notes.length === 0) {
    lines.push("_No notes._");
  } else {
    for (const note of notes) {
      const obj = objectMap.get(note.object_id);
      lines.push(`### ${obj?.name ?? note.object_id}`);
      lines.push("");
      lines.push(note.content);
      lines.push("");
      lines.push(`_Created at ${note.created_at}_`);
      lines.push("");
    }
  }

  lines.push("## Relations");
  lines.push("");
  if (relations.length === 0) {
    lines.push("_No relations._");
  } else {
    for (const relation of relations) {
      const source = objectMap.get(relation.source_object_id)?.name ?? relation.source_object_id;
      const target = objectMap.get(relation.target_object_id)?.name ?? relation.target_object_id;
      lines.push(`- **${source}** → **${target}** (${relation.type})`);
    }
    lines.push("");
  }

  lines.push("## Tags");
  lines.push("");
  if (tags.length === 0) {
    lines.push("_No tags._");
  } else {
    for (const tag of tags) {
      lines.push(`- ${tag.name} (used ${tag.usageCount} times)`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importAllData(data: unknown): Promise<void> {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid import file: expected an object");
  }

  const payload = data as Record<string, unknown>;
  const version = typeof payload.version === "number" ? payload.version : 0;
  if (version < 1 || version > 5) {
    throw new Error(`Unsupported export version: ${version}`);
  }

  const objects = Array.isArray(payload.objects) ? (payload.objects as LifeObject[]) : [];
  const schemaLabelsByType: Record<string, Set<string>> = Object.fromEntries(
    Object.entries(PROPERTY_SCHEMAS).map(([type, fields]) => [
      type,
      new Set(
        fields.flatMap((f) => [
          f.label.zh,
          f.label.en.toLowerCase(),
          ...(f.legacyLabels?.zh ?? []),
          ...(f.legacyLabels?.en?.map((l) => l.toLowerCase()) ?? []),
        ])
      ),
    ])
  );

  // Backfill missing properties and migrate legacy property keys for older exports.
  // Also parse any auto-generated template markdown still living in description.
  const objectsWithProperties = objects.map((object) => {
    const withProperties =
      object.properties && typeof object.properties === "object"
        ? object
        : { ...object, properties: getDefaultProperties() };

    let nextProperties = withProperties.properties;
    let nextDescription = withProperties.description;
    if (
      withProperties.description &&
      typeof withProperties.description === "string" &&
      looksLikeTemplateContent(
        withProperties.description,
        withProperties.type,
        schemaLabelsByType
      )
    ) {
      const parsed = templateToProperties(withProperties.type, withProperties.description);
      nextProperties = { ...parsed, ...withProperties.properties };
      nextDescription = undefined;
    }

    const migratedProperties = migratePropertyKeys(
      withProperties.type,
      nextProperties
    );

    if (
      migratedProperties === withProperties.properties &&
      nextDescription === withProperties.description
    ) {
      return withProperties;
    }
    return { ...withProperties, properties: migratedProperties, description: nextDescription };
  });
  const notes = Array.isArray(payload.notes) ? (payload.notes as Note[]) : [];
  const relations = Array.isArray(payload.relations) ? (payload.relations as Relation[]) : [];
  const tags = Array.isArray(payload.tags) ? (payload.tags as Tag[]) : [];
  const templates = Array.isArray(payload.templates) ? (payload.templates as Template[]) : [];
  const settings = payload.settings && typeof payload.settings === "object" ? payload.settings : {};

  // Write through the storage adapter. Validation happens inside the adapter.
  await Promise.all([
    storage.setStorageVersion(STORAGE_VERSION),
    storage.setSettings(settings),
    storage.setObjects(objectsWithProperties),
    storage.setNotes(notes),
    storage.setRelations(relations),
    storage.setTags(tags),
    storage.setTemplates(templates),
  ]);
}

export function calculateStorageUsage(): number {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("lifeos_")) {
      total += (window.localStorage.getItem(key) || "").length * 2;
    }
  }
  return total;
}

export function formatStorageUsage(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export async function clearAllData(): Promise<void> {
  if (typeof window === "undefined") return;
  const keys = [
    "lifeos_objects",
    "lifeos_notes",
    "lifeos_relations",
    "lifeos_tags",
    "lifeos_templates",
    "lifeos_settings",
    "lifeos_version",
    "lifeos_recent_tags",
  ];
  keys.forEach((key) => window.localStorage.removeItem(key));
}
