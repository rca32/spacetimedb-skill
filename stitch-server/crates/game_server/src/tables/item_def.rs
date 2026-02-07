#[spacetimedb::table(name = item_def, public)]
pub struct ItemDef {
    #[primary_key]
    pub item_def_id: u64,
    pub category: u8,
    pub rarity: u8,
    pub max_stack: u32,
    pub volume: i32,
}
