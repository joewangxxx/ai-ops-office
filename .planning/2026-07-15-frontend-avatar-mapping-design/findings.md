# Frontend Avatar Mapping Design Findings

## Baseline
- The independent asset audit accepts all 42 images.
- Seated assets require a seated-specific source/vertical anchor and must not reuse the old front-facing `at-desk.png` anchor unchanged.

## Current frontend architecture
- `docs/office-layout.json` is the authoritative runtime data source and is cast to `OfficeLayout` in `src/data/officeLayout.ts`.
- The existing avatar registry supports only `idle`, `atDesk`, `walk`, and `carry`; static desk rendering always selects `atDesk`.
- A desk already has a scene-level `seatAnchor`, and the old `atDesk` asset has a per-character `visualSeatCenterSource`. Placement uses the reusable `calculateScenePlacement(sceneAnchor, sourceAnchor, renderSize, sourceCanvas)` formula.
- Desk layering is already correct for seated sprites: chair back, avatar, desk front. Offline desks omit the avatar.
- Current avatar rendering uses one global 180x180 render size. The approved seated assets were validated at 150x150 while movement assets were validated at 180x180, so the new schema needs separate seated and movement render sizes.
- The Task6 story vocabulary is still `atDesk | walk | carry`; changing it to directional movement poses would couple this task to story-engine behavior. The design should preserve story behavior and defer directional movement selection.

## Reconnect audit
- No persistent Codex Goal is active; the completed image-generation Goal will not be resumed or overwritten.
- The worktree contains existing Task6/frontend changes and newly approved image assets. Integration work must remain scoped to avatar registry/types, seated rendering, calibration data, and tests.
- `docs/office-layout.json` already documents a `seatedAvatar` placement convention and each desk already has `seatAnchor`; the missing pieces are the 42-file registry schema, seated-specific render size/source anchors, and a stable presentation rule choosing idle versus working.

## Confirmed product decision: online means working
- The frontend must not infer Active Work from computer activity, artifact count, story stage, or Agent-orb state.
- Any employee with `online: true` is treated as working while seated and uses `seated-working-back.png`.
- An employee with `online: false` has no Avatar rendered; the empty desk remains selectable as an offline desk.
- Walking/carrying temporarily overrides the seated sprite. When movement ends, an online employee returns to `seated-working-back.png`.
- Agent orb color remains independent from the human pose and must not select the seated image.
- `seated-idle-back.png` must be registered for all seven actors but has no runtime rendering entry in the first version; it is reserved for a possible future break/away state.

## Confirmed integration approach: full pose-model replacement
- Use Option B: replace the runtime pose vocabulary in one migration with `seatedWorkingBack`, four-direction `walk`, and four-direction `carry` poses.
- `seatedIdleBack` remains registered but is not selected in version one because the confirmed product rule is `online = working`.
- Retire runtime selection of the legacy `idle`, `atDesk`, `walk`, and `carry` poses after the migration is accepted; do not keep a mixed old/new presentation path.
- Directional movement becomes an explicit renderer/story-engine responsibility. Every movement segment must resolve to up or down, and carrying must use the corresponding directional asset.
- Seated and movement assets keep independent render sizes and source anchors; the new model must not force 150x150 seated calibration through the 180x180 movement configuration.

## Asset repair gate
- The user is repairing part of the current 81-image inventory. Design and code-migration planning may continue, but the runtime cutover must not be accepted while required replacement assets are still marked for repair.
- Maintain an asset-status manifest with at least `approved`, `needs_repair`, and `blocked` states. Runtime code may reference only `approved` assets in the final cutover build.
- The cutover gate requires every runtime-required pose for all seven online actors to pass technical validation, identity/style review, direction review, transparent-edge review, and scene-composite review.
- Do not silently fall back to a legacy pose when a new directional asset is missing. Missing required assets must fail validation before build/acceptance so visual defects are not hidden.

## Confirmed four-direction asset strategy
- Generate independent left- and right-facing movement assets instead of mirroring an existing side pose.
- Add `walk-left.png`, `walk-right.png`, `carry-left.png`, and `carry-right.png` for Alice, Bob, Jack, Kara, Leo, Quinn, and Rita: 28 new files total.
- The final runtime pose vocabulary is `seatedWorkingBack`, `walkUp`, `walkDown`, `walkLeft`, `walkRight`, `carryUp`, `carryDown`, `carryLeft`, and `carryRight`; `seatedIdleBack` remains registry-only in version one.
- Left/right files must be independently generated so asymmetric hair, clothing, hands, and folder occlusion remain physically correct; CSS mirroring is not allowed in the accepted runtime.
- New files must not overwrite the legacy generic `walk.png` and `carry.png` while asset generation and validation are in progress.

## Anchor audit detail
- The scene-side desk anchors are already explicit in `docs/office-layout.json`, but the current `visualSeatCenterSource` values belong to the legacy `at-desk.png` files. Each approved `seated-*-back.png` therefore needs its own source anchor metadata rather than inheriting the legacy values.
- The current placement convention text still names `atDesk`; the implementation design must update the convention additively so legacy story poses and new static seated poses are unambiguous.
- The accepted-asset validator renders seated sprites at 150x150 and derives a stable bottom-center anchor from the alpha mask. Its preview then aligns that source anchor to the desk anchor plus a seated-only vertical offset. This is a reproducible calibration starting point, but the formal layout schema should store the final source anchor explicitly rather than recomputing alpha geometry in the browser.
- The real legacy story sprite component is `src/components/office/StoryActorSprite.tsx`; prior notes using `src/components/story/StoryActorSprite.tsx` were stale.
- The validator's accepted composite uses `SEATED_DESK_Y_OFFSET = 16`: the seated sprite's stable alpha-bottom center is aligned to `(deskAnchor.x, deskAnchor.y + 16)`. This is not equivalent to the current desk `seatAnchor` (for example, the Bob desk preview uses desk anchor y=548 while the existing seat anchor is y=469). Directly reusing `seatAnchor` would place the new back-facing seated body roughly 95 scene pixels too high.
- The formal design therefore needs a distinct scene-side `seatedBackAnchor` (or an equivalent layout-owned offset), while preserving the old `seatAnchor` semantics for compatibility. The browser must consume stored anchor metadata and must not analyze image alpha at runtime.
- `prdHandoffStory.ts` still stores each at-desk story actor at `desk.seatAnchor`, while movement paths start from `desk.avatarAnchor`. Therefore `seatAnchor` and `avatarAnchor` are compatibility data and must not be repurposed for the new back-facing seated composition.
- Recommended scene schema: add an explicit `seatedBackAnchor` to every desk, initially calibrated from `(deskAnchor.x, deskAnchor.y + 16)`. Explicit per-desk coordinates preserve the existing data-driven coordinate-table pattern and allow later local correction without component CSS offsets.
- Recommended source schema: each new seated asset stores an explicit `visualSeatedBaseCenterSource` derived from the accepted stable alpha-bottom-center result. This avoids the misleading legacy `visualSeatCenterSource` name and avoids browser-side image analysis.
- The seated validation records contain technical image bounds but do not persist the derived bottom-center anchor. The implementation preparation step must export those 14 anchors once with the already accepted validator algorithm and then copy the resulting numbers into `office-layout.json`.
- Existing tests already assert seven online avatars, no avatars at offline desks, layer presence, old `atDesk` asset paths, and Task6 state semantics. The design should update only the old static asset-path assertion, add registry completeness/anchor checks, and retain the Task6 story test suite as a regression boundary.

## Exported accepted seated source anchors
- Alice: idle `(628.5, 964)`, working `(627.5, 963)`.
- Bob: idle `(627.5, 973)`, working `(628.5, 967)`.
- Jack: idle `(626.5, 960)`, working `(626.5, 958)`.
- Kara: idle `(629.0, 888)`, working `(628.5, 886)`.
- Leo: idle `(635.0, 958)`, working `(634.0, 955)`.
- Quinn: idle `(617.0, 964)`, working `(616.5, 957)`.
- Rita: idle `(631.0, 931)`, working `(629.5, 930)`.
- These values were exported by invoking the accepted validator's `derive_foot_anchor` implementation against the current approved RGBA files. They are metadata inputs, not runtime calculations.
- Existing sprite CSS already applies `image-rendering: pixelated` to both the sprite container/image and moving avatars, so the 150px seated path needs no separate image-sampling rule.
