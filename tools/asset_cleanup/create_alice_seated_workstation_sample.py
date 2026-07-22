"""Build and audit a non-destructive Alice seated-workstation sample.

The tool deliberately creates only derived files. It never overwrites a
source image or changes React/JSON runtime configuration.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE_CANVAS = {"width": 1254, "height": 1254}
SCENE_SIZE = {"width": 1672, "height": 941}
DERIVED = ROOT / "images/derived"
SCREENSHOTS = ROOT / "apps/office-demo/screenshots"


def floor_tile_mask(rgba: np.ndarray) -> np.ndarray:
    """Select only the pale neutral floor tile baked into the source sprite."""
    rgb = rgba[..., :3]
    alpha = rgba[..., 3]
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    y = np.indices(alpha.shape)[0]
    return (y >= 756) & (alpha > 0) & (rgb.min(axis=2) >= 125) & (chroma <= 38)


def validate_canvas(image: Image.Image, label: str) -> None:
    if image.mode != "RGBA" or image.size != (1254, 1254):
        raise ValueError(f"{label} must be an RGBA 1254 x 1254 PNG")
    if any(image.getpixel(point)[3] != 0 for point in ((0, 0), (1253, 0), (0, 1253), (1253, 1253))):
        raise ValueError(f"{label} must retain transparent canvas corners")


def build_desk_layers() -> tuple[Path, Path]:
    source = Image.open(ROOT / "images/furniture/desk-front.png").convert("RGBA")
    validate_canvas(source, "desk-front source")
    rgba = np.asarray(source).copy()
    rgba[floor_tile_mask(rgba)] = (0, 0, 0, 0)

    # Only desk legs/outer frame become an above-avatar layer. The center is
    # intentionally absent so it can never crop Alice's head or shoulder line.
    y, x = np.indices(rgba.shape[:2])
    foreground_mask = (rgba[..., 3] > 0) & (y >= 740) & ((x <= 480) | (x >= 780))
    foreground = np.zeros_like(rgba)
    foreground[foreground_mask] = rgba[foreground_mask]
    back = rgba.copy()
    back[foreground_mask] = (0, 0, 0, 0)

    if floor_tile_mask(back).any() or floor_tile_mask(foreground).any():
        raise ValueError("desk sample still contains baked floor tile pixels")

    DERIVED.mkdir(parents=True, exist_ok=True)
    back_path = DERIVED / "alice-desk-back-clean-sample.png"
    foreground_path = DERIVED / "alice-desk-foreground-clean-sample.png"
    Image.fromarray(back, "RGBA").save(back_path)
    Image.fromarray(foreground, "RGBA").save(foreground_path)
    return back_path, foreground_path


def placement(scene_anchor: dict[str, int], source_anchor: dict[str, float], render_size: dict[str, int]) -> tuple[int, int]:
    return (
        round(scene_anchor["x"] - source_anchor["x"] * render_size["width"] / SOURCE_CANVAS["width"]),
        round(scene_anchor["y"] - source_anchor["y"] * render_size["height"] / SOURCE_CANVAS["height"]),
    )


def compose_asset(canvas: Image.Image, image: Image.Image, scene_anchor: dict[str, int], source_anchor: dict[str, float], render_size: dict[str, int]) -> tuple[int, int, Image.Image]:
    sprite = image.resize((render_size["width"], render_size["height"]), Image.Resampling.NEAREST)
    position = placement(scene_anchor, source_anchor, render_size)
    canvas.alpha_composite(sprite, position)
    return *position, sprite


def full_scene_mask(image: Image.Image, scene_anchor: dict[str, int], source_anchor: dict[str, float], render_size: dict[str, int]) -> np.ndarray:
    _, left, top = None, *placement(scene_anchor, source_anchor, render_size)
    sprite = image.resize((render_size["width"], render_size["height"]), Image.Resampling.NEAREST)
    mask = np.zeros((SCENE_SIZE["height"], SCENE_SIZE["width"]), dtype=bool)
    mask[top : top + render_size["height"], left : left + render_size["width"]] = np.asarray(sprite)[..., 3] > 0
    return mask


def chair_anchor(image: Image.Image) -> dict[str, float]:
    alpha = np.asarray(image)[..., 3] > 0
    ys, xs = np.where(alpha)
    if not len(xs):
        raise ValueError("wide chair candidate has no visible pixels")
    return {"x": round(float((xs.min() + xs.max()) / 2), 1), "y": int(ys.max())}


def create_overlay_and_audit(back_path: Path, foreground_path: Path) -> None:
    layout = json.loads((ROOT / "docs/office-layout.json").read_text(encoding="utf-8"))
    desk = next(item for item in layout["desks"] if item["id"] == "pm-alice")
    furniture = layout["assetAnchors"]["furniture"]
    avatar_registry = layout["assetAnchors"]["avatars"]
    avatar_asset = avatar_registry["byActor"]["Alice"]["seatedWorkingBack"]

    desk_back = Image.open(back_path).convert("RGBA")
    desk_foreground = Image.open(foreground_path).convert("RGBA")
    chair_path = DERIVED / "alice-desk-chair-wide-sample.png"
    chair = Image.open(chair_path).convert("RGBA")
    alice = Image.open(ROOT / avatar_asset["path"]).convert("RGBA")
    for label, image in (("desk back", desk_back), ("desk foreground", desk_foreground), ("wide chair", chair), ("Alice", alice)):
        validate_canvas(image, label)

    desk_size = furniture["deskFront"]["recommendedRenderSize"]
    # Preserve square pixels while enlarging the existing chair enough for
    # its armrests and base to remain visible around the 150 px avatar.
    chair_size = {"width": 260, "height": 260}
    chair_source_anchor = chair_anchor(chair)
    manifest = {
        "sampleOnly": True,
        "layerOrder": ["sceneBackground", "deskBack", "chair", "avatar", "deskForeground"],
        "deskBack": {
            "path": "images/derived/alice-desk-back-clean-sample.png",
            "visualBottomCenterSource": furniture["deskFront"]["visualBottomCenterSource"],
            "recommendedRenderSize": desk_size,
        },
        "deskForeground": {
            "path": "images/derived/alice-desk-foreground-clean-sample.png",
            "visualBottomCenterSource": furniture["deskFront"]["visualBottomCenterSource"],
            "recommendedRenderSize": desk_size,
        },
        "chair": {
            "path": "images/derived/alice-desk-chair-wide-sample.png",
            # Keep Alice's hands at the keyboard; lower only the chair so its
            # wheeled base remains legible below her seated silhouette.
            "sceneAnchor": {"x": desk["seatedBackAnchor"]["x"], "y": desk["seatedBackAnchor"]["y"] + 20},
            "visualBottomCenterSource": chair_source_anchor,
            "recommendedRenderSize": chair_size,
        },
        "avatar": {"path": avatar_asset["path"], "sceneAnchor": desk["seatedBackAnchor"], "visualSeatedBaseCenterSource": avatar_asset["visualSeatedBaseCenterSource"], "recommendedRenderSize": avatar_registry["seatedRecommendedRenderSize"]},
    }
    DERIVED.mkdir(parents=True, exist_ok=True)
    (DERIVED / "alice-seat-layer-sample-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    background = Image.open(ROOT / "images/scene/office-shell.png").convert("RGBA")
    compose_asset(background, desk_back, desk["deskAnchor"], manifest["deskBack"]["visualBottomCenterSource"], desk_size)
    compose_asset(background, chair, manifest["chair"]["sceneAnchor"], chair_source_anchor, chair_size)
    compose_asset(background, alice, desk["seatedBackAnchor"], avatar_asset["visualSeatedBaseCenterSource"], avatar_registry["seatedRecommendedRenderSize"])
    compose_asset(background, desk_foreground, desk["deskAnchor"], manifest["deskForeground"]["visualBottomCenterSource"], desk_size)
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    background.save(SCREENSHOTS / "alice-seated-workstation-sample-overlay.png")

    chair_mask = full_scene_mask(chair, manifest["chair"]["sceneAnchor"], chair_source_anchor, chair_size)
    avatar_mask = full_scene_mask(alice, desk["seatedBackAnchor"], avatar_asset["visualSeatedBaseCenterSource"], avatar_registry["seatedRecommendedRenderSize"])
    foreground_mask = full_scene_mask(desk_foreground, desk["deskAnchor"], furniture["deskFront"]["visualBottomCenterSource"], desk_size)
    audit = Image.new("RGBA", (SCENE_SIZE["width"], SCENE_SIZE["height"]), (15, 22, 31, 255))
    pixels = np.asarray(audit).copy()
    pixels[chair_mask] = (74, 170, 255, 255)
    pixels[avatar_mask] = (255, 202, 83, 255)
    pixels[foreground_mask] = (95, 222, 154, 255)
    pixels[chair_mask & avatar_mask] = (235, 87, 87, 255)
    audit = Image.fromarray(pixels, "RGBA")
    crop = (45, 410, 270, 595)
    audit.crop(crop).resize(((crop[2] - crop[0]) * 4, (crop[3] - crop[1]) * 4), Image.Resampling.NEAREST).save(SCREENSHOTS / "alice-seated-workstation-sample-audit.png")


def main() -> None:
    back_path, foreground_path = build_desk_layers()
    create_overlay_and_audit(back_path, foreground_path)
    print("Created Alice seated workstation sample outputs")


if __name__ == "__main__":
    main()
