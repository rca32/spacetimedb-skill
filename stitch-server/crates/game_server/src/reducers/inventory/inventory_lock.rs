use spacetimedb::{ReducerContext, Table};

use crate::tables::InventoryLock;
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_lock::inventory_lock as inventory_lock_table;

#[spacetimedb::reducer]
pub fn lock_inventory_container(
    ctx: &ReducerContext,
    container_id: u64,
    reason: String,
) -> Result<(), String> {
    ensure_owner(ctx, container_id)?;

    let existing = ctx.db.inventory_lock().container_id().find(container_id);
    if existing.is_some() {
        return Err("container already locked".to_string());
    }

    ctx.db.inventory_lock().insert(InventoryLock {
        container_id,
        lock_reason: reason,
        locked_by: ctx.sender,
        expires_at: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn unlock_inventory_container(ctx: &ReducerContext, container_id: u64) -> Result<(), String> {
    ensure_owner(ctx, container_id)?;

    if ctx.db.inventory_lock().container_id().find(container_id).is_some() {
        ctx.db.inventory_lock().container_id().delete(container_id);
    }

    Ok(())
}

pub(crate) fn ensure_not_locked(ctx: &ReducerContext, container_id: u64) -> Result<(), String> {
    if ctx.db.inventory_lock().container_id().find(container_id).is_some() {
        return Err("container is locked".to_string());
    }
    Ok(())
}

pub(crate) fn ensure_owner(ctx: &ReducerContext, container_id: u64) -> Result<(), String> {
    let container = ctx
        .db
        .inventory_container()
        .container_id()
        .find(container_id)
        .ok_or("container not found".to_string())?;

    if container.owner_identity != ctx.sender {
        return Err("unauthorized inventory access".to_string());
    }

    Ok(())
}
