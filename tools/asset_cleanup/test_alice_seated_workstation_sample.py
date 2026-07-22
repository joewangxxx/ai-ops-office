from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE_CANVAS = (1254, 1254)
SCENE_SIZE = (1672, 941)
DERIVED = {
    "desk_back": ROOT / "images/derived/alice-desk-back-clean-sample.png",
    "desk_foreground": ROOT / "images/derived/alice-desk-foreground-clean-sample.png",
    "chair": ROOT / "images/derived/alice-desk-chair-wide-sample.png",
    "manifest": ROOT / "images/derived/alice-seat-layer-sample-manifest.json",
    "overlay": ROOT / "apps/office-demo/screenshots/alice-seated-workstation-sample-overlay.png",
    "audit": ROOT / "apps/office-demo/screenshots/alice-seated-workstation-sample-audit.png",
}


def require_rgba_canvas(path: Path) -> Image.Image:
    assert path.is_file(), f"missing sample output: {path.relative_to(ROOT)}"
    image = Image.open(path).convert("RGBA")
    assert image.size == SOURCE_CANVAS
    assert all(image.getpixel(point)[3] == 0 for point in ((0, 0), (1253, 0), (0, 1253), (1253, 1253)))
    return image


def place_mask(image: Image.Image, anchor: dict[str, int], source_anchor: dict[str, int], size: dict[str, int]) -> np.ndarray:
    resized = image.resize((size["width"], size["height"]), Image.Resampling.NEAREST)
    left = round(anchor["x"] - source_anchor["x"] * size["width"] / SOURCE_CANVAS[0])
    top = round(anchor["y"] - source_anchor["y"] * size["height"] / SOURCE_CANVAS[1])
    canvas = np.zeros((SCENE_SIZE[1], SCENE_SIZE[0]), dtype=bool)
    canvas[top : top + size["height"], left : left + size["width"]] = np.asarray(resized)[..., 3] > 0
    return canvas


def test_alice_sample_keeps_a_visible_chair_and_an_unoccluded_head() -> None:
    desk_back = require_rgba_canvas(DERIVED["desk_back"])
    foreground = require_rgba_canvas(DERIVED["desk_foreground"])
    chair = require_rgba_canvas(DERIVED["chair"])
    assert DERIVED["manifest"].is_file(), "missing Alice sample placement manifest"
    assert DERIVED["overlay"].is_file(), "missing Alice sample overlay"
    assert DERIVED["audit"].is_file(), "missing Alice sample audit"

    with Image.open(DERIVED["overlay"]) as overlay:
        assert overlay.size == SCENE_SIZE

    manifest = json.loads(DERIVED["manifest"].read_text(encoding="utf-8"))
    layout = json.loads((ROOT / "docs/office-layout.json").read_text(encoding="utf-8"))
    desk = next(item for item in layout["desks"] if item["id"] == "pm-alice")
    avatar_asset = layout["assetAnchors"]["avatars"]["byActor"]["Alice"]["seatedWorkingBack"]
    avatar_size = layout["assetAnchors"]["avatars"]["seatedRecommendedRenderSize"]

    with Image.open(ROOT / avatar_asset["path"]) as source_avatar:
        avatar = source_avatar.convert("RGBA")
    avatar_mask = place_mask(avatar, desk["seatedBackAnchor"], avatar_asset["visualSeatedBaseCenterSource"], avatar_size)
    chair_mask = place_mask(chair, manifest["chair"]["sceneAnchor"], manifest["chair"]["visualBottomCenterSource"], manifest["chair"]["recommendedRenderSize"])
    foreground_mask = place_mask(foreground, desk["deskAnchor"], manifest["deskForeground"]["visualBottomCenterSource"], manifest["deskForeground"]["recommendedRenderSize"])

    visible_chair = chair_mask & ~avatar_mask
    left_of_avatar = visible_chair[:, : desk["seatedBackAnchor"]["x"]]
    right_of_avatar = visible_chair[:, desk["seatedBackAnchor"]["x"] + 1 :]
    assert visible_chair.sum() >= 500, "chair must remain visibly larger than Alice's seated silhouette"
    assert left_of_avatar.sum() >= 100 and right_of_avatar.sum() >= 100, "chair must remain visible on both sides of Alice"

    head_band = avatar_mask.copy()
    head_band[510:] = False
    assert not np.any(foreground_mask & head_band), "desk foreground must not cover Alice's head or upper hair"

    for image in (desk_back, foreground):
        pixels = np.asarray(image)
        lower = pixels[756:, :, :]
        neutral_floor = (lower[..., 3] > 0) & (lower[..., :3].min(axis=2) >= 125) & ((lower[..., :3].max(axis=2) - lower[..., :3].min(axis=2)) <= 38)
        assert not neutral_floor.any(), "sample desk layers must not retain baked neutral floor tiles"
