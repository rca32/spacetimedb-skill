#[spacetimedb::table(name = environment_effect_state)]
pub struct EnvironmentEffectState {
    #[primary_key]
    pub entity_id: u64,
    pub last_biome_id: u16,
    pub last_evaluated_at: u64,
    pub is_submerged: bool,
}
