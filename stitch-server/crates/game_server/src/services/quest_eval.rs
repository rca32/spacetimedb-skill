use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::{
    find_item_def, find_item_instance, find_item_stack, update_slot_volume,
};
use crate::tables::{
    inventory_container_trait, inventory_slot_trait, item_instance_trait, item_stack_trait,
    skill_progress_trait, CompletionCondition, QuestRequirement,
};

pub fn check_requirements(
    ctx: &ReducerContext,
    entity_id: u64,
    requirements: &[QuestRequirement],
) -> Result<(), String> {
    for requirement in requirements {
        if requirement.skill_id != 0 {
            let progress = ctx
                .db
                .skill_progress()
                .entity_id()
                .filter(&entity_id)
                .find(|sp| sp.skill_id == requirement.skill_id)
                .ok_or("Skill progress missing".to_string())?;
            if progress.level < requirement.skill_level {
                return Err("Skill requirement not met".to_string());
            }
        }

        for item in &requirement.item_requirements {
            let available = count_item(ctx, entity_id, item.item_def_id)?;
            if available < item.quantity {
                return Err("Item requirement not met".to_string());
            }
        }
    }

    Ok(())
}

pub fn check_completion_conditions(
    ctx: &ReducerContext,
    entity_id: u64,
    conditions: &[CompletionCondition],
) -> Result<(), String> {
    for condition in conditions {
        for item in &condition.item_requirements {
            let available = count_item(ctx, entity_id, item.item_def_id)?;
            if available < item.quantity {
                return Err("Completion condition not met".to_string());
            }
        }
    }

    for condition in conditions {
        if condition.consume {
            for item in &condition.item_requirements {
                consume_item(ctx, entity_id, item.item_def_id, item.quantity)?;
            }
        }
    }

    Ok(())
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
            let instance = find_item_instance(ctx, slot.item_instance_id)?;
            if instance.item_def_id != item_def_id {
                continue;
            }
            if let Some(stack) = find_item_stack(ctx, instance.item_instance_id) {
                total += stack.quantity;
            }
        }
    }
    Ok(total)
}

fn consume_item(
    ctx: &ReducerContext,
    entity_id: u64,
    item_def_id: u64,
    mut quantity: i32,
) -> Result<(), String> {
    if quantity <= 0 {
        return Ok(());
    }

    for container in ctx
        .db
        .inventory_container()
        .iter()
        .filter(|c| c.owner_entity_id == entity_id)
    {
        for mut slot in ctx
            .db
            .inventory_slot()
            .container_id()
            .filter(&container.container_id)
        {
            if quantity <= 0 {
                return Ok(());
            }
            if slot.item_instance_id == 0 || slot.locked {
                continue;
            }
            let instance = find_item_instance(ctx, slot.item_instance_id)?;
            if instance.item_def_id != item_def_id {
                continue;
            }
            let stack = find_item_stack(ctx, instance.item_instance_id)
                .ok_or("Item stack missing".to_string())?;

            let to_consume = quantity.min(stack.quantity);
            let remaining = stack.quantity - to_consume;
            quantity -= to_consume;

            if remaining <= 0 {
                ctx.db
                    .item_stack()
                    .item_instance_id()
                    .delete(&instance.item_instance_id);
                ctx.db
                    .item_instance()
                    .item_instance_id()
                    .delete(&instance.item_instance_id);
                slot.item_instance_id = 0;
                slot.volume = 0;
                ctx.db.inventory_slot().slot_id().update(slot);
            } else {
                ctx.db
                    .item_stack()
                    .item_instance_id()
                    .update(crate::tables::ItemStackRow {
                        item_instance_id: instance.item_instance_id,
                        quantity: remaining,
                    });
                let item_def = find_item_def(ctx, item_def_id)?;
                update_slot_volume(&mut slot, &item_def, remaining);
                ctx.db.inventory_slot().slot_id().update(slot);
            }
        }
    }

    if quantity > 0 {
        return Err("Insufficient items".to_string());
    }

    Ok(())
}
