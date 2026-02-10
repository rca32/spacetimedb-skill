#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-stitch-server}"
REGION_ID="${2:-1}"
BUILDING_ID="${3:-9001}"
NPC_ID="${4:-5001}"
DISPLAY_NAME="${5:-CliSmoke}"
NPC_REQUEST_ID="smoke-npc-${NPC_ID}"

count_table() {
  local table="$1"
  spacetime sql "${DB_NAME}" "SELECT COUNT(*) AS c FROM ${table}" \
    | awk 'NF==1 && $1 ~ /^[0-9]+$/ {print $1; exit}'
}

echo "[1/5] bootstrap reducers"
spacetime call "${DB_NAME}" account_bootstrap "${DISPLAY_NAME}"
spacetime call "${DB_NAME}" sign_in "${REGION_ID}"
spacetime call "${DB_NAME}" inventory_bootstrap

echo "[2/5] static data import"
spacetime call "${DB_NAME}" seed_data || true
spacetime call "${DB_NAME}" import_csv_data || true

echo "[3/5] world sample reducers"
spacetime call "${DB_NAME}" building_place "${BUILDING_ID}" "${REGION_ID}" 0 0 1 1 10 || true
spacetime call "${DB_NAME}" npc_talk "${NPC_ID}" "${NPC_REQUEST_ID}" || true

echo "[4/5] table counts"
transform_count="$(count_table transform_state)"
terrain_count="$(count_table terrain_chunk)"
building_count="$(count_table building_state)"
resource_count="$(count_table resource_node)"
npc_count="$(count_table npc_state)"

printf "transform_state=%s\n" "${transform_count:-0}"
printf "terrain_chunk=%s\n" "${terrain_count:-0}"
printf "building_state=%s\n" "${building_count:-0}"
printf "resource_node=%s\n" "${resource_count:-0}"
printf "npc_state=%s\n" "${npc_count:-0}"

echo "[5/5] verdict"
if [[ "${building_count:-0}" -ge 1 && "${npc_count:-0}" -ge 1 ]]; then
  echo "PASS: world smoke minimum met (building_state>=1, npc_state>=1)"
  exit 0
fi

echo "FAIL: world smoke minimum not met"
echo "Hint: check reducer auth/inputs and run scripts/world_counts.sh for full counts"
exit 1
