#[spacetimedb::table(name = price_index, public)]
pub struct PriceIndex {
    #[primary_key]
    pub item_def_id: u64,
    pub base_price: u64,
    pub buy_multiplier: f32,
    pub sell_multiplier: f32,
    pub fluctuation_rate: f32,
    pub last_update: u64,
}
