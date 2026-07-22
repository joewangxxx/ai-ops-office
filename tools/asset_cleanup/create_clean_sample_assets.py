"""Create non-destructive clean-cutout samples for one desk and Alice.

This removes only the baked, light-neutral floor tiles from verified lower
regions. It never changes the canvas, source coordinates, or preserved pixels.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE_CANVAS = (1254, 1254)


@dataclass(frozen=True)
class SampleSpec:
    source: Path
    output: Path
    floor_start_y: int


SAMPLES = (
    SampleSpec(
        source=ROOT / "images/furniture/desk-front.png",
        output=ROOT / "images/derived/desk-front-clean-sample.png",
        floor_start_y=756,
    ),
    SampleSpec(
        source=ROOT / "images/furniture/desk-chair-back.png",
        output=ROOT / "images/derived/desk-chair-back-clean-sample.png",
        floor_start_y=756,
    ),
    SampleSpec(
        source=ROOT / "images/avatars/Alice/at-desk.png",
        output=ROOT / "images/derived/alice-at-desk-clean-sample.png",
        floor_start_y=916,
    ),
)


def floor_tile_mask(rgba: np.ndarray, floor_start_y: int) -> np.ndarray:
    """Return only the lower, opaque-ish neutral tiles baked into each sprite."""
    rgb = rgba[..., :3]
    alpha = rgba[..., 3]
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    lower_region = np.indices(alpha.shape)[0] >= floor_start_y
    return (
        lower_region
        & (alpha > 0)
        & (rgb.min(axis=2) >= 125)
        & (chroma <= 38)
    )


def clean_sample(spec: SampleSpec) -> None:
    with Image.open(spec.source) as source_image:
        image = source_image.convert("RGBA")

    if image.size != SOURCE_CANVAS:
        raise ValueError(f"{spec.source} must remain on the {SOURCE_CANVAS} canvas")

    rgba = np.asarray(image).copy()
    remove = floor_tile_mask(rgba, spec.floor_start_y)
    rgba[remove, :3] = 0
    rgba[remove, 3] = 0

    output = Image.fromarray(rgba, "RGBA")
    spec.output.parent.mkdir(parents=True, exist_ok=True)
    output.save(spec.output)

    validate_sample(spec)


def validate_sample(spec: SampleSpec) -> None:
    with Image.open(spec.output) as output_image:
        image = output_image.convert("RGBA")

    if image.size != SOURCE_CANVAS:
        raise ValueError(f"{spec.output} changed the canvas size")

    rgba = np.asarray(image)
    if floor_tile_mask(rgba, spec.floor_start_y).any():
        raise ValueError(f"{spec.output} still contains lower floor-tile pixels")

    corners = ((0, 0), (SOURCE_CANVAS[0] - 1, 0), (0, SOURCE_CANVAS[1] - 1), (SOURCE_CANVAS[0] - 1, SOURCE_CANVAS[1] - 1))
    if any(image.getpixel(point)[3] != 0 for point in corners):
        raise ValueError(f"{spec.output} must preserve transparent canvas corners")


if __name__ == "__main__":
    for sample in SAMPLES:
        clean_sample(sample)
        print(sample.output.relative_to(ROOT))
