use spacetimedb::Timestamp;

#[spacetimedb::table(accessor = building_footprint, public)]
pub struct BuildingFootprint {
    #[primary_key]
    pub tile_key: String,
    pub building_entity_id: u64,
    pub region_id: u64,
    pub dimension_id: u32,
    pub hex_x: i32,
    pub hex_z: i32,
    pub tile_type: u8,
    pub is_perimeter: bool,
    pub created_at: Timestamp,
}
