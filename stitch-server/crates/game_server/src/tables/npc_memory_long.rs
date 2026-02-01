#[spacetimedb::table(name = npc_memory_long)]
pub struct NpcMemoryLong {
    #[primary_key]
    pub entry_id: u64,
    pub npc_id: u64,
    pub summary: String,
    pub created_at: u64,
}
