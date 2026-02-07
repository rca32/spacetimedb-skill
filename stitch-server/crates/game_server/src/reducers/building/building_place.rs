use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::inventory_bootstrap::next_item_instance_id;
use crate::services::permissions;
use crate::tables::{BuildingState, ItemInstance, ItemStack};
use crate::tables::building_state::building_state;
use crate::tables::claim_state::claim_state;
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_def::item_def;
use crate::tables::item_instance::item_instance;
use crate::tables::item_stack::item_stack;
use crate::tables::permission_state::permission_state;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;

#[spacetimedb::reducer]
pub fn building_place(
    ctx: &ReducerContext,
    building_id: u64,
    region_id: u64,
    hex_x: i32,
    hex_z: i32,
    required_item_def_id: u64,
    required_item_qty: u32,
    build_required: u32,
) -> Result<(), String> {
    if required_item_qty == 0 || build_required == 0 {
        return Err("required_item_qty/build_required must be > 0".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active session required".to_string())?;
    if session.region_id != region_id {
        return Err("region mismatch".to_string());
    }

    let transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .ok_or("transform missing".to_string())?;
    let dx = transform.position[0] - hex_x as f32;
    let dz = transform.position[2] - hex_z as f32;
    let dist_sq = dx * dx + dz * dz;
    if dist_sq > 400.0 {
        return Err("too far from build position".to_string());
    }

    if ctx.db.building_state().entity_id().find(building_id).is_some() {
        return Err("building_id already exists".to_string());
    }

    if let Some(claim) = claim_covering(ctx, region_id, hex_x, hex_z) {
        if claim.owner_identity != ctx.sender
            && !permissions::has_permission(ctx, 1, claim.claim_id, permissions::PERM_BUILD)
        {
            return Err("no build permission in claim".to_string());
        }
    }

    let _def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(required_item_def_id)
        .ok_or("required item_def missing".to_string())?;

    consume_items_from_main_inventory(ctx, required_item_def_id, required_item_qty)?;

    ctx.db.building_state().insert(BuildingState {
        entity_id: building_id,
        owner_identity: ctx.sender,
        region_id,
        hex_x,
        hex_z,
        state: 0,
        required_item_def_id,
        required_item_qty,
        build_progress: 0,
        build_required,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    // owner gets build+admin permission on this building
    let key = permissions::permission_key(2, building_id, ctx.sender);
    ctx.db.permission_state().insert(crate::tables::PermissionState {
        permission_key: key,
        target_kind: 2,
        target_id: building_id,
        subject_identity: ctx.sender,
        flags: permissions::PERM_BUILD | permissions::PERM_ADMIN,
    });

    Ok(())
}

fn claim_covering(ctx: &ReducerContext, region_id: u64, x: i32, z: i32) -> Option<crate::tables::ClaimState> {
    ctx.db.claim_state().iter().find(|c| {
        if c.region_id != region_id {
            return false;
        }
        let dx = c.center_x - x;
        let dz = c.center_z - z;
        let r2 = (c.radius as i32) * (c.radius as i32);
        dx * dx + dz * dz <= r2
    })
}

fn consume_items_from_main_inventory(
    ctx: &ReducerContext,
    item_def_id: u64,
    quantity: u32,
) -> Result<(), String> {
    let container = ctx
        .db
        .inventory_container()
        .iter()
        .find(|c| c.owner_identity == ctx.sender && c.inventory_index == 0)
        .ok_or("main inventory container not found".to_string())?;

    let mut remaining = quantity;
    let mut slots: Vec<crate::tables::InventorySlot> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|s| s.container_id == container.container_id && s.item_instance_id != 0)
        .collect();
    slots.sort_by_key(|s| s.slot_index);

    let total_available: u32 = slots
        .iter()
        .filter_map(|slot| {
            let inst = ctx.db.item_instance().item_instance_id().find(slot.item_instance_id)?;
            if inst.item_def_id != item_def_id {
                return None;
            }
            ctx.db
                .item_stack()
                .item_instance_id()
                .find(slot.item_instance_id)
                .map(|s| s.quantity)
        })
        .sum();

    if total_available < quantity {
        return Err("not enough materials in inventory".to_string());
    }

    for slot in slots {
        if remaining == 0 {
            break;
        }

        let inst = match ctx.db.item_instance().item_instance_id().find(slot.item_instance_id) {
            Some(v) => v,
            None => continue,
        };
        if inst.item_def_id != item_def_id {
            continue;
        }

        let mut stack = match ctx.db.item_stack().item_instance_id().find(slot.item_instance_id) {
            Some(v) => v,
            None => continue,
        };

        let taken = stack.quantity.min(remaining);
        stack.quantity -= taken;
        remaining -= taken;

        if stack.quantity == 0 {
            ctx.db.item_stack().item_instance_id().delete(slot.item_instance_id);
            ctx.db.item_instance().item_instance_id().delete(slot.item_instance_id);

            let mut next_slot = slot;
            next_slot.item_instance_id = 0;
            ctx.db.inventory_slot().slot_key().update(next_slot);
        } else {
            ctx.db.item_stack().item_instance_id().update(stack);
        }
    }

    Ok(())
}

pub(crate) fn add_items_to_main_inventory(
    ctx: &ReducerContext,
    item_def_id: u64,
    quantity: u32,
) -> Result<(), String> {
    let container = ctx
        .db
        .inventory_container()
        .iter()
        .find(|c| c.owner_identity == ctx.sender && c.inventory_index == 0)
        .ok_or("main inventory container not found".to_string())?;

    let item_def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(item_def_id)
        .ok_or("item_def not found".to_string())?;

    let mut remaining = quantity;

    // merge into existing stacks first
    let mut slots: Vec<crate::tables::InventorySlot> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|s| s.container_id == container.container_id && s.item_instance_id != 0)
        .collect();
    slots.sort_by_key(|s| s.slot_index);

    for slot in slots {
        if remaining == 0 {
            break;
        }
        let inst = match ctx.db.item_instance().item_instance_id().find(slot.item_instance_id) {
            Some(v) => v,
            None => continue,
        };
        if inst.item_def_id != item_def_id {
            continue;
        }

        let mut stack = match ctx.db.item_stack().item_instance_id().find(slot.item_instance_id) {
            Some(v) => v,
            None => continue,
        };

        if stack.quantity >= item_def.max_stack {
            continue;
        }

        let can_add = item_def.max_stack - stack.quantity;
        let delta = can_add.min(remaining);
        stack.quantity += delta;
        remaining -= delta;
        ctx.db.item_stack().item_instance_id().update(stack);
    }

    if remaining == 0 {
        return Ok(());
    }

    let empty_slots: Vec<crate::tables::InventorySlot> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|s| s.container_id == container.container_id && s.item_instance_id == 0)
        .collect();

    for mut slot in empty_slots {
        if remaining == 0 {
            break;
        }

        let put = remaining.min(item_def.max_stack);
        let new_instance = next_item_instance_id(ctx);
        ctx.db.item_instance().insert(ItemInstance {
            item_instance_id: new_instance,
            item_def_id,
            item_type: 0,
            durability: 100,
            bound: false,
        });
        ctx.db.item_stack().insert(ItemStack {
            item_instance_id: new_instance,
            quantity: put,
        });

        slot.item_instance_id = new_instance;
        ctx.db.inventory_slot().slot_key().update(slot);
        remaining -= put;
    }

    if remaining > 0 {
        return Err("no inventory space for refund".to_string());
    }

    Ok(())
}
