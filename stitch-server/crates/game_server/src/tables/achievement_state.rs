#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct KnowledgeEntry {
    pub achievement_id: u64,
    pub discovered: bool,
    pub acquired: bool,
    pub discovered_at: u64,
    pub acquired_at: u64,
}

#[derive(Clone)]
#[spacetimedb::table(name = achievement_state, public)]
pub struct AchievementState {
    #[primary_key]
    pub entity_id: u64,
    pub entries: Vec<KnowledgeEntry>,
}
