use std::hash::{Hash, Hasher};

use spacetimedb::{ReducerContext, Table};

use crate::tables::{InventoryContainer, InventorySlot, ItemInstance, ItemStack};
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_instance::item_instance;
use crate::tables::item_stack::item_stack;

const DEFAULT_MAIN_SLOT_COUNT: u32 = 16;
const DEFAULT_SLOT_VOLUME: i32 = 120;

#[spacetimedb::reducer]
pub fn inventory_bootstrap(ctx: &ReducerContext) -> Result<(), String> {
    let container_id = default_container_id(ctx);

    if ctx
        .db
        .inventory_container()
        .container_id()
        .find(container_id)
        .is_some()
    {
        return Ok(());
    }

    ctx.db.inventory_container().insert(InventoryContainer {
        container_id,
        owner_identity: ctx.sender,
        inventory_index: 0,
        cargo_index: 12,
        slot_count: DEFAULT_MAIN_SLOT_COUNT,
        item_pocket_volume: DEFAULT_SLOT_VOLUME,
        cargo_pocket_volume: DEFAULT_SLOT_VOLUME,
    });

    for slot_index in 0..DEFAULT_MAIN_SLOT_COUNT {
        ctx.db.inventory_slot().insert(InventorySlot {
            slot_key: slot_key(container_id, slot_index),
            container_id,
            slot_index,
            item_instance_id: 0,
            volume: DEFAULT_SLOT_VOLUME,
            locked: false,
            item_type: if slot_index >= 12 { 1 } else { 0 },
        });
    }

    // Seed one starter stack (wood x10) so query path is immediately testable.
    let starter_instance_id = next_item_instance_id(ctx);
    ctx.db.item_instance().insert(ItemInstance {
        item_instance_id: starter_instance_id,
        item_def_id: 1,
        item_type: 0,
        durability: 100,
        bound: false,
    });
    ctx.db.item_stack().insert(ItemStack {
        item_instance_id: starter_instance_id,
        quantity: 10,
    });

    let mut slot0 = ctx
        .db
        .inventory_slot()
        .slot_key()
        .find(slot_key(container_id, 0))
        .ok_or("slot 0 missing".to_string())?;
    slot0.item_instance_id = starter_instance_id;
    ctx.db.inventory_slot().slot_key().update(slot0);

    Ok(())
}

pub(crate) fn slot_key(container_id: u64, slot_index: u32) -> String {
    format!("{container_id}:{slot_index}")
}

pub(crate) fn next_item_instance_id(ctx: &ReducerContext) -> u64 {
    ctx.db
        .item_instance()
        .iter()
        .map(|row| row.item_instance_id)
        .max()
        .unwrap_or(0)
        .saturating_add(1)
}

fn default_container_id(ctx: &ReducerContext) -> u64 {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    ctx.sender.to_string().hash(&mut hasher);
    hasher.finish()
}
