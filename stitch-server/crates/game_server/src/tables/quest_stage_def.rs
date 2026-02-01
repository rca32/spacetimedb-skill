#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct CompletionCondition {
    pub item_requirements: Vec<crate::tables::InputItemStack>,
    pub consume: bool,
}

#[spacetimedb::table(name = quest_stage_def, public)]
pub struct QuestStageDef {
    #[primary_key]
    pub quest_stage_id: u64,
    pub completion_conditions: Vec<CompletionCondition>,
}
