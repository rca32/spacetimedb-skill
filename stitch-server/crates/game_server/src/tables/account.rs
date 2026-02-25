use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = account, public)]
pub struct Account {
    #[primary_key]
    pub identity: Identity,
    pub created_at: Timestamp,
    pub status: u8, // 0: active, 1: blocked
}
