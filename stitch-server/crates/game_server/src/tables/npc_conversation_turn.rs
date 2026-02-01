#[spacetimedb::table(name = npc_conversation_turn, public)]
pub struct NpcConversationTurn {
    #[primary_key]
    pub turn_id: u64,
    pub session_id: u64,
    pub npc_id: u64,
    pub speaker_entity_id: u64,
    pub summary: String,
    pub created_at: u64,
}
