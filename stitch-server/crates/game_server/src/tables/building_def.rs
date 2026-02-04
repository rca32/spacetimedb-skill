#[spacetimedb::table(name = building_def, public)]
pub struct BuildingDef {
    #[primary_key]
    pub building_id: u64,
    pub name: String,
    pub building_type: u8,
    pub size_x: u32,
    pub size_y: u32,
    pub build_cost_item_id: u64,
    pub build_cost_quantity: u32,
    pub build_time_secs: u32,
    pub max_integrity: u32,
    pub prerequisite_skill_id: u64,
    pub prerequisite_skill_level: u32,
    pub produces_item_id: u64,
    pub production_rate: u32,
}
