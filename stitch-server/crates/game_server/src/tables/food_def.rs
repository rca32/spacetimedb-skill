#[spacetimedb::table(name = food_def, public)]
pub struct FoodDef {
    #[primary_key]
    pub food_id: u32,
    pub item_def_id: u64,
    pub hp_restore: i32,
    pub stamina_restore: i32,
    pub satiation_restore: i32,
    pub buff_ids: Vec<u32>,
}
