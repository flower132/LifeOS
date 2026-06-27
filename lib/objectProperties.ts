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
  legacyLabels?: { zh?: string[]; en?: string[] };
}

const PERSON_SCHEMA: PropertyFieldSchema[] = [
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
    key: "height",
    label: { zh: "身高", en: "Height" },
    placeholder: { zh: "请输入身高", en: "Enter height" },
    type: "text",
  },
  {
    key: "weight",
    label: { zh: "体重", en: "Weight" },
    placeholder: { zh: "请输入体重", en: "Enter weight" },
    type: "text",
  },
  {
    key: "clothing_style",
    label: { zh: "穿衣风格", en: "Clothing Style" },
    placeholder: { zh: "请输入穿衣风格", en: "Enter clothing style" },
    type: "text",
  },
  {
    key: "personality",
    label: { zh: "性格", en: "Personality" },
    placeholder: { zh: "请输入性格描述", en: "Enter personality description" },
    type: "textarea",
  },
  {
    key: "emotional_traits",
    label: { zh: "情绪特点", en: "Emotional Traits" },
    placeholder: { zh: "请输入情绪特点", en: "Enter emotional traits" },
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
    key: "favorite_food",
    label: { zh: "爱吃", en: "Favorite Food" },
    placeholder: { zh: "请输入最爱吃的食物", en: "Enter favorite food" },
    type: "tags",
  },
  {
    key: "foods_to_avoid",
    label: { zh: "忌口", en: "Foods to Avoid" },
    placeholder: { zh: "请输入忌口食物", en: "Enter foods to avoid" },
    type: "tags",
  },
  {
    key: "date_met",
    label: { zh: "认识时间", en: "Date Met" },
    placeholder: { zh: "请选择认识时间", en: "Select date met" },
    type: "date",
  },
  {
    key: "relationship_level",
    label: { zh: "关系等级", en: "Relationship Level" },
    placeholder: { zh: "请输入关系等级", en: "Enter relationship level" },
    type: "text",
  },
  {
    key: "mutual_friends",
    label: { zh: "共同朋友", en: "Mutual Friends" },
    placeholder: { zh: "请输入共同朋友，用逗号分隔", en: "Enter mutual friends, separated by commas" },
    type: "tags",
  },
  {
    key: "important_events",
    label: { zh: "重要事件", en: "Important Events" },
    placeholder: { zh: "请输入重要事件", en: "Enter important events" },
    type: "textarea",
  },
  {
    key: "pet_peeves",
    label: { zh: "雷点", en: "Pet Peeves" },
    placeholder: { zh: "请输入雷点", en: "Enter pet peeves" },
    type: "textarea",
  },
  {
    key: "motto",
    label: { zh: "人生格言", en: "Motto" },
    placeholder: { zh: "请输入人生格言", en: "Enter motto" },
    type: "textarea",
  },
];

const SELF_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "career",
    label: { zh: "职业", en: "Career" },
    placeholder: { zh: "请输入职业", en: "Enter career" },
    type: "text",
  },
  {
    key: "income",
    label: { zh: "收入", en: "Income" },
    placeholder: { zh: "请输入收入", en: "Enter income" },
    type: "text",
  },
  {
    key: "city",
    label: { zh: "城市", en: "City" },
    placeholder: { zh: "请输入城市", en: "Enter city" },
    type: "text",
  },
  {
    key: "mbti",
    label: { zh: "MBTI", en: "MBTI" },
    placeholder: { zh: "请输入 MBTI", en: "Enter MBTI" },
    type: "text",
  },
  {
    key: "long_term_goals",
    label: { zh: "长期目标", en: "Long-term Goals" },
    placeholder: { zh: "请输入长期目标", en: "Enter long-term goals" },
    type: "textarea",
  },
  {
    key: "short_term_goals",
    label: { zh: "短期目标", en: "Short-term Goals" },
    placeholder: { zh: "请输入短期目标", en: "Enter short-term goals" },
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
    label: { zh: "弱项", en: "Weaknesses" },
    placeholder: { zh: "请输入弱项", en: "Enter weaknesses" },
    type: "tags",
    legacyLabels: { zh: ["短板"] },
  },
  {
    key: "values",
    label: { zh: "价值观", en: "Values" },
    placeholder: { zh: "请输入价值观", en: "Enter values" },
    type: "textarea",
  },
  {
    key: "current_state",
    label: { zh: "当前状态", en: "Current State" },
    placeholder: { zh: "请输入当前状态", en: "Enter current state" },
    type: "textarea",
  },
  {
    key: "current_goal",
    label: { zh: "当前目标", en: "Current Goal" },
    placeholder: { zh: "请输入当前目标", en: "Enter current goal" },
    type: "textarea",
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
];

const GOAL_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "goal_name",
    label: { zh: "目标名称", en: "Goal Name" },
    placeholder: { zh: "请输入目标名称", en: "Enter goal name" },
    type: "text",
  },
  {
    key: "goal_type",
    label: { zh: "目标类型", en: "Goal Type" },
    placeholder: { zh: "请输入目标类型", en: "Enter goal type" },
    type: "text",
  },
  {
    key: "start_time",
    label: { zh: "开始时间", en: "Start Time" },
    placeholder: { zh: "请选择开始时间", en: "Select start time" },
    type: "date",
  },
  {
    key: "deadline",
    label: { zh: "截止时间", en: "Deadline" },
    placeholder: { zh: "请选择截止时间", en: "Select deadline" },
    type: "date",
  },
  {
    key: "target_date",
    label: { zh: "目标日期", en: "Target Date" },
    placeholder: { zh: "请选择目标日期", en: "Select target date" },
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
    key: "status",
    label: { zh: "当前状态", en: "Current Status" },
    placeholder: { zh: "请选择当前状态", en: "Select current status" },
    type: "select",
    legacyLabels: { zh: ["状态"] },
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
  {
    key: "success_criteria",
    label: { zh: "成功标准", en: "Success Criteria" },
    placeholder: { zh: "请输入成功标准", en: "Enter success criteria" },
    type: "textarea",
  },
  {
    key: "motivation",
    label: { zh: "动机", en: "Motivation" },
    placeholder: { zh: "请输入动机", en: "Enter motivation" },
    type: "textarea",
  },
  {
    key: "obstacles",
    label: { zh: "障碍", en: "Obstacles" },
    placeholder: { zh: "请输入障碍", en: "Enter obstacles" },
    type: "textarea",
  },
  {
    key: "next_action",
    label: { zh: "下一步行动", en: "Next Action" },
    placeholder: { zh: "请输入下一步行动", en: "Enter next action" },
    type: "textarea",
  },
  {
    key: "progress",
    label: { zh: "完成进度", en: "Completion Progress" },
    placeholder: { zh: "请输入完成进度", en: "Enter completion progress" },
    type: "number",
    legacyLabels: { zh: ["进度"] },
  },
];

const EVENT_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "event_name",
    label: { zh: "事件名称", en: "Event Name" },
    placeholder: { zh: "请输入事件名称", en: "Enter event name" },
    type: "text",
  },
  {
    key: "date",
    label: { zh: "发生时间", en: "Time" },
    placeholder: { zh: "请选择发生时间", en: "Select time" },
    type: "date",
    legacyLabels: { zh: ["时间"] },
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
    key: "process",
    label: { zh: "经过", en: "Process" },
    placeholder: { zh: "请输入经过", en: "Enter process" },
    type: "textarea",
  },
  {
    key: "outcome",
    label: { zh: "结果", en: "Outcome" },
    placeholder: { zh: "请输入结果", en: "Enter outcome" },
    type: "textarea",
  },
  {
    key: "reflection",
    label: { zh: "反思", en: "Reflection" },
    placeholder: { zh: "请输入反思", en: "Enter reflection" },
    type: "textarea",
  },
  {
    key: "impact",
    label: { zh: "影响", en: "Impact" },
    placeholder: { zh: "请输入影响", en: "Enter impact" },
    type: "textarea",
  },
  {
    key: "date_alt",
    label: { zh: "日期", en: "Date" },
    placeholder: { zh: "请选择日期", en: "Select date" },
    type: "date",
  },
];

const IDEA_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "idea_title",
    label: { zh: "想法标题", en: "Idea Title" },
    placeholder: { zh: "请输入想法标题", en: "Enter idea title" },
    type: "text",
  },
  {
    key: "source",
    label: { zh: "来源", en: "Source" },
    placeholder: { zh: "请输入来源", en: "Enter source" },
    type: "text",
  },
  {
    key: "inspiration_time",
    label: { zh: "灵感时间", en: "Inspiration Time" },
    placeholder: { zh: "请选择灵感时间", en: "Select inspiration time" },
    type: "date",
  },
  {
    key: "category",
    label: { zh: "分类", en: "Category" },
    placeholder: { zh: "请输入分类", en: "Enter category" },
    type: "text",
  },
  {
    key: "core_content",
    label: { zh: "核心内容", en: "Core Content" },
    placeholder: { zh: "请输入核心内容", en: "Enter core content" },
    type: "textarea",
  },
  {
    key: "value",
    label: { zh: "价值", en: "Value" },
    placeholder: { zh: "请输入价值", en: "Enter value" },
    type: "textarea",
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
    key: "risks",
    label: { zh: "风险", en: "Risks" },
    placeholder: { zh: "请输入风险", en: "Enter risks" },
    type: "textarea",
  },
  {
    key: "next_action",
    label: { zh: "下一步行动", en: "Next Action" },
    placeholder: { zh: "请输入下一步行动", en: "Enter next action" },
    type: "textarea",
  },
  {
    key: "next_validation",
    label: { zh: "下一步验证", en: "Next Validation" },
    placeholder: { zh: "请输入下一步验证", en: "Enter next validation" },
    type: "textarea",
  },
];

const PROJECT_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "project_name",
    label: { zh: "项目名称", en: "Project Name" },
    placeholder: { zh: "请输入项目名称", en: "Enter project name" },
    type: "text",
  },
  {
    key: "status",
    label: { zh: "当前状态", en: "Current Status" },
    placeholder: { zh: "请选择当前状态", en: "Select current status" },
    type: "select",
    options: [
      { value: "not_started", label: { zh: "未开始", en: "Not Started" } },
      { value: "in_progress", label: { zh: "进行中", en: "In Progress" } },
      { value: "completed", label: { zh: "已完成", en: "Completed" } },
      { value: "paused", label: { zh: "已暂停", en: "Paused" } },
    ],
  },
  {
    key: "start_date",
    label: { zh: "开始日期", en: "Start Date" },
    placeholder: { zh: "请选择开始日期", en: "Select start date" },
    type: "date",
  },
  {
    key: "target_date",
    label: { zh: "目标日期", en: "Target Date" },
    placeholder: { zh: "请选择目标日期", en: "Select target date" },
    type: "date",
  },
  {
    key: "stakeholders",
    label: { zh: "干系人", en: "Stakeholders" },
    placeholder: { zh: "请输入干系人，用逗号分隔", en: "Enter stakeholders, separated by commas" },
    type: "tags",
  },
  {
    key: "goals",
    label: { zh: "项目目标", en: "Project Goals" },
    placeholder: { zh: "请输入项目目标", en: "Enter project goals" },
    type: "textarea",
  },
  {
    key: "risks",
    label: { zh: "风险", en: "Risks" },
    placeholder: { zh: "请输入风险", en: "Enter risks" },
    type: "textarea",
  },
  {
    key: "next_action",
    label: { zh: "下一步行动", en: "Next Action" },
    placeholder: { zh: "请输入下一步行动", en: "Enter next action" },
    type: "textarea",
  },
];

const KNOWLEDGE_SCHEMA: PropertyFieldSchema[] = [
  {
    key: "topic",
    label: { zh: "主题", en: "Topic" },
    placeholder: { zh: "请输入主题", en: "Enter topic" },
    type: "text",
  },
  {
    key: "source",
    label: { zh: "来源", en: "Source" },
    placeholder: { zh: "请输入来源", en: "Enter source" },
    type: "text",
  },
  {
    key: "category",
    label: { zh: "分类", en: "Category" },
    placeholder: { zh: "请输入分类", en: "Enter category" },
    type: "text",
  },
  {
    key: "difficulty",
    label: { zh: "难度", en: "Difficulty" },
    placeholder: { zh: "请选择难度", en: "Select difficulty" },
    type: "select",
    options: [
      { value: "beginner", label: { zh: "入门", en: "Beginner" } },
      { value: "intermediate", label: { zh: "进阶", en: "Intermediate" } },
      { value: "advanced", label: { zh: "高级", en: "Advanced" } },
    ],
  },
  {
    key: "related_topics",
    label: { zh: "相关主题", en: "Related Topics" },
    placeholder: { zh: "请输入相关主题，用逗号分隔", en: "Enter related topics, separated by commas" },
    type: "tags",
  },
  {
    key: "key_points",
    label: { zh: "核心要点", en: "Key Points" },
    placeholder: { zh: "请输入核心要点", en: "Enter key points" },
    type: "textarea",
  },
  {
    key: "notes",
    label: { zh: "笔记", en: "Notes" },
    placeholder: { zh: "请输入笔记", en: "Enter notes" },
    type: "textarea",
  },
];

export const PROPERTY_SCHEMAS: Record<LifeObjectType, PropertyFieldSchema[]> = {
  person: PERSON_SCHEMA,
  self: SELF_SCHEMA,
  goal: GOAL_SCHEMA,
  event: EVENT_SCHEMA,
  idea: IDEA_SCHEMA,
  project: PROJECT_SCHEMA,
  knowledge: KNOWLEDGE_SCHEMA,
};

export function getDefaultProperties(): ObjectProperties {
  return {};
}

/**
 * Return a full set of empty properties for a given object type.
 * Used as a fallback when template parsing yields an empty object.
 */
export function getDefaultPropertiesForType(
  type: LifeObjectType
): ObjectProperties {
  const schema = PROPERTY_SCHEMAS[type];
  if (!schema) return {};

  return Object.fromEntries(schema.map((field) => [field.key, ""]));
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
    // Legacy labels for backward-compatible migration.
    if (field.legacyLabels?.zh) {
      for (const label of field.legacyLabels.zh) {
        map.set(label, field.key);
      }
    }
    if (field.legacyLabels?.en) {
      for (const label of field.legacyLabels.en) {
        map.set(label.toLowerCase(), field.key);
      }
    }
  }

  return map;
}

const LABEL_TO_KEY_MAPS: Record<LifeObjectType, Map<string, string>> = {
  person: buildLabelToKeyMap("person"),
  self: buildLabelToKeyMap("self"),
  goal: buildLabelToKeyMap("goal"),
  event: buildLabelToKeyMap("event"),
  idea: buildLabelToKeyMap("idea"),
  project: buildLabelToKeyMap("project"),
  knowledge: buildLabelToKeyMap("knowledge"),
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
