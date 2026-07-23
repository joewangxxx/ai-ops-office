# Task 13：External Event Gateway 设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Task 12
- 前置任务：Task 9 至 Task 12
- 后续依赖：Task 14

## 2. 目标

将当前依附于 Vite 开发服务器的 API 核心抽取为可独立运行的 Event Gateway，使真实或模拟的 PM、Dev、QA 系统能够通过标准接口驱动同一 Office Projection。

Event Console 继续存在，但定位变为测试事件生产者，不再代表唯一后端来源。

## 3. 非目标

- 不接入具体商业 SaaS。
- 不实现 OAuth、SSO 或完整 RBAC。
- 不建设消息队列集群。
- 不允许外部系统提交 `motion.completed`。
- 不让外部来源直接写 Hub count、人物坐标、光球或 Active Work。
- 不把 Gateway 变成员工行为采集器。

## 4. 运行形态

新增独立 Node server entry，复用现有 domain、ledger、projection 和 SSE 模块。

```text
apps/office-demo/
  src/
    backend/
      domain/
      application/
      storage/
      transport/
  server/
    main.ts
    config.ts
  vite.config.ts
```

边界：

- Domain：事件和状态规则。
- Application：幂等、ledger、projection、publisher。
- Transport：HTTP、SSE、错误映射。
- Vite plugin：开发环境适配器。
- Standalone server：生产式本地运行入口，可同时服务 `dist`。

不要求为了目录结构进行无关的大规模重构，迁移只围绕这些边界。

## 5. 外部标准入口

```text
POST /api/v1/events
Authorization: Bearer <api-key>
Content-Type: application/json
```

Body 是 Task 9 的 `BusinessEventEnvelope`。

外部入口第一版只允许：

- `artifact.submitted`
- `artifact.accepted`，仅供可信业务系统代替人工确认时使用

不接受系统派生事件和运行时信号：

- `artifact.delivered`
- `artifact.received`
- `projection.reset`
- `motion.completed`

## 6. 来源身份

API Key 配置映射到 source system：

```ts
type ApiClientConfig = {
  keyHash: string;
  sourceSystem: string;
  allowedEventTypes: string[];
};
```

规则：

- 不在配置文件或日志中保存明文 key。
- Gateway 使用认证结果覆盖 envelope 中的 `source.system`，防止来源伪造。
- 如果 envelope source 与认证来源不同，记录 sanitized warning。
- `source.actorId` 可以保留，但不能代替 assigneeDeskId 的业务校验。

## 7. 内部入口

保留同源内部接口：

- `/api/business-events`：Event Console。
- `/api/runtime-events`：motion runner。
- `/api/office-stream`：前端 SSE。
- `/api/office-state`：fallback polling。
- `/api/office-reset`：内部手动 reset。

生产启动时：

- `EVENT_CONSOLE_ENABLED=false` 为默认值。
- 只有显式启用且服务绑定 loopback 或受信内网时才显示 Event Console。
- 外部客户端永远不能调用 `/api/runtime-events` 和 `/api/office-reset`。

## 8. 配置

```text
OFFICE_HOST=127.0.0.1
OFFICE_PORT=4175
OFFICE_DATA_DIR=...
OFFICE_API_CLIENTS_FILE=...
OFFICE_CORS_ORIGINS=...
EVENT_CONSOLE_ENABLED=true|false
OFFICE_MAX_BODY_BYTES=262144
```

要求：

- 使用集中 config parser。
- 启动时验证配置并快速失败。
- 不将 secret 注入前端 bundle。
- `npm run dev` 继续使用 Vite plugin。
- 新增 `npm run server` 和可验证的 production start 方式。

## 9. HTTP 安全边界

- Body 默认最大 256 KB。
- 只接受 `application/json`。
- CORS 使用 allowlist，不使用 `*` 配合凭证。
- API Key 使用常量时间 hash 比较。
- 认证失败统一返回 401，不泄露 key 是否存在。
- 事件类型无权限返回 403。
- 事件业务冲突沿用 409。
- 每个 API client 使用简单令牌桶限流。
- 日志不写完整 evidence payload，不写 Authorization header。

## 10. Event Adapter

定义可选适配器接口，为未来真实系统保留边界：

```ts
interface IncomingEventAdapter<TInput> {
  readonly sourceSystem: string;
  canHandle(input: unknown): input is TInput;
  toBusinessEvent(input: TInput, context: AdapterContext): BusinessEventEnvelope<string, unknown>;
}
```

Task 13 只实现：

- `CanonicalEventAdapter`：接收标准 v1 envelope。
- 三份示例 fixture/script：PM 提交 PRD、Dev 提交 Feature、QA 提交 Report。

不实现 Jira、GitHub、GitLab 或测试平台专用适配器。

## 11. 响应和关联

响应沿用 Task 9：

```ts
{
  status: 'accepted' | 'duplicate';
  eventId: string;
  revision: number;
  snapshot?: OfficeSnapshot;
}
```

外部接口默认不返回完整 snapshot，避免无关数据外泄。内部 Event Console 可以继续接收 snapshot。

响应头增加：

```text
X-Correlation-ID: <generated-or-supplied>
```

客户端可以传合法的 `X-Correlation-ID`，否则 Gateway 生成。

## 12. Health Endpoint

```text
GET /healthz
GET /readyz
```

- healthz：进程是否存活，不访问敏感数据。
- readyz：ledger 可写、projection 已恢复、publisher 可用。
- 返回内容保持简短，详细诊断由 Task 14 内部接口提供。

## 13. 日志

使用结构化日志字段：

- timestamp
- level
- correlationId
- eventId
- eventType
- sourceSystem
- result
- durationMs
- reasonCode

禁止记录：

- Authorization。
- 完整 evidence。
- 员工屏幕或操作内容。
- 完整请求 body。

## 14. 测试

必须覆盖：

- Standalone server 启动和关闭。
- dist 静态文件服务。
- 标准 v1 event 接受。
- 无 key、错误 key、无权限 event type。
- source.system 防伪造。
- body 大小和 content-type。
- CORS allowlist。
- rate limit。
- duplicate eventId。
- 业务冲突和错误响应。
- 外部接口拒绝 derived/runtime/reset。
- healthz 和 readyz。
- Vite plugin 与 standalone server 对同一输入产生一致结果。
- 日志脱敏。

## 15. 浏览器与命令行验收

- 使用独立 server 启动构建后的应用。
- 使用 PowerShell 或 Node fixture 脚本提交 PRD。
- 浏览器通过 SSE 看到 Alice 交付和 Jack 通知。
- Jack 在 UI 中 Accept 后完成领取。
- 再提交 Feature 和 Report。
- 重启 server 后状态恢复。
- 错误 API key 不改变 Projection。
- 浏览器与服务端日志中没有敏感内容。

## 16. 验收标准

- 应用不依赖 Vite dev server 也能完整运行。
- 外部标准事件可以驱动同一 Projection。
- Event Console 和外部事件遵循同一业务契约。
- Runtime endpoint 不对外开放。
- API Key、限流、CORS 和 body limit 生效。
- 重启恢复、SSE 和轮询降级继续通过。
- 不修改 PNG 和地图布局。
- 全部测试、构建和端到端验收通过。
