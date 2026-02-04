#[spacetimedb::table(name = npc_desc, public)]
pub struct NpcDesc {
    #[primary_key]
    pub npc_id: u64,
    pub name: String,
    pub title: String,
    pub faction: u8,
    pub race: u8,
    pub level: u8,
    pub health: u32,
    pub location_x: i32,
    pub location_y: i32,
    pub biome_id: u64,
    pub shop_item_list_id: u64,
    pub dialogue_tree_id: u64,
}
