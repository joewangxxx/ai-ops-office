#!/usr/bin/env python3
"""Transactionally clear RGB outside a two-pixel visible-alpha halo in PNGs."""

from __future__ import annotations

import argparse
import ctypes
from dataclasses import asdict, dataclass
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import struct
import sys
import uuid
import warnings
import zlib

import numpy as np
from PIL import Image, ImageFilter


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
LIVE_SIZE = (1254, 1254)
ALLOWED_PNG_CHUNKS = {b"IHDR", b"IDAT", b"IEND"}
SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
FIXED_MANIFEST_SCOPE_COUNT = 35
FIXED_MANIFEST_SCOPE_FINGERPRINT = (
    "9599721a964507459d16f944b20a57ad9e423a659c890b3cebc350969b6ad537"
)


class SanitizeError(RuntimeError):
    """Raised when a sanitizer precondition or invariant fails."""


@dataclass(frozen=True)
class SanitizeMetrics:
    total_pixels: int
    visible_pixels: int
    transparent_pixels: int
    protected_transparent_pixels: int
    far_transparent_pixels: int
    pixels_cleared: int
    far_nonzero_rgb_after: int


@dataclass(frozen=True)
class _ManifestScope:
    count: int
    fingerprint: str
    name: str


FIXED_MANIFEST_SCOPE = _ManifestScope(
    count=FIXED_MANIFEST_SCOPE_COUNT,
    fingerprint=FIXED_MANIFEST_SCOPE_FINGERPRINT,
    name="immutable fixed 35-target scope",
)


@dataclass(frozen=True)
class _ManifestTarget:
    relative_path: PurePosixPath
    expected_sha256: str


@dataclass(frozen=True)
class _PreparedTarget:
    relative_path: PurePosixPath
    source_path: Path
    candidate_path: Path
    backup_path: Path
    expected_sha256: str
    source_bytes: int
    candidate_bytes: int
    candidate_sha256: str
    candidate_snapshot: bytes
    alpha_sha256: str
    visible_rgba_sha256: str
    alpha_bbox: tuple[int, int, int, int] | None
    metrics: SanitizeMetrics


def _manifest_scope_from_entries(
    entries: list[dict[str, str]], *, name: str
) -> _ManifestScope:
    pairs: list[tuple[str, str]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            raise SanitizeError("manifest scope entries must be objects")
        path = entry.get("path")
        digest = entry.get("sha256")
        if not isinstance(path, str) or not isinstance(digest, str):
            raise SanitizeError("manifest scope entries require string path and sha256")
        pairs.append((path, digest))
    serialized = "".join(
        f"{path}\0{digest}\n" for path, digest in sorted(pairs)
    ).encode("utf-8")
    return _ManifestScope(
        count=len(pairs),
        fingerprint=hashlib.sha256(serialized).hexdigest(),
        name=name,
    )


def sanitize_rgba(
    image: Image.Image, radius: int = 2
) -> tuple[Image.Image, SanitizeMetrics]:
    """Clear RGB only where alpha is zero and no alpha>0 pixel is within radius."""
    if image.mode != "RGBA":
        raise SanitizeError(f"sanitize_rgba requires RGBA input, got {image.mode!r}")
    if isinstance(radius, bool) or not isinstance(radius, int) or radius < 0:
        raise SanitizeError("radius must be a non-negative integer")

    pixels = np.array(image, dtype=np.uint8, copy=True)
    alpha = pixels[:, :, 3]
    visible = alpha > 0
    if radius == 0:
        within_radius = visible.copy()
    else:
        visible_mask = Image.fromarray((visible.astype(np.uint8) * 255), mode="L")
        within_radius = (
            np.asarray(
                visible_mask.filter(ImageFilter.MaxFilter(radius * 2 + 1)),
                dtype=np.uint8,
            )
            > 0
        )

    transparent = ~visible
    protected_transparent = transparent & within_radius
    far_transparent = transparent & (~within_radius)
    rgb_nonzero_before = np.any(pixels[:, :, :3] != 0, axis=2)
    changed = far_transparent & rgb_nonzero_before
    pixels[far_transparent, :3] = 0
    far_nonzero_after = far_transparent & np.any(pixels[:, :, :3] != 0, axis=2)

    metrics = SanitizeMetrics(
        total_pixels=int(visible.size),
        visible_pixels=int(np.count_nonzero(visible)),
        transparent_pixels=int(np.count_nonzero(transparent)),
        protected_transparent_pixels=int(np.count_nonzero(protected_transparent)),
        far_transparent_pixels=int(np.count_nonzero(far_transparent)),
        pixels_cleared=int(np.count_nonzero(changed)),
        far_nonzero_rgb_after=int(np.count_nonzero(far_nonzero_after)),
    )
    return Image.fromarray(pixels, mode="RGBA"), metrics


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _is_link(path: Path) -> bool:
    if path.is_symlink():
        return True
    is_junction = getattr(path, "is_junction", None)
    return bool(is_junction and is_junction())


def _validate_root(root: Path | str) -> Path:
    raw = Path(root)
    if _is_link(raw):
        raise SanitizeError(f"root may not be a symlink or junction: {raw}")
    try:
        resolved = raw.resolve(strict=True)
    except OSError as exc:
        raise SanitizeError(f"root does not resolve: {raw}: {exc}") from exc
    if not resolved.is_dir():
        raise SanitizeError(f"root is not a directory: {resolved}")
    return resolved


def _normalize_relative_path(value: object) -> PurePosixPath:
    if not isinstance(value, str) or not value:
        raise SanitizeError("manifest target path must be a non-empty string")
    if "\\" in value:
        raise SanitizeError(f"manifest path must use forward slashes: {value!r}")
    relative = PurePosixPath(value)
    if (
        relative.is_absolute()
        or str(relative) != value
        or any(part in {"", ".", ".."} for part in relative.parts)
        or not relative.parts
        or relative.parts[0] != "images"
        or relative.suffix != ".png"
    ):
        raise SanitizeError(f"unsafe or non-canonical manifest path: {value!r}")
    return relative


def _resolve_exact_source(root: Path, relative: PurePosixPath) -> Path:
    current = root
    for part in relative.parts:
        if not current.is_dir():
            raise SanitizeError(f"source path parent is not a directory: {current}")
        try:
            exact_names = {entry.name for entry in current.iterdir()}
        except OSError as exc:
            raise SanitizeError(f"cannot inspect source path parent {current}: {exc}") from exc
        if part not in exact_names:
            raise SanitizeError(f"source path is missing or has different case: {relative}")
        current = current / part
        if _is_link(current):
            raise SanitizeError(f"source path contains a symlink or junction: {relative}")
    try:
        resolved = current.resolve(strict=True)
    except OSError as exc:
        raise SanitizeError(f"source path does not resolve: {relative}: {exc}") from exc
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise SanitizeError(f"source path escapes root or is not a regular file: {relative}")
    return resolved


def _validate_manifest_path(root: Path, manifest_path: Path | str) -> Path:
    raw = Path(manifest_path)
    if _is_link(raw):
        raise SanitizeError(f"manifest may not be a symlink or junction: {raw}")
    try:
        resolved = raw.resolve(strict=True)
    except OSError as exc:
        raise SanitizeError(f"manifest does not resolve: {raw}: {exc}") from exc
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise SanitizeError("manifest must be a regular file inside root")
    return resolved


def _load_manifest(
    root: Path,
    manifest_path: Path | str,
    *,
    required_scope: _ManifestScope,
) -> tuple[Path, dict[str, object], list[_ManifestTarget]]:
    resolved = _validate_manifest_path(root, manifest_path)
    if resolved.stat().st_size > 1024 * 1024:
        raise SanitizeError("manifest is unreasonably large")
    try:
        payload = json.loads(resolved.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise SanitizeError(f"invalid manifest JSON: {exc}") from exc
    if not isinstance(payload, dict) or set(payload) != {"schema_version", "targets"}:
        raise SanitizeError("manifest must contain exactly schema_version and targets")
    if payload["schema_version"] != 1 or not isinstance(payload["targets"], list):
        raise SanitizeError("manifest schema_version must be 1 and targets must be a list")
    if not payload["targets"]:
        raise SanitizeError("manifest targets must not be empty")

    targets: list[_ManifestTarget] = []
    seen: set[PurePosixPath] = set()
    canonical_targets: list[dict[str, str]] = []
    for entry in payload["targets"]:
        if not isinstance(entry, dict) or set(entry) != {"path", "sha256"}:
            raise SanitizeError("each manifest target must contain exactly path and sha256")
        relative = _normalize_relative_path(entry["path"])
        digest = entry["sha256"]
        if not isinstance(digest, str) or SHA256_RE.fullmatch(digest) is None:
            raise SanitizeError(f"invalid lowercase SHA-256 for {relative}")
        if relative in seen:
            raise SanitizeError(f"duplicate manifest path: {relative}")
        seen.add(relative)
        targets.append(_ManifestTarget(relative, digest))
        canonical_targets.append({"path": str(relative), "sha256": digest})
    canonical: dict[str, object] = {
        "schema_version": 1,
        "targets": canonical_targets,
    }
    actual_scope = _manifest_scope_from_entries(
        canonical_targets, name="provided manifest scope"
    )
    if (
        actual_scope.count != required_scope.count
        or actual_scope.fingerprint != required_scope.fingerprint
    ):
        raise SanitizeError(
            f"manifest does not match {required_scope.name}: "
            f"expected {required_scope.count} exact path/hash pairs"
        )
    return resolved, canonical, targets


def _ensure_no_link_components(root: Path, target: Path) -> None:
    if not target.is_relative_to(root):
        raise SanitizeError(f"path escapes root: {target}")
    current = root
    for part in target.relative_to(root).parts:
        current = current / part
        if current.exists() and _is_link(current):
            raise SanitizeError(f"output path contains a symlink or junction: {current}")


def _prepare_run_dir(root: Path, value: Path | str, manifest_path: Path) -> Path:
    raw = Path(value)
    absolute = Path(os.path.abspath(raw))
    if absolute == root or not absolute.is_relative_to(root):
        raise SanitizeError("run directory must be a child of root")
    _ensure_no_link_components(root, absolute)
    absolute.mkdir(parents=True, exist_ok=True)
    _ensure_no_link_components(root, absolute)
    resolved = absolute.resolve(strict=True)
    if resolved != absolute or not resolved.is_dir():
        raise SanitizeError("run directory did not resolve exactly")

    output_manifest = resolved / "manifest.json"
    allowed_existing: set[str] = set()
    if manifest_path == output_manifest:
        allowed_existing.add("manifest.json")
    unexpected = [entry.name for entry in resolved.iterdir() if entry.name not in allowed_existing]
    if unexpected:
        raise SanitizeError(
            "run directory is not unique/empty; unexpected entries: "
            + ", ".join(sorted(unexpected))
        )
    return resolved


def _validate_existing_run_dir(root: Path, value: Path | str) -> Path:
    absolute = Path(os.path.abspath(Path(value)))
    if absolute == root or not absolute.is_relative_to(root):
        raise SanitizeError("run directory must be a child of root")
    _ensure_no_link_components(root, absolute)
    try:
        resolved = absolute.resolve(strict=True)
    except OSError as exc:
        raise SanitizeError(f"recovery run directory does not resolve: {exc}") from exc
    if resolved != absolute or not resolved.is_dir():
        raise SanitizeError("recovery run directory did not resolve exactly")
    return resolved


def _fsync_directory(directory: Path) -> None:
    if os.name == "nt":
        return
    descriptor = os.open(directory, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _durable_replace(temporary: Path, destination: Path) -> None:
    """Atomically replace destination and durably persist the directory entry."""
    if os.name == "nt":
        move_file_ex = ctypes.WinDLL("kernel32", use_last_error=True).MoveFileExW
        move_file_ex.argtypes = [ctypes.c_wchar_p, ctypes.c_wchar_p, ctypes.c_uint]
        move_file_ex.restype = ctypes.c_int
        movefile_replace_existing = 0x1
        movefile_write_through = 0x8
        succeeded = move_file_ex(
            str(temporary),
            str(destination),
            movefile_replace_existing | movefile_write_through,
        )
        if not succeeded:
            raise ctypes.WinError(ctypes.get_last_error())
        return
    os.replace(temporary, destination)
    _fsync_directory(destination.parent)


def _atomic_write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        with temporary.open("x", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        _durable_replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def _inspect_png_bytes(
    raw: bytes, role: str, location: str
) -> tuple[int, int, int, int, int, int, int]:
    if not raw.startswith(PNG_SIGNATURE):
        raise SanitizeError(f"{role} is not a PNG: {location}")

    offset = len(PNG_SIGNATURE)
    chunks: list[bytes] = []
    ihdr: bytes | None = None
    ended = False
    while offset < len(raw):
        if len(raw) - offset < 12:
            raise SanitizeError(f"truncated PNG chunk in {role}: {location}")
        length = struct.unpack(">I", raw[offset : offset + 4])[0]
        chunk_type = raw[offset + 4 : offset + 8]
        end = offset + 12 + length
        if end > len(raw):
            raise SanitizeError(f"truncated PNG chunk payload in {role}: {location}")
        if not all(65 <= byte <= 90 or 97 <= byte <= 122 for byte in chunk_type):
            raise SanitizeError(f"invalid PNG chunk type in {role}: {location}")
        payload = raw[offset + 8 : offset + 8 + length]
        stored_crc = struct.unpack(">I", raw[offset + 8 + length : end])[0]
        actual_crc = zlib.crc32(chunk_type + payload) & 0xFFFFFFFF
        if stored_crc != actual_crc:
            raise SanitizeError(f"PNG chunk CRC mismatch in {role}: {location}")
        if chunk_type not in ALLOWED_PNG_CHUNKS:
            name = chunk_type.decode("ascii", errors="replace")
            raise SanitizeError(f"unsupported PNG chunk {name} in {role}: {location}")
        chunks.append(chunk_type)
        if len(chunks) == 1:
            if chunk_type != b"IHDR" or length != 13:
                raise SanitizeError(f"first PNG chunk must be a 13-byte IHDR in {role}")
            ihdr = payload
        elif chunk_type == b"IHDR":
            raise SanitizeError(f"duplicate PNG chunk IHDR in {role}: {location}")
        if chunk_type == b"IEND":
            if length != 0 or end != len(raw):
                raise SanitizeError(f"invalid PNG chunk IEND in {role}: {location}")
            ended = True
        offset = end
        if ended:
            break

    if ihdr is None or not ended or b"IDAT" not in chunks:
        raise SanitizeError(f"missing required PNG chunk in {role}: {location}")
    first_idat = chunks.index(b"IDAT")
    last_idat = len(chunks) - 1 - chunks[::-1].index(b"IDAT")
    if any(chunk != b"IDAT" for chunk in chunks[first_idat : last_idat + 1]):
        raise SanitizeError(
            f"non-consecutive PNG chunk IDAT sequence in {role}: {location}"
        )
    return struct.unpack(">IIBBBBB", ihdr)


def _inspect_png(path: Path, role: str) -> tuple[int, int, int, int, int, int, int]:
    raw = _read_file_snapshot(path, f"{role} PNG")
    return _inspect_png_bytes(raw, role, str(path))


def _decode_live_png_snapshot(
    snapshot: bytes, role: str, location: str
) -> Image.Image:
    width, height, bit_depth, color_type, compression, filtering, interlace = (
        _inspect_png_bytes(snapshot, role, location)
    )
    if (width, height) != LIVE_SIZE:
        raise SanitizeError(
            f"{role} must be 1254x1254, got {width}x{height}: {location}"
        )
    if (bit_depth, color_type, compression, filtering, interlace) != (8, 6, 0, 0, 0):
        raise SanitizeError(
            f"{role} must be non-interlaced 8-bit RGBA PNG: {location}"
        )
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(snapshot)) as verifier:
                if verifier.format != "PNG":
                    raise SanitizeError(
                        f"{role} decoder format is not PNG: {location}"
                    )
                verifier.verify()
            with Image.open(io.BytesIO(snapshot)) as opened:
                opened.load()
                image = opened.copy()
    except SanitizeError:
        raise
    except Exception as exc:
        raise SanitizeError(f"cannot decode {role} PNG {location}: {exc}") from exc
    if image.mode != "RGBA" or image.size != LIVE_SIZE:
        raise SanitizeError(
            f"{role} decoded mode/size must be RGBA 1254x1254, got "
            f"{image.mode} {image.size}: {location}"
        )
    return image


def _decode_live_png(path: Path, role: str) -> Image.Image:
    snapshot = _read_file_snapshot(path, f"{role} PNG")
    return _decode_live_png_snapshot(snapshot, role, str(path))


def _write_candidate_png(image: Image.Image, path: Path) -> None:
    if path.exists():
        raise SanitizeError(f"candidate path already exists: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        image.save(temporary, format="PNG", optimize=True, compress_level=9)
        with temporary.open("r+b") as handle:
            os.fsync(handle.fileno())
        _durable_replace(temporary, path)
    except SanitizeError:
        raise
    except Exception as exc:
        raise SanitizeError(f"cannot write candidate PNG {path}: {exc}") from exc
    finally:
        if temporary.exists():
            temporary.unlink()


def _image_invariant_hashes(
    image: Image.Image,
) -> tuple[str, str, tuple[int, int, int, int] | None]:
    pixels = np.asarray(image, dtype=np.uint8)
    alpha = pixels[:, :, 3]
    visible = alpha > 0
    alpha_sha = hashlib.sha256(alpha.tobytes()).hexdigest()
    visible_sha = hashlib.sha256(pixels[visible].tobytes()).hexdigest()
    bbox = image.getchannel("A").getbbox()
    return alpha_sha, visible_sha, bbox


def _verify_candidate(
    source: Image.Image,
    expected: Image.Image,
    candidate_snapshot: bytes,
    relative: PurePosixPath,
) -> Image.Image:
    try:
        candidate = _decode_live_png_snapshot(
            candidate_snapshot,
            f"candidate {relative}",
            f"immutable candidate snapshot for {relative}",
        )
    except SanitizeError as exc:
        raise SanitizeError(f"candidate verification failed for {relative}: {exc}") from exc
    if candidate.tobytes() != expected.tobytes():
        raise SanitizeError(f"candidate decoded pixels differ from sanitizer output: {relative}")
    source_alpha, source_visible, source_bbox = _image_invariant_hashes(source)
    candidate_alpha, candidate_visible, candidate_bbox = _image_invariant_hashes(candidate)
    if (candidate_alpha, candidate_visible, candidate_bbox) != (
        source_alpha,
        source_visible,
        source_bbox,
    ):
        raise SanitizeError(f"candidate changed alpha/visible/bbox invariants: {relative}")
    _, idempotence_metrics = sanitize_rgba(candidate)
    if idempotence_metrics.pixels_cleared != 0:
        raise SanitizeError(f"candidate retains far transparent RGB: {relative}")
    return candidate


def _prepare_target(
    root: Path, run_dir: Path, target: _ManifestTarget
) -> _PreparedTarget:
    relative = target.relative_path
    source = _resolve_exact_source(root, relative)
    source_snapshot = _verified_file_snapshot(
        source, target.expected_sha256, f"source {relative}"
    )
    source_image = _decode_live_png_snapshot(
        source_snapshot,
        f"source {relative}",
        f"immutable source snapshot from {source}",
    )
    sanitized, metrics = sanitize_rgba(source_image)
    candidate = run_dir / "candidate" / Path(*relative.parts)
    backup = run_dir / "backup" / Path(*relative.parts)
    _write_candidate_png(sanitized, candidate)
    candidate_snapshot = _read_file_snapshot(candidate, f"candidate {relative}")
    candidate_sha256 = hashlib.sha256(candidate_snapshot).hexdigest()
    _verify_candidate(source_image, sanitized, candidate_snapshot, relative)
    alpha_sha, visible_sha, bbox = _image_invariant_hashes(source_image)
    return _PreparedTarget(
        relative_path=relative,
        source_path=source,
        candidate_path=candidate,
        backup_path=backup,
        expected_sha256=target.expected_sha256,
        source_bytes=len(source_snapshot),
        candidate_bytes=len(candidate_snapshot),
        candidate_sha256=candidate_sha256,
        candidate_snapshot=candidate_snapshot,
        alpha_sha256=alpha_sha,
        visible_rgba_sha256=visible_sha,
        alpha_bbox=bbox,
        metrics=metrics,
    )


def _copy_verified(source: Path, destination: Path, expected_sha256: str) -> None:
    if destination.exists():
        raise SanitizeError(f"backup path already exists: {destination}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
    try:
        with source.open("rb") as source_handle, temporary.open("x+b") as output_handle:
            shutil.copyfileobj(source_handle, output_handle, length=1024 * 1024)
            output_handle.flush()
            os.fsync(output_handle.fileno())
        if _sha256_file(temporary) != expected_sha256:
            raise SanitizeError(f"backup verification failed for {source}")
        _durable_replace(temporary, destination)
        if _sha256_file(destination) != expected_sha256:
            raise SanitizeError(f"backup verification failed after placement for {source}")
    finally:
        if temporary.exists():
            temporary.unlink()


def _read_file_snapshot(path: Path, role: str) -> bytes:
    if _is_link(path) or not path.is_file():
        raise SanitizeError(f"{role} is not a regular file: {path}")
    try:
        return path.read_bytes()
    except OSError as exc:
        raise SanitizeError(f"cannot read {role} {path}: {exc}") from exc


def _verified_file_snapshot(path: Path, expected_sha256: str, role: str) -> bytes:
    snapshot = _read_file_snapshot(path, role)
    actual = hashlib.sha256(snapshot).hexdigest()
    if actual != expected_sha256:
        raise SanitizeError(
            f"{role} hash mismatch: expected {expected_sha256}, got {actual}: {path}"
        )
    return snapshot


def _replace_source_from_snapshot(
    snapshot: bytes, expected_sha256: str, source: Path
) -> None:
    """Write one verified snapshot beside source, then durably replace source."""
    snapshot_sha = hashlib.sha256(snapshot).hexdigest()
    if snapshot_sha != expected_sha256:
        raise SanitizeError(
            f"replacement snapshot hash mismatch for {source}: "
            f"expected {expected_sha256}, got {snapshot_sha}"
        )
    temporary = source.parent / f".{source.name}.sanitize-{uuid.uuid4().hex}.tmp"
    try:
        with temporary.open("x+b") as output_handle:
            output_handle.write(snapshot)
            output_handle.flush()
            os.fsync(output_handle.fileno())
        try:
            os.chmod(temporary, source.stat().st_mode)
        except OSError:
            pass
        if temporary.stat().st_dev != source.parent.stat().st_dev:
            raise SanitizeError(f"replacement temporary is not on source volume: {source}")
        if _sha256_file(temporary) != expected_sha256:
            raise SanitizeError(f"replacement temporary verification failed: {source}")
        _durable_replace(temporary, source)
    finally:
        if temporary.exists():
            temporary.unlink()


def _target_report(
    prepared: _PreparedTarget, source_sha256_after: str
) -> dict[str, object]:
    return {
        "path": str(prepared.relative_path),
        "expected_source_sha256": prepared.expected_sha256,
        "source_sha256_before": prepared.expected_sha256,
        "source_sha256_after": source_sha256_after,
        "candidate_sha256": prepared.candidate_sha256,
        "source_bytes": prepared.source_bytes,
        "candidate_bytes": prepared.candidate_bytes,
        "alpha_sha256": prepared.alpha_sha256,
        "visible_rgba_sha256": prepared.visible_rgba_sha256,
        "alpha_bbox": list(prepared.alpha_bbox) if prepared.alpha_bbox else None,
        "metrics": asdict(prepared.metrics),
    }


def _build_report(
    *,
    mode: str,
    status: str,
    prepared: list[_PreparedTarget],
    source_hashes_after: dict[PurePosixPath, str],
) -> dict[str, object]:
    unchanged = all(
        source_hashes_after[item.relative_path] == item.expected_sha256 for item in prepared
    )
    return {
        "schema_version": 1,
        "mode": mode,
        "status": status,
        "target_count": len(prepared),
        "pixels_cleared_total": sum(item.metrics.pixels_cleared for item in prepared),
        "source_hashes_unchanged": unchanged,
        "source_bytes_total": sum(item.source_bytes for item in prepared),
        "candidate_bytes_total": sum(item.candidate_bytes for item in prepared),
        "targets": [
            _target_report(item, source_hashes_after[item.relative_path])
            for item in prepared
        ],
    }


def _current_hashes(prepared: list[_PreparedTarget]) -> dict[PurePosixPath, str]:
    return {item.relative_path: _sha256_file(item.source_path) for item in prepared}


def _require_expected_source_hashes(prepared: list[_PreparedTarget], phase: str) -> None:
    for item in prepared:
        actual = _sha256_file(item.source_path)
        if actual != item.expected_sha256:
            raise SanitizeError(
                f"source hash changed during {phase} for {item.relative_path}: "
                f"expected {item.expected_sha256}, got {actual}"
            )


def _execute_transaction(
    *,
    mode: str,
    root: Path | str,
    manifest_path: Path | str,
    run_dir: Path | str,
    required_scope: _ManifestScope,
) -> dict[str, object]:
    """Prepare all candidates, then dry-run or transactionally apply them."""
    if mode not in {"dry-run", "apply"}:
        raise SanitizeError("mode must be 'dry-run' or 'apply'")
    resolved_root = _validate_root(root)
    resolved_manifest, canonical_manifest, targets = _load_manifest(
        resolved_root, manifest_path, required_scope=required_scope
    )
    resolved_run = _prepare_run_dir(resolved_root, run_dir, resolved_manifest)
    _atomic_write_json(resolved_run / "manifest.json", canonical_manifest)

    transaction: dict[str, object] = {
        "schema_version": 1,
        "mode": mode,
        "status": "preparing",
        "targets": [
            {
                "path": str(target.relative_path),
                "expected_source_sha256": target.expected_sha256,
                "state": "pending",
            }
            for target in targets
        ],
    }
    journal_targets = transaction["targets"]
    assert isinstance(journal_targets, list)
    _atomic_write_json(resolved_run / "transaction.json", transaction)

    prepared: list[_PreparedTarget] = []
    committed: list[_PreparedTarget] = []
    backup_snapshots: dict[PurePosixPath, bytes] = {}
    try:
        for index, target in enumerate(targets):
            item = _prepare_target(resolved_root, resolved_run, target)
            prepared.append(item)
            journal_targets[index]["state"] = "candidate_verified"
            journal_targets[index]["candidate_sha256"] = item.candidate_sha256
            _atomic_write_json(resolved_run / "transaction.json", transaction)

        _require_expected_source_hashes(prepared, "candidate preparation")
        if mode == "dry-run":
            transaction["status"] = "dry_run_complete"
            _atomic_write_json(resolved_run / "transaction.json", transaction)
            after = _current_hashes(prepared)
            if any(after[item.relative_path] != item.expected_sha256 for item in prepared):
                raise SanitizeError("dry-run changed one or more source hashes")
            report = _build_report(
                mode=mode,
                status="dry_run_complete",
                prepared=prepared,
                source_hashes_after=after,
            )
            _atomic_write_json(resolved_run / "report.json", report)
            return report

        for index, item in enumerate(prepared):
            _copy_verified(item.source_path, item.backup_path, item.expected_sha256)
            backup_snapshots[item.relative_path] = _verified_file_snapshot(
                item.backup_path, item.expected_sha256, "backup"
            )
            journal_targets[index]["state"] = "backed_up"
            _atomic_write_json(resolved_run / "transaction.json", transaction)
        _require_expected_source_hashes(prepared, "backup creation")

        transaction["status"] = "committing"
        _atomic_write_json(resolved_run / "transaction.json", transaction)
        for index, item in enumerate(prepared):
            actual_before = _sha256_file(item.source_path)
            if actual_before != item.expected_sha256:
                raise SanitizeError(
                    f"source hash mismatch immediately before replacement for {item.relative_path}"
                )
            journal_targets[index]["state"] = "committing"
            _atomic_write_json(resolved_run / "transaction.json", transaction)
            _replace_source_from_snapshot(
                item.candidate_snapshot,
                item.candidate_sha256,
                item.source_path,
            )
            committed.append(item)
            actual_after = _sha256_file(item.source_path)
            if actual_after != item.candidate_sha256:
                raise SanitizeError(f"post-replacement hash mismatch for {item.relative_path}")
            journal_targets[index]["state"] = "committed"
            _atomic_write_json(resolved_run / "transaction.json", transaction)

        transaction["status"] = "applied"
        _atomic_write_json(resolved_run / "transaction.json", transaction)
        after = _current_hashes(prepared)
        report = _build_report(
            mode=mode, status="applied", prepared=prepared, source_hashes_after=after
        )
        _atomic_write_json(resolved_run / "report.json", report)
        return report
    except BaseException as exc:
        for index, item in enumerate(prepared):
            if journal_targets[index].get("state") != "committing" or item in committed:
                continue
            try:
                current_sha = _sha256_file(item.source_path)
            except BaseException:
                current_sha = ""
            if current_sha == item.expected_sha256:
                journal_targets[index]["state"] = "backed_up"
            else:
                committed.append(item)

        if committed:
            rollback_errors: list[str] = []
            for item in reversed(committed):
                index = next(
                    idx
                    for idx, entry in enumerate(prepared)
                    if entry.relative_path == item.relative_path
                )
                try:
                    backup_snapshot = backup_snapshots.get(item.relative_path)
                    if backup_snapshot is None:
                        backup_snapshot = _verified_file_snapshot(
                            item.backup_path, item.expected_sha256, "backup"
                        )
                    _replace_source_from_snapshot(
                        backup_snapshot, item.expected_sha256, item.source_path
                    )
                    if _sha256_file(item.source_path) != item.expected_sha256:
                        raise SanitizeError("restored hash does not match manifest")
                    journal_targets[index]["state"] = "rolled_back"
                except BaseException as rollback_exc:
                    journal_targets[index]["state"] = "rollback_failed"
                    rollback_errors.append(f"{item.relative_path}: {rollback_exc}")
                try:
                    _atomic_write_json(resolved_run / "transaction.json", transaction)
                except BaseException as journal_exc:
                    rollback_errors.append(f"journal: {journal_exc}")
            transaction["status"] = "rollback_failed" if rollback_errors else "rolled_back"
            transaction["error"] = f"{type(exc).__name__}: {exc}"
            if rollback_errors:
                transaction["rollback_errors"] = rollback_errors
            try:
                _atomic_write_json(resolved_run / "transaction.json", transaction)
            except BaseException:
                pass
            after = _current_hashes(prepared)
            report = _build_report(
                mode=mode,
                status=str(transaction["status"]),
                prepared=prepared,
                source_hashes_after=after,
            )
            report["error"] = f"{type(exc).__name__}: {exc}"
            if rollback_errors:
                report["rollback_errors"] = rollback_errors
            try:
                _atomic_write_json(resolved_run / "report.json", report)
            except BaseException:
                pass
            if rollback_errors:
                raise SanitizeError(
                    f"apply failed and rollback failed: {exc}; {'; '.join(rollback_errors)}"
                ) from exc
            if isinstance(exc, (KeyboardInterrupt, SystemExit, GeneratorExit)):
                raise
            raise SanitizeError(f"apply failed; committed targets rolled back: {exc}") from exc

        transaction["status"] = "failed"
        transaction["error"] = f"{type(exc).__name__}: {exc}"
        try:
            _atomic_write_json(resolved_run / "transaction.json", transaction)
        except BaseException:
            pass
        if isinstance(exc, (KeyboardInterrupt, SystemExit, GeneratorExit)):
            raise
        if isinstance(exc, SanitizeError):
            raise
        raise SanitizeError(str(exc)) from exc


def execute_transaction(
    *,
    mode: str,
    root: Path | str,
    manifest_path: Path | str,
    run_dir: Path | str,
) -> dict[str, object]:
    """Run only the immutable audited 35-target production transaction."""
    return _execute_transaction(
        mode=mode,
        root=root,
        manifest_path=manifest_path,
        run_dir=run_dir,
        required_scope=FIXED_MANIFEST_SCOPE,
    )


def _recover_transaction(
    *,
    root: Path | str,
    manifest_path: Path | str,
    run_dir: Path | str,
    required_scope: _ManifestScope,
) -> dict[str, object]:
    """Recover an interrupted apply journal using verified original backups only."""
    resolved_root = _validate_root(root)
    _, _, targets = _load_manifest(
        resolved_root, manifest_path, required_scope=required_scope
    )
    resolved_run = _validate_existing_run_dir(resolved_root, run_dir)
    transaction_path = resolved_run / "transaction.json"
    if _is_link(transaction_path) or not transaction_path.is_file():
        raise SanitizeError("recovery transaction journal is missing or linked")
    try:
        transaction = json.loads(transaction_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise SanitizeError(f"invalid recovery transaction journal: {exc}") from exc
    allowed_statuses = {
        "committing",
        "rollback_failed",
        "recovering",
        "recovery_failed",
    }
    if (
        not isinstance(transaction, dict)
        or transaction.get("schema_version") != 1
        or transaction.get("mode") != "apply"
        or transaction.get("status") not in allowed_statuses
        or not isinstance(transaction.get("targets"), list)
    ):
        raise SanitizeError("journal is not an interrupted apply transaction")
    journal_targets = transaction["targets"]
    if len(journal_targets) != len(targets):
        raise SanitizeError("recovery journal target count does not match manifest")

    recoverable_states = {
        "committing",
        "committed",
        "rollback_failed",
        "recovering",
        "recovery_failed",
    }
    original_states = {"pending", "candidate_verified", "backed_up", "rolled_back", "recovered"}
    recovery_plan: list[tuple[int, _ManifestTarget, Path, bytes, bool]] = []
    for index, (target, entry) in enumerate(zip(targets, journal_targets, strict=True)):
        if not isinstance(entry, dict) or entry.get("path") != str(target.relative_path):
            raise SanitizeError("recovery journal paths do not exactly match manifest")
        if entry.get("expected_source_sha256") != target.expected_sha256:
            raise SanitizeError("recovery journal source hash does not match manifest")
        state = entry.get("state")
        if state not in recoverable_states | original_states:
            raise SanitizeError(f"unsupported recovery journal state: {state!r}")
        source = _resolve_exact_source(resolved_root, target.relative_path)
        source_sha = _sha256_file(source)
        if state in original_states:
            if source_sha != target.expected_sha256:
                raise SanitizeError(
                    f"source hash contradicts non-committed journal state: {target.relative_path}"
                )
            continue

        candidate_sha = entry.get("candidate_sha256")
        if not isinstance(candidate_sha, str) or SHA256_RE.fullmatch(candidate_sha) is None:
            raise SanitizeError("recovery journal lacks a valid candidate SHA-256")
        backup = resolved_run / "backup" / Path(*target.relative_path.parts)
        _ensure_no_link_components(resolved_run, backup)
        backup_snapshot = _verified_file_snapshot(
            backup, target.expected_sha256, "backup"
        )
        if source_sha == target.expected_sha256:
            needs_restore = False
        elif source_sha == candidate_sha:
            needs_restore = True
        else:
            raise SanitizeError(
                f"source hash is neither original nor verified candidate during recovery: "
                f"{target.relative_path}"
            )
        recovery_plan.append(
            (index, target, source, backup_snapshot, needs_restore)
        )

    restored_count = 0
    already_original_count = 0
    transaction["status"] = "recovering"
    _atomic_write_json(transaction_path, transaction)
    try:
        for index, target, source, backup_snapshot, needs_restore in recovery_plan:
            journal_targets[index]["state"] = "recovering"
            _atomic_write_json(transaction_path, transaction)
            if needs_restore:
                _replace_source_from_snapshot(
                    backup_snapshot, target.expected_sha256, source
                )
                restored_count += 1
            else:
                already_original_count += 1
            if _sha256_file(source) != target.expected_sha256:
                raise SanitizeError(
                    f"recovery source hash mismatch: {target.relative_path}"
                )
            journal_targets[index]["state"] = "recovered"
            _atomic_write_json(transaction_path, transaction)
    except BaseException as exc:
        transaction["status"] = "recovery_failed"
        transaction["recovery_error"] = f"{type(exc).__name__}: {exc}"
        try:
            _atomic_write_json(transaction_path, transaction)
        except BaseException:
            pass
        raise

    transaction["status"] = "recovered"
    _atomic_write_json(transaction_path, transaction)
    recovery: dict[str, object] = {
        "schema_version": 1,
        "mode": "recover",
        "status": "recovered",
        "target_count": len(targets),
        "recovery_target_count": len(recovery_plan),
        "restored_count": restored_count,
        "already_original_count": already_original_count,
        "source_hashes_restored": all(
            _sha256_file(_resolve_exact_source(resolved_root, target.relative_path))
            == target.expected_sha256
            for target in targets
        ),
    }
    _atomic_write_json(resolved_run / "recovery.json", recovery)
    return recovery


def recover_transaction(
    *, root: Path | str, manifest_path: Path | str, run_dir: Path | str
) -> dict[str, object]:
    """Recover only the immutable audited 35-target production transaction."""
    return _recover_transaction(
        root=root,
        manifest_path=manifest_path,
        run_dir=run_dir,
        required_scope=FIXED_MANIFEST_SCOPE,
    )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Clear transparent RGB outside a two-pixel visible-alpha halo."
    )
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--dry-run", dest="mode", action="store_const", const="dry-run")
    modes.add_argument("--apply", dest="mode", action="store_const", const="apply")
    modes.add_argument("--recover", dest="mode", action="store_const", const="recover")
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--run-dir", type=Path, required=True)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.mode == "recover":
            report = recover_transaction(
                root=args.root,
                manifest_path=args.manifest,
                run_dir=args.run_dir,
            )
        else:
            report = execute_transaction(
                mode=args.mode,
                root=args.root,
                manifest_path=args.manifest,
                run_dir=args.run_dir,
            )
    except SanitizeError as exc:
        print(f"sanitize-transparent-rgb: {exc}", file=sys.stderr)
        return 1
    summary = {
        "status": report["status"],
        "target_count": report["target_count"],
        "report": str(
            args.run_dir / ("recovery.json" if args.mode == "recover" else "report.json")
        ),
    }
    for key in (
        "pixels_cleared_total",
        "source_hashes_unchanged",
        "restored_count",
        "source_hashes_restored",
    ):
        if key in report:
            summary[key] = report[key]
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
