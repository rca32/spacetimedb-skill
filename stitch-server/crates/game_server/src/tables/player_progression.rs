use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = character_stats, private)]
pub struct CharacterStats {
    #[primary_key]
    pub entity_id: u64,
    pub level: u32,
    pub max_hp: u32,
    pub max_stamina: u32,
    pub max_satiation: u32,
}

#[spacetimedb::table(name = resource_state, public)]
pub struct ResourceState {
    #[primary_key]
    pub entity_id: u64,
    pub hp: u32,
    pub stamina: u32,
    pub satiation: u32,
    pub last_damage_at: Timestamp,
    pub last_stamina_use_at: Timestamp,
    pub last_regen_at: Timestamp,
}

#[spacetimedb::table(name = action_state, public)]
pub struct ActionState {
    #[primary_key]
    pub entity_id: u64,
    pub action_type: String,
    pub progress_permille: u16,
    pub cooldown_until: Timestamp,
}

#[spacetimedb::table(name = buff_state, public)]
pub struct BuffState {
    #[primary_key]
    pub buff_key: String,
    pub entity_id: u64,
    pub buff_id: u64,
    pub stack: u16,
    pub expires_at: Timestamp,
}

#[spacetimedb::table(name = status_effect, public)]
pub struct StatusEffect {
    #[primary_key]
    pub status_key: String,
    pub entity_id: u64,
    pub effect_id: u64,
    pub stack: u16,
    pub expires_at: Timestamp,
}

#[spacetimedb::table(name = knowledge_state, private)]
pub struct KnowledgeState {
    #[primary_key]
    pub knowledge_key: String,
    pub entity_id: u64,
    pub knowledge_id: u64,
    pub status: u8,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = skill_progress, private)]
pub struct SkillProgress {
    #[primary_key]
    pub skill_key: String,
    pub entity_id: u64,
    pub skill_id: u64,
    pub xp: u64,
    pub level: u32,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = quest_state, private)]
pub struct QuestState {
    #[primary_key]
    pub quest_key: String,
    pub entity_id: u64,
    pub chain_id: u64,
    pub stage_id: u64,
    pub status: u8,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = quest_stage_def, public)]
pub struct QuestStageDef {
    #[primary_key]
    pub stage_id: u64,
    pub chain_id: u64,
    pub objective_type: u8,
    pub objective_target: u64,
    pub objective_count: u32,
}

#[spacetimedb::table(name = achievement_def, public)]
pub struct AchievementDef {
    #[primary_key]
    pub achievement_id: u64,
    pub name: String,
    pub criteria_type: u8,
    pub criteria_target: u64,
    pub criteria_count: u32,
}

#[spacetimedb::table(name = achievement_state, private)]
pub struct AchievementState {
    #[primary_key]
    pub achievement_key: String,
    pub entity_id: u64,
    pub achievement_id: u64,
    pub progress: u32,
    pub completed_at: Timestamp,
}

#[spacetimedb::table(name = llm_params, private)]
pub struct LlmParams {
    #[primary_key]
    pub param_key: String,
    pub int_value: i64,
    pub float_value: f64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_relation, private)]
pub struct NpcRelation {
    #[primary_key]
    pub relation_key: String,
    pub npc_id: u64,
    pub player_identity: Identity,
    pub affinity: i32,
    pub trust: i32,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_memory_short, private)]
pub struct NpcMemoryShort {
    #[primary_key]
    pub npc_id: u64,
    pub summary: String,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_memory_long, private)]
pub struct NpcMemoryLong {
    #[primary_key]
    pub npc_id: u64,
    pub summary: String,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_conversation_session, private)]
pub struct NpcConversationSession {
    #[primary_key]
    pub session_id: String,
    pub npc_id: u64,
    pub player_identity: Identity,
    pub status: u8,
    pub last_at: Timestamp,
}

#[spacetimedb::table(name = npc_conversation_turn, private)]
pub struct NpcConversationTurn {
    #[primary_key]
    pub turn_key: String,
    pub session_id: String,
    pub turn_index: u32,
    pub input_summary: String,
    pub output_summary: String,
}

#[spacetimedb::table(name = npc_action_schedule, private)]
pub struct NpcActionSchedule {
    #[primary_key]
    pub npc_id: u64,
    pub next_action_at: u64,
    pub action_type: u8,
    pub target_region_id: Option<u64>,
}

#[spacetimedb::table(name = npc_action_request, private)]
pub struct NpcActionRequest {
    #[primary_key]
    pub request_id: String,
    pub npc_id: u64,
    pub action_kind: u8,
    pub status: u8,
    pub payload: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = npc_action_result, private)]
pub struct NpcActionResult {
    #[primary_key]
    pub result_id: String,
    pub request_id: String,
    pub status: u8,
    pub summary: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = npc_response_cache, private)]
pub struct NpcResponseCache {
    #[primary_key]
    pub cache_key: String,
    pub npc_id: u64,
    pub prompt_hash: String,
    pub response_summary: String,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_policy_violation, private)]
pub struct NpcPolicyViolation {
    #[primary_key]
    #[auto_inc]
    pub violation_id: u64,
    pub npc_id: u64,
    pub player_identity: Identity,
    pub reason: String,
    pub severity: u8,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = npc_cost_metrics, private)]
pub struct NpcCostMetrics {
    #[primary_key]
    #[auto_inc]
    pub metric_id: u64,
    pub npc_id: u64,
    pub token_in: u32,
    pub token_out: u32,
    pub cost_microunits: u64,
    pub created_at: Timestamp,
}
