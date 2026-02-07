use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = combat_state, public)]
pub struct CombatState {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub in_combat: bool,
    pub current_hp: i32,
    pub last_attack_client_ts_ms: u64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = threat_state, public)]
pub struct ThreatState {
    #[primary_key]
    pub threat_key: String,
    pub attacker_identity: Identity,
    pub target_identity: Identity,
    pub threat: i32,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = attack_schedule_state, private)]
pub struct AttackScheduled {
    #[primary_key]
    pub request_key: String,
    pub attacker_identity: Identity,
    pub target_identity: Identity,
    pub region_id: u64,
    pub client_ts_ms: u64,
    pub impact_damage: i32,
    pub phase: u8, // 0=start, 1=scheduled, 2=resolved
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = attack_outcome, public)]
pub struct AttackOutcome {
    #[primary_key]
    pub outcome_id: String,
    pub request_key: String,
    pub attacker_identity: Identity,
    pub target_identity: Identity,
    pub region_id: u64,
    pub damage: i32,
    pub target_hp_after: i32,
    pub hit: bool,
    pub resolved_at: Timestamp,
}
