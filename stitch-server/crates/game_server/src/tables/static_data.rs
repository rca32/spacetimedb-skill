#[spacetimedb::table(accessor = building_def, public)]
pub struct BuildingDef {
    #[primary_key]
    pub building_def_id: u64,
    pub required_item_def_id: u64,
    pub required_item_qty: u32,
    pub build_required: u32,
    pub footprint_radius: u32,
}

#[spacetimedb::table(accessor = combat_action_def, public)]
pub struct CombatActionDef {
    #[primary_key]
    pub action_def_id: u64,
    pub base_damage: i32,
    pub cooldown_ms: u32,
    pub range_meters: u32,
}

#[spacetimedb::table(accessor = quest_chain_def, public)]
pub struct QuestChainDef {
    #[primary_key]
    pub chain_id: u64,
    pub start_npc_id: u64,
    pub stage_count: u32,
    pub reward_item_def_id: u64,
    pub reward_item_qty: u32,
}
