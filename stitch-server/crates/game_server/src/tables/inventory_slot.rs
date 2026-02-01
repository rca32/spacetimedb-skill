#[spacetimedb::table(name = inventory_slot)]
#[derive(Clone, Debug)]
pub struct InventorySlot {
    #[primary_key]
    pub slot_id: u64,
    #[index(btree)]
    pub container_id: u64,
    #[index(btree)]
    pub slot_index: u32,
    pub item_instance_id: u64,
    pub volume: i32,
    pub locked: bool,
    pub item_type: u8,
}
