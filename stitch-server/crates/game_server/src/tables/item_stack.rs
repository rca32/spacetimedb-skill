#[spacetimedb::table(name = item_stack)]
pub struct ItemStackRow {
    #[primary_key]
    pub item_instance_id: u64,
    pub quantity: i32,
}
