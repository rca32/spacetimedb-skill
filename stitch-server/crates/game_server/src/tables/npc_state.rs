#[spacetimedb::table(name = npc_state, public)]
pub struct NpcState {
    #[primary_key]
    pub npc_id: u64,
    pub role: u8,
    pub mood: u8,
    pub next_action_ts: u64,
}
