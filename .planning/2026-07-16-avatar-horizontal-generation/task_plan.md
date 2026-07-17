# Avatar Horizontal Movement Generation

## Goal

Create exactly 28 new horizontal pixel-art avatar sprites for Alice, Bob, Jack, Kara, Leo, Quinn, and Rita: `walk-left`, `walk-right`, `carry-left`, and `carry-right`. Preserve every existing image byte-for-byte, generate each asset with a separate ImageGen call, validate strictly, and promote only complete four-asset actor groups.

## Approved specification

The authoritative requirements and prompt template are in `docs/avatar-horizontal-generation-goal-prompt.md`. The supplied Goal Prompt is treated as the user-approved design and execution plan.

## Constraints

- Never modify or overwrite the existing 81 PNG assets.
- Never create a collage and crop it into assets.
- Use one built-in ImageGen call per candidate; maximum three attempts per asset.
- Use the specified five references for each state and the actor identity locks.
- Remove flat `#00ff00` with the installed chroma-key helper.
- Promote all four assets for an actor only after all four pass.
- Do not modify frontend code, story data, or office layout.

## Phases

### Phase 1 — Preflight and baseline
Status: complete

- Confirm exactly 81 existing PNGs.
- Confirm all 28 target paths are absent.
- Record SHA-256 baseline and inspect references/tooling.

### Phase 2 — Generation and candidate validation
Status: complete

- Generate 28 individual source images.
- Chroma-key each candidate and validate technical, identity, direction, and action requirements.
- Retry only failed assets, up to three attempts.

### Phase 3 — Group promotion
Status: complete

- Promote four validated assets per actor without overwriting any existing file.
- Verify official outputs after every actor group.

### Phase 4 — Evidence and final validation
Status: complete

- Produce manifest, validation JSON, prompt set, contact sheets, office-shell composite, and report.
- Re-hash the original 81 and prove zero changes.
- Verify all 28 new outputs and the complete 109-image set.

### Phase 5 — Independent acceptance review
Status: complete

- Re-run the horizontal validator and its tests from a fresh session.
- Independently inspect the transparent contact sheet, full movement comparison, and office-shell composite.
- Record any technical, identity, direction, scale, or scene-composition findings.
- Define the next frontend-integration task only after this independent gate passes.

## Errors encountered

| Time | Error | Attempt | Resolution |
|---|---|---:|---|
| 2026-07-16 | Built-in ImageGen network error for Alice `carry-right`; no image/output path produced | 1 | Counted as failed attempt; retry unchanged prompt because there is no visual defect to target |
| 2026-07-16 | Workspace `python` launcher could not start after sandbox context changed | 1 | Switched test/QA commands to the bundled workspace Python executable |
| 2026-07-16 | Bob `walk-right` attempt 1 was 13.5% taller than accepted `walk-left` | 1 | Reject candidate; regenerate the same native right pose at about 8% smaller subject scale without local resizing |
| 2026-07-16 | Kara `carry-right` attempt 1 added an unauthorized gold earring | 1 | Rejected; attempt 2 removed all ear jewelry while preserving only the left-chest badge |
| 2026-07-16 | Kara Carry candidates exceeded the left/right group-scale tolerance | 2–3 | Accepted right attempt 3, then regenerated left natively; final pair delta 6.7% without resizing |
| 2026-07-17 | Kara `carry-left` calibration call was interrupted before output | call event | Recorded as a no-output call and reissued the same attempt prompt; attempt-2 candidate then succeeded |
| 2026-07-17 | Rita `carry-right` attempt 1 was too small; attempt 2 overshot and had a detached alpha component | 1–2 | Attempt 3 targeted the bounded native scale and one connected component; final pair delta 2.5% |
| 2026-07-17 | Built-in sources used nonuniform near-green rather than exact flat `#00ff00` | all 34 successful sources | Disclosed as an upstream source deviation; prescribed chroma removal produced 28 official transparent files with no visible or hidden green |
| 2026-07-17 | Initial independent-audit read command contained PowerShell backticks inside a JavaScript template literal and failed before execution | 1 | Reissued the read using plain command strings; no project file was affected |
| 2026-07-17 | Exploratory validation-JSON read assumed a top-level `assets` array | 1 | Read the actual schema and switched to `targets.assets`; summary data remained valid and no file was changed |
| 2026-07-17 | First Phase 5 status patch matched a mojibake rendering of the em dash instead of the file's actual Unicode text | 1 | Located the exact line with `Select-String` and reapplied the narrow patch; no project asset or code file was affected |

## Final status

- Official horizontal targets: 28/28.
- Automated technical validation: 28/28.
- Manual identity/direction/action validation: 28/28.
- Actual 180px and office-shell scene validation: 28/28.
- Original baseline: 81/81 unchanged; non-target changes: 0.
- Total `images/**/*.png`: 109.
- Independent acceptance review: passed on 2026-07-17.
- Next task: register all four horizontal poses per actor and cut the frontend runtime over to a four-direction presentation model with per-image foot anchors.
