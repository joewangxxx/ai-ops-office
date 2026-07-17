### Task 3: Build and execute the transactional transparent-RGB sanitizer

**Files:**
- Create: `tools/sanitize_transparent_rgb.py`
- Create: `tests/test_transparent_rgb_sanitizer.py`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/manifest.json`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/backup/images/...`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/candidate/images/...`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/transaction.json`
- Create at runtime: `.planning/2026-07-15-images-full-audit/scheme-a-runs/<run-id>/report.json`
- Modify: the fixed 35 target PNGs only after all candidates pass.

**Interfaces:**
- Produces `sanitize_rgba(image: Image.Image, radius: int = 2) -> tuple[Image.Image, SanitizeMetrics]`.
- CLI modes: `--dry-run` and `--apply`; both require `--root`, `--manifest`, and `--run-dir`.
- Manifest contains exact relative path and expected pre-sanitize SHA-256 for all 35 targets.

- [ ] **Step 1: Write synthetic failing tests**

Cover alpha values 1/127/254/255, offsets 1/2/(2,2) preserved, offset 3 cleared, multiple islands, edge clipping, transparent-only, opaque-only, already-zero, idempotence, rejected non-RGBA/non-1254 live inputs, path escape/symlink rejection, hash mismatch, candidate re-decode, dry-run immutability, and rollback after injected replacement failure.

- [ ] **Step 2: Run and verify RED**

Run: `python -m pytest tests/test_transparent_rgb_sanitizer.py -q` from repository root.

Expected: FAIL because the sanitizer module and CLI do not exist.

- [ ] **Step 3: Implement the minimal deterministic sanitizer**

Use `visible = alpha > 0`, a Pillow `ImageFilter.MaxFilter(5)` mask for Chebyshev radius 2, and clear only `(~visible) & (~within_2px)`. Fail closed on path, hash, mode, size, PNG chunks, and candidate invariants. Generate and verify every candidate before replacing any source. Use verified byte backups, same-volume atomic replacement, a per-file journal, and rollback only committed targets on any error.

- [ ] **Step 4: Verify unit GREEN and live dry run**

Run pytest, then a live `--dry-run`. Expected live metrics: 35 targets; 34-file group clears 43,261,598 RGB pixels; Kara clears exactly 1; no source hash changes.

- [ ] **Step 5: Apply the transaction and re-verify**

Run `--apply` into a unique run directory. Expected: all 35 decoded images preserve every `alpha>0` RGBA value, full Alpha plane, mode, dimensions, bbox and visible-pixel hash; all far transparent RGB is zero; protected halo RGB is unchanged. Expected total bytes are approximately 10,502,131 versus 33,781,582 before, with decoded invariants governing over compressed byte exactness.

---
