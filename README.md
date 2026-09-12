# Forest 🌳

Git worktree copies of the note you have open in Obsidian.

The vault is one checkout. Other git worktrees live outside it. Forest lists those copies in a right sidebar, previews or diffs them in a split, and can open them in the default app. Command palette still works. A trees action on the note header opens the sidebar.

Desktop only. Obsidian cannot treat paths outside the vault as `TFile`s.

## Install for development

Plugin id is `forest`. Obsidian loads `Vault/.obsidian/plugins/forest/`.

Depends on a sibling checkout of `effect-obsidian`:

```text
~/effect-obsidian
~/obsidian-forest
```

```bash
cd ~/effect-obsidian && pnpm install
cd ~/obsidian-forest && pnpm install && pnpm build
```

Symlink only `main.js`, `manifest.json`, and `styles.css`. Add `"forest"` to `community-plugins.json`. Reload Obsidian.

Requires Obsidian 1.10.0 or newer.

## Scripts

```bash
pnpm check
pnpm dev
pnpm build
```
