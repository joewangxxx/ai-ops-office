# Findings — Task 3 static map

- `office-layout.json` is complete and contains all source asset paths, 1254px source-canvas anchors, render sizes, 10 desk definitions, and a central Hub anchor.
- The map must use the static initial state: seven `atDesk` Avatars, three offline empty desks, and seven gray Orbs.
- The Task 2 scene already provides a responsive 1672:941 canvas, background image, Inspector shell, and Story controller shell.
- Layering must be global: background < Avatar < desk/Hub < Hub counts < tag/Orb. Component nesting alone is insufficient, so z-index is part of the rendering contract.
- Browser inspection found the initial fixed-size inner canvas was not transformed because Chrome rejected the CSS division expression in `calc()`. The corrected implementation uses integer logical-pixel placement converted to scene-relative percentages, so the background and every sprite scale together without clipping.
- The initial 210px Hub canvas produced a roughly 73px visible Hub at the 1440px desktop viewport. Increasing only JSON's Hub `recommendedRenderSize` to 240px makes the screen counts more legible while retaining clearance from fixed map decor.
