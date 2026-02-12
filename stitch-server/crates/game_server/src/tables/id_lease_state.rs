use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = id_lease_state, public)]
pub struct IdLeaseState {
    #[primary_key]
    pub lease_key: String,
    pub identity: Identity,
    pub kind: u8,
    pub request_nonce: String,
    pub leased_id: u64,
    pub updated_at: Timestamp,
}
