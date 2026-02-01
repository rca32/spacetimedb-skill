#[spacetimedb::table(name = npc_action_result, public)]
pub struct NpcActionResult {
    #[primary_key]
    pub result_id: u64,
    pub request_id: u64,
    pub npc_id: u64,
    pub status: u8,
    pub applied_at: u64,
}
