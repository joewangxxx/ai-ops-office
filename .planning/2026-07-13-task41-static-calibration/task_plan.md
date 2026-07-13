# AI OPS Office Demo — Task 4.1 static visual calibration

## Goal

Calibrate the static office map through pixel-preserving desk layers, data-backed seated-avatar anchors, Hub screen-relative text, and scoped Inspector disclosure fixes.

## Phases

### Phase 1: Baseline and pixel measurements
Status: completed
- Preserve a pre-change browser screenshot.
- Inspect all requested source/assets and record Hub/desk source measurements.

### Phase 2: Test-first data and asset preparation
Status: completed
- Add failing tests for source-rect conversion, Hub configuration, desk layers, and Inspector disclosures.
- Generate 1254 × 1254 transparent chair-back and desk-front assets only after the split mask has been visually verified.
- Add JSON seat/screen anchors and source metadata.

### Phase 3: Scene and Inspector calibration
Status: completed
- Render chair → seated avatar → desk front layers from JSON anchors.
- Render Hub quantities from `screenRectSource` and correct the Handoff copy.
- Add Workspace roster and metric disclosure behavior.

### Phase 4: Verification
Status: completed
- Run full tests and production build.
- Inspect 1440 × 900, 1920 × 1080, and 390 × 844 screenshots plus console/page errors.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| Initial seat candidate obscured Avatar torsos behind desk front | Used chair-bottom reference | Recalibrated only JSON `seatAnchor` values to the validated seated-silhouette plane; no CSS/scale workaround. |
| Automated Workspace selector center was covered by a desk image | Browser click sampled the room center, not blank floor | Unit interaction test verifies disclosure behavior; map retains blank-area-only Workspace targets by design. |
