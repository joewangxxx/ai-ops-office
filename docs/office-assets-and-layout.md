# AI OPS Office Demo — 素材资产清单与坐标布局

本文件只定义素材、场景逻辑坐标和未来交接所需的锚点数据。它不创建 React 工程、不实现 UI 或动画，也不改动任何 `images/` 下的原始素材。

## 场景坐标与锚点规则

- 唯一场景坐标系是 `images/scene/office-shell.png` 的 **1672 × 941** 逻辑像素；原点 `(0, 0)` 位于左上角，`x` 向右、`y` 向下。
- 场景底图是唯一不透明素材。其余家具、Artifact、Orb 与 Avatar 均是 **1254 × 1254** 的透明 PNG 画布，视觉内容没有贴在左上角。
- **桌子 / Hub**：`deskAnchor` / `hubAnchor` 对齐图片的“可见内容底边中心”（包含椅子或阴影的最低可见像素）。
- **Avatar**：`avatarAnchor` 对齐脚底或地面阴影的中心。每个角色每个姿势在 JSON 内记录各自源图脚点；渲染器以同一换算公式放置，不能写角色级或页面级 CSS 偏移。
- **名字标签**：`nameTagAnchor` 是标签视觉中心，位于 Avatar 头顶上方；离线人员只显示该灰色标签。
- **Orb**：`orbAnchor` 是 Orb 视觉中心，在 Avatar 右侧；它只表示 Agent 状态，名字颜色仅用于区分人员。蓝色表示 Agent 正在协助；灰色表示 Agent 可用且暂无 active session；黄色表示 Agent 已输出结果、等待人工确认。
- 通用放置公式（对所有透明素材一致）：`left = sceneX - sourceAnchorX × renderWidth / 1254`，`top = sceneY - sourceAnchorY × renderHeight / 1254`。渲染使用等比缩放与 `image-rendering: pixelated`。

## 素材资产清单

建议尺寸是进入 1672 × 941 场景时的渲染画布尺寸，不是视觉内容的裁切尺寸。`透明` 表示 PNG 是否含 alpha 透明留白。

| 素材 key | 相对路径 | 用途 | 源尺寸 | 透明 | 建议渲染尺寸 |
|---|---|---|---:|---|---:|
| `scene.officeShell` | `images/scene/office-shell.png` | 唯一场景底图 / 坐标基准 | 1672 × 941 | 否 | 1672 × 941 |
| `furniture.deskStandard` | `images/furniture/desk-standard-transparent.png` | 十个工位桌椅 | 1254 × 1254 | 是 | 210 × 210 |
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

`office-layout.json` 的 `assetAnchors` 保存了每张透明素材的 alpha 可见边界，以及家具、Hub、Orb 和 28 个 Avatar 姿势的源图锚点。这是所有姿势统一对齐的唯一来源。

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

| Desk ID | 区域 | 人员 | 在线 | Desk 底边中心 | Avatar 脚点 | 名字标签点 | Orb 点 | 当前显示 |
|---|---|---|---|---:|---:|---:|---:|---|
| `pm-alice` | PM | Alice | 是 | `(160, 548)` | `(160, 465)` | `(160, 325)` | `(236, 401)` | 桌子、Avatar、彩色名签、Orb |
| `pm-bob` | PM | Bob | 是 | `(350, 548)` | `(350, 465)` | `(350, 325)` | `(426, 401)` | 桌子、Avatar、彩色名签、Orb |
| `pm-cindy` | PM | Cindy | 否 | `(540, 548)` | `(540, 465)` | `(540, 325)` | `(616, 401)` | 桌子、灰色名签 |
| `dev-jack` | Dev | Jack | 是 | `(1175, 375)` | `(1175, 295)` | `(1175, 155)` | `(1251, 231)` | 桌子、Avatar、彩色名签、Orb |
| `dev-kara` | Dev | Kara | 是 | `(1445, 375)` | `(1445, 295)` | `(1445, 155)` | `(1521, 231)` | 桌子、Avatar、彩色名签、Orb |
| `dev-leo` | Dev | Leo | 是 | `(1175, 585)` | `(1175, 515)` | `(1175, 395)` | `(1251, 451)` | 桌子、Avatar、彩色名签、Orb |
| `dev-mia` | Dev | Mia | 否 | `(1445, 585)` | `(1445, 515)` | `(1445, 395)` | `(1521, 451)` | 桌子、灰色名签 |
| `qa-quinn` | QA | Quinn | 是 | `(550, 868)` | `(550, 840)` | `(550, 705)` | `(626, 776)` | 桌子、Avatar、彩色名签、Orb |
| `qa-rita` | QA | Rita | 是 | `(920, 868)` | `(920, 840)` | `(920, 705)` | `(996, 776)` | 桌子、Avatar、彩色名签、Orb |
| `qa-tina` | QA | Tina | 否 | `(1290, 868)` | `(1290, 840)` | `(1290, 705)` | `(1366, 776)` | 桌子、灰色名签 |

## Artifact Hub 与未来交接锚点

Artifact Hub 使用 `furniture.artifactHub`，视觉底边中心固定在 **`(850, 510)`**。未来可选 Artifact 放置槽为 PRD `(810, 458)`、Feature `(850, 458)`、Report `(890, 458)`；它们只是动态内容落点，不是底图常驻文字。

PM → Hub → Dev 的预留交接数据位于 JSON 的 `handoffAnchors.pmToHubToDev`：

| 阶段 | 锚点 | 用途 |
|---|---:|---|
| PM 起点 | Alice 脚点 `(160, 465)` | 交接发起者起点；替换为其他 PM 时使用其 `avatarAnchor`。 |
| PM 暂存点 | `(610, 560)` | 离开 PM 工位前的净空点。 |
| Hub 西侧接近点 | `(745, 540)` | 接近 Hub 的第一公共区节点。 |
| Hub 取放点 | `(850, 458)` | Artifact 在 Hub 台面上的统一 drop / pickup snap 点。 |
| Hub 东侧接近点 | `(960, 540)` | 接收方离开 Hub 的公共区节点。 |
| Dev 暂存点 | `(1080, 540)` | 进入 Dev 工作区前的净空点。 |
| Dev 终点 | Jack 脚点 `(1175, 335)` | 交接接收者终点；替换为其他 Dev 时使用其 `avatarAnchor`。 |

这些点只供未来运行时路径规划与动画取用；**不绘制永久交接路线**。运行时应根据角色、Artifact 类型和碰撞边界动态求路径，且在预留 Inspector/UI 区域出现时保持其净空。

## 开发校对图

`office-coordinate-overlay.png` 是从底图副本生成的开发校对图。它显示 Workspace 边界、10 个 Desk ID、Hub、Avatar 脚点、离线工位、名字标签点和 Orb 点；图中不绘制 Artifact 交接路线，也不修改原始 `office-shell.png`。
