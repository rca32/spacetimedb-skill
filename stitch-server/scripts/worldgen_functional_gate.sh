#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
DIMENSION_ID="${DIMENSION_ID:-1}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"

usage() {
  cat <<USAGE
Worldgen functional regression gate (P1/P2/P3)

Usage:
  $(basename "$0") [options]

Options:
  --db <name>         Database name (default: ${DB_NAME})
  --server <addr>     Server address (default: ${SERVER})
  --region <id>       Region id (default: ${REGION_ID})
  --dimension <id>    Dimension id (default: ${DIMENSION_ID})
  --dry-run           Print commands only
  -h, --help          Show this help
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

assert_eq() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "[functional-gate] assert failed: ${label} (expected=${expected}, actual=${actual})" >&2
    exit 1
  fi
  echo "[functional-gate] ${label}: ${actual}"
}

assert_int_ge() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if (( actual < expected )); then
    echo "[functional-gate] assert failed: ${label} (expected >= ${expected}, actual=${actual})" >&2
    exit 1
  fi
  echo "[functional-gate] ${label}: ${actual}"
}

assert_int_le() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if (( actual > expected )); then
    echo "[functional-gate] assert failed: ${label} (expected <= ${expected}, actual=${actual})" >&2
    exit 1
  fi
  echo "[functional-gate] ${label}: ${actual}"
}

echo "[functional-gate] start db=${DB_NAME} server=${SERVER} region=${REGION_ID} dimension=${DIMENSION_ID}"

run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" start_world_agents
run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" set_worldgen_lazy_params true 1 4 1
run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" generate_world_from_params_in_dimension "$REGION_ID" "$DIMENSION_ID" true

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[functional-gate] dry-run complete"
  exit 0
fi

initial_chunk_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
assert_int_ge "$initial_chunk_count" 1 "initial chunk count"

initial_queue_count="$(scalar_sql "SELECT COUNT(*) AS count FROM worldgen_chunk_generation_queue WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
assert_int_ge "$initial_queue_count" 1 "initial lazy queue count"

run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" request_chunks_for_aoi "$REGION_ID" "$DIMENSION_ID" -3 3 -3 3

after_enqueue_queue_count="$(scalar_sql "SELECT COUNT(*) AS count FROM worldgen_chunk_generation_queue WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
assert_int_ge "$after_enqueue_queue_count" "$initial_queue_count" "queue count after AOI request"

run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" drain_chunk_generation_queue_now
run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" drain_chunk_generation_queue_now

after_drain_queue_count="$(scalar_sql "SELECT COUNT(*) AS count FROM worldgen_chunk_generation_queue WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
after_drain_chunk_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
assert_int_le "$after_drain_queue_count" "$after_enqueue_queue_count" "queue drained"
assert_int_ge "$after_drain_chunk_count" "$initial_chunk_count" "chunk count after drain"

payload_versions="$(canon_sql "SELECT MIN(cell_payload_version) AS min_v, MAX(cell_payload_version) AS max_v FROM terrain_chunk_payload WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
if [[ -z "$payload_versions" ]]; then
  echo "[functional-gate] no payload rows" >&2
  exit 1
fi
min_v="$(printf '%s\n' "$payload_versions" | head -n1 | cut -d'|' -f1 | tr -d '"')"
max_v="$(printf '%s\n' "$payload_versions" | head -n1 | cut -d'|' -f2 | tr -d '"')"
assert_eq "$min_v" "2" "min payload version"
assert_eq "$max_v" "2" "max payload version"

water_chunks="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID} AND water_ratio_permille > 0")"
assert_int_ge "$water_chunks" 1 "water-bearing chunks"

resource_row="$(canon_sql "SELECT entity_id, amount FROM resource_node WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID} AND is_depleted = false ORDER BY entity_id LIMIT 1")"
if [[ -z "$resource_row" ]]; then
  echo "[functional-gate] resource row not found" >&2
  exit 1
fi
resource_entity_id="$(printf '%s\n' "$resource_row" | cut -d'|' -f1 | tr -d '"')"
resource_amount_before="$(printf '%s\n' "$resource_row" | cut -d'|' -f2 | tr -d '"')"
assert_int_ge "$resource_amount_before" 1 "resource amount before harvest"

run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" harvest_resource "$resource_entity_id" 1
resource_after_row="$(canon_sql "SELECT amount, is_depleted FROM resource_node WHERE entity_id = ${resource_entity_id}")"
resource_amount_after="$(printf '%s\n' "$resource_after_row" | head -n1 | cut -d'|' -f1 | tr -d '"')"
assert_int_le "$resource_amount_after" "$resource_amount_before" "resource amount after harvest"

run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" harvest_resource "$resource_entity_id" 1000 || true
resource_depleted_row="$(canon_sql "SELECT amount, is_depleted FROM resource_node WHERE entity_id = ${resource_entity_id}")"
resource_depleted_flag="$(printf '%s\n' "$resource_depleted_row" | head -n1 | cut -d'|' -f2 | tr -d '"')"
if [[ "$resource_depleted_flag" != "true" && "$resource_depleted_flag" != "false" ]]; then
  echo "[functional-gate] invalid depletion flag: ${resource_depleted_flag}" >&2
  exit 1
fi

dupe_row="$(canon_sql "SELECT COUNT(*) AS total, COUNT(DISTINCT entity_id) AS uniq FROM resource_node WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
total_count="$(printf '%s\n' "$dupe_row" | head -n1 | cut -d'|' -f1 | tr -d '"')"
uniq_count="$(printf '%s\n' "$dupe_row" | head -n1 | cut -d'|' -f2 | tr -d '"')"
assert_eq "$total_count" "$uniq_count" "resource entity uniqueness"

echo "[functional-gate] PASS"
