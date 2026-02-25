use spacetimedb::Timestamp;

#[spacetimedb::table(accessor = region_state, public)]
pub struct RegionState {
    #[primary_key]
    pub region_id: u64,
    pub name: String,
    pub status: u8,
    pub shard_load_permille: u16,
}

#[spacetimedb::table(accessor = instance_state, public)]
pub struct InstanceState {
    #[primary_key]
    pub instance_id: u64,
    pub region_id: u64,
    pub instance_type: u8,
    pub ttl_seconds: u32,
}

#[spacetimedb::table(accessor = entity_core, public)]
pub struct EntityCore {
    #[primary_key]
    pub entity_id: u64,
    pub entity_type: u8,
    pub region_id: u64,
    pub instance_id: u64,
    pub visibility: u8,
}

#[spacetimedb::table(accessor = terrain_chunk, public)]
pub struct TerrainChunk {
    #[primary_key]
    pub chunk_key: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub biome_id: u16,
    pub seed: u64,
    pub generated_at: Timestamp,
    pub height_min: i16,
    pub height_max: i16,
    pub water_ratio_permille: u16,
    pub cell_payload_version: u16,
    pub cell_payload: Vec<i16>,
}

#[spacetimedb::table(accessor = terrain_chunk_stream, public)]
pub struct TerrainChunkStream {
    #[primary_key]
    pub chunk_key: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub biome_id: u16,
    pub seed: u64,
    pub generated_at: Timestamp,
    pub height_min: i16,
    pub height_max: i16,
    pub water_ratio_permille: u16,
}

#[spacetimedb::table(accessor = terrain_chunk_payload, public)]
pub struct TerrainChunkPayload {
    #[primary_key]
    pub chunk_key: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub cell_payload_version: u16,
    pub cell_payload_bytes: Vec<u8>,
    pub cell_count: u32,
    pub generated_at: Timestamp,
}

#[spacetimedb::table(accessor = resource_node, public)]
pub struct ResourceNode {
    #[primary_key]
    pub entity_id: u64,
    pub region_id: u64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub hex_x: i32,
    pub hex_z: i32,
    pub resource_def_id: u64,
    pub clump_id: i32,
    pub resource_type: u8,
    pub amount: u32,
    pub max_amount: u32,
    pub is_depleted: bool,
    pub respawn_at: Timestamp,
}

#[spacetimedb::table(accessor = worldgen_chunk_generation_queue, public)]
pub struct WorldgenChunkGenerationQueue {
    #[primary_key]
    pub queue_key: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub priority: i32,
    pub requested_at: Timestamp,
}
