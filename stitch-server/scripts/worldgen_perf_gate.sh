#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THRESHOLD_FILE="${THRESHOLD_FILE:-${SCRIPT_DIR}/worldgen_perf_thresholds.env}"

if [[ ! -f "$THRESHOLD_FILE" ]]; then
  echo "threshold file missing: $THRESHOLD_FILE" >&2
  exit 2
fi

# shellcheck disable=SC1090
source "$THRESHOLD_FILE"

MAX_AVG_MS="${WORLDGEN_PERF_MAX_AVG_MS:-}"
MAX_P95_MS="${WORLDGEN_PERF_MAX_P95_MS:-}"
MAX_PAYLOAD_BYTES="${WORLDGEN_PERF_MAX_PAYLOAD_BYTES:-}"

if [[ -z "$MAX_AVG_MS" || -z "$MAX_P95_MS" || -z "$MAX_PAYLOAD_BYTES" ]]; then
  echo "threshold file is missing one or more required variables:" >&2
  echo "  WORLDGEN_PERF_MAX_AVG_MS" >&2
  echo "  WORLDGEN_PERF_MAX_P95_MS" >&2
  echo "  WORLDGEN_PERF_MAX_PAYLOAD_BYTES" >&2
  exit 2
fi

cmd=(
  "${SCRIPT_DIR}/worldgen_perf_benchmark.sh"
  --max-avg-ms "$MAX_AVG_MS"
  --max-p95-ms "$MAX_P95_MS"
  --max-payload-bytes "$MAX_PAYLOAD_BYTES"
  "$@"
)

echo "[perf-gate] threshold_file=${THRESHOLD_FILE}"
echo "[perf-gate] max_avg_ms=${MAX_AVG_MS} max_p95_ms=${MAX_P95_MS} max_payload_bytes=${MAX_PAYLOAD_BYTES}"
exec "${cmd[@]}"
