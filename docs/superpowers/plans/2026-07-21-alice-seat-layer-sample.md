# Alice Seat Layer Sample Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a non-destructive Alice workstation overlay that preserves a readable chair and an unobscured rear-facing working pose.

**Architecture:** A deterministic Python builder produces derived, fixed-canvas desk layers and an overlay audit. A single generated chair candidate is treated as an input, converted from a chroma-key source to RGBA, and accepted only when the asset and composite checks pass.

**Tech Stack:** Python, Pillow, NumPy, built-in image generation, React project image assets.

## Global Constraints

- Do not modify, move, crop, resize, or overwrite any existing source PNG.
- Produce only Alice sample derivatives; do not alter React code, JSON layout data, or other desks.
- Every final sample asset is a 1254 x 1254 RGBA PNG with transparent corners.
- The final composite must use the rear-facing `seated-working-back` Alice asset.

### Task 1: Define asset and collision gates

**Files:**
- Create: `tools/asset_cleanup/test_alice_seated_workstation_sample.py`

- [ ] Add a failing test that requires the three derived assets and the overlay audit to exist, retain the source canvas, expose a chair beyond Alice's alpha silhouette, and prevent the foreground layer from covering Alice's head band.
- [ ] Run the test and verify that it fails before the sample builder or outputs exist.

### Task 2: Build deterministic desk layers and compositing audit

**Files:**
- Create: `tools/asset_cleanup/create_alice_seated_workstation_sample.py`
- Create at runtime: `images/derived/alice-desk-back-clean-sample.png`
- Create at runtime: `images/derived/alice-desk-foreground-clean-sample.png`
- Create at runtime: `apps/office-demo/screenshots/alice-seated-workstation-sample-overlay.png`

- [ ] Build the cleaned rear workstation and collision-safe foreground assets without changing the source canvas or source files.
- [ ] Compose the sample with background, desk back, chair, Alice, and foreground in that order.

### Task 3: Generate and validate a wider chair sample

**Files:**
- Create at runtime: `images/derived/alice-desk-chair-wide-sample.png`

- [ ] Generate one rear-view pixel-art chair on a flat chroma-key background using the built-in image tool and the existing chair only as a style reference.
- [ ] Convert the selected source to RGBA, center it without resampling on the 1254 x 1254 canvas, and reject it if the silhouette does not remain visible around Alice.

### Task 4: Verify the sample

**Files:**
- Create at runtime: `apps/office-demo/screenshots/alice-seated-workstation-sample-audit.png`

- [ ] Run the asset test after generation and confirm it passes.
- [ ] Visually inspect the overlay and audit image for a visible chair, unoccluded head, aligned hands, no baked floor tiles, and no chroma fringe.
