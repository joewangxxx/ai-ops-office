# Task 3 Tool Report — Transactional Transparent-RGB Sanitizer

## Status

**PASS for Task 3 Steps 1–5.** The sanitizer and its tests were created, strict TDD RED/GREEN was recorded, hardened dry-runs matched the exact expected metrics, and the independently authorized Step 5 apply completed once with all 35 targets committed and independently verified. The canonical apply run retains all 35 pre-image backups and transaction evidence.

## Scope and fixed target set

- Repository root: `C:\Users\29929\Desktop\AI-Wrokspace`
- Selection rule: all 34 `hidden_rgb_in_alpha0` rows in `reference-matrix.csv`, plus `images/avatars/Kara/walk-down.png`
- Expected hashes: `implementation-baseline.csv`
- Fixed manifest count: 35
- Pre-run source hash mismatches: 0
- Manifest validation: 35 entries, 35 unique paths, 0 unexpected paths, 0 missing paths, 0 baseline-hash mismatches

The worktree was already dirty. No reset, stash, clean, stage, commit, or branch operation was performed.

## TDD evidence

### RED

Command:

```text
python -m pytest tests/test_transparent_rgb_sanitizer.py -q
```

Observed result before implementation:

```text
ERROR tests/test_transparent_rgb_sanitizer.py
ImportError: cannot import name 'sanitize_transparent_rgb' from 'tools'
1 error in 0.30s
```

This was the expected failure: the test suite existed and the sanitizer module did not.

### First implementation run

The first implementation run produced `20 passed, 3 failed, 1 skipped`. All three failures had the same Windows-specific root cause: `os.fsync()` was called on a read-only candidate file descriptor and returned `[Errno 9] Bad file descriptor`. The minimal fix changed that verification handle from `rb` to `r+b`.

The symlink test was then made deterministic on Windows by falling back to a directory junction when ordinary symlink creation is unavailable.

### Final GREEN

Fresh final command:

```text
$env:PYTHONDONTWRITEBYTECODE='1'
python -m pytest tests/test_transparent_rgb_sanitizer.py -q -p no:cacheprovider
```

Result:

```text
........................                                                 [100%]
24 passed in 4.50s
```

The tests cover the requested alpha values, Chebyshev offsets, multiple islands, edge clipping, transparent-only, opaque-only, already-zero, idempotence, core input validation, live mode/size rejection, path escape, symlink/junction rejection, hash mismatch, strict PNG chunks, candidate re-decode failure, dry-run immutability, verified synthetic apply, and rollback after injected replacement failure.

## Implementation summary

Created `tools/sanitize_transparent_rgb.py` with:

- `sanitize_rgba(image, radius=2)` using `visible = alpha > 0`
- Pillow `ImageFilter.MaxFilter(5)` for the required Chebyshev radius of 2
- clearing only `(~visible) & (~within_2px)`
- exact alpha, visible RGBA, bbox, and decoded-candidate invariant checks
- strict canonical/case-sensitive `images/.../*.png` paths and symlink/junction rejection
- expected source SHA-256 enforcement before candidate work, before backup, and immediately before replacement
- strict PNG signature, chunk, CRC, IHDR, mode, size, and decode checks
- generation and re-decode verification of every candidate before any source replacement
- apply-only verified byte backups, same-directory/same-volume atomic source replacement, per-file journaling, and reverse rollback of committed targets
- required `--dry-run` / `--apply`, `--root`, `--manifest`, and `--run-dir` CLI interface

The apply path was exercised only against pytest temporary files. It was not used against repository images.

## Live dry-run

Run directory:

```text
.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T021944950Z-dry-run-b25ec340
```

Command:

```text
python tools/sanitize_transparent_rgb.py --dry-run \
  --root . \
  --manifest .planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T021944950Z-dry-run-b25ec340/manifest.json \
  --run-dir .planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T021944950Z-dry-run-b25ec340
```

CLI result:

```json
{"pixels_cleared_total": 43261599, "source_hashes_unchanged": true, "status": "dry_run_complete", "target_count": 35}
```

### Exact metrics

| Metric | Result |
|---|---:|
| Targets | 35 |
| `hidden_rgb_in_alpha0` group | 34 |
| 34-file group pixels cleared | 43,261,598 |
| Kara `walk-down.png` pixels cleared | 1 |
| Total pixels cleared | 43,261,599 |
| Source bytes total | 33,781,582 |
| Candidate bytes total | 10,502,131 |
| Byte reduction represented by candidates | 23,279,451 |
| Source hash mismatches after dry-run | 0 |
| Candidate files | 35 |
| Candidate hash/size mismatches | 0 |
| Candidate journal states verified | 35 |
| Far transparent nonzero RGB after | 0 |
| Temporary files left in run directory | 0 |
| Backup directory created | No |

### Emitted evidence

- `manifest.json`: exact 35-path/hash input manifest
- `candidate/images/...`: 35 verified candidate PNGs
- `transaction.json`: `dry_run_complete`, all 35 targets `candidate_verified`
- `report.json`: per-target source/candidate hashes, sizes, invariant hashes, bbox, and sanitize metrics

An independent post-run PowerShell verification rehashed all 35 sources against the baseline and all 35 candidates against `report.json`. It returned `verification_error_count=0`.

## Source immutability and dirty-tree note

All 35 fixed target sources matched their baseline hashes before the dry-run and still matched afterward. The dry-run did not create `backup/` and never entered the replacement phase.

`git status` continues to show five PNG modifications that were present before this task (`Jack/carry-up`, three seated assets, and `Rita/seated-working-back`). None is in the fixed 35-target manifest, and this task did not modify them.

## Files created

- `tools/sanitize_transparent_rgb.py`
- `tests/test_transparent_rgb_sanitizer.py`
- `.planning/2026-07-15-images-full-audit/task-3-tool-report.md`
- `.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T021944950Z-dry-run-b25ec340/manifest.json`
- `.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T021944950Z-dry-run-b25ec340/transaction.json`
- `.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T021944950Z-dry-run-b25ec340/report.json`
- 35 candidate PNGs below that run directory

## Remaining concern / next gate

The live `--apply` transaction remains deliberately unexecuted. Before Task 3 Step 5, use a new unique run directory and rerun the hash preflight; do not reuse this dry-run directory. The strict source PNG allowlist (`IHDR`/`IDAT`/`IEND`) is compatible with all fixed targets and intentionally fails closed for ancillary or APNG chunks.

No commits were created.

---

## Post-review safety hardening

The initial Step 1–4 implementation was held before live apply after focused review identified three transaction-safety gaps. All three were fixed without running live `--apply` or modifying any repository PNG.

### 1. Immutable production scope

- The production `execute_transaction()` API and CLI now require exactly the audited 35 `(path, pre-SHA-256)` pairs.
- The immutable constraint is a hard-coded count plus SHA-256 fingerprint of the sorted canonical pairs; `_load_manifest()` validates it before run-directory creation or candidate work.
- The generic engine is private and still requires an explicit exact scope object for synthetic tests.
- Regression tests prove arbitrary one- and two-target production CLI manifests exit 1 and leave sources unchanged.
- A repository evidence test binds the fixed fingerprint to the audited manifest.

### 2. Candidate TOCTOU closure

- Candidate SHA-256 is captured before decoded-invariant verification and checked again immediately afterward; any change during verification fails.
- After all verified backups are ready, every candidate is read once into a byte snapshot and that exact snapshot must match the previously trusted candidate SHA-256 before any source mutation begins.
- Source-sibling temporary files are written only from those verified snapshots and rehashed before atomic replacement.
- Regressions cover tampering after preparation and replacement immediately after decode verification; both abort with the source byte-identical.

### 3. Durable journal, interrupt rollback, and crash recovery

- Each target journal entry is durably written as `committing` before source replacement and as `committed` only after durable replacement plus post-replacement hash verification.
- JSON journals and file placement use Windows `MoveFileExW(MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)` or POSIX `os.replace()` plus parent-directory `fsync`.
- The apply handler catches `BaseException`; a tested `KeyboardInterrupt` during the second replacement rolls back the first committed target from its verified backup and re-raises the interrupt.
- New explicit `--recover` mode accepts only an interrupted apply journal in an existing run directory. It validates the immutable manifest, exact journal paths/hashes/states, current source hash, candidate hash, and every backup before the first recovery mutation. Only verified backup snapshots can be restored.
- Recovery tests cover journals left at both `committing` and `committed`, plus rejection of a tampered backup without altering the source.

## Post-review TDD evidence

Focused RED after adding the three review regressions:

```text
12 passed, 20 failed in 2.70s
```

The failures directly showed the missing scoped engine, verified-snapshot replacement, recovery interface, and the production CLI accepting arbitrary one- and two-target manifests with exit 0.

First hardened GREEN:

```text
32 passed in 6.71s
```

The first hardened live preflight then failed closed before candidate creation because the independently transcribed fixed-scope fingerprint did not match Python's canonical serialization. A focused acceptance regression was added and observed RED before correcting the constant:

```text
1 failed: audited fingerprint 9599721a... != configured 63095c7e...
```

Focused review then identified a narrower candidate decode-to-hash race. A regression replaced the candidate with a different valid PNG immediately after decode verification and was observed failing (`DID NOT RAISE`) before the pre/post verification hash binding was added.

Fresh final GREEN:

```text
..................................                                       [100%]
34 passed in 8.41s
```

The final focused safety re-review returned **APPROVED** with no remaining Critical or Important finding.

## Final hardened live dry-run

Canonical final run directory:

```text
.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T030515445Z-final-hardened-dry-run-3540f84b
```

Final CLI result:

```json
{"pixels_cleared_total": 43261599, "source_hashes_unchanged": true, "status": "dry_run_complete", "target_count": 35}
```

Independent post-run verification:

| Metric | Final result |
|---|---:|
| Targets | 35 |
| 34-file group pixels cleared | 43,261,598 |
| Kara `walk-down.png` pixels cleared | 1 |
| Total pixels cleared | 43,261,599 |
| Source bytes total | 33,781,582 |
| Candidate bytes total | 10,502,131 |
| Source hash mismatches | 0 |
| Candidate files | 35 |
| Candidate hash mismatches | 0 |
| `candidate_verified` journal entries | 35 |
| Backup directory created | No |
| Verification errors | 0 |

No live `--apply` or `--recover` command was run. No source PNG was edited, and no staging or commit operation was performed.

---

## Task 3 Step 5: authorized transactional apply

After the immutable-snapshot correction, the independent safety reviewer returned **APPLY** with no Critical, Important, or Minor finding. Step 5 was then executed exactly once in a new unique run directory. No recovery invocation was needed.

### Fresh pre-apply gates

Sanitizer suite immediately before apply:

```text
...................................                                      [100%]
35 passed in 6.46s
```

The immutable manifest was independently rehashed against all current source files immediately before apply:

```json
{"target_count":35,"source_hash_mismatch_count":0,"mismatches":[]}
```

### Single production apply invocation

Command:

```text
python tools/sanitize_transparent_rgb.py --apply \
  --root C:\Users\29929\Desktop\AI-Wrokspace \
  --manifest C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\scheme-a-runs\20260716T021944950Z-dry-run-b25ec340\manifest.json \
  --run-dir C:\Users\29929\Desktop\AI-Wrokspace\.planning\2026-07-15-images-full-audit\scheme-a-runs\20260716T032947567Z-immutable-snapshot-apply-04230893
```

CLI output and exit status:

```text
{"pixels_cleared_total": 43261599, "report": "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\scheme-a-runs\\20260716T032947567Z-immutable-snapshot-apply-04230893\\report.json", "source_hashes_unchanged": false, "status": "applied", "target_count": 35}
APPLY_EXIT_CODE=0
```

Canonical apply run directory:

```text
.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T032947567Z-immutable-snapshot-apply-04230893
```

### Independent post-apply verification

The postcheck did not import the sanitizer. It independently parsed the run manifest/report/journal, rehashed backup/candidate/live files, decoded backup and candidate PNGs with Pillow, and recomputed the two-pixel Chebyshev masks with NumPy.

| Check | Result |
|---|---:|
| Transaction status | `applied` |
| Transaction targets | 35 |
| Journal entries in `committed` state | 35 |
| Verified backups | 35 |
| Backup pre-hash mismatches | 0 |
| Candidate files | 35 |
| Candidate hash mismatches | 0 |
| Committed source/candidate hash mismatches | 0 |
| Mode or dimension mismatches | 0 |
| Full alpha-plane mismatches | 0 |
| Alpha-bbox mismatches | 0 |
| `alpha > 0` RGBA mismatches | 0 |
| Protected `<=2px` transparent-RGB mismatch pixels | 0 |
| Far `alpha=0` nonzero-RGB pixels after apply | 0 |
| 34-file group pixels cleared | 43,261,598 |
| Kara `walk-down.png` pixels cleared | 1 |
| Total pixels cleared | 43,261,599 |
| Backup bytes total | 33,781,582 |
| Candidate bytes total | 10,502,131 |
| Committed source bytes total | 10,502,131 |
| Non-target baseline files | 46 |
| Non-target SHA-256 mismatches | 0 |
| Accepted pre-existing uncommitted sprites checked | 5 |
| Accepted sprite SHA-256 mismatches | 0 |
| Run-directory temporary files | 0 |
| Source-tree sanitizer temporary files | 0 |

Fresh post-apply sanitizer suite:

```text
...................................                                      [100%]
35 passed in 9.22s
```

The five specifically preserved non-target sprites were `Jack/carry-up.png`, `Jack/seated-idle-back.png`, `Jack/seated-working-back.png`, `Kara/seated-working-back.png`, and `Rita/seated-working-back.png`. All still match `implementation-baseline.csv`.

The verified backups and all apply evidence remain in the canonical run directory. The apply was not repeated. No `--recover`, ImageGen, staging, commit, reset, or stash operation was run.

---

## Immutable source/candidate snapshot binding

A second independent review found that the earlier path hash/decode/hash sequence still admitted an ABA pathname swap. The blocker was fixed without live apply:

- Each source is read once into immutable bytes during preparation. The manifest SHA-256 is checked against those bytes, and PNG structure checks, Pillow verification/decoding, sanitization, and invariant derivation all consume that exact snapshot.
- Each emitted candidate is read once into immutable bytes. Its SHA-256 and decoded-pixel/invariant/idempotence verification all consume that exact snapshot.
- The verified candidate bytes are retained on the prepared transaction object. Apply writes only that retained snapshot; it never rereads or trusts the candidate pathname.
- Later live-source hashes remain mutation guards only. They are not used as a substitute for the snapshot that was manifest-hashed and decoded.

### ABA TDD evidence

Focused RED before the snapshot-binding implementation:

```text
FFF                                                                      [100%]
3 failed, 32 deselected in 1.90s
```

The failures demonstrated all three old behaviors: a post-verification candidate-path tamper aborted because apply reread the path, a candidate ABA swap was accepted, and a source ABA swap was accepted.

Focused GREEN after the implementation:

```text
...                                                                      [100%]
3 passed, 32 deselected in 0.96s
```

The regressions now prove that source and candidate path-decode swap hooks are not called, the bound candidate pathname is read exactly once, failed ABA preparation leaves the source byte-identical, and a pathname tamper after verification cannot alter the retained bytes committed by the synthetic apply test.

Fresh full sanitizer suite:

```text
...................................                                      [100%]
35 passed in 7.07s
```

Final confirmation after writing this evidence report:

```text
...................................                                      [100%]
35 passed in 6.57s
```

### Fresh immutable-snapshot dry-run

Run directory:

```text
.planning/2026-07-15-images-full-audit/scheme-a-runs/20260716T032556088Z-immutable-snapshot-dry-run-bc87f0b8
```

CLI result:

```json
{"pixels_cleared_total": 43261599, "source_hashes_unchanged": true, "status": "dry_run_complete", "target_count": 35}
```

Independent pre/post and artifact verification:

| Metric | Result |
|---|---:|
| Manifest targets | 35 |
| 34-file group pixels cleared | 43,261,598 |
| Kara `walk-down.png` pixels cleared | 1 |
| Total pixels cleared | 43,261,599 |
| Source hash mismatches before dry-run | 0 |
| Source hash mismatches after dry-run | 0 |
| Source bytes total | 33,781,582 |
| Candidate bytes total | 10,502,131 |
| Candidate files | 35 |
| Candidate hash mismatches | 0 |
| Candidate size mismatches | 0 |
| `candidate_verified` journal entries | 35 |
| Backup directory created | No |
| Temporary files left in run directory | 0 |

At the time of this immutable-snapshot dry-run, no live `--apply` or `--recover` command had been run. The later authorized single apply and its postchecks are recorded in **Task 3 Step 5: authorized transactional apply** above. No staging or commit operation was performed.
