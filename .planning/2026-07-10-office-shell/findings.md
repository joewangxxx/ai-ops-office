# Findings — Task 2 shell

- `apps/office-demo` did not exist before this task.
- Node.js `v20.16.0` and npm `10.8.1` are available.
- `docs/office-layout.json` already holds the 1672 × 941 logical scene, asset paths, and desk/hub coordinates.
- The approved implementation plan already identifies this work as its Task 2; scope stops before desk, Avatar, Hub, Artifact, and Orb rendering.
- The root workspace is not a Git repository, so a Git worktree is not applicable.
- Build failure root cause: `vite.config.ts` imported `defineConfig` from `vite`, whose `UserConfig` does not include Vitest's `test` field. Local `node_modules/vitest/dist/config.d.ts` exports the Vitest-aware overload, so the config must import `defineConfig` from `vitest/config`.
