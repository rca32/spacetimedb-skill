#[spacetimedb::table(name = enemy_scaling_def, public)]
pub struct EnemyScalingDef {
    #[primary_key]
    pub scaling_id: u64,
    pub enemy_type: u8,
    pub player_count_multiplier: f32,
    pub level_scaling_curve: String,
    pub hp_scaling_per_level: u32,
    pub damage_scaling_per_level: f32,
    pub exp_scaling_per_level: f32,
}
