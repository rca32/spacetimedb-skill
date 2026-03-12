#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
DELETE_DATA_MODE="${DELETE_DATA_MODE:-always}"
SKIP_PUBLISH="${SKIP_PUBLISH:-0}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"
PATH_START_HEX_X="${PATH_START_HEX_X:-2}"
PATH_START_HEX_Z="${PATH_START_HEX_Z:-2}"
PATH_GOAL_HEX_X="${PATH_GOAL_HEX_X:-7}"
PATH_GOAL_HEX_Z="${PATH_GOAL_HEX_Z:-4}"
PATH_NODE_LIMIT="${PATH_NODE_LIMIT:-512}"
DIMENSION_ID="${DIMENSION_ID:-2}"
DIMENSION_SEED="${DIMENSION_SEED:-4242}"
DIMENSION_SIZE_X="${DIMENSION_SIZE_X:-3}"
DIMENSION_SIZE_Y="${DIMENSION_SIZE_Y:-3}"
DIM_PATH_START_HEX_X="${DIM_PATH_START_HEX_X:-0}"
DIM_PATH_START_HEX_Z="${DIM_PATH_START_HEX_Z:-0}"
DIM_PATH_GOAL_HEX_X="${DIM_PATH_GOAL_HEX_X:-3}"
DIM_PATH_GOAL_HEX_Z="${DIM_PATH_GOAL_HEX_Z:-3}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRATE_DIR="$(cd "${SCRIPT_DIR}/../crates/game_server" && pwd)"

usage() {
  cat <<USAGE
Full smoke gate for stitch-server publish + seed + world + movement/path checks

Usage:
  $(basename "$0") [options]

Options:
  --db <name>                 Database name (default: ${DB_NAME})
  --server <addr>             Server address (default: ${SERVER})
  --region <id>               Region id for sign-in and tests (default: ${REGION_ID})
  --delete-data <always|never>
                              Publish delete-data mode (default: ${DELETE_DATA_MODE})
  --skip-publish              Skip publish step and run checks on current DB
  --path-start <x> <z>        Path probe start hex (default: ${PATH_START_HEX_X} ${PATH_START_HEX_Z})
  --path-goal <x> <z>         Path probe goal hex (default: ${PATH_GOAL_HEX_X} ${PATH_GOAL_HEX_Z})
  --path-node-limit <u32>     Path probe node limit (default: ${PATH_NODE_LIMIT})
  --dimension <id>            Dimension id for dimension smoke checks (default: ${DIMENSION_ID})
  --dimension-seed <u64>      Seed used by in-dimension worldgen checks (default: ${DIMENSION_SEED})
  --dimension-size <x> <y>    Chunk size for in-dimension worldgen checks (default: ${DIMENSION_SIZE_X} ${DIMENSION_SIZE_Y})
  --dimension-path-start <x> <z>
                              Path start hex in dimension smoke checks (default: ${DIM_PATH_START_HEX_X} ${DIM_PATH_START_HEX_Z})
  --dimension-path-goal <x> <z>
                              Path goal hex in dimension smoke checks (default: ${DIM_PATH_GOAL_HEX_X} ${DIM_PATH_GOAL_HEX_Z})
  --dry-run                   Print commands only
  -h, --help                  Show this help
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
    --delete-data)
      DELETE_DATA_MODE="$2"; shift 2 ;;
    --skip-publish)
      SKIP_PUBLISH=1; shift ;;
    --path-start)
      PATH_START_HEX_X="$2"; PATH_START_HEX_Z="$3"; shift 3 ;;
    --path-goal)
      PATH_GOAL_HEX_X="$2"; PATH_GOAL_HEX_Z="$3"; shift 3 ;;
    --path-node-limit)
      PATH_NODE_LIMIT="$2"; shift 2 ;;
    --dimension)
      DIMENSION_ID="$2"; shift 2 ;;
    --dimension-seed)
      DIMENSION_SEED="$2"; shift 2 ;;
    --dimension-size)
      DIMENSION_SIZE_X="$2"; DIMENSION_SIZE_Y="$3"; shift 3 ;;
    --dimension-path-start)
      DIM_PATH_START_HEX_X="$2"; DIM_PATH_START_HEX_Z="$3"; shift 3 ;;
    --dimension-path-goal)
      DIM_PATH_GOAL_HEX_X="$2"; DIM_PATH_GOAL_HEX_Z="$3"; shift 3 ;;
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

call_reducer() {
  local reducer="$1"
  shift
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" "$reducer" "$@"
}

call_reducer_expect_fail() {
  local reducer="$1"
  shift
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "+ spacetime call --server ${SERVER} ${YES_FLAG} ${DB_NAME} ${reducer} $* (expect-fail)"
    return 0
  fi
  local output
  local status=0
  set +e
  output="$(spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" "$reducer" "$@" 2>&1)"
  status=$?
  set -e
  if [[ "$status" == "0" ]]; then
    echo "[smoke] expected reducer failure but call succeeded: ${reducer}" >&2
    exit 1
  fi
  printf '%s\n' "$output"
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

trim_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  echo "$value"
}

assert_int_ge() {
  local actual="$1"
  local threshold="$2"
  local label="$3"
  if ! [[ "$actual" =~ ^-?[0-9]+$ ]]; then
    echo "[smoke] ${label}: non-integer value: ${actual}" >&2
    exit 1
  fi
  if (( actual < threshold )); then
    echo "[smoke] ${label}: expected >= ${threshold}, got ${actual}" >&2
    exit 1
  fi
  echo "[smoke] ${label}: ${actual} (>= ${threshold})"
}

assert_eq() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "[smoke] ${label}: expected '${expected}', got '${actual}'" >&2
    exit 1
  fi
  echo "[smoke] ${label}: ${actual}"
}

echo "[smoke] start: db=${DB_NAME} server=${SERVER} region=${REGION_ID} skip_publish=${SKIP_PUBLISH}"
run_cmd spacetime server ping local

if [[ "$SKIP_PUBLISH" != "1" ]]; then
  publish_args=(publish --server "$SERVER" "$DB_NAME" "$YES_FLAG")
  case "$DELETE_DATA_MODE" in
    always)
      publish_args=(publish --server "$SERVER" --delete-data=always "$YES_FLAG" "$DB_NAME")
      ;;
    never)
      publish_args=(publish --server "$SERVER" "$YES_FLAG" "$DB_NAME")
      ;;
    *)
      echo "invalid --delete-data value: ${DELETE_DATA_MODE} (expected always|never)" >&2
      exit 2
      ;;
  esac

  echo "+ (cd ${CRATE_DIR} && spacetime ${publish_args[*]})"
  if [[ "$DRY_RUN" != "1" ]]; then
    (
      cd "$CRATE_DIR"
      spacetime "${publish_args[@]}"
    )
  fi
fi

call_reducer seed_data
call_reducer import_csv_data
call_reducer start_world_agents

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[smoke] dry-run complete"
  exit 0
fi

item_count="$(scalar_sql "SELECT COUNT(*) AS count FROM item_def")"
terrain_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk")"
payload_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk_payload")"
npc_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_state")"
resource_count="$(scalar_sql "SELECT COUNT(*) AS count FROM resource_node")"

assert_int_ge "$item_count" 1 "item_def count"
assert_int_ge "$terrain_count" 1 "terrain_chunk count"
assert_int_ge "$payload_count" 1 "terrain_chunk_payload count"
assert_int_ge "$npc_count" 1 "npc_state count"
assert_int_ge "$resource_count" 1 "resource_node count"

call_reducer sign_in "$REGION_ID"
player_identity="$(trim_quotes "$(scalar_sql "SELECT identity FROM player_session_view LIMIT 1")")"
if [[ -z "$player_identity" ]]; then
  echo "[smoke] player_session_view missing after sign_in" >&2
  exit 1
fi
player_identity_sql="0x${player_identity#0x}"
call_reducer prune_expired_paths 0
call_reducer request_path "$REGION_ID" "$PATH_START_HEX_X" "$PATH_START_HEX_Z" "$PATH_GOAL_HEX_X" "$PATH_GOAL_HEX_Z" "$PATH_NODE_LIMIT"

path_rows="$(canon_sql "SELECT status, step_count, explored_nodes FROM path_result WHERE region_id = ${REGION_ID} AND start_hex_x = ${PATH_START_HEX_X} AND start_hex_z = ${PATH_START_HEX_Z} AND goal_hex_x = ${PATH_GOAL_HEX_X} AND goal_hex_z = ${PATH_GOAL_HEX_Z}")"
if [[ -z "$path_rows" ]]; then
  echo "[smoke] path probe failed: no matching path_result row" >&2
  exit 1
fi

path_status="$(printf '%s\n' "$path_rows" | head -n1 | cut -d'|' -f1)"
path_step_count="$(printf '%s\n' "$path_rows" | head -n1 | cut -d'|' -f2)"
path_explored="$(printf '%s\n' "$path_rows" | head -n1 | cut -d'|' -f3)"

assert_eq "$path_status" "1" "path_result status"
assert_int_ge "$path_step_count" 1 "path_result step_count"
assert_int_ge "$path_explored" 1 "path_result explored_nodes"

call_reducer generate_world_in_dimension "$REGION_ID" "$DIMENSION_ID" "$DIMENSION_SEED" "$DIMENSION_SIZE_X" "$DIMENSION_SIZE_Y" true
call_reducer generate_world_from_params_in_dimension "$REGION_ID" "$DIMENSION_ID" true
call_reducer regenerate_chunks_in_dimension "$REGION_ID" "$DIMENSION_ID" 0 0 0 0
call_reducer set_active_dimension "$DIMENSION_ID"

dimension_chunk_count="$(scalar_sql "SELECT COUNT(*) AS count FROM terrain_chunk WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
dimension_session_count="$(scalar_sql "SELECT COUNT(*) AS count FROM session_state WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
assert_int_ge "$dimension_chunk_count" 1 "terrain_chunk count (dimension=${DIMENSION_ID})"
assert_int_ge "$dimension_session_count" 1 "session_state count (dimension=${DIMENSION_ID})"

call_reducer request_path_in_dimension \
  "$REGION_ID" \
  "$DIMENSION_ID" \
  "$DIM_PATH_START_HEX_X" \
  "$DIM_PATH_START_HEX_Z" \
  "$DIM_PATH_GOAL_HEX_X" \
  "$DIM_PATH_GOAL_HEX_Z" \
  "$PATH_NODE_LIMIT"

dim_path_rows="$(canon_sql "SELECT status, step_count, explored_nodes FROM path_result WHERE region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID} AND start_hex_x = ${DIM_PATH_START_HEX_X} AND start_hex_z = ${DIM_PATH_START_HEX_Z} AND goal_hex_x = ${DIM_PATH_GOAL_HEX_X} AND goal_hex_z = ${DIM_PATH_GOAL_HEX_Z}")"
if [[ -z "$dim_path_rows" ]]; then
  echo "[smoke] dimension path probe failed: no matching path_result row" >&2
  exit 1
fi

dim_path_status="$(printf '%s\n' "$dim_path_rows" | head -n1 | cut -d'|' -f1)"
dim_path_step_count="$(printf '%s\n' "$dim_path_rows" | head -n1 | cut -d'|' -f2)"
dim_path_explored="$(printf '%s\n' "$dim_path_rows" | head -n1 | cut -d'|' -f3)"
assert_eq "$dim_path_status" "1" "path_result status (dimension=${DIMENSION_ID})"
assert_int_ge "$dim_path_step_count" 1 "path_result step_count (dimension=${DIMENSION_ID})"
assert_int_ge "$dim_path_explored" 1 "path_result explored_nodes (dimension=${DIMENSION_ID})"

invalid_dimension_output="$(call_reducer_expect_fail set_active_dimension 999999)"
if [[ "$invalid_dimension_output" != *"target dimension does not exist"* ]]; then
  echo "[smoke] set_active_dimension invalid-dimension error mismatch" >&2
  echo "$invalid_dimension_output" >&2
  exit 1
fi
echo "[smoke] set_active_dimension invalid dimension rejection: ok"

run_id="$(date +%s%3N)"
motion_ok="motion_ok_${run_id}"
motion_bad="motion_bad_${run_id}"
ts="$(date +%s%3N)"
correction_id="${motion_bad}:2:terrain_missing"

call_reducer sync_client_frame 1 "$REGION_ID" "$DIMENSION_ID" "$ts"
call_reducer submit_motion_intent "\"${motion_ok}\"" "$REGION_ID" "$DIMENSION_ID" 1 1.0 0.0 10.0 false

motion_row="$(canon_sql "SELECT intent_id, frame_no FROM motion_intent WHERE intent_id = '${motion_ok}'")"
if [[ -z "$motion_row" ]]; then
  echo "[smoke] motion_intent missing for ${motion_ok}" >&2
  exit 1
fi
motion_frame="$(printf '%s\n' "$motion_row" | head -n1 | cut -d'|' -f2)"
assert_eq "$motion_frame" "1" "motion_intent frame_no (${motion_ok})"

physics_row="$(canon_sql "SELECT last_intent_id, dimension_id FROM physics_state WHERE entity_id = ${player_identity_sql}")"
if [[ -z "$physics_row" ]]; then
  echo "[smoke] physics_state missing for ${player_identity_sql}" >&2
  exit 1
fi
physics_intent="$(trim_quotes "$(printf '%s\n' "$physics_row" | head -n1 | cut -d'|' -f1)")"
physics_dimension="$(printf '%s\n' "$physics_row" | head -n1 | cut -d'|' -f2)"
assert_eq "$physics_intent" "$motion_ok" "physics_state last_intent_id"
assert_eq "$physics_dimension" "$DIMENSION_ID" "physics_state dimension_id"

call_reducer sync_client_frame 2 "$REGION_ID" 999999 "$((ts + 16))"
call_reducer submit_motion_intent "\"${motion_bad}\"" "$REGION_ID" 999999 2 1.0 0.0 10.0 false

correction_row="$(canon_sql "SELECT correction_id, reason, acknowledged FROM server_correction WHERE correction_id = '${correction_id}'")"
if [[ -z "$correction_row" ]]; then
  echo "[smoke] server_correction missing for ${correction_id}" >&2
  exit 1
fi
correction_reason="$(trim_quotes "$(printf '%s\n' "$correction_row" | head -n1 | cut -d'|' -f2)")"
correction_acked="$(printf '%s\n' "$correction_row" | head -n1 | cut -d'|' -f3)"
assert_eq "$correction_reason" "terrain_missing" "server_correction reason"
assert_eq "$correction_acked" "false" "server_correction initial ack"

call_reducer ack_server_correction "\"${correction_id}\"" 2

ack_row="$(canon_sql "SELECT acknowledged, acked_client_frame_no FROM server_correction WHERE correction_id = '${correction_id}'")"
if [[ -z "$ack_row" ]]; then
  echo "[smoke] server_correction ack row missing for ${correction_id}" >&2
  exit 1
fi
acked="$(printf '%s\n' "$ack_row" | head -n1 | cut -d'|' -f1)"
acked_frame="$(printf '%s\n' "$ack_row" | head -n1 | cut -d'|' -f2)"
assert_eq "$acked" "true" "server_correction acknowledged"
assert_eq "$acked_frame" "2" "server_correction acked frame"

echo "[smoke] PASS"
