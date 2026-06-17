import { Template } from "@/lib/types";

export const DEFAULT_TEMPLATES: Omit<
  Template,
  "id" | "createdAt" | "updatedAt" | "usageCount"
>[] = [
  {
    name: "Person",
    category: "person",
    isDefault: true,
    content: `# 基础信息
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
MBTI：
优点：
缺点：
情绪特点：
# 兴趣爱好
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
-`,
  },
  {
    name: "Self",
    category: "self",
    isDefault: true,
    content: `# 基础信息
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
-`,
  },
  {
    name: "Goal",
    category: "goal",
    isDefault: true,
    content: `# 目标名称
# 为什么做
# 完成标准
# 截止时间
# 当前进度
# 阻碍因素
# 下一步行动
# AI建议`,
  },
  {
    name: "Event",
    category: "event",
    isDefault: true,
    content: `# 事件名称
时间：
地点：
参与人：
# 发生经过
# 结果
# 影响
# 后续行动
# AI总结`,
  },
  {
    name: "Idea",
    category: "idea",
    isDefault: true,
    content: `# 想法名称
# 灵感来源
# 核心观点
# 优势
# 风险
# 可执行性
# 下一步验证
# AI点评`,
  },
  {
    name: "Task",
    category: "task",
    isDefault: true,
    content: `# 任务名称
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
# 完成标准`,
  },
];
