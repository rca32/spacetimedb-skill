use spacetimedb::Identity;

#[spacetimedb::table(name = inventory_container, private)]
pub struct InventoryContainer {
    #[primary_key]
    pub container_id: u64,
    pub owner_identity: Identity,
    pub inventory_index: i32,
    pub cargo_index: i32,
    pub slot_count: u32,
    pub item_pocket_volume: i32,
    pub cargo_pocket_volume: i32,
}
