#[spacetimedb::table(name = claim_tech_state, public)]
pub struct ClaimTechState {
    #[primary_key]
    pub entity_id: u64,
    pub max_tiles: i32,
    pub tech_level: i32,
}
