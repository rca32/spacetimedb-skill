#!/usr/bin/env sh
set -e

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
missing=0

check_file() {
  if [ ! -f "$root_dir/$1" ]; then
    echo "Missing static data: $1"
    missing=1
  fi
}

check_file "assets/static_data/biomes/biome_def.csv"
check_file "assets/static_data/biomes/biome_map.png"
check_file "assets/static_data/items/item_def.csv"
check_file "assets/static_data/items/item_list_def.csv"
check_file "assets/static_data/buildings/building_def.csv"
check_file "assets/static_data/npcs/npc_desc.csv"
check_file "assets/static_data/npcs/npc_dialogue.csv"
check_file "assets/static_data/combat/combat_action_def.csv"
check_file "assets/static_data/combat/enemy_def.csv"
check_file "assets/static_data/combat/enemy_scaling_def.csv"
check_file "assets/static_data/quests/quest_chain_def.csv"
check_file "assets/static_data/quests/quest_stage_def.csv"
check_file "assets/static_data/quests/achievement_def.csv"
check_file "assets/static_data/economy/price_index.csv"
check_file "assets/static_data/economy/economy_params.csv"

if [ "$missing" -ne 0 ]; then
  exit 1
fi

echo "Static data inventory OK"
