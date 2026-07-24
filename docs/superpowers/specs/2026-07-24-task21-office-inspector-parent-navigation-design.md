# Task 21：Office Inspector 上一级返回导航设计 Spec

## 1. 文档状态

- 状态：Approved for implementation
- 前置任务：Operations Console Task 15–Task 20
- 用户确认：返回按钮必须回到刚才的上一级，不得固定跳回 Office Summary

## 2. 问题定义

Office Inspector 当前只保存一个 `Selection`。用户从 Office Summary、Workspace、Artifact Hub 或 Person 中的 Artifact 列表进入具体 Artifact 后，原选择及其展开状态会被覆盖。

典型失败路径：

```text
Office Summary
  -> Today
  -> Test Reports（展开）
  -> 具体 Test Report
  -> 无法返回刚才展开的 Test Reports
```

`Today` 分类属于 `InspectorContent` 的局部 disclosure 状态，并不是现有 `Selection`。因此，仅把 `selection` 从 Artifact 改回 `{ kind: 'office' }` 仍不够：页面会回到折叠后的 Office Summary，而不是用户刚才看到的 Test Reports 列表。

## 3. 目标

为 Inspector 建立轻量、可恢复的层级导航：

- 进入具体 Artifact 后显示明确的上一级返回按钮。
- 返回后恢复原 Inspector 页面及原展开分类。
- `Office Summary -> Today -> Test Reports -> Report` 返回到展开的 Test Reports。
- `Workspace -> Today Output -> Artifact` 返回到对应 Workspace 且恢复展开项。
- `Artifact Hub -> Category -> Artifact` 返回到 Hub 且恢复对应分类。
- `Avatar -> Active Work -> Artifact` 返回到原人物详情。
- 不把 Inspector 改造成 URL 路由，不干扰浏览器前进/后退。

## 4. 非目标

- 不新增 Artifact 编辑、删除或状态修改能力。
- 不改变 Office 与 Operations 的页面路由。
- 不为 Inspector Artifact 详情新增深链 URL。
- 不恢复 Event Console、Diagnostics、Reset 或其他后台能力。
- 不修改 Office 场景、坐标、动效或 PNG 资产。

## 5. 导航模型

### 5.1 Inspector frame

引入一个只属于 Office Inspector 的导航 frame 概念。每个 frame 至少包含：

- 当前 `Selection`。
- 当前受控 disclosure 状态。
- 返回按钮使用的上下文标签。
- 用于恢复焦点的稳定目标标识（如果原触发器仍存在）。

建议的语义模型：

```text
InspectorFrame
  selection
  disclosure
  label
  focusTarget
```

`disclosure` 只表示当前 Inspector 层级需要恢复的展开项，例如：

- Office Summary 的 Today metric label。
- Workspace 的 Today Output metric label。
- Artifact Hub 的 Artifact category。
- 无展开状态时为 `null`。

具体 TypeScript 结构由实现决定，但必须使用可判别联合或等价的严格类型，不能使用任意字符串对象或 `any`。

### 5.2 历史栈规则

`OfficeApp` 是 Inspector 导航状态的唯一所有者：

- `currentFrame` 表示当前 Inspector 内容。
- `history` 保存可返回的上一级 frame。
- 从 Inspector 内的列表进入下一层时，把完整的当前 frame 压栈，再切换到目标 selection。
- 点击 Back 时弹出并恢复最后一个 frame。
- 选择新的顶层 Office 场景对象时，视为新的浏览起点并清空旧历史，避免在地图对象之间累积无意义历史。
- 点击 “Show Office Summary” 或移动端 Close 时回到 Office Summary，并清空历史。
- 不向 `window.history` 写入 Inspector frame。
- 不持久化到 localStorage、sessionStorage 或后端。

## 6. 组件职责

### 6.1 `OfficeApp`

- 维护 current frame 与 history。
- 区分“Inspector 内继续查看”和“Office 场景顶层选择”。
- 提供 `navigateInspector`、`goBack`、`resetInspector` 或语义等价的回调。
- 当当前 Artifact 因新 epoch 或投影变化不存在时，安全回到最近仍有效的父 frame；父 frame 也无效时回到 Office Summary，并清理无效历史。

### 6.2 `InspectorShell`

- 在 header 中显示返回按钮。
- 仅在 history 非空时渲染。
- 按钮文案包含上一级上下文，例如 `Back to Test Reports`、`Back to Artifact Hub`、`Back to Jack`。
- Back 与移动端 Close 是两个不同动作：Back 恢复上一级，Close 回到 Office Summary。
- 保留 Escape 的现有移动端关闭行为，不把 Escape 改成逐层返回。

### 6.3 `InspectorContent`

- 把需要恢复的 disclosure 从不可观察的局部状态提升为受控状态，或通过等价接口将变化同步给 `OfficeApp`。
- `ArtifactList` 进入 Artifact 时必须同时传递父级 label 与 focus target。
- 不在每个详情组件内各自实现一套返回按钮。
- 非导航型 disclosure（例如 Latest Handoff 展开/折叠）可以继续保留局部状态，因为它不是进入 Artifact 的父层。

## 7. 交互和可访问性

- 返回按钮位于 Inspector header 的稳定位置，桌面和移动端都可见。
- 可访问名称必须包含目标，例如 `Back to Test Reports`。
- 返回后优先把焦点还给刚才打开 Artifact 的按钮；若该按钮已不存在，则聚焦恢复页面的主标题。
- 不依赖只有图标才能理解的返回控件；箭头可以作为装饰，但必须有文本或完整 aria-label。
- 键盘用户可通过 Tab 到达返回按钮，并可用 Enter/Space 激活。
- 返回不得重置 Inspector 的无关页面滚动，除非原内容已经不存在。
- reduced-motion 模式下不得新增过渡动画。

## 8. 状态变化和异常处理

- 实时 projection 更新时，history 中的 frame 不复制业务实体，只保存选择标识；恢复时使用最新 projection 渲染。
- Artifact 标题变化时返回标签可以使用最新可用标题或保存的父级上下文标签，但不得显示 `undefined`。
- reset epoch 后，失效的 Artifact frame 不得造成空白 Inspector、异常或无限返回循环。
- 快速重复点击 Artifact 不得重复压入相同 frame。
- Back 连续点击按 LIFO 顺序逐级返回，直到 history 为空。

## 9. 自动化测试

至少新增或扩展以下覆盖：

1. Office Summary 展开 Test Reports，进入具体 Report，Back 返回展开的 Test Reports。
2. Workspace Today Output -> Artifact -> Back 恢复对应 Workspace metric。
3. Artifact Hub category -> Artifact -> Back 恢复对应 category。
4. Avatar Active Work -> Artifact -> Back 返回人物详情。
5. 无历史时不显示 Back。
6. 新的地图顶层选择清空旧历史。
7. Close 与 Show Office Summary 清空历史并回到 Summary。
8. 返回后焦点恢复到原 Artifact 触发器，触发器不存在时聚焦父标题。
9. projection 更新时父页面使用最新数据，不回放旧 snapshot。
10. reset epoch 或 Artifact 消失时安全回退，无 console error。

不得删除或弱化现有 Inspector、Office 场景、Artifact Evidence 和键盘测试。

## 10. 浏览器验收

### Desktop 1440 × 900

- Office Summary -> Today -> Test Reports -> 具体 Report。
- 确认 Artifact 详情存在 `Back to Test Reports`。
- 点击后 Test Reports 仍展开，原 Report 触发器重新获得焦点。
- 从 Workspace、Hub、Avatar 三条入口重复验证父级正确。

### Mobile 390 × 844

- Back 与 Close 均可见且含义不同。
- Back 不关闭 Inspector；Close 回到 Office Summary。
- header 无横向溢出。

每个场景检查 `console.error`、`pageerror` 和 `unhandledrejection` 为 0，并保存：

```text
output/playwright/task21-report-back-to-parent.png
output/playwright/task21-hub-back-to-parent.png
output/playwright/task21-mobile-back-navigation.png
```

## 11. 验收标准

- Artifact 详情永远有与实际来源一致的上一级返回路径。
- 返回恢复父页面及相关展开项，不固定跳回 Office Summary。
- Back、Close、浏览器 Back 三者职责清晰且互不污染。
- 实时投影、reset epoch 和无效 Artifact 不造成空白或错误历史。
- Office Inspector 仍是 Inspect-only。
- 所有自动化、构建、浏览器和资产检查通过。

