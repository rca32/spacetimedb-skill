use spacetimedb::Identity;

#[spacetimedb::table(name = chat_message, public)]
pub struct ChatMessage {
    #[primary_key]
    pub message_id: u64,
    pub channel_id: u64,
    pub sender_id: Identity,
    pub text: String,
    pub ts: u64,
}
