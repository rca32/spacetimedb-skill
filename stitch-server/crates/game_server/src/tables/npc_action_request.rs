#[spacetimedb::table(name = npc_action_request)]
pub struct NpcActionRequest {
    #[primary_key]
    pub request_id: u64,
    pub npc_id: u64,
    pub action_type: u8,
    pub payload: String,
    pub created_at: u64,
}
