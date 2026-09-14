# Sample vault

One note, plus two git worktrees outside the vault, so Forest has copies to preview and diff.

Worktrees must sit **outside** the vault. This setup puts them in `example/worktrees/`, next to `example/vault/`.

## Open it

From the plugin repo root, after `pnpm build`:

```bash
bash example/setup-plugin.sh
bash example/setup-worktrees.sh
```

In Obsidian, **Open folder as vault** and pick `example/vault`. Settings → Community plugins → turn **Restricted mode** off, then enable **Forest**. Open `notes/trail-notes.md`. Use the trees icon on the note header, or **Show Forest**.

You should see `draft` and `review`. Differs on `draft`.

Do not symlink the whole plugin repo into `.obsidian/plugins`. Do not symlink the worktrees into the vault.
