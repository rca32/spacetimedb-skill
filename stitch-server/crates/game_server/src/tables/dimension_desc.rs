#[spacetimedb::table(name = dimension_desc, public)]
pub struct DimensionDesc {
    #[primary_key]
    pub entity_id: u64,
    pub dimension_id: u32,
    pub network_entity_id: u64,
    pub interior_instance_id: u64,
    pub collapse_timestamp: u64,
}
