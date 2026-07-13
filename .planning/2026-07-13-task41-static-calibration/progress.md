# Progress — Task 4.1 static visual calibration

## 2026-07-13

- Read the requested layout/data/component/style sources without altering production code or image assets.
- Started the existing page and captured a pre-change 1440 × 900 browser screenshot.
- Inspected source desk, Hub, and representative at-desk avatars; Pillow 11.1.0 is available for lossless RGBA asset processing.
- Added `tests/task41-static-calibration.test.tsx` before production changes and observed the intended red state: missing source-rect helper, missing JSON layer data, missing rendered layers/screen panel, missing Workspace disclosures, and obsolete PM Office handoff copy.
- Generated `images/furniture/desk-chair-back.png` and `images/furniture/desk-front.png` from a lossless central neutral-chair alpha mask. Both preserve the 1254 × 1254 canvas; their visible recomposition matches the original desk against dark and light backgrounds.
- Added the requested JSON metadata, seated-avatar anchors, source-rect helper, layered map rendering, Hub screen panel, Workspace disclosures, and corrected Handoff copy.
- Re-ran the dedicated Task 4.1 tests: 6/6 pass after the red-to-green cycle.
- Full unit suite and production build pass: 4 test files / 11 tests; Vite production bundle completed successfully.
- Performed 1440 and 1920 visual review. Adjusted only JSON `seatAnchor` coordinates after the first candidate overly obscured seated sprites; final screenshot confirms readable seated silhouettes with correct layer order.
- Captured final screenshots at 1440 × 900, 1920 × 1080, and 390 × 844. The mobile Hub drawer preserves the full map above it, and Escape closes the drawer.
- Final verification completed: 11/11 tests pass, production build succeeds, generated desk layers retain 1254 × 1254 canvases and visibly recomposite the original on two backgrounds, page errors are absent, no broken images or horizontal overflow were observed.
