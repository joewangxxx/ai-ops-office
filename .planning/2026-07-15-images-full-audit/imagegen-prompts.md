# ImageGen 修复提示词

## 使用边界

本轮审计没有发现必须立即重生的图片。下列提示词是“完成无损清理和前端接入后，若单张素材仍在人工合成验收中失败”的备用模板。

- 每次只处理一个目标文件，不批量生成多角色或多姿势拼图。
- 最多 5 张参考图；每张参考图只承担明确职责。
- Avatar/Furniture/Artifact/Orb 先生成纯 `#00ff00` 背景源图，再用本地色键工具转为 RGBA；角色或对象内部不得使用 `#00ff00`。
- 不直接覆盖正式图。先保存 candidate、去绿后的 alpha 文件、技术分析和合成 contact sheet，验收通过后再提升。

## Prompt A：Avatar 坐姿背面修复

建议参考图，不超过 5 张：

1. 目标角色身份图 `idle.png`；
2. 目标角色另一张身份/服装图 `at-desk.png`；
3. 目标角色或可信基准的 `walk-up.png`，只理解背面发型与服装；
4. 已通过的 Alice 或 Quinn 同状态坐姿，只理解零偏航构图与腿部区域；
5. 工位合成参考，只理解尺度、朝向和相机角度。

```text
Use case: fixed-office-map character sprite
Asset type: {seated-idle-back | seated-working-back}

Create one isolated sprite of {CHARACTER} seated at a workstation, viewed strictly from behind. The character's yaw is 0 degrees and the torso faces exactly toward the top edge of the image, as if facing a monitor located directly above. The camera is slightly top-down office-map pixel art, but the body itself must not be three-quarter or side-facing.

Identity lock: preserve {CHARACTER}'s exact hairstyle, hair color, clothing colors, body proportions, and recognizable pixel-art identity from Images 1–3. Do not borrow another character's face, hair, outfit, or palette. No visible face or eyes.

Pose:
- For seated-idle-back: upright back, relaxed centered shoulders, arms resting symmetrically beside the torso or near the lap; clearly idle; not typing.
- For seated-working-back: keep the same head, torso, hip, and leg silhouette as the approved idle pair; only the forearms change, extending symmetrically upward toward an implied keyboard.
- Both legs stay compact and centered inside the chair area. No standing, walking, twisting, side-sitting, or reaching to the right.

Composition: generate the character only. No desk, chair, monitor, keyboard, Artifact, Agent orb, labels, UI, room, floor, shadow, glow, text, watermark, or border. Center on a 1254 × 1254 canvas with generous empty padding. Match the workstation reference scale and the approved pair's foot/seat anchor. Suitable for layering between chair-back and desk-front.

Style: polished high-resolution office pixel art matching the references: hard pixel structure, consistent pixel density, controlled shading, no painterly blur, no vector-smooth edges, no photographic detail.

Background: perfectly flat solid #00ff00 over every background pixel, with no texture, gradient, lighting variation, checkerboard, or shadow. Never use #00ff00 inside the character.
```

角色身份锁定补充：

- Alice：棕发、高丸子髻、黑色长袖套装。
- Bob：深色蓬松短发、深蓝上衣；眼镜仅在正面可见，背面不得画正面镜框。
- Jack：尖刺深发、亮钴蓝上衣。
- Kara：紫色齐肩短发、紫色服装；背面不得出现正面胸章。
- Leo：深色侧分发、深蓝上衣；背面不得出现眼镜正面。
- Quinn：深色整齐短发、亮蓝上衣；背面不得出现眼镜正面或胸章。
- Rita：坐姿保持棕色披发与白色上衣；不要误用移动姿势中的马尾。

## Prompt B：上下方向 Walk/Carry 修复

建议参考图：目标角色身份图、同角色通用 `walk/carry`、已通过的相反方向图、Office Shell、Carry 时的 Artifact 参考。按目标状态删去无关参考，最多 5 张。

```text
Use case: office-map directional character sprite
Asset type: {walk-up | walk-down | carry-up | carry-down}

Create one isolated full-body sprite of {CHARACTER} in a single readable walking pose. Preserve the exact identity, hairstyle, hair color, clothing, body proportions, pixel density, and palette from the identity references.

Direction contract:
- up means the character faces exactly toward the top edge and is seen from behind; no visible face or eyes.
- down means the character faces exactly toward the bottom edge and is seen from the front; preserve only the facial details supported by the references.
- Do not rotate toward the left or right and do not create a three-quarter side view.

State contract:
- walk: hands free, no Artifact or extra object.
- carry: hold exactly one small blank manila project folder matching the Artifact reference; no words, symbols, UI, badge-like text, or additional object. For up, the folder may be visible at one side without twisting the torso. For down, it is held naturally in front or at one side while the body still faces downward.

Composition: character only on a 1254 × 1254 canvas, centered using the approved movement foot anchor and scale. No floor, furniture, cast shadow, contact shadow, glow, label, speech bubble, border, watermark, or scene.

Style: polished office-map pixel art matching the supplied references, consistent hard pixel structure and shading, no painterly blur or vector smoothing.

Background: one perfectly uniform #00ff00 color. No texture, gradient, checkerboard, lighting variation, or floor. Do not use #00ff00 in the character or folder.
```

## Prompt C：Artifact / Furniture / Orb 单图修复

```text
Edit the supplied target asset, not redesign it. Preserve its exact silhouette, orientation, scale, center anchor, pixel density, material colors, and role in the existing office-map composition. Repair only this defect: {DEFECT_DESCRIPTION}.

Output exactly one isolated {Artifact | Furniture layer | Agent orb} on a 1254 × 1254 square canvas. Keep the visible bounding box and anchor within ±2 pixels of the approved target unless the defect itself is incorrect alignment.

Category rules:
- Artifact: one readable project-document object, no text or symbols, no shadow or glow.
- Furniture layer: preserve the split-layer geometry needed for chair-back → avatar → desk-front composition; do not fill intentional transparent holes; retain only the approved contact shading.
- Agent orb: preserve the approved colored core and restrained soft glow; no floor or cast shadow.

No extra objects, UI, text, watermark, border, floor, room, or background scene. Match the existing high-resolution office pixel-art palette and hard pixel structure.

Background: perfectly flat solid #00ff00 with no variation. Do not use #00ff00 inside the asset.
```

## Prompt D：Scene 局部修复（仅在真实场景缺陷时）

场景坐标是布局基准，整图重生风险最高；仅允许在明确局部破损时编辑原图。

```text
Edit the supplied 1672 × 941 office-shell scene and repair only this localized defect: {DEFECT_DESCRIPTION}. Preserve every wall, doorway, room boundary, floor region, corridor, perspective line, pixel density, palette, and coordinate outside the marked defect exactly. Do not add desks, chairs, characters, Artifacts, Agent orbs, labels, UI, text, shadows from missing objects, watermark, or border. Maintain the existing slightly top-down high-resolution pixel-art treatment. Output one complete 1672 × 941 opaque RGB scene with no transparency and no geometry shift.
```

Scene 候选必须通过与原图的区域差分；缺陷区域外出现任何几何变化即拒绝，不能仅凭“看起来相似”覆盖布局基底。

