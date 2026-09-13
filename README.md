# Forest

Preview, diff, and open git worktree copies of the note you have open.

## Files outside the vault

Desktop only. Forest reads git worktrees that live **outside** the vault, using Node `fs` and `git`. It can open those paths in your OS file manager (`xdg-open` / `open`). It does not write vault files. Obsidian cannot treat those paths as `TFile`s.

## Use

Requires Obsidian 1.10.0 or newer.

1. Open a note that also exists in another git worktree.
2. Open Forest from the trees icon on the note header, the status bar count, or **Show Forest**.
3. Each copy can preview, diff against the vault file, open the file, or open the worktree folder.
4. **Open preview and diff** chooses split or a new tab.

If the Lanes plugin is enabled, card Worktree fields and a card right-click menu call into Forest.

License is 0BSD.

## Install for development

Plugin id is `forest`. Obsidian loads `Vault/.obsidian/plugins/forest/`.

Depends on a sibling checkout of [effect-obsidian](https://github.com/tyler-dot-earth/effect-obsidian):

```text
effect-obsidian/
obsidian-forest/
```

```bash
cd effect-obsidian && pnpm install
cd ../obsidian-forest && pnpm install && pnpm build
```

Symlink only `main.js`, `manifest.json`, and `styles.css`. Add `"forest"` to `community-plugins.json`. Reload Obsidian.

## Scripts

```bash
pnpm check
pnpm dev
pnpm build
pnpm release -- patch
```
