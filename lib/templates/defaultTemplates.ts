import { Language } from "@/lib/i18n";
import { Template } from "@/lib/types";

function personTemplate(lang: Language): string {
  if (lang === "zh") {
    return `# 基础信息
姓名：
昵称：
生日：
手机号：
微信：
邮箱：
# 外貌特征
身高：
体重：
穿衣风格：
# 性格
性格：
MBTI：
优点：
缺点：
情绪特点：
# 兴趣爱好
爱好：
喜欢：
不喜欢：
# 饮食偏好
爱吃：
忌口：
# 人际关系
认识时间：
关系等级：
共同朋友：
# 人生经历
重要事件：
# 雷点
-
# 人生格言
-
# AI观察
-`;
  }
  return `# Basic Info
Name:
Nickname:
Birthday:
Phone:
WeChat:
Email:
# Appearance
Height:
Weight:
Clothing Style:
# Personality
Personality:
MBTI:
Strengths:
Weaknesses:
Emotional Traits:
# Interests
Hobbies:
Likes:
Dislikes:
# Dietary Preferences
Favorite Food:
Foods to Avoid:
# Relationships
Date Met:
Relationship Level:
Mutual Friends:
# Life Experiences
Important Events:
# Pet Peeves
-
# Motto
-
# AI Observations
-`;
}

function selfTemplate(lang: Language): string {
  if (lang === "zh") {
    return `# 基础信息
年龄：
职业：
城市：
# 当前阶段
我现在最关注什么：
# 长期目标
1.
2.
3.
# 当前困扰
-
# 核心优势
-
# 核心短板
-
# 财务
收入：
储蓄：
# 身体状态
运动：
睡眠：
# 学习成长
正在学习：
# AI观察
-`;
  }
  return `# Basic Info
Age:
Career:
City:
# Current Stage
What matters most to me right now:
# Long-term Goals
1.
2.
3.
# Current Concerns
-
# Core Strengths
-
# Core Weaknesses
-
# Finances
Income:
Savings:
# Physical State
Exercise:
Sleep:
# Learning & Growth
Currently Learning:
# AI Observations
-`;
}

function goalTemplate(lang: Language): string {
  if (lang === "zh") {
    return `# 目标名称
# 为什么做
# 完成标准
# 截止时间
# 当前进度
# 阻碍因素
# 下一步行动
# AI建议`;
  }
  return `# Goal Name
# Why
# Completion Criteria
# Deadline
# Current Progress
# Obstacles
# Next Action
# AI Suggestions`;
}

function eventTemplate(lang: Language): string {
  if (lang === "zh") {
    return `# 事件名称
时间：
地点：
参与人：
# 发生经过
# 结果
# 影响
# 后续行动
# AI总结`;
  }
  return `# Event Name
Date:
Location:
Participants:
# What Happened
# Outcome
# Impact
# Follow-up Actions
# AI Summary`;
}

function ideaTemplate(lang: Language): string {
  if (lang === "zh") {
    return `# 想法名称
# 灵感来源
# 核心观点
# 优势
# 风险
# 可执行性
# 下一步验证
# AI点评`;
  }
  return `# Idea Name
# Inspiration Source
# Core Insight
# Advantages
# Risks
# Feasibility
# Next Validation Step
# AI Feedback`;
}

function taskTemplate(lang: Language): string {
  if (lang === "zh") {
    return `# 任务名称
负责人：
优先级：
截止时间：
# 背景
# 执行步骤
1.
2.
3.
# 当前状态
# 风险
# 完成标准`;
  }
  return `# Task Name
Owner:
Priority:
Deadline:
# Background
# Execution Steps
1.
2.
3.
# Current Status
# Risks
# Completion Criteria`;
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
    },
    {
      name: lang === "zh" ? "自我" : "Self",
      category: "self",
      isDefault: true,
      content: selfTemplate(lang),
    },
    {
      name: lang === "zh" ? "目标" : "Goal",
      category: "goal",
      isDefault: true,
      content: goalTemplate(lang),
    },
    {
      name: lang === "zh" ? "事件" : "Event",
      category: "event",
      isDefault: true,
      content: eventTemplate(lang),
    },
    {
      name: lang === "zh" ? "想法" : "Idea",
      category: "idea",
      isDefault: true,
      content: ideaTemplate(lang),
    },
    {
      name: lang === "zh" ? "任务" : "Task",
      category: "task",
      isDefault: true,
      content: taskTemplate(lang),
    },
  ];
}

/** @deprecated Use getDefaultTemplates(language) instead. */
export const DEFAULT_TEMPLATES = getDefaultTemplates("zh");
