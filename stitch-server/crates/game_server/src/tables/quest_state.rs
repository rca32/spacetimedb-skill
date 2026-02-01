#[spacetimedb::table(name = quest_state)]
pub struct QuestState {
    #[primary_key]
    #[auto_inc]
    pub state_id: u64,
    #[index(btree)]
    pub entity_id: u64,
    #[index(btree)]
    pub chain_id: u64,
    pub stage_id: u64,
    pub status: u8,
}
