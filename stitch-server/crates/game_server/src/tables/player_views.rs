use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = player_inventory_container_view, public)]
pub struct PlayerInventoryContainerView {
    #[primary_key]
    pub view_key: String,
    pub owner_identity: Identity,
    pub container_id: u64,
    pub slot_count: u32,
    pub item_pocket_volume: i32,
    pub cargo_pocket_volume: i32,
}

#[spacetimedb::table(name = player_inventory_slot_view, public)]
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

#[spacetimedb::table(name = player_inventory_item_view, public)]
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

#[spacetimedb::table(name = player_wallet_view, public)]
pub struct PlayerWalletView {
    #[primary_key]
    pub identity: Identity,
    pub balance: i64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = player_session_view, public)]
pub struct PlayerSessionView {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub last_active_at: Timestamp,
}

#[spacetimedb::table(name = player_movement_feedback_view, public)]
pub struct PlayerMovementFeedbackView {
    #[primary_key]
    pub request_key: String,
    pub identity: Identity,
    pub request_id: String,
    pub accepted: bool,
    pub reason_code: String,
    pub server_x: f32,
    pub server_y: f32,
    pub server_z: f32,
    pub processed_at: Timestamp,
}
