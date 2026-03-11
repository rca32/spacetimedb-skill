#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MODULE_PATH="${SPACETIME_MODULE_PATH:-"${CLIENT_DIR}/../stitch-server/crates/game_server"}"
OUT_DIR="${CLIENT_DIR}/src/module_bindings"

mkdir -p "${OUT_DIR}"

spacetime generate --lang typescript \
  --out-dir "${OUT_DIR}" \
  --module-path "${MODULE_PATH}"
