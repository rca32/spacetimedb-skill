use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::ensure_slot;
use crate::tables::inventory_slot_trait;

#[spacetimedb::reducer]
pub fn inventory_lock(
    ctx: &ReducerContext,
    container_id: u64,
    slot_index: u32,
    locked: bool,
) -> Result<(), String> {
    let container = crate::reducers::inventory::get_container(ctx, container_id)?;
    let mut slot = ensure_slot(ctx, &container, slot_index)?;
    slot.locked = locked;
    ctx.db.inventory_slot().slot_id().update(slot);
    Ok(())
}
