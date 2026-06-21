import { Language } from "./i18n";
import { LifeObjectType, ObjectProperties } from "./types";

export type PropertyFieldType =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "select"
  | "tags";

export interface PropertyFieldSchema {
  key: string;
  label: { zh: string; en: string };
  type: PropertyFieldType;
  options?: { value: string; label: { zh: string; en: string } }[];
  placeholder?: { zh: string; en: string };
}

const PERSON_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "birthday",
    label: { zh: "生日", en: "Birthday" },
    placeholder: { zh: "请选择生日", en: "Select birthday" },
    type: "date",
  },
  {
    key: "phone",
    label: { zh: "手机号", en: "Phone" },
    placeholder: { zh: "请输入手机号", en: "Enter phone number" },
    type: "text",
  },
  {
    key: "personality",
    label: { zh: "性格", en: "Personality" },
    placeholder: { zh: "请输入性格描述", en: "Enter personality description" },
    type: "textarea",
  },
  {
    key: "hobbies",
    label: { zh: "爱好", en: "Hobbies" },
    placeholder: { zh: "请输入爱好，用逗号分隔", en: "Enter hobbies, separated by commas" },
    type: "tags",
  },
  {
    key: "likes",
    label: { zh: "喜欢", en: "Likes" },
    placeholder: { zh: "请输入喜欢的事物", en: "Enter things you like" },
    type: "tags",
  },
  {
    key: "dislikes",
    label: { zh: "不喜欢", en: "Dislikes" },
    placeholder: { zh: "请输入不喜欢的事物", en: "Enter things you dislike" },
    type: "tags",
  },
  {
    key: "strengths",
    label: { zh: "优点", en: "Strengths" },
    placeholder: { zh: "请输入优点", en: "Enter strengths" },
    type: "tags",
  },
  {
    key: "weaknesses",
    label: { zh: "缺点", en: "Weaknesses" },
    placeholder: { zh: "请输入缺点", en: "Enter weaknesses" },
    type: "tags",
  },
  {
    key: "motto",
    label: { zh: "人生格言", en: "Motto" },
    placeholder: { zh: "请输入人生格言", en: "Enter motto" },
    type: "textarea",
  },
  {
    key: "name",
    label: { zh: "姓名", en: "Name" },
    placeholder: { zh: "请输入姓名", en: "Enter name" },
    type: "text",
  },
  {
    key: "nickname",
    label: { zh: "昵称", en: "Nickname" },
    placeholder: { zh: "请输入昵称", en: "Enter nickname" },
    type: "text",
  },
  {
    key: "wechat",
    label: { zh: "微信", en: "WeChat" },
    placeholder: { zh: "请输入微信号", en: "Enter WeChat ID" },
    type: "text",
  },
  {
    key: "email",
    label: { zh: "邮箱", en: "Email" },
    placeholder: { zh: "请输入邮箱", en: "Enter email" },
    type: "text",
  },
  {
    key: "mbti",
    label: { zh: "MBTI", en: "MBTI" },
    placeholder: { zh: "请输入 MBTI", en: "Enter MBTI" },
    type: "text",
  },
  {
    key: "favorite_food",
    label: { zh: "爱吃", en: "Favorite Food" },
    placeholder: { zh: "请输入最爱吃的食物", en: "Enter favorite food" },
    type: "tags",
  },
];

const SELF_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "current_goal",
    label: { zh: "当前目标", en: "Current Goal" },
    placeholder: { zh: "请输入当前目标", en: "Enter current goal" },
    type: "textarea",
  },
  {
    key: "current_state",
    label: { zh: "当前状态", en: "Current State" },
    placeholder: { zh: "请输入当前状态", en: "Enter current state" },
    type: "textarea",
  },
  {
    key: "strengths",
    label: { zh: "优势", en: "Strengths" },
    placeholder: { zh: "请输入优势", en: "Enter strengths" },
    type: "tags",
  },
  {
    key: "weaknesses",
    label: { zh: "短板", en: "Weaknesses" },
    placeholder: { zh: "请输入短板", en: "Enter weaknesses" },
    type: "tags",
  },
  {
    key: "growth_direction",
    label: { zh: "成长方向", en: "Growth Direction" },
    placeholder: { zh: "请输入成长方向", en: "Enter growth direction" },
    type: "textarea",
  },
  {
    key: "age",
    label: { zh: "年龄", en: "Age" },
    placeholder: { zh: "请输入年龄", en: "Enter age" },
    type: "text",
  },
  {
    key: "career",
    label: { zh: "职业", en: "Career" },
    placeholder: { zh: "请输入职业", en: "Enter career" },
    type: "text",
  },
  {
    key: "city",
    label: { zh: "城市", en: "City" },
    placeholder: { zh: "请输入城市", en: "Enter city" },
    type: "text",
  },
];

const GOAL_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "target_date",
    label: { zh: "目标日期", en: "Target Date" },
    placeholder: { zh: "请选择目标日期", en: "Select target date" },
    type: "date",
  },
  {
    key: "deadline",
    label: { zh: "截止时间", en: "Deadline" },
    placeholder: { zh: "请选择截止时间", en: "Select deadline" },
    type: "date",
  },
  {
    key: "priority",
    label: { zh: "优先级", en: "Priority" },
    placeholder: { zh: "请选择优先级", en: "Select priority" },
    type: "select",
    options: [
      { value: "low", label: { zh: "低", en: "Low" } },
      { value: "medium", label: { zh: "中", en: "Medium" } },
      { value: "high", label: { zh: "高", en: "High" } },
    ],
  },
  {
    key: "progress",
    label: { zh: "进度", en: "Progress" },
    placeholder: { zh: "请输入进度", en: "Enter progress" },
    type: "number",
  },
  {
    key: "status",
    label: { zh: "状态", en: "Status" },
    placeholder: { zh: "请选择状态", en: "Select status" },
    type: "select",
    options: [
      {
        value: "not_started",
        label: { zh: "未开始", en: "Not Started" },
      },
      {
        value: "in_progress",
        label: { zh: "进行中", en: "In Progress" },
      },
      {
        value: "completed",
        label: { zh: "已完成", en: "Completed" },
      },
      {
        value: "paused",
        label: { zh: "已暂停", en: "Paused" },
      },
    ],
  },
];

const EVENT_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "date",
    label: { zh: "时间", en: "Date" },
    placeholder: { zh: "请选择时间", en: "Select date" },
    type: "date",
  },
  {
    key: "date_alt",
    label: { zh: "日期", en: "Date" },
    placeholder: { zh: "请选择日期", en: "Select date" },
    type: "date",
  },
  {
    key: "location",
    label: { zh: "地点", en: "Location" },
    placeholder: { zh: "请输入地点", en: "Enter location" },
    type: "text",
  },
  {
    key: "participants",
    label: { zh: "参与人", en: "Participants" },
    placeholder: { zh: "请输入参与人", en: "Enter participants" },
    type: "tags",
  },
  {
    key: "outcome",
    label: { zh: "结果", en: "Outcome" },
    placeholder: { zh: "请输入结果", en: "Enter outcome" },
    type: "textarea",
  },
];

const IDEA_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "category",
    label: { zh: "分类", en: "Category" },
    placeholder: { zh: "请输入分类", en: "Enter category" },
    type: "text",
  },
  {
    key: "feasibility",
    label: { zh: "可执行性", en: "Feasibility" },
    placeholder: { zh: "请选择可执行性", en: "Select feasibility" },
    type: "select",
    options: [
      { value: "low", label: { zh: "低", en: "Low" } },
      { value: "medium", label: { zh: "中", en: "Medium" } },
      { value: "high", label: { zh: "高", en: "High" } },
    ],
  },
  {
    key: "next_action",
    label: { zh: "下一步行动", en: "Next Action" },
    placeholder: { zh: "请输入下一步行动", en: "Enter next action" },
    type: "textarea",
  },
];

export const PROPERTY_SCHEMAS: Record<LifeObjectType, PropertyFieldSchema[]> = {
  person: PERSON_SCHEMA,
  self: SELF_SCHEMA,
  goal: GOAL_SCHEMA,
  event: EVENT_SCHEMA,
  idea: IDEA_SCHEMA,
};

export function getDefaultProperties(): ObjectProperties {
  return {};
}

// ---- Template parsing -------------------------------------------------------

function normalizeLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function findSchemaByLabel(
  type: LifeObjectType,
  label: string
): PropertyFieldSchema | undefined {
  const schema = PROPERTY_SCHEMAS[type];
  if (!schema) return undefined;
  const normalized = label.trim().toLowerCase();
  return schema.find(
    (field) =>
      field.label.zh === label ||
      field.label.en.toLowerCase() === normalized ||
      field.key.toLowerCase() === normalized
  );
}

function parseLineValue(line: string): { label: string; value: string } | null {
  const match = line.match(/^(.+?)[：:]\s*(.*)$/);
  if (!match) return null;
  const label = match[1].trim();
  const value = match[2].trim();
  if (!label) return null;
  return { label, value };
}

function parseNumber(value: string): number | undefined {
  const cleaned = value.replace(/%/g, "").trim();
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
}

function parseTags(value: string): string[] {
  return value
    .split(/[,，;；]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseSelectValue(
  value: string,
  options?: { value: string }[]
): string | undefined {
  const lower = value.toLowerCase();
  const optionValues = new Set(options?.map((o) => o.value) ?? []);

  if (lower.includes("高") || lower.includes("high")) {
    if (optionValues.has("high")) return "high";
  }
  if (lower.includes("中") || lower.includes("medium")) {
    if (optionValues.has("medium")) return "medium";
  }
  if (lower.includes("低") || lower.includes("low")) {
    if (optionValues.has("low")) return "low";
  }
  if (lower.includes("未开始") || lower.includes("not")) {
    if (optionValues.has("not_started")) return "not_started";
  }
  if (lower.includes("已完成") || lower.includes("completed")) {
    if (optionValues.has("completed")) return "completed";
  }
  if (lower.includes("已暂停") || lower.includes("paused")) {
    if (optionValues.has("paused")) return "paused";
  }
  if (lower.includes("进行中") || lower.includes("progress")) {
    if (optionValues.has("in_progress")) return "in_progress";
  }

  return undefined;
}

export function templateToProperties(
  type: LifeObjectType,
  content: string
): ObjectProperties {
  const lines = normalizeLines(content);
  const properties: Record<string, unknown> = {};

  for (const line of lines) {
    // Skip markdown headings.
    if (line.startsWith("#")) continue;
    // Skip placeholder list items like "-" or "1.".
    if (/^[-*\d.]+$/.test(line)) continue;

    const parsed = parseLineValue(line);
    if (!parsed) continue;

    const { label, value } = parsed;
    if (!value || value === "-") continue;

    const schema = findSchemaByLabel(type, label);
    const key = schema?.key ?? label;
    const fieldType = schema?.type ?? "text";

    switch (fieldType) {
      case "number": {
        const num = parseNumber(value);
        if (num !== undefined) properties[key] = num;
        break;
      }
      case "tags":
        properties[key] = parseTags(value);
        break;
      case "select":
        properties[key] = parseSelectValue(value, schema?.options) ?? value;
        break;
      case "text":
      case "textarea":
      case "date":
      default:
        properties[key] = value;
        break;
    }
  }

  return properties;
}

/**
 * Parse a template into an editable property map.
 * Unlike `templateToProperties`, empty fields are preserved so the editor can
 * render inputs for every field present in the template.
 */
export function templateToEditableProperties(
  type: LifeObjectType,
  content: string
): ObjectProperties {
  const lines = normalizeLines(content);
  const properties: Record<string, unknown> = {};

  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (/^[-*\d.]+$/.test(line)) continue;

    const parsed = parseLineValue(line);
    if (!parsed) continue;

    const { label, value } = parsed;
    const schema = findSchemaByLabel(type, label);
    const key = schema?.key ?? label;

    if (!value || value === "-") {
      properties[key] = "";
      continue;
    }

    const fieldType = schema?.type ?? "text";
    switch (fieldType) {
      case "number": {
        const num = parseNumber(value);
        properties[key] = num !== undefined ? num : "";
        break;
      }
      case "tags":
        properties[key] = parseTags(value);
        break;
      case "select":
        properties[key] = parseSelectValue(value, schema?.options) ?? value;
        break;
      case "text":
      case "textarea":
      case "date":
      default:
        properties[key] = value;
        break;
    }
  }

  return properties;
}

// ---- Serialization helpers --------------------------------------------------

export function getFieldSchema(
  type: LifeObjectType,
  key: string
): PropertyFieldSchema | undefined {
  return PROPERTY_SCHEMAS[type]?.find((field) => field.key === key);
}

export function guessFieldType(
  type: LifeObjectType,
  key: string
): PropertyFieldType {
  return getFieldSchema(type, key)?.type ?? "textarea";
}

export function getPropertyLabel(
  type: LifeObjectType,
  key: string,
  language: Language
): string {
  const schema = getFieldSchema(type, key);
  if (schema) {
    return schema.label[language];
  }
  return key;
}

export function getPropertyPlaceholder(
  type: LifeObjectType,
  key: string,
  language: Language
): string {
  const schema = getFieldSchema(type, key);
  return schema?.placeholder?.[language] ?? "";
}

export function formatPropertyValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function propertiesToPromptContext(
  type: LifeObjectType,
  properties: ObjectProperties | undefined
): string | undefined {
  if (!properties || Object.keys(properties).length === 0) return undefined;

  const lines: string[] = [];
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === "" || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    const label = getPropertyLabel(type, key, "en");
    lines.push(`${label} (${key}): ${formatPropertyValue(value)}`);
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function propertiesToPreview(
  type: LifeObjectType,
  properties: ObjectProperties | undefined,
  language: Language
): string | undefined {
  if (!properties || Object.keys(properties).length === 0) return undefined;

  const schema = PROPERTY_SCHEMAS[type];
  const priorityKeys = schema?.map((field) => field.key) ?? [];
  const parts: string[] = [];

  for (const key of priorityKeys) {
    if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;
    const value = properties[key];
    if (value === undefined || value === "" || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    const label = getPropertyLabel(type, key, language);
    parts.push(`${label}: ${formatPropertyValue(value)}`);
  }

  // If no priority keys have values, fall back to first few entries.
  if (parts.length === 0) {
    for (const [key, value] of Object.entries(properties).slice(0, 3)) {
      if (value === undefined || value === "" || value === null) continue;
      const label = getPropertyLabel(type, key, language);
      parts.push(`${label}: ${formatPropertyValue(value)}`);
    }
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

// ---- Migration helpers ------------------------------------------------------

function buildLabelToKeyMap(type: LifeObjectType): Map<string, string> {
  const map = new Map<string, string>();
  const schema = PROPERTY_SCHEMAS[type];
  if (!schema) return map;

  for (const field of schema) {
    // Map both Chinese and English labels to the stable key.
    map.set(field.label.zh, field.key);
    map.set(field.label.en.toLowerCase(), field.key);
    // Stable key maps to itself.
    map.set(field.key, field.key);
    map.set(field.key.toLowerCase(), field.key);
  }

  return map;
}

const LABEL_TO_KEY_MAPS: Record<LifeObjectType, Map<string, string>> = {
  person: buildLabelToKeyMap("person"),
  self: buildLabelToKeyMap("self"),
  goal: buildLabelToKeyMap("goal"),
  event: buildLabelToKeyMap("event"),
  idea: buildLabelToKeyMap("idea"),
};

/**
 * Migrate legacy property keys (e.g. Chinese labels) to stable keys.
 * Unknown keys are preserved as-is to support user-defined fields.
 */
export function migratePropertyKeys(
  type: LifeObjectType,
  properties: ObjectProperties | undefined
): ObjectProperties | undefined {
  if (!properties || typeof properties !== "object") return properties;

  const map = LABEL_TO_KEY_MAPS[type];
  if (!map) return properties;

  const migrated: ObjectProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    const stableKey = map.get(key) ?? map.get(key.toLowerCase()) ?? key;
    migrated[stableKey] = value;
  }

  return migrated;
}
