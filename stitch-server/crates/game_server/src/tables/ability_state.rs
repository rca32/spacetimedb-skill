#[spacetimedb::table(name = ability_state, public)]
pub struct AbilityState {
    #[primary_key]
    pub entity_id: u64,
    #[index(btree)]
    pub owner_entity_id: u64,
    pub ability_type: String,
    pub ability_def_id: u32,
    pub cooldown_until: u64,
    pub use_count: u32,
    pub toolbar_slot: Option<u8>,
}

impl AbilityState {
    pub fn is_on_cooldown(&self, now: spacetimedb::Timestamp) -> bool {
        (now.to_micros_since_unix_epoch() as u64) < self.cooldown_until
    }
}
