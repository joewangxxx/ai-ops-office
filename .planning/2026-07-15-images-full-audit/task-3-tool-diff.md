# Task 3 sanitizer tool diff

## tools/sanitize_transparent_rgb.py

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\tools\sanitize_transparent_rgb.py', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts.__ABSENT__" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\tools\\sanitize_transparent_rgb.py"
index 5f28270..a77b529 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts.__ABSENT__"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\tools\\sanitize_transparent_rgb.py"
@@ -1 +1,747 @@
-﻿
\ No newline at end of file
+#!/usr/bin/env python3
+"""Transactionally clear RGB outside a two-pixel visible-alpha halo in PNGs."""
+
+from __future__ import annotations
+
+import argparse
+from dataclasses import asdict, dataclass
+import hashlib
+import json
+import os
+from pathlib import Path, PurePosixPath
+import re
+import shutil
+import struct
+import sys
+import uuid
+import warnings
+import zlib
+
+import numpy as np
+from PIL import Image, ImageFilter
+
+
+PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
+LIVE_SIZE = (1254, 1254)
+ALLOWED_PNG_CHUNKS = {b"IHDR", b"IDAT", b"IEND"}
+SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
+
+
+class SanitizeError(RuntimeError):
+    """Raised when a sanitizer precondition or invariant fails."""
+
+
+@dataclass(frozen=True)
+class SanitizeMetrics:
+    total_pixels: int
+    visible_pixels: int
+    transparent_pixels: int
+    protected_transparent_pixels: int
+    far_transparent_pixels: int
+    pixels_cleared: int
+    far_nonzero_rgb_after: int
+
+
+@dataclass(frozen=True)
+class _ManifestTarget:
+    relative_path: PurePosixPath
+    expected_sha256: str
+
+
+@dataclass(frozen=True)
+class _PreparedTarget:
+    relative_path: PurePosixPath
+    source_path: Path
+    candidate_path: Path
+    backup_path: Path
+    expected_sha256: str
+    source_bytes: int
+    candidate_bytes: int
+    candidate_sha256: str
+    alpha_sha256: str
+    visible_rgba_sha256: str
+    alpha_bbox: tuple[int, int, int, int] | None
+    metrics: SanitizeMetrics
+
+
+def sanitize_rgba(
+    image: Image.Image, radius: int = 2
+) -> tuple[Image.Image, SanitizeMetrics]:
+    """Clear RGB only where alpha is zero and no alpha>0 pixel is within radius."""
+    if image.mode != "RGBA":
+        raise SanitizeError(f"sanitize_rgba requires RGBA input, got {image.mode!r}")
+    if isinstance(radius, bool) or not isinstance(radius, int) or radius < 0:
+        raise SanitizeError("radius must be a non-negative integer")
+
+    pixels = np.array(image, dtype=np.uint8, copy=True)
+    alpha = pixels[:, :, 3]
+    visible = alpha > 0
+    if radius == 0:
+        within_radius = visible.copy()
+    else:
+        visible_mask = Image.fromarray((visible.astype(np.uint8) * 255), mode="L")
+        within_radius = (
+            np.asarray(
+                visible_mask.filter(ImageFilter.MaxFilter(radius * 2 + 1)),
+                dtype=np.uint8,
+            )
+            > 0
+        )
+
+    transparent = ~visible
+    protected_transparent = transparent & within_radius
+    far_transparent = transparent & (~within_radius)
+    rgb_nonzero_before = np.any(pixels[:, :, :3] != 0, axis=2)
+    changed = far_transparent & rgb_nonzero_before
+    pixels[far_transparent, :3] = 0
+    far_nonzero_after = far_transparent & np.any(pixels[:, :, :3] != 0, axis=2)
+
+    metrics = SanitizeMetrics(
+        total_pixels=int(visible.size),
+        visible_pixels=int(np.count_nonzero(visible)),
+        transparent_pixels=int(np.count_nonzero(transparent)),
+        protected_transparent_pixels=int(np.count_nonzero(protected_transparent)),
+        far_transparent_pixels=int(np.count_nonzero(far_transparent)),
+        pixels_cleared=int(np.count_nonzero(changed)),
+        far_nonzero_rgb_after=int(np.count_nonzero(far_nonzero_after)),
+    )
+    return Image.fromarray(pixels, mode="RGBA"), metrics
+
+
+def _sha256_file(path: Path) -> str:
+    digest = hashlib.sha256()
+    with path.open("rb") as handle:
+        for block in iter(lambda: handle.read(1024 * 1024), b""):
+            digest.update(block)
+    return digest.hexdigest()
+
+
+def _is_link(path: Path) -> bool:
+    if path.is_symlink():
+        return True
+    is_junction = getattr(path, "is_junction", None)
+    return bool(is_junction and is_junction())
+
+
+def _validate_root(root: Path | str) -> Path:
+    raw = Path(root)
+    if _is_link(raw):
+        raise SanitizeError(f"root may not be a symlink or junction: {raw}")
+    try:
+        resolved = raw.resolve(strict=True)
+    except OSError as exc:
+        raise SanitizeError(f"root does not resolve: {raw}: {exc}") from exc
+    if not resolved.is_dir():
+        raise SanitizeError(f"root is not a directory: {resolved}")
+    return resolved
+
+
+def _normalize_relative_path(value: object) -> PurePosixPath:
+    if not isinstance(value, str) or not value:
+        raise SanitizeError("manifest target path must be a non-empty string")
+    if "\\" in value:
+        raise SanitizeError(f"manifest path must use forward slashes: {value!r}")
+    relative = PurePosixPath(value)
+    if (
+        relative.is_absolute()
+        or str(relative) != value
+        or any(part in {"", ".", ".."} for part in relative.parts)
+        or not relative.parts
+        or relative.parts[0] != "images"
+        or relative.suffix != ".png"
+    ):
+        raise SanitizeError(f"unsafe or non-canonical manifest path: {value!r}")
+    return relative
+
+
+def _resolve_exact_source(root: Path, relative: PurePosixPath) -> Path:
+    current = root
+    for part in relative.parts:
+        if not current.is_dir():
+            raise SanitizeError(f"source path parent is not a directory: {current}")
+        try:
+            exact_names = {entry.name for entry in current.iterdir()}
+        except OSError as exc:
+            raise SanitizeError(f"cannot inspect source path parent {current}: {exc}") from exc
+        if part not in exact_names:
+            raise SanitizeError(f"source path is missing or has different case: {relative}")
+        current = current / part
+        if _is_link(current):
+            raise SanitizeError(f"source path contains a symlink or junction: {relative}")
+    try:
+        resolved = current.resolve(strict=True)
+    except OSError as exc:
+        raise SanitizeError(f"source path does not resolve: {relative}: {exc}") from exc
+    if not resolved.is_relative_to(root) or not resolved.is_file():
+        raise SanitizeError(f"source path escapes root or is not a regular file: {relative}")
+    return resolved
+
+
+def _validate_manifest_path(root: Path, manifest_path: Path | str) -> Path:
+    raw = Path(manifest_path)
+    if _is_link(raw):
+        raise SanitizeError(f"manifest may not be a symlink or junction: {raw}")
+    try:
+        resolved = raw.resolve(strict=True)
+    except OSError as exc:
+        raise SanitizeError(f"manifest does not resolve: {raw}: {exc}") from exc
+    if not resolved.is_relative_to(root) or not resolved.is_file():
+        raise SanitizeError("manifest must be a regular file inside root")
+    return resolved
+
+
+def _load_manifest(
+    root: Path, manifest_path: Path | str
+) -> tuple[Path, dict[str, object], list[_ManifestTarget]]:
+    resolved = _validate_manifest_path(root, manifest_path)
+    if resolved.stat().st_size > 1024 * 1024:
+        raise SanitizeError("manifest is unreasonably large")
+    try:
+        payload = json.loads(resolved.read_text(encoding="utf-8"))
+    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
+        raise SanitizeError(f"invalid manifest JSON: {exc}") from exc
+    if not isinstance(payload, dict) or set(payload) != {"schema_version", "targets"}:
+        raise SanitizeError("manifest must contain exactly schema_version and targets")
+    if payload["schema_version"] != 1 or not isinstance(payload["targets"], list):
+        raise SanitizeError("manifest schema_version must be 1 and targets must be a list")
+    if not payload["targets"]:
+        raise SanitizeError("manifest targets must not be empty")
+
+    targets: list[_ManifestTarget] = []
+    seen: set[PurePosixPath] = set()
+    canonical_targets: list[dict[str, str]] = []
+    for entry in payload["targets"]:
+        if not isinstance(entry, dict) or set(entry) != {"path", "sha256"}:
+            raise SanitizeError("each manifest target must contain exactly path and sha256")
+        relative = _normalize_relative_path(entry["path"])
+        digest = entry["sha256"]
+        if not isinstance(digest, str) or SHA256_RE.fullmatch(digest) is None:
+            raise SanitizeError(f"invalid lowercase SHA-256 for {relative}")
+        if relative in seen:
+            raise SanitizeError(f"duplicate manifest path: {relative}")
+        seen.add(relative)
+        targets.append(_ManifestTarget(relative, digest))
+        canonical_targets.append({"path": str(relative), "sha256": digest})
+    canonical: dict[str, object] = {
+        "schema_version": 1,
+        "targets": canonical_targets,
+    }
+    return resolved, canonical, targets
+
+
+def _ensure_no_link_components(root: Path, target: Path) -> None:
+    if not target.is_relative_to(root):
+        raise SanitizeError(f"path escapes root: {target}")
+    current = root
+    for part in target.relative_to(root).parts:
+        current = current / part
+        if current.exists() and _is_link(current):
+            raise SanitizeError(f"output path contains a symlink or junction: {current}")
+
+
+def _prepare_run_dir(root: Path, value: Path | str, manifest_path: Path) -> Path:
+    raw = Path(value)
+    absolute = Path(os.path.abspath(raw))
+    if absolute == root or not absolute.is_relative_to(root):
+        raise SanitizeError("run directory must be a child of root")
+    _ensure_no_link_components(root, absolute)
+    absolute.mkdir(parents=True, exist_ok=True)
+    _ensure_no_link_components(root, absolute)
+    resolved = absolute.resolve(strict=True)
+    if resolved != absolute or not resolved.is_dir():
+        raise SanitizeError("run directory did not resolve exactly")
+
+    output_manifest = resolved / "manifest.json"
+    allowed_existing: set[str] = set()
+    if manifest_path == output_manifest:
+        allowed_existing.add("manifest.json")
+    unexpected = [entry.name for entry in resolved.iterdir() if entry.name not in allowed_existing]
+    if unexpected:
+        raise SanitizeError(
+            "run directory is not unique/empty; unexpected entries: "
+            + ", ".join(sorted(unexpected))
+        )
+    return resolved
+
+
+def _atomic_write_json(path: Path, payload: object) -> None:
+    path.parent.mkdir(parents=True, exist_ok=True)
+    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
+    try:
+        with temporary.open("x", encoding="utf-8", newline="\n") as handle:
+            json.dump(payload, handle, indent=2, ensure_ascii=False)
+            handle.write("\n")
+            handle.flush()
+            os.fsync(handle.fileno())
+        os.replace(temporary, path)
+    finally:
+        if temporary.exists():
+            temporary.unlink()
+
+
+def _inspect_png(path: Path, role: str) -> tuple[int, int, int, int, int, int, int]:
+    try:
+        raw = path.read_bytes()
+    except OSError as exc:
+        raise SanitizeError(f"cannot read {role} PNG {path}: {exc}") from exc
+    if not raw.startswith(PNG_SIGNATURE):
+        raise SanitizeError(f"{role} is not a PNG: {path}")
+
+    offset = len(PNG_SIGNATURE)
+    chunks: list[bytes] = []
+    ihdr: bytes | None = None
+    ended = False
+    while offset < len(raw):
+        if len(raw) - offset < 12:
+            raise SanitizeError(f"truncated PNG chunk in {role}: {path}")
+        length = struct.unpack(">I", raw[offset : offset + 4])[0]
+        chunk_type = raw[offset + 4 : offset + 8]
+        end = offset + 12 + length
+        if end > len(raw):
+            raise SanitizeError(f"truncated PNG chunk payload in {role}: {path}")
+        if not all(65 <= byte <= 90 or 97 <= byte <= 122 for byte in chunk_type):
+            raise SanitizeError(f"invalid PNG chunk type in {role}: {path}")
+        payload = raw[offset + 8 : offset + 8 + length]
+        stored_crc = struct.unpack(">I", raw[offset + 8 + length : end])[0]
+        actual_crc = zlib.crc32(chunk_type + payload) & 0xFFFFFFFF
+        if stored_crc != actual_crc:
+            raise SanitizeError(f"PNG chunk CRC mismatch in {role}: {path}")
+        if chunk_type not in ALLOWED_PNG_CHUNKS:
+            name = chunk_type.decode("ascii", errors="replace")
+            raise SanitizeError(f"unsupported PNG chunk {name} in {role}: {path}")
+        chunks.append(chunk_type)
+        if len(chunks) == 1:
+            if chunk_type != b"IHDR" or length != 13:
+                raise SanitizeError(f"first PNG chunk must be a 13-byte IHDR in {role}")
+            ihdr = payload
+        elif chunk_type == b"IHDR":
+            raise SanitizeError(f"duplicate PNG chunk IHDR in {role}: {path}")
+        if chunk_type == b"IEND":
+            if length != 0 or end != len(raw):
+                raise SanitizeError(f"invalid PNG chunk IEND in {role}: {path}")
+            ended = True
+        offset = end
+        if ended:
+            break
+
+    if ihdr is None or not ended or b"IDAT" not in chunks:
+        raise SanitizeError(f"missing required PNG chunk in {role}: {path}")
+    first_idat = chunks.index(b"IDAT")
+    last_idat = len(chunks) - 1 - chunks[::-1].index(b"IDAT")
+    if any(chunk != b"IDAT" for chunk in chunks[first_idat : last_idat + 1]):
+        raise SanitizeError(f"non-consecutive PNG chunk IDAT sequence in {role}: {path}")
+    return struct.unpack(">IIBBBBB", ihdr)
+
+
+def _decode_live_png(path: Path, role: str) -> Image.Image:
+    width, height, bit_depth, color_type, compression, filtering, interlace = _inspect_png(
+        path, role
+    )
+    if (width, height) != LIVE_SIZE:
+        raise SanitizeError(
+            f"{role} must be 1254x1254, got {width}x{height}: {path}"
+        )
+    if (bit_depth, color_type, compression, filtering, interlace) != (8, 6, 0, 0, 0):
+        raise SanitizeError(f"{role} must be non-interlaced 8-bit RGBA PNG: {path}")
+    try:
+        with warnings.catch_warnings():
+            warnings.simplefilter("error", Image.DecompressionBombWarning)
+            with Image.open(path) as verifier:
+                if verifier.format != "PNG":
+                    raise SanitizeError(f"{role} decoder format is not PNG: {path}")
+                verifier.verify()
+            with Image.open(path) as opened:
+                opened.load()
+                image = opened.copy()
+    except SanitizeError:
+        raise
+    except Exception as exc:
+        raise SanitizeError(f"cannot decode {role} PNG {path}: {exc}") from exc
+    if image.mode != "RGBA" or image.size != LIVE_SIZE:
+        raise SanitizeError(
+            f"{role} decoded mode/size must be RGBA 1254x1254, got "
+            f"{image.mode} {image.size}: {path}"
+        )
+    return image
+
+
+def _write_candidate_png(image: Image.Image, path: Path) -> None:
+    if path.exists():
+        raise SanitizeError(f"candidate path already exists: {path}")
+    path.parent.mkdir(parents=True, exist_ok=True)
+    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
+    try:
+        image.save(temporary, format="PNG", optimize=True, compress_level=9)
+        with temporary.open("r+b") as handle:
+            os.fsync(handle.fileno())
+        os.replace(temporary, path)
+    except SanitizeError:
+        raise
+    except Exception as exc:
+        raise SanitizeError(f"cannot write candidate PNG {path}: {exc}") from exc
+    finally:
+        if temporary.exists():
+            temporary.unlink()
+
+
+def _image_invariant_hashes(
+    image: Image.Image,
+) -> tuple[str, str, tuple[int, int, int, int] | None]:
+    pixels = np.asarray(image, dtype=np.uint8)
+    alpha = pixels[:, :, 3]
+    visible = alpha > 0
+    alpha_sha = hashlib.sha256(alpha.tobytes()).hexdigest()
+    visible_sha = hashlib.sha256(pixels[visible].tobytes()).hexdigest()
+    bbox = image.getchannel("A").getbbox()
+    return alpha_sha, visible_sha, bbox
+
+
+def _verify_candidate(
+    source: Image.Image,
+    expected: Image.Image,
+    candidate_path: Path,
+    relative: PurePosixPath,
+) -> Image.Image:
+    try:
+        candidate = _decode_live_png(candidate_path, f"candidate {relative}")
+    except SanitizeError as exc:
+        raise SanitizeError(f"candidate verification failed for {relative}: {exc}") from exc
+    if candidate.tobytes() != expected.tobytes():
+        raise SanitizeError(f"candidate decoded pixels differ from sanitizer output: {relative}")
+    source_alpha, source_visible, source_bbox = _image_invariant_hashes(source)
+    candidate_alpha, candidate_visible, candidate_bbox = _image_invariant_hashes(candidate)
+    if (candidate_alpha, candidate_visible, candidate_bbox) != (
+        source_alpha,
+        source_visible,
+        source_bbox,
+    ):
+        raise SanitizeError(f"candidate changed alpha/visible/bbox invariants: {relative}")
+    _, idempotence_metrics = sanitize_rgba(candidate)
+    if idempotence_metrics.pixels_cleared != 0:
+        raise SanitizeError(f"candidate retains far transparent RGB: {relative}")
+    return candidate
+
+
+def _prepare_target(
+    root: Path, run_dir: Path, target: _ManifestTarget
+) -> _PreparedTarget:
+    relative = target.relative_path
+    source = _resolve_exact_source(root, relative)
+    actual_sha = _sha256_file(source)
+    if actual_sha != target.expected_sha256:
+        raise SanitizeError(
+            f"source hash mismatch for {relative}: expected {target.expected_sha256}, got {actual_sha}"
+        )
+    source_image = _decode_live_png(source, f"source {relative}")
+    sanitized, metrics = sanitize_rgba(source_image)
+    candidate = run_dir / "candidate" / Path(*relative.parts)
+    backup = run_dir / "backup" / Path(*relative.parts)
+    _write_candidate_png(sanitized, candidate)
+    _verify_candidate(source_image, sanitized, candidate, relative)
+    alpha_sha, visible_sha, bbox = _image_invariant_hashes(source_image)
+    return _PreparedTarget(
+        relative_path=relative,
+        source_path=source,
+        candidate_path=candidate,
+        backup_path=backup,
+        expected_sha256=target.expected_sha256,
+        source_bytes=source.stat().st_size,
+        candidate_bytes=candidate.stat().st_size,
+        candidate_sha256=_sha256_file(candidate),
+        alpha_sha256=alpha_sha,
+        visible_rgba_sha256=visible_sha,
+        alpha_bbox=bbox,
+        metrics=metrics,
+    )
+
+
+def _copy_verified(source: Path, destination: Path, expected_sha256: str) -> None:
+    if destination.exists():
+        raise SanitizeError(f"backup path already exists: {destination}")
+    destination.parent.mkdir(parents=True, exist_ok=True)
+    temporary = destination.with_name(f".{destination.name}.{uuid.uuid4().hex}.tmp")
+    try:
+        with source.open("rb") as source_handle, temporary.open("x+b") as output_handle:
+            shutil.copyfileobj(source_handle, output_handle, length=1024 * 1024)
+            output_handle.flush()
+            os.fsync(output_handle.fileno())
+        if _sha256_file(temporary) != expected_sha256:
+            raise SanitizeError(f"backup verification failed for {source}")
+        os.replace(temporary, destination)
+        if _sha256_file(destination) != expected_sha256:
+            raise SanitizeError(f"backup verification failed after placement for {source}")
+    finally:
+        if temporary.exists():
+            temporary.unlink()
+
+
+def _replace_source_from(artifact: Path, source: Path) -> None:
+    """Copy artifact beside source, verify it, then atomically replace source."""
+    if _is_link(artifact) or not artifact.is_file():
+        raise SanitizeError(f"replacement artifact is not a regular file: {artifact}")
+    artifact_sha = _sha256_file(artifact)
+    temporary = source.parent / f".{source.name}.sanitize-{uuid.uuid4().hex}.tmp"
+    try:
+        with artifact.open("rb") as input_handle, temporary.open("x+b") as output_handle:
+            shutil.copyfileobj(input_handle, output_handle, length=1024 * 1024)
+            output_handle.flush()
+            os.fsync(output_handle.fileno())
+        try:
+            os.chmod(temporary, source.stat().st_mode)
+        except OSError:
+            pass
+        if temporary.stat().st_dev != source.parent.stat().st_dev:
+            raise SanitizeError(f"replacement temporary is not on source volume: {source}")
+        if _sha256_file(temporary) != artifact_sha:
+            raise SanitizeError(f"replacement temporary verification failed: {source}")
+        os.replace(temporary, source)
+    finally:
+        if temporary.exists():
+            temporary.unlink()
+
+
+def _target_report(
+    prepared: _PreparedTarget, source_sha256_after: str
+) -> dict[str, object]:
+    return {
+        "path": str(prepared.relative_path),
+        "expected_source_sha256": prepared.expected_sha256,
+        "source_sha256_before": prepared.expected_sha256,
+        "source_sha256_after": source_sha256_after,
+        "candidate_sha256": prepared.candidate_sha256,
+        "source_bytes": prepared.source_bytes,
+        "candidate_bytes": prepared.candidate_bytes,
+        "alpha_sha256": prepared.alpha_sha256,
+        "visible_rgba_sha256": prepared.visible_rgba_sha256,
+        "alpha_bbox": list(prepared.alpha_bbox) if prepared.alpha_bbox else None,
+        "metrics": asdict(prepared.metrics),
+    }
+
+
+def _build_report(
+    *,
+    mode: str,
+    status: str,
+    prepared: list[_PreparedTarget],
+    source_hashes_after: dict[PurePosixPath, str],
+) -> dict[str, object]:
+    unchanged = all(
+        source_hashes_after[item.relative_path] == item.expected_sha256 for item in prepared
+    )
+    return {
+        "schema_version": 1,
+        "mode": mode,
+        "status": status,
+        "target_count": len(prepared),
+        "pixels_cleared_total": sum(item.metrics.pixels_cleared for item in prepared),
+        "source_hashes_unchanged": unchanged,
+        "source_bytes_total": sum(item.source_bytes for item in prepared),
+        "candidate_bytes_total": sum(item.candidate_bytes for item in prepared),
+        "targets": [
+            _target_report(item, source_hashes_after[item.relative_path])
+            for item in prepared
+        ],
+    }
+
+
+def _current_hashes(prepared: list[_PreparedTarget]) -> dict[PurePosixPath, str]:
+    return {item.relative_path: _sha256_file(item.source_path) for item in prepared}
+
+
+def _require_expected_source_hashes(prepared: list[_PreparedTarget], phase: str) -> None:
+    for item in prepared:
+        actual = _sha256_file(item.source_path)
+        if actual != item.expected_sha256:
+            raise SanitizeError(
+                f"source hash changed during {phase} for {item.relative_path}: "
+                f"expected {item.expected_sha256}, got {actual}"
+            )
+
+
+def execute_transaction(
+    *,
+    mode: str,
+    root: Path | str,
+    manifest_path: Path | str,
+    run_dir: Path | str,
+) -> dict[str, object]:
+    """Prepare all candidates, then dry-run or transactionally apply them."""
+    if mode not in {"dry-run", "apply"}:
+        raise SanitizeError("mode must be 'dry-run' or 'apply'")
+    resolved_root = _validate_root(root)
+    resolved_manifest, canonical_manifest, targets = _load_manifest(
+        resolved_root, manifest_path
+    )
+    resolved_run = _prepare_run_dir(resolved_root, run_dir, resolved_manifest)
+    _atomic_write_json(resolved_run / "manifest.json", canonical_manifest)
+
+    transaction: dict[str, object] = {
+        "schema_version": 1,
+        "mode": mode,
+        "status": "preparing",
+        "targets": [
+            {"path": str(target.relative_path), "state": "pending"}
+            for target in targets
+        ],
+    }
+    journal_targets = transaction["targets"]
+    assert isinstance(journal_targets, list)
+    _atomic_write_json(resolved_run / "transaction.json", transaction)
+
+    prepared: list[_PreparedTarget] = []
+    committed: list[_PreparedTarget] = []
+    try:
+        for index, target in enumerate(targets):
+            item = _prepare_target(resolved_root, resolved_run, target)
+            prepared.append(item)
+            journal_targets[index]["state"] = "candidate_verified"
+            _atomic_write_json(resolved_run / "transaction.json", transaction)
+
+        _require_expected_source_hashes(prepared, "candidate preparation")
+        if mode == "dry-run":
+            transaction["status"] = "dry_run_complete"
+            _atomic_write_json(resolved_run / "transaction.json", transaction)
+            after = _current_hashes(prepared)
+            if any(after[item.relative_path] != item.expected_sha256 for item in prepared):
+                raise SanitizeError("dry-run changed one or more source hashes")
+            report = _build_report(
+                mode=mode,
+                status="dry_run_complete",
+                prepared=prepared,
+                source_hashes_after=after,
+            )
+            _atomic_write_json(resolved_run / "report.json", report)
+            return report
+
+        for index, item in enumerate(prepared):
+            _copy_verified(item.source_path, item.backup_path, item.expected_sha256)
+            journal_targets[index]["state"] = "backed_up"
+            _atomic_write_json(resolved_run / "transaction.json", transaction)
+        _require_expected_source_hashes(prepared, "backup creation")
+
+        transaction["status"] = "committing"
+        _atomic_write_json(resolved_run / "transaction.json", transaction)
+        for index, item in enumerate(prepared):
+            actual_before = _sha256_file(item.source_path)
+            if actual_before != item.expected_sha256:
+                raise SanitizeError(
+                    f"source hash mismatch immediately before replacement for {item.relative_path}"
+                )
+            _replace_source_from(item.candidate_path, item.source_path)
+            committed.append(item)
+            actual_after = _sha256_file(item.source_path)
+            if actual_after != item.candidate_sha256:
+                raise SanitizeError(f"post-replacement hash mismatch for {item.relative_path}")
+            journal_targets[index]["state"] = "committed"
+            _atomic_write_json(resolved_run / "transaction.json", transaction)
+
+        transaction["status"] = "applied"
+        _atomic_write_json(resolved_run / "transaction.json", transaction)
+        after = _current_hashes(prepared)
+        report = _build_report(
+            mode=mode, status="applied", prepared=prepared, source_hashes_after=after
+        )
+        _atomic_write_json(resolved_run / "report.json", report)
+        return report
+    except Exception as exc:
+        if committed:
+            rollback_errors: list[str] = []
+            for item in reversed(committed):
+                index = next(
+                    idx
+                    for idx, entry in enumerate(prepared)
+                    if entry.relative_path == item.relative_path
+                )
+                try:
+                    _replace_source_from(item.backup_path, item.source_path)
+                    if _sha256_file(item.source_path) != item.expected_sha256:
+                        raise SanitizeError("restored hash does not match manifest")
+                    journal_targets[index]["state"] = "rolled_back"
+                except Exception as rollback_exc:
+                    journal_targets[index]["state"] = "rollback_failed"
+                    rollback_errors.append(f"{item.relative_path}: {rollback_exc}")
+                try:
+                    _atomic_write_json(resolved_run / "transaction.json", transaction)
+                except Exception as journal_exc:
+                    rollback_errors.append(f"journal: {journal_exc}")
+            transaction["status"] = "rollback_failed" if rollback_errors else "rolled_back"
+            transaction["error"] = str(exc)
+            if rollback_errors:
+                transaction["rollback_errors"] = rollback_errors
+            try:
+                _atomic_write_json(resolved_run / "transaction.json", transaction)
+            except Exception:
+                pass
+            after = _current_hashes(prepared)
+            report = _build_report(
+                mode=mode,
+                status=str(transaction["status"]),
+                prepared=prepared,
+                source_hashes_after=after,
+            )
+            report["error"] = str(exc)
+            if rollback_errors:
+                report["rollback_errors"] = rollback_errors
+            try:
+                _atomic_write_json(resolved_run / "report.json", report)
+            except Exception:
+                pass
+            if rollback_errors:
+                raise SanitizeError(
+                    f"apply failed and rollback failed: {exc}; {'; '.join(rollback_errors)}"
+                ) from exc
+            raise SanitizeError(f"apply failed; committed targets rolled back: {exc}") from exc
+
+        transaction["status"] = "failed"
+        transaction["error"] = str(exc)
+        try:
+            _atomic_write_json(resolved_run / "transaction.json", transaction)
+        except Exception:
+            pass
+        if isinstance(exc, SanitizeError):
+            raise
+        raise SanitizeError(str(exc)) from exc
+
+
+def _parser() -> argparse.ArgumentParser:
+    parser = argparse.ArgumentParser(
+        description="Clear transparent RGB outside a two-pixel visible-alpha halo."
+    )
+    modes = parser.add_mutually_exclusive_group(required=True)
+    modes.add_argument("--dry-run", dest="mode", action="store_const", const="dry-run")
+    modes.add_argument("--apply", dest="mode", action="store_const", const="apply")
+    parser.add_argument("--root", type=Path, required=True)
+    parser.add_argument("--manifest", type=Path, required=True)
+    parser.add_argument("--run-dir", type=Path, required=True)
+    return parser
+
+
+def main(argv: list[str] | None = None) -> int:
+    args = _parser().parse_args(argv)
+    try:
+        report = execute_transaction(
+            mode=args.mode,
+            root=args.root,
+            manifest_path=args.manifest,
+            run_dir=args.run_dir,
+        )
+    except SanitizeError as exc:
+        print(f"sanitize-transparent-rgb: {exc}", file=sys.stderr)
+        return 1
+    print(
+        json.dumps(
+            {
+                "status": report["status"],
+                "target_count": report["target_count"],
+                "pixels_cleared_total": report["pixels_cleared_total"],
+                "source_hashes_unchanged": report["source_hashes_unchanged"],
+                "report": str(args.run_dir / "report.json"),
+            },
+            sort_keys=True,
+        )
+    )
+    return 0
+
+
+if __name__ == "__main__":
+    raise SystemExit(main())
` 

## tests/test_transparent_rgb_sanitizer.py

`diff
warning: in the working copy of 'C:\Users\29929\Desktop\AI-Wrokspace\tests\test_transparent_rgb_sanitizer.py', LF will be replaced by CRLF the next time Git touches it
diff --git "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts.__ABSENT__" "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\tests\\test_transparent_rgb_sanitizer.py"
index 5f28270..c152f31 100644
--- "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\.planning\\2026-07-15-images-full-audit\\task-1-before\\apps\\office-demo\\src\\utils\\avatarPresentation.ts.__ABSENT__"
+++ "C:\\Users\\29929\\Desktop\\AI-Wrokspace\\tests\\test_transparent_rgb_sanitizer.py"
@@ -1 +1,469 @@
-﻿
\ No newline at end of file
+from __future__ import annotations
+
+import hashlib
+import json
+import os
+from pathlib import Path
+import struct
+import subprocess
+import sys
+import zlib
+
+from PIL import Image
+import pytest
+
+from tools import sanitize_transparent_rgb as sanitizer
+
+
+REPO_ROOT = Path(__file__).resolve().parents[1]
+SCRIPT = REPO_ROOT / "tools" / "sanitize_transparent_rgb.py"
+LIVE_SIZE = (1254, 1254)
+
+
+def _sha256(path: Path) -> str:
+    return hashlib.sha256(path.read_bytes()).hexdigest()
+
+
+def _write_live_png(
+    path: Path,
+    *,
+    mode: str = "RGBA",
+    size: tuple[int, int] = LIVE_SIZE,
+    background: tuple[int, ...] | None = None,
+    marker_x: int = 627,
+) -> None:
+    path.parent.mkdir(parents=True, exist_ok=True)
+    if background is None:
+        background = (19, 23, 29, 0) if mode == "RGBA" else (19, 23, 29)
+    image = Image.new(mode, size, background)
+    if mode == "RGBA" and size == LIVE_SIZE:
+        image.putpixel((marker_x, 627), (101, 102, 103, 255))
+    image.save(path, format="PNG")
+
+
+def _write_manifest(
+    path: Path,
+    root: Path,
+    relative_paths: list[str],
+    *,
+    hashes: dict[str, str] | None = None,
+) -> dict[str, object]:
+    targets = []
+    for relative_path in relative_paths:
+        digest = (hashes or {}).get(relative_path)
+        if digest is None:
+            digest = _sha256(root / Path(*relative_path.split("/")))
+        targets.append({"path": relative_path, "sha256": digest})
+    manifest: dict[str, object] = {"schema_version": 1, "targets": targets}
+    path.parent.mkdir(parents=True, exist_ok=True)
+    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
+    return manifest
+
+
+def _insert_png_chunk(path: Path, chunk_type: bytes, payload: bytes) -> None:
+    raw = path.read_bytes()
+    assert raw[:8] == b"\x89PNG\r\n\x1a\n"
+    ihdr_end = 8 + 4 + 4 + 13 + 4
+    crc = zlib.crc32(chunk_type + payload) & 0xFFFFFFFF
+    chunk = struct.pack(">I", len(payload)) + chunk_type + payload + struct.pack(">I", crc)
+    path.write_bytes(raw[:ihdr_end] + chunk + raw[ihdr_end:])
+
+
+@pytest.mark.parametrize("alpha", [1, 127, 254, 255])
+def test_alpha_greater_than_zero_is_visible_and_chebyshev_radius_two_is_preserved(
+    alpha: int,
+) -> None:
+    image = Image.new("RGBA", (9, 9), (10, 20, 30, 0))
+    image.putpixel((4, 4), (90, 100, 110, alpha))
+
+    result, metrics = sanitizer.sanitize_rgba(image)
+
+    assert result.getpixel((4, 4)) == (90, 100, 110, alpha)
+    assert result.getpixel((5, 4)) == (10, 20, 30, 0)  # offset 1
+    assert result.getpixel((6, 4)) == (10, 20, 30, 0)  # offset 2
+    assert result.getpixel((6, 6)) == (10, 20, 30, 0)  # offset (2, 2)
+    assert result.getpixel((7, 4)) == (0, 0, 0, 0)  # offset 3
+    assert metrics.visible_pixels == 1
+    assert metrics.protected_transparent_pixels == 24
+    assert metrics.pixels_cleared == 56
+
+
+def test_multiple_visible_islands_protect_independent_halos() -> None:
+    image = Image.new("RGBA", (13, 7), (7, 8, 9, 0))
+    image.putpixel((2, 3), (1, 2, 3, 255))
+    image.putpixel((10, 3), (4, 5, 6, 127))
+
+    result, metrics = sanitizer.sanitize_rgba(image)
+
+    assert result.getpixel((4, 5)) == (7, 8, 9, 0)
+    assert result.getpixel((8, 1)) == (7, 8, 9, 0)
+    assert result.getpixel((5, 3)) == (0, 0, 0, 0)
+    assert result.getpixel((7, 3)) == (0, 0, 0, 0)
+    assert metrics.visible_pixels == 2
+    assert metrics.pixels_cleared > 0
+
+
+def test_halo_clips_at_image_edges_without_wrapping() -> None:
+    image = Image.new("RGBA", (5, 5), (11, 12, 13, 0))
+    image.putpixel((0, 0), (21, 22, 23, 1))
+
+    result, metrics = sanitizer.sanitize_rgba(image)
+
+    assert result.getpixel((2, 2)) == (11, 12, 13, 0)
+    assert result.getpixel((3, 0)) == (0, 0, 0, 0)
+    assert result.getpixel((4, 4)) == (0, 0, 0, 0)
+    assert metrics.protected_transparent_pixels == 8
+    assert metrics.pixels_cleared == 16
+
+
+def test_transparent_only_image_clears_every_nonzero_rgb_pixel() -> None:
+    image = Image.new("RGBA", (4, 3), (40, 50, 60, 0))
+
+    result, metrics = sanitizer.sanitize_rgba(image)
+
+    assert result.tobytes() == Image.new("RGBA", (4, 3), (0, 0, 0, 0)).tobytes()
+    assert metrics.visible_pixels == 0
+    assert metrics.protected_transparent_pixels == 0
+    assert metrics.pixels_cleared == 12
+
+
+def test_opaque_only_image_is_byte_identical() -> None:
+    image = Image.new("RGBA", (4, 3), (40, 50, 60, 255))
+
+    result, metrics = sanitizer.sanitize_rgba(image)
+
+    assert result.tobytes() == image.tobytes()
+    assert metrics.visible_pixels == 12
+    assert metrics.pixels_cleared == 0
+
+
+def test_already_zero_far_transparency_is_unchanged() -> None:
+    image = Image.new("RGBA", (7, 7), (0, 0, 0, 0))
+    image.putpixel((3, 3), (1, 2, 3, 254))
+
+    result, metrics = sanitizer.sanitize_rgba(image)
+
+    assert result.tobytes() == image.tobytes()
+    assert metrics.pixels_cleared == 0
+    assert metrics.far_transparent_pixels == 24
+
+
+def test_sanitization_is_idempotent() -> None:
+    image = Image.new("RGBA", (9, 9), (30, 20, 10, 0))
+    image.putpixel((4, 4), (1, 2, 3, 255))
+
+    once, first_metrics = sanitizer.sanitize_rgba(image)
+    twice, second_metrics = sanitizer.sanitize_rgba(once)
+
+    assert first_metrics.pixels_cleared == 56
+    assert twice.tobytes() == once.tobytes()
+    assert second_metrics.pixels_cleared == 0
+
+
+def test_sanitize_rgba_rejects_non_rgba_and_invalid_radius() -> None:
+    with pytest.raises(sanitizer.SanitizeError, match="RGBA"):
+        sanitizer.sanitize_rgba(Image.new("RGB", (3, 3)))
+    with pytest.raises(sanitizer.SanitizeError, match="radius"):
+        sanitizer.sanitize_rgba(Image.new("RGBA", (3, 3)), radius=-1)
+
+
+@pytest.mark.parametrize(
+    ("mode", "size", "message"),
+    [("RGB", LIVE_SIZE, "RGBA"), ("RGBA", (1253, 1254), "1254x1254")],
+)
+def test_live_transaction_rejects_wrong_mode_or_dimensions(
+    tmp_path: Path,
+    mode: str,
+    size: tuple[int, int],
+    message: str,
+) -> None:
+    root = tmp_path / "repo"
+    relative = "images/bad.png"
+    source = root / "images" / "bad.png"
+    _write_live_png(source, mode=mode, size=size)
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, [relative])
+
+    with pytest.raises(sanitizer.SanitizeError, match=message):
+        sanitizer.execute_transaction(
+            mode="dry-run",
+            root=root,
+            manifest_path=manifest,
+            run_dir=root / "runs" / "bad-live-input",
+        )
+
+
+@pytest.mark.parametrize("relative", ["../outside.png", "images/../outside.png", "/outside.png"])
+def test_manifest_path_escape_is_rejected(tmp_path: Path, relative: str) -> None:
+    root = tmp_path / "repo"
+    root.mkdir()
+    outside = tmp_path / "outside.png"
+    _write_live_png(outside)
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, [], hashes={})
+    manifest.write_text(
+        json.dumps(
+            {
+                "schema_version": 1,
+                "targets": [{"path": relative, "sha256": _sha256(outside)}],
+            }
+        ),
+        encoding="utf-8",
+    )
+
+    with pytest.raises(sanitizer.SanitizeError, match="path"):
+        sanitizer.execute_transaction(
+            mode="dry-run",
+            root=root,
+            manifest_path=manifest,
+            run_dir=root / "runs" / "escape",
+        )
+
+
+def test_symlink_or_junction_target_is_rejected(tmp_path: Path) -> None:
+    root = tmp_path / "repo"
+    actual_directory = tmp_path / "outside-assets"
+    actual = actual_directory / "actual.png"
+    link = root / "images" / "linked"
+    _write_live_png(actual)
+    link.parent.mkdir(parents=True, exist_ok=True)
+    try:
+        os.symlink(actual_directory, link, target_is_directory=True)
+    except (OSError, NotImplementedError):
+        if os.name != "nt":
+            pytest.fail("directory symlink creation unexpectedly failed")
+        completed = subprocess.run(
+            ["cmd", "/c", "mklink", "/J", str(link), str(actual_directory)],
+            capture_output=True,
+            text=True,
+            check=False,
+        )
+        assert completed.returncode == 0, completed.stderr
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, ["images/linked/actual.png"])
+
+    with pytest.raises(sanitizer.SanitizeError, match="symlink"):
+        sanitizer.execute_transaction(
+            mode="dry-run",
+            root=root,
+            manifest_path=manifest,
+            run_dir=root / "runs" / "symlink",
+        )
+
+
+def test_source_hash_mismatch_fails_before_candidate_generation(tmp_path: Path) -> None:
+    root = tmp_path / "repo"
+    relative = "images/source.png"
+    source = root / "images" / "source.png"
+    _write_live_png(source)
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, [relative], hashes={relative: "0" * 64})
+    run_dir = root / "runs" / "hash-mismatch"
+
+    with pytest.raises(sanitizer.SanitizeError, match="hash mismatch"):
+        sanitizer.execute_transaction(
+            mode="dry-run", root=root, manifest_path=manifest, run_dir=run_dir
+        )
+
+    assert not (run_dir / "candidate" / "images" / "source.png").exists()
+
+
+def test_unexpected_png_chunk_is_rejected_fail_closed(tmp_path: Path) -> None:
+    root = tmp_path / "repo"
+    relative = "images/metadata.png"
+    source = root / "images" / "metadata.png"
+    _write_live_png(source)
+    _insert_png_chunk(source, b"tEXt", b"comment\x00not allowed")
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, [relative])
+
+    with pytest.raises(sanitizer.SanitizeError, match="PNG chunk"):
+        sanitizer.execute_transaction(
+            mode="dry-run",
+            root=root,
+            manifest_path=manifest,
+            run_dir=root / "runs" / "chunk",
+        )
+
+
+def test_dry_run_redecodes_candidates_and_never_changes_sources(tmp_path: Path) -> None:
+    root = tmp_path / "repo"
+    relative = "images/source.png"
+    source = root / "images" / "source.png"
+    _write_live_png(source)
+    source_image = Image.open(source).copy()
+    for index, alpha in enumerate((1, 127, 254, 255)):
+        source_image.putpixel((620 + index, 627), (70 + index, 80, 90, alpha))
+    source_image.save(source, format="PNG")
+    before_bytes = source.read_bytes()
+    before_hash = _sha256(source)
+    manifest_path = root / "input-manifest.json"
+    expected_manifest = _write_manifest(manifest_path, root, [relative])
+    run_dir = root / "runs" / "dry-run"
+
+    report = sanitizer.execute_transaction(
+        mode="dry-run", root=root, manifest_path=manifest_path, run_dir=run_dir
+    )
+
+    candidate_path = run_dir / "candidate" / "images" / "source.png"
+    with Image.open(candidate_path) as opened:
+        candidate = opened.copy()
+    with Image.open(source) as opened:
+        source_after = opened.copy()
+    source_alpha = source_image.getchannel("A")
+    candidate_alpha = candidate.getchannel("A")
+    visible = [i for i, value in enumerate(source_alpha.getdata()) if value > 0]
+    source_pixels = list(source_image.getdata())
+    candidate_pixels = list(candidate.getdata())
+
+    assert source.read_bytes() == before_bytes
+    assert _sha256(source) == before_hash
+    assert source_after.tobytes() == source_image.tobytes()
+    assert candidate_alpha.tobytes() == source_alpha.tobytes()
+    assert [candidate_pixels[i] for i in visible] == [source_pixels[i] for i in visible]
+    assert candidate.getpixel((0, 0)) == (0, 0, 0, 0)
+    assert report["mode"] == "dry-run"
+    assert report["status"] == "dry_run_complete"
+    assert report["target_count"] == 1
+    assert report["source_hashes_unchanged"] is True
+    assert report["pixels_cleared_total"] > 0
+    assert json.loads((run_dir / "manifest.json").read_text(encoding="utf-8")) == expected_manifest
+    assert json.loads((run_dir / "report.json").read_text(encoding="utf-8")) == report
+    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
+    assert transaction["status"] == "dry_run_complete"
+    assert transaction["targets"][0]["state"] == "candidate_verified"
+    assert not (run_dir / "backup").exists()
+
+
+def test_candidate_redecode_failure_prevents_every_replacement(
+    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
+) -> None:
+    root = tmp_path / "repo"
+    relative_paths = ["images/a.png", "images/b.png"]
+    for index, relative in enumerate(relative_paths):
+        _write_live_png(root / Path(*relative.split("/")), marker_x=627 + index)
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, relative_paths)
+    originals = {
+        relative: (root / Path(*relative.split("/"))).read_bytes()
+        for relative in relative_paths
+    }
+    real_write = sanitizer._write_candidate_png
+
+    def corrupt_second_candidate(image: Image.Image, path: Path) -> None:
+        real_write(image, path)
+        if path.name == "b.png":
+            path.write_bytes(path.read_bytes()[:32])
+
+    replacements: list[tuple[Path, Path]] = []
+
+    def record_replacement(artifact: Path, source: Path) -> None:
+        replacements.append((artifact, source))
+
+    monkeypatch.setattr(sanitizer, "_write_candidate_png", corrupt_second_candidate)
+    monkeypatch.setattr(sanitizer, "_replace_source_from", record_replacement)
+
+    with pytest.raises(sanitizer.SanitizeError, match="candidate"):
+        sanitizer.execute_transaction(
+            mode="apply",
+            root=root,
+            manifest_path=manifest,
+            run_dir=root / "runs" / "candidate-corrupt",
+        )
+
+    assert replacements == []
+    for relative in relative_paths:
+        assert (root / Path(*relative.split("/"))).read_bytes() == originals[relative]
+
+
+def test_apply_uses_verified_backup_and_commits_sanitized_candidate(tmp_path: Path) -> None:
+    root = tmp_path / "repo"
+    relative = "images/source.png"
+    source = root / "images" / "source.png"
+    _write_live_png(source)
+    original = source.read_bytes()
+    original_hash = _sha256(source)
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, [relative])
+    run_dir = root / "runs" / "apply"
+
+    report = sanitizer.execute_transaction(
+        mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
+    )
+
+    backup = run_dir / "backup" / "images" / "source.png"
+    candidate = run_dir / "candidate" / "images" / "source.png"
+    assert backup.read_bytes() == original
+    assert _sha256(backup) == original_hash
+    assert source.read_bytes() == candidate.read_bytes()
+    assert source.read_bytes() != original
+    assert report["status"] == "applied"
+    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
+    assert transaction["status"] == "applied"
+    assert transaction["targets"][0]["state"] == "committed"
+
+
+def test_replacement_failure_rolls_back_only_committed_targets(
+    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
+) -> None:
+    root = tmp_path / "repo"
+    relative_paths = ["images/a.png", "images/b.png"]
+    for index, relative in enumerate(relative_paths):
+        _write_live_png(root / Path(*relative.split("/")), marker_x=627 + index)
+    manifest = root / "input-manifest.json"
+    _write_manifest(manifest, root, relative_paths)
+    originals = {
+        relative: (root / Path(*relative.split("/"))).read_bytes()
+        for relative in relative_paths
+    }
+    run_dir = root / "runs" / "rollback"
+    real_replace = sanitizer._replace_source_from
+    candidate_replacements = 0
+
+    def fail_second_candidate_replacement(artifact: Path, source: Path) -> None:
+        nonlocal candidate_replacements
+        if "candidate" in artifact.parts:
+            candidate_replacements += 1
+            if candidate_replacements == 2:
+                raise OSError("injected replacement failure")
+        real_replace(artifact, source)
+
+    monkeypatch.setattr(
+        sanitizer, "_replace_source_from", fail_second_candidate_replacement
+    )
+
+    with pytest.raises(sanitizer.SanitizeError, match="rolled back"):
+        sanitizer.execute_transaction(
+            mode="apply", root=root, manifest_path=manifest, run_dir=run_dir
+        )
+
+    assert candidate_replacements == 2
+    for relative in relative_paths:
+        source = root / Path(*relative.split("/"))
+        assert source.read_bytes() == originals[relative]
+        assert (run_dir / "candidate" / Path(*relative.split("/"))).exists()
+        assert (run_dir / "backup" / Path(*relative.split("/"))).read_bytes() == originals[relative]
+    transaction = json.loads((run_dir / "transaction.json").read_text(encoding="utf-8"))
+    assert transaction["status"] == "rolled_back"
+    assert [target["state"] for target in transaction["targets"]] == [
+        "rolled_back",
+        "backed_up",
+    ]
+    report = json.loads((run_dir / "report.json").read_text(encoding="utf-8"))
+    assert report["status"] == "rolled_back"
+    assert report["source_hashes_unchanged"] is True
+
+
+def test_cli_mode_requires_root_manifest_and_run_dir() -> None:
+    completed = subprocess.run(
+        [sys.executable, str(SCRIPT), "--dry-run"],
+        cwd=REPO_ROOT,
+        capture_output=True,
+        text=True,
+        check=False,
+    )
+
+    assert completed.returncode == 2
+    assert "--root" in completed.stderr
+    assert "--manifest" in completed.stderr
+    assert "--run-dir" in completed.stderr
` 

