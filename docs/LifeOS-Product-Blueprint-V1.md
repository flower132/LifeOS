# 《LifeOS Product Blueprint V1.0》

> **这份 Blueprint 是 LifeOS 的完整产品架构文档。**
> 它不讨论视觉设计，不讨论代码实现，只定义产品应该如何被构建。
> 任何设计师、前端工程师、Flutter 工程师，都可以仅凭这份文档实现 LifeOS。

---

# 设计依据

本 Blueprint 严格基于以下两份文档：

1. **《LifeOS Product Interaction & UX Bible》**
2. **《LifeOS Experience Specification V1.0》**

所有设计决策都必须服从这两份文档中确立的原则：
- Memory First
- Capture before Organize
- One Focus at a Time
- Quiet Intelligence
- Narrative over Dashboard
- Growth over Productivity
- Workspace over Object List
- AI proposes, Human decides
- Less but Better
- Warm Understanding

如果本 Blueprint 中的任何设计与上述原则冲突，以 UX Bible 和 Experience Specification 为准。

---

# Part 1｜整体 Information Architecture（信息架构）

## 一级页面总览

LifeOS V1.0 包含 6 个一级页面/入口：

1. **Home**
2. **Capture**
3. **Spaces**
4. **Self**
5. **Search**
6. **Settings**

其中 Search 不是独立导航入口，而是全局能力。

### 页面关系图

```
                    Home
                     │
        ┌────────────┼────────────┐
        │            │            │
    Capture     Today's Focus   Recent Activity
        │            │            │
        └────────────┼────────────┘
                     │
                  Workspace
                     │
        ┌────────────┼────────────┐
        │            │            │
    Memory       Connections   Actions
                     │
                  Spaces
                     │
        ┌────────────┼────────────┐
        │            │            │
    Person       Goal          Project
    Idea         Knowledge     Decision
    Habit        Event         Place
                     │
                    Self
                     │
        ┌────────────┼────────────┐
        │            │            │
   Timeline      Patterns      Reflection
```

---

## 1.1 Home

### 为什么存在？

Home 是用户每天打开 LifeOS 的第一个页面。它承担"一天入口"的职责。

在 LifeOS 的信息架构中，Home 不是 Dashboard，不是汇总页，不是导航中枢。

Home 是一个**温柔的起点**。

### 它承担什么职责？

1. **展示 Today's Focus**
   - 每天只有一个 Focus
   - 让用户知道今天最值得 attention 的一件事

2. **提供 Capture 的快速入口**
   - 用户可以随时开始记录
   - 但入口不能抢夺 Focus 的焦点

3. **展示最近的 Memory Stream（极简）**
   - 不是完整的 Memory 列表
   - 只是让用户感到"LifeOS 在记录我的人生"

4. **建立每日使用的连续性**
   - 每天早上看到 Home，就像翻开日记本

### 为什么不能删除？

Home 是用户与 LifeOS 每天建立连接的锚点。

没有 Home，用户每天打开应用时会迷失。

没有 Home，Today's Focus 没有稳定的展示位置。

没有 Home，Capture 的快速入口会分散在其他页面中，破坏一致性。

### 页面跳转

| 从 Home 到 | 如何跳转 | 场景 |
|---|---|---|
| Capture | 点击底部 Capture 按钮 / 首页快速 Capture 条 | 用户想记录 |
| Workspace | 点击 Today's Focus 卡片 / 点击 Recent Activity 中的 Memory | 用户想深入了解 |
| Spaces | 点击底部 Spaces 入口 | 用户想浏览生活空间 |
| Self | 点击底部 Self 入口 | 用户想看自己 |
| Search | 从顶部下拉 | 用户想查找 |

---

## 1.2 Capture

### 为什么存在？

Capture 是 LifeOS 的心脏。

没有 Capture，就没有 Memory。

没有 Memory，就没有 Understanding。

没有 Understanding，就没有 Growth。

### 它承担什么职责？

1. **接收用户输入的原材料**
   - 文字、语音、图片、截图、分享内容

2. **让用户以最小成本记录**
   - 不分类、不标签、不标题
   - 直接表达

3. **触发 AI 理解流程**
   - 保存后，AI 在后台提取 Entity、Context、Meaning

4. **确认和修正**
   - 当 AI 不确定时，gently 询问用户

### 为什么不能删除？

Capture 是 Memory 的入口，是 LifeOS 一切价值的起点。

删除 Capture 等于删除 LifeOS 的灵魂。

### 页面跳转

| 从 Capture 到 | 如何跳转 | 场景 |
|---|---|---|
| Workspace | 保存后进入主要关联的 Workspace | 用户想查看记录的结果 |
| Home | 保存后关闭 Capture，回到 Home | 用户快速记录后离开 |
| Draft | 有未保存内容时关闭，提示保存草稿 | 用户临时中断 |

---

## 1.3 Spaces

### 为什么存在？

Spaces 是用户**主动探索自己人生**的入口。

Home 是被动接收 Focus。
Capture 是主动记录。
Spaces 是用户想查看"我有哪些人生空间"。

### 它承担什么职责？

1. **展示所有 Entity Workspace 的入口**
   - 不是列表，而是生活空间的概览

2. **让用户发现被遗忘的 Entity**
   - "哦，我还有一个项目很久没看了"

3. **提供非线性的浏览方式**
   - 用户可以从 Person 跳到 Goal，从 Goal 跳到 Project

4. **作为 Life Graph 的可视化入口（轻量）**
   - 不展示图，但展示关联

### 为什么不能删除？

没有 Spaces，用户无法主动访问自己的 Entity。

没有 Spaces，Workspace 之间失去导航连接。

没有 Spaces，Life Graph 的局部关系无法被用户发现。

### 页面跳转

| 从 Spaces 到 | 如何跳转 | 场景 |
|---|---|---|
| Workspace | 点击任意 Entity | 用户进入该 Entity 的生活空间 |
| Capture | 点击底部 Capture 按钮 | 用户想记录 |
| Home | 点击底部 Home | 用户回到今日起点 |
| Self | 点击底部 Self | 用户看自己 |

---

## 1.4 Workspace

### 为什么存在？

Workspace 是 LifeOS 最核心的页面类型。

每个 Entity 都有一个 Workspace。

Workspace 是用户理解一个 Entity、一段关系、一个目标、一个项目的地方。

### 它承担什么职责？

1. **讲述一个 Entity 的故事**
   - 通过 Memory Stream 展示时间线

2. **提供 AI 的理解**
   - Understanding 模块帮助用户看到模式

3. **展示关系网络**
   - Connections 模块显示这个 Entity 与人生的其他部分如何连接

4. **建议行动**
   - Actions 模块给出具体、可执行的下一步

5. **支持 Reflection**
   - 用户可以在这里写 Reflection

### 为什么不能删除？

没有 Workspace，Entity 只是数据库记录。

没有 Workspace，AI 的理解无处展示。

没有 Workspace，用户无法与自己的生活建立深度连接。

### Workspace 类型

V1.0 必须实现的 Workspace：

1. Person Workspace
2. Goal Workspace
3. Project Workspace
4. Place Workspace
5. Self Workspace

其他 Entity（Idea、Knowledge、Decision、Habit、Event）的 Workspace 可以在 V1.1 实现，但数据结构必须预留。

---

## 1.5 Self

### 为什么存在？

Self 是用户**理解自己的专属空间**。

它不是设置页，不是个人资料，不是 Dashboard。

Self 是人生主角的视角。

### 它承担什么职责？

1. **展示用户自己的人生叙事**
   - My Timeline

2. **展示 AI 发现的模式**
   - My Patterns

3. **支持深度 Reflection**
   - Reflection 入口

4. **连接所有 Entity**
   - 展示用户与 Person、Goal、Project 的关系

### 为什么不能删除？

没有 Self，LifeOS 变成"管理外部事物"的工具。

没有 Self，用户失去理解自己的入口。

没有 Self，AI 发现的模式无处安放。

---

## 1.6 Search

### 为什么存在？

Search 是用户**主动找回记忆**的能力。

随着 Memory 增加，用户需要快速找到过去的内容。

### 它承担什么职责？

1. **自然语言搜索**
   - "我最近和 Alice 聊了什么？"

2. **Entity 搜索**
   - 快速找到某个 Person、Goal、Project

3. **Memory 搜索**
   - 找到具体的经历

4. **发现隐藏关系**
   - "哪些 Memory 提到了 LifeOS？"

### 为什么不能删除？

没有 Search，用户会在大量 Memory 中迷失。

没有 Search，LifeOS 的可检索性大幅下降。

### Search 不是独立页面

Search 是全局能力，通过以下方式触发：
- 顶部下拉
- 长按底部导航
- 键盘快捷键

---

## 1.7 Settings

### 为什么存在？

Settings 是用户**管理基本偏好和数据**的地方。

### 它承担什么职责？

1. **语言、主题、主题色**
2. **通知偏好**
3. **隐私模式**
4. **数据导出 / 删除**
5. **关于 LifeOS**

### 为什么不能删除？

没有 Settings，用户无法管理基本偏好。

没有 Settings，数据导出和删除无法满足隐私合规。

### Settings 绝不能包含

- AI Provider 选择
- AI Debug / Logs
- 复杂的同步设置
- 模板管理
- 对象类型管理
- 字段配置

---

# Part 2｜Navigation Blueprint

## 2.1 导航设计哲学

LifeOS 的导航不是功能切换器。

LifeOS 的导航是**人生叙事的翻页器**。

用户在不同页面之间移动，应该感觉像在翻阅一本人生日记：
- 从 Home 翻开今天
- 到 Capture 写下一段
- 到 Spaces 浏览不同章节
- 到 Workspace 深入某段故事
- 到 Self 回看自己的人生

### 核心原则

1. **最少入口**：底部导航最多 4 个
2. **最少层级**：大多数页面只需 1-2 步可达
3. **自然返回**：返回时保留上下文
4. **Capture 永远可达**：1 秒内开始记录
5. **没有未读压力**：不使用红点、未读数

---

## 2.2 底部导航

### 导航项

```
┌─────────┬─────────┬─────────┬─────────┐
│  Home   │ Spaces  │ Capture │   Self  │
└─────────┴─────────┴─────────┴─────────┘
```

### 为什么这样设计？

| 入口 | 理由 |
|---|---|
| **Home** | 一天的起点，Today's Focus |
| **Spaces** | 浏览所有生活空间 |
| **Capture** | 中心位置，强调记录是核心 |
| **Self** | 理解自己的入口 |

### Capture 为什么在中心？

Capture 是 LifeOS 的心脏动作。

放在中心：
- 视觉最突出
- 点击最方便
- 强调"记录"是核心习惯

### 为什么没有 Search 在底部？

Search 是全局能力，不是独立目的地。

用户不需要"进入 Search 页面"，而是需要在任何页面快速搜索。

### 为什么没有 Settings 在底部？

Settings 不是日常使用页面。

它应该从 Self 或 Home 的右上角进入。

---

## 2.3 顶部导航

### Home 顶部

```
┌─────────────────────────────────────┐
│  [Settings]        LifeOS           │
│                                     │
│  Good morning, [Name]               │
│                                     │
│  [Today's Focus Card]               │
└─────────────────────────────────────┘
```

- 左上角或右上角：Settings 入口（齿轮图标，small）
- 顶部标题：不使用大标题，使用问候语

### Workspace 顶部

```
┌─────────────────────────────────────┐
│  ← Alice                            │
│                                     │
│  Person · 上次联系 5 天前           │
└─────────────────────────────────────┘
```

- 左侧：返回按钮
- 中间/下方：Entity Name 和状态
- 没有 Tab，没有复杂操作按钮

### Spaces 顶部

```
┌─────────────────────────────────────┐
│  Spaces                [Search]     │
│                                     │
│  People  Goals  Projects  Places    │
└─────────────────────────────────────┘
```

- 标题：Spaces
- 右上角：Search 入口
- 下方：类别筛选（不是 Tab，是 filter chips）

### Self 顶部

```
┌─────────────────────────────────────┐
│  [Settings]        Me               │
└─────────────────────────────────────┘
```

- 标题：Me（不是"Self"，更自然）
- Settings 入口

---

## 2.4 返回逻辑

### 从 Workspace 返回

- 手势：从左侧边缘向右滑动
- 按钮：左上角 ←
- 返回目标：
  - 如果从 Home 的 Focus 进入，返回到 Home
  - 如果从 Spaces 进入，返回到 Spaces
  - 如果从 Search 进入，返回到 Search
  - 如果从 Capture 保存后进入，返回到 Home

### 从 Capture 返回

- 手势：向下滑动
- 按钮：顶部横条或 X
- 行为：
  - 无内容时直接关闭
  - 有未保存内容时提示保存草稿

### 从 Search 返回

- 手势：向下滑动或点击空白处
- 按钮：取消
- 行为：返回到触发 Search 的页面

### 从 Settings 返回

- 手势：从左侧边缘向右滑动
- 按钮：左上角 ←
- 返回目标：调用 Settings 的页面（Home 或 Self）

---

## 2.5 Search 如何进入

### 入口

1. **顶部下拉**
   - 在 Home、Spaces、Self 页面，从顶部下拉进入 Search

2. **长按底部导航**
   - 长按任意底部导航按钮，快速调出 Search

3. **键盘快捷键**
   - 桌面端：Cmd/Ctrl + K

4. **Spaces 右上角 Search 图标**

### Search 界面

```
┌─────────────────────────────────────┐
│                                     │
│  Search...                          │
│                                     │
├─────────────────────────────────────┤
│  Recent                             │
│  Alice · LifeOS · 跑步计划          │
├─────────────────────────────────────┤
│  Results                            │
│                                     │
│  People                             │
│  Alice                              │
│                                     │
│  Goals                              │
│  成为产品人                         │
│                                     │
│  Memories                           │
│  "今天和 Alice 聊了 LifeOS"         │
│                                     │
└─────────────────────────────────────┘
```

### 为什么不是独立页面？

Search 应该像呼吸一样自然，不需要"进入一个页面"。

从顶部下拉符合移动端的自然手势。

---

## 2.6 Capture 如何呼出

### 入口

1. **底部导航中央按钮**
   - 最明显的入口
   - 点击后从底部升起 Capture Sheet

2. **Home 的快速 Capture 条**
   - 在 Today's Focus 下方有一个小输入条
   - 点击后直接展开 Capture

3. **长按屏幕任意位置**
   - 长按 0.5 秒后快速呼出 Capture
   - 用于紧急记录

4. **系统分享扩展**
   - 从其他 App 分享内容到 LifeOS
   - 自动打开 Capture 并预填充

5. **键盘快捷键**
   - 桌面端：Cmd/Ctrl + N

### Capture 打开方式

- 不是页面跳转
- 不是模态弹窗
- 是从底部升起的 Sheet
- 背景轻微变暗但不模糊

---

## 2.7 Workspace 如何切换

### 从 Workspace 到相关 Workspace

在 Workspace 的 Connections 模块中，点击任意相关 Entity，进入该 Entity 的 Workspace。

### 切换动画

- 不是左右切换
- 而是从当前 Workspace 平滑过渡到下一个 Workspace
- 像在同一本书中翻到下一章

### 返回栈

- 返回时按照用户进入顺序
- 不自动清理返回栈
- 用户可以快速在最近访问的 Workspace 之间切换

---

## 2.8 哪些页面可以连续浏览？

### 可以连续浏览的页面

1. **Workspace → Workspace**
   - 通过 Connections 连续跳转
   - 例如：Alice → LifeOS Project → 成为产品人 Goal

2. **Spaces → Workspace → Memory Detail**
   - 从 Spaces 进入 Workspace，再进入 Memory Detail

3. **Home → Workspace → Memory Detail**
   - 从 Focus 进入 Workspace，再进入 Memory Detail

4. **Search → Workspace → Workspace**
   - 搜索结果可以连续进入多个相关 Workspace

### 必须返回的页面

1. **Capture**
   - Capture 是临时层，完成后必须关闭
   - 不能从 Capture 连续浏览到其他页面

2. **Settings**
   - Settings 是配置页面，完成后返回

3. **Reflection 全屏模式**
   - 完成后返回 Workspace 或 Self

---

## 2.9 导航的"日记感"

LifeOS 的导航应该像翻阅一本精装日记：

- 打开封面（Home）
- 看到今天的一页（Today's Focus）
- 翻到某个章节（Spaces / Workspace）
- 在页边写下一句话（Capture）
- 合上时知道明天还会翻开（连续性）

导航不应该像切换 App 的功能模块。

导航不应该有机械感。

---

# Part 3｜Home Blueprint

## 3.1 页面结构

Home 从上到下分为四个区域：

```
┌─────────────────────────────────────┐
│  1. Header                          │
│     Settings + 问候语               │
├─────────────────────────────────────┤
│  2. Today's Focus                   │
│     今日焦点卡片                    │
├─────────────────────────────────────┤
│  3. Quick Capture                   │
│     快速记录条                      │
├─────────────────────────────────────┤
│  4. Recent Activity                 │
│     最近 3 条 Memory                │
└─────────────────────────────────────┘
```

---

## 3.2 Header 区域

### 位置

页面最顶部。

### 内容

```
┌─────────────────────────────────────┐
│  [Settings icon]                    │
│                                     │
│  Good morning, [Name]               │
│  Today is Thursday, July 2          │
└─────────────────────────────────────┘
```

### 为什么放在那里？

- Settings 是低频操作，放在角落不抢夺焦点
- 问候语建立情感连接
- 日期提供时间上下文

### 第一/二/三眼

- 第一眼：问候语
- 第二眼：日期
- 第三眼：Settings 图标

### 绝不能放进去的内容

- 搜索框（Search 通过下拉触发）
- 通知图标（不使用红点）
- 用户头像（Self 已经有入口）
- 同步状态
- 未读数量

---

## 3.3 Today's Focus 区域

### 位置

Header 下方，页面的视觉中心。

### 内容

```
┌─────────────────────────────────────┐
│                                     │
│  Today                              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Alice                      │    │
│  │                             │    │
│  │  45 天没有联系了。           │    │
│  │  她最近工作压力很大。         │    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 发一句轻松的关心吧。   │  │    │
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  │  [Done] [Later] [Skip]      │    │
│  │                             │    │
│  │  Why now?                   │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 为什么放在那里？

Today's Focus 是 Home 的核心。

它必须占据页面最重要的位置，因为：
- 用户每天早上打开 LifeOS 就是为了它
- 它回答"今天最值得我 attention 的是什么"
- 它是 LifeOS 主动帮助用户的方式

### 默认展开 / 折叠

- **默认展开**：Focus 主体、建议行动、三个操作按钮
- **默认折叠**：Why Now 详细解释
- 用户点击"Why now?"后展开详细解释

### 第一/二/三眼

- 第一眼：Entity Name（Alice）
- 第二眼：Context（45 天没有联系了）
- 第三眼：Suggested Action（发一句轻松的关心吧）

### 绝不能放进去的内容

- 多个 Focus
- 待办清单
- 进度条
- 效率指标
- "你还有 X 个 Focus"的提示
- 强制的通知 badge

---

## 3.4 Quick Capture 区域

### 位置

Today's Focus 下方。

### 内容

```
┌─────────────────────────────────────┐
│                                     │
│  Capture a moment...                │
│  ─────────────────────────────────  │
│                                     │
└─────────────────────────────────────┘
```

### 为什么放在那里？

- 在 Focus 之后，因为 Focus 是每天第一件事
- 但又非常醒目，因为 Capture 是核心习惯
- 用户看完 Focus 后，可以立刻记录相关 Memory

### 交互

- 点击 Quick Capture 条，展开完整 Capture Sheet
- 用户可以直接开始输入
- 不需要跳转页面

### 绝不能放进去的内容

- 分类选择
- 标签输入
- 标题字段
- 复杂格式工具

---

## 3.5 Recent Activity 区域

### 位置

Quick Capture 下方。

### 内容

```
┌─────────────────────────────────────┐
│  Recent                             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 今天和 Alice 聊了 LifeOS。   │    │
│  │ Alice · 2 小时前             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 决定参加明年的马拉松。       │    │
│  │ Decision · 昨天              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 读了《深度工作》，很受启发。 │    │
│  │ Knowledge · 3 天前           │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 为什么放在那里？

- 让用户感到 LifeOS 在持续记录
- 提供快速回顾的入口
- 不占据主导地位，因为 Focus 才是核心

### 数量限制

- 最多展示 3 条 Memory
- 不展示"View all"，因为 Memory 没有独立列表页
- 用户点击任意 Memory 进入 Memory Detail

### 绝不能放进去的内容

- 完整的 Memory 列表
- 搜索框
- 过滤器
- 排序选项
- 分页

---

## 3.6 Home 的空状态

### 第一次打开

```
┌─────────────────────────────────────┐
│                                     │
│  Welcome to LifeOS                  │
│                                     │
│  这里会帮助你记录、理解、成长。      │
│                                     │
│  从记录第一件小事开始。              │
│                                     │
│  [Capture a moment...]              │
│                                     │
└─────────────────────────────────────┘
```

### 没有 Today's Focus 时

```
┌─────────────────────────────────────┐
│                                     │
│  Good morning, [Name]               │
│                                     │
│  今天没有特别需要关注的事。          │
│  享受这一天吧。                      │
│                                     │
│  [Capture a moment...]              │
│                                     │
└─────────────────────────────────────┘
```

### 文案原则

- 温暖
- 邀请
- 不制造愧疚
- 不催促

---

# Part 4｜Capture Blueprint

## 4.1 Capture 打开方式

### 触发点

1. **底部导航中央 Capture 按钮**
   - 点击后从底部升起 Sheet
   - 是最常用的入口

2. **Home 的 Quick Capture 条**
   - 点击后直接展开为完整 Capture

3. **长按屏幕任意位置**
   - 长按 0.5 秒
   - 适合紧急记录

4. **系统分享扩展**
   - 从其他 App 分享内容到 LifeOS
   - 自动打开 Capture 并预填充

5. **键盘快捷键**
   - 桌面端：Cmd/Ctrl + N

### 打开动画

- 从底部平滑升起
- 高度占屏幕 70-85%
- 背景轻微变暗（alpha 0.3 左右）
- 不模糊背景
- 动画时长 250ms
- 缓动 ease-out
- 无弹跳

### 打开后的状态

- 输入框自动聚焦
- 键盘弹出
- 光标闪烁
- 底部显示语音、图片、链接入口

---

## 4.2 输入区布局

### 主输入区

```
┌─────────────────────────────────────┐
│                                     │
│  Capture a moment...                │
│                                     │
│  （大输入区，默认 4-6 行）           │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  [🎤] [📷] [🔗] [🎙️]               │
├─────────────────────────────────────┤
│  Related to:                        │
│  [Alice] [LifeOS] [+ Add]           │
├─────────────────────────────────────┤
│  [Cancel]        [Save Memory]      │
└─────────────────────────────────────┘
```

### 输入区设计原则

- **无标题字段**
- **无分类选择**
- **无标签输入**
- **无格式工具栏**
- 占位文案温柔且开放："Capture a moment..."
- 支持多行文本
- 支持 Markdown 但不提示用户
- 输入区随内容增长，最多 8 行，然后滚动

### 附件区域

附件入口位于输入区下方：

| 图标 | 功能 |
|---|---|
| 🎤 | 语音输入 |
| 📷 | 拍照 / 相册 |
| 🔗 | 添加链接 / 分享内容 |
| 🎙️ | 语音转文字 |

### Entity 建议区域

在输入过程中，AI 实时分析内容，并在下方建议相关 Entity：

```
Related to:
[Alice] [LifeOS] [+ Add]
```

- 用户输入"今天和 Alice 聊了 LifeOS"，AI 自动建议 Alice 和 LifeOS
- 用户可以点击确认或删除
- 如果建议错误，用户点击 X 移除
- 如果没有建议到新 Entity，显示"+ Add"让用户手动添加

---

## 4.3 什么时候绝不能打断输入？

1. **用户正在打字时**
   - AI 不弹窗
   - 不弹出确认
   - 不弹出分类建议

2. **用户正在语音输入时**
   - 不切换界面
   - 不显示其他提示

3. **用户情绪明显激动时**
   - 检测到强烈情绪词汇时，不主动建议 Entity
   - 只安静保存

4. **连续快速输入时**
   - 用户连续 Capture 多条时，不每条都确认
   - 批量处理

---

## 4.4 Capture 完成后进入哪里？

### 主要流程

保存后，进入**主要关联 Entity 的 Workspace**。

例如：
- 用户记录"今天和 Alice 聊了 LifeOS"
- 主要关联 Alice（因为是 Person）
- 进入 Alice 的 Workspace

### 次要流程

如果 Capture 没有明确的主要 Entity：
- 进入 Home
- 显示一个 subtle 的确认："已保存"

### 系统分享扩展

从其他 App 分享内容到 LifeOS：
- 打开 Capture
- 预填充分享内容
- 用户补充一句话说明
- 保存后进入主要关联 Workspace

---

## 4.5 Capture 的状态

### 空状态

```
┌─────────────────────────────────────┐
│                                     │
│  Capture a moment...                │
│                                     │
│  （光标闪烁）                        │
│                                     │
├─────────────────────────────────────┤
│  [🎤] [📷] [🔗] [🎙️]               │
└─────────────────────────────────────┘
```

- Save 按钮禁用
- 附件入口可用

### 输入状态

```
┌─────────────────────────────────────┐
│                                     │
│  今天和 Alice 聊了 LifeOS...        │
│                                     │
├─────────────────────────────────────┤
│  Related to: [Alice] [LifeOS]       │
├─────────────────────────────────────┤
│  [Cancel]        [Save Memory]      │
└─────────────────────────────────────┘
```

- Save 按钮启用
- Entity 建议出现
- 用户可以添加附件

### 保存状态

- Save 按钮变成"Saving..."
- 按钮轻微缩小
- 背景不变暗
- 不显示 loading 动画
- 300ms 内完成

### 失败状态

- 如果保存失败，Capture 不关闭
- 显示一行安静的错误："未能保存，请重试"
- 提供"重试"按钮
- 不弹窗

### 草稿状态

- 用户输入内容后关闭 Capture
- 提示："保存为草稿？"
- 选项：保存草稿 / 丢弃
- 草稿保存在本地
- 下次打开 Capture 时恢复

---

## 4.6 Capture 与 AI 的协作

### 实时 Entity 建议

- 用户输入时，AI 每 500ms 分析一次
- 建议以 chip 形式出现
- 不弹窗、不打断

### 保存后的 AI 流程

1. 提取 Entity
2. 提取 Meaning Tags
3. 生成 Context
4. 更新相关 Workspace
5. 可能影响 Today's Focus
6. 如果置信度低，gently 询问用户

### 用户确认的时机

- 创建新 Entity 时
- AI 对主要关联不确定时
- 检测到可能重要的新关系时
- 其他情况后台自动完成

---

# Part 5｜Workspace Blueprint

## 5.1 Workspace 通用结构

所有 Workspace 都遵循以下结构：

```
┌─────────────────────────────────────┐
│  1. Workspace Header                │
│     Name + Type + Status            │
├─────────────────────────────────────┤
│  2. Focus Block（如果有）            │
│     当前最需要关注的事               │
├─────────────────────────────────────┤
│  3. Memory Stream                   │
│     时间倒序的记忆流                 │
├─────────────────────────────────────┤
│  4. Understanding Block             │
│     AI 的温和理解                    │
├─────────────────────────────────────┤
│  5. Connections Block               │
│     相关的其他 Entity                │
├─────────────────────────────────────┤
│  6. Actions Block                   │
│     建议的下一步                     │
├─────────────────────────────────────┤
│  7. Reflection Entry                │
│     反思入口                         │
└─────────────────────────────────────┘
```

### 模块顺序原则

1. **Header**：让用户知道这是谁/什么
2. **Focus**：让用户知道现在最需要做什么
3. **Memory Stream**：让用户看到这个 Entity 的故事
4. **Understanding**：帮助用户理解
5. **Connections**：展示关系
6. **Actions**：提供下一步
7. **Reflection**：支持深度思考

### 渐进展开

- **第一层（默认可见）**：Header、Focus、Memory Stream 前 3 条
- **第二层（滚动后）**：Memory Stream 更多内容、Understanding
- **第三层（点击展开）**：Connections 详情、Actions 详情、Reflection

---

## 5.2 Person Workspace

### 页面结构

```
┌─────────────────────────────────────┐
│  Alice                              │
│  Person · 上次联系 5 天前           │
├─────────────────────────────────────┤
│  Focus                              │
│  "45 天没有联系了，发句关心吧？"     │
├─────────────────────────────────────┤
│  Memory Stream                      │
│  （最近 3 条 Memory）                │
├─────────────────────────────────────┤
│  Understanding                      │
│  "Alice 最近工作压力很大..."         │
├─────────────────────────────────────┤
│  Connections                        │
│  LifeOS · 上海 · 产品经理 Goal       │
├─────────────────────────────────────┤
│  Actions                            │
│  发消息 · 记录互动 · 设置生日提醒    │
├─────────────────────────────────────┤
│  Reflection                         │
│  "关于 Alice，你现在怎么想？"        │
└─────────────────────────────────────┘
```

### 固定模块

- Header（Name + Type + Status）
- Memory Stream
- Understanding
- Connections
- Actions

### 特有模块

- **Contact Rhythm**：联系频率的温和提示
- **Important Dates**：生日、纪念日

### 绝不能出现的模块

- 关系评分
- MBTI / Big Five  prominently
- 社交网络图
- 联系频率统计图表
- "上次联系 X 天前"的倒计时压力

### 为什么这样设计？

Person Workspace 不是联系人资料页。

它是**关系空间**。

用户来这里是为了理解这段关系，管理这段关系，而不是查看 Alice 的个人信息。

---

## 5.3 Goal Workspace

### 页面结构

```
┌─────────────────────────────────────┐
│  成为产品人                         │
│  Goal · 进行中                      │
├─────────────────────────────────────┤
│  Focus                              │
│  "你已经 10 天没有为这个目标行动了"  │
├─────────────────────────────────────┤
│  Memory Stream                      │
│  （关于这个目标的所有 Memory）        │
├─────────────────────────────────────┤
│  Understanding                      │
│  "你最近在理论学习多，实践少。"      │
├─────────────────────────────────────┤
│  Connections                        │
│  LifeOS Project · Alice · 跑步习惯   │
├─────────────────────────────────────┤
│  Actions                            │
│  记录一次实践 · 调整目标 · 找 Alice 聊聊│
├─────────────────────────────────────┤
│  Reflection                         │
│  "这个目标为什么对你重要？"          │
└─────────────────────────────────────┘
```

### 固定模块

- Header
- Memory Stream
- Understanding
- Connections
- Actions

### 特有模块

- **Milestones**：关键节点
- **Motivation**：为什么重要

### 绝不能出现的模块

- 完成百分比（ prominently）
- 甘特图
- 子任务列表
- KPI 面板
- Deadline 倒计时压力

### 为什么这样设计？

Goal Workspace 不是项目管理工具。

它是**意图空间**。

用户来这里是为了理解自己为什么想达成这个目标，以及是否在朝这个方向前进。

---

## 5.4 Project Workspace

### 页面结构

```
┌─────────────────────────────────────┐
│  LifeOS                             │
│  Project · 活跃                     │
├─────────────────────────────────────┤
│  Focus                              │
│  "下周需要完成原型设计"              │
├─────────────────────────────────────┤
│  Memory Stream                      │
│  （项目相关的所有 Memory）            │
├─────────────────────────────────────┤
│  Understanding                      │
│  "这个项目依赖你和 Bob 的协作。"     │
├─────────────────────────────────────┤
│  Connections                        │
│  Bob · Alice · 成为产品人 Goal       │
├─────────────────────────────────────┤
│  Actions                            │
│  记录会议 · 给 Bob 发消息 · 创建下一步│
├─────────────────────────────────────┤
│  Reflection                         │
│  "这个项目带给你什么？"              │
└─────────────────────────────────────┘
```

### 固定模块

- Header
- Memory Stream
- Understanding
- Connections
- Actions

### 特有模块

- **Key People**：关键协作者
- **Recent Events**：最近事件

### 绝不能出现的模块

- 任务看板
- 工时统计
- 项目燃尽图
- 复杂的文件管理
- 多人权限管理

### 为什么这样设计？

Project Workspace 不是协作工具。

它是**执行空间**。

用户来这里是为了理解项目的状态、关系和下一步，而不是管理任务。

---

## 5.5 Place Workspace

### 页面结构

```
┌─────────────────────────────────────┐
│  上海                               │
│  Place · 去了 12 次                 │
├─────────────────────────────────────┤
│  Focus                              │
│  "你很久没有记录与上海有关的记忆了"  │
├─────────────────────────────────────┤
│  Memory Stream                      │
│  （在这个地方发生的 Memory）          │
├─────────────────────────────────────┤
│  Understanding                      │
│  "上海是你和 Alice 常见面的地方。"   │
├─────────────────────────────────────┤
│  Connections                        │
│  Alice · LifeOS Project · 多次 Event │
├─────────────────────────────────────┤
│  Actions                            │
│  记录一次上海的 Memory · 计划再去一次│
├─────────────────────────────────────┤
│  Reflection                         │
│  "这个地方对你意味着什么？"          │
└─────────────────────────────────────┘
```

### 固定模块

- Header
- Memory Stream
- Understanding
- Connections
- Actions

### 特有模块

- **Visit Rhythm**：访问频率
- **Emotional Tone**：这个地方的情感氛围

### 绝不能出现的模块

- 地图
- 地址详情
- 营业时间
- 评分系统
- 导航按钮 prominently

### 为什么这样设计？

Place Workspace 不是地图应用。

它是**记忆空间**。

用户来这里是为了回忆与这个地方相关的人和事，而不是查看地理位置信息。

---

## 5.6 Self Workspace

### 页面结构

```
┌─────────────────────────────────────┐
│  Me                                 │
│  Self · 忙碌但充实                  │
├─────────────────────────────────────┤
│  Focus                              │
│  "最近把很多精力放在 LifeOS 上，     │
│   别忘了关注自己的身体。"            │
├─────────────────────────────────────┤
│  My Timeline                        │
│  （最近 30 天的 Memory 分布）         │
├─────────────────────────────────────┤
│  My Patterns                        │
│  "你最近社交 Memory 减少了 40%"      │
├─────────────────────────────────────┤
│  Connections                        │
│  我的 Goals · 我的 People · 我的 Habits│
├─────────────────────────────────────┤
│  Reflection                         │
│  "最近这段时间，你对自己有什么发现？"│
└─────────────────────────────────────┘
```

### 固定模块

- Header
- My Timeline
- My Patterns
- Connections
- Reflection

### 可以没有 Focus

Self Workspace 的 Focus 是可选的。

当 AI 认为用户需要关注自己时，才显示 Focus。

### 绝不能出现的模块

- KPI 面板
- 效率统计
- 身体健康数据（除非用户主动记录）
- 社交比较
- 待办清单

### 为什么这样设计？

Self Workspace 不是个人资料页。

它是**自我理解空间**。

用户来这里是为了回看自己、理解模式、进行反思。

---

# Part 6｜Memory Detail Blueprint

## 6.1 点击 Memory 后的展开方式

### 展开动画

- 点击 Memory Card 后，从卡片位置展开为全屏/大半屏 Detail
- 不是页面跳转
- 动画时长 300ms
- 背景轻微变暗

### 页面结构

```
┌─────────────────────────────────────┐
│  ← Memory                           │
│  2026-06-30 · 19:30                 │
├─────────────────────────────────────┤
│                                     │
│  "今天和 Alice 聊了两个小时。"       │
│                                     │
├─────────────────────────────────────┤
│  Fact                               │
│  用户原始输入                        │
├─────────────────────────────────────┤
│  Context                            │
│  "Alice 最近工作压力很大。"          │
│  （AI 生成，用户可编辑）              │
├─────────────────────────────────────┤
│  Meaning                            │
│  "她其实在向你寻求支持。"            │
│  （AI 生成，用户可编辑/否定）         │
├─────────────────────────────────────┤
│  Reflection                         │
│  "（添加你的反思）"                  │
│  （用户在未来添加）                   │
├─────────────────────────────────────┤
│  Evidence                           │
│  来源 Memory 引用                    │
├─────────────────────────────────────┤
│  Connections                        │
│  Alice · LifeOS · 咖啡馆             │
├─────────────────────────────────────┤
│  Actions                            │
│  记录后续 · 给 Alice 发消息          │
└─────────────────────────────────────┘
```

---

## 6.2 Fact 模块

### 位置

Memory Detail 顶部。

### 内容

用户原始的输入内容。

### 编辑权限

只有用户可以编辑 Fact。

AI 不能修改 Fact。

### 为什么在最顶部？

Fact 是 Memory 的基础。

用户首先需要看到"我当初写了什么"。

---

## 6.3 Context 模块

### 位置

Fact 下方。

### 内容

来自其他 Memory 和 Entity 的上下文。

例如：
- "Alice 最近工作压力很大"
- "你们上次深入聊天是 3 周前"
- "这段对话发生在上海的咖啡馆"

### 编辑权限

AI 生成，用户可以：
- 确认
- 编辑
- 删除

### 为什么存在？

Context 帮助用户回忆这条 Memory 发生的背景。

没有 Context，Memory 是孤立的。

---

## 6.4 Meaning 模块

### 位置

Context 下方。

### 内容

对这条 Memory 意义的解释。

例如：
- "她其实在向你寻求支持"
- "这次聊天加深了你们的信任"
- "你开始意识到 LifeOS 的方向需要调整"

### 编辑权限

AI 生成，用户可以：
- 确认
- 编辑
- 否定
- 添加自己的 Meaning

### 为什么存在？

Meaning 帮助用户理解这条 Memory 在人生中的角色。

它是 Memory 从"事实"升级为"理解"的关键。

---

## 6.5 Reflection 模块

### 位置

Meaning 下方。

### 内容

用户在未来某个时刻添加的回头看。

### 触发方式

1. 用户主动点击"添加 Reflection"
2. AI 在适当时机 gentle 地问："关于这段记忆，你现在怎么看？"

### 为什么存在？

Reflection 让 Memory 具有成长性。

同一条 Memory，在不同时间看，意义可能完全不同。

---

## 6.6 Evidence 模块

### 位置

Reflection 下方或折叠在 Context 内。

### 内容

AI 推断 Context 和 Meaning 时所依据的来源 Memory。

例如：
- "基于 6 月 15 日的 Memory：Alice 说她很累"
- "基于 5 月 20 日的 Memory：你们讨论了工作压力"

### 为什么存在？

Evidence 建立信任。

用户可以看到 AI 为什么这样理解。

---

## 6.7 Connections 模块

### 位置

Evidence 下方。

### 内容

这条 Memory 关联的所有 Entity。

每个 Entity 显示：
- 名称
- 类型
- 角色（About / Participant / Location / Trigger 等）

### 为什么存在？

Connections 展示这条 Memory 在人生网络中的位置。

---

## 6.8 Actions 模块

### 位置

Memory Detail 底部。

### 内容

基于这条 Memory 建议的下一步。

例如：
- "给 Alice 发消息"
- "记录后续"
- "创建为一个 Decision"

### 为什么存在？

Memory 不应该只是被保存，它应该能驱动行动。

但 Action 是建议，不是任务。

---

## 6.9 为什么这样组织？

这个顺序符合人类理解事物的过程：

1. **Fact**：发生了什么
2. **Context**：在什么情况下发生
3. **Meaning**：这意味着什么
4. **Reflection**：以后怎么看
5. **Evidence**：为什么这样理解
6. **Connections**：和什么有关
7. **Actions**：接下来可以做什么

这是一个从事实到理解、从理解到行动的自然流动。

---

# Part 7｜Search Blueprint

## 7.1 Search 的入口

### 触发方式

1. **顶部下拉**
   - 在 Home、Spaces、Self 页面从顶部下拉

2. **长按底部导航**
   - 长按任意底部导航按钮调出 Search

3. **Spaces 右上角 Search 图标**

4. **键盘快捷键**
   - 桌面端：Cmd/Ctrl + K

## 7.2 Search 界面

```
┌─────────────────────────────────────┐
│                                     │
│  Search...                          │
│                                     │
├─────────────────────────────────────┤
│  Recent                             │
│  Alice · LifeOS · 跑步计划          │
├─────────────────────────────────────┤
│  Results                            │
│                                     │
│  People                             │
│  Alice                              │
│                                     │
│  Goals                              │
│  成为产品人                         │
│                                     │
│  Projects                           │
│  LifeOS                             │
│                                     │
│  Memories                           │
│  "今天和 Alice 聊了 LifeOS"         │
│                                     │
│  Patterns                           │
│  "你和 Alice 讨论 LifeOS 最多"      │
│                                     │
└─────────────────────────────────────┘
```

## 7.3 自然语言搜索

### 支持的查询

- "我最近和 Alice 聊了什么？"
- "LifeOS 项目有哪些进展？"
- "我什么时候决定跑马拉松的？"
- "上个月最开心的事是什么？"

### 输出

不是文本回答，而是相关 Memory 和 Entity 的列表。

AI 理解查询意图，返回最相关的内容。

## 7.4 Entity 搜索

### 行为

- 输入 Entity 名称，直接显示该 Entity
- 支持模糊匹配
- 最近访问的 Entity 优先

### 结果展示

- Entity Name
- Type
- 最近一条相关 Memory 的摘要

## 7.5 Memory 搜索

### 行为

- 输入关键词，搜索 Memory 内容
- 支持语义搜索，不只是关键词匹配
- 例如搜索"焦虑"，也能找到"最近压力很大"这样的 Memory

### 结果展示

- Memory 内容摘要
- 时间
- 相关 Entity

## 7.6 最近搜索

### 行为

- 保存最近 5-10 个搜索
- 显示最近的 Entity 访问
- 不保存敏感搜索

## 7.7 没有结果

### 展示

```
没有找到相关内容。

你可以：
- 换几个词试试
- 用自然语言描述，比如"我最近和 Alice 聊了什么"
- Capture 一条新 Memory
```

### 文案原则

- 不指责用户
- 提供帮助
- 引导到 Capture

## 7.8 搜索结果为什么不是列表？

搜索结果按意义分组，而不是按类型平铺。

分组方式：
- People
- Goals
- Projects
- Memories
- Patterns

每个分组只展示最相关的前 3 条。

这样设计的原因是：
- 帮助用户快速找到不同类型的内容
- 避免长列表造成的认知负担
- 保持叙事感

---

# Part 8｜Reflection Blueprint

## 8.1 Reflection 是什么？

Reflection 是用户对过去经历、关系、目标、决策的回头看。

它不是评论。

它不是总结。

它是**理解的深化**。

## 8.2 Reflection 如何进入？

### 入口 1：Workspace 中的 Reflection 区域

每个 Workspace 底部都有 Reflection 入口：

```
Reflection
"关于 Alice，你现在怎么想？"
```

### 入口 2：AI Gentle 提示

当 AI 认为某个 Entity 值得反思时，在 Focus 或 Understanding 中 gentle 地提出：

```
"你似乎已经为 LifeOS 投入了很久。
要不要写一段 Reflection？"
```

### 入口 3：Self Workspace 的 Reflection 入口

Self Workspace 提供定期的 Reflection 邀请。

### 入口 4：Memory Detail

用户在查看某条 Memory 时，可以添加 Reflection。

## 8.3 什么时候触发？

### 定期触发

- 每周一次，在 Self Workspace 中提示
- 不强制，不打扰

### 事件触发

- 目标完成时
- 关系发生重要变化时
- 决策过了一段时间后
- 用户连续记录某个主题多次后

### 用户主动触发

- 用户随时可以在任何 Workspace 中写 Reflection

## 8.4 AI 如何提出问题？

### 问题类型

| 场景 | AI 问题 |
|---|---|
| Person | "关于 Alice，你现在怎么想？" |
| Goal | "这个目标为什么对你重要？" |
| Project | "这个项目带给你什么？" |
| Decision | "回头看，这个决定对吗？" |
| Self | "最近这段时间，你对自己有什么发现？" |
| Loss | "关于这件事，你现在怎么想？" |

### 问题原则

- 开放性问题
- 不预设答案
- 不评判
- 温柔
- 简短（不超过 40 字）

## 8.5 用户如何回答？

### 输入方式

- 大文本输入区
- 支持语音输入
- 没有字数限制
- 没有标题

### 保存方式

- 点击保存
- 自动保存草稿

## 8.6 回答后如何成为人生叙事的一部分？

### 关联到 Entity

Reflection 会关联到对应的 Entity Workspace。

### 关联到 Memory

如果 Reflection 是针对某条 Memory 的，它会成为该 Memory 的 Reflection 层。

### 影响 Understanding

AI 会阅读 Reflection，并可能更新 Entity 的 Understanding。

### 影响 Patterns

长期的 Reflection 会成为 AI 发现人生模式的重要素材。

### 影响 Timeline

Reflection 会出现在 Self Timeline 中，标记为用户主动的人生思考节点。

## 8.7 Reflection 页面结构

```
┌─────────────────────────────────────┐
│  ← Reflection                       │
├─────────────────────────────────────┤
│                                     │
│  关于 Alice，你现在怎么想？          │
│                                     │
│  （大输入区）                        │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Related Memory                     │
│  "今天和 Alice 聊了两个小时"         │
├─────────────────────────────────────┤
│  [Cancel]        [Save]             │
└─────────────────────────────────────┘
```

---

# Part 9｜Today's Focus Blueprint

## 9.1 Focus 卡片的元素

```
┌─────────────────────────────────────┐
│                                     │
│  Today                              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Alice                      │    │
│  │  Person                     │    │
│  │                             │    │
│  │  45 天没有联系了。           │    │
│  │  她最近工作压力很大。         │    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 发一句轻松的关心吧。   │  │    │
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  │  [Done] [Later] [Skip]      │    │
│  │                             │    │
│  │  Why now?                   │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 元素说明

| 元素 | 说明 |
|---|---|
| **Today** | 日期标签 |
| **Entity Name** | Focus 的主体 |
| **Entity Type** | Entity 类型 |
| **Context** | 为什么现在需要关注 |
| **Suggested Action** | 建议的最小行动 |
| **Done / Later / Skip** | 用户反馈 |
| **Why now?** | 可展开的解释 |

## 9.2 为什么包含这些元素？

### Entity Name + Type

让用户立刻知道 Focus 是关于什么的。

### Context

解释为什么这个 Entity 现在需要关注。

### Suggested Action

给用户一个具体、可执行的下一步。

### 反馈按钮

让用户有选择权，不是被命令。

### Why Now

建立信任，让用户理解 AI 的判断依据。

## 9.3 点击后发生什么？

### 点击 Entity Name / Type

进入该 Entity 的 Workspace。

### 点击 Suggested Action

执行建议的行动：
- 如果"发消息"，打开系统短信/邮件/聊天应用
- 如果"记录一次互动"，打开 Capture 并预填充该 Entity
- 如果"反思"，打开 Reflection 页面

### 点击 Why now?

展开详细解释，显示：
- 依据的 Memory
- 发现的模式
- 时间因素

## 9.4 Done

### 行为

- 卡片淡出
- 创建一条 Memory 记录用户完成了 Focus
- AI 学习这个 Focus 有效
- 可能展示下一个 Focus（optional）

### 状态更新

- Reminder 状态变为 done
- Relationship 权重更新
- Memory Stream 新增一条记录

## 9.5 Later

### 行为

- 卡片淡出
- Focus 推迟到稍后
- AI 在合适的时间重新推荐
- 不追问具体时间

### 状态更新

- Reminder 状态变为 snoozed
- AI 调整时机模型

## 9.6 Skip

### 行为

- 卡片淡出
- 没有惩罚
- AI 学习这个 Focus 不重要或时机不对

### 状态更新

- Reminder 状态变为 dismissed
- AI 降低类似 Focus 的权重

## 9.7 Focus 的类型

| 类型 | 示例 | 触发条件 |
|---|---|---|
| Reconnect | "联系 Alice" | 长时间未联系 |
| Progress | "为 LifeOS 推进一步" | 项目/目标停滞 |
| Reflect | "回头看辞职决定" | 决策后一段时间 |
| Practice | "实践时间管理知识" | 学习了但少用 |
| Rest | "今天给自己空间" | 用户过度劳累 |
| Decide | "决定 LifeOS 方向" | 需要明确选择 |
| Celebrate | "庆祝跑完马拉松" | 达成里程碑 |

## 9.8 Focus 的生成机制

Focus 由 AI 综合以下因素生成：

1. **时间因素**
   - 上次联系时间
   - 目标 deadline
   - 重要日期

2. **关系因素**
   - Entity 的重要性
   - Relationship 权重
   - 最近的互动频率

3. **模式因素**
   - 历史行为模式
   - 失败/成功模式
   - 重复出现的情况

4. **用户状态**
   - 最近的 Capture 频率
   - 最近的 Reflection
   - 情绪波动

5. **外部事件**
   - 生日
   - 纪念日
   - 项目 milestone

---

# Part 10｜Empty State Blueprint

## 10.1 Empty State 的设计原则

空状态不是"没有数据"。

空状态是"等待故事开始"。

### 共同原则

- 温暖
- 邀请
- 不制造愧疚
- 提供简单的开始动作
- 不出现复杂的引导图

---

## 10.2 Home 空状态

### 第一次打开

```
Welcome to LifeOS
这里会帮助你记录、理解、成长。

从记录第一件小事开始。

[Capture a moment...]
```

### 没有 Today's Focus 时

```
Good morning, [Name]

今天没有特别需要关注的事。
享受这一天吧。

[Capture a moment...]
```

### 没有 Recent Activity 时

```
Recent

还没有记录。
写下第一件事，这里就会开始生长。
```

## 10.3 Spaces 空状态

```
Spaces

你还没有任何生活空间。

当你 Capture 关于某个人、目标或项目，
这里就会自动出现。

[Capture a moment...]
```

## 10.4 Workspace 空状态

### Person Workspace

```
Alice

还没有关于 Alice 的记忆。

当你记录第一件小事，
这里就会开始讲述你们的故事。

[Capture about Alice]
```

### Goal Workspace

```
成为产品人

还没有关于这个目标的记忆。

记录你为这个目标的第一次行动，
这里就会开始生长。

[Capture about this goal]
```

### Project Workspace

```
LifeOS

这个项目还没有任何记忆。

记录第一次讨论或想法，
这里就会开始积累。

[Capture about LifeOS]
```

## 10.5 Self 空状态

```
Me

你还没有关于自己的记录。

从一条简单的 Reflection 开始，
比如"我现在感觉如何？"

[Write a Reflection]
```

## 10.6 Search 空状态

```
没有找到相关内容。

你可以：
- 换几个词试试
- 用自然语言描述
- Capture 一条新 Memory
```

## 10.7 绝不能出现的文案

- "你还没有任何数据"
- "开始创建你的第一个对象"
- "你的效率很低"
- "你已经 X 天没使用了"
- "立即开始使用"
- "完成设置"
- "你没有待办事项"

这些文案把 LifeOS 变成了效率工具或数据库。

---

# Part 11｜Responsive Blueprint

## 11.1 设计原则

LifeOS 的响应式不是简单缩放。

不同设备应该有不同信息架构：
- iPhone：单栏，沉浸式
- Android：单栏，系统手势适配
- iPad：双栏，边栏 + 详情
- Desktop：三栏，导航 + 内容 + 侧边上下文

但核心体验必须一致：
- Memory First
- One Focus at a Time
- Workspace 是故事空间
- AI 安静

---

## 11.2 iPhone

### 布局

- 单栏
- 底部导航
- 全屏 Workspace
- 底部 Sheet Capture

### 首页

```
┌─────────────────────┐
│ Settings  LifeOS    │
│                     │
│ Good morning, [Name]│
│                     │
│ [Today's Focus]     │
│                     │
│ Capture a moment... │
│                     │
│ Recent              │
│ [Memory 1]          │
│ [Memory 2]          │
│ [Memory 3]          │
│                     │
│ Home  Spaces  □  Me │
└─────────────────────┘
```

### Workspace

- 全屏
- 垂直滚动
- 返回手势从左侧滑入

### Capture

- 底部 Sheet，占屏幕 85%
- 输入框自动聚焦

---

## 11.3 Android

### 布局

- 单栏
- 底部导航
- 系统返回按钮适配
- 底部 Sheet Capture

### 与 iPhone 的差异

- 使用 Material 的系统返回手势
- 底部导航高度适配 Android 设计规范
- 分享扩展使用 Android Sharesheet
- 通知渠道独立管理

### 核心体验一致

- 底部导航结构相同
- Capture 打开方式相同
- Workspace 布局相同
- Focus 卡片相同

---

## 11.4 iPad

### 布局

- 双栏或三栏
- 左侧边栏：Home / Spaces / Self / Settings
- 中间主内容区
- 右侧可选上下文区

### 首页

```
┌──────────┬──────────────────────────┬──────────┐
│          │                          │          │
│  Home    │  Good morning, [Name]    │  Recent  │
│  Spaces  │                          │  Activity│
│  □       │  [Today's Focus]         │          │
│  Self    │                          │  [M1]    │
│          │  Capture a moment...     │  [M2]    │
│          │                          │  [M3]    │
│          │  Recent                  │          │
│          │  [M1] [M2] [M3]          │          │
│          │                          │          │
└──────────┴──────────────────────────┴──────────┘
```

### Workspace

- 主内容区显示 Workspace
- 右侧显示相关 Connections 的快速入口
- 不需要全屏跳转

### Capture

- 可以从底部弹出
- 也可以从屏幕中央弹出为浮动面板

---

## 11.5 Desktop

### 布局

- 三栏
- 左侧：导航
- 中间：主内容
- 右侧：上下文/详情

### 首页

```
┌────────┬─────────────────────────┬─────────────┐
│        │                         │             │
│  Home  │  Good morning, [Name]   │  Today's    │
│  Spaces│                         │  Focus      │
│  □     │  [Today's Focus]        │  Detail     │
│  Self  │                         │             │
│        │  Capture a moment...    │  Recent     │
│        │                         │  Activity   │
│        │  Recent                 │             │
│        │  [M1] [M2] [M3]         │  [M1]       │
│        │                         │  [M2]       │
│        │                         │  [M3]       │
└────────┴─────────────────────────┴─────────────┘
```

### Workspace

- 中间显示 Workspace
- 右侧显示 Memory Detail 或 Connections
- 用户可以不离开 Workspace 查看详情

### Capture

- 浮动面板
- 居中或偏右
- 支持键盘快捷键

### 键盘快捷键

| 快捷键 | 功能 |
|---|---|
| Cmd/Ctrl + N | 打开 Capture |
| Cmd/Ctrl + K | 打开 Search |
| Cmd/Ctrl + / | 显示快捷键帮助 |
| Esc | 关闭 Capture / Search |

---

# Part 12｜Component Inventory

## 12.1 组件清单

### 1. Today's Focus Card

**职责：**
展示每天唯一需要用户关注的事。

**包含元素：**
- "Today" 标签
- Entity Name
- Entity Type
- Context 文本
- Suggested Action 区域
- Done / Later / Skip 按钮
- Why now? 可展开入口

**状态：**
- 默认展开
- Why Now 折叠
- 完成后的淡出状态

**绝不能出现：**
- 多个 Focus 同时展示
- 进度条
- 未读 badge
- 效率指标
- 复杂图表

---

### 2. Memory Card

**职责：**
在列表中展示一条 Memory 的摘要。

**包含元素：**
- Memory 内容摘要（最多 2 行）
- 时间
- 相关 Entity chips（最多 3 个）
- Meaning Tags（最多 2 个）
- 附件缩略图（如果有图片）

**状态：**
- 默认状态
- 悬停/按下状态
- 选中状态

**绝不能出现：**
- 标题字段
- 分类标签
- 编辑按钮 prominently
- 删除按钮 prominently
- 完整 Meaning 展示

---

### 3. Workspace Header

**职责：**
标识当前 Workspace 的 Entity。

**包含元素：**
- 返回按钮
- Entity Name
- Entity Type
- Status 文本
- 可选的 Avatar/Icon

**状态：**
- 默认
- 滚动后的 compact 状态

**绝不能出现：**
- Tab 切换
- 编辑按钮 prominently
- 删除按钮 prominently
- 复杂操作菜单

---

### 4. Memory Stream

**职责：**
按时间倒序展示一个 Entity 相关的所有 Memory。

**包含元素：**
- 时间分隔（今天、昨天、本周、本月、更早）
- Memory Card 列表
- "Load more" 入口（如果很多）

**状态：**
- 加载中
- 空状态
- 部分加载
- 全部加载

**绝不能出现：**
- 分页数字
- 排序选项
- 过滤器 prominently
- 网格布局

---

### 5. Understanding Card

**职责：**
展示 AI 对一个 Entity 的温和理解。

**包含元素：**
- 一行简短的理解文本
- 可能有一个"告诉我更多"的入口
- 证据引用（折叠）

**状态：**
- 默认（一句话）
- 展开（更多细节）

**绝不能出现：**
- 分析报告格式
- 复杂图表
- 评分
- 百分比
- 冷冰冰的"AI 分析"

---

### 6. Connection Chip

**职责：**
展示一个与当前 Entity 相关的其他 Entity。

**包含元素：**
- Entity Name
- Entity Type（small）
- 关系角色（可选）

**状态：**
- 默认
- 按下

**绝不能出现：**
- 关系强度数值
- 复杂的图节点
- 连接线

---

### 7. Action Card

**职责：**
展示基于 Understanding 的建议行动。

**包含元素：**
- Action 文本
- 图标
- 可选的简短解释

**状态：**
- 默认
- 完成后的 subtle 变化

**绝不能出现：**
- 多个 Action 堆叠超过 3 个
- 强制性的语言
- 待办清单样式

---

### 8. Reflection Block

**职责：**
提供 Reflection 的入口和展示。

**包含元素：**
- AI 提出的问题
- 输入区（展开后）
- 已保存的 Reflection 展示

**状态：**
- 未输入
- 输入中
- 已保存

**绝不能出现：**
- 字数限制提示
- 标题字段
- 评分

---

### 9. Capture Sheet

**职责：**
提供快速记录 Memory 的界面。

**包含元素：**
- 大文本输入区
- 附件入口（语音、图片、链接、语音转文字）
- Entity 建议 chips
- Cancel / Save Memory 按钮

**状态：**
- 空
- 输入中
- 保存中
- 失败
- 草稿

**绝不能出现：**
- 标题字段
- 分类选择
- 标签输入
- 格式工具栏
- 复杂表单

---

### 10. Search Overlay

**职责：**
提供全局搜索能力。

**包含元素：**
- 搜索输入框
- Recent 区域
- Results 分组
- Empty state

**状态：**
- 空
- 输入中
- 有结果
- 无结果

**绝不能出现：**
- 复杂筛选器
- 排序选项
- 纯列表结果

---

### 11. Timeline

**职责：**
在 Self Workspace 中展示用户的人生时间线。

**包含元素：**
- 时间节点
- Memory 摘要
- 重要事件标记
- Reflection 标记

**状态：**
- 加载中
- 空
- 有数据

**绝不能出现：**
- 复杂图表
- KPI
- 统计数字 prominently

---

### 12. Empty State Block

**职责：**
在页面没有内容时提供温暖的引导。

**包含元素：**
- 简短文案
- 开始动作按钮/入口

**状态：**
- 默认

**绝不能出现：**
- "没有数据"
- "立即开始"
- 复杂插图
- 营销语言

---

### 13. Status Badge

**职责：**
显示 Entity 的当前状态。

**包含元素：**
- 简短状态文本

**状态：**
- 多种状态文本

**绝不能出现：**
- 彩色标签
- 进度百分比
- 评分

---

### 14. Suggested Entity Chips

**职责：**
在 Capture 中显示 AI 建议的相关 Entity。

**包含元素：**
- Entity Name
- 关闭按钮

**状态：**
- 默认
- 选中
- 已移除

**绝不能出现：**
- 复杂分类树
- 强制选择
- 搜索框 prominently

---

### 15. Meaning Tags

**职责：**
小标签展示 Memory 的意义类型。

**包含元素：**
- 标签文本

**状态：**
- 默认

**绝不能出现：**
- 彩色背景
- 可编辑
- 作为主要组织方式

---

## 12.2 组件设计原则

1. **每个组件只负责一件事**
2. **组件之间保持低耦合**
3. **组件状态尽量简单**
4. **不使用复杂动画**
5. **不使用彩色标签系统**
6. **文字优先于图标**
7. **留白优先于边框**

---

# Part 13｜Blueprint Review

## 13.1 是否仍然符合 LifeOS 是人生理解工具？

是的。

本 Blueprint 中的每一个设计都服务于：
- 记录人生（Capture）
- 理解人生（Workspace、Understanding、Reflection）
- 成长（Focus、Patterns、Self）

没有 Todo List。
没有 KPI。
没有 Dashboard。
没有效率指标。

## 13.2 哪些地方最容易退化成 Notion？

### 风险点

1. **Spaces 页面**
   - 容易做成对象列表或数据库视图
   - 容易加入分类、筛选、排序

2. **Workspace**
   - 容易加入自定义字段
   - 容易做成资料页

3. **Memory Detail**
   - 容易做成笔记编辑器
   - 容易加入复杂格式

### 如何避免

- Spaces 必须展示为"生活空间"，不是列表
- Workspace 必须讲述故事，不是展示字段
- Memory Detail 必须是经历，不是笔记
- 禁止自定义字段
- 禁止复杂格式

## 13.3 哪些地方最容易退化成 Todoist？

### 风险点

1. **Today's Focus**
   - 容易做成待办清单
   - 容易加入截止日期、优先级

2. **Actions Block**
   - 容易做成任务列表
   - 容易加入完成勾选框

3. **Goal / Project Workspace**
   - 容易加入子任务
   - 容易加入 deadline 倒计时

### 如何避免

- Focus 每天只有一个
- Actions 最多 3 个，且是建议不是任务
- 不使用 checkbox
- 不展示 deadline 倒计时压力
- 目标进度用 Memory Stream 展示，不是进度条

## 13.4 哪些地方最容易退化成 Dashboard？

### 风险点

1. **Home 页面**
   - 容易加入统计卡片
   - 容易加入多个 Focus
   - 容易加入待办列表

2. **Self Workspace**
   - 容易加入 KPI 面板
   - 容易加入效率统计

3. **Spaces**
   - 容易加入 overview 数据

### 如何避免

- Home 只展示一个 Focus 和 3 条 Recent Activity
- Self 只展示 Timeline、Patterns、Reflection
- 禁止使用统计数字、KPI、图表

## 13.5 哪些地方最容易退化成 CRM？

### 风险点

1. **Person Workspace**
   - 容易加入关系评分
   - 容易加入 MBTI / Big Five
   - 容易加入联系频率统计

2. **Connections**
   - 容易做成社交网络图
   - 容易展示关系强度数值

### 如何避免

- Person Workspace 展示关系故事，不是联系人资料
- 不使用关系评分
- 不 prominently 展示 MBTI
- 不使用社交网络图
- 关系强度用自然语言表达

## 13.6 哪些地方最容易退化成 AI Chat？

### 风险点

1. **AI 交互**
   - 容易做成聊天机器人入口
   - 容易让 AI 主动弹窗

2. **Understanding**
   - 容易做成"AI 分析结果"展示

3. **Reflection**
   - 容易做成和 AI 对话的形式

### 如何避免

- 没有独立的 AI Chat 页面
- AI 输出融入界面，不是对话框
- AI 不主动弹窗
- Reflection 是用户自己的思考空间，AI 只提问题

## 13.7 最终审查结论

本 Blueprint 严格遵守了 UX Bible 和 Experience Specification。

它在产品层面定义了：
- 6 个一级页面/入口
- 清晰的导航哲学
- Home / Capture / Workspace / Memory Detail / Search / Reflection 的完整结构
- 5 种核心 Workspace
- 响应式布局策略
- 15 个核心组件
- Anti-pattern 防范

它为后续的设计稿、Figma、React、Flutter 开发提供了唯一的产品依据。

---

# 结语

> **这份 Blueprint 不是终点，而是起点。**
>
> 它定义了 LifeOS 应该如何被构建。
> 但它不限制设计师和开发者的创造力。
>
> 唯一的约束是：
> **让用户在使用 LifeOS 的每一个时刻，都感到被理解、被支持、被陪伴。**

---

**文档版本：** V1.0  
**依据文档：** 《LifeOS Product Interaction & UX Bible》、《LifeOS Experience Specification V1.0》  
**状态：** 产品蓝图定稿  
**下一步：** Wireframe、UI Design System、技术实现
