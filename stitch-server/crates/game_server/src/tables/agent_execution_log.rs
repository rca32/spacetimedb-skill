#[spacetimedb::table(name = agent_execution_log)]
pub struct AgentExecutionLog {
    #[primary_key]
    #[auto_inc]
    pub log_id: u64,
    pub agent_name: String,
    pub started_at: u64,
    pub completed_at: u64,
    pub items_processed: u32,
    pub success: bool,
    pub error_message: Option<String>,
}
