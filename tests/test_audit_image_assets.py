from __future__ import annotations

import io
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
from PIL import Image
import pytest

from tools import audit_image_assets as audit


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "tools" / "audit_image_assets.py"
SIZE = (12, 12)


def _png_bytes(
    *,
    mode: str = "RGBA",
    size: tuple[int, int] = SIZE,
    visible_box: tuple[int, int, int, int] | None = (4, 4, 8, 8),
    color: tuple[int, ...] | None = None,
    soft_alpha: int | None = None,
) -> bytes:
    if mode == "RGBA":
        image = Image.new(mode, size, (0, 0, 0, 0))
        if visible_box is not None:
            fill = color or (80, 90, 100, 255)
            image.paste(fill, visible_box)
            if soft_alpha is not None:
                pixels = np.array(image)
                visible = pixels[..., 3] > 0
                pixels[visible, 3] = soft_alpha
                image = Image.fromarray(pixels, mode="RGBA")
    else:
        image = Image.new(mode, size, color or (80, 90, 100))

    payload = io.BytesIO()
    image.save(payload, format="PNG")
    return payload.getvalue()


def _codes(result: audit.AssetAudit) -> set[str]:
    return {finding.code for finding in result.findings}


def _audit(
    payload: bytes,
    *,
    path: str = "images/avatars/Alice/walk-up.png",
    expected_mode: str = "RGBA",
    policy: str = "shadow_glow_forbidden",
) -> audit.AssetAudit:
    return audit.audit_asset_bytes(
        path,
        payload,
        expected_size=SIZE,
        expected_mode=expected_mode,
        max_bytes=1024 * 1024,
        policy=policy,
    )


def test_valid_rgba_asset_passes_all_hard_gates() -> None:
    result = _audit(_png_bytes())

    assert result.ok
    assert result.findings == ()
    assert result.metrics["visible_pixels"] == 16
    assert result.metrics["far_hidden_rgb_pixels"] == 0


@pytest.mark.parametrize(
    ("payload", "expected_code"),
    [
        (_png_bytes(visible_box=None), "alpha.empty"),
        (_png_bytes(visible_box=(0, 4, 4, 8)), "alpha.edge_contact"),
        (_png_bytes(color=(0, 255, 0, 255)), "color.visible_chroma_key"),
        (_png_bytes(size=(11, 12)), "png.dimensions"),
        (_png_bytes(mode="RGB"), "png.mode"),
    ],
)
def test_hard_pixel_and_png_contract_failures(
    payload: bytes, expected_code: str
) -> None:
    assert expected_code in _codes(_audit(payload))


def test_far_hidden_rgb_fails_but_two_pixel_halo_is_allowed() -> None:
    image = Image.open(io.BytesIO(_png_bytes())).convert("RGBA")
    pixels = np.array(image)
    pixels[4, 2] = (9, 8, 7, 0)  # Chebyshev distance 2 from the subject.
    pixels[0, 0] = (6, 5, 4, 0)  # Far transparent RGB.
    payload = io.BytesIO()
    Image.fromarray(pixels, mode="RGBA").save(payload, format="PNG")

    result = _audit(payload.getvalue())

    assert "transparent_rgb.far_nonzero" in _codes(result)
    assert result.metrics["far_hidden_rgb_pixels"] == 1
    assert result.metrics["protected_halo_rgb_pixels"] == 1


def test_compressed_size_budget_is_enforced() -> None:
    result = audit.audit_asset_bytes(
        "images/avatars/Alice/walk-up.png",
        _png_bytes(),
        expected_size=SIZE,
        expected_mode="RGBA",
        max_bytes=1,
        policy="shadow_glow_forbidden",
    )

    assert "file.compressed_budget" in _codes(result)


def test_rgb_scene_rejects_exact_visible_chroma_key() -> None:
    result = audit.audit_asset_bytes(
        "images/scene/office-shell.png",
        _png_bytes(mode="RGB", color=(0, 255, 0)),
        expected_size=SIZE,
        expected_mode="RGB",
        max_bytes=1024 * 1024,
        policy="opaque_scene",
    )

    assert "color.visible_chroma_key" in _codes(result)


def test_category_policies_are_explicit_and_do_not_waive_hard_rules() -> None:
    soft = _png_bytes(soft_alpha=127)

    forbidden = _audit(soft, policy="shadow_glow_forbidden")
    contact = _audit(soft, policy="contact_shadow_allowed")
    glow = _audit(soft, path="images/orb/orb_blue.png", policy="glow_allowed")

    assert "policy.partial_alpha_fraction" in _codes(forbidden)
    assert "policy.partial_alpha_fraction" in _codes(contact)
    assert "policy.partial_alpha_fraction" in _codes(glow)
    assert forbidden.policy_limit == pytest.approx(0.03)
    assert contact.policy_limit == pytest.approx(0.10)
    assert glow.policy_limit == pytest.approx(0.20)

    green_glow = _audit(
        _png_bytes(color=(0, 255, 0, 127)),
        path="images/orb/orb_blue.png",
        policy="glow_allowed",
    )
    assert "color.visible_chroma_key" in _codes(green_glow)


def test_policy_threshold_allows_small_partial_alpha_fraction() -> None:
    image = Image.open(io.BytesIO(_png_bytes())).convert("RGBA")
    pixels = np.array(image)
    pixels[4, 4, 3] = 127
    payload = io.BytesIO()
    Image.fromarray(pixels, mode="RGBA").save(payload, format="PNG")

    assert _audit(payload.getvalue(), policy="contact_shadow_allowed").ok


def test_duplicate_sha_is_a_repository_failure(tmp_path: Path) -> None:
    payload = _png_bytes()
    result_a = _audit(payload, path="images/avatars/Alice/walk-up.png")
    result_b = _audit(payload, path="images/avatars/Bob/walk-up.png")

    findings = audit.duplicate_sha_findings([result_a, result_b])

    assert len(findings) == 2
    assert {finding.code for finding in findings} == {"sha.duplicate"}
    assert {finding.path for finding in findings} == {
        "images/avatars/Alice/walk-up.png",
        "images/avatars/Bob/walk-up.png",
    }


def test_layout_collector_rejects_duplicate_and_noncanonical_paths() -> None:
    duplicate = {"a": {"path": "images/orb/orb_blue.png"}, "b": {"path": "images/orb/orb_blue.png"}}
    invalid = {"a": {"path": "../escape.png"}}

    with pytest.raises(audit.AuditError, match="duplicate"):
        audit.collect_registered_paths(duplicate)
    with pytest.raises(audit.AuditError, match="canonical"):
        audit.collect_registered_paths(invalid)


def _write_fixture_repository(root: Path, *, duplicate: bool = False) -> Path:
    scene = root / "images" / "scene" / "office-shell.png"
    avatar = root / "images" / "avatars" / "Alice" / "walk-up.png"
    scene.parent.mkdir(parents=True)
    avatar.parent.mkdir(parents=True)
    scene.write_bytes(_png_bytes(mode="RGB", size=(16, 9)))
    avatar.write_bytes(scene.read_bytes() if duplicate else _png_bytes(size=(12, 12)))
    layout = {
        "scene": {"path": "images/scene/office-shell.png"},
        "assetAnchors": {"avatars": {"byActor": {"Alice": {"walkUp": {"path": "images/avatars/Alice/walk-up.png"}}}}},
    }
    layout_path = root / "docs" / "office-layout.json"
    layout_path.parent.mkdir(parents=True)
    layout_path.write_text(json.dumps(layout), encoding="utf-8")
    return layout_path


def test_repository_audit_detects_unregistered_disk_png(tmp_path: Path) -> None:
    layout_path = _write_fixture_repository(tmp_path)
    extra = tmp_path / "images" / "orb" / "extra.png"
    extra.parent.mkdir(parents=True)
    extra.write_bytes(_png_bytes())

    report = audit.audit_repository(
        tmp_path,
        layout_path,
        expected_count=2,
        contracts={
            "scene": audit.CategoryContract((16, 9), "RGB", 1024 * 1024),
            "avatars": audit.CategoryContract((12, 12), "RGBA", 1024 * 1024),
        },
    )

    assert report["status"] == "fail"
    assert any(item["code"] == "registry.unregistered_disk_asset" for item in report["findings"])


def test_cli_writes_structured_failure_report(tmp_path: Path) -> None:
    layout_path = _write_fixture_repository(tmp_path)
    report_path = tmp_path / "audit.json"

    completed = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--root",
            str(tmp_path),
            "--layout",
            str(layout_path.relative_to(tmp_path)),
            "--json",
            str(report_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    report = json.loads(report_path.read_text(encoding="utf-8"))
    assert completed.returncode == 1
    assert report["status"] == "fail"
    assert any(item["code"] == "registry.asset_count" for item in report["findings"])
