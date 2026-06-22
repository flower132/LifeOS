import { Language } from "@/lib/i18n";
import { Template } from "@/lib/types";

export const CURRENT_TEMPLATE_VERSION = 2;

function personTemplate(lang: Language): string {
  if (lang === "zh") {
    return `姓名：
昵称：
生日：
手机号：
微信：
邮箱：
MBTI：
身高：
体重：
穿衣风格：
性格：
情绪特点：
爱好：
喜欢：
不喜欢：
优点：
缺点：
爱吃：
忌口：
认识时间：
关系等级：
共同朋友：
重要事件：
雷点：
人生格言：`;
  }
  return `Name:
Nickname:
Birthday:
Phone:
WeChat:
Email:
MBTI:
Height:
Weight:
Clothing Style:
Personality:
Emotional Traits:
Hobbies:
Likes:
Dislikes:
Strengths:
Weaknesses:
Favorite Food:
Foods to Avoid:
Date Met:
Relationship Level:
Mutual Friends:
Important Events:
Pet Peeves:
Motto:`;
}

function selfTemplate(lang: Language): string {
  if (lang === "zh") {
    return `职业：
收入：
城市：
MBTI：
长期目标：
短期目标：
优势：
弱项：
价值观：
当前状态：`;
  }
  return `Career:
Income:
City:
MBTI:
Long-term Goals:
Short-term Goals:
Strengths:
Weaknesses:
Values:
Current State:`;
}

function goalTemplate(lang: Language): string {
  if (lang === "zh") {
    return `目标名称：
目标类型：
开始时间：
截止时间：
优先级：
当前状态：
成功标准：
动机：
障碍：
下一步行动：
完成进度：`;
  }
  return `Goal Name:
Goal Type:
Start Time:
Deadline:
Priority:
Current Status:
Success Criteria:
Motivation:
Obstacles:
Next Action:
Completion Progress:`;
}

function eventTemplate(lang: Language): string {
  if (lang === "zh") {
    return `事件名称：
发生时间：
地点：
参与人：
经过：
结果：
反思：
影响：`;
  }
  return `Event Name:
Time:
Location:
Participants:
Process:
Outcome:
Reflection:
Impact:`;
}

function ideaTemplate(lang: Language): string {
  if (lang === "zh") {
    return `想法标题：
来源：
灵感时间：
分类：
核心内容：
价值：
可执行性：
风险：
下一步验证：`;
  }
  return `Idea Title:
Source:
Inspiration Time:
Category:
Core Content:
Value:
Feasibility:
Risks:
Next Validation:`;
}

function taskTemplate(lang: Language): string {
  if (lang === "zh") {
    return `任务名称：
负责人：
优先级：
截止时间：
背景：
执行步骤：
当前状态：
风险：
完成标准：`;
  }
  return `Task Name:
Owner:
Priority:
Deadline:
Background:
Execution Steps:
Current Status:
Risks:
Completion Criteria:`;
}

export function getDefaultTemplates(
  lang: Language
): Omit<Template, "id" | "createdAt" | "updatedAt" | "usageCount">[] {
  return [
    {
      name: lang === "zh" ? "人物" : "Person",
      category: "person",
      isDefault: true,
      content: personTemplate(lang),
      templateVersion: CURRENT_TEMPLATE_VERSION,
    },
    {
      name: lang === "zh" ? "自我" : "Self",
      category: "self",
      isDefault: true,
      content: selfTemplate(lang),
      templateVersion: CURRENT_TEMPLATE_VERSION,
    },
    {
      name: lang === "zh" ? "目标" : "Goal",
      category: "goal",
      isDefault: true,
      content: goalTemplate(lang),
      templateVersion: CURRENT_TEMPLATE_VERSION,
    },
    {
      name: lang === "zh" ? "事件" : "Event",
      category: "event",
      isDefault: true,
      content: eventTemplate(lang),
      templateVersion: CURRENT_TEMPLATE_VERSION,
    },
    {
      name: lang === "zh" ? "想法" : "Idea",
      category: "idea",
      isDefault: true,
      content: ideaTemplate(lang),
      templateVersion: CURRENT_TEMPLATE_VERSION,
    },
    {
      name: lang === "zh" ? "任务" : "Task",
      category: "task",
      isDefault: true,
      content: taskTemplate(lang),
      templateVersion: CURRENT_TEMPLATE_VERSION,
    },
  ];
}

/** @deprecated Use getDefaultTemplates(language) instead. */
export const DEFAULT_TEMPLATES = getDefaultTemplates("zh");

/**
 * Convert legacy heading-only template content into parseable Label: Value lines.
 *
 * Old templates used Markdown headings like `# Goal Name` or standalone labels
 * like `Goal Name`. The current parser requires `Label: Value` lines. This
 * helper rewrites those legacy lines while preserving already-parseable lines.
 */
export function migrateLegacyTemplateContent(content: string): string {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const converted = lines
    .map((line) => {
      // Skip placeholder list markers like "-" or "1.".
      if (/^[-*\d.]+$/.test(line)) {
        return "";
      }

      // Heading -> Label:
      if (line.startsWith("#")) {
        const label = line.replace(/^#+\s*/, "").trim();
        return label ? `${label}:` : "";
      }

      // Already has a colon -> keep as-is.
      if (/^(.+?)[：:]\s*(.*)$/.test(line)) {
        return line;
      }

      // Standalone label -> Label:
      return `${line}:`;
    })
    .filter((line) => line.length > 0);

  return converted.join("\n");
}
