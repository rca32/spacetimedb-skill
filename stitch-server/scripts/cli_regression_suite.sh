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
Stitch CLI Integration Regression Suite

Usage:
  $(basename "$0") [--db <name>] [--server <addr>] [--region <id>] [--repeat <n>] [--dry-run]

Options:
  --db <name>       Database name (default: ${DB_NAME})
  --server <addr>   SpacetimeDB server (default: ${SERVER})
  --region <id>     Region id for sign-in/movement (default: ${REGION_ID})
  --repeat <n>      Repeat count for deterministic regression runs (default: ${REPEAT})
  --dry-run         Print commands without executing
  -h, --help        Show this help

Environment:
  DB_NAME, SERVER, REGION_ID, REPEAT, DRY_RUN, YES_FLAG
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

run_iteration() {
  local iter="$1"
  local run_tag="reg-${iter}-$(date +%s)"
  local run_epoch
  run_epoch="$(date +%s)"
  local base_ms
  base_ms="$(($(date +%s%3N) + iter * 10000))"

  local display_name="runner-${run_tag}"
  local move_req="move-${run_tag}"
  local talk_req="talk-${run_tag}"
  local trade_req="trade-${run_tag}"
  local quest_req="quest-${run_tag}"
  local building_id=$((700000000 + run_epoch + iter))
  local claim_id=$((800000000 + run_epoch + iter))
  local buy_order="buy-${run_tag}"

  echo "=== Iteration ${iter}/${REPEAT}: ${run_tag} ==="

  call_reducer import_csv_data
  call_reducer account_bootstrap "\"${display_name}\""
  call_reducer sign_in "$REGION_ID"
  call_reducer move_to "\"${move_req}\"" "$REGION_ID" "$base_ms" 1.0 0.0 1.0
  call_reducer inventory_bootstrap

  call_reducer building_place "$building_id" "$REGION_ID" 1 1 1 1 2
  call_reducer building_advance "$building_id" 2
  call_reducer claim_totem_place "$claim_id" "$building_id" 3
  call_reducer claim_expand "$claim_id" 1

  expect_fail spacetime call --server "$SERVER" $YES_FLAG "$DB_NAME" attack_scheduled "\"missing-${run_tag}\""

  call_reducer npc_talk 9001 "\"${talk_req}\""
  call_reducer npc_trade 9001 "\"${trade_req}\""
  call_reducer npc_quest 9001 "\"${quest_req}\""
  call_reducer quest_chain_start 3001
  call_reducer quest_stage_complete 3001 0

  call_reducer market_order_place "\"${buy_order}\"" 0 1 2 10
  call_reducer market_order_cancel "\"${buy_order}\""

  sql_check "account count" "SELECT COUNT(*) AS account_cnt FROM account"
  sql_check "player count" "SELECT COUNT(*) AS player_cnt FROM player_state"
  sql_check "transform count" "SELECT COUNT(*) AS transform_cnt FROM transform_state"

  sql_check "inventory container count" "SELECT COUNT(*) AS container_cnt FROM inventory_container"
  sql_check "inventory slot count" "SELECT COUNT(*) AS slot_cnt FROM inventory_slot"
  sql_check "item instance count" "SELECT COUNT(*) AS item_cnt FROM item_instance"

  sql_check "building count" "SELECT COUNT(*) AS building_cnt FROM building_state"
  sql_check "claim count" "SELECT COUNT(*) AS claim_cnt FROM claim_state"

  sql_check "combat count" "SELECT COUNT(*) AS combat_cnt FROM combat_state"
  sql_check "attack schedule count" "SELECT COUNT(*) AS schedule_cnt FROM attack_schedule_state"
  sql_check "attack outcome count" "SELECT COUNT(*) AS outcome_cnt FROM attack_outcome"

  sql_check "npc interaction count" "SELECT COUNT(*) AS npc_log_cnt FROM npc_interaction_log"
  sql_check "quest chain count" "SELECT COUNT(*) AS chain_cnt FROM quest_chain_state"
  sql_check "quest stage count" "SELECT COUNT(*) AS stage_cnt FROM quest_stage_state"

  sql_check "market order count" "SELECT COUNT(*) AS order_cnt FROM market_order"
  sql_check "market fill count" "SELECT COUNT(*) AS fill_cnt FROM market_fill"

  call_reducer sign_out

  echo "=== Iteration ${iter} completed ==="
}

echo "Regression suite start: db=${DB_NAME} server=${SERVER} region=${REGION_ID} repeat=${REPEAT} dry_run=${DRY_RUN}"
require_server

for ((i=1; i<=REPEAT; i++)); do
  run_iteration "$i"
done

echo "Regression suite completed successfully (${REPEAT} iteration(s))."
