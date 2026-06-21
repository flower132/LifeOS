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
  label: string;
  labelZh: string;
  type: PropertyFieldType;
  options?: { value: string; label: string; labelZh: string }[];
  placeholder?: string;
  placeholderZh?: string;
}

const PERSON_SCHEMA: PropertyFieldSchema[] = [
  { key: "生日", label: "Birthday", labelZh: "生日", type: "date" },
  { key: "手机号", label: "Phone", labelZh: "手机号", type: "text" },
  {
    key: "性格",
    label: "Personality",
    labelZh: "性格",
    type: "textarea",
  },
  { key: "爱好", label: "Hobbies", labelZh: "爱好", type: "tags" },
  { key: "喜欢", label: "Likes", labelZh: "喜欢", type: "tags" },
  { key: "不喜欢", label: "Dislikes", labelZh: "不喜欢", type: "tags" },
  { key: "优点", label: "Strengths", labelZh: "优点", type: "tags" },
  { key: "缺点", label: "Weaknesses", labelZh: "缺点", type: "tags" },
  {
    key: "人生格言",
    label: "Motto",
    labelZh: "人生格言",
    type: "textarea",
  },
  { key: "姓名", label: "Name", labelZh: "姓名", type: "text" },
  { key: "昵称", label: "Nickname", labelZh: "昵称", type: "text" },
  { key: "微信", label: "WeChat", labelZh: "微信", type: "text" },
  { key: "邮箱", label: "Email", labelZh: "邮箱", type: "text" },
  { key: "MBTI", label: "MBTI", labelZh: "MBTI", type: "text" },
];

const SELF_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "当前目标",
    label: "Current Goal",
    labelZh: "当前目标",
    type: "textarea",
  },
  {
    key: "当前状态",
    label: "Current State",
    labelZh: "当前状态",
    type: "textarea",
  },
  { key: "优势", label: "Strengths", labelZh: "优势", type: "tags" },
  { key: "短板", label: "Weaknesses", labelZh: "短板", type: "tags" },
  {
    key: "成长方向",
    label: "Growth Direction",
    labelZh: "成长方向",
    type: "textarea",
  },
  { key: "年龄", label: "Age", labelZh: "年龄", type: "text" },
  { key: "职业", label: "Occupation", labelZh: "职业", type: "text" },
  { key: "城市", label: "City", labelZh: "城市", type: "text" },
];

const GOAL_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "目标日期",
    label: "Target Date",
    labelZh: "目标日期",
    type: "date",
  },
  {
    key: "截止时间",
    label: "Deadline",
    labelZh: "截止时间",
    type: "date",
  },
  {
    key: "优先级",
    label: "Priority",
    labelZh: "优先级",
    type: "select",
    options: [
      { value: "low", label: "Low", labelZh: "低" },
      { value: "medium", label: "Medium", labelZh: "中" },
      { value: "high", label: "High", labelZh: "高" },
    ],
  },
  {
    key: "进度",
    label: "Progress",
    labelZh: "进度",
    type: "number",
  },
  {
    key: "状态",
    label: "Status",
    labelZh: "状态",
    type: "select",
    options: [
      { value: "not_started", label: "Not Started", labelZh: "未开始" },
      { value: "in_progress", label: "In Progress", labelZh: "进行中" },
      { value: "completed", label: "Completed", labelZh: "已完成" },
      { value: "paused", label: "Paused", labelZh: "已暂停" },
    ],
  },
];

const EVENT_SCHEMA: PropertyFieldSchema[] = [
  { key: "时间", label: "Date", labelZh: "时间", type: "date" },
  { key: "日期", label: "Date", labelZh: "日期", type: "date" },
  { key: "地点", label: "Location", labelZh: "地点", type: "text" },
  {
    key: "参与人",
    label: "Participants",
    labelZh: "参与人",
    type: "tags",
  },
  { key: "结果", label: "Outcome", labelZh: "结果", type: "textarea" },
];

const IDEA_SCHEMA: PropertyFieldSchema[] = [
  { key: "分类", label: "Category", labelZh: "分类", type: "text" },
  {
    key: "可执行性",
    label: "Feasibility",
    labelZh: "可执行性",
    type: "select",
    options: [
      { value: "low", label: "Low", labelZh: "低" },
      { value: "medium", label: "Medium", labelZh: "中" },
      { value: "high", label: "High", labelZh: "高" },
    ],
  },
  {
    key: "下一步行动",
    label: "Next Action",
    labelZh: "下一步行动",
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
  return schema.find(
    (field) =>
      field.key === label ||
      field.label.toLowerCase() === label.toLowerCase() ||
      field.labelZh === label
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
        properties[key] =
          parseSelectValue(value, schema?.options) ?? value;
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
  language: "zh" | "en"
): string {
  const schema = getFieldSchema(type, key);
  if (schema) {
    return language === "zh" ? schema.labelZh : schema.label;
  }
  return key;
}

export function getPropertyPlaceholder(
  type: LifeObjectType,
  key: string,
  language: "zh" | "en"
): string {
  const schema = getFieldSchema(type, key);
  if (language === "zh" && schema?.placeholderZh) return schema.placeholderZh;
  return schema?.placeholder ?? "";
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
  properties: ObjectProperties | undefined
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
    parts.push(`${key}：${formatPropertyValue(value)}`);
  }

  // If no priority keys have values, fall back to first few entries.
  if (parts.length === 0) {
    for (const [key, value] of Object.entries(properties).slice(0, 3)) {
      if (value === undefined || value === "" || value === null) continue;
      parts.push(`${key}：${formatPropertyValue(value)}`);
    }
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}
