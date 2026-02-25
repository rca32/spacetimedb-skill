use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = player_state, public)]
pub struct PlayerState {
    #[primary_key]
    pub player_id: Identity,
    pub display_name: String,
    pub created_at: Timestamp,
}
