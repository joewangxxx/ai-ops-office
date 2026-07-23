# Task 10：Artifact Evidence Model 设计 Spec

## 1. 文档状态

- 状态：Ready for implementation after Task 9
- 前置任务：Task 9 Business Event Contract v1
- 后续依赖：Task 11、Task 13

## 2. 目标

将 Artifact 从“带标题和状态的通用文件”升级为可理解、可审查、岗位差异化的标准业务对象。

Task 10 重点回答：每个岗位交付的到底是什么，而不是只显示“这个岗位做完了”。

## 3. 非目标

- 不实现真实文件上传和对象存储。
- 不展示完整代码仓库、完整测试日志或聊天上下文。
- 不做富文本编辑器。
- 不增加新的 Artifact 类别。
- 不把 Artifact 图标放在员工桌面上。
- 不改变现有交接动画。

## 4. 统一 Artifact 结构

```ts
type ArtifactBase = {
  id: string;
  title: string;
  category: 'prd' | 'feature' | 'report';
  status: ArtifactStatus;
  submittedBy: string;
  confirmedBy: string;
  acceptedBy: string;
  evidence: ArtifactEvidence;
};

type ArtifactEvidence =
  | PrdEvidence
  | FeatureEvidence
  | TestReportEvidence;
```

`category` 与 `evidence.kind` 必须一致。

## 5. PRD Evidence

```ts
type PrdEvidence = {
  kind: 'prd';
  summary: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  scope: string[];
  userStories: Array<{
    id: string;
    statement: string;
  }>;
  acceptanceCriteria: string[];
};
```

详情展示顺序：

1. Status 与责任链。
2. Summary。
3. Priority。
4. Scope。
5. User Stories。
6. Acceptance Criteria。

## 6. Feature Evidence

```ts
type FeatureEvidence = {
  kind: 'feature';
  summary: string;
  commits: Array<{
    sha: string;
    message: string;
  }>;
  changedFiles: number;
  build: {
    status: 'pending' | 'passed' | 'failed';
    reference?: string;
  };
  previewUrl?: string;
  apiContracts: string[];
};
```

详情展示顺序：

1. Status 与责任链。
2. Summary。
3. Build。
4. Commits。
5. Changed Files。
6. Preview。
7. API Contracts。

不在 Inspector 中直接渲染大段 diff。Commit、Preview 和 API Contract 只展示简洁证据和安全链接。

## 7. Test Report Evidence

```ts
type TestReportEvidence = {
  kind: 'report';
  summary: string;
  result: 'passed' | 'failed' | 'blocked';
  testCases: {
    total: number;
    passed: number;
    failed: number;
  };
  coverage?: number;
  regression: 'passed' | 'failed' | 'not_run';
  bugs: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'fixed' | 'verified';
  }>;
};
```

约束：

- `passed + failed <= total`。
- coverage 如果存在，范围为 0 到 100。
- result 为 passed 时，failed 必须为 0，且不能存在 open critical bug。

## 8. 事件契约扩展

Task 9 的 `artifact.submitted` payload 扩展为：

```ts
type ArtifactSubmittedPayload = {
  artifact: {
    id: string;
    title: string;
    category: ArtifactCategory;
    evidence: ArtifactEvidence;
  };
  producerDeskId: string;
  assigneeDeskId: string;
};
```

验证必须在 API 和 domain 两层完成。Domain 不信任 React 表单已经校验。

## 9. Event Console 输入

Event Console 根据 Category 展示最小必要字段。

### PRD

- Summary：必填。
- Priority：必填，默认 P1。
- Scope：每行一项，至少一项。
- User Stories：每行一项，至少一项。
- Acceptance Criteria：每行一项，至少一项。

### Feature

- Summary：必填。
- Commit SHA 和 Message：至少一条。
- Changed Files：非负整数。
- Build Status：必填。
- Preview URL：可选，仅允许 http/https。
- API Contracts：可选，每行一项。

### Test Report

- Summary：必填。
- Result：必填。
- Total、Passed、Failed：必填非负整数。
- Coverage：可选。
- Regression：必填。
- Bugs：允许 0 条，逐条包含 ID、Title、Severity、Status。

表单保持结构化，不提供自由 JSON 编辑器。

## 10. Artifact Detail

沿用现有下钻：

```text
Today Output / Artifact Hub Count
-> Artifact title list
-> Artifact Detail
```

详情原则：

- 标题包含版本时，不增加单独 Version 字段。
- 不显示 Type、Source、Target。
- 保留 Status、Submitted By、Confirmed By、Accepted By。
- 证据内容按 category 使用独立组件，不使用一个万能 key-value 列表。
- 空的可选字段直接隐藏，不显示 `N/A` 卡片。
- URL 使用安全的新窗口链接，并增加 `noopener noreferrer`。
- 长列表可折叠，但默认必须露出 Summary 和关键结论。

建议组件边界：

```text
ArtifactDetail
  PrdEvidencePanel
  FeatureEvidencePanel
  TestReportEvidencePanel
```

## 11. Today Output 与 Hub

- Hub 屏幕仍只显示三类数量，不增加证据摘要。
- Today Output 点击后仍先显示标题列表。
- 只有点击具体标题才加载和显示 Evidence。
- Latest Handoff 只显示业务事件摘要，不展示证据内容。
- Artifact 在 carrier 状态不可点击。

## 12. 初始数据迁移

现有 demoScenario 中的 Artifact 必须补齐合法 evidence fixture。

要求：

- fixture 内容简洁但语义真实。
- 不使用占位文字或空数组冒充已完成产物。
- 不依赖网络资源即可完成测试。
- 保持现有 Artifact ID 和标题，避免破坏引用。

## 13. 错误与兼容

- v1.0 事件缺少 evidence 时返回 400。
- legacy 迁移适配器可以补充明确标记的 `legacy-summary` evidence，但新事件不得使用该路径。
- evidence 与 category 不匹配返回 400。
- 不允许未知字段被静默解释为其他类别。
- 前端错误后保留全部已填写字段。

## 14. 测试

必须覆盖：

- 三种 evidence 类型的合法和非法 payload。
- category 与 evidence.kind 不一致。
- PRD 最小字段和列表验证。
- Feature URL、commit 和 build 验证。
- Test Report 数量、coverage 和 passed 约束。
- Event Console 分类切换与字段清理。
- Event Preview 包含结构化 evidence。
- 三种 Artifact Detail 独立渲染。
- Hub count、Latest Handoff 和移动 Artifact 不回归。
- XSS 敏感文本以普通文本渲染，不使用 `dangerouslySetInnerHTML`。

## 15. 验收标准

- 三类 Artifact 具有稳定、差异化 evidence 类型。
- Event Console 能创建三类合法 Artifact。
- 点击 Artifact 能看到对应岗位证据。
- 不显示 Type、Source、Target、独立 Version。
- 不显示大段代码、日志或聊天 Context。
- 原有交接状态机与视觉零回归。
- 不修改 PNG。
- 全部测试、资产验证、构建和浏览器控制台检查通过。
