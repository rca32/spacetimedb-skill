use spacetimedb::Identity;

#[spacetimedb::table(name = market_order, public)]
pub struct MarketOrder {
    #[primary_key]
    pub order_id: u64,
    pub order_type: u8,
    pub item_def_id: u64,
    pub price: u64,
    pub qty: u64,
    pub owner: Identity,
}
