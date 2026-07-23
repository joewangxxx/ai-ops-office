# AI OPS Office Demo — 素材资产清单与坐标布局

本文件记录正式素材清单、场景逻辑坐标、运行时选图规则和交接锚点。运行时唯一资产注册表是 `docs/office-layout.json`；当前注册表包含 **109 条唯一 PNG 路径**，其中包含 7 名角色的 98 个 Avatar 姿势（每人 14 个）。本文只解释该数据合同，不改动任何 `images/` 原始素材。

## 场景坐标与锚点规则

- 唯一场景坐标系是 `images/scene/office-shell.png` 的 **1672 × 941** 逻辑像素；原点 `(0, 0)` 位于左上角，`x` 向右、`y` 向下。
- 场景底图是唯一不透明素材。其余家具、Artifact、Orb 与 Avatar 均是 **1254 × 1254** 的透明 PNG 画布，视觉内容没有贴在左上角。
- **桌子 / Hub**：`deskAnchor` / `hubAnchor` 对齐图片的“可见内容底边中心”（包含椅子或阴影的最低可见像素）。
- **静态背向坐姿**：在线工位固定使用 `seatedWorkingBack`；离线工位不渲染 Avatar。`seatedIdleBack` 只保留在资产清单中，V1 运行时不选择。坐姿以自身的 `visualSeatedBaseCenterSource` 对齐工位 `seatedBackAnchor`，固定按 **150 × 150** 渲染。
- **移动 Avatar**：业务姿势保持 `atDesk | walk | carry`。显示层按相邻路径点计算 `up | down | left | right`：`abs(dx) >= abs(dy)` 时选择水平轴，否则选择垂直轴；等幅对角线优先水平轴，重复点视为非法路线。随后映射到 `walkUp/walkDown/walkLeft/walkRight` 或 `carryUp/carryDown/carryLeft/carryRight`。移动姿势按 **180 × 180** 渲染，并用每张图自己的 `visualFootShadowCenterSource` 对齐角色场景脚点。
- **兼容资产**：旧 `idle/atDesk/walk/carry` 及其锚点继续登记用于资产完整性，但移动运行时禁止选择通用 `walk/carry`，也禁止通过镜像生成左右方向。
- **工位图层**：每个工位按 `desk-back → desk-chair-back → avatar → desk-foreground` 合成。显示器、键盘与桌面主体位于人物后；前景只保留不会穿过人物头部的桌腿与窄前沿。
- **按需 DOM**：注册表只保存路径字符串，不导入或预解码 98 张 Avatar。页面只为当前被选中的坐姿或移动状态创建 `<img src>`；未选中的姿势不进入 DOM，因此不会因完成注册而一次加载全部大画布对象图。
- **名字标签**：静态坐姿和移动 Avatar 共用同一规则。先由当前姿势的 `sourceAlphaBounds` 换算人物可见边界，再把标签底边中心放在可见头顶上方 10 个逻辑像素；静态工位如与显示器或键鼠关键区域碰撞，则进行最小水平避让。离线人员继续使用空工位 fallback 标签。
- **Orb**：按当前 Avatar 与 Orb 各自的 `sourceAlphaBounds` 计算可见边缘，使 Orb 可见左边缘与 Avatar 可见右边缘保持目标 10 个逻辑像素（整数场景落点允许实际处于 8–12）。`orbAnchor` 仍表示 Orb 的 `visualCenterSource` 落点；蓝、灰、黄三种业务含义不变。
- 通用放置公式（对所有透明素材一致）：`left = sceneX - sourceAnchorX × renderWidth / 1254`，`top = sceneY - sourceAnchorY × renderHeight / 1254`。渲染使用等比缩放与 `image-rendering: pixelated`。

## 素材资产清单

建议尺寸是进入 1672 × 941 场景时的渲染画布尺寸，不是视觉内容的裁切尺寸。`透明` 表示 PNG 是否含 alpha 透明留白。

| 素材 key | 相对路径 | 用途 | 源尺寸 | 透明 | 建议渲染尺寸 |
|---|---|---|---:|---|---:|
| `scene.officeShell` | `images/scene/office-shell.png` | 唯一场景底图 / 坐标基准 | 1672 × 941 | 否 | 1672 × 941 |
| `furniture.deskBack` | `images/furniture/desk-back.png` | 显示器、键盘与桌面后层 | 1254 × 1254 | 是 | 210 × 210 |
| `furniture.deskChairBack` | `images/furniture/desk-chair-back.png` | 放大的完整工位椅后层 | 1254 × 1254 | 是 | 260 × 260 |
| `furniture.deskForeground` | `images/furniture/desk-foreground.png` | 不穿过人物头部的桌腿与窄前沿 | 1254 × 1254 | 是 | 210 × 210 |
| `furniture.artifactHub` | `images/furniture/artifact-hub-transparent.png` | 中央 Artifact Hub | 1254 × 1254 | 是 | 300 × 300 |
| `artifact.prdBlue` | `images/artifact/prd-blue.png` | PRD 类型 Artifact | 1254 × 1254 | 是 | 56 × 56 |
| `artifact.featureGreen` | `images/artifact/feature-green.png` | Feature 类型 Artifact | 1254 × 1254 | 是 | 56 × 56 |
| `artifact.reportPurple` | `images/artifact/report-purple.png` | QA Report 类型 Artifact | 1254 × 1254 | 是 | 56 × 56 |
| `orb.blue` | `images/orb/orb_blue.png` | Agent 正在协助 | 1254 × 1254 | 是 | 36 × 36 |
| `orb.gray` | `images/orb/orb_gray.png` | Agent 可用，暂无 active session | 1254 × 1254 | 是 | 36 × 36 |
| `orb.yellow` | `images/orb/orb_yellow.png` | Agent 已输出结果，等待人工确认 | 1254 × 1254 | 是 | 36 × 36 |
| `avatar.alice.idle` | `images/avatars/Alice/idle.png` | Alice 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.alice.atDesk` | `images/avatars/Alice/at-desk.png` | Alice 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.alice.walk` | `images/avatars/Alice/walk.png` | Alice 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.alice.carry` | `images/avatars/Alice/carry.png` | Alice 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.idle` | `images/avatars/Bob/idle.png` | Bob 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.atDesk` | `images/avatars/Bob/at-desk.png` | Bob 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.walk` | `images/avatars/Bob/walk.png` | Bob 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.carry` | `images/avatars/Bob/carry.png` | Bob 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.idle` | `images/avatars/Jack/idle.png` | Jack 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.atDesk` | `images/avatars/Jack/at-desk.png` | Jack 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.walk` | `images/avatars/Jack/walk.png` | Jack 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.carry` | `images/avatars/Jack/carry.png` | Jack 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.idle` | `images/avatars/Kara/idle.png` | Kara 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.atDesk` | `images/avatars/Kara/at-desk.png` | Kara 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.walk` | `images/avatars/Kara/walk.png` | Kara 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.carry` | `images/avatars/Kara/carry.png` | Kara 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.idle` | `images/avatars/Leo/idle.png` | Leo 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.atDesk` | `images/avatars/Leo/at-desk.png` | Leo 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.walk` | `images/avatars/Leo/walk.png` | Leo 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.carry` | `images/avatars/Leo/carry.png` | Leo 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.idle` | `images/avatars/Quinn/idle.png` | Quinn 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.atDesk` | `images/avatars/Quinn/at-desk.png` | Quinn 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.walk` | `images/avatars/Quinn/walk.png` | Quinn 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.carry` | `images/avatars/Quinn/carry.png` | Quinn 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.idle` | `images/avatars/Rita/idle.png` | Rita 站立 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.atDesk` | `images/avatars/Rita/at-desk.png` | Rita 坐席 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.walk` | `images/avatars/Rita/walk.png` | Rita 行走 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.carry` | `images/avatars/Rita/carry.png` | Rita 携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |

以下 42 条是 Scheme A 新接入的背向坐姿和上下方向移动资源；key 与 `office-layout.json` 完全一致。

| 素材 key | 相对路径 | 用途 | 源尺寸 | 透明 | 建议渲染尺寸 |
|---|---|---|---:|---|---:|
| `avatar.alice.seatedIdleBack` | `images/avatars/Alice/seated-idle-back.png` | Alice 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.alice.seatedWorkingBack` | `images/avatars/Alice/seated-working-back.png` | Alice 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.alice.walkUp` | `images/avatars/Alice/walk-up.png` | Alice 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.alice.walkDown` | `images/avatars/Alice/walk-down.png` | Alice 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.alice.carryUp` | `images/avatars/Alice/carry-up.png` | Alice 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.alice.carryDown` | `images/avatars/Alice/carry-down.png` | Alice 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.seatedIdleBack` | `images/avatars/Bob/seated-idle-back.png` | Bob 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.bob.seatedWorkingBack` | `images/avatars/Bob/seated-working-back.png` | Bob 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.bob.walkUp` | `images/avatars/Bob/walk-up.png` | Bob 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.walkDown` | `images/avatars/Bob/walk-down.png` | Bob 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.carryUp` | `images/avatars/Bob/carry-up.png` | Bob 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.bob.carryDown` | `images/avatars/Bob/carry-down.png` | Bob 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.seatedIdleBack` | `images/avatars/Jack/seated-idle-back.png` | Jack 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.jack.seatedWorkingBack` | `images/avatars/Jack/seated-working-back.png` | Jack 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.jack.walkUp` | `images/avatars/Jack/walk-up.png` | Jack 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.walkDown` | `images/avatars/Jack/walk-down.png` | Jack 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.carryUp` | `images/avatars/Jack/carry-up.png` | Jack 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.jack.carryDown` | `images/avatars/Jack/carry-down.png` | Jack 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.seatedIdleBack` | `images/avatars/Kara/seated-idle-back.png` | Kara 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.kara.seatedWorkingBack` | `images/avatars/Kara/seated-working-back.png` | Kara 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.kara.walkUp` | `images/avatars/Kara/walk-up.png` | Kara 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.walkDown` | `images/avatars/Kara/walk-down.png` | Kara 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.carryUp` | `images/avatars/Kara/carry-up.png` | Kara 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.kara.carryDown` | `images/avatars/Kara/carry-down.png` | Kara 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.seatedIdleBack` | `images/avatars/Leo/seated-idle-back.png` | Leo 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.leo.seatedWorkingBack` | `images/avatars/Leo/seated-working-back.png` | Leo 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.leo.walkUp` | `images/avatars/Leo/walk-up.png` | Leo 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.walkDown` | `images/avatars/Leo/walk-down.png` | Leo 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.carryUp` | `images/avatars/Leo/carry-up.png` | Leo 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.leo.carryDown` | `images/avatars/Leo/carry-down.png` | Leo 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.seatedIdleBack` | `images/avatars/Quinn/seated-idle-back.png` | Quinn 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.quinn.seatedWorkingBack` | `images/avatars/Quinn/seated-working-back.png` | Quinn 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.quinn.walkUp` | `images/avatars/Quinn/walk-up.png` | Quinn 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.walkDown` | `images/avatars/Quinn/walk-down.png` | Quinn 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.carryUp` | `images/avatars/Quinn/carry-up.png` | Quinn 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.quinn.carryDown` | `images/avatars/Quinn/carry-down.png` | Quinn 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.seatedIdleBack` | `images/avatars/Rita/seated-idle-back.png` | Rita 背向坐姿、无 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.rita.seatedWorkingBack` | `images/avatars/Rita/seated-working-back.png` | Rita 背向坐姿、有 Active Work | 1254 × 1254 | 是 | 150 × 150 |
| `avatar.rita.walkUp` | `images/avatars/Rita/walk-up.png` | Rita 向上移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.walkDown` | `images/avatars/Rita/walk-down.png` | Rita 向下移动 | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.carryUp` | `images/avatars/Rita/carry-up.png` | Rita 向上携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |
| `avatar.rita.carryDown` | `images/avatars/Rita/carry-down.png` | Rita 向下携带 Artifact | 1254 × 1254 | 是 | 180 × 180 |

另有 28 条左右方向资源：每名角色各自登记 `walkLeft`、`walkRight`、`carryLeft`、`carryRight`，路径分别为角色目录下的 `walk-left.png`、`walk-right.png`、`carry-left.png`、`carry-right.png`。其独立 alpha bounds 与脚底锚点以 `.planning/2026-07-16-avatar-horizontal-generation/horizontal-validation.json` 的验收数据为准。

`office-layout.json` 的 `assetAnchors` 保存了每张透明素材的 alpha 可见边界，以及家具、Hub、Orb 和 98 个 Avatar 姿势的源图锚点。这是所有姿势统一对齐的唯一来源。

## Workspace 区域边界

地图成品不显示 PM Office、Dev Office、QA Lab 或 Artifact Hub 等常驻文字；这些名称只供本清单和开发校对覆盖图使用。

| Workspace | 场景内边界 `(x, y, w, h)` | 工位可用安全区 | 布局说明 |
|---|---:|---:|---|
| PM Office | `(45, 108, 604, 516)` | `(100, 280, 500, 310)` | 左上绿色房间，三张桌子位于较低一排，避开顶部收纳、右侧墙线和下方绿植。 |
| Dev Office | `(1055, 108, 580, 516)` | `(1110, 270, 390, 320)` | 右上蓝色房间，四张桌子为 2 × 2；最右和下方入口附近保持清空，为 Inspector / UI 预留。 |
| QA Lab | `(308, 702, 1270, 198)` | `(410, 742, 1020, 126)` | 下方紫色区域，三张桌子单排布置，适配浅景深且不压住房间边框。 |

中央公共区不属于 Workspace：Hub 锚点为 **`(850, 510)`**，位于中央白色地砖的净空区域。按 300 × 300 渲染后，其可见轮廓约在 `x=767–933`、`y=367–510`，不会覆盖沙发、水机、墙体、盆栽或底部 QA 边框。

## 十个工位坐标表

所有值都是场景逻辑像素。离线人员的 Avatar 与 Orb 点仍然保留，便于未来上线时零改版切换；当前只渲染桌子与灰色名字标签。

| Desk ID | 区域 | 人员 | 在线 | Desk 底边中心 | 背向坐姿点 | Avatar 脚点 | 名字标签点 | Orb 点 | 当前显示 |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| `pm-alice` | PM | Alice | 是 | `(160, 548)` | `(160, 564)` | `(160, 465)` | `(160, 325)` | `(236, 401)` | 桌子、Avatar、彩色名签、Orb |
| `pm-bob` | PM | Bob | 是 | `(350, 548)` | `(350, 564)` | `(350, 465)` | `(350, 325)` | `(426, 401)` | 桌子、Avatar、彩色名签、Orb |
| `pm-cindy` | PM | Cindy | 否 | `(540, 548)` | `(540, 564)` | `(540, 465)` | `(540, 325)` | `(616, 401)` | 桌子、灰色名签 |
| `dev-jack` | Dev | Jack | 是 | `(1175, 375)` | `(1175, 391)` | `(1175, 295)` | `(1175, 155)` | `(1251, 231)` | 桌子、Avatar、彩色名签、Orb |
| `dev-kara` | Dev | Kara | 是 | `(1445, 375)` | `(1445, 391)` | `(1445, 295)` | `(1445, 155)` | `(1521, 231)` | 桌子、Avatar、彩色名签、Orb |
| `dev-leo` | Dev | Leo | 是 | `(1175, 585)` | `(1175, 601)` | `(1175, 515)` | `(1175, 395)` | `(1251, 451)` | 桌子、Avatar、彩色名签、Orb |
| `dev-mia` | Dev | Mia | 否 | `(1445, 585)` | `(1445, 601)` | `(1445, 515)` | `(1445, 395)` | `(1521, 451)` | 桌子、灰色名签 |
| `qa-quinn` | QA | Quinn | 是 | `(550, 868)` | `(550, 884)` | `(550, 840)` | `(550, 705)` | `(626, 776)` | 桌子、Avatar、彩色名签、Orb |
| `qa-rita` | QA | Rita | 是 | `(920, 868)` | `(920, 884)` | `(920, 840)` | `(920, 705)` | `(996, 776)` | 桌子、Avatar、彩色名签、Orb |
| `qa-tina` | QA | Tina | 否 | `(1290, 868)` | `(1290, 884)` | `(1290, 840)` | `(1290, 705)` | `(1366, 776)` | 桌子、灰色名签 |

## Artifact Hub 与交接锚点

Artifact Hub 使用 `furniture.artifactHub`，视觉底边中心固定在 **`(850, 510)`**。Artifact 放置槽为 PRD `(810, 458)`、Feature `(850, 458)`、Report `(890, 458)`；它们是动态内容落点，不是底图常驻文字。

`handoffAnchors.routesByDesk` 为 7 个在线工位分别登记 `toHub` 与 `fromHub`。去程从该工位 `avatarAnchor` 起步并到达统一 Hub 交接点，返程是其严格逆序；所有相邻点均不同、位于场景边界内，整组路线覆盖上下左右四个方向。业务动作只携带路径与 `walk/carry`，具体方向图片由展示层逐段计算。

## 开发校对图

`office-coordinate-overlay.png` 是从底图副本生成的开发校对图。它显示 Workspace 边界、10 个 Desk ID、Hub、Avatar 脚点、离线工位、名字标签点和 Orb 点；图中不绘制 Artifact 交接路线，也不修改原始 `office-shell.png`。
