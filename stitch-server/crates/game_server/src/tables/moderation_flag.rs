use spacetimedb::Identity;

#[spacetimedb::table(name = moderation_flag)]
pub struct ModerationFlag {
    #[primary_key]
    pub identity: Identity,
    pub score: i32,
    pub last_reason: String,
}
