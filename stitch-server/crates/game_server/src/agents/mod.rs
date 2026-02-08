//! Scheduled reducers and background agents live here.

use std::time::Duration;

use spacetimedb::{Identity, ReducerContext, ScheduleAt, Table};

use crate::tables::agent_timers::{
    environment_effect_loop_timer, player_regen_loop_timer, resource_regen_loop_timer,
    session_cleanup_loop_timer,
};
use crate::tables::combat::combat_state;
use crate::tables::environment_effect::{
    environment_effect_desc, environment_effect_exposure, environment_effect_state,
};
use crate::tables::live_ops::balance_params;
use crate::tables::player_progression::{character_stats, resource_state, status_effect};
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::world_state::{resource_node, terrain_chunk};
use crate::tables::{
    CharacterStats, EnvironmentEffectDesc, EnvironmentEffectExposure, EnvironmentEffectLoopTimer,
    EnvironmentEffectState, PlayerRegenLoopTimer, ResourceNode, ResourceRegenLoopTimer,
    ResourceState, SessionCleanupLoopTimer, StatusEffect, TerrainChunk,
};
use crate::utils::identity_to_entity_id;

const PLAYER_REGEN_INTERVAL_SECS: u64 = 5;
const RESOURCE_REGEN_INTERVAL_SECS: u64 = 10;
const SESSION_CLEANUP_INTERVAL_SECS: u64 = 60;
const ENVIRONMENT_EFFECT_INTERVAL_SECS: u64 = 5;
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

    if ctx
        .db
        .environment_effect_loop_timer()
        .scheduled_id()
        .find(1)
        .is_none()
    {
        ctx.db
            .environment_effect_loop_timer()
            .insert(EnvironmentEffectLoopTimer {
                scheduled_id: 1,
                scheduled_at: ScheduleAt::Interval(
                    Duration::from_secs(ENVIRONMENT_EFFECT_INTERVAL_SECS).into(),
                ),
                last_run_at: ctx.timestamp,
            });
    }

    if ctx
        .db
        .environment_effect_desc()
        .effect_id()
        .find(1)
        .is_none()
    {
        ctx.db
            .environment_effect_desc()
            .insert(EnvironmentEffectDesc {
                effect_id: 1,
                name: "cold-zone".to_string(),
                hazard_biome_id: 1,
                status_effect_id: 1001,
                damage_per_tick: 2,
                exposure_per_tick: 5,
                max_exposure: 100,
                exposure_decay_per_tick: 3,
                resistance_level_required: 10,
                damage_interval_seconds: 5,
                enabled: true,
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

#[spacetimedb::reducer]
pub fn environment_effect_agent_loop(ctx: &ReducerContext, arg: EnvironmentEffectLoopTimer) {
    let damage_min_interval_millis =
        read_balance_int(ctx, "environment.damage_min_interval_millis", 1_000) as u64;
    let exposure_gate_threshold =
        read_balance_int(ctx, "environment.exposure_gate_threshold", 0) as i32;
    let exposure_decay_multiplier =
        read_balance_float(ctx, "environment.exposure_decay_multiplier", 1.0);
    let status_expire_grace_seconds =
        read_balance_int(ctx, "environment.status_expire_seconds", 15) as u64;

    let effects: Vec<EnvironmentEffectDesc> = ctx
        .db
        .environment_effect_desc()
        .iter()
        .filter(|e| e.enabled)
        .collect();

    let terrain: Vec<TerrainChunk> = ctx.db.terrain_chunk().iter().collect();

    for session in ctx.db.session_state().iter() {
        let entity_id = identity_to_entity_id(session.identity);
        let transform = match ctx.db.transform_state().entity_id().find(session.identity) {
            Some(t) => t,
            None => continue,
        };
        if transform.position.len() < 3 {
            continue;
        }

        let chunk_x = (transform.position[0] / 32.0).floor() as i32;
        let chunk_y = (transform.position[2] / 32.0).floor() as i32;
        let biome_id = terrain
            .iter()
            .find(|c| {
                c.region_id == transform.region_id && c.chunk_x == chunk_x && c.chunk_y == chunk_y
            })
            .map(|c| c.biome_id)
            .unwrap_or(0);

        upsert_environment_state(ctx, entity_id, biome_id);

        for effect in &effects {
            let exposure_key = format!("{entity_id}:{}", effect.effect_id);
            let active = effect.hazard_biome_id == biome_id;
            let mut exposure = ctx
                .db
                .environment_effect_exposure()
                .exposure_key()
                .find(exposure_key.clone())
                .unwrap_or(EnvironmentEffectExposure {
                    exposure_key: exposure_key.clone(),
                    entity_id,
                    effect_id: effect.effect_id,
                    exposure: 0,
                    last_tick_at: ctx.timestamp,
                });

            if active {
                exposure.exposure =
                    (exposure.exposure + effect.exposure_per_tick).min(effect.max_exposure);
                let can_damage = ctx
                    .timestamp
                    .duration_since(exposure.last_tick_at)
                    .map(|d| d.as_millis() as u64 >= damage_min_interval_millis)
                    .unwrap_or(false);
                if can_damage && exposure.exposure >= exposure_gate_threshold {
                    apply_environment_damage(ctx, entity_id, effect.damage_per_tick);
                    upsert_status_effect(ctx, entity_id, effect.status_effect_id);
                }
            } else {
                let decay = ((effect.exposure_decay_per_tick as f64) * exposure_decay_multiplier)
                    .round() as i32;
                exposure.exposure = exposure.exposure.saturating_sub(decay.max(1));
            }

            exposure.last_tick_at = ctx.timestamp;
            if ctx
                .db
                .environment_effect_exposure()
                .exposure_key()
                .find(exposure_key.clone())
                .is_some()
            {
                ctx.db
                    .environment_effect_exposure()
                    .exposure_key()
                    .update(exposure);
            } else {
                ctx.db.environment_effect_exposure().insert(exposure);
            }
        }

        expire_status_effects(ctx, entity_id, status_expire_grace_seconds);
    }

    if let Some(mut timer) = ctx
        .db
        .environment_effect_loop_timer()
        .scheduled_id()
        .find(arg.scheduled_id)
    {
        timer.last_run_at = ctx.timestamp;
        ctx.db
            .environment_effect_loop_timer()
            .scheduled_id()
            .update(timer);
    }
}

fn upsert_environment_state(ctx: &ReducerContext, entity_id: u64, biome_id: u16) {
    let next = EnvironmentEffectState {
        entity_id,
        last_biome_id: biome_id,
        last_evaluated_at: ctx.timestamp,
        is_submerged: false,
    };
    if ctx
        .db
        .environment_effect_state()
        .entity_id()
        .find(entity_id)
        .is_some()
    {
        ctx.db.environment_effect_state().entity_id().update(next);
    } else {
        ctx.db.environment_effect_state().insert(next);
    }
}

fn apply_environment_damage(ctx: &ReducerContext, entity_id: u64, damage: u32) {
    if let Some(mut resource) = ctx.db.resource_state().entity_id().find(entity_id) {
        resource.hp = resource.hp.saturating_sub(damage);
        resource.last_damage_at = ctx.timestamp;
        ctx.db.resource_state().entity_id().update(resource);
    }
}

fn upsert_status_effect(ctx: &ReducerContext, entity_id: u64, effect_id: u64) {
    let status_key = format!("{entity_id}:{effect_id}");
    if let Some(mut status) = ctx.db.status_effect().status_key().find(status_key) {
        status.stack = status.stack.saturating_add(1);
        status.expires_at = ctx.timestamp;
        ctx.db.status_effect().status_key().update(status);
    } else {
        ctx.db.status_effect().insert(StatusEffect {
            status_key: format!("{entity_id}:{effect_id}"),
            entity_id,
            effect_id,
            stack: 1,
            expires_at: ctx.timestamp,
        });
    }
}

fn expire_status_effects(ctx: &ReducerContext, entity_id: u64, expire_grace_seconds: u64) {
    let stale_keys: Vec<String> = ctx
        .db
        .status_effect()
        .iter()
        .filter(|s| s.entity_id == entity_id)
        .filter_map(|s| {
            let elapsed = ctx.timestamp.duration_since(s.expires_at)?;
            if elapsed >= Duration::from_secs(expire_grace_seconds) {
                Some(s.status_key)
            } else {
                None
            }
        })
        .collect();

    for key in stale_keys {
        ctx.db.status_effect().status_key().delete(key);
    }
}

fn read_balance_int(ctx: &ReducerContext, key: &str, default: i64) -> i64 {
    ctx.db
        .balance_params()
        .param_key()
        .find(key.to_string())
        .map(|v| v.int_value)
        .unwrap_or(default)
}

fn read_balance_float(ctx: &ReducerContext, key: &str, default: f64) -> f64 {
    ctx.db
        .balance_params()
        .param_key()
        .find(key.to_string())
        .map(|v| v.float_value)
        .unwrap_or(default)
}
