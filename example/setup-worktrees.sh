#!/usr/bin/env bash
set -euo pipefail

example_root=$(cd "$(dirname "$0")" && pwd)
vault="$example_root/vault"
worktrees="$example_root/worktrees"

cd "$vault"

if [[ ! -d .git ]]; then
	git init
	git add .
	git -c user.name='Forest sample' -c user.email='forest-sample@example.com' commit -m 'Sample vault'
fi

mkdir -p "$worktrees"

add_sample_worktree() {
	local branch=$1
	local dest=$2

	if [[ -d $dest ]]; then
		return
	fi

	git worktree add -b "$branch" "$dest"
}

add_sample_worktree draft "$worktrees/draft"
add_sample_worktree review "$worktrees/review"

cat >"$worktrees/draft/notes/trail-notes.md" <<'EOF'
---
title: East ridge
---

# East ridge

The switchback after the creek is gone. Tape is up. Detour on the fire road until the county grades it.

Water at the second saddle was a trickle on Tuesday. Carry more than you think.
EOF
