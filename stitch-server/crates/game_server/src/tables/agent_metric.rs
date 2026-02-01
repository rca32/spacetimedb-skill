#[spacetimedb::table(name = agent_metric, public)]
pub struct AgentMetric {
    #[primary_key]
    #[auto_inc]
    pub metric_id: u64,
    pub agent_name: String,
    pub timestamp: u64,
    pub items_processed: u32,
}
