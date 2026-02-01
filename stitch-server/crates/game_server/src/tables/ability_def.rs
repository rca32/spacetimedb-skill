#[spacetimedb::table(name = ability_def, public)]
pub struct AbilityDef {
    #[primary_key]
    pub ability_def_id: u32,
    pub ability_type: String,
    pub base_cooldown_secs: u32,
    pub required_skill_id: Option<u64>,
    pub required_skill_level: u32,
    pub stamina_cost: u32,
    pub hp_cost: u32,
}
