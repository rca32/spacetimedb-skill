#[spacetimedb::table(name = order_fill, public)]
pub struct OrderFill {
    #[primary_key]
    pub fill_id: u64,
    pub order_id: u64,
    pub owner_entity_id: u64,
    pub item_def_id: u64,
    pub item_type: u8,
    pub quantity: i32,
    pub coins: i32,
    pub timestamp: u64,
}
