#[spacetimedb::table(name = biome_def, public)]
pub struct BiomeDef {
    #[primary_key]
    pub biome_id: u64,
    pub name: String,
    pub temperature: i32,
    pub moisture: i32,
    pub elevation_min: i32,
    pub elevation_max: i32,
    pub resource_spawn_rate: f32,
    pub danger_level: u8,
    pub color_hex: String,
}
