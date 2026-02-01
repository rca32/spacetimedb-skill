use spacetimedb::SpacetimeType;

#[derive(Clone, Debug, SpacetimeType)]
pub struct TerrainCell {
    pub chunk_id: i64,
    pub cell_index: u16,
    pub hex_x: i32,
    pub hex_z: i32,
    pub elevation: i16,
    pub water_level: i16,
    pub water_body_type: u8,
    pub biome_id: u16,
    pub biome_blend: u8,
    pub vegetation_density: u8,
    pub zoning_type: u8,
    pub original_elevation: i16,
    pub distance_to_water: i16,
    pub distance_to_sea: i16,
}

#[spacetimedb::table(name = terrain_chunk)]
pub struct TerrainChunk {
    #[primary_key]
    pub chunk_id: i64,
    pub dimension: i32,
    pub chunk_x: i32,
    pub chunk_z: i32,
    pub is_generated: bool,
    pub generation_seed: u64,
    pub biome_distribution: Vec<u16>,
    pub cells: Vec<TerrainCell>,
}
