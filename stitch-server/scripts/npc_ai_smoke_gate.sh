#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
DELETE_DATA_MODE="${DELETE_DATA_MODE:-always}"
SKIP_PUBLISH="${SKIP_PUBLISH:-0}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"
MOVE_SIGNAL_TRIES="${MOVE_SIGNAL_TRIES:-12}"
MOVE_SIGNAL_WAIT_SECS="${MOVE_SIGNAL_WAIT_SECS:-1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRATE_DIR="$(cd "${SCRIPT_DIR}/../crates/game_server" && pwd)"

usage() {
  cat <<USAGE
NPC AI smoke gate for stitch-server.

Usage:
  $(basename "$0") [options]

Options:
  --db <name>                   Database name (default: ${DB_NAME})
  --server <addr>               Server address (default: ${SERVER})
  --region <id>                 Region id for bootstrap/sign-in (default: ${REGION_ID})
  --delete-data <always|never>  Publish delete-data mode (default: ${DELETE_DATA_MODE})
  --skip-publish                Skip publish and run checks on current DB
  --move-signal-tries <n>       Retry count for movement signal check (default: ${MOVE_SIGNAL_TRIES})
  --move-signal-wait <secs>     Wait seconds between retries (default: ${MOVE_SIGNAL_WAIT_SECS})
  --dry-run                     Print commands only
  -h, --help                    Show this help
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
    --move-signal-tries)
      MOVE_SIGNAL_TRIES="$2"; shift 2 ;;
    --move-signal-wait)
      MOVE_SIGNAL_WAIT_SECS="$2"; shift 2 ;;
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
  local output
  output="$(spacetime sql --server "$SERVER" "$DB_NAME" "$query" 2>&1)"
  if grep -q '^Error:' <<<"$output"; then
    echo "$output" >&2
    return 1
  fi
  echo "$output"
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

assert_int_ge() {
  local actual="$1"
  local threshold="$2"
  local label="$3"
  if ! [[ "$actual" =~ ^-?[0-9]+$ ]]; then
    echo "[npc-smoke] ${label}: non-integer value: ${actual}" >&2
    exit 1
  fi
  if (( actual < threshold )); then
    echo "[npc-smoke] ${label}: expected >= ${threshold}, got ${actual}" >&2
    exit 1
  fi
  echo "[npc-smoke] ${label}: ${actual} (>= ${threshold})"
}

assert_eq() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "[npc-smoke] ${label}: expected '${expected}', got '${actual}'" >&2
    exit 1
  fi
  echo "[npc-smoke] ${label}: ${actual}"
}

wait_for_move_signal() {
  local i
  for ((i = 1; i <= MOVE_SIGNAL_TRIES; i++)); do
    local moving_intent
    moving_intent="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_state WHERE traveling = true AND (hex_x <> dest_hex_x OR hex_z <> dest_hex_z)")"
    if [[ "$moving_intent" =~ ^[0-9]+$ ]] && (( moving_intent > 0 )); then
      echo "[npc-smoke] movement signal observed: ${moving_intent} traveling NPC(s) with destination delta"
      return 0
    fi
    echo "[npc-smoke] waiting movement signal (${i}/${MOVE_SIGNAL_TRIES})..."
    sleep "$MOVE_SIGNAL_WAIT_SECS"
  done
  echo "[npc-smoke] movement signal check failed after ${MOVE_SIGNAL_TRIES} retries" >&2
  return 1
}

echo "[npc-smoke] start: db=${DB_NAME} server=${SERVER} region=${REGION_ID} skip_publish=${SKIP_PUBLISH}"
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
call_reducer sign_in "$REGION_ID"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[npc-smoke] dry-run complete"
  exit 0
fi

npc_population_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_population_def WHERE enabled = true")"
npc_anchor_active_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_anchor_state WHERE region_id = ${REGION_ID} AND is_active = true")"
npc_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_state WHERE region_id = ${REGION_ID}")"
npc_schedule_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_action_schedule")"
npc_anchor_ref_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_state WHERE region_id = ${REGION_ID} AND anchor_entity_id != 0")"
traveling_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_state WHERE region_id = ${REGION_ID} AND traveling = true")"
fixed_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_state WHERE region_id = ${REGION_ID} AND traveling = false")"
moving_schedule_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_action_schedule WHERE action_type = 1 OR action_type = 2")"
idle_schedule_count="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_action_schedule WHERE action_type = 3")"

assert_int_ge "$npc_population_count" 1 "npc_population_def enabled count"
assert_int_ge "$npc_anchor_active_count" 1 "npc_anchor_state active count"
assert_int_ge "$npc_count" 1 "npc_state count"
assert_int_ge "$npc_schedule_count" 1 "npc_action_schedule count"
assert_int_ge "$traveling_count" 1 "traveling npc count"
assert_int_ge "$fixed_count" 1 "non-traveling npc count"
assert_int_ge "$moving_schedule_count" 1 "moving schedule count"
assert_int_ge "$idle_schedule_count" 1 "idle schedule count"
assert_eq "$npc_anchor_ref_count" "$npc_count" "npc anchor reference count == npc count"

wait_for_move_signal

echo "[npc-smoke] PASS"
