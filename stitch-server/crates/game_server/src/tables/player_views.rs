use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = player_inventory_container_view, public)]
pub struct PlayerInventoryContainerView {
    #[primary_key]
    pub view_key: String,
    pub owner_identity: Identity,
    pub container_id: u64,
    pub slot_count: u32,
    pub item_pocket_volume: i32,
    pub cargo_pocket_volume: i32,
}

#[spacetimedb::table(accessor = player_inventory_slot_view, public)]
pub struct PlayerInventorySlotView {
    #[primary_key]
    pub slot_key: String,
    pub owner_identity: Identity,
    pub container_id: u64,
    pub slot_index: u32,
    pub item_instance_id: u64,
    pub locked: bool,
    pub item_type: u8,
    pub volume: i32,
}

#[spacetimedb::table(accessor = player_inventory_item_view, public)]
pub struct PlayerInventoryItemView {
    #[primary_key]
    pub item_instance_id: u64,
    pub owner_identity: Identity,
    pub container_id: u64,
    pub slot_index: u32,
    pub item_def_id: u64,
    pub quantity: u32,
    pub durability: i32,
    pub bound: bool,
}

#[spacetimedb::table(accessor = player_wallet_view, public)]
pub struct PlayerWalletView {
    #[primary_key]
    pub identity: Identity,
    pub balance: i64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(accessor = player_session_view, public)]
pub struct PlayerSessionView {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub last_active_at: Timestamp,
}
