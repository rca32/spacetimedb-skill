#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT/stitch-bevy-client"

mkdir -p src/module_bindings
spacetime generate --lang rust \
  --out-dir src/module_bindings \
  --module-path "$REPO_ROOT/stitch-server/crates/game_server"

echo "generated rust bindings: stitch-bevy-client/src/module_bindings"

