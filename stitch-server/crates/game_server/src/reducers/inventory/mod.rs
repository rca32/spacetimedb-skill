use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    inventory_container_trait, inventory_slot_trait, item_def_trait, item_instance_trait,
    item_list_def_trait, item_stack_trait, InventoryContainer, InventorySlot, ItemDef,
    ItemInstance, ItemListDef, ItemStackRow,
};

pub const ITEM_TYPE_ITEM: u8 = 0;
pub const ITEM_TYPE_CARGO: u8 = 1;

pub fn get_container(
    ctx: &ReducerContext,
    container_id: u64,
) -> Result<InventoryContainer, String> {
    ctx.db
        .inventory_container()
        .container_id()
        .find(&container_id)
        .ok_or("Container not found".to_string())
}

pub fn get_slot(ctx: &ReducerContext, container_id: u64, slot_index: u32) -> Option<InventorySlot> {
    ctx.db
        .inventory_slot()
        .container_id()
        .filter(&container_id)
        .find(|slot| slot.slot_index == slot_index)
}

pub fn ensure_slot(
    ctx: &ReducerContext,
    container: &InventoryContainer,
    slot_index: u32,
) -> Result<InventorySlot, String> {
    if slot_index as i32 >= container.slot_count {
        return Err("Slot index out of range".to_string());
    }

    if let Some(slot) = get_slot(ctx, container.container_id, slot_index) {
        return Ok(slot);
    }

    let item_type = slot_item_type(container, slot_index);
    let slot = InventorySlot {
        slot_id: ctx.random(),
        container_id: container.container_id,
        slot_index,
        item_instance_id: 0,
        volume: 0,
        locked: false,
        item_type,
    };
    ctx.db.inventory_slot().insert(slot.clone());
    Ok(slot)
}

pub fn slot_item_type(container: &InventoryContainer, slot_index: u32) -> u8 {
    if (slot_index as i32) >= container.cargo_index {
        ITEM_TYPE_CARGO
    } else {
        ITEM_TYPE_ITEM
    }
}

pub fn pocket_volume(container: &InventoryContainer, slot_index: u32) -> i32 {
    if (slot_index as i32) >= container.cargo_index {
        container.cargo_pocket_volume
    } else {
        container.item_pocket_volume
    }
}

pub fn max_stack_for_slot(item_def: &ItemDef, pocket_volume: i32) -> i32 {
    let max_stack = item_def.max_stack as i32;
    if item_def.volume <= 0 {
        return max_stack.max(1);
    }

    let by_volume = pocket_volume / item_def.volume;
    max_stack.min(by_volume).max(0)
}

pub fn find_item_def(ctx: &ReducerContext, item_def_id: u64) -> Result<ItemDef, String> {
    ctx.db
        .item_def()
        .item_def_id()
        .find(&item_def_id)
        .ok_or("Item def not found".to_string())
}

pub fn find_item_instance(
    ctx: &ReducerContext,
    item_instance_id: u64,
) -> Result<ItemInstance, String> {
    ctx.db
        .item_instance()
        .item_instance_id()
        .find(&item_instance_id)
        .ok_or("Item instance not found".to_string())
}

pub fn find_item_stack(ctx: &ReducerContext, item_instance_id: u64) -> Option<ItemStackRow> {
    ctx.db
        .item_stack()
        .item_instance_id()
        .find(&item_instance_id)
}

pub fn update_slot_volume(slot: &mut InventorySlot, item_def: &ItemDef, quantity: i32) {
    slot.volume = item_def.volume.saturating_mul(quantity);
}

pub fn roll_item_list(ctx: &ReducerContext, item_list_id: u64) -> Result<ItemListDef, String> {
    ctx.db
        .item_list_def()
        .item_list_id()
        .find(&item_list_id)
        .ok_or("Item list not found".to_string())
}

/// Add items to a container, handling partial stack merging
/// This function tries to merge with existing stacks first, then fills empty slots
/// Returns the quantity that was successfully added (may be partial if container is full)
pub fn add_partial(
    ctx: &ReducerContext,
    container: &InventoryContainer,
    item_def_id: u64,
    quantity: i32,
    durability: Option<i32>,
    bound: bool,
) -> Result<i32, String> {
    if quantity <= 0 {
        return Ok(0);
    }

    let item_def = find_item_def(ctx, item_def_id)?;

    // Handle auto-collect items
    if item_def.auto_collect {
        return Ok(quantity);
    }

    let mut remaining = quantity;

    // Phase 1: Try to merge with existing stacks of the same item
    for mut slot in ctx
        .db
        .inventory_slot()
        .container_id()
        .filter(&container.container_id)
    {
        if remaining <= 0 {
            break;
        }

        if slot.locked || slot.item_instance_id == 0 {
            continue;
        }

        let instance = match find_item_instance(ctx, slot.item_instance_id) {
            Ok(inst) => inst,
            Err(_) => continue,
        };

        // Check if item matches (same def_id, type, durability, and bound status)
        if instance.item_def_id != item_def.item_def_id
            || instance.item_type != item_def.item_type
            || instance.durability != durability
            || instance.bound != bound
        {
            continue;
        }

        let stack = match find_item_stack(ctx, instance.item_instance_id) {
            Some(s) => s,
            None => continue,
        };

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
    }

    // Phase 2: Fill empty slots
    for slot_index in 0..(container.slot_count as u32) {
        if remaining <= 0 {
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

    // Return how many were actually added
    Ok(quantity - remaining)
}
