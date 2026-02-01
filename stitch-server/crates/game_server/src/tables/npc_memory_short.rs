#[spacetimedb::table(name = npc_memory_short)]
pub struct NpcMemoryShort {
    #[primary_key]
    pub entry_id: u64,
    pub npc_id: u64,
    pub summary: String,
    pub created_at: u64,
}
