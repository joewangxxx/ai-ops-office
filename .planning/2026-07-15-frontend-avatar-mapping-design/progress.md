# Frontend Avatar Mapping Design Progress

## 2026-07-15
- Started current-code audit for the frontend asset mapping and seated anchor calibration design.
- Fixed the task boundary: register all 42 assets; actively integrate/calibrate seated idle and working only; defer directional movement/story-engine changes.
- Audited the current layout types, JSON registry, static avatar renderer, story actor renderer, placement utility, and chair/avatar/desk-front layer order.
- Reconnected after asset acceptance, confirmed no active Goal, restored this existing design plan, and completed the current-code audit.
- Confirmed the first rendering rule: online employees are always considered working; no Active Work or device-activity inference is allowed.
- Confirmed `seated-idle-back.png` is registry-only in the first version and will not be selected by current runtime state.
- Compared three integration strategies. The earlier Option A decision was superseded by the user's final selection of Option B: replace the complete runtime pose model in one migration.
- Began the seated anchor audit. Confirmed existing desk `seatAnchor` values can remain scene-side anchors, while the approved seated images require new per-image source anchors.
- Located the accepted validator's seated preview rule: 150x150 rendering, stable alpha-bottom-center source anchor, and a seated-specific scene Y offset. Located the real `StoryActorSprite` component path.
- Identified a material anchor incompatibility: the approved back-facing seated composite aligns to `deskAnchor + (0,16)`, not the existing `seatAnchor`. The design must add a separate scene-side seated-back anchor while keeping legacy story data intact.
- Verified that Task6 retains `seatAnchor` in its at-desk actor frames and `avatarAnchor` in movement routes. Chose an additive `seatedBackAnchor` desk field plus an explicit per-seated-image source anchor as the safe calibration model.
- Inspected the accepted seated record schema and relevant frontend tests. Confirmed the anchor coordinates must be exported once from the validator and that existing Task6 tests can remain the regression contract.
- Exported all 14 accepted seated source anchors with the validator's stable alpha-bottom-center algorithm and confirmed existing CSS already preserves pixel-art sampling.
- Added an explicit asset-repair gate: migration design can continue while the 81-image inventory is repaired, but runtime cutover cannot be accepted until every required replacement asset is approved; legacy-pose fallback is forbidden in the final model.
- Confirmed the high-fidelity horizontal strategy: generate four independent left/right movement files per actor (28 total), with no CSS mirroring and no overwrite of legacy generic side assets during preparation.

## Errors encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| Targeted `rg` included a stale `src/components/story/StoryActorSprite.tsx` path and returned exit code 1. | 1 | Locate the component with `rg --files` and inspect its real path; do not repeat the stale path. |
| PowerShell audit assumed seated records contained `foot_anchor.source`; the validation report stores foot anchors only for movement records, so the array was null. | 1 | Inspect the seated record schema, then derive the 14 seated anchors offline with the validator's accepted `derive_foot_anchor` function. |
