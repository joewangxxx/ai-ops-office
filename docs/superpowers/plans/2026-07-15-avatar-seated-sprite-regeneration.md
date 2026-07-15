# Avatar Seated Sprite Regeneration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace exactly 10 failed seated avatar PNGs for Bob, Jack, Kara, Leo, and Rita with strict rear-facing Idle/Working pairs that pass technical, pixel-style, pairing, and workstation-composite QA.

**Architecture:** Generate each character's Idle first with built-in imagegen and a flat green key, key it locally, and promote it only after raw/composite review. Generate Working from that accepted Idle as the primary edit reference, changing only arms/hands. Final promotion is transactional per character, followed by a full validator run, contact-sheet review, and hash proof that all out-of-scope assets stayed unchanged.

**Tech Stack:** Built-in `image_gen`; Python 3 + Pillow; installed `remove_chroma_key.py`; existing `tmp/imagegen/validation/avatar_asset_validator.py`; PowerShell SHA-256/file operations.

## Global Constraints

- Replace only `images/avatars/{Bob,Jack,Kara,Leo,Rita}/seated-{idle,working}-back.png`.
- Do not modify frontend code, coordinates, office-layout data, Alice/Quinn assets, movement assets, or the 28 legacy `idle.png` / `at-desk.png` / `walk.png` / `carry.png` references.
- Use one built-in imagegen call per candidate; do not use CLI fallback or batch `n` variants.
- Generate on a perfectly flat solid `#00ff00` background and remove it with the installed helper.
- Character yaw is exactly 0° toward canvas top/12 o'clock; camera elevation must not rotate the body into rear three-quarter view.
- Idle and Working share head, hair, torso, pelvis, legs, scale, and anchor; Working changes only forearms/hands.
- Every candidate must pass raw visual review and 150px workstation composite review; automatic technical pass alone is insufficient.
- A failed candidate remains in `tmp/imagegen/seated-regeneration/` and never overwrites a final.

---

### Task 1: Protect Existing Assets and Freeze Inputs

**Files:**
- Create: `.planning/2026-07-15-avatar-seated-regeneration/baseline-sha256.csv`
- Create: `tmp/imagegen/seated-regeneration/before/<Character>/*.png`
- Use: `.planning/2026-07-15-avatar-seated-regeneration/prompt-set.md`

**Interfaces:**
- Consumes: current 42 target assets, 28 legacy references, approved design spec.
- Produces: immutable baseline hashes, before backups, fixed prompt/reference whitelist.

- [x] **Step 1: Create candidate and before directories**

Run from `C:\Users\29929\Desktop\AI-Wrokspace`:

```powershell
$chars = 'Bob','Jack','Kara','Leo','Rita'
foreach ($c in $chars) {
  New-Item -ItemType Directory -Force -Path "tmp/imagegen/seated-regeneration/before/$c" | Out-Null
  New-Item -ItemType Directory -Force -Path "tmp/imagegen/seated-regeneration/$c/seated-idle-back" | Out-Null
  New-Item -ItemType Directory -Force -Path "tmp/imagegen/seated-regeneration/$c/seated-working-back" | Out-Null
}
```

Expected: 15 task directories exist under `tmp/imagegen/seated-regeneration/`.

- [x] **Step 2: Copy the ten rejected finals into the before tree**

```powershell
$chars = 'Bob','Jack','Kara','Leo','Rita'
foreach ($c in $chars) {
  Copy-Item -LiteralPath "images/avatars/$c/seated-idle-back.png" -Destination "tmp/imagegen/seated-regeneration/before/$c/seated-idle-back.png" -Force
  Copy-Item -LiteralPath "images/avatars/$c/seated-working-back.png" -Destination "tmp/imagegen/seated-regeneration/before/$c/seated-working-back.png" -Force
}
```

Expected: 10 backup PNGs with hashes matching their current finals.

- [x] **Step 3: Write the out-of-scope SHA-256 baseline**

Hash exactly the 32 accepted target assets plus the 28 legacy references and write sorted rows to `.planning/2026-07-15-avatar-seated-regeneration/baseline-sha256.csv`.

Expected: 60 unique relative paths, each with a SHA-256 value.

- [x] **Step 4: Verify the prompt whitelist exists and contains all five identity locks**

Run:

```powershell
rg -n "Bob|Jack|Kara|Leo|Rita|yaw=0|12 o'clock|#00ff00" '.planning/2026-07-15-avatar-seated-regeneration/prompt-set.md'
```

Expected: common geometry/background constraints and all five character sections are present.

---

### Task 2: Generate and Accept Five Idle Candidates

**Files:**
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-idle-back/attempt-N-source.png`
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-idle-back/attempt-N-alpha.png`
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-idle-back/attempt-N-analysis.json`
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-idle-back/accepted-alpha.png`

**Interfaces:**
- Consumes: prompt-set Idle template, per-character identity references, Alice/Quinn Idle pose references.
- Produces: one accepted strict-rear Idle RGBA candidate per character.

- [x] **Step 1: Generate Bob Idle with built-in imagegen**

Use the Bob Idle prompt and exact reference list from `prompt-set.md`. Copy the newly generated built-in output to `attempt-1-source.png`.

- [x] **Step 2: Key and technically inspect Bob Idle**

Run the installed helper with `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`, then call `analyze_image()` from the existing validator and save JSON.

Expected: PNG/RGBA/1254×1254, zero-alpha corners, one connected component, clear edges, no green/chroma pixels.

- [x] **Step 3: Review Bob raw pose and 150px workstation composite**

Expected: exact rear view, centered shoulders/pelvis/legs, no visible face, hands low, no furniture, scale close to the accepted office-map range. If it fails, issue a single-change retry and repeat Steps 1–3.

- [x] **Step 4: Generate, key, analyze, and visually review Jack Idle**

Use the exact Jack Idle prompt and five Jack Idle references from `prompt-set.md`; save `attempt-N-source.png`, run the standard chroma helper into `attempt-N-alpha.png`, save `analyze_image()` output, and inspect raw plus 150px composite. Expected identity: high angular spiky black hair, cobalt shirt, no glasses, no back badge. Retry only the single failing attribute.

- [x] **Step 5: Generate, key, analyze, and visually review Kara Idle**

Use the exact Kara Idle prompt and five Kara Idle references from `prompt-set.md`; save source/alpha/analysis and inspect raw plus composite. Expected identity: violet chin-length bob, purple shirt, petite build, no back/sleeve badge. Retry only the single failing attribute.

- [x] **Step 6: Generate, key, analyze, and visually review Leo Idle**

Use the exact Leo Idle prompt and five Leo Idle references from `prompt-set.md`; save source/alpha/analysis and inspect raw plus composite. Expected identity: asymmetric side-swept black hair, dark desaturated navy, slim build, no visible lenses/face/back badge. Retry only the single failing attribute.

- [x] **Step 7: Generate, key, analyze, and visually review Rita Idle**

Use the exact Rita Idle prompt and five Rita Idle references from `prompt-set.md`; save source/alpha/analysis and inspect raw plus composite. Expected identity: loose shoulder-length chestnut hair, white blouse, slim build, no ponytail/bun/tie. Retry only the single failing attribute.

- [x] **Step 8: Freeze each accepted Idle**

Copy only visually and technically accepted alpha candidates to each character's `accepted-alpha.png`.

Expected: five accepted Idle files; no final path has changed yet.

---

### Task 3: Derive and Accept Five Working Candidates

**Files:**
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-working-back/attempt-N-source.png`
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-working-back/attempt-N-alpha.png`
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-working-back/attempt-N-analysis.json`
- Create: `tmp/imagegen/seated-regeneration/<Character>/seated-working-back/accepted-alpha.png`
- Create: `tmp/imagegen/seated-regeneration/<Character>/pair-analysis.json`

**Interfaces:**
- Consumes: the same character's accepted Idle plus Alice/Quinn Working references.
- Produces: one accepted Working RGBA candidate per character and measurable pair evidence.

- [x] **Step 1: Load each accepted Idle for edit context**

Inspect the five `accepted-alpha.png` files with `view_image` before invoking built-in imagegen edit mode.

- [x] **Step 2: Generate Bob Working from Bob accepted Idle**

Use the Bob Working prompt and reference list from `prompt-set.md`; Image 1 is the accepted Bob Idle edit target. Change only both forearms/hands so they extend symmetrically toward 12 o'clock.

- [x] **Step 3: Key, inspect, and compare Bob pair**

Use the standard chroma helper and `analyze_image()`. Use `compare_seated_pair()` for center drift, bbox drift, and upper-silhouette IoU.

Expected: center-X drift ≤10 source pixels, top/bottom drift ≤15, upper IoU ≥0.90, lower body visually unchanged, hands equally spaced and aligned upward.

- [x] **Step 4: Generate, key, analyze, and pair-check Jack Working**

Use Jack accepted Idle as Image 1 plus the four exact supporting references from `prompt-set.md`. Expected: only arms/hands change; spiky hair, cobalt torso, lower body, scale, and anchor remain stable.

- [ ] **Step 5: Generate, key, analyze, and pair-check Kara Working**

Use Kara accepted Idle as Image 1 plus the four exact supporting references from `prompt-set.md`. Expected: only arms/hands change; violet bob, purple torso, petite lower body, no back badge, scale, and anchor remain stable.

- [x] **Step 6: Generate, key, analyze, and pair-check Leo Working**

Use Leo accepted Idle as Image 1 plus the four exact supporting references from `prompt-set.md`. Expected: only arms/hands change; side-swept hair, slim dark-navy torso, lower body, no face/lenses/back badge, scale, and anchor remain stable.

- [ ] **Step 7: Generate, key, analyze, and pair-check Rita Working**

Use Rita accepted Idle as Image 1 plus the four exact supporting references from `prompt-set.md`. Expected: only arms/hands change; loose shoulder-length hair, white blouse, slim lower body, no ponytail/bun, scale, and anchor remain stable.

- [ ] **Step 8: Review every Working candidate in the workstation composite**

Expected: both hands point toward/enter the keyboard area; no hand or knee points toward 3 o'clock; same anchor as Idle.

- [ ] **Step 9: Freeze each accepted Working**

Copy only accepted alpha candidates to `accepted-alpha.png` in the Working directory.

Expected: five accepted Working files; no final path has changed yet.

---

### Task 4: Promote Pairs and Rebuild Validation Evidence

**Files:**
- Modify: exactly the ten final seated PNGs in `images/avatars/{Bob,Jack,Kara,Leo,Rita}/`
- Create: `.planning/2026-07-15-avatar-seated-regeneration/validation-after.json`
- Create: `.planning/2026-07-15-avatar-seated-regeneration/seated-after-contact-sheet.png`
- Create: `.planning/2026-07-15-avatar-seated-regeneration/movement-after-contact-sheet.png`

**Interfaces:**
- Consumes: ten accepted alpha candidates.
- Produces: final project assets and complete technical/contact-sheet evidence.

- [ ] **Step 1: Reconfirm all ten accepted candidates exist and pass candidate analysis**

Expected: ten `accepted-alpha.png` files; every analysis status is `pass`; all five pair analyses meet thresholds.

- [ ] **Step 2: Replace the ten final paths transactionally per character**

For each character, copy Idle and Working together only after both have passed.

Expected: exactly ten final paths have new hashes.

- [ ] **Step 3: Run validator tests**

Run:

```powershell
python -m unittest discover -s 'tmp/imagegen/validation' -p 'test_*.py' -v
```

Expected: 12/12 tests pass.

- [ ] **Step 4: Run full validator and rebuild contact sheets**

Run:

```powershell
python 'tmp/imagegen/validation/avatar_asset_validator.py' all --root . --json '.planning/2026-07-15-avatar-seated-regeneration/validation-after.json' --seated-out '.planning/2026-07-15-avatar-seated-regeneration/seated-after-contact-sheet.png' --movement-out '.planning/2026-07-15-avatar-seated-regeneration/movement-after-contact-sheet.png' --require-complete
```

Expected: 42 expected/present, 42 automated technical pass, 0 missing/failures.

- [ ] **Step 5: Compare the 60 out-of-scope hashes to baseline**

Expected: all 60 paths remain byte-identical.

---

### Task 5: Independent Visual Acceptance and Delivery

**Files:**
- Create: `.planning/2026-07-15-avatar-seated-regeneration/acceptance-report.md`
- Update: `.planning/2026-07-15-avatar-seated-regeneration/findings.md`
- Update: `.planning/2026-07-15-avatar-seated-regeneration/progress.md`

**Interfaces:**
- Consumes: final ten PNGs, after contact sheets, validation JSON, before evidence.
- Produces: auditable final 42/42 acceptance or an exact residual failure list.

- [ ] **Step 1: Inspect the full seated after contact sheet at original resolution**

Expected: Alice, Quinn, Bob, Jack, Kara, Leo, and Rita all appear strictly rear-facing and centered; every Working pair reaches upward.

- [ ] **Step 2: Run an independent reviewer over raw and scene evidence**

Expected: separate per-character PASS/FAIL for identity, strict rear pose, Idle action, Working action, pair consistency, pixel style, and workstation fit.

- [ ] **Step 3: Inspect the movement after sheet**

Expected: the 28 movement cells are unchanged and still pass identity/direction/carry semantics.

- [ ] **Step 4: Write the final acceptance report**

Include final filenames, candidate attempts, prompt-set path, built-in imagegen mode, technical counts, per-character visual results, hash result, and links to before/after evidence.

- [ ] **Step 5: Declare completion only if every hard gate passes**

Expected: 42/42 frontend-ready. If any candidate fails a hard gate, leave it out of final promotion or restore its before copy and report the exact unresolved asset.
