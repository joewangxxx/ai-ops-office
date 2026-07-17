from __future__ import annotations

import csv
import hashlib
import json
import shutil
import unittest
from unittest.mock import patch
from tempfile import TemporaryDirectory
from pathlib import Path

from PIL import Image, ImageDraw


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _write_baseline(path: Path, rows: list[tuple[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=("path", "sha256", "bytes", "last_write_utc"),
        )
        writer.writeheader()
        for relative_path, digest in rows:
            writer.writerow(
                {
                    "path": relative_path,
                    "sha256": digest,
                    "bytes": 0,
                    "last_write_utc": "2026-07-16T00:00:00Z",
                }
            )


class HorizontalTargetContractTests(unittest.TestCase):
    def test_target_paths_are_the_exact_28_file_whitelist(self) -> None:
        from tools.validate_horizontal_avatar_assets import target_paths

        root = Path("C:/workspace")
        actual = [path.as_posix() for path in target_paths(root)]
        actors = ("Alice", "Bob", "Jack", "Kara", "Leo", "Quinn", "Rita")
        poses = ("walk-left", "walk-right", "carry-left", "carry-right")
        expected = [
            (root / "images" / "avatars" / actor / f"{pose}.png").as_posix()
            for actor in actors
            for pose in poses
        ]

        self.assertEqual(actual, expected)
        self.assertEqual(len(actual), 28)
        self.assertEqual(len(set(actual)), 28)

    def test_validate_assets_reports_found_missing_and_real_technical_analysis(self) -> None:
        from tools.validate_horizontal_avatar_assets import validate_assets

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            asset = root / "images" / "avatars" / "Alice" / "walk-left.png"
            asset.parent.mkdir(parents=True)
            image = Image.new("RGBA", (1254, 1254), (0, 0, 0, 0))
            draw = ImageDraw.Draw(image)
            draw.rectangle((500, 250, 750, 1000), fill=(40, 50, 70, 255))
            image.save(asset)

            report = validate_assets(root)

        self.assertEqual(report["expected_count"], 28)
        self.assertEqual(report["found_count"], 1)
        self.assertEqual(report["missing_count"], 27)
        self.assertEqual(report["technical_pass_count"], 1)
        self.assertEqual(report["assets"][0]["path"], "images/avatars/Alice/walk-left.png")
        self.assertEqual(report["assets"][0]["technical"]["automated_technical_status"], "pass")

    def test_validate_assets_records_foot_anchor_and_actual_180_render_metrics(self) -> None:
        from tools.validate_horizontal_avatar_assets import validate_assets

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            asset = root / "images" / "avatars" / "Alice" / "walk-left.png"
            asset.parent.mkdir(parents=True)
            image = Image.new("RGBA", (1254, 1254), (0, 0, 0, 0))
            ImageDraw.Draw(image).rectangle((500, 250, 750, 1000), fill=(40, 50, 70, 255))
            image.save(asset)

            record = validate_assets(root)["assets"][0]

        self.assertEqual(record["foot_anchor"]["source"], [625.0, 1000])
        self.assertEqual(record["runtime_180"]["canvas_size"], [180, 180])
        self.assertEqual(record["runtime_180"]["visible_bbox"], [72, 36, 108, 144])
        self.assertEqual(record["runtime_180"]["visible_size"], [36, 108])

    def test_validate_assets_rejects_hidden_rgb_under_zero_alpha(self) -> None:
        from tools.validate_horizontal_avatar_assets import validate_assets

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            asset = root / "images" / "avatars" / "Alice" / "walk-left.png"
            asset.parent.mkdir(parents=True)
            image = Image.new("RGBA", (1254, 1254), (0, 255, 0, 0))
            ImageDraw.Draw(image).rectangle((500, 250, 750, 1000), fill=(40, 50, 70, 255))
            image.save(asset)

            record = validate_assets(root)["assets"][0]

        self.assertGreater(record["hidden_rgb"]["nonzero_rgb_count"], 0)
        self.assertGreater(record["hidden_rgb"]["green_like_count"], 0)
        self.assertFalse(
            record["technical"]["automated_checks"]["no_hidden_rgb_under_zero_alpha"]
        )
        self.assertEqual(record["technical"]["automated_technical_status"], "fail")

    def test_validate_assets_keeps_corrupt_targets_in_the_inventory(self) -> None:
        from tools.validate_horizontal_avatar_assets import validate_assets

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            asset = root / "images" / "avatars" / "Alice" / "walk-left.png"
            asset.parent.mkdir(parents=True)
            asset.write_bytes(b"not a png")

            report = validate_assets(root)

        self.assertEqual(report["found_count"], 1)
        self.assertEqual(report["technical_pass_count"], 0)
        self.assertEqual(report["technical_failure_count"], 1)
        self.assertEqual(report["decode_failure_count"], 1)
        self.assertEqual(report["assets"][0]["technical"]["automated_technical_status"], "fail")
        self.assertIn("decode_error", report["assets"][0]["technical"])

    def test_transparent_contact_sheet_refuses_an_incomplete_set(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            IncompleteHorizontalAssetsError,
            render_transparent_contact_sheet,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            with self.assertRaises(IncompleteHorizontalAssetsError):
                render_transparent_contact_sheet(root, root / "sheet.png")

    def test_transparent_contact_sheet_renders_exact_7_by_4_grid(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            render_transparent_contact_sheet,
            target_paths,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            for index, asset in enumerate(target_paths(root)):
                asset.parent.mkdir(parents=True, exist_ok=True)
                if index == 0:
                    image = Image.new("RGBA", (1254, 1254), (0, 0, 0, 0))
                    ImageDraw.Draw(image).rectangle(
                        (500, 250, 750, 1000), fill=(index + 1, 80, 140, 255)
                    )
                else:
                    image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
                    ImageDraw.Draw(image).rectangle(
                        (10, 4, 21, 27), fill=(index + 1, 80, 140, 255)
                    )
                image.save(asset)
            output = root / "sheet.png"

            render_transparent_contact_sheet(root, output)

            with Image.open(output) as rendered:
                rendered.load()
                self.assertEqual(rendered.mode, "RGBA")
                self.assertEqual(rendered.size, (880, 1580))
                self.assertEqual(rendered.getpixel((0, 0))[3], 0)
                first_sprite_color = (1, 80, 140, 255)
                matching = [
                    (x, y)
                    for y in range(40, 260)
                    for x in range(0, 220)
                    if rendered.getpixel((x, y)) == first_sprite_color
                ]
                self.assertTrue(matching)
                xs = [point[0] for point in matching]
                ys = [point[1] for point in matching]
                self.assertLessEqual(max(xs) - min(xs) + 1, 70)
                self.assertLessEqual(max(ys) - min(ys) + 1, 140)

    def test_movement_comparison_sheet_refuses_missing_up_down_references(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            IncompleteHorizontalAssetsError,
            render_movement_comparison_sheet,
            target_paths,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            for asset in target_paths(root):
                asset.parent.mkdir(parents=True, exist_ok=True)
                image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
                ImageDraw.Draw(image).rectangle((10, 4, 21, 27), fill=(80, 90, 100, 255))
                image.save(asset)

            with self.assertRaises(IncompleteHorizontalAssetsError):
                render_movement_comparison_sheet(root, root / "movement.png")

    def test_movement_comparison_sheet_renders_exact_7_by_8_grid(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            ACTORS,
            MOVEMENT_COMPARISON_POSES,
            render_movement_comparison_sheet,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            for actor_index, actor in enumerate(ACTORS):
                for pose_index, pose in enumerate(MOVEMENT_COMPARISON_POSES):
                    asset = root / "images" / "avatars" / actor / f"{pose}.png"
                    asset.parent.mkdir(parents=True, exist_ok=True)
                    image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
                    ImageDraw.Draw(image).rectangle(
                        (10, 4, 21, 27),
                        fill=(actor_index + 1, pose_index + 1, 140, 255),
                    )
                    image.save(asset)
            output = root / "movement.png"

            render_movement_comparison_sheet(root, output)

            with Image.open(output) as rendered:
                rendered.load()
                self.assertEqual(rendered.mode, "RGBA")
                self.assertEqual(rendered.size, (1760, 1580))
                self.assertEqual(rendered.getpixel((0, 0))[3], 0)

    def test_office_composite_declares_pm_dev_and_qa_route_positions(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            ACTOR_OFFICE_ROUTE,
            OFFICE_ROUTE_POSITIONS,
        )

        self.assertEqual(set(OFFICE_ROUTE_POSITIONS), {"PM-to-Hub", "Dev-to-Hub", "QA-to-Hub"})
        self.assertEqual(
            {ACTOR_OFFICE_ROUTE[actor] for actor in ("Alice", "Bob")},
            {"PM-to-Hub"},
        )
        self.assertEqual(
            {ACTOR_OFFICE_ROUTE[actor] for actor in ("Jack", "Kara", "Leo")},
            {"Dev-to-Hub"},
        )
        self.assertEqual(
            {ACTOR_OFFICE_ROUTE[actor] for actor in ("Quinn", "Rita")},
            {"QA-to-Hub"},
        )

    def test_office_composite_renders_all_28_assets_at_true_180_scale(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            render_office_shell_composite,
            target_paths,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            scene = root / "images" / "scene" / "office-shell.png"
            scene.parent.mkdir(parents=True)
            Image.new("RGB", (1672, 941), (25, 35, 45)).save(scene)
            for index, asset in enumerate(target_paths(root)):
                asset.parent.mkdir(parents=True, exist_ok=True)
                image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
                ImageDraw.Draw(image).rectangle(
                    (10, 4, 21, 27),
                    fill=(index + 1, 110, 160, 255),
                )
                image.save(asset)
            output = root / "office.png"

            render_office_shell_composite(root, output)

            with Image.open(output) as rendered:
                rendered.load()
                self.assertEqual(rendered.mode, "RGB")
                self.assertEqual(rendered.size, (1200, 1580))
                pixels = set(rendered.get_flattened_data())
                for index in range(28):
                    self.assertIn((index + 1, 110, 160), pixels)

    def test_verify_baseline_counts_only_non_target_changes(self) -> None:
        from tools.validate_horizontal_avatar_assets import verify_baseline

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            unchanged = root / "images" / "reference" / "unchanged.png"
            modified = root / "images" / "reference" / "modified.png"
            unchanged.parent.mkdir(parents=True)
            unchanged.write_bytes(b"unchanged")
            modified.write_bytes(b"current modified bytes")
            target = root / "images" / "avatars" / "Alice" / "walk-left.png"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"new target is allowed")
            unexpected = root / "images" / "reference" / "unexpected.png"
            unexpected.write_bytes(b"unexpected non-target")
            baseline = root / "baseline-sha256.csv"
            _write_baseline(
                baseline,
                [
                    ("images/reference/unchanged.png", _sha256(unchanged)),
                    ("images/reference/modified.png", hashlib.sha256(b"original").hexdigest()),
                    ("images/reference/missing.png", hashlib.sha256(b"missing").hexdigest()),
                ],
            )

            report = verify_baseline(root, baseline, expected_entries=3)

        self.assertEqual(report["baseline_entry_count"], 3)
        self.assertEqual(report["matched_count"], 1)
        self.assertEqual(report["missing"], ["images/reference/missing.png"])
        self.assertEqual(
            [record["path"] for record in report["modified"]],
            ["images/reference/modified.png"],
        )
        self.assertEqual(
            report["unexpected_added_non_target"],
            ["images/reference/unexpected.png"],
        )
        self.assertEqual(report["non_target_change_count"], 3)
        self.assertEqual(report["status"], "fail")

    def test_verify_baseline_rejects_duplicate_rows_and_target_overlap(self) -> None:
        from tools.validate_horizontal_avatar_assets import verify_baseline

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            target = root / "images" / "avatars" / "Alice" / "walk-left.png"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"target")
            digest = _sha256(target)
            baseline = root / "baseline-sha256.csv"
            _write_baseline(
                baseline,
                [
                    ("images/avatars/Alice/walk-left.png", digest),
                    ("images/avatars/Alice/walk-left.png", digest),
                ],
            )

            report = verify_baseline(root, baseline, expected_entries=2)

        self.assertEqual(report["duplicate_paths"], ["images/avatars/Alice/walk-left.png"])
        self.assertEqual(report["target_overlap"], ["images/avatars/Alice/walk-left.png"])
        self.assertEqual(report["status"], "fail")

    def test_verify_baseline_rejects_non_image_paths_and_invalid_digests(self) -> None:
        from tools.validate_horizontal_avatar_assets import verify_baseline

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            non_image = root / "docs" / "not-an-image.txt"
            non_image.parent.mkdir(parents=True)
            non_image.write_bytes(b"text")
            image = root / "images" / "reference" / "invalid-hash.png"
            image.parent.mkdir(parents=True)
            image.write_bytes(b"png-shaped-path")
            baseline = root / "baseline-sha256.csv"
            _write_baseline(
                baseline,
                [
                    ("docs/not-an-image.txt", _sha256(non_image)),
                    ("images/reference/invalid-hash.png", "not-a-sha256"),
                ],
            )

            report = verify_baseline(root, baseline, expected_entries=2)

        self.assertEqual(
            report["invalid_entries"],
            [
                {
                    "path": "docs/not-an-image.txt",
                    "reasons": ["path_must_be_images_png"],
                },
                {
                    "path": "images/reference/invalid-hash.png",
                    "reasons": ["invalid_sha256"],
                },
            ],
        )
        self.assertEqual(report["status"], "fail")

    def test_cli_writes_default_json_before_failing_strict_incomplete_gate(self) -> None:
        from tools.validate_horizontal_avatar_assets import main

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            baseline = (
                root
                / ".planning"
                / "2026-07-16-avatar-horizontal-generation"
                / "baseline-sha256.csv"
            )
            _write_baseline(baseline, [])

            exit_code = main(
                [
                    "--root",
                    str(root),
                    "--expected-baseline-entries",
                    "0",
                    "--require-complete",
                ]
            )

            output = baseline.with_name("horizontal-validation.json")
            report = json.loads(output.read_text(encoding="utf-8"))

        self.assertEqual(exit_code, 2)
        self.assertEqual(report["summary"]["missing_target_count"], 28)
        self.assertEqual(report["summary"]["automated_status"], "fail")
        self.assertEqual(report["summary"]["manual_review_status"], "not_assessed")
        self.assertEqual(report["evidence"]["transparent_contact_sheet"]["status"], "skipped")

    def test_cli_strict_gate_writes_json_and_all_three_evidence_images(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            ACTORS,
            main,
            target_paths,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source = root / "source.png"
            image = Image.new("RGBA", (1254, 1254), (0, 0, 0, 0))
            ImageDraw.Draw(image).rectangle((500, 250, 750, 1000), fill=(40, 50, 70, 255))
            image.save(source)
            for asset in target_paths(root):
                asset.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, asset)

            non_target_assets: list[Path] = []
            for actor in ACTORS:
                for pose in ("walk-up", "walk-down", "carry-up", "carry-down"):
                    asset = root / "images" / "avatars" / actor / f"{pose}.png"
                    asset.parent.mkdir(parents=True, exist_ok=True)
                    reference = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
                    ImageDraw.Draw(reference).rectangle((10, 4, 21, 27), fill=(80, 90, 100, 255))
                    reference.save(asset)
                    non_target_assets.append(asset)
            scene = root / "images" / "scene" / "office-shell.png"
            scene.parent.mkdir(parents=True)
            Image.new("RGB", (1672, 941), (25, 35, 45)).save(scene)
            non_target_assets.append(scene)

            planning = root / ".planning" / "2026-07-16-avatar-horizontal-generation"
            baseline = planning / "baseline-sha256.csv"
            _write_baseline(
                baseline,
                [
                    (asset.relative_to(root).as_posix(), _sha256(asset))
                    for asset in non_target_assets
                ],
            )

            exit_code = main(
                [
                    "--root",
                    str(root),
                    "--expected-baseline-entries",
                    str(len(non_target_assets)),
                    "--require-complete",
                ]
            )

            report = json.loads(
                (planning / "horizontal-validation.json").read_text(encoding="utf-8")
            )
            evidence_files_exist = [
                (root / record["path"]).is_file()
                for record in report["evidence"].values()
            ]

        self.assertEqual(exit_code, 0)
        self.assertEqual(report["summary"]["found_target_count"], 28)
        self.assertEqual(report["summary"]["automated_technical_pass_count"], 28)
        self.assertEqual(report["summary"]["non_target_change_count"], 0)
        self.assertEqual(report["summary"]["automated_status"], "pass")
        self.assertEqual(report["summary"]["manual_review_status"], "not_assessed")
        self.assertEqual(
            {record["status"] for record in report["evidence"].values()},
            {"pass"},
        )
        self.assertEqual(evidence_files_exist, [True, True, True])

    def test_validate_manual_manifest_requires_exact_28_passed_hash_matched_assets(self) -> None:
        from tools.validate_horizontal_avatar_assets import (
            target_paths,
            validate_manual_manifest,
        )

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            assets = []
            for target in target_paths(root):
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(target.as_posix().encode("utf-8"))
                relative = target.relative_to(root).as_posix()
                assets.append(
                    {
                        "target_path": relative,
                        "status": "promoted",
                        "manual_qa": {
                            "status": "pass",
                            "identity": "pass",
                            "direction": "pass",
                            "action": "pass",
                            "hands_props": "pass",
                            "badge_visibility": "pass",
                            "no_extras_or_shadow": "pass",
                            "independent_not_mirrored": "pass",
                        },
                        "group_qa": {
                            "status": "pass",
                            "actual_180_status": "pass",
                            "scene_status": "pass",
                        },
                        "promotion": {
                            "status": "promoted",
                            "candidate_final_hash_match": True,
                        },
                        "final": {"sha256": _sha256(target)},
                    }
                )
            manifest = root / "asset-status-manifest.json"
            manifest.write_text(json.dumps({"assets": assets}), encoding="utf-8")

            report = validate_manual_manifest(root, manifest)

        self.assertEqual(report["status"], "pass")
        self.assertEqual(report["expected_count"], 28)
        self.assertEqual(report["passed_count"], 28)
        self.assertEqual(report["errors"], [])

    def test_validate_manual_manifest_rejects_duplicate_missing_and_stale_hash(self) -> None:
        from tools.validate_horizontal_avatar_assets import validate_manual_manifest

        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            target = root / "images" / "avatars" / "Alice" / "walk-left.png"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"current")
            record = {
                "target_path": "images/avatars/Alice/walk-left.png",
                "status": "promoted",
                "manual_qa": {"status": "pass"},
                "group_qa": {
                    "status": "pass",
                    "actual_180_status": "pass",
                    "scene_status": "pass",
                },
                "promotion": {
                    "status": "promoted",
                    "candidate_final_hash_match": True,
                },
                "final": {"sha256": hashlib.sha256(b"stale").hexdigest()},
            }
            manifest = root / "asset-status-manifest.json"
            manifest.write_text(
                json.dumps({"assets": [record, record]}),
                encoding="utf-8",
            )

            report = validate_manual_manifest(root, manifest)

        self.assertEqual(report["status"], "fail")
        self.assertIn("images/avatars/Alice/walk-left.png", report["duplicate_paths"])
        self.assertEqual(len(report["missing_paths"]), 27)
        self.assertTrue(
            any(error["reason"] == "final_sha256_mismatch" for error in report["errors"])
        )

    def test_build_validation_report_merges_passed_manual_manifest(self) -> None:
        from tools.validate_horizontal_avatar_assets import build_validation_report

        inventory = {
            "expected_count": 28,
            "found_count": 28,
            "missing_count": 0,
            "technical_pass_count": 28,
            "technical_failure_count": 0,
            "decode_failure_count": 0,
            "missing": [],
            "assets": [],
        }
        baseline = {
            "baseline_entry_count": 81,
            "non_target_change_count": 0,
            "status": "pass",
        }
        evidence = {
            "transparent_contact_sheet": {"status": "pass"},
            "movement_comparison_sheet": {"status": "pass"},
            "office_shell_composite": {"status": "pass"},
        }
        manual = {
            "expected_count": 28,
            "record_count": 28,
            "passed_count": 28,
            "missing_paths": [],
            "unexpected_paths": [],
            "duplicate_paths": [],
            "errors": [],
            "status": "pass",
        }
        with patch("tools.validate_horizontal_avatar_assets.validate_assets", return_value=inventory), patch(
            "tools.validate_horizontal_avatar_assets.verify_baseline", return_value=baseline
        ), patch(
            "tools.validate_horizontal_avatar_assets._render_evidence", return_value=evidence
        ), patch(
            "tools.validate_horizontal_avatar_assets.validate_manual_manifest", return_value=manual
        ):
            report = build_validation_report(
                Path("C:/workspace"),
                Path("C:/workspace/baseline.csv"),
                evidence_outputs={"unused": Path("unused")},
                manual_manifest_path=Path("C:/workspace/manifest.json"),
            )

        self.assertEqual(report["summary"]["automated_status"], "pass")
        self.assertEqual(report["summary"]["manual_review_status"], "pass")
        self.assertEqual(report["summary"]["overall_status"], "pass")
        self.assertEqual(report["manual_review"], manual)


if __name__ == "__main__":
    unittest.main()
