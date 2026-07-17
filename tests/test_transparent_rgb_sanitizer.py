from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import zlib

from PIL import Image
import pytest

from tools import sanitize_transparent_rgb as sanitizer


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "tools" / "sanitize_transparent_rgb.py"
LIVE_SIZE = (1254, 1254)
AUDITED_MANIFEST = (
    REPO_ROOT
    / ".planning"
    / "2026-07-15-images-full-audit"
    / "scheme-a-runs"
    / "20260716T021944950Z-dry-run-b25ec340"
    / "manifest.json"
)


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _write_live_png(
    path: Path,
    *,
    mode: str = "RGBA",
    size: tuple[int, int] = LIVE_SIZE,
    background: tuple[int, ...] | None = None,
    marker_x: int = 627,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if background is None:
        background = (19, 23, 29, 0) if mode == "RGBA" else (19, 23, 29)
    image = Image.new(mode, size, background)
    if mode == "RGBA" and size == LIVE_SIZE:
        image.putpixel((marker_x, 627), (101, 102, 103, 255))
    image.save(path, format="PNG")


def _write_manifest(
    path: Path,
    root: Path,
    relative_paths: list[str],
    *,
    hashes: dict[str, str] | None = None,
) -> dict[str, object]:
    targets = []
    for relative_path in relative_paths:
        digest = (hashes or {}).get(relative_path)
        if digest is None:
            digest = _sha256(root / Path(*relative_path.split("/")))
        targets.append({"path": relative_path, "sha256": digest})
    manifest: dict[str, object] = {"schema_version": 1, "targets": targets}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def _synthetic_scope(manifest_path: Path):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return sanitizer._manifest_scope_from_entries(
        manifest["targets"], name="synthetic test scope"
    )


def _execute_synthetic(
    *, mode: str, root: Path, manifest_path: Path, run_dir: Path
) -> dict[str, object]:
    return sanitizer._execute_transaction(
        mode=mode,
        root=root,
        manifest_path=manifest_path,
        run_dir=run_dir,
        required_scope=_synthetic_scope(manifest_path),
    )


def _recover_synthetic(
    *, root: Path, manifest_path: Path, run_dir: Path
) -> dict[str, object]:
    return sanitizer._recover_transaction(
        root=root,
        manifest_path=manifest_path,
        run_dir=run_dir,
        required_scope=_synthetic_scope(manifest_path),
    )


def _insert_png_chunk(path: Path, chunk_type: bytes, payload: bytes) -> None:
    raw = path.read_bytes()
    assert raw[:8] == b"\x89PNG\r\n\x1a\n"
    ihdr_end = 8 + 4 + 4 + 13 + 4
    crc = zlib.crc32(chunk_type + payload) & 0xFFFFFFFF
    chunk = struct.pack(">I", len(payload)) + chunk_type + payload + struct.pack(">I", crc)
    path.write_bytes(raw[:ihdr_end] + chunk + raw[ihdr_end:])


def test_fixed_scope_fingerprint_matches_audited_manifest() -> None:
    manifest = json.loads(AUDITED_MANIFEST.read_text(encoding="utf-8"))

    actual = sanitizer._manifest_scope_from_entries(
        manifest["targets"], name="audited"
    )

    assert actual.count == sanitizer.FIXED_MANIFEST_SCOPE.count
    assert actual.fingerprint == sanitizer.FIXED_MANIFEST_SCOPE.fingerprint


@pytest.mark.parametrize("alpha", [1, 127, 254, 255])
def test_alpha_greater_than_zero_is_visible_and_chebyshev_radius_two_is_preserved(
    alpha: int,
) -> None:
    image = Image.new("RGBA", (9, 9), (10, 20, 30, 0))
    image.putpixel((4, 4), (90, 100, 110, alpha))

    result, metrics = sanitizer.sanitize_rgba(image)

    assert result.getpixel((4, 4)) == (90, 100, 110, alpha)
    assert result.getpixel((5, 4)) == (10, 20, 30, 0)  # offset 1
    assert result.getpixel((6, 4)) == (10, 20, 30, 0)  # offset 2
    assert result.getpixel((6, 6)) == (10, 20, 30, 0)  # offset (2, 2)
    assert result.getpixel((7, 4)) == (0, 0, 0, 0)  # offset 3
    assert metrics.visible_pixels == 1
    assert metrics.protected_transparent_pixels == 24
    assert metrics.pixels_cleared == 56


def test_multiple_visible_islands_protect_independent_halos() -> None:
    image = Image.new("RGBA", (13, 7), (7, 8, 9, 0))
    image.putpixel((2, 3), (1, 2, 3, 255))
    image.putpixel((10, 3), (4, 5, 6, 127))

    result, metrics = sanitizer.sanitize_rgba(image)

    assert result.getpixel((4, 5)) == (7, 8, 9, 0)
    assert result.getpixel((8, 1)) == (7, 8, 9, 0)
    assert result.getpixel((5, 3)) == (0, 0, 0, 0)
    assert result.getpixel((7, 3)) == (0, 0, 0, 0)
    assert metrics.visible_pixels == 2
    assert metrics.pixels_cleared > 0


def test_halo_clips_at_image_edges_without_wrapping() -> None:
    image = Image.new("RGBA", (5, 5), (11, 12, 13, 0))
    image.putpixel((0, 0), (21, 22, 23, 1))

    result, metrics = sanitizer.sanitize_rgba(image)

    assert result.getpixel((2, 2)) == (11, 12, 13, 0)
    assert result.getpixel((3, 0)) == (0, 0, 0, 0)
    assert result.getpixel((4, 4)) == (0, 0, 0, 0)
    assert metrics.protected_transparent_pixels == 8
    assert metrics.pixels_cleared == 16


def test_transparent_only_image_clears_every_nonzero_rgb_pixel() -> None:
    image = Image.new("RGBA", (4, 3), (40, 50, 60, 0))

    result, metrics = sanitizer.sanitize_rgba(image)

    assert result.tobytes() == Image.new("RGBA", (4, 3), (0, 0, 0, 0)).tobytes()
    assert metrics.visible_pixels == 0
    assert metrics.protected_transparent_pixels == 0
    assert metrics.pixels_cleared == 12


def test_opaque_only_image_is_byte_identical() -> None:
    image = Image.new("RGBA", (4, 3), (40, 50, 60, 255))

    result, metrics = sanitizer.sanitize_rgba(image)

    assert result.tobytes() == image.tobytes()
    assert metrics.visible_pixels == 12
    assert metrics.pixels_cleared == 0


def test_already_zero_far_transparency_is_unchanged() -> None:
    image = Image.new("RGBA", (7, 7), (0, 0, 0, 0))
    image.putpixel((3, 3), (1, 2, 3, 254))

    result, metrics = sanitizer.sanitize_rgba(image)

    assert result.tobytes() == image.tobytes()
    assert metrics.pixels_cleared == 0
    assert metrics.far_transparent_pixels == 24


def test_sanitization_is_idempotent() -> None:
    image = Image.new("RGBA", (9, 9), (30, 20, 10, 0))
    image.putpixel((4, 4), (1, 2, 3, 255))

    once, first_metrics = sanitizer.sanitize_rgba(image)
    twice, second_metrics = sanitizer.sanitize_rgba(once)

    assert first_metrics.pixels_cleared == 56
    assert twice.tobytes() == once.tobytes()
    assert second_metrics.pixels_cleared == 0


def test_sanitize_rgba_rejects_non_rgba_and_invalid_radius() -> None:
    with pytest.raises(sanitizer.SanitizeError, match="RGBA"):
        sanitizer.sanitize_rgba(Image.new("RGB", (3, 3)))
    with pytest.raises(sanitizer.SanitizeError, match="radius"):
        sanitizer.sanitize_rgba(Image.new("RGBA", (3, 3)), radius=-1)


@pytest.mark.parametrize(
    ("mode", "size", "message"),
    [("RGB", LIVE_SIZE, "RGBA"), ("RGBA", (1253, 1254), "1254x1254")],
)
def test_live_transaction_rejects_wrong_mode_or_dimensions(
    tmp_path: Path,
    mode: str,
    size: tuple[int, int],
    message: str,
) -> None:
    root = tmp_path / "repo"
    relative = "images/bad.png"
    source = root / "images" / "bad.png"
    _write_live_png(source, mode=mode, size=size)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative])

    with pytest.raises(sanitizer.SanitizeError, match=message):
        _execute_synthetic(
            mode="dry-run",
            root=root,
            manifest_path=manifest,
            run_dir=root / "runs" / "bad-live-input",
        )


@pytest.mark.parametrize("relative", ["../outside.png", "images/../outside.png", "/outside.png"])
def test_manifest_path_escape_is_rejected(tmp_path: Path, relative: str) -> None:
    root = tmp_path / "repo"
    root.mkdir()
    outside = tmp_path / "outside.png"
    _write_live_png(outside)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [], hashes={})
    manifest.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "targets": [{"path": relative, "sha256": _sha256(outside)}],
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(sanitizer.SanitizeError, match="path"):
        _execute_synthetic(
            mode="dry-run",
            root=root,
            manifest_path=manifest,
            run_dir=root / "runs" / "escape",
        )


def test_symlink_or_junction_target_is_rejected(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    actual_directory = tmp_path / "outside-assets"
    actual = actual_directory / "actual.png"
    link = root / "images" / "linked"
    _write_live_png(actual)
    link.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.symlink(actual_directory, link, target_is_directory=True)
    except (OSError, NotImplementedError):
        if os.name != "nt":
            pytest.fail("directory symlink creation unexpectedly failed")
        completed = subprocess.run(
            ["cmd", "/c", "mklink", "/J", str(link), str(actual_directory)],
            capture_output=True,
            text=True,
            check=False,
        )
        assert completed.returncode == 0, completed.stderr
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, ["images/linked/actual.png"])

    with pytest.raises(sanitizer.SanitizeError, match="symlink"):
        _execute_synthetic(
            mode="dry-run",
            root=root,
            manifest_path=manifest,
            run_dir=root / "runs" / "symlink",
        )


def test_source_hash_mismatch_fails_before_candidate_generation(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    relative = "images/source.png"
    source = root / "images" / "source.png"
    _write_live_png(source)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative], hashes={relative: "0" * 64})
    run_dir = root / "runs" / "hash-mismatch"

    with pytest.raises(sanitizer.SanitizeError, match="hash mismatch"):
        _execute_synthetic(
            mode="dry-run", root=root, manifest_path=manifest, run_dir=run_dir
        )

    assert not (run_dir / "candidate" / "images" / "source.png").exists()


def test_unexpected_png_chunk_is_rejected_fail_closed(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    relative = "images/metadata.png"
    source = root / "images" / "metadata.png"
    _write_live_png(source)
    _insert_png_chunk(source, b"tEXt", b"comment\x00not allowed")
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative])

    with pytest.raises(sanitizer.SanitizeError, match="PNG chunk"):
        _execute_synthetic(
            mode="dry-run",
            root=root,
            manifest_path=manifest,
            run_dir=root / "runs" / "chunk",
        )


def test_dry_run_redecodes_candidates_and_never_changes_sources(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    relative = "images/source.png"
    source = root / "images" / "source.png"
    _write_live_png(source)
    source_image = Image.open(source).copy()
    for index, alpha in enumerate((1, 127, 254, 255)):
        source_image.putpixel((620 + index, 627), (70 + index, 80, 90, alpha))
    source_image.save(source, format="PNG")
    before_bytes = source.read_bytes()
    before_hash = _sha256(source)
    manifest_path = root / "input-manifest.json"
    expected_manifest = _write_manifest(manifest_path, root, [relative])
    run_dir = root / "runs" / "dry-run"

    report = _execute_synthetic(
        mode="dry-run", root=root, manifest_path=manifest_path, run_dir=run_dir
    )

    candidate_path = run_dir / "candidate" / "images" / "source.png"
    with Image.open(candidate_path) as opened:
        candidate = opened.copy()
    with Image.open(source) as opened:
        source_after = opened.copy()
    source_alpha = source_image.getchannel("A")
    candidate_alpha = candidate.getchannel("A")
    visible = [i for i, value in enumerate(source_alpha.getdata()) if value > 0]
    source_pixels = list(source_image.getdata())
    candidate_pixels = list(candidate.getdata())

    assert source.read_bytes() == before_bytes
    assert _sha256(source) == before_hash
    assert source_after.tobytes() == source_image.tobytes()
    assert candidate_alpha.tobytes() == source_alpha.tobytes()
    assert [candidate_pixels[i] for i in visible] == [source_pixels[i] for i in visible]
    assert candidate.getpixel((0, 0)) == (0, 0, 0, 0)
    assert report["mode"] == "dry-run"
    assert report["status"] == "dry_run_complete"
    assert report["target_count"] == 1
    assert report["source_hashes_unchanged"] is True
    assert report["pixels_cleared_total"] > 0
    assert json.loads((run_dir / "manifest.json").read_text(encoding="utf-8")) == expected_manifest
    assert json.loads((run_dir / "report.json").read_text(encoding="utf-8")) == report
    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
    assert transaction["status"] == "dry_run_complete"
    assert transaction["targets"][0]["state"] == "candidate_verified"
    assert not (run_dir / "backup").exists()


def test_candidate_redecode_failure_prevents_every_replacement(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    relative_paths = ["images/a.png", "images/b.png"]
    for index, relative in enumerate(relative_paths):
        _write_live_png(root / Path(*relative.split("/")), marker_x=627 + index)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, relative_paths)
    originals = {
        relative: (root / Path(*relative.split("/"))).read_bytes()
        for relative in relative_paths
    }
    real_write = sanitizer._write_candidate_png

    def corrupt_second_candidate(image: Image.Image, path: Path) -> None:
        real_write(image, path)
        if path.name == "b.png":
            path.write_bytes(path.read_bytes()[:32])

    replacements: list[tuple[str, Path]] = []

    def record_replacement(snapshot: bytes, expected_sha256: str, source: Path) -> None:
        replacements.append((expected_sha256, source))

    monkeypatch.setattr(sanitizer, "_write_candidate_png", corrupt_second_candidate)
    monkeypatch.setattr(sanitizer, "_replace_source_from_snapshot", record_replacement)

    with pytest.raises(sanitizer.SanitizeError, match="candidate"):
        _execute_synthetic(
            mode="apply",
            root=root,
            manifest_path=manifest,
            run_dir=root / "runs" / "candidate-corrupt",
        )

    assert replacements == []
    for relative in relative_paths:
        assert (root / Path(*relative.split("/"))).read_bytes() == originals[relative]


def test_apply_uses_verified_backup_and_commits_sanitized_candidate(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    relative = "images/source.png"
    source = root / "images" / "source.png"
    _write_live_png(source)
    original = source.read_bytes()
    original_hash = _sha256(source)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative])
    run_dir = root / "runs" / "apply"

    report = _execute_synthetic(
        mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
    )

    backup = run_dir / "backup" / "images" / "source.png"
    candidate = run_dir / "candidate" / "images" / "source.png"
    assert backup.read_bytes() == original
    assert _sha256(backup) == original_hash
    assert source.read_bytes() == candidate.read_bytes()
    assert source.read_bytes() != original
    assert report["status"] == "applied"
    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
    assert transaction["status"] == "applied"
    assert transaction["targets"][0]["state"] == "committed"


def test_replacement_failure_rolls_back_only_committed_targets(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    relative_paths = ["images/a.png", "images/b.png"]
    for index, relative in enumerate(relative_paths):
        _write_live_png(root / Path(*relative.split("/")), marker_x=627 + index)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, relative_paths)
    originals = {
        relative: (root / Path(*relative.split("/"))).read_bytes()
        for relative in relative_paths
    }
    original_hashes = {
        hashlib.sha256(original).hexdigest() for original in originals.values()
    }
    run_dir = root / "runs" / "rollback"
    real_replace = sanitizer._replace_source_from_snapshot
    candidate_replacements = 0

    def fail_second_candidate_replacement(
        snapshot: bytes, expected_sha256: str, source: Path
    ) -> None:
        nonlocal candidate_replacements
        if expected_sha256 not in original_hashes:
            candidate_replacements += 1
            if candidate_replacements == 2:
                raise OSError("injected replacement failure")
        real_replace(snapshot, expected_sha256, source)

    monkeypatch.setattr(
        sanitizer, "_replace_source_from_snapshot", fail_second_candidate_replacement
    )

    with pytest.raises(sanitizer.SanitizeError, match="rolled back"):
        _execute_synthetic(
            mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
        )

    assert candidate_replacements == 2
    for relative in relative_paths:
        source = root / Path(*relative.split("/"))
        assert source.read_bytes() == originals[relative]
        assert (run_dir / "candidate" / Path(*relative.split("/"))).exists()
        assert (run_dir / "backup" / Path(*relative.split("/"))).read_bytes() == originals[relative]
    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
    assert transaction["status"] == "rolled_back"
    assert [target["state"] for target in transaction["targets"]] == [
        "rolled_back",
        "backed_up",
    ]
    report = json.loads((run_dir / "report.json").read_text(encoding="utf-8"))
    assert report["status"] == "rolled_back"
    assert report["source_hashes_unchanged"] is True


def test_candidate_path_tamper_after_snapshot_cannot_change_committed_bytes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    relative = "images/source.png"
    source = root / "images" / "source.png"
    _write_live_png(source)
    original = source.read_bytes()
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative])
    run_dir = root / "runs" / "candidate-tamper"
    candidate = run_dir / "candidate" / "images" / "source.png"
    real_copy = sanitizer._copy_verified
    verified_candidate: list[bytes] = []

    def tamper_after_backup(
        source_path: Path, destination: Path, expected_sha256: str
    ) -> None:
        real_copy(source_path, destination, expected_sha256)
        verified_candidate.append(candidate.read_bytes())
        candidate.write_bytes(candidate.read_bytes() + b"tampered")

    monkeypatch.setattr(sanitizer, "_copy_verified", tamper_after_backup)

    report = _execute_synthetic(
        mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
    )

    assert report["status"] == "applied"
    assert verified_candidate
    assert source.read_bytes() == verified_candidate[0]
    assert source.read_bytes() != original
    assert candidate.read_bytes() != source.read_bytes()


def test_candidate_aba_swap_cannot_bind_unverified_bytes_to_verification(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    relative = "images/source.png"
    source = root / "images" / "source.png"
    _write_live_png(source)
    original = source.read_bytes()
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative])
    run_dir = root / "runs" / "candidate-aba"
    candidate = run_dir / "candidate" / "images" / "source.png"
    malicious_buffer = io.BytesIO()
    Image.new("RGBA", LIVE_SIZE, (255, 0, 0, 255)).save(
        malicious_buffer, format="PNG"
    )
    malicious = malicious_buffer.getvalue()
    verified: list[bytes] = []

    def write_malicious_candidate(image: Image.Image, path: Path) -> None:
        valid_buffer = io.BytesIO()
        image.save(valid_buffer, format="PNG")
        verified.append(valid_buffer.getvalue())
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(malicious)

    real_decode = sanitizer._decode_live_png
    path_decode_calls = 0

    def expose_valid_bytes_only_during_decode(path: Path, role: str) -> Image.Image:
        nonlocal path_decode_calls
        if role.startswith("candidate "):
            path_decode_calls += 1
            path.write_bytes(verified[0])
            try:
                return real_decode(path, role)
            finally:
                path.write_bytes(malicious)
        return real_decode(path, role)

    real_read_bytes = Path.read_bytes
    candidate_reads = 0

    def count_candidate_reads(path: Path) -> bytes:
        nonlocal candidate_reads
        if path == candidate:
            candidate_reads += 1
        return real_read_bytes(path)

    monkeypatch.setattr(sanitizer, "_write_candidate_png", write_malicious_candidate)
    monkeypatch.setattr(sanitizer, "_decode_live_png", expose_valid_bytes_only_during_decode)
    monkeypatch.setattr(Path, "read_bytes", count_candidate_reads)

    with pytest.raises(sanitizer.SanitizeError, match="candidate"):
        _execute_synthetic(
            mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
        )

    assert candidate_reads == 1
    assert path_decode_calls == 0
    assert real_read_bytes(source) == original


def test_source_aba_swap_cannot_bind_manifest_hash_to_other_decoded_bytes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    relative = "images/source.png"
    source = root / "images" / "source.png"
    source.parent.mkdir(parents=True, exist_ok=True)
    malicious = b"manifest-matching-but-not-a-png"
    source.write_bytes(malicious)
    valid_buffer = io.BytesIO()
    valid_image = Image.new("RGBA", LIVE_SIZE, (19, 23, 29, 0))
    valid_image.putpixel((627, 627), (101, 102, 103, 255))
    valid_image.save(valid_buffer, format="PNG")
    valid = valid_buffer.getvalue()
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, [relative])
    run_dir = root / "runs" / "source-aba"
    real_decode = sanitizer._decode_live_png
    path_decode_calls = 0

    def expose_valid_bytes_only_during_decode(path: Path, role: str) -> Image.Image:
        nonlocal path_decode_calls
        if role.startswith("source "):
            path_decode_calls += 1
            path.write_bytes(valid)
            try:
                return real_decode(path, role)
            finally:
                path.write_bytes(malicious)
        return real_decode(path, role)

    real_read_bytes = Path.read_bytes
    source_reads = 0

    def count_source_reads(path: Path) -> bytes:
        nonlocal source_reads
        if path == source:
            source_reads += 1
        return real_read_bytes(path)

    monkeypatch.setattr(sanitizer, "_decode_live_png", expose_valid_bytes_only_during_decode)
    monkeypatch.setattr(Path, "read_bytes", count_source_reads)

    with pytest.raises(sanitizer.SanitizeError, match="source"):
        _execute_synthetic(
            mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
        )

    assert source_reads == 1
    assert path_decode_calls == 0
    assert real_read_bytes(source) == malicious


def test_journal_is_durably_marked_committing_before_source_replace(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    source = root / "images" / "source.png"
    _write_live_png(source)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, ["images/source.png"])
    run_dir = root / "runs" / "journal-order"
    real_replace = sanitizer._replace_source_from_snapshot
    observed: list[tuple[str, str]] = []

    def inspect_journal_then_replace(
        snapshot: bytes, expected_sha256: str, target: Path
    ) -> None:
        journal = json.loads(
            (run_dir / "transaction.json").read_text(encoding="utf-8")
        )
        observed.append((journal["status"], journal["targets"][0]["state"]))
        real_replace(snapshot, expected_sha256, target)

    monkeypatch.setattr(
        sanitizer, "_replace_source_from_snapshot", inspect_journal_then_replace
    )

    _execute_synthetic(
        mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
    )

    assert observed == [("committing", "committing")]


def test_keyboard_interrupt_rolls_back_committed_targets(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    root = tmp_path / "repo"
    relative_paths = ["images/a.png", "images/b.png"]
    for index, relative in enumerate(relative_paths):
        _write_live_png(root / Path(*relative.split("/")), marker_x=627 + index)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, relative_paths)
    originals = {
        relative: (root / Path(*relative.split("/"))).read_bytes()
        for relative in relative_paths
    }
    original_hashes = {
        hashlib.sha256(original).hexdigest() for original in originals.values()
    }
    run_dir = root / "runs" / "keyboard-interrupt"
    real_replace = sanitizer._replace_source_from_snapshot
    candidate_replacements = 0

    def interrupt_second_candidate(
        snapshot: bytes, expected_sha256: str, target: Path
    ) -> None:
        nonlocal candidate_replacements
        if expected_sha256 not in original_hashes:
            candidate_replacements += 1
            if candidate_replacements == 2:
                raise KeyboardInterrupt()
        real_replace(snapshot, expected_sha256, target)

    monkeypatch.setattr(
        sanitizer, "_replace_source_from_snapshot", interrupt_second_candidate
    )

    with pytest.raises(KeyboardInterrupt):
        _execute_synthetic(
            mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
        )

    for relative in relative_paths:
        assert (root / Path(*relative.split("/"))).read_bytes() == originals[relative]
    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
    assert transaction["status"] == "rolled_back"
    assert [target["state"] for target in transaction["targets"]] == [
        "rolled_back",
        "backed_up",
    ]


@pytest.mark.parametrize("crash_state", ["committing", "committed"])
def test_recovery_restores_verified_backup_for_interrupted_journal(
    tmp_path: Path, crash_state: str
) -> None:
    root = tmp_path / "repo"
    source = root / "images" / "source.png"
    _write_live_png(source)
    original = source.read_bytes()
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, ["images/source.png"])
    run_dir = root / "runs" / f"recover-{crash_state}"
    _execute_synthetic(
        mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
    )
    assert source.read_bytes() != original
    transaction_path = run_dir / "transaction.json"
    transaction = json.loads(transaction_path.read_text(encoding="utf-8"))
    transaction["status"] = "committing"
    transaction["targets"][0]["state"] = crash_state
    transaction_path.write_text(json.dumps(transaction), encoding="utf-8")

    recovery = _recover_synthetic(
        root=root, manifest_path=manifest, run_dir=run_dir
    )

    assert source.read_bytes() == original
    assert recovery["status"] == "recovered"
    recovered_journal = json.loads(transaction_path.read_text(encoding="utf-8"))
    assert recovered_journal["status"] == "recovered"
    assert recovered_journal["targets"][0]["state"] == "recovered"
    assert json.loads((run_dir / "recovery.json").read_text(encoding="utf-8")) == recovery


def test_recovery_refuses_tampered_backup_without_changing_source(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    source = root / "images" / "source.png"
    _write_live_png(source)
    manifest = root / "input-manifest.json"
    _write_manifest(manifest, root, ["images/source.png"])
    run_dir = root / "runs" / "recover-tampered-backup"
    _execute_synthetic(
        mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
    )
    applied = source.read_bytes()
    transaction_path = run_dir / "transaction.json"
    transaction = json.loads(transaction_path.read_text(encoding="utf-8"))
    transaction["status"] = "committing"
    transaction["targets"][0]["state"] = "committed"
    transaction_path.write_text(json.dumps(transaction), encoding="utf-8")
    backup = run_dir / "backup" / "images" / "source.png"
    backup.write_bytes(backup.read_bytes() + b"tampered")

    with pytest.raises(sanitizer.SanitizeError, match="backup hash mismatch"):
        _recover_synthetic(root=root, manifest_path=manifest, run_dir=run_dir)

    assert source.read_bytes() == applied


@pytest.mark.parametrize("target_count", [1, 2])
def test_production_cli_rejects_manifest_outside_immutable_fixed_scope(
    tmp_path: Path, target_count: int
) -> None:
    root = tmp_path / "repo"
    relatives = [f"images/{index}.png" for index in range(target_count)]
    for index, relative in enumerate(relatives):
        _write_live_png(root / Path(*relative.split("/")), marker_x=627 + index)
    manifest = root / "manifest.json"
    _write_manifest(manifest, root, relatives)
    originals = {
        relative: (root / Path(*relative.split("/"))).read_bytes()
        for relative in relatives
    }

    completed = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--dry-run",
            "--root",
            str(root),
            "--manifest",
            str(manifest),
            "--run-dir",
            str(root / "runs" / "scope-rejected"),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert completed.returncode == 1
    assert "immutable fixed 35-target scope" in completed.stderr
    for relative in relatives:
        assert (root / Path(*relative.split("/"))).read_bytes() == originals[relative]


def test_cli_mode_requires_root_manifest_and_run_dir() -> None:
    completed = subprocess.run(
        [sys.executable, str(SCRIPT), "--dry-run"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert completed.returncode == 2
    assert "--root" in completed.stderr
    assert "--manifest" in completed.stderr
    assert "--run-dir" in completed.stderr
