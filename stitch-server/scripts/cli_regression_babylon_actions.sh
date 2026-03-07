#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
DIMENSION_ID="${DIMENSION_ID:-1}"
REPEAT="${REPEAT:-1}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"
NPC_ID="${NPC_ID:-9001}"
SPACETIME_BIN="${SPACETIME_BIN:-}"

usage() {
  cat <<USAGE
Babylon-facing Stitch server regression suite

Usage:
  $(basename "$0") [--db <name>] [--server <addr>] [--region <id>] [--dimension <id>] [--repeat <n>] [--dry-run]

Options:
  --db <name>         Database name (default: ${DB_NAME})
  --server <addr>     SpacetimeDB server (default: ${SERVER})
  --region <id>       Region id for sign-in (default: ${REGION_ID})
  --dimension <id>    World dimension id for V2 happy-path checks (default: ${DIMENSION_ID})
  --repeat <n>        Repeat count (default: ${REPEAT})
  --dry-run           Print commands without executing
  -h, --help          Show this help

Environment:
  DB_NAME, SERVER, REGION_ID, DIMENSION_ID, REPEAT, DRY_RUN, YES_FLAG, NPC_ID, SPACETIME_BIN
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
    --repeat)
      REPEAT="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2 ;;
  esac
done

if ! [[ "$REPEAT" =~ ^[0-9]+$ ]] || [[ "$REPEAT" -lt 1 ]]; then
  echo "REPEAT must be a positive integer" >&2
  exit 2
fi

run_cmd() {
  echo "+ $*"
  if [[ "$DRY_RUN" == "1" ]]; then
    return 0
  fi
  "$@"
}

resolve_spacetime_bin() {
  if [[ -n "$SPACETIME_BIN" ]]; then
    return 0
  fi

  if command -v spacetime >/dev/null 2>&1; then
    SPACETIME_BIN="$(command -v spacetime)"
    return 0
  fi

  if command -v spacetime.exe >/dev/null 2>&1; then
    SPACETIME_BIN="$(command -v spacetime.exe)"
    return 0
  fi

  if command -v where.exe >/dev/null 2>&1; then
    local candidate
    candidate="$(where.exe spacetime.exe 2>/dev/null | head -n1 | tr -d '\r')"
    if [[ -n "$candidate" ]]; then
      SPACETIME_BIN="$candidate"
      return 0
    fi
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    SPACETIME_BIN="spacetime"
    return 0
  fi

  echo "spacetime CLI not found. Set SPACETIME_BIN to spacetime or spacetime.exe." >&2
  exit 127
}

call_reducer() {
  local reducer="$1"; shift
  run_cmd "$SPACETIME_BIN" call --server "$SERVER" $YES_FLAG "$DB_NAME" "$reducer" "$@"
}

sql_output() {
  local query="$1"
  "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "$query"
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
    echo ""
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

identity_sql_literal() {
  local identity="$1"
  identity="${identity#0x}"
  printf '0x%s' "$identity"
}

assert_eq() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "[babylon-regression] ${label}: expected '${expected}', got '${actual}'" >&2
    exit 1
  fi
  echo "[babylon-regression] ${label}: ${actual}"
}

assert_non_empty() {
  local actual="$1"
  local label="$2"
  if [[ -z "$actual" ]]; then
    echo "[babylon-regression] ${label}: expected non-empty value" >&2
    exit 1
  fi
  echo "[babylon-regression] ${label}: ${actual}"
}

assert_int_ge() {
  local actual="$1"
  local threshold="$2"
  local label="$3"
  if ! [[ "$actual" =~ ^-?[0-9]+$ ]]; then
    echo "[babylon-regression] ${label}: non-integer value '${actual}'" >&2
    exit 1
  fi
  if (( actual < threshold )); then
    echo "[babylon-regression] ${label}: expected >= ${threshold}, got ${actual}" >&2
    exit 1
  fi
  echo "[babylon-regression] ${label}: ${actual}"
}

require_server() {
  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT COUNT(*) AS account_cnt FROM account"
}

emit_dry_run_sql_checks() {
  local identity_sql="$1"
  local motion_ok="$2"
  local motion_bad="$3"
  local build_req_bad="$4"
  local combat_req="$5"
  local correction_id="$6"

  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT intent_id, frame_no FROM motion_intent WHERE intent_id = '${motion_ok}'"
  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT last_intent_id, dimension_id FROM physics_state WHERE entity_id = ${identity_sql}"
  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT correction_id, reason, acknowledged FROM server_correction WHERE correction_id = '${correction_id}'"
  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT request_id, is_valid, reason_code FROM building_preview_feedback_view WHERE request_id = '${build_req_bad}'"
  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT hit_id, damage FROM combat_hit WHERE hit_id = '${combat_req}:impact'"
  run_cmd "$SPACETIME_BIN" sql --server "$SERVER" "$DB_NAME" "SELECT COUNT(*) AS count FROM npc_interaction_log WHERE caller_identity = ${identity_sql} AND npc_id = ${NPC_ID} AND interaction_kind = 1 AND status = 1 AND detail = 'talk accepted'"
}

run_iteration() {
  local iter="$1"
  local run_epoch
  run_epoch="$(date +%s)"
  local base_ms
  base_ms="$(($(date +%s%3N) + iter * 10000))"
  local run_tag="babylon-${iter}-${run_epoch}"

  local display_name="babylon-${run_tag}"
  local motion_ok="mi-ok-${run_tag}"
  local motion_bad="mi-missing-${run_tag}"
  local build_req_ok="bp-ok-${run_tag}"
  local build_req_bad="bp-missing-${run_tag}"
  local talk_req="talk-${run_tag}"
  local combat_req="combat-${run_tag}"
  local correction_id="${motion_bad}:2:terrain_missing"

  echo "=== Babylon iteration ${iter}/${REPEAT}: ${run_tag} ==="

  call_reducer import_csv_data
  call_reducer account_bootstrap "\"${display_name}\""
  call_reducer sign_in "$REGION_ID"
  call_reducer set_active_dimension "$DIMENSION_ID"
  call_reducer inventory_bootstrap

  local identity
  local identity_sql
  local identity_entity_key
  local combat_target_json
  local building_def_id
  if [[ "$DRY_RUN" == "1" ]]; then
    identity="0000000000000000000000000000000000000000000000000000000000000000"
    identity_sql="$(identity_sql_literal "$identity")"
    identity_entity_key="$identity"
    combat_target_json="[\"0x${identity}\"]"
    building_def_id="1001"
  else
    identity="$(trim_quotes "$(scalar_sql "SELECT identity FROM player_session_view")")"
    identity_sql="$(identity_sql_literal "$identity")"
    identity_entity_key="${identity#0x}"
    combat_target_json="[\"${identity}\"]"
    building_def_id="1001"

    assert_eq "$(scalar_sql "SELECT COUNT(*) AS count FROM player_session_view")" "1" "player_session_view row count"
    assert_non_empty "$identity" "player identity"
    assert_eq "$(scalar_sql "SELECT COUNT(*) AS count FROM building_def WHERE building_def_id = ${building_def_id}")" "1" "building_def 1001 exists"
    assert_non_empty "$building_def_id" "building_def_id"
  fi

  local npc_log_count_before="0"
  if [[ "$DRY_RUN" != "1" ]]; then
    npc_log_count_before="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_interaction_log WHERE caller_identity = ${identity_sql} AND npc_id = ${NPC_ID} AND interaction_kind = 1 AND status = 1 AND detail = 'talk accepted'")"
  fi

  call_reducer sync_client_frame 1 "$REGION_ID" "$DIMENSION_ID" "$base_ms"
  call_reducer submit_motion_intent "\"${motion_ok}\"" "$REGION_ID" "$DIMENSION_ID" 1 1.0 0.0 5.0 false

  if [[ "$DRY_RUN" != "1" ]]; then
    local ok_motion_count
    ok_motion_count="$(scalar_sql "SELECT COUNT(*) AS count FROM motion_intent WHERE intent_id = '${motion_ok}'")"
    assert_eq "$ok_motion_count" "1" "motion_intent inserted"

    local physics_row
    physics_row="$(canon_sql "SELECT last_intent_id, dimension_id FROM physics_state WHERE entity_id = ${identity_sql}")"
    assert_non_empty "$physics_row" "physics_state row after happy path"
    local physics_intent
    local physics_dimension
    physics_intent="$(trim_quotes "$(printf '%s\n' "$physics_row" | head -n1 | cut -d'|' -f1)")"
    physics_dimension="$(printf '%s\n' "$physics_row" | head -n1 | cut -d'|' -f2)"
    assert_eq "$physics_intent" "$motion_ok" "physics_state last_intent_id after happy path"
    assert_eq "$physics_dimension" "$DIMENSION_ID" "physics_state dimension_id after happy path"

    local aoi_count
    aoi_count="$(scalar_sql "SELECT COUNT(*) AS count FROM aoi_stream WHERE entity_key = '${identity_entity_key}' AND region_id = ${REGION_ID} AND dimension_id = ${DIMENSION_ID}")"
    assert_int_ge "$aoi_count" 1 "aoi_stream player row count after happy path"
  fi

  call_reducer sync_client_frame 2 "$REGION_ID" 999999 "$((base_ms + 16))"
  call_reducer submit_motion_intent "\"${motion_bad}\"" "$REGION_ID" 999999 2 1.0 0.0 5.0 false

  call_reducer building_validate_preview "\"${build_req_ok}\"" "$building_def_id" "$REGION_ID" "$DIMENSION_ID" 2 0 0
  call_reducer building_validate_preview "\"${build_req_bad}\"" 999999999 "$REGION_ID" "$DIMENSION_ID" 2 0 0

  call_reducer submit_combat_intent "\"${combat_req}\"" "$combat_target_json" "$REGION_ID" "$DIMENSION_ID" 3 0 "$((base_ms + 32))"
  call_reducer npc_talk "$NPC_ID" "\"${talk_req}\""

  if [[ "$DRY_RUN" == "1" ]]; then
    emit_dry_run_sql_checks "$identity_sql" "$motion_ok" "$motion_bad" "$build_req_bad" "$combat_req" "$correction_id"
    echo "=== Babylon iteration ${iter} dry-run complete ==="
    return 0
  fi

  local correction_row
  correction_row="$(canon_sql "SELECT correction_id, reason, acknowledged FROM server_correction WHERE correction_id = '${correction_id}'")"
  assert_non_empty "$correction_row" "server_correction row"
  local correction_reason
  local correction_acked
  correction_reason="$(trim_quotes "$(printf '%s\n' "$correction_row" | head -n1 | cut -d'|' -f2)")"
  correction_acked="$(printf '%s\n' "$correction_row" | head -n1 | cut -d'|' -f3)"
  assert_eq "$(trim_quotes "$(printf '%s\n' "$correction_row" | head -n1 | cut -d'|' -f1)")" "$correction_id" "server_correction id"
  assert_eq "$correction_reason" "terrain_missing" "server_correction reason"
  assert_eq "$correction_acked" "false" "server_correction initial ack"

  call_reducer ack_server_correction "\"${correction_id}\"" 2

  local ack_row
  ack_row="$(canon_sql "SELECT acknowledged, acked_client_frame_no FROM server_correction WHERE correction_id = '${correction_id}'")"
  assert_non_empty "$ack_row" "acknowledged correction row"
  local acked
  local acked_frame
  acked="$(printf '%s\n' "$ack_row" | head -n1 | cut -d'|' -f1)"
  acked_frame="$(printf '%s\n' "$ack_row" | head -n1 | cut -d'|' -f2)"
  assert_eq "$acked" "true" "server_correction acknowledged"
  assert_eq "$acked_frame" "2" "server_correction acked_client_frame_no"

  local ui_ack_count
  ui_ack_count="$(scalar_sql "SELECT COUNT(*) AS count FROM ui_notification_event WHERE identity = ${identity_sql} AND code = 'server_correction_acked' AND event_id = 'ui-notify:${correction_id}:2'")"
  assert_eq "$ui_ack_count" "1" "ui_notification_event ack count"

  local preview_ok_count
  preview_ok_count="$(scalar_sql "SELECT COUNT(*) AS count FROM building_preview_feedback_view WHERE request_id = '${build_req_ok}'")"
  assert_eq "$preview_ok_count" "1" "preview feedback row count"

  local preview_bad_row
  preview_bad_row="$(canon_sql "SELECT request_id, is_valid, reason_code FROM building_preview_feedback_view WHERE request_id = '${build_req_bad}'")"
  assert_non_empty "$preview_bad_row" "invalid preview feedback row"
  local preview_bad_request
  local preview_bad_valid
  local preview_bad_reason
  preview_bad_request="$(trim_quotes "$(printf '%s\n' "$preview_bad_row" | head -n1 | cut -d'|' -f1)")"
  preview_bad_valid="$(printf '%s\n' "$preview_bad_row" | head -n1 | cut -d'|' -f2)"
  preview_bad_reason="$(trim_quotes "$(printf '%s\n' "$preview_bad_row" | head -n1 | cut -d'|' -f3)")"
  assert_eq "$preview_bad_request" "$build_req_bad" "invalid preview request_id"
  assert_eq "$preview_bad_valid" "false" "invalid preview is_valid"
  assert_eq "$preview_bad_reason" "building_def_missing" "invalid preview reason"

  local combat_hit_row
  combat_hit_row="$(canon_sql "SELECT hit_id, damage, crit FROM combat_hit WHERE hit_id = '${combat_req}:impact'")"
  assert_non_empty "$combat_hit_row" "combat_hit row"
  local hit_id
  local hit_damage
  hit_id="$(trim_quotes "$(printf '%s\n' "$combat_hit_row" | head -n1 | cut -d'|' -f1)")"
  hit_damage="$(printf '%s\n' "$combat_hit_row" | head -n1 | cut -d'|' -f2)"
  assert_eq "$hit_id" "${combat_req}:impact" "combat_hit id"
  assert_eq "$hit_damage" "10" "combat_hit damage"

  local combat_event_count
  local fx_event_count
  local audio_event_count
  combat_event_count="$(scalar_sql "SELECT COUNT(*) AS count FROM combat_hit_event WHERE event_id = 'combat-hit:${combat_req}:impact'")"
  fx_event_count="$(scalar_sql "SELECT COUNT(*) AS count FROM fx_event WHERE event_id = 'fx:${combat_req}:impact'")"
  audio_event_count="$(scalar_sql "SELECT COUNT(*) AS count FROM audio_event WHERE event_id = 'audio:${combat_req}:impact'")"
  assert_eq "$combat_event_count" "1" "combat_hit_event count"
  assert_eq "$fx_event_count" "1" "fx_event count"
  assert_eq "$audio_event_count" "1" "audio_event count"

  local npc_log_count_after
  npc_log_count_after="$(scalar_sql "SELECT COUNT(*) AS count FROM npc_interaction_log WHERE caller_identity = ${identity_sql} AND npc_id = ${NPC_ID} AND interaction_kind = 1 AND status = 1 AND detail = 'talk accepted'")"
  assert_eq "$npc_log_count_after" "$((npc_log_count_before + 1))" "npc_interaction_log accepted talk count"

  call_reducer sign_out

  echo "=== Babylon iteration ${iter} completed ==="
}

resolve_spacetime_bin

echo "Babylon regression suite start: db=${DB_NAME} server=${SERVER} region=${REGION_ID} dimension=${DIMENSION_ID} repeat=${REPEAT} dry_run=${DRY_RUN}"
require_server

for ((i=1; i<=REPEAT; i++)); do
  run_iteration "$i"
done

echo "Babylon regression suite completed successfully (${REPEAT} iteration(s))."
