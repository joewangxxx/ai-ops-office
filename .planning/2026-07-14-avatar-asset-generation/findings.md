# Avatar Asset Generation Findings

All findings here are project-state observations. No external web content is used.

## Initial context
- The workspace already contains the seven character directories and the named source/reference assets.
- A prior Alice seated-idle chroma-key generation was produced in this thread; the goal names candidate paths that must be checked before any regeneration.

## Phase A technical inventory
- All 28 required character references exist, decode as PNG/RGBA, and are 1254x1254 with transparent corners.
- All four shared references exist and decode. The three desk-layer images are PNG/RGBA/1254x1254; office-shell.png is PNG/RGB/1672x941.
- None of the 42 target filenames existed at the start of this goal.
- Alice candidate source exists as PNG/RGB/1254x1254. The keyed candidate exists as PNG/RGBA/1254x1254 with all four corner alpha values 0 and alpha bbox `(458, 277, 800, 965)`.
- Visual inspection of the keyed Alice candidate shows a single back-facing seated character, recognizable brown high bun, black outfit, relaxed arms, no furniture/text/shadow, and generous padding.
- The old `alice-seated-idle-desk-test.jpg` contains compositing artifacts and is not authoritative evidence; final scene QA must use the RGBA candidate and correct layer order.
- The worktree has unrelated pre-existing frontend/layout changes. This goal will not touch them.

## Reference identity and scene conventions
- A 7x4 visual audit sheet confirms each character's four source images consistently preserve that character's hair, clothing, glasses/accessories, colors, and pixel-art treatment.
- The app's authoritative layer order is chair back (z=5), avatar (z=10), desk front (z=20).
- The source canvas convention is 1254x1254. Existing avatar render size is 180x180; desk layers render at 210x210 and align their source bottom center `(630, 955)` to the desk anchor.
- Seated assets should be aligned to a seat-center anchor using the same source-canvas scaling formula. Goal-specific contact-sheet QA will use about 150x150 for seated assets and 180x180 for movement assets.
- Independent Phase A audit confirmed 28/28 character references and 4/4 shared references are present, readable, correctly sized, and free of corruption; no target file existed initially.
- Kara has a minor chest-emblem variation across references (white mark versus gold badge/cross). Rita has a real pose-dependent hairstyle variation (loose hair for idle/at-desk, ponytail for walk/carry). These are source ambiguities, not corruption: preserve the pose-appropriate source identity deliberately.

## Alice seated-idle candidate resolution
- Fresh layer-correct composites use office-shell -> desk-chair-back -> Alice candidate at 150x150 -> desk-front; the split chair/front masks are disjoint and reconstruct the standard desk exactly.
- Candidate alpha is technically clean: one connected component, no green-dominant nontransparent pixels, no crop contact, and no floating components.
- A wider placement sweep showed the earlier failure was caused by reusing the legacy front-facing `atDesk` seat anchor. Translating the seated sprite about 95–105 scene pixels lower produces a natural back-facing seated composition with torso over the chair and correct desk occlusion.
- At 150x150 the candidate visible bbox is about 41x82 px, closely matching Alice idle at about 41x87 px.
- The source border is green but not exact flat #00ff00; the explicitly reusable keyed RGBA candidate has no green residue, so the final is accepted while the source caveat is recorded.
- A targeted replacement generation was tested and rejected because its visible bbox would be about 66x121 px at 150, roughly 1.4–1.6x Alice's established scale.
- The original keyed candidate is accepted as `images/avatars/Alice/seated-idle-back.png` with seated-placement calibration recorded for QA only; no layout or frontend file is changed.

## Alice seated-working acceptance
- Generated from accepted `seated-idle-back.png` as the primary edit reference; other references were Alice idle/at-desk plus the workstation and office shell.
- Final is PNG/RGBA/1254x1254, bbox `(445,280)-(810,964)`, four transparent corners, one connected component, no green-dominant visible pixels, furniture, shadow, text, or props.
- Idle bbox is `(458,277)-(800,965)`; the top/hair alpha-mask Jaccard is 0.944 and both use the same source-canvas placement/scale.
- Raw sprite clearly changes from relaxed arms to forward/upward typing-ready arms with a subtle working lean; hair, bun, black outfit, and seated lower footprint remain stable.
- Shared 150x150 split-layer composite uses the same placement for idle and working and passes visual QA.
- The built-in model rendered a slightly varied green border despite the exact-green prompt; auto-keying/despill produced a clean final with zero visible green-dominant pixels.

## Alice movement acceptance
- `walk-up.png`: bbox `(470,219)-(773,996)`, one connected component, clean alpha, clear back-facing upward stride, no face/object/shadow; visible at 180 is about 43x112 px.
- `walk-down.png`: bbox `(454,182)-(788,1067)`, one connected component, clean alpha, clear front-facing downward stride and Alice identity; visible at 180 is about 48x127 px.
- `carry-up.png`: bbox `(462,178)-(829,1016)`, one connected component, clean alpha, clear back/up direction, blank tan folder visible at right side; visible at 180 is about 53x120 px.
- `carry-down.png`: bbox `(466,164)-(786,1044)`, one connected component, clean alpha, clear front/down direction, blank unmarked tan folder held with both hands; visible at 180 is about 46x126 px.
- All four have transparent corners, zero visible green-dominant pixels, no furniture/text/UI/shadow, and pass the standardized office-shell foot-target composite.
- Side-by-side `alice-movement-contact.png` confirms consistent bun/hair identity, outfit, foot alignment, and movement scale.

## Prompt-ready identity locks for remaining characters
- Jack: thick angular spiky jet-black hair; no glasses; vivid cobalt-blue collared shirt; small white left-chest patch only in front views; black trousers/shoes; compact average build.
- Bob: broad messy fluffy black hair; thick rectangular glasses; dark navy collared shirt with pale vertical button placket and no chest badge; relatively tall/long-limbed.
- Kara: saturated violet chin-length bob with rounded crown/flipped ends; purple collared top; petite build; canonical small gold four-point left-chest badge only in front views, never back/sleeve.
- Leo: smooth asymmetrical side-swept black hair; medium rectangular glasses; dark desaturated navy shirt with tiny pale square left-chest badge; slim compact build.
- Quinn: neat rounded blocky black hair with small rear tuft; oversized square black glasses; bright royal-blue shirt with crisp white square left-chest badge; compact broad-headed build.
- Rita seated: loose warm chestnut shoulder-length bob with long side bangs and flipped ends; white collared blouse with narrow dark neck detail; no ponytail/bun.
- Rita movement: same bangs but medium-high curved rear ponytail; white collared blouse and dark neck detail. Never drift into Alice's bun.

## Independent Alice audit
- Independent reviewer passed all 6/6 Alice finals on technical, identity/action, and scene-composite criteria.
- Every file is PNG/RGBA/1254x1254, has four zero-alpha corners, one foreground component at alpha thresholds >0/>12/>128/>254, no crop, no strong green residue, and no forbidden object/text/shadow.
- Seated pair: core-torso alpha IoU 0.990, upper-silhouette IoU 0.917, x-centroid drift <1 px, top drift 3–4 px, bottom drift 1 px.
- Sparse dark olive native edge samples become only 0–2 pixels at target render sizes and are visually undetectable; low-risk note only.
- Manual integration attention: all new seated sprites need a seated-specific vertical/source anchor later; old front-facing at-desk anchor is not reusable unchanged.

## Validation automation
- Added `tmp/imagegen/validation/avatar_asset_validator.py` plus 12 passing unit tests.
- Helper records required PNG/alpha/geometry/component/green metrics, seated-pair drift, robust movement foot anchors, JSON, and guarded contact sheets.
- Canonical contact sheets are intentionally withheld until all 42 assets exist; `.partial.png` sheets show missing placeholders during production.
- Initial live scan after Alice and Jack files appeared reported all present files as automated technical pass; visual identity/action fields remain manual by design.

## Jack preliminary visual review
- Partial sheets show Jack identity is stable: angular spiky black hair, vivid cobalt shirt, no glasses, black trousers.
- Carry-up folder is present along Jack's right side in the raw alpha asset, although only a small tan edge remains visible at 180px; final semantic review must judge whether that is sufficiently clear.
- Seated-idle is a rear three-quarter top-down seated pose with relaxed arm and no visible eye; one ear/side skin contour is visible but no frontal face.
