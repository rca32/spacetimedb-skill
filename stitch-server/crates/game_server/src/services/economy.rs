use spacetimedb::ReducerContext;

use crate::tables::item_def::item_def;
use crate::tables::item_stack::item_stack;

pub(crate) fn slot_can_accept(
    ctx: &ReducerContext,
    slot_volume: i32,
    item_def_id: u64,
    current_item_instance_id: u64,
    incoming_qty: u32,
) -> Result<bool, String> {
    if slot_volume <= 0 {
        return Ok(true);
    }

    let item_def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(item_def_id)
        .ok_or("item_def not found".to_string())?;

    let current_qty = if current_item_instance_id == 0 {
        0u32
    } else {
        ctx.db
            .item_stack()
            .item_instance_id()
            .find(current_item_instance_id)
            .map(|x| x.quantity)
            .unwrap_or(0)
    };

    let total = current_qty.saturating_add(incoming_qty);
    let used = (item_def.volume as i64) * (total as i64);
    Ok(used <= slot_volume as i64)
}
