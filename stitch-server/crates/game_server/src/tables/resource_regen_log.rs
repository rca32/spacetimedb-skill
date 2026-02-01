#[spacetimedb::table(name = resource_regen_log)]
pub struct ResourceRegenLog {
    #[primary_key]
    pub entity_id: u64,
    pub original_hex_x: i32,
    pub original_hex_z: i32,
    pub chunk_id: i64,
    pub resource_def_id: u32,
    pub depleted_at: u64,
    pub respawn_at: u64,
}
