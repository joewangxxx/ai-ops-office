# Seated Sprite Regeneration Prompt Set

## Shared Idle Prompt

Use case: stylized-concept
Asset type: fixed-office-map character sprite, seated-idle-back
Primary request: Generate one isolated pixel-art sprite of **{CHARACTER}** seated idle at a workstation, with the workstation itself omitted.
Input images: {INPUT_ROLES}
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
Subject orientation: exact rear view with zero body yaw, facing straight toward the canvas top at 12 o'clock. Camera is slightly elevated/top-down like the office map, but camera elevation must not rotate the character into a rear three-quarter pose.
Pose geometry: head center, neck, spine, pelvis and both knees stay on/around the vertical centerline; shoulders are nearly horizontal and parallel to the unseen desk edge; legs and feet are tucked beneath the torso in the chair area. Both hands rest low and close to the hips/lap. No visible face, eyes, nose, or mouth.
Identity lock: {IDENTITY_LOCK}
Style: polished office pixel art matching the supplied references; hard pixel edges, matching pixel density, limited palette, block shading, established chibi proportions.
Composition: 1254 × 1254 square canvas; one centered character only; generous removable padding; scale compatible with the accepted Alice/Quinn seated sprites and 150px office-map rendering.
Constraints: background is one uniform #00ff00 with no variation; do not use #00ff00 in the character; no desk, chair, monitor, keyboard, furniture, room, UI, object, text, shadow, glow, border, or watermark.
Avoid: rear three-quarter body view, side view, profile face, visible eye/nose/mouth, asymmetric right-facing torso, sideways knees or feet, one-sided gesture, typing, standing, walking, furniture, cast shadow, contact shadow, antialiased illustration, smooth vector edges.

## Shared Working Prompt

Use case: stylized-concept
Asset type: fixed-office-map character sprite, seated-working-back
Primary request: Edit the accepted **{CHARACTER} seated Idle** sprite into the Working state.
Input images: Image 1 is the accepted same-character Idle edit target; all other images are identity, arm-direction, perspective, or pixel-style references only.
Change only: both forearms and hands. Extend both forearms symmetrically upward toward the imaginary keyboard at canvas top/12 o'clock; hands are at nearly the same height and equally spaced from the vertical centerline.
Preserve exactly: hair silhouette, head placement, shoulders, torso, pelvis, legs, feet, clothes, colors, body proportions, canvas scale, vertical placement, seat anchor, pixel density and shading language. Do not lean or rotate the torso.
Subject orientation: exact rear view with zero body yaw. No hand, knee, or foot points toward 3 o'clock. No visible face, eyes, nose, or mouth.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
Composition: 1254 × 1254 square canvas; the same centered placement and padding as Image 1.
Constraints: one character only; no desk, chair, monitor, keyboard, furniture, room, UI, Artifact, Agent orb, text, shadow, glow, border, or watermark; do not use #00ff00 inside the character.
Avoid: regenerating or redesigning the character, changing lower body, rear three-quarter body view, side view, profile face, one-sided typing, hands reaching right, sideways knees/feet, standing, antialiased illustration, smooth vector edges.

## Bob

Identity lock: broad messy fluffy deep-charcoal black hair with irregular pixel tufts; dark navy long-sleeve collared/button shirt with subdued back and dark collar shadow; black/dark-gray trousers and black shoes; compact chibi build. Bob's rectangular glasses are identity references only—strict rear view must not turn his head to show lenses or face; at most tiny symmetric temple pixels may appear.

Idle reference paths, in order:
1. `images/avatars/Bob/idle.png` — identity/color/proportions only
2. `images/avatars/Bob/walk-up.png` — rear hair/clothes only; do not copy walking pose
3. `images/avatars/Quinn/seated-idle-back.png` — male centered rear seated geometry only
4. `images/avatars/Alice/seated-idle-back.png` — symmetry/leg-tuck geometry only
5. `images/scene/office-shell.png` — pixel density/camera only; do not include

Working reference paths, in order:
1. `tmp/imagegen/seated-regeneration/Bob/seated-idle-back/accepted-alpha.png` — edit target
2. `images/avatars/Bob/at-desk.png` — sleeves/hands/color only
3. `images/avatars/Quinn/seated-working-back.png` — arm direction only
4. `images/avatars/Alice/seated-working-back.png` — arm symmetry only
5. `images/scene/office-shell.png` — pixel style/camera only; do not include

## Jack

Identity lock: thick high angular spiky jet-black hair with asymmetric jagged tufts; vivid cobalt/royal-blue long-sleeve collared shirt; black trousers and black shoes; compact chibi build; no glasses. No white front chest patch on the back.

Idle reference paths, in order:
1. `images/avatars/Jack/idle.png` — identity/color/proportions only
2. `images/avatars/Jack/walk-up.png` — rear hair/clothes only; do not copy walking pose
3. `images/avatars/Quinn/seated-idle-back.png` — male centered rear seated geometry only
4. `images/avatars/Alice/seated-idle-back.png` — symmetry/leg-tuck geometry only
5. `images/scene/office-shell.png` — pixel density/camera only; do not include

Working reference paths, in order:
1. `tmp/imagegen/seated-regeneration/Jack/seated-idle-back/accepted-alpha.png` — edit target
2. `images/avatars/Jack/at-desk.png` — sleeves/hands/color only
3. `images/avatars/Quinn/seated-working-back.png` — arm direction only
4. `images/avatars/Alice/seated-working-back.png` — arm symmetry only
5. `images/scene/office-shell.png` — pixel style/camera only; do not include

## Kara

Identity lock: saturated violet chin-length rounded bob with layered purple highlights and flipped ends; purple long-sleeve top; charcoal trousers; brown shoes; petite chibi build. The small gold four-point badge belongs only on the front-left chest and must not appear on the back or sleeves.

Idle reference paths, in order:
1. `images/avatars/Kara/idle.png` — identity/color/proportions only
2. `images/avatars/Kara/walk-up.png` — rear hair/clothes only; do not copy walking pose
3. `images/avatars/Alice/seated-idle-back.png` — centered female rear seated geometry only
4. `images/avatars/Quinn/seated-idle-back.png` — leg-tuck geometry only
5. `images/scene/office-shell.png` — pixel density/camera only; do not include

Working reference paths, in order:
1. `tmp/imagegen/seated-regeneration/Kara/seated-idle-back/accepted-alpha.png` — edit target
2. `images/avatars/Kara/at-desk.png` — sleeves/hands/color only; never copy the front badge to back/sleeves
3. `images/avatars/Alice/seated-working-back.png` — female arm direction only
4. `images/avatars/Quinn/seated-working-back.png` — arm symmetry/leg-tuck only
5. `images/scene/office-shell.png` — pixel style/camera only; do not include

## Leo

Identity lock: smooth asymmetric side-swept black hair; dark desaturated navy long-sleeve collared shirt; dark trousers and brown-black shoes; slim narrow-shouldered compact build. Glasses and pale square chest badge are front-view identity only; strict rear view shows no lenses, face, or back badge.

Idle reference paths, in order:
1. `images/avatars/Leo/idle.png` — identity/color/proportions only
2. `images/avatars/Leo/walk-up.png` — rear hair/clothes only; do not copy walking pose
3. `images/avatars/Quinn/seated-idle-back.png` — male centered rear seated geometry only; do not copy bright blue color or broad head
4. `images/avatars/Alice/seated-idle-back.png` — symmetry/leg-tuck geometry only
5. `images/scene/office-shell.png` — pixel density/camera only; do not include

Working reference paths, in order:
1. `tmp/imagegen/seated-regeneration/Leo/seated-idle-back/accepted-alpha.png` — edit target
2. `images/avatars/Leo/at-desk.png` — sleeves/hands/color only; do not copy front-only glasses/badge
3. `images/avatars/Quinn/seated-working-back.png` — arm direction only; do not copy Quinn identity
4. `images/avatars/Alice/seated-working-back.png` — arm symmetry only
5. `images/scene/office-shell.png` — pixel style/camera only; do not include

## Rita

Identity lock: loose warm-chestnut shoulder-length bob with long side-bang structure and layered flipped ends; white long-sleeve collared blouse with narrow dark neck detail; dark trousers and shoes; slim chibi build. Seated hair is loose: absolutely no ponytail, hair tie, or bun.

Idle reference paths, in order:
1. `images/avatars/Rita/idle.png` — identity/color/proportions and loose hair
2. `images/avatars/Rita/at-desk.png` — seated hair/upper body/sleeves only; do not copy front camera
3. `images/avatars/Alice/seated-idle-back.png` — centered female rear seated geometry only; do not copy bun
4. `images/avatars/Quinn/seated-idle-back.png` — leg-tuck geometry only
5. `images/scene/office-shell.png` — pixel density/camera only; do not include

Working reference paths, in order:
1. `tmp/imagegen/seated-regeneration/Rita/seated-idle-back/accepted-alpha.png` — edit target
2. `images/avatars/Rita/at-desk.png` — loose hair/sleeves/color only
3. `images/avatars/Alice/seated-working-back.png` — female arm direction only; do not copy bun
4. `images/avatars/Quinn/seated-working-back.png` — symmetric hands/leg-tuck only
5. `images/scene/office-shell.png` — pixel style/camera only; do not include
