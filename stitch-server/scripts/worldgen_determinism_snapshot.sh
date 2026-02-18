#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
SEED="${SEED:-1337}"
SIZE_X_CHUNKS="${SIZE_X_CHUNKS:-7}"
SIZE_Y_CHUNKS="${SIZE_Y_CHUNKS:-7}"
OVERWRITE="${OVERWRITE:-true}"
SKIP_GENERATE="${SKIP_GENERATE:-0}"
SKIP_PATH_PROBE="${SKIP_PATH_PROBE:-0}"
START_HEX_X="${START_HEX_X:-2}"
START_HEX_Z="${START_HEX_Z:-2}"
GOAL_HEX_X="${GOAL_HEX_X:-7}"
GOAL_HEX_Z="${GOAL_HEX_Z:-4}"
NODE_LIMIT="${NODE_LIMIT:-512}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"
OUT_FILE="${OUT_FILE:-/tmp/worldgen-determinism-${DB_NAME}-$(date +%Y%m%d-%H%M%S).snapshot}"

usage() {
  cat <<USAGE
Worldgen deterministic snapshot capture

Usage:
  $(basename "$0") [options]

Options:
  --db <name>               Database name (default: ${DB_NAME})
  --server <addr>           Server address (default: ${SERVER})
  --region <id>             Region id (default: ${REGION_ID})
  --seed <u64>              Seed for generate_world (default: ${SEED})
  --size-x <i32>            Chunk width (default: ${SIZE_X_CHUNKS})
  --size-y <i32>            Chunk height (default: ${SIZE_Y_CHUNKS})
  --overwrite <bool>        generate_world overwrite flag (default: ${OVERWRITE})
  --skip-generate           Do not call generate_world before snapshot
  --skip-path-probe         Do not run request_path probe
  --start <x> <z>           Path probe start hex (default: ${START_HEX_X} ${START_HEX_Z})
  --goal <x> <z>            Path probe goal hex (default: ${GOAL_HEX_X} ${GOAL_HEX_Z})
  --node-limit <u32>        Path probe node limit (default: ${NODE_LIMIT})
  --out <path>              Snapshot output path (default: ${OUT_FILE})
  --dry-run                 Print commands only
  -h, --help                Show this help

Environment:
  DB_NAME, SERVER, REGION_ID, SEED, SIZE_X_CHUNKS, SIZE_Y_CHUNKS,
  OVERWRITE, SKIP_GENERATE, SKIP_PATH_PROBE, START_HEX_X, START_HEX_Z,
  GOAL_HEX_X, GOAL_HEX_Z, NODE_LIMIT, DRY_RUN, OUT_FILE, YES_FLAG
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
    --overwrite)
      OVERWRITE="$2"; shift 2 ;;
    --skip-generate)
      SKIP_GENERATE=1; shift ;;
    --skip-path-probe)
      SKIP_PATH_PROBE=1; shift ;;
    --start)
      START_HEX_X="$2"; START_HEX_Z="$3"; shift 3 ;;
    --goal)
      GOAL_HEX_X="$2"; GOAL_HEX_Z="$3"; shift 3 ;;
    --node-limit)
      NODE_LIMIT="$2"; shift 2 ;;
    --out)
      OUT_FILE="$2"; shift 2 ;;
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

hash_rows() {
  local rows="$1"
  if [[ -z "$rows" ]]; then
    printf '' | sha256sum | awk '{print $1}'
    return 0
  fi
  printf '%s\n' "$rows" | LC_ALL=C sort | sha256sum | awk '{print $1}'
}

count_rows() {
  local rows="$1"
  if [[ -z "$rows" ]]; then
    echo 0
    return 0
  fi
  printf '%s\n' "$rows" | sed '/^$/d' | wc -l | tr -d ' '
}

first_field() {
  local rows="$1"
  printf '%s\n' "$rows" | head -n1 | cut -d'|' -f1
}

trim_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  echo "$value"
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

if [[ ! "$REGION_ID" =~ ^[0-9]+$ ]]; then
  echo "region must be unsigned integer" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT_FILE")"

echo "[snapshot] start: db=${DB_NAME} server=${SERVER} region=${REGION_ID}"
run_cmd spacetime sql --server "$SERVER" "$DB_NAME" "SELECT COUNT(*) AS count FROM world_gen_params"

if [[ "$SKIP_GENERATE" != "1" ]]; then
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" generate_world "$REGION_ID" "$SEED" "$SIZE_X_CHUNKS" "$SIZE_Y_CHUNKS" "$OVERWRITE"
fi

if [[ "$DRY_RUN" == "1" ]]; then
  cat > "$OUT_FILE" <<SNAPSHOT
snapshot_version=1
captured_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
db_name=${DB_NAME}
server=${SERVER}
region_id=${REGION_ID}
seed_requested=${SEED}
size_x_requested=${SIZE_X_CHUNKS}
size_y_requested=${SIZE_Y_CHUNKS}
overwrite_requested=${OVERWRITE}
skip_generate=${SKIP_GENERATE}
skip_path_probe=${SKIP_PATH_PROBE}
start_hex_x=${START_HEX_X}
start_hex_z=${START_HEX_Z}
goal_hex_x=${GOAL_HEX_X}
goal_hex_z=${GOAL_HEX_Z}
node_limit=${NODE_LIMIT}
worldgen_count=0
terrain_count=0
payload_count=0
resource_count=0
worldgen_fingerprint=dry_run
terrain_fingerprint=dry_run
payload_fingerprint=dry_run
resource_fingerprint=dry_run
path_probe_status=dry_run
path_probe_step_count=0
path_probe_explored_nodes=0
path_probe_fingerprint=dry_run
SNAPSHOT
  echo "[snapshot] dry-run wrote: ${OUT_FILE}"
  exit 0
fi

path_probe_status="n/a"
path_probe_step_count="0"
path_probe_explored_nodes="0"
path_probe_fingerprint="$(printf '' | sha256sum | awk '{print $1}')"

if [[ "$SKIP_PATH_PROBE" != "1" ]]; then
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" sign_in "$REGION_ID"
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" prune_expired_paths 0
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" request_path "$REGION_ID" "$START_HEX_X" "$START_HEX_Z" "$GOAL_HEX_X" "$GOAL_HEX_Z" "$NODE_LIMIT"

  path_result_rows="$(canon_sql "SELECT path_id, status, step_count, explored_nodes FROM path_result WHERE region_id = ${REGION_ID} AND start_hex_x = ${START_HEX_X} AND start_hex_z = ${START_HEX_Z} AND goal_hex_x = ${GOAL_HEX_X} AND goal_hex_z = ${GOAL_HEX_Z}")"
  if [[ -z "$path_result_rows" ]]; then
    echo "path probe failed: no path_result row" >&2
    exit 1
  fi

  path_id_raw="$(first_field "$path_result_rows")"
  path_id="$(trim_quotes "$path_id_raw")"
  path_probe_status="$(printf '%s\n' "$path_result_rows" | head -n1 | cut -d'|' -f2)"
  path_probe_step_count="$(printf '%s\n' "$path_result_rows" | head -n1 | cut -d'|' -f3)"
  path_probe_explored_nodes="$(printf '%s\n' "$path_result_rows" | head -n1 | cut -d'|' -f4)"

  path_steps_rows="$(canon_sql "SELECT step_index, hex_x, hex_z FROM path_step WHERE path_id = '${path_id}'")"
  path_probe_payload="$(printf '%s\n' "$path_result_rows" | cut -d'|' -f2-4; printf '%s\n' "$path_steps_rows")"
  path_probe_fingerprint="$(hash_rows "$path_probe_payload")"
fi

worldgen_rows="$(canon_sql "SELECT id, enabled, version, seed, size_x_chunks, size_y_chunks, terrain_chunk_size FROM world_gen_params WHERE id = 1")"
terrain_rows="$(canon_sql "SELECT chunk_key, biome_id, height_min, height_max, water_ratio_permille, seed FROM terrain_chunk WHERE region_id = ${REGION_ID}")"
payload_rows="$(canon_sql "SELECT chunk_key, cell_count, cell_payload_version FROM terrain_chunk_payload WHERE region_id = ${REGION_ID}")"
resource_rows="$(canon_sql "SELECT entity_id, chunk_x, chunk_y, hex_x, hex_z, resource_type, amount, max_amount, clump_id FROM resource_node WHERE region_id = ${REGION_ID}")"

terrain_count="$(count_rows "$terrain_rows")"
payload_count="$(count_rows "$payload_rows")"
resource_count="$(count_rows "$resource_rows")"

terrain_fingerprint="$(hash_rows "$terrain_rows")"
payload_fingerprint="$(hash_rows "$payload_rows")"
resource_fingerprint="$(hash_rows "$resource_rows")"
worldgen_fingerprint="$(hash_rows "$worldgen_rows")"

captured_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$OUT_FILE" <<SNAPSHOT
snapshot_version=1
captured_at=${captured_at}
db_name=${DB_NAME}
server=${SERVER}
region_id=${REGION_ID}
seed_requested=${SEED}
size_x_requested=${SIZE_X_CHUNKS}
size_y_requested=${SIZE_Y_CHUNKS}
overwrite_requested=${OVERWRITE}
skip_generate=${SKIP_GENERATE}
skip_path_probe=${SKIP_PATH_PROBE}
start_hex_x=${START_HEX_X}
start_hex_z=${START_HEX_Z}
goal_hex_x=${GOAL_HEX_X}
goal_hex_z=${GOAL_HEX_Z}
node_limit=${NODE_LIMIT}
worldgen_count=$(count_rows "$worldgen_rows")
terrain_count=${terrain_count}
payload_count=${payload_count}
resource_count=${resource_count}
worldgen_fingerprint=${worldgen_fingerprint}
terrain_fingerprint=${terrain_fingerprint}
payload_fingerprint=${payload_fingerprint}
resource_fingerprint=${resource_fingerprint}
path_probe_status=${path_probe_status}
path_probe_step_count=${path_probe_step_count}
path_probe_explored_nodes=${path_probe_explored_nodes}
path_probe_fingerprint=${path_probe_fingerprint}
SNAPSHOT

echo "[snapshot] wrote: ${OUT_FILE}"
cat "$OUT_FILE"
