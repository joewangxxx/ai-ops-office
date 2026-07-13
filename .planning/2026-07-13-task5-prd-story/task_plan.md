# AI OPS Office Demo — Task 5 PRD handoff story

## Goal

Deliver the first PM-to-Dev Artifact handoff as a data-driven React story: Alice deposits Login Requirement PRD at the Hub and Jack receives it before entering Coding. Preserve Task 4/4.1 behavior and complete browser, test, and build verification.

## Constraints

- Gate 0 must correct seated pose anchors solely in `docs/office-layout.json` and produce a visual audit before story work.
- The route is data-only and must split into collision-safe producer and consumer route segments.
- Story rules live in a standalone module; React components render state rather than encode business transitions.
- No permanent route line, new Workspace/QA flow, live data, or external integrations.

## Phases

### Phase 1: Baseline and Gate 0 calibration
Status: completed
- Start the current UI, capture a pre-change visual baseline, inspect seven seated sprites, and update only JSON pose/seat anchors after validation.
- Save a seated-avatar audit image.

### Phase 2: Test-first story contract and layout routes
Status: completed
- Add failing state-machine/UI tests for state progression, reverse/replay, artifact locations, Hub quantities, notification/Coding visibility, duplicate-avatar prevention, and reduced motion.
- Replace mixed handoff route data with producer and consumer routes.

### Phase 3: Story implementation
Status: completed
- Implement pure state/data module, scene projection, animation-aware actor/artifact components, and active controller integration.
- Keep Inspector presentation contextually driven by projected demo data.

### Phase 4: Verification and visual acceptance
Status: completed
- Run full tests and build; inspect all required desktop/mobile key states and console output.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| First Gate 0 placement lowered PM/Dev torsos too deeply behind the desk front | 1 | Compared the new screenshot against baseline and changed only JSON anchors to a smaller PM/Dev adjustment and a shallower QA uplift. |
| Story UI regression initially referenced a destructured `desk` parameter before it was initialized | 1 | Moved optional NameTag/Orb anchor defaults into their component bodies; targeted story tests then passed. |
| Production build found `OrbAsset.meaning` missing from TypeScript metadata | 1 | Added the existing JSON field to the asset type and re-ran the complete test/build commands. |
