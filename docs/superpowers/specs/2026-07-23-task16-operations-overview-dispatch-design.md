# Task 16：Operations Overview 与 Dispatch Center 设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Operations Console Task 15
- 前置任务：`2026-07-23-task15-operations-console-routing-shell-design.md`
- 后续任务：Task 17 至 Task 20

## 2. 目标

让内部使用者完成两件最核心的事：

1. 在 Overview 中快速判断组织交接概况和系统是否可用。
2. 在 Dispatch Center 中创建一条合法、标准化、可审计的 Artifact 提交与分配事件。

后台不是数字编辑器。使用者不能把“PRD Submitted”从 2 改成 3，而是必须创建一条
`artifact.submitted` 业务事件，Projection 再据此更新数量和动画。

## 3. 非目标

- 不直接编辑 Today、Hub、Active Work、在线人数或人物状态。
- 不把 Dispatch 做成任意 JSON 发送器。
- 不允许在提交时同时替下游员工 Accept。
- 不新增 Jira、GitHub 或其他专用连接器。
- 不在 Overview 展示员工细粒度活动。
- 不在 Dispatch 中保留 Reset Projection。

## 4. Overview 信息架构

路由：`/ops`

### 4.1 Organization Snapshot

展示：

- People Online：例如 `7 / 10`。
- PRDs Submitted Today。
- Features Submitted Today。
- Test Reports Submitted Today。

所有数字从当前 Projection 派生，不允许由前端缓存累加。

### 4.2 Handoff Status

展示系统级聚合：

- Delivering。
- Awaiting Acceptance。
- Collecting。
- Active Work。

规则：

- 同一 Artifact 在同一时刻只进入一个交接状态桶。
- Active Work 统计 Artifact 工作项，不等同于“正在敲键盘的人数”。
- 聚合状态可点击并跳转到带筛选条件的 `/ops/artifacts`，Task 18 实现前可禁用，
  但不能使用假链接。

### 4.3 Recent Business Activity

最多显示最近 5 条脱敏业务事件摘要：

- 时间。
- Artifact title。
- 业务动作：Submitted / Delivered / Accepted / Received。
- Producer 或 Assignee 名称。

不直接显示 `artifact.assigned` 等内部术语作为主文案。`eventType` 只在辅助技术信息中出现。

### 4.4 System Summary

只展示简要状态：

- Gateway：Up / Down。
- Ledger：Writable / Degraded。
- Projection：Ready / Recovering。
- Connection：SSE / Polling / Offline。

详细信息链接到 `/ops/system`。

### 4.5 Overview 状态

- Loading：使用稳定骨架，不改变整体布局。
- Empty：统计为 0，Recent Business Activity 显示真实空状态。
- Partial failure：Organization Snapshot 仍可显示，System Summary 局部报错。
- Offline：保留最后一次快照并标注数据时间，不伪装成实时。

## 5. Dispatch Center 信息架构

路由：`/ops/dispatch`

Dispatch Center 复用并重构现有 Event Console 的 Artifact 表单能力，建议抽取：

```text
src/components/operations/dispatch/ArtifactDispatchForm.tsx
src/components/operations/dispatch/DispatchReceipt.tsx
```

不得复制一份 Event Console 后再分别维护。

### 5.1 表单字段

基础字段：

- Artifact Category：PRD / Feature / Test Report。
- Title。
- Producer。
- Assignee。
- 对应岗位差异化 Evidence。

PRD Evidence：

- Summary。
- User Stories。
- Acceptance Criteria。
- Priority。
- Scope。

Feature Evidence：

- Summary。
- Commit。
- Build Status。
- API Contract。
- Preview。

Test Report Evidence：

- Summary。
- Coverage。
- Bug List。
- Regression Result。
- Pass / Fail Summary。

字段名称和最终数据结构必须沿用 Task 10 已实现的 discriminated evidence model，
不得创建第二套 evidence schema。

### 5.2 Producer 与 Assignee 规则

- Producer 必须是已登记 desk/person。
- Assignee 必须与 Artifact 下游路径匹配。
- PRD：PM producer -> Dev assignee。
- Feature：Dev producer -> QA assignee。
- Test Report：QA producer -> 合法回传目标；以现有 route 配置为准。
- 离线 assignee 可以被分配并收到待处理任务，但不能被系统自动 Accept。
- Producer 与 Assignee 的候选项来自 `office-layout.json` 和当前 Scenario，不硬编码姓名。

### 5.3 提交语义

主要按钮：`Submit and Assign`

点击后：

1. 客户端完成结构验证。
2. 生成新的 `eventId`、`artifactId`、`correlationId` 和时间。
3. POST `/api/business-events`。
4. 服务端持久化并更新 Projection。
5. Office 中生产者开始向 Artifact Hub 交付。
6. Assignee 收到通知，但不会自动取件。

提交动作只产生标准 `artifact.submitted`。后续 delivered 由 motion/runtime
闭环产生，accepted 必须由独立操作产生。

### 5.4 Event Preview

- 默认折叠。
- 展示即将提交的脱敏 envelope。
- Evidence 可以结构化预览，但不使用可编辑 JSON textarea。
- eventId 等技术字段使用等宽字体并弱化。
- Preview 不显示 secret 或 Authorization。

### 5.5 成功回执

提交成功后展示：

- `Artifact submitted`
- Artifact title。
- Artifact ID。
- Producer -> Assignee。
- 事件接收结果：accepted / duplicate。
- `Open Office View`。
- `Create Another`。

若服务端返回 duplicate：

- 明确显示“该 eventId 已处理”。
- 不重复生成 Artifact。
- 不自动生成新的 eventId 并静默重试。

## 6. 预填机制

允许从 People 或 Artifacts 页面进入 Dispatch：

```text
/ops/dispatch?producerDeskId=pm-alice&category=prd&assigneeDeskId=dev-jack
```

规则：

- 只接受已知白名单字段。
- 无效值被忽略并显示非阻断提示。
- URL 不携带 evidence 正文。
- 用户仍需检查并提交。
- 预填不等于自动提交。

## 7. 数据与 API

复用：

```text
GET  /api/office-state
POST /api/business-events
GET  /api/internal/diagnostics
GET  /api/internal/recent-events?limit=5
```

如 Overview 缺少安全、稳定的聚合读模型，可以新增：

```text
GET /api/internal/operations-overview
```

要求：

- 返回值只能由 Projection、EventResultStore 和 RuntimeHealth 派生。
- 不得保存一份独立可写的统计。
- 不返回完整 evidence。
- 接口失败不影响 Office Projection。

## 8. 防重复与并发

- 提交期间按钮 disabled，并显示进度。
- 同一表单不得并行发出多个相同请求。
- 网络结果未知时保留 eventId，允许用户显式 Retry。
- Retry 使用同一个 eventId，以服务端幂等结果为准。
- 成功后才清空表单。
- 路由离开后不把异步结果写回已卸载组件。

## 9. 错误表达

字段错误：

- 在对应字段附近显示。
- 第一个错误获得焦点。

服务端错误：

- 400/422：展示安全、可修正的验证信息。
- 409：展示 eventId 内容冲突，不自动重试。
- 429：提示稍后重试。
- 5xx/Offline：保留用户输入和 eventId。

错误中不得显示绝对路径、stack、API key 或完整请求 headers。

## 10. 可访问性与响应式

- 表单控件都有显式 label。
- 错误摘要使用 `role="alert"`，成功回执使用 `role="status"`。
- 键盘可完成 Category、Producer、Assignee 选择和提交。
- 桌面使用两栏：表单主区 + Preview/Receipt 辅区。
- 窄屏改为单列，Preview 放在提交按钮之前或成功回执之后。
- 不能依靠 Artifact 颜色区分三类，必须显示类别文字和图标。

## 11. 测试

必须覆盖：

- Overview 所有统计从 Projection 派生。
- 同一 Artifact 不进入多个 Handoff 状态桶。
- Overview 接口局部失败不导致整个页面崩溃。
- PRD、Feature、Test Report 三类 evidence 校验。
- Producer/Assignee 路径约束。
- 离线 assignee 可以被分配但不会自动 Accept。
- query 参数预填、非法值忽略和 URL 不含 evidence。
- Submit 只产生 `artifact.submitted`。
- 提交与 Accept 分离。
- duplicate、conflict、429、offline 和 retry。
- 多次点击不会重复提交。
- 成功前不清空表单。
- Event Preview 脱敏。
- 移动端表单无横向溢出。

## 12. 浏览器验收

1. Overview 显示真实在线人数、Today、Handoff 和 System 摘要。
2. 在 Dispatch 创建 Alice -> Jack 的 PRD。
3. 成功回执显示 Artifact title 和 ID。
4. `/office` 中 Alice 携带 PRD 前往 Hub。
5. Jack 收到通知，但没有自动领取。
6. Overview 的 Awaiting Acceptance 随 Projection 更新。
7. 重复提交同一 eventId 不重复增加 PRD。
8. 模拟断网后输入仍保留，恢复后显式 Retry 成功。
9. 检查 console 和未处理 Promise 为 0。

## 13. 验收标准

- Operations 使用者可以通过标准表单创建三类 Artifact。
- 所有数量都是业务事件的结果，不是直接编辑结果。
- Assignment 与 Acceptance 保持分离。
- Overview 能说明业务交接概况，但不成为员工监控页面。
- Event Console 能力已具备可迁移的共享组件边界。
- Office 动画、Ledger、恢复和 SSE 无回归。
- 不修改 PNG。

