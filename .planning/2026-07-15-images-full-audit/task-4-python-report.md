# Task 4 Python Audit Gate Report

## Scope and constraints

- Python-only Task 4 worker: create `tests/test_audit_image_assets.py` and `tools/audit_image_assets.py`.
- Registry authority: `docs/office-layout.json`; the fixed reachable inventory must be exactly 81 unique image paths.
- CLI contract: `audit_image_assets.py --root <repo> --layout docs/office-layout.json --json <report>`.
- No image, package, registry, or documentation edits; no ImageGen; no Git state-changing commands.

## Execution plan

1. Read the Task 4 brief, Scheme A Task 4 plan, existing sanitizer and tests, and the complete layout registry.
2. Define public audit/report contracts and synthetic fixtures covering every required failure and category policy.
3. Create tests first and record the expected missing-module RED.
4. Implement exact registry traversal, case/path safety, PNG/decode/pixel/SHA/size/category gates, and deterministic JSON CLI output.
5. Run focused auditor tests, then both Python image-tool suites.
6. Run the real 81-file CLI to `task-4-asset-audit.json`; independently check counts and policy/threshold reporting.
7. Record final commands, outputs, thresholds, allowlists, limitations, and changed-file boundary.

## Error log

| Error | Attempt | Resolution |
|---|---:|---|
| PowerShell rejected a pipeline placed directly after a `foreach` block while collecting source-file sizes. | 1 | Collected rows into an array and piped the completed array instead. |
| Tried to inspect `technical-audit.json` through a nonexistent `files` key. | 1 | Read the actual top-level keys (`summary`, `assets`) and inspected `assets[0]`. |

## Evidence

### Source-plan findings

- Expected registry split: 70 Avatar, 4 Furniture, 3 Artifact, 3 Orb, and 1 Scene path; exact total 81.
- The Scene contract is a 1672x941 RGB PNG. Every other registered path is a 1254x1254 RGBA PNG and is subject to Alpha/corner/edge/chroma/halo checks.
- Exact visible `#00ff00` and far hidden RGB are hard failures, not category warnings.
- Category policy must remain explicit: Orb glow is intentional; legacy contact-shadow assets and intentionally shadow-free compositing assets require separately reported policy rather than a global shadow heuristic.
- Task 3 has already sanitized the fixed 35-path set, so the real gate must verify the post-apply repository without altering images or weakening synthetic failure cases.
- Existing sanitizer path hardening provides the local convention to preserve: canonical `images/...png` POSIX paths, exact directory-entry casing, regular-file/link rejection, resolved-root containment, and fail-closed errors.
- Existing PNG handling binds one immutable byte read to signature/chunk/IHDR validation and Pillow `verify()`/`load()`; the auditor should likewise derive SHA and decode evidence from one file snapshot per registered asset.
- Existing pixel invariants use `alpha > 0` as visible, a 5x5 max-filter neighborhood for Chebyshev radius 2, SHA-256 over immutable bytes, and explicit per-target metric dictionaries; the auditor report can follow those conventions without importing transaction internals.
- The established JSON style is deterministic schema/status/summary plus per-path records and fail-closed exceptions; audit CLI failure must still emit its requested JSON report so CI can inspect concrete violations.
- Existing tests establish repository conventions: import the tool module directly for focused behavior, generate real PNG fixtures with Pillow, exercise CLI through `subprocess`, and assert both exit code and persisted JSON evidence.
- The auditor must stay read-only. Unlike the sanitizer, it needs no transaction/recovery machinery; path and immutable-snapshot validation can be kept small and independently testable.
- Synthetic audit fixtures will use small canvases through an internal audit API with explicit expected size/mode overrides, while the CLI keeps the production 1672x941/1254x1254 contracts fixed.
- Failure tests must inspect stable rule identifiers in structured findings rather than brittle prose; one valid control fixture will prove category policy does not broadly waive hard PNG/pixel gates.
- Layout paths occur as recursive `path` string fields under `scene` and `assetAnchors.{furniture,artifacts,orbs,avatars.byActor}`; the collector must reject duplicate values and compare the resulting set against the complete on-disk `images/**/*.png` set.
- Registry-driven category is encoded by the first segment after `images/`; this gives fixed production counts `scene=1`, `furniture=4`, `artifact=3`, `orb=3`, and `avatars=70` without maintaining a second path manifest.
- Existing audit evidence confirms the hard production baseline: 81/81 decode, 80 RGBA sprites at 1254x1254, one 1672x941 RGB scene, zero exact `#00ff00`, zero visible edge contact, and zero exact SHA duplicates.
- Semantic green is never a waiver: `feature-green`, `artifact-hub-transparent`, `desk-front`, and `desk-standard-transparent` still must fail if any *exact visible* `#00ff00` exists.
- The prior audit's 38 warnings came from multi-component/green-dominant heuristics, not hard defects; these are intentionally excluded from this persistent gate because they misclassify legitimate highlights, separated pixel detail, and semantic green.
- Category policy will be emitted per asset using explicit policy names and allowlists. A partial-alpha metric may support reporting, but no category policy may silently waive chroma, edge, Alpha, halo, duplicate, or size failures.
- Compressed-size hard budgets selected with explicit production headroom: Avatar 512 KiB, Artifact 512 KiB, Furniture 512 KiB, Orb 768 KiB, Scene 3 MiB. Current maxima are respectively 345,010; 365,373; 421,865; 646,695; and 2,350,613 bytes.
- Shadow/glow policy proxy is the fraction of visible pixels with `0 < alpha < 255`: `shadow_glow_forbidden <= 0.03`, `contact_shadow_allowed <= 0.10`, and `glow_allowed <= 0.20`. Current maxima are 0.021155 for the 42 compositing avatars, 0.004762 for the 28 legacy contact-shadow avatars, and 0.151570 for Orbs.
- Explicit policy routing: Orb category is `glow_allowed`; Furniture and Avatar basenames `idle.png`, `at-desk.png`, `walk.png`, `carry.png` are `contact_shadow_allowed`; Artifact and all other Avatar basenames are `shadow_glow_forbidden`; Scene is `opaque_scene` and has no Alpha proxy threshold.

## TDD evidence

### RED

Command:

```text
python -m pytest tests/test_audit_image_assets.py -q
```

Result: exit 1 during collection because `tools.audit_image_assets` did not yet exist. This was the expected missing-module failure after the complete synthetic contract suite had been written.

### Focused GREEN

The minimal read-only implementation was then added at `tools/audit_image_assets.py`.

```text
python -m pytest tests/test_audit_image_assets.py -q
15 passed in 0.44s
```

The suite covers a valid control; empty Alpha; visible edge/corner contact; exact visible `#00ff00` in both RGBA objects and the RGB Scene; wrong dimensions/mode; 2px protected halo versus far hidden RGB; compressed budget; all three RGBA policy tiers; hard-rule non-waiver under `glow_allowed`; duplicate SHA; duplicate/noncanonical registry paths; unregistered disk PNG; and CLI failure-report persistence. The RGB Scene case was added through a separate review-time RED→GREEN cycle after a manual coverage audit found the original RGBA-only implementation gap.

### Cross-tool GREEN

```text
python -m pytest tests/test_audit_image_assets.py tests/test_transparent_rgb_sanitizer.py -q
50 passed in 7.81s
```

## Real 81-file gate

Command:

```text
python tools/audit_image_assets.py --root . --layout docs/office-layout.json --json .planning/2026-07-15-images-full-audit/task-4-asset-audit.json
```

Result: exit 0, `status=pass`.

- Registered/on-disk/audited/passed: 81/81/81/81
- Error findings: 0
- Exact SHA duplicate groups: 0
- Category counts: 70 Avatar, 4 Furniture, 3 Artifact, 3 Orb, 1 Scene
- Policy routing: 45 `shadow_glow_forbidden`, 32 `contact_shadow_allowed`, 3 `glow_allowed`, 1 `opaque_scene`
- Maximum observed partial-alpha fractions: 0.021155 forbidden, 0.004762 contact-shadow, 0.151570 glow
- Total compressed bytes: 24,223,891
- Report: `.planning/2026-07-15-images-full-audit/task-4-asset-audit.json`

## Changed-file boundary

- Created `tests/test_audit_image_assets.py`.
- Created `tools/audit_image_assets.py`.
- Updated this report and generated the read-only JSON evidence above.
- No file under `images/` was modified. No ImageGen, Git stage/commit/reset/stash/clean operation occurred.
