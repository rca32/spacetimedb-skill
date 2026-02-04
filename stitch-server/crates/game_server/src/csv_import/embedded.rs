pub const EMBEDDED_AVAILABLE: bool = true;

pub fn has_embedded_data() -> bool {
    EMBEDDED_AVAILABLE
}

pub fn get_embedded_csv(path: &str) -> Option<&'static str> {
    let normalized = path.replace('\\', "/");

    if normalized.ends_with("items/item_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/items/item_def.csv"
        )));
    }
    if normalized.ends_with("items/item_list_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/items/item_list_def.csv"
        )));
    }
    if normalized.ends_with("combat/combat_action_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/combat/combat_action_def.csv"
        )));
    }
    if normalized.ends_with("combat/enemy_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/combat/enemy_def.csv"
        )));
    }
    if normalized.ends_with("combat/enemy_scaling_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/combat/enemy_scaling_def.csv"
        )));
    }
    if normalized.ends_with("quests/quest_chain_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/quests/quest_chain_def.csv"
        )));
    }
    if normalized.ends_with("quests/quest_stage_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/quests/quest_stage_def.csv"
        )));
    }
    if normalized.ends_with("quests/achievement_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/quests/achievement_def.csv"
        )));
    }
    if normalized.ends_with("biomes/biome_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/biomes/biome_def.csv"
        )));
    }
    if normalized.ends_with("economy/price_index.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/economy/price_index.csv"
        )));
    }
    if normalized.ends_with("economy/economy_params.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/economy/economy_params.csv"
        )));
    }
    if normalized.ends_with("buildings/building_def.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/buildings/building_def.csv"
        )));
    }
    if normalized.ends_with("npcs/npc_desc.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/npcs/npc_desc.csv"
        )));
    }
    if normalized.ends_with("npcs/npc_dialogue.csv") {
        return Some(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../assets/static_data/npcs/npc_dialogue.csv"
        )));
    }

    None
}
