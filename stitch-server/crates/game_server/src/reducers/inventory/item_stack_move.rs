use spacetimedb::{ReducerContext, Table};

use crate::services::economy;
use crate::tables::{ItemInstance, ItemStack};
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_def::item_def;
use crate::tables::item_instance::item_instance;
use crate::tables::item_stack::item_stack;

use super::inventory_bootstrap::{next_item_instance_id, slot_key};
use super::inventory_lock::{ensure_not_locked, ensure_owner};

#[spacetimedb::reducer]
pub fn item_stack_move(
    ctx: &ReducerContext,
    container_id: u64,
    from_slot_index: u32,
    to_slot_index: u32,
    quantity: u32,
) -> Result<(), String> {
    if quantity == 0 {
        return Err("quantity must be > 0".to_string());
    }
    if from_slot_index == to_slot_index {
        return Ok(());
    }

    ensure_owner(ctx, container_id)?;
    ensure_not_locked(ctx, container_id)?;

    let from_key = slot_key(container_id, from_slot_index);
    let to_key = slot_key(container_id, to_slot_index);

    let mut from_slot = ctx
        .db
        .inventory_slot()
        .slot_key()
        .find(from_key.clone())
        .ok_or("from slot not found".to_string())?;
    let mut to_slot = ctx
        .db
        .inventory_slot()
        .slot_key()
        .find(to_key.clone())
        .ok_or("to slot not found".to_string())?;

    if from_slot.locked || to_slot.locked {
        return Err("slot is locked".to_string());
    }
    if from_slot.item_instance_id == 0 {
        return Err("from slot is empty".to_string());
    }

    let src_instance = ctx
        .db
        .item_instance()
        .item_instance_id()
        .find(from_slot.item_instance_id)
        .ok_or("source item instance missing".to_string())?;
    let mut src_stack = ctx
        .db
        .item_stack()
        .item_instance_id()
        .find(from_slot.item_instance_id)
        .ok_or("source item stack missing".to_string())?;

    let move_qty = quantity.min(src_stack.quantity);
    if move_qty == 0 {
        return Ok(());
    }

    let item_def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(src_instance.item_def_id)
        .ok_or("item_def missing".to_string())?;

    if to_slot.item_instance_id != 0 {
        let target_instance = ctx
            .db
            .item_instance()
            .item_instance_id()
            .find(to_slot.item_instance_id)
            .ok_or("target item instance missing".to_string())?;

        if target_instance.item_def_id != src_instance.item_def_id {
            return Err("target slot has different item type".to_string());
        }

        let mut target_stack = ctx
            .db
            .item_stack()
            .item_instance_id()
            .find(to_slot.item_instance_id)
            .ok_or("target item stack missing".to_string())?;

        let merged = target_stack.quantity.saturating_add(move_qty);
        if merged > item_def.max_stack {
            return Err("max_stack exceeded".to_string());
        }

        if !economy::slot_can_accept(
            ctx,
            to_slot.volume,
            src_instance.item_def_id,
            to_slot.item_instance_id,
            move_qty,
        )? {
            return Err("slot capacity exceeded".to_string());
        }

        target_stack.quantity = merged;
        src_stack.quantity = src_stack.quantity.saturating_sub(move_qty);

        ctx.db.item_stack().item_instance_id().update(target_stack);
        if src_stack.quantity == 0 {
            ctx.db.item_stack().item_instance_id().delete(src_instance.item_instance_id);
            ctx.db.item_instance().item_instance_id().delete(src_instance.item_instance_id);
            from_slot.item_instance_id = 0;
            ctx.db.inventory_slot().slot_key().update(from_slot);
        } else {
            ctx.db.item_stack().item_instance_id().update(src_stack);
        }

        return Ok(());
    }

    if !economy::slot_can_accept(ctx, to_slot.volume, src_instance.item_def_id, 0, move_qty)? {
        return Err("slot capacity exceeded".to_string());
    }

    if move_qty == src_stack.quantity {
        from_slot.item_instance_id = 0;
        to_slot.item_instance_id = src_instance.item_instance_id;
        ctx.db.inventory_slot().slot_key().update(from_slot);
        ctx.db.inventory_slot().slot_key().update(to_slot);
        return Ok(());
    }

    let new_item_instance_id = next_item_instance_id(ctx);
    ctx.db.item_instance().insert(ItemInstance {
        item_instance_id: new_item_instance_id,
        item_def_id: src_instance.item_def_id,
        item_type: src_instance.item_type,
        durability: src_instance.durability,
        bound: src_instance.bound,
    });
    ctx.db.item_stack().insert(ItemStack {
        item_instance_id: new_item_instance_id,
        quantity: move_qty,
    });

    src_stack.quantity = src_stack.quantity.saturating_sub(move_qty);
    ctx.db.item_stack().item_instance_id().update(src_stack);

    to_slot.item_instance_id = new_item_instance_id;
    ctx.db.inventory_slot().slot_key().update(to_slot);

    Ok(())
}
