#[spacetimedb::table(name = inventory_container)]
#[derive(Clone, Debug)]
pub struct InventoryContainer {
    #[primary_key]
    pub container_id: u64,
    #[index(btree)]
    pub owner_entity_id: u64,
    pub inventory_index: i32,
    pub cargo_index: i32,
    pub slot_count: i32,
    pub item_pocket_volume: i32,
    pub cargo_pocket_volume: i32,
    pub player_owner_entity_id: u64,
}
