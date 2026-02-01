#[spacetimedb::table(name = quest_chain_state, public)]
pub struct QuestChainState {
    #[primary_key]
    #[auto_inc]
    pub state_id: u64,
    #[index(btree)]
    pub entity_id: u64,
    #[index(btree)]
    pub quest_chain_id: u64,
    pub completed: bool,
    pub current_stage_index: i32,
}
