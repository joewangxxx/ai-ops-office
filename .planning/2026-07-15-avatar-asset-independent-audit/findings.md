# Independent Audit Findings

## Baseline
- The generation goal reports 42/42 assets and provides validator outputs and contact sheets.
- This audit treats those outputs as evidence to verify, not as an automatic acceptance.

## Inventory
- All seven required character directories are present: Alice, Bob, Jack, Kara, Leo, Quinn, and Rita.
- Each character has exactly the six required target names: `seated-idle-back.png`, `seated-working-back.png`, `walk-up.png`, `walk-down.png`, `carry-up.png`, and `carry-down.png`.
- All 42 target files exist and are non-empty.
- The prior goal's validator, unit tests, JSON, and two canonical contact sheets are present and decodable by filesystem inspection; this audit will regenerate separate evidence.

## Fresh technical validation
- Independent validator run reports 42 expected, 42 present, 0 missing, 42 automated technical passes, and 0 automated technical failures.
- The validator correctly leaves overall status at `manual_review_required`; visual identity/action/scene fit are not inferred from pixel metrics.
- Validator unit suite passes 12/12, covering component counting, green-residue metrics, meaningful alpha, tiny-sprite rejection, seated-pair drift, foot anchors, missing/corrupt files, and partial sheets.
- Independent evidence was written under this audit plan as `validation.json`, `seated-contact-sheet.png`, and `movement-contact-sheet.png`.

## Contact-sheet visual review (provisional)
- Movement directions are consistently encoded across all seven characters: `up` assets show rear views and `down` assets show front views.
- Character identity is stable across movement variants; no obvious missing sprite, label mismatch, background block, furniture, UI text, or shadow is visible.
- Fixed-180px movement scale is broadly consistent after the Leo correction. Jack is intentionally broader/larger and Rita slimmer, without an obvious unusable outlier.
- Carry folders are clear for Bob, Jack, Kara, Leo, Quinn, and Rita. Alice `carry-up.png` is provisionally flagged for raw-file inspection because the folder face is mostly hidden at 180px and may read as a small tan side strip.
- Alice and Quinn seated assets read as centered rear-facing desk poses. Bob, Jack, Kara, Leo, and Rita use a rear three-quarter/side-seated silhouette with bent legs extending to the right; these require stricter raw/composite review against the `*-back` naming and workstation standard before acceptance.

## Metric review
- Every file is PNG/RGBA 1254x1254, has four transparent corners, one 8-connected visible component, zero green-dominant pixels, and zero chroma-key-like pixels.
- All 42 alpha bounding boxes clear the canvas edges and exceed meaningful-size thresholds.
- Seated idle/working pairs are geometrically stable: upper-silhouette proxy IoU ranges from 0.921 (Quinn) to 0.997 (Bob), with no material vertical drift. Bob and Leo widen in working pose because their arms extend forward/right, which is visually consistent with the intended action change.
- No metric indicates corruption, residue, clipping, detached debris, or an invalid movement foot anchor.

## Targeted raw inspection
- Alice `carry-up.png` contains a real blank tan folder with several visible edges and hand contact. Although partly occluded at 180px, it remains distinguishable from the hand; the provisional flag is cleared.
- Bob `seated-idle-back.png` is technically clean and identity-consistent, but the raw pose is a pronounced rear three-quarter seated/kneeling silhouette with both bent legs extending to the right rather than a centered back-facing chair pose. This confirms the contact-sheet concern is in the source asset, not the composite renderer.
- Jack and Rita `seated-idle-back.png` show the same underlying geometry: torso rotated to the right with bent legs extending laterally. They are clean character cutouts, but they do not match the centered, monitor-facing seat orientation demonstrated by Alice and Quinn.
- Bob and Kara `seated-working-back.png` confirm the functional failure: their torso and hands face screen-right, while the workstation monitor/keyboard are above them in the office scene. The hands therefore type into empty space instead of toward the desk. Jack, Leo, and Rita show the same geometry in the full seated sheet.
- This is a semantic/frontend-fit failure affecting both seated assets for Bob, Jack, Kara, Leo, and Rita (10 files total), despite all ten passing technical alpha checks.
- Alice and Quinn `seated-working-back.png` provide the valid reference geometry: centered rear torso, symmetrical hands raised toward the top-aligned keyboard/monitor, and no lateral leg extension. Both seated pairs are accepted.

## Identity/style comparison
- Comparing the final sheets to the 7 x 4 legacy reference sheet shows stable distinguishing features: Alice bun/black outfit; Bob fluffy hair/glasses/navy placket; Jack spiky hair/cobalt shirt; Kara violet bob/gold front badge; Leo side-swept hair/glasses/dark navy; Quinn blocky hair/large glasses/royal blue; Rita loose seated hair versus ponytail movement hair.
- Movement assets retain the established pixel-art palette and remain readable on the office floor at the intended 180px render size.
- The documented standard explicitly requires seated workstation-composite QA and seat-center alignment. Therefore the five side-facing seated pairs cannot be accepted merely because their identity and alpha metrics pass.

## Final classification
- 32/42 assets are frontend-ready: all six Alice assets, all six Quinn assets, and all four movement assets for Bob, Jack, Kara, Leo, and Rita.
- 10/42 assets require rework: both seated assets for Bob, Jack, Kara, Leo, and Rita.
- All 28 legacy reference assets remain unchanged. The final target filename matrix is complete at 6 targets per character.
- The ten failures cannot be repaired by anchor adjustment because their internal body/arm direction is wrong; they require regeneration or redraw.

## Regenerated seated assets: technical recheck
- All ten previously rejected seated files now have 2026-07-15 modification timestamps and remain 1254x1254 images with alpha-capable 32-bit pixel format.
- A fresh full-validator run after replacement again reports 42 expected/present, 42 automated technical passes, 0 missing, and 0 automated technical failures.
- Separate recheck evidence was generated as `validation-recheck.json`, `seated-contact-sheet-recheck.png`, and `movement-contact-sheet-recheck.png`.

## Regenerated seated assets: visual recheck
- The new seated contact sheet removes the prior systematic side-facing failure. Bob, Jack, Kara, Leo, and Rita are now centered rear views with shoulders square to the desk and no legs extending laterally toward screen-right.
- All five idle poses keep arms low and read as seated at the chair center.
- All five working poses raise both forearms toward the top-aligned keyboard/monitor. Bob, Jack, and Kara are immediately legible at 150px; Leo and Rita use smaller hand exposure but raw inspection confirms two raised forearms and correct upward direction.
- Identity locks remain intact: Bob fluffy black hair/navy shirt; Jack spiky hair/cobalt shirt; Kara violet bob/purple top; Leo side-swept black hair/dark navy; Rita loose chestnut hair/white blouse.
- Cross-character size and seat placement are now within the established Alice/Quinn range. No new furniture, shadows, text, props, face/front-view leakage, or obvious style mismatch is visible.

## Regenerated seated assets: pair and scale metrics
- All ten reworked files retain automated technical status `pass`, one foreground component, and zero green-dominant pixels.
- Idle/working pair center drift is at most 2 source pixels horizontally and 6 vertically; upper-silhouette proxy IoU ranges from 0.924 (Jack) to 0.985 (Kara), supporting stable identity and shared placement.
- At the intended 150px canvas, regenerated visible heights range from 75.7px to 86.8px, compared with Alice at 81.9-82.4px and Quinn at 82.4-84.7px. This is an acceptable character-proportion range rather than a scale outlier.
- Regenerated bbox centers remain near source x=627-634, consistent with the seat-center convention.

## Phase 4 final acceptance
- The ten regenerated seated files resolve every semantic and workstation-fit failure from the first audit.
- Final package classification is updated from 32 pass / 10 rework to 42 pass / 0 rework.
- Image-level acceptance is complete. Frontend integration still needs the documented seated-specific source/vertical anchor; that is layout work, not an image defect.
