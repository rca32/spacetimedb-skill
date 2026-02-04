use serde::{Deserialize, Deserializer};

// ============================================================================
// Item Definitions
// ============================================================================

/// CSV record for item_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct ItemDefCsv {
    #[serde(rename = "item_def_id")]
    pub item_def_id: u64,
    #[serde(rename = "item_type")]
    pub item_type: u8,
    pub category: u8,
    pub rarity: u8,
    #[serde(rename = "max_stack")]
    pub max_stack: u32,
    pub volume: i32,
    #[serde(rename = "item_list_id")]
    pub item_list_id: u64,
    #[serde(rename = "auto_collect")]
    pub auto_collect: bool,
    #[serde(rename = "convert_on_zero_durability")]
    pub convert_on_zero_durability: u64,
}

/// CSV record for item_list_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct ItemListDefCsv {
    #[serde(rename = "item_list_id")]
    pub item_list_id: u64,
    #[serde(deserialize_with = "deserialize_json_field")]
    pub entries: serde_json::Value,
}

// ============================================================================
// Quest Definitions
// ============================================================================

/// CSV record for quest_chain_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct QuestChainDefCsv {
    #[serde(rename = "quest_chain_id")]
    pub quest_chain_id: u64,
    #[serde(deserialize_with = "deserialize_json_field")]
    pub requirements: serde_json::Value,
    #[serde(deserialize_with = "deserialize_json_field")]
    pub rewards: serde_json::Value,
    #[serde(deserialize_with = "deserialize_json_field")]
    pub stages: serde_json::Value,
}

/// CSV record for quest_stage_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct QuestStageDefCsv {
    #[serde(rename = "quest_stage_id")]
    pub quest_stage_id: u64,
    #[serde(deserialize_with = "deserialize_json_field")]
    pub completion_conditions: serde_json::Value,
}

/// CSV record for achievement_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct AchievementDefCsv {
    #[serde(rename = "achievement_id")]
    pub achievement_id: u64,
    #[serde(deserialize_with = "deserialize_json_vec")]
    pub requisites: Vec<u64>,
    #[serde(rename = "skill_id")]
    pub skill_id: u64,
    #[serde(rename = "skill_level")]
    pub skill_level: u32,
    #[serde(deserialize_with = "deserialize_json_vec")]
    pub item_disc: Vec<u64>,
    #[serde(deserialize_with = "deserialize_json_vec")]
    pub cargo_disc: Vec<u64>,
    #[serde(deserialize_with = "deserialize_json_vec")]
    pub craft_disc: Vec<u64>,
    #[serde(deserialize_with = "deserialize_json_vec")]
    pub resource_disc: Vec<u64>,
    pub chunks_discovered: i32,
    pub pct_chunks_discovered: f32,
    #[serde(deserialize_with = "deserialize_json_vec")]
    pub collectible_rewards: Vec<u64>,
}

// ============================================================================
// Biome Definitions
// ============================================================================

/// CSV record for biome_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct BiomeDefCsv {
    #[serde(rename = "biome_id")]
    pub biome_id: u64,
    pub name: String,
    pub temperature: i32,
    pub moisture: i32,
    #[serde(rename = "elevation_min")]
    pub elevation_min: i32,
    #[serde(rename = "elevation_max")]
    pub elevation_max: i32,
    #[serde(rename = "resource_spawn_rate")]
    pub resource_spawn_rate: f32,
    #[serde(rename = "danger_level")]
    pub danger_level: u8,
    #[serde(rename = "color_hex")]
    pub color_hex: String,
}

// ============================================================================
// Building Definitions
// ============================================================================

/// CSV record for building_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct BuildingDefCsv {
    #[serde(rename = "building_id")]
    pub building_id: u64,
    pub name: String,
    #[serde(rename = "type")]
    pub building_type: u8,
    #[serde(rename = "size_x")]
    pub size_x: u32,
    #[serde(rename = "size_y")]
    pub size_y: u32,
    #[serde(rename = "build_cost_item_id")]
    pub build_cost_item_id: u64,
    #[serde(rename = "build_cost_quantity")]
    pub build_cost_quantity: u32,
    #[serde(rename = "build_time_secs")]
    pub build_time_secs: u32,
    #[serde(rename = "max_integrity")]
    pub max_integrity: u32,
    #[serde(rename = "prerequisite_skill_id")]
    pub prerequisite_skill_id: u64,
    #[serde(rename = "prerequisite_skill_level")]
    pub prerequisite_skill_level: u32,
    #[serde(rename = "produces_item_id")]
    pub produces_item_id: u64,
    #[serde(rename = "production_rate")]
    pub production_rate: u32,
}

// ============================================================================
// NPC Definitions
// ============================================================================

/// CSV record for npc_desc.csv
#[derive(Debug, Deserialize, Clone)]
pub struct NpcDescCsv {
    #[serde(rename = "npc_id")]
    pub npc_id: u64,
    pub name: String,
    pub title: String,
    pub faction: u8,
    pub race: u8,
    pub level: u8,
    pub health: u32,
    #[serde(rename = "location_x")]
    pub location_x: i32,
    #[serde(rename = "location_y")]
    pub location_y: i32,
    #[serde(rename = "biome_id")]
    pub biome_id: u64,
    #[serde(rename = "shop_item_list_id")]
    pub shop_item_list_id: u64,
    #[serde(rename = "dialogue_tree_id")]
    pub dialogue_tree_id: u64,
}

/// CSV record for npc_dialogue.csv
#[derive(Debug, Deserialize, Clone)]
pub struct NpcDialogueCsv {
    #[serde(rename = "dialogue_id")]
    pub dialogue_id: u64,
    #[serde(rename = "npc_id")]
    pub npc_id: u64,
    #[serde(rename = "dialogue_type")]
    pub dialogue_type: u8,
    #[serde(rename = "condition_type")]
    pub condition_type: u8,
    #[serde(rename = "condition_value")]
    pub condition_value: u64,
    pub text: String,
    #[serde(rename = "next_dialogue_id")]
    pub next_dialogue_id: u64,
    #[serde(rename = "rewards_item_list_id")]
    pub rewards_item_list_id: u64,
}

// ============================================================================
// Combat Definitions
// ============================================================================

/// CSV record for combat_action_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct CombatActionDefCsv {
    #[serde(rename = "action_id")]
    pub action_id: u64,
    pub name: String,
    #[serde(rename = "action_type")]
    pub action_type: u8,
    #[serde(rename = "damage_base")]
    pub damage_base: u32,
    #[serde(rename = "damage_scaling")]
    pub damage_scaling: f32,
    #[serde(rename = "stamina_cost")]
    pub stamina_cost: u32,
    #[serde(rename = "cooldown_secs")]
    pub cooldown_secs: u32,
    #[serde(rename = "required_weapon_type")]
    pub required_weapon_type: u8,
    #[serde(rename = "effect_id")]
    pub effect_id: u64,
    #[serde(rename = "effect_duration_secs")]
    pub effect_duration_secs: u32,
    pub range: u32,
    #[serde(rename = "aoe_radius")]
    pub aoe_radius: u32,
}

/// CSV record for enemy_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct EnemyDefCsv {
    #[serde(rename = "enemy_id")]
    pub enemy_id: u64,
    pub name: String,
    #[serde(rename = "enemy_type")]
    pub enemy_type: u8,
    #[serde(rename = "biome_id")]
    pub biome_id: u64,
    pub level: u8,
    #[serde(rename = "min_hp")]
    pub min_hp: u32,
    #[serde(rename = "max_hp")]
    pub max_hp: u32,
    #[serde(rename = "min_damage")]
    pub min_damage: u32,
    #[serde(rename = "max_damage")]
    pub max_damage: u32,
    #[serde(rename = "attack_speed")]
    pub attack_speed: f32,
    #[serde(rename = "move_speed")]
    pub move_speed: f32,
    #[serde(rename = "aggro_range")]
    pub aggro_range: u32,
    #[serde(rename = "exp_reward")]
    pub exp_reward: u32,
    #[serde(rename = "loot_item_list_id")]
    pub loot_item_list_id: u64,
    #[serde(rename = "special_ability_id")]
    pub special_ability_id: u64,
}

/// CSV record for enemy_scaling_def.csv
#[derive(Debug, Deserialize, Clone)]
pub struct EnemyScalingDefCsv {
    #[serde(rename = "scaling_id")]
    pub scaling_id: u64,
    #[serde(rename = "enemy_type")]
    pub enemy_type: u8,
    #[serde(rename = "player_count_multiplier")]
    pub player_count_multiplier: f32,
    #[serde(rename = "level_scaling_curve")]
    pub level_scaling_curve: String,
    #[serde(rename = "hp_scaling_per_level")]
    pub hp_scaling_per_level: u32,
    #[serde(rename = "damage_scaling_per_level")]
    pub damage_scaling_per_level: f32,
    #[serde(rename = "exp_scaling_per_level")]
    pub exp_scaling_per_level: f32,
}

// ============================================================================
// Economy Definitions
// ============================================================================

/// CSV record for price_index.csv
#[derive(Debug, Deserialize, Clone)]
pub struct PriceIndexCsv {
    #[serde(rename = "item_def_id")]
    pub item_def_id: u64,
    #[serde(rename = "base_price")]
    pub base_price: u64,
    #[serde(rename = "buy_multiplier")]
    pub buy_multiplier: f32,
    #[serde(rename = "sell_multiplier")]
    pub sell_multiplier: f32,
    #[serde(rename = "fluctuation_rate")]
    pub fluctuation_rate: f32,
    #[serde(rename = "last_update")]
    pub last_update: u64,
}

/// CSV record for economy_params.csv
#[derive(Debug, Deserialize, Clone)]
pub struct EconomyParamsCsv {
    #[serde(rename = "param_key")]
    pub param_key: String,
    #[serde(rename = "param_value")]
    pub param_value: f32,
    pub description: String,
}

// ============================================================================
// JSON Deserialization Helpers
// ============================================================================

fn deserialize_json_field<'de, D>(deserializer: D) -> Result<serde_json::Value, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    serde_json::from_str(&s).map_err(serde::de::Error::custom)
}

fn deserialize_json_vec<'de, D>(deserializer: D) -> Result<Vec<u64>, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    if s.is_empty() || s == "[]" {
        return Ok(Vec::new());
    }
    serde_json::from_str(&s).map_err(serde::de::Error::custom)
}
