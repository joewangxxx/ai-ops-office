# AI OPS Office Demo — Task 3 static map

## Goal
Assemble the static, presentation-ready office map in `apps/office-demo` entirely from `docs/office-layout.json`, with no source-image mutation and no interaction or animation logic.

## Phases

### Phase 1: Data contract and red test
Status: complete
- Read the Task 1 asset/layout files, product Spec, and all existing Task 2 source.
- Add a failing map rendering test that asserts the required desk, Avatar, Orb, name-tag, Hub, and static-count contract.
- Create the generic integer-rounded transparent-asset placement helper.

### Phase 2: Layered static rendering
Status: complete
- Render seven `atDesk` Avatars, then ten desks and one Hub, then Hub counts, name tags, and seven gray Orbs.
- Derive every asset URL, anchor, source anchor, and size from the layout JSON.
- Preserve the Task 2 Inspector and noninteractive Story Controller shell.

### Phase 3: Verify presentation
Status: complete
- Run unit tests and a production build.
- Capture and inspect desktop and 390px narrow screenshots for fully loaded assets, no clipping, overlap, coordinate guides, or persistent handoff UI.
- Decide Hub prominence from the rendered image; change only JSON `recommendedRenderSize` if adjustment is needed.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Build failed with TS7053 in the static-map test | Test directly imported JSON, so its avatar object was inferred as a fixed-key object while the desk avatar key was a string | Import the application JSON wrapper, which preserves the single JSON source while providing the required record index signature. |
| Hub size edit initially matched the preceding desk render-size line | The JSON has adjacent identical 210px values | Restored the desk to 210px and changed only `assetAnchors.furniture.artifactHub.recommendedRenderSize` to 240px with contextual patching. |
