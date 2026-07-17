#!/usr/bin/env python3
"""Read-only, registry-driven validation for the office image asset library."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from dataclasses import dataclass
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import sys
from typing import Any, Iterable, Mapping, Sequence

import numpy as np
from PIL import Image, ImageFilter, UnidentifiedImageError


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
CANONICAL_ASSET_PATH = re.compile(r"^images/[A-Za-z0-9._/-]+\.png$")
POLICY_LIMITS: Mapping[str, float | None] = {
    "shadow_glow_forbidden": 0.03,
    "contact_shadow_allowed": 0.10,
    "glow_allowed": 0.20,
    "opaque_scene": None,
}


class AuditError(ValueError):
    """Raised when the registry itself cannot be audited safely."""


@dataclass(frozen=True)
class Finding:
    code: str
    message: str
    path: str | None = None
    severity: str = "error"

    def as_dict(self) -> dict[str, str]:
        result = {"code": self.code, "severity": self.severity, "message": self.message}
        if self.path is not None:
            result["path"] = self.path
        return result


@dataclass(frozen=True)
class CategoryContract:
    expected_size: tuple[int, int]
    expected_mode: str
    max_bytes: int

    def as_dict(self) -> dict[str, Any]:
        return {
            "expected_size": list(self.expected_size),
            "expected_mode": self.expected_mode,
            "max_bytes": self.max_bytes,
        }


@dataclass(frozen=True)
class AssetAudit:
    path: str
    sha256: str
    size_bytes: int
    dimensions: tuple[int, int] | None
    mode: str | None
    policy: str
    policy_limit: float | None
    metrics: Mapping[str, int | float]
    findings: tuple[Finding, ...]

    @property
    def ok(self) -> bool:
        return not any(finding.severity == "error" for finding in self.findings)

    def as_dict(self) -> dict[str, Any]:
        return {
            "path": self.path,
            "sha256": self.sha256,
            "size_bytes": self.size_bytes,
            "dimensions": list(self.dimensions) if self.dimensions is not None else None,
            "mode": self.mode,
            "policy": self.policy,
            "policy_limit": self.policy_limit,
            "metrics": dict(self.metrics),
            "status": "pass" if self.ok else "fail",
            "findings": [finding.as_dict() for finding in self.findings],
        }


PRODUCTION_CONTRACTS: Mapping[str, CategoryContract] = {
    "avatars": CategoryContract((1254, 1254), "RGBA", 512 * 1024),
    "artifact": CategoryContract((1254, 1254), "RGBA", 512 * 1024),
    "furniture": CategoryContract((1254, 1254), "RGBA", 512 * 1024),
    "orb": CategoryContract((1254, 1254), "RGBA", 768 * 1024),
    "scene": CategoryContract((1672, 941), "RGB", 3 * 1024 * 1024),
}


def _validate_registry_path(path: str) -> None:
    parts = PurePosixPath(path).parts
    if (
        not CANONICAL_ASSET_PATH.fullmatch(path)
        or "\\" in path
        or "//" in path
        or any(part in {"", ".", ".."} for part in parts)
    ):
        raise AuditError(f"asset path is not canonical: {path!r}")


def collect_registered_paths(layout: Mapping[str, Any]) -> list[str]:
    """Collect every image `path` field and reject ambiguous registries."""

    collected: list[str] = []

    def visit(value: Any) -> None:
        if isinstance(value, Mapping):
            for key, child in value.items():
                if key == "path":
                    if not isinstance(child, str):
                        raise AuditError("every registry path must be a string")
                    _validate_registry_path(child)
                    collected.append(child)
                else:
                    visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(layout)
    duplicates = sorted(path for path, count in Counter(collected).items() if count > 1)
    if duplicates:
        raise AuditError(f"duplicate registered asset paths: {duplicates}")
    return collected


def category_for_path(path: str) -> str:
    _validate_registry_path(path)
    parts = PurePosixPath(path).parts
    if len(parts) < 3:
        raise AuditError(f"asset path has no category: {path!r}")
    return parts[1]


def policy_for_path(path: str) -> str:
    category = category_for_path(path)
    basename = PurePosixPath(path).name
    if category == "scene":
        return "opaque_scene"
    if category == "orb":
        return "glow_allowed"
    if category == "furniture":
        return "contact_shadow_allowed"
    if category == "avatars" and basename in {"idle.png", "at-desk.png", "walk.png", "carry.png"}:
        return "contact_shadow_allowed"
    return "shadow_glow_forbidden"


def _decode_png(data: bytes) -> Image.Image:
    if not data.startswith(PNG_SIGNATURE):
        raise UnidentifiedImageError("missing PNG signature")
    with Image.open(io.BytesIO(data)) as probe:
        if probe.format != "PNG":
            raise UnidentifiedImageError(f"expected PNG, got {probe.format}")
        probe.verify()
    with Image.open(io.BytesIO(data)) as decoded:
        decoded.load()
        return decoded.copy()


def audit_asset_bytes(
    path: str,
    data: bytes,
    *,
    expected_size: tuple[int, int],
    expected_mode: str,
    max_bytes: int,
    policy: str,
) -> AssetAudit:
    """Audit one immutable PNG byte snapshot against an explicit contract."""

    _validate_registry_path(path)
    if policy not in POLICY_LIMITS:
        raise AuditError(f"unknown category policy: {policy!r}")
    digest = hashlib.sha256(data).hexdigest()
    findings: list[Finding] = []
    metrics: dict[str, int | float] = {}
    dimensions: tuple[int, int] | None = None
    mode: str | None = None

    if len(data) > max_bytes:
        findings.append(
            Finding(
                "file.compressed_budget",
                f"compressed size {len(data)} exceeds budget {max_bytes}",
                path,
            )
        )

    try:
        image = _decode_png(data)
    except (OSError, SyntaxError, UnidentifiedImageError, ValueError) as exc:
        findings.append(Finding("png.decode", f"PNG decode failed: {exc}", path))
        return AssetAudit(
            path,
            digest,
            len(data),
            dimensions,
            mode,
            policy,
            POLICY_LIMITS[policy],
            metrics,
            tuple(findings),
        )

    dimensions = image.size
    mode = image.mode
    if dimensions != expected_size:
        findings.append(
            Finding(
                "png.dimensions",
                f"dimensions {dimensions} do not match expected {expected_size}",
                path,
            )
        )
    if mode != expected_mode:
        findings.append(
            Finding("png.mode", f"mode {mode!r} does not match expected {expected_mode!r}", path)
        )

    if mode == "RGBA":
        pixels = np.asarray(image, dtype=np.uint8)
        alpha = pixels[..., 3]
        visible = alpha > 0
        visible_count = int(np.count_nonzero(visible))
        total_pixels = int(alpha.size)
        transparent_count = total_pixels - visible_count
        partial_count = int(np.count_nonzero((alpha > 0) & (alpha < 255)))
        partial_fraction = partial_count / visible_count if visible_count else 0.0
        metrics.update(
            {
                "total_pixels": total_pixels,
                "visible_pixels": visible_count,
                "transparent_pixels": transparent_count,
                "alpha_occupancy_fraction": visible_count / total_pixels,
                "partial_alpha_pixels": partial_count,
                "partial_alpha_fraction": partial_fraction,
            }
        )

        if visible_count == 0:
            findings.append(Finding("alpha.empty", "Alpha plane has no visible pixels", path))

        corner_visible = int(
            visible[0, 0]
            + visible[0, -1]
            + visible[-1, 0]
            + visible[-1, -1]
        )
        metrics["visible_corner_pixels"] = corner_visible
        if corner_visible:
            findings.append(
                Finding("alpha.corner_not_transparent", "one or more canvas corners are visible", path)
            )

        edge_mask = np.zeros_like(visible, dtype=bool)
        edge_mask[0, :] = True
        edge_mask[-1, :] = True
        edge_mask[:, 0] = True
        edge_mask[:, -1] = True
        edge_visible = int(np.count_nonzero(visible & edge_mask))
        metrics["visible_edge_pixels"] = edge_visible
        if edge_visible:
            findings.append(
                Finding("alpha.edge_contact", f"{edge_visible} visible pixels touch the canvas edge", path)
            )

        visible_rgb = pixels[..., :3][visible]
        chroma_count = (
            int(np.count_nonzero(np.all(visible_rgb == np.array([0, 255, 0], dtype=np.uint8), axis=1)))
            if visible_count
            else 0
        )
        metrics["visible_exact_chroma_pixels"] = chroma_count
        if chroma_count:
            findings.append(
                Finding(
                    "color.visible_chroma_key",
                    f"{chroma_count} visible pixels use exact #00ff00",
                    path,
                )
            )

        visible_mask = Image.fromarray((visible.astype(np.uint8) * 255), mode="L")
        within_two = np.asarray(visible_mask.filter(ImageFilter.MaxFilter(5)), dtype=np.uint8) > 0
        transparent_nonzero_rgb = (~visible) & np.any(pixels[..., :3] != 0, axis=2)
        protected = transparent_nonzero_rgb & within_two
        far = transparent_nonzero_rgb & (~within_two)
        protected_count = int(np.count_nonzero(protected))
        far_count = int(np.count_nonzero(far))
        metrics["protected_halo_rgb_pixels"] = protected_count
        metrics["far_hidden_rgb_pixels"] = far_count
        if far_count:
            findings.append(
                Finding(
                    "transparent_rgb.far_nonzero",
                    f"{far_count} transparent pixels retain RGB beyond the 2px halo",
                    path,
                )
            )

        limit = POLICY_LIMITS[policy]
        if limit is not None and partial_fraction > limit:
            findings.append(
                Finding(
                    "policy.partial_alpha_fraction",
                    f"partial-alpha fraction {partial_fraction:.6f} exceeds {policy} limit {limit:.6f}",
                    path,
                )
            )
    elif mode == "RGB":
        pixels = np.asarray(image, dtype=np.uint8)
        total_pixels = image.width * image.height
        chroma_count = int(
            np.count_nonzero(
                np.all(pixels == np.array([0, 255, 0], dtype=np.uint8), axis=2)
            )
        )
        metrics.update(
            {
                "total_pixels": total_pixels,
                "visible_pixels": total_pixels,
                "transparent_pixels": 0,
                "alpha_occupancy_fraction": 1.0,
                "visible_exact_chroma_pixels": chroma_count,
            }
        )
        if chroma_count:
            findings.append(
                Finding(
                    "color.visible_chroma_key",
                    f"{chroma_count} visible pixels use exact #00ff00",
                    path,
                )
            )
    elif expected_mode == "RGBA":
        metrics.update(
            {
                "total_pixels": image.width * image.height,
                "visible_pixels": 0,
                "transparent_pixels": 0,
                "alpha_occupancy_fraction": 0.0,
                "partial_alpha_pixels": 0,
                "partial_alpha_fraction": 0.0,
                "visible_corner_pixels": 0,
                "visible_edge_pixels": 0,
                "visible_exact_chroma_pixels": 0,
                "protected_halo_rgb_pixels": 0,
                "far_hidden_rgb_pixels": 0,
            }
        )

    return AssetAudit(
        path,
        digest,
        len(data),
        dimensions,
        mode,
        policy,
        POLICY_LIMITS[policy],
        metrics,
        tuple(findings),
    )


def duplicate_sha_findings(results: Sequence[AssetAudit]) -> tuple[Finding, ...]:
    by_sha: dict[str, list[str]] = defaultdict(list)
    for result in results:
        by_sha[result.sha256].append(result.path)
    findings: list[Finding] = []
    for digest, paths in sorted(by_sha.items()):
        if len(paths) < 2:
            continue
        ordered = sorted(paths)
        for path in ordered:
            peers = [peer for peer in ordered if peer != path]
            findings.append(
                Finding(
                    "sha.duplicate",
                    f"byte-identical SHA-256 {digest} is shared with {peers}",
                    path,
                )
            )
    return tuple(findings)


def _resolve_exact_regular_file(root: Path, relative_path: str) -> Path:
    _validate_registry_path(relative_path)
    current = root
    for index, segment in enumerate(PurePosixPath(relative_path).parts):
        try:
            matches = [entry for entry in current.iterdir() if entry.name == segment]
        except OSError as exc:
            raise AuditError(f"cannot enumerate {current}: {exc}") from exc
        if len(matches) != 1:
            raise AuditError(f"path does not exist with exact case: {relative_path}")
        current = matches[0]
        if current.is_symlink():
            raise AuditError(f"symlinks are not allowed in asset paths: {relative_path}")
        if index < len(PurePosixPath(relative_path).parts) - 1 and not current.is_dir():
            raise AuditError(f"non-directory component in asset path: {relative_path}")
    if not current.is_file():
        raise AuditError(f"asset is not a regular file: {relative_path}")
    try:
        current.resolve(strict=True).relative_to(root.resolve(strict=True))
    except ValueError as exc:
        raise AuditError(f"asset resolves outside root: {relative_path}") from exc
    return current


def _disk_png_paths(root: Path) -> set[str]:
    image_root = root / "images"
    if not image_root.is_dir() or image_root.is_symlink():
        raise AuditError(f"image root is missing or unsafe: {image_root}")
    paths: set[str] = set()
    for candidate in image_root.rglob("*.png"):
        if candidate.is_symlink() or not candidate.is_file():
            continue
        paths.add(candidate.relative_to(root).as_posix())
    return paths


def audit_repository(
    root: Path,
    layout_path: Path,
    *,
    expected_count: int = 81,
    contracts: Mapping[str, CategoryContract] = PRODUCTION_CONTRACTS,
) -> dict[str, Any]:
    """Audit the complete registered repository without mutating it."""

    root = root.resolve(strict=True)
    if not layout_path.is_absolute():
        layout_path = root / layout_path
    layout_path = layout_path.resolve(strict=True)
    try:
        layout_path.relative_to(root)
    except ValueError as exc:
        raise AuditError("layout must be inside the repository root") from exc

    layout = json.loads(layout_path.read_text(encoding="utf-8"))
    registered = collect_registered_paths(layout)
    findings: list[Finding] = []
    if len(registered) != expected_count:
        findings.append(
            Finding(
                "registry.asset_count",
                f"registered {len(registered)} assets; expected exactly {expected_count}",
            )
        )

    disk_paths = _disk_png_paths(root)
    registered_set = set(registered)
    for path in sorted(disk_paths - registered_set):
        findings.append(
            Finding("registry.unregistered_disk_asset", "PNG exists on disk but is not registered", path)
        )
    for path in sorted(registered_set - disk_paths):
        findings.append(Finding("registry.missing_disk_asset", "registered PNG is absent on disk", path))

    results: list[AssetAudit] = []
    for path in registered:
        category = category_for_path(path)
        contract = contracts.get(category)
        if contract is None:
            findings.append(Finding("registry.unknown_category", f"no contract for category {category!r}", path))
            continue
        try:
            source = _resolve_exact_regular_file(root, path)
            data = source.read_bytes()
        except (AuditError, OSError) as exc:
            findings.append(Finding("registry.path", str(exc), path))
            continue
        results.append(
            audit_asset_bytes(
                path,
                data,
                expected_size=contract.expected_size,
                expected_mode=contract.expected_mode,
                max_bytes=contract.max_bytes,
                policy=policy_for_path(path),
            )
        )

    duplicate_findings = duplicate_sha_findings(results)
    findings.extend(duplicate_findings)
    for result in results:
        findings.extend(result.findings)

    category_counts = Counter(category_for_path(path) for path in registered)
    policy_counts = Counter(result.policy for result in results)
    error_count = sum(finding.severity == "error" for finding in findings)
    failed_paths = {finding.path for finding in findings if finding.severity == "error" and finding.path}
    return {
        "schema_version": 1,
        "status": "pass" if error_count == 0 else "fail",
        "root": str(root),
        "layout": layout_path.relative_to(root).as_posix(),
        "summary": {
            "expected_assets": expected_count,
            "registered_assets": len(registered),
            "disk_png_assets": len(disk_paths),
            "audited_assets": len(results),
            "passed_assets": sum(result.ok for result in results),
            "failed_asset_paths": len(failed_paths),
            "error_findings": error_count,
            "duplicate_sha_groups": len(
                {result.sha256 for result in results if sum(peer.sha256 == result.sha256 for peer in results) > 1}
            ),
            "bytes_total": sum(result.size_bytes for result in results),
            "categories": dict(sorted(category_counts.items())),
            "policies": dict(sorted(policy_counts.items())),
        },
        "contracts": {category: contract.as_dict() for category, contract in sorted(contracts.items())},
        "policy_limits": dict(POLICY_LIMITS),
        "findings": [finding.as_dict() for finding in findings],
        "assets": [result.as_dict() for result in results],
    }


def _failure_report(root: Path, layout: Path, exc: BaseException) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "status": "fail",
        "root": str(root),
        "layout": str(layout),
        "summary": {
            "expected_assets": 81,
            "registered_assets": 0,
            "disk_png_assets": 0,
            "audited_assets": 0,
            "passed_assets": 0,
            "failed_asset_paths": 0,
            "error_findings": 1,
            "duplicate_sha_groups": 0,
            "bytes_total": 0,
            "categories": {},
            "policies": {},
        },
        "contracts": {
            category: contract.as_dict() for category, contract in sorted(PRODUCTION_CONTRACTS.items())
        },
        "policy_limits": dict(POLICY_LIMITS),
        "findings": [Finding("audit.exception", f"{type(exc).__name__}: {exc}").as_dict()],
        "assets": [],
    }


def _report_path(argument: str) -> Path:
    return Path(argument).expanduser().resolve()


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, help="repository root")
    parser.add_argument("--layout", required=True, help="layout JSON, relative to root or absolute")
    parser.add_argument("--json", required=True, help="output JSON report")
    args = parser.parse_args(argv)

    root = Path(args.root).expanduser().resolve()
    layout = Path(args.layout)
    if not layout.is_absolute():
        layout = root / layout
    output = _report_path(args.json)
    try:
        report = audit_repository(root, layout)
    except BaseException as exc:  # The requested report must survive every audit failure.
        report = _failure_report(root, layout, exc)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "status": report["status"],
                "registered_assets": report["summary"]["registered_assets"],
                "audited_assets": report["summary"]["audited_assets"],
                "error_findings": report["summary"]["error_findings"],
                "report": str(output),
            },
            sort_keys=True,
        )
    )
    return 0 if report["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
