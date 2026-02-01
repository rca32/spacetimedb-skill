#[spacetimedb::table(name = npc_conversation_session, public)]
pub struct NpcConversationSession {
    #[primary_key]
    pub session_id: u64,
    pub npc_id: u64,
    pub player_entity_id: u64,
    pub started_at: u64,
    pub last_ts: u64,
    pub is_private: bool,
}
