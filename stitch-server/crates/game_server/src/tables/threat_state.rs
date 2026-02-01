#[spacetimedb::table(name = threat_state, public)]
pub struct ThreatState {
    #[primary_key]
    pub entity_id: u64,
    pub owner_entity_id: u64,
    pub target_entity_id: u64,
    pub threat: f32,
}
