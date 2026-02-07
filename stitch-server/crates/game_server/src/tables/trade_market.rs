use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = trade_session, public)]
pub struct TradeSession {
    #[primary_key]
    pub session_id: String,
    pub initiator_identity: Identity,
    pub partner_identity: Identity,
    pub region_id: u64,
    pub phase: u8,              // 0=open,1=both_accepted,2=completed,3=cancelled
    pub initiator_accepted: bool,
    pub partner_accepted: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = trade_offer, public)]
pub struct TradeOffer {
    #[primary_key]
    pub offer_key: String,
    pub session_id: String,
    pub owner_identity: Identity,
    pub item_instance_id: u64,
    pub quantity: u32,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = market_order, public)]
pub struct MarketOrder {
    #[primary_key]
    pub order_id: String,
    pub owner_identity: Identity,
    pub region_id: u64,
    pub side: u8, // 0=buy,1=sell
    pub item_def_id: u64,
    pub quantity_open: u32,
    pub unit_price: u64,
    pub status: u8, // 0=open,1=cancelled,2=filled
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = market_fill, public)]
pub struct MarketFill {
    #[primary_key]
    pub fill_id: String,
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub item_def_id: u64,
    pub quantity: u32,
    pub unit_price: u64,
    pub buyer_identity: Identity,
    pub seller_identity: Identity,
    pub created_at: Timestamp,
}
