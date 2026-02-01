#[spacetimedb::table(name = skill_def, public)]
pub struct SkillDef {
    #[primary_key]
    pub skill_id: u64,
    pub name: String,
    pub max_level: u32,
    pub xp_curve_type: u8,
}
