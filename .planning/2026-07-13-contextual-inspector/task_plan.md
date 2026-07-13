# AI OPS Office Demo — Task 4 contextual Inspector

## Goal
Repair the Task 3 presentation issues, add accessible map-object selection, and render a privacy-safe contextual Inspector using static Demo Mode data only.

## Phases

### Phase 1: Visual contract and red tests
Status: in_progress
- Move the Story Controller into the Inspector's sticky footer.
- Adjust both Dev desk rows only through layout JSON anchors; update the Markdown coordinate table and Hub render-size documentation.
- Increase the JSON Hub render size to 300 × 300.
- Add failing tests for the six selections, Inspector content constraints, and map keyboard controls.

### Phase 2: Selection and data-driven Inspector
Status: pending
- Define `Selection` and place its state only in `App`.
- Add static workspace, Avatar, Artifact, Hub, and handoff data in `demoScenario.ts`.
- Implement accessible scene hotspots and the Inspector's context views/one-level disclosure patterns.

### Phase 3: Validate interaction and presentation
Status: pending
- Run tests and production build.
- Use browser automation for desktop and 390px screenshots, keyboard selection, console/page error checks, and source-image integrity verification.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| None | — | — |
