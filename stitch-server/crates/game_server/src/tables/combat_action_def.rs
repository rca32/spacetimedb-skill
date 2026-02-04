#[spacetimedb::table(name = combat_action_def, public)]
pub struct CombatActionDef {
    #[primary_key]
    pub action_id: u64,
    pub name: String,
    pub action_type: u8,
    pub damage_base: u32,
    pub damage_scaling: f32,
    pub stamina_cost: u32,
    pub cooldown_secs: u32,
    pub required_weapon_type: u8,
    pub effect_id: u64,
    pub effect_duration_secs: u32,
    pub range: u32,
    pub aoe_radius: u32,
}
