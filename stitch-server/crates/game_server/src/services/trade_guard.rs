use spacetimedb::ReducerContext;

use crate::tables::{combat_state_trait, transform_state_trait};

const COMBAT_LOCKOUT_MICROS: u64 = 5_000_000;

pub fn ensure_distance(
    ctx: &ReducerContext,
    a_id: u64,
    b_id: u64,
    max_range: f32,
) -> Result<(), String> {
    let a = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&a_id)
        .ok_or("Transform not found".to_string())?;
    let b = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&b_id)
        .ok_or("Transform not found".to_string())?;

    let dx = (a.hex_x - b.hex_x) as f32;
    let dz = (a.hex_z - b.hex_z) as f32;
    let distance = (dx * dx + dz * dz).sqrt();

    if distance > max_range {
        return Err("Out of range".to_string());
    }

    Ok(())
}

pub fn ensure_not_in_combat(ctx: &ReducerContext, entity_id: u64) -> Result<(), String> {
    if let Some(combat) = ctx.db.combat_state().entity_id().find(&entity_id) {
        let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
        if now.saturating_sub(combat.last_attacked_timestamp) < COMBAT_LOCKOUT_MICROS {
            return Err("In combat".to_string());
        }
    }
    Ok(())
}
