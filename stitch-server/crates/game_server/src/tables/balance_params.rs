#[spacetimedb::table(name = balance_params)]
pub struct BalanceParams {
    #[primary_key]
    pub key: String,
    pub value: String,
    pub updated_at: u64,
}
