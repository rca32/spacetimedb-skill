#[spacetimedb::table(name = starving_state)]
pub struct StarvingState {
    #[primary_key]
    pub entity_id: u64,
    pub started_at: u64,
    pub debuff_id: u32,
}
