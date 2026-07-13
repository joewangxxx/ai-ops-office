# AI OPS Office Demo — Task 2 shell

## Goal
Create the requested Vite + React + TypeScript shell at `apps/office-demo`, using Task 1's JSON as its sole layout-data source and leaving `images/` untouched.

## Phases

### Phase 1: Freeze inputs and semantics
Status: complete
- Read the approved Spec and existing implementation plan's Task 2.
- Correct the three Orb meanings in the Task 1 Markdown and JSON metadata.
- Add a failing app-shell test before production components are written.

### Phase 2: Build the minimum application shell
Status: complete
- Add Vite, React, TypeScript, Vitest, and Testing Library configuration.
- Import `docs/office-layout.json` directly from `src/data/officeLayout.ts`.
- Build the static scene, responsive Inspector shell, and noninteractive Story Controller shell.

### Phase 3: Verify and capture
Status: complete
- Install dependencies, run unit tests, run the production build, and inspect desktop and narrow viewport screenshots.
- Confirm scene assets remain outside the new app and have not been changed.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Workspace has no Git metadata | Checked worktree state | Use the explicitly requested standalone app directory; no worktree can be created. |
| Vite 7 and React plugin 5 require Node 20.19+, but Node 20.16 is installed | `npm install` emitted `EBADENGINE` warnings | Pin Vite to 6.x and the React plugin to 4.x before implementation. |
