use spacetimedb::SpacetimeType;

#[spacetimedb::table(name = item_list_def, public)]
pub struct ItemListDef {
    #[primary_key]
    pub item_list_id: u64,
    pub entries: Vec<ItemListEntry>,
}

#[derive(Clone, Debug, SpacetimeType)]
pub struct ItemListEntry {
    pub probability: f32,
    pub stacks: Vec<InputItemStack>,
}

#[derive(Clone, Debug, SpacetimeType)]
pub struct InputItemStack {
    pub item_def_id: u64,
    pub quantity: i32,
}
