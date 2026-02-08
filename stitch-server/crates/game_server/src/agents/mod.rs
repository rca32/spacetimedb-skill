//! Scheduled reducers and background agents live here.

use std::time::Duration;

use spacetimedb::{Identity, ReducerContext, ScheduleAt, Table};

use crate::tables::agent_timers::{
    player_regen_loop_timer, resource_regen_loop_timer, session_cleanup_loop_timer,
};
use crate::tables::combat::combat_state;
use crate::tables::player_progression::{character_stats, resource_state};
use crate::tables::session_state::session_state;
use crate::tables::world_state::resource_node;
use crate::tables::{
    CharacterStats, PlayerRegenLoopTimer, ResourceNode, ResourceRegenLoopTimer, ResourceState,
    SessionCleanupLoopTimer,
};
use crate::utils::identity_to_entity_id;

const PLAYER_REGEN_INTERVAL_SECS: u64 = 5;
const RESOURCE_REGEN_INTERVAL_SECS: u64 = 10;
const SESSION_CLEANUP_INTERVAL_SECS: u64 = 60;
const SESSION_IDLE_TIMEOUT_SECS: u64 = 30 * 60;

pub(crate) fn ensure_default_agent_timers(ctx: &ReducerContext) {
    if ctx
        .db
        .player_regen_loop_timer()
        .scheduled_id()
        .find(1)
        .is_none()
    {
        ctx.db
            .player_regen_loop_timer()
            .insert(PlayerRegenLoopTimer {
                scheduled_id: 1,
                scheduled_at: ScheduleAt::Interval(
                    Duration::from_secs(PLAYER_REGEN_INTERVAL_SECS).into(),
                ),
                last_run_at: ctx.timestamp,
            });
    }

    if ctx
        .db
        .resource_regen_loop_timer()
        .scheduled_id()
        .find(1)
        .is_none()
    {
        ctx.db
            .resource_regen_loop_timer()
            .insert(ResourceRegenLoopTimer {
                scheduled_id: 1,
                scheduled_at: ScheduleAt::Interval(
                    Duration::from_secs(RESOURCE_REGEN_INTERVAL_SECS).into(),
                ),
                last_run_at: ctx.timestamp,
            });
    }

    if ctx
        .db
        .session_cleanup_loop_timer()
        .scheduled_id()
        .find(1)
        .is_none()
    {
        ctx.db
            .session_cleanup_loop_timer()
            .insert(SessionCleanupLoopTimer {
                scheduled_id: 1,
                scheduled_at: ScheduleAt::Interval(
                    Duration::from_secs(SESSION_CLEANUP_INTERVAL_SECS).into(),
                ),
                last_run_at: ctx.timestamp,
            });
    }
}

#[spacetimedb::reducer]
pub fn start_world_agents(ctx: &ReducerContext) -> Result<(), String> {
    if ctx.sender != Identity::ZERO {
        return Err("start_world_agents requires server identity".to_string());
    }
    ensure_default_agent_timers(ctx);
    Ok(())
}

#[spacetimedb::reducer]
pub fn player_regen_agent_loop(ctx: &ReducerContext, arg: PlayerRegenLoopTimer) {
    for session in ctx.db.session_state().iter() {
        let entity_id = identity_to_entity_id(session.identity);

        let stats = ctx.db.character_stats().entity_id().find(entity_id);
        let stats = match stats {
            Some(stats) => stats,
            None => {
                let defaults = CharacterStats {
                    entity_id,
                    level: 1,
                    max_hp: 100,
                    max_stamina: 100,
                    max_satiation: 100,
                };
                ctx.db.character_stats().insert(defaults);
                ctx.db
                    .character_stats()
                    .entity_id()
                    .find(entity_id)
                    .expect("just inserted")
            }
        };

        let in_combat = ctx
            .db
            .combat_state()
            .identity()
            .find(session.identity)
            .map(|row| row.in_combat)
            .unwrap_or(false);

        if let Some(mut resource) = ctx.db.resource_state().entity_id().find(entity_id) {
            let hp_regen = if in_combat { 0 } else { 2 };
            resource.hp = (resource.hp.saturating_add(hp_regen)).min(stats.max_hp);
            resource.stamina = (resource.stamina.saturating_add(3)).min(stats.max_stamina);
            resource.satiation = resource.satiation.saturating_sub(1);
            resource.last_regen_at = ctx.timestamp;
            ctx.db.resource_state().entity_id().update(resource);
        } else {
            ctx.db.resource_state().insert(ResourceState {
                entity_id,
                hp: stats.max_hp,
                stamina: stats.max_stamina,
                satiation: stats.max_satiation,
                last_damage_at: ctx.timestamp,
                last_stamina_use_at: ctx.timestamp,
                last_regen_at: ctx.timestamp,
            });
        }
    }

    if let Some(mut timer) = ctx
        .db
        .player_regen_loop_timer()
        .scheduled_id()
        .find(arg.scheduled_id)
    {
        timer.last_run_at = ctx.timestamp;
        ctx.db
            .player_regen_loop_timer()
            .scheduled_id()
            .update(timer);
    }
}

#[spacetimedb::reducer]
pub fn resource_regen_agent_loop(ctx: &ReducerContext, arg: ResourceRegenLoopTimer) {
    let updates: Vec<ResourceNode> = ctx
        .db
        .resource_node()
        .iter()
        .filter_map(|mut node| {
            if node.amount >= 100 {
                return None;
            }
            if ctx.timestamp.duration_since(node.respawn_at).is_none() {
                return None;
            }
            node.amount = node.amount.saturating_add(5).min(100);
            node.respawn_at = ctx.timestamp;
            Some(node)
        })
        .collect();

    for node in updates {
        ctx.db.resource_node().entity_id().update(node);
    }

    if let Some(mut timer) = ctx
        .db
        .resource_regen_loop_timer()
        .scheduled_id()
        .find(arg.scheduled_id)
    {
        timer.last_run_at = ctx.timestamp;
        ctx.db
            .resource_regen_loop_timer()
            .scheduled_id()
            .update(timer);
    }
}

#[spacetimedb::reducer]
pub fn session_cleanup_agent_loop(ctx: &ReducerContext, arg: SessionCleanupLoopTimer) {
    let mut stale_sessions = Vec::new();
    for session in ctx.db.session_state().iter() {
        if let Some(idle_for) = ctx.timestamp.duration_since(session.last_active_at) {
            if idle_for > Duration::from_secs(SESSION_IDLE_TIMEOUT_SECS) {
                stale_sessions.push(session.identity);
            }
        }
    }

    for identity in stale_sessions {
        ctx.db.session_state().identity().delete(identity);
    }

    if let Some(mut timer) = ctx
        .db
        .session_cleanup_loop_timer()
        .scheduled_id()
        .find(arg.scheduled_id)
    {
        timer.last_run_at = ctx.timestamp;
        ctx.db
            .session_cleanup_loop_timer()
            .scheduled_id()
            .update(timer);
    }
}
