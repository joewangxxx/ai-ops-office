# Task 4 Frontend Asset Gate Report

## TDD evidence

The manifest test was written before the package scripts.

### Effective RED

```text
cd apps/office-demo
npm test -- tests/asset-manifest.test.ts
```

Result: exit 1; 8/10 assertions passed and the two expected assertions failed because `scripts.verify:assets` and `scripts.verify` were undefined. The 81-path, uniqueness, exact-case, regular-file, PNG signature, IHDR, dimensions, bit-depth and color-type assertions already passed.

An earlier collection attempt exposed a Windows/Vitest `import.meta.url` fixture issue; the test-only repository-root lookup was corrected before recording the effective behavioral RED.

### GREEN

After the minimal `package.json` script additions:

```text
npm test -- tests/asset-manifest.test.ts
```

Result: exit 0; 1 file and 10/10 tests passed.

```text
npm run verify
```

Result: exit 0; full frontend suite passed 9 files/57 tests, the focused asset gate passed 10/10, and `tsc -b && vite build` completed successfully.

## Contracts enforced

- Exactly 81 registered image paths and no duplicates.
- Every path resolves against exact directory-entry casing and ends at a regular file.
- Every file has a PNG signature and first 13-byte IHDR.
- Scene: 1672×941, 8-bit RGB.
- Other 80 assets: 1254×1254, 8-bit RGBA.
- `verify:assets = vitest run tests/asset-manifest.test.ts`.
- `verify = npm test && npm run verify:assets && npm run build`.
- Existing `test = vitest run` remains unchanged, preserving targeted argument forwarding.

## Changed-file boundary

- Created `apps/office-demo/tests/asset-manifest.test.ts`.
- Modified only the `scripts` object in `apps/office-demo/package.json`.
- No image, registry, source component, or documentation file was modified by this subtask; no ImageGen or Git state-changing operation occurred.
