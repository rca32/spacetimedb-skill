use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = movement_violation, private)]
pub struct MovementViolation {
    #[primary_key]
    pub violation_id: String,
    pub identity: Identity,
    pub reason: String,
    pub ts: Timestamp,
    pub attempted_position: Vec<f32>,
}
