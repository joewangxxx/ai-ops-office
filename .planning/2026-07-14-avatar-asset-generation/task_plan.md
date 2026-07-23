# AI Office Avatar Asset Generation Plan

## Goal
Produce and validate 42 transparent PNG character assets for Alice, Bob, Jack, Kara, Leo, Quinn, and Rita, plus two contact sheets and a complete validation report, without modifying frontend code or layout/event data.

## Phase A: Input and existing-state audit
Status: complete
- Verify all 28 character references and four shared references exist, decode, and match their intended character.
- Inventory any existing target assets and Alice candidate files.
- Stop only if a critical reference is missing or corrupt.

## Phase B: Alice seated assets
Status: complete
- Validate and reuse the existing Alice seated-idle candidate if it passes.
- Generate seated-working-back from the accepted idle asset as the edit reference.
- Remove chroma key and complete technical, identity/action, and workstation-composite QA.

## Phase C: Alice movement assets
Status: complete
- Generate, key, and validate walk-up, walk-down, carry-up, and carry-down.
- Confirm direction, neutral carried object, scale, and office-shell compositing.

## Phase D: Jack full workflow calibration
Status: complete
- Produce and validate all six Jack assets.
- Confirm the cross-character prompt, keying, and validation process is stable.

## Phase E: Remaining five characters
Status: complete
- Produce and validate all six assets for Bob, Kara, Leo, Quinn, and Rita.
- Retry only failed assets, up to three targeted retries after the initial attempt.

## Phase F: Final validation artifacts
Status: complete
- Prove all 42 finals are PNG/RGBA/1254x1254 with transparent corners and acceptable alpha bounds.
- Create seated-contact-sheet.png and movement-contact-sheet.png with scene composites.
- Create docs/avatar-asset-generation-report.md with per-asset evidence.

## Phase G: Completion audit
Status: complete
- Audit every explicit goal requirement against filesystem and rendered evidence.
- Mark the persistent goal complete only after all 42 assets and all validation deliverables pass.

## Constraints
- Built-in image generation only; one asset per call.
- Generate on flat #00ff00, then use the installed chroma-key helper.
- Never overwrite idle.png, at-desk.png, walk.png, or carry.png.
- Never modify frontend code, office-layout.json, coordinates, or event-system files.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---:|---|
| Initial prior-turn image generation could not access conversational attachments | 1 | Located and used the authoritative local reference files instead |
| Plan update patch used an incomplete expected context line | 1 | Re-read the plan files and applied a narrower exact-context patch |
| Alice idle candidate was promoted after alpha/identity checks but before strict workstation geometry review | 1 | Removed the copied target; require layer-correct geometry pass before promotion |
| Alice working prompt contained Markdown backticks inside a JavaScript template literal | 1 | Removed the backticks and reissued the same image request; no generation attempt was consumed |
| Chroma-key helper was first called with positional input/output arguments | 1 | Re-ran it with the required `--input` and `--out` flags; generated source was preserved |
| Validator tests were first invoked as a package from the workspace root | 1 | Re-ran `unittest` from `tmp/imagegen/validation`, where the helper module is importable; all 12 tests passed |
| Final 42-cell scale audit found Leo walk-up and carry-up too small at fixed 180px render size | 1 | Targeted only those two source-canvas scales, re-keyed them, and regenerated the full validator/contact sheets for independent re-audit |
