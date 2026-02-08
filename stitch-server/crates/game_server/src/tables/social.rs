use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = chat_channel, public)]
pub struct ChatChannel {
    #[primary_key]
    pub channel_id: String,
    pub channel_type: u8,
    pub scope_id: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = chat_message, public)]
pub struct ChatMessage {
    #[primary_key]
    pub message_id: String,
    pub channel_id: String,
    pub sender_identity: Identity,
    pub body: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = friend_edge, private)]
pub struct FriendEdge {
    #[primary_key]
    pub edge_key: String,
    pub owner_identity: Identity,
    pub friend_identity: Identity,
    pub status: u8,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = party_state, public)]
pub struct PartyState {
    #[primary_key]
    pub party_id: String,
    pub leader_identity: Identity,
    pub region_id: u64,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = party_member, public)]
pub struct PartyMember {
    #[primary_key]
    pub member_key: String,
    pub party_id: String,
    pub member_identity: Identity,
    pub role: u8,
    pub joined_at: Timestamp,
}

#[spacetimedb::table(name = guild_state, public)]
pub struct GuildState {
    #[primary_key]
    pub guild_id: String,
    pub name: String,
    pub founder_identity: Identity,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = guild_member, public)]
pub struct GuildMember {
    #[primary_key]
    pub member_key: String,
    pub guild_id: String,
    pub member_identity: Identity,
    pub role: u8,
    pub joined_at: Timestamp,
}

#[spacetimedb::table(name = guild_project, public)]
pub struct GuildProject {
    #[primary_key]
    pub project_id: String,
    pub guild_id: String,
    pub title: String,
    pub progress_permille: u16,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = social_feed, public)]
pub struct SocialFeed {
    #[primary_key]
    #[auto_inc]
    pub feed_id: u64,
    pub identity_hex: String,
    pub feed_type: String,
    pub payload: String,
    pub created_at: Timestamp,
}
