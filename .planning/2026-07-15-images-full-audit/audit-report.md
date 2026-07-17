# `images/` 全量独立验收报告

原始审计：2026-07-15  
Scheme A 复验：2026-07-16  
范围：`C:\Users\29929\Desktop\AI-Wrokspace\images`

## Scheme A 复验结论（当前状态）

方案 A 的静态实现与技术门禁已落地，原报告的运行时接入、透明 RGB 和清单覆盖问题均已修复：

- 81/81 个 PNG 已由 `docs/office-layout.json` 注册并可被项目消费；70 个 Avatar 覆盖 7 名角色各 10 个姿势。
- 在线静态工位按非空 `PersonScenario.currentTask` 选择 `seatedIdleBack` / `seatedWorkingBack`，离线工位不渲染 Avatar；坐姿使用 150×150 专用源锚点和 `seatedBackAnchor`。
- Walk/Carry 保留故事语义，显示层根据 waypoint 主导轴选择通用、Up 或 Down 资源，按 180×180 渲染。
- 工位合成顺序为 `desk-chair-back → avatar → desk-front`；路径注册不预加载图片，DOM 只包含当前选中姿势。
- 固定 35 张 PNG 的远场透明 RGB 已事务化清理，共清除 43,261,599 个像素；字节数由 33,781,582 降至 10,502,131。Alpha、全部 `alpha>0` RGBA、bbox 与 2px 保护轮廓保持不变。
- 前端清单门禁验证 81 条唯一、精确大小写路径及 PNG/IHDR 合同；Python 审计验证解码、尺寸/模式、Alpha、四角/边缘、精确 `#00ff00`、透明 RGB 轮廓、重复 SHA、压缩预算和分类光影策略。当前真实扫描为 81/81 通过、0 error、0 duplicate SHA。

本节描述当前静态与自动化证据；最终真实浏览器截图及人工合成复验记录在 Scheme A runtime/final validation 证据中。

## 2026-07-15 原始验收结论（历史快照）

以下内容保留原始问题发现的时间语义；其中 P0/P1 已由上面的 Scheme A 实施闭环。

当前资产库在“文件存在、可解码、画布完整、主体可辨认”层面合格，但整套项目仍未达到可直接进入前端的最终标准。

- 物理资产完整度：81/81，未发现硬缺图。
- 解码与格式：81/81 通过；80 张对象图为 1254×1254 PNG/RGBA，场景图为 1672×941 PNG/RGB。
- 基础完整性：0 损坏、0 空图、0 主体触边、0 裁切、0 `#00ff00` 残留、0 精确重复、0 大小写路径冲突。
- 资产级视觉：70 张 Avatar 与 11 张场景/对象资产均清晰、主体完整，当前未发现必须重新生成的图片。
- 项目接入：仅 22 张当前流程可达，17 张已配置但当前流程不触发，42 张新 Avatar 只登记在磁盘/生成报告中，应用源码尚不能消费。
- 关键场景错误：静态工位仍选择旧的正面 `at-desk.png`，使角色面对镜头而不是上方显示器；正确的 `seated-idle-back` / `seated-working-back` 已存在，但没有接入。

因此，严格结论为：**图片本体没有缺失，主要阻塞项是运行时状态映射；另有 PNG 透明区数据需要无损清理。**

## 预期资产矩阵

| 类别 | 预期 | 实际 | 结果 |
|---|---:|---:|---|
| Scene | 1 | 1 | 通过 |
| Furniture | 4 | 4 | 通过 |
| Artifact | 3 | 3 | 通过 |
| Orb | 3 | 3 | 通过 |
| Avatar 旧四姿势 | 28 | 28 | 通过 |
| Avatar 坐姿 | 14 | 14 | 通过 |
| Avatar 上下方向移动/携带 | 28 | 28 | 通过 |
| 合计 | 81 | 81 | 通过 |

当前项目合同未声明 `walk-left/right` 或 `carry-left/right` 独立文件；通用 `walk/carry` 与上下方向变体已经构成现有矩阵，因此不能把未声明的左右文件误报为缺失。

## 分级问题（2026-07-15 历史快照）

### P0：运行时状态接入错误

1. `AvatarSprite` 的静态工位仍固定读取旧 `atDesk` 资源。现有应用截图确认，人物正脸朝镜头，而显示器、键盘位于人物上方。
2. 14 张坐姿与 28 张方向移动/携带图均未进入 `officeLayout` 类型、JSON 资产清单和状态选择逻辑。
3. 新坐姿需要专用纵向/源锚点，不能直接复用旧 `at-desk` 锚点。

影响：图片虽已交付，但前端无法显示正确的 Idle/Working 与上下移动状态。

**2026-07-16 处置：已解决。** Task 1/2 已注册全部 42 张新 Avatar，接入 Active Work 与路线方向选择，并使用专用坐姿尺寸/锚点。

### P1：35 张 PNG 的完全透明区残留 RGB

以下素材在 `alpha=0` 区域保留了整幅浅色棋盘或噪声 RGB：

- 3 张 Artifact；
- Alice、Jack、Kara、Leo、Quinn、Rita 各自旧四姿势，共 24 张；
- 4 张 Furniture；
- 3 张 Orb。

另有 `images/avatars/Kara/walk-down.png` 的 1 个远场透明 RGB 像素纳入同一批次。采用 2px Chebyshev 轮廓保护后的正确实测为：34 文件组 33,521,337 → 10,260,945 bytes；加入 Kara 后 35 文件总计 33,781,582 → 10,502,131 bytes，共清除 43,261,599 个像素。早期 29,769,646 → 9,968,631 的估算没有保留完整 2px 轮廓，因此不再作为验收依据。

**2026-07-16 处置：已解决。** 唯一生产事务已提交 35/35 目标；备份、候选和提交后源文件均经 SHA 与解码不变量复核，46/46 非目标图片未改变。

### P1：资产清单与测试覆盖落后

- `docs/office-assets-and-layout.md` 只列出 37 条唯一资产路径，遗漏 42 张新 Avatar 及 `desk-chair-back.png`、`desk-front.png`。
- 当前测试主要断言源码字符串，没有对 42 张新资产做真实文件存在、尺寸、模式、锚点与场景选图检查。

**2026-07-16 处置：已解决。** 文档已补齐拆分桌层和 42 张新 Avatar；前端与 Python 持久门禁覆盖真实 81 文件及运行时选图合同。

### P2：导出管线与运行性能需规范

- Alpha 分布为 31 张二值透明、49 张软 Alpha、1 张不透明场景，说明旧/新素材来自不同导出管线。
- `Kara/walk-down.png` 另有 2,653 个透明像素残留 RGB，规模较小，可随清理批次处理。
- 80 张 1254×1254 RGBA 若同时解码，理论驻留内存约 485.9 MiB；前端应按状态按需加载，不应一次预加载全部姿势。
- 全库使用高分辨率像素风与柔和渐变，而不是严格低色板像素画。CSS 已使用 `image-rendering: pixelated`；在未确定新的美术基准前，不应仅凭色数批量判废或重生。

## 视觉验收摘要

- 70/70 Avatar：主体清晰、无空图、无裁切，7 名角色在十张姿势中的身份总体连续。
- 14/14 坐姿：严格背向上方工位、身体居中、腿部收在椅区；Working 双手向上，Idle 手臂下放。
- 28/28 方向移动：上下方向、身份、Carry Artifact 有无均正确。
- Scene：完整，无破洞或错误裁切；不含桌子属于预期，因为桌子由 Furniture 层叠加。
- Furniture：拆分椅背和桌前层单独看存在中部空洞是预期，必须按 `chair-back → avatar → desk-front` 合成验收。
- Artifact/Orb：在实际目标尺寸下仍可辨认；Orb 柔光与 Furniture 接触阴影属于类别设计，不按 Avatar 的“无阴影”规则判错。

## 引用与缺失判断（2026-07-15 历史快照）

| 引用状态 | 数量 | 含义 |
|---|---:|---|
| `runtime_reachable` | 22 | 当前渲染或故事流程可以实际选到 |
| `configured_latent` | 17 | 已在 JSON/配置出现，但当前流程不会触发 |
| `documented_unwired` | 42 | 文件存在且视觉通过，但尚无运行时清单/状态逻辑 |

逐文件结果见 `reference-matrix.csv`。结论中的“42 张未接入”不是“42 张缺图”。

当前复验中 81 条路径均已注册；历史 `documented_unwired=42` 已归零，不再代表现行运行时状态。

## 证据

- `inventory.csv`：81 张逐文件格式、尺寸、哈希、Alpha、主体边界与启发式指标。
- `technical-audit.json`：全量技术扫描原始结果。
- `reference-matrix.csv`：逐文件引用状态、技术债与建议动作。
- `contact-sheets/avatars-actual-180px.png`：Avatar 实际渲染尺寸对照。
- `contact-sheets/avatars-normalized-detail.png`：Avatar 归一化细节对照。
- `contact-sheets/props-normalized-and-actual.png`：Scene/Furniture/Artifact/Orb 对照。
- 既有最终坐姿与移动合成证据：`.planning/2026-07-15-avatar-seated-regeneration/seated-after-contact-sheet.png`、`movement-after-contact-sheet.png`。
- 当前错误状态的应用证据：`apps/office-demo/screenshots/task6-desktop-1920.png`、`task5-gate0-seated-audit.png`。
- Scheme A 资产门禁：`.planning/2026-07-15-images-full-audit/task-4-asset-audit.json`（81/81 pass）。
- PNG 生产事务：`.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T032947567Z-immutable-snapshot-apply-04230893/report.json`。
- 最终运行时与命令证据：`.planning/2026-07-15-images-full-audit/scheme-a-final-validation.json` 及 Scheme A runtime contact sheet（完成最终复验后写入）。
