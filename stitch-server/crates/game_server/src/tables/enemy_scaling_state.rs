#[spacetimedb::table(name = enemy_scaling_state, public)]
pub struct EnemyScalingState {
    #[primary_key]
    pub entity_id: u64,
    pub enemy_scaling_id: u64,
}
