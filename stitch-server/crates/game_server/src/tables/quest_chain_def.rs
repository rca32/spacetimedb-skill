#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct QuestRequirement {
    pub item_requirements: Vec<crate::tables::InputItemStack>,
    pub skill_id: u64,
    pub skill_level: u32,
}

#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct SkillReward {
    pub skill_id: u64,
    pub xp: f32,
}

#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct QuestReward {
    pub item_rewards: Vec<crate::tables::InputItemStack>,
    pub skill_rewards: Vec<SkillReward>,
}

#[spacetimedb::table(name = quest_chain_def, public)]
pub struct QuestChainDef {
    #[primary_key]
    pub quest_chain_id: u64,
    pub requirements: Vec<QuestRequirement>,
    pub rewards: Vec<QuestReward>,
    pub stages: Vec<u64>,
}
