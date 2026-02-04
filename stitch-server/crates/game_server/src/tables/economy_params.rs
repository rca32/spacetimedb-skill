#[spacetimedb::table(name = economy_params, public)]
pub struct EconomyParams {
    #[primary_key]
    pub param_key: String,
    pub param_value: f32,
    pub description: String,
}
