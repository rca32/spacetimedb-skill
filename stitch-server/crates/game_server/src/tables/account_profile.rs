use spacetimedb::Identity;

#[spacetimedb::table(name = account_profile, public)]
pub struct AccountProfile {
    #[primary_key]
    pub identity: Identity,
    pub display_name: String,
    pub avatar_id: u64,
    pub locale: String,
}
