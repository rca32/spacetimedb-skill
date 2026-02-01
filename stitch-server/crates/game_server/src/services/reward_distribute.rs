use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::{
    ensure_slot, find_item_def, find_item_instance, find_item_stack, max_stack_for_slot,
    pocket_volume, slot_item_type, update_slot_volume,
};
use crate::tables::{
    inventory_container_trait, inventory_slot_trait, item_instance_trait, item_stack_trait,
    skill_def_trait, skill_progress_trait, InputItemStack, ItemInstance, ItemStackRow,
    SkillProgress, SkillReward,
};

pub fn grant_items(
    ctx: &ReducerContext,
    entity_id: u64,
    rewards: &[InputItemStack],
) -> Result<(), String> {
    let container = ctx
        .db
        .inventory_container()
        .iter()
        .find(|c| c.owner_entity_id == entity_id)
        .ok_or("Inventory container not found".to_string())?;

    for reward in rewards {
        let _ = add_to_container(
            ctx,
            &container,
            reward.item_def_id,
            reward.quantity,
            None,
            false,
        )?;
    }

    Ok(())
}

pub fn grant_skill_rewards(
    ctx: &ReducerContext,
    entity_id: u64,
    rewards: &[SkillReward],
) -> Result<(), String> {
    for reward in rewards {
        let skill_def = ctx
            .db
            .skill_def()
            .skill_id()
            .find(&reward.skill_id)
            .ok_or("Skill not found".to_string())?;

        let mut progress = ctx
            .db
            .skill_progress()
            .entity_id()
            .filter(&entity_id)
            .find(|sp| sp.skill_id == reward.skill_id)
            .unwrap_or_else(|| {
                let progress_id = ctx.random();
                ctx.db.skill_progress().insert(SkillProgress {
                    progress_id,
                    entity_id,
                    skill_id: reward.skill_id,
                    xp: 0,
                    level: 0,
                    last_gained_at: 0,
                })
            });

        let total_xp = progress.xp as f64 + reward.xp as f64;
        progress.xp = total_xp as u64;
        progress.level = calculate_level_from_xp(progress.xp);
        progress.last_gained_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;

        if progress.level > skill_def.max_level {
            progress.level = skill_def.max_level;
            progress.xp = xp_for_level(progress.level);
        }

        ctx.db.skill_progress().progress_id().update(progress);
    }

    Ok(())
}

fn add_to_container(
    ctx: &ReducerContext,
    container: &crate::tables::InventoryContainer,
    item_def_id: u64,
    quantity: i32,
    durability: Option<i32>,
    bound: bool,
) -> Result<i32, String> {
    if quantity <= 0 {
        return Ok(0);
    }

    let item_def = find_item_def(ctx, item_def_id)?;
    if item_def.auto_collect {
        return Ok(0);
    }

    let mut remaining = quantity;

    for mut slot in ctx
        .db
        .inventory_slot()
        .container_id()
        .filter(&container.container_id)
    {
        if slot.locked || slot.item_instance_id == 0 {
            continue;
        }
        let instance = find_item_instance(ctx, slot.item_instance_id)?;
        if instance.item_def_id != item_def.item_def_id
            || instance.item_type != item_def.item_type
            || instance.durability != durability
        {
            continue;
        }

        let stack =
            find_item_stack(ctx, instance.item_instance_id).ok_or("Stack missing".to_string())?;
        let pocket = pocket_volume(container, slot.slot_index);
        let max_per_slot = max_stack_for_slot(&item_def, pocket);
        let capacity = max_per_slot - stack.quantity;
        if capacity <= 0 {
            continue;
        }

        let to_add = remaining.min(capacity);
        let new_qty = stack.quantity + to_add;
        ctx.db.item_stack().item_instance_id().update(ItemStackRow {
            item_instance_id: stack.item_instance_id,
            quantity: new_qty,
        });
        update_slot_volume(&mut slot, &item_def, new_qty);
        ctx.db.inventory_slot().slot_id().update(slot);
        remaining -= to_add;
        if remaining == 0 {
            return Ok(0);
        }
    }

    for slot_index in 0..(container.slot_count as u32) {
        if remaining == 0 {
            break;
        }

        let mut slot = ensure_slot(ctx, container, slot_index)?;
        if slot.locked || slot.item_instance_id != 0 {
            continue;
        }

        if slot_item_type(container, slot_index) != item_def.item_type {
            continue;
        }

        let pocket = pocket_volume(container, slot_index);
        let max_per_slot = max_stack_for_slot(&item_def, pocket);
        if max_per_slot <= 0 {
            continue;
        }

        let to_add = remaining.min(max_per_slot);
        let instance_id = ctx.random();
        ctx.db.item_instance().insert(ItemInstance {
            item_instance_id: instance_id,
            item_def_id: item_def.item_def_id,
            item_type: item_def.item_type,
            durability,
            bound,
        });
        ctx.db.item_stack().insert(ItemStackRow {
            item_instance_id: instance_id,
            quantity: to_add,
        });

        slot.item_instance_id = instance_id;
        update_slot_volume(&mut slot, &item_def, to_add);
        ctx.db.inventory_slot().slot_id().update(slot);
        remaining -= to_add;
    }

    Ok(remaining)
}

fn calculate_level_from_xp(xp: u64) -> u32 {
    ((xp as f64) / 100.0).sqrt() as u32
}

fn xp_for_level(level: u32) -> u64 {
    (level as u64).pow(2) * 100
}
