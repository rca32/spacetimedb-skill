#[spacetimedb::table(name = skill_progress)]
pub struct SkillProgress {
    #[primary_key]
    pub progress_id: u64,
    #[index(btree)]
    pub entity_id: u64,
    #[index(btree)]
    pub skill_id: u64,
    pub xp: u64,
    pub level: u32,
    pub last_gained_at: u64,
}
