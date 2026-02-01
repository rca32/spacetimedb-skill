use std::time::Duration;

use spacetimedb::{ReducerContext, ScheduleAt, Table};

use crate::auth::server_identity::ServerIdentity;
use crate::tables::{
    agent_execution_log_trait, balance_params_trait, feature_flags_trait, AgentExecutionLog,
    BalanceParams, FeatureFlags,
};
pub mod auto_logout_agent;
pub mod building_decay_agent;
pub mod chat_cleanup_agent;
pub mod day_night_agent;
pub mod environment_debuff_agent;
pub mod metric_snapshot_agent;
pub mod npc_ai_agent;
pub mod player_regen_agent;
pub mod resource_regen_agent;
pub mod session_cleanup_agent;

#[spacetimedb::table(
    name = player_regen_loop_timer,
    scheduled(player_regen_agent_loop, at = scheduled_at)
)]
pub struct PlayerRegenLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = auto_logout_loop_timer,
    scheduled(auto_logout_agent_loop, at = scheduled_at)
)]
pub struct AutoLogoutLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = resource_regen_loop_timer,
    scheduled(resource_regen_agent_loop, at = scheduled_at)
)]
pub struct ResourceRegenLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = building_decay_loop_timer,
    scheduled(building_decay_agent_loop, at = scheduled_at)
)]
pub struct BuildingDecayLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = npc_ai_loop_timer,
    scheduled(npc_ai_agent_loop, at = scheduled_at)
)]
pub struct NpcAiLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = day_night_loop_timer,
    scheduled(day_night_agent_loop, at = scheduled_at)
)]
pub struct DayNightLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = environment_debuff_loop_timer,
    scheduled(environment_debuff_agent_loop, at = scheduled_at)
)]
pub struct EnvironmentDebuffLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = chat_cleanup_loop_timer,
    scheduled(chat_cleanup_agent_loop, at = scheduled_at)
)]
pub struct ChatCleanupLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = session_cleanup_loop_timer,
    scheduled(session_cleanup_agent_loop, at = scheduled_at)
)]
pub struct SessionCleanupLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

#[spacetimedb::table(
    name = metric_snapshot_loop_timer,
    scheduled(metric_snapshot_agent_loop, at = scheduled_at)
)]
pub struct MetricSnapshotLoopTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
}

pub fn init(ctx: &ReducerContext) {
    init_feature_flags(ctx);
    init_default_agent_params(ctx);

    init_timer(ctx, "player_regen", |ctx, schedule| {
        let _ = ctx
            .db
            .player_regen_loop_timer()
            .try_insert(PlayerRegenLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "auto_logout", |ctx, schedule| {
        let _ = ctx
            .db
            .auto_logout_loop_timer()
            .try_insert(AutoLogoutLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "resource_regen", |ctx, schedule| {
        let _ = ctx
            .db
            .resource_regen_loop_timer()
            .try_insert(ResourceRegenLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "building_decay", |ctx, schedule| {
        let _ = ctx
            .db
            .building_decay_loop_timer()
            .try_insert(BuildingDecayLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "npc_ai", |ctx, schedule| {
        let _ = ctx.db.npc_ai_loop_timer().try_insert(NpcAiLoopTimer {
            scheduled_id: 0,
            scheduled_at: schedule,
        });
    });
    init_timer(ctx, "day_night", |ctx, schedule| {
        let _ = ctx.db.day_night_loop_timer().try_insert(DayNightLoopTimer {
            scheduled_id: 0,
            scheduled_at: schedule,
        });
    });
    init_timer(ctx, "environment_debuff", |ctx, schedule| {
        let _ = ctx
            .db
            .environment_debuff_loop_timer()
            .try_insert(EnvironmentDebuffLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "chat_cleanup", |ctx, schedule| {
        let _ = ctx
            .db
            .chat_cleanup_loop_timer()
            .try_insert(ChatCleanupLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "session_cleanup", |ctx, schedule| {
        let _ = ctx
            .db
            .session_cleanup_loop_timer()
            .try_insert(SessionCleanupLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
    init_timer(ctx, "metric_snapshot", |ctx, schedule| {
        let _ = ctx
            .db
            .metric_snapshot_loop_timer()
            .try_insert(MetricSnapshotLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

pub fn should_run(ctx: &ReducerContext) -> bool {
    ctx.db
        .feature_flags()
        .id()
        .find(&0)
        .map(|flags| flags.agents_enabled)
        .unwrap_or(false)
}

pub fn should_run_agent(ctx: &ReducerContext, name: &str) -> bool {
    if !should_run(ctx) {
        return false;
    }

    let flags = ctx.db.feature_flags().id().find(&0);
    match name {
        "player_regen" => flags.map(|f| f.player_regen_enabled).unwrap_or(true),
        "auto_logout" => flags.map(|f| f.auto_logout_enabled).unwrap_or(true),
        "resource_regen" => flags.map(|f| f.resource_regen_enabled).unwrap_or(true),
        "building_decay" => flags.map(|f| f.building_decay_enabled).unwrap_or(true),
        "npc_ai" => flags.map(|f| f.npc_ai_enabled).unwrap_or(true),
        "day_night" => flags.map(|f| f.day_night_enabled).unwrap_or(true),
        "environment_debuff" => flags.map(|f| f.environment_debuff_enabled).unwrap_or(true),
        "chat_cleanup" => flags.map(|f| f.chat_cleanup_enabled).unwrap_or(true),
        "session_cleanup" => flags.map(|f| f.session_cleanup_enabled).unwrap_or(true),
        "metric_snapshot" => flags.map(|f| f.metric_snapshot_enabled).unwrap_or(true),
        _ => false,
    }
}

#[spacetimedb::reducer]
pub fn update_scheduled_timers_from_static_data(ctx: &ReducerContext) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }

    update_timer_schedule(ctx, "player_regen", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.player_regen_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .player_regen_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .player_regen_loop_timer()
                .try_insert(PlayerRegenLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "auto_logout", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.auto_logout_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db.auto_logout_loop_timer().scheduled_id().update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .auto_logout_loop_timer()
                .try_insert(AutoLogoutLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "resource_regen", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.resource_regen_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .resource_regen_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .resource_regen_loop_timer()
                .try_insert(ResourceRegenLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "building_decay", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.building_decay_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .building_decay_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .building_decay_loop_timer()
                .try_insert(BuildingDecayLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "npc_ai", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.npc_ai_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db.npc_ai_loop_timer().scheduled_id().update(timer);
        }
        if count == 0 {
            let _ = ctx.db.npc_ai_loop_timer().try_insert(NpcAiLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule_interval(tick_millis),
            });
        }
    });
    update_timer_schedule(ctx, "day_night", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.day_night_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db.day_night_loop_timer().scheduled_id().update(timer);
        }
        if count == 0 {
            let _ = ctx.db.day_night_loop_timer().try_insert(DayNightLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule_interval(tick_millis),
            });
        }
    });
    update_timer_schedule(ctx, "environment_debuff", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.environment_debuff_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .environment_debuff_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .environment_debuff_loop_timer()
                .try_insert(EnvironmentDebuffLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "chat_cleanup", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.chat_cleanup_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .chat_cleanup_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .chat_cleanup_loop_timer()
                .try_insert(ChatCleanupLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "session_cleanup", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.session_cleanup_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .session_cleanup_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .session_cleanup_loop_timer()
                .try_insert(SessionCleanupLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
    update_timer_schedule(ctx, "metric_snapshot", |ctx, tick_millis| {
        let mut count = 0;
        for mut timer in ctx.db.metric_snapshot_loop_timer().iter() {
            count += 1;
            timer.scheduled_at = schedule_interval(tick_millis);
            ctx.db
                .metric_snapshot_loop_timer()
                .scheduled_id()
                .update(timer);
        }
        if count == 0 {
            let _ = ctx
                .db
                .metric_snapshot_loop_timer()
                .try_insert(MetricSnapshotLoopTimer {
                    scheduled_id: 0,
                    scheduled_at: schedule_interval(tick_millis),
                });
        }
    });
}

#[spacetimedb::reducer]
pub fn player_regen_agent_loop(ctx: &ReducerContext, _timer: PlayerRegenLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "player_regen") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::player_regen_agent::run_player_regen(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "player_regen",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "player_regen", |ctx, schedule| {
        let _ = ctx
            .db
            .player_regen_loop_timer()
            .try_insert(PlayerRegenLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn auto_logout_agent_loop(ctx: &ReducerContext, _timer: AutoLogoutLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "auto_logout") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::auto_logout_agent::run_auto_logout(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "auto_logout",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "auto_logout", |ctx, schedule| {
        let _ = ctx
            .db
            .auto_logout_loop_timer()
            .try_insert(AutoLogoutLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn resource_regen_agent_loop(ctx: &ReducerContext, _timer: ResourceRegenLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "resource_regen") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::resource_regen_agent::run_resource_regen(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "resource_regen",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "resource_regen", |ctx, schedule| {
        let _ = ctx
            .db
            .resource_regen_loop_timer()
            .try_insert(ResourceRegenLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn building_decay_agent_loop(ctx: &ReducerContext, _timer: BuildingDecayLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "building_decay") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::building_decay_agent::run_building_decay(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "building_decay",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "building_decay", |ctx, schedule| {
        let _ = ctx
            .db
            .building_decay_loop_timer()
            .try_insert(BuildingDecayLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn npc_ai_agent_loop(ctx: &ReducerContext, _timer: NpcAiLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "npc_ai") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::npc_ai_agent::run_npc_ai_agent(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(ctx, "npc_ai", started_at, completed_at, items, true, None);
    reschedule(ctx, "npc_ai", |ctx, schedule| {
        let _ = ctx.db.npc_ai_loop_timer().try_insert(NpcAiLoopTimer {
            scheduled_id: 0,
            scheduled_at: schedule,
        });
    });
}

#[spacetimedb::reducer]
pub fn day_night_agent_loop(ctx: &ReducerContext, _timer: DayNightLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "day_night") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::day_night_agent::run_day_night(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "day_night",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "day_night", |ctx, schedule| {
        let _ = ctx.db.day_night_loop_timer().try_insert(DayNightLoopTimer {
            scheduled_id: 0,
            scheduled_at: schedule,
        });
    });
}

#[spacetimedb::reducer]
pub fn environment_debuff_agent_loop(ctx: &ReducerContext, _timer: EnvironmentDebuffLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "environment_debuff") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::environment_debuff_agent::run_environment_debuffs(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "environment_debuff",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "environment_debuff", |ctx, schedule| {
        let _ = ctx
            .db
            .environment_debuff_loop_timer()
            .try_insert(EnvironmentDebuffLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn chat_cleanup_agent_loop(ctx: &ReducerContext, _timer: ChatCleanupLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "chat_cleanup") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::chat_cleanup_agent::run_chat_cleanup(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "chat_cleanup",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "chat_cleanup", |ctx, schedule| {
        let _ = ctx
            .db
            .chat_cleanup_loop_timer()
            .try_insert(ChatCleanupLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn session_cleanup_agent_loop(ctx: &ReducerContext, _timer: SessionCleanupLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "session_cleanup") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::session_cleanup_agent::run_session_cleanup(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "session_cleanup",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "session_cleanup", |ctx, schedule| {
        let _ = ctx
            .db
            .session_cleanup_loop_timer()
            .try_insert(SessionCleanupLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

#[spacetimedb::reducer]
pub fn metric_snapshot_agent_loop(ctx: &ReducerContext, _timer: MetricSnapshotLoopTimer) {
    if ServerIdentity::validate_server_or_admin(ctx).is_err() {
        return;
    }
    if !should_run_agent(ctx, "metric_snapshot") {
        return;
    }
    let started_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let items = crate::agents::metric_snapshot_agent::run_metric_snapshot(ctx);
    let completed_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    log_agent_execution(
        ctx,
        "metric_snapshot",
        started_at,
        completed_at,
        items,
        true,
        None,
    );
    reschedule(ctx, "metric_snapshot", |ctx, schedule| {
        let _ = ctx
            .db
            .metric_snapshot_loop_timer()
            .try_insert(MetricSnapshotLoopTimer {
                scheduled_id: 0,
                scheduled_at: schedule,
            });
    });
}

fn init_feature_flags(ctx: &ReducerContext) {
    if ctx.db.feature_flags().id().find(&0).is_none() {
        ctx.db.feature_flags().insert(FeatureFlags {
            id: 0,
            agents_enabled: true,
            player_regen_enabled: true,
            auto_logout_enabled: true,
            resource_regen_enabled: true,
            building_decay_enabled: true,
            npc_ai_enabled: true,
            day_night_enabled: true,
            environment_debuff_enabled: true,
            chat_cleanup_enabled: true,
            session_cleanup_enabled: true,
            metric_snapshot_enabled: true,
        });
    }
}

fn init_default_agent_params(ctx: &ReducerContext) {
    let defaults = [
        ("agent.player_regen_tick_millis", "1000"),
        ("agent.auto_logout_tick_millis", "30000"),
        ("agent.resource_regen_tick_millis", "60000"),
        ("agent.building_decay_tick_millis", "60000"),
        ("agent.npc_ai_tick_millis", "300000"),
        ("agent.day_night_tick_millis", "1000"),
        ("agent.environment_debuff_tick_millis", "5000"),
        ("environment.damage_min_interval_millis", "1000"),
        ("environment.exposure_decay_multiplier", "1.0"),
        ("environment.exposure_gate_threshold", "0"),
        ("agent.chat_cleanup_tick_millis", "3600000"),
        ("agent.session_cleanup_tick_millis", "300000"),
        ("agent.metric_snapshot_tick_millis", "60000"),
        ("resource.respawn_seconds", "300"),
        ("building.decay_per_hour", "50"),
        ("building.wilderness_decay_per_hour", "200"),
        ("building.maintenance_supply_per_hour", "5"),
        ("building.maintenance_repair_per_hour", "5"),
        ("session.auto_logout_idle_seconds", "900"),
        ("session.cleanup_expire_seconds", "86400"),
        ("chat.retention_hours", "48"),
        ("player.min_seconds_to_passive_regen", "10"),
        ("player.satiation_decay_per_tick", "1"),
        ("player.passive_hp_regen_bonus", "5"),
        ("player.passive_stamina_regen_bonus", "5"),
    ];

    for (key, value) in defaults {
        if ctx
            .db
            .balance_params()
            .key()
            .find(&key.to_string())
            .is_none()
        {
            ctx.db.balance_params().insert(BalanceParams {
                key: key.to_string(),
                value: value.to_string(),
                updated_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
            });
        }
    }
}

fn log_agent_execution(
    ctx: &ReducerContext,
    agent_name: &str,
    started_at: u64,
    completed_at: u64,
    items_processed: u32,
    success: bool,
    error_message: Option<String>,
) {
    ctx.db.agent_execution_log().insert(AgentExecutionLog {
        log_id: 0,
        agent_name: agent_name.to_string(),
        started_at,
        completed_at,
        items_processed,
        success,
        error_message,
    });
}

fn get_tick_millis(ctx: &ReducerContext, agent_name: &str) -> u64 {
    let key = format!("agent.{}_tick_millis", agent_name);
    ctx.db
        .balance_params()
        .key()
        .find(&key)
        .and_then(|param| param.value.parse().ok())
        .unwrap_or(1000)
}

fn schedule_interval(tick_millis: u64) -> ScheduleAt {
    ScheduleAt::Interval(Duration::from_millis(tick_millis).into())
}

fn update_timer_schedule<F>(ctx: &ReducerContext, agent_name: &str, mut update_fn: F)
where
    F: FnMut(&ReducerContext, u64),
{
    let tick_millis = get_tick_millis(ctx, agent_name);
    update_fn(ctx, tick_millis);
}

fn init_timer<F>(ctx: &ReducerContext, agent_name: &str, insert_fn: F)
where
    F: FnOnce(&ReducerContext, ScheduleAt),
{
    let tick_millis = get_tick_millis(ctx, agent_name);
    let schedule = schedule_interval(tick_millis);
    insert_fn(ctx, schedule);
}

fn reschedule<F>(ctx: &ReducerContext, agent_name: &str, insert_fn: F)
where
    F: FnOnce(&ReducerContext, ScheduleAt),
{
    let tick_millis = get_tick_millis(ctx, agent_name);
    let schedule = schedule_interval(tick_millis);
    insert_fn(ctx, schedule);
}
