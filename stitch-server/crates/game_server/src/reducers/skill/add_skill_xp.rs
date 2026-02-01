use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    ability_def_trait, ability_state_trait, player_state_trait, skill_def_trait,
    skill_progress_trait, AbilityState, SkillProgress,
};

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

    let old_level = progress.level;
    let total_xp = progress.xp as f64 + amount as f64;
    progress.xp = total_xp as u64;
    progress.level = calculate_level_from_xp(progress.xp);
    progress.last_gained_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    // Cap at max level
    if progress.level > skill_def.max_level {
        progress.level = skill_def.max_level;
        progress.xp = xp_for_level(progress.level);
    }

    // Store new level for ability unlock check
    let new_level = progress.level;

    ctx.db.skill_progress().progress_id().update(progress);

    // Check for level up and unlock abilities
    if new_level > old_level {
        unlock_abilities_for_level(ctx, player.entity_id, skill_id, new_level)?;
    }

    Ok(())
}

/// Calculate level from XP using square root curve
fn calculate_level_from_xp(xp: u64) -> u32 {
    ((xp as f64) / 100.0).sqrt() as u32
}

/// Calculate XP required for a specific level
fn xp_for_level(level: u32) -> u64 {
    (level as u64).pow(2) * 100
}

/// Unlock abilities that require this skill at the given level
fn unlock_abilities_for_level(
    ctx: &ReducerContext,
    entity_id: u64,
    skill_id: u64,
    level: u32,
) -> Result<(), String> {
    // Find all abilities that require this skill at or below the current level
    let abilities_to_unlock: Vec<_> = ctx
        .db
        .ability_def()
        .iter()
        .filter(|def| def.required_skill_id == Some(skill_id) && def.required_skill_level <= level)
        .collect();

    for ability_def in abilities_to_unlock {
        // Check if ability is already unlocked
        let already_unlocked = ctx
            .db
            .ability_state()
            .owner_entity_id()
            .filter(&entity_id)
            .any(|state| state.ability_def_id == ability_def.ability_def_id);

        if !already_unlocked {
            // Unlock the ability
            let ability_state = AbilityState {
                entity_id: ctx.random(),
                owner_entity_id: entity_id,
                ability_type: ability_def.ability_type.clone(),
                ability_def_id: ability_def.ability_def_id,
                cooldown_until: 0,
                use_count: 0,
                toolbar_slot: None,
            };
            ctx.db.ability_state().insert(ability_state);
        }
    }

    Ok(())
}
