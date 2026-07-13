# Findings — Task 4.1 static visual calibration

- Pre-change 1440 × 900 screenshot was saved at `apps/office-demo/screenshots/task4.1-before-1440.png` before source edits.
- Hub LCD dark panel measures approximately source `x=464–790`, `y=342–552`; its final rect will include only this screen and CSS will clip contents within it.
- The desk PNG is 1254 × 1254 with alpha bounds `(261, 279, 738, 677)`. Chair pixels occupy a visually separate neutral/dark region centered around `x=630`, `y=660–955`, permitting a full-canvas alpha-mask split.
- Current at-desk sprites already include a role-specific source shadow/seat point; new `visualSeatCenterSource` entries will align this to JSON `seatAnchor` values rather than CSS offsets.
- Current Task 4 controller is already in the Inspector footer and is out of scope for changes.
- Test-first baseline: 6 Task 4.1 tests fail for the requested missing behaviors; existing Task 4 tests have not been modified yet.
- Generated chair asset alpha bounds: `(476, 655, 289, 299)`; desk-front retains the original visible bounds. Split verification confirms that the two assets recomposite the original desk without visible pixel changes.
- Browser visual calibration rejected a low seat anchor: it hid the avatars behind the desk fronts. The final `seatAnchor` values retain the previously validated seated silhouette plane while the new chair layer sits behind and the desk front sits above; no CSS offsets or avatar rescaling were added.
- 1920 × 1080 review confirms the Hub rows are inside the black LCD, chairs remain behind online avatars and are empty at Cindy, Mia, and Tina desks, and controller stays inside the Inspector.
