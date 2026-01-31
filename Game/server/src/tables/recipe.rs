/// Recipe ingredient input for reducers
#[derive(spacetimedb::SpacetimeType)]
pub struct RecipeIngredientInput {
    pub item_def_id: u64,
    pub quantity: u32,
}

/// Recipe ingredient definition
#[spacetimedb::table(name = recipe_ingredient, public)]
pub struct RecipeIngredient {
    #[primary_key]
    pub ingredient_id: u64,
    #[index(btree)]
    pub recipe_id: u64,
    #[index(btree)]
    pub item_def_id: u64,
    pub quantity: u32,
}

/// Recipe output definition
#[spacetimedb::table(name = recipe, public)]
pub struct Recipe {
    #[primary_key]
    pub recipe_id: u64,
    pub name: String,
    pub output_item_def_id: u64,
    pub output_quantity: u32,
}
