#[spacetimedb::table(name = nav_obstacle, public)]
pub struct NavObstacle {
    #[primary_key]
    pub entity_id: u64,
    pub x: i32,
    pub z: i32,
    pub dimension: u16,
    pub blocked: bool,
}
