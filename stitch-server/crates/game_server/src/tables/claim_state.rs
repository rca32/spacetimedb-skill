#[spacetimedb::table(name = claim_state, public)]
pub struct ClaimState {
    #[primary_key]
    pub claim_id: u64,
    pub owner_player_entity_id: u64,
    pub owner_building_entity_id: u64,
    pub region_id: u64,
    pub name: String,
}
