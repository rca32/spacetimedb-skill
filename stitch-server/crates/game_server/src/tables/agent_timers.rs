use crate::agents::{
    environment_effect_agent_loop, npc_ai_agent_loop, player_regen_agent_loop,
    resource_regen_agent_loop, session_cleanup_agent_loop,
};
use spacetimedb::{ScheduleAt, Timestamp};

#[spacetimedb::table(name = player_regen_loop_timer, scheduled(player_regen_agent_loop))]
pub struct PlayerRegenLoopTimer {
    #[primary_key]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run_at: Timestamp,
}

#[spacetimedb::table(name = resource_regen_loop_timer, scheduled(resource_regen_agent_loop))]
pub struct ResourceRegenLoopTimer {
    #[primary_key]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run_at: Timestamp,
}

#[spacetimedb::table(name = session_cleanup_loop_timer, scheduled(session_cleanup_agent_loop))]
pub struct SessionCleanupLoopTimer {
    #[primary_key]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run_at: Timestamp,
}

#[spacetimedb::table(name = environment_effect_loop_timer, scheduled(environment_effect_agent_loop))]
pub struct EnvironmentEffectLoopTimer {
    #[primary_key]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run_at: Timestamp,
}

#[spacetimedb::table(name = npc_ai_loop_timer, scheduled(npc_ai_agent_loop))]
pub struct NpcAiLoopTimer {
    #[primary_key]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run_at: Timestamp,
}
