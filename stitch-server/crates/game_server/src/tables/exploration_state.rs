#[spacetimedb::table(name = exploration_state)]
pub struct ExplorationState {
    #[primary_key]
    pub entity_id: u64,
    pub explored_chunks: Vec<u64>,
    pub discovered_ruins: Vec<u64>,
    pub discovered_claims: Vec<u64>,
    pub last_explored_at: u64,
}
