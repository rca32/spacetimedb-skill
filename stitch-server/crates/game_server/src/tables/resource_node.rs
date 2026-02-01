use spacetimedb::Timestamp;

#[spacetimedb::table(name = resource_node)]
pub struct ResourceNode {
    #[primary_key]
    pub id: u64,
    pub hex_x: i32,
    pub hex_z: i32,
    #[index(btree)]
    pub chunk_id: i64,
    pub resource_def_id: u32,
    pub clump_id: i32,
    pub facing: u8,
    pub current_amount: u32,
    pub max_amount: u32,
    pub is_depleted: bool,
    pub respawn_at: Option<Timestamp>,
}
