use spacetimedb::{ReducerContext, Table};

use crate::tables::{player_state_trait, skill_def_trait, skill_progress_trait, SkillProgress};

#[spacetimedb::reducer]
pub fn add_skill_xp(ctx: &ReducerContext, skill_id: u64, amount: f32) -> Result<(), String> {
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&ctx.sender)
        .next()
        .ok_or("Player not found".to_string())?;

    let skill_def = ctx
        .db
        .skill_def()
        .skill_id()
        .find(&skill_id)
        .ok_or("Skill not found".to_string())?;

    let mut progress = ctx
        .db
        .skill_progress()
        .entity_id()
        .filter(&player.entity_id)
        .find(|sp| sp.skill_id == skill_id)
        .unwrap_or_else(|| {
            let progress_id = ctx.random();
            let new_progress = SkillProgress {
                progress_id,
                entity_id: player.entity_id,
                skill_id,
                xp: 0,
                level: 0,
                last_gained_at: 0,
            };
            ctx.db.skill_progress().insert(SkillProgress {
                progress_id,
                entity_id: player.entity_id,
                skill_id,
                xp: 0,
                level: 0,
                last_gained_at: 0,
            });
            new_progress
        });

    let total_xp = progress.xp as f64 + amount as f64;
    progress.xp = total_xp as u64;
    progress.level = calculate_level_from_xp(progress.xp);
    progress.last_gained_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    if progress.level > skill_def.max_level {
        progress.level = skill_def.max_level;
        progress.xp = xp_for_level(progress.level);
    }

    ctx.db.skill_progress().progress_id().update(progress);
    Ok(())
}

fn calculate_level_from_xp(xp: u64) -> u32 {
    ((xp as f64) / 100.0).sqrt() as u32
}

fn xp_for_level(level: u32) -> u64 {
    (level as u64).pow(2) * 100
}
