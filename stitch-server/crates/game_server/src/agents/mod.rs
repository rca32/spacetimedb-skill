//! Scheduled reducers and background agents live here.

use std::collections::{HashMap, HashSet};
use std::time::Duration;

use spacetimedb::{Identity, ReducerContext, ScheduleAt, Table};

use crate::services::hex_coords::{HexCoord, DEFAULT_WORLD_DIMENSION_ID};
use crate::services::pathfinding;
use crate::services::permissions;
use crate::services::projection_views;
use crate::tables::agent_timers::{
    environment_effect_loop_timer, npc_ai_loop_timer, player_regen_loop_timer,
    resource_regen_loop_timer, session_cleanup_loop_timer, worldgen_lazy_loop_timer,
};
use crate::tables::building_state::building_state;
use crate::tables::claim_state::claim_state;
use crate::tables::combat::{attack_outcome, attack_schedule_state, combat_state};
use crate::tables::environment_effect::{
    environment_effect_desc, environment_effect_exposure, environment_effect_state,
};
use crate::tables::item_def::item_def;
use crate::tables::live_ops::{balance_params, feature_flags};
use crate::tables::npc_quest::{
    npc_anchor_state, npc_population_def, npc_state, npc_trade_order_def, npc_trade_order_state,
};
use crate::tables::pathfinding::npc_path_state;
use crate::tables::player_progression::{
    character_stats, npc_action_schedule, resource_state, status_effect,
};
use crate::tables::player_views::player_session_view;
use crate::tables::session_state::session_state;
use crate::tables::trade_market::trade_session;
use crate::tables::transform_state::transform_state;
use crate::tables::world_gen::world_gen_params;
use crate::tables::world_state::{region_state, resource_node, terrain_chunk};
use crate::tables::{
    CharacterStats, EnvironmentEffectDesc, EnvironmentEffectExposure, EnvironmentEffectLoopTimer,
    EnvironmentEffectState, FeatureFlags, NpcActionSchedule, NpcAiLoopTimer, NpcAnchorState,
    NpcPopulationDef, NpcState, NpcTradeOrderDef, NpcTradeOrderState, PlayerRegenLoopTimer,
    RegionState, ResourceNode, ResourceRegenLoopTimer, ResourceState, SessionCleanupLoopTimer,
    StatusEffect, TerrainChunk, WorldgenLazyLoopTimer,
};
use crate::utils::identity_to_entity_id;

const PLAYER_REGEN_INTERVAL_SECS: u64 = 5;
const RESOURCE_REGEN_INTERVAL_SECS: u64 = 10;
const WORLDGEN_LAZY_INTERVAL_SECS: u64 = 1;
const SESSION_CLEANUP_INTERVAL_SECS: u64 = 60;
const ENVIRONMENT_EFFECT_INTERVAL_SECS: u64 = 5;
const SESSION_IDLE_TIMEOUT_SECS: u64 = 30 * 60;
const NPC_AI_INTERVAL_SECS: u64 = 2;
const NPC_AI_STEP_HEX: i32 = 2;
const NPC_AI_PATH_NODE_LIMIT: u32 = 2_048;
const NPC_AI_PATH_KEEP_ROWS_PER_IDENTITY: u32 = 64;
const STARTER_REGION_ID: u64 = 1;
const NPC_ANCHOR_KIND_GENERIC: u8 = 0;
const NPC_ANCHOR_KIND_RUIN: u8 = 1;
const AUTO_ANCHOR_MAX: usize = 32;
const AUTO_ANCHOR_RADIUS_CHUNKS: i32 = 4;
const NPC_AI_FEATURE_FLAG_KEY: &str = "npc_ai_enabled";
const NPC_ORDER_REFRESH_INTERVAL_SECS: u64 = 45;
const NPC_ORDER_RANDOM_TRAVELING: usize = 2;
const NPC_ORDER_RANDOM_STATIONARY: usize = 1;
const NPC_TRAVEL_TARGET_TOP_K: usize = 3;
const NPC_PREVIOUS_ANCHOR_LIMIT: usize = 3;

const DEFAULT_NPC_POPULATION_DEFS: [(u8, u16, u16, u16, u8, u8, bool); 8] = [
    // npc_type, population_permille, min_action_seconds, max_action_seconds,
    // default_schedule_kind, default_role, traveling_enabled
    (1, 140, 2, 5, 1, 1, true),
    (2, 120, 6, 20, 3, 2, false),
    (3, 120, 2, 5, 1, 3, true),
    (4, 120, 4, 12, 2, 4, true),
    (5, 120, 8, 18, 0, 5, false),
    (6, 120, 2, 6, 1, 6, true),
    (7, 120, 2, 6, 1, 7, true),
    (8, 120, 4, 12, 2, 8, true),
];

fn to_micros_u64(ctx: &ReducerContext) -> u64 {
    u64::try_from(ctx.timestamp.to_micros_since_unix_epoch()).unwrap_or_default()
}

fn upsert_feature_flag(ctx: &ReducerContext, flag_key: &str, enabled: bool) {
    let key = flag_key.trim().to_string();
    if key.is_empty() {
        return;
    }
    let row = FeatureFlags {
        flag_key: key.clone(),
        enabled,
        updated_at: ctx.timestamp,
    };
    if ctx.db.feature_flags().flag_key().find(key).is_some() {
        ctx.db.feature_flags().flag_key().update(row);
    } else {
        ctx.db.feature_flags().insert(row);
    }
    if flag_key == NPC_AI_FEATURE_FLAG_KEY {
        projection_views::sync_npc_ai_status_view(ctx, enabled);
    }
}

fn ensure_default_npc_ai_feature_flag(ctx: &ReducerContext) {
    if let Some(row) = ctx
        .db
        .feature_flags()
        .flag_key()
        .find(NPC_AI_FEATURE_FLAG_KEY.to_string())
    {
        projection_views::sync_npc_ai_status_view(ctx, row.enabled);
    } else {
        upsert_feature_flag(ctx, NPC_AI_FEATURE_FLAG_KEY, true);
    }
}

fn is_npc_ai_enabled(ctx: &ReducerContext) -> bool {
    ctx.db
        .feature_flags()
        .flag_key()
        .find(NPC_AI_FEATURE_FLAG_KEY.to_string())
        .map(|row| row.enabled)
        .unwrap_or(true)
}

pub(crate) fn ensure_default_agent_timers(ctx: &ReducerContext) {
    ensure_default_npc_ai_feature_flag(ctx);

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

    if let Some(mut timer) = ctx.db.worldgen_lazy_loop_timer().scheduled_id().find(1) {
        timer.scheduled_at =
            ScheduleAt::Interval(Duration::from_secs(WORLDGEN_LAZY_INTERVAL_SECS).into());
        timer.last_run_at = ctx.timestamp;
        ctx.db.worldgen_lazy_loop_timer().scheduled_id().update(timer);
    } else {
        ctx.db
            .worldgen_lazy_loop_timer()
            .insert(WorldgenLazyLoopTimer {
                scheduled_id: 1,
                scheduled_at: ScheduleAt::Interval(
                    Duration::from_secs(WORLDGEN_LAZY_INTERVAL_SECS).into(),
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
    crate::worldgen::ensure_default_worldgen_config(ctx);
    ensure_default_agent_timers(ctx);
    backfill_legacy_dimension_columns(ctx);
    seed_world_if_empty(ctx)?;
    projection_views::reconcile_npc_state_stream(ctx);
    Ok(())
}

fn backfill_legacy_dimension_columns(ctx: &ReducerContext) {
    let mut session_updates = 0_u32;
    let mut transform_updates = 0_u32;
    let mut building_updates = 0_u32;
    let mut claim_updates = 0_u32;
    let mut npc_updates = 0_u32;
    let mut combat_updates = 0_u32;
    let mut attack_schedule_updates = 0_u32;
    let mut attack_outcome_updates = 0_u32;
    let mut trade_session_updates = 0_u32;

    let session_rows: Vec<_> = ctx.db.session_state().iter().collect();
    for mut row in session_rows {
        if row.dimension_id == 0 {
            row.dimension_id = DEFAULT_WORLD_DIMENSION_ID;
            ctx.db.session_state().identity().update(row);
            session_updates = session_updates.saturating_add(1);
        }
    }

    let transform_rows: Vec<_> = ctx.db.transform_state().iter().collect();
    for mut row in transform_rows {
        if row.dimension_id != 0 {
            continue;
        }
        row.dimension_id = ctx
            .db
            .session_state()
            .identity()
            .find(row.entity_id)
            .map(|session| {
                if session.dimension_id == 0 {
                    DEFAULT_WORLD_DIMENSION_ID
                } else {
                    session.dimension_id
                }
            })
            .unwrap_or(DEFAULT_WORLD_DIMENSION_ID);
        ctx.db.transform_state().entity_id().update(row);
        transform_updates = transform_updates.saturating_add(1);
    }

    let building_rows: Vec<_> = ctx.db.building_state().iter().collect();
    for mut row in building_rows {
        if row.dimension_id != 0 {
            continue;
        }
        row.dimension_id = DEFAULT_WORLD_DIMENSION_ID;
        ctx.db.building_state().entity_id().update(row);
        building_updates = building_updates.saturating_add(1);
    }

    let claim_rows: Vec<_> = ctx.db.claim_state().iter().collect();
    for mut row in claim_rows {
        if row.dimension_id != 0 {
            continue;
        }
        row.dimension_id = DEFAULT_WORLD_DIMENSION_ID;
        ctx.db.claim_state().claim_id().update(row);
        claim_updates = claim_updates.saturating_add(1);
    }

    let npc_rows: Vec<_> = ctx.db.npc_state().iter().collect();
    for mut row in npc_rows {
        if row.dimension_id != 0 {
            continue;
        }
        row.dimension_id = DEFAULT_WORLD_DIMENSION_ID;
        ctx.db.npc_state().npc_id().update(row);
        npc_updates = npc_updates.saturating_add(1);
    }

    let combat_rows: Vec<_> = ctx.db.combat_state().iter().collect();
    for mut row in combat_rows {
        if row.dimension_id != 0 {
            continue;
        }
        row.dimension_id = ctx
            .db
            .session_state()
            .identity()
            .find(row.identity)
            .map(|session| {
                if session.dimension_id == 0 {
                    DEFAULT_WORLD_DIMENSION_ID
                } else {
                    session.dimension_id
                }
            })
            .unwrap_or(DEFAULT_WORLD_DIMENSION_ID);
        ctx.db.combat_state().identity().update(row);
        combat_updates = combat_updates.saturating_add(1);
    }

    let attack_schedule_rows: Vec<_> = ctx.db.attack_schedule_state().iter().collect();
    for mut row in attack_schedule_rows {
        if row.dimension_id != 0 {
            continue;
        }
        let inferred_dimension = ctx
            .db
            .session_state()
            .identity()
            .find(row.attacker_identity)
            .or_else(|| ctx.db.session_state().identity().find(row.target_identity))
            .map(|session| {
                if session.dimension_id == 0 {
                    DEFAULT_WORLD_DIMENSION_ID
                } else {
                    session.dimension_id
                }
            })
            .unwrap_or(DEFAULT_WORLD_DIMENSION_ID);
        row.dimension_id = inferred_dimension;
        ctx.db.attack_schedule_state().request_key().update(row);
        attack_schedule_updates = attack_schedule_updates.saturating_add(1);
    }

    let attack_outcome_rows: Vec<_> = ctx.db.attack_outcome().iter().collect();
    for mut row in attack_outcome_rows {
        if row.dimension_id != 0 {
            continue;
        }
        let inferred_dimension = ctx
            .db
            .session_state()
            .identity()
            .find(row.attacker_identity)
            .or_else(|| ctx.db.session_state().identity().find(row.target_identity))
            .map(|session| {
                if session.dimension_id == 0 {
                    DEFAULT_WORLD_DIMENSION_ID
                } else {
                    session.dimension_id
                }
            })
            .unwrap_or(DEFAULT_WORLD_DIMENSION_ID);
        row.dimension_id = inferred_dimension;
        ctx.db.attack_outcome().outcome_id().update(row);
        attack_outcome_updates = attack_outcome_updates.saturating_add(1);
    }

    let trade_session_rows: Vec<_> = ctx.db.trade_session().iter().collect();
    for mut row in trade_session_rows {
        if row.dimension_id != 0 {
            continue;
        }
        let inferred_dimension = ctx
            .db
            .session_state()
            .identity()
            .find(row.initiator_identity)
            .or_else(|| ctx.db.session_state().identity().find(row.partner_identity))
            .map(|session| {
                if session.dimension_id == 0 {
                    DEFAULT_WORLD_DIMENSION_ID
                } else {
                    session.dimension_id
                }
            })
            .unwrap_or(DEFAULT_WORLD_DIMENSION_ID);
        row.dimension_id = inferred_dimension;
        ctx.db.trade_session().session_id().update(row);
        trade_session_updates = trade_session_updates.saturating_add(1);
    }

    let mut identities = HashSet::new();
    for row in ctx.db.session_state().iter() {
        identities.insert(row.identity);
    }
    for row in ctx.db.player_session_view().iter() {
        identities.insert(row.identity);
    }
    for identity in identities {
        projection_views::sync_player_session_view(ctx, identity);
    }

    let total_updates = session_updates
        .saturating_add(transform_updates)
        .saturating_add(building_updates)
        .saturating_add(claim_updates)
        .saturating_add(npc_updates)
        .saturating_add(combat_updates)
        .saturating_add(attack_schedule_updates)
        .saturating_add(attack_outcome_updates)
        .saturating_add(trade_session_updates);
    if total_updates > 0 {
        log::info!(
            "legacy dimension backfill complete: session={} transform={} building={} claim={} npc={} combat={} attack_schedule={} attack_outcome={} trade_session={}",
            session_updates,
            transform_updates,
            building_updates,
            claim_updates,
            npc_updates,
            combat_updates,
            attack_schedule_updates,
            attack_outcome_updates,
            trade_session_updates
        );
    }
}

fn seed_world_if_empty(ctx: &ReducerContext) -> Result<(), String> {
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

    let summary = crate::worldgen::ensure_world_generated(ctx, STARTER_REGION_ID)?;
    if summary.chunk_count > 0 || summary.resource_count > 0 {
        log::info!(
            "world generated for starter region: chunks={} resources={}",
            summary.chunk_count,
            summary.resource_count
        );
    }

    let now_us = to_micros_u64(ctx);
    ensure_default_npc_population_defs(ctx);
    ensure_default_npc_trade_order_defs(ctx);
    refresh_default_npc_anchors(ctx);
    reconcile_npc_population(ctx, now_us);
    sync_npc_anchor_occupancy(ctx);
    Ok(())
}

fn ensure_default_npc_population_defs(ctx: &ReducerContext) {
    if ctx.db.npc_population_def().iter().next().is_some() {
        return;
    }

    for (
        npc_type,
        population_permille,
        min_action_seconds,
        max_action_seconds,
        default_schedule_kind,
        default_role,
        traveling_enabled,
    ) in DEFAULT_NPC_POPULATION_DEFS
    {
        ctx.db.npc_population_def().insert(NpcPopulationDef {
            npc_type,
            population_permille,
            min_action_seconds,
            max_action_seconds,
            default_schedule_kind,
            default_role,
            traveling_enabled,
            enabled: true,
            updated_at: ctx.timestamp,
        });
    }
}

fn ensure_default_npc_trade_order_defs(ctx: &ReducerContext) {
    if ctx.db.npc_trade_order_def().iter().next().is_some() {
        return;
    }

    let mut item_ids: Vec<u64> = ctx
        .db
        .item_def()
        .iter()
        .map(|row| row.item_def_id)
        .collect();
    item_ids.sort_unstable();
    if item_ids.is_empty() {
        return;
    }

    let primary_item = item_ids[0];
    let secondary_item = item_ids.get(1).copied().unwrap_or(primary_item);
    let tertiary_item = item_ids.get(2).copied().unwrap_or(secondary_item);
    let mut order_def_id = 1u64;

    for npc_type in 1..=8u8 {
        ctx.db.npc_trade_order_def().insert(NpcTradeOrderDef {
            order_def_id,
            npc_type,
            item_def_id: primary_item,
            side: 1,
            min_quantity: 2,
            max_quantity: 8,
            base_unit_price: 8,
            weight: 100,
            always_offered: true,
            enabled: true,
            updated_at: ctx.timestamp,
        });
        order_def_id = order_def_id.saturating_add(1);

        ctx.db.npc_trade_order_def().insert(NpcTradeOrderDef {
            order_def_id,
            npc_type,
            item_def_id: secondary_item,
            side: 0,
            min_quantity: 1,
            max_quantity: 4,
            base_unit_price: 6,
            weight: 100,
            always_offered: true,
            enabled: true,
            updated_at: ctx.timestamp,
        });
        order_def_id = order_def_id.saturating_add(1);

        ctx.db.npc_trade_order_def().insert(NpcTradeOrderDef {
            order_def_id,
            npc_type,
            item_def_id: tertiary_item,
            side: if npc_type % 2 == 0 { 1 } else { 0 },
            min_quantity: 1,
            max_quantity: 3,
            base_unit_price: 10,
            weight: 80,
            always_offered: false,
            enabled: true,
            updated_at: ctx.timestamp,
        });
        order_def_id = order_def_id.saturating_add(1);
    }
}

fn cleanup_npc_trade_orders_for_npc(ctx: &ReducerContext, npc_id: u64) {
    let stale_keys: Vec<String> = ctx
        .db
        .npc_trade_order_state()
        .iter()
        .filter(|row| row.npc_id == npc_id)
        .map(|row| row.order_key)
        .collect();
    for order_key in stale_keys {
        if ctx
            .db
            .npc_trade_order_state()
            .order_key()
            .find(order_key.clone())
            .is_some()
        {
            ctx.db.npc_trade_order_state().order_key().delete(order_key);
        }
    }
}

fn choose_npc_trade_optional_order_def_ids(
    defs: &[NpcTradeOrderDef],
    npc_id: u64,
    refresh_bucket: u64,
    random_count: usize,
) -> HashSet<u64> {
    if random_count == 0 || defs.is_empty() {
        return HashSet::new();
    }

    let mut scored: Vec<(u64, u64)> = defs
        .iter()
        .map(|def| {
            let seed = npc_id
                ^ def.order_def_id.wrapping_mul(0x9E37_79B9_7F4A_7C15)
                ^ refresh_bucket.wrapping_mul(0xC2B2_AE3D_27D4_EB4F)
                ^ (u64::from(def.weight) << 40);
            let score = mix_u64(seed);
            (def.order_def_id, score)
        })
        .collect();
    scored.sort_by(|left, right| right.1.cmp(&left.1).then_with(|| left.0.cmp(&right.0)));

    scored
        .into_iter()
        .take(random_count)
        .map(|entry| entry.0)
        .collect()
}

fn sync_npc_trade_orders_for_npc(
    ctx: &ReducerContext,
    npc_id: u64,
    npc_type: u8,
    traveling: bool,
    now_us: u64,
) {
    let defs: Vec<NpcTradeOrderDef> = ctx
        .db
        .npc_trade_order_def()
        .iter()
        .filter(|row| row.enabled && row.npc_type == npc_type)
        .collect();

    if defs.is_empty() {
        cleanup_npc_trade_orders_for_npc(ctx, npc_id);
        return;
    }

    let refresh_interval_us = NPC_ORDER_REFRESH_INTERVAL_SECS.saturating_mul(1_000_000);
    let refresh_bucket = if refresh_interval_us == 0 {
        0
    } else {
        now_us / refresh_interval_us
    };
    let random_count = if traveling {
        NPC_ORDER_RANDOM_TRAVELING
    } else {
        NPC_ORDER_RANDOM_STATIONARY
    };
    let optional_defs: Vec<NpcTradeOrderDef> = defs
        .iter()
        .filter(|row| !row.always_offered)
        .map(|row| NpcTradeOrderDef {
            order_def_id: row.order_def_id,
            npc_type: row.npc_type,
            item_def_id: row.item_def_id,
            side: row.side,
            min_quantity: row.min_quantity,
            max_quantity: row.max_quantity,
            base_unit_price: row.base_unit_price,
            weight: row.weight,
            always_offered: row.always_offered,
            enabled: row.enabled,
            updated_at: row.updated_at,
        })
        .collect();
    let optional_ids = choose_npc_trade_optional_order_def_ids(
        &optional_defs,
        npc_id,
        refresh_bucket,
        random_count,
    );

    let desired_defs: Vec<NpcTradeOrderDef> = defs
        .into_iter()
        .filter(|row| row.always_offered || optional_ids.contains(&row.order_def_id))
        .collect();
    let desired_keys: HashSet<String> = desired_defs
        .iter()
        .map(|row| format!("{}:{}", npc_id, row.order_def_id))
        .collect();

    for def in desired_defs {
        let order_key = format!("{}:{}", npc_id, def.order_def_id);
        let seed = mix_u64(npc_id ^ def.order_def_id ^ refresh_bucket);
        let qty_span = def.max_quantity.saturating_sub(def.min_quantity);
        let quantity = def
            .min_quantity
            .saturating_add((seed as u32) % qty_span.saturating_add(1));
        let price_jitter = (seed >> 8) % 3;
        let unit_price = def.base_unit_price.saturating_add(price_jitter);
        let refresh_at = now_us.saturating_add(refresh_interval_us);

        if let Some(mut existing) = ctx
            .db
            .npc_trade_order_state()
            .order_key()
            .find(order_key.clone())
        {
            if existing.refresh_at <= now_us
                || existing.item_def_id != def.item_def_id
                || existing.side != def.side
                || existing.quantity != quantity
                || existing.unit_price != unit_price
                || existing.status != 0
                || existing.npc_type != npc_type
            {
                existing.npc_type = npc_type;
                existing.order_def_id = def.order_def_id;
                existing.item_def_id = def.item_def_id;
                existing.side = def.side;
                existing.quantity = quantity;
                existing.unit_price = unit_price;
                existing.status = 0;
                existing.refresh_at = refresh_at;
                existing.updated_at = ctx.timestamp;
                ctx.db.npc_trade_order_state().order_key().update(existing);
            }
        } else {
            ctx.db.npc_trade_order_state().insert(NpcTradeOrderState {
                order_key,
                npc_id,
                npc_type,
                order_def_id: def.order_def_id,
                item_def_id: def.item_def_id,
                side: def.side,
                quantity,
                unit_price,
                status: 0,
                refresh_at,
                updated_at: ctx.timestamp,
            });
        }
    }

    let stale_keys: Vec<String> = ctx
        .db
        .npc_trade_order_state()
        .iter()
        .filter(|row| row.npc_id == npc_id)
        .filter(|row| !desired_keys.contains(&row.order_key))
        .map(|row| row.order_key)
        .collect();
    for order_key in stale_keys {
        if ctx
            .db
            .npc_trade_order_state()
            .order_key()
            .find(order_key.clone())
            .is_some()
        {
            ctx.db.npc_trade_order_state().order_key().delete(order_key);
        }
    }
}

fn mix_u64(seed: u64) -> u64 {
    let mut x = seed ^ 0x9E37_79B9_7F4A_7C15;
    x ^= x >> 30;
    x = x.wrapping_mul(0xBF58_476D_1CE4_E5B9);
    x ^= x >> 27;
    x = x.wrapping_mul(0x94D0_49BB_1331_11EB);
    x ^ (x >> 31)
}

fn push_recent_anchor(npc: &mut NpcState, anchor_id: u64) {
    if anchor_id == 0 {
        return;
    }
    if npc.previous_anchors.last().copied() == Some(anchor_id) {
        return;
    }
    npc.previous_anchors.push(anchor_id);
    if npc.previous_anchors.len() > NPC_PREVIOUS_ANCHOR_LIMIT {
        let drain_len = npc.previous_anchors.len() - NPC_PREVIOUS_ANCHOR_LIMIT;
        npc.previous_anchors.drain(0..drain_len);
    }
}

fn choose_travel_anchor_destination(
    ctx: &ReducerContext,
    npc: &NpcState,
    now_us: u64,
) -> Option<(u64, i32, i32)> {
    let mut candidates: Vec<NpcAnchorState> = ctx
        .db
        .npc_anchor_state()
        .iter()
        .filter(|row| row.region_id == npc.region_id && row.is_active)
        .filter(|row| row.anchor_id != npc.anchor_entity_id)
        .collect();
    if candidates.is_empty() {
        return None;
    }

    let recent: HashSet<u64> = npc
        .previous_anchors
        .iter()
        .rev()
        .take(NPC_PREVIOUS_ANCHOR_LIMIT)
        .copied()
        .collect();

    candidates.sort_by_key(|row| {
        let dx = i64::from(npc.hex_x) - i64::from(row.hex_x);
        let dz = i64::from(npc.hex_z) - i64::from(row.hex_z);
        let dist_sq = dx.saturating_mul(dx).saturating_add(dz.saturating_mul(dz));
        let penalty = if recent.contains(&row.anchor_id) {
            1_000_000_000_i64
        } else {
            0
        };
        dist_sq.saturating_add(penalty)
    });

    let top_k = candidates
        .into_iter()
        .take(NPC_TRAVEL_TARGET_TOP_K.max(1))
        .collect::<Vec<_>>();
    if top_k.is_empty() {
        return None;
    }
    let seed = mix_u64(
        npc.npc_id
            ^ now_us.rotate_left(13)
            ^ (u64::from(npc.mood) << 32)
            ^ (u64::from(npc.schedule_kind) << 40),
    );
    let idx = (seed as usize) % top_k.len();
    let chosen = &top_k[idx];
    Some((chosen.anchor_id, chosen.hex_x, chosen.hex_z))
}

fn cleanup_orphan_npc_records(ctx: &ReducerContext) {
    let anchor_active_map: HashMap<u64, bool> = ctx
        .db
        .npc_anchor_state()
        .iter()
        .map(|row| (row.anchor_id, row.is_active))
        .collect();

    let orphan_npc_ids: Vec<u64> = ctx
        .db
        .npc_state()
        .iter()
        .filter(|row| row.anchor_entity_id != 0)
        .filter(|row| {
            anchor_active_map
                .get(&row.anchor_entity_id)
                .map(|is_active| !*is_active)
                .unwrap_or(true)
        })
        .map(|row| row.npc_id)
        .collect();

    for npc_id in orphan_npc_ids {
        if ctx.db.npc_state().npc_id().find(npc_id).is_some() {
            ctx.db.npc_state().npc_id().delete(npc_id);
        }
        if ctx.db.npc_action_schedule().npc_id().find(npc_id).is_some() {
            ctx.db.npc_action_schedule().npc_id().delete(npc_id);
        }
        if ctx.db.npc_path_state().npc_id().find(npc_id).is_some() {
            ctx.db.npc_path_state().npc_id().delete(npc_id);
        }
        cleanup_npc_trade_orders_for_npc(ctx, npc_id);
    }

    let valid_npc_ids: HashSet<u64> = ctx.db.npc_state().iter().map(|row| row.npc_id).collect();

    let stale_schedule_ids: Vec<u64> = ctx
        .db
        .npc_action_schedule()
        .iter()
        .filter(|row| !valid_npc_ids.contains(&row.npc_id))
        .map(|row| row.npc_id)
        .collect();
    for npc_id in stale_schedule_ids {
        if ctx.db.npc_action_schedule().npc_id().find(npc_id).is_some() {
            ctx.db.npc_action_schedule().npc_id().delete(npc_id);
        }
    }

    let stale_path_ids: Vec<u64> = ctx
        .db
        .npc_path_state()
        .iter()
        .filter(|row| !valid_npc_ids.contains(&row.npc_id))
        .map(|row| row.npc_id)
        .collect();
    for npc_id in stale_path_ids {
        if ctx.db.npc_path_state().npc_id().find(npc_id).is_some() {
            ctx.db.npc_path_state().npc_id().delete(npc_id);
        }
    }

    let stale_order_keys: Vec<String> = ctx
        .db
        .npc_trade_order_state()
        .iter()
        .filter(|row| !valid_npc_ids.contains(&row.npc_id))
        .map(|row| row.order_key)
        .collect();
    for order_key in stale_order_keys {
        if ctx
            .db
            .npc_trade_order_state()
            .order_key()
            .find(order_key.clone())
            .is_some()
        {
            ctx.db.npc_trade_order_state().order_key().delete(order_key);
        }
    }
}

fn refresh_default_npc_anchors(ctx: &ReducerContext) {
    let chunk_size = ctx
        .db
        .world_gen_params()
        .id()
        .find(crate::worldgen::WORLD_GEN_PARAMS_ID)
        .map(|row| i32::from(row.terrain_chunk_size).max(1))
        .unwrap_or(i32::from(crate::worldgen::DEFAULT_WORLD_CHUNK_SIZE));

    let mut desired = Vec::<NpcAnchorState>::new();
    for building in ctx
        .db
        .building_state()
        .iter()
        .filter(|row| row.region_id == STARTER_REGION_ID && row.state != 2)
    {
        desired.push(NpcAnchorState {
            anchor_id: building.entity_id,
            region_id: building.region_id,
            hex_x: building.hex_x,
            hex_z: building.hex_z,
            anchor_kind: NPC_ANCHOR_KIND_RUIN,
            is_active: true,
            occupied_by_npc_id: None,
            updated_at: ctx.timestamp,
        });
    }

    if desired.is_empty() {
        let mut chunks: Vec<_> = ctx
            .db
            .terrain_chunk()
            .iter()
            .filter(|row| row.region_id == STARTER_REGION_ID)
            .filter(|row| {
                row.chunk_x.abs() <= AUTO_ANCHOR_RADIUS_CHUNKS
                    && row.chunk_y.abs() <= AUTO_ANCHOR_RADIUS_CHUNKS
            })
            .collect();
        chunks.sort_by_key(|row| (row.chunk_y, row.chunk_x));
        for chunk in chunks.into_iter().take(AUTO_ANCHOR_MAX) {
            desired.push(NpcAnchorState {
                anchor_id: synthetic_anchor_id(STARTER_REGION_ID, chunk.chunk_x, chunk.chunk_y),
                region_id: STARTER_REGION_ID,
                hex_x: chunk
                    .chunk_x
                    .saturating_mul(chunk_size)
                    .saturating_add(chunk_size / 2),
                hex_z: chunk
                    .chunk_y
                    .saturating_mul(chunk_size)
                    .saturating_add(chunk_size / 2),
                anchor_kind: NPC_ANCHOR_KIND_GENERIC,
                is_active: true,
                occupied_by_npc_id: None,
                updated_at: ctx.timestamp,
            });
        }
    }

    let desired_ids: HashSet<u64> = desired.iter().map(|row| row.anchor_id).collect();
    for anchor in desired {
        if ctx
            .db
            .npc_anchor_state()
            .anchor_id()
            .find(anchor.anchor_id)
            .is_some()
        {
            ctx.db.npc_anchor_state().anchor_id().update(anchor);
        } else {
            ctx.db.npc_anchor_state().insert(anchor);
        }
    }

    let stale_ids: Vec<u64> = ctx
        .db
        .npc_anchor_state()
        .iter()
        .filter(|row| row.region_id == STARTER_REGION_ID)
        .filter(|row| {
            (row.anchor_kind == NPC_ANCHOR_KIND_GENERIC || row.anchor_kind == NPC_ANCHOR_KIND_RUIN)
                && !desired_ids.contains(&row.anchor_id)
        })
        .map(|row| row.anchor_id)
        .collect();

    for anchor_id in stale_ids {
        if let Some(mut anchor) = ctx.db.npc_anchor_state().anchor_id().find(anchor_id) {
            anchor.is_active = false;
            anchor.occupied_by_npc_id = None;
            anchor.updated_at = ctx.timestamp;
            ctx.db.npc_anchor_state().anchor_id().update(anchor);
        }
    }
}

fn sync_npc_anchor_occupancy(ctx: &ReducerContext) {
    for mut anchor in ctx.db.npc_anchor_state().iter() {
        anchor.occupied_by_npc_id = None;
        anchor.updated_at = ctx.timestamp;
        ctx.db.npc_anchor_state().anchor_id().update(anchor);
    }

    for npc in ctx.db.npc_state().iter() {
        if npc.anchor_entity_id == 0 {
            continue;
        }
        if let Some(mut anchor) = ctx
            .db
            .npc_anchor_state()
            .anchor_id()
            .find(npc.anchor_entity_id)
        {
            anchor.occupied_by_npc_id = Some(npc.npc_id);
            anchor.updated_at = ctx.timestamp;
            ctx.db.npc_anchor_state().anchor_id().update(anchor);
        }
    }
}

fn reconcile_npc_population(ctx: &ReducerContext, now_us: u64) {
    let mut active_anchors: Vec<NpcAnchorState> = ctx
        .db
        .npc_anchor_state()
        .iter()
        .filter(|row| row.region_id == STARTER_REGION_ID && row.is_active)
        .collect();
    active_anchors.sort_by_key(|row| row.anchor_id);

    let mut defs: Vec<NpcPopulationDef> = ctx
        .db
        .npc_population_def()
        .iter()
        .filter(|row| row.enabled && row.population_permille > 0)
        .collect();
    defs.sort_by_key(|row| row.npc_type);

    if active_anchors.is_empty() || defs.is_empty() {
        cleanup_orphan_npc_records(ctx);
        return;
    }

    let target_by_type = compute_target_by_type(active_anchors.len(), &defs);
    let def_map: HashMap<u8, NpcPopulationDef> =
        defs.into_iter().map(|row| (row.npc_type, row)).collect();

    let mut desired_anchor_npc_type = HashMap::<u64, u8>::new();
    let mut cursor = 0usize;
    let mut ordered_types = def_map.keys().copied().collect::<Vec<_>>();
    ordered_types.sort_unstable();
    for npc_type in ordered_types {
        let target = target_by_type.get(&npc_type).copied().unwrap_or(0);
        for _ in 0..target {
            if cursor >= active_anchors.len() {
                break;
            }
            desired_anchor_npc_type.insert(active_anchors[cursor].anchor_id, npc_type);
            cursor += 1;
        }
    }

    for anchor in &active_anchors {
        let Some(npc_type) = desired_anchor_npc_type.get(&anchor.anchor_id).copied() else {
            continue;
        };
        let Some(def) = def_map.get(&npc_type) else {
            continue;
        };

        let npc_id = anchor.anchor_id;
        let schedule_kind = normalize_schedule_kind(def.default_schedule_kind);
        let traveling = def.traveling_enabled;
        let role = def.default_role;
        let default_next_action_ts = now_us + npc_next_delay(ctx, npc_id, npc_type, schedule_kind);

        if let Some(mut npc) = ctx.db.npc_state().npc_id().find(npc_id) {
            let previous_anchor = npc.anchor_entity_id;
            let profile_changed = npc.npc_type != npc_type
                || npc.schedule_kind != schedule_kind
                || npc.traveling != traveling
                || npc.role != role
                || previous_anchor != anchor.anchor_id;

            if previous_anchor != 0 && previous_anchor != anchor.anchor_id {
                push_recent_anchor(&mut npc, previous_anchor);
            }

            npc.npc_type = npc_type;
            npc.region_id = anchor.region_id;
            npc.role = role;
            npc.traveling = traveling;
            npc.schedule_kind = schedule_kind;
            npc.anchor_entity_id = anchor.anchor_id;
            if !npc.traveling || profile_changed {
                npc.hex_x = anchor.hex_x;
                npc.hex_z = anchor.hex_z;
                npc.dest_hex_x = anchor.hex_x;
                npc.dest_hex_z = anchor.hex_z;
            }
            if profile_changed || npc.next_action_ts == 0 {
                npc.next_action_ts = default_next_action_ts;
            }

            ctx.db.npc_state().npc_id().update(npc);
        } else {
            ctx.db.npc_state().insert(NpcState {
                npc_id,
                npc_type,
                region_id: anchor.region_id,
                dimension_id: DEFAULT_WORLD_DIMENSION_ID,
                hex_x: anchor.hex_x,
                hex_z: anchor.hex_z,
                dest_hex_x: anchor.hex_x,
                dest_hex_z: anchor.hex_z,
                role,
                mood: 0,
                traveling,
                schedule_kind,
                next_action_ts: default_next_action_ts,
                anchor_entity_id: anchor.anchor_id,
                previous_anchors: vec![anchor.anchor_id],
            });
        }

        let action_type = if traveling { schedule_kind } else { 3 };
        let default_next_action_at = if action_type == 1 || action_type == 2 {
            now_us
        } else {
            default_next_action_ts
        };

        if let Some(mut schedule) = ctx.db.npc_action_schedule().npc_id().find(npc_id) {
            if schedule.action_type != action_type
                || schedule.target_region_id != Some(anchor.region_id)
            {
                schedule.action_type = action_type;
                schedule.target_region_id = Some(anchor.region_id);
                schedule.next_action_at = default_next_action_at;
                ctx.db.npc_action_schedule().npc_id().update(schedule);
            }
        } else {
            ctx.db.npc_action_schedule().insert(NpcActionSchedule {
                npc_id,
                next_action_at: default_next_action_at,
                action_type,
                target_region_id: Some(anchor.region_id),
            });
        }

        sync_npc_trade_orders_for_npc(ctx, npc_id, npc_type, traveling, now_us);
    }

    let stale_npc_ids: Vec<u64> = ctx
        .db
        .npc_state()
        .iter()
        .filter(|row| row.region_id == STARTER_REGION_ID)
        .filter(|row| row.anchor_entity_id != 0)
        .filter(|row| !desired_anchor_npc_type.contains_key(&row.anchor_entity_id))
        .map(|row| row.npc_id)
        .collect();

    for npc_id in stale_npc_ids {
        ctx.db.npc_state().npc_id().delete(npc_id);
        if ctx.db.npc_action_schedule().npc_id().find(npc_id).is_some() {
            ctx.db.npc_action_schedule().npc_id().delete(npc_id);
        }
        if ctx.db.npc_path_state().npc_id().find(npc_id).is_some() {
            ctx.db.npc_path_state().npc_id().delete(npc_id);
        }
        cleanup_npc_trade_orders_for_npc(ctx, npc_id);
    }

    cleanup_orphan_npc_records(ctx);
}

fn compute_target_by_type(anchor_count: usize, defs: &[NpcPopulationDef]) -> HashMap<u8, usize> {
    let mut targets = HashMap::<u8, usize>::new();
    let mut total = 0usize;
    for def in defs {
        let count = ((anchor_count as u64) * u64::from(def.population_permille) / 1_000) as usize;
        targets.insert(def.npc_type, count);
        total = total.saturating_add(count);
    }

    if total <= anchor_count {
        return targets;
    }

    let mut overflow = total - anchor_count;
    let mut ordered = defs.iter().map(|row| row.npc_type).collect::<Vec<_>>();
    ordered.sort_by(|left, right| {
        let l = targets.get(left).copied().unwrap_or(0);
        let r = targets.get(right).copied().unwrap_or(0);
        r.cmp(&l).then_with(|| left.cmp(right))
    });

    while overflow > 0 {
        let mut reduced_any = false;
        for npc_type in &ordered {
            if overflow == 0 {
                break;
            }
            let entry = targets.entry(*npc_type).or_default();
            if *entry > 0 {
                *entry -= 1;
                overflow -= 1;
                reduced_any = true;
            }
        }
        if !reduced_any {
            break;
        }
    }

    targets
}

fn synthetic_anchor_id(region_id: u64, chunk_x: i32, chunk_y: i32) -> u64 {
    let q = chunk_x as i64 as u64;
    let r = chunk_y as i64 as u64;
    let mixed = q.wrapping_mul(0x9E37_79B1_u64)
        ^ r.wrapping_mul(0x85EB_CA77_u64)
        ^ region_id.wrapping_mul(0xC2B2_AE3D_u64);
    0xA000_0000_0000_0000_u64 | (mixed & 0x0FFF_FFFF_FFFF_FFFF_u64)
}

#[spacetimedb::reducer]
pub fn npc_ai_agent_loop(ctx: &ReducerContext, arg: NpcAiLoopTimer) {
    let sender_has_session = ctx.db.session_state().identity().find(ctx.sender).is_some();
    if sender_has_session
        && ctx.sender != Identity::ZERO
        && !permissions::has_permission(ctx, 0, 0, permissions::PERM_ADMIN)
    {
        log::warn!("npc_ai_agent_loop rejected: server/admin authorization required");
        return;
    }

    ensure_default_npc_ai_feature_flag(ctx);
    if !is_npc_ai_enabled(ctx) {
        if let Some(mut timer) = ctx
            .db
            .npc_ai_loop_timer()
            .scheduled_id()
            .find(arg.scheduled_id)
        {
            timer.last_run_at = ctx.timestamp;
            ctx.db.npc_ai_loop_timer().scheduled_id().update(timer);
        }
        projection_views::reconcile_npc_state_stream(ctx);
        return;
    }

    let now_us = to_micros_u64(ctx);
    ensure_default_npc_population_defs(ctx);
    ensure_default_npc_trade_order_defs(ctx);
    refresh_default_npc_anchors(ctx);
    reconcile_npc_population(ctx, now_us);

    let mut npc_updates = Vec::new();
    let mut schedule_updates: Vec<NpcActionSchedule> = Vec::new();

    for mut npc in ctx.db.npc_state().iter() {
        let mut schedule = if let Some(schedule) =
            ctx.db.npc_action_schedule().npc_id().find(npc.npc_id)
        {
            schedule
        } else {
            let action_type = if npc.traveling {
                normalize_schedule_kind(npc.schedule_kind)
            } else {
                3
            };
            let default_schedule = NpcActionSchedule {
                npc_id: npc.npc_id,
                next_action_at: now_us + npc_next_delay(ctx, npc.npc_id, npc.npc_type, action_type),
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
        let action_type = if npc.traveling { action_type } else { 3 };
        if action_type == 0 || action_type == 3 || !npc.traveling {
            schedule.next_action_at =
                now_us + npc_next_delay(ctx, npc.npc_id, npc.npc_type, action_type);
            schedule.action_type = action_type;
            if let Some(anchor) = ctx
                .db
                .npc_anchor_state()
                .anchor_id()
                .find(npc.anchor_entity_id)
            {
                npc.hex_x = anchor.hex_x;
                npc.hex_z = anchor.hex_z;
                npc.dest_hex_x = anchor.hex_x;
                npc.dest_hex_z = anchor.hex_z;
            } else {
                npc.dest_hex_x = npc.hex_x;
                npc.dest_hex_z = npc.hex_z;
            }
            npc.next_action_ts =
                now_us + npc_next_delay(ctx, npc.npc_id, npc.npc_type, action_type);
            npc_updates.push(npc);
        } else {
            let mut target_hex_x = npc.dest_hex_x;
            let mut target_hex_z = npc.dest_hex_z;
            let reached_target = npc.hex_x == npc.dest_hex_x && npc.hex_z == npc.dest_hex_z;

            if reached_target || (target_hex_x == npc.hex_x && target_hex_z == npc.hex_z) {
                if let Some((dest_anchor_id, anchor_hex_x, anchor_hex_z)) =
                    choose_travel_anchor_destination(ctx, &npc, now_us)
                {
                    target_hex_x = anchor_hex_x;
                    target_hex_z = anchor_hex_z;
                    push_recent_anchor(&mut npc, dest_anchor_id);
                } else {
                    (target_hex_x, target_hex_z) = compute_npc_destination(
                        npc.npc_id,
                        npc.hex_x,
                        npc.hex_z,
                        action_type,
                        npc.mood,
                    );
                }
            }

            if target_hex_x == npc.hex_x && target_hex_z == npc.hex_z {
                (target_hex_x, target_hex_z) = compute_npc_destination(
                    npc.npc_id,
                    npc.hex_x,
                    npc.hex_z,
                    action_type,
                    npc.mood,
                );
            }

            let current = HexCoord::new(npc.hex_x, npc.hex_z, 1);
            let target = HexCoord::new(target_hex_x, target_hex_z, 1);
            let next_step = match pathfinding::request_npc_step(
                ctx,
                npc.npc_id,
                npc.region_id,
                current,
                target,
                NPC_AI_PATH_NODE_LIMIT,
            ) {
                Ok(step) => step,
                Err(err) => {
                    log::warn!(
                        "npc_ai path request failed: npc_id={} region_id={} start=({}, {}) target=({}, {}) error={}",
                        npc.npc_id,
                        npc.region_id,
                        npc.hex_x,
                        npc.hex_z,
                        target_hex_x,
                        target_hex_z,
                        err
                    );
                    None
                }
            };
            if let Some(step) = next_step {
                process_npc_movement(
                    ctx,
                    &mut npc,
                    &mut schedule,
                    now_us,
                    action_type,
                    step.q,
                    step.r,
                    target_hex_x,
                    target_hex_z,
                );
            } else {
                // Keep destination intent even when path is temporarily unavailable.
                npc.dest_hex_x = target_hex_x;
                npc.dest_hex_z = target_hex_z;
                npc.next_action_ts =
                    now_us + npc_next_delay(ctx, npc.npc_id, npc.npc_type, action_type);
                schedule.next_action_at = npc.next_action_ts;
                schedule.action_type = action_type;
            }
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

    sync_npc_anchor_occupancy(ctx);

    let removed_paths = pathfinding::prune_path_results(ctx, NPC_AI_PATH_KEEP_ROWS_PER_IDENTITY);
    if removed_paths > 0 {
        log::info!(
            "npc_ai_agent_loop pruned stale paths: removed={}",
            removed_paths
        );
    }

    projection_views::reconcile_npc_state_stream(ctx);

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

fn npc_next_delay(ctx: &ReducerContext, npc_id: u64, npc_type: u8, schedule_kind: u8) -> u64 {
    if let Some(def) = ctx.db.npc_population_def().npc_type().find(npc_type) {
        if def.enabled
            && def.max_action_seconds >= def.min_action_seconds
            && def.min_action_seconds > 0
        {
            let min_secs = u64::from(def.min_action_seconds);
            let max_secs = u64::from(def.max_action_seconds);
            let span = max_secs.saturating_sub(min_secs).saturating_add(1);
            let now_us = to_micros_u64(ctx);
            let cycle_bucket = now_us / (NPC_AI_INTERVAL_SECS.max(1) * 1_000_000);
            let seed = mix_u64(
                npc_id
                    ^ (u64::from(npc_type) << 32)
                    ^ (u64::from(normalize_schedule_kind(schedule_kind)) << 40)
                    ^ cycle_bucket.rotate_left(11),
            );
            let phase = if span == 0 {
                0
            } else {
                (npc_id ^ u64::from(npc_type)) % span
            };
            let jitter = if span == 0 {
                0
            } else {
                (seed % span + phase) % span
            };
            return min_secs.saturating_add(jitter).saturating_mul(1_000_000);
        }
    }

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
    ctx: &ReducerContext,
    npc: &mut NpcState,
    schedule: &mut NpcActionSchedule,
    now_us: u64,
    action_type: u8,
    step_hex_x: i32,
    step_hex_z: i32,
    dest_hex_x: i32,
    dest_hex_z: i32,
) {
    npc.dest_hex_x = dest_hex_x;
    npc.dest_hex_z = dest_hex_z;
    npc.hex_x = step_hex_x;
    npc.hex_z = step_hex_z;
    npc.next_action_ts = now_us + npc_next_delay(ctx, npc.npc_id, npc.npc_type, action_type);
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
            let max_amount = if node.max_amount == 0 {
                100
            } else {
                node.max_amount
            };
            if node.amount >= max_amount {
                node.max_amount = max_amount;
                node.is_depleted = false;
                return None;
            }
            if ctx.timestamp.duration_since(node.respawn_at).is_none() {
                return None;
            }
            let step = (max_amount / 20).max(1);
            node.amount = node.amount.saturating_add(step).min(max_amount);
            node.max_amount = max_amount;
            node.is_depleted = node.amount == 0;
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
pub fn worldgen_lazy_agent_loop(ctx: &ReducerContext, arg: WorldgenLazyLoopTimer) {
    if let Err(error) = crate::worldgen::drain_chunk_generation_queue(ctx) {
        log::warn!("worldgen_lazy_agent_loop failed: {}", error);
    }

    if let Some(mut timer) = ctx
        .db
        .worldgen_lazy_loop_timer()
        .scheduled_id()
        .find(arg.scheduled_id)
    {
        timer.last_run_at = ctx.timestamp;
        ctx.db.worldgen_lazy_loop_timer().scheduled_id().update(timer);
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

    let projected_identities: Vec<_> = ctx
        .db
        .player_session_view()
        .iter()
        .map(|row| row.identity)
        .collect();
    for identity in projected_identities {
        projection_views::sync_player_session_view(ctx, identity);
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

    let terrain_chunk_size = ctx
        .db
        .world_gen_params()
        .id()
        .find(crate::worldgen::WORLD_GEN_PARAMS_ID)
        .map(|params| f32::from(params.terrain_chunk_size).max(1.0))
        .unwrap_or(32.0);
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

        let chunk_x = (transform.position[0] / terrain_chunk_size).floor() as i32;
        let chunk_y = (transform.position[2] / terrain_chunk_size).floor() as i32;
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
