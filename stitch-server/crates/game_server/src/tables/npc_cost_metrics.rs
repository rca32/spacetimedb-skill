#[spacetimedb::table(name = npc_cost_metrics)]
pub struct NpcCostMetrics {
    #[primary_key]
    pub entry_id: u64,
    pub npc_id: u64,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub usd_cost: f32,
    pub created_at: u64,
}
