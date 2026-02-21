#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
DIMENSION_ID="${DIMENSION_ID:-1}"
TMP_DIR="${TMP_DIR:-/tmp}"
DRY_RUN="${DRY_RUN:-0}"

usage() {
  cat <<USAGE
Worldgen operations gate bundle (determinism + perf + functional)

Usage:
  $(basename "$0") [options]

Options:
  --db <name>          Database name (default: ${DB_NAME})
  --server <addr>      Server address (default: ${SERVER})
  --region <id>        Region id for snapshots/functional checks (default: ${REGION_ID})
  --dimension <id>     Dimension id for functional checks (default: ${DIMENSION_ID})
  --tmp-dir <path>     Snapshot temporary directory (default: ${TMP_DIR})
  --dry-run            Print commands only
  -h, --help           Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db)
      DB_NAME="$2"; shift 2 ;;
    --server)
      SERVER="$2"; shift 2 ;;
    --region)
      REGION_ID="$2"; shift 2 ;;
    --dimension)
      DIMENSION_ID="$2"; shift 2 ;;
    --tmp-dir)
      TMP_DIR="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      usage
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2 ;;
  esac
done

run_cmd() {
  echo "+ $*"
  if [[ "$DRY_RUN" == "1" ]]; then
    return 0
  fi
  "$@"
}

mkdir -p "$TMP_DIR"
BASELINE="${TMP_DIR}/worldgen-baseline-${DB_NAME}-$(date +%Y%m%d-%H%M%S)-$$.snapshot"
CANDIDATE="${TMP_DIR}/worldgen-candidate-${DB_NAME}-$(date +%Y%m%d-%H%M%S)-$$.snapshot"

echo "[ops-gate] start db=${DB_NAME} server=${SERVER} region=${REGION_ID} dimension=${DIMENSION_ID}"

echo "[ops-gate] determinism snapshot #1"
run_cmd "${SCRIPT_DIR}/worldgen_determinism_snapshot.sh" \
  --db "$DB_NAME" \
  --server "$SERVER" \
  --region "$REGION_ID" \
  --out "$BASELINE"

echo "[ops-gate] determinism snapshot #2"
run_cmd "${SCRIPT_DIR}/worldgen_determinism_snapshot.sh" \
  --db "$DB_NAME" \
  --server "$SERVER" \
  --region "$REGION_ID" \
  --out "$CANDIDATE"

echo "[ops-gate] determinism compare"
run_cmd "${SCRIPT_DIR}/worldgen_determinism_compare.sh" "$BASELINE" "$CANDIDATE"

echo "[ops-gate] performance gate"
run_cmd "${SCRIPT_DIR}/worldgen_perf_gate.sh" \
  --db "$DB_NAME" \
  --server "$SERVER" \
  --region "$REGION_ID"

echo "[ops-gate] functional gate"
run_cmd "${SCRIPT_DIR}/worldgen_functional_gate.sh" \
  --db "$DB_NAME" \
  --server "$SERVER" \
  --region "$REGION_ID" \
  --dimension "$DIMENSION_ID"

echo "[ops-gate] PASS"
echo "[ops-gate] snapshots: baseline=${BASELINE} candidate=${CANDIDATE}"
