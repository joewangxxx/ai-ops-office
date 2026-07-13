# AI OPS Office Demo 设计 Spec

日期：2026-07-09  
文档类型：产品前端形态设计 Spec  
目标读者：mentor、产品经理、前端设计/开发同学  

## 1. 项目定位

本项目第一版不是完整 AI OPS 系统，也不是员工真实工作台，而是 AI OPS 项目中的一个偏售前、偏炫技的开场视图。

它的目标是让客户在打开页面后的几十秒内理解：组织里不同岗位正在以 Human + Agent 的 co-pilot 模式协同工作，各岗位通过标准化 Artifact 交接产物，而不是共享完整聊天上下文。

第一版的产品形态定义为：

> 一个售前演示型 AI OPS Office Demo，通过 2D 像素办公室地图展示 PM、Dev、QA 三个小办公区、中央 Artifact Hub、Human Avatar、Agent 光球、Artifact 入库/接收动画和右侧对象详情面板。

## 2. 核心目标

1. 让客户直观看到“人 + AI 搭档”在岗位内协作。
2. 让客户理解不同 Workspace 之间通过 Artifact，而不是 Context，完成交接。
3. 用办公室地图、角色小跑、Artifact 入库等轻游戏化表达增强记忆点。
4. 用右侧 Inspector 解释地图中对象的业务含义，保证 B 端可信度。
5. 第一版优先服务 Demo Mode，未来可切换到 Live Mode，但客户界面不展示模式切换。

## 3. 非目标

第一版不做以下内容：

1. 不做完整 PM / Dev / QA 工作台。
2. 不展示完整聊天记录、代码编辑器、测试日志或 Agent Trace。
3. 不做员工操作监控，不采集屏幕、键盘、鼠标或具体软件操作。
4. 不做管理者全局绩效大屏。
5. 不做权限、审计、版本锁、Webhook、文件锁等完整企业协同机制。
6. 不把移动路径做成可点击对象或独立信息层。
7. 不展示员工缺席原因、在线时长、上次活跃时间等考勤信息。

## 4. 产品原则

### 4.1 地图负责感知，Inspector 负责解释

Office Map 负责让客户“看到组织在运转”。右侧 Inspector 负责解释客户点击的对象是什么、当前有什么业务含义。

Inspector 不是监控层，而是解释层。

### 4.2 只展示任务级状态，不展示操作级监控

系统可以展示某个员工当前负责的任务、输入 Artifact、Agent 是否可用或正在协助，但不展示员工正在编辑哪个文件、鼠标点了哪里、屏幕里打开了什么。

Agent 光球颜色由系统内业务事件和 Agent 会话状态驱动，不由屏幕监控驱动。

### 4.3 Artifact 是跨 Workspace 的交接对象

Workspace 内部可以有人、Agent、任务、草稿和上下文，但 Workspace 之间只流转标准化 Artifact。

PM Office 输出 PRD，Dev Office 消费 PRD 并输出 Feature Artifact，QA Lab 消费 Feature Artifact 并输出 Test Report。

### 4.4 动画服务业务事件

动画不是为了热闹，而是为了表达关键业务事件：

1. 新需求进入。
2. Artifact 生成。
3. 人工确认。
4. Artifact 入库。
5. 下游接收。
6. 工作开始。
7. 报告完成。

### 4.5 故事线元素与行为映射表

下表用于把故事线中的业务元素、行为含义和前端表现建立对应关系。后续设计和开发应优先保证这些映射清晰，而不是增加更多装饰性动效。

| 故事元素 / 行为 | 业务含义 | 前端表现 |
|---|---|---|
| Human + Agent | co-pilot 最小协作单元 | Human Avatar + Agent 光球 |
| Workspace | 岗位团队的小办公区 | 多张桌子 + 在线人数 + 今日产出 |
| PRD 生成 | PM 阶段完成标准文档产物 | 蓝色文档 Artifact |
| 人工确认 | 人仍保留关键决策权 | Agent 光球黄色闪烁 |
| Artifact 入库 | 标准化产物进入交接节点 | 角色小跑到 Artifact Hub 放入文件 |
| Dev 接收 | 下游开始消费 PM 产物 | Dev 气泡“收到 PRD” + Hub 取件动画 |
| Feature 入库 | Dev 阶段完成可测试功能产物 | 绿色代码包进入 Artifact Hub |
| QA 接收 | 测试开始消费 Feature 产物 | QA 气泡“收到 Feature” + Hub 取件动画 |
| 测试完成 | 质量验证结束 | 紫色 Test Report 入库 |
| 最近交接 | 业务事件可被追溯 | Inspector 中 Latest Handoff 时间戳事件 |

## 5. 总体界面结构

第一版采用：

> 亮色 2D 像素办公室地图 + 深色右侧 Inspector + 右下角轻量 Story Controller。

页面不显示顶部标题，不显示 Story Progress。

### 5.1 主画面

主画面是一个固定镜头的 2D 像素办公室地图，一屏展示：

1. PM Office。
2. Dev Office。
3. QA Lab。
4. 中央 Artifact Hub。
5. 多张桌子、在线 Avatar、离线桌位、Agent 光球。
6. 交接动画和任务提示气泡。

### 5.2 右侧 Inspector

桌面端默认展开，显示 Office Summary。窄屏默认收起，点击对象后展开。

点击不同对象后，Inspector 切换为对应详情：

| 点击对象 | Inspector 内容 |
|---|---|
| 空白区域 | Office Summary |
| Workspace | Workspace Overview |
| 在线 Avatar | Avatar Detail |
| 离线桌位 | Offline Desk Detail |
| Artifact Hub | Artifact Hub Overview |
| 具体 Artifact 标题 | Artifact Detail |

### 5.3 Story Controller

Story Controller 固定在右下角，默认轻量显示当前业务阶段，例如：

```text
Auto Demo · PRD 入库
```

展开后提供：

1. Play / Pause。
2. Prev。
3. Next。
4. Replay。

不显示 `Step 5 / 10` 这类数字步骤，而显示业务阶段名称。

## 6. 视觉风格

### 6.1 总体风格

采用：

> Polished Pixel Office + Enterprise Inspector UI

即精致 2D 像素办公室 + 企业级对象详情面板。

地图层参考 2D top-down pixel office 的空间叙事，保留可玩性和角色感。Inspector 采用现代 SaaS / AI OPS 风格，深色、克制、信息清晰。

### 6.2 两个参考项目的定位

`GenerativeAgentsCN` / 斯坦福小镇属于 2D top-down pixel simulation，重点是多智能体在开放小镇中的自主行为和对话涌现。它适合作为空间叙事和多角色行为参考，但直接照搬会偏研究 Demo 和模拟游戏。

`hermes-desktop` 的 Office 属于 low-poly 3D city / 低多边形 3D 城市办公室风。它适合表达宏观 AI Agent Office 概念，但远景 3D 不适合第一版清晰展示桌位、名字、Agent 光球和 Artifact Hub 交接。

本项目第一版更接近 My Virtual Office / Generative Agents 的 2D 像素办公室，但需要更企业化、更克制的信息面板。

### 6.3 颜色语义

| 元素 | 颜色含义 |
|---|---|
| Avatar 名字标签 | 个性化识别，不表示业务状态 |
| Agent 光球 | AI 协作状态 |
| Artifact 颜色 | Artifact 类型 |
| Workspace 高亮 | 当前主焦点事件 |
| Inspector 状态色 | 轻量辅助说明 |

名字标签颜色由 Demo 数据预设，第一版不提供编辑入口。

## 7. 地图对象定义

### 7.1 Workspace

Workspace 是一个小办公区，不是单人工位。

第一版包含：

| Workspace | 桌位数 | 在线人数 |
|---|---:|---:|
| PM Office | 3 | 2 / 3 |
| Dev Office | 4 | 3 / 4 |
| QA Lab | 3 | 2 / 3 |

地图上不显示大号区域标题。Workspace 名称通过 hover tooltip 和点击后的 Inspector 标题表达。

### 7.2 Desk / 桌位

每个 Workspace 内有多张桌子。

桌位状态：

| 状态 | 地图表现 | 点击后 |
|---|---|---|
| 在线，Agent 可用 | 彩色名字 + Human Avatar + 灰色光球 | Avatar Detail |
| 在线，Agent 协助中 | 彩色名字 + Human Avatar + 蓝色光球 | Avatar Detail |
| 在线，等待人工确认 | 彩色名字 + Human Avatar + 黄色闪烁光球 | Avatar Detail |
| 离线 | 灰色名字 + 空桌 | Offline Desk Detail |

离线桌位不显示缺席原因。

### 7.3 Avatar 名字标签

地图上每个 Avatar 头上显示名字，不显示职业。

在线 Avatar 使用彩色名字标签；离线桌位使用灰色名字标签。

名字标签颜色只用于个性化识别，不承载状态含义。

### 7.4 Agent 光球

每个在线 Avatar 旁边有一个 Agent 光球，用来表达该员工是否正在使用 AI Copilot。

三种状态：

| 光球状态 | 含义 | 数据来源 |
|---|---|---|
| 灰色低亮 | Agent 可用但未参与 | 员工在线，无 active Agent session |
| 蓝色发光 | Agent 正在协助 | 员工主动发起 Agent 会话，session running |
| 黄色闪烁 | 等待人工确认 | Agent 输出结果后等待 Submit / Accept / Confirm |

第一版不使用红色光球，不把异常状态绑定到个人。

## 8. Artifact Hub

### 8.1 定位

Artifact Hub 是中央交接台 + 数字档案终端。

它不是传送门，不是魔法道具，也不是可点击路径系统。它是办公室中央的可信交接节点。

### 8.2 视觉形态

Artifact Hub 外观看起来像中央共享交接台，台面上有数字卡槽和小屏幕。

小屏幕显示三类产物数量：

```text
PRD 2
Feature 3
Report 1
```

地图上不常驻显示 `Artifact Hub` 文字。点击后 Inspector 标题显示 `Artifact Hub`。

### 8.3 Artifact 视觉

三类 Artifact 采用办公文件外观 + 轻游戏化动效：

| Artifact | 基础外观 | 颜色 |
|---|---|---|
| PRD Artifact | 文档 / 文件夹 | 蓝色 |
| Feature Artifact | 代码包 / 模块文件 | 绿色 |
| Test Report Artifact | 报告夹 / 检查清单 | 紫色 |

移动中的 Artifact 不可点击，只是交接动画的一部分。

## 9. 交接动画

本项目不做 Handoff Path，不做 Handoff Detail。

交接通过 Handoff Animation 表达：

1. 角色拿起 Artifact。
2. 角色小跑到 Artifact Hub。
3. 放入或取出 Artifact。
4. Artifact Hub 数量更新。
5. Latest Handoff 新增事件。
6. 角色小跑回对应 Workspace。

一次完整交接控制在 4 到 5 秒。

交接动画规则：

1. 每次只播放一个主线交接动画。
2. 其他 Workspace 保持轻微背景动画。
3. 不显示常驻连线。
4. 不把移动路线做成可点击对象。
5. 交接完成后再更新对应业务状态。

## 10. 任务提示气泡

地图中显示任务提示气泡，但气泡只用于“新输入到达 / 下游被通知”的关键节点，不用于解释所有内部过程。

气泡的作用是把客户注意力从一个 Workspace 转移到下一个 Workspace。例如：需求进入 PM Office、Dev 收到 PRD、QA 收到 Feature。

气泡不可点击，只做短暂提示，3 到 5 秒后淡出。

第一版只保留以下气泡：

| 场景 | 气泡 |
|---|---|
| 需求进入 PM | 新需求进入 |
| Dev 收到 PRD | 收到 PRD |
| Feature 入库并通知 QA | 收到 Feature |

以下状态不使用气泡表达：

1. PRD 生成。
2. 等待人工确认。
3. PRD 入库。
4. 功能开发中。
5. 测试执行中。
6. 报告入库。

这些状态分别通过 Artifact 出现、Agent 光球颜色、角色交接动画、Artifact Hub 数量更新和右侧 Inspector 来表达。

## 11. Inspector 设计

### 11.1 文案规则

Inspector 标题用英文，字段用中文。核心术语可保留英文，例如 PRD、Feature、Artifact、Workspace、Agent。

### 11.2 默认 Office Summary

默认显示：

```text
Office Summary

▸ 在线成员        7 / 10

▾ 今日产出
   PRDs Submitted         2
   Features In Progress   3
   Test Reports           1

▾ 最近交接
   09:42  PM Office 提交 Login PRD
   09:47  Dev Office 接收 Login PRD
   10:15  QA Lab 接收 Login Feature
```

`在线成员` 支持点击展开到 Workspace 聚合：

```text
PM Office    2 / 3
Dev Office   3 / 4
QA Lab       2 / 3
```

不展开到缺席原因。

`今日产出` 支持点击具体指标展开标题列表。

`最近交接` 最多显示 3 条，每条前显示分钟级时间戳，不显示秒、不显示技术日志 ID。

### 11.3 Workspace Overview

以 Dev Office 为例：

```text
Dev Office Overview

团队
Developers Online: 3 / 4

今日产出
Features In Progress      2
Code Changes Submitted    3
Builds Passed             2

当前队列
Inbox         Login PRD 已接收
In Progress  2 features
Outbox        Feature Artifact 待入库
```

规则：

1. Team 数字可展开到桌位和名字。
2. 今日产出可点击展开标题列表。
3. 当前队列可点击展开标题列表。
4. 不列 Active Avatars。
5. 不显示 Overall Status、Current Focus、Desk Status。
6. Blockers 默认不显示，只有大于 0 时出现。

### 11.4 Avatar Detail

点击在线 Avatar 后显示：

```text
Moe

Role
Frontend Developer

Agent
Coding Agent

当前任务
Login Feature

输入 Artifact
Login Requirement PRD v1.0
```

规则：

1. 不显示 Agent Status，状态由地图光球表达。
2. Current Task 只有有任务时显示。
3. Input Artifact 只有任务来自 Artifact 时显示。
4. 不显示 Agent Activity。
5. 不显示 Output Artifact。
6. 不显示 Human Activity。

### 11.5 Offline Desk Detail

点击离线桌位后显示：

```text
Alan

Role
Backend Developer

Status
Offline

Agent
Not active
```

不显示离线原因、在线时长或上次活跃时间。

### 11.6 Artifact Hub Overview

点击 Artifact Hub 后显示：

```text
Artifact Hub

Stored Artifacts Today
PRDs: 2
Feature Artifacts: 3
Test Reports: 1

Latest Handoff
09:42  PM Office 提交 Login PRD
09:47  Dev Office 接收 Login PRD
10:15  QA Lab 接收 Login Feature
```

点击 `PRDs: 2` 展开 PRD 标题列表。点击具体标题进入 Artifact Detail。

### 11.7 Artifact Detail

以 PRD 为例：

```text
Login Requirement PRD v1.0

状态
Dev Office 已接收

Submitted By
Product Manager

Confirmed By
Product Manager

Accepted By
Developer
```

规则：

1. 不显示 Type。
2. 不显示 Source。
3. 不显示 Target。
4. 不显示单独 Version 字段，版本写在标题里。
5. 只展示状态和人的责任链。

## 12. Demo Story

### 12.1 初始状态

页面加载后先进入 Idle 状态 2 秒：

1. 完整办公室可见。
2. 在线 Avatar 坐在工位。
3. 离线桌位显示灰色名字标签。
4. Agent 光球默认以灰色为主，主线开始后再根据 Agent 会话状态切换为蓝色或黄色。
5. Artifact Hub 小屏幕显示当前数量。
6. Inspector 显示 Office Summary。
7. 右下角 Story Controller 显示 Auto Demo。

2 秒后自动播放主线故事。

### 12.2 十步主线

| Step | 业务阶段 | 主焦点事件 | 并行状态 |
|---:|---|---|---|
| 1 | 需求进入 | PM Office 收到新需求 | Dev / QA 待机 |
| 2 | PRD 生成中 | PM + PM Agent 生成 PRD | PM 光球蓝色 |
| 3 | PRD 待确认 | PRD 等待 PM 人工确认 | PM 光球黄色 |
| 4 | PRD 入库 | PM 小跑到 Hub 提交 PRD | Hub PRD 数量更新 |
| 5 | 开发已通知 | Dev Office 收到 PRD | Dev 出现提示气泡 |
| 6 | PRD 已接收 | Developer 到 Hub 取 PRD | Dev 回工位 |
| 7 | 功能开发中 | Dev + Coding Agent 开发 Feature | QA 准备测试计划 |
| 8 | Feature 入库 | Developer 提交 Feature Artifact | QA 收到提示 |
| 9 | 测试执行中 | QA 接收 Feature 并测试 | QA 光球蓝色 |
| 10 | 报告已入库 | QA 提交 Test Report | 故事停在完成态 |

### 12.3 完成态

完成后不自动循环，不显示总结横幅。

完成态：

1. Story Controller 显示 Replay Demo。
2. Artifact Hub 显示最新数量。
3. Inspector 保持 Office Summary。
4. Latest Handoff 更新到最近 3 条。
5. 角色回到办公区待机。

## 13. 数据模式

第一版支持 Demo Mode / Live Mode 的架构思路，但客户界面不展示模式切换。

第一版默认使用 Demo Mode。

UI 组件只依赖统一数据结构：

1. workspaces。
2. desks。
3. avatars。
4. agent orb state。
5. artifacts。
6. handoff events。
7. story steps。

未来 Live Mode 可接入真实后端，但不得引入屏幕监控、键鼠监控或员工操作采集。

## 14. 隐私与数据边界

Office Map 展示的是组织运行状态，不是员工监控。

允许的数据来源：

1. 员工是否登录系统。
2. 是否存在 active Agent session。
3. Agent session 是否 running 或 waiting confirmation。
4. Artifact 是否生成、提交、接收、入库。
5. Workspace 的队列和今日产出。

不允许的数据来源：

1. 屏幕录制。
2. 键盘鼠标行为。
3. 软件窗口内容。
4. 员工离线原因。
5. 在线时长或上次活跃时间。
6. 细粒度 Agent 工具调用日志在地图层展示。

## 15. 交互对象边界

可点击对象：

1. Workspace。
2. 在线 Avatar。
3. 离线桌位。
4. Artifact Hub。
5. Inspector 中的指标和 Artifact 标题。
6. Story Controller。

不可点击对象：

1. 任务提示气泡。
2. 移动中的 Artifact。
3. 角色跑动动画。
4. Hub 槽位闪光。
5. 临时发光效果。

## 16. 响应式策略

桌面端：

1. Inspector 默认展开 Office Summary。
2. 地图完整可见。
3. Story Controller 固定右下角。

窄屏：

1. Inspector 默认收起。
2. 点击对象后展开 Inspector。
3. 地图保持完整缩放优先，不做镜头跟随。

第一版优先保证桌面售前演示体验。

## 17. 验收标准

第一版完成后，应满足以下标准：

1. 客户无需阅读说明，也能看出这是一个有人和 AI 搭档共同工作的办公室。
2. PM、Dev、QA 是三个小办公区，而不是三个单人工位。
3. 中央 Artifact Hub 能通过造型、槽位、数量和交接动画被理解为产物交接节点。
4. 角色提交或接收 Artifact 时，有清晰的小跑交接动画。
5. Agent 光球三态清晰：灰色可用、蓝色协助、黄色待确认。
6. 右侧 Inspector 默认显示 Office Summary，点击对象后能解释该对象。
7. Inspector 不出现员工操作监控、工具调用日志、代码细节或测试日志。
8. Office Summary、Workspace Overview、Artifact Hub Overview 的指标均支持浅层展开。
9. 移动中的 Artifact 和任务气泡不可点击。
10. Demo 播放完成后停在完成态，并提供 Replay Demo。

## 18. 后续可扩展方向

后续版本可以考虑：

1. 接入 Live Mode 后端数据。
2. 增加 Office Editor，自定义名字标签颜色和桌位布局。
3. 增加更多 Workspace，例如 Design、Ops、Sales。
4. 为 Artifact 增加更丰富但仍克制的详情页。
5. 增加异常演示场景，例如 Blockers > 0。
6. 增加可选的完整 Workspace 下钻，但不放入第一版主线。

## 19. 当前设计结论

本方案选择用精致 2D 像素办公室表达 AI OPS 的售前开场视图。它通过多人工位、彩色名字标签、Agent 光球、中央 Artifact Hub、角色小跑交接和右侧 Inspector，把“Human + Agent co-pilot”和“Artifact-based handoff”转化为客户能直接感知的前端体验。

第一版的关键不是展示所有系统能力，而是把一个抽象的 AI OPS 概念变成一个看起来真实运转、可被讲解、可被记住的办公室场景。
