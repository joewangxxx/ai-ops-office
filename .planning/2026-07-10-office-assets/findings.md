# Findings — AI OPS Office assets and layout

## Scene
- `images/scene/office-shell.png` is the only logical coordinate system: 1672 × 941.
- Clear room interiors: PM is the upper-left green floor, Dev the upper-right blue floor, QA the lower purple floor, and the central tiled corridor is the Hub zone.

## Asset geometry
- Scene background is opaque.
- Furniture, Artifact, Orb, and all 28 Avatar pose files are 1254 × 1254 RGBA canvases with substantial transparent padding.
- Placement must align source visual anchors (desk/Hub bottom-centre; Avatar foot/shadow centre) to scene coordinates, never an image's top-left corner.

## Planned layout
- PM: three desks in a horizontal lower row in the upper-left room.
- Dev: four desks in a 2 × 2 grid in the upper-right room.
- QA: three desks in the lower room, leaving outer walls unobscured.
- Hub: centred in the tiled public corridor; handoff values record points only, with no route artwork.
