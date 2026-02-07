use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = player_state, public)]
pub struct PlayerState {
    #[primary_key]
    pub player_id: Identity,
    pub display_name: String,
    pub created_at: Timestamp,
}
