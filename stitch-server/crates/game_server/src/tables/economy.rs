use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = wallet, private)]
pub struct Wallet {
    #[primary_key]
    pub identity: Identity,
    pub balance: i64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(accessor = currency_txn, private)]
pub struct CurrencyTxn {
    #[primary_key]
    #[auto_inc]
    pub txn_id: u64,
    pub identity: Identity,
    pub amount: i64,
    pub reason: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(accessor = tax_policy, private)]
pub struct TaxPolicy {
    #[primary_key]
    pub item_def_id: u64,
    pub tax_bps: u32,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(accessor = price_index, public)]
pub struct PriceIndex {
    #[primary_key]
    pub index_key: String,
    pub item_def_id: u64,
    pub price_avg: u64,
    pub volume: u64,
    pub recorded_at: Timestamp,
}

#[spacetimedb::table(accessor = order_fill, private)]
pub struct OrderFill {
    #[primary_key]
    #[auto_inc]
    pub fill_id: u64,
    pub order_id: String,
    pub fill_qty: u32,
    pub fill_price: u64,
    pub created_at: Timestamp,
}

#[spacetimedb::table(accessor = escrow_item, private)]
pub struct EscrowItem {
    #[primary_key]
    pub escrow_key: String,
    pub trade_session_id: String,
    pub item_instance_id: u64,
    pub quantity: u32,
    pub owner_identity: Identity,
    pub created_at: Timestamp,
}
