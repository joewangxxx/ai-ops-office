# Findings — Task 4 contextual Inspector

- Task 3 renders the map from `office-layout.json`; that JSON remains the only coordinate source.
- The Story Controller is currently an absolutely positioned child of `OfficeScene`, so it overlays the QA room and must move into `InspectorShell`.
- Dev rows currently place the lower labels at y=370 while the upper desks extend close to that position; resolve this through the JSON row coordinates only.
- Current Inspector has only a shell; all business values must be supplied by one new `demoScenario.ts` module.
- Static labels and Orbs already sit in a pointer-events-disabled layer and should remain noninteractive.
