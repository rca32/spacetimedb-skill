#[spacetimedb::table(name = claim_tile_state, public)]
pub struct ClaimTileState {
    #[primary_key]
    pub entity_id: u64,
    pub claim_id: u64,
    pub x: i32,
    pub z: i32,
    pub dimension: u16,
}
