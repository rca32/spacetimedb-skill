#[spacetimedb::table(name = achievement_def, public)]
pub struct AchievementDef {
    #[primary_key]
    pub achievement_id: u64,
    pub requisites: Vec<u64>,
    pub skill_id: u64,
    pub skill_level: u32,
    pub item_disc: Vec<u64>,
    pub cargo_disc: Vec<u64>,
    pub craft_disc: Vec<u64>,
    pub resource_disc: Vec<u64>,
    pub chunks_discovered: i32,
    pub pct_chunks_discovered: f32,
    pub collectible_rewards: Vec<u64>,
}
