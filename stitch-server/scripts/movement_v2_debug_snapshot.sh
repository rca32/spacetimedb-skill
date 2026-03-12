#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-stitch-server}"
IDENTITY_HEX="${2:-}"

sql() {
  spacetime sql "${DB_NAME}" "$1"
  echo
}

identity_filter() {
  local identity="$1"
  identity="${identity#0x}"
  printf '0x%s' "$identity"
}

echo "[movement-v2] snapshot start"
echo "database: ${DB_NAME}"
if [[ -n "${IDENTITY_HEX}" ]]; then
  echo "identity: ${IDENTITY_HEX}"
else
  echo "identity: (all)"
fi
echo

sql "SELECT table_id, table_name FROM st_table WHERE table_name IN ('client_frame', 'motion_intent', 'physics_state', 'server_correction', 'ui_notification_event') ORDER BY table_name"
sql "SELECT COUNT(*) AS count FROM client_frame"
sql "SELECT COUNT(*) AS count FROM motion_intent"
sql "SELECT COUNT(*) AS count FROM physics_state"
sql "SELECT COUNT(*) AS count FROM server_correction"
sql "SELECT COUNT(*) AS count FROM ui_notification_event WHERE code LIKE 'server_correction_%'"

if [[ -n "${IDENTITY_HEX}" ]]; then
  IDENTITY_SQL="$(identity_filter "${IDENTITY_HEX}")"
  sql "SELECT frame_key, frame_no, region_id, dimension_id, client_time_ms, received_at FROM client_frame WHERE identity = ${IDENTITY_SQL} ORDER BY received_at DESC LIMIT 20"
  sql "SELECT intent_id, frame_no, region_id, dimension_id, input_x, input_z, requested_speed, submitted_at FROM motion_intent WHERE identity = ${IDENTITY_SQL} ORDER BY submitted_at DESC LIMIT 20"
  sql "SELECT entity_id, region_id, dimension_id, last_intent_id, last_frame_no, position, velocity, updated_at FROM physics_state WHERE entity_id = ${IDENTITY_SQL} LIMIT 5"
  sql "SELECT correction_id, reason, acknowledged, acked_client_frame_no, created_at FROM server_correction WHERE identity = ${IDENTITY_SQL} ORDER BY created_at DESC LIMIT 20"
  sql "SELECT event_id, code, emitted_at FROM ui_notification_event WHERE identity = ${IDENTITY_SQL} AND code LIKE 'server_correction_%' ORDER BY emitted_at DESC LIMIT 20"
else
  sql "SELECT frame_key, identity, frame_no, region_id, dimension_id, client_time_ms, received_at FROM client_frame ORDER BY received_at DESC LIMIT 20"
  sql "SELECT intent_id, identity, frame_no, region_id, dimension_id, requested_speed, submitted_at FROM motion_intent ORDER BY submitted_at DESC LIMIT 20"
  sql "SELECT entity_id, region_id, dimension_id, last_intent_id, last_frame_no, position, velocity, updated_at FROM physics_state LIMIT 20"
  sql "SELECT correction_id, identity, reason, acknowledged, acked_client_frame_no, created_at FROM server_correction ORDER BY created_at DESC LIMIT 20"
  sql "SELECT event_id, identity, code, emitted_at FROM ui_notification_event WHERE code LIKE 'server_correction_%' ORDER BY emitted_at DESC LIMIT 20"
fi

echo "[movement-v2] snapshot end"
