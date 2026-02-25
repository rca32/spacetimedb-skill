use spacetimedb::Timestamp;

#[spacetimedb::table(accessor = world_gen_params, public)]
pub struct WorldGenParams {
    #[primary_key]
    pub id: u64,
    pub enabled: bool,
    pub version: u32,
    pub seed: u64,
    pub size_x_chunks: i32,
    pub size_y_chunks: i32,
    pub sea_level: i16,
    pub noise_scale: f32,
    pub noise_octaves: u8,
    pub noise_persistence: f32,
    pub noise_lacunarity: f32,
    pub terrain_chunk_size: u16,
    pub regenerate_on_start: bool,
    pub lazy_generation_enabled: bool,
    pub lazy_seed_radius_chunks: i16,
    pub lazy_chunks_per_tick: u16,
    pub lazy_prefetch_ring: i16,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(accessor = biome_gen_def, public)]
pub struct BiomeGenDef {
    #[primary_key]
    pub biome_id: u16,
    pub name: String,
    pub min_elevation: i16,
    pub max_elevation: i16,
    pub moisture_min: i16,
    pub moisture_max: i16,
    pub resource_bias_permille: u16,
}

#[spacetimedb::table(accessor = resource_gen_def, public)]
pub struct ResourceGenDef {
    #[primary_key]
    pub resource_type: u8,
    pub resource_def_id: u64,
    pub base_chance_permille: u16,
    pub min_elevation: i16,
    pub max_elevation: i16,
    pub min_water_depth: i16,
    pub max_water_depth: i16,
    pub noise_threshold_permille: u16,
    pub max_amount: u32,
    pub respawn_seconds: u32,
}

#[spacetimedb::table(accessor = resource_clump_def, public)]
pub struct ResourceClumpDef {
    #[primary_key]
    pub clump_key: String,
    pub resource_type: u8,
    pub clump_id: i32,
    pub member_index: u8,
    pub dx: i8,
    pub dz: i8,
    pub is_center: bool,
}
