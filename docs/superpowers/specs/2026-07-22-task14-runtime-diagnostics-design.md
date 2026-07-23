# Task 14：运行健康与异常表达设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Task 13
- 前置任务：Task 9 至 Task 13
- 里程碑：事件驱动 Office v1 收口

## 2. 目标

为内部使用者提供足够的系统运行信息，能够判断事件是否进入、Projection 是否健康、SSE 是否连接、是否存在 rejected event 或未完成交接。

诊断对象是平台运行状态，不是员工行为。

## 3. 非目标

- 不增加 AI Assisted 指标。
- 不展示员工在线时长、离线原因或键鼠活动。
- 不展示 Agent prompt、聊天、工具调用或屏幕内容。
- 不构建通用 APM 平台。
- 不在 Office Summary 混入技术指标。
- 不提供自动重放全部历史动画。

## 4. 信息架构

右侧面板形成三个一级视图：

- Inspect
- Event Console
- Diagnostics

规则：

- 默认仍是 Inspect。
- Diagnostics 只在内部模式显示。
- 切换视图不暂停 Office Map。
- Office Summary、Workspace Overview 和 Avatar Detail 不增加技术字段。
- 移动端使用现有 Inspector drawer，不新增独立页面。

## 5. Diagnostics Overview

### 5.1 System Health

展示：

- Overall：Healthy / Degraded / Offline。
- Gateway：Up / Down。
- Ledger：Writable / Read-only / Error。
- Projection：Ready / Recovering / Degraded。
- Current Epoch。
- Projection Revision。
- Last Accepted Sequence。

### 5.2 Live Connection

展示：

- Mode：SSE / Polling / Offline。
- SSE State：Connecting / Connected / Reconnecting。
- Last Snapshot Time。
- Reconnect Count。
- 当前是否处于 polling fallback。

不显示员工在线时长。

### 5.3 Event Intake

展示最近 20 条事件结果：

- 时间。
- eventId。
- eventType。
- sourceSystem。
- accepted / duplicate / rejected。
- reasonCode，仅 rejected 时显示。

不显示完整 payload 和 evidence。

### 5.4 Projection Runtime

展示：

- Active Motion：0 或 1。
- Motion Queue Count。
- Pending Delivery Count。
- Awaiting Acceptance Count。
- Collecting Count。
- Active Work Count。

这些是系统投影聚合，不显示某员工的细粒度操作轨迹。

### 5.5 Rejected Events

展示最近 20 条：

- rejectedAt。
- eventId，如果存在。
- eventType。
- sourceSystem。
- reasonCode。
- 安全错误摘要。
- correlationId。

第一版不提供一键重试，因为 rejected ledger 不保存完整 payload。使用者可以回到 Event Console 修正后重新提交新的 eventId。

## 6. Health Model

```ts
type RuntimeHealth = {
  overall: 'healthy' | 'degraded' | 'offline';
  gateway: 'up' | 'down';
  ledger: 'writable' | 'read_only' | 'error';
  projection: 'ready' | 'recovering' | 'degraded';
  epoch: number;
  revision: number;
  lastSequence: number;
  activeMotionCount: 0 | 1;
  motionQueueCount: number;
  updatedAt: string;
};
```

Overall 规则：

- Gateway up、ledger writable、projection ready：healthy。
- 可以读取 Projection 但 ledger 或 SSE 降级：degraded。
- 无法读取 Projection：offline。

## 7. API

内部接口：

```text
GET /api/internal/diagnostics
GET /api/internal/rejected-events?limit=20
GET /api/internal/recent-events?limit=20
GET /api/internal/diagnostic-bundle
```

要求：

- 只在 internal mode 开启。
- 使用与 Event Console 相同的内部访问边界。
- limit 最大 100。
- 不返回完整 evidence、API key、Authorization 或文件系统绝对路径。
- endpoint 错误不影响主 Projection SSE。

最近事件结果由有界 `EventResultStore` 提供：

```ts
interface EventResultStore {
  record(result: SanitizedEventResult): void;
  recent(limit: number): SanitizedEventResult[];
}
```

- 内存最多保留 100 条。
- 服务启动时可从 ledger 最后 20 条 accepted event 生成初始摘要。
- duplicate 只记录本次运行期间的结果，不为了诊断修改业务 ledger。
- rejected 的持久记录仍来自 `rejected-events.jsonl`。

## 8. Diagnostic Bundle

允许下载脱敏 JSON：

```ts
type DiagnosticBundle = {
  generatedAt: string;
  appVersion: string;
  schemaVersion: string;
  health: RuntimeHealth;
  connection: ProjectionConnectionState;
  recentEventResults: SanitizedEventResult[];
  rejectedEvents: RejectedEventRecord[];
};
```

文件名：

```text
office-diagnostics-YYYYMMDD-HHmmss.json
```

不得包含 Artifact evidence 正文和员工隐私数据。

## 9. 保留策略

- UI 最近 accepted/duplicate/rejected 合计最多 20 条。
- rejected JSONL 持久文件按大小轮转，默认单文件 5 MB，保留 5 个。
- 运行日志使用 Task 13 的结构化日志策略。
- Diagnostics API 读取失败显示局部错误，不让整个 Inspector 崩溃。

## 10. 交互

- Diagnostics 面板每 5 秒刷新一次聚合健康信息。
- SSE 连接状态直接来自 `useOfficeBackend`，不重复请求。
- Event Intake 和 Rejected Events 使用手动 Refresh，加轻量 loading 状态。
- 提供 `Download Diagnostic Bundle`。
- Reset Projection 仍留在 Event Console，不在 Diagnostics 重复。
- 不提供 Replay、Pause 或清空 Ledger。

## 11. 可访问性与布局

- 三个一级视图使用真正的 tabs 语义。
- 状态不只依赖颜色，必须有文字。
- 表格或列表在窄面板内可换行，不横向撑开 Office Map。
- 错误使用 `role=alert`，非紧急刷新状态使用 `role=status`。
- 技术 ID 使用等宽字体，但不能压过事件标题和结果。

## 12. 测试

必须覆盖：

- healthy、degraded、offline 聚合规则。
- Diagnostics tab 只在 internal mode 出现。
- SSE、polling、offline 三种连接展示。
- 最近事件限制 20 条。
- rejected event 脱敏。
- API limit 上限。
- diagnostic bundle 不包含 evidence、Authorization、API key 和绝对路径。
- 下载文件名和 JSON 结构。
- Diagnostics 请求失败不影响 Inspect、Event Console 和 Office Map。
- 切换 tab 不打断 motion。
- 移动端无溢出。

## 13. 浏览器验收

- 正常启动时显示 Healthy 和 SSE Connected。
- 强制关闭 SSE 后显示 Polling/Degraded，Office Map 继续更新。
- 恢复 SSE 后回到 Healthy。
- 提交非法事件后 Rejected Events 出现脱敏记录。
- 提交重复 eventId 显示 duplicate，不重复生成 Artifact。
- 下载 Diagnostic Bundle 并检查无敏感字段。
- 交接动画期间打开和关闭 Diagnostics 不影响 motion。
- 浏览器无未处理异常。

## 14. 验收标准

- 内部使用者可以判断 Gateway、Ledger、Projection 和连接是否健康。
- rejected event 有可追踪但脱敏的记录。
- Diagnostics 不进入 Office Summary。
- 不展示员工行为监控信息。
- 主业务链路在诊断接口失败时仍可运行。
- Event Console、外部 Gateway、SSE 和恢复流程无回归。
- 不修改 PNG 和地图布局。
- 全部自动化、构建与浏览器验收通过。
