use spacetimedb::Timestamp;

#[spacetimedb::table(name = region_state, public)]
pub struct RegionState {
    #[primary_key]
    pub region_id: u64,
    pub name: String,
    pub status: u8,
    pub shard_load_permille: u16,
}

#[spacetimedb::table(name = instance_state, public)]
pub struct InstanceState {
    #[primary_key]
    pub instance_id: u64,
    pub region_id: u64,
    pub instance_type: u8,
    pub ttl_seconds: u32,
}

#[spacetimedb::table(name = entity_core, public)]
pub struct EntityCore {
    #[primary_key]
    pub entity_id: u64,
    pub entity_type: u8,
    pub region_id: u64,
    pub instance_id: u64,
    pub visibility: u8,
}

#[spacetimedb::table(name = terrain_chunk, public)]
pub struct TerrainChunk {
    #[primary_key]
    pub chunk_key: String,
    pub region_id: u64,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub biome_id: u16,
    pub seed: u64,
}

#[spacetimedb::table(name = resource_node, public)]
pub struct ResourceNode {
    #[primary_key]
    pub entity_id: u64,
    pub resource_type: u8,
    pub amount: u32,
    pub respawn_at: Timestamp,
}
