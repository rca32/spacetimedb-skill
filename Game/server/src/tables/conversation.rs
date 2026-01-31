use spacetimedb::{Identity, Timestamp};

/// Conversation status
pub const CONV_STATUS_ACTIVE: u8 = 1;
pub const CONV_STATUS_ENDED: u8 = 2;

/// Message sender type
pub const MSG_SENDER_PLAYER: u8 = 1;
pub const MSG_SENDER_NPC: u8 = 2;
pub const MSG_SENDER_SYSTEM: u8 = 3;

/// Active conversation session between player and NPC
#[spacetimedb::table(name = npc_conversation_session, public)]
pub struct NpcConversationSession {
    #[primary_key]
    pub session_id: u64,
    #[index(btree)]
    pub npc_id: u64,
    #[index(btree)]
    pub player_identity: Identity,
    pub status: u8,
    pub started_at: Timestamp,
    pub last_activity: Timestamp,
    pub context_summary: String, // Brief context for LLM
}

/// Individual conversation turn/message
#[spacetimedb::table(name = npc_conversation_turn, public)]
pub struct NpcConversationTurn {
    #[primary_key]
    pub turn_id: u64,
    #[index(btree)]
    pub session_id: u64,
    pub sender_type: u8, // player, npc, system
    pub message: String,
    pub sent_at: Timestamp,
    pub llm_prompt: Option<String>, // The prompt sent to LLM (for NPC responses)
    pub llm_response_raw: Option<String>, // Raw LLM response before parsing
}
