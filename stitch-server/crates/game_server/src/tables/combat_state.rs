#[spacetimedb::table(name = combat_state, public)]
pub struct CombatState {
    #[primary_key]
    pub entity_id: u64,
    pub last_attacked_timestamp: u64,
    pub global_cooldown: Option<ActionCooldown>,
    pub last_performed_action_entity_id: u64,
}

#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct ActionCooldown {
    pub expires_at: u64,
    pub action_id: i32,
}
