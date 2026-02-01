#[derive(Clone, Copy, spacetimedb::SpacetimeType)]
pub enum BuildingStateEnum {
    Normal,
    Damaged,
    Broken,
    Decaying,
}

#[spacetimedb::table(name = building_state, public)]
pub struct BuildingState {
    #[primary_key]
    pub entity_id: u64,
    pub building_def_id: u32,
    pub owner_id: u64,
    pub claim_id: Option<u64>,
    pub constructed_by: Option<u64>,
    pub hex_x: i32,
    pub hex_z: i32,
    pub facing: u8,
    pub dimension_id: u32,
    pub current_durability: u32,
    pub max_durability: u32,
    pub state: BuildingStateEnum,
    pub last_maintenance_at: u64,
    pub is_active: bool,
    pub nickname: Option<String>,
    pub interior_instance_id: Option<u64>,
}
