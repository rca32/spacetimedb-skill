use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = inventory_lock, private)]
pub struct InventoryLock {
    #[primary_key]
    pub container_id: u64,
    pub lock_reason: String,
    pub locked_by: Identity,
    pub expires_at: Timestamp,
}
