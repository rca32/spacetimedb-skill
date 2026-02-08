#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-stitch-server}"
SERVER="${SERVER:-127.0.0.1:3000}"
REGION_ID="${REGION_ID:-1}"
REPEAT="${REPEAT:-1}"
DRY_RUN="${DRY_RUN:-0}"
YES_FLAG="${YES_FLAG:---yes}"

usage() {
  cat <<USAGE
Stitch Multi-Identity + Security + Load Regression Suite

Usage:
  $(basename "$0") [--db <name>] [--server <addr>] [--region <id>] [--repeat <n>] [--dry-run]

Options:
  --db <name>       Database name (default: ${DB_NAME})
  --server <addr>   SpacetimeDB server (default: ${SERVER})
  --region <id>     Region id for sign-in/movement (default: ${REGION_ID})
  --repeat <n>      Repeat count (default: ${REPEAT})
  --dry-run         Print commands without executing
  -h, --help        Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --db) DB_NAME="$2"; shift 2 ;;
    --server) SERVER="$2"; shift 2 ;;
    --region) REGION_ID="$2"; shift 2 ;;
    --repeat) REPEAT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
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

expect_fail() {
  echo "+ (expect fail) $*"
  if [[ "$DRY_RUN" == "1" ]]; then
    return 0
  fi

  set +e
  "$@"
  local rc=$?
  set -e

  if [[ $rc -eq 0 ]]; then
    echo "Expected failure but command succeeded: $*" >&2
    return 1
  fi
  return 0
}

call_reducer() {
  local reducer="$1"; shift
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" "$reducer" "$@"
}

sql_check() {
  local label="$1"
  local query="$2"
  echo "== SQL CHECK: ${label} =="
  run_cmd spacetime sql --server "$SERVER" "$DB_NAME" "$query"
}

require_server() {
  run_cmd spacetime sql --server "$SERVER" "$DB_NAME" "SELECT COUNT(*) AS account_cnt FROM account"
}

run_identity_base_flow() {
  local tag="$1"
  local display_name="runner-${tag}"
  local move_req="move-${tag}"
  local base_ms="$(($(date +%s%3N) + 1000))"

  call_reducer account_bootstrap "\"${display_name}\""
  call_reducer sign_in "$REGION_ID"
  call_reducer move_to "\"${move_req}\"" "$REGION_ID" "$base_ms" 1.0 0.0 1.0
  call_reducer inventory_bootstrap
}

run_security_cases() {
  local tag="$1"

  echo "-- Security regression: SEC-001 권한 상승 --"
  expect_fail spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" role_grant "identity-not-valid" "\"admin\""

  echo "-- Security regression: SEC-002 세션 하이재킹 --"
  # first sign_out should succeed for current authenticated identity
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" sign_out
  # second sign_out should fail because no active session exists now
  expect_fail spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" sign_out
  # restore active session for remaining checks in this iteration
  run_cmd spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" sign_in "$REGION_ID"

  echo "-- Security regression: SEC-003 private table query leakage --"
  expect_fail spacetime sql --server "$SERVER" "$DB_NAME" "SELECT * FROM role_binding LIMIT 1"
  expect_fail spacetime sql --server "$SERVER" "$DB_NAME" "SELECT * FROM ban_list LIMIT 1"

  sql_check "SEC summary audit logs" "SELECT COUNT(*) AS audit_cnt FROM audit_log"
  sql_check "SEC summary moderation flags" "SELECT COUNT(*) AS mod_flag_cnt FROM moderation_flag"
}

run_load_checks() {
  local tag="$1"

  echo "-- Load probe: AOI-like movement bursts --"
  local burst=20
  local i
  for ((i=1; i<=burst; i++)); do
    call_reducer move_to "\"move-${tag}-${i}\"" "$REGION_ID" "$(date +%s%3N)" 1.0 0.0 1.0
  done

  echo "-- Load probe: scheduled reducers fan-out --"
  call_reducer resource_regen_agent_loop
  call_reducer player_regen_agent_loop
  call_reducer environment_effect_agent_loop
  call_reducer session_cleanup_agent_loop

  sql_check "load transform count" "SELECT COUNT(*) AS transform_cnt FROM transform_state"
  sql_check "load movement request log" "SELECT COUNT(*) AS move_req_cnt FROM movement_request_log"
  sql_check "load resource state" "SELECT COUNT(*) AS resource_state_cnt FROM resource_state"
  sql_check "load status effect" "SELECT COUNT(*) AS status_effect_cnt FROM status_effect"
}

run_diagnostic_sql_bundle() {
  sql_check "auth/session" "SELECT COUNT(*) AS account_cnt FROM account; SELECT COUNT(*) AS session_cnt FROM session_state"
  sql_check "combat" "SELECT COUNT(*) AS combat_cnt FROM combat_state; SELECT COUNT(*) AS outcome_cnt FROM attack_outcome"
  sql_check "trade+economy" "SELECT COUNT(*) AS order_cnt FROM market_order; SELECT COUNT(*) AS fill_cnt FROM market_fill; SELECT COUNT(*) AS txn_cnt FROM currency_txn; SELECT COUNT(*) AS price_idx_cnt FROM price_index"
  sql_check "social+moderation" "SELECT COUNT(*) AS chat_cnt FROM chat_message; SELECT COUNT(*) AS report_cnt FROM report_queue; SELECT COUNT(*) AS mod_action_cnt FROM moderation_action"
  sql_check "housing" "SELECT COUNT(*) AS housing_cnt FROM housing_state; SELECT COUNT(*) AS dim_cnt FROM dimension_desc"
}

run_iteration() {
  local iter="$1"
  local run_tag="multi-sec-${iter}-$(date +%s)"

  echo "=== Multi-identity/security iteration ${iter}/${REPEAT}: ${run_tag} ==="
  call_reducer import_csv_data

  run_identity_base_flow "${run_tag}-a"
  run_security_cases "$run_tag"
  run_load_checks "$run_tag"
  run_diagnostic_sql_bundle

  call_reducer sign_out
  echo "=== Iteration ${iter} completed ==="
}

echo "Multi-identity/security regression start: db=${DB_NAME} server=${SERVER} region=${REGION_ID} repeat=${REPEAT} dry_run=${DRY_RUN}"
require_server

for ((i=1; i<=REPEAT; i++)); do
  run_iteration "$i"
done

echo "Multi-identity/security regression completed successfully (${REPEAT} iteration(s))."
