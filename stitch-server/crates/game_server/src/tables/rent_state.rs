#[spacetimedb::table(name = rent_state, public)]
pub struct RentState {
    #[primary_key]
    pub entity_id: u64,
    pub white_list: Vec<u64>,
}
