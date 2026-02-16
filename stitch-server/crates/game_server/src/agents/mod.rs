//! Scheduled reducers and background agents live here.

use std::time::Duration;

use spacetimedb::{ReducerContext, ScheduleAt, Table};

use crate::tables::agent_timers::{
    environment_effect_loop_timer, npc_ai_loop_timer, player_regen_loop_timer,
    resource_regen_loop_timer, session_cleanup_loop_timer,
};
use crate::tables::combat::combat_state;
use crate::tables::environment_effect::{
    environment_effect_desc, environment_effect_exposure, environment_effect_state,
};
use crate::tables::live_ops::balance_params;
use crate::tables::npc_quest::npc_state;
use crate::tables::player_progression::{
    character_stats, npc_action_schedule, resource_state, status_effect,
};
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::world_state::{region_state, resource_node, terrain_chunk};
use crate::tables::{
    CharacterStats, EnvironmentEffectDesc, EnvironmentEffectExposure, EnvironmentEffectLoopTimer,
    EnvironmentEffectState, NpcActionSchedule, NpcAiLoopTimer, NpcState, PlayerRegenLoopTimer,
    RegionState, ResourceNode, ResourceRegenLoopTimer, ResourceState, SessionCleanupLoopTimer,
    StatusEffect, TerrainChunk,
};
use crate::utils::identity_to_entity_id;

const PLAYER_REGEN_INTERVAL_SECS: u64 = 5;
const RESOURCE_REGEN_INTERVAL_SECS: u64 = 10;
const SESSION_CLEANUP_INTERVAL_SECS: u64 = 60;
const ENVIRONMENT_EFFECT_INTERVAL_SECS: u64 = 5;
const SESSION_IDLE_TIMEOUT_SECS: u64 = 30 * 60;
const NPC_AI_INTERVAL_SECS: u64 = 2;
const NPC_AI_STEP_HEX: i32 = 2;
const STARTER_REGION_ID: u64 = 1;

#[derive(Clone, Copy)]
struct SeedNpc {
    npc_id: u64,
    hex_x: i32,
    hex_z: i32,
    role: u8,
    mood: u8,
    schedule_kind: u8,
}

const SEEDED_NPCS: [SeedNpc; 22] = [
    SeedNpc {
        npc_id: 9_001,
        hex_x: 1,
        hex_z: 1,
        role: 2,
        mood: 1,
        schedule_kind: 3,
    },
    SeedNpc {
        npc_id: 9_002,
        hex_x: -1,
        hex_z: 1,
        role: 2,
        mood: 2,
        schedule_kind: 3,
    },
    SeedNpc {
        npc_id: 10_001,
        hex_x: 2,
        hex_z: -1,
        role: 1,
        mood: 0,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_002,
        hex_x: -2,
        hex_z: -1,
        role: 1,
        mood: 2,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_003,
        hex_x: 3,
        hex_z: 0,
        role: 3,
        mood: 4,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_004,
        hex_x: -3,
        hex_z: 0,
        role: 4,
        mood: 6,
        schedule_kind: 2,
    },
    SeedNpc {
        npc_id: 10_005,
        hex_x: 0,
        hex_z: -2,
        role: 5,
        mood: 8,
        schedule_kind: 0,
    },
    SeedNpc {
        npc_id: 10_006,
        hex_x: 1,
        hex_z: -3,
        role: 6,
        mood: 10,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_007,
        hex_x: -1,
        hex_z: -3,
        role: 4,
        mood: 12,
        schedule_kind: 2,
    },
    SeedNpc {
        npc_id: 10_008,
        hex_x: 0,
        hex_z: 2,
        role: 1,
        mood: 14,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_009,
        hex_x: 2,
        hex_z: 2,
        role: 7,
        mood: 16,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_010,
        hex_x: -2,
        hex_z: 2,
        role: 3,
        mood: 18,
        schedule_kind: 3,
    },
    SeedNpc {
        npc_id: 10_011,
        hex_x: 3,
        hex_z: -3,
        role: 6,
        mood: 20,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_012,
        hex_x: -3,
        hex_z: -3,
        role: 5,
        mood: 22,
        schedule_kind: 0,
    },
    SeedNpc {
        npc_id: 10_013,
        hex_x: 4,
        hex_z: 1,
        role: 8,
        mood: 24,
        schedule_kind: 2,
    },
    SeedNpc {
        npc_id: 10_014,
        hex_x: -4,
        hex_z: 1,
        role: 4,
        mood: 26,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_015,
        hex_x: 5,
        hex_z: -1,
        role: 1,
        mood: 28,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_016,
        hex_x: -5,
        hex_z: -1,
        role: 3,
        mood: 30,
        schedule_kind: 3,
    },
    SeedNpc {
        npc_id: 10_017,
        hex_x: 4,
        hex_z: -4,
        role: 2,
        mood: 32,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_018,
        hex_x: -4,
        hex_z: -4,
        role: 2,
        mood: 34,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_019,
        hex_x: 6,
        hex_z: 2,
        role: 7,
        mood: 36,
        schedule_kind: 1,
    },
    SeedNpc {
        npc_id: 10_020,
        hex_x: -6,
        hex_z: 2,
        role: 8,
        mood: 38,
        schedule_kind: 2,
    },
];

fn to_micros_u64(ctx: &ReducerContext) -> u64 {
    u64::try_from(ctx.timestamp.to_micros_since_unix_epoch()).unwrap_or_default()
}

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

    let npc_ai_schedule = ScheduleAt::Interval(Duration::from_secs(NPC_AI_INTERVAL_SECS).into());
    if let Some(mut timer) = ctx.db.npc_ai_loop_timer().scheduled_id().find(1) {
        timer.scheduled_at = npc_ai_schedule;
        timer.last_run_at = ctx.timestamp;
        ctx.db.npc_ai_loop_timer().scheduled_id().update(timer);
    } else {
        ctx.db.npc_ai_loop_timer().insert(NpcAiLoopTimer {
            scheduled_id: 1,
            scheduled_at: npc_ai_schedule,
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
    ensure_default_agent_timers(ctx);
    seed_world_if_empty(ctx);
    Ok(())
}

fn seed_world_if_empty(ctx: &ReducerContext) {
    if ctx
        .db
        .region_state()
        .region_id()
        .find(STARTER_REGION_ID)
        .is_none()
    {
        ctx.db.region_state().insert(RegionState {
            region_id: STARTER_REGION_ID,
            name: "starter-region".to_string(),
            status: 1,
            shard_load_permille: 100,
        });
    }

    if ctx.db.terrain_chunk().iter().next().is_none() {
        for chunk_x in -3_i32..=3_i32 {
            for chunk_y in -3_i32..=3_i32 {
                let biome = ((chunk_x.abs() + chunk_y.abs()) % 5) as u16;
                ctx.db.terrain_chunk().insert(TerrainChunk {
                    chunk_key: format!("r1:{chunk_x}:{chunk_y}"),
                    region_id: STARTER_REGION_ID,
                    chunk_x,
                    chunk_y,
                    biome_id: biome,
                    seed: 1_337,
                });
            }
        }
    }

    if ctx.db.resource_node().iter().next().is_none() {
        for node_id in 1_u64..=24_u64 {
            ctx.db.resource_node().insert(ResourceNode {
                entity_id: node_id,
                resource_type: (node_id % 3) as u8,
                amount: 100,
                respawn_at: ctx.timestamp,
            });
        }
    }

    let now_us = to_micros_u64(ctx);
    ensure_seeded_npcs(ctx, now_us);
    ensure_npc_schedules(ctx, now_us);
}

fn ensure_seeded_npcs(ctx: &ReducerContext, now_us: u64) {
    for seed in SEEDED_NPCS {
        let schedule_kind = normalize_schedule_kind(seed.schedule_kind);
        let next_action_ts = now_us + npc_next_delay(schedule_kind);
        if let Some(mut npc) = ctx.db.npc_state().npc_id().find(seed.npc_id) {
            npc.region_id = STARTER_REGION_ID;
            npc.hex_x = seed.hex_x;
            npc.hex_z = seed.hex_z;
            npc.dest_hex_x = seed.hex_x;
            npc.dest_hex_z = seed.hex_z;
            npc.role = seed.role;
            npc.mood = seed.mood;
            npc.schedule_kind = schedule_kind;
            npc.next_action_ts = next_action_ts;
            ctx.db.npc_state().npc_id().update(npc);
        } else {
            ctx.db.npc_state().insert(NpcState {
                npc_id: seed.npc_id,
                region_id: STARTER_REGION_ID,
                hex_x: seed.hex_x,
                hex_z: seed.hex_z,
                dest_hex_x: seed.hex_x,
                dest_hex_z: seed.hex_z,
                role: seed.role,
                mood: seed.mood,
                schedule_kind,
                next_action_ts,
            });
        }
    }
}

fn ensure_npc_schedules(ctx: &ReducerContext, now_us: u64) {
    for npc in ctx.db.npc_state().iter() {
        let action_type = normalize_schedule_kind(npc.schedule_kind);
        let next_action_at = if action_type == 1 || action_type == 2 {
            now_us
        } else {
            now_us + npc_next_delay(action_type)
        };
        if let Some(mut schedule) = ctx.db.npc_action_schedule().npc_id().find(npc.npc_id) {
            schedule.action_type = action_type;
            schedule.target_region_id = Some(npc.region_id);
            schedule.next_action_at = next_action_at;
            ctx.db.npc_action_schedule().npc_id().update(schedule);
        } else {
            ctx.db.npc_action_schedule().insert(NpcActionSchedule {
                npc_id: npc.npc_id,
                next_action_at,
                action_type,
                target_region_id: Some(npc.region_id),
            });
        }
    }
}

#[spacetimedb::reducer]
pub fn npc_ai_agent_loop(ctx: &ReducerContext, arg: NpcAiLoopTimer) {
    let now_us = to_micros_u64(ctx);

    let mut npc_updates = Vec::new();
    let mut schedule_updates: Vec<NpcActionSchedule> = Vec::new();

    for mut npc in ctx.db.npc_state().iter() {
        let mut schedule =
            if let Some(schedule) = ctx.db.npc_action_schedule().npc_id().find(npc.npc_id) {
                schedule
            } else {
                let action_type = normalize_schedule_kind(npc.schedule_kind);
                let default_schedule = NpcActionSchedule {
                    npc_id: npc.npc_id,
                    next_action_at: now_us + npc_next_delay(action_type),
                    action_type,
                    target_region_id: Some(npc.region_id),
                };
                ctx.db.npc_action_schedule().insert(NpcActionSchedule {
                    npc_id: default_schedule.npc_id,
                    next_action_at: default_schedule.next_action_at,
                    action_type: default_schedule.action_type,
                    target_region_id: default_schedule.target_region_id,
                });
                default_schedule
            };

        if now_us < schedule.next_action_at {
            continue;
        }

        let action_type = sanitize_action_type(schedule.action_type, npc.schedule_kind);
        if action_type == 0 || action_type == 3 {
            schedule.next_action_at = now_us + npc_next_delay(action_type);
            schedule.action_type = action_type;
            npc.next_action_ts = now_us + npc_next_delay(action_type);
            npc_updates.push(npc);
        } else {
            let (next_hex_x, next_hex_z) =
                compute_npc_destination(npc.npc_id, npc.hex_x, npc.hex_z, action_type, npc.mood);

            process_npc_movement(
                &mut npc,
                &mut schedule,
                now_us,
                action_type,
                next_hex_x,
                next_hex_z,
            );
            npc.mood = npc.mood.wrapping_add(1);
            npc_updates.push(npc);
        }

        schedule_updates.push(schedule);
    }

    for npc in npc_updates {
        ctx.db.npc_state().npc_id().update(npc);
    }
    for schedule in schedule_updates {
        if ctx
            .db
            .npc_action_schedule()
            .npc_id()
            .find(schedule.npc_id)
            .is_some()
        {
            ctx.db.npc_action_schedule().npc_id().update(schedule);
        }
    }

    if let Some(mut timer) = ctx
        .db
        .npc_ai_loop_timer()
        .scheduled_id()
        .find(arg.scheduled_id)
    {
        timer.last_run_at = ctx.timestamp;
        ctx.db.npc_ai_loop_timer().scheduled_id().update(timer);
    }
}

fn npc_next_delay(schedule_kind: u8) -> u64 {
    let base = match schedule_kind {
        0 => 8,
        1 => NPC_AI_INTERVAL_SECS,
        2 => 6,
        3 => 20,
        _ => NPC_AI_INTERVAL_SECS,
    };
    base * 1_000_000
}

fn sanitize_action_type(raw_action_type: u8, fallback: u8) -> u8 {
    let fallback = normalize_schedule_kind(fallback);
    match raw_action_type {
        0..=3 => raw_action_type,
        _ => fallback,
    }
}

fn normalize_schedule_kind(schedule_kind: u8) -> u8 {
    match schedule_kind {
        0..=3 => schedule_kind,
        _ => 1,
    }
}

fn process_npc_movement(
    npc: &mut NpcState,
    schedule: &mut NpcActionSchedule,
    now_us: u64,
    action_type: u8,
    next_hex_x: i32,
    next_hex_z: i32,
) {
    npc.dest_hex_x = next_hex_x;
    npc.dest_hex_z = next_hex_z;
    npc.hex_x = next_hex_x;
    npc.hex_z = next_hex_z;
    npc.next_action_ts = now_us + npc_next_delay(action_type);
    schedule.next_action_at = npc.next_action_ts;
    schedule.action_type = action_type;
}

fn compute_npc_destination(
    npc_id: u64,
    cur_hex_x: i32,
    cur_hex_z: i32,
    action_type: u8,
    mood: u8,
) -> (i32, i32) {
    match action_type {
        0 | 3 => (cur_hex_x, cur_hex_z),
        2 => {
            let phase = (u32::from(mood) + (npc_id as u32 & 0b11)) % 4;
            match phase {
                0 => (cur_hex_x + NPC_AI_STEP_HEX, cur_hex_z),
                1 => (cur_hex_x, cur_hex_z + NPC_AI_STEP_HEX),
                2 => (cur_hex_x - NPC_AI_STEP_HEX, cur_hex_z),
                _ => (cur_hex_x, cur_hex_z - NPC_AI_STEP_HEX),
            }
        }
        _ => {
            let mut seed = npc_id ^ (u64::from(mood) << 17) ^ 0x9E3779B97F4A7C15u64;
            seed = seed.rotate_left(13) ^ (seed << 7);
            let dx = ((seed % 3) as i32) - 1;
            seed = seed.rotate_right(11) ^ (seed << 9);
            let dz = (((seed >> 2) % 3) as i32) - 1;
            (
                cur_hex_x + dx * NPC_AI_STEP_HEX,
                cur_hex_z + dz * NPC_AI_STEP_HEX,
            )
        }
    }
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
