use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = session_state, public)]
pub struct SessionState {
    #[primary_key]
    pub session_id: u64,
    #[index(btree)]
    pub identity: Identity,
    pub entity_id: u64,
    pub connected_at: Timestamp,
    pub last_active: Timestamp,
}
