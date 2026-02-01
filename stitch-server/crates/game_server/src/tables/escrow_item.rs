#[spacetimedb::table(name = escrow_item, public)]
pub struct EscrowItem {
    #[primary_key]
    pub escrow_id: u64,
    pub session_id: u64,
    pub owner_entity_id: u64,
    pub item_def_id: u64,
    pub item_type: u8,
    pub quantity: i32,
}
