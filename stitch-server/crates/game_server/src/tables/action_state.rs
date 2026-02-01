#[spacetimedb::table(name = action_state, public)]
pub struct ActionState {
    #[primary_key]
    pub entity_id: u64,
    pub action_type: u8,
    pub progress: u32,
    pub cooldown_ts: u64,
}
