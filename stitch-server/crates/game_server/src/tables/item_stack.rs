#[spacetimedb::table(name = item_stack, private)]
pub struct ItemStack {
    #[primary_key]
    pub item_instance_id: u64,
    pub quantity: u32,
}
