#[derive(Clone)]
#[spacetimedb::table(name = duel_state, public)]
pub struct DuelState {
    #[primary_key]
    pub entity_id: u64,
    pub player_entity_ids: Vec<u64>,
    pub loser_index: i32,
    pub out_of_range_timestamps: Vec<u64>,
}
