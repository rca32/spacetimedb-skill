use spacetimedb::Identity;

#[spacetimedb::table(name = session_state)]
pub struct SessionState {
    #[primary_key]
    pub session_id: u64,
    #[index(btree)]
    pub identity: Identity,
    pub region_id: u64,
    pub last_active_at: u64,
}
