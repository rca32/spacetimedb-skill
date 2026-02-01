#[spacetimedb::table(name = item_instance)]
pub struct ItemInstance {
    #[primary_key]
    pub item_instance_id: u64,
    pub item_def_id: u64,
    pub item_type: u8,
    pub durability: Option<i32>,
    pub bound: bool,
}
