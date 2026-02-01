#[spacetimedb::table(name = nav_cell_cost, public)]
pub struct NavCellCost {
    #[primary_key]
    pub cell_key: u64,
    pub terrain_cost: f32,
    pub blocked: bool,
}
