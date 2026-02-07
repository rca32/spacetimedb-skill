use spacetimedb::ReducerContext;

use crate::tables::combat::attack_scheduled as attack_scheduled_table;

#[spacetimedb::reducer]
pub fn attack_scheduled(ctx: &ReducerContext, request_key: String) -> Result<(), String> {
    let mut scheduled = ctx
        .db
        .attack_scheduled()
        .request_key()
        .find(request_key)
        .ok_or("scheduled attack not found".to_string())?;

    if scheduled.phase > 1 {
        return Ok(());
    }

    if ctx.sender != scheduled.attacker_identity {
        return Err("only attacker can schedule impact".to_string());
    }

    scheduled.phase = 1;
    scheduled.updated_at = ctx.timestamp;
    ctx.db.attack_scheduled().request_key().update(scheduled);

    Ok(())
}
