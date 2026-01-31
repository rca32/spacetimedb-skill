use spacetimedb::{Identity, Timestamp};

/// NPC types
pub const NPC_TYPE_MERCHANT: u8 = 1;
pub const NPC_TYPE_VILLAGER: u8 = 2;
pub const NPC_TYPE_QUEST_GIVER: u8 = 3;

/// NPC status
pub const NPC_STATUS_ACTIVE: u8 = 1;
#[allow(dead_code)]
pub const NPC_STATUS_INACTIVE: u8 = 2;

#[spacetimedb::table(name = npc_state, public)]
pub struct NpcState {
    #[primary_key]
    pub npc_id: u64,
    pub name: String,
    pub npc_type: u8,
    pub hex_q: i32,
    pub hex_r: i32,
    pub region_id: u64,
    pub status: u8,
    pub created_at: Timestamp,
}

/// Short-term memory for NPC conversations and interactions
#[spacetimedb::table(name = npc_memory_short, public)]
pub struct NpcMemoryShort {
    #[primary_key]
    pub memory_id: u64,
    #[index(btree)]
    pub npc_id: u64,
    #[index(btree)]
    pub player_identity: Identity,
    pub last_interaction: Timestamp,
    pub interaction_count: u32,
    pub memory_data: String, // JSON or simple text for context
}
