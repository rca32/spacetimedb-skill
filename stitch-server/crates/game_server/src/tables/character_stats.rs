#[spacetimedb::table(name = character_stats)]
pub struct CharacterStats {
    #[primary_key]
    pub entity_id: u64,
    pub max_hp: u32,
    pub max_stamina: u32,
    pub max_satiation: u32,
    pub active_hp_regen: f32,
    pub active_stamina_regen: f32,
    pub cooldown_reduction: f32,
}
