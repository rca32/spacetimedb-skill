use spacetimedb::ReducerContext;

use crate::tables::{
    buff_stat_bonus_trait, character_stats_trait, equipment_stat_bonus_trait,
    knowledge_stat_bonus_trait, CharacterStats,
};

const STAT_MAX_HP: u8 = 1;
const STAT_MAX_STAMINA: u8 = 2;
const STAT_MAX_SATIATION: u8 = 3;
const STAT_HP_REGEN: u8 = 4;
const STAT_STAMINA_REGEN: u8 = 5;
const STAT_COOLDOWN_REDUCTION: u8 = 6;

#[spacetimedb::reducer]
pub fn collect_stats(ctx: &ReducerContext, entity_id: u64) -> Result<(), String> {
    let mut stats = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&entity_id)
        .ok_or("Character stats not found".to_string())?;

    let mut flat = [0.0f32; 7];
    let mut pct = [0.0f32; 7];

    for bonus in ctx.db.equipment_stat_bonus().entity_id().filter(&entity_id) {
        accumulate_bonus(
            &mut flat,
            &mut pct,
            bonus.stat_type,
            bonus.flat_bonus,
            bonus.pct_bonus,
        );
    }

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    for bonus in ctx.db.buff_stat_bonus().entity_id().filter(&entity_id) {
        if bonus.expires_at > now {
            accumulate_bonus(
                &mut flat,
                &mut pct,
                bonus.stat_type,
                bonus.flat_bonus,
                bonus.pct_bonus,
            );
        }
    }

    for bonus in ctx.db.knowledge_stat_bonus().entity_id().filter(&entity_id) {
        if bonus.status == 1 {
            accumulate_bonus(
                &mut flat,
                &mut pct,
                bonus.stat_type,
                bonus.flat_bonus,
                bonus.pct_bonus,
            );
        }
    }

    apply_stat(
        &mut stats,
        STAT_MAX_HP,
        flat[STAT_MAX_HP as usize],
        pct[STAT_MAX_HP as usize],
    );
    apply_stat(
        &mut stats,
        STAT_MAX_STAMINA,
        flat[STAT_MAX_STAMINA as usize],
        pct[STAT_MAX_STAMINA as usize],
    );
    apply_stat(
        &mut stats,
        STAT_MAX_SATIATION,
        flat[STAT_MAX_SATIATION as usize],
        pct[STAT_MAX_SATIATION as usize],
    );
    apply_stat(
        &mut stats,
        STAT_HP_REGEN,
        flat[STAT_HP_REGEN as usize],
        pct[STAT_HP_REGEN as usize],
    );
    apply_stat(
        &mut stats,
        STAT_STAMINA_REGEN,
        flat[STAT_STAMINA_REGEN as usize],
        pct[STAT_STAMINA_REGEN as usize],
    );
    apply_stat(
        &mut stats,
        STAT_COOLDOWN_REDUCTION,
        flat[STAT_COOLDOWN_REDUCTION as usize],
        pct[STAT_COOLDOWN_REDUCTION as usize],
    );

    ctx.db.character_stats().entity_id().update(stats);
    Ok(())
}

fn accumulate_bonus(flat: &mut [f32; 7], pct: &mut [f32; 7], stat: u8, f: f32, p: f32) {
    let idx = stat as usize;
    if idx < flat.len() {
        flat[idx] += f;
        pct[idx] += p;
    }
}

fn apply_stat(stats: &mut CharacterStats, stat: u8, flat: f32, pct: f32) {
    match stat {
        STAT_MAX_HP => {
            let value = apply_bonus(stats.max_hp as f32, flat, pct);
            stats.max_hp = clamp_u32(value, 1.0, 10000.0);
        }
        STAT_MAX_STAMINA => {
            let value = apply_bonus(stats.max_stamina as f32, flat, pct);
            stats.max_stamina = clamp_u32(value, 1.0, 5000.0);
        }
        STAT_MAX_SATIATION => {
            let value = apply_bonus(stats.max_satiation as f32, flat, pct);
            stats.max_satiation = clamp_u32(value, 1.0, 5000.0);
        }
        STAT_HP_REGEN => {
            let value = apply_bonus(stats.active_hp_regen, flat, pct);
            stats.active_hp_regen = value.clamp(0.0, 100.0);
        }
        STAT_STAMINA_REGEN => {
            let value = apply_bonus(stats.active_stamina_regen, flat, pct);
            stats.active_stamina_regen = value.clamp(0.0, 100.0);
        }
        STAT_COOLDOWN_REDUCTION => {
            let value = apply_bonus(stats.cooldown_reduction, flat, pct);
            stats.cooldown_reduction = value.clamp(0.0, 0.5);
        }
        _ => {}
    }
}

fn apply_bonus(base: f32, flat: f32, pct: f32) -> f32 {
    (base + flat) * (1.0 + pct)
}

fn clamp_u32(value: f32, min: f32, max: f32) -> u32 {
    value.clamp(min, max).round() as u32
}
