# 《LifeOS UI Design System》V1.0

> **这份文档定义 LifeOS 的视觉设计系统。**
> 它定义颜色、字体、间距、组件样式、动画、暗色模式等所有视觉规范。
> 任何设计师和开发者都可以基于这份文档实现一致的 LifeOS 界面。

---

# Part 1｜设计原则

## 1.1 视觉使命

LifeOS 的视觉设计必须服务于一个目标：

> **让用户感到平静、被理解、被陪伴。**

所有视觉决策都围绕这个使命。

## 1.2 核心视觉原则

### 温暖 Warmth

- 使用柔和的色调，避免高饱和度
- 使用圆润的形状，避免尖锐边角
- 使用温暖的白色，避免冷白色

### 安静 Quietness

- 减少视觉噪音
- 不使用彩色标签
- 不使用复杂图表
- 不使用 KPI 和统计数字

### 呼吸 Breathing

- 大量留白
- 信息密度低
- 每屏只解决一个问题

### 叙事 Narrative

- 视觉层级像阅读故事
- 时间线感强
- 关系感通过 subtle 的方式表达

### 信任 Trust

- 一致性
- 可预测
- 不突然变化
- AI 的存在感极低

---

# Part 2｜颜色系统

## 2.1 主色调

### 品牌主色：柔和紫 Soft Violet

| Token | Light Mode | Dark Mode | 用途 |
|---|---|---|---|
| `--accent` | `#7C5CFF` | `#8F71FF` | 主按钮、链接、焦点、高亮 |
| `--accent-soft` | `#7C5CFF15` | `#8F71FF20` | 背景高亮、Focus 卡片背景 |
| `--accent-foreground` | `#FFFFFF` | `#FFFFFF` | 主色上的文字 |

**为什么选紫色？**

紫色在心理感受上代表：
- 智慧
- 温暖
- 宁静
- 灵性

它不带有蓝色的冷漠，也不带有红色的紧迫感。

## 2.2 中性色

### 背景色

| Token | Light Mode | Dark Mode | 用途 |
|---|---|---|---|
| `--background` | `#FAFAF8` | `#0F0F0F` | 页面背景 |
| `--surface` | `#FFFFFF` | `#1C1C1E` | 卡片、Sheet、弹窗背景 |
| `--surface-elevated` | `#FFFFFF` | `#2C2C2E` | 浮层、下拉菜单 |

### 文字色

| Token | Light Mode | Dark Mode | 用途 |
|---|---|---|---|
| `--text-primary` | `#1A1A1A` | `#F5F5F5` | 主标题、重要文字 |
| `--text-secondary` | `#6B6B6B` | `#A1A1A6` | 副标题、说明文字 |
| `--text-tertiary` | `#9CA3AF` | `#6B6B6B` | 时间、元信息 |
| `--text-inverse` | `#FFFFFF` | `#000000` | 深色背景上的文字 |

### 边框与分隔

| Token | Light Mode | Dark Mode | 用途 |
|---|---|---|---|
| `--border` | `#E8E8E6` | `#2C2C2E` | 卡片边框、分隔线 |
| `--border-subtle` | `#F0F0EE` | `#1C1C1E` | 极淡分隔 |
| `--divider` | `#E8E8E6` | `#2C2C2E` | 内容分隔线 |

### 状态色

| Token | Light Mode | Dark Mode | 用途 |
|---|---|---|---|
| `--success` | `#22C55E` | `#4ADE80` | 成功、完成 |
| `--warning` | `#F59E0B` | `#FBBF24` | 警告、提醒 |
| `--error` | `#EF4444` | `#F87171` | 错误、删除 |
| `--info` | `#3B82F6` | `#60A5FA` | 信息（极少使用） |

**状态色使用原则：**

- 状态色只用于少量场景
- 不使用状态色作为分类标签
- 成功不滥用绿色
- 错误使用柔和的红色背景，不是 bright red

---

## 2.3 Entity 类型色（极淡使用）

每个 Entity 类型有一个 subtle 的识别色，但**不用于标签或徽章**。

| Entity | Color | 用途 |
|---|---|---|
| Person | `#7C5CFF` | 头像背景、细线标识 |
| Goal | `#F59E0B` | 细线标识 |
| Project | `#3B82F6` | 细线标识 |
| Event | `#EC4899` | 细线标识 |
| Idea | `#10B981` | 细线标识 |
| Knowledge | `#06B6D4` | 细线标识 |
| Place | `#8B5CF6` | 细线标识 |
| Habit | `#22C55E` | 细线标识 |
| Decision | `#EF4444` | 细线标识 |
| Self | `#F97316` | 细线标识 |

**重要：** 这些颜色只用于：
- Entity 头像的 subtle 背景
- 时间线左侧的细线
- 小圆点标识

不用于：
- 彩色标签
- 徽章
- 分类卡片
- 背景色块

---

## 2.4 颜色使用规则

### DO

- 使用大量 `--background` 和 `--surface`
- 使用 `--text-secondary` 作为说明文字
- 使用 `--accent` 作为主要交互色
- 使用 `--accent-soft` 作为 Focus 卡片背景

### DON'T

- 不使用多种鲜艳颜色
- 不使用渐变背景（除了 subtle 的品牌色渐变）
- 不使用彩色文字作为标签
- 不使用高对比度的边框

---

# Part 3｜字体系统

## 3.1 字体选择

### 系统字体优先

LifeOS 不使用自定义字体加载，优先使用系统字体：

```
font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**原因：**
- 加载快
- 原生感强
- 在不同平台都自然

### 等宽字体（仅用于日志/代码，LifeOS 不使用）

LifeOS 不使用等宽字体作为主要字体。

## 3.2 字号层级

| 层级 | 大小 | 字重 | 行高 | 用途 |
|---|---|---|---|---|
| Display | 32px | 600 | 1.2 | 大欢迎标题 |
| H1 | 28px | 600 | 1.25 | 页面标题（如 Entity Name） |
| H2 | 22px | 600 | 1.3 | 区域标题 |
| H3 | 18px | 600 | 1.35 | 卡片标题 |
| Body Large | 17px | 400 | 1.5 | 重要正文 |
| Body | 15px | 400 | 1.55 | 默认正文 |
| Body Small | 13px | 400 | 1.5 | 辅助说明 |
| Caption | 12px | 500 | 1.4 | 标签、时间 |
| Button | 15px | 500 | 1 | 按钮文字 |

## 3.3 字重使用

| 字重 | 用途 |
|---|---|
| 400 (Regular) | 正文、说明 |
| 500 (Medium) | 按钮、标签、小标题 |
| 600 (Semibold) | 标题、重要文字 |
| 700 (Bold) | 极少使用，仅用于 Display |

**原则：** 不使用超过 3 种字重。

## 3.4 行高与段间距

- 标题行高：1.2 - 1.35
- 正文行高：1.5 - 1.6
- 段落间距：0.75em - 1em
- 列表项间距：0.5em

## 3.5 文字颜色层级

| 内容 | 颜色 Token |
|---|---|
| 主标题 | `--text-primary` |
| 正文 | `--text-primary` |
| 副标题/说明 | `--text-secondary` |
| 时间/元信息 | `--text-tertiary` |
| 链接 | `--accent` |
| 禁用文字 | `--text-tertiary` |

---

# Part 4｜间距系统

## 4.1 基础单位

基础单位为 **4px**。

| Token | 值 | 用途 |
|---|---|---|
| `--space-1` | 4px | 极小区隔 |
| `--space-2` | 8px | 元素内小间距 |
| `--space-3` | 12px | 标准元素间距 |
| `--space-4` | 16px | 卡片内边距 |
| `--space-5` | 20px | 区块间距 |
| `--space-6` | 24px | 大区块间距 |
| `--space-8` | 32px | 页面级间距 |
| `--space-10` | 40px | 大页面间距 |
| `--space-12` | 48px | 超大间距 |

## 4.2 页面间距

### 水平边距

- iPhone：16px (`--space-4`)
- iPad：24px (`--space-6`)
- Desktop：32px (`--space-8`)

### 垂直间距

- 页面顶部到第一个内容：24px
- 区块之间：24px - 32px
- 卡片内部：16px
- 元素之间：12px 或 16px

## 4.3 卡片间距

- 卡片内边距：16px
- 卡片之间：12px（紧凑）或 16px（默认）
- 卡片圆角：16px

## 4.4 组件间距

### 按钮

- 按钮内边距：horizontal 16px，vertical 12px
- 按钮之间：8px 或 12px

### 输入框

- 输入框内边距：12px 16px
- 输入框之间：16px

### 列表

- 列表项之间：12px
- 列表项内边距：16px

---

# Part 5｜圆角与阴影

## 5.1 圆角系统

| Token | 值 | 用途 |
|---|---|---|
| `--radius-sm` | 8px | 小按钮、输入框、chips |
| `--radius-md` | 12px | 中按钮、小卡片 |
| `--radius-lg` | 16px | 卡片、面板 |
| `--radius-xl` | 20px | 大卡片、Focus 卡片 |
| `--radius-2xl` | 24px | Capture Sheet、大浮层 |
| `--radius-full` | 9999px | 头像、 pills |

### 圆角使用规则

- 卡片：16px
- 按钮：12px
- 输入框：12px
- Focus 卡片：20px
- Capture Sheet 顶部：24px
- 头像：完全圆形

## 5.2 阴影系统

LifeOS 的阴影非常 subtle。

| Token | 值 | 用途 |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | 小元素 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.06)` | 卡片 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.08)` | Sheet、浮层 |
| `--shadow-focus` | `0 0 0 3px rgba(124,92,255,0.15)` | 焦点环 |

### 阴影使用规则

- 大部分卡片使用 `--shadow-sm` 或 `--shadow-md`
- Capture Sheet 使用 `--shadow-lg`
- 不使用深色大阴影
- 暗色模式下阴影减弱或取消

---

# Part 6｜图标系统

## 6.1 图标风格

- 线性图标（outline style）
- 2px 描边
- 24x24px 默认尺寸
- 圆角端点

## 6.2 图标尺寸

| 尺寸 | 用途 |
|---|---|
| 16px | 内联小图标、按钮内图标 |
| 20px | 导航图标、小按钮 |
| 24px | 默认图标 |
| 32px | 大操作图标 |

## 6.3 图标库

使用 Lucide Icons 或类似风格图标。

### 核心图标

| 图标 | 用途 |
|---|---|
| Home | 首页 |
| Users / Sparkles | Spaces |
| Plus Circle | Capture |
| User | Self |
| Settings | 设置 |
| Search | 搜索 |
| Mic | 语音输入 |
| Camera | 图片 |
| Link | 链接 |
| StickyNote | Memory |
| ArrowLeft | 返回 |
| X | 关闭 |
| Check | 完成 |
| Clock | 稍后 |
| ChevronDown / Up | 展开/折叠 |
| Trash2 | 删除 |
| Undo2 | 撤销 |
| MoreHorizontal | 更多 |

### 图标颜色

- 默认：`--text-secondary`
- 选中：`--accent`
- 禁用：`--text-tertiary`

---

# Part 7｜按钮系统

## 7.1 按钮类型

### Primary Button

```
┌─────────────────────┐
│  Save Memory        │
└─────────────────────┘
```

- 背景：`--accent`
- 文字：`--accent-foreground`
- 圆角：12px
- 内边距：12px 16px
- 字重：500
- 按下：背景变暗 10%
- 禁用：透明度 50%

### Secondary Button

```
┌─────────────────────┐
│  Later              │
└─────────────────────┘
```

- 背景：`--surface`
- 边框：1px solid `--border`
- 文字：`--text-primary`
- 圆角：12px
- 内边距：12px 16px
- 按下：背景 `--background`

### Text Button

```
Why now?
```

- 背景：透明
- 文字：`--text-secondary`
- 按下：文字 `--text-primary`

### Ghost Button

```
┌─────┐
│ ✕   │
└─────┘
```

- 背景：透明
- 图标：`--text-secondary`
- 圆角：8px
- 按下：背景 `--surface`

## 7.2 按钮状态

| 状态 | 视觉 |
|---|---|
| Default | 正常显示 |
| Hover | 轻微变暗或背景变化 |
| Pressed | 缩放至 0.96 |
| Disabled | 透明度 50%，不可点击 |
| Loading | 按钮文字替换为"Loading..."，禁用点击 |

## 7.3 按钮组合

### Focus 操作按钮

```
[Done] [Later] [Skip]
```

- Done：Primary
- Later：Secondary
- Skip：Text Button 或 Secondary

### Capture 底部按钮

```
[Cancel]        [Save Memory]
```

- Cancel：Text Button
- Save Memory：Primary

---

# Part 8｜输入框系统

## 8.1 Text Input

```
┌─────────────────────┐
│ Capture a moment... │
└─────────────────────┘
```

- 背景：`--surface`
- 边框：1px solid `--border`
- 圆角：12px
- 内边距：12px 16px
- 文字：`--text-primary`
- 占位符：`--text-tertiary`
- Focus：边框 `--accent`，shadow `--shadow-focus`

## 8.2 Text Area

```
┌─────────────────────┐
│                     │
│  （多行输入区）      │
│                     │
└─────────────────────┘
```

- 同 Text Input
- 最小高度：120px
- 最大高度：动态，最多 8 行后滚动
- resize：none

## 8.3 Search Input

```
┌─────────────────────┐
│ 🔍 Search...        │
└─────────────────────┘
```

- 背景：`--surface`
- 无边框或 1px `--border`
- 圆角：12px 或完全圆形
- 左侧搜索图标

---

# Part 9｜卡片系统

## 9.1 标准卡片

```
┌─────────────────────┐
│                     │
│  卡片内容            │
│                     │
└─────────────────────┘
```

- 背景：`--surface`
- 边框：1px solid `--border`（可选）
- 圆角：16px
- 内边距：16px
- 阴影：`--shadow-sm` 或 `--shadow-md`

## 9.2 Focus 卡片

```
┌─────────────────────┐
│                     │
│  TODAY              │
│                     │
│  Alice              │
│  45 天没有联系了    │
│                     │
└─────────────────────┘
```

- 背景：`--surface` 或 `--accent-soft`
- 圆角：20px
- 内边距：20px
- 阴影：`--shadow-md`

## 9.3 Memory Card

```
┌─────────────────────┐
│ 今天和 Alice 聊了   │
│ LifeOS。            │
│                     │
│ Alice · 2h ago      │
└─────────────────────┘
```

- 背景：`--surface`
- 圆角：16px
- 内边距：16px
- 无阴影或 `--shadow-sm`
- 按下：背景变暗 3%

## 9.4 Action Card

```
┌─────────────────────┐
│ 发消息给 Alice      │
└─────────────────────┘
```

- 背景：`--surface`
- 边框：1px solid `--border`
- 圆角：12px
- 内边距：12px 16px
- 文字：`--text-primary`
- 按下：背景 `--background`

---

# Part 10｜导航样式

## 10.1 底部导航

```
┌─────────────────────┐
│ 🏠  🌌  ➕  👤      │
└─────────────────────┘
```

- 背景：`--surface`
- 顶部边框：1px solid `--border`
- 高度：64px（含安全区域）
- 图标 + 标签
- 选中：图标 `--accent`，文字 `--accent`
- 未选中：图标 `--text-secondary`，文字 `--text-secondary`

### Capture 中心按钮

- 比其他按钮稍大
- 背景：`--accent`
- 图标：白色
- 圆形或圆角方形
- 有 subtle 的阴影

## 10.2 顶部导航

### Home 顶部

```
┌─────────────────────┐
│ ⚙️                  │
│                     │
│ Good morning,       │
│ Alex                │
└─────────────────────┘
```

- 背景：`--background`
- 无底部边框
- Settings 图标在右上角

### Workspace 顶部

```
┌─────────────────────┐
│  ← Alice            │
│  Person · 上次联系  │
│  5 天前             │
└─────────────────────┘
```

- 背景：`--background`
- 返回按钮在左上角
- Entity Name 大标题
- Status 小字

## 10.3 Search 触发

- 顶部下拉：从 Home/Spaces/Self 顶部下拉出现 Search Overlay
- 长按底部导航：任意导航按钮长按 0.5s 调出 Search

---

# Part 11｜组件样式详细规范

## 11.1 Today's Focus Card

### 结构

```
┌─────────────────────┐
│ TODAY               │
│                     │
│ Alice            [●]│  ← Entity 小圆点标识
│ Person              │
│                     │
│ 45 天没有联系了。   │
│ 她最近工作压力很大。│
│                     │
│ ┌─────────────────┐ │
│ │ 发一句轻松的    │ │
│ │ 关心吧          │ │
│ └─────────────────┘ │
│                     │
│ [Done] [Later]      │
│ [Skip]              │
│                     │
│ Why now?            │
└─────────────────────┘
```

### 样式

- 外层卡片：
  - 背景：`--surface` 或 `--accent-soft`
  - 圆角：20px
  - 内边距：20px
  - 阴影：`--shadow-md`

- "TODAY" 标签：
  - 字号：12px
  - 字重：500
  - 颜色：`--text-tertiary`
  - 大写，tracking wide

- Entity Name：
  - 字号：22px
  - 字重：600
  - 颜色：`--text-primary`

- Entity Type：
  - 字号：13px
  - 颜色：`--text-secondary`

- Context 文本：
  - 字号：17px
  - 颜色：`--text-primary`
  - 行高：1.4

- Suggested Action：
  - 背景：`--accent-soft`
  - 圆角：12px
  - 内边距：12px 16px
  - 文字：`--text-primary`
  - 字号：15px

- 操作按钮：
  - Done：Primary
  - Later：Secondary
  - Skip：Text

## 11.2 Memory Card

### 结构

```
┌─────────────────────┐
│ 今天和 Alice 聊了   │
│ LifeOS。            │
│                     │
│ Alice · 2h ago      │
│ [emotion]           │
└─────────────────────┘
```

### 样式

- 背景：`--surface`
- 圆角：16px
- 内边距：16px
- 阴影：无或 `--shadow-sm`

- 内容文本：
  - 字号：15px
  - 颜色：`--text-primary`
  - 最多 2 行

- 元信息：
  - 字号：12px
  - 颜色：`--text-tertiary`

- Meaning Tag：
  - 字号：11px
  - 颜色：`--text-tertiary`
  - 背景：transparent
  - 边框：无
  - 前面有小圆点或 subtle 前缀

## 11.3 Workspace Header

### 结构

```
┌─────────────────────┐
│  ← Alice            │
│                     │
│  Alice              │
│  Person · 上次联系  │
│  5 天前             │
└─────────────────────┘
```

### 样式

- 背景：`--background`
- 内边距：16px
- 底部边框：无（使用留白分隔）

- 返回按钮：
  - 图标：ArrowLeft
  - 颜色：`--text-secondary`
  - 尺寸：24px

- Entity Name：
  - 字号：28px
  - 字重：600
  - 颜色：`--text-primary`

- Status：
  - 字号：14px
  - 颜色：`--text-secondary`

## 11.4 Understanding Card

### 结构

```
┌─────────────────────┐
│ UNDERSTANDING       │
│                     │
│ Alice 是你最近讨论  │
│ LifeOS 最多的人。   │
│ 她似乎正在经历职    │
│ 业焦虑期。          │
│                     │
│ Tell me more        │
└─────────────────────┘
```

### 样式

- 背景：`--surface`
- 圆角：16px
- 内边距：16px

- 标题：
  - 字号：12px
  - 字重：500
  - 颜色：`--text-tertiary`
  - 大写，tracking wide

- 内容：
  - 字号：15px
  - 颜色：`--text-primary`
  - 行高：1.55

- "Tell me more"：
  - 字号：13px
  - 颜色：`--accent`

## 11.5 Connection Chip

### 结构

```
┌──────────┐
│ LifeOS   │
│ Project  │
└──────────┘
```

### 样式

- 背景：`--surface`
- 边框：1px solid `--border`
- 圆角：12px
- 内边距：8px 12px

- Name：
  - 字号：14px
  - 颜色：`--text-primary`

- Type：
  - 字号：11px
  - 颜色：`--text-tertiary`

## 11.6 Action Card

### 结构

```
┌─────────────────────┐
│ 发消息给 Alice      │
└─────────────────────┘
```

### 样式

- 背景：`--surface`
- 边框：1px solid `--border`
- 圆角：12px
- 内边距：12px 16px

- 文字：
  - 字号：15px
  - 颜色：`--text-primary`
  - 字重：500

- 按下：
  - 背景：`--background`

## 11.7 Reflection Block

### 结构

```
┌─────────────────────┐
│ REFLECTION          │
│                     │
│ "关于 Alice，你现   │
│  在怎么想？"        │
│                     │
│ [Write a Reflection]│
└─────────────────────┘
```

### 样式

- 背景：`--surface`
- 圆角：16px
- 内边距：16px

- 标题：
  - 字号：12px
  - 颜色：`--text-tertiary`

- 问题：
  - 字号：17px
  - 颜色：`--text-primary`
  - 斜体或引号样式

- 按钮：
  - Secondary 样式

## 11.8 Capture Sheet

### 结构

```
┌─────────────────────┐
│  ────────────────   │
│                     │
│  Capture a moment   │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │  输入区       │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  🎤  📷  🔗  🎙️     │
│                     │
│  Related to:        │
│  [Alice ✕] [LifeOS  │
│   ✕] [+ Add]        │
│                     │
│  [Cancel]  [Save    │
│            Memory]  │
└─────────────────────┘
```

### 样式

- 背景：`--surface`
- 顶部圆角：24px
- 阴影：`--shadow-lg`
- 高度：屏幕 85%

- 拖动条：
  - 宽度：40px
  - 高度：4px
  - 颜色：`--border`
  - 圆角：2px

- 标题：
  - 字号：17px
  - 颜色：`--text-secondary`

- 输入区：
  - 背景：`--background`
  - 圆角：16px
  - 最小高度：160px

- 附件图标：
  - 尺寸：24px
  - 颜色：`--text-secondary`
  - 间距：16px

- Entity chips：
  - 背景：`--accent-soft`
  - 文字：`--accent` 或 `--text-primary`

## 11.9 Search Overlay

### 结构

```
┌─────────────────────┐
│                     │
│  ┌───────────────┐  │
│  │ 🔍 Search...  │  │
│  └───────────────┘  │
│                     │
├─────────────────────┤
│ RECENT              │
│ Alice               │
│ LifeOS              │
│ 跑步计划            │
│                     │
├─────────────────────┤
│ SUGGESTIONS         │
│ "最近和 Alice      │
│  聊了什么？"        │
│                     │
└─────────────────────┘
```

### 样式

- 背景：`--surface`
- 顶部圆角：20px
- 阴影：`--shadow-lg`

- 搜索框：
  - 背景：`--background`
  - 圆角：12px
  - 内边距：12px 16px

- 分组标题：
  - 字号：12px
  - 颜色：`--text-tertiary`
  - 大写

- 结果项：
  - 内边距：12px 16px
  - 按下：背景 `--background`

---

# Part 12｜暗色模式

## 12.1 暗色模式原则

- 不是简单反色
- 使用真正的深色（接近黑色）
- 卡片使用略亮的表面色
- 主色更亮以保持可访问性
- 阴影减弱或取消

## 12.2 暗色模式关键色

| Token | 值 |
|---|---|
| `--background` | `#0F0F0F` |
| `--surface` | `#1C1C1E` |
| `--surface-elevated` | `#2C2C2E` |
| `--text-primary` | `#F5F5F5` |
| `--text-secondary` | `#A1A1A6` |
| `--text-tertiary` | `#6B6B6B` |
| `--border` | `#2C2C2E` |
| `--accent` | `#8F71FF` |
| `--accent-soft` | `#8F71FF20` |

## 12.3 暗色模式组件变化

- 卡片阴影取消，改用 border 区分
- 输入框背景：`--surface`
- Focus 卡片背景：`--surface` 或 `--accent-soft`
- 图片添加轻微暗角

---

# Part 13｜动画与过渡

## 13.1 动画原则

- subtle
- 自然
- 不打扰
- 有目的

## 13.2 时长规范

| 场景 | 时长 | 缓动 |
|---|---|---|
| 按钮按下 | 100ms | ease-out |
| 卡片出现 | 300ms | ease-out |
| Sheet 升起 | 250ms | ease-out |
| 页面切换 | 250ms | ease-in-out |
| 内容淡入 | 300ms | ease-out |
| Focus 切换 | 400ms | ease-out |
| 展开/折叠 | 300ms | ease-out |

## 13.3 允许的动画

- 淡入
- 轻微上移
- 缩放 0.96（按钮按下）
- Sheet 从底部升起
- 页面滑动过渡

## 13.4 禁止的动画

- 弹跳
- 旋转
- 闪烁
- 复杂庆祝动画
- 长时间过渡（> 500ms）
- 循环动画（除非用户明确触发）

## 13.5 焦点环

- 颜色：`--accent` 15% 透明度
- 宽度：3px
- 圆角：匹配元素圆角
- 用于键盘导航和可聚焦元素

---

# Part 14｜无障碍

## 14.1 对比度

- 正文与背景对比度至少 4.5:1
- 大文字与背景对比度至少 3:1
- 主按钮对比度至少 4.5:1

## 14.2 触摸目标

- 最小触摸目标：44x44px
- 按钮实际尺寸不小于 40px
- 底部导航图标触摸区域：64px 高度

## 14.3 文字尺寸

- 默认正文 15px
- 支持系统字体大小调整
- 最大支持 200% 字体缩放

## 14.4 屏幕阅读器

- 所有图标都有 aria-label
- 按钮有明确的描述
- 页面标题清晰
- Focus 状态可见

## 14.5 动态效果

- 支持 `prefers-reduced-motion`
- 用户关闭动画时，所有过渡变为即时

---

# Part 15｜示例页面配色

## 15.1 Home 页面（Light）

```
背景：#FAFAF8
文字：#1A1A1A
次要文字：#6B6B6B
Focus 卡片背景：#FFFFFF
Focus 卡片阴影：0 4px 12px rgba(0,0,0,0.06)
Suggested Action 背景：rgba(124,92,255,0.08)
按钮：#7C5CFF
```

## 15.2 Home 页面（Dark）

```
背景：#0F0F0F
文字：#F5F5F5
次要文字：#A1A1A6
Focus 卡片背景：#1C1C1E
Focus 卡片边框：#2C2C2E
Suggested Action 背景：rgba(143,113,255,0.12)
按钮：#8F71FF
```

## 15.3 Capture Sheet（Light）

```
Sheet 背景：#FFFFFF
Sheet 顶部圆角：24px
Sheet 阴影：0 8px 24px rgba(0,0,0,0.08)
输入区背景：#FAFAF8
输入区圆角：16px
图标颜色：#6B6B6B
Save 按钮：#7C5CFF
```

## 15.4 Workspace（Dark）

```
背景：#0F0F0F
卡片背景：#1C1C1E
卡片边框：#2C2C2E
标题：#F5F5F5
正文：#F5F5F5
时间：#6B6B6B
链接/按钮：#8F71FF
```

---

# Part 16｜Design Tokens 汇总

## 16.1 颜色 Tokens

```
--background: #FAFAF8
--background-dark: #0F0F0F
--surface: #FFFFFF
--surface-dark: #1C1C1E
--surface-elevated: #FFFFFF
--surface-elevated-dark: #2C2C2E
--text-primary: #1A1A1A
--text-primary-dark: #F5F5F5
--text-secondary: #6B6B6B
--text-secondary-dark: #A1A1A6
--text-tertiary: #9CA3AF
--text-tertiary-dark: #6B6B6B
--text-inverse: #FFFFFF
--text-inverse-dark: #000000
--border: #E8E8E6
--border-dark: #2C2C2E
--border-subtle: #F0F0EE
--border-subtle-dark: #1C1C1E
--divider: #E8E8E6
--divider-dark: #2C2C2E
--accent: #7C5CFF
--accent-dark: #8F71FF
--accent-soft: rgba(124,92,255,0.08)
--accent-soft-dark: rgba(143,113,255,0.12)
--accent-foreground: #FFFFFF
--accent-foreground-dark: #FFFFFF
--success: #22C55E
--success-dark: #4ADE80
--warning: #F59E0B
--warning-dark: #FBBF24
--error: #EF4444
--error-dark: #F87171
--info: #3B82F6
--info-dark: #60A5FA
```

## 16.2 间距 Tokens

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
```

## 16.3 圆角 Tokens

```
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-2xl: 24px
--radius-full: 9999px
```

## 16.4 阴影 Tokens

```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)
--shadow-md: 0 4px 12px rgba(0,0,0,0.06)
--shadow-lg: 0 8px 24px rgba(0,0,0,0.08)
--shadow-focus: 0 0 0 3px rgba(124,92,255,0.15)
```

## 16.5 字体 Tokens

```
--font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

--font-display: 32px / 600 / 1.2
--font-h1: 28px / 600 / 1.25
--font-h2: 22px / 600 / 1.3
--font-h3: 18px / 600 / 1.35
--font-body-large: 17px / 400 / 1.5
--font-body: 15px / 400 / 1.55
--font-body-small: 13px / 400 / 1.5
--font-caption: 12px / 500 / 1.4
--font-button: 15px / 500 / 1
```

## 16.6 动画 Tokens

```
--duration-fast: 100ms
--duration-normal: 250ms
--duration-slow: 400ms
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1)
```

---

# 结语

这份 UI Design System 定义了 LifeOS 的所有视觉规范。

它确保：
- 不同页面视觉一致
- 不同平台体验统一
- 暗色模式自然过渡
- 动画 subtle 不打扰
- 无障碍友好

设计师可以基于这些 tokens 和组件规范输出高保真设计稿，开发者可以实现一致的界面。

---

**文档版本：** V1.0  
**依据文档：** 《LifeOS Product Blueprint V1.0》、《LifeOS Wireframe V1.0》  
**状态：** UI Design System 定稿  
**下一步：** 高保真 UI Design、设计稿、开发实现
