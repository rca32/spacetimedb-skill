use spacetimedb::{ReducerContext, Table};

use crate::services::environment_effects::{decay_exposure, load_effects, upsert_exposure};
use crate::tables::{
    environment_effect_exposure_trait, environment_effect_state_trait, player_state_trait,
    resource_state_trait, session_state_trait, EnvironmentEffectState,
};

const DEFAULT_TICK_MILLIS: u64 = 5000;
const DAMAGE_MIN_INTERVAL_MILLIS: u64 = 1000;

pub fn run_environment_debuffs(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let effects = load_effects(ctx);

    let mut processed = 0u32;
    for session in ctx.db.session_state().iter() {
        let player = ctx
            .db
            .player_state()
            .identity()
            .filter(&session.identity)
            .next();
        let Some(player) = player else {
            continue;
        };
        let entity_id = player.entity_id;
        let mut state = ctx
            .db
            .environment_effect_state()
            .entity_id()
            .find(&entity_id)
            .unwrap_or(EnvironmentEffectState {
                entity_id,
                last_biome_id: 0,
                last_evaluated_at: 0,
                is_submerged: false,
            });

        if now.saturating_sub(state.last_evaluated_at) < DEFAULT_TICK_MILLIS * 1000 {
            continue;
        }

        let mut any_active = false;
        for effect in &effects {
            let tick_interval = if effect.tick_interval_millis > 0 {
                effect.tick_interval_millis as u64
            } else {
                DEFAULT_TICK_MILLIS
            };
            let last_tick = ctx
                .db
                .environment_effect_exposure()
                .entity_id()
                .filter(&entity_id)
                .find(|e| e.effect_id == effect.id)
                .map(|e| e.last_tick_at)
                .unwrap_or(0);
            if now.saturating_sub(last_tick) < tick_interval * 1000 {
                continue;
            }

            any_active = true;
            upsert_exposure(
                ctx,
                entity_id,
                effect.id,
                effect.exposure_per_tick,
                effect.max_exposure,
                now,
            );

            if now.saturating_sub(last_tick) >= DAMAGE_MIN_INTERVAL_MILLIS * 1000 {
                if let Some(mut resource) = ctx.db.resource_state().entity_id().find(&entity_id) {
                    let damage = effect.damage_per_tick.max(0.0) as u32;
                    resource.hp = resource.hp.saturating_sub(damage);
                    ctx.db.resource_state().entity_id().update(resource);
                }
            }
        }

        if !any_active {
            for exposure in ctx
                .db
                .environment_effect_exposure()
                .entity_id()
                .filter(&entity_id)
            {
                decay_exposure(ctx, entity_id, exposure.effect_id, 1, now);
            }
        }

        state.last_evaluated_at = now;
        ctx.db.environment_effect_state().insert(state);
        processed += 1;
    }

    processed
}
