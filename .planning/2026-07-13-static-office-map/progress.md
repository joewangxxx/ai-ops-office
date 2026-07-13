# Progress — Task 3 static map

## 2026-07-13
- Read both Task 1 deliverables, the complete design Spec, and all Task 2 source/configuration before changing the map.
- Confirmed no Git worktree is available in this standalone workspace; work remains in the explicitly requested app directory.
- Added the static-map contract test and observed its expected initial failure: no `DeskStation` existed. Implemented the JSON-driven map layers and corrected the test's generic selector to match the components' required per-desk test IDs.
- The first TypeScript build isolated a test-only key-indexing error caused by raw JSON inference. The app's data wrapper already supplies the correct record type, so the test now consumes that same source wrapper.
- Browser inspection caught and fixed a clipped-map scaling bug. Added a failing canvas-fill test, confirmed the invalid CSS transform, and switched the static placement output to scene-relative rendering while preserving the required integer logical-pixel anchor calculation.
- Increased only `docs/office-layout.json`'s Artifact Hub `recommendedRenderSize` from 210 to 240 after visual review; the visual footprint remains clear of walls and fixed decor.
- Final verification passed: 2/2 Vitest tests, TypeScript + Vite production build, 10 desks / 7 online data contract, scene dimensions, Hub/desk render sizes, and desktop/narrow screenshot dimensions. The scene source SHA-256 is unchanged: `BE73EB5179DA24C6AA1E37F0103D6D732F33B505791844D5434FB0078F3C581D`.
