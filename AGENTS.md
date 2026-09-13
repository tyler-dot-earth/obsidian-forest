# Forest

Obsidian plugin. 🌳 Git worktree copies of the active note. Plugin id `forest`. Desktop only.

Commands list copies for the open file, then preview, diff against the vault file, or open the copy in the default app. Worktrees outside the vault are read with Node `fs`. Do not symlink worktrees into the vault.

## Layout

- `src/main.ts` is the Plugin host: onload/onunload, commands, views, status bar
- Package imports: `#/src/...`
- Effect programs live in named modules, not in the Plugin class
- `effect-obsidian` is a sibling repo (`../effect-obsidian`), consumed via `file:`
- Release artifacts at repo root: `main.js`, `manifest.json`, `styles.css`

## Effect

- Latest Effect v4 rc. Lean on `Effect`, `Schema`, `Match`, `Option`, `Array`, `Result`, `Layer`, `Logger`.
- Plugin class is the host boundary. `onload` may `await runtime.runPromise(...)`
- Inside Effect modules: no `async`/`await`, no `try`/`catch`, no `Date.now`
- IO uses `Effect.fn("Worktrees.operation")` and `Schema.TaggedError`. Vanilla DOM stays outside Effect.
- Tests: `@effect/vitest` `it.effect` and `assert`

## UI

- Vanilla DOM. No React
- Sidebar (`forest`) lists copies of the active note. Preview and diff open as split or a new tab (`openTarget`, default split). Commands still use FuzzySuggestModal.
- Public plugin methods for Lanes: `listCopiesForFile`, `previewWorktreeCopy`, `openWorktreeDirectory`.

## Install into a vault

Plugin id is `forest`. After `pnpm build` or `pnpm dev`, symlink (preferred) or copy only `main.js`, `manifest.json`, and `styles.css` into `Vault/.obsidian/plugins/forest/`. Do not symlink the whole repo. Add `"forest"` to `community-plugins.json` without dropping other ids.

## Tooling

- pnpm, oxfmt, oxlint (type-aware), vitest, esbuild
- Vendored anti-slop at `tools/oxlint/anti-slop/` (generic + Effect plugins)
- `pnpm check` before push
