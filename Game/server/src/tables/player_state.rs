use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = player_state, public)]
pub struct PlayerState {
    #[primary_key]
    pub entity_id: u64,
    #[index(btree)]
    pub identity: Identity,
    pub region_id: u64,
    pub level: u32,
    pub hex_q: i32,
    pub hex_r: i32,
    pub last_login: Timestamp,
    pub is_online: bool,
}
