# Horizontal Avatar ImageGen Prompt Set

Generated: `2026-07-17T13:35:56+08:00`  
Authority: `docs/avatar-horizontal-generation-goal-prompt.md`  
Mode: built-in ImageGen, one target per successful output; no contact-sheet generation or sprite cropping was used.

> Provenance note: the app does not persist ImageGen prompt text beside `exec-*.png`. The complete texts below are the canonical reconstructions from the approved fixed template and contemporaneous targeted-correction log. Prompt SHA-256 values cover these UTF-8 canonical records. Candidate source hashes independently match built-in `exec-*.png` outputs.

## Execution summary

- Targets with independent accepted outputs: `28/28`.
- Successful source outputs retained: `34`.
- No-output call events: `2`.
- Total ImageGen call events: `36`.
- Every call used at most five explicitly role-labelled references.
- Chroma conversion: `python C:/Users/29929/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py --input <source> --out <candidate-alpha.png> --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`; `edge_contract=0` for every candidate.

## Alice/walk-left

- Final: `images/avatars/Alice/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Alice/walk-left/attempt-1`
- Prompt SHA-256: `050bd61bb22a59adae7e6486b355558ff625f1266c07127c9d51e9a7f7382ba8`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Alice/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Alice/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Alice/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Alice/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Alice identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Alice in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Alice's warm brown hair, distinctive high round bun, rounded bob-like hair silhouette, black long-sleeve outfit, compact proportions, and established pixel-art identity. Never give her loose hair, a ponytail, Rita's hairstyle, a chest badge, or another character's palette.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Alice/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Alice/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`800d154a0015cbfa09996ba95584f4503278e1cc2a5bcf5e6f4508a265386797`
- Alpha: `tmp/imagegen/horizontal-movement/Alice/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`a8106291f8af62e58c27dc4704de818a2dabe496b919885aa46d624cad0fa632`

## Alice/walk-right

- Final: `images/avatars/Alice/walk-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Alice/walk-right/attempt-1`
- Prompt SHA-256: `fbfa6f1c8a37fa10bdecc34b4aca5edf165a7e356f604f4b5e633adf577e3fe0`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Alice/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Alice/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Alice/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Alice/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Alice identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Alice in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Alice's warm brown hair, distinctive high round bun, rounded bob-like hair silhouette, black long-sleeve outfit, compact proportions, and established pixel-art identity. Never give her loose hair, a ponytail, Rita's hairstyle, a chest badge, or another character's palette.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Alice/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Alice/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`2cac73b7540589c375835276dfca2d0f9bb1032b8bf169292481114d932a770f`
- Alpha: `tmp/imagegen/horizontal-movement/Alice/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`b743f6d3585e3732be896b38d3984e3528497af6ee9af290eee2c4d90c9d3d15`

## Alice/carry-left

- Final: `images/avatars/Alice/carry-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Alice/carry-left/attempt-1`
- Prompt SHA-256: `64c9252032289859e47b2aed6e1963225d0ed63da41f24c138c3aa014dd50787`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Alice/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Alice/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Alice/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Alice/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Alice identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Alice in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Alice's warm brown hair, distinctive high round bun, rounded bob-like hair silhouette, black long-sleeve outfit, compact proportions, and established pixel-art identity. Never give her loose hair, a ponytail, Rita's hairstyle, a chest badge, or another character's palette.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Alice/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Alice/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`c02c52366327634fae85b28a2d2cd43960c1d91396e0aae833cc04fd56101944`
- Alpha: `tmp/imagegen/horizontal-movement/Alice/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`daafb2cc71c9fa8457a8462ee79373f955c31c3547682dc7a0f4762c0fbce53e`

## Alice/carry-right

- Final: `images/avatars/Alice/carry-right.png`
- Accepted attempt: `2`
- Candidate attempts: `2`; ImageGen call events: `2`

### Attempt 1

- Prompt ID: `Alice/carry-right/attempt-1`
- Prompt SHA-256: `fd0cbeb2ee27d9409edd34ee55fdf312be2a6dcabf3b0b746815c59842384000`
- Disposition: `generation_failed`
- Defect: Transient network failure; the built-in ImageGen call produced no image file.
- References:

  - `images/avatars/Alice/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Alice/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Alice/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Alice/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Alice identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Alice in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Alice's warm brown hair, distinctive high round bun, rounded bob-like hair silhouette, black long-sleeve outfit, compact proportions, and established pixel-art identity. Never give her loose hair, a ponytail, Rita's hairstyle, a chest badge, or another character's palette.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Alice/carry-right/attempt-1/successful-output`: `generation_failed`
- Source: `tmp/imagegen/horizontal-movement/Alice/carry-right/attempt-1-source.png`; exists=`false`; SHA-256=`None`
- Alpha: `tmp/imagegen/horizontal-movement/Alice/carry-right/attempt-1-alpha.png`; exists=`false`; SHA-256=`None`

### Attempt 2

- Prompt ID: `Alice/carry-right/attempt-2`
- Prompt SHA-256: `38516c8174945506196c5bf2e8755488943938aa6302883ff59b888bdeacafde`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Alice/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Alice/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Alice/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Alice/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Alice identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Alice in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Alice's warm brown hair, distinctive high round bun, rounded bob-like hair silhouette, black long-sleeve outfit, compact proportions, and established pixel-art identity. Never give her loose hair, a ponytail, Rita's hairstyle, a chest badge, or another character's palette.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 2 only: the previous call failed before producing an image. Repeat the same approved sprite request without changing identity, direction, action, scale, props, or composition.
```

- Call event `Alice/carry-right/attempt-2/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Alice/carry-right/attempt-2-source.png`; exists=`true`; SHA-256=`593f7d9587577d10aa6b92dfda7e0a99c836e9e755588ae551e4977f55266f0e`
- Alpha: `tmp/imagegen/horizontal-movement/Alice/carry-right/attempt-2-alpha.png`; exists=`true`; SHA-256=`6e9a343b9c1e8029556fbee59c945bdbe6709c43241b66fbc1cf2cd0228dbf33`

## Bob/walk-left

- Final: `images/avatars/Bob/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Bob/walk-left/attempt-1`
- Prompt SHA-256: `4c73d05d7bdef6d347d4a133d9382ea89d03b62a687283f439f935b49ad38517`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Bob/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Bob/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Bob/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Bob/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Bob identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Bob in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Bob's fluffy short black hair, thick rectangular black glasses, deep navy collared top with one pale vertical center placket, black trousers, slim/tall proportions, and established pixel-art identity. Bob has no chest badge; do not add one.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Bob/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Bob/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`dfbefe9db9e648d65621d5b68a5c237684f966d5177dee67ed08d2bcc7bdd6c1`
- Alpha: `tmp/imagegen/horizontal-movement/Bob/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`dbaa08ca3e04fbb64ac7031cd48d4cb3929dcca54deebd3a9b11334a967fbe93`

## Bob/walk-right

- Final: `images/avatars/Bob/walk-right.png`
- Accepted attempt: `2`
- Candidate attempts: `2`; ImageGen call events: `2`

### Attempt 1

- Prompt ID: `Bob/walk-right/attempt-1`
- Prompt SHA-256: `253879b2b7f5c3d7f5978eacc00204321734811ac399746e29fc1c40760d9a32`
- Disposition: `rejected_group_scale`
- Defect: Alpha-bbox height 948px was 13.5% larger than accepted walk-left at 835px.
- References:

  - `images/avatars/Bob/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Bob/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Bob/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Bob/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Bob identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Bob in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Bob's fluffy short black hair, thick rectangular black glasses, deep navy collared top with one pale vertical center placket, black trousers, slim/tall proportions, and established pixel-art identity. Bob has no chest badge; do not add one.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Bob/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Bob/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`1972123d2b6cede0c47553cd0568e5f70f4b9b919fc7a75f5b2867903b0daf9f`
- Alpha: `tmp/imagegen/horizontal-movement/Bob/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`f58bf81fab30b03ba0459bb22ea7d73f0d48ed365d7761245824415cba9fe41d`

### Attempt 2

- Prompt ID: `Bob/walk-right/attempt-2`
- Prompt SHA-256: `b7f140de5e479a4e4c387264d35328ebca116c6be0785ebab9cc4017e9fba3b2`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Bob/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Bob/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Bob/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Bob/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Bob identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Bob in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Bob's fluffy short black hair, thick rectangular black glasses, deep navy collared top with one pale vertical center placket, black trousers, slim/tall proportions, and established pixel-art identity. Bob has no chest badge; do not add one.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 2 only: keep the native character silhouette approximately 8% smaller so its alpha-bbox height matches accepted walk-left. Do not resize after generation and do not change identity, direction, action, or props.
```

- Call event `Bob/walk-right/attempt-2/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Bob/walk-right/attempt-2-source.png`; exists=`true`; SHA-256=`21c979125754ae0ad7c639f37c6be44e8b789925ae4ccb88329962fcc512d69a`
- Alpha: `tmp/imagegen/horizontal-movement/Bob/walk-right/attempt-2-alpha.png`; exists=`true`; SHA-256=`395bc31f7e5a4a28f044fbf23a46aa189f8bd5051b895ad2b6a04e0927812bfa`

## Bob/carry-left

- Final: `images/avatars/Bob/carry-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Bob/carry-left/attempt-1`
- Prompt SHA-256: `8298b2d3ffdfd658a25bffa6c88ad77b101ea0fa64a33d600db5dd0539017c0d`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Bob/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Bob/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Bob/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Bob/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Bob identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Bob in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Bob's fluffy short black hair, thick rectangular black glasses, deep navy collared top with one pale vertical center placket, black trousers, slim/tall proportions, and established pixel-art identity. Bob has no chest badge; do not add one.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Bob/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Bob/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`08b67f42892ff1f50625ac888d1624dea44216bfc801b562b5d50fd0304dadd2`
- Alpha: `tmp/imagegen/horizontal-movement/Bob/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`880f8344af8dc3709538c2b476b888c3f111fb5657a34d87c0c60b156497e773`

## Bob/carry-right

- Final: `images/avatars/Bob/carry-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Bob/carry-right/attempt-1`
- Prompt SHA-256: `979d21f1c8eeb5d7fbcd792aa1a5b3981224d5851dcde31b78def76f81331f0b`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Bob/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Bob/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Bob/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Bob/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Bob identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Bob in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Bob's fluffy short black hair, thick rectangular black glasses, deep navy collared top with one pale vertical center placket, black trousers, slim/tall proportions, and established pixel-art identity. Bob has no chest badge; do not add one.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Bob/carry-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Bob/carry-right/attempt-1-source.png`; exists=`true`; SHA-256=`360cdf1793a370b19eb6acf20d39d7c4462a0929d03dbede6b5dba7fbc6e87f2`
- Alpha: `tmp/imagegen/horizontal-movement/Bob/carry-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`4b57fd2d2e308597c392ec84837158cacce8e7dc4a98b36c627aa067f435d511`

## Jack/walk-left

- Final: `images/avatars/Jack/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Jack/walk-left/attempt-1`
- Prompt SHA-256: `f740ff15f17a3b4e00234e1535fb1c6d93dc80dd56d9627553782ebc95bfac99`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Jack/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Jack/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Jack/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Jack/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Jack identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Jack in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Jack's asymmetric spiky black hair, no glasses, bright cobalt collared top, black trousers and black shoes, slim office-map proportions, and established pixel-art identity. His only possible mark is one small white mark on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one small white left-chest mark in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Jack/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Jack/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`935d2a212adb394dea46e1e6a23e9f320e05007286116f1078dc083a8d5b38d1`
- Alpha: `tmp/imagegen/horizontal-movement/Jack/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`9c38d90ebe5ee041f53ecfc80635ad17abfee7a308a7455d6a7a77ba0938c796`

## Jack/walk-right

- Final: `images/avatars/Jack/walk-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Jack/walk-right/attempt-1`
- Prompt SHA-256: `8dc6ec3323ce24756e330f3eea2be534a8d5e9e47ba506ca9fe6de58eee52074`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Jack/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Jack/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Jack/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Jack/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Jack identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Jack in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Jack's asymmetric spiky black hair, no glasses, bright cobalt collared top, black trousers and black shoes, slim office-map proportions, and established pixel-art identity. His only possible mark is one small white mark on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one small white left-chest mark, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Jack/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Jack/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`4831e0db3edc0569067eb63d142f84cea7627469c83ad3b655ec6638091d01de`
- Alpha: `tmp/imagegen/horizontal-movement/Jack/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`aa747615fb8bec119ac9c24c0d131d936f609c9b8ddd2a7b92b83d60c0921c16`

## Jack/carry-left

- Final: `images/avatars/Jack/carry-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Jack/carry-left/attempt-1`
- Prompt SHA-256: `41e123494b7f776418e2776c279ce7ad1913dbaaeca3f8727743a1c250baf418`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Jack/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Jack/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Jack/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Jack/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Jack identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Jack in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Jack's asymmetric spiky black hair, no glasses, bright cobalt collared top, black trousers and black shoes, slim office-map proportions, and established pixel-art identity. His only possible mark is one small white mark on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one small white left-chest mark in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Jack/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Jack/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`a2f6a214cebf748e0631f79a2b305b96335b61f9256ee5405348e6656ae785b9`
- Alpha: `tmp/imagegen/horizontal-movement/Jack/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`1626ccdae07b33c5755fe29d8cac31767506122923f5e156498a9c462e52073b`

## Jack/carry-right

- Final: `images/avatars/Jack/carry-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Jack/carry-right/attempt-1`
- Prompt SHA-256: `a01a154155692afcc79828c6c9bedffcc8e6c7c873e6d197d3392c5e76d1e408`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Jack/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Jack/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Jack/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Jack/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Jack identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Jack in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Jack's asymmetric spiky black hair, no glasses, bright cobalt collared top, black trousers and black shoes, slim office-map proportions, and established pixel-art identity. His only possible mark is one small white mark on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one small white left-chest mark, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Jack/carry-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Jack/carry-right/attempt-1-source.png`; exists=`true`; SHA-256=`f94a87cefb723cee7c8e6498cc3a9685849b9ece91224da7885fa666e8f62407`
- Alpha: `tmp/imagegen/horizontal-movement/Jack/carry-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`63a25701a7e515167e3ac040870b584b3424f066915f8718302f7a32accdff03`

## Kara/walk-left

- Final: `images/avatars/Kara/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Kara/walk-left/attempt-1`
- Prompt SHA-256: `d8a882a1e6e06a3045293f1c8b1e1ddb06db0e64b825e95c5faec6d7eddf24bf`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Kara/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one gold four-corner left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Kara/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`45aab4b17ec51fe531a0bea23c640ef90dc4c630f4f5358be3412757e45fd1b5`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`8838604f931005b09b8e70dd7c715767f646b43a352551dce89691fe4451c814`

## Kara/walk-right

- Final: `images/avatars/Kara/walk-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Kara/walk-right/attempt-1`
- Prompt SHA-256: `f962ffd321c79b5ec930dec93dc5ea591b049d1d7dbc39431340dd326b6907df`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Kara/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one gold four-corner left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Kara/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`5a2d33ff6b5fb7aa79bd55211a7def597497813b2c9187757335fbd76201988f`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`77072c94cb464533f50dda5e817e8dc2c94c5b39743ad8e197e70c650677f4da`

## Kara/carry-left

- Final: `images/avatars/Kara/carry-left.png`
- Accepted attempt: `2`
- Candidate attempts: `2`; ImageGen call events: `3`

### Attempt 1

- Prompt ID: `Kara/carry-left/attempt-1`
- Prompt SHA-256: `0e642c309a58d890ea3c5f4f698ad18589ae43810a190f68f14cd6210896c46c`
- Disposition: `rejected_group_scale`
- Defect: Individually valid 743px sprite was replaced by a taller native candidate so the final Carry pair would remain within the 10% group-scale tolerance.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Kara/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one gold four-corner left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Kara/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`38e80b9ce58562ab8eacd129a30542f3c2b349ba23b2398129bb55ff7e2c354b`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`a629425d7ee684e5809755baeb9748145400da259d70179aac8057c01b4af169`

### Attempt 2

- Prompt ID: `Kara/carry-left/attempt-2`
- Prompt SHA-256: `9553595c083b91493d4fd3d15b63012b399fc7c8656bfe62f27d5b7b422d4f73`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Kara/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-3-alpha.png` — provisional opposite-direction native height guide only; never mirror or copy pose

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one gold four-corner left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 2 only: generate a natively taller Carry-left silhouette, targeting the final opposite-direction scale while preserving strict left direction, petite identity, badge occlusion, and exactly one blank folder. Do not post-process resize.
```

- Call event `Kara/carry-left/attempt-2/interrupted-call`: `generation_failed` — Connection interruption ended the calibration call before any ImageGen file was produced; the same attempt prompt was reissued and then succeeded.
- Call event `Kara/carry-left/attempt-2/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/carry-left/attempt-2-source.png`; exists=`true`; SHA-256=`402fb095ff2d19ab4aa013350455ed39db39ae3f77a4cf1bcb6c566e67943ff4`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/carry-left/attempt-2-alpha.png`; exists=`true`; SHA-256=`1c282e387dab55e6e4e40ebd2fe17d4b5a1a58610c2563b8401c486af70dad88`

## Kara/carry-right

- Final: `images/avatars/Kara/carry-right.png`
- Accepted attempt: `3`
- Candidate attempts: `3`; ImageGen call events: `3`

### Attempt 1

- Prompt ID: `Kara/carry-right/attempt-1`
- Prompt SHA-256: `a6e9f5a35dc5454a6ca3ebdd54e5e1ea46d70b17eb7b79f473d25bd48d01ed92`
- Disposition: `rejected_visual`
- Defect: Unauthorized gold earring was added; Kara may only have the single anatomical-left chest badge.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Kara/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one gold four-corner left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Kara/carry-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-1-source.png`; exists=`true`; SHA-256=`b8cea1fd3efb0cd5f5a4501bb70d6b00e15c256619f99a3e67aa844d35a7fac5`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`f57f2262331a8bdc86481c9dca0ac0f8c9f6874935437b3f237bd58c0984e29d`

### Attempt 2

- Prompt ID: `Kara/carry-right/attempt-2`
- Prompt SHA-256: `1bd4bf22553496b0d410bc6f62621b8a826be6d815b4127c823ecb0a829cc0a4`
- Disposition: `rejected_group_scale`
- Defect: Earring was corrected, but 833px height was 12.1% larger than the then-accepted 743px carry-left.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Kara/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one gold four-corner left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 2 only: remove all earrings and ear jewelry. Gold may appear only once in the anatomical-left chest badge. Do not change identity, direction, action, folder, or scale.
```

- Call event `Kara/carry-right/attempt-2/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-2-source.png`; exists=`true`; SHA-256=`99e65d6da19ddaafe9606169fb0abd944980285fc34f73ad863e0d8b480902ad`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-2-alpha.png`; exists=`true`; SHA-256=`8bb6b6a0abb5de1fe8d774dcb7734e9a5dffce499d6bba6aabf72fe16680e2ee`

### Attempt 3

- Prompt ID: `Kara/carry-right/attempt-3`
- Prompt SHA-256: `df75532ab11626592ffcdfb9dfc61d0fc1d2ee5901ef4473666221f7610adf42`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Kara/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Kara/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Kara/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Kara/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `tmp/imagegen/horizontal-movement/Kara/carry-left/attempt-1-alpha.png` — opposite-direction native height guide only; never mirror or copy pose

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Kara identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Kara in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Kara's saturated purple shoulder-length hair, rounded crown, outward-curled ends, purple top, petite proportions, and established pixel-art identity. Her only possible badge is one gold four-corner badge on the anatomical left chest. Never add earrings or other jewelry.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one gold four-corner left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 3 only: retain the corrected no-earring identity and generate the subject natively about 11% smaller, using the left Carry candidate only as a scale guide. Do not resize after generation or alter direction, badge, action, or folder.
```

- Call event `Kara/carry-right/attempt-3/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-3-source.png`; exists=`true`; SHA-256=`da2815328e388c2d898976e2d60b2a7c812f1d6724ba4e0594991681e9b7986f`
- Alpha: `tmp/imagegen/horizontal-movement/Kara/carry-right/attempt-3-alpha.png`; exists=`true`; SHA-256=`8b54ac70ccce5e1b2b1cf848fa6f597f8ad934d26b3a96cc3e7afb7759854bd1`

## Leo/walk-left

- Final: `images/avatars/Leo/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Leo/walk-left/attempt-1`
- Prompt SHA-256: `70bbffb4351b1952ba36156a7dc0dbad037ae2136472192f351483f875acc98a`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Leo/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Leo/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Leo/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Leo/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Leo identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Leo in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Leo's black side-parted hair with swept forelock, rectangular glasses, muted dark-blue collared top, slim proportions, and established pixel-art identity. His only possible badge is one small pale square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one small pale square left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Leo/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Leo/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`99ec7dd0fbb2877f7a22b6977e37a55372464aa30f816ce8dbc91989116c983b`
- Alpha: `tmp/imagegen/horizontal-movement/Leo/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`a65c3ae480cd3c94dd72f08196a513b480edac6db2bf375b518e0b5e4a2a5c98`

## Leo/walk-right

- Final: `images/avatars/Leo/walk-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Leo/walk-right/attempt-1`
- Prompt SHA-256: `558ca62c89db6af57d436cf0049f4462314331f7cffd4deba11381b39a50d224`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Leo/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Leo/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Leo/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Leo/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Leo identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Leo in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Leo's black side-parted hair with swept forelock, rectangular glasses, muted dark-blue collared top, slim proportions, and established pixel-art identity. His only possible badge is one small pale square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one small pale square left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Leo/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Leo/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`120d2d1e81fb0d76a351fdf47b34a21da714a83d73612dd741478b9c60e2ace5`
- Alpha: `tmp/imagegen/horizontal-movement/Leo/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`389d1e6801c27535c47422f459f3cad5a38eab63737f2ce26ea6cc3d9c29b32a`

## Leo/carry-left

- Final: `images/avatars/Leo/carry-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Leo/carry-left/attempt-1`
- Prompt SHA-256: `a2f3611b13ff9a60acddf2c274e441e86c4debcf56d25f608e56d23157620127`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Leo/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Leo/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Leo/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Leo/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Leo identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Leo in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Leo's black side-parted hair with swept forelock, rectangular glasses, muted dark-blue collared top, slim proportions, and established pixel-art identity. His only possible badge is one small pale square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one small pale square left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Leo/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Leo/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`d823ff46f958e5196d029d3950086efa6e1a120561962a8ef54e4a6da62eacc3`
- Alpha: `tmp/imagegen/horizontal-movement/Leo/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`cb770aa9c88e0ea2a57c485ed0b78bdadd91b2f012ad7be097cf2fc01e28c350`

## Leo/carry-right

- Final: `images/avatars/Leo/carry-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Leo/carry-right/attempt-1`
- Prompt SHA-256: `dc9057ab535488ba1025a91d003f5e30536558206a7a900c7a77b0feae297644`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Leo/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Leo/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Leo/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Leo/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Leo identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Leo in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Leo's black side-parted hair with swept forelock, rectangular glasses, muted dark-blue collared top, slim proportions, and established pixel-art identity. His only possible badge is one small pale square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one small pale square left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Leo/carry-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Leo/carry-right/attempt-1-source.png`; exists=`true`; SHA-256=`76ee91c9b89e30f4da6d66d534526687664415230206b2da4d1175bae866b8c7`
- Alpha: `tmp/imagegen/horizontal-movement/Leo/carry-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`8f62d28bfbde3fa885e1c36b1065e32c99a5eec7ed4e757baeff0275566ea3de`

## Quinn/walk-left

- Final: `images/avatars/Quinn/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Quinn/walk-left/attempt-1`
- Prompt SHA-256: `8c20c7c6596030a61c95ece4fccecbdca4fbe381143ebf8730df05e06cedffa7`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Quinn/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Quinn/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Quinn/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Quinn/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Quinn identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Quinn in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Quinn's neat rounded black short hair with a small rear tuft, oversized square black glasses, bright royal-blue top, compact proportions, and established pixel-art identity. His only possible badge is one white square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one white square left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Quinn/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Quinn/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`0b368f634b1481420f0deddc3411a660eb000e4a03f394d5e9e0a7124e4e5d3c`
- Alpha: `tmp/imagegen/horizontal-movement/Quinn/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`421fcb2916d0755b13493e7ee9437f0735cb419cc79750ab18a2505cf9b6394e`

## Quinn/walk-right

- Final: `images/avatars/Quinn/walk-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Quinn/walk-right/attempt-1`
- Prompt SHA-256: `0fbaa875a30178654621b5db1059c9ee2afa67faa668e73a0c23b8b31957ea0a`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Quinn/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Quinn/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Quinn/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Quinn/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Quinn identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Quinn in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Quinn's neat rounded black short hair with a small rear tuft, oversized square black glasses, bright royal-blue top, compact proportions, and established pixel-art identity. His only possible badge is one white square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one white square left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Quinn/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Quinn/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`ea56fcb27f340eb54610efa8ed9afd7f5492e3631624960d05468defcece02a2`
- Alpha: `tmp/imagegen/horizontal-movement/Quinn/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`1cc82d768401f5d5e416674e83fa3a4ac6611bdec61ef370ca0ac3c01e943086`

## Quinn/carry-left

- Final: `images/avatars/Quinn/carry-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Quinn/carry-left/attempt-1`
- Prompt SHA-256: `2b50acd1526fa14e0de9d95587d07b7b755d594855680e24034a4b536a9db291`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Quinn/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Quinn/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Quinn/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Quinn/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Quinn identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Quinn in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Quinn's neat rounded black short hair with a small rear tuft, oversized square black glasses, bright royal-blue top, compact proportions, and established pixel-art identity. His only possible badge is one white square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is on the far side and fully occluded; show no one white square left-chest badge in this left-facing profile.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Quinn/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Quinn/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`cb628b805ea304273d831b18d045b92aa46a4277a57577b01b424767276493ae`
- Alpha: `tmp/imagegen/horizontal-movement/Quinn/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`6142aeff6d8bc41ac2b36ce3312e4c331b6f8ceccb9ed6d77dc4bf14f6297c7b`

## Quinn/carry-right

- Final: `images/avatars/Quinn/carry-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Quinn/carry-right/attempt-1`
- Prompt SHA-256: `329a108f47e971e9ac9de40ac812f55c18928123579367f94ab9ec6b974ffb10`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Quinn/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Quinn/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Quinn/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Quinn/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Quinn identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Quinn in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Quinn's neat rounded black short hair with a small rear tuft, oversized square black glasses, bright royal-blue top, compact proportions, and established pixel-art identity. His only possible badge is one white square on the anatomical left chest.

Direction-specific identity detail:
The anatomical left chest is the visible near side; show exactly one white square left-chest badge, with no duplicate or migrated mark.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Quinn/carry-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Quinn/carry-right/attempt-1-source.png`; exists=`true`; SHA-256=`8ae5b4920ccf2a251b240bb382263e7123225c9aa4d9bcd80f1ee8a10d8373a9`
- Alpha: `tmp/imagegen/horizontal-movement/Quinn/carry-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`f95f458998be5b9b966e3760b8e2d8f41e798c7e4aa67097d967ebecf153c072`

## Rita/walk-left

- Final: `images/avatars/Rita/walk-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Rita/walk-left/attempt-1`
- Prompt SHA-256: `c350b0a5fead133dda39b85b10245702ec8e70dd3ea4a5340630caf81abf7408`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Rita/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Rita/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Rita/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Rita/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-left

Input images:
- Image 1: Rita identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Rita in one clearly readable walk pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the left. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Rita/walk-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Rita/walk-left/attempt-1-source.png`; exists=`true`; SHA-256=`c9de3f81cfa3f8540b5eada117e4b762d8570f5e3d73907996cb899992d053fb`
- Alpha: `tmp/imagegen/horizontal-movement/Rita/walk-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`3dba889f0125573a3048636a8d3e0876946474158e1b650f3817beafd657989b`

## Rita/walk-right

- Final: `images/avatars/Rita/walk-right.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Rita/walk-right/attempt-1`
- Prompt SHA-256: `dc38a3102f4b987ecd08ecfe14bd3accaa0fe21f011ee10ba10624542d503feb`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Rita/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Rita/walk.png` — side walk structure and scale; never copy or mirror
  - `images/avatars/Rita/walk-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Rita/walk-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, walk-right

Input images:
- Image 1: Rita identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Rita in one clearly readable walk pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Show a clear natural mid-stride walk toward the right. Both hands are empty and swing naturally. No folder, Artifact, phone, tool, bag, box, paper, or other object.

Identity lock:
Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Rita/walk-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Rita/walk-right/attempt-1-source.png`; exists=`true`; SHA-256=`2a9ae83e75d66850c649c26ff20e51bd90853ba950c2e844d67fa08a1a912fb2`
- Alpha: `tmp/imagegen/horizontal-movement/Rita/walk-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`dc095aa2b99065d9d6767a96e3cf81df0ba67fbc4c3358c11ee30e37a4970d7b`

## Rita/carry-left

- Final: `images/avatars/Rita/carry-left.png`
- Accepted attempt: `1`
- Candidate attempts: `1`; ImageGen call events: `1`

### Attempt 1

- Prompt ID: `Rita/carry-left/attempt-1`
- Prompt SHA-256: `9d956f340f36ce5052ba286680212da77dc944db03430ab567bef22523ff7596`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Rita/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Rita/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Rita/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Rita/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-left

Input images:
- Image 1: Rita identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Rita in one clearly readable carry pose, natively facing and moving toward the left edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the left while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Rita/carry-left/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Rita/carry-left/attempt-1-source.png`; exists=`true`; SHA-256=`49e649fa5f581b968c863e7bfa959b283071790f8c5c70398302af3dfa568437`
- Alpha: `tmp/imagegen/horizontal-movement/Rita/carry-left/attempt-1-alpha.png`; exists=`true`; SHA-256=`a187354798519d0ed62f9396ddb3276fad6e8ecac861b27d30e7114f1ff56bf9`

## Rita/carry-right

- Final: `images/avatars/Rita/carry-right.png`
- Accepted attempt: `3`
- Candidate attempts: `3`; ImageGen call events: `3`

### Attempt 1

- Prompt ID: `Rita/carry-right/attempt-1`
- Prompt SHA-256: `4204ccd5959d5490339e2832daaf4c20c23f994a0287c073d0159427b01785fb`
- Disposition: `rejected_group_scale`
- Defect: Alpha-bbox height 792px was 11.2% smaller than accepted carry-left at 881px.
- References:

  - `images/avatars/Rita/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Rita/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Rita/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Rita/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Rita identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Rita in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.
```

- Call event `Rita/carry-right/attempt-1/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-1-source.png`; exists=`true`; SHA-256=`de08173d462d686a0195f977fbeefb46e7c7fe74ba74db35821b37837cd81fc2`
- Alpha: `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-1-alpha.png`; exists=`true`; SHA-256=`f58f3ef95f884d9f3eca9035a790e2e8f3bd46259f7c76c8f3c3c7d93f557537`

### Attempt 2

- Prompt ID: `Rita/carry-right/attempt-2`
- Prompt SHA-256: `d8900fa1d9a1c11741b999370d8425c3e0477dce5f86ba8157e3bbc4ed6695ef`
- Disposition: `rejected_technical`
- Defect: Native subject overshot to 991px and the detached ponytail fragment produced two alpha components.
- References:

  - `images/avatars/Rita/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Rita/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Rita/carry-up.png` — rear identity, pixel density, movement scale, and folder shape for Carry
  - `images/avatars/Rita/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `images/scene/office-shell.png` — camera angle and final scene scale only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Rita identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Rita in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 2 only: increase native alpha-bbox height into the 850-880px range while preserving the right-facing movement ponytail, identity, one folder, and connected silhouette. Do not post-process resize.
```

- Call event `Rita/carry-right/attempt-2/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-2-source.png`; exists=`true`; SHA-256=`c989fc8441f9c5c02cc3494395c38b8f8ebc75a3cd5ae470bd8017015bce4790`
- Alpha: `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-2-alpha.png`; exists=`true`; SHA-256=`b9df30fb737471dcf49bc7c316c28eb96135cfee189018150147e78d1275fffe`

### Attempt 3

- Prompt ID: `Rita/carry-right/attempt-3`
- Prompt SHA-256: `7c306f3deb869ffda4a1cdfcbf99aaac863e18d8857bc5833ea8866c0dbf0471`
- Disposition: `accepted`
- Defect: None; accepted.
- References:

  - `images/avatars/Rita/idle.png` — identity, hair, clothing, palette, proportions
  - `images/avatars/Rita/carry.png` — side carry structure and scale; never copy or mirror
  - `images/avatars/Rita/carry-down.png` — front identity, pixel density, movement scale, and folder shape for Carry
  - `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-1-alpha.png` — lower native-scale bound only
  - `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-2-alpha.png` — upper native-scale and disconnected-component warning only

```text
Use case: stylized-concept
Asset type: office-map directional character sprite, carry-right

Input images:
- Image 1: Rita identity reference. Preserve identity, hairstyle, clothing, palette, and proportions.
- Image 2: same-character side movement/action reference. Use only for action structure and scale; do not copy, trace, or mirror it.
- Image 3: same-character up-facing reference. Use for rear identity, pixel density, and movement scale.
- Image 4: same-character down-facing reference. Use for front identity, pixel density, and movement scale.
- Image 5: office-map perspective or explicitly identified scale-calibration reference. Use only for camera angle/final scale or the stated native-height bound.

Primary request:
Create exactly one isolated full-body pixel-art sprite of Rita in one clearly readable carry pose, natively facing and moving toward the right edge of the canvas.

Direction contract:
- left means the head/profile, torso, stride, knees, and feet all point toward the image's left edge.
- right means the head/profile, torso, stride, knees, and feet all point toward the image's right edge.
- Use a genuine side-profile pose with the same slight top-down office-map camera angle as the references.
- Do not face up, down, toward the viewer, or away from the viewer. Do not use a three-quarter front/back pose.
- Generate this direction independently. Do not horizontally flip, mirror, trace, clone, or mechanically reuse the opposite-direction image.
- Preserve physically correct hair asymmetry, clothing detail, hand placement, chest-mark visibility, and limb/folder occlusion for this direction.

State contract:
Walk toward the right while holding exactly one blank light-tan tabbed manila project folder. Both hands must make readable contact with this one folder. Keep its silhouette clear at an exact 180 x 180 full-canvas render. No words, logo, icon, label, badge on the folder, second folder, loose paper, bag, box, shield, Artifact, phone, or tool.

Identity lock:
Preserve Rita's movement identity: warm chestnut long side bangs, a mid-high arched ponytail, white collared top with a narrow dark neckline detail, dark trousers, black shoes, and established pixel-art proportions. Never use Alice's round bun or Rita's loose-haired seated hairstyle. Rita has no chest badge.

Direction-specific identity detail:
No chest badge or chest mark is present.

Composition:
Generate the character only on a native 1254 x 1254 square canvas. Match the existing movement sprites' visual height, body scale, and bottom-center foot anchor. Keep generous padding and do not crop hair, folder, hands, feet, or clothing. No desk, chair, monitor, keyboard, Agent orb, Artifact icon, name label, UI, room, floor, cast shadow, contact shadow, glow, border, watermark, or text.

Style:
Polished high-resolution office pixel art matching the supplied references: hard pixel structure, consistent pixel density, controlled shading, crisp silhouette, and the same slightly top-down perspective. No painterly blur, vector-smooth edges, photorealism, 3D render, or anti-aliased illustration drift.

Background:
Use one perfectly flat solid #00ff00 chroma-key background over every background pixel. No texture, gradient, checkerboard, floor plane, lighting variation, reflection, or shadow. Never use #00ff00 inside the character or folder.

Targeted correction for attempt 3 only: use the two prior right attempts as lower and upper native-scale bounds; target 850-900px and keep the ponytail, body, hands, and single folder in one connected foreground component. Do not resize after generation.
```

- Call event `Rita/carry-right/attempt-3/successful-output`: `output_saved`
- Source: `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-3-source.png`; exists=`true`; SHA-256=`786b2d593b247db13fbd831871caadb3d7b9d714cfdf9ef44e5b394ee69b0e10`
- Alpha: `tmp/imagegen/horizontal-movement/Rita/carry-right/attempt-3-alpha.png`; exists=`true`; SHA-256=`5973d27f9fda40174bfffe540cbc0a87d0ea8a1c955993357716a5277353f89f`
