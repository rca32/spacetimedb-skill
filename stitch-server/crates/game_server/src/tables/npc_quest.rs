use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = npc_state, public)]
pub struct NpcState {
    #[primary_key]
    pub npc_id: u64,
    pub npc_type: u8,
    pub region_id: u64,
    pub dimension_id: u32,
    pub hex_x: i32,
    pub hex_z: i32,
    pub dest_hex_x: i32,
    pub dest_hex_z: i32,
    pub role: u8,
    pub mood: u8,
    pub traveling: bool,
    pub schedule_kind: u8,
    pub next_action_ts: u64,
    pub anchor_entity_id: u64,
    pub previous_anchors: Vec<u64>,
}

#[spacetimedb::table(name = npc_population_def, public)]
pub struct NpcPopulationDef {
    #[primary_key]
    pub npc_type: u8,
    pub population_permille: u16,
    pub min_action_seconds: u16,
    pub max_action_seconds: u16,
    pub default_schedule_kind: u8,
    pub default_role: u8,
    pub traveling_enabled: bool,
    pub enabled: bool,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_anchor_state, public)]
pub struct NpcAnchorState {
    #[primary_key]
    pub anchor_id: u64,
    pub region_id: u64,
    pub hex_x: i32,
    pub hex_z: i32,
    pub anchor_kind: u8, // 0=generic,1=ruin,2=camp
    pub is_active: bool,
    pub occupied_by_npc_id: Option<u64>,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_interaction_log, public)]
pub struct NpcInteractionLog {
    #[primary_key]
    pub interaction_key: String,
    pub npc_id: u64,
    pub caller_identity: Identity,
    pub interaction_kind: u8, // 1=talk,2=trade,3=quest
    pub status: u8,           // 0=requested,1=accepted,2=rejected
    pub detail: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = quest_chain_state, public)]
pub struct QuestChainState {
    #[primary_key]
    pub chain_key: String,
    pub identity: Identity,
    pub chain_id: u64,
    pub status: u8, // 0=started,1=completed
    pub started_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = quest_stage_state, public)]
pub struct QuestStageState {
    #[primary_key]
    pub stage_key: String,
    pub chain_key: String,
    pub stage_index: u32,
    pub status: u8, // 0=in_progress,1=completed
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = agent_request, private)]
pub struct AgentRequest {
    #[primary_key]
    pub request_id: String,
    pub agent_kind: u8,
    pub requested_by: Identity,
    pub region_id: u64,
    pub status: u8, // 0=requested,1=running,2=done,3=failed
    pub payload: String,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = agent_result, public)]
pub struct AgentResult {
    #[primary_key]
    pub result_id: String,
    pub request_id: String,
    pub status: u8, // 1=success,2=failed
    pub summary: String,
    pub created_at: Timestamp,
}
