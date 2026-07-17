#!/usr/bin/env python3
"""Validate and render evidence for horizontal avatar movement sprites."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
import warnings
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tmp.imagegen.validation.avatar_asset_validator import analyze_image, derive_foot_anchor


ACTORS = ("Alice", "Bob", "Jack", "Kara", "Leo", "Quinn", "Rita")
POSES = ("walk-left", "walk-right", "carry-left", "carry-right")
MOVEMENT_COMPARISON_POSES = (
    "walk-left",
    "walk-right",
    "walk-up",
    "walk-down",
    "carry-left",
    "carry-right",
    "carry-up",
    "carry-down",
)
OFFICE_ROUTE_POSITIONS = {
    "PM-to-Hub": (710, 278),
    "Dev-to-Hub": (1010, 280),
    "QA-to-Hub": (744, 560),
}
ACTOR_OFFICE_ROUTE = {
    "Alice": "PM-to-Hub",
    "Bob": "PM-to-Hub",
    "Jack": "Dev-to-Hub",
    "Kara": "Dev-to-Hub",
    "Leo": "Dev-to-Hub",
    "Quinn": "QA-to-Hub",
    "Rita": "QA-to-Hub",
}
NEAREST = Image.Resampling.NEAREST
PLANNING_DIRECTORY = Path(".planning/2026-07-16-avatar-horizontal-generation")


class IncompleteHorizontalAssetsError(RuntimeError):
    """Raised when complete-set evidence is requested before all 28 files exist."""


def target_paths(root: Path) -> list[Path]:
    """Return the exact ordered 28-file horizontal asset whitelist."""

    return [
        root / "images" / "avatars" / actor / f"{pose}.png"
        for actor in ACTORS
        for pose in POSES
    ]


def _relative(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.resolve().as_posix()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_baseline(
    root: Path,
    baseline_path: Path,
    *,
    expected_entries: int = 81,
) -> dict[str, Any]:
    """Verify the frozen image baseline without mutating any asset.

    Files in the exact 28-target whitelist are allowed additions. Any other
    added PNG, missing baseline path, or SHA-256 mismatch is a non-target
    change and is reported explicitly.
    """

    root = root.resolve()
    with baseline_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    baseline_paths = [Path(row["path"]).as_posix() for row in rows]
    duplicate_paths = sorted(
        {path for path in baseline_paths if baseline_paths.count(path) > 1}
    )
    invalid_entries: list[dict[str, Any]] = []
    invalid_paths: set[str] = set()
    for normalized_path, row in zip(baseline_paths, rows):
        reasons: list[str] = []
        path_object = Path(normalized_path)
        if (
            path_object.is_absolute()
            or not path_object.parts
            or path_object.parts[0] != "images"
            or ".." in path_object.parts
            or path_object.suffix.lower() != ".png"
        ):
            reasons.append("path_must_be_images_png")
        digest = row["sha256"].lower()
        if len(digest) != 64 or any(character not in "0123456789abcdef" for character in digest):
            reasons.append("invalid_sha256")
        if reasons:
            invalid_entries.append({"path": normalized_path, "reasons": reasons})
            invalid_paths.add(normalized_path)
    expected_hashes = {
        normalized_path: row["sha256"].lower()
        for normalized_path, row in zip(baseline_paths, rows)
    }
    target_set = {_relative(path, root) for path in target_paths(root)}
    target_overlap = sorted(set(expected_hashes) & target_set)
    missing: list[str] = []
    modified: list[dict[str, str]] = []
    matched_count = 0
    for relative_path, expected_hash in sorted(expected_hashes.items()):
        if relative_path in invalid_paths:
            continue
        current_path = root / relative_path
        if not current_path.is_file():
            missing.append(relative_path)
            continue
        actual_hash = _sha256(current_path)
        if actual_hash == expected_hash:
            matched_count += 1
        else:
            modified.append(
                {
                    "path": relative_path,
                    "expected_sha256": expected_hash,
                    "actual_sha256": actual_hash,
                }
            )

    current_pngs = {
        _relative(path, root)
        for path in (root / "images").rglob("*.png")
        if path.is_file()
    }
    unexpected = sorted(current_pngs - set(expected_hashes) - target_set)
    non_target_change_count = len(missing) + len(modified) + len(unexpected)
    entry_count_matches = len(rows) == expected_entries
    return {
        "baseline_path": _relative(baseline_path, root),
        "expected_entry_count": expected_entries,
        "baseline_entry_count": len(rows),
        "entry_count_matches": entry_count_matches,
        "duplicate_paths": duplicate_paths,
        "target_overlap": target_overlap,
        "invalid_entries": invalid_entries,
        "matched_count": matched_count,
        "missing": missing,
        "modified": modified,
        "unexpected_added_non_target": unexpected,
        "non_target_change_count": non_target_change_count,
        "status": (
            "pass"
            if entry_count_matches
            and not duplicate_paths
            and not target_overlap
            and not invalid_entries
            and non_target_change_count == 0
            else "fail"
        ),
    }


MANUAL_QA_PASS_FIELDS = (
    "identity",
    "direction",
    "action",
    "hands_props",
    "badge_visibility",
    "no_extras_or_shadow",
    "independent_not_mirrored",
)


def validate_manual_manifest(root: Path, manifest_path: Path) -> dict[str, Any]:
    """Cross-check explicit human sign-off against the exact final whitelist.

    The manifest is treated as evidence, not authority: every listed final hash
    is recomputed from disk and all 28 exact target paths must occur once.
    """

    root = root.resolve()
    expected = [_relative(path, root) for path in target_paths(root)]
    expected_set = set(expected)
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
        records = payload.get("assets", [])
        if not isinstance(records, list):
            raise TypeError("assets must be a list")
    except Exception as error:
        return {
            "manifest_path": _relative(manifest_path, root),
            "expected_count": len(expected),
            "record_count": 0,
            "passed_count": 0,
            "missing_paths": expected,
            "unexpected_paths": [],
            "duplicate_paths": [],
            "errors": [
                {
                    "path": None,
                    "reason": "manifest_read_error",
                    "detail": f"{type(error).__name__}: {error}",
                }
            ],
            "status": "fail",
        }

    paths = [record.get("target_path") for record in records if isinstance(record, dict)]
    valid_string_paths = [path for path in paths if isinstance(path, str)]
    duplicate_paths = sorted(
        {path for path in valid_string_paths if valid_string_paths.count(path) > 1}
    )
    actual_set = set(valid_string_paths)
    missing_paths = sorted(expected_set - actual_set)
    unexpected_paths = sorted(actual_set - expected_set)
    errors: list[dict[str, Any]] = []
    passed_paths: set[str] = set()

    for index, record in enumerate(records):
        if not isinstance(record, dict):
            errors.append(
                {"path": None, "reason": "asset_record_not_object", "index": index}
            )
            continue
        relative_path = record.get("target_path")
        if not isinstance(relative_path, str):
            errors.append(
                {"path": None, "reason": "target_path_missing", "index": index}
            )
            continue
        if relative_path not in expected_set:
            errors.append({"path": relative_path, "reason": "unexpected_target_path"})
            continue

        record_errors_before = len(errors)
        if relative_path in duplicate_paths:
            errors.append({"path": relative_path, "reason": "duplicate_target_path"})
        if record.get("status") != "promoted":
            errors.append({"path": relative_path, "reason": "asset_not_promoted"})

        manual = record.get("manual_qa")
        if not isinstance(manual, dict) or manual.get("status") != "pass":
            errors.append({"path": relative_path, "reason": "manual_qa_not_pass"})
        else:
            for field in MANUAL_QA_PASS_FIELDS:
                if manual.get(field) != "pass":
                    errors.append(
                        {
                            "path": relative_path,
                            "reason": "manual_qa_field_not_pass",
                            "field": field,
                        }
                    )

        group = record.get("group_qa")
        if not isinstance(group, dict):
            errors.append({"path": relative_path, "reason": "group_qa_missing"})
        else:
            for field in ("status", "actual_180_status", "scene_status"):
                if group.get(field) != "pass":
                    errors.append(
                        {
                            "path": relative_path,
                            "reason": "group_qa_field_not_pass",
                            "field": field,
                        }
                    )

        promotion = record.get("promotion")
        if (
            not isinstance(promotion, dict)
            or promotion.get("status") != "promoted"
            or promotion.get("candidate_final_hash_match") is not True
        ):
            errors.append({"path": relative_path, "reason": "promotion_not_verified"})

        final_path = root / relative_path
        if not final_path.is_file():
            errors.append({"path": relative_path, "reason": "final_file_missing"})
        else:
            recorded_sha = (record.get("final") or {}).get("sha256")
            actual_sha = _sha256(final_path)
            if recorded_sha != actual_sha:
                errors.append(
                    {
                        "path": relative_path,
                        "reason": "final_sha256_mismatch",
                        "recorded_sha256": recorded_sha,
                        "actual_sha256": actual_sha,
                    }
                )

        if len(errors) == record_errors_before:
            passed_paths.add(relative_path)

    status = (
        "pass"
        if len(records) == len(expected)
        and not missing_paths
        and not unexpected_paths
        and not duplicate_paths
        and not errors
        and len(passed_paths) == len(expected)
        else "fail"
    )
    return {
        "manifest_path": _relative(manifest_path, root),
        "expected_count": len(expected),
        "record_count": len(records),
        "passed_count": len(passed_paths),
        "missing_paths": missing_paths,
        "unexpected_paths": unexpected_paths,
        "duplicate_paths": duplicate_paths,
        "errors": errors,
        "status": status,
    }


def _hidden_rgb_metrics(rgba: Image.Image) -> dict[str, int]:
    """Count RGB payload concealed beneath fully transparent pixels."""

    pixels = np.asarray(rgba, dtype=np.uint8)
    transparent = pixels[:, :, 3] == 0
    red = pixels[:, :, 0].astype(np.int16)
    green = pixels[:, :, 1].astype(np.int16)
    blue = pixels[:, :, 2].astype(np.int16)
    nonzero = transparent & ((red != 0) | (green != 0) | (blue != 0))
    green_like = transparent & (green >= 96) & (green >= red + 32) & (green >= blue + 32)
    chroma_key_like = transparent & (green >= 220) & (red <= 48) & (blue <= 48)
    return {
        "transparent_pixel_count": int(np.count_nonzero(transparent)),
        "nonzero_rgb_count": int(np.count_nonzero(nonzero)),
        "green_like_count": int(np.count_nonzero(green_like)),
        "chroma_key_like_count": int(np.count_nonzero(chroma_key_like)),
    }


def validate_assets(root: Path) -> dict[str, Any]:
    """Analyze every present target and explicitly report every missing target."""

    targets = target_paths(root)
    present = [path for path in targets if path.is_file()]
    missing = [path for path in targets if not path.is_file()]
    assets: list[dict[str, Any]] = []
    decode_failure_count = 0
    for path in present:
        record: dict[str, Any] = {"path": _relative(path, root)}
        try:
            # Pillow 13 deprecates getdata(); the imported legacy analyzer is
            # read-only task infrastructure and is deliberately not patched by
            # this horizontal-only validator.
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message=r"Image\.Image\.getdata is deprecated.*",
                    category=DeprecationWarning,
                )
                record["technical"] = analyze_image(path)
            with Image.open(path) as opened:
                rgba = opened.convert("RGBA")
                rgba.load()
            record["hidden_rgb"] = _hidden_rgb_metrics(rgba)
            record["foot_anchor"] = derive_foot_anchor(rgba.getchannel("A"))
            runtime = rgba.resize((180, 180), NEAREST)
            runtime_bbox = runtime.getchannel("A").getbbox()
            record["runtime_180"] = {
                "canvas_size": [180, 180],
                "visible_bbox": list(runtime_bbox) if runtime_bbox else None,
                "visible_size": (
                    [runtime_bbox[2] - runtime_bbox[0], runtime_bbox[3] - runtime_bbox[1]]
                    if runtime_bbox
                    else [0, 0]
                ),
            }
            record["technical"]["automated_checks"]["valid_foot_anchor"] = (
                record["foot_anchor"] is not None
            )
            record["technical"]["automated_checks"][
                "no_hidden_rgb_under_zero_alpha"
            ] = record["hidden_rgb"]["nonzero_rgb_count"] == 0
            record["technical"]["automated_technical_status"] = (
                "pass"
                if all(record["technical"]["automated_checks"].values())
                else "fail"
            )
        except Exception as error:
            decode_failure_count += 1
            record["technical"] = {
                "decode_error": f"{type(error).__name__}: {error}",
                "automated_technical_status": "fail",
            }
        assets.append(record)

    technical_pass_count = sum(
        asset["technical"]["automated_technical_status"] == "pass"
        for asset in assets
    )
    return {
        "expected_count": len(targets),
        "found_count": len(present),
        "missing_count": len(missing),
        "technical_pass_count": technical_pass_count,
        "technical_failure_count": len(present) - technical_pass_count,
        "decode_failure_count": decode_failure_count,
        "missing": [_relative(path, root) for path in missing],
        "assets": assets,
    }


def _runtime_sprite(path: Path, size: tuple[int, int] = (180, 180)) -> Image.Image:
    """Render the entire source canvas at the exact runtime size."""

    with Image.open(path) as opened:
        rgba = opened.convert("RGBA")
        rgba.load()
    bbox = rgba.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"Empty alpha sprite: {path}")
    return rgba.resize(size, NEAREST)


def render_transparent_contact_sheet(root: Path, output: Path) -> None:
    """Render the exact 7x4 horizontal set on a transparent RGBA canvas."""

    targets = target_paths(root)
    missing = [path for path in targets if not path.is_file()]
    if missing:
        raise IncompleteHorizontalAssetsError(
            "Missing horizontal assets: " + ", ".join(_relative(path, root) for path in missing)
        )

    cell_width = 220
    cell_height = 220
    header_height = 40
    sheet = Image.new(
        "RGBA",
        (cell_width * len(POSES), header_height + cell_height * len(ACTORS)),
        (0, 0, 0, 0),
    )
    draw = ImageDraw.Draw(sheet)
    for column, pose in enumerate(POSES):
        draw.text((column * cell_width + 70, 14), pose, fill=(255, 255, 255, 255))

    for row, actor in enumerate(ACTORS):
        row_top = header_height + row * cell_height
        draw.text((8, row_top + 8), actor, fill=(255, 255, 255, 255))
        for column, pose in enumerate(POSES):
            path = root / "images" / "avatars" / actor / f"{pose}.png"
            sprite = _runtime_sprite(path)
            x = column * cell_width + (cell_width - sprite.width) // 2
            y = row_top + 205 - sprite.height
            sheet.alpha_composite(sprite, (x, y))

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def _movement_comparison_paths(root: Path) -> list[Path]:
    return [
        root / "images" / "avatars" / actor / f"{pose}.png"
        for actor in ACTORS
        for pose in MOVEMENT_COMPARISON_POSES
    ]


def render_movement_comparison_sheet(root: Path, output: Path) -> None:
    """Render a transparent 7x8 side/up/down comparison at true 180px scale."""

    required = _movement_comparison_paths(root)
    missing = [path for path in required if not path.is_file()]
    if missing:
        raise IncompleteHorizontalAssetsError(
            "Missing movement comparison assets: "
            + ", ".join(_relative(path, root) for path in missing)
        )

    cell_width = 220
    cell_height = 220
    header_height = 40
    sheet = Image.new(
        "RGBA",
        (
            cell_width * len(MOVEMENT_COMPARISON_POSES),
            header_height + cell_height * len(ACTORS),
        ),
        (0, 0, 0, 0),
    )
    draw = ImageDraw.Draw(sheet)
    for column, pose in enumerate(MOVEMENT_COMPARISON_POSES):
        draw.text((column * cell_width + 62, 14), pose, fill=(255, 255, 255, 255))

    for row, actor in enumerate(ACTORS):
        row_top = header_height + row * cell_height
        draw.text((8, row_top + 8), actor, fill=(255, 255, 255, 255))
        for column, pose in enumerate(MOVEMENT_COMPARISON_POSES):
            path = root / "images" / "avatars" / actor / f"{pose}.png"
            sprite = _runtime_sprite(path)
            x = column * cell_width + (cell_width - sprite.width) // 2
            y = row_top + 205 - sprite.height
            sheet.alpha_composite(sprite, (x, y))

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def _office_scene_preview(
    scene: Image.Image,
    sprite_path: Path,
    foot_target: tuple[int, int],
) -> Image.Image:
    """Render one full-canvas sprite at 180px and align its derived foot."""

    crop_width = 300
    crop_height = 220
    target_y_from_top = 185
    crop_box = (
        foot_target[0] - crop_width // 2,
        foot_target[1] - target_y_from_top,
        foot_target[0] + crop_width // 2,
        foot_target[1] - target_y_from_top + crop_height,
    )
    preview = scene.crop(crop_box).convert("RGBA")
    local_target = (crop_width // 2, target_y_from_top)
    with Image.open(sprite_path) as opened:
        rgba = opened.convert("RGBA")
        rgba.load()
    anchor = derive_foot_anchor(rgba.getchannel("A"))
    if anchor is None:
        raise ValueError(f"Empty alpha sprite: {sprite_path}")
    render = rgba.resize((180, 180), NEAREST)
    source_x, source_y = anchor["source"]
    destination = (
        round(local_target[0] - source_x * 180 / rgba.width),
        round(local_target[1] - source_y * 180 / rgba.height),
    )
    preview.alpha_composite(render, destination)
    return preview.convert("RGB")


def render_office_shell_composite(root: Path, output: Path) -> None:
    """Render all 28 assets in PM/Dev/QA route crops from office-shell."""

    targets = target_paths(root)
    missing = [path for path in targets if not path.is_file()]
    scene_path = root / "images" / "scene" / "office-shell.png"
    if not scene_path.is_file():
        missing.append(scene_path)
    if missing:
        raise IncompleteHorizontalAssetsError(
            "Missing office composite inputs: "
            + ", ".join(_relative(path, root) for path in missing)
        )

    with Image.open(scene_path) as opened:
        scene = opened.convert("RGB")
        scene.load()
    if scene.width < 1160 or scene.height < 780:
        raise ValueError(
            f"office-shell is too small for canonical route crops: {scene.size}"
        )

    cell_width = 300
    cell_height = 220
    header_height = 40
    sheet = Image.new(
        "RGB",
        (cell_width * len(POSES), header_height + cell_height * len(ACTORS)),
        (24, 28, 35),
    )
    draw = ImageDraw.Draw(sheet)
    for column, pose in enumerate(POSES):
        draw.text((column * cell_width + 100, 14), pose, fill=(255, 255, 255))

    for row, actor in enumerate(ACTORS):
        row_top = header_height + row * cell_height
        route = ACTOR_OFFICE_ROUTE[actor]
        foot_target = OFFICE_ROUTE_POSITIONS[route]
        for column, pose in enumerate(POSES):
            path = root / "images" / "avatars" / actor / f"{pose}.png"
            preview = _office_scene_preview(scene, path, foot_target)
            x = column * cell_width
            sheet.paste(preview, (x, row_top))
            draw.text((x + 5, row_top + 5), f"{actor} | {route}", fill=(255, 255, 255))

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def _resolve_cli_path(root: Path, supplied: Path | None, default: Path) -> Path:
    path = supplied if supplied is not None else default
    return path if path.is_absolute() else root / path


def _baseline_error(baseline_path: Path, root: Path, error: Exception) -> dict[str, Any]:
    return {
        "baseline_path": _relative(baseline_path, root),
        "expected_entry_count": None,
        "baseline_entry_count": 0,
        "entry_count_matches": False,
        "duplicate_paths": [],
        "target_overlap": [],
        "invalid_entries": [],
        "matched_count": 0,
        "missing": [],
        "modified": [],
        "unexpected_added_non_target": [],
        "non_target_change_count": None,
        "status": "fail",
        "error": f"{type(error).__name__}: {error}",
    }


def _render_evidence(
    root: Path,
    inventory: dict[str, Any],
    outputs: dict[str, Path],
) -> dict[str, dict[str, Any]]:
    renderers = {
        "transparent_contact_sheet": render_transparent_contact_sheet,
        "movement_comparison_sheet": render_movement_comparison_sheet,
        "office_shell_composite": render_office_shell_composite,
    }
    evidence: dict[str, dict[str, Any]] = {}
    if inventory["found_count"] != inventory["expected_count"]:
        for name, output in outputs.items():
            evidence[name] = {
                "path": _relative(output, root),
                "status": "skipped",
                "reason": "horizontal_target_set_incomplete",
            }
        return evidence

    for name, output in outputs.items():
        try:
            renderers[name](root, output)
            evidence[name] = {
                "path": _relative(output, root),
                "status": "pass",
            }
        except Exception as error:
            evidence[name] = {
                "path": _relative(output, root),
                "status": "fail",
                "error": f"{type(error).__name__}: {error}",
            }
    return evidence


def build_validation_report(
    root: Path,
    baseline_path: Path,
    *,
    expected_baseline_entries: int = 81,
    evidence_outputs: dict[str, Path] | None = None,
    manual_manifest_path: Path | None = None,
) -> dict[str, Any]:
    """Build automated evidence and optionally cross-check human sign-off."""

    root = root.resolve()
    inventory = validate_assets(root)
    try:
        baseline = verify_baseline(
            root,
            baseline_path,
            expected_entries=expected_baseline_entries,
        )
    except Exception as error:
        baseline = _baseline_error(baseline_path, root, error)

    evidence = (
        _render_evidence(root, inventory, evidence_outputs)
        if evidence_outputs is not None
        else {}
    )
    targets_pass = (
        inventory["found_count"] == inventory["expected_count"]
        and inventory["technical_pass_count"] == inventory["expected_count"]
        and inventory["technical_failure_count"] == 0
    )
    evidence_pass = bool(evidence) and all(
        record["status"] == "pass" for record in evidence.values()
    )
    automated_pass = targets_pass and baseline["status"] == "pass" and evidence_pass
    manual_review = (
        validate_manual_manifest(root, manual_manifest_path)
        if manual_manifest_path is not None
        else {
            "manifest_path": None,
            "expected_count": inventory["expected_count"],
            "record_count": 0,
            "passed_count": 0,
            "status": "not_assessed",
        }
    )
    manual_status = manual_review["status"]
    if automated_pass and manual_status == "pass":
        overall_status = "pass"
    elif automated_pass and manual_status == "not_assessed":
        overall_status = "automated_pass_manual_review_required"
    elif automated_pass:
        overall_status = "manual_review_fail"
    elif inventory["missing_count"]:
        overall_status = "incomplete"
    else:
        overall_status = "automated_fail"
    return {
        "schema_version": 1,
        "root": root.as_posix(),
        "summary": {
            "expected_target_count": inventory["expected_count"],
            "found_target_count": inventory["found_count"],
            "missing_target_count": inventory["missing_count"],
            "automated_technical_pass_count": inventory["technical_pass_count"],
            "automated_technical_failure_count": inventory["technical_failure_count"],
            "decode_failure_count": inventory["decode_failure_count"],
            "baseline_entry_count": baseline["baseline_entry_count"],
            "non_target_change_count": baseline["non_target_change_count"],
            "automated_status": "pass" if automated_pass else "fail",
            "manual_review_status": manual_status,
            "overall_status": overall_status,
        },
        "metric_definitions": {
            "runtime_180": "entire source canvas resized to 180x180 with nearest-neighbor resampling",
            "foot_anchor": "stable bottom-center anchor derived at alpha>=64",
            "non_target_change_count": "missing or SHA-modified baseline files plus added PNGs outside the exact 28-target whitelist",
            "manual_review_boundary": "identity, direction, action semantics, prohibited content, and scene fit require human assessment",
        },
        "targets": inventory,
        "baseline": baseline,
        "evidence": evidence,
        "manual_review": manual_review,
    }


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=PROJECT_ROOT)
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--json", type=Path)
    parser.add_argument("--transparent-sheet", type=Path)
    parser.add_argument("--movement-sheet", type=Path)
    parser.add_argument("--office-composite", type=Path)
    parser.add_argument(
        "--manual-manifest",
        type=Path,
        help="Cross-check explicit 28-asset human sign-off and final hashes",
    )
    parser.add_argument("--expected-baseline-entries", type=int, default=81)
    parser.add_argument(
        "--require-complete",
        action="store_true",
        help="Exit 2 unless every automated target, baseline, and evidence gate passes",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = args.root.resolve()
    baseline = _resolve_cli_path(
        root,
        args.baseline,
        PLANNING_DIRECTORY / "baseline-sha256.csv",
    )
    json_output = _resolve_cli_path(
        root,
        args.json,
        PLANNING_DIRECTORY / "horizontal-validation.json",
    )
    evidence_outputs = {
        "transparent_contact_sheet": _resolve_cli_path(
            root,
            args.transparent_sheet,
            PLANNING_DIRECTORY / "horizontal-transparent-contact-sheet.png",
        ),
        "movement_comparison_sheet": _resolve_cli_path(
            root,
            args.movement_sheet,
            PLANNING_DIRECTORY / "horizontal-movement-comparison-sheet.png",
        ),
        "office_shell_composite": _resolve_cli_path(
            root,
            args.office_composite,
            PLANNING_DIRECTORY / "horizontal-office-shell-composite.png",
        ),
    }
    report = build_validation_report(
        root,
        baseline,
        expected_baseline_entries=args.expected_baseline_entries,
        evidence_outputs=evidence_outputs,
        manual_manifest_path=(
            _resolve_cli_path(root, args.manual_manifest, args.manual_manifest)
            if args.manual_manifest is not None
            else None
        ),
    )
    _write_json(json_output, report)
    print(f"json={json_output.resolve()}")
    print("summary=" + json.dumps(report["summary"], separators=(",", ":")))
    if args.require_complete:
        required_status = (
            report["summary"]["overall_status"] == "pass"
            if args.manual_manifest is not None
            else report["summary"]["automated_status"] == "pass"
        )
        if not required_status:
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
