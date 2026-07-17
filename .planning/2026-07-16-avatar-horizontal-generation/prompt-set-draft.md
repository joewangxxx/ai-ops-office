# Horizontal Avatar Prompt Set 与状态清单草案

> 用途：作为最终 `prompt-set.md` 与 `asset-status-manifest.json` 的结构来源。本文不是最终验收结论；正式状态必须在全部生成结束后从磁盘、哈希和显式 QA 记录重新计算，不能复制某次中途计数。

## 1. 不可变执行约束

- 精确目标为 7 个角色 × 4 个姿势，共 28 张：`walk-left`、`walk-right`、`carry-left`、`carry-right`。
- 每个目标必须独立调用一次内置 ImageGen；禁止一次生成拼图后裁切，禁止用镜像制造反方向图。
- 每个目标最多 3 次生成尝试。失败尝试也必须进入清单；即使调用失败且没有产生文件，也不能从尝试总数中消失。
- 每次调用只使用同角色 4 张动作/身份参考图与 `images/scene/office-shell.png`，总计最多 5 张。
- ImageGen 源图保存到 `tmp/imagegen/horizontal-movement/<Actor>/<pose>/attempt-<N>-source.png`，统一去绿结果保存为同目录的 `attempt-<N>-alpha.png`。
- 只使用安装好的 `remove_chroma_key.py` 去绿；默认参数为 `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`。只有确认存在轻微边缘残绿后，才允许额外执行一次 `--edge-contract 1`。
- 不缩放生成源图来满足规格。源图或透明图不是原生 `1254 × 1254` 时，必须拒绝并重新生成。
- 正式文件只有在单图技术、人工视觉、180×180、场景合成与角色 4/4 成组验收全部通过后才能晋级。
- 原始 81 张图片以 `baseline-sha256.csv` 为冻结基线；28 个白名单以外的旧文件哈希变化必须为 0。

## 2. 参考图集合

### Walk

1. `images/avatars/{Actor}/idle.png`：身份、发型、服装、配色与正面细节。
2. `images/avatars/{Actor}/walk.png`：侧向行走结构和体型尺度；只作结构参考，不得复制或镜像。
3. `images/avatars/{Actor}/walk-up.png`：背面身份、像素密度与移动尺度。
4. `images/avatars/{Actor}/walk-down.png`：正面身份、像素密度与移动尺度。
5. `images/scene/office-shell.png`：只用于稍俯视办公室视角与最终场景比例。

### Carry

1. `images/avatars/{Actor}/idle.png`：身份、发型、服装与配色。
2. `images/avatars/{Actor}/carry.png`：侧向携带动作结构；只作结构参考，不得复制或镜像。
3. `images/avatars/{Actor}/carry-up.png`：背面身份、文件夹形状与尺度。
4. `images/avatars/{Actor}/carry-down.png`：正面身份、文件夹形状与尺度。
5. `images/scene/office-shell.png`：只用于相机角度和最终比例。

每次生成前先查看 5 张实际参考图。任何参考图如果无法解码、身份错误、方向错误或仍待修复，该角色应暂停而不是继续猜测。

## 3. 七个角色身份锁

| 角色 | 必须保留 | 必须排除 | 左胸标记规则 |
|---|---|---|---|
| Alice | 暖棕色头发、辨识度高的高圆发髻、圆润短发轮廓、黑色长袖套装、紧凑体型 | 披发、马尾、Rita 发型、其他角色配色 | 无胸章；左右方向都不得凭空新增 |
| Bob | 蓬松黑色短发、粗矩形黑框眼镜、深海军蓝上衣、浅色竖向门襟、相对修长体型 | 胸章、无眼镜、亮蓝 Quinn 上衣、圆胖体型 | 明确无胸章；左右方向都不得出现标记 |
| Jack | 尖刺且略不对称的黑发、无眼镜、亮钴蓝翻领上衣、黑裤黑鞋 | 眼镜、顺直圆发、多个标记、浅蓝或紫色上衣 | 解剖学左胸仅一个小白色标记；朝右时可见，朝左时完全被远侧遮挡 |
| Kara | 饱和紫色齐肩发、圆润头顶、外翻发梢、紫色上衣、娇小体型 | 长马尾、黑发、蓝衣、重复胸章 | 解剖学左胸仅一个金色四角胸章；朝右时可见，朝左时完全被远侧遮挡 |
| Leo | 黑色侧分发与扫向一侧的前发、矩形眼镜、低饱和深蓝上衣、偏瘦体型 | 无眼镜、Bob 的浅色门襟、Quinn 的大方框比例、重复标记 | 解剖学左胸仅一个小浅色方形标记；朝右时可见，朝左时完全被远侧遮挡 |
| Quinn | 整齐圆润黑色短发、小后发束、大号方框黑眼镜、亮蓝上衣、紧凑体型 | 普通小眼镜、无后发束、Bob/Leo 深蓝配色、重复标记 | 解剖学左胸仅一个白色方形标记；朝右时可见，朝左时完全被远侧遮挡 |
| Rita | 移动姿势专用的暖栗色长侧刘海、中高位弧形马尾、白色翻领上衣、窄深色领口、深色裤子 | Alice 圆发髻、`seated` 披发造型、黑色上衣、胸章 | 无胸章；左右方向都不得凭空新增 |

### 胸章/标记可见性约定

方向指场景画面方向，不是角色自身左右手。严格侧面朝右时，角色解剖学左胸是近侧，所以 Jack、Kara、Leo、Quinn 的唯一标记应出现；严格侧面朝左时，解剖学左胸是远侧，标记必须被身体遮挡。Carry 朝右时，文件夹位置仍须让唯一胸标保持可读，不能把胸标误画到文件夹、袖子或另一侧；Carry 朝左时不能为了“补全身份”而把远侧胸标移到近侧。

## 4. 通用 ImageGen Prompt 主体

下面的通用主体必须与第 5 节的角色身份锁和第 6 节的具体姿势补丁拼接成一次完整调用。最终 `prompt-set.md` 应保存每次调用的完整展开文本，而不只保存变量模板。

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, {STATE}-{DIRECTION}

Input images:
- Image 1: {CHARACTER} identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective reference. Use only for camera angle and final scene scale.

Primary request:
Create exactly one isolated full-body pixel-art sprite of {CHARACTER} in one clearly readable {STATE} pose, natively facing and moving toward the {DIRECTION} edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
{STATE_CONTRACT}

Identity lock:
{IDENTITY_LOCK}

Direction-specific identity detail:
{DIRECTION_IDENTITY_DETAIL}

Composition:
Generate the character only on a native 1254 × 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

## 5. 身份锁展开文本

这些句子分别替换 `{IDENTITY_LOCK}`。

- **Alice**：`Preserve Alice's warm brown hair, distinctive high round bun, rounded bob-like hair silhouette, black long-sleeve outfit, compact proportions, and established pixel-art identity. Never give her loose hair, a ponytail, Rita's hairstyle, a chest badge, or another character's palette.`
- **Bob**：`Preserve Bob's fluffy short black hair, thick rectangular black glasses, deep navy collared top with one pale vertical center placket, black trousers, slim/tall proportions, and established pixel-art identity. Bob has no chest badge; do not add one.`
- **Jack**：`Preserve Jack's asymmetric spiky black hair, no glasses, bright cobalt collared top, black trousers and black shoes, slim office-map proportions, and established pixel-art identity. His only possible mark is one small white mark on the anatomical left chest.`
- **Kara**：`Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest.`
- **Leo**：`Preserve Leo's black side-parted hair with swept forelock, rectangular glasses, muted dark-blue collared top, slim proportions, and established pixel-art identity. His only possible badge is one small pale square on the anatomical left chest.`
- **Quinn**：`Preserve Quinn's neat rounded black short hair with a small rear tuft, oversized square black glasses, bright royal-blue top, compact proportions, and established pixel-art identity. His only possible badge is one white square on the anatomical left chest.`
- **Rita**：`Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.`

## 6. 四种姿势补丁

### `walk-left`

- `{STATE}` = `walk`
- `{DIRECTION}` = `left`
- `{STATE_CONTRACT}` = `Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.`
- `{DIRECTION_IDENTITY_DETAIL}`：
  - Alice、Bob、Rita：`No chest badge or chest mark is present.`
  - Jack：`The anatomical left chest is on the far side and fully occluded; show no white chest mark in this left-facing profile.`
  - Kara：`The anatomical left chest is on the far side and fully occluded; show no gold badge in this left-facing profile.`
  - Leo：`The anatomical left chest is on the far side and fully occluded; show no pale square badge in this left-facing profile.`
  - Quinn：`The anatomical left chest is on the far side and fully occluded; show no white square badge in this left-facing profile.`

### `walk-right`

- `{STATE}` = `walk`
- `{DIRECTION}` = `right`
- `{STATE_CONTRACT}` = `Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.`
- `{DIRECTION_IDENTITY_DETAIL}`：
  - Alice、Bob、Rita：`No chest badge or chest mark is present.`
  - Jack：`The anatomical left chest is the visible near side; show exactly one small white left-chest mark, and no other badge or duplicate mark.`
  - Kara：`The anatomical left chest is the visible near side; show exactly one gold four-corner left-chest badge, and no duplicate or migrated badge.`
  - Leo：`The anatomical left chest is the visible near side; show exactly one small pale square left-chest badge, and no duplicate or migrated badge.`
  - Quinn：`The anatomical left chest is the visible near side; show exactly one white square left-chest badge, and no duplicate or migrated badge.`

### `carry-left`

- `{STATE}` = `carry`
- `{DIRECTION}` = `left`
- `{STATE_CONTRACT}` = `Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 × 180 full-canvas render. No words, logo, icon, label, badge, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.`
- `{DIRECTION_IDENTITY_DETAIL}`：与 `walk-left` 相同；Jack、Kara、Leo、Quinn 的远侧左胸标记必须完全遮挡，不能移动到文件夹、袖子或身体近侧。

### `carry-right`

- `{STATE}` = `carry`
- `{DIRECTION}` = `right`
- `{STATE_CONTRACT}` = `Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 × 180 full-canvas render. No words, logo, icon, label, badge, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.`
- `{DIRECTION_IDENTITY_DETAIL}`：与 `walk-right` 相同；Jack、Kara、Leo、Quinn 的唯一左胸标记应在近侧可见，文件夹不能遮掉它，也不能把它复制到文件夹、袖子或身体另一侧。

## 7. 重试 Prompt 记录规则

每次尝试都保存“完整 Prompt + Prompt SHA-256 + 结果”，不要只记录差异。第一次使用完整基准 Prompt；后续重试在完整基准 Prompt 末尾追加一个、且只有一个针对已观察缺陷的修正段。例如：

```text
Targeted correction for attempt 2 only:
Keep the native character silhouette approximately 8% smaller so its alpha-bbox height matches the accepted opposite-direction sprite. Do not resize after generation and do not change identity, direction, action, or props.
```

允许的失败处置值：`generation_failed`（调用无输出）、`rejected_technical`、`rejected_visual`、`rejected_group_scale`、`accepted`。第三次仍未通过时才标记 `blocked`。非最终 attempt 不应仅因“哈希未匹配正式文件”就自动推断具体拒绝原因；原因必须来自显式人工记录。

## 8. 最终 `prompt-set.md` 建议结构

按固定顺序 `Alice → Bob → Jack → Kara → Leo → Quinn → Rita`，每人依次 `walk-left → walk-right → carry-left → carry-right`。每个目标写：

1. 目标 ID 与正式路径。
2. 五张参考图及各自角色。
3. 每个 attempt 的完整展开 Prompt、Prompt SHA-256、调用方式（内置 ImageGen）与结果。
4. 被拒 attempt 的单一明确缺陷，以及下一 attempt 的唯一修正项。
5. 最终接受的 attempt 编号；若仍未通过则明确写 `blocked`，不得提供伪最终项。

## 9. `asset-status-manifest.json` 字段设计

### 顶层字段

```json
{
  "schema_version": "1.0",
  "generated_at": "ISO-8601 with timezone",
  "project_root": "C:/Users/29929/Desktop/AI-Wrokspace",
  "source_spec": "docs/avatar-horizontal-generation-goal-prompt.md",
  "prompt_set": ".planning/2026-07-16-avatar-horizontal-generation/prompt-set.md",
  "baseline": {
    "path": ".planning/2026-07-16-avatar-horizontal-generation/baseline-sha256.csv",
    "expected_original_count": 81,
    "verified_at": null,
    "status": "pending",
    "changed": [],
    "missing": [],
    "unexpected_non_target_files": []
  },
  "summary": {
    "expected": 28,
    "promoted": 0,
    "technical_pass": 0,
    "visual_pass": 0,
    "scene_pass": 0,
    "blocked": 0,
    "incomplete": 28,
    "all_complete": false
  },
  "assets": []
}
```

### 每张资产字段

```json
{
  "id": "Alice/walk-left",
  "actor": "Alice",
  "pose": "walk-left",
  "state": "walk",
  "direction": "left",
  "target_path": "images/avatars/Alice/walk-left.png",
  "status": "missing",
  "identity_lock_id": "Alice",
  "pose_contract_id": "walk-left",
  "references": [
    {"path": "images/avatars/Alice/idle.png", "role": "identity"}
  ],
  "attempt_count": 0,
  "attempts": [],
  "accepted_attempt": null,
  "accepted_alpha_path": null,
  "accepted_alpha_sha256": null,
  "group_qa": {
    "status": "pending",
    "actual_180_status": "pending",
    "scene_status": "pending",
    "scene_evidence": null,
    "group_evidence": null,
    "pair_bbox_height_delta_percent": null,
    "notes": []
  },
  "promotion": {
    "status": "not_promoted",
    "promoted_at": null,
    "baseline_reverified_before_copy": false,
    "candidate_final_hash_match": false
  },
  "final": {
    "exists": false,
    "path": "images/avatars/Alice/walk-left.png",
    "sha256": null,
    "bytes": null
  },
  "audit_flags": []
}
```

### 每次 attempt 字段

```json
{
  "attempt": 1,
  "prompt_id": "Alice/walk-left/attempt-1",
  "prompt_sha256": null,
  "imagegen_mode": "built-in",
  "source": {
    "exists": false,
    "path": "tmp/imagegen/horizontal-movement/Alice/walk-left/attempt-1-source.png",
    "sha256": null,
    "bytes": null
  },
  "alpha": {
    "exists": false,
    "path": "tmp/imagegen/horizontal-movement/Alice/walk-left/attempt-1-alpha.png",
    "sha256": null,
    "bytes": null,
    "chroma_command": null,
    "edge_contract": 0
  },
  "disposition": "pending",
  "defect": null,
  "technical_qa": {
    "status": "pending",
    "format": null,
    "mode": null,
    "width": null,
    "height": null,
    "corners_transparent": null,
    "alpha_bbox": null,
    "visible_pixels": null,
    "foreground_components": null,
    "visible_green_pixels": null,
    "hidden_green_contamination": null,
    "foot_anchor": null,
    "visible_bbox_180": null,
    "evidence_path": null
  },
  "visual_qa": {
    "status": "pending",
    "identity": "pending",
    "direction": "pending",
    "action": "pending",
    "hands_props": "pending",
    "badge_visibility": "pending",
    "no_extras_or_shadow": "pending",
    "independent_not_mirrored": "pending",
    "reviewed_at": null,
    "notes": []
  }
}
```

## 10. 从候选目录和 QA 证据提取清单的方法

### 10.1 只从白名单开始

不要把目录中偶然出现的 PNG 当成目标。先构造固定 28 个 `(actor, pose)`，再对每个目标检查正式路径和候选目录。

### 10.2 发现并配对 attempt

- 候选目录：`tmp/imagegen/horizontal-movement/<Actor>/<pose>/`。
- 文件名正则：`^attempt-(\d+)-(source|alpha)\.png$`。
- 按 attempt 数字升序分组，分别填充 `source` 与 `alpha`。
- 对每个现存文件按原始字节流计算 SHA-256 和字节数；不要对图片重新保存后再计算。
- `source` 与 `alpha` 哈希通常不同，这是去绿的正常结果；被接受的 `alpha` 与正式文件必须完全同哈希。
- 文件系统无法发现“调用失败且无输出”的 attempt，例如网络失败。必须合并显式 attempt 日志/`prompt-set.md`，否则 `attempt_count` 会被低估。

### 10.3 自动技术 QA

- 对每个透明候选调用现有 `tmp/imagegen/validation/avatar_asset_validator.py` 的 `analyze_image` 与 `derive_foot_anchor`，或从最终 `horizontal-validation.json` 按目标路径关联结果。
- 记录 PNG/RGBA/1254×1254、透明四角、alpha bbox、可见像素、组件数、可见/隐藏绿色污染、脚点和 180×180 可见 bbox。
- 技术 QA 只对实际分析过的文件标记 `pass`。不能因为文件名包含 `alpha` 就推断通过。

### 10.4 人工视觉与场景 QA

- 人工方向、身份、动作、道具、胸标和镜像关系不能从文件存在或哈希自动推断，必须从显式逐图审查记录写入。
- 单图场景证据期望路径：`tmp/imagegen/horizontal-movement/<Actor>/qa/<pose>-scene-180.png`。
- 角色成组证据期望路径：`.planning/2026-07-16-avatar-horizontal-generation/<actor-lower>-horizontal-group-qa.png`；也可以额外记录角色候选目录中的同名副本。
- 证据图片存在只代表“有证据文件”，不自动代表 `pass`。`status=pass` 必须来自明确审查结论。
- left/right 身高差按同状态的接受候选 alpha bbox 高度计算：`abs(h_left - h_right) / min(h_left, h_right) * 100`。超过约 10% 时应拒绝较异常的一张并原生重生，不能后处理缩放。

### 10.5 接受 attempt 与正式路径反向关联

1. 若正式文件不存在，不能标记 `promoted`。
2. 若正式文件存在，计算其 SHA-256，并与所有 `attempt-N-alpha.png` 比较。
3. 恰好一个 alpha 哈希相同，且该 attempt 的技术/视觉/180/场景/成组 QA 全部显式通过，才写入 `accepted_attempt=N` 和 `promotion.status=promoted`。
4. 正式文件存在但找不到相同 alpha，标记 `status=anomaly` 与 `audit_flags=["final_hash_has_no_candidate_match"]`，不能猜测来源。
5. 多个 alpha 同哈希时必须保留全部 attempt，并用显式审查记录选定 accepted attempt；否则标记歧义。
6. 正式文件不存在但候选已通过单图检查时，可标记 `accepted` 或 `group_pending`，不能冒充 `promoted`。

### 10.6 状态优先级

建议枚举：`missing`、`generation_failed`、`source_only`、`candidate`、`rejected`、`accepted`、`group_pending`、`formal_unverified`、`promoted`、`blocked`、`anomaly`。

- `promoted` 是最严格状态：正式文件存在、哈希匹配接受 alpha、所有 QA 通过、晋级前旧 81 张基线复核通过。
- 仅正式文件存在但 QA 或候选链缺失时用 `formal_unverified`，而不是 `promoted`。
- `blocked` 只来自连续三次明确失败且无合格候选的记录，不能因暂时未生成而设置。
- 顶层 `summary.all_complete` 只有在 28/28 `promoted`、技术/视觉/场景 28/28 通过、基线复核通过且无 audit flag 时才为 `true`。

### 10.7 伪代码

```python
for actor in ACTORS:
    for pose in POSES:
        asset = make_whitelist_record(actor, pose)
        disk_attempts = scan_regex(candidate_dir(actor, pose))
        logged_attempts = read_explicit_attempt_log(actor, pose)
        asset.attempts = merge_without_dropping_no_output_failures(
            disk_attempts, logged_attempts
        )
        hash_every_existing_source_and_alpha(asset.attempts)
        attach_technical_results(asset, horizontal_validation)
        attach_explicit_visual_and_scene_signoff(asset, review_records)
        match = match_final_sha_to_alpha(asset)
        derive_status_conservatively(asset, match)

verify_original_81_against_baseline()
compute_summary_from_28_whitelist_records_only()
assert all_complete_implies_every_required_gate_is_pass()
```

## 11. 中途状态快照的处理

中途扫描只能用于发现工作进度，不可直接作为最终清单。特别注意并发生成/晋级期间，`progress.md`、候选目录和正式目录可能短暂不同步。生成最终 manifest 前应停止所有 `images/` 写入，连续扫描两次并确认正式路径、候选哈希和旧 81 张基线稳定，再写出一次性快照。未正式晋级的角色即使已经有 4 张候选或成组 QA 图，也不能写为完成。

