#[spacetimedb::table(name = inventory_slot, private)]
pub struct InventorySlot {
    #[primary_key]
    pub slot_key: String,
    pub container_id: u64,
    pub slot_index: u32,
    pub item_instance_id: u64, // 0 = empty
    pub volume: i32,
    pub locked: bool,
    pub item_type: u8, // 0 = Item, 1 = Cargo
}
