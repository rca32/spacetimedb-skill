use spacetimedb::Timestamp;

#[spacetimedb::table(accessor = environment_effect_desc, public)]
pub struct EnvironmentEffectDesc {
    #[primary_key]
    pub effect_id: u64,
    pub name: String,
    pub hazard_biome_id: u16,
    pub status_effect_id: u64,
    pub damage_per_tick: u32,
    pub exposure_per_tick: i32,
    pub max_exposure: i32,
    pub exposure_decay_per_tick: i32,
    pub resistance_level_required: u32,
    pub damage_interval_seconds: u32,
    pub enabled: bool,
}

#[spacetimedb::table(accessor = environment_effect_state, private)]
pub struct EnvironmentEffectState {
    #[primary_key]
    pub entity_id: u64,
    pub last_biome_id: u16,
    pub last_evaluated_at: Timestamp,
    pub is_submerged: bool,
}

#[spacetimedb::table(accessor = environment_effect_exposure, private)]
pub struct EnvironmentEffectExposure {
    #[primary_key]
    pub exposure_key: String,
    pub entity_id: u64,
    pub effect_id: u64,
    pub exposure: i32,
    pub last_tick_at: Timestamp,
}
