#[spacetimedb::table(name = dimension_network, public)]
pub struct DimensionNetwork {
    #[primary_key]
    pub entity_id: u64,
    pub building_id: u64,
    pub collapse_respawn_timestamp: u64,
}
