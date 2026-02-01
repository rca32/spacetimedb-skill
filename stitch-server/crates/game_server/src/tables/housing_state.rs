#[spacetimedb::table(name = housing_state, public)]
pub struct HousingState {
    #[primary_key]
    pub entity_id: u64,
    pub entrance_building_entity_id: u64,
    pub exit_portal_entity_id: u64,
    pub network_entity_id: u64,
    pub region_index: u32,
    pub locked_until: u64,
    pub is_empty: bool,
}
