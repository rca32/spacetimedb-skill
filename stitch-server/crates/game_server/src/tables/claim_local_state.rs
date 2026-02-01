#[spacetimedb::table(name = claim_local_state)]
pub struct ClaimLocalState {
    #[primary_key]
    pub entity_id: u64,
    pub supplies: i32,
    pub num_tiles: u32,
    pub num_tile_neighbors: u32,
    pub treasury: u32,
}
