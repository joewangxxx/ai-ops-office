# Avatar Horizontal Asset Generation Report

Finalized: `2026-07-17T13:35:56+08:00`  
Specification: [`avatar-horizontal-generation-goal-prompt.md`](avatar-horizontal-generation-goal-prompt.md)

## Result

The horizontal movement set is complete and accepted for project use: 28/28 official transparent PNGs, 28/28 automated technical passes, 28/28 manual identity/direction/action passes, 28/28 actual-180 and office-scene passes, and 0 changes to the frozen original 81-image baseline.

ImageGen produced 34 retained source outputs for 28 targets, plus 2 recorded no-output calls. Retries are reported separately; the claim is 28 independent accepted target outputs, not exactly 28 total calls.

## Source chroma disclosure

The built-in generator did not render byte-exact, perfectly uniform `#00ff00` source backgrounds: all 34 successful sources contain nonuniform near-green border colors. This is an upstream source-generation deviation and is not reported as a source-level pass. Every accepted candidate was processed with the prescribed chroma-key tool, and all 28 official RGBA files have transparent corners, zero visible green/chroma pixels, and zero nonzero RGB hidden under fully transparent pixels.

## Per-asset results

| Asset | Five-reference set | Attempts / calls | Technical | Manual visual | 180px / scene | Pair delta | Final path | SHA-256 |
|---|---|---:|---|---|---|---:|---|---|
| Alice/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 4.0% | `images/avatars/Alice/walk-left.png` | `a8106291f8af62e58c27dc4704de818a2dabe496b919885aa46d624cad0fa632` |
| Alice/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, walk, props/badge | pass / pass | 4.0% | `images/avatars/Alice/walk-right.png` | `b743f6d3585e3732be896b38d3984e3528497af6ee9af290eee2c4d90c9d3d15` |
| Alice/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, carry, props/badge | pass / pass | 1.6% | `images/avatars/Alice/carry-left.png` | `daafb2cc71c9fa8457a8462ee79373f955c31c3547682dc7a0f4762c0fbce53e` |
| Alice/carry-right | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 2 / 2 | pass | pass — identity, right, carry, props/badge | pass / pass | 1.6% | `images/avatars/Alice/carry-right.png` | `6e9a343b9c1e8029556fbee59c945bdbe6709c43241b66fbc1cf2cd0228dbf33` |
| Bob/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 1.8% | `images/avatars/Bob/walk-left.png` | `dbaa08ca3e04fbb64ac7031cd48d4cb3929dcca54deebd3a9b11334a967fbe93` |
| Bob/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 2 / 2 | pass | pass — identity, right, walk, props/badge | pass / pass | 1.8% | `images/avatars/Bob/walk-right.png` | `395bc31f7e5a4a28f044fbf23a46aa189f8bd5051b895ad2b6a04e0927812bfa` |
| Bob/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, carry, props/badge | pass / pass | 7.1% | `images/avatars/Bob/carry-left.png` | `880f8344af8dc3709538c2b476b888c3f111fb5657a34d87c0c60b156497e773` |
| Bob/carry-right | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, carry, props/badge | pass / pass | 7.1% | `images/avatars/Bob/carry-right.png` | `4b57fd2d2e308597c392ec84837158cacce8e7dc4a98b36c627aa067f435d511` |
| Jack/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 0.6% | `images/avatars/Jack/walk-left.png` | `9c38d90ebe5ee041f53ecfc80635ad17abfee7a308a7455d6a7a77ba0938c796` |
| Jack/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, walk, props/badge | pass / pass | 0.6% | `images/avatars/Jack/walk-right.png` | `aa747615fb8bec119ac9c24c0d131d936f609c9b8ddd2a7b92b83d60c0921c16` |
| Jack/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, carry, props/badge | pass / pass | 2.7% | `images/avatars/Jack/carry-left.png` | `1626ccdae07b33c5755fe29d8cac31767506122923f5e156498a9c462e52073b` |
| Jack/carry-right | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, carry, props/badge | pass / pass | 2.7% | `images/avatars/Jack/carry-right.png` | `63a25701a7e515167e3ac040870b584b3424f066915f8718302f7a32accdff03` |
| Kara/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 4.4% | `images/avatars/Kara/walk-left.png` | `8838604f931005b09b8e70dd7c715767f646b43a352551dce89691fe4451c814` |
| Kara/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, walk, props/badge | pass / pass | 4.4% | `images/avatars/Kara/walk-right.png` | `77072c94cb464533f50dda5e817e8dc2c94c5b39743ad8e197e70c650677f4da` |
| Kara/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, attempt-3-alpha.png | 2 / 3 | pass | pass — identity, left, carry, props/badge | pass / pass | 6.7% | `images/avatars/Kara/carry-left.png` | `1c282e387dab55e6e4e40ebd2fe17d4b5a1a58610c2563b8401c486af70dad88` |
| Kara/carry-right | idle.png, carry.png, carry-up.png, carry-down.png, attempt-1-alpha.png | 3 / 3 | pass | pass — identity, right, carry, props/badge | pass / pass | 6.7% | `images/avatars/Kara/carry-right.png` | `8b54ac70ccce5e1b2b1cf848fa6f597f8ad934d26b3a96cc3e7afb7759854bd1` |
| Leo/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 0.7% | `images/avatars/Leo/walk-left.png` | `a65c3ae480cd3c94dd72f08196a513b480edac6db2bf375b518e0b5e4a2a5c98` |
| Leo/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, walk, props/badge | pass / pass | 0.7% | `images/avatars/Leo/walk-right.png` | `389d1e6801c27535c47422f459f3cad5a38eab63737f2ce26ea6cc3d9c29b32a` |
| Leo/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, carry, props/badge | pass / pass | 2.9% | `images/avatars/Leo/carry-left.png` | `cb770aa9c88e0ea2a57c485ed0b78bdadd91b2f012ad7be097cf2fc01e28c350` |
| Leo/carry-right | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, carry, props/badge | pass / pass | 2.9% | `images/avatars/Leo/carry-right.png` | `8f62d28bfbde3fa885e1c36b1065e32c99a5eec7ed4e757baeff0275566ea3de` |
| Quinn/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 2.1% | `images/avatars/Quinn/walk-left.png` | `421fcb2916d0755b13493e7ee9437f0735cb419cc79750ab18a2505cf9b6394e` |
| Quinn/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, walk, props/badge | pass / pass | 2.1% | `images/avatars/Quinn/walk-right.png` | `1cc82d768401f5d5e416674e83fa3a4ac6611bdec61ef370ca0ac3c01e943086` |
| Quinn/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, carry, props/badge | pass / pass | 8.2% | `images/avatars/Quinn/carry-left.png` | `6142aeff6d8bc41ac2b36ce3312e4c331b6f8ceccb9ed6d77dc4bf14f6297c7b` |
| Quinn/carry-right | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, carry, props/badge | pass / pass | 8.2% | `images/avatars/Quinn/carry-right.png` | `f95f458998be5b9b966e3760b8e2d8f41e798c7e4aa67097d967ebecf153c072` |
| Rita/walk-left | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, walk, props/badge | pass / pass | 1.2% | `images/avatars/Rita/walk-left.png` | `3dba889f0125573a3048636a8d3e0876946474158e1b650f3817beafd657989b` |
| Rita/walk-right | idle.png, walk.png, walk-up.png, walk-down.png, office-shell.png | 1 / 1 | pass | pass — identity, right, walk, props/badge | pass / pass | 1.2% | `images/avatars/Rita/walk-right.png` | `dc095aa2b99065d9d6767a96e3cf81df0ba67fbc4c3358c11ee30e37a4970d7b` |
| Rita/carry-left | idle.png, carry.png, carry-up.png, carry-down.png, office-shell.png | 1 / 1 | pass | pass — identity, left, carry, props/badge | pass / pass | 2.5% | `images/avatars/Rita/carry-left.png` | `a187354798519d0ed62f9396ddb3276fad6e8ecac861b27d30e7114f1ff56bf9` |
| Rita/carry-right | idle.png, carry.png, carry-down.png, attempt-1-alpha.png, attempt-2-alpha.png | 3 / 3 | pass | pass — identity, right, carry, props/badge | pass / pass | 2.5% | `images/avatars/Rita/carry-right.png` | `5973d27f9fda40174bfffe540cbc0a87d0ea8a1c955993357716a5277353f89f` |

## Retry and rejection ledger

| Target | Attempt | Disposition | Single recorded reason |
|---|---:|---|---|
| Alice/carry-right | 1 | `generation_failed` | Transient network failure; the built-in ImageGen call produced no image file. |
| Bob/walk-right | 1 | `rejected_group_scale` | Alpha-bbox height 948px was 13.5% larger than accepted walk-left at 835px. |
| Kara/carry-left | 1 | `rejected_group_scale` | Individually valid 743px sprite was replaced by a taller native candidate so the final Carry pair would remain within the 10% group-scale tolerance. |
| Kara/carry-left | 2 call event | `generation_failed_then_reissued` | Connection interruption ended the calibration call before any ImageGen file was produced; the same attempt prompt was reissued and then succeeded. |
| Kara/carry-right | 1 | `rejected_visual` | Unauthorized gold earring was added; Kara may only have the single anatomical-left chest badge. |
| Kara/carry-right | 2 | `rejected_group_scale` | Earring was corrected, but 833px height was 12.1% larger than the then-accepted 743px carry-left. |
| Rita/carry-right | 1 | `rejected_group_scale` | Alpha-bbox height 792px was 11.2% smaller than accepted carry-left at 881px. |
| Rita/carry-right | 2 | `rejected_technical` | Native subject overshot to 991px and the detached ponytail fragment produced two alpha components. |

## Reference policy

Standard Walk calls used the same actor's `idle.png`, `walk.png`, `walk-up.png`, `walk-down.png`, and `images/scene/office-shell.png`. Standard Carry calls used `idle.png`, `carry.png`, `carry-up.png`, `carry-down.png`, and the office shell. Scale-calibration retries replaced only the fifth slot with the explicitly recorded prior candidate; Rita's final retry used two earlier right candidates as lower/upper scale bounds while staying at five references. Full per-attempt paths, roles, prompts, prompt hashes, source hashes, and corrections are in [`prompt-set.md`](../.planning/2026-07-16-avatar-horizontal-generation/prompt-set.md).

## Evidence

- [7×4 transparent contact sheet](../.planning/2026-07-16-avatar-horizontal-generation/horizontal-transparent-contact-sheet.png)
- [7×8 movement comparison sheet](../.planning/2026-07-16-avatar-horizontal-generation/horizontal-movement-comparison-sheet.png)
- [28-cell 180px office-shell composite](../.planning/2026-07-16-avatar-horizontal-generation/horizontal-office-shell-composite.png)
- [Asset status manifest](../.planning/2026-07-16-avatar-horizontal-generation/asset-status-manifest.json)
- [Final validation JSON](../.planning/2026-07-16-avatar-horizontal-generation/horizontal-validation.json)
- [Frozen 81-image SHA-256 baseline](../.planning/2026-07-16-avatar-horizontal-generation/baseline-sha256.csv)

## Verification command

```powershell
& 'C:\Users\29929\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\validate_horizontal_avatar_assets.py --root 'C:\Users\29929\Desktop\AI-Wrokspace' --manual-manifest '.planning\2026-07-16-avatar-horizontal-generation\asset-status-manifest.json' --require-complete
```

No frontend, layout, story, route-coordinate, or business-data file was changed by this asset-generation task.
