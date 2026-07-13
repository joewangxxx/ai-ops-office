# Progress — Task 2 shell

## 2026-07-10
- Loaded the existing product Spec and implementation plan, then confirmed Task 2 scope and runtime versions.
- Began the Orb-document correction and test-first shell setup.
- Added the failing `app-shell` smoke test and ran it. It failed for the expected reason: `src/app/App` does not yet exist.
- Installed test/build dependencies; adjusted Vite dependencies to the installed Node 20.16 runtime after the first install reported its Vite 7 engine mismatch.
- `npm run build` reproduced a Vite-config type failure. Root cause investigation confirmed the config was using Vite's non-Vitest-aware `defineConfig`; applied the single import-source correction.
- Rebuilt successfully after the configuration correction, then browser-checked the desktop and 390 × 844 narrow layouts. Narrow mode has `scrollWidth === innerWidth` and a visually hidden Inspector; desktop has no horizontal overflow and a flex Inspector.
- Final regression: `npm test` passed 1/1, `npm run build` passed, requested Orb meanings matched the Task 1 JSON, both screenshots had their expected dimensions, and the scene source SHA-256 remained `BE73EB5179DA24C6AA1E37F0103D6D732F33B505791844D5434FB0078F3C581D`.
