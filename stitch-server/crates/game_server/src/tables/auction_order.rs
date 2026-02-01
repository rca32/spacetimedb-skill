#[spacetimedb::table(name = auction_order, public)]
pub struct AuctionOrder {
    #[primary_key]
    pub order_id: u64,
    pub owner_entity_id: u64,
    pub claim_entity_id: u64,
    pub order_type: u8,
    pub item_def_id: u64,
    pub item_type: u8,
    pub price_threshold: i32,
    pub quantity: i32,
    pub stored_coins: i32,
    pub timestamp: u64,
}
