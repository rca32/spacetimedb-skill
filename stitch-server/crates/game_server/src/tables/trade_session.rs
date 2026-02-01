#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct TradePocket {
    pub item_instance_id: u64,
    pub quantity: i32,
}

#[spacetimedb::table(name = trade_session, public)]
pub struct TradeSession {
    #[primary_key]
    pub session_id: u64,
    pub initiator_id: u64,
    pub acceptor_id: u64,
    pub status: u8,
    pub initiator_offer: Vec<TradePocket>,
    pub acceptor_offer: Vec<TradePocket>,
    pub updated_at: u64,
}
