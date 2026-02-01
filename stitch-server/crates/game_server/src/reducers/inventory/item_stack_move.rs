use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::{
    ensure_slot, find_item_def, find_item_instance, find_item_stack, max_stack_for_slot,
    pocket_volume, update_slot_volume,
};
use crate::tables::{
    inventory_slot_trait, item_instance_trait, item_stack_trait, InventorySlot, ItemStackRow,
};

#[spacetimedb::reducer]
pub fn item_stack_move(
    ctx: &ReducerContext,
    from_container_id: u64,
    from_slot_index: u32,
    to_container_id: u64,
    to_slot_index: u32,
    quantity: i32,
) -> Result<(), String> {
    if quantity <= 0 {
        return Err("Quantity must be positive".to_string());
    }

    let from_container = crate::reducers::inventory::get_container(ctx, from_container_id)?;
    let to_container = crate::reducers::inventory::get_container(ctx, to_container_id)?;

    let mut from_slot = ensure_slot(ctx, &from_container, from_slot_index)?;
    if from_slot.locked {
        return Err("Source slot locked".to_string());
    }

    let mut to_slot = ensure_slot(ctx, &to_container, to_slot_index)?;
    if to_slot.locked {
        return Err("Destination slot locked".to_string());
    }

    if from_slot.item_instance_id == 0 {
        return Err("Source slot empty".to_string());
    }

    let from_instance = find_item_instance(ctx, from_slot.item_instance_id)?;
    let from_def = find_item_def(ctx, from_instance.item_def_id)?;
    let from_stack = find_item_stack(ctx, from_instance.item_instance_id)
        .ok_or("Source stack missing".to_string())?;

    if quantity > from_stack.quantity {
        return Err("Insufficient quantity".to_string());
    }

    let pocket = pocket_volume(&to_container, to_slot_index);
    let max_per_slot = max_stack_for_slot(&from_def, pocket);
    if max_per_slot <= 0 {
        return Err("Slot has no capacity".to_string());
    }

    if to_slot.item_instance_id == 0 {
        if quantity > max_per_slot {
            return Err("Overflow".to_string());
        }

        to_slot.item_instance_id = from_instance.item_instance_id;
        update_slot_volume(&mut to_slot, &from_def, quantity);
        ctx.db.inventory_slot().slot_id().update(to_slot);
    } else {
        let to_instance = find_item_instance(ctx, to_slot.item_instance_id)?;
        if to_instance.item_def_id != from_instance.item_def_id
            || to_instance.item_type != from_instance.item_type
            || to_instance.durability != from_instance.durability
        {
            return Err("Incompatible stack".to_string());
        }

        let mut to_stack = find_item_stack(ctx, to_instance.item_instance_id)
            .ok_or("Destination stack missing".to_string())?;
        if to_stack.quantity + quantity > max_per_slot {
            return Err("Overflow".to_string());
        }

        to_stack.quantity += quantity;
        ctx.db
            .item_stack()
            .item_instance_id()
            .update(to_stack.clone());
        update_slot_volume(&mut to_slot, &from_def, to_stack.quantity);
        ctx.db.inventory_slot().slot_id().update(to_slot);
    }

    let remaining = from_stack.quantity - quantity;
    if remaining <= 0 {
        from_slot.item_instance_id = 0;
        from_slot.volume = 0;
        ctx.db.inventory_slot().slot_id().update(from_slot);
        ctx.db
            .item_stack()
            .item_instance_id()
            .delete(&from_instance.item_instance_id);
        ctx.db
            .item_instance()
            .item_instance_id()
            .delete(&from_instance.item_instance_id);
    } else {
        ctx.db.item_stack().item_instance_id().update(ItemStackRow {
            item_instance_id: from_stack.item_instance_id,
            quantity: remaining,
        });
        update_slot_volume(&mut from_slot, &from_def, remaining);
        ctx.db.inventory_slot().slot_id().update(from_slot);
    }

    Ok(())
}
