use spacetimedb::Identity;

#[spacetimedb::table(name = player_state, public)]
pub struct PlayerState {
    #[primary_key]
    pub entity_id: u64,
    #[index(btree)]
    pub identity: Identity,
    pub region_id: u64,
    pub level: u32,
    pub last_login: u64,
    pub is_bot: bool,
}
