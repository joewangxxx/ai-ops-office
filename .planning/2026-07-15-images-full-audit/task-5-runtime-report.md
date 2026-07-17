# Task 5 Runtime Composite QA Report

## Browser evidence

- Runtime: Vite at `http://127.0.0.1:4173/` in a real Chrome session.
- Viewport: 1920×1080, DPR 1.
- Scene client rect: `(24.0, 121.28, 1488.0, 837.44)` for the 1672×941 logical scene.
- Runtime screenshot: `scheme-a-runtime-desktop.png`.
- Detailed contact sheet: `scheme-a-runtime-contact-sheet.png`.
- Raw clean frames: `output/playwright/scheme-a/*-clean.png`.

The Playwright accessibility snapshot command consistently timed out even though page evaluation and screenshots were healthy. A Windows `npx.cmd` quoting issue also left one timed-out child process that overwrote an early draft screenshot. That draft was discarded. The final evidence was recaptured in a fresh `schemea2` session by invoking the already-resolved cached CLI directly; every retained frame came from a command that exited 0 and returned its selected source path.

## State/path evidence

### Ready

| Actor | Runtime pose/path |
|---|---|
| Alice | `seatedWorkingBack` → `/avatars/Alice/seated-working-back.png` |
| Bob | `seatedWorkingBack` → `/avatars/Bob/seated-working-back.png` |
| Jack | `seatedIdleBack` → `/avatars/Jack/seated-idle-back.png` |
| Kara | `seatedWorkingBack` → `/avatars/Kara/seated-working-back.png` |
| Leo | `seatedWorkingBack` → `/avatars/Leo/seated-working-back.png` |
| Quinn | `seatedIdleBack` → `/avatars/Quinn/seated-idle-back.png` |
| Rita | `seatedWorkingBack` → `/avatars/Rita/seated-working-back.png` |

At `dev-coding`, Jack changes to `/avatars/Jack/seated-working-back.png`. At `qa-testing`, Quinn changes to `/avatars/Quinn/seated-working-back.png` while Jack returns to Idle. These are the expected `currentTask` transitions.

### Directional motion

| State/frame | Selected source | Browser box |
|---|---|---:|
| `pm-delivering`, first segment | `/avatars/Alice/carry-up.png` | `(80.95,405.17,160.19,160.19)` |
| `pm-delivering`, final segment | `/avatars/Alice/carry-down.png` | `(603.34,406.05,160.19,160.19)` |
| `pm-returning`, first segment | `/avatars/Alice/walk-up.png` | `(604.89,407.61,160.19,160.19)` |
| `pm-returning`, final segment | `/avatars/Alice/walk-down.png` | `(82.73,398.92,160.19,160.19)` |

The 160.19px browser boxes equal the 180 logical render size scaled by the live scene ratio. Static seated browser boxes are 133.49px, equal to the 150 logical seated size under the same scaling.

## Layer evidence

Computed scene layer z-indexes are:

1. chairs `5`
2. avatars `10`
3. furniture/desk-front `20`
4. story Artifact `30`
5. labels `40`

This proves the required `chair-back → avatar → desk-front` occlusion order.

## Strict visual acceptance

- Seven identities remain distinct and consistent with their accepted assets.
- All seated sprites are centered, rear-facing toward the monitor, upright, and contained in the chair/desk footprint.
- Jack and Quinn Idle/Working comparisons preserve body, clothing and hair while changing the arm state toward the keyboard.
- Up frames show rear-facing movement; Down frames show the opposite travel direction.
- Carry frames contain exactly the expected Artifact beside Alice; Walk frames do not.
- No clipping, unexpected shadow/glow, chroma residue, text/watermark in an Avatar, or scale discontinuity was observed.
- Browser console has no application/asset error. The only console error is the unrelated missing `/favicon.ico` request.

## ImageGen decision

- `imagegen_calls`: **0**
- Reason: `no_visual_asset_failure_after_runtime_integration`

Scheme A explicitly reserves one ImageGen edit per asset for a real sprite visual failure. Runtime QA found none, so regenerating an accepted asset would violate the approved preservation boundary.
