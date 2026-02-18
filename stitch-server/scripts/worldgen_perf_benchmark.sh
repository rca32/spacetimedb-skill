#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
SEED="${SEED:-1337}"
SIZE_X_CHUNKS="${SIZE_X_CHUNKS:-7}"
SIZE_Y_CHUNKS="${SIZE_Y_CHUNKS:-7}"
ITERATIONS="${ITERATIONS:-3}"
OVERWRITE="${OVERWRITE:-true}"
WARMUP="${WARMUP:-1}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"
OUT_CSV="${OUT_CSV:-/tmp/worldgen-perf-${DB_NAME}-$(date +%Y%m%d-%H%M%S).csv}"

usage() {
  cat <<USAGE
Worldgen performance benchmark (CLI)

Usage:
  $(basename "$0") [options]

Options:
  --db <name>           Database name (default: ${DB_NAME})
  --server <addr>       Server address (default: ${SERVER})
  --region <id>         Region id (default: ${REGION_ID})
  --seed <u64>          Seed for generate_world (default: ${SEED})
  --size-x <i32>        Chunk width (default: ${SIZE_X_CHUNKS})
  --size-y <i32>        Chunk height (default: ${SIZE_Y_CHUNKS})
  --iterations <n>      Number of benchmark runs (default: ${ITERATIONS})
  --overwrite <bool>    generate_world overwrite flag (default: ${OVERWRITE})
  --no-warmup           Skip warmup generate_world call
  --out <path>          CSV output path (default: ${OUT_CSV})
  --dry-run             Print commands only
  -h, --help            Show this help
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
    --seed)
      SEED="$2"; shift 2 ;;
    --size-x)
      SIZE_X_CHUNKS="$2"; shift 2 ;;
    --size-y)
      SIZE_Y_CHUNKS="$2"; shift 2 ;;
    --iterations)
      ITERATIONS="$2"; shift 2 ;;
    --overwrite)
      OVERWRITE="$2"; shift 2 ;;
    --no-warmup)
      WARMUP=0; shift ;;
    --out)
      OUT_CSV="$2"; shift 2 ;;
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

sql_output() {
  local query="$1"
  spacetime sql --server "$SERVER" "$DB_NAME" "$query"
}

canon_sql() {
  local query="$1"
  sql_output "$query" | awk '
    /^WARNING:/ { next }
    NF == 0 { next }
    !header_seen { header_seen = 1; next }
    !separator_seen {
      line = $0
      gsub(/[[:space:]]/, "", line)
      if (line ~ /^[-+]+$/) {
        separator_seen = 1
        next
      }
      separator_seen = 1
    }
    {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $0)
      gsub(/[[:space:]]*\|[[:space:]]*/, "|", $0)
      print
    }
  '
}

scalar_sql() {
  local query="$1"
  local rows
  rows="$(canon_sql "$query")"
  if [[ -z "$rows" ]]; then
    echo 0
    return 0
  fi
  printf '%s\n' "$rows" | head -n1 | cut -d'|' -f1 | tr -d '"'
}

sum_first_column() {
  local rows="$1"
  if [[ -z "$rows" ]]; then
    echo 0
    return 0
  fi
  printf '%s\n' "$rows" | awk -F'|' '{ gsub(/"/, "", $1); sum += $1 } END { printf "%d", sum + 0 }'
}

normalize_bool() {
  local value="$1"
  case "$value" in
    true|false)
      echo "$value"
      ;;
    1)
      echo "true"
      ;;
    0)
      echo "false"
      ;;
    *)
      echo "invalid bool: $value (expected true/false/1/0)" >&2
      exit 2
      ;;
  esac
}

OVERWRITE="$(normalize_bool "$OVERWRITE")"

if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$ITERATIONS" -lt 1 ]]; then
  echo "iterations must be positive integer" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT_CSV")"

echo "iteration,generate_ms,chunk_count,resource_count,payload_chunk_count,payload_cell_count,payload_bytes_estimate" > "$OUT_CSV"

echo "[bench] start: db=${DB_NAME} server=${SERVER} region=${REGION_ID} iterations=${ITERATIONS}"
run_cmd spacetime sql --server "$SERVER" "$DB_NAME" "SELECT COUNT(*) AS count FROM world_gen_params"

if [[ "$WARMUP" == "1" ]]; then
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" generate_world "$REGION_ID" "$SEED" "$SIZE_X_CHUNKS" "$SIZE_Y_CHUNKS" "$OVERWRITE"
fi

for ((i=1; i<=ITERATIONS; i++)); do
  start_ms="$(date +%s%3N)"
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" generate_world "$REGION_ID" "$SEED" "$SIZE_X_CHUNKS" "$SIZE_Y_CHUNKS" "$OVERWRITE"
  end_ms="$(date +%s%3N)"

  if [[ "$DRY_RUN" == "1" ]]; then
    generate_ms=0
    chunk_count=0
    resource_count=0
    payload_chunk_count=0
    payload_cell_count=0
    payload_bytes_estimate=0
  else
    generate_ms=$((end_ms - start_ms))
    chunk_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk WHERE region_id = ${REGION_ID}")"
    resource_count="$(scalar_sql "SELECT COUNT(*) AS count FROM resource_node WHERE region_id = ${REGION_ID}")"
    payload_chunk_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk_payload WHERE region_id = ${REGION_ID}")"
    payload_cell_rows="$(canon_sql "SELECT cell_count FROM terrain_chunk_payload WHERE region_id = ${REGION_ID}")"
    payload_cell_count="$(sum_first_column "$payload_cell_rows")"
    payload_bytes_estimate=$((payload_cell_count * 8))
  fi

  echo "${i},${generate_ms},${chunk_count},${resource_count},${payload_chunk_count},${payload_cell_count},${payload_bytes_estimate}" >> "$OUT_CSV"
  echo "[bench] iter=${i} generate_ms=${generate_ms} chunks=${chunk_count} resources=${resource_count} payload_bytes_est=${payload_bytes_estimate}"
done

summary="$(awk -F',' '
  NR == 1 { next }
  {
    n += 1
    sum += $2
    if (n == 1 || $2 < min) min = $2
    if (n == 1 || $2 > max) max = $2
  }
  END {
    if (n == 0) {
      print "runs=0 avg_ms=0 min_ms=0 max_ms=0"
      exit
    }
    avg = sum / n
    printf "runs=%d avg_ms=%.2f min_ms=%d max_ms=%d", n, avg, min, max
  }
' "$OUT_CSV")"

echo "[bench] csv: ${OUT_CSV}"
echo "[bench] ${summary}"
