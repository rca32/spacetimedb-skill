#[spacetimedb::table(name = resource_state, public)]
pub struct ResourceState {
    #[primary_key]
    pub entity_id: u64,
    pub hp: u32,
    pub stamina: u32,
    pub satiation: u32,
    pub regen_ts: u64,
    pub last_stamina_use_ts: u64,
}
