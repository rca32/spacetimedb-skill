use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::{
    ensure_slot, find_item_def, find_item_instance, find_item_stack, update_slot_volume,
};
use crate::tables::{inventory_slot_trait, item_instance_trait, item_stack_trait, ItemStackRow};

#[spacetimedb::reducer]
pub fn item_drop(
    ctx: &ReducerContext,
    container_id: u64,
    slot_index: u32,
    quantity: i32,
) -> Result<(), String> {
    if quantity <= 0 {
        return Err("Quantity must be positive".to_string());
    }

    let container = crate::reducers::inventory::get_container(ctx, container_id)?;
    let mut slot = ensure_slot(ctx, &container, slot_index)?;
    if slot.locked {
        return Err("Slot locked".to_string());
    }

    if slot.item_instance_id == 0 {
        return Err("Slot empty".to_string());
    }

    let instance = find_item_instance(ctx, slot.item_instance_id)?;
    let item_def = find_item_def(ctx, instance.item_def_id)?;
    let stack =
        find_item_stack(ctx, instance.item_instance_id).ok_or("Stack missing".to_string())?;

    if quantity > stack.quantity {
        return Err("Insufficient quantity".to_string());
    }

    let remaining = stack.quantity - quantity;
    if remaining <= 0 {
        slot.item_instance_id = 0;
        slot.volume = 0;
        ctx.db.inventory_slot().slot_id().update(slot);
        ctx.db
            .item_stack()
            .item_instance_id()
            .delete(&instance.item_instance_id);
        ctx.db
            .item_instance()
            .item_instance_id()
            .delete(&instance.item_instance_id);
    } else {
        ctx.db.item_stack().item_instance_id().update(ItemStackRow {
            item_instance_id: stack.item_instance_id,
            quantity: remaining,
        });
        update_slot_volume(&mut slot, &item_def, remaining);
        ctx.db.inventory_slot().slot_id().update(slot);
    }

    Ok(())
}
