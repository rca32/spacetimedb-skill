#[spacetimedb::table(name = item_def, public)]
pub struct ItemDef {
    #[primary_key]
    pub item_def_id: u64,
    pub item_type: u8,
    pub category: u8,
    pub rarity: u8,
    pub max_stack: u32,
    pub volume: i32,
    pub item_list_id: u64,
    pub auto_collect: bool,
    pub convert_on_zero_durability: u64,
}
