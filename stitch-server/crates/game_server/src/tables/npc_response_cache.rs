#[spacetimedb::table(name = npc_response_cache)]
pub struct NpcResponseCache {
    #[primary_key]
    pub cache_id: u64,
    pub npc_id: u64,
    pub request_hash: u64,
    pub response: String,
    pub created_at: u64,
}
