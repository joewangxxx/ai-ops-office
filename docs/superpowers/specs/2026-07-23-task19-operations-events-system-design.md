# Task 19：Events 与 System Operations 设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Operations Console Task 18
- 前置任务：Task 15 至 Task 18 Operations Console Specs
- 后续任务：Task 20

## 2. 目标

把当前 Inspector 中的 Diagnostics 能力迁移并升级为两个职责清晰的后台页面：

- Events：查看业务事件进入系统后的 accepted、duplicate 和 rejected 结果。
- System：检查 Gateway、Ledger、Projection、连接与 motion queue，并执行受保护的
  Projection Reset。

这两个页面用于平台运维，不用于监控员工。

## 3. 非目标

- 不展示员工屏幕、键鼠、聊天、prompt 或工具调用。
- 不构建通用日志搜索平台。
- 不提供 rejected event 一键重试。
- 不清空 Ledger。
- 不修改历史业务事件。
- 不恢复 Pause、Play、Replay 或整段故事播放。
- 不把技术指标放回 Office Summary。

## 4. Events 页面

路由：`/ops/events`

### 4.1 Event Result Table

列：

- Time。
- Result：Accepted / Duplicate / Rejected。
- Event Type。
- Artifact title，如果安全可解析。
- Source System。
- Event ID。
- Correlation ID。

默认按时间降序。

### 4.2 搜索与筛选

筛选：

- Result。
- Event Type。
- Source System。
- 时间范围。

搜索：

- eventId。
- correlationId。
- Artifact title。

所有筛选同步到 URL query。

### 4.3 Event Detail

点击一行打开详情 drawer：

- 时间。
- Result。
- eventType。
- sourceSystem。
- actorId，如果存在。
- eventId。
- correlationId。
- causationId。
- reasonCode 和安全错误摘要，仅 rejected。

Accepted event：

- 可以显示脱敏 envelope metadata。
- Evidence 默认折叠，并遵循 Task 10 的安全展示。

Duplicate event：

- 显示“相同 eventId 已被处理”。
- 如果是内容冲突，显示 conflict reason，但不回显完整冲突 payload。

Rejected event：

- 不展示原始 body。
- 不提供 Retry，因为 rejected ledger 不保留完整 payload。
- 提供 `Create corrected event`，跳转 Dispatch 创建新的 eventId；只能预填安全字段。

### 4.4 分页与保留

- 默认 25，最大 100。
- accepted 可从 Ledger 建立稳定摘要。
- duplicate 可以只保留当前运行期间的结果，并在 UI 标注保留边界。
- rejected 从 rotated rejected JSONL 读取。
- 不为展示 duplicate 而写入业务 Ledger。

## 5. Events API

建议统一为：

```text
GET /api/internal/event-results
GET /api/internal/event-results/:resultId
```

query：

```text
cursor
limit
result
eventType
sourceSystem
from
to
query
```

兼容规则：

- 现有 `/api/internal/recent-events` 和 `/api/internal/rejected-events` 可以保留，
  但新页面应使用统一、分页的 read service。
- 不为统一接口改变业务 Ledger 的 append-only 语义。
- resultId 是读模型 ID，不成为业务 eventId。

安全要求：

- 仅 internal mode。
- limit 最大 100。
- 不返回 Authorization、API key、secret、绝对路径或完整未知 payload。
- error message 经过安全映射。
- 时间范围有最大跨度或分页保护，避免一次扫描无界 Ledger。

## 6. System 页面

路由：`/ops/system`

当前 `DiagnosticsPanel` 应拆成可复用的 Operations System sections，而不是复制：

```text
System Health
Live Connection
Projection Runtime
Rejected Event Summary
Diagnostic Bundle
Reset Projection
```

### 6.1 System Health

展示：

- Overall：Healthy / Degraded / Offline。
- Gateway：Up / Down。
- Ledger：Writable / Read-only / Error。
- Projection：Ready / Recovering / Degraded。
- Current Epoch。
- Projection Revision。
- Last Accepted Sequence。

### 6.2 Live Connection

展示：

- Mode：SSE / Polling / Offline。
- SSE State。
- Last Snapshot Time。
- Reconnect Count。
- Polling Fallback。

连接数据优先复用当前 `useOfficeBackend`，不额外创建第二个 SSE。

### 6.3 Projection Runtime

展示系统聚合：

- Active Motion。
- Motion Queue Count。
- Pending Delivery Count。
- Awaiting Acceptance Count。
- Collecting Count。
- Active Work Count。

这些是 Artifact 流程状态，不是员工电脑活动。

### 6.4 Rejected Summary

- 最近 rejected 数量。
- 按 reasonCode 聚合。
- `Open Events` 进入已筛选 Events 页面。
- 不在 System 重复实现完整 rejected table。

### 6.5 Diagnostic Bundle

迁移现有下载能力：

- 文件名 `office-diagnostics-YYYYMMDD-HHmmss.json`。
- 包含 health、connection、recent sanitized results 和 rejected summaries。
- 不含 evidence 正文、secret、Authorization、绝对路径或员工隐私。

### 6.6 Reset Projection

Reset 只存在于 System：

- 按钮使用危险动作视觉，但不过度强调。
- 第一次点击打开确认对话框。
- 对话框解释：创建新 epoch，重置当前 Projection；不会删除历史 Ledger。
- 要求输入 `RESET` 或进行明确二次确认。
- 确认后提交内部标准 `projection.reset` 事件。
- Reset pending 时禁止重复提交。
- 成功后等待新 epoch 快照，不手动清空前端数组。
- 失败时保留当前页面和 Projection。

不得提供 Clear Ledger。

## 7. 诊断失败隔离

- `/api/internal/diagnostics` 失败不影响 Office SSE。
- Events 失败不影响 Dispatch。
- Diagnostic Bundle 下载失败只显示局部错误。
- System 自动刷新失败时保留最后成功值和时间。
- System Overview 每 5 秒刷新；Events 使用用户筛选和分页请求。
- 页面隐藏时降低或暂停非必要诊断轮询。

## 8. 安全与隐私

必须持续保证：

- Operations Console 关闭时所有 internal endpoints 返回 404。
- 不在客户端注入 secret。
- API 日志不记录 Authorization。
- Event Detail 不使用未验证 JSON 直接渲染 HTML。
- sourceSystem 和所有字符串按文本渲染。
- 不展示员工在线时长、离线原因或行为轨迹。

## 9. 可访问性与响应式

- Events 表格有 caption 和可访问列标题。
- 状态结果使用文字、图标和颜色三重表达。
- drawer 和 Reset dialog 有正确焦点管理。
- 自动刷新使用 `role="status"`，不反复打断读屏。
- 技术 ID 可复制、可换行。
- 移动端 Events 使用列表式行，System 单列。
- Reset 按钮与常规主按钮保持空间分离。

## 10. 测试

Events 必须覆盖：

- accepted、duplicate、rejected 三类结果。
- 搜索、筛选、时间范围、分页和 URL 恢复。
- accepted 从 Ledger 恢复。
- duplicate 的当前运行保留说明。
- rejected 从轮转文件读取。
- corrected event 使用新 eventId。
- 不泄露 payload、evidence、Authorization、API key 或绝对路径。
- internal mode 关闭时返回 404。

System 必须覆盖：

- healthy、degraded、offline 聚合。
- SSE、polling、offline 展示。
- 只建立一个 SSE。
- Diagnostics 请求失败隔离。
- bundle 文件名和脱敏。
- Reset 二次确认。
- Reset 产生标准 `projection.reset`。
- Reset 创建新 epoch、不删除 Ledger、不直接清空前端状态。
- 重复 Reset 防护。
- 页面隐藏时诊断刷新策略。
- 不存在员工监控字段。

## 11. 浏览器验收

1. 提交合法 Artifact，Events 出现 Accepted。
2. 再提交相同 eventId，Events 出现 Duplicate，Office 不重复新增。
3. 提交非法事件，Events 出现 Rejected 和安全 reasonCode。
4. 打开 Event Detail，确认无完整敏感 payload。
5. System 显示 Gateway、Ledger、Projection 和 SSE 状态。
6. 断开 SSE，System 显示 Polling/Degraded，Office 继续更新。
7. 恢复 SSE，System 回到 Connected/Healthy。
8. 下载 Diagnostic Bundle 并检查脱敏。
9. 执行 Reset 二次确认，新 epoch 生效，Ledger 历史保留。
10. 重新启动 standalone server，System 和 Events 恢复正确。
11. console 和未处理异常为 0。

## 12. 验收标准

- Events 可以追踪事件接收结果，但不成为原始 payload 泄露窗口。
- System 可以判断运行健康并安全 Reset Projection。
- Event Console 和 Diagnostics 能力已从 Office 具备迁移条件。
- 所有后台 API 受 internal mode 保护。
- 运维信息不混入员工与 Office Summary。
- Ledger、恢复、SSE 和 Gateway 无回归。
- 不修改 PNG。

