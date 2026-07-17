# 28 张 Horizontal Avatar 独立完成性审计草稿

> Historical midpoint snapshot only (12/28 at capture time). It is superseded by `docs/avatar-horizontal-asset-generation-report.md`, `asset-status-manifest.json`, and the final `horizontal-validation.json`; do not use this draft as the completion decision.

审计快照：`2026-07-17T10:03:18+08:00`  
权威规范：`docs/avatar-horizontal-generation-goal-prompt.md`  
结论：**Goal 尚未完成，不得宣称 28/28。** 当前正式白名单命中 `12/28`，其余 `16` 个正式路径缺失；最终 JSON、manifest、正式 prompt set、两张全量 contact sheet、office composite 和逐图报告均尚未生成。

> 注意：主流程仍在并发生成，本文记录的是上述时间点的只读快照。最终签字前必须停住 `images/` 写入并重新执行全部检查，不能直接复制本文中途计数。

## 一、当前可复算快照

| 项目 | 当前证据 | 判定 |
|---|---|---|
| `images/**/*.png` 总数 | `93`；完整目标应为原始 81 + 新增 28 = `109` | ❌ 未完成 |
| 精确 28 白名单 | `12` 存在、`16` 缺失 | ❌ 未完成 |
| 已正式晋级角色 | Alice 4/4、Bob 4/4、Jack 4/4 | 🟡 3/7 |
| 候选调用输出 | `15` 个 `attempt-*-source.png`、`15` 个 alpha；其中 Bob `walk-right` 有两次成功输出 | 🟡 进行中 |
| 无输出失败 | Alice `carry-right` attempt 1 网络失败，planning 日志有明确记录 | ✅ 有历史记录 |
| 独立 ImageGen 输出追踪 | 15/15 source 的 SHA-256 各自唯一匹配一个 `.codex/generated_images/.../exec-*.png` | ✅ 当前成功输出可追踪 |
| 单图 scene-180 证据 | `12` 张 | 🟡 仅已晋级三人 |
| 角色 group QA | `3` 张（Alice/Bob/Jack） | 🟡 3/7 |
| 原始 81 张 SHA | `baseline-sha256.csv` 81 行；独立复算 `matched=81`、missing/modified/unexpected 均 0 | ✅ 当前通过 |
| 大写 `Carry/` 错误目录 | 当前数量 `0`；Jack 两张已回到角色根目录的精确白名单路径 | ✅ 已纠正，最终仍需回归门禁 |
| 专用验证器测试 | `13` tests，`OK` | ✅ 工具当前测试通过 |
| 最终交付物 | 除 baseline 外，规范所列最终交付物均不存在 | ❌ 未完成 |

当前缺失的正式白名单是：

```text
images/avatars/Kara/walk-left.png
images/avatars/Kara/walk-right.png
images/avatars/Kara/carry-left.png
images/avatars/Kara/carry-right.png
images/avatars/Leo/walk-left.png
images/avatars/Leo/walk-right.png
images/avatars/Leo/carry-left.png
images/avatars/Leo/carry-right.png
images/avatars/Quinn/walk-left.png
images/avatars/Quinn/walk-right.png
images/avatars/Quinn/carry-left.png
images/avatars/Quinn/carry-right.png
images/avatars/Rita/walk-left.png
images/avatars/Rita/walk-right.png
images/avatars/Rita/carry-left.png
images/avatars/Rita/carry-right.png
```

## 二、显式要求—证据矩阵

状态含义：✅ 已有强证据；🟡 只有阶段性/叙述性证据；❌ 当前未满足；⚠️ 当前证据直接与字面要求冲突。

### A. 前置条件、安全边界与白名单（规范第 11–31 行）

| ID | 显式要求 | 完成所需权威证据 | 当前证据与判定 | 最终仍需做什么 |
|---|---|---|---|---|
| A1 | 开始前 81 张参考素材稳定，无其他 writer | 两次稳定扫描及时间记录 | `findings.md` 记录两次 SHA 扫描相同、初始 81 张且 28 目标均不存在；属于历史叙述证据。🟡 | 最终报告引用该记录；最终写入前再做两次稳定扫描。 |
| A2 | 对开始时全部 PNG 建立 SHA-256 基线 | 81 行清单、无重复/目标重叠 | `baseline-sha256.csv` 81 行；专用 verifier 已覆盖 entry count、重复、target overlap。✅ | 最终 JSON 固化 verifier 输出。 |
| A3 | 除 28 个新白名单外，不改、删、改名、覆盖任何旧图 | 最终逐行重算 81 SHA，且无额外非白名单 PNG | 当前 `verify_baseline`：81/81 matched，非目标变化 0。✅（仅当前） | 全部生成停止后再跑一次并记录时间。 |
| A4 | 不覆盖 `idle/at-desk/walk/carry/seated/up/down` | A3 的 81 SHA 复核 | 当前被 A3 证明。✅ | 最终复算。 |
| A5 | 不改前端、故事、layout、场景坐标、业务数据 | 任务开始前后的受保护文件清单/哈希或至少可信时间证据 | Git worktree 在任务前已很脏，单独看 `git status` 不能归因；但扫描 `apps/office-demo/**` 与 `docs/office-layout.json` 共 5294 文件，没有文件晚于 baseline 写入时间，代码中也没有 horizontal 文件名接入。🟡 | 最终再次确认这些路径的 mtime/差异未在本任务期间改变；报告说明 Git 既有 dirty state 的归因边界。 |
| A6 | 候选/证据仅写允许目录；目标已存在时不得覆盖 | 候选路径正则、promotion no-overwrite 日志 | 当前候选均在 `tmp/imagegen/horizontal-movement/`；planning 记录 copy no-overwrite。Jack 曾误建 `Jack/Carry/`，已纠正。🟡 | final verifier 必须拒绝任何 28 白名单外新增 PNG，并枚举实际路径大小写。 |
| A7 | 精确 7×4 白名单 | 28 个精确相对路径均存在，且没有 `Carry/` 子目录/大小写漂移 | 当前 12/28；`Carry/` 数量 0。❌ | 完成剩余 16 个正式路径；最终扫描必须为 28/28、总图数 109、额外非白名单 0。 |
| A8 | left/right 指画面方向 | 每张人工方向结论和证据图 | Alice/Bob/Jack 有逐图叙述；其余未形成最终结构化记录。🟡 | manifest/report 对 28 张逐项写 `direction=pass` 并引用视觉证据。 |

### B. 参考图、身份锁和 ImageGen 调用（规范第 33–101 行）

| ID | 显式要求 | 完成所需权威证据 | 当前证据与判定 | 最终仍需做什么 |
|---|---|---|---|---|
| B1 | Walk 使用同角色 idle/walk/up/down + office-shell，Carry 使用 idle/carry/up/down + office-shell；每次最多 5 张 | 每次调用的 5 路径和角色说明 | planning 记录 49/49 参考图已解码并查看；`prompt-set-draft.md` 只有规则/模板，不是实际调用记录。🟡 | 正式 `prompt-set.md` 对每个 attempt 列出实际 5 张引用及职责。 |
| B2 | 生成前必须 `view_image` 检查参考；坏参考则停角色 | 时间化 view/人工结论 | `progress.md`/`findings.md` 记录全部参考已查看并通过；无独立机器日志。🟡 | 在最终报告引用这些检查记录，不要把“文件能解码”当成视觉正确。 |
| B3 | 七名角色各自身份锁、发型/眼镜/服装/体型/胸标规则正确 | 28 个逐图 manual QA + 7×8 同屏对照 | 三名已晋级角色有详细叙述和 group 图；其余未全量。🟡 | 完成全部角色，逐张写 identity/badge visibility；用 7×8 movement sheet 人工复核。 |
| B4 | 每个目标单独调用内置 ImageGen；不得拼图后裁切或一次生成多个素材 | 每个 accepted target 对应唯一 exec/source；source 单一主体；调用日志 | 当前 15/15 source 哈希各自唯一匹配一个 exec；已验收 alpha 为单组件。✅ 对现有成功输出；全量仍未完成 | 最终 28 个 accepted target 必须各有独立 source/exec 追踪；额外 retries 全部保留。 |
| B5 | 每次最多 5 张明确职责参考 | 实际 tool-call/prompt 记录 | 正式 prompt set 不存在，文件系统无法证明调用时的 reference 数。❌ | 从真实调用记录生成 prompt set，不可只复制通用模板。 |
| B6 | 真侧面、稍俯视、非上/下/前/后三分之四，左右独立生成非镜像 | 每张原图视觉 QA；左右头发/手/腿/遮挡对照 | 已晋级三人的 findings 和 group 图支持；其余不完整。🟡 | 28/28 手工签字；相似度只能提示，不能自动替代。 |
| B7 | Walk 空手；Carry 恰好一个空白浅棕文件夹且 180px 可读 | 每张状态/道具 QA + 180px 证据 | 已晋级三人的叙述与 group 图支持；全量不足。🟡 | 28/28 写 action/props/folder readability 状态。 |
| B8 | 1254×1254、同尺度/脚点、留白无裁切、无家具/文字/阴影/UI 等 | 自动技术 + 人工 prohibited-content QA | 当前 12 个正式目标自动技术通过；人工记录仅三人。🟡 | 对 28 张复算并逐图人工签字。 |
| B9 | 像素风、硬边、像素密度和稍俯视风格一致 | 7×8 对照与人工风格结论 | 现有三张 group 图未包含 up/down；最终 7×8 artifact 不存在。🟡 | 生成并查看全量 7×8 sheet，逐角色记录结论。 |
| B10 | 源图背景“perfectly flat solid `#00ff00`” | source 像素级背景/边框必须单色且精确 `00ff00` | 对当前 15 个 source 的边框扫描：精确单色 `#00ff00` 为 `0/15`，每张边框有 137–184 种近绿色。⚠️ | 这是明确字面偏差。若该条是硬门禁，应重新生成直至满足；若项目接受“近绿源 + 严格透明正式图”，必须在最终报告如实标为 source deviation，不能声称精确 `#00ff00` 已通过。 |

### C. 候选、透明化、重试与调用次数（规范第 103–111 行）

| ID | 显式要求 | 完成所需权威证据 | 当前证据与判定 | 最终仍需做什么 |
|---|---|---|---|---|
| C1 | source 保存为规定的 `attempt-N-source.png` | 候选目录逐项 inventory | 当前 15 个成功输出命名正确；无输出网络失败没有 source，符合事实。✅ 当前 | 全量扫描；不得为无输出失败伪造 source。 |
| C2 | 只用安装的 `remove_chroma_key.py` 和规定参数 | 每个 attempt 的 chroma command/参数记录 | alpha 结果和 planning 叙述支持，但没有逐 attempt 机器执行日志。🟡 | 正式 prompt set/manifest 记录 command、阈值、despill、edge-contract 值。 |
| C3 | 仅轻微残绿才可 `--edge-contract 1`，不得侵蚀轮廓 | before/after 视觉证据和参数 | 当前没有使用 edge-contract 的记录。🟡 | manifest 对每次写 `edge_contract: 0/1`；若为 1，必须引用残绿证据。 |
| C4 | 每目标最多 3 次；失败有单一明确缺陷；下次只修该缺陷 | 完整 attempt 历史 | Alice 网络失败和 Bob 尺度失败均有明确记录；Bob rejected attempt 文件保留。✅ 当前 | 对后续 retry 同样记录；最终验证每目标 attempt_count≤3。 |
| C5 | 三次仍失败必须 blocked，不能选“最不差” | manifest 中 blocked/attempts/无 promotion | 尚无三次失败；不适用。🟡 | 最终 manifest 必须保留该状态逻辑。 |
| C6 | “28 次”与 retry 口径必须真实 | 28 个 accepted target 各有独立调用；总 attempts 另计 | 当前 15 个成功 exec + 1 个有日志无输出失败，实际调用至少 16 次；因为已发生批准的 retry，最终工具调用总数不可能仍“恰好 28”。⚠️ 口径需澄清 | 最终写“28 个目标分别有独立 accepted 调用；实际总调用数=全部 attempts（含失败/重试）”，不得虚报恰好 28 次。 |

### D. 自动技术验收（规范第 113–123 行）

| ID | 显式要求 | 完成所需权威证据 | 当前证据与判定 | 最终仍需做什么 |
|---|---|---|---|---|
| D1 | PNG、RGBA、1254×1254 | 全量 decode/inventory | 专用 validator 当前正式目标 `12/12` 通过、0 decode failure。🟡 | 最终必须 `28/28`。 |
| D2 | 四角透明、主体不碰边、无裁切 | alpha bbox/corner checks | 当前 12/12 通过。🟡 | 最终 28/28 + JSON 数值。 |
| D3 | 单一合理前景组件、无孤立像素/额外物体 | 8-connected component + 人工复核 | 当前 12/12 `component_count_8=1`；额外物体仍需人工。🟡 | 28/28 自动 + 人工。 |
| D4 | 无可见强绿/绿边 | visible green/chroma metrics | 当前 12/12 自动通过。🟡 | 28/28 写入 JSON。 |
| D5 | 透明区无隐藏绿色污染 | alpha=0 RGB 扫描 | 独立扫描当前 12 正式目标：每张 alpha=0 区域 `hidden_nonzero_rgb=0`，因此 hidden green/chroma 均 0。✅ 当前 | 把此指标正式加入 validator/`horizontal-validation.json`，再跑 28/28；legacy `analyze_image` 本身不覆盖该项。 |
| D6 | 记录 alpha bbox、可见像素、组件、脚点、180×180 实际可见尺寸 | 每资产结构化 metrics | 专用 validator 已实现 alpha/visible/component/foot-anchor/runtime-180；13 测试通过。✅ 工具能力 | 最终 JSON 必须包含全部 28 条，不只是 summary。 |

### E. 人工视觉与成组验收（规范第 124–136 行）

| ID | 显式要求 | 完成所需权威证据 | 当前证据与判定 | 最终仍需做什么 |
|---|---|---|---|---|
| E1 | identity/hair/clothes/glasses/badge 正确 | 每资产 manual record | 三名已晋级角色有 findings；未形成最终 28 项 JSON。🟡 | manifest/report 28/28 明确签字。 |
| E2 | direction/action 严格，非 up/down/3/4 | 每资产 manual record | 同上。🟡 | 28/28。 |
| E3 | Walk 空手，Carry 一个空白文件夹且 180px 可读 | 每资产 manual + 180 evidence | 三名 group 图支持；全量不足。🟡 | 28/28。 |
| E4 | 无家具、球、文字、阴影、地面、UI/场景残留 | 每资产原图 visual QA | 已晋级三人有叙述；全量不足。🟡 | 28/28。 |
| E5 | 左右独立姿势，非像素镜像 | 成对原图遮挡/步态人工对照 | 已晋级三人有明确叙述；全量不足。🟡 | 7 个角色两种状态都签字。 |
| E6 | 四张新图与 up/down 同屏比较 | 7×8 movement sheet | 当前三张 per-actor group QA 只显示四张 horizontal + generic scene row，**没有** up/down。专用 renderer 已实现并测试，但最终 artifact 不存在。❌ | 生成 `horizontal-movement-comparison-sheet.png`，人工查看后记录 7/7。 |
| E7 | left/right 身高差≤约 10%，脚底/中心无跳动 | 每角色 walk pair + carry pair 数值/视觉结论 | Alice 4.0%/1.6%，Bob 1.8%/7.1%，Jack 0.6%/2.7% 已记录。🟡 3/7 | 其余 4 人补齐；manifest 写具体数值和 foot/center 结论。 |
| E8 | 在 PM→Hub、Dev→Hub、QA→Hub 代表位置以 180×180 合成 | 全量 office-shell composite + 人工查看 | renderer/测试已声明三类位置并能渲染 28 项；正式 composite 不存在。❌ | 生成 `horizontal-office-shell-composite.png`，人工查看所有 28 格，不能仅因 renderer 无异常就判 scene pass。 |
| E9 | 7×4 透明 contact sheet | 正式 PNG、尺寸/透明性、人工查看 | renderer/测试已就绪；正式 PNG 不存在。❌ | 生成并查看 `horizontal-transparent-contact-sheet.png`。 |

### F. 晋级与前端边界（规范第 138–141 行）

| ID | 显式要求 | 完成所需权威证据 | 当前证据与判定 | 最终仍需做什么 |
|---|---|---|---|---|
| F1 | 单图+成组通过后才晋级 | accepted alpha、group QA、promotion log、candidate→final SHA | Alice/Bob/Jack 四张均有 candidate→final SHA 匹配和 group 记录。🟡 3/7 | 后续角色同样执行；manifest 不能由“文件存在”推断 promoted。 |
| F2 | 每角色 4/4 原子晋级，不覆盖 | 四文件事务/回滚逻辑和 no-overwrite | 当前三人按组晋级；Jack 初次 Carry 路径错误后修正，已留下审计记录。🟡 | 剩余四人先 4/4 再晋级；最终 exact-path scan。 |
| F3 | 28/28 前前端不得接入 | 代码搜索无 horizontal 文件引用 | `apps/` 中没有 `walk-left/right` 或 `carry-left/right` 引用。✅ 当前 | 完成前保持不接入。 |

### G. 明确交付物（规范第 142–149 行）

| 交付物 | 当前状态 | 最终门禁 |
|---|---|---|
| 28 张正式透明 PNG | ❌ `12/28` | 精确白名单 28/28、总图数 109、每张 candidate hash 可追踪 |
| `.planning/.../asset-status-manifest.json` | ❌ 不存在 | 28 条资产、全部 attempts、manual/scene/promotion/最终 SHA、summary all_complete |
| `.planning/.../horizontal-validation.json` | ❌ 不存在 | 专用 CLI 新鲜生成；自动 28/28、baseline 81/81、三类 evidence pass；其 `manual_review_status` 目前设计为 `not_assessed`，不能单独证明完成 |
| `.planning/.../prompt-set.md` | ❌ 不存在 | 必须是实际展开 prompts/refs/attempts；现有 `prompt-set-draft.md` 只是结构草案，不可冒充 |
| `.planning/.../baseline-sha256.csv` | ✅ 存在，81 行 | 最终再验证 81/81，非目标变化 0 |
| 7×4 transparent contact sheet | ❌ 不存在 | `horizontal-transparent-contact-sheet.png` 生成后人工查看 |
| 含 up/down 的 movement sheet | ❌ 不存在 | `horizontal-movement-comparison-sheet.png` 生成后人工查看 |
| office-shell 实景 composite | ❌ 不存在 | `horizontal-office-shell-composite.png`，28 格、三类 route，人工 scene pass |
| `docs/avatar-horizontal-asset-generation-report.md` | ❌ 不存在 | 对 28 张逐项写 references、attempt count、技术结果、视觉结论、最终路径；现有 `docs/avatar-asset-generation-report.md` 是另一任务，不可替代 |

## 三、专用验证工具审计

`tools/validate_horizontal_avatar_assets.py` 当前已具备并有测试覆盖：

- 精确 28 路径顺序；
- present/missing/corrupt inventory；
- PNG/RGBA/尺寸/alpha/组件/可见绿检查；
- foot anchor 与整个 1254 画布按 NEAREST 缩至 180 的可见 bbox；
- 81 基线、missing/modified/unexpected non-target 检查；
- 7×4 transparent sheet；
- 7×8 horizontal/up/down comparison sheet；
- PM/Dev/QA 三类位置的 office-shell composite；
- CLI 写 `horizontal-validation.json`，且 incomplete strict gate 返回失败。

新鲜测试证据：`13 tests`，`OK`。

仍不能由自动工具证明的内容：

1. `manual_review_status` 明确仍是 `not_assessed`；身份、方向、动作、道具、镜像关系和场景适配必须由 manifest/report 补齐。
2. legacy `analyze_image` 跳过 alpha=0 像素，不能单独证明隐藏 RGB 已清理；应把 hidden RGB 指标纳入正式 JSON。
3. 工具能“生成 composite”不等于 composite 视觉通过；最终必须实际查看。
4. 工具不能从 source 文件还原真实引用数量和完整 prompt；必须依赖真实 attempt 日志/prompt set。

## 四、调用次数与重试证据的正确口径

当前成功 source 的 15 个 SHA-256 全部唯一匹配一个内置 ImageGen `exec-*.png`，这能证明“每个现有 source 来自独立输出”。另有 Alice `carry-right` attempt 1 无输出网络失败，因此当前实际调用至少 16 次。

由于规范同时允许最多三次重试，Bob 已有一次视觉尺度重试、Alice 有一次网络重试，所以最终**实际工具调用总数一定会大于 28**。最终报告应同时给出：

- `accepted_target_count = 28`：28 个目标各自有独立 accepted ImageGen 输出；
- `successful_output_count`：包括被拒但有文件的 attempts；
- `failed_no_output_count`：包括网络失败；
- `total_imagegen_attempts = successful_output_count + failed_no_output_count`。

不得为了贴合“28 次”字样而删除失败/重试记录，也不得声称实际总调用恰好 28。

## 五、完成前必须执行的剩余工作

1. 按单目标单调用继续生成剩余 16 个正式白名单资产；每个 attempt 保留 source/alpha、完整 prompt、5 refs、缺陷和处置。
2. 完成 Kara/Leo/Quinn/Rita 的 4/4 单图、180px、左右尺度和场景 QA，再按角色组晋级；不覆盖任何已存在目标。
3. 对 near-green source 与“精确 `#00ff00`”字面要求作明确处理；在未解决或未获接受前，不得宣称该条通过。
4. 停止所有 `images/` 写入，连续两次扫描确认稳定；确认精确 28 路径、无 `Carry/`/其他大小写漂移、总图数 109。
5. 新鲜运行专用 validator，生成 `horizontal-validation.json` 和三张全量 evidence 图；把 hidden RGB 指标纳入结果。
6. 实际查看 7×4、7×8 和 office composite；把 28 个 manual identity/direction/action/props/no-extras/not-mirrored/scene 状态写入 manifest。
7. 生成正式 `prompt-set.md`，合并无输出失败与所有 rejected attempts；不得用 `prompt-set-draft.md` 替代。
8. 生成 `asset-status-manifest.json`，并验证每个 accepted alpha 与正式 PNG SHA 完全一致。
9. 生成 `docs/avatar-horizontal-asset-generation-report.md`，逐图记录 references、attempts、技术指标、视觉结论和正式路径。
10. 最后一次复算原始 81 张：81/81 matched、missing 0、modified 0、unexpected non-target 0；复跑测试并查看全部输出。
11. 只有同时得到目标 28/28、自动技术 28/28、人工身份/方向/动作 28/28、场景 28/28、原图变化 0、全部交付物存在且经查看，才可将 Goal 标记完成。

## 六、最终签字建议使用的证据命令

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
& 'C:\Users\29929\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' `
  -m unittest tests.test_validate_horizontal_avatar_assets -v

& 'C:\Users\29929\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' `
  tools/validate_horizontal_avatar_assets.py --root . --require-complete
```

第二条命令的 `automated_status=pass` 仍只代表自动门禁；必须再核对 manifest/report 中人工与场景计数均为 28/28，并逐一查看三张 evidence 图。
