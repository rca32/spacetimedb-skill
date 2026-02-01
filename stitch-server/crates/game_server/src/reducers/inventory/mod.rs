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
