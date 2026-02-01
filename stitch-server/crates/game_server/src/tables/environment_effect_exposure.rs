#[spacetimedb::table(name = environment_effect_exposure)]
pub struct EnvironmentEffectExposure {
    #[primary_key]
    #[auto_inc]
    pub exposure_id: u64,
    #[index(btree)]
    pub entity_id: u64,
    #[index(btree)]
    pub effect_id: i32,
    pub exposure: i32,
    pub last_tick_at: u64,
}
