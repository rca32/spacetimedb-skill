use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = movement_violation, private)]
pub struct MovementViolation {
    #[primary_key]
    pub violation_id: String,
    pub identity: Identity,
    pub reason: String,
    pub ts: Timestamp,
    pub attempted_position: Vec<f32>,
}

#[spacetimedb::table(name = movement_request_log, private)]
pub struct MovementRequestLog {
    #[primary_key]
    pub request_key: String,
    pub identity: Identity,
    pub request_id: String,
    pub region_id: u64,
    pub client_ts_ms: u64,
    pub accepted: bool,
    pub processed_at: Timestamp,
}

#[spacetimedb::table(name = movement_actor_state, private)]
pub struct MovementActorState {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub last_client_ts_ms: u64,
    pub last_request_id: String,
    pub last_position: Vec<f32>,
    pub updated_at: Timestamp,
}
