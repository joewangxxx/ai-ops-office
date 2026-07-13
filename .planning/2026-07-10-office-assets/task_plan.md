# AI OPS Office assets and layout

## Goal
Deliver the requested asset inventory, machine-readable 1672 × 941 layout coordinates, and a non-destructive coordinate overlay for the AI OPS Office Demo.

## Phases

### Phase 1: Inspect assets and scene constraints
Status: complete
- Verified `office-shell.png` is 1672 × 941 and opaque.
- Verified every supplied overlay asset uses a 1254 × 1254 transparent canvas.
- Captured each asset's alpha bounding box to derive visual anchors.

### Phase 2: Define scene coordinate system and placement data
Status: complete
- Keep all desk, avatar, tag, orb, and Hub positions in the base scene's logical pixels.
- Allocate PM, Dev, QA, and Hub clear-floor placements without covering perimeter decor.

### Phase 3: Generate requested deliverables and verify
Status: complete
- Write the Markdown and JSON manifests.
- Generate the independent overlay PNG from a copy of the base scene.
- Validate output size, JSON syntax, coordinate bounds, and source-image integrity.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Workspace is not a Git repository | Read git status/log | Not relevant to this asset-only deliverable; no Git action is required. |
| Markdown heading assertion failed in a PowerShell-piped Python check | The inline Chinese literals were decoded by the shell with a non-UTF-8 code page | Re-run the documentation assertion using ASCII Unicode escapes; the JSON, geometry, and roster assertions had already completed. |
