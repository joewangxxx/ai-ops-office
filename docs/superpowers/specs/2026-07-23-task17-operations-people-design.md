# Task 17：People 目录与人员操作设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Operations Console Task 16
- 前置任务：Task 15、Task 16 Operations Console Specs
- 后续任务：Task 18 至 Task 20

## 2. 目标

提供一个清晰的人员目录，让内部使用者知道：

- 组织里有哪些员工。
- 员工属于哪个 Workspace。
- 当前是否在线。
- 有多少待接受 Artifact。
- 有哪些 Active Work。
- 可以从该员工出发创建 Artifact，或在明确授权下代为接受已分配 Artifact。

People 页面管理的是业务责任关系，不是员工电脑、键鼠、聊天或 Agent 工具调用。

## 3. 非目标

- 不修改员工姓名、岗位、Workspace 或 desk 配置。
- 不提供上线、下线或请假原因编辑。
- 不展示在线时长、屏幕、窗口、输入活动或 Agent prompt。
- 不显示“AI Assisted”评分。
- 不通过 Agent 光球颜色推断员工生产力。
- 不直接增删 Active Work。
- 不提供批量 Accept。

## 4. 路由与布局

路由：`/ops/people`

桌面布局：

- 顶部搜索和筛选。
- 中部人员表格。
- 点击一行后从右侧打开 Person Detail drawer。

移动端：

- 人员表格改为紧凑列表。
- 详情作为全屏 drawer。
- 关闭详情后焦点回到原人员行。

## 5. People Table

### 5.1 列

- Name。
- Workspace。
- Presence。
- Pending Assignments。
- Active Work。
- Actions。

Presence 只显示：

- Online。
- Offline。

不得显示离线原因或在线时长。

### 5.2 行为

- 点击行打开 Person Detail。
- Name 可按字母排序。
- Pending Assignments、Active Work 可按数量排序。
- 默认按 Workspace 顺序与桌位顺序排列，保持与 Office Map 的组织结构一致。
- 空桌位对应的离线员工仍显示在目录中。

### 5.3 搜索与筛选

搜索：

- Name。
- Workspace 名称。

筛选：

- Workspace：PM Office / Dev Office / QA Lab。
- Presence：All / Online / Offline。
- Work State：Has Pending / Has Active Work。

筛选条件同步到 URL query，刷新后保留。

## 6. Person Detail

### 6.1 Identity

展示：

- Name。
- Role。
- Workspace。
- Presence。
- Agent label 或 Agent pairing 名称。

Agent 信息只说明这个岗位配有哪类 Agent，不展示 prompt、聊天、工具调用或运行日志。

### 6.2 Pending Assignments

每项展示：

- Artifact title。
- Category。
- Producer。
- Submitted time。
- 当前状态。

如果当前员工是 assignee 且 Artifact 处于 Awaiting Acceptance，显示受控动作：

`Simulate Accept as {Name}`

这是内部 Operations 动作，必须：

- 明确标记为模拟该员工的业务确认。
- 点击后显示确认对话框。
- 确认后提交标准 `artifact.accepted`。
- 使用当前 Artifact 与 assignee desk。
- 成功前不得从列表移除。
- 失败时保留原状态并允许重试。

### 6.3 Active Work

展示数组而不是单个任务：

- Artifact title。
- Category。
- Received time 或最近更新时间。
- 可跳转到 `/ops/artifacts` 对应详情。

同一员工允许多个 Active Work。不得把多个项目合并为一个 Current Task。

### 6.4 Related Artifacts

最多显示最近 10 个：

- 该员工作为 Producer 提交的 Artifact。
- 该员工作为 Assignee 接收的 Artifact。

使用 title 作为主信息，技术 ID 作为辅助信息。

### 6.5 Recent Business Events

最多显示最近 10 条与该人员 deskId 相关的脱敏业务事件：

- 时间。
- Artifact title。
- 人类可读动作。

不展示完整 envelope 或 evidence。

## 7. 人员操作

### 7.1 Create Artifact

从行菜单或 Person Detail 进入：

```text
/ops/dispatch?producerDeskId={deskId}
```

如果岗位只允许一种输出类别，可以同时预填 category：

- PM -> PRD。
- Dev -> Feature。
- QA -> Test Report。

该动作只预填，不自动提交。

### 7.2 View Assignment

- 打开当前 Pending Assignment 对应 Artifact 详情。
- Task 18 完成前可以打开本页内简化详情，但最终必须统一到 Artifacts 读模型。

### 7.3 Simulate Accept

只在以下条件全部成立时显示：

- Operations Console 已启用。
- 该员工是 Artifact assignee。
- Artifact 已到 Hub 并处于 Awaiting Acceptance。
- 当前没有同 Artifact 的 Accept 请求 pending。

该动作不绕过业务规则，不直接修改 notification、motion 或 Artifact location。

## 8. 数据模型与派生规则

People 页面从以下数据派生：

- `scenario.people` 或等价人员配置。
- Workspace 和 desk layout。
- `snapshot.notifications`。
- Artifact Projection。
- Active Work 数组。
- 内部脱敏事件摘要。

建议建立只读 selector：

```ts
type OperationsPersonRow = {
  deskId: string;
  name: string;
  role: string;
  workspaceId: string;
  workspaceName: string;
  presence: 'online' | 'offline';
  pendingAssignmentCount: number;
  activeWorkCount: number;
};
```

所有 count 每次从快照计算，不在组件内累加。

## 9. API

优先复用当前 Projection。若人员详情需要事件关联查询，可新增：

```text
GET /api/internal/people
GET /api/internal/people/:deskId
GET /api/internal/people/:deskId/events?limit=10
```

要求：

- 仅内部模式。
- deskId 必须严格验证。
- 返回脱敏读模型，不返回完整 evidence。
- 人员不存在返回 404。
- limit 最大 100。
- API 为只读。

Accept 继续使用：

```text
POST /api/business-events
```

且 payload 必须是标准 `artifact.accepted` event。

## 10. 实时更新

- People Table 和 Detail 订阅当前 Projection。
- Artifact 分配后，Pending Assignments 无需刷新页面即可更新。
- Accept 成功后，Pending 状态随 Projection 更新。
- Artifact Received 后，Active Work 自动增加。
- 详情打开期间的实时更新不能把用户滚动位置重置。
- 旧 revision 不得覆盖新数据。

## 11. 错误和边界状态

- 人员列表为空：显示配置为空，不伪造示例人员。
- 当前选择人员在新快照中消失：关闭详情并显示提示。
- 详情事件接口失败：身份和业务状态仍可显示。
- Accept 失败：保持 Pending，展示安全错误。
- Offline assignee：允许已分配任务存在，但操作文案明确；是否允许模拟 Accept
  仍以业务 API 规则为准，不通过前端偷偷改变 presence。

## 12. 可访问性

- 表格有 caption 或可访问标题。
- 行菜单有人员姓名上下文，例如 `Actions for Jack`。
- drawer 使用 dialog 语义、焦点圈定和 Escape 关闭。
- 状态使用文字和图标，不只依赖颜色。
- 确认对话框明确写出员工、Artifact 和操作结果。
- 搜索和筛选变化用非紧急 `role="status"` 报告结果数。

## 13. 测试

必须覆盖：

- 在线与离线人员均出现。
- People Online 与表格 presence 一致。
- Workspace、Presence、Work State 筛选。
- URL query 恢复。
- Pending Assignments 从 notifications/Artifact 状态派生。
- Active Work 支持 0、1 和多个项目。
- Create Artifact 正确预填 producer/category。
- Simulate Accept 只在合法条件下出现。
- Accept 产生标准 `artifact.accepted`，不直接改 Projection。
- 重复点击和重复 eventId 幂等。
- Detail 更新不重置滚动。
- 详情接口失败不影响列表。
- 页面不存在屏幕、键鼠、聊天、Agent prompt、在线时长或离线原因字段。
- 移动端 drawer 无溢出且焦点正确。

## 14. 浏览器验收

1. People 显示 10 人，其中 7 Online、3 Offline，以实际 Scenario 为准。
2. 筛选 Dev Office，只显示开发人员。
3. 从 Alice 行点击 Create Artifact，Dispatch 正确预填 Alice 和 PRD。
4. 提交 Alice -> Jack PRD 后，Jack 的 Pending Assignments 实时 +1。
5. 打开 Jack 详情，看到具体 PRD title。
6. 点击 `Simulate Accept as Jack` 并确认。
7. `/office` 中 Jack 前往 Hub 取件。
8. Received 后 Jack 的 Active Work 出现该 PRD，允许保留其他 Active Work。
9. Offline 人员详情不显示离线原因。
10. 浏览器无未处理错误。

## 15. 验收标准

- People 页面可读、可筛选，并能解释每人的业务责任状态。
- 人员操作只能产生标准业务事件。
- Pending、Active Work 和计数均从 Projection 派生。
- 不提供任意员工状态编辑或行为监控。
- 与 Dispatch、Office 动画和多 Active Work 规则一致。
- 不修改 PNG。

