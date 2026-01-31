use spacetimedb::Timestamp;

#[spacetimedb::table(name = inventory_container, public)]
pub struct InventoryContainer {
    #[primary_key]
    pub container_id: u64,
    #[index(btree)]
    pub owner_entity_id: u64,
    pub max_slots: u32,
}

#[spacetimedb::table(name = inventory_slot, public)]
pub struct InventorySlot {
    #[primary_key]
    pub slot_id: u64,
    #[index(btree)]
    pub container_id: u64,
    #[index(btree)]
    pub slot_index: u32,
    pub item_instance_id: Option<u64>,
}

#[spacetimedb::table(name = item_instance, public)]
pub struct ItemInstance {
    #[primary_key]
    pub instance_id: u64,
    pub item_def_id: u64,
    pub quantity: u32,
    pub durability: Option<u32>,
}

/// World items - items dropped on the ground
#[spacetimedb::table(name = world_item, public)]
pub struct WorldItem {
    #[primary_key]
    pub world_item_id: u64,
    pub item_def_id: u64,
    pub quantity: u32,
    pub hex_q: i32,
    pub hex_r: i32,
    pub region_id: u64,
    pub dropped_at: Timestamp,
    pub dropped_by: Option<u64>, // entity_id of player who dropped it
}
