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
