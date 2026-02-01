#[spacetimedb::table(name = world_gen_params)]
pub struct WorldGenParams {
    #[primary_key]
    pub id: u32,
    pub seed: u64,
    pub world_width_chunks: i32,
    pub world_height_chunks: i32,
    pub sea_level: i16,
}
