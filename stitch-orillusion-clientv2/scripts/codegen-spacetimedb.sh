#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKSPACE_ROOT="$(cd "${CLIENT_ROOT}/.." && pwd)"

MODULE_PATH="${WORKSPACE_ROOT}/stitch-server/crates/game_server"
OUT_DIR="${CLIENT_ROOT}/src/module_bindings"
INCLUDE_PRIVATE=0
DRY_RUN=0

usage() {
  cat <<'USAGE'
Generate SpacetimeDB TypeScript bindings for stitch-orillusion-clientv2.

Usage:
  codegen-spacetimedb.sh [options]

Options:
  --module-path <path>    SpacetimeDB module path (default: ../stitch-server/crates/game_server)
  --out-dir <path>        Output directory for bindings (default: ./src/module_bindings)
  --include-private       Include private tables/functions in generated bindings
  --dry-run               Print command only
  -h, --help              Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --module-path)
      MODULE_PATH="$2"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="$2"
      shift 2
      ;;
    --include-private)
      INCLUDE_PRIVATE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if ! command -v spacetime >/dev/null 2>&1; then
  echo "spacetime CLI not found in PATH." >&2
  exit 1
fi

if [[ ! -d "${MODULE_PATH}" ]]; then
  echo "Module path does not exist: ${MODULE_PATH}" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

cmd=(spacetime generate --lang typescript --out-dir "${OUT_DIR}" --module-path "${MODULE_PATH}")
if [[ "${INCLUDE_PRIVATE}" == "1" ]]; then
  cmd=(spacetime generate --include-private --lang typescript --out-dir "${OUT_DIR}" --module-path "${MODULE_PATH}")
fi

echo "Codegen reference:"
echo "  SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00200-codegen.md"
echo "  SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00700-typescript-reference.md"
echo "Running: ${cmd[*]}"

if [[ "${DRY_RUN}" == "1" ]]; then
  exit 0
fi

"${cmd[@]}"
echo "Bindings generated at: ${OUT_DIR}"
