use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    balance_params_trait, character_stats_trait, combat_state_trait, player_state_trait,
    resource_state_trait, session_state_trait,
};

const DEFAULT_MIN_SECONDS_TO_PASSIVE_REGEN: u64 = 10;
const DEFAULT_SATIATION_DECAY_PER_TICK: u32 = 1;
const DEFAULT_PASSIVE_HP_BONUS: f32 = 5.0;
const DEFAULT_PASSIVE_STAMINA_BONUS: f32 = 5.0;

pub fn run_player_regen(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let min_seconds = get_param_u64(ctx, "player.min_seconds_to_passive_regen")
        .unwrap_or(DEFAULT_MIN_SECONDS_TO_PASSIVE_REGEN);
    let satiation_decay = get_param_u64(ctx, "player.satiation_decay_per_tick")
        .unwrap_or(DEFAULT_SATIATION_DECAY_PER_TICK as u64) as u32;
    let passive_hp_bonus =
        get_param_f32(ctx, "player.passive_hp_regen_bonus").unwrap_or(DEFAULT_PASSIVE_HP_BONUS);
    let passive_stamina_bonus = get_param_f32(ctx, "player.passive_stamina_regen_bonus")
        .unwrap_or(DEFAULT_PASSIVE_STAMINA_BONUS);

    let passive_threshold = min_seconds.saturating_mul(1_000_000);

    let mut updated = 0u32;
    for session in ctx.db.session_state().iter() {
        let Some(player) = ctx
            .db
            .player_state()
            .identity()
            .filter(&session.identity)
            .next()
        else {
            continue;
        };
        let entity_id = player.entity_id;
        let Some(mut resource) = ctx.db.resource_state().entity_id().find(&entity_id) else {
            continue;
        };

        let last_combat = ctx
            .db
            .combat_state()
            .entity_id()
            .find(&entity_id)
            .map(|state| state.last_attacked_timestamp)
            .unwrap_or(0);

        if now.saturating_sub(resource.regen_ts) < 1_000_000 {
            continue;
        }

        let stats = ctx.db.character_stats().entity_id().find(&entity_id);
        let max_hp = stats.as_ref().map(|s| s.max_hp).unwrap_or(resource.hp);
        let max_stamina = stats
            .as_ref()
            .map(|s| s.max_stamina)
            .unwrap_or(resource.stamina);
        let max_satiation = stats
            .as_ref()
            .map(|s| s.max_satiation)
            .unwrap_or(resource.satiation);
        let active_hp = stats.as_ref().map(|s| s.active_hp_regen).unwrap_or(0.0);
        let active_stamina = stats
            .as_ref()
            .map(|s| s.active_stamina_regen)
            .unwrap_or(0.0);

        let passive_ready = now.saturating_sub(last_combat) >= passive_threshold;
        let mut hp_regen = active_hp;
        let mut stamina_regen = active_stamina;
        if passive_ready {
            hp_regen += passive_hp_bonus;
            stamina_regen += passive_stamina_bonus;
        }

        resource.hp = (resource.hp + hp_regen.max(0.0) as u32).min(max_hp);
        resource.stamina = (resource.stamina + stamina_regen.max(0.0) as u32).min(max_stamina);
        resource.satiation = resource
            .satiation
            .saturating_sub(satiation_decay)
            .min(max_satiation);
        resource.regen_ts = now;

        ctx.db.resource_state().entity_id().update(resource);
        updated += 1;
    }

    updated
}

fn get_param_u64(ctx: &ReducerContext, key: &str) -> Option<u64> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}

fn get_param_f32(ctx: &ReducerContext, key: &str) -> Option<f32> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}
