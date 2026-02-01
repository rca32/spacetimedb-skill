#[spacetimedb::table(name = transform_state, public)]
pub struct TransformState {
    #[primary_key]
    pub entity_id: u64,
    pub hex_x: i32,
    pub hex_z: i32,
    pub dimension: u16,
    pub dest_hex_x: i32,
    pub dest_hex_z: i32,
    pub is_moving: bool,
    pub facing: u8,
    pub updated_at: u64,
}
