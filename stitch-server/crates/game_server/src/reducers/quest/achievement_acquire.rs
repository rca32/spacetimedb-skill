use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::reward_distribute;
use crate::tables::{
    achievement_def_trait, achievement_state_trait, exploration_state_trait,
    inventory_container_trait, inventory_slot_trait, item_instance_trait, item_stack_trait,
    skill_progress_trait, AchievementState, InputItemStack, KnowledgeEntry,
};

#[spacetimedb::reducer]
pub fn achievement_acquire(ctx: &ReducerContext, achievement_id: u64) -> Result<(), String> {
    let entity_id = get_sender_entity(ctx)?;

    let achievement = ctx
        .db
        .achievement_def()
        .achievement_id()
        .find(&achievement_id)
        .ok_or("Achievement not found".to_string())?;

    let mut state = ctx
        .db
        .achievement_state()
        .entity_id()
        .find(&entity_id)
        .unwrap_or_else(|| {
            let new_state = AchievementState {
                entity_id,
                entries: Vec::new(),
            };
            ctx.db.achievement_state().insert(new_state.clone());
            new_state
        });

    if !prerequisites_met(&state, &achievement.requisites) {
        return Err("Prerequisites not met".to_string());
    }

    if achievement.skill_id != 0 {
        let progress = ctx
            .db
            .skill_progress()
            .entity_id()
            .filter(&entity_id)
            .find(|sp| sp.skill_id == achievement.skill_id)
            .ok_or("Skill progress missing".to_string())?;
        if progress.level < achievement.skill_level {
            return Err("Skill requirement not met".to_string());
        }
    }

    if achievement.chunks_discovered > 0 {
        let exploration = ctx
            .db
            .exploration_state()
            .entity_id()
            .find(&entity_id)
            .ok_or("Exploration state missing".to_string())?;
        if exploration.explored_chunks.len() < achievement.chunks_discovered as usize {
            return Err("Discovery requirement not met".to_string());
        }
    }

    for item_id in achievement
        .item_disc
        .iter()
        .chain(achievement.cargo_disc.iter())
    {
        if count_item(ctx, entity_id, *item_id)? <= 0 {
            return Err("Discovery requirement not met".to_string());
        }
    }

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let mut entry = state
        .entries
        .iter()
        .find(|e| e.achievement_id == achievement_id)
        .cloned()
        .unwrap_or(KnowledgeEntry {
            achievement_id,
            discovered: true,
            acquired: false,
            discovered_at: now,
            acquired_at: 0,
        });

    if entry.acquired {
        return Err("Already acquired".to_string());
    }

    entry.discovered = true;
    if entry.discovered_at == 0 {
        entry.discovered_at = now;
    }
    entry.acquired = true;
    entry.acquired_at = now;

    state.entries.retain(|e| e.achievement_id != achievement_id);
    state.entries.push(entry);
    ctx.db.achievement_state().entity_id().update(state);

    let reward_items: Vec<InputItemStack> = achievement
        .collectible_rewards
        .iter()
        .map(|item_def_id| InputItemStack {
            item_def_id: *item_def_id,
            quantity: 1,
        })
        .collect();
    reward_distribute::grant_items(ctx, entity_id, &reward_items)?;

    Ok(())
}

fn prerequisites_met(state: &AchievementState, requisites: &[u64]) -> bool {
    requisites.iter().all(|req_id| {
        state
            .entries
            .iter()
            .find(|e| e.achievement_id == *req_id)
            .map(|e| e.acquired)
            .unwrap_or(false)
    })
}

fn count_item(ctx: &ReducerContext, entity_id: u64, item_def_id: u64) -> Result<i32, String> {
    let mut total = 0i32;
    for container in ctx
        .db
        .inventory_container()
        .iter()
        .filter(|c| c.owner_entity_id == entity_id)
    {
        for slot in ctx
            .db
            .inventory_slot()
            .container_id()
            .filter(&container.container_id)
        {
            if slot.item_instance_id == 0 || slot.locked {
                continue;
            }
            let instance = ctx
                .db
                .item_instance()
                .item_instance_id()
                .find(&slot.item_instance_id)
                .ok_or("Item instance missing".to_string())?;
            if instance.item_def_id != item_def_id {
                continue;
            }
            let stack = ctx
                .db
                .item_stack()
                .item_instance_id()
                .find(&instance.item_instance_id)
                .ok_or("Item stack missing".to_string())?;
            total += stack.quantity;
        }
    }
    Ok(total)
}
