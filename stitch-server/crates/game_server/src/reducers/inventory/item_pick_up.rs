use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::{
    ensure_slot, find_item_def, find_item_instance, find_item_stack, max_stack_for_slot,
    pocket_volume, roll_item_list, slot_item_type, update_slot_volume,
};
use crate::tables::{
    inventory_slot_trait, item_instance_trait, item_stack_trait, ItemInstance, ItemStackRow,
};

#[spacetimedb::reducer]
pub fn item_pick_up(
    ctx: &ReducerContext,
    container_id: u64,
    item_instance_id: u64,
    quantity: i32,
) -> Result<(), String> {
    if quantity <= 0 {
        return Err("Quantity must be positive".to_string());
    }

    let container = crate::reducers::inventory::get_container(ctx, container_id)?;
    let source_instance = find_item_instance(ctx, item_instance_id)?;
    let source_stack =
        find_item_stack(ctx, item_instance_id).ok_or("Item stack missing".to_string())?;
    if quantity > source_stack.quantity {
        return Err("Insufficient quantity".to_string());
    }

    let source_def = find_item_def(ctx, source_instance.item_def_id)?;
    if source_def.item_list_id != 0 {
        let list_def = roll_item_list(ctx, source_def.item_list_id)?;
        for entry in list_def.entries {
            if entry.probability <= 0.0 {
                continue;
            }
            let roll = (ctx.random() % 1_000_000) as f32 / 1_000_000.0;
            if roll > entry.probability {
                continue;
            }
            for stack in entry.stacks {
                add_to_container(
                    ctx,
                    &container,
                    stack.item_def_id,
                    stack.quantity,
                    None,
                    false,
                )?;
            }
            break;
        }

        ctx.db
            .item_stack()
            .item_instance_id()
            .delete(&item_instance_id);
        ctx.db
            .item_instance()
            .item_instance_id()
            .delete(&item_instance_id);
        return Ok(());
    }

    add_to_container(
        ctx,
        &container,
        source_instance.item_def_id,
        quantity,
        source_instance.durability,
        source_instance.bound,
    )?;

    let remaining = source_stack.quantity - quantity;
    if remaining <= 0 {
        ctx.db
            .item_stack()
            .item_instance_id()
            .delete(&item_instance_id);
        ctx.db
            .item_instance()
            .item_instance_id()
            .delete(&item_instance_id);
    } else {
        ctx.db.item_stack().item_instance_id().update(ItemStackRow {
            item_instance_id,
            quantity: remaining,
        });
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
) -> Result<(), String> {
    if quantity <= 0 {
        return Ok(());
    }

    let mut item_def = find_item_def(ctx, item_def_id)?;
    let mut durability = durability;

    if let Some(dur) = durability {
        if dur <= 0 {
            if item_def.convert_on_zero_durability == 0 {
                return Ok(());
            }
            item_def = find_item_def(ctx, item_def.convert_on_zero_durability)?;
            durability = None;
        }
    }

    if item_def.auto_collect {
        record_discovery(ctx, container.owner_entity_id, item_def.item_def_id)?;
        return Ok(());
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
            record_discovery(ctx, container.owner_entity_id, item_def.item_def_id)?;
            return Ok(());
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

    if remaining > 0 {
        return Err("Overflow".to_string());
    }

    record_discovery(ctx, container.owner_entity_id, item_def.item_def_id)?;
    Ok(())
}

fn record_discovery(
    _ctx: &ReducerContext,
    _owner_entity_id: u64,
    _item_def_id: u64,
) -> Result<(), String> {
    Ok(())
}
