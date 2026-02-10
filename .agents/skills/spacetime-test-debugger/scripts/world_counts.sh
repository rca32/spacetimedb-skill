#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-stitch-server}"

tables=(
  "transform_state"
  "terrain_chunk"
  "building_state"
  "resource_node"
  "npc_state"
  "claim_state"
  "combat_state"
  "attack_outcome"
)

echo "Database: ${DB_NAME}"
for t in "${tables[@]}"; do
  echo
  echo "== ${t} =="
  spacetime sql "${DB_NAME}" "SELECT COUNT(*) AS c FROM ${t}"
done
