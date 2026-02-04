#[spacetimedb::table(name = enemy_def, public)]
pub struct EnemyDef {
    #[primary_key]
    pub enemy_id: u64,
    pub name: String,
    pub enemy_type: u8,
    pub biome_id: u64,
    pub level: u8,
    pub min_hp: u32,
    pub max_hp: u32,
    pub min_damage: u32,
    pub max_damage: u32,
    pub attack_speed: f32,
    pub move_speed: f32,
    pub aggro_range: u32,
    pub exp_reward: u32,
    pub loot_item_list_id: u64,
    pub special_ability_id: u64,
}
