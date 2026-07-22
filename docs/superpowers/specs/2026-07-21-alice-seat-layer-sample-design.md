# Alice seated workstation sample design

## Goal

Create and visually validate one non-production Alice workstation composite. It must read as Alice seated in a visible chair facing the monitor, with her hair and upper body not occluded by the desk, and with no baked gray floor tiles.

## Layer model

The sample replaces the failing `chair-back -> avatar -> full desk-front` composite with five independent transparent layers: scene background, a cleaned workstation back, a wider complete chair, Alice's existing `seated-working-back` sprite, and a narrow foreground layer containing only desk details outside the avatar collision zone. All assets retain a 1254 x 1254 RGBA canvas; original files remain untouched.

## Scope and acceptance

Only derived sample assets and a standalone Alice overlay are created. The React layout registry and all other desks remain unchanged. The resulting audit must show a non-zero visible chair silhouette on both sides/below Alice, zero desk-foreground pixels over the avatar head region, a keyboard-facing rear pose, transparent canvas corners, and no lower neutral tile pixels.
