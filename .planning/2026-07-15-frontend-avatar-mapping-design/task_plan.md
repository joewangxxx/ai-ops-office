# Frontend Avatar Mapping and Seated Anchor Calibration Design

## Goal
Define a safe implementation plan and execution prompt for the final 70-file per-character pose matrix across seven actors: the 42 existing new-model assets plus 28 independently generated horizontal assets, followed by a one-time runtime pose-model migration.

## Phase 1: Current frontend audit
Status: complete
- Inspect current avatar asset types, layout data, desk anchors, layer order, render sizes, story pose mapping, and relevant tests.

## Phase 2: Integration design
Status: in_progress
- Define the full replacement pose vocabulary, directional movement rules, asset registry, seated/movement anchor model, rendering rules, migration boundary, and asset-repair gate.
- Define calibration workflow and visual acceptance evidence.

## Phase 3: Execution plan and prompt
Status: pending
- Produce phased implementation tasks, tests, exact commands, screenshots, and a copy-ready Goal prompt.

## Constraints
- Do not regenerate or edit approved images.
- Do not edit images currently being repaired by the user.
- The design must cover the story-engine changes required by directional walk/carry poses, but implementation waits for a separate approved execution plan.
- Do not ship or accept a mixed legacy/new runtime pose model.
- Preserve existing user changes and unrelated dirty-worktree files.

