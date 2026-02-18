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

run_id="$(date +%s%3N)"
req_ok="req_ok_${run_id}"
req_far="req_far_${run_id}"
req_probe="req_probe_${run_id}"
ts="$(date +%s%3N)"

call_reducer move_to "$req_ok" "$REGION_ID" "$ts" 0 0 0
call_reducer move_to "$req_far" "$REGION_ID" "$((ts + 1))" 9999 0 9999
call_reducer move_to "$req_probe" "$REGION_ID" "$((ts + 2))" 0 0 4

check_feedback() {
  local request_id="$1"
  local expected_accepted="$2"
  local expected_reason="$3"

  local row
  row="$(canon_sql "SELECT request_id, accepted, reason_code, server_x, server_z FROM player_movement_feedback_view WHERE request_id = '${request_id}'")"
  if [[ -z "$row" ]]; then
    echo "[smoke] movement feedback missing for ${request_id}" >&2
    exit 1
  fi

  local actual_request actual_accepted actual_reason
  actual_request="$(trim_quotes "$(printf '%s\n' "$row" | head -n1 | cut -d'|' -f1)")"
  actual_accepted="$(printf '%s\n' "$row" | head -n1 | cut -d'|' -f2)"
  actual_reason="$(trim_quotes "$(printf '%s\n' "$row" | head -n1 | cut -d'|' -f3)")"

  assert_eq "$actual_request" "$request_id" "feedback request_id (${request_id})"
  assert_eq "$actual_accepted" "$expected_accepted" "feedback accepted (${request_id})"
  assert_eq "$actual_reason" "$expected_reason" "feedback reason (${request_id})"
}

check_feedback "$req_ok" "true" "ok"
check_feedback "$req_far" "false" "distance_exceeded"
check_feedback "$req_probe" "false" "terrain_blocked"

echo "[smoke] PASS"
