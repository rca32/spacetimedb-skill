use spacetimedb::Identity;

#[spacetimedb::table(name = account)]
pub struct Account {
    #[primary_key]
    pub identity: Identity,
    pub created_at: u64,
    pub status: u8,
}
