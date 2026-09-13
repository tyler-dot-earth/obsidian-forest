#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

bump="${1:-patch}"

case "$bump" in
	patch | minor | major) ;;
	*)
		echo "usage: pnpm release -- [patch|minor|major]" >&2
		exit 1
		;;
esac

if [[ -n "$(git status --porcelain)" ]]; then
	echo "release: working tree is dirty" >&2
	exit 1
fi

pnpm check
pnpm version "$bump"
git push github HEAD --follow-tags
git push origin HEAD --follow-tags

if command -v gh >/dev/null 2>&1; then
	gh run watch --exit-status
fi
