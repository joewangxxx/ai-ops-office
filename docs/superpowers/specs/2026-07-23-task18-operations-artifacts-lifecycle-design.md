# Task 18：Artifacts Registry 与生命周期设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Operations Console Task 17
- 前置任务：Task 15 至 Task 17 Operations Console Specs
- 后续任务：Task 19、Task 20

## 2. 目标

建立企业可审查的 Artifact Registry，让内部使用者能够：

- 找到具体 PRD、Feature 或 Test Report。
- 看清谁生产、分配给谁、当前处于哪个交接状态。
- 查看岗位差异化 Evidence。
- 查看从 Submitted 到 Received 的生命周期时间线。
- 在合法条件下完成独立 Accept 操作。

Artifact 页面是标准化业务对象的读模型，不是通用文件管理器。

## 3. 非目标

- 不编辑、删除或替换已提交 Artifact。
- 不上传任意附件。
- 不把 PRD、Feature、Test Report 都渲染成相同文件卡片。
- 不展示完整聊天 Context、大段源代码或完整测试日志。
- 不允许手动修改 Artifact status、location 或 Hub 数量。
- 不实现重放历史动画。

## 4. 路由与页面结构

主路由：

```text
/ops/artifacts
```

详情使用 URL 可恢复的选择状态：

```text
/ops/artifacts?artifactId={artifactId}
```

桌面：

- 顶部搜索与筛选。
- 左侧/主区为 Artifact Table。
- 右侧为 Artifact Detail drawer。

移动端：

- 列表改为紧凑行。
- 详情全屏打开。
- 浏览器返回键可以关闭详情并保留筛选。

## 5. Artifact Table

### 5.1 列

- Title。
- Category。
- Producer。
- Assignee。
- Lifecycle State。
- Updated。

Title 是主识别信息。Artifact ID 使用辅助等宽文本，不占主列。

### 5.2 搜索与筛选

搜索：

- Title。
- Artifact ID。

筛选：

- Category：PRD / Feature / Test Report。
- Lifecycle State。
- Producer。
- Assignee。
- Workspace。

排序：

- Updated，默认降序。
- Title。
- Submitted time。

所有条件同步到 URL query。

### 5.3 分页

- 默认每页 25。
- 可选 25 / 50 / 100。
- 最大 100。
- 使用服务端 cursor 或稳定分页键，不能只截取前端当前数组。
- 结果变化时不能出现重复行或漏行。

## 6. 统一生命周期读模型

现有领域内部状态与 UI 文案必须通过 selector 显式映射：

| 业务阶段 | 主要事实 | Operations 文案 |
|---|---|---|
| Submitted / Producer moving | `artifact.submitted`，生产者交付中 | Delivering |
| Stored in Hub | `artifact.delivered` | Awaiting Acceptance |
| Human confirmed | `artifact.accepted` | Accepted |
| Assignee moving to/from Hub | active collecting motion | Collecting |
| Arrived at assignee desk | `artifact.received` | Active Work |

约束：

- 每个 Artifact 在同一快照中只有一个当前 Operations 状态。
- `Accepted` 可以是极短的过渡状态；如果取件 motion 已开始，则显示 Collecting。
- `Active Work` 表示 Artifact 已进入接收者工作列表，不代表屏幕或键盘正在活动。
- 状态映射集中在领域 selector，不散落在多个 React 组件。
- 现有 `pending_delivery / available / accepted / completed` 等内部字段不能直接作为用户文案。

### 6.1 Baseline Artifacts

启动 Scenario 中可能存在没有完整 Ledger 历史的基线 Artifact：

- 仍然出现在 Registry。
- 当前状态从 Projection 派生。
- 时间线显示 `Baseline state loaded`，不伪造 submitted/delivered 时间。
- UI 明确说明“完整事件历史仅适用于事件驱动后新增 Artifact”。

## 7. Artifact Detail

### 7.1 Summary

展示：

- Title。
- Category。
- Current lifecycle state。
- Producer。
- Assignee。
- Submitted by。
- Reviewed/Confirmed by。

不单独显示冗余 Type、Source、Target、Version 字段。版本信息如存在，保留在 title 中。

### 7.2 Role-specific Evidence

PRD：

- Summary。
- User Stories。
- Acceptance Criteria。
- Priority。
- Scope。

Feature：

- Summary。
- Commits。
- Changed Files。
- Build status/reference。
- API Contracts。
- Preview URL。

Test Report：

- Summary。
- Pass / Fail / Blocked。
- Test case summary。
- Coverage。
- Regression。
- Bug List。

必须复用 Task 10 的 discriminated evidence renderers。不得使用
`dangerouslySetInnerHTML`。

### 7.3 Responsibility

展示：

- Producer name + Workspace。
- Assignee name + Workspace。
- 当前需要行动的一方。

当 Awaiting Acceptance 时，明确显示：

```text
Waiting for Jack to accept
```

### 7.4 Lifecycle Timeline

按时间升序展示：

- Submitted。
- Delivered to Artifact Hub。
- Accepted。
- Received / Active Work。

每项包含：

- 时间。
- 人类可读动作。
- Actor。
- 技术 eventId，可折叠。

使用 `correlationId`、`causationId` 和 `artifactId` 关联，不依赖文案字符串匹配。

### 7.5 Actions

只有合法时显示：

- `Accept as {Assignee}`：提交标准 `artifact.accepted`，带确认。
- `Create Follow-up Artifact`：进入 Dispatch，并预填合法 producer/category；不自动提交。

不提供：

- Edit status。
- Move to Hub。
- Mark Active。
- Delete。
- Replay animation。

## 8. 内部读模型 API

建议新增：

```text
GET /api/internal/artifacts
GET /api/internal/artifacts/:artifactId
GET /api/internal/artifacts/:artifactId/events
```

列表 query：

```text
cursor
limit
query
category
state
producerDeskId
assigneeDeskId
workspaceId
sort
direction
```

响应示例：

```ts
type PaginatedArtifacts = {
  items: OperationsArtifactSummary[];
  nextCursor: string | null;
  total: number;
};
```

要求：

- 仅 internal mode。
- limit 最大 100。
- artifactId 和所有筛选值严格验证。
- 列表不返回完整 evidence。
- 详情按角色返回已验证 evidence。
- timeline 返回脱敏业务事件摘要。
- 不返回 API key、Authorization、绝对路径或 runtime motion payload。
- 404、400 和 500 有明确、安全的响应。

读模型可从当前 Projection 与 Ledger 组合构建，但不得成为新的写入源。

## 9. 实时一致性

- 当前页订阅 Office Projection。
- 新 Artifact 提交后自动出现在列表顶端。
- 生命周期状态随 delivered、accepted、received 更新。
- 详情打开时保留当前 selection 和滚动位置。
- SSE 断开时显示最后更新时间；polling 接管后继续更新。
- epoch reset 后，旧详情如果已不存在则关闭并显示说明。
- 旧 epoch/revision 不得覆盖新页面数据。

## 10. 错误与空状态

- 无结果：显示“没有匹配的 Artifact”，保留清除筛选动作。
- 详情加载失败：列表仍可用。
- Timeline 失败：Evidence 和 Summary 仍可显示。
- Artifact 被 reset 移除：关闭详情并提示。
- Accept 409：刷新该 Artifact 状态，不假定失败或成功。
- Preview URL 使用安全外链属性，不自动嵌入未知页面。

## 11. 可访问性

- 表格有可访问名称和列标题。
- 筛选器可键盘操作。
- 详情 drawer 有 dialog 语义和焦点管理。
- Timeline 使用有序列表。
- Artifact 类别和状态有文字，不只依赖蓝/绿/紫颜色。
- 代码、commit SHA 和 event ID 可换行，不撑破容器。

## 12. 测试

必须覆盖：

- 三类 Artifact 列表和 Evidence 渲染。
- 状态 selector 的全部映射和互斥性。
- Baseline Artifact 不伪造时间线。
- 搜索、筛选、排序、分页和 URL 恢复。
- 最大 limit 100。
- 无效 artifactId 和 query 参数。
- timeline 按 correlation/causation 关联。
- 列表不泄露 evidence 正文。
- Accept 动作只在合法状态显示。
- Accept 产生标准事件且幂等。
- epoch reset 后旧详情关闭。
- SSE/polling 更新不重复 Artifact。
- 外链安全属性。
- 移动端列表与详情无溢出。

## 13. 浏览器验收

1. Registry 显示现有 PRD、Feature、Test Report。
2. 打开一个基线 Artifact，看到当前状态和 baseline timeline 提示。
3. 从 Dispatch 提交 Alice -> Jack PRD。
4. 列表实时出现并显示 Delivering。
5. Alice 到 Hub 后变为 Awaiting Acceptance。
6. 在详情点击 Accept as Jack。
7. Jack 取件时显示 Collecting。
8. 收件后显示 Active Work，People 中 Jack 也出现相同工作项。
9. Timeline 按 Submitted、Delivered、Accepted、Received 排列。
10. 筛选、深链刷新、移动端详情和浏览器返回键均正确。
11. console 和未处理异常为 0。

## 14. 验收标准

- Artifact 是可搜索、可审查、可追踪的标准化业务对象。
- 三类 Evidence 有岗位差异。
- 生命周期与 Event Ledger、Projection 一致。
- 页面不直接编辑业务状态。
- Assignment、Acceptance 和 Received 语义清楚。
- 与 Overview、People 和 Office 的状态一致。
- 不修改 PNG。

