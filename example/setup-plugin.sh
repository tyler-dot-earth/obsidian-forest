#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
plugin_dir="$repo_root/example/vault/.obsidian/plugins/forest"

mkdir -p "$plugin_dir"
ln -sfn "$repo_root/main.js" "$plugin_dir/main.js"
ln -sfn "$repo_root/manifest.json" "$plugin_dir/manifest.json"
ln -sfn "$repo_root/styles.css" "$plugin_dir/styles.css"
