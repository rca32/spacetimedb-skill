use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    environment_effect_desc_trait, environment_effect_exposure_trait, EnvironmentEffectDesc,
    EnvironmentEffectExposure,
};

pub fn load_effects(ctx: &ReducerContext) -> Vec<EnvironmentEffectDesc> {
    ctx.db.environment_effect_desc().iter().collect()
}

pub fn upsert_exposure(
    ctx: &ReducerContext,
    entity_id: u64,
    effect_id: i32,
    delta: i32,
    max_exposure: i32,
    now: u64,
) {
    let exposure = ctx
        .db
        .environment_effect_exposure()
        .entity_id()
        .filter(&entity_id)
        .find(|e| e.effect_id == effect_id);

    if let Some(mut entry) = exposure {
        entry.exposure = (entry.exposure + delta).clamp(0, max_exposure);
        entry.last_tick_at = now;
        ctx.db
            .environment_effect_exposure()
            .exposure_id()
            .update(entry);
    } else {
        ctx.db
            .environment_effect_exposure()
            .insert(EnvironmentEffectExposure {
                exposure_id: 0,
                entity_id,
                effect_id,
                exposure: delta.clamp(0, max_exposure),
                last_tick_at: now,
            });
    }
}

pub fn decay_exposure(ctx: &ReducerContext, entity_id: u64, effect_id: i32, decay: i32, now: u64) {
    if let Some(mut entry) = ctx
        .db
        .environment_effect_exposure()
        .entity_id()
        .filter(&entity_id)
        .find(|e| e.effect_id == effect_id)
    {
        entry.exposure = (entry.exposure - decay).max(0);
        entry.last_tick_at = now;
        ctx.db
            .environment_effect_exposure()
            .exposure_id()
            .update(entry);
    }
}
