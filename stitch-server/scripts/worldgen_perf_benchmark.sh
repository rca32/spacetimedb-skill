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
MAX_AVG_MS="${MAX_AVG_MS:-}"
MAX_P95_MS="${MAX_P95_MS:-}"
MAX_PAYLOAD_BYTES="${MAX_PAYLOAD_BYTES:-}"

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
  --max-avg-ms <ms>     Fail if avg generate_ms exceeds this threshold (optional)
  --max-p95-ms <ms>     Fail if p95 generate_ms exceeds this threshold (optional)
  --max-payload-bytes <bytes>
                        Fail if max payload_bytes_estimate exceeds this threshold (optional)
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
    --max-avg-ms)
      MAX_AVG_MS="$2"; shift 2 ;;
    --max-p95-ms)
      MAX_P95_MS="$2"; shift 2 ;;
    --max-payload-bytes)
      MAX_PAYLOAD_BYTES="$2"; shift 2 ;;
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

monotonic_ms() {
  if command -v perl >/dev/null 2>&1; then
    perl -MTime::HiRes=clock_gettime,CLOCK_MONOTONIC -e 'print int(clock_gettime(CLOCK_MONOTONIC)*1000), "\n"'
    return 0
  fi
  date +%s%3N
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
if [[ -n "$MAX_AVG_MS" ]] && ! [[ "$MAX_AVG_MS" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "max-avg-ms must be numeric" >&2
  exit 2
fi
if [[ -n "$MAX_P95_MS" ]] && ! [[ "$MAX_P95_MS" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "max-p95-ms must be numeric" >&2
  exit 2
fi
if [[ -n "$MAX_PAYLOAD_BYTES" ]] && ! [[ "$MAX_PAYLOAD_BYTES" =~ ^[0-9]+$ ]]; then
  echo "max-payload-bytes must be an unsigned integer" >&2
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
  start_ms="$(monotonic_ms)"
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" generate_world "$REGION_ID" "$SEED" "$SIZE_X_CHUNKS" "$SIZE_Y_CHUNKS" "$OVERWRITE"
  end_ms="$(monotonic_ms)"

  if [[ "$DRY_RUN" == "1" ]]; then
    generate_ms=0
    chunk_count=0
    resource_count=0
    payload_chunk_count=0
    payload_cell_count=0
    payload_bytes_estimate=0
  else
    generate_ms=$((end_ms - start_ms))
    if (( generate_ms < 0 )); then
      echo "[bench] warn: negative generate_ms observed (${generate_ms}); clamping to 0" >&2
      generate_ms=0
    fi
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

runs="$(awk -F',' 'NR > 1 { n += 1 } END { print n + 0 }' "$OUT_CSV")"
avg_ms="$(awk -F',' '
  NR == 1 { next }
  { n += 1; sum += $2 }
  END {
    if (n == 0) {
      print "0.00"
      exit
    }
    printf "%.2f", sum / n
  }
' "$OUT_CSV")"
min_ms="$(awk -F',' '
  NR == 1 { next }
  {
    if (!seen || $2 < min) min = $2
    seen = 1
  }
  END { print seen ? min : 0 }
' "$OUT_CSV")"
max_ms="$(awk -F',' '
  NR == 1 { next }
  {
    if (!seen || $2 > max) max = $2
    seen = 1
  }
  END { print seen ? max : 0 }
' "$OUT_CSV")"
max_payload_bytes_estimate="$(awk -F',' '
  NR == 1 { next }
  {
    if (!seen || $7 > max) max = $7
    seen = 1
  }
  END { print seen ? max : 0 }
' "$OUT_CSV")"

p95_ms=0
if (( runs > 0 )); then
  mapfile -t generate_ms_sorted < <(awk -F',' 'NR > 1 { print $2 }' "$OUT_CSV" | LC_ALL=C sort -n)
  p95_rank=$(( (95 * runs + 99) / 100 ))
  if (( p95_rank < 1 )); then
    p95_rank=1
  fi
  if (( p95_rank > runs )); then
    p95_rank="$runs"
  fi
  p95_index=$((p95_rank - 1))
  p95_ms="${generate_ms_sorted[$p95_index]}"
fi

summary="runs=${runs} avg_ms=${avg_ms} p95_ms=${p95_ms} min_ms=${min_ms} max_ms=${max_ms} max_payload_bytes_estimate=${max_payload_bytes_estimate}"

echo "[bench] csv: ${OUT_CSV}"
echo "[bench] ${summary}"

threshold_failed=0

if [[ -n "$MAX_AVG_MS" ]]; then
  if awk -v value="$avg_ms" -v limit="$MAX_AVG_MS" 'BEGIN { exit !(value <= limit) }'; then
    echo "[bench] threshold ok: avg_ms=${avg_ms} <= ${MAX_AVG_MS}"
  else
    echo "[bench] threshold failed: avg_ms=${avg_ms} > ${MAX_AVG_MS}" >&2
    threshold_failed=1
  fi
fi

if [[ -n "$MAX_P95_MS" ]]; then
  if awk -v value="$p95_ms" -v limit="$MAX_P95_MS" 'BEGIN { exit !(value <= limit) }'; then
    echo "[bench] threshold ok: p95_ms=${p95_ms} <= ${MAX_P95_MS}"
  else
    echo "[bench] threshold failed: p95_ms=${p95_ms} > ${MAX_P95_MS}" >&2
    threshold_failed=1
  fi
fi

if [[ -n "$MAX_PAYLOAD_BYTES" ]]; then
  if (( max_payload_bytes_estimate <= MAX_PAYLOAD_BYTES )); then
    echo "[bench] threshold ok: max_payload_bytes_estimate=${max_payload_bytes_estimate} <= ${MAX_PAYLOAD_BYTES}"
  else
    echo "[bench] threshold failed: max_payload_bytes_estimate=${max_payload_bytes_estimate} > ${MAX_PAYLOAD_BYTES}" >&2
    threshold_failed=1
  fi
fi

if (( threshold_failed != 0 )); then
  exit 1
fi
