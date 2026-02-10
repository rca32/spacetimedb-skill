#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-stitch-server}"
IDENTITY_HEX="${2:-}"

sql() {
  spacetime sql "${DB_NAME}" "$1"
  echo
}

TABLE_ID="$(spacetime sql "${DB_NAME}" "SELECT table_id, table_name FROM st_table WHERE table_name = 'player_movement_feedback_view'" \
  | awk '/player_movement_feedback_view/ {print $1; exit}')"
if [[ -z "${TABLE_ID}" ]]; then
  echo "failed to resolve table_id for player_movement_feedback_view"
  exit 1
fi

echo "[movement-feedback] snapshot start"
echo "database: ${DB_NAME}"
echo "table_id: ${TABLE_ID}"
if [[ -n "${IDENTITY_HEX}" ]]; then
  echo "identity: ${IDENTITY_HEX}"
else
  echo "identity: (all)"
fi
echo

sql "SELECT table_id, table_name FROM st_table WHERE table_name = 'player_movement_feedback_view'"
sql "SELECT * FROM st_column WHERE table_id = ${TABLE_ID}"
sql "SELECT COUNT(*) AS count FROM player_movement_feedback_view"
sql "SELECT COUNT(*) AS count FROM movement_request_log"

if [[ -n "${IDENTITY_HEX}" ]]; then
  sql "SELECT request_key, request_id, accepted, reason_code, server_x, server_y, server_z, processed_at FROM player_movement_feedback_view WHERE identity = 0x${IDENTITY_HEX} LIMIT 20"
  sql "SELECT request_key, request_id, accepted, processed_at FROM movement_request_log WHERE identity = 0x${IDENTITY_HEX} LIMIT 20"
else
  sql "SELECT request_key, identity, request_id, accepted, reason_code, server_x, server_y, server_z, processed_at FROM player_movement_feedback_view LIMIT 20"
  sql "SELECT request_key, identity, request_id, accepted, processed_at FROM movement_request_log LIMIT 20"
fi

echo "[movement-feedback] snapshot end"
