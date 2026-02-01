#[derive(Clone, Copy, spacetimedb::SpacetimeType)]
pub enum FootprintTileType {
    Hitbox,
    Walkable,
    Decorative,
    Interaction,
}

#[spacetimedb::table(name = building_footprint, public)]
pub struct BuildingFootprint {
    #[primary_key]
    pub tile_id: u64,
    #[index(btree)]
    pub hex_x: i32,
    #[index(btree)]
    pub hex_z: i32,
    #[index(btree)]
    pub dimension_id: u32,
    pub building_entity_id: u64,
    pub tile_type: FootprintTileType,
    pub is_perimeter: bool,
    pub interaction_id: Option<u64>,
}
