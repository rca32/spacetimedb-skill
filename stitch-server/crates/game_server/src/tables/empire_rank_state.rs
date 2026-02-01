#[spacetimedb::table(name = empire_rank_state, public)]
pub struct EmpireRankState {
    #[primary_key]
    pub entity_id: u64,
    pub empire_entity_id: u64,
    pub rank: u8,
    pub title: String,
    pub permissions: Vec<bool>,
}
