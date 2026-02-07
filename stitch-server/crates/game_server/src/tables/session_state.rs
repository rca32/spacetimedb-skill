use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = session_state, private)]
pub struct SessionState {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub last_active_at: Timestamp,
}
