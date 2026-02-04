//! CSV to Table Mappers
//!
//! Provides conversion functions from CSV model types to SpacetimeDB table types.

use super::error::CsvResult;
use super::models::{
    AchievementDefCsv, BiomeDefCsv, BuildingDefCsv, CombatActionDefCsv, EconomyParamsCsv,
    EnemyDefCsv, EnemyScalingDefCsv, ItemDefCsv, ItemListDefCsv, NpcDescCsv, NpcDialogueCsv,
    PriceIndexCsv, QuestChainDefCsv, QuestStageDefCsv,
};
use crate::tables::{
    AchievementDef, BiomeDef, BuildingDef, CombatActionDef, EconomyParams, EnemyDef,
    EnemyScalingDef, ItemDef, NpcDesc, NpcDialogue, PriceIndex,
};

/// Map ItemDefCsv to ItemDef
pub fn map_item_def(csv: ItemDefCsv) -> ItemDef {
    ItemDef {
        item_def_id: csv.item_def_id,
        item_type: csv.item_type,
        category: csv.category,
        rarity: csv.rarity,
        max_stack: csv.max_stack,
        volume: csv.volume,
        item_list_id: csv.item_list_id,
        auto_collect: csv.auto_collect,
        convert_on_zero_durability: csv.convert_on_zero_durability,
    }
}

/// Map BiomeDefCsv to BiomeDef
pub fn map_biome_def(csv: BiomeDefCsv) -> BiomeDef {
    BiomeDef {
        biome_id: csv.biome_id,
        name: csv.name,
        temperature: csv.temperature,
        moisture: csv.moisture,
        elevation_min: csv.elevation_min,
        elevation_max: csv.elevation_max,
        resource_spawn_rate: csv.resource_spawn_rate,
        danger_level: csv.danger_level,
        color_hex: csv.color_hex,
    }
}

/// Map BuildingDefCsv to BuildingDef
pub fn map_building_def(csv: BuildingDefCsv) -> BuildingDef {
    BuildingDef {
        building_id: csv.building_id,
        name: csv.name,
        building_type: csv.building_type,
        size_x: csv.size_x,
        size_y: csv.size_y,
        build_cost_item_id: csv.build_cost_item_id,
        build_cost_quantity: csv.build_cost_quantity,
        build_time_secs: csv.build_time_secs,
        max_integrity: csv.max_integrity,
        prerequisite_skill_id: csv.prerequisite_skill_id,
        prerequisite_skill_level: csv.prerequisite_skill_level,
        produces_item_id: csv.produces_item_id,
        production_rate: csv.production_rate,
    }
}

/// Map NpcDescCsv to NpcDesc
pub fn map_npc_desc(csv: NpcDescCsv) -> NpcDesc {
    NpcDesc {
        npc_id: csv.npc_id,
        name: csv.name,
        title: csv.title,
        faction: csv.faction,
        race: csv.race,
        level: csv.level,
        health: csv.health,
        location_x: csv.location_x,
        location_y: csv.location_y,
        biome_id: csv.biome_id,
        shop_item_list_id: csv.shop_item_list_id,
        dialogue_tree_id: csv.dialogue_tree_id,
    }
}

/// Map NpcDialogueCsv to NpcDialogue
pub fn map_npc_dialogue(csv: NpcDialogueCsv) -> NpcDialogue {
    NpcDialogue {
        dialogue_id: csv.dialogue_id,
        npc_id: csv.npc_id,
        dialogue_type: csv.dialogue_type,
        condition_type: csv.condition_type,
        condition_value: csv.condition_value,
        text: csv.text,
        next_dialogue_id: csv.next_dialogue_id,
        rewards_item_list_id: csv.rewards_item_list_id,
    }
}

/// Map CombatActionDefCsv to CombatActionDef
pub fn map_combat_action_def(csv: CombatActionDefCsv) -> CombatActionDef {
    CombatActionDef {
        action_id: csv.action_id,
        name: csv.name,
        action_type: csv.action_type,
        damage_base: csv.damage_base,
        damage_scaling: csv.damage_scaling,
        stamina_cost: csv.stamina_cost,
        cooldown_secs: csv.cooldown_secs,
        required_weapon_type: csv.required_weapon_type,
        effect_id: csv.effect_id,
        effect_duration_secs: csv.effect_duration_secs,
        range: csv.range,
        aoe_radius: csv.aoe_radius,
    }
}

/// Map EnemyDefCsv to EnemyDef
pub fn map_enemy_def(csv: EnemyDefCsv) -> EnemyDef {
    EnemyDef {
        enemy_id: csv.enemy_id,
        name: csv.name,
        enemy_type: csv.enemy_type,
        biome_id: csv.biome_id,
        level: csv.level,
        min_hp: csv.min_hp,
        max_hp: csv.max_hp,
        min_damage: csv.min_damage,
        max_damage: csv.max_damage,
        attack_speed: csv.attack_speed,
        move_speed: csv.move_speed,
        aggro_range: csv.aggro_range,
        exp_reward: csv.exp_reward,
        loot_item_list_id: csv.loot_item_list_id,
        special_ability_id: csv.special_ability_id,
    }
}

/// Map EnemyScalingDefCsv to EnemyScalingDef
pub fn map_enemy_scaling_def(csv: EnemyScalingDefCsv) -> EnemyScalingDef {
    EnemyScalingDef {
        scaling_id: csv.scaling_id,
        enemy_type: csv.enemy_type,
        player_count_multiplier: csv.player_count_multiplier,
        level_scaling_curve: csv.level_scaling_curve,
        hp_scaling_per_level: csv.hp_scaling_per_level,
        damage_scaling_per_level: csv.damage_scaling_per_level,
        exp_scaling_per_level: csv.exp_scaling_per_level,
    }
}

/// Map PriceIndexCsv to PriceIndex
pub fn map_price_index(csv: PriceIndexCsv) -> PriceIndex {
    PriceIndex {
        item_def_id: csv.item_def_id,
        base_price: csv.base_price,
        buy_multiplier: csv.buy_multiplier,
        sell_multiplier: csv.sell_multiplier,
        fluctuation_rate: csv.fluctuation_rate,
        last_update: csv.last_update,
    }
}

/// Map EconomyParamsCsv to EconomyParams
pub fn map_economy_params(csv: EconomyParamsCsv) -> EconomyParams {
    EconomyParams {
        param_key: csv.param_key,
        param_value: csv.param_value,
        description: csv.description,
    }
}

// ============================================================================
// Complex JSON Types - Placeholder Implementations
// ============================================================================

use crate::tables::{ItemListDef, QuestChainDef, QuestStageDef};

/// Map ItemListDefCsv to ItemListDef (not yet implemented)
pub fn map_item_list_def(_csv: ItemListDefCsv) -> CsvResult<ItemListDef> {
    Err(super::error::CsvImportError::ValidationError(
        "ItemListDef mapping not yet implemented".to_string(),
    ))
}

/// Map QuestChainDefCsv to QuestChainDef (not yet implemented)
pub fn map_quest_chain_def(_csv: QuestChainDefCsv) -> CsvResult<QuestChainDef> {
    Err(super::error::CsvImportError::ValidationError(
        "QuestChainDef mapping not yet implemented".to_string(),
    ))
}

/// Map QuestStageDefCsv to QuestStageDef (not yet implemented)
pub fn map_quest_stage_def(_csv: QuestStageDefCsv) -> CsvResult<QuestStageDef> {
    Err(super::error::CsvImportError::ValidationError(
        "QuestStageDef mapping not yet implemented".to_string(),
    ))
}

/// Map AchievementDefCsv to AchievementDef (not yet implemented)
pub fn map_achievement_def(_csv: AchievementDefCsv) -> CsvResult<AchievementDef> {
    Err(super::error::CsvImportError::ValidationError(
        "AchievementDef mapping not yet implemented".to_string(),
    ))
}
