# 28 张 Avatar 左右方向素材生成 Goal Prompt

```text
[$imagegen](C:\Users\29929\.codex\skills\.system\imagegen\SKILL.md)

请在 Goal 模式下完成 AI-Wrokspace 的 28 张 Avatar 左右方向移动素材。任务必须持续到所有目标图片生成、透明化、逐张验收、成组验收并保存到正式目录；任何未通过图片都不能冒充完成。

项目根目录：
C:\Users\29929\Desktop\AI-Wrokspace

一、前置条件与安全边界

1. 当前已有 81 张图片的修复任务必须已经结束。开始前检查现有参考素材是否稳定；如果仍有其他任务写入 `images/`，停止生成并报告，不要基于混合版本继续。
2. 对任务开始时已经存在的全部 `images/**/*.png` 生成 SHA-256 基线清单。任务结束时复核：除本任务白名单中的 28 个新文件外，不能修改、覆盖、删除或重命名任何现有图片。
3. 不覆盖现有 `idle.png`、`at-desk.png`、`walk.png`、`carry.png`、`seated-*.png`、`walk-up/down.png` 或 `carry-up/down.png`。
4. 不修改前端代码、故事引擎、`docs/office-layout.json`、场景坐标或已有业务数据。
5. 生成候选图和验证证据可以写入 `tmp/imagegen/horizontal-movement/` 与 `.planning/2026-07-16-avatar-horizontal-generation/`。
6. 如果任一目标文件已经存在，不得覆盖；先停止并报告该文件来源与状态。

二、精确目标白名单

角色：`Alice`、`Bob`、`Jack`、`Kara`、`Leo`、`Quinn`、`Rita`。

每个角色必须新增以下 4 张，共 7 × 4 = 28 张：

- `images/avatars/<CHARACTER>/walk-left.png`
- `images/avatars/<CHARACTER>/walk-right.png`
- `images/avatars/<CHARACTER>/carry-left.png`
- `images/avatars/<CHARACTER>/carry-right.png`

`left/right` 均指办公室场景画面的左/右方向，不是角色自身左右手，也不是文件夹所在侧。

三、参考图规则

每次只生成一个目标文件，每次 ImageGen 调用最多使用 5 张明确标注职责的参考图。

Walk 参考图：
1. 同角色 `idle.png`：正面身份、发型、服装和配色。
2. 同角色 `walk.png`：侧向行走动作和身体比例参考，不得直接镜像复制。
3. 同角色 `walk-up.png`：背面身份、像素密度和移动尺度。
4. 同角色 `walk-down.png`：正面身份、像素密度和移动尺度。
5. `images/scene/office-shell.png`：仅用于理解稍俯视办公室视角和最终场景比例。

Carry 参考图：
1. 同角色 `idle.png`：身份、发型、服装和配色。
2. 同角色 `carry.png`：侧向携带动作参考，不得直接镜像复制。
3. 同角色 `carry-up.png`：文件夹形状、背面身份和尺度。
4. 同角色 `carry-down.png`：文件夹形状、正面身份和尺度。
5. `images/scene/office-shell.png`：仅用于理解相机视角和最终比例。

先用 `view_image` 检查实际参考图。若某张参考图仍处于待修复状态、无法解码、身份错误或方向错误，不得使用它，停止该角色并报告阻塞。

四、角色身份锁

- Alice：棕色头发、高圆发髻、黑色长袖套装；不得变成披发或马尾。
- Bob：蓬松黑色短发、矩形眼镜、深海军蓝上衣和浅色竖向门襟、无胸章，身形相对修长。
- Jack：尖刺黑发、无眼镜、亮钴蓝翻领上衣、黑裤黑鞋；可见正面时仅保留左胸小白色标记。
- Kara：饱和紫色齐肩短发、圆润头顶和外翻发梢、紫色上衣、娇小体型；可见正面时仅一个金色四角胸章。
- Leo：黑色侧分发、矩形眼镜、低饱和深蓝上衣、左胸小浅色方形标记、偏瘦体型。
- Quinn：整齐圆润黑色短发和小后发束、大号方框眼镜、亮蓝上衣、左胸白色方形标记、紧凑体型。
- Rita：移动姿势使用暖栗色长侧刘海和中高位弧形马尾、白色翻领上衣和深色领口细节；不得变成 Alice 的圆发髻，也不得误用 seated 图中的披发造型。

五、每张图使用的 ImageGen Prompt 模板

将 `{CHARACTER}`、`{STATE}` 和 `{DIRECTION}` 替换为当前目标；每个目标必须单独调用内置 `image_gen`，不能生成拼图后裁切，也不能一次调用生成多个不同素材。

Use case: stylized-concept
Asset type: office-map directional character sprite, {STATE}-{DIRECTION}

Input images:
- Image 1: {CHARACTER} identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective reference. Use only for camera angle and final scene scale.

Primary request:
Create exactly one isolated full-body pixel-art sprite of {CHARACTER} in one clearly readable {STATE} pose, natively facing and moving toward the {DIRECTION} edge of the canvas.

Direction contract:
- left means the head, nose/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head, nose/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, or clone the opposite-direction image. Preserve physically correct hair asymmetry, clothing details, hand placement, and occlusion.

State contract:
- For walk: hands are empty and swing naturally; no folder, Artifact, phone, tool, or other object.
- For carry: hold exactly one blank light-tan manila project folder matching the existing carry-up/down references. The folder must have clear edges, visible hand contact, and remain readable when the full 1254 canvas is rendered at 180 × 180. No words, logo, icon, label, badge, second folder, bag, box, shield, or loose paper.

Identity lock:
Apply the exact {CHARACTER} identity specification supplied in this task. Do not borrow another character's hair, face, glasses, clothing, body shape, badge, or palette. Side-view facial and glasses details must remain anatomically consistent with the chosen direction.

Composition:
Generate the character only on a 1254 × 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

六、候选图、透明化与重试

1. 内置 `image_gen` 每次只生成一张图。候选源图保存为：
   `tmp/imagegen/horizontal-movement/<CHARACTER>/<POSE>/attempt-<N>-source.png`。
2. 使用安装好的工具去绿，不使用自写抠图算法：
   `python C:\Users\29929\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py --input <source> --out <candidate-alpha.png> --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`
3. 若仅有轻微边缘残绿，可在检查后重跑一次并加入 `--edge-contract 1`；不得通过侵蚀人物轮廓掩盖生成缺陷。
4. 每个目标最多 3 次 ImageGen 尝试。每次失败必须记录一个明确缺陷，下一次只针对该缺陷调整 Prompt。
5. 三次仍不通过时，将目标标记为 `blocked`，保留证据并报告；不得选择最不差的版本冒充通过。

七、验收标准

每张图必须同时通过自动技术检查和人工视觉检查。

自动技术检查：
- PNG、RGBA、1254 × 1254。
- 四角透明，主体不接触画布边缘，无裁切。
- 主体和文件夹形成一个合理前景组件，无孤立像素、绿色残边或额外物体。
- 不存在强绿色可见像素；透明区无会在缩放后形成色边的隐藏绿色污染。
- 记录 alpha bbox、可见像素、前景组件、底部中心脚点和 180 × 180 实际可见尺寸。

人工视觉检查：
- 角色身份、发型、服装、眼镜和胸章正确。
- 左右方向严格正确，动作清楚，不是上下或三分之四视角。
- Walk 双手为空；Carry 恰好携带一个空白浅棕文件夹。
- 文件夹在 180 × 180 下仍然清楚，不像包、盾、盒子或皮肤色块。
- 无桌椅、光球、文字、阴影、地面、UI 或场景残留。
- 左右图是独立生成的真实姿势，不是像素镜像；自动相似度只能作为提示，最终需人工检查头发、手、腿和文件夹遮挡关系。

成组检查：
- 同一角色四张新图与其 `walk-up/down`、`carry-up/down` 同屏比较，身份和像素密度一致。
- 同一角色 left/right 的视觉身高差不超过约 10%，脚底基线和身体中心无明显跳动。
- 以 180 × 180 渲染到 `office-shell.png` 的代表性 PM→Hub、Dev→Hub、QA→Hub 横向位置，确认比例、清晰度和脚点正确。
- 生成 7 行 × 4 列透明背景 contact sheet，以及包含上下方向对照的 movement contact sheet。

八、晋级与交付

1. 候选图只有在单图和成组检查都通过后，才能晋级到目标正式路径。
2. 每完成一个角色的 4/4 验收后可以原子性晋级该角色；前端仍不得接入，直到全量 28/28 通过。
3. 输出：
   - 28 张正式透明 PNG。
   - `.planning/2026-07-16-avatar-horizontal-generation/asset-status-manifest.json`。
   - `.planning/2026-07-16-avatar-horizontal-generation/horizontal-validation.json`。
   - `.planning/2026-07-16-avatar-horizontal-generation/prompt-set.md`。
   - `.planning/2026-07-16-avatar-horizontal-generation/baseline-sha256.csv`。
   - contact sheets 和 office-shell 实景合成验收图。
   - `docs/avatar-horizontal-asset-generation-report.md`，逐张记录引用、尝试次数、技术结果、视觉结论和最终路径。
4. 最终复核必须满足：目标文件 28/28、自动技术通过 28/28、人工方向/身份/动作通过 28/28、场景合成通过 28/28、原有图片非目标哈希变化 0。
5. 只有全部条件成立才报告 Goal 完成。若存在缺图、阻塞、未验收或旧文件被改动，必须明确报告，不能宣称完成。
```
